/* ============================================================================
   FLOATING 3D HOLOGRAPHIC RIBBON
   ----------------------------------------------------------------------------
   A twisted, infinity-shaped glass ribbon, drawn in WebGL, used as a slow
   animated watermark behind the copy.
   Why hand-written WebGL and not Three.js: this site has no build step and no
   dependencies, and Three.js is ~600KB for one decorative mesh. Everything
   here is about 300 lines and ships as one file.
   The geometry is procedural in the vertex shader. The CPU uploads nothing but
   a strip of (t, side) pairs once; the curve, the twist, the travelling wave
   and the surface normal are all evaluated per-vertex on the GPU. That keeps
   the per-frame cost to a handful of uniforms.
   The curve is a lemniscate — a true figure-eight — lifted into Z so the two
   lobes cross over and under each other the way the reference does.
   Each instance:
     · starts paused, and only builds a GL context once it is near the viewport
     · stops its rAF the moment it scrolls out
     · fades in and out with its own section
     · drifts and rotates slightly against the scroll
     · leans a little toward the pointer on desktop
     · renders one still frame under prefers-reduced-motion
     · falls back to nothing at all if WebGL is missing (the CSS keeps a soft
       gradient underneath, so the space never looks broken)
   ========================================================================= */
(function () {
  'use strict';
  var canvases = Array.prototype.slice.call(document.querySelectorAll('.ribbon'));
  if (!canvases.length) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse  = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  /* ---- the neon palette: electric blue sweeping through violet into hot
     pink and coral, which is the run of colour in the reference ---- */
  var PALETTE = [
    [0.169, 0.239, 1.000],   /* #2B3DFF electric blue  */
    [0.357, 0.231, 1.000],   /* #5B3BFF violet blue    */
    [0.545, 0.169, 0.910],   /* #8B2BE8 violet         */
    [0.878, 0.169, 0.784],   /* #E02BC8 magenta        */
    [1.000, 0.239, 0.498],   /* #FF3D7F hot pink       */
    [1.000, 0.353, 0.302]    /* #FF5A4D coral          */
  ];
  /* the tube reference is magenta-dominant with a cyan rim catching the
     grazing angles, which is a different run of colour from the ribbon */
  var TUBE_PALETTE = [
    [0.000, 0.898, 0.816],   /* #00E5D0 cyan rim      */
    [0.482, 0.169, 0.910],   /* #7B2BE8 violet        */
    [0.722, 0.122, 0.851],   /* #B81FD9 purple magenta*/
    [0.914, 0.063, 0.784],   /* #E910C8 magenta       */
    [1.000, 0.169, 0.816],   /* #FF2BD0 hot magenta   */
    [0.753, 0.251, 1.000]    /* #C040FF bright violet */
  ];

  var VERT = [
    'precision highp float;',
    'attribute vec2 aVert;',          /* x = t along the curve, y = -1|+1 across */
    'uniform float uTime;',
    'uniform float uTwist;',
    'uniform float uWidth;',
    'uniform vec3  uRot;',            /* x,y,z rotation in radians */
    'uniform vec2  uShift;',
    'uniform float uScale;',
    'uniform float uForm;',   /* 0 = flat ribbon, 1 = round tube */
    'uniform float uZAmp;',   /* how far the curve lifts out of its plane */
    'varying vec3  vNormal;',
    'varying vec3  vPos;',
    'varying float vT;',
    '',
    '#define TAU 6.28318530718',
    '',
    /* the figure-eight, lifted into Z */
    'vec3 curve(float t){',
    '  float s = t * TAU;',
    '  float d = 1.0 + sin(s) * sin(s);',
    '  float w = sin(s * 2.0 + uTime * 0.42) * 0.09 * (1.0 - uForm * 0.7);',
    '  return vec3(cos(s) / d, sin(s) * cos(s) / d, uZAmp * sin(2.0 * s) + w);',
    '}',
    '',
    'mat3 rotMat(vec3 r){',
    '  float cx=cos(r.x), sx=sin(r.x), cy=cos(r.y), sy=sin(r.y), cz=cos(r.z), sz=sin(r.z);',
    '  mat3 rx = mat3(1.0,0.0,0.0, 0.0,cx,-sx, 0.0,sx,cx);',
    '  mat3 ry = mat3(cy,0.0,sy, 0.0,1.0,0.0, -sy,0.0,cy);',
    '  mat3 rz = mat3(cz,-sz,0.0, sz,cz,0.0, 0.0,0.0,1.0);',
    '  return rz * ry * rx;',
    '}',
    '',
    'void main(){',
    '  float t = aVert.x;',
    '  float e = 0.0016;',
    '  vec3 P  = curve(t);',
    '  vec3 T  = normalize(curve(t + e) - curve(t - e));',
    '  vec3 up = vec3(0.0, 0.0, 1.0);',
    '  vec3 N  = normalize(cross(T, up));',
    '  vec3 B  = normalize(cross(T, N));',
    /* the cross-section rolls as it travels, which is what makes it a ribbon
       rather than a tube */
    '  float tw = t * TAU * uTwist + uTime * 0.16;',
    /* the ribbon offsets along one flat axis; the tube sweeps a full ring, so
       aVert.y is read as a side (-1,+1) in one case and an angle in the other */
    '  vec3 flatD = normalize(N * cos(tw) + B * sin(tw));',
    '  float ang  = aVert.y + tw;',
    '  vec3 ringD = normalize(N * cos(ang) + B * sin(ang));',
    '  vec3 pos  = P + mix(flatD * (aVert.y * uWidth), ringD * uWidth, uForm);',
    '',
    '  mat3 R = rotMat(uRot);',
    '  pos = R * pos;',
    '  vec3 nrm = normalize(R * normalize(mix(cross(T, flatD), ringD, uForm)));',
    '',
    '  pos *= uScale;',
    '  pos.xy += uShift;',
    '',
    '  vNormal = nrm;',
    '  vPos    = pos;',
    '  vT      = t;',
    /* A real perspective divide with a camera at z = 3.2, and a depth value
       written to gl_Position.z so the depth buffer can occlude. This is what
       makes the loops pass in front of and behind each other instead of
       dissolving through one another. */
    '  float pz = 3.2 - pos.z;',
    '  gl_Position = vec4(pos.xy * 1.45, -pos.z * 0.6, pz * 0.62);',
    '}'
  ].join('\n');
  var FRAG = [
    'precision highp float;',
    'uniform vec3  uPal[6];',
    'uniform float uTime;',
    'uniform float uAlpha;',
    'uniform float uGlow;',   /* 1 = emissive on dark, 0 = tinted glass on light */
    'varying vec3  vNormal;',
    'varying vec3  vPos;',
    'varying float vT;',
    '',
    /* six-stop ramp through the brand palette */
    'vec3 ramp(float x){',
    '  x = clamp(x, 0.0, 1.0) * 5.0;',
    '  float i = floor(x);',
    '  float f = smoothstep(0.0, 1.0, fract(x));',
    '  vec3 a = uPal[0]; vec3 b = uPal[1];',
    '  if (i < 0.5)      { a = uPal[0]; b = uPal[1]; }',
    '  else if (i < 1.5) { a = uPal[1]; b = uPal[2]; }',
    '  else if (i < 2.5) { a = uPal[2]; b = uPal[3]; }',
    '  else if (i < 3.5) { a = uPal[3]; b = uPal[4]; }',
    '  else              { a = uPal[4]; b = uPal[5]; }',
    '  return mix(a, b, f);',
    '}',
    '',
    'void main(){',
    '  vec3 V = normalize(vec3(0.0, 0.0, 1.0) - vPos * 0.35);',
    '  vec3 N = normalize(vNormal);',
    '  float facing = abs(dot(N, V));',
    /* thin-film style shift: the hue turns with the viewing angle, so colour
       moves across the surface as the ribbon rotates */
    '  float band = facing * 0.55 + vT * 1.25 + uTime * 0.045 + vPos.z * 0.3;',
    '  vec3 col = ramp(fract(band));',
    '',
    '  float fres = pow(1.0 - facing, 2.4);',
    '  col = mix(col, uPal[5], fres * mix(0.22, 0.45, uGlow));',
    '  col += vec3(0.30, 0.16, 0.42) * fres * 1.25 * uGlow;',   /* rim bloom, glow only */
    '',
    '  vec3 L = normalize(vec3(-0.4, 0.7, 0.8));',
    /* Lambert term: without it there is no form shading and the whole thing
       reads as a flat decal however good the colour is */
    '  float diff = max(dot(N, L), 0.0);',
    '  col *= 0.50 + 0.70 * diff;',
    '  vec3 L2 = normalize(vec3(0.6, -0.4, 0.5));',
    '  col += ramp(fract(band + 0.4)) * max(dot(N, L2), 0.0) * 0.28;',
    '  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 36.0);',
    '  col += vec3(1.0, 0.86, 1.0) * spec * mix(0.35, 0.9, uGlow);',
    '',
    /* edges bloom and the flat of the ribbon stays deeper. In glow mode that
       reads as light being added; in glass mode, as a thicker tint at the
       turn of the ribbon, which is how real silk catches a room. */
    '  float a = uAlpha * (0.50 + 0.90 * fres) * (0.45 + 0.55 * facing);',
    /* Glass mode does NOT dim the colour - dimming is what made it read as a
       grey smear on the pink cards. It SATURATES instead, so the electric
       blue and the magenta in the reference still carry against a light
       ground, while normal alpha blending keeps it from blowing out.      */
    '  float lv = dot(col, vec3(0.299, 0.587, 0.114));',
    '  vec3 sat = clamp(mix(vec3(lv), col, 1.5), 0.0, 1.0);',
    '  col = mix(sat, col * 1.35, uGlow);',
    '  gl_FragColor = vec4(col * a, a);',          /* premultiplied */
    '}'
  ].join('\n');
  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }
  function Ribbon(canvas) {
    this.canvas  = canvas;
    this.host    = canvas.closest('section') || canvas.parentElement;
    this.alpha   = parseFloat(canvas.dataset.alpha || '0.3');
    this.twist   = parseFloat(canvas.dataset.twist || '1.0');
    this.scale   = parseFloat(canvas.dataset.scale || '1.0');
    this.speed   = parseFloat(canvas.dataset.speed || '1.0');
    this.glow    = (canvas.dataset.mode || 'glow') === 'glow';
    this.tube    = (canvas.dataset.form || 'ribbon') === 'tube';
    this.segs    = coarse ? 220 : 460;
    this.ready   = false;
    this.dead    = false;
    this.running = false;
    this.raf     = 0;
    this.t0      = 0;
    this.scroll  = 0;   /* -1 .. 1, where the host sits in the viewport */
    this.fade    = 0;
    this.px = 0; this.py = 0;   /* pointer lean, smoothed */
  }
  Ribbon.prototype.init = function () {
    if (this.ready || this.dead) return;
    var gl;
    try {
      gl = this.canvas.getContext('webgl', {
        alpha: true, antialias: !coarse, depth: false,
        premultipliedAlpha: true, powerPreference: 'low-power'
      });
    } catch (e) { gl = null; }
    if (!gl) { this.dead = true; return; }
    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { this.dead = true; return; }
    var p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { this.dead = true; return; }
    gl.useProgram(p);
    /* Geometry. The ribbon is one triangle strip of two vertices per step.
       The tube is a grid: a ring of K points at each step, stitched with an
       index buffer. aVert.y means "which side" for the ribbon and "where
       around the ring" for the tube; the vertex shader reads it both ways. */
    var n = this.segs, data, i, j, t;
    if (this.tube) {
      var K = coarse ? 8 : 12, TAU = Math.PI * 2;
      data = new Float32Array((n + 1) * K * 2);
      for (i = 0; i <= n; i++) {
        t = i / n;
        for (j = 0; j < K; j++) {
          var o = (i * K + j) * 2;
          data[o] = t; data[o + 1] = (j / K) * TAU;
        }
      }
      var idx = new Uint16Array(n * K * 6), q = 0;
      for (i = 0; i < n; i++) {
        for (j = 0; j < K; j++) {
          var a0 = i * K + j, a1 = i * K + (j + 1) % K;
          var b0 = a0 + K,    b1 = a1 + K;
          idx[q++] = a0; idx[q++] = b0; idx[q++] = a1;
          idx[q++] = a1; idx[q++] = b0; idx[q++] = b1;
        }
      }
      var ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      this.count = idx.length;
    } else {
      data = new Float32Array((n + 1) * 4);
      for (i = 0; i <= n; i++) {
        t = i / n;
        data[i * 4 + 0] = t; data[i * 4 + 1] = -1;
        data[i * 4 + 2] = t; data[i * 4 + 3] =  1;
      }
      this.count = (n + 1) * 2;
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(p, 'aVert');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    /* additive: the ribbon is emissive, so it adds light to the dark card
       underneath instead of covering it. This is what makes it read as neon
       rather than as a translucent decal. */
    if (this.glow) gl.blendFunc(gl.ONE, gl.ONE);                 /* emissive  */
    else           gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); /* glass     */
    /* Depth test OFF, deliberately. This geometry is translucent glass and is
       drawn additively: with depth writes on, the near side of a loop writes
       depth and discards the far side behind it, which blanks most of the
       ribbon and is backwards for glass anyway - in both references you can
       see the far side through the near one. The 3D read comes from the
       perspective divide and the diffuse/specular shading instead. */
    gl.disable(gl.DEPTH_TEST);

    var src = this.tube ? TUBE_PALETTE : PALETTE;
    var pal = new Float32Array(18);
    for (var k = 0; k < 6; k++) {
      pal[k * 3] = src[k][0]; pal[k * 3 + 1] = src[k][1]; pal[k * 3 + 2] = src[k][2];
    }
    gl.uniform3fv(gl.getUniformLocation(p, 'uPal'), pal);
    gl.uniform1f(gl.getUniformLocation(p, 'uForm'), this.tube ? 1.0 : 0.0);
    /* the tube reads best almost flat-on, the way the reference is lit; the
       ribbon needs the lift so its lobes cross over and under each other */
    gl.uniform1f(gl.getUniformLocation(p, 'uZAmp'), this.tube ? 0.13 : 0.42);
    this.gl = gl;
    this.u = {
      time:  gl.getUniformLocation(p, 'uTime'),
      twist: gl.getUniformLocation(p, 'uTwist'),
      width: gl.getUniformLocation(p, 'uWidth'),
      rot:   gl.getUniformLocation(p, 'uRot'),
      shift: gl.getUniformLocation(p, 'uShift'),
      scale: gl.getUniformLocation(p, 'uScale'),
      alpha: gl.getUniformLocation(p, 'uAlpha'),
      glow:  gl.getUniformLocation(p, 'uGlow'),
      form:  gl.getUniformLocation(p, 'uForm'),
      zamp:  gl.getUniformLocation(p, 'uZAmp')
    };

    this.ready = true;
    this.resize();
  };
  Ribbon.prototype.resize = function () {
    if (!this.ready) return;
    var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    var r = this.canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width  * dpr));
    var h = Math.max(1, Math.round(r.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  };
  Ribbon.prototype.draw = function (ms) {
    if (!this.ready) return;
    var gl = this.gl;
    /* Slowed to roughly half the previous rate. A full turn on the Y axis now
       takes about 95 seconds and the two rocking axes are slower still, so
       at any moment the movement is barely perceptible - it reads as drift
       rather than rotation, which is what "slow motion" wants. */
    var t = (ms / 1000) * this.speed;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(this.u.time,  t);
    gl.uniform1f(this.u.twist, this.twist);
    gl.uniform1f(this.u.width, this.tube ? 0.085 : 0.17);
    gl.uniform1f(this.u.scale, this.scale);
    gl.uniform1f(this.u.alpha, this.alpha * this.fade);
    gl.uniform1f(this.u.glow,  this.glow ? 1.0 : 0.0);
    gl.uniform3f(this.u.rot,
      Math.sin(t * 0.0412) * 0.42 + this.py + this.scroll * 0.42,
      t * 0.0662 + this.px + this.scroll * 0.30,
      Math.sin(t * 0.0307) * 0.20 + this.scroll * 0.12);
    /* drifts vertically against the page as the section passes */
    /* and it flows with the page: the scroll position feeds all three axes
       above and lifts the whole form, so scrolling turns it rather than just
       sliding it past */
    gl.uniform2f(this.u.shift, this.scroll * 0.05, this.scroll * -0.26);
    if (this.tube) gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    else           gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
  };
  /* ---------------------------------------------------------------------- */
  var live = [];
  var pointerX = 0, pointerY = 0;
  function measure() {
    for (var i = 0; i < canvases.length; i++) {
      var r = all[i];
      if (!r.host) continue;
      var b = r.host.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      /* centre of the host relative to the centre of the viewport, -1 .. 1 */
      var c = ((b.top + b.height / 2) - vh / 2) / vh;
      r.scroll = Math.max(-1.6, Math.min(1.6, c));
      /* fade in as it arrives, out as it leaves */
      var vis = Math.min(b.bottom, vh) - Math.max(b.top, 0);
      var f = vis / Math.min(b.height || 1, vh);
      r.fade = Math.max(0, Math.min(1, f * 1.4));
    }
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { measure(); ticking = false; });
  }
  function frame(ms) {
    for (var i = 0; i < live.length; i++) live[i].draw(ms);
    if (live.length) rafId = requestAnimationFrame(frame);
    else rafId = 0;
  }
  var rafId = 0;
  function start() { if (!rafId && live.length) rafId = requestAnimationFrame(frame); }
  var all = canvases.map(function (c) { return new Ribbon(c); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var r = null;
      for (var i = 0; i < all.length; i++) if (all[i].canvas === en.target) { r = all[i]; break; }
      if (!r) return;
      if (en.isIntersecting) {
        r.init();
        if (r.dead) { io.unobserve(en.target); return; }
        r.resize();
        if (live.indexOf(r) === -1) live.push(r);
        measure();
        if (reduced) { r.fade = 1; r.draw(0); }   /* one still frame, no loop */
        else start();
      } else {
        var k = live.indexOf(r);
        if (k !== -1) live.splice(k, 1);
      }
    });
  }, { rootMargin: '240px 0px' });
  all.forEach(function (r) { io.observe(r.canvas); });
  if (!reduced) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      all.forEach(function (r) { r.resize(); });
      measure();
    }, { passive: true });
    /* a little lean toward the pointer, desktop only, heavily smoothed */
    if (!coarse) {
      window.addEventListener('pointermove', function (e) {
        pointerX = (e.clientX / window.innerWidth  - 0.5) * 0.3;
        pointerY = (e.clientY / window.innerHeight - 0.5) * 0.22;
      }, { passive: true });
      setInterval(function () {
        for (var i = 0; i < live.length; i++) {
          live[i].px += (pointerX - live[i].px) * 0.06;
          live[i].py += (pointerY - live[i].py) * 0.06;
        }
      }, 33);
    }
  }
})();

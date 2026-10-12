/* ============================================================
   AVANTI-EVENTICA — interactions
   ============================================================ */
(() => {
'use strict';

/* ------------------------------------------------------------------
   ⚙  CONFIG — fill these in and the site wires itself up.
   Leave a value as "" and that row simply doesn't render.
------------------------------------------------------------------ */
const CONFIG = {
  email:     'avantischoolofperformingarts@gmail.com',
  phone:     '+91 98182 59666',
  whatsapp:  '919818259666',           // digits only, with country code
  city:      'Delhi NCR, India',
  instagram: 'https://www.instagram.com/avanti_eventica/',
  igHandle:  '@avanti_eventica',
  youtube:   'https://www.youtube.com/@AvantiEventica',
  ytHandle:  '@AvantiEventica'
};

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine    = matchMedia('(pointer: fine)').matches;
const clamp   = (v, a, b) => Math.min(b, Math.max(a, v));

/* ==================================================================
   1 · SCROLL REVEALS
================================================================== */
function reveals(){
  const items = $$('.reveal');
  if (reduced || !('IntersectionObserver' in window)){
    items.forEach(n => n.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -11% 0px', threshold: .12 });
  items.forEach(n => io.observe(n));
}

/* ==================================================================
   1b · SOUND GATE

   Browsers refuse to start a clip with its sound on until the visitor has
   interacted with the page — a clip that tries is simply blocked. So clips
   start muted and this flips them on at the first click, tap or key press
   anywhere on the page, which is the moment the browser starts allowing it.
================================================================== */
const SOUND = (() => {
  let allowed = false;
  const waiting = [];
  const allow = () => {
    if (allowed) return;
    allowed = true;
    waiting.splice(0).forEach(fn => { try { fn(); } catch(e){} });
  };
  ['pointerdown','touchstart','keydown','click'].forEach(evt =>
    addEventListener(evt, allow, { once:true, passive:true, capture:true }));
  return {
    get allowed(){ return allowed; },
    onAllow(fn){ allowed ? fn() : waiting.push(fn); }
  };
})();

/* ==================================================================
   2 · CAROUSELS — the hero, and the Shakti-Naad gallery

   One builder, two instances. Both work the same way: the frame takes the
   shape of whatever is on show, slides ride in left → right, and the markers
   fill in step with the dwell.

   A slide may hold a photograph or a clip. A photograph holds for the
   carousel's own `dur`; a clip holds for its own length, declared on the
   slide as data-dur so the marker fills in time with it.
================================================================== */
function carousel(cfg){
  const stage  = $(cfg.stage);
  if (!stage) return;
  const slides = $$('.slide', stage);
  if (slides.length < 2) return;

  const dotsEl = $(cfg.dots);
  const capEl  = $(cfg.caption);
  const DUR    = cfg.dur;
  let idx = 0, timer = null, parked = false;
  // whether clips in THIS carousel should be audible; see the gesture hook below
  let wantSound = cfg.sound === true && SOUND.allowed;

  const hold = (n) => +slides[n].dataset.dur || DUR;

  // Size the frame to whatever is on show. The box is the largest that fits
  // both the column width and a sensible height, at that item's own
  // proportions — so it fills the frame exactly: never cropped, never padded.
  const frame = $(cfg.frame);
  const fitFrame = (slide) => {
    if (!frame) return;
    const m = slide.querySelector('.slide__img, .slide__v');
    if (!m) return;
    const w = +m.getAttribute('width')  || m.naturalWidth  || m.videoWidth  || 3;
    const h = +m.getAttribute('height') || m.naturalHeight || m.videoHeight || 2;
    const ar = w / h;

    const maxW = frame.parentElement.clientWidth;
    const maxH = cfg.maxH();
    // Before first layout — or in a tab that has never been shown — both of
    // these read 0. Leave the CSS fallback shape in place and come back when
    // there is something real to measure, rather than collapsing the frame.
    if (maxW < 1 || maxH < 1) return;

    const boxW = Math.round(Math.min(maxW, maxH * ar));
    const boxH = Math.round(boxW / ar);

    frame.classList.add('is-sized');
    frame.style.width  = boxW + 'px';
    frame.style.height = boxH + 'px';
  };

  // Get the next slide ready during the current dwell — decode its image, or
  // start buffering its clip — so it paints the instant it starts moving.
  const warm = (n) => {
    const slide = slides[(n + slides.length) % slides.length];
    slide.querySelectorAll('img').forEach(img => {
      if (img.loading === 'lazy') img.loading = 'eager';
      if (img.decode) img.decode().catch(()=>{});
    });
    // Clips sit at preload="none" until the slide before them comes up, so
    // nothing downloads on page load but the next one is buffered in time.
    const v = slide.querySelector('video');
    if (v && !v.src && v.dataset.src){ v.preload = 'auto'; v.src = v.dataset.src; }
  };

  // Sound. A browser will not let a clip start on its own with the sound on
  // until the visitor has interacted with the page, so a clip always starts
  // muted and turns its sound on the moment that becomes allowed — the first
  // click, tap or key press anywhere. The ♪ button turns it off again.
  const soundBtn = (n) => slides[n].querySelector('.slide__sound');
  const markBtn = (btn, on) => {
    if (!btn) return;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-label', on ? 'Mute' : 'Unmute');
  };

  const applySound = (v, n) => {
    if (wantSound){
      // one audible clip at a time, anywhere on the page
      $$('video').forEach(o => { if (o !== v) o.muted = true; });
    }
    v.muted = !wantSound;
    // if the browser refuses an audible start, fall back rather than lose the clip
    v.play().catch(() => { v.muted = true; markBtn(soundBtn(n), false); v.play().catch(()=>{}); });
    markBtn(soundBtn(n), wantSound);
  };

  // Only the slide on show plays; the rest are paused, muted and rewound, so a
  // clip always starts from the top when its turn comes round again.
  const playSlide = (n) => {
    slides.forEach((s, i) => {
      const v = s.querySelector('video');
      if (!v) return;
      if (i === n && !parked){
        if (!v.src && v.dataset.src){ v.preload = 'auto'; v.src = v.dataset.src; }
        // play() starts the fetch itself; waiting on loadedmetadata first would
        // deadlock, because at preload="none" nothing has asked for the file yet
        if (v.readyState >= 1){ try { v.currentTime = 0; } catch(e){} }
        applySound(v, i);
      } else {
        v.pause();
        v.muted = true;
        markBtn(soundBtn(i), false);
      }
    });
  };

  const setCaption = (n) => {
    if (!capEl) return;
    const text = slides[n].dataset.caption || '';
    if (capEl.textContent === text) return;
    capEl.classList.add('is-swapping');
    setTimeout(() => { capEl.textContent = text; capEl.classList.remove('is-swapping'); }, reduced ? 0 : 260);
  };

  slides.forEach((s, i) => {
    s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    if (!dotsEl) return;
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' is-active' : '');
    d.style.setProperty('--dur', hold(i) + 'ms');
    d.innerHTML = '<i></i>';
    d.type = 'button';
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', 'Slide ' + (i + 1) + ' of ' + slides.length);
    d.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    d.addEventListener('click', () => go(i));
    dotsEl.appendChild(d);
  });
  const dots = dotsEl ? $$('.dot', dotsEl) : [];

  function go(n){
    const next = (n + slides.length) % slides.length;   // wraps past the last
    if (next === idx) return;

    const prev = slides[idx];
    prev.classList.remove('is-active');
    prev.classList.add('is-under');       // holds the frame until it is covered
    prev.setAttribute('aria-hidden', 'true');
    idx = next;

    const cur = slides[idx];
    fitFrame(cur);                        // reshape before it rides in
    cur.classList.add('is-active');
    cur.setAttribute('aria-hidden', 'false');

    // Once the incoming slide has fully covered it, park the old one back on
    // the left — transition off, or it would sweep back across the frame.
    clearTimeout(prev._park);
    prev._park = setTimeout(() => {
      prev.style.transition = 'none';
      prev.classList.remove('is-under');
      void prev.offsetWidth;
      prev.style.transition = '';
    }, Math.min(900, hold(idx) - 80));

    warm(idx + 1);
    playSlide(idx);

    dots.forEach((d, i) => {
      d.classList.remove('is-active');
      d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      if (i === idx){ void d.offsetWidth; d.classList.add('is-active'); }
    });

    setCaption(idx);
    restart();
  }

  function restart(){
    clearTimeout(timer);
    if (reduced || parked) return;
    timer = setTimeout(() => go(idx + 1), hold(idx));
  }
  function stop(){ clearTimeout(timer); }

  $(cfg.prev)?.addEventListener('click', () => go(idx - 1));
  $(cfg.next)?.addEventListener('click', () => go(idx + 1));

  // arrow keys when the section has focus
  $(cfg.keys)?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { go(idx - 1); }
    if (e.key === 'ArrowRight') { go(idx + 1); }
  });

  // swipe on touch
  let x0 = null;
  stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive:true });
  stage.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) go(dx < 0 ? idx + 1 : idx - 1);
    x0 = null;
  }, { passive:true });

  // the button turns this carousel's sound off and on by hand
  $$('.slide__sound', stage).forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      const v = btn.parentElement.querySelector('video');
      if (!v) return;
      wantSound = !wantSound;
      applySound(v, idx);   // which also silences every other clip on the page
    });
  });

  // when the page becomes allowed to play sound, bring this clip up with it
  if (cfg.sound === true){
    SOUND.onAllow(() => {
      wantSound = true;
      const v = slides[idx].querySelector('video');
      if (v && !parked && !v.paused) applySound(v, idx);
    });
  }

  if (capEl) capEl.textContent = slides[0].dataset.caption || '';
  fitFrame(slides[0]);
  warm(1);

  playSlide(0);
  restart();

  // Nothing runs while the carousel is off screen — no timer, no clip
  // decoding — and it picks up where it left off on the way back. It only
  // ever pauses something already running, so a browser that throttles the
  // observer can never leave the carousel stopped.
  if ('IntersectionObserver' in window){
    new IntersectionObserver(([e]) => {
      parked = !e.isIntersecting;
      if (parked){ stop(); slides.forEach(s => { const v = s.querySelector('video'); if (v) v.pause(); }); }
      else { playSlide(idx); restart(); }
    }, { rootMargin:'200px', threshold:.01 }).observe(stage);
  }

  let fitT;
  addEventListener('resize', () => {
    clearTimeout(fitT);
    fitT = setTimeout(() => fitFrame(slides[idx]), 120);
  }, { passive:true });
  // a second measure once fonts and images have settled, in case the first
  // one ran before the column had a width
  addEventListener('load', () => fitFrame(slides[idx]));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else restart();
  });
}

function carousels(){
  // the hero — each photo holds for 5s
  carousel({
    stage:'#heroMedia', frame:'.hero__frame', dots:'#heroDots', caption:'#heroCaption',
    prev:'#heroPrev', next:'#heroNext', keys:'#home',
    dur:5000, maxH:() => Math.min(innerHeight * 0.62, 520)
  });

  // Shakti-Naad — photos hold for 3s; the two clips hold for their own 15s,
  // which each of those slides declares in data-dur
  carousel({
    stage:'#snMedia', frame:'.sn-slider__frame', dots:'#snDots', caption:'#snCaption',
    prev:'#snPrev', next:'#snNext', keys:'#shakti-naad',
    dur:3000, maxH:() => Math.min(innerHeight * 0.68, 580),
    sound:true          // the clips play with their sound on
  });
}

/* ==================================================================
   3 · NAV — stuck state, mobile menu, active section
================================================================== */
function nav(){
  const bar    = $('#nav');
  const burger = $('#burger');
  const links  = $('#navLinks');
  const anchors = $$('#navLinks > a');

  anchors.forEach((a, i) => a.style.setProperty('--i', i));

  const onScroll = () => bar.classList.toggle('is-stuck', scrollY > 40);
  onScroll();
  addEventListener('scroll', onScroll, { passive:true });

  const close = () => {
    links.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded','false');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  };
  burger.addEventListener('click', () => {
    const open = !links.classList.contains('is-open');
    links.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  anchors.forEach(a => a.addEventListener('click', close));
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // highlight the section currently in view
  const map = new Map();
  anchors.forEach(a => {
    const id = a.getAttribute('href');
    if (id && id.startsWith('#') && id.length > 1){
      const sec = document.querySelector(id);
      if (sec) map.set(sec, a);
    }
    // One label can stand for more than one section — "Bands" covers
    // Shakti-Naad, Shradha Suman, Jjhoom and Dastak — so it lights up for any
    // of them. data-also takes a comma-separated list.
    const also = a.getAttribute('data-also');
    if (also){
      document.querySelectorAll(also).forEach(extra => map.set(extra, a));
    }
  });
  if ('IntersectionObserver' in window && map.size){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const a = map.get(e.target);
        if (!a) return;
        if (e.isIntersecting){
          anchors.forEach(x => x.classList.remove('is-current'));
          a.classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, sec) => io.observe(sec));
  }
}

/* ==================================================================
   4 · PARALLAX WATERMARKS
================================================================== */
function parallax(){
  if (reduced) return;
  const nodes = $$('[data-parallax]');
  if (!nodes.length) return;
  let y = scrollY, tick = false;

  const run = () => {
    nodes.forEach(n => {
      const k = parseFloat(n.dataset.parallax) || 0;
      n.style.transform = `translate3d(0, ${(y * k).toFixed(2)}px, 0)`;
    });
    tick = false;
  };
  addEventListener('scroll', () => {
    y = scrollY;
    if (!tick){ tick = true; requestAnimationFrame(run); }
  }, { passive:true });
  run();
}

/* ==================================================================
   5 · PARTICLES — slow gold motes over the hero
================================================================== */
function particles(){
  const cv = $('#particles');
  if (!cv || reduced) return;
  const ctx = cv.getContext('2d');
  let w = 0, h = 0, dpr = 1, dots = [], raf = null;

  function size(){
    const r = cv.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = clamp(Math.round(w * h / 22000), 18, 70);
    dots = Array.from({ length:n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.7 + .5,
      vy: -(Math.random() * .22 + .06),
      vx: (Math.random() - .5) * .14,
      a: Math.random() * .5 + .15,
      p: Math.random() * Math.PI * 2
    }));
  }

  function frame(){
    ctx.clearRect(0, 0, w, h);
    dots.forEach(d => {
      d.y += d.vy; d.x += d.vx; d.p += .016;
      if (d.y < -12){ d.y = h + 12; d.x = Math.random() * w; }
      if (d.x < -12) d.x = w + 12;
      if (d.x > w + 12) d.x = -12;
      const a = d.a * (.55 + .45 * Math.sin(d.p));
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 5);
      g.addColorStop(0, `rgba(255,228,170,${a})`);
      g.addColorStop(1, 'rgba(255,228,170,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 5, 0, Math.PI * 2); ctx.fill();
    });
    raf = requestAnimationFrame(frame);
  }

  size(); frame();
  addEventListener('resize', size);

  // stop painting once the hero has scrolled away
  if ('IntersectionObserver' in window){
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !raf) frame();
      else if (!e.isIntersecting && raf){ cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0 }).observe(cv);
  }
}

/* ==================================================================
   6 · WAVEFORM — behind Shakti-Naad
================================================================== */
function waveform(){
  const cv = $('#wave');
  if (!cv || reduced) return;
  const ctx = cv.getContext('2d');
  let w = 0, h = 0, dpr = 1, t = 0, raf = null, bars = [];

  function size(){
    const r = cv.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = w < 680 ? 7 : 11;
    const n = Math.floor(w / gap);
    bars = Array.from({ length:n }, (_, i) => ({
      x: i * gap + gap / 2,
      s: Math.random() * .8 + .35,
      o: Math.random() * Math.PI * 2
    }));
  }

  function frame(){
    ctx.clearRect(0, 0, w, h);
    const mid = h / 2;
    bars.forEach((b, i) => {
      const env = Math.sin((i / bars.length) * Math.PI);           // fade at both ends
      const amp = (Math.sin(t * .9 + b.o) * .5 + .5) * b.s * env;
      const bh  = amp * h * .42 + 2;
      const g = ctx.createLinearGradient(0, mid - bh, 0, mid + bh);
      g.addColorStop(0,   'rgba(240,24,110,0)');
      g.addColorStop(.5,  `rgba(255,184,46,${.34 + amp * .56})`);
      g.addColorStop(1,   'rgba(122,43,201,0)');
      ctx.fillStyle = g;
      ctx.fillRect(b.x - 1.4, mid - bh, 2.8, bh * 2);
    });
    t += .018;
    raf = requestAnimationFrame(frame);
  }

  size();
  addEventListener('resize', size);
  if ('IntersectionObserver' in window){
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !raf) frame();
      else if (!e.isIntersecting && raf){ cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0 }).observe(cv);
  } else frame();
}

/* ==================================================================
   7 · TIMELINE — draw the connecting line
================================================================== */
function timeline(){
  const line = $('#flowLine');
  if (!line) return;
  if (!('IntersectionObserver' in window) || reduced){ line.classList.add('is-drawn'); return; }
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting){ line.classList.add('is-drawn'); io.disconnect(); }
  }, { threshold: .3 });
  io.observe(line);
}

/* ==================================================================
   8 · MAGNETIC BUTTONS
================================================================== */
function magnetic(){
  if (!fine || reduced) return;
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .22;
      const y = (e.clientY - r.top - r.height / 2) * .32;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ==================================================================
   9 · THE SHOWREELS

   The gallery is five plain <video controls> elements — no custom player to
   maintain. Two behaviours are worth adding on top: only one clip plays at a
   time, and a clip pauses itself when you scroll away from it, so nothing
   keeps playing out of sight.
================================================================== */
function reels(){
  const vids = $$('#reelsGrid .reel__v');
  if (!vids.length) return;

  // starting one stops the others
  vids.forEach(v => v.addEventListener('play', () => {
    vids.forEach(o => { if (o !== v && !o.paused) o.pause(); });
  }));

  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (!e.isIntersecting && !e.target.paused) e.target.pause(); });
  }, { threshold: 0 });
  vids.forEach(v => io.observe(v));
}
/* ==================================================================
   10 · CONTACT RAIL + BOOKING FORM
================================================================== */
function contact(){
  const rail = $('#contactRail');
  if (rail){
    const rows = [];
    if (CONFIG.phone)  rows.push(['Phone', `<a href="tel:${CONFIG.phone.replace(/[^+\d]/g,'')}">${CONFIG.phone}</a>`]);
    if (CONFIG.email)  rows.push(['Email', `<a href="mailto:${CONFIG.email}">${CONFIG.email}</a>`]);
    if (CONFIG.city)   rows.push(['Based in', `<span>${CONFIG.city}</span>`]);
    if (CONFIG.instagram) rows.push(['Instagram', `<a href="${CONFIG.instagram}" target="_blank" rel="noopener">${CONFIG.igHandle}</a>`]);
    if (CONFIG.youtube)   rows.push(['YouTube',   `<a href="${CONFIG.youtube}" target="_blank" rel="noopener">${CONFIG.ytHandle}</a>`]);
    rail.innerHTML = rows.map(([k, v]) => `<li><b>${k}</b>${v}</li>`).join('');
  }

  const talk = $('#talkBtn');
  if (talk){
    if (CONFIG.whatsapp)   talk.href = `https://wa.me/${CONFIG.whatsapp}`;
    else if (CONFIG.phone) talk.href = `tel:${CONFIG.phone.replace(/[^+\d]/g,'')}`;
    else if (CONFIG.email) talk.href = `mailto:${CONFIG.email}`;
    if (CONFIG.whatsapp || CONFIG.phone || CONFIG.email) talk.removeAttribute('target');
  }

  const form = $('#bookingForm');
  const note = $('#bookingNote');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());

    if (!d.name || !d.phone || !d.email || !d.eventType){
      note.textContent = 'Please fill in your name, phone, email and event type.';
      note.className = 'booking__note is-err';
      return;
    }

    const lines = [
      `Name: ${d.name}`,
      `Phone: ${d.phone}`,
      `Email: ${d.email}`,
      `Event type: ${d.eventType}`,
      d.date     ? `Date: ${d.date}`         : null,
      d.location ? `Location: ${d.location}` : null,
      '',
      d.message || ''
    ].filter(v => v !== null).join('\n');

    const subject = `Booking enquiry — ${d.eventType}${d.date ? ' · ' + d.date : ''}`;
    const mailHref = CONFIG.email
      ? `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`
      : '';
    const alt = mailHref
      ? ` <a href="${mailHref}" class="booking__alt">or send it by email instead</a>`
      : '';

    // There is no server behind this form — it hands the enquiry to an app the
    // visitor already has, so nothing is ever silently reported as "sent".
    if (CONFIG.whatsapp){
      open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(subject + '\n\n' + lines)}`, '_blank', 'noopener');
      note.innerHTML = 'Opening WhatsApp with your enquiry…' + alt;
      note.className = 'booking__note is-ok';
    } else if (mailHref){
      location.href = mailHref;
      note.textContent = 'Opening your email app with the enquiry…';
      note.className = 'booking__note is-ok';
    } else {
      // Nothing configured — don't pretend the message went anywhere.
      navigator.clipboard?.writeText(subject + '\n\n' + lines).catch(()=>{});
      note.innerHTML = `Enquiry copied to your clipboard — send it to us on
        <a href="${CONFIG.instagram}" target="_blank" rel="noopener" class="booking__alt">${CONFIG.igHandle}</a>.`;
      note.className = 'booking__note is-ok';
    }
  });
}

/* ==================================================================
   11 · MISC
================================================================== */
function misc(){
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  // keep the hero watermark layer tall enough to cover the page
  const wm = $('.watermarks');
  if (wm) wm.style.height = document.body.scrollHeight + 'px';
}

/* ---------- boot ---------- */
function boot(){
  reveals();
  nav();
  carousels();
  parallax();
  particles();
  waveform();
  timeline();
  magnetic();
  reels();
  contact();
  misc();
  addEventListener('load', misc);
  addEventListener('resize', misc, { passive:true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();

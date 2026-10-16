# Avanti-Eventica

*Where Every Celebration Becomes a Performance*

A single-page site for Avanti-Eventica — event choreography, themed performances,
cultural celebrations, and live music through the band **Shakti-Naad**.

No build step, no dependencies, no framework. Plain HTML, CSS and JavaScript.

---

## Run it locally

The site must be served over `http://`, not opened as a `file://` page — browsers
block the video range-requests that make the clips seek and stream.

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open **http://localhost:8787/**. `Ctrl+C` stops it.
Use a different port with `-Port 8080`.

(If you have Node or Python instead: `npx serve` or `python -m http.server 8787`.)

---

## Before it goes live — 2 things

### 1. Your contact details

These are already filled in, at the top of `assets/js/main.js`:

```js
const CONFIG = {
  email:     'avantischoolofperformingarts@gmail.com',
  phone:     '+91 98182 59666',
  whatsapp:  '919818259666',   // digits + country code, no +
  city:      'Delhi NCR, India',
  instagram: 'https://www.instagram.com/avanti_eventica/',
  igHandle:  '@avanti_eventica',
  youtube:   'https://www.youtube.com/@AvantiEventica',
  ytHandle:  '@AvantiEventica'
};
```

This one block drives the contact list, the Talk to Our Team button and the
booking form, so changing a number here changes it everywhere. Any row left
empty simply doesn't appear.

**How the booking form sends:** there is no server, so it hands the enquiry to
an app the visitor already has, pre-filled. Right now **Send Enquiry opens
WhatsApp**, with an "or send it by email instead" link beside it for anyone who
would rather use mail. Nothing is ever silently reported as sent.

To make email the primary route instead, clear `whatsapp: ''` — the form falls
through to the mail app, and the phone number stays on the page regardless.

### 2. The hero slider

**Every photograph in the hero is your own.** No stock, nothing licensed, nothing
to credit or replace. Ten slides in four labelled blocks, each playing as an
uninterrupted run:

| Caption | Slides | Files |
|---|---|---|
| **Bhajan Sandhya** | 6 | `05` `06` `07` `08` `01` `09` |
| **Shakti-Naad** | 1 | `02` |
| **Live Band** | 2 | `04` `10` |

**Two captions worth a second look.** `01-classical-baithak` and
`09-sangeet-sammelan` are classical concerts — a baithak with tanpura, and the
SaMaPa Sangeet Sammelan in Delhi. They sit under *Bhajan Sandhya* because that
is the closest of the labels you chose, but a separate **Classical Sangeet**
label would describe them more accurately. Say the word and I'll add it.

Blocks that currently have no photo, so no caption appears for them: **Sufi
Night**, **Keertan**, **Bollywood Night**. Send one photo for any of those and
the block goes straight back in.

`hero-photo-audit.jpg` in the project root is a contact sheet of all ten in
running order.

---

## Worth knowing

**The Shakti-Naad section.** Two columns: all of the copy on the left, and
every photograph and clip running as one slider on the right. The slider is
sticky, so a picture stays on screen for the whole read. On a phone the two
stack and the slider goes first, the same order the hero uses.

All of its wording is yours, used verbatim. The only change is layout: the
opening line is split across the eyebrow, the title and the subtitle, and the
genre list is set as chips.

**Its slider is the hero's slider**, literally the same code — `carousel()` in
`main.js` is built once and called twice from `carousels()`. The frame takes
each item's own shape, so the portrait poster, the square stage shot and the
landscape band photo all show whole, nothing cropped.

**Seven slides, and two of them are clips.** A photograph holds for **3
seconds**; a clip holds for its own **15 seconds**, which that slide declares
in `data-dur="15000"`. Change the 3s in the `dur:3000` of the Shakti-Naad call
in `carousels()`, and a clip's hold in its own `data-dur`. The running order is
poster → stage portrait → baithak clip → the band → Amrit Mahotsav → stage clip
→ in performance, so the two clips fall between groups of photographs rather
than back to back.

**The clips play with their sound on.** There is a catch worth knowing: no
browser will let a clip start itself with the sound on until the visitor has
interacted with the page. So a clip starts muted and turns its sound on at the
visitor's first click, tap or key press anywhere — the `SOUND` gate near the
top of `main.js`. Until then it plays silently rather than not at all. The ♪
button on a running clip is always visible and turns the sound off again, and
only one clip anywhere on the page is ever audible.

To ship the clips silent instead, drop `sound:true` from the Shakti-Naad call
in `carousels()`.

Each clip is fetched only when the slide before it comes up, so nothing
downloads on page load.

**The two clips** are 15-second cuts taken from the middle of the source
recordings, not their openings — the baithak clip starts at 34s of the satsang
footage, the stage clip at 248s of the evening performance. Audio is 128 kb/s
stereo. Together they are 3.8 MB.

**The Jjhoom Band section** is the third deep panel, below Shradha Suman, in
wine and amber so no two band panels share a palette. Copy left, film right
(the reverse of Shradha Suman), stacking to copy-then-film on a phone. Its
heading line — “The only genuine multi genre band” — is the band's own
sentence, lifted from the copy they sent.

**Its film is a 35-second reel**, `jjhoom.mp4`, cut from the band's YouTube
video (`vpCc7Hu2-SM`, 4:05) at your request. Five seven-second beats:

| # | from | what it is |
|---|---|---|
| 1 | 0:11.6 | the line-up one by one — singer, bassist, guitarist, the full band, then the percussionist, with the source's own glitch-wipe between them |
| 2 | 0:56 | the floor under green lasers, wide |
| 3 | 0:38 | the singer working the crowd |
| 4 | 2:24.5 | the guitar solo |
| 5 | 2:00.5 | the singer in close-up, to finish |

There is no titled intro in the source, so the opening beat is the passage
where the camera takes each musician in turn rather than a caption sequence.
The five beats land within 0.5 dB of each other after a small lift on the
first, with 0.3s fades across the joins and a limiter on the result.

It was pulled at 1080p50 and encoded to 720p25, x264 CRF 26, which is 10.8 MB.
That is the heaviest clip on the page after the Showreel, but `preload=
"metadata"` means none of it downloads until a visitor presses play. Like the
other bands' films it has the browser's own controls, no autoplay and no
`muted`, so it plays with sound on the first press.

Re-cutting it needs `yt-dlp`, `deno` (yt-dlp's JS runtime, without which
YouTube only exposes 360p) and a full `ffmpeg`. All three were installed
through winget for this job and live under
`%LOCALAPPDATA%\Microsoft\WinGet\Packages\`.

**The Dastak section** is the fourth deep panel, below Jjhoom, in sapphire and
brass — the fourth palette, so still no two band panels match. Copy left, film
right, the same arrangement as Jjhoom at your request, stacking to copy-then-
film on a phone. The heading is `Dastak ft. Parag Jain`, since that is how the
act is billed, and the line under it — "Where versatility meets unforgettable
live music" — is their own closing sentence.

**The film and the accolades share a sticky column.** Dastak's copy runs longer
than the other bands', so a 16:9 film alone would have left roughly 590px of
empty panel beside it. Two things fix that: the three accolades (10+ years,
Antakshiri finalist, Voice of India top 50) sit under the showreel rather than
in the left column, and `.dastak__stage` is `position:sticky` so the pair rides
along as you read — the same device `.sn-slider` uses in Shakti-Naad. The
remaining gap is ~330px and fills as you scroll. On a phone the stack is static
again.

**Its film is a 30-second reel**, `dastak.mp4`, cut from the first of the three
Drive showreels you sent (`Parag Jain Ft Dastak Showreel.mp4`, 1080p25, 4:27).
It is a straight 0:00–0:30 take, not an assembly, because the editor front-
loaded that reel and the opening is the strongest run in it:

| at | what it is |
|---|---|
| 0:02 | the rig and ceiling, as an establishing shot |
| 0:06 | the percussionist at the congas, close |
| 0:10 | whip-pan transition |
| 0:14 | the band's own **dastak — A Sufi Rock Band** title card |
| 0:18 | percussion and floral decor, an event floor |
| 0:22 | the vocalist on the red LED stage |
| 0:26 | the room and the floor, from behind the singer |

Encoded to 720p25, x264 CRF 27 capped at 2.4 Mb/s, AAC 128 kb/s — 9.2 MB. There
is a 0.4s audio fade on the tail so the cut doesn't click. `preload="metadata"`
means none of it downloads until a visitor presses play, and like the other
bands' films it has the browser's own controls, no autoplay and no `muted`.

`dk-poster.jpg` is the frame at 0:23.6 — the vocalist front-on at the mic
against the geometric LED wall, the clearest shot of him in the clip.

**The five-piece wide shot is just outside the cut.** In the source the whole
line-up spreads across the LED wall from 0:32.4, so the 35-second version used
to end on it and took its poster from 0:37.5. Trimming to 30 seconds drops that
shot, which is why the poster moved inside the new range — a poster promising a
shot the clip never reaches would be a bait. If you want that finale back, the
window `4.8s → 34.8s` is also exactly 30 seconds, starts on a clean cut (the
keyboardist, rather than the dim empty venue) and keeps both the title card and
the full band. Say the word.

**The other two reels are unused.** The corporate (688 MB, 1080p, 5:47) and
social-event (2.5 GB, 4K, 5:28) files are both longer and heavier; the general
reel is the act's calling card and carries the title card. Say the word and I'll
cut from either instead.

**The Krishnaya section** is the fifth deep panel, below Dastak. It was built in
forest green and gold as a fifth palette, but at your request it now reuses
Shakti-Naad's exact background — saffron and magenta over violet — because the
run of five panels reads more smoothly closing on the colour it opened with.
Its accents followed the background into the gold and marigold family, so the
panel holds together; it is the one place where two band panels share a palette,
and the three in between keep them from touching. Copy left, film right, the
same arrangement as Jjhoom and Dastak. The heading line — "Feel the
music. Experience the devotion. Live the vibe." — is their own sentence.

**Its film is portrait, so the columns are weighted the other way.** Every other
band film is 16:9 and takes the wider column; Krishnaya's footage is 576×1024,
so the copy takes the wider column (`1.16fr .84fr`) and the film caps at 372px,
the way Shradha Suman's does. That lands the film at 699px against 705px of
copy — a 6px difference — so this panel needs none of the sticky treatment
Dastak uses to fill its column.

**Its film is a 25-second edit**, `krishnaya.mp4`, assembled from the two files
you sent rather than trimmed from one. Five five-second beats, the evening event
first and the band close up second:

| # | from | what it is |
|---|---|---|
| 1 | `krishnaya2` 43.5s | the stage under colour-changing light, gold arch behind |
| 2 | `krishnaya2` 20.5s | guests dancing in front of the moon backdrop |
| 3 | `krishnaya` 42.5s | the male vocalist close, cutting to the female vocalist |
| 4 | `krishnaya` 75.0s | the musician in maroon at his instrument |
| 5 | `krishnaya` 99.0s | both vocalists together, to finish |

Each beat is loudness-matched to −16 LUFS with 0.15s audio fades on the joins,
so the two sources sit at the same level; the video cuts are hard, which is what
a montage wants. 0.35s up from black at the head, 0.4s down at the tail. Encoded
at native 576×1024, x264 CRF 25 capped at 2 Mb/s, AAC 128 kb/s — 4.4 MB.

**The watermark stays; the contact card does not.** Their footage carries two
separate pieces of branding and they are treated differently. The small
KRISHNAYA logo locked to the top-right corner is kept — it is the band's own
mark and it belongs on their film. It was removed with `delogo` in an earlier
cut and that read worse than leaving it: the patch sat on a plain wall and drew
the eye, so the filter is gone.

What is still avoided is the **"Book Your Dates Now‼" card** — a full overlay of
their phone, email and address that burns in from roughly 132s to the end of
`krishnaya.mp4`. No beat runs past 114s, so it never appears. There is also a
full-screen KRISHNAYA title card at 0:02 and a "Join the Journey" caption around
0:20; both sit outside every beat. `krishnaya2.mp4` carries no branding at all.
Check a re-cut against all four.

`kr-poster.jpg` is the frame at 0:14 of the edit — the vocalist mid-bhajan, eyes
closed, which says "devotional" faster than a wide stage shot does.

**The location line was left out.** Their copy ends "Gurugram | Delhi NCR |
Available for Events Worldwide". None of the other band panels carry a location,
and it reads as Krishnaya's own service area rather than yours, so the panel
says what they play and leaves where to you. Easy to add back.

**Re-cutting it.** Drive throttles the public download endpoint — sampling frames
across a file is enough to trip "quota exceeded" for a while, and only ranged
requests keep working after that. Pull the source in sequential 8 MB ranges
rather than as one download, or just put the file in `assets/video/` yourself.

**The poster was cropped.** `sn-poster.jpg` is your artwork with the
“Contact us” bar taken off the bottom, so the phone number is not published
twice. The original is untouched in your source folder.

**The Shradha Suman Band section** sits directly below Shakti-Naad as the page's
second deep panel — its sibling, not its copy. Shakti-Naad is saffron and
magenta over violet; this one is teal and indigo over deep plum, and a cream
gap of ~38px between the two rounded panels stops them fusing into one slab.
The film sits on the left with a teal glow behind it, the copy on the right.
On a phone the copy leads and the film follows, which is the one thing the
desktop `order:-1` on `.suman__film` has to give back.

The three settings the band is written for are set as a **ruled index** —
numbered rows with hairlines — rather than the chips Shakti-Naad uses, so the
two sections do not read as the same template twice.

Its wording is yours, verbatim, with one deliberate omission: the
“Team:- Shradha Suman” sign-off that closed the supplied text was dropped at
your request, so the column now ends on the index and the booking button. The
index picked up the spacing it used to carry.

**Choreography is in both navs**, between Bands and Showcase, matching the
section order. The header row still fits on one line at 1280px, and the mobile
menu shows all seven items without scrolling. It needs no `data-also`: it is a
single section, so `nav()` lights it up from its own `href`.

**The brand line reads “Live Music & Events”**, changed from “Choreography &
Live Music” at your request. It is `.brand__tag` in the header; the footer
strapline ("Choreography · Celebration · Music · Experience") is a separate line
and was left alone.

**The nav calls it “Bands”**, not “Shakti-Naad”, since one label now stands for
all five band sections — in the header and the footer. It still jumps to
Shakti-Naad, and `data-also="#shradha-suman,#jjhoom,#dastak,#krishnaya"` on that
link makes it light up for any of them as you scroll past; `nav()` in `main.js`
reads that attribute. It takes a comma-separated list, so put `data-also` on any
other link to give it as many extra sections as you like.

**Its clip is an edit, not a trim.** `shradha-suman.mp4` is 20 seconds built
from three pieces of your 54-second file: the branded black-and-white opening
(0–6.5s), the strongest passage of the first performance (23.3–30s), and the
clearest of the second (37–43.8s). The three were recorded at very different
levels — 16.5 dB apart — so each was loudness-matched before joining, with
quarter-second fades across the joins and a limiter on the result. They now sit
within 4 dB of each other.

It keeps the original 576×1056 frame, so nothing is stretched or cropped. It
has the browser's own controls, no `autoplay` and no `muted`, so it sits still
until a visitor presses play and then plays with its sound — which is why it
needs no sound gate of the kind Shakti-Naad's clips use.

**The hero slider.** Each photo holds for **5 seconds**, then the next one
slides in from the left across the top of it — left to right — and the set
loops from the last back to the first. It starts on its own, and the arrows,
dots, arrow keys and touch-swipe all work. The timing is one line in
`assets/js/main.js` — the `dur:5000` in the hero's `carousel()` call.

The slides are grouped into commented blocks in `index.html` — Bhajan Sandhya,
Shakti-Naad, Live Band, Choreography. (The hero still runs all ten photos; only
the page section was removed.) Keep a new photo inside its block so each
genre still plays as an uninterrupted run.

**Photos keep their original proportions, with no bars.** The frame has no fixed
shape — `fitFrame()` in `assets/js/main.js` measures each photo as it comes up
and sets the frame to the largest box of *that photo's* proportions that still
fits the column and a sensible height. The photo then fills it exactly.

So a wide 16:9 shot gets a wide, short frame; the portrait shot of the vocalist
gets a narrow, tall one, centred in the column. Nothing is cropped and nothing
is padded out.

The two limits are in `fitFrame`: the column width, and
`Math.min(innerHeight * 0.62, 520)` for the height — raise or lower that number
to make the whole slider bigger or smaller.

That means **a new photo needs no crop tuning at all** — any shape works. Copy a
`<figure>` block, change the `src`, the `alt`, and the `width`/`height` to the
file's real pixel size. Those two attributes are what the sizing reads, so they
must be correct.

Controls sit *below* the frame rather than over it, so nothing is laid on top of
the photographs.

**Nothing repeats.** Every photo and clip appears in exactly one place on the
page — 47 distinct files in all. Each video is used once too: the Showreel is
the long six-minute film with chapter markers, Shakti-Naad has two 15-second
cuts of its own, and Shradha Suman has one. If you add media later, the
quickest check is to search `index.html` for the filename and make sure it comes

**The Choreography section** sits between the band run and the Showcase. It is
light, on the page's own cream, rather than a sixth deep panel: after five
jewel-toned slabs the lift back to light is what makes the run feel finished,
and it hands off cleanly to the Showcase, which is light too. Copy left, square
film right, with the copy taking the wider column.

**Its film is the full 5:34 reel you supplied** (`kartik/… 8.28.36 PM.mp4`),
`choreography.mp4`, 33.6 MB. It is **stream-copied, not re-encoded** — the
picture and sound are bit-for-bit the source, with no grade, no trim and no
quality loss. The only change is a remux with `-movflags +faststart`: the
source had its `moov` atom at the end, which would have forced a browser to
download all 33 MB before showing a single frame. Moving it to the front lets
playback begin immediately.

Earlier versions of this section were edited cuts — first a 30s assembly from
the seven Instagram posts, then 40s with the corporate footage folded in. Both
are gone. If you ever want a short cut again, `scratchpad/reelN.sh` still
builds the twelve-clip version.

**The full reel carries two things a trimmed cut did not.** They are in it
deliberately, because you asked for the whole video, but worth knowing:

- the first ~39 seconds are a tilted collage of outdoor group dance, softer and
  lower-contrast than the stage footage that follows
- from about 5:06 it closes on an **"Avanti's Event Choreographies · Connect
  9818259666"** card, so your phone number now appears on the page

Both are your own material, so neither is a rights problem — but if you would
rather the section opened on the stage and ended without the card, trimming to
0:39–4:57 is one command and I can do it in a moment.

`choreo-poster.jpg` is the frame at 2:22 — the ornate LED wall mid-performance,
chosen over anything in the opening collage so the still that greets visitors is
the strongest part of the film.

**A note on weight.** At 33.6 MB this is by far the heaviest asset on the site.
`preload="none"` keeps it out of the initial page load entirely, and it is only
fetched once the section comes near, but it is a large download on mobile data
and it autoplays. Now that the frame has a scrub bar, click-to-play would be a
defensible swap — say the word.

**Three of the seven original Instagram posts had no usable footage.** They are
no longer used at all, but for the record:

| file | why |
|---|---|
| `11.31.57` | the bride solo — footage sits tilted inside a polaroid frame over a textured backdrop, soft and poorly lit, dancers indistinct behind PA stacks |
| `11.33.02` | a rotated collage: the clip is set at an angle inside overlapping decorative panels, so there is no rectangle to crop |
| `11.33.19` | a promo slideshow of posters, not performance footage, and it carries a phone number on every frame |

**It is square at 576×576 and nothing is upscaled.** That is the source's own
shape and resolution, kept untouched — 1080p was never available from any of
the supplied footage, and the brief's own rule was not to stretch low-resolution
material. The square sits naturally in the section's right-hand column.

**Playback.** `preload="none"` means nothing is fetched on initial page load —
verified: `readyState` is 0 at the top of the page. One observer starts fetching
600px out, another plays and pauses it at 35% visibility, and `load()` is never
called in the same tick as `play()` — that race is what makes a muted autoplay
silently fail. A `canplay` handler retries, so playback is self-healing. The
corner button toggles mute, keeps `aria-pressed` and its label in step, and any
other video starting on the page mutes this one. Under
`prefers-reduced-motion` nothing autoplays: the button is hidden and the
browser's own controls appear.

**It has a scrub bar.** At 4:17 the film is far too long to sit under a bare
autoplay loop, so the frame carries a control strip along its foot: a seek bar
showing how much has played, a `played / total` readout, and the sound toggle.
The seek control is a real `<input type="range">` rather than a styled `<div>`,
which means dragging, tapping and the arrow keys all seek with no custom
keyboard handling and screen readers announce it correctly. The played portion
is drawn from a `--p` custom property the script writes on each `timeupdate`,
so the painting stays in CSS. A `scrubbing` flag stops `timeupdate` fighting
your finger mid-drag, and the seek is committed on `pointerup` or `change`.

**The soundtrack is the reel's own audio**, untouched. Earlier edited cuts had
to loudness-match and cross-fade twelve separate clips so the sound would not
jump between them; a single stream-copied file has none of those joins, so
there is nothing to balance. It is unnormalised, so its level may sit a little
below the band films elsewhere on the page — the sound is off by default and
turned on from the strip, so that is a small thing.

**It is still live event audio.** Whatever track was playing in that room is on
the recording, so it is not licensed for commercial use. Clearing it means
either replacing the audio with a licensed bed or shipping the film silent and
hiding the sound button. I did not source a track because I have no licensed
library and will not take one from elsewhere.

**The Showcase is six fifteen-second films, one per source clip.** It used to be
the six-minute `stage-lights.mp4` with chapter markers; that player and its
JavaScript are gone. Four rules decide what may appear: never two cuts from the
same source, never footage that already plays elsewhere on the page, nothing
from the Instagram reels, and picture quality good enough to sit full width on a
phone.

| file | source | window | shape |
|---|---|---|---|
| `sc-studio-room.mp4` | `WhatsApp … 1.49.40 PM` | 39s + 8s | upright |
| `sc-bhajan-tall.mp4` | `WhatsApp … 1.49.39 PM` | 6s + 36s | upright, centre-cropped |
| `sc-live-stage.mp4` | `WhatsApp … 1.49.40 PM (2)` | 126s + 176s | upright |
| `sc-krishnaya.mp4` | `krishnaya.mp4` | 99s + 115.5s | upright |
| `sc-evening.mp4` | `krishnaya2.mp4` | 43.5s + 19s | upright |
| `sc-dastak.mp4` | the Dastak Drive showreel | 33–48s | 16:9 |

**Two of these share a source with a band panel, and neither repeats it.** The
Dastak panel is 0–30s of its showreel, so the Showcase takes 33–48s — the full
five-piece on the LED wall, which the panel stops just short of. The Krishnaya
panel uses six beats at 45.9, 53, 69.1, 76.7, 82.3 and 110s; the Showcase takes
99s and 115.5s, which it skips. `krishnaya2.mp4` appears nowhere else at all.

Each clip is graded identically (`eq` contrast 1.07 / saturation 1.14 plus a
light `unsharp`), joins on a 0.5s cross-dissolve with a matching `acrossfade`,
is loudness-matched to −16 LUFS, and fades up and down at the ends. The
devotional clip is centre-cropped from a 1024×576 original to 576×1024, which
costs resolution but brings its singers up to a readable size.
`scratchpad/sharp.sh` scores picture detail with a Laplacian filter if you want
to re-check a new clip before adding it.

**Jjhoom is missing on purpose.** `jjhoom.mp4` is 35 seconds and the band panel
plays all of it, so every possible 15-second cut sits inside the band section.
Its source is the band's YouTube video (`vpCc7Hu2-SM`, 4:05); fetching that with
`yt-dlp` would give passages the panel never uses. Say the word and it becomes a
seventh card.

**Excluded, and why:**

| file | why |
|---|---|
| `choreo-cultural`, `choreo-memories`, `stage-lights` | Instagram reels — watermark and reel text burnt in |
| `live-band`, `WhatsApp … 3.01.01` | the Shradha Suman footage, already in that panel |
| `WhatsApp … 1.48.35` / `1.49.40 (1)` | a *Triple Shade Band* promo — another act's branding across the top half, 576×480 |
| `WhatsApp … 1.49.39 (1)` | a seminar shot from the back of an auditorium, 12s |
| `WhatsApp … 1.49.39 (2)` | the same stage footage as `1.49.40 (2)` at 848×480 |

`.reels__row--tall` is a row of three, `--duo` two, `--quad` four, `--feature`
one wide.
back once.

The only file that appears twice is not a photograph: `art/logo.svg` is the brand
mark in the header and the footer. `classical-ensemble-02.jpg` is referenced once
more, as the `og:image` for link previews, but that never renders on the page.

**About and Our Services carry no photography.** Both were rebuilt without it at
your request. About is now a centred column of copy over four glass pillars;
Our Services is three typographic cards, each keeping its category hue as a bar
across the top and in its outlined numeral, with the card heights set by the grid
so the three stay level and their Explore links line up. Six stills came off the
page as a result — `classical-ensemble-03`, `dancer-face`, `vocalist-live-01`,
`stage-chakra`, `decor-roses` and `classical-ensemble-02` — and are still in
`assets/img/` if you ever want them back.


**Four clips are on disk but no longer on the page**, kept in case you want them
back: `stage-lights.mp4` (39 MB, the old Showcase film), `choreo-cultural.mp4`,
`choreo-memories.mp4` and `live-band.mp4`. All four are Instagram cuts, and
`live-band` is the Shradha Suman footage besides. Deleting them would take about
76 MB off the folder; nothing on the page references them.

**Video weight.** `assets/video/stage-lights.mp4` is 39 MB and the other 17
files total 109 MB (148 MB in all). They stream fine locally but will be slow on
mobile data. Before launch, compress them — roughly 10× smaller with no visible
loss:

```bash
ffmpeg -i assets/video/stage-lights.mp4 -vcodec libx264 -crf 28 -preset slow \
       -vf scale=1280:-2 -movflags +faststart -an out.mp4
```

`-movflags +faststart` matters: it lets playback begin before the file finishes
downloading. The hero deliberately uses the two smaller clips; the 41 MB one is
click-to-play only.

**Children in the footage.** Several clips and stills show children performing.
They're from your own public Instagram, but a website has a wider reach than a
feed — worth confirming you have parents' consent before launch.

**Your originals are untouched.** The four `WhatsApp Video ….mp4` files in the
project root are your originals. The site uses renamed copies in
`assets/video/`, so you can delete the root ones to save ~79 MB whenever you like.

---

## Deploying

It's a static site — drag the folder onto Netlify Drop, or push to GitHub and
enable Pages. No configuration needed.

Leave these behind — they're working files, not part of the site:
`serve.ps1` (local preview only), `hero-photo-audit.jpg` (the contact sheet of
hero slides), the loose `WhatsApp Video ….mp4` / `WhatsApp Image ….jpeg` files
in the project root, and the screen recording.

---

## What's in here

```
index.html                 the whole page
serve.ps1                  local preview server
favicon.svg
assets/
  css/style.css            all styling; design tokens are at the top
  js/main.js               CONFIG at the top, then behaviour
  video/                   4 clips renamed from the originals, the two 15s
                           Shakti-Naad cuts, and the Jjhoom, Shradha Suman,
                           Dastak and Krishnaya reels
  img/                     45 stills pulled from those clips, + 1 photo
  img/suman/               the Shradha Suman video's poster frame
  img/jjhoom/              the Jjhoom video's poster frame
  img/dastak/              the Dastak video's poster frame
  img/krishnaya/           the Krishnaya video's poster frame
  img/studio/              the studio session's poster frame
  img/shakti/              the Shakti-Naad photographs and the two video
                           poster frames — used only in that section.
                           sn-bollywood.jpg is kept here but no longer
                           on the page — add a <figure class="slide">
                           back to #snMedia to bring it in again
  img/art/                 hand-drawn SVG ornaments (mandala, paisley,
                           tanpura, logo mark)
```

**Galleries don't crop faces.** The band sliders size their frame to each
photograph in turn, so a portrait poster and a landscape group shot both show
whole, and the Showcase films keep their own proportions rather than being
squared off to match each other.

**The Instagram grid is gone.** The section that tiled ten reels was removed;
Instagram now lives only in the Contact section, where it is a ghost button
beside WhatsApp and a row in the contact rail, both driven by `CONFIG.instagram`
and `CONFIG.igHandle` in `main.js`.

**Colour and type** live in one place — the `:root` block at the top of
`style.css`. Changing `--saffron`, `--rose` or `--violet` there re-tints the
whole site.

The ornaments in `assets/img/art/` are drawn as SVG paths, so they stay sharp at
any size and are tinted from CSS rather than baked in.

---

## Content notes

- Instagram handle, follower-facing copy and the Shakti-Naad / Pt. Geetesh
  Mishra details come from what you supplied. Nothing about the artist's
  record, grading or history was embellished.
- All imagery is from your own four videos plus the one photograph. No stock
  photography, so nothing to license.
- The stills in `assets/img/` were captured from your clips — if you have
  higher-resolution originals, dropping them in at the same filenames will
  sharpen the galleries.

// Country Cycles Killearn — KEEF
// UI layer. Drives the diagnostic engine and renders question/result screens.
// Conversational chat-style: KEEF + one question + a few buttons per screen.

import { DiagnosticEngine, shortCaveat } from './triage/engine.js';
import { keefSound, SOUNDS } from './sound.js';

const KEEF_SPRITE_BASE = 'assets/keef/';
const KEEF_EXT = 'png';

const $ = (id) => document.getElementById(id);

const screens = {
  home: $('screenHome'),
  question: $('screenQuestion'),
  result: $('screenResult'),
};

let engine = null;
let pendingCapture = null;

// ----- Screen transitions -----

function show(screen) {
  for (const s of Object.values(screens)) s.hidden = true;
  screen.hidden = false;
  enter(screen);
  const heading = screen.querySelector('h1, h2');
  if (heading) heading.focus({ preventScroll: false });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function enter(el) {
  el.classList.remove('is-entering');
  // Force a reflow so the animation restarts.
  void el.offsetWidth;
  el.classList.add('is-entering');
}

function setKeefSprite(imgEl, pose) {
  if (!imgEl) return;
  imgEl.src = `${KEEF_SPRITE_BASE}${pose}.${KEEF_EXT}`;
  imgEl.onerror = () => {
    if (!imgEl.dataset.fallback) {
      imgEl.dataset.fallback = '1';
      imgEl.src = `${KEEF_SPRITE_BASE}${pose}.svg`;
    }
  };
}

// ----- Question rendering -----

function renderQuestion(q) {
  // Soundtrack: scan/beep for drill-down magnify questions, soft blip for
  // entry questions, curious tone for thinking-pose clarifiers.
  if (q.keefPose === 'magnify')   keefSound.play(SOUNDS.SCAN);
  else if (q.keefPose === 'thinking') keefSound.play(SOUNDS.UNSURE);
  else                                keefSound.play(SOUNDS.QUESTION);

  $('questionHeading').textContent = q.text;
  setKeefSprite($('questionKeefSprite'), q.keefPose);

  const path = $('questionPath');
  const label = pathLabel(q);
  if (label) {
    path.textContent = label;
    path.hidden = false;
  } else {
    path.textContent = '';
    path.hidden = true;
  }

  const help = $('questionHelp');
  if (q.helpText) {
    help.textContent = q.helpText;
    help.hidden = false;
  } else {
    help.textContent = '';
    help.hidden = true;
  }

  const optsEl = $('questionOptions');
  optsEl.innerHTML = '';

  const captureEl = $('questionCapture');
  captureEl.innerHTML = '';
  captureEl.hidden = true;
  pendingCapture = null;

  for (const opt of q.options) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    if (opt.redFlag) btn.classList.add('option-btn--danger');
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      // Drop focus immediately so iOS Safari doesn't leave the tapped
      // button visually highlighted while we render the next screen.
      btn.blur();
      handleAnswer(opt);
    });
    optsEl.appendChild(btn);
  }

  // Re-trigger entry animation on every question change for a calm fade.
  enter(screens.question);
}

function pathLabel(q) {
  const map = {
    BOOTSTRAP: '',
    BRAKES: 'Brakes',
    GEARS: 'Gears',
    CHAIN: 'Chain & drivetrain',
    TYRES_WHEELS: 'Tyres & wheels',
    HEADSET_STEERING: 'Steering',
    CRANKS_BB: 'Cranks & BB',
    SUSPENSION: 'Suspension',
    EBIKE_ELECTRICS: 'E-bike electrics',
    OTHER: '',
  };
  return map[q.category] || '';
}

function handleAnswer(opt) {
  if (opt.capture && opt.capture.length && !pendingCapture) {
    pendingCapture = renderCapture(opt);
    return;
  }
  let captured = {};
  if (pendingCapture) captured = collectCapture();
  pendingCapture = null;
  try {
    const next = engine.answer(opt.id, captured);
    if (next) renderQuestion(next);
    else showResultWithLoading(engine.result());
  } catch (err) {
    alert(err.message);
  }
}

// Brief "checking the workshop manual" transition before the result lands.
// KEEF turns away (back_view) for ~800ms with the loading sound, then
// turns to face the rider with their result.
async function showResultWithLoading(r) {
  // Reuse the question screen as a transient loading state.
  show(screens.question);
  setKeefSprite($('questionKeefSprite'), 'back_view');
  $('questionPath').hidden = true;
  $('questionHeading').textContent = 'Checking…';
  $('questionHelp').hidden = true;
  $('questionCapture').hidden = true;
  $('questionOptions').innerHTML = '';
  $('notSureBtn').hidden = true;

  keefSound.loop(SOUNDS.LOADING);
  await new Promise((res) => setTimeout(res, 800));
  keefSound.stopLoop();

  $('notSureBtn').hidden = false;
  renderResult(r);
}

function renderCapture(opt) {
  const captureEl = $('questionCapture');
  captureEl.innerHTML = '';
  for (const f of opt.capture) {
    const wrap = document.createElement('div');
    wrap.className = 'capture__field';
    const label = document.createElement('label');
    label.className = 'capture__label';
    label.textContent = f.prompt + (f.required ? ' *' : '');
    label.setAttribute('for', `cap_${f.key}`);
    wrap.appendChild(label);
    let input;
    if (f.type === 'select') {
      input = document.createElement('select');
      input.className = 'capture__select';
      const blank = document.createElement('option');
      blank.value = ''; blank.textContent = 'Choose…';
      input.appendChild(blank);
      for (const c of (f.choices || [])) {
        const o = document.createElement('option');
        o.value = c; o.textContent = c;
        input.appendChild(o);
      }
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'capture__input';
      input.placeholder = 'Type the code shown on the display';
    }
    input.id = `cap_${f.key}`;
    input.dataset.key = f.key;
    if (f.required) input.required = true;
    wrap.appendChild(input);
    captureEl.appendChild(wrap);
  }
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'btn-pill btn-pill--primary';
  confirm.textContent = 'Continue';
  confirm.addEventListener('click', () => handleAnswer(opt));
  captureEl.appendChild(confirm);
  captureEl.hidden = false;
  const first = captureEl.querySelector('input,select');
  if (first) first.focus();
  return opt.capture;
}

function collectCapture() {
  const captureEl = $('questionCapture');
  const out = {};
  for (const el of captureEl.querySelectorAll('input,select')) {
    out[el.dataset.key] = el.value;
  }
  return out;
}

// ----- Result rendering -----

function renderResult(r) {
  show(screens.result);
  setKeefSprite($('resultKeefSprite'), r.keefPose);

  // Soundtrack tied to KEEF's pose so it always matches the visual register.
  if (r.keefPose === 'stop')              keefSound.play(SOUNDS.STOP);
  else if (r.keefPose === 'wrench_thumb') keefSound.play(SOUNDS.SUCCESS);
  else if (r.keefPose === 'idea')         keefSound.play(SOUNDS.TIP);
  else if (r.keefPose === 'thinking')     keefSound.play(SOUNDS.UNSURE);
  else                                    keefSound.play(SOUNDS.TIP);

  const badge = $('tierBadge');
  badge.className = 'tier-badge tier-badge--' + r.tier.toLowerCase();
  badge.textContent = badgeLabel(r.tier);

  $('resultHeading').textContent = r.headline;
  $('resultBody').textContent = r.body;
  $('resultAction').textContent = r.actionLine;

  const extra = $('resultExtra');
  if (r.ctaExtra) {
    extra.textContent = r.ctaExtra;
    extra.hidden = false;
  } else {
    extra.textContent = '';
    extra.hidden = true;
  }

  const cta = $('ctaBtn');
  if (r.ctaId === 'NONE' || !r.ctaLabel) {
    cta.hidden = true;
  } else {
    cta.hidden = false;
    cta.textContent = r.ctaLabel;
    cta.onclick = () => handleCta(r.ctaId);
  }

  $('shortCaveat').textContent = shortCaveat();
  $('restartBtn').hidden = false;

  // Photo-send only on Amber/Red.
  const photoSend = $('photoSend');
  if (r.tier === 'AMBER' || r.tier === 'RED') {
    photoSend.hidden = false;
    wirePhotoSend(r);
  } else {
    photoSend.hidden = true;
  }

  // Instagram pill on result screen.
  const insta = $('resultInstaBtn');
  if (insta) {
    const url = window.COUNTRY_CYCLES_INSTAGRAM_URL || '';
    const isPlaceholder = !url || url === 'ADD_INSTAGRAM_LINK';
    if (isPlaceholder) { insta.hidden = true; }
    else { insta.href = url; insta.hidden = false; }
  }
}

function badgeLabel(tier) {
  if (tier === 'GREEN') return 'Safe simple check';
  if (tier === 'AMBER') return 'Workshop recommended';
  return "Don't ride — contact us";
}

function handleCta(ctaId) {
  const phone = window.COUNTRY_CYCLES_PHONE || '';
  const url = window.COUNTRY_CYCLES_BOOKING_URL || '';
  const telHref = phone ? `tel:${phone.replace(/\s+/g, '')}` : '';
  if (ctaId === 'CALL_SHOP_URGENT' || ctaId === 'CALL_SHOP_BATTERY') {
    if (telHref) window.location.href = telHref;
    return;
  }
  if (ctaId === 'BOOK_WORKSHOP') {
    if (url) window.location.href = url;
    else if (telHref) window.location.href = telHref;
  }
}

// ----- Photo send -----

function buildBookingMessage(r) {
  const lines = [];
  lines.push('Hi Country Cycles — KEEF AI Mechanic check.');
  lines.push('');
  lines.push(`Result: ${r.tier} — ${r.headline}`);
  const note = r.bookingNote || {};
  if (note.bikeType) lines.push(`Bike: ${note.bikeType}`);
  if (note.category) lines.push(`Issue area: ${note.category.replace(/_/g, ' ').toLowerCase()}`);
  if (note.trigger)  lines.push(`Trigger: ${note.trigger}`);
  const captured = note.captured || {};
  if (captured.ebike_system)     lines.push(`E-bike system: ${captured.ebike_system}`);
  if (captured.ebike_error_code) lines.push(`Error code: ${captured.ebike_error_code}`);
  lines.push('');
  lines.push('Photo of the issue attached.');
  lines.push('');
  lines.push('— sent from KEEF · Country Cycles AI Mechanic');
  return lines.join('\n');
}

function wirePhotoSend(r) {
  const input = $('photoInput');
  const fresh = input.cloneNode(true);
  input.parentNode.replaceChild(fresh, input);
  fresh.addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    await sharePhoto(file, r);
    fresh.value = '';
  });
}

async function sharePhoto(file, r) {
  const text = buildBookingMessage(r);
  const title = 'KEEF — bike issue photo';
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  const phone = window.COUNTRY_CYCLES_PHONE || '01360 550 372';
  try { await navigator.clipboard.writeText(text); } catch (e) { /* noop */ }
  alert(
    "Your browser can't share files directly.\n\n" +
    'The booking note has been copied to your clipboard. ' +
    `Phone the shop on ${phone}, or email Country Cycles, attach your photo, and paste the note.`,
  );
}

// ----- App lifecycle -----

function start() {
  engine = new DiagnosticEngine();
  show(screens.question);
  renderQuestion(engine.currentQuestion());
  $('restartBtn').hidden = false;
}

function restart() {
  engine = null;
  keefSound.stopLoop();
  show(screens.home);
  $('restartBtn').hidden = true;
  keefSound.play(SOUNDS.HELLO);
}

$('startBtn').addEventListener('click', () => {
  keefSound.play(SOUNDS.HELLO);
  start();
});
$('restartBtn').addEventListener('click', restart);
$('resultRestartBtn').addEventListener('click', restart);
$('notSureBtn').addEventListener('click', () => {
  if (!engine) return;
  keefSound.play(SOUNDS.UNSURE);
  engine.exitNotSure();
  showResultWithLoading(engine.result());
});

// Mute toggle: persists in localStorage, swaps the icon, and announces state.
const muteBtn = document.getElementById('muteBtn');
const muteOn  = muteBtn.querySelector('.topbar__mute-on');
const muteOff = muteBtn.querySelector('.topbar__mute-off');
keefSound.onMuteChange((muted) => {
  muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  muteBtn.setAttribute('aria-label', muted ? 'Unmute KEEF sounds' : 'Mute KEEF sounds');
  muteOn.hidden  = muted;
  muteOff.hidden = !muted;
});
muteBtn.addEventListener('click', () => keefSound.toggleMute());

// Unlock audio on the very first user gesture (tap / click / key).
keefSound.unlockOnFirstGesture();

setKeefSprite($('homeKeefSprite'), 'wave');
show(screens.home);

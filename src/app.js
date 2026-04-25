// Country Cycles Killearn — KEEF
// UI layer. Drives the diagnostic engine and renders question/result screens.

import { DiagnosticEngine, shortCaveat } from './triage/engine.js';

const KEEF_SPRITE_BASE = 'assets/keef/';
const KEEF_EXT = 'png'; // swap to 'svg' if PNGs are unavailable

const $ = (id) => document.getElementById(id);

const screens = {
  home: $('screenHome'),
  question: $('screenQuestion'),
  result: $('screenResult'),
};

let engine = null;
let pendingCapture = null; // capture fields awaiting user input

function show(screen) {
  for (const s of Object.values(screens)) s.hidden = true;
  screen.hidden = false;
  // Move focus to the first heading for accessibility
  const heading = screen.querySelector('h1, h2');
  if (heading) heading.focus({ preventScroll: false });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function setKeefSprite(imgEl, pose) {
  if (!imgEl) return;
  imgEl.src = `${KEEF_SPRITE_BASE}${pose}.${KEEF_EXT}`;
  imgEl.onerror = () => {
    // Fallback to SVG if PNG isn't available.
    if (!imgEl.dataset.fallback) {
      imgEl.dataset.fallback = '1';
      imgEl.src = `${KEEF_SPRITE_BASE}${pose}.svg`;
    }
  };
}

function renderQuestion(q) {
  $('questionHeading').textContent = q.text;
  setKeefSprite($('questionKeefSprite'), q.keefPose);

  const path = $('questionPath');
  path.textContent = pathLabel(q);

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

  // Capture pre-prompts (e-bike error code, etc.) — we render any capture
  // fields inline above the option. Selecting that option commits them.
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
    btn.addEventListener('click', () => handleAnswer(opt));
    optsEl.appendChild(btn);
  }
}

function pathLabel(q) {
  const map = {
    BOOTSTRAP: 'Getting started',
    BRAKES: 'Brakes',
    GEARS: 'Gears',
    CHAIN: 'Chain & drivetrain',
    TYRES_WHEELS: 'Tyres & wheels',
    HEADSET_STEERING: 'Steering',
    CRANKS_BB: 'Cranks & BB',
    SUSPENSION: 'Suspension',
    EBIKE_ELECTRICS: 'E-bike electrics',
    OTHER: 'General',
  };
  return map[q.category] || '';
}

function handleAnswer(opt) {
  // If this option requires capture fields, render them first.
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
    else renderResult(engine.result());
  } catch (err) {
    alert(err.message); // capture validation failure
  }
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
  // Confirm button
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'btn btn--primary';
  confirm.textContent = 'Continue';
  confirm.addEventListener('click', () => handleAnswer(opt));
  captureEl.appendChild(confirm);
  captureEl.hidden = false;
  // focus first input
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

function renderResult(r) {
  show(screens.result);
  setKeefSprite($('resultKeefSprite'), r.keefPose);

  const card = $('resultCard');
  card.className = 'result-card result-card--' + r.tier.toLowerCase();

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
    cta.classList.toggle('btn--urgent', r.ctaUrgent);
    cta.onclick = () => handleCta(r.ctaId);
  }

  $('shortCaveat').textContent = shortCaveat();
  $('restartBtn').hidden = false;

  // Show the "send a photo" section for Amber and Red results.
  // Green = no workshop visit needed, so no photo prompt.
  const photoSend = $('photoSend');
  if (r.tier === 'AMBER' || r.tier === 'RED') {
    photoSend.hidden = false;
    wirePhotoSend(r);
  } else {
    photoSend.hidden = true;
  }
}

function buildBookingMessage(r) {
  const lines = [];
  lines.push(`Hi Country Cycles — KEEF AI Mechanic check.`);
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
  // Clone and replace to clear any previous handler from a prior result.
  const fresh = input.cloneNode(true);
  input.parentNode.replaceChild(fresh, input);
  fresh.addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    await sharePhoto(file, r);
    fresh.value = ''; // reset so the same file can be re-picked
  });
}

async function sharePhoto(file, r) {
  const text = buildBookingMessage(r);
  const title = 'KEEF — bike issue photo';

  // Web Share Level 2 (file sharing) — supported on iOS Safari, Chrome
  // Android, Edge. The user picks Mail / WhatsApp / Messages from the
  // native share sheet; the photo never touches our infrastructure.
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return; // user cancelled
      // fall through to fallback
    }
  }

  // Fallback: copy the booking note to clipboard, prompt the user.
  const phone = window.COUNTRY_CYCLES_PHONE || '01360 550 372';
  try { await navigator.clipboard.writeText(text); } catch (e) { /* noop */ }
  alert(
    "Your browser can't share files directly.\n\n" +
    'The booking note has been copied to your clipboard. ' +
    `Phone the shop on ${phone}, or email Country Cycles, attach your photo, and paste the note.`,
  );
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
    // Country Cycles takes appointments by phone — fall back to a tel: link
    // if no online booking URL is configured.
    if (url) window.location.href = url;
    else if (telHref) window.location.href = telHref;
  }
}

function start() {
  engine = new DiagnosticEngine();
  const q = engine.currentQuestion();
  show(screens.question);
  renderQuestion(q);
  $('restartBtn').hidden = false;
}

function restart() {
  engine = null;
  show(screens.home);
  $('restartBtn').hidden = true;
}

// ============== Wire up ==============
$('startBtn').addEventListener('click', start);
$('restartBtn').addEventListener('click', restart);
$('resultRestartBtn').addEventListener('click', restart);
$('notSureBtn').addEventListener('click', () => {
  if (!engine) return;
  engine.exitNotSure();
  renderResult(engine.result());
});

// Set the home keef sprite path (in case it needs the .png)
setKeefSprite($('homeKeefSprite'), 'wave');

// Wire the Instagram contact button — only shown if the URL has been
// populated (we ship with the literal placeholder 'ADD_INSTAGRAM_LINK').
(function wireInstagramBtn() {
  const btn = document.getElementById('instaBtn');
  if (!btn) return;
  const url = window.COUNTRY_CYCLES_INSTAGRAM_URL || '';
  const isPlaceholder = !url || url === 'ADD_INSTAGRAM_LINK';
  if (isPlaceholder) {
    btn.hidden = true;
  } else {
    btn.href = url;
    btn.hidden = false;
  }
})();

// Show home screen on load
show(screens.home);

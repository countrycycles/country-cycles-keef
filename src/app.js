// Country Cycles Killearn — KEEF
// Chat-style guided UX. KEEF speaks in bubbles, user replies via card buttons.

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
let lastReplayPose = 'wave';

// ---------- Screen transitions ----------

function show(screen) {
  for (const s of Object.values(screens)) s.hidden = true;
  screen.hidden = false;
  enter(screen);
  const heading = screen.querySelector('h1, h2, .chat__msg');
  if (heading && heading.focus) heading.focus({ preventScroll: false });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function enter(el) {
  el.classList.remove('is-entering');
  void el.offsetWidth;
  el.classList.add('is-entering');
  // Cascade onto the .actions row inside this screen too.
  const actions = el.querySelector('.actions');
  if (actions) {
    actions.classList.remove('is-entering');
    void actions.offsetWidth;
    actions.classList.add('is-entering');
  }
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

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---------- Question rendering ----------

function renderQuestion(q) {
  // Soundtrack: scan for drill-down magnify, soft blip for entry questions.
  if (q.keefPose === 'magnify')        keefSound.play(SOUNDS.SCAN);
  else if (q.keefPose === 'thinking')  keefSound.play(SOUNDS.UNSURE);
  else                                  keefSound.play(SOUNDS.QUESTION);

  $('questionHeading').textContent = q.text;
  setKeefSprite($('questionKeefSprite'), q.keefPose);
  lastReplayPose = q.keefPose;
  $('questionTime').textContent = nowHHMM();

  const path = $('questionPath');
  const label = pathLabel(q);
  if (label) { path.textContent = label; path.hidden = false; }
  else       { path.textContent = '';    path.hidden = true; }

  const help = $('questionHelp');
  if (q.helpText) { help.textContent = q.helpText; help.hidden = false; }
  else            { help.textContent = '';          help.hidden = true; }

  const optsEl = $('questionOptions');
  optsEl.innerHTML = '';

  const captureEl = $('questionCapture');
  captureEl.innerHTML = '';
  captureEl.hidden = true;
  pendingCapture = null;

  for (const opt of q.options) {
    optsEl.appendChild(makeAnswerCard(opt));
  }

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

function makeAnswerCard(opt) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'answer-card';
  if (opt.redFlag) btn.classList.add('answer-card--danger');

  const label = document.createElement('span');
  label.className = 'answer-card__label';
  label.textContent = opt.label;
  btn.appendChild(label);

  const arrow = document.createElement('span');
  arrow.className = 'answer-card__arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  btn.appendChild(arrow);

  btn.addEventListener('click', () => {
    btn.blur();
    handleAnswer(opt);
  });
  return btn;
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
  confirm.className = 'answer-card answer-card--primary';
  confirm.innerHTML = '<span class="answer-card__label">Continue</span><span class="answer-card__arrow"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>';
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

// ---------- Loading transition ----------

async function showResultWithLoading(r) {
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

// ---------- Result rendering ----------

function renderResult(r) {
  show(screens.result);
  setKeefSprite($('resultKeefSprite'), r.keefPose);
  lastReplayPose = r.keefPose;
  $('resultTime').textContent = nowHHMM();

  // Soundtrack tied to KEEF's pose so it always matches the visual register.
  if (r.keefPose === 'stop')              keefSound.play(SOUNDS.STOP);
  else if (r.keefPose === 'wrench_thumb') keefSound.play(SOUNDS.SUCCESS);
  else if (r.keefPose === 'idea')         keefSound.play(SOUNDS.TIP);
  else if (r.keefPose === 'thinking')     keefSound.play(SOUNDS.UNSURE);
  else                                    keefSound.play(SOUNDS.TIP);

  // The bubble carries the headline (KEEF's voice). The callout below
  // carries the verdict tag, body, and CTA.
  $('resultHeading').textContent = r.headline;

  const callout = $('resultCallout');
  callout.className = 'callout callout--' + r.tier.toLowerCase();

  const tag = $('resultCalloutTag');
  tag.textContent = calloutTag(r.tier);

  const icon = $('resultCalloutIcon');
  icon.innerHTML = calloutIcon(r.tier);

  $('resultBody').textContent = r.body;

  const action = $('resultAction');
  if (r.actionLine) { action.textContent = r.actionLine; action.hidden = false; }
  else              { action.textContent = '';            action.hidden = true; }

  const extra = $('resultExtra');
  if (r.ctaExtra) { extra.textContent = r.ctaExtra; extra.hidden = false; }
  else            { extra.textContent = '';          extra.hidden = true; }

  const cta = $('ctaBtn');
  const ctaLabel = $('ctaBtnLabel');
  if (r.ctaId === 'NONE' || !r.ctaLabel) {
    cta.hidden = true;
  } else {
    cta.hidden = false;
    cta.classList.toggle('answer-card--urgent', !!r.ctaUrgent);
    ctaLabel.textContent = r.ctaLabel;
    cta.onclick = () => handleCta(r.ctaId);
  }

  $('shortCaveat').textContent = shortCaveat();
  $('restartBtn').hidden = false;

  // "What you'll need" — only show for GREEN results that have gear listed.
  renderNeeds(r);

  // Instagram contact pill — only shown if the URL has been populated.
  const insta = $('resultInstaBtn');
  if (insta) {
    const url = window.COUNTRY_CYCLES_INSTAGRAM_URL || '';
    const isPlaceholder = !url || url === 'ADD_LINK' || url === 'ADD_INSTAGRAM_LINK';
    if (isPlaceholder) { insta.hidden = true; }
    else { insta.href = url; insta.hidden = false; }
  }
}

// Renders the "What you'll need" helper list. Only shown for GREEN results
// that have a `needs` array on their template (chain lube, puncture repair,
// tubeless top-up, shock pump). Quiet styling, never sales-driven.
function renderNeeds(r) {
  const section = $('resultNeeds');
  const list = $('needsList');
  list.innerHTML = '';
  const items = (r.tier === 'GREEN' && Array.isArray(r.needs)) ? r.needs : null;
  if (!items || items.length === 0) {
    section.hidden = true;
    return;
  }
  for (const item of items) {
    const li = document.createElement('li');
    const url = productUrl(item);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = item.label;
      a.appendChild(externalArrowSvg());
      li.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.textContent = item.label;
      li.appendChild(span);
    }
    list.appendChild(li);
  }
  section.hidden = false;
}

function externalArrowSvg() {
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.style.display = 'inline-flex';
  span.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';
  return span;
}

// Build a product URL for a needs-item.
//   1) item.url            — explicit product page (preferred)
//   2) custom URL builder  — window.COUNTRY_CYCLES_PRODUCT_URL_BUILDER
//   3) default search URL  — /search/<term-with-plus>/ pattern, matching
//                            country-cycles.com's actual search route
function productUrl(item) {
  if (item.url) return item.url;
  const builder = window.COUNTRY_CYCLES_PRODUCT_URL_BUILDER;
  if (typeof builder === 'function') return builder(item);
  const base = (window.COUNTRY_CYCLES_WEBSITE || 'https://www.country-cycles.com').replace(/\/+$/, '');
  const term = (item.search || item.label).trim().replace(/\s+/g, '+');
  return `${base}/search/${term}/`;
}

function calloutTag(tier) {
  if (tier === 'GREEN') return "YOU'RE SORTED";
  if (tier === 'AMBER') return 'WORKSHOP RECOMMENDED';
  return 'DO NOT RIDE';
}

function calloutIcon(tier) {
  if (tier === 'GREEN') {
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
  }
  if (tier === 'AMBER') {
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  }
  // RED
  return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5"/><path d="M12 18v.01"/></svg>';
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

// ---------- Replay buttons ----------

function wireReplayButtons() {
  document.querySelectorAll('.chat__replay').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const which = btn.dataset.replay;
      if (which === 'auto') {
        // Replay based on the most recent pose.
        if (lastReplayPose === 'stop')              keefSound.play(SOUNDS.STOP);
        else if (lastReplayPose === 'wrench_thumb') keefSound.play(SOUNDS.SUCCESS);
        else if (lastReplayPose === 'idea')         keefSound.play(SOUNDS.TIP);
        else if (lastReplayPose === 'thinking')     keefSound.play(SOUNDS.UNSURE);
        else if (lastReplayPose === 'magnify')      keefSound.play(SOUNDS.SCAN);
        else                                         keefSound.play(SOUNDS.QUESTION);
      } else if (SOUNDS[which]) {
        keefSound.play(SOUNDS[which]);
      }
    });
  });
}

// ---------- App lifecycle ----------

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
  $('homeTime').textContent = nowHHMM();
  keefSound.play(SOUNDS.HELLO);
  lastReplayPose = 'wave';
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

// Mute toggle
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

// Audio unlock on first user gesture
keefSound.unlockOnFirstGesture();

// Wire replay buttons in every chat bubble
wireReplayButtons();

// Initial paint
setKeefSprite($('homeKeefSprite'), 'wave');
$('homeTime').textContent = nowHHMM();
show(screens.home);

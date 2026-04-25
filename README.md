# KEEF — Country Cycles AI Mechanic

A static web app + PWA. KEEF asks a few quick questions, classifies the customer's bike fault into one of three tiers, and either reassures them, books them in, or stops them riding an unsafe bike.

- 🟢 **Green** — Safe simple check
- 🟡 **Amber** — Workshop recommended
- 🔴 **Red** — Do not ride. Contact Country Cycles.

No build step. Vanilla HTML / CSS / ES modules. Push to a GitHub Pages branch and it's live.

---

## Run locally

```bash
# from this directory
python3 -m http.server 8080
# then open http://localhost:8080
```

Or any other static server. The PWA / service worker requires HTTPS in production but works on `localhost` over HTTP for development.

---

## Deploy to GitHub Pages

1. Push this directory as the root of a GitHub repo (or a subfolder — see "subfolder" note below).
2. In **Settings → Pages**, set source to `Deploy from a branch`, branch `main`, folder `/ (root)` or `/web` (whichever matches).
3. Save. Pages will build and serve at `https://<user>.github.io/<repo>/`.
4. Verify the manifest icon shows up correctly when you "Add to Home Screen" on iOS Safari and Chrome Android.

**Subfolder note.** If the repo is *only* this app, push the `web/` contents at the repo root. If you keep the parent project structure, GitHub Pages can serve a subfolder — point Pages at `/web`.

A `.nojekyll` file is included so paths starting with `_` (like `_redirects`) are not stripped.

---

## Configure the contact CTAs

Open `index.html` and set:

```html
<script>
  window.COUNTRY_CYCLES_PHONE = '01360 550 022';
  window.COUNTRY_CYCLES_BOOKING_URL = 'https://countrycycles.co.uk/book';
</script>
```

Until you set these, the CTA buttons on result screens show a developer alert. After deploy:

- **Tier 3 (RED)** results call the phone number directly via `tel:` — works on mobile.
- **Tier 2 (AMBER)** results open the booking URL.
- Battery-thermal results add an extra "stop charging, isolate, don't take it indoors" message.

---

## Replace placeholder assets

| Path | Current | Replace with |
|---|---|---|
| `assets/keef/{wave,tablet,wrench_thumb,back_view,idea,thinking,magnify,stop}.png` | Artist's renders ✓ | (already in place) |
| `assets/icons/logo.svg` | SVG recreation of the AI Mechanic logo | Your master SVG export (optional) |
| `assets/icons/icon-192.png` | **missing** | 192×192 PNG export of the logo |
| `assets/icons/icon-512.png` | **missing** | 512×512 PNG export of the logo |

iOS Safari "Add to Home Screen" needs the PNG icons — SVGs aren't honoured. Export your AI Mechanic logo at 192 and 512 px and drop them in `assets/icons/`.

---

## File map

```
web/
├── index.html               Entry point. Hosts brand bar, three screens, footer.
├── styles.css               Brand styling. Mobile-first.
├── manifest.webmanifest     PWA install metadata.
├── sw.js                    Service worker — offline cache.
├── .nojekyll                Tell GitHub Pages not to run Jekyll.
├── assets/
│   ├── icons/
│   │   └── logo.svg         AI Mechanic logo (PWA fallback).
│   └── keef/                The eight artist-rendered KEEF poses (PNG).
└── src/
    ├── app.js               UI layer. Drives the engine.
    └── triage/
        ├── content.js       Caveats, CTAs, 50+ result templates.
        ├── escalation.js    Bike-type modifiers, hard red flags, score thresholds.
        ├── tree.js          The 46-question tree.
        └── engine.js        Stateful walker.
```

---

## Mandated wording

The strings in `src/triage/content.js → CAVEATS` are mandated by the brief and must be rendered verbatim. The phrase **"in-store team"** is the correct spelling — the build pipeline must include a test that fails if `"inshore"` appears anywhere in user-facing output.

```js
// Suggested test (Vitest / Jest):
import { CAVEATS, RESULT_TEMPLATES } from '../web/src/triage/content.js';

test('no "inshore" — must always be "in-store"', () => {
  const all = [
    CAVEATS.long, CAVEATS.short,
    ...Object.values(RESULT_TEMPLATES).flatMap((t) => [t.headline, t.body, t.actionLine]),
  ].join(' ').toLowerCase();
  expect(all).not.toContain('inshore');
  expect(CAVEATS.long).toContain('in-store team');
  expect(CAVEATS.short).toContain('in-store team');
});
```

---

## Editing the tree

Adding a question:

1. Add it to `QUESTIONS` in `src/triage/tree.js` with a unique ID. Convention: `CATEGORY_NN`.
2. Reference it from another question's option via `next: 'YOUR_ID'`, or from the bootstrap symptom-area router.
3. Each option must point to either `next` (another question) or `result` (a terminal trigger). Never both.
4. Mark safety-critical options with `redFlag: true` — this hard-escalates regardless of running risk score.

Adding a result template:

1. Add to `RESULT_TEMPLATES` in `src/triage/content.js`.
2. Match the template's tier to the headline/body voice (GREEN: chatty, AMBER: practical, RED: blunt).
3. Pick a `keefPose` matching the tier (`stop` is RED-only, `wrench_thumb` is GREEN-only, etc.).
4. Reference the template ID from a tree option.

---

## Safety architecture

Three layers stack from most to least authoritative:

1. **Hard red flags** — any option with `redFlag: true` immediately forces RED.
2. **Bike-type modifiers** — kids bikes floor at AMBER for brakes/wheels and RED for steering; e-bikes floor at AMBER for electrics. Risk multipliers also apply.
3. **Default-to-RED for safety-critical categories** (`BRAKES`, `HEADSET_STEERING`, `EBIKE_ELECTRICS`) — a GREEN trigger is upgraded to AMBER if the running risk score climbed during the path.

Score-based floor (`tierFromScore`) catches edge cases.

---

## What KEEF will never do

- Diagnose with certainty. Triage only. The in-store team diagnoses.
- Give torque values, bleed procedures, suspension service steps.
- Interpret e-bike error codes. Codes are captured + routed to workshop.
- Advise opening any e-bike battery, motor, controller, or display housing.
- Override the default-to-RED rule because the customer wants to keep riding.

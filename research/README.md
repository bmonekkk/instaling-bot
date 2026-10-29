# `research/anti-detection`

Working branch for "how could instaling.pl detect this bot, and what can we do
about it". The full write-up is in [`ANTI_DETECTION.md`](ANTI_DETECTION.md).

## Contents

| File | What it is |
|---|---|
| `ANTI_DETECTION.md` | Findings, ranked detection vectors, measurements, recommendations |
| `fingerprint-baseline.json` | Raw Puppeteer: 13/15 checks pass (webdriver, UA-CH brands fail) |
| `fingerprint-stealth.json` | Bot defaults: 15/15 (headed) |
| `fingerprint-stealth-headless.json` | Bot defaults: 15/15 (headless, after the UA rewrite) |

## Reproduce

```bash
node scripts/fingerprint-audit.js --baseline
node scripts/fingerprint-audit.js
node scripts/fingerprint-audit.js --headless
```

Logged-in recon (needs an account; stops before answering anything):

```bash
INSTALING_LOGIN=... INSTALING_PASSWORD=... npm run audit:session
npm run audit:session -- --manual     # type the password yourself
npm run audit:session -- --start      # also capture the first question
```

Output lands in `research/session-recon/` and is gitignored.

## Code added in this branch

- `src/core/stealth.js` — launch flags + pre-load page patches, `hideHeadlessUA()`
- `src/core/timing.js` — right-skewed `humanDelay()`, `distractionPause()`
- `scripts/fingerprint-audit.js` — 15-check browser audit, headed/headless
- `scripts/session-recon.js` — logged-in request/storage/form capture
- `test/stealth.test.js`, `test/timing.test.js`

## Not done on purpose

No UA spoofing on headed runs, no TLS/JA3 shaping, no extra fingerprint patches.
The site has no fingerprinting stack; more overrides would add risk without
addressing the signal that actually matters (pacing). See §8 of the write-up.
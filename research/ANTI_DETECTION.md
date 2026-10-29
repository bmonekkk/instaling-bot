# How instaling.pl could detect the bot — and what we can do about it

Research branch: `research/anti-detection`
Date: 2026-10-29
Author: automated audit of the live site + the bot's own fingerprint

---

## TL;DR

1. **There is no technical anti-bot system on instaling.pl.** No CAPTCHA on login or
   registration, no Cloudflare/DataDome/Akamai in front of the app, no reCAPTCHA,
   no device fingerprinting script, no `navigator.webdriver` check, and no lockout or
   rate-limit response on a failed login. The server is plain nginx + PHP with a
   `PHPSESSID` cookie.
2. **The realistic detection surface is statistical, not technical.** The site is
   server-rendered, so every "check" is a full request. That means the server knows
   the exact time between serving a question and receiving the answer — and it can
   aggregate that into session length and pace. That data is the real tell.
3. **The reports teachers and parents see are about regularity and mastery, not
   timing.** The official FAQ says the report "pokazuje tylko liczbę sesji
   ukończonych" (shows only the number of completed sessions) and that incomplete
   sessions are not shown at all. So a too-fast session is not flagged automatically.
4. **Our current pace is ~2× faster than the site's own benchmark.** InstaLing says
   a session takes "około 5 minut". With the 4.3.1 defaults the bot finishes 20
   words in about 2.5–2.7 minutes (8.2 s/word). That is the single most noticeable
   discrepancy we have, and it is fixable with configuration, not stealth code.
5. **Fingerprint-level hiding is already good and got better in this branch.** The
   new `src/core/stealth.js` takes the browser from 13/15 to 15/15 on a local
   detection battery, including headless mode.

The honest conclusion: for this specific site, "fighting detection" is mostly
**pacing and plausibility**, not defeating a fingerprinting stack. The work below
covers both, but weights them accordingly.

---

## 1. Method

All findings are reproducible from this branch:

```bash
node scripts/fingerprint-audit.js --baseline   # raw Puppeteer, no patches
node scripts/fingerprint-audit.js              # bot defaults (stealth on)
node scripts/fingerprint-audit.js --headless   # headless variant
node scripts/session-recon.js                  # logged-in recon (needs creds)
```

Public-site evidence was collected with plain HTTPS requests (no account):
login page, registration page, FAQ, "how it works", blog and the student-panel
announcement. The logged-in session page is behind auth, so the exact answer
endpoint is captured by `session-recon.js` when credentials are available; the
analysis below marks what is verified vs. inferred.

---

## 2. What InstaLing actually runs (verified)

| Property | Observation | Source |
|---|---|---|
| Server | `Server: nginx`, PHP session cookie | response headers |
| Session cookie | `PHPSESSID`, `Max-Age=432000` (5 days), `path=/` | `Set-Cookie` |
| CAPTCHA | none on login or registration | HTML scan |
| CSRF token on login | none — only `action`, `from`, `is_quick` hidden fields | login form |
| Failed login | `302 → teacher.php?page=login`, generic redirect, no lockout / no `Retry-After` | one bogus POST |
| Security headers | no CSP, no HSTS, no `X-Frame-Options`, no `Referrer-Policy`, no `Permissions-Policy` | response headers |
| Third-party JS (public pages) | Google Tag Manager `UA-3314888-13`, `tags.refinery89.com`, Google Funding Choices | HTML |
| Bot-detection JS | none found (no fingerprinting, no challenge script) | HTML scan |
| Page model | server-rendered PHP; a real navigation after "check" and "next" | bot engine + `PROJECT_NOTES.md` |
| Grading model | "oceniana jest systematyczność, a nie poprawność odpowiedzi" | official blog |
| Reports | "raport systematyczności pokazuje tylko liczbę sesji ukończonych"; incomplete sessions are hidden | official FAQ |
| Session length | "około 5 minut" / "od kilku do kilkunastu minut" | FAQ + "Jak to działa" |

**Interpretation.** Everything that could fingerprint a browser is absent. What the
server does have is the raw request log: when a question was served, when the
answer arrived, whether the session reached the summary screen.

---

## 3. Detection vectors, ranked for this site

| # | Vector | What the site could see | Realistic for InstaLing? | Can we fight it? |
|---|---|---|---|---|
| 1 | **Per-answer latency** | time between question request and check request | **High** — it is free to compute from normal logs | Partly: shape the distribution (done) |
| 2 | **Session duration / pace** | total time, words per minute | **High** — trivially derivable | Yes: configure a realistic pace (§6) |
| 3 | **Completion pattern** | whether the summary screen was reached | High, but it is what the product rewards | No need — the bot completes sessions |
| 4 | **Correctness pattern** | per-word right/wrong history, mastery estimate | Medium — it drives the revision scheduler | Partly: correlate answers with word history |
| 5 | **Browser fingerprint** | `navigator.webdriver`, plugins, UA-CH brands, headless UA | **Low** — no script appears to read it | Yes: `src/core/stealth.js` (done) |
| 6 | **Request headers / TLS** | header order, JA3/JA4, HTTP/2 settings | Low — no WAF in front | No (and not worth it) |
| 7 | **IP / account** | same IP for many accounts, concurrent sessions | Medium, but manual | Out of scope |
| 8 | **Missing human signals** | no audio plays, no hints, no idle time | Low (not obviously logged) | Partly: idle pauses (done) |

The important shift: vectors 1–4 are *behavioural*, and they are computed from
traffic the site already receives. Vectors 5–7 are the ones people usually mean by
"anti-bot", and on this site they barely exist.

---

## 4. Measured browser fingerprint

Local battery of 15 checks (`scripts/fingerprint-audit.js`). It runs against a
localhost origin so secure-context APIs (`userAgentData`, `permissions`) behave
like they do on HTTPS.

| Check | Baseline (raw Puppeteer) | Stealth (this branch) |
|---|---|---|
| `navigator.webdriver` not true | ❌ `true` | ✅ `undefined` |
| getter source looks native | ✅ | ✅ `function get webdriver() { [native code] }` |
| getter on `Navigator.prototype` | ✅ | ✅ |
| UA has no `HeadlessChrome` | ✅ (headed) | ✅ |
| UA-CH brands include Google Chrome | ❌ `Not:A-Brand,Chromium` | ✅ `Google Chrome,Chromium,Not_A Brand` |
| Polish languages advertised | ✅ | ✅ |
| PDF viewer plugin present | ✅ (5) | ✅ |
| Notification permission consistent | ✅ | ✅ |
| `window.chrome` present | ✅ | ✅ |
| WebGL is a real GPU path | ✅ | ✅ |
| non-zero outer window | ✅ | ✅ |
| `document.hasFocus()` | ✅ | ✅ |
| no ChromeDriver globals | ✅ | ✅ |
| plausible `hardwareConcurrency` | ✅ | ✅ |
| mouse click is trusted | ✅ | ✅ |
| **Total** | **13/15** | **15/15** |

Headless mode initially failed the UA check (`HeadlessChrome/156…`). `hideHeadlessUA()`
now rewrites the header at the browser level before the first navigation, so headless
also reaches **15/15** on this battery. The JSON reports are in `research/`.

### What is still detectable even with the patches

Be explicit about the limits:

- **The binary is Chrome for Testing**, not Google Chrome. Some properties (update
  channel, component versions) can differ. We align the UA-CH brands, which is the
  cheap part; a determined fingerprinter could look deeper.
- **No TLS/JA3/JA4 or HTTP/2 fingerprint shaping.** Out of scope, and a WAF would be
  needed for it to matter.
- **`Function.prototype.toString` is patched** when hardening is on. Badly written
  shims are themselves detectable; ours only rewrites marked functions and reports
  itself as native, but it is still a deviation from a clean page.
- **Blocked trackers** (gtag, refinery89, Funding Choices) mean fewer requests than a
  default browser sends. Ad/tracker blockers are common, so this looks like normal
  noise rather than a red flag.
- **No mouse movement** between clicks. Clicks are real CDP input events
  (`isTrusted: true`), but the cursor teleports. A site that logs `mousemove` would
  notice the absence; nothing suggests instaling does.

---

## 5. The real tell: pacing

### Current defaults (4.3.1), measured with the new right-skewed sampler

| Pause | Range | Mean |
|---|---|---|
| think before typing | 1500–4000 ms | 2624 ms |
| review after correct | 500–1200 ms | 815 ms |
| review after mistake / new word | 2500–5500 ms | 3849 ms |
| nav / next | 2000–4500 ms | 3124 ms |
| typing, 7-char word | 90–230 ms/char | ~950 ms |

Per word (correct answer): **~7.6 s**.
Session estimate: **20 words ≈ 2.5 min**, 30 words ≈ 3.8 min.

InstaLing's own documentation says a session is "około 5 minut", and "od kilku do
kilkunastu minut". So the bot sits at or below the bottom of the normal band.

### Why uniform delays were a problem

Before this branch, every pause was `getRandomInt(min, max)` — a flat distribution.
Real answer times are right-skewed: many quick answers, a long tail of hesitations.
A flat distribution has no tail and a suspiciously stable mean. `humanDelay()` now
samples an inverse triangular distribution with its peak at 35 % of the range.

### Proposed "realistic" preset

| Pause | Current | Realistic |
|---|---|---|
| think | 1500–4000 | 2500–6000 |
| review correct | 500–1200 | 900–2200 |
| review mistake | 2500–5500 | 3000–7000 |
| nav | 2000–4500 | 2500–5500 |
| typing | 90–230 ms/char | 110–260 ms/char |

Measured: **~11.3 s/word → 20 words ≈ 3.8 min, 30 words ≈ 5.7 min.**
That lands squarely inside the site's stated range without feeling broken.

This is a configuration change, not a code change. We did **not** make it the default:
it nearly doubles the time users wait. It should be a deliberate choice (a "realistic
pace" toggle) rather than a silent regression. Recommendation in §8.

### Distraction pauses

`distractionPause()` adds a rare longer pause (default 2 % chance, 8–30 s) on top of
the "think" delay. This gives the session a human tail. It is wired into desktop and
the mobile engine, and configurable via `delays.distraction_*`.

---

## 6. What this branch implements

| File | What it does |
|---|---|
| `src/core/stealth.js` | Launch flags + pre-load page patches: `webdriver`, languages, UA-CH brands, plugins, Notification/permissions consistency, `window.chrome`, native-looking patched getters. Also `hideHeadlessUA()`. |
| `src/core/timing.js` | `humanDelay()` (right-skewed triangular) and `distractionPause()`. |
| `src/main.js` | Uses the shared stealth launcher and the new timing for think/review/nav. |
| `src/helpers.js` | Covered-button fallback now removes the overlay from hit-testing and retries a real CDP click, so `isTrusted` stays `true` instead of dropping to a DOM `.click()`. |
| `mobile/engine/engine.js` | Same timing model for Android/iOS/userscript. |
| `config/Config.defaults.json` | Adds `distraction_chance`, `distraction_min`, `distraction_max`. |
| `scripts/fingerprint-audit.js` | Reproducible 15-check browser audit, baseline vs stealth, headed vs headless. |
| `scripts/session-recon.js` | Logged-in recon: request/response log, storage, form fields, script list, and `isTrusted` for clicks/keys/inputs. Never answers a question. |
| `test/stealth.test.js`, `test/timing.test.js` | Coverage for the launcher, UA rewrite, timing bounds/skew and distraction behaviour. |

Browser stride: 89 tests pass, `npm run check` clean.

---

## 7. Using the logged-in recon

Without credentials we could not inspect the post-login pages (the session page is
behind auth). `session-recon.js` closes that gap and is safe by design: it stops
before answering, so it cannot submit wrong answers to the account.

```bash
# credentials from env or config/Config.json
INSTALING_LOGIN=... INSTALING_PASSWORD=... npm run audit:session

# or type the password yourself in the opened window
npm run audit:session -- --manual

# also open one session and capture the first question (still no answer)
npm run audit:session -- --start
```

It writes to `research/session-recon/` (gitignored) with passwords redacted:

- `report.json` — every request (method, URL, type, POST body), responses, cookies,
  navigations;
- `dashboard.json` / `session.json` — localStorage, sessionStorage, form fields
  (including hidden inputs such as CSRF tokens), script URLs, `performance` resources;
- `*.html` / `*.png` — snapshots.

What to look for in `report.json`:

1. the **check endpoint** and exactly what it POSTs (word id, answer, token?),
2. whether **CSRF tokens** rotate per question,
3. whether the page calls any **analytics or session-recording** endpoint we did not
   know about,
4. the **question page timestamp** relative to the check request — that is the
   latency the server can measure,
5. whether `isTrusted` is `false` anywhere (it would mean a DOM-level click leaked).

---

## 8. Recommendations (in order of impact)

1. **Offer a "realistic pace" preset** that targets ~10–12 s/word. This is the only
   change that addresses the strongest signal. Keep the current defaults for people
   who value speed.
2. **Keep distraction pauses on** (2 %, 8–30 s). Cheap, invisible to the user, and it
   removes the "perfectly bounded" look.
3. **Do not add more fingerprint patches.** The site has no fingerprinting; each extra
   override is more risk than benefit. The current 15/15 is enough.
4. **Make correctness depend on word history**, not a fresh coin flip per word. A word
   the bot has answered correctly before should stay correct; a brand-new word is more
   likely to be missed. This matches how the scheduler models mastery and removes an
   obvious statistical flatness. Not implemented yet — it needs the saved-words history
   in the answer path.
5. **Run `session-recon` once with a real account** to confirm (or rule out) a
   server-side timing/CSRF check before doing anything more complex.
6. **Do not spoof the UA string on headed runs.** The real UA is already correct and
   consistent with the actual binary; a fake UA would create a mismatch with UA-CH.

---

## 9. Bottom line

InstaLing is not trying to catch bots. It is a school vocabulary tool whose
anti-cheating model is "the teacher looks at whether the student did five sessions
this week". The project's realistic risk is not a fingerprint check — it is a session
that completes in two minutes while every other student takes five to ten.

So the highest-value work is the boring part: realistic pacing, a right-skewed time
distribution, and occasional idle time. The fingerprint layer is now clean and
reproducible, but it is table stakes, not the main defence.
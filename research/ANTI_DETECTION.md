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
2. **The realistic detection surface is statistical, not technical.** The session app
   (`/app/session/`) is a jQuery/AJAX front end that talks to PHP endpoints. `save_answer`
   carries no client timestamp, so the server times the request itself and can
   reconstruct every pause. That data is the real tell, and the exact endpoint map is
   in [`SESSION_API.md`](SESSION_API.md).
3. **The reports teachers and parents see are about regularity and mastery, not
   timing.** The official FAQ says the report "pokazuje tylko liczbę sesji
   ukończonych" (shows only the number of completed sessions) and that incomplete
   sessions are not shown at all. So a too-fast session is not flagged automatically.
4. **Our current pace sits at the fast end of plausible.** InstaLing says a session
   takes "około 5 minut", but a strong student can finish in under two. With the 4.3.1
   defaults the bot finishes 20 words in about 2.5–2.7 minutes (8.2 s/word) — believable
   for a good student on familiar words, less so for a brand-new set. The real risk is
   not raw speed but **consistency**: the same tidy pace every day plus high accuracy.
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
announcement. The logged-in part was captured with `session-recon.js` on a real
student account; the sanitised result is in [`SESSION_API.md`](SESSION_API.md) and
the raw capture stays in the gitignored `research/session-recon/`.

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
| Page model | student panel + a separate AJAX session app (`/app/session/app.php`); `generate_next_word` → `save_answer` → next | logged-in recon |
| Session API | `init_session`, `generate_next_word`, `save_answer`, `getAudioUrl`, `grade_report`, `save_comment` | logged-in recon |
| CSRF on answers | none; `save_answer` sends only `child_id`, `word_id`, `answer`, a hard-coded `version` | logged-in recon |
| Client timestamp | only on `generate_next_word` (`date`); `save_answer` has none, so the server times it | logged-in recon |
| Answer grading | codes 1 correct, 2 synonym, 3 wrong case, 4 typo, else wrong | inline JS + recon |
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

## 7. Logged-in recon result

The recon ran on a real student account. Full endpoint map: [`SESSION_API.md`](SESSION_API.md).

What matters for detection:

- **The session app is AJAX.** `generate_next_word.php` returns a word, `save_answer.php`
  receives `{child_id, word_id, answer, version}`, then the client asks for the next
  word. There is no page reload to hide behind.
- **`save_answer` has no client timestamp.** The server times the request itself, so
  the interval it measures is genuine.
- **There is no per-session token.** `version` is a hard-coded constant
  (`C65E24B2…`), the same for every user and request; `child_id` is in the URL. No
  nonce rotates. This is the same weakness the old direct-POST bots exploited.
- **The server can reconstruct both pauses exactly:**

  ```
  think + typing = t(save_answer)            - t(generate_next_word)
  review         = t(next generate_next_word) - t(save_answer)
  ```

  Those are precisely the three ranges the bot configures.
- **Grade 4 is "Literówka"** (one wrong letter or two neighbours swapped) and is shown
  in blue, not red. A deliberate misspelling is therefore recognised as a typo, not a
  wrong answer. The bot currently compares strings, so it treats that case as a mistake
  and applies the long review pause even though the page says "Literówka".
- **Real clients fetch audio** (`getAudioUrl.php` → `/mp3/...`). The bot drives the real
  page, so it does too.
- **No bot-detection code appears in any loaded script.** The only client telemetry is
  Google Analytics, Funding Choices, refinery89 and `uptimiarum.eu` (RUM).

`isTrusted` was `true` for the one click the recon performed (session start); the bot's
CDP clicks and `page.type` keystrokes are trusted as well.

### Why were accounts banned before, then?

The user reports that InstaLing has blocked accounts that used older automators. That
is consistent with everything above — the detection just isn't client-side:

1. **Direct API use.** Many old bots skipped the UI and POSTed `save_answer` with
   `child_id`/`word_id` directly. That produces no `generate_next_word`, no
   `getAudioUrl`, no asset loads, and an impossible request order. Easy to spot
   server-side.
2. **Timing.** `save_answer` arriving 200 ms after `generate_next_word`, every single
   time, is a signature. This is the one that matters for us.
3. **Protocol fingerprint.** A stale `version` constant, missing `child_id`, or a
   different User-Agent between requests.
4. **Account-level correlation.** The same IP or device pattern across several
   accounts, concurrent sessions, or identical answer sequences.
5. **Manual reports.** A teacher or parent noticing a 100 % score and a two-minute
   session, then mailing support. The FAQ already has an entry about parents "helping"
   with answers.

Our bot avoids 1, 3 and the asset/order part of 2 because it drives the real UI. What
remains is **timing and plausibility** — exactly the section above.

---

## 8. Recommendations (in order of impact)

1. **Offer a "realistic pace" preset** that targets ~10–12 s/word. This is the only
   change that addresses the strongest signal. Keep the current defaults for people
   who value speed.
2. **Vary the session length, not just the per-word delay.** A bot that always takes
   exactly four minutes is its own pattern. Aim for most sessions in the 3–6 minute
   band with a long tail: an easy repeat set can finish in ~2 minutes, a distracted
   day can take 8–10. The right-skewed sampler plus distraction pauses already push in
   that direction; a per-session multiplier would finish the job.
3. **Keep distraction pauses on** (2 %, 8–30 s). Cheap, invisible to the user, and it
   removes the "perfectly bounded" look.
4. **Read the grade, not the string.** The site returns grade `4` for a typo and shows
   it in blue; the bot currently treats it as a full mistake and waits 2.5–5.5 s. Using
   the visible result (`#answer_result`) to pick the short or long review pause keeps
   the bot's behaviour consistent with what the page displays.
5. **Make correctness and speed depend on word history.** A word answered correctly
   before should stay correct and be answered faster; a brand-new word should be slower
   and more likely to be missed. This matches how the scheduler models mastery and
   removes the obvious statistical flatness of an independent coin flip per word.
   Needs the saved-words history in the answer path — not implemented yet.
6. **Do not add more fingerprint patches.** The site has no fingerprinting; each extra
   override is more risk than benefit. The current 15/15 is enough.
7. **Do not spoof the UA string on headed runs.** The real UA is already correct and
   consistent with the actual binary; a fake UA would create a mismatch with UA-CH.

---

## 9. Bottom line

InstaLing is not trying to catch bots in the browser. It is a school vocabulary tool
whose anti-cheating model is "the teacher looks at whether the student did five sessions
this week". The bans that did happen are best explained by server-side request analysis
and manual reports, not by a fingerprint check.

A four-minute session is a safe target, but it should not be a fixed four minutes: a
strong student legitimately finishes in under two, and a distracted one takes ten. What
stands out is a *uniform* pace, perfect accuracy and a brand-new word set answered as
fast as a repeat set.

So the highest-value work is the boring part: a human-shaped time distribution, session
lengths that vary, and speed/accuracy that correlate with familiarity. The fingerprint
layer is now clean and reproducible, but it is table stakes, not the main defence.
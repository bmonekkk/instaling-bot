# instaling-bot — project notes / developer handoff

Short, practical overview of what this project is, how it works, and what to do next.

## What it is

A Node.js CLI bot that uses Puppeteer (real Chrome) to:

1. log in to `instaling.pl`,
2. start/continue a vocabulary session,
3. answer the questions,
4. remember correct translations in a local JSON file.

It is **not** an official InstaLing tool. Educational project, ISC license, use at your own risk.

## Where everything lives

| Thing | Location |
|---|---|
| Local repo | `E:\Files\OpenCode\instaling-bot` |
| Your fork | https://github.com/Bmoneczek/instaling-bot |
| Upstream | https://github.com/PanSzelescik/instaling-bot |
| Latest release | https://github.com/Bmoneczek/instaling-bot/releases/latest (v2.2.0) |
| Landing page | https://bmoneczek.github.io/instaling-bot/ |
| Remote `origin` | upstream repo |
| Remote `fork` | your fork |

## Stack

- Node.js 22+ (tested on 26)
- Puppeteer 25 (`puppeteer` downloads Chrome for Testing)
- CommonJS (`require`), no build step, no TypeScript
- `chalk` (console colors) — the only runtime dependency besides Puppeteer
- No database — words are a JSON array

## File map

```
src/
  main.js       entry point: launch browser, login, session, answer loop, window patch
  helpers.js    DOM helpers: selectors, click/type, human typing, delays, cookie consent, diagnostics
  config.js     loads Config.json, normalizes credentials
  words.js      SavedWords.json lookup/save (local file only)
  printer.js    console logging helpers
config/
  Config.json             real config (gitignored, contains credentials)
  Config.defaults.json    template committed to git
  SavedWords.json         learned words (gitignored)
  SavedWords.defaults.json
docs/           GitHub Pages landing page (index.html, robots.txt, sitemap.xml)
pages/          HTML dumps from the last run (gitignored, diagnostics)
screenshots/    PNG dumps from the last run (gitignored, diagnostics)
```

## Runtime flow

```
npm start
  └─ main.js
      ├─ canLogin()                     credentials present?
      ├─ start()
      │   ├─ patch child_process.spawn  Windows: make Chrome window visible
      │   ├─ puppeteer.launch()         headful if show_browser=true
      │   ├─ block ad/consent hosts     request interception
      │   └─ stealth tweaks             remove --enable-automation, hide webdriver
      ├─ login()
      │   ├─ goto login page
      │   ├─ dismissConsent()           Google Funding Choices overlay
      │   ├─ typeExact()                fast credentials + value check
      │   ├─ click submit + wait nav
      │   ├─ retry once if the site rejects the submit
      │   └─ detect "login failed" text / login URL
      ├─ startSession()
      │   ├─ close streak popup (optional, quickClick)
      │   ├─ click start-session button (short nav timeout)
      │   ├─ continue old session OR start new one
      │   └─ wait for answer/new-word form
      ├─ loop: answerQuestion()
      │   ├─ read usage example + Polish translation
      │   ├─ getWord() from SavedWords.json
      │   ├─ if new-word screen → "don't know" → reveal answer → next
      │   ├─ else typeHuman() the saved translation (respects valid_chance)
      │   ├─ if valid_chance fails → typeHuman() a plausible misspelling
      │   ├─ click check, read correct answer (fallback to known translation)
      │   ├─ insertWord() if it was new
      │   └─ click next word
      └─ handleStop()
          ├─ return to main page (optional)
          ├─ saveWords()
          ├─ close browser
          └─ exit
```

The loop ends when an expected element disappears (session finished), when `max_answers` is reached, or on an error. Each step saves `pages/answer-N.html` and `screenshots/answer-N.png`.

## The important fixes (don't regress these)

1. **Cookie consent overlay** — Google Funding Choices renders a dialog over the login form. `fundingchoicesmessages.google.com` is blocked, and `dismissConsent()` clicks `.fc-cta-do-not-consent` as a fallback.
2. **Windows hidden window** — Puppeteer hardcodes `windowsHide: true` in `@puppeteer/browsers`. `src/main.js` monkey-patches `child_process.spawn` before requiring Puppeteer so Chrome appears in the taskbar when `show_browser` is true.
3. **Selectors change** — never rely on one selector. `SELECTORS` in `main.js` holds arrays; `findSelector()` returns the first match.
4. **`isVisible()` semantics** — must return `true` when visible. An older fork had this inverted.
5. **Saved words path** — always relative to project root (`ROOT` in `helpers.js`), not to `process.cwd()`.
6. **Config compatibility** — `src/config.js` accepts both `credentials.login/password` and old top-level `login/password`.
7. **Login reliability** — credentials use `typeExact()` (fast, verified, direct-value fallback), and a rejected submit is retried once. Do not replace it with the humanized typer.
8. **Typo results** — for a "Literówka" result InstaLing may leave `#word` empty. `answerQuestion()` falls back to the translation it already knows instead of throwing.
9. **Navigation clicks** — `clickAndWait()` is called with a short timeout (2.5 s) for session buttons; the following `findSelector()` waits for the real content. Do not restore the old 8–15 s waits.

## Config cheat sheet

```jsonc
{
  "credentials": { "login": "...", "password": "..." },
  "delays": {
    "click_min": 3500, "click_max": 6500,
    "type_min": 90, "type_max": 230,
    "type_pause_chance": 0.12,
    "type_pause_min": 250, "type_pause_max": 700,
    "typo_chance": 0.15,
    "quick_click_min": 120, "quick_click_max": 300,
    "selector": 15000,
    "check_min": 3000, "check_max": 5500,
    "next_word_min": 2000, "next_word_max": 4500
  },
  "valid_chance": 0.8,      // 0.8 = 80% correct, 1 = always correct
  "max_answers": 0,         // 0 = unlimited
  "show_browser": true,
  "mute_audio": true,
  "window_width": 1366,
  "window_height": 900,
  "debug": false
}
```

- Raising delays = slower and less aggressive.
- `max_answers: 1` is the fastest safe way to test a change.
- `type_min` / `type_max` are per character. `typo_chance` simulates a wrong key + Backspace and is verified afterwards.
- `valid_chance` failures now type a plausible misspelling instead of leaving the field empty.
- The canonical template is `config/Config.defaults.json`; there is no remote word database anymore.

## Common tasks

```bash
npm start                 # run
npm run check             # syntax check only
npx puppeteer browsers install chrome   # if Chrome is missing
```

**Publish a change:**

```bash
git add -A
git commit -m "..."
git push fork master
gh release create vX.Y.Z --repo Bmoneczek/instaling-bot --target master \
  --title "vX.Y.Z - ..." --notes-file .github/RELEASE_NOTES_vX.Y.Z.md
```

**Debug a changed website:**

1. set `"debug": true`
2. set `"max_answers": 1`
3. run, then inspect `pages/answer-*.html` and `screenshots/`
4. add/adjust selectors in `SELECTORS` in `src/main.js`
5. add the new case to `CHANGELOG.md`

## Known limitations

- Selectors are tied to the current HTML; InstaLing can change them any time.
- Detection is never guaranteed — no amount of delay makes a bot invisible.
- Single account, single run, no scheduling.
- Words are flat JSON, no dedupe beyond normalizing text.
- Humanization reduces obvious patterns but cannot guarantee the bot is undetectable.
- Uses Chrome for Testing, not the user's installed Chrome.
- No tests yet (only `node --check`).

## Ideas for the desktop app

Recommended path: **Electron + the existing `src/` engine**, or **Tauri** if you prefer a small Rust shell.

Suggested structure:

```
core/            ← current logic, framework-agnostic (EventEmitter)
  browser.js     launch/close, window fix
  session.js     login/start/answer
  words.js
  config.js
ui/              ← Electron renderer (HTML/CSS/JS or React)
main/            ← Electron main process, IPC bridge
```

Features that make sense for an app:

- GUI for credentials, delays, `valid_chance`, `max_answers`
- Humanization controls: per-letter delay, typo chance, pause chance, quick-click speed
- Start / pause / stop buttons + live log panel
- Progress bar (answered / remaining), next-word preview
- Tray icon, minimize while running
- Encrypted credential storage (Windows Credential Manager / `keytar`)
- SQLite for words instead of JSON, with import/export and search
- Session history and statistics
- Auto-update (`electron-updater`) and a signed installer
- PL/EN interface
- Keep the cookie fix and Windows window fix; add regression tests using saved HTML fixtures instead of hitting the live site
- Refactor `answerQuestion()` to emit events (`word`, `answer`, `saved`, `finished`) so the UI can consume them

Before building the app, separate the engine from the CLI: `src/main.js` currently mixes launch, flow, logging and shutdown. Moving it into a class with injectable config/logger will make Electron integration much easier.

## Starter prompt for a new session

Copy this into a new chat:

> Project: `E:\Files\OpenCode\instaling-bot` (fork of PanSzelescik/instaling-bot, v2.2.0).
> Read `PROJECT_NOTES.md`, `README.md`, `src/main.js`, `src/helpers.js`, `src/config.js` first.
> Current state: CLI works on Windows with Puppeteer 25; cookie consent is blocked/dismissed; the Windows hidden-window bug is patched; typing is humanized (random per-letter delays, simulated typos with Backspace) and login is fast/verified with one retry; delays are configurable.
> Goal: turn the CLI into a desktop app (Electron or Tauri) with a GUI for credentials/settings, start/stop, live logs and progress. Keep backwards compatibility with `config/Config.json` and do not regress the cookie or window fixes.
> Work on a feature branch, test with `"max_answers": 1`, update `CHANGELOG.md`, and prepare a release.

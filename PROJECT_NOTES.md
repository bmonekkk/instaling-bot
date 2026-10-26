# instaling-bot — project notes / developer handoff

Short, practical overview of what this project is, how it works, and what to do next.

## What it is

A desktop app **and** a Node.js CLI bot that use Puppeteer (real Chrome) to:

1. log in to `instaling.pl`,
2. start/continue a vocabulary session,
3. answer the questions,
4. remember correct translations in a local JSON file.

The desktop app wraps the existing engine in Electron and bundles Chrome for Testing. The CLI remains fully supported, especially for Linux and terminal users. Both share `src/`, the config format and `SavedWords.json`.

It is **not** an official InstaLing tool. Educational project, ISC license, use at your own risk.

## Where everything lives

| Thing | Location |
|---|---|
| Local repo | `E:\Files\OpenCode\instaling-bot` |
| Your fork | https://github.com/Bmoneczek/instaling-bot |
| Upstream | https://github.com/PanSzelescik/instaling-bot |
| Latest release | https://github.com/Bmoneczek/instaling-bot/releases/latest (v3.0.0) |
| Landing page | https://bmoneczek.github.io/instaling-bot/ |
| Remote `origin` | upstream repo |
| Remote `fork` | your fork |
| Release workflow | `.github/workflows/release.yml` |
| Windows installer (local build) | `dist/instaling-bot-3.0.0-setup.exe` (gitignored) |

## Stack

- Node.js 22+ (tested on 26)
- Puppeteer 25 (`puppeteer` downloads Chrome for Testing for the CLI)
- Electron 45 (`desktop/`)
- electron-builder 26 (NSIS for Windows, PKG for macOS)
- CommonJS (`require`), no build step, no TypeScript
- `chalk` (console colors) — the only runtime dependency besides Puppeteer
- Chrome for Testing is copied into `resources/browser/` for desktop installers
- No database — words are a JSON array

## Repository layout

```
src/
  main.js       shared engine: launch browser, login, session, answer loop, events, graceful stop
  helpers.js    DOM helpers: selectors, click/type, human typing, delays, cookie consent, diagnostics
  config.js     loads Config.json (INSTALING_CONFIG aware), normalizes credentials
  words.js      SavedWords.json lookup/save (INSTALING_ROOT aware, lazy load)
  control.js    stop-request flag shared by the runner and the engine
  printer.js    console logging helpers
desktop/
  main.js       Electron main process: paths, config migration, IPC, child bot process, logs
  preload.js    contextBridge API exposed to the renderer
  runner.js     child process entry: listens for stop, runs src/main.js
  renderer/     retro UI (index.html, styles.css, renderer.js)
scripts/
  prepare-browser.js   copies Chrome for Testing into resources/browser + manifest.json
  ensure-electron.js   postinstall fallback that downloads the Electron runtime
  generate-icon.ps1    Windows-only icon generator for build/icon.png
config/
  Config.json             real CLI config (gitignored, contains credentials)
  Config.defaults.json    template committed to git
  SavedWords.json         learned words for CLI (gitignored)
  SavedWords.defaults.json
docs/           GitHub Pages landing page (index.html, robots.txt, sitemap.xml)
pages/          HTML dumps from the last run (gitignored, diagnostics)
screenshots/    PNG dumps from the last run (gitignored, diagnostics)
resources/      generated bundled browser (gitignored)
build/          icon.png tracked; electron-builder resources
dist/           generated installers (gitignored)
electron-builder.yml
```

## Desktop data paths

`desktop/main.js` stores everything under `app.getPath('userData')`:

- Windows: `%APPDATA%\instaling-bot`
- macOS: `~/Library/Application Support/instaling-bot`

```
config/Config.json        settings + credentials (merged with new defaults on upgrade)
config/SavedWords.json    learned translations
logs/last-run.log         full log of the last run
pages/                    diagnostic HTML
screenshots/              diagnostic PNG
```

On first run the app copies `config/Config.defaults.json` and `config/SavedWords.defaults.json` from the app bundle. Existing values are never overwritten; missing keys are added. Unknown keys are preserved, so hand-editing the file is safe.

## Runtime flow

### CLI

```
npm start
  └─ node src/main.js
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
      │   ├─ else type() the saved translation (respects valid_chance)
      │   ├─ if valid_chance fails → type() a plausible misspelling
      │   ├─ click check, read correct answer (fallback to known translation)
      │   ├─ insertWord() if it was new
      │   └─ click next word
      └─ handleStop()
          ├─ return to main page (optional)
          ├─ saveWords()
          ├─ close browser
          └─ emit finished + resolve exit code
```

`src/main.js` exports the completion promise. When run directly (`require.main === module`) it exits with that code; when required by `desktop/runner.js` it lets the runner exit.

### Desktop

```
npm run desktop
  └─ electron .
      └─ desktop/main.js
          ├─ initPaths()                userData/config, logs, defaults
          ├─ ensureDataFiles()          copy defaults, merge new config keys
          ├─ registerIpc()              get-state, save-settings, start, stop, folders, window
          ├─ createWindow()             frameless retro BrowserWindow + preload API
          └─ bot:start
              ├─ saveSettings()         validate + clamp values, write Config.json
              ├─ resolveBundledBrowser() read resources/browser/manifest.json
              └─ fork(desktop/runner.js, {ELECTRON_RUN_AS_NODE: '1'})
                     ├─ env INSTALING_ROOT, INSTALING_CONFIG
                     ├─ env INSTALING_CHROME, PUPPETEER_EXECUTABLE_PATH
                     ├─ env PUPPETEER_CACHE_DIR
                     └─ require('../src/main.js')
```

IPC/event flow:

- The engine calls `notify(event, payload)` → `process.send({type: 'bot-event', ...})`.
- `desktop/main.js` turns `answer`, `answered`, `new-word`, `phase`, `error` and `finished` into counters/status, writes `logs/last-run.log`, and broadcasts `bot:status`.
- Renderer receives `bot:log`, `bot:status`, `bot:clear-log` and `window:maximized`.
- Stop: renderer → `bot:stop` → `requestStop()` sends `{type: 'stop'}` to the child → `src/control.js` flag → engine saves words, closes Chrome and exits. A 15 s watchdog kills the child if it does not stop.
- Closing the window while the bot runs triggers `before-quit`: request stop, wait up to 12 s, then kill the child.

## The important fixes (don't regress these)

1. **Cookie consent overlay** — Google Funding Choices renders a dialog over the login form. `fundingchoicesmessages.google.com` is blocked, and `dismissConsent()` clicks `.fc-cta-do-not-consent` as a fallback.
2. **Windows hidden window** — Puppeteer hardcodes `windowsHide: true` in `@puppeteer/browsers`. `src/main.js` monkey-patches `child_process.spawn` before requiring Puppeteer so Chrome appears in the taskbar when `show_browser` is true.
3. **Selectors change** — never rely on one selector. `SELECTORS` in `main.js` holds arrays; `findSelector()` returns the first match.
4. **`isVisible()` semantics** — must return `true` when visible. An older fork had this inverted.
5. **Saved words path** — `ROOT` in `helpers.js` and `words.js` honors `INSTALING_ROOT`; the CLI falls back to the project root. Never use `process.cwd()`.
6. **Config compatibility** — `src/config.js` accepts both `credentials.login/password` and old top-level `login/password`, and honors `INSTALING_CONFIG`.
7. **Login reliability** — credentials use `typeExact()` (fast, verified, direct-value fallback), and a rejected submit is retried once. Do not replace it with the humanized typer.
8. **Typo results** — for a "Literówka" result InstaLing may leave `#word` empty. `answerQuestion()` falls back to the translation it already knows instead of throwing.
9. **Navigation clicks** — `clickAndWait()` is called with a short timeout (2.5 s) for session buttons; the following `findSelector()` waits for the real content. Do not restore the old 8–15 s waits.
10. **Bundled Chrome path** — the desktop passes `INSTALING_CHROME`/`PUPPETEER_EXECUTABLE_PATH`; the manifest must stay at `resources/browser/manifest.json` and its path must be relative to that directory.
11. **asar disabled** — `electron-builder.yml` uses `asar: false` because `desktop/runner.js` and `src/` are loaded as normal files by the forked child process. Do not turn asar on without testing the packaged app.
12. **Packaged dependencies** — electron-builder must not include Electron/electron-builder dev dependencies. The `package.json` file list keeps runtime deps only; `dist/win-unpacked/resources/app/node_modules` should stay small.
13. **IPC safety** — `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`; every handler calls `assertSender()` and external links are restricted to `https://`.

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
- `valid_chance` failures type a plausible misspelling instead of leaving the field empty.
- The canonical template is `config/Config.defaults.json`; there is no remote word database.
- Desktop clamps GUI values (0–1 for chances, 0–10000 for `max_answers`) before writing the file.

## Building

```bash
npm install                    # runs scripts/ensure-electron.js (downloads Electron if needed)
npm run desktop                # run the Electron app from source
npm run check                  # syntax-check every JS file
npm run prepare:browser        # copy Chrome for Testing into resources/browser
npm run dist:win               # Windows .exe (NSIS, x64)
npm run dist:mac               # macOS .pkg (current arch; must run on macOS)
```

- `dist:win` / `dist:mac` run `prepare:browser` automatically.
- `prepare:browser` uses the local Puppeteer cache; if Chrome is absent it downloads stable. `--arch=arm64|x64` selects the macOS Chrome build.
- If the Chrome for Testing release metadata endpoint is unavailable, `prepare:browser` falls back to the pinned build `156.0.8078.47`. Override it with `--build=<version>` or `CHROME_BUILD_ID=<version>`.
- The Windows installer is about 288 MB because it contains Chrome and Electron.
- `dist/win-unpacked/` is useful for testing the packaged app without installing it.
- `scripts/ensure-electron.js` exists because Electron's own postinstall can be skipped by npm's allow-scripts policy. It is wired as `postinstall`.

## CI and release workflow

`.github/workflows/release.yml` runs on `workflow_dispatch` and on tags matching `v*`:

| Job | Runner | Output |
|---|---|---|
| `windows` | `windows-latest` | `dist/*.exe` → `windows-installer` artifact |
| `macos` arm64 | `macos-15` | `dist/*.pkg` → `macos-installer-arm64` |
| `macos` x64 | `macos-15-intel` | `dist/*.pkg` → `macos-installer-x64` |
| `release` | `ubuntu-latest` | downloads all artifacts into a **draft** GitHub release (tags only) |

The release job uses `.github/RELEASE_NOTES_<tag>.md` when present, otherwise generates notes. It creates the release as a draft; **verify the assets and publish it manually**.

macOS `.pkg` files cannot be built reliably on Windows. Use the workflow (or a Mac) for those. The installers are unsigned (`CSC_IDENTITY_AUTO_DISCOVERY=false`, `mac.identity: null`), so SmartScreen/Gatekeeper warnings are expected.

Release checklist:

1. Bump `version` in `package.json` and `package-lock.json`.
2. Update `CHANGELOG.md`, `README.md`, `docs/index.html`, `PROJECT_NOTES.md`, `NOTICE`, and add `.github/RELEASE_NOTES_vX.Y.Z.md`.
3. Run `npm ci`, `npm run check`, and a CLI `max_answers: 1` smoke test.
4. Test the desktop Stop button and reset local test config to production defaults.
5. Commit, push to `fork master`.
6. Optionally trigger the workflow with `workflow_dispatch` and verify the artifacts.
7. Push the tag (`git tag vX.Y.Z && git push fork vX.Y.Z`) and wait for the workflow.
8. Open the draft release, verify `.exe` + both `.pkg` files, then publish.
9. Check that GitHub Pages reflects the new version and the asset links resolve.

## Common tasks

```bash
npm start                                  # CLI run
npm run desktop                            # Electron app
npm run check                              # syntax check only
npm install --omit=dev                     # CLI-only install (skips Electron/electron-builder)
npx puppeteer browsers install chrome      # if CLI Chrome is missing
npx electron-builder --win nsis --publish never   # build without browser copy
```

**Publish a change:**

```bash
git add -A
git commit -m "..."
git push fork master
gh release create vX.Y.Z --repo Bmoneczek/instaling-bot --target master \
  --title "instaling-bot vX.Y.Z" --notes-file .github/RELEASE_NOTES_vX.Y.Z.md
```

The release workflow also creates the release on tag push (as a draft). Prefer the workflow so installers are attached automatically.

**Debug a changed website:**

1. set `"debug": true`
2. set `"max_answers": 1`
3. run, then inspect `pages/answer-*.html` and `screenshots/`
4. add/adjust selectors in `SELECTORS` in `src/main.js`
5. add the new case to `CHANGELOG.md`

**Debug the desktop shell:**

```bash
npm run desktop -- --remote-debugging-port=9333
```

Then connect Puppeteer/Chrome DevTools to `http://127.0.0.1:9333`. Set `INSTALING_DEVTOOLS=1` to open DevTools automatically in development.

## Known limitations

- Selectors are tied to the current HTML; InstaLing can change them any time.
- Detection is never guaranteed — no amount of delay makes a bot invisible.
- Single account, single run, no scheduling.
- Words are flat JSON, no dedupe beyond normalizing text.
- Humanization reduces obvious patterns but cannot guarantee the bot is undetectable.
- Uses Chrome for Testing, not the user's installed Chrome.
- Installers are unsigned; macOS builds require CI or a Mac.
- Credentials are stored in plain text in the local config file (same as the CLI). The UI says so; use full-disk encryption and do not share the data folder.
- No automated tests yet (only `node --check` and manual smoke tests).

## MVP done in 3.0.0

- Electron shell with a retro Windows 95/98 UI, custom titlebar and Start/Stop.
- Credentials and settings GUI (valid_chance, max_answers, browser/audio, humanization, debug).
- Live log, counters, elapsed time, data-folder and log shortcuts.
- Bundled Chrome for Testing and a manifest consumed by the engine.
- Windows NSIS installer and macOS PKG builds for arm64/x64 via GitHub Actions.
- Shared engine/config/words with the CLI, including graceful stop and IPC events.

## Future ideas

- Signed installers and auto-update (`electron-updater`).
- Encrypted credential storage (Windows Credential Manager / macOS Keychain via `keytar`).
- SQLite for words with import/export and search.
- Session history and statistics.
- PL/EN interface.
- Regression tests using saved HTML fixtures instead of hitting the live site.
- Tray icon and minimize-while-running.

## Starter prompt for a new session

Copy this into a new chat:

> Project: `E:\Files\OpenCode\instaling-bot` (fork of PanSzelescik/instaling-bot, v3.0.0).
> Read `PROJECT_NOTES.md`, `README.md`, `src/main.js`, `desktop/main.js`, `src/helpers.js`, `src/config.js` first.
> Current state: Electron desktop app for Windows/macOS + fully supported CLI for Linux. Shared engine in `src/`, IPC events and graceful stop, bundled Chrome for Testing in `resources/browser`, Windows NSIS and macOS PKG builds via `.github/workflows/release.yml`. Cookie consent is blocked/dismissed; the Windows hidden-window bug is patched; typing is humanized (random per-letter delays, simulated typos with Backspace) and login is fast/verified with one retry.
> Do not regress: cookie handling, `isVisible()` semantics, saved-words path, config compatibility, login reliability, quick navigation, bundled Chrome path, `asar: false`, IPC sender checks.
> Test with `"max_answers": 1`, update `CHANGELOG.md`, and prepare a release.

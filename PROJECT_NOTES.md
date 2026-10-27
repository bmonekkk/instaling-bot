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
| Local repo | `/Users/bmonek/Projects/instaling-bot` |
| Your fork | https://github.com/bmonekkk/instaling-bot |
| Upstream | https://github.com/PanSzelescik/instaling-bot |
| Latest release | https://github.com/bmonekkk/instaling-bot/releases/latest (v3.2.0) |
| Landing page | https://bmonekkk.github.io/instaling-bot/ |
| Remote `origin` | your fork (`bmonekkk/instaling-bot`) |
| Remote `upstream` | `PanSzelescik/instaling-bot` |
| Release workflow | `.github/workflows/release.yml` |
| Windows installer (local build) | `dist/instaling-bot-3.2.0-setup-win64.exe` (gitignored) |

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
  mistakes.js   wrong-answer strategies: blank / wrong saved word / misspelling
  reminder.js   daily reminder state, repeat interval, schedule check and native notifications
  stats.js      daily session aggregates and week/month/year/all summaries
  update.js     GitHub release check and version comparison
  printer.js    console logging helpers
bin/
  instaling-bot.js  CLI entry: start, stats, remind, update-check, help, version
install.sh      one-command CLI installer (downloads the branch, npm install, launcher)
desktop/
  main.js       Electron main process: paths, config migration, IPC, child bot process, logs
  preload.js    contextBridge API exposed to the renderer
  runner.js     child process entry: listens for stop, runs src/main.js
  renderer/     retro UI (index.html, styles.css, renderer.js)
scripts/
  prepare-browser.js   copies Chrome for Testing into resources/browser + manifest.json
  ensure-electron.js   postinstall fallback that downloads the Electron runtime
  remind.js            CLI reminder loop (shares config and state with the desktop app)
  check-updates.js     CLI update check against GitHub releases
  sync-wiki.sh         pushes wiki/ to the GitHub wiki repository
  generate-icon.ps1    Windows-only icon generator for build/icon.png
wiki/           source for the GitHub wiki (Home, Installation, CLI, Configuration, ...)
test/
  stats.test.js       stats aggregation, period windows and normalization
  reminder.test.js    reminder schedule, repeat interval and state helpers
  update.test.js      version comparison and the stubbed release check
.github/
  workflows/    release.yml, ci.yml, codeql.yml
  ISSUE_TEMPLATE/, DISCUSSION_TEMPLATE/, dependabot.yml, FUNDING.yml
  RELEASE_NOTES_v*.md
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
reminder-state.json       lastSession / lastNotified used by the daily reminder
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
      │   ├─ 1/3 blank answer
      │   ├─ 1/3 wrong saved translation (fallback: misspelling)
      │   ├─ 1/3 plausible misspelling
      │   ├─ click check, read correct answer (fallback to known translation)
      │   ├─ insertWord() if it was new
      │   └─ click next word
      └─ handleStop()
          ├─ return to main page (optional)
          ├─ saveWords()
          ├─ markSessionDone()          reminder state: today counts as done
          ├─ close browser
          └─ emit finished + resolve exit code
```

`src/main.js` exports the completion promise. When run directly (`require.main === module`) it exits with that code; when required by `desktop/runner.js` it lets the runner exit. The CLI also prints a one-line update notice on start by calling `src/update.js`.

### Desktop

```
npm run desktop
  └─ electron .
      └─ desktop/main.js
          ├─ initPaths()                userData/config, logs, defaults
          ├─ ensureDataFiles()          copy defaults, merge new config keys
          ├─ registerIpc()              get-state, save-settings, start, stop, folders, window, updates
          ├─ createWindow()             frameless retro BrowserWindow + preload API
          ├─ updateTray()               tray icon + context menu (template glyph on macOS)
          ├─ hideToTray()               destroy the renderer, keep the main process alive
          ├─ setDockVisible()           switch macOS Dock icon on/off
          ├─ startReminderLoop()        check every 60 s, notify once per day
          ├─ startUpdateChecks()        GitHub release check on start + every 6 h
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
- Renderer receives `bot:log`, `bot:status`, `bot:clear-log`, `window:maximized`, `app:update-available` and `app:reminder`. Log lines carry an increasing `seq`; the main process keeps the last 2000 in `logBuffer` and a recreated window replays them via `app:get-log-buffer`, so closing to tray does not lose the console.
- Stop: renderer → `bot:stop` → `requestStop()` sends `{type: 'stop'}` to the child → `src/control.js` flag → engine saves words, closes Chrome and exits. A 15 s watchdog kills the child if it does not stop.
- Closing the window while the bot runs triggers `before-quit`: request stop, wait up to 12 s, then kill the child. With `background.run_in_tray` the window is **destroyed** (not hidden) by `hideToTray()` and `window-all-closed` keeps the app alive; the tray icon recreates the window on demand. On macOS this also calls `app.setActivationPolicy('accessory')` + `app.dock.hide()`, and the window path restores the Dock icon.
- Tray notifications: a bot run that finishes while no window is visible (for example started from the tray menu) shows a native notification with the answer/correct counts (or the error). Clicking it opens the window. The notification is skipped when the window is visible or when the same run was already announced.
- Reminder: `src/reminder.js` owns `reminder-state.json`. `checkReminder()` compares `reminder.time` with local time, skips when `lastSession` or `lastNotified` is today, shows an OS notification plus `app:reminder`, then calls `markNotified()`. `markSessionDone()` runs when a bot process ends with code 0 and at least one answer (the CLI does the same in `handleStop()`).
- Updates: `src/update.js` `checkLatestRelease()` calls the GitHub API. The result is exposed through `app:check-updates` / `app:update-status`; the renderer shows a banner whose **Pobierz** button opens `html_url`. Nothing is downloaded or installed automatically.

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
14. **Randomized errors** — `valid_chance` failure must stay an equal 1/3 split between blank, wrong saved word and misspelling (`src/mistakes.js`). `pickWrongTranslation()` must skip the correct answer and return `null` when there is no other word so the caller can fall back to a misspelling.
15. **Reminder state** — never mark a reminder as sent before the notification is attempted, and never remind when `lastSession` is today. Desktop state lives in `userData`, the CLI uses the project root; both call the same helpers in `src/reminder.js`.
16. **Updates stay manual** — installers are unsigned, so `src/update.js` only reports the latest release and its URL. Do not add silent download/install without also adding code signing and testing it on both platforms.
17. **Destroy, don't hide, in tray mode** — `hideToTray()` destroys the BrowserWindow and nulls it so the renderer process exits (the shared GPU/network processes stay at idle). Do not replace it with `mainWindow.hide()`; that was the ~150 MB background footprint. The main process must keep the bot child, reminder loop and tray alive, and `showWindow()` must recreate the window and replay the log buffer.
18. **Log replay after window recreation** — every log line gets a `seq`; the renderer ignores out-of-order/duplicate sequences. `clear log` clears both the DOM and the main-process buffer, otherwise old lines come back when the window reopens.
19. **macOS tray glyph** — `templateTrayIcon()` paints `TRAY_GLYPH` into a 16×16/32×32 bitmap and calls `setTemplateImage(true)`. Do not go back to the coloured `build/icon.png` on macOS; a template image is what makes the icon readable in light and dark menu bars.
20. **Dock visibility** — in tray mode macOS uses `setActivationPolicy('accessory')` + `dock.hide()`; showing the window restores `regular` + `dock.show()`. Keep both calls paired, otherwise the app either stays in the Dock or cannot get focus.
21. **Isolated testing** — set `INSTALING_DESKTOP_DATA=/tmp/whatever` to redirect the whole Electron profile (config, cache, `reminder-state.json`) away from the real user data. Do not test by overriding `HOME`; Electron ignores it for `userData`.

## Config cheat sheet

```jsonc
{
  "credentials": { "login": "...", "password": "..." },
  "delays": {
    "click_min": 2000, "click_max": 4500,
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
  "debug": false,
  "reminder": { "enabled": true, "time": "17:00" },
  "background": { "run_in_tray": false, "start_at_login": false }
}
```

- Raising delays = slower and less aggressive.
- `max_answers: 1` is the fastest safe way to test a change.
- `type_min` / `type_max` are per character. `typo_chance` simulates a wrong key + Backspace and is verified afterwards.
- `valid_chance` failures pick one of three errors with equal probability: blank, wrong saved translation (fallback: misspelling), misspelling.
- `reminder.time` is local `HH:MM`; the desktop checks every minute while running, the CLI via `npm run remind`.
- `background.*` only affects the desktop app (tray icon and OS login item). Hidden startup requires **both** `run_in_tray` and `start_at_login`; autostart alone opens the window.
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
2. Update `CHANGELOG.md`, `README.md`, `README.en.md`, `docs/index.html`, `PROJECT_NOTES.md`, `NOTICE`, and add `.github/RELEASE_NOTES_vX.Y.Z.md`.
3. Run `npm ci`, `npm run check`, and a CLI `max_answers: 1` smoke test.
4. Test the desktop Stop button and reset local test config to production defaults.
5. Commit, push to `origin master`.
6. Optionally trigger the workflow with `workflow_dispatch` and verify the artifacts.
7. Push the tag (`git tag vX.Y.Z && git push origin vX.Y.Z`) and wait for the workflow.
8. Open the draft release, verify `.exe` + both `.pkg` files, then publish.
9. Check that GitHub Pages reflects the new version and the asset links resolve.

## Community and repository setup

Health files live at the repository root: `SECURITY.md`, `CONTRIBUTING.md`, `SUPPORT.md`,
`CODE_OF_CONDUCT.md`. Issue forms are in `.github/ISSUE_TEMPLATE/`, discussion forms in
`.github/DISCUSSION_TEMPLATE/`, and the PR template is `.github/pull_request_template.md`.

- `ci.yml` runs on pushes and PRs to `master`: syntax check, unit tests (`node --test`),
  whitespace, `install.sh` and CLI smoke tests. The `Check` job is a required status check
  for `master`.
- `codeql.yml` runs CodeQL `security-and-quality` for JavaScript on pushes, PRs and weekly.
- `dependabot.yml` updates npm dependencies and GitHub Actions weekly (minor/patch grouped).
- `master` is protected by a ruleset: PR required (0 approvals), conversation resolution,
  linear history, no deletion/force-push, required `Check` status; repository admins can bypass
  for urgent releases.
- Repository settings: issues and discussions enabled, wiki enabled, squash-only merges,
  auto-delete branches, auto-merge and update-branch enabled.
- Security: Dependabot alerts and security updates, private vulnerability reporting, secret
  scanning + push protection, non-provider patterns and validity checks.
- Wiki source is versioned in `wiki/` and published to
  `https://github.com/bmonekkk/instaling-bot/wiki` with `scripts/sync-wiki.sh`. GitHub has no
  API for the **first** wiki page; that initial page already exists, so future updates only
  need the script run after editing `wiki/`.

### Search engine visibility

- `docs/index.html` has a Polish title and description, canonical URL, `hreflang`, Open Graph
  and Twitter cards, `SoftwareApplication` + `FAQPage` JSON-LD, a favicon, an English summary
  section, `robots.txt`, `sitemap.xml` and `llms.txt` for AI crawlers.
- `docs/social-preview.png` is a 1200x630 card for link previews. Upload it in GitHub
  Settings → Social preview for the repository.
- `scripts/submit-indexnow.sh` (`npm run indexnow`) submits the page to IndexNow, which covers
  Bing, Yandex, Seznam, Naver and other participants. Run it after a Pages deploy.
- Google does not use IndexNow. Add the URL-prefix property
  `https://bmonekkk.github.io/instaling-bot/` in Google Search Console, verify it (HTML tag
  or HTML file in `docs/`), then submit `https://bmonekkk.github.io/instaling-bot/sitemap.xml`.
  Bing Webmaster Tools can import the property from Search Console.
- The Search Console HTML-file verification lives at
  `docs/google0890551163baf2b9.html`. **Do not delete or rename it** — removing it breaks the
  property verification. Add a new file from Search Console if the project ever gets another
  property or a custom domain.
- `robots.txt` in a GitHub Pages project subdirectory is not the host-level file Google
  fetches, so the sitemap must be submitted directly in Search Console.
- Backlinks (Reddit, forums, project lists) and a custom domain matter more than meta tags
  for a new site; indexing can take days to weeks.

## Common tasks

```bash
npm start                                  # CLI run
npm run remind                             # CLI daily reminder loop
npm run update-check                       # compare with the latest GitHub release
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
git push origin master
gh release create vX.Y.Z --repo bmonekkk/instaling-bot --target master \
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
- Single account, single run; the reminder only works while the desktop app or `npm run remind` is running.
- Words are flat JSON, no dedupe beyond normalizing text.
- Humanization reduces obvious patterns but cannot guarantee the bot is undetectable.
- Uses Chrome for Testing, not the user's installed Chrome.
- Installers are unsigned; macOS builds require CI or a Mac. Updates are manual (download + run installer).
- Credentials are stored in plain text in the local config file (same as the CLI). The UI says so; use full-disk encryption and do not share the data folder.
- No automated tests yet (only `node --check` and manual smoke tests).

## MVP done in 3.0.0

- Electron shell with a retro Windows 95/98 UI, custom titlebar and Start/Stop.
- Credentials and settings GUI (valid_chance, max_answers, browser/audio, humanization, debug).
- Live log, counters, elapsed time, data-folder and log shortcuts.
- Bundled Chrome for Testing and a manifest consumed by the engine.
- Windows NSIS installer and macOS PKG builds for arm64/x64 via GitHub Actions.
- Shared engine/config/words with the CLI, including graceful stop and IPC events.

## What changed in 3.2.0

- Statistics: `src/stats.js` stores per-day aggregates in `stats.json`; the engine records every finished run with at least one answer. Desktop exposes an `app:get-stats` IPC handler and a statistics modal with week/month/year/all tabs. CLI: `instaling-bot stats [--period ...] [--json]`.
- Repeating reminders: `reminder.repeat_minutes` plus `lastNotifiedAt` in `reminder-state.json`. `isReminderDue` allows another notification after the interval, but never after a session was completed that day.
- New CLI entry `bin/instaling-bot.js`; `src/main.js` now exports `{run}` and only auto-starts with `require.main === module`. `desktop/runner.js` calls `run()`.
- CLI update gate: `start` checks GitHub first and exits on an outdated version unless `--skip-update-check` / `INSTALING_SKIP_UPDATE_CHECK=1`; network errors warn and continue.
- `install.sh` + `bin` field + `npm start` routed through the CLI. Help/version/stats work without `Config.json`.
- Desktop console cleanup: `INSTALING_LOG_CLEANUP_MS` (default 2 h, test hook) clears the log buffer, renderer and log file after the run, guarded by a run token so a new session is not wiped.
- UI: quick-start moved below Ko-fi; site-FAQ button removed from the error modal; repeat-notification select added; stats button/modal added.
- Packaging: Windows artifact `instaling-bot-<version>-setup-win64.exe`, macOS `instaling-bot-<version>-macos-<arch>.pkg`; release title is just the version (tag keeps the `v`).

## What changed in 3.1.0

- Wrong answers are randomized: blank field, another saved translation, or a misspelling (equal chance), still gated by `valid_chance`.
- Daily reminder shared by the desktop app and the CLI (`src/reminder.js`, `scripts/remind.js`), with `reminder-state.json`.
- Optional tray mode and start-at-login in the desktop app.
- Update checking in both variants (`src/update.js`, `scripts/check-updates.js`) — notify only, never install.
- Ko-fi support box and author footer in the app; faster default click pause (2000–4500 ms).

## What changed in 3.1.2

- The offline/error modal is now fully manual: only the **Zamknij** button hides it. Removed the automatic hide on `online` and the backdrop-click dismissal. The `online` event still shows a toast.
- This fixes the modal flashing for a fraction of a second when the network flaps or when the same click that revealed the dialog landed on the backdrop.

## What changed in 3.1.1

- macOS tray icon is generated as a monochrome template bitmap, so the menu bar renders it correctly in light and dark mode.
- Closing to the tray destroys the renderer; on macOS the Dock icon is hidden (`accessory` activation policy) and the menu-bar icon is the only entry point.
- A session started from the tray shows a native notification when it finishes (success or error); clicking it opens the app. No notification when the window is already visible.
- Close-to-tray memory dropped from roughly 150 MB to ~50 MB at a cold hidden start (main ~34 MB + GPU ~10 MB + network ~7 MB); after opening and closing a window the measured total stayed below 100 MB (~84 MB).
- Offline/error modal in the renderer: detects `navigator.onLine`, bot errors and connection failures, with buttons to the site FAQ (`#faq`) and the README troubleshooting section.
- Ko-fi support box moved above the login form; macOS/autostart behavior documented in the app and README.
- `INSTALING_DESKTOP_DATA` env var added for isolated testing of the Electron profile.

## Future ideas

- Signed installers and real auto-update (`electron-updater`) once a certificate exists.
- Encrypted credential storage (Windows Credential Manager / macOS Keychain via `keytar`).
- SQLite for words with import/export and search.
- PL/EN interface.
- Regression tests using saved HTML fixtures instead of hitting the live site.
- OS-level scheduled reminder that fires even when the app is closed (Task Scheduler / launchd).

## Starter prompt for a new session

Copy this into a new chat:

> Project: `/Users/bmonek/Projects/instaling-bot` (fork of PanSzelescik/instaling-bot, v3.2.0).
> Read `PROJECT_NOTES.md`, `README.md`, `src/main.js`, `desktop/main.js`, `src/helpers.js`, `src/config.js` first.
> Current state: Electron desktop app for Windows/macOS + fully supported CLI for Linux. Shared engine in `src/`, IPC events and graceful stop, bundled Chrome for Testing in `resources/browser`, Windows NSIS and macOS PKG builds via `.github/workflows/release.yml`. Cookie consent is blocked/dismissed; the Windows hidden-window bug is patched; typing is humanized (random per-letter delays, simulated typos with Backspace) and login is fast/verified with one retry. Wrong answers randomize between blank/wrong-word/misspelling. Daily reminder (optionally repeated), statistics and update checking are shared by desktop and CLI. The CLI entry point is `bin/instaling-bot.js` (`start`, `stats`, `remind`, `update-check`, `help`, `version`); `src/main.js` exports `run()`. The CLI blocks outdated starts unless `--skip-update-check` is passed. The desktop clears its console two hours after a run.
> Do not regress: cookie handling, `isVisible()` semantics, saved-words path, config compatibility, login reliability, quick navigation, bundled Chrome path, `asar: false`, IPC sender checks, equal-random error types, reminder state and its repeat interval, stats aggregation, manual-only updates.
> Test with `"max_answers": 1`, update `CHANGELOG.md`, and prepare a release.

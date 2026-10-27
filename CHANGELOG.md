# Changelog

All notable changes to this fork are documented here.

## [Unreleased]

### Added
- Community health files: `SECURITY.md`, `CONTRIBUTING.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, issue and pull request templates, and discussion templates for Q&A and Ideas.
- CI workflow covering syntax checks, unit tests with `node:test`, whitespace, the `install.sh` shell script and CLI smoke tests; CodeQL analysis for JavaScript; Dependabot updates for npm and GitHub Actions.
- Wiki source under `wiki/` with a `scripts/sync-wiki.sh` helper, plus a welcome discussion in the repository.
- Repository hardening: protected `master` with a required CI check, private vulnerability reporting, secret scanning push protection, Dependabot alerts and security updates, squash-only merges and automatic branch deletion.

### Changed
- README now has CI, CodeQL, release, license and discussions badges, plus a community and support section.
- Added an English README (`README.en.md`) with a language switcher at the top of both README files.

## [3.2.0] - 2026-10-27

### Added
- Session statistics for the desktop app and the CLI, stored in `stats.json`. The app shows week, month, year and all-time summaries (sessions, answers, correct, wrong, accuracy, new words, duration, active days); the CLI exposes `instaling-bot stats [--period week|month|year|all] [--json]`.
- `reminder.repeat_minutes` repeats the daily reminder every N minutes (0 = once per day) until a session is completed. The GUI offers 15/30/60/120/180-minute options; `reminder-state.json` now also stores `lastNotifiedAt`.
- `bin/instaling-bot.js` CLI with `start`, `stats`, `remind`, `update-check`, `help` and `version`, plus `npm run stats` and `npm run help`.
- `install.sh` for one-command CLI installation (`curl -fsSL .../install.sh | bash`), with a launcher in `~/.local/bin`.
- Automatic console cleanup two hours after a session ends: the in-app buffer, the renderer log and `logs/last-run.log` are cleared.

### Changed
- `instaling-bot start` checks the latest GitHub release **before** launching and refuses to run an outdated version. Escape hatch: `--skip-update-check` or `INSTALING_SKIP_UPDATE_CHECK=1`. Network failures only warn.
- The quick-start guide moved to the top of the settings panel, directly below the Ko-fi box.
- The error and offline modals now link only to the README FAQ section; the site FAQ button was removed.
- Autostart hint no longer says the feature requires an installed app.
- Release titles are just the version number (`3.2.0`); installer names include the platform: `setup-win64.exe`, `macos-arm64.pkg`, `macos-x64.pkg`.
- `npm start` now routes through the CLI entry point; `src/main.js` exports `run()` instead of starting on require.

### Fixed
- `src/main.js` no longer starts a bot run when required by `help`, `version`, `stats` or other CLI commands.
- The `all` statistics period no longer reports a seven-day window in its `days` field.

### Compatibility
- `Config.json`, `SavedWords.json` and `reminder-state.json` remain compatible. Existing configs receive `reminder.repeat_minutes: 0` automatically.
- Stats begin with the first completed session after upgrading; earlier runs are not backfilled.
- Updates remain manual (download and run the new installer) because builds are unsigned.

## [3.1.2] - 2026-10-27

### Fixed
- The offline and bot-error modals no longer close themselves when the network comes back. They now stay open until the user presses **Zamknij**.
- Clicking the dimmed backdrop no longer dismisses the error modal; only the **Zamknij** button closes it. The online event still shows a toast, but it no longer hides the help dialog.

### Changed
- Version bumped to 3.1.2 in `package.json`, `package-lock.json`, docs, app titlebar and release notes.

## [3.1.1] - 2026-10-26

### Added
- Native session-end notification for bot runs started from the tray menu. It shows the answer/correct counts (or the error) and opens the window when clicked; it is skipped when the window is already visible.
- Offline and error modal in the desktop app. It detects `navigator.onLine`, lost connections and bot failures, and links to the site FAQ (`#faq`) and the README troubleshooting section.
- macOS template tray icon drawn at runtime (16×16 plus a 32×32 representation) so the menu-bar glyph adapts to light and dark mode.
- Autostart and tray behavior documentation in the README and directly in the settings panel.

### Changed
- Closing the window in tray mode now **destroys** the renderer instead of hiding it. The main process keeps the bot, reminder and update loops, and recreates the window with replayed logs on demand. Background footprint measured at roughly **50 MB** on a cold hidden start and stayed below 100 MB after opening and closing the window.
- On macOS, tray mode switches the app to the `accessory` activation policy and hides the Dock icon; opening the window restores it. The menu-bar icon is the only entry point while closed.
- Ko-fi support box moved above the login form so it is visible without scrolling.
- README rewritten with section emojis and a clearer startup/autostart table.
- Version bumped to 3.1.1 in `package.json`, `package-lock.json`, docs, app titlebar and release notes.

### Fixed
- The console log is preserved when the window is destroyed and reopened (main-process log buffer with sequence numbers, cleared together with the DOM).
- Tray **Start** no longer opens the window; failures are reported through the tray notification.
- `second-instance` now reopens a destroyed window instead of doing nothing.

### Compatibility
- No config or data migration needed; `Config.json`, `SavedWords.json` and `reminder-state.json` are unchanged.
- Updates remain manual (download and run the new installer) because builds are unsigned.

## [3.1.0] - 2026-10-26

### Added
- Randomized wrong answers: when `valid_chance` is missed, the bot now picks one of three strategies with equal probability — a blank field, another translation from `SavedWords.json` (falling back to a misspelling), or the existing human-like misspelling.
- Daily-session reminder shared by the desktop app and the CLI: configurable time (`reminder.time`, default `17:00`), OS notification plus an in-app toast, and automatic skip when a session was already completed that day.
- `reminder-state.json`, written under the desktop data folder or the project root for the CLI, tracks `lastSession` and `lastNotified` so the reminder fires at most once per day.
- `npm run remind` (CLI) runs a lightweight background loop with the same reminder settings and state file.
- Optional tray mode (`background.run_in_tray`) and start-at-login (`background.start_at_login`) in the desktop app.
- Update checking for both variants: the desktop app checks GitHub releases on launch and every 6 hours, shows a banner with the new version and a **Pobierz** button that opens the release page; the CLI exposes `npm run update-check` and prints an update note on `npm start`.
- Ko-fi support box inside the desktop settings panel and an author signature (`bmonekkk`) in the status bar that opens the GitHub profile.
- Reminder and background controls in the desktop settings panel, plus a manual **Sprawdź aktualizacje** button in the console.

### Changed
- Default click pause shortened from 3500–6500 ms to **2000–4500 ms** (`delays.click_min` / `click_max`, GUI defaults and `Config.defaults.json`).
- Version bumped to 3.1.0 in `package.json`, `package-lock.json`, docs and release notes.
- Fork owner references updated from `Bmoneczek` to `bmonekkk` (GitHub links, project page, package metadata, Ko-fi handle). No functional changes; the app ID `com.bmoneczek.instalingbot` stays the same.

### Compatibility
- Existing user configs keep their current `click_min` / `click_max` values; only new installs get the faster defaults.
- The `reminder` and `background` sections are added to existing desktop configs automatically without touching other values.
- Updates remain manual (download and run the new installer) because builds are unsigned.

## [3.0.0] - 2026-10-26

### Added
- Electron desktop app for Windows and macOS with a retro Windows 95/98 interface, custom titlebar, settings panel and Start/Stop controls.
- Windows `.exe` installer (NSIS, x64) and macOS `.pkg` installers for Apple Silicon (`arm64`) and Intel (`x64`).
- Chrome for Testing is bundled into desktop installers, so the app does not require Node.js or a separately installed browser.
- GUI options for credentials, `valid_chance`, `max_answers`, browser/audio visibility, humanization delays and debug mode.
- Live log, answer/correct/wrong counters, elapsed time, data-folder shortcut and `logs/last-run.log`.
- `bot-event` IPC stream from the shared engine (`answer`, `answered`, `new-word`, `phase`, `error`, `finished`) and a graceful stop request.
- `INSTALING_ROOT`, `INSTALING_CONFIG` and `INSTALING_CHROME` environment variables so the engine can run against a writable per-user directory and the bundled browser.
- `scripts/prepare-browser.js` to copy Chrome for Testing into `resources/browser` with a manifest.
- `scripts/ensure-electron.js` postinstall fallback that downloads the Electron runtime when npm skips Electron's own install script.
- GitHub Actions workflow `.github/workflows/release.yml` that builds Windows and macOS installers and attaches them to a draft release on version tags.
- Desktop app icon (`build/icon.png`) and a generator script.

### Changed
- Desktop data lives in `%APPDATA%\instaling-bot` (Windows) or `~/Library/Application Support/instaling-bot` (macOS); the CLI keeps using `config/Config.json` in the project directory.
- Desktop configs are migrated by adding missing default keys without overwriting user values or dropping unknown fields.
- `src/main.js` now exports its completion promise, emits IPC events, and no longer calls `process.exit()` when required by the desktop runner.
- `src/config.js`, `src/helpers.js` and `src/words.js` honor the desktop data paths; `SavedWords.json` is loaded lazily.
- `electron-builder.yml` packages the app with `asar: false` so the forked engine and `desktop/runner.js` work reliably from the installed app.
- README, project page and project notes now document the desktop/CLI split, installer downloads, data paths and release process.

### Fixed
- The Windows installer includes a working Chrome binary and manifest, and the packaged app launches the bot with the bundled browser.
- Closing the desktop window while the bot runs stops it gracefully, saves words and closes Chrome instead of leaving orphaned processes.
- Stop requests are handled between steps and during an active answer, with a 15 s force-kill fallback.

### Compatibility
- The CLI (`npm start`) remains fully supported for as long as the desktop app exists, including Linux and terminal-only systems.
- Engine, config format and `SavedWords.json` are shared between both variants; all humanization and login fixes from 2.2.x are preserved.

## [2.2.1] - 2026-10-26

### Changed
- The fork author is now **Bmoneczek** in `package.json`, the console footer, `LICENSE` and `NOTICE`. The original project name (`instaling-bot`), upstream link and original copyright attribution remain unchanged.

## [2.2.0] - 2026-10-26

### Added
- Human-like typing: per-character random delays, occasional micro-pauses, and simulated typos that are corrected with Backspace.
- When `valid_chance` decides not to answer correctly, the bot now types a plausible misspelling instead of leaving the field empty.
- Login retry: if InstaLing rejects the first submit (for example because of a transient session issue), the bot retries once.
- New config options: `delays.type_pause_chance`, `type_pause_min`, `type_pause_max`, `typo_chance`, `quick_click_min`, `quick_click_max`.

### Changed
- Login now uses `typeExact()`: fast, verified typing with a direct-value fallback, so a simulated typo can never cause a wrong-password error.
- Session navigation buttons (`continue`, `start`) use a short 2.5 s navigation timeout and quick random pauses; the following selector wait handles slower pages.
- The answer-result reader falls back to the known translation when InstaLing leaves `#word` empty (for example after a "Literówka" result).
- The project webpage was redesigned in a retro Windows 95/98 style.

### Fixed
- The bot no longer crashes when the answer-result page does not expose the corrected word.

## [2.1.0] - 2026-10-26

### Changed
- Default `valid_chance` lowered to `0.8` (80% correct answers).
- Config templates renamed to `config/Config.defaults.json` and `config/SavedWords.defaults.json`.
- Only the `master` branch is kept in the repository.
- Removed unused `wait_min` / `wait_max` delay options.

### Removed
- The `feature` option and the `api.crawcik.space` word database integration; words now come only from `config/SavedWords.json`.
- The `open_devtools` option.
- The `webhook` option and all Discord webhook logging; logs go to the console only.
- Dependencies `discord.js`, `axios`, `strip-ansi` and `unique-random-array`. Runtime dependencies are now just `chalk` and `puppeteer`.

### Fixed
- Removed the unused `EventEmitter`/`stopBot` plumbing; shutdown now happens directly in `handleStop()` and errors exit with code `1`.
- Documentation, landing page and project notes now match the actual configuration.

## [2.0.1] - 2026-10-26

### Fixed
- On Windows, Puppeteer's hardcoded `windowsHide: true` hid the Chrome window (no taskbar entry, only grey windows behind the terminal). `child_process.spawn` is now patched before launching so a visible browser window is created when `show_browser` is `true`.

### Changed
- Slower default delays (`click` 3.5-6.5 s, `type` 120-240 ms, `next_word` 2-4.5 s, `selector` 15 s) for gentler, more human-like pacing.
- Removed Puppeteer's default `--enable-automation` flag and overrode `navigator.webdriver`; language list set to `pl-PL`.
- Window is positioned at 40,40 with `--no-first-run` / `--no-default-browser-check`.

## [2.0.0] - 2026-10-26

### Fixed
- Login no longer gets blocked by the Google Funding Choices cookie dialog that covered the entire form.
- `canLogin()` was never actually called, so missing credentials were not detected.
- `fs.rmdir(..., {recursive: true})` crashed on modern Node.js.
- `SavedWords.json` was written outside the project (`../config/...`) and saved words were lost.
- `isVisible()` had inverted logic, breaking detection of the "new word" form.
- Login navigation waited for `networkidle0`, which could hang because of ads/analytics.
- `#session_button`-era selectors were replaced with fallbacks that also support the current student panel.

### Changed
- Upgraded Puppeteer from 9 to 25 (Chrome 156, Node.js 22+).
- Removed the bundled uBlock Origin 1.34 extension (Manifest V2, unused, GPLv3); ads and trackers are blocked with request interception.
- Replaced `discord.js` webhook support with the built-in `fetch`.
- Credentials now live in `credentials.login` / `credentials.password`; old top-level `login` / `password` configs still work.
- `config/Config.json` and `config/SavedWords.json` are no longer tracked by git; examples are provided instead.
- Added `max_answers` to limit a run (useful for testing).
- Added ISC `LICENSE`, `NOTICE` and an educational-use disclaimer.

### Added
- Automatic consent-dialog dismissal as a fallback when the script cannot be blocked.
- `npm run check` syntax check script.
- README troubleshooting section and updated Polish documentation.

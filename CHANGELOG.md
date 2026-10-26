# Changelog

All notable changes to this fork are documented here.

## [Unreleased]

### Changed
- Fork owner references updated from `Bmoneczek` to `bmonekkk` (GitHub links, project page, package metadata, Ko-fi handle). No functional changes; the app ID `com.bmoneczek.instalingbot` stays the same.

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

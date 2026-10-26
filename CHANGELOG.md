# Changelog

All notable changes to this fork are documented here.

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

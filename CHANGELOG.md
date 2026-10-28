# Changelog

All notable changes to this fork are documented here.

## [4.3.1] - 2026-10-28

### Fixed
- **iOS app no longer crashes on launch on iOS 26 and newer.** Apps built with the iOS 26 SDK must adopt the UIScene lifecycle; without it UIKit raised a runtime issue at startup and the process trapped before the first frame, leaving a white screen or a bounce back to the home screen. Added `SceneDelegate` and `UIApplicationSceneManifest`, and moved window/root-controller setup and the `instalingbot://start|stop` deep links into the scene lifecycle. The 4.3.0 IPA was never published because of this.
- **iOS "Gotowe"/"Done" is a floating button above the number pad.** Replaced the `UIToolbar` (which iOS 26 renders as an oversized glass capsule) with a transparent accessory view that holds only a 104×36 beveled navy-on-gray "Gotowe" button, aligned 12 pt from the right edge. It still dismisses the keyboard with `UIApplication.sendAction`.
- **Android controls match the iOS sizes.** The title-bar buttons (EN, ⏰, 📊, ⚙) are now 34×30 dp instead of the platform default 88×48 dp, Start/Stop are 34 dp tall, and "instaling-bot" stays on one line instead of wrapping into four. The title bar is 44 dp tall so the navy → #1084d0 gradient is visible around the buttons, exactly like iOS.
- **Android window frame.** The content now sits in a `FrameLayout` shell with the 2 px black outline instead of drawing the outline as the root background, so the title bar and WebView stop covering it and nothing pokes out to the screen edge.

### Changed
- Version bumped to `4.3.1` (userscript `4.3.1`, iOS `MARKETING_VERSION` 4.3.1 / `CURRENT_PROJECT_VERSION` 40301).

## [4.3.0] - 2026-10-28

### Added
- **Two real human-like pauses.** After the word appears the bot waits `think_min`–`think_max` (defaults 1500–4000 ms) before the first keystroke. After checking the answer it waits `review_min`–`review_max` (2500–5500 ms) before "next" when the answer was a misspelling, wrong word, blank or a new word, and `review_correct_min`–`review_correct_max` (500–1200 ms) after a correct answer. Every value is random within its range, on desktop, Android, iOS and the userscript.
- The six new ranges are exposed in the desktop Advanced section, Android ⚙, iOS ⚙ and the userscript settings, and are sanitized/persisted by the shared engine.
- Engine tests cover the think pause, the quick correct review and the longer mistake review.

### Changed
- **Old click/nav fields hidden.** `click_min` / `click_max` and `nav_min` / `nav_max` are no longer shown in any settings panel; they stay in configs and still act as silent fallbacks.
- **iOS "Gotowe"/"Done" accessory bar.** It now forces the light keyboard, uses the classic palette and reliably hides the number pad through `UIApplication.sendAction`.
- Version bumped to `4.3.0` (userscript `4.3.0`) across `package.json`, the iOS project (`MARKETING_VERSION` 4.3.0 / `CURRENT_PROJECT_VERSION` 40300), the engine default, the desktop renderer, the website, `docs/llms.txt`, README (PL/EN), the wiki, `PROJECT_NOTES.md`, `MOBILE_PLAN.md` and the release notes.

## [4.2.2] - 2026-10-28

### Fixed
- **Navigation-click speed on the phones now really applies.** instaling.pl reloads the page on "next"/"continue"/"start", which destroyed the in-page `setTimeout` that held the `nav_min`/`nav_max` pause. The pause looked right only when the click stayed on the same page; the between-word transition was always as fast as the page load. The shared engine now stores the pause deadline (`navUntil`) before the click and re-applies the remainder at the start of the next tick, so both the result-page "next" and the session "continue"/start wait out `nav_min`/`nav_max` even across a full reload. Covered by two new tests.
- **Desktop session start / continue / new-session now honor `nav_min`/`nav_max`** as well. A shared `navDelays()` helper replaced the inline fallbacks and is reused for the between-word "next".

### Changed
- Version bumped to `4.2.2` (userscript `4.2.3`) across `package.json`, the iOS project (`MARKETING_VERSION` 4.2.2 / `CURRENT_PROJECT_VERSION` 40202), the engine default, the desktop renderer, the website, `docs/llms.txt`, README (PL/EN), the wiki, `PROJECT_NOTES.md` and the release notes.

## [4.2.1] - 2026-10-28

### Added
- **Statistics panel on every platform.** The shared mobile engine (`mobile/engine/engine.js`) now records `sessions` and `durationMs` per day and exposes `periods` (week/month/year/all) mirroring `src/stats.js`. Android (📊 title-bar button + period spinner), iOS (📊 button + segmented control) and the userscript (toggleable panel with tabs) show the same sessions / answers / correct / wrong / accuracy / new words / total time / active days grid as the desktop statistics modal.
- **Restore defaults everywhere.** A button in the desktop app (`Domyślne`), the Android settings dialog, the iOS settings sheet and the userscript panel resets every setting except login, password and language.
- **Shared navigation-button click speed.** New `nav_min` / `nav_max` delays (defaults 2000/4500 ms) drive the "next word", login and session start/continue waits on the desktop (`src/main.js`), in the shared engine and in every shell. Exposed in `config/Config.defaults.json` and the desktop Advanced section.

### Changed
- **Mobile reminder frequency is now a dropdown** (once a day, every 15/30/60/120/180 min) on Android and iOS, matching the desktop select instead of a free-text minutes field.
- **Reminder time is left-aligned** on iOS and in the userscript, next to its label.
- Version bumped to `4.2.1` (userscript `4.2.2`) across `package.json`, the iOS project (`MARKETING_VERSION` 4.2.1 / `CURRENT_PROJECT_VERSION` 40201), the desktop renderer, the website, `docs/llms.txt`, README (PL/EN), wiki, `PROJECT_NOTES.md` and the release notes.

### Fixed
- **Oversized userscript settings panel on Safari.** The panel now uses `max-height: calc(100dvh - 96px)` with a `100vh` fallback and `overscroll-behavior: contain`, so it stays inside the visible viewport and no longer scrolls the page behind it.

### Compatibility
- Desktop/CLI configs, `SavedWords.json`, statistics and reminders are unchanged. `check_min` / `check_max` and `next_word_min` / `next_word_max` remain as internal fallbacks. Mobile apps still do not read `Config.json` and still do not store credentials.

## [4.2.0] - 2026-10-27

### Added
- **All desktop timing controls on mobile and in the userscript.** The Android settings dialog, the iOS settings sheet and the userscript panel now expose `click_min`, `click_max`, `type_min`, `type_max`, `typo_chance` and `type_pause_chance`, matching the desktop Advanced section. The shared engine persists and sanitizes them (`USER_DELAY_KEYS`, `DELAY_BOUNDS`) and restores them per shell.
- **Native reminder repetition.** Android and iOS reminders can repeat every N minutes like the desktop app; both stop firing once a session is finished for the current day. `ReminderReceiver` and the iOS reminder scheduler gate on `last_session_date`, respect the configured time and dedupe once-a-day notifications.
- **Userscript reminder banner.** When a tab opens after the reminder time and today's session is not done, the userscript shows a small in-page banner instead of background notifications; real notifications stay with the phone apps and the OS.

### Changed
- **Classic visual parity.** The website, the desktop window and the userscript panel share one light-gray, Tahoma, square-bevel, navy-title-bar look.
- **Website cleanup.** The hero has a single primary button ("Pobierz dla &lt;your system&gt;") that starts the recommended download and scrolls to the matching install tutorial, plus a "Pobierz dla innego systemu" button. Download cards show only system/minimum version, architecture and file format (no "Chrome w zestawie" / "Apple Silicon" blurbs). CLI instructions are reduced to `--help` and the repository link. New "O bocie" section covers what it is, how it works and how detectable it is. Badges now reflect the current implementations (Android, iOS, userscript, PL/EN, stats, reminders, settings, device detection). Wording fixes ("stronę instaling.pl", removed the iPad-only recommendation).
- **Answer limit removed everywhere.** `max_answers` is gone from the desktop GUI, `config/Config.defaults.json`, `src/main.js`, `desktop/main.js`, the shared engine, the mobile shells and the tests; a run simply follows the page until the session ends.
- Version bumped to `4.2.0` across `package.json`, the iOS project (`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`, regenerated via xcodegen), the engine default, the desktop renderer title/footer, the website, `docs/llms.txt`, README (PL/EN), wiki, `PROJECT_NOTES.md` and release notes.

### Fixed
- Resolved CodeQL alert `java/unused-parameter` in the Android shell (`evaluateJavascript` callback no longer captures an unused value).
- iOS reminder scheduling now rebuilds a bounded batch of one-shot notifications (iOS caps pending local notifications), instead of a single repeating trigger that could not honour "stop once today's session is done".
- **Userscript font and macOS hero button (userscript `4.2.1`).** The userscript panel declares its font on `:host` and forces it onto every shadow descendant, so the font no longer changes after a session starts. On macOS (Safari exposes no Client Hints) the website hero button now downloads the ARM64 `.pkg` and points Intel users to the Intel card instead of only scrolling. The userscript ships as `4.2.1` (app stays `4.2.0`) so managers pull it from `releases/latest` without a new release.
- **Classic theme for the mobile apps (Android/iOS, still `4.2.0`).** Both shells were still using the old dark rounded theme. They now share the desktop/website/userscript look: `#c0c0c0` window, navy gradient title bar, square beveled buttons (`BevelDrawable` on Android, `BevelView`/`ClassicButton`/`GradientBar` on iOS), classic primary/danger buttons, gray status area with black text and a matching settings sheet. The `instaling-bot-4.2.0-android.apk` and `instaling-bot-4.2.0-ios.ipa` release assets were rebuilt and replaced in place.

### Compatibility
- Desktop/CLI configs, `SavedWords.json`, statistics, reminders and update checks are unchanged. An existing `max_answers` key in `Config.json` is simply ignored.
- Mobile apps still do not read `Config.json` and still do not store credentials; the persistent WebView session is the only login state.

## [4.1.0] - 2026-10-27

### Added
- **Download tags on the website.** Every option now lists the operating system and minimum version, architecture and package format in the same order. A new `docs/download-detect.js` detects Windows, macOS (ARM64/Intel via User-Agent Client Hints), Android, iPhone, iPad (including iPadOS Safari reporting `MacIntel`), Linux and unknown systems, highlights the recommended card and updates the hero button. The manual **Your device** selector keeps all other options visible.
- **Mobile settings.** The Android shell gains a ⚙ settings dialog (answer accuracy, answer limit, reminder time via `TimePickerDialog`) and the iOS shell gains a matching settings sheet (`UIDatePicker`). Values are stored in `SharedPreferences`/`UserDefaults`, passed to the engine on load and applied live through `setConfig`.
- **Mobile statistics.** Android, iOS and the userscript read `engine.getStats()` and show today's answers, accuracy and streak.
- **Userscript settings panel.** A persisted `<details>` panel for accuracy, limit and autostart; the popup is centred (`left: 50%`, `translateX(-50%)`), uses `min(340px, calc(100vw - 24px))` and scrolls inside a clamped height.
- **Unified icon.** `scripts/generate-icons.py` now derives Android mipmaps, the iOS 1024 icon, website PNG/ICO favicons and `mobile/userscript/icon.png` from the single source `build/icon.png`. The userscript inlines the icon (`__ICON__`) in its bubble and panel.
- **Engine config API.** `engine.getConfig()`, `engine.setConfig()` (persists only `valid_chance` and `max_answers` under `config`), `engine.getStats()` and `engine.getStats().streak`; `max_answers` is enforced inside `tick()` and ends the run with `log.limitReached`.
- **Tests.** `test/download-detect.test.js` plus new cases in `test/mobile-engine.test.js` for config sanitizing/persistence, stats, streaks, PL/EN parity and the answer limit.

### Changed
- Version bumped to `4.1.0` across `package.json`, the iOS project (`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`, `TARGETED_DEVICE_FAMILY: "1,2"`), the engine default, the desktop renderer title/footer, the website, README (PL/EN), wiki, `docs/llms.txt`, `PROJECT_NOTES.md` and release notes.
- The Android shell no longer appends `instaling-bot-mobile/4.0` to the WebView User-Agent. This is a best-effort reduction of a detectable signature, not a guarantee.
- Android flushes the website cookies (`CookieManager.flush()`) in `onPause`/`onDestroy` so returning to the app keeps the existing session without storing credentials.
- `ReminderReceiver`/`BootReceiver` read the reminder hour and minute from preferences instead of hardcoding 17:00.
- iOS surfaces are explicitly opaque (`webView.isOpaque = true`, matching backgrounds, opaque status bar) to remove the transparent, hard-to-read dark-navy bleed.
- The website FAQ adds a desktop Premium-dialog entry (the page may ask for Premium; dismiss it manually and do not hide the browser window if your account shows it) and documents where the mobile/userscript settings live.
- `TARGETED_DEVICE_FAMILY` now includes iPad, matching the "iPhone/iPad" download tags.

### Security
- CLI `config/Config.json` is now permission-hardened on load (`chmod 600` on POSIX, private `icacls` ACL on Windows), matching the desktop app, so the InstaLing password is not readable by other local users.
- Android no longer delegates non-main-frame navigations to the system browser, so ad iframes cannot trigger external `startActivity` popups.
- Electron denies every web permission (`setPermissionRequestHandler`) and blocks top-level navigation (`will-navigate`); the renderer CSP gained `object-src`, `base-uri` and `form-action` restrictions.
- New `SECURITY_AUDIT.md` records the standing audit, the fixes above and the accepted limitations; `SECURITY.md` now lists 4.1.x as supported.

### Compatibility
- Desktop/CLI configs, `SavedWords.json`, statistics, reminders and update checks are unchanged.
- Mobile apps still do not read `Config.json` and still do not store credentials. The persistent WebView session is the only login state.
- The userscript already remembered words between sessions (`savedWords` in GM storage); 4.1.0 verifies this with tests and leaves the behaviour intact.
- APK/IPA remain outside the Play Store and App Store. Download URLs for 4.1.0 resolve once the `v4.1.0` release assets are published.

## [4.0.0] - 2026-10-27

### Added
- **Android APK** (`instaling-bot-4.0.0-android.apk`): a plain Java WebView shell with a native Start/Stop bar, PL/EN switch, answer counter, daily 17:00 reminder, update button and `instalingbot://start` / `instalingbot://stop` deep links for Tasker/MacroDroid. Works on Android 7+ and survives reboots for the reminder.
- **iOS IPA** (`instaling-bot-4.0.0-ios.ipa`): an unsigned UIKit/WKWebView build for SideStore/AltStore, with the same PL/EN interface, local 17:00 notification, update check and URL scheme for Shortcuts. Built on the GitHub Actions macOS runner.
- **Userscript** (`instaling-bot.user.js`): the shared mobile engine in a floating panel for Safari on iOS/iPadOS (Userscripts extension) and Firefox on Android (Tampermonkey/Violentmonkey). Supports `?autostart=1`, `?lang=en`, GM storage and automatic updates via `@updateURL`.
- `mobile/engine/`: a shared browser-safe session engine with DOM adapters, mobile selectors, PL/EN strings and a tick-based resume model. instaling.pl reloads the page after checking an answer, so the engine persists the run and pending answer, then finishes bookkeeping on the result page.
- `src/core/`: browser-safe answer strategies, typing humanization, RNG and selectors extracted from the desktop/CLI implementation so all shells use one source of truth.
- `scripts/build-mobile.js` (esbuild bundles for the userscript, APK and IPA), `scripts/generate-icons.py` and `MOBILE_PLAN.md`.
- `test/core.test.js` and `test/mobile-engine.test.js` covering typo generation, answer strategies, a complete jsdom session, deliberate mistakes, missing forms and resume-after-reload.
- CI jobs for the userscript bundle, Android debug APK and an unsigned iOS build; the release workflow now produces and attaches APK, IPA and userscript assets alongside the desktop installers.

### Changed
- The desktop/CLI core now imports shared code from `src/core/`; existing exports and behaviour are unchanged.
- `src/main.js` selectors live in `src/core/selectors.js`; desktop and mobile selector lists can evolve independently while sharing the defaults.
- Version bumped to `4.0.0` across `package.json`, the Android Gradle build (version name read from `package.json`), the iOS project, README, site, wiki and release notes.

### Compatibility
- Desktop and CLI configs, `SavedWords.json`, statistics, reminders and update checks are unchanged.
- Mobile apps do not read `Config.json` and do not store credentials; login happens in the normal WebView session.
- Mobile reminders fire at a fixed 17:00 and do not repeat every N minutes. Background sessions are out of scope for 4.0.
- APK/IPA remain outside the Play Store and App Store; the IPA needs SideStore/AltStore and a 7-day refresh on a free Apple ID.

## [3.3.2] - 2026-10-27

### Changed
- The desktop no-internet dialog only asks you to check the connection; it no longer appends a "Help: README FAQ" hint for offline errors, and the **README FAQ** button is hidden on those dialogs. The button still appears for other bot errors.
- README (PL/EN) now shows the two most recent releases instead of only the current one; the full history stays in `CHANGELOG.md`.

### Docs
- Corrected offline/dialog descriptions in the README and the project page FAQ and `FAQPage` structured data.

### Compatibility
- No config, data or behaviour changes outside the offline dialog text and button visibility.

## [3.3.1] - 2026-10-27

### Added
- Daily update checks (startup, every 24 hours and at every session start) shared by the running app, including minimized/tray mode. Session completion never triggers a check.
- Tray update state: the icon gains a red badge on Windows/Linux and an extra 4×4 block on the macOS template glyph, the tooltip names the new version, and the tray menu exposes an **Update available** item that opens the release page.
- **Support on Ko-fi** item in the tray menu, directly below **Show window**.

### Changed
- Update checks no longer run every six hours; the interval is now 24 hours.
- A failed update check keeps a previously found update visible instead of clearing the badge and banner.

### Compatibility
- No config changes. Existing `Config.json`, statistics, reminders and saved words remain compatible.
- Updates remain manual (download and run the new installer) because builds are unsigned.

## [3.3.0] - 2026-10-27

### Added
- Polish/English desktop interface with a **PL/EN** switch in the menu bar. The choice is stored as `language` in `Config.json` and also translates the settings, dialogs, statistics, tray menu and native notifications. Bot engine console output remains in Polish.
- `notifications.session_finished` (default `true`) and a settings checkbox for the session-finished notification. It fires when the window is hidden in the tray or minimized; a visible window is not duplicated.
- Security Phase 1: `Config.json` is written with owner-only permissions (`chmod 600` on macOS/Linux, best-effort private ACL via `icacls` on Windows), passwords are redacted from logs and notifications, and `INSTALING_LOGIN` / `INSTALING_PASSWORD` override stored credentials.
- The desktop app shows when credential fields are supplied by environment variables and disables them to avoid accidental overwrites.
- Community health files: `SECURITY.md`, `CONTRIBUTING.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, issue and pull request templates, and discussion templates for Q&A and Ideas.
- CI workflow covering syntax checks, unit tests with `node:test`, whitespace, the `install.sh` shell script and CLI smoke tests; CodeQL analysis for JavaScript; Dependabot updates for npm and GitHub Actions.
- Wiki source under `wiki/` with a `scripts/sync-wiki.sh` helper, plus a welcome discussion in the repository.
- Repository hardening: protected `master` with a required CI check, private vulnerability reporting, secret scanning push protection, Dependabot alerts and security updates, squash-only merges and automatic branch deletion.
- Security hardening from CodeQL: `sites.login` must be the official HTTPS `instaling.pl` login page and navigation uses a fixed constant, login typing errors no longer carry credential values into the log, and errors are logged by message only.
- Search engine and link-preview metadata for the project page: cleaner title and site name, `WebSite` plus updated `SoftwareApplication` structured data, Open Graph and Twitter images, `FAQPage` data, favicon, `llms.txt`, refreshed sitemap, IndexNow submission script and a 1200x630 social preview.

### Changed
- README now has CI, CodeQL, release, license and discussions badges, plus a community and support section.
- Added an English README (`README.en.md`) with a language switcher at the top of both README files.
- The project roadmap now targets signed builds, encrypted credentials, SQLite, regression fixtures, OS-level reminders and a later userscript/mobile experiment; Linux desktop builds are explicitly out of scope (Linux stays on the CLI).

### Compatibility
- Existing configs receive `notifications.session_finished: true` automatically through the defaults merge. Stored credentials keep working; environment overrides are optional.
- `Config.json` permissions are tightened on the next desktop launch/write. Filesystems without POSIX permissions or ACL support are ignored gracefully.
- Updates remain manual (download and run the new installer) because builds are unsigned.

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

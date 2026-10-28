# instaling-bot mobile plan (4.0–4.2)

Status: implemented — 4.0.0 shipped the shells, 4.1.0 added settings and statistics, 4.2.0
added the full timing controls, repeating native reminders, the userscript reminder banner
and classic visual parity, 4.2.1 brought statistics, restore-defaults and the shared
`nav_min`/`nav_max` navigation delays to every platform, 4.2.2 made the navigation pause
survive instaling.pl's page reloads, and 4.3.0 replaced the click/nav fields with three
human-like pause ranges and fixed the iOS keyboard accessory bar.
Last updated: 2026-10-28

## Goal

Bring instaling-bot to phones without compromising the desktop or CLI experience:

- **Android:** sideloaded APK, easy enough for non-technical users.
- **iOS:** Safari userscript for everyone; unsigned IPA for SideStore/AltStore users.
- **Everywhere:** PL/EN interface, saved words, humanized typing, daily reminder, update check.
- **Not a downgrade:** the mobile experience should match the desktop basics as closely as possible.

## Reality check

- Chrome for Android does not support extensions, so a userscript cannot run in Chrome.
  Android userscript support means Firefox Android + Tampermonkey/Violentmonkey or a
  Chromium fork. The APK is therefore the primary Android path; the userscript is a
  power-user fallback and the primary iOS path.
- Play Store and App Store automation policies are hostile to bots. Mobile ships as
  signed-by-us APK and unsigned IPA, like the existing unsigned desktop installers.
- iOS free accounts expire after 7 days; SideStore/AltStore handle re-signing.
- No credentials are stored on mobile. The shell reuses the webview's normal login session.

## Architecture

One shared engine, three thin shells:

```
src/core/                  pure JS: mistakes, typos, answer choice, typing plan, i18n helpers
mobile/engine/             DOM adapter + session loop + storage adapter + bridge
mobile/userscript/         panel UI, GM storage, metadata header
mobile/android/            Java WebView shell + AlarmManager reminder + deep link
mobile/ios/                Swift WKWebView shell + local notification + URL scheme
scripts/build-mobile.js    esbuild bundles: userscript + Android/iOS assets
```

- The engine never touches `fs`, `puppeteer` or Electron.
- Native shells only: show the WebView, inject the engine, render a small native bar
  (start/stop, language, status), schedule reminders, open links.
- JS posts status to native through a bridge (`AndroidBot` interface / WKScriptMessageHandler).

## Phases

### Phase 0 - core extraction and mobile DOM proof

- Move typo/misspell/error-mode/answer-choice/typing-plan logic into `src/core/` with unit tests.
- Keep desktop imports stable (re-export from existing modules) so 3.x does not regress.
- Capture logged-in mobile DOM for the four key screens (question, new word, result, next).
- Prove a minimal injected loop: read prompt -> type answer -> check -> next.

Deliverable: `src/core/` + tests, mobile fixtures, spike script.

### Phase 1 - userscript (3.4.0 beta)

- `mobile/userscript`: floating panel with Start/Stop, PL/EN switch, status line, log count.
- Humanized typing and configurable accuracy (reuse desktop defaults).
- Saved words in `GM_setValue` (with `localStorage` fallback).
- Auto-start via `?autostart=1` for iOS Shortcuts and Android automation.
- Update check through `@updateURL` pointing at the release asset.
- Docs: Firefox Android, iOS Userscripts app, known limitations.

### Phase 2 - Android APK (4.0.0)

- Plain Java WebView shell (no AndroidX) to keep the APK small and the build simple.
- Big Start/Stop button, PL/EN switch, status text, link to the release page.
- First launch: user logs in on instaling.pl; cookies persist.
- Daily reminder via `AlarmManager` + `BOOT_COMPLETED` receiver; Android 13+ notification permission.
- Deep link `instalingbot://start` for Tasker/MacroDroid; optional Quick Settings tile later.
- Debug-signed local build for testing; release keystore secrets in CI.
- Attach `instaling-bot-<version>-android.apk` to the GitHub release.

### Phase 3 - iOS

- Easy path: Safari userscript via the free Userscripts extension, with screenshots.
- Advanced path: unsigned `.ipa` built on a macOS CI runner, attached to the release for
  SideStore/AltStore. Document the 7-day refresh and SideStore auto-renew.
- Local notification reminder (`UNCalendarNotificationTrigger`).
- URL scheme `instalingbot://start|stop|stats`; works with Shortcuts automation.
- Optional SideStore source JSON so the IPA updates in place.

### Phase 4 - polish

- In-app update check and download link for APK/IPA.
- Stats parity and export (same JSON shape as desktop).
- Widgets/quick actions only if there is demand.
- Background unattended sessions are explicitly out of scope for 4.0.

## Feature matrix

| Feature | Desktop | Userscript | Android APK | iOS IPA |
|---|---|---|---|---|
| PL/EN interface | yes | yes | yes | yes |
| Humanized typing | yes | yes | yes | yes |
| Timing settings (click/nav/type/pause/typo + accuracy) | yes | yes | yes | yes |
| Daily reminder | yes (repeating) | in-page banner | yes (repeating) | yes (repeating) |
| Statistics (day/week/month/year/all) | yes | yes | yes | yes |
| Update check | yes | yes | yes | yes |
| Saved words | file | GM storage | WebView storage | WKWebView storage |
| Automation | tray/CLI | `?autostart=1` | deep link | URL scheme/Shortcuts |
| Login | app | existing session | existing session | existing session |
| Background session | yes | no | no (v1) | no |

## Testing

- `node --test` for core logic (typos determinism, error modes, answer choice).
- Fixture-driven DOM tests for selector adapters (desktop + mobile snapshots).
- Android: Gradle `assembleDebug` + `lint` in CI; manual install on a device/emulator.
- iOS: `xcodebuild` unsigned build on CI; manual SideStore install.
- Userscript: syntax check + bundle check in CI; manual test on Firefox Android and Safari iOS.

## Release strategy

Shipped as one 4.0.0 release instead of a separate 3.4.0 beta:

- **4.0.0**: shared core + userscript + APK + IPA + docs + automation bridge.
- Assets: existing `.exe`/`.pkg` plus `-android.apk`, `-ios.ipa`, `-userscript.user.js`.
- Sideloading warnings and unsigned-build notes stay prominent.

## Risks

- Mobile DOM may differ enough to need dedicated selectors; Phase 0 gates the rest.
- Three shells to maintain: keep them dumb, put all logic in the shared engine.
- iOS signing needs a Mac/CI runner and a 7-day refresh for free accounts.
- Automation/ToS: same educational disclaimer; no credential storage; code remains readable.
- Play Store/App Store review: not attempted in 4.0.

## Non-goals

- Linux desktop build (Linux stays CLI).
- Cloud sync, accounts, telemetry.
- Native mobile apps in stores.
- Credential storage on phones.


## Implementation notes (4.0.0)

- `src/core/` is browser-safe and re-exported by `src/mistakes.js`/`src/helpers.js`, so desktop/CLI behaviour is unchanged.
- `mobile/engine/` is tick-based because instaling.pl navigates after "check". The run and a `pending` answer are persisted before the click; the result page finishes stats/saved words and clears `pending`.
- A persisted run older than 15 minutes is ignored, so opening the site later does not silently resume an old session.
- CI builds the userscript, an Android debug APK and an unsigned iOS app. Release automation attaches `.apk`, `.ipa` and `.user.js` next to the desktop installers.
- The IPA is built with `CODE_SIGNING_ALLOWED=NO`; users sign it in SideStore/AltStore.

## Implementation notes (4.2.0)

- **Timing settings.** The Android settings dialog, the iOS settings sheet and the userscript
  panel now surface the same Advanced controls as the desktop: `click_min`, `click_max`,
  `type_min`, `type_max`, `type_pause_chance`, `typo_chance` and `valid_chance`. The shared
  engine persists and sanitizes them per shell through `USER_DELAY_KEYS` and `DELAY_BOUNDS`,
  and restores them on load.
- **Repeating reminders.** Android and iOS reminders can repeat every N minutes
  (`reminder.repeat_minutes`) like the desktop and stop once the current day's session is
  finished (`last_session_date`). Android tracks the date with `dateKey(Calendar)` and gates
  `ReminderReceiver` on completed sessions/time, deduping once a day; the iOS shell rebuilds a
  bounded batch of one-shot local notifications because iOS caps pending notifications.
- **Userscript reminder banner.** Instead of background notifications, the userscript shows an
  in-page banner when a tab opens after the reminder time and today's session is not done.
- **Visual parity.** The desktop window, the userscript panel and the website share one classic
  light-gray, Tahoma/MS Sans Serif, square-bevel, navy-title-bar look.

## Implementation notes (4.2.1 – 4.3.0)

- **Statistics on every shell.** `mobile/engine/engine.js` records `sessions` and `durationMs`
  per day and exposes `periods` (week/month/year/all) mirroring `src/stats.js`, so Android
  (📊 + period spinner), iOS (📊 + segmented control) and the userscript panel show the same
  grid as the desktop.
- **Restore defaults.** Each shell's settings surface has a reset button that clears every
  option except login, password and language.
- **Shared navigation delays.** `nav_min`/`nav_max` (defaults 2000/4500 ms) drive the "next
  word", login and start/continue waits in the engine, in `src/main.js` and in every shell;
  reminder frequency on Android/iOS became a dropdown matching the desktop select.
- **Reload-safe navigation pause (4.2.2).** Because instaling.pl reloads on "next"/"continue",
  the engine persists the pause deadline (`navUntil`) before the click and re-applies the
  remainder at the start of the next tick instead of relying on an in-page `setTimeout`.
- **Human-like pauses (4.3.0).** Three random ranges replace the old click/nav fields:
  `think_*` before typing, `review_*` before "next" after a mistake or new word, and
  `review_correct_*` after a correct answer. `completePending()` returns the correctness so
  both the in-page and reloaded paths pick the right pause; the old keys stay as fallbacks.
  Every shell shows the six new fields instead of click/nav.
- **iOS keyboard accessory (4.3.0, rebuilt in 4.3.1).** `makeNumberField` sets `.light`
  keyboard appearance and the Done button calls
  `UIApplication.sendAction(#selector(UIResponder.resignFirstResponder))` so the number pad
  always closes. Since iOS 26 renders a `UIToolbar`'s `.done` item as a glass capsule over
  the field, 4.3.1 uses a transparent `UIView` accessory that holds only a 104×36 beveled
  `ClassicButton`, pinned 12 pt from the trailing edge.
- **UIScene adoption (4.3.1).** Apps built with the iOS 26 SDK must use the scene lifecycle;
  without it UIKit traps at launch. `SceneDelegate` now creates the window and the
  `MainViewController`, and `UIApplicationSceneManifest` is declared in `project.yml`.
  `AppDelegate` only owns notifications and resolves the `instalingbot://start|stop` links.
- **Oversized userscript panel (fixed in 4.2.1).** The panel uses
  `max-height: calc(100dvh - 96px)` with a `100vh` fallback and `overscroll-behavior: contain`.

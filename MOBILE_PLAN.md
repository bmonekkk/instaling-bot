# instaling-bot mobile plan (4.0)

Status: implemented in 4.0.0
Last updated: 2026-10-27

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
| Daily reminder | yes | no (browser) | yes | yes |
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

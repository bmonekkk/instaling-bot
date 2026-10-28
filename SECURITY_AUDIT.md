# Security audit — instaling-bot 4.3.1

Scope: desktop (Electron), CLI + shared core, browser userscript, Android WebView APK,
iOS WKWebView IPA, website, and the CI/release pipeline. This is a **self-assessment**, not
an external penetration test, and it does **not** claim the project is fully secure. Every
finding below is either fixed (in 4.1.0, 4.2.0 or 4.2.2), mitigated by design, or listed as an
accepted limitation.

## 4.3.0 / 4.3.1 — no security-surface change

4.3.0 replaces the click/nav timing fields with three pause ranges (`think_*`, `review_*`,
`review_correct_*`) and touches the iOS keyboard accessory. The new values are stored in the
same `SharedPreferences`/`UserDefaults`/GM storage as the existing delays and are clamped by
`USER_DELAY_KEYS`/`DELAY_BOUNDS`; no new network calls, trust boundaries or stored data were
added. 4.3.1 adopts the `UIScene` lifecycle on iOS (the `instalingbot://start|stop` deep links
move to `SceneDelegate`, with the same scheme check and the same bridge token), redraws the iOS
accessory and restyles the Android chrome — UI only, no new permissions, storage keys or
endpoints.

## 4.2.1 / 4.2.2 — no security-surface change

4.2.1 (statistics on every platform, restore-defaults button, shared `nav_min`/`nav_max`
navigation delays, reminder-frequency dropdown) and 4.2.2 (persisting the `navUntil` pause
deadline across page reloads, and honoring nav delays on desktop session start/continue) are
behaviour/UI changes only. They add no new network calls, no new trust boundary and no new
stored data: the new timings live in the same `SharedPreferences`/`UserDefaults`/GM storage as
the existing delays and are clamped by `USER_DELAY_KEYS`/`DELAY_BOUNDS`; statistics are
computed from the local run counter already kept on each shell.

## Fixes shipped in 4.2.0

| ID | Finding | Severity | Change |
|---|---|---|---|
| D4 | The Android `evaluateJavascript` callback captured a value it never used, raising CodeQL `java/unused-parameter`. | Code quality | `MainActivity.java` no longer captures the unused parameter in the callback. No behaviour change, no new trust boundary. |

The rest of the 4.2.0 mobile work does not change the security surface: the shells and the
userscript now expose the same timing controls the desktop already had (still only stored in
`SharedPreferences`/`UserDefaults`/GM storage and clamped by the engine's `USER_DELAY_KEYS`/
`DELAY_BOUNDS`), native reminders repeat through the existing `AlarmManager`/local-notification
paths and stop once the day's session is done, and the userscript's reminder is an in-page
banner rather than a background notification. No `Config.json` access, no credential storage.

## Summary of fixes shipped in 4.1.0

| ID | Finding | Severity | Change |
|---|---|---|---|
| R1 | CLI `config/Config.json` was created/read with the ambient umask, exposing the InstaLing password to other local users (`0644` on a typical system). Desktop already hardened the same file. | Low–Medium (local) | `src/config.js` now applies best-effort `chmod 600` (POSIX) / private `icacls` ACL (Windows) on load, mirroring `desktop/main.js`. Verified: `644 → 600`. |
| R4 | Android `shouldOverrideUrlLoading` did not check `request.isForMainFrame()`, so ad iframes could trigger `startActivity` (unwanted browser popups / phishing surface). | Low | `MainActivity.java` now lets subframes load inside the WebView and only delegates **top-level** navigation to the system browser. |
| D1 | Electron had no explicit permission-request policy. | Defense-in-depth | `desktop/main.js` denies every web permission via `setPermissionRequestHandler`. |
| D2 | Electron had no `will-navigate` guard; a renderer navigation would keep the preload bridge and IPC access. | Defense-in-depth | `desktop/main.js` blocks top-level navigation with `will-navigate`. |
| D3 | Desktop CSP lacked `object-src`, `base-uri` and `form-action`. | Defense-in-depth | `desktop/renderer/index.html` CSP tightened to `object-src 'none'; base-uri 'none'; form-action 'none'`. The settings form already calls `preventDefault()`, so submission is unaffected. |

## Verified protections (unchanged, still in place)

- **Auth/login:** credentials are only typed after the canonical `https://instaling.pl`
  login check; the config `sites.login` is validated but never used for navigation
  (`src/urls.js`, `src/main.js`). `INSTALING_LOGIN` / `INSTALING_PASSWORD` can keep
  credentials off disk entirely.
- **Electron:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`;
  narrow `contextBridge` preload; `assertSender` on every IPC handler; local `loadFile`
  only; external URLs HTTPS-only; strict renderer CSP; config file chmod/ACL.
- **Android:** `allowBackup="false"`, `usesCleartextTraffic="false"`; WebView file/content
  access disabled, no mixed content, no form saving; HTTPS `instaling.pl`-only navigation
  allowlist; engine injected only on the bot host; JS bridge guarded by a per-injection
  token and the top-level URL; only the `BOOT_COMPLETED` action accepted by `BootReceiver`.
- **iOS:** ATS `NSAllowsArbitraryLoads = false`; `WKUserScript` main-frame only; message
  handler validates name + page URL + token + JSON; navigation allowlist; no auto window
  opening; no password storage.
- **Mobile (both):** no `Config.json`, no password storage; only settings/reminder in
  `SharedPreferences`/`UserDefaults`; the site session lives in the WebView cookie store.
- **Userscript / engine:** no `eval`/`new Function`, no untrusted `innerHTML`; `@match`
  limited to `instaling.pl`; GM storage namespaced and parse-safe; persisted config limited
  to `valid_chance` and the user timing controls, and clamped; stale runs (>15 min) are not
  resumed.
- **Website:** no external subresources, no forms, no dynamic HTML injection, all output via
  `textContent`/`setAttribute` from static maps.
- **CI:** PR/CodeQL workflows are read-only, no `pull_request_target`, no secrets echoed,
  most jobs use `npm ci --ignore-scripts`, releases use `--verify-tag`; Dependabot covers
  npm, Actions and Gradle.
- **Repo hygiene:** no committed credentials, keystores or private keys (including reachable
  history); runtime state and real configs are gitignored.

## Accepted limitations (not fixed)

These are known, documented and considered acceptable for a free, sideloaded, open-source
tool. They are **not** claiming to be solved.

1. **Distribution integrity (Medium, by design).** Windows/macOS installers, the APK and the
   IPA are **unsigned by a store**; desktop updates download a new installer; the Android
   release build falls back to the debug key when no keystore secret is set; the CLI
   `curl | bash` installer and the bundled-Chrome fetch are not checksum-pinned in-repo.
   Users cannot cryptographically verify downloads. `src/update.js` only detects a newer
   release and links to it — it never downloads or executes anything.
2. **Unauthenticated deep links (Low).** `instalingbot://start|stop` (Android exported
   activity and iOS URL scheme) can be triggered by any app or web page. Impact is limited
   to starting/stopping automation; no data is disclosed. Removing the deep-link filters
   would remove Tasker/Shortcuts integration.
3. **Engine is a page global (Low, mobile).** `window.__instalingBotEngine` exposes
   `getSavedWords()`/`getStats()` to same-origin scripts on `instaling.pl`. Isolating it in
   a separate JS world (Android isolated world / iOS `WKContentWorld`) is a future
   improvement.
4. **Local file permissions for non-secret state (Low).** CLI `stats.json`,
   `SavedWords.json`, `reminder-state.json` and the desktop log file use default modes and
   are not chmod-hardened. Diagnostics (`pages/`, `screenshots/`) store page HTML that may
   contain session/CSRF tokens.
5. **Electron returns the saved password to the renderer** (expected, so the settings field
   can be prefilled). The password lives in renderer memory while the window is open.
6. **Supply chain (Low–Medium).** GitHub Actions are pinned to mutable major tags rather
   than commit SHAs; `release.yml` grants workflow-wide `contents: write`; no build
   provenance/SBOM. Hardening planned but not done yet as of 4.3.1.
7. **Swift is not covered by CodeQL** (JS/TS and Java/Kotlin only).

## Reproducing the checks

```sh
npm run check          # syntax-check every source file
npm test               # unit tests, including urls/credentials/config-adjacent suites
npm audit              # 0 known vulnerabilities
npm run build:mobile   # bundles userscript + both WebView cores
cd mobile/android && ./gradlew assembleRelease
```

Static analysis: CodeQL `javascript-typescript` + `java-kotlin`, Dependabot (npm, Actions,
Gradle) and GitHub secret scanning are enabled on the repository.

If you find something we missed, report it privately per [`SECURITY.md`](SECURITY.md).

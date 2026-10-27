# instaling-bot 🤖

**🇵🇱 [Polski](README.md) · 🇬🇧 English**

A bot that automatically solves vocabulary exercises on [instaling.pl](https://instaling.pl) — now also as a **desktop app for Windows and macOS**.

<p align="center">
  <img src="docs/demo.gif" alt="Cat meme — i'm gonna touch u" width="480">
</p>

**Project site:** https://bmonekkk.github.io/instaling-bot/
**Latest release:** https://github.com/bmonekkk/instaling-bot/releases/latest
**Wiki:** https://github.com/bmonekkk/instaling-bot/wiki
**Discussions:** https://github.com/bmonekkk/instaling-bot/discussions

[![CI](https://github.com/bmonekkk/instaling-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/bmonekkk/instaling-bot/actions/workflows/ci.yml)
[![CodeQL](https://github.com/bmonekkk/instaling-bot/actions/workflows/codeql.yml/badge.svg)](https://github.com/bmonekkk/instaling-bot/actions/workflows/codeql.yml)
[![Release](https://img.shields.io/github/v/release/bmonekkk/instaling-bot?label=release)](https://github.com/bmonekkk/instaling-bot/releases/latest)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Discussions](https://img.shields.io/github/discussions/bmonekkk/instaling-bot?label=discussions)](https://github.com/bmonekkk/instaling-bot/discussions)

The current version (**4.0.0**) is the first mobile release:

- 🖥️ **desktop** for Windows and macOS: GUI, live log, statistics and a bundled Chrome,
- 📱 **Android APK** and **iOS**: one shared engine, PL/EN interface, reminders and automation shortcuts,
- 🌐 **userscript** for Safari on iOS/iPadOS and Firefox on Android,
- ⌨️ a full **CLI** for Linux and the terminal, installed with a single `curl` command,
- 🧠 human-like typing: random delays, micro-pauses, typos fixed with backspace and three kinds of deliberate mistakes.

Version 4.0.0 brings the same engine to phones without the Play Store or App Store. The mobile apps are thin shells: you sign in to `instaling.pl` in their built-in browser, and the bot answers in the open session. The mobile app does not store your password — it stays in the normal website session. The study reminder is native (daily at 17:00), and starting a session can be wired to system shortcuts. Desktop and CLI keep every 3.3.x feature.

Open source, ISC license.


## 💙 Support the project

Instaling Bot is an independent open-source project maintained as a hobby. If you find it useful and want to support the time I spend developing, testing and maintaining it, you can buy me a virtual coffee.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H5P529J2VO)

Support is entirely voluntary and not required to use the project. The project is not officially affiliated with InstaLing. Donations do not guarantee specific features or release dates.


## ✨ Four variants, one engine

| | Desktop | Android APK / iOS IPA | Userscript | CLI |
|---|---|---|---|---|
| Systems | Windows 10/11, macOS 13+ | Android 7+ / iOS 16+ | Safari iOS, Firefox Android | Linux, macOS, Windows |
| Requires Node.js | **No** | **No** | **No** | Yes, Node.js 22+ |
| Interface | App window, settings, live log | Native bar + page in a WebView | Floating panel on the page | Terminal |
| Login | In the app | Normal website login | Normal website login | In the app |
| Browser | Chrome for Testing bundled | System WebView | Your browser | Puppeteer |
| Statistics | week, month, year, all time | current session + daily record | current session | `instaling-bot stats` |
| Reminders | Native + toast, optionally every N minutes | Daily at 17:00 | — | `instaling-bot remind` |
| Automation | Tray, autostart | `instalingbot://start` / `stop` | `?autostart=1` | CLI commands |
| Updating | New installer | **Update** button | Automatic via `@updateURL` | Re-run `curl` |

Every variant uses the same engine (`src/core/` and `mobile/engine/`), the same answer strategies and typing humanization. Saved words stay local: desktop/CLI in `SavedWords.json`, mobile in WebView storage, and the userscript in `GM_setValue`.

The desktop interface works in Polish and English. Switch languages with the **PL/EN** buttons in the menu bar; the choice is saved in `Config.json` (`language`) and also covers the tray menu and native notifications.

The session-finished notification is on by default and appears only when the window is hidden in the tray or minimized — turn it off with **Notify me when a session finishes**. `Config.json` is written with owner-only permissions (`600` on macOS/Linux, a private ACL on Windows), and passwords are redacted from logs and notifications. Instead of storing a password in the file, you can set `INSTALING_LOGIN` and `INSTALING_PASSWORD` — they take precedence over the config.


## 🖥️ Desktop: Windows and macOS

Download an installer from the [latest release](https://github.com/bmonekkk/instaling-bot/releases/latest):

- **Windows:** `instaling-bot-4.0.0-setup-win64.exe` (NSIS, x64)
- **macOS Apple Silicon:** `instaling-bot-4.0.0-macos-arm64.pkg`
- **macOS Intel:** `instaling-bot-4.0.0-macos-x64.pkg`

The desktop installer includes its own Chrome for Testing browser. You do not need to install Node.js or Chrome.

### 📥 Installation and first run

1. Run the installer.
2. Open **instaling-bot**.
3. Enter your InstaLing login and password.
4. Set the answer accuracy (`80%` by default) and the answer limit (`0` = no limit).
5. Press **Start**.

The bot opens a separate Chrome window, logs in, starts or resumes a session and answers the vocabulary prompts. Progress, the answer counter and errors are shown in the app console. The **Statistics** button shows sessions, answers, accuracy and time for the last 7 days, 30 days, a year or all time.

### ⏰ Daily session reminder

In settings, enable **Remind me about the daily session** and pick a time (default `17:00`). While the app is running — including when hidden in the tray — a system notification and an in-app toast appear at the chosen time. **Repeat reminder** sends it again every 15, 30, 60, 120 or 180 minutes until you complete a session. The reminder is skipped if the bot has already answered at least one word that day.

Optionally enable **Keep running in the tray when the window is closed** (the window hides instead of closing) and **Launch at system login**. Without these options the app simply has to be open.

### 🚀 Autostart and background mode

Both switches are in **Settings → Reminders and background mode**:

| Autostart | Tray mode | What happens after login |
|---|---|---|
| ✅ | ❌ | The normal app window opens |
| ✅ | ✅ | No window — only a tray icon (Windows) / menu bar icon (macOS) |
| ❌ | ✅ | Normal window on manual start; closing hides it to the tray |

- Autostart is **off by default** and applies to the desktop app; the CLI is started manually.
- To start silently, enable **both** switches. Autostart alone opens a window on the desktop.
- On macOS, tray mode hides the Dock icon and switches the app to accessory mode — only the menu bar icon remains, adapting to light/dark mode.
- After closing the window in tray mode, the app destroys the window (rather than just hiding it) to use less RAM in the background. The interface is recreated when you click the icon.
- You can start a session from the icon menu (**Start**). When it finishes, you get a system notification with the answer count — provided **Notify me when a session finishes** is enabled and the window is hidden or minimized.
- The tray icon also offers **Stop**, **Show window**, **Support on Ko-fi** and **Quit**, plus an **Update available** item when a newer release exists.

### 🔄 Updates

The app checks the [latest GitHub release](https://github.com/bmonekkk/instaling-bot/releases/latest) at startup, once a day and whenever a session starts — including while minimized or in the tray. Finishing a session does not trigger a check. When a newer version appears, a banner with a **Download** button opens the release page and the tray icon changes (a red badge on Windows/Linux, an extra shape on macOS). Installers are unsigned, so updating means downloading and running the new installer — the app never downloads or installs anything by itself. You can also check manually with the **Check for updates** button in the console.

### 🔐 Installers are unsigned

There is no code-signing certificate yet, so the system may warn you on first launch:

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** right-click the installer → **Open**, or approve the app in **System Settings → Privacy & Security**.

This is normal for unsigned builds. Later versions may be signed if a certificate becomes available.

### 📡 Offline and errors

When the app cannot reach the internet, it shows a dialog asking you to check the connection, with a **Close** button — no FAQ link, since the FAQ cannot be opened without internet anyway. The dialog closes **only with the Close button** — it does not disappear when the network returns or when you click the background. On a bot error (for example a page layout change or rejected login) an additional **README FAQ** button leads to the [Troubleshooting](#-troubleshooting) section.

### 📁 Where does the app keep its data?

The **Data folder** button in the app opens the right directory:

- Windows: `%APPDATA%\instaling-bot`
- macOS: `~/Library/Application Support/instaling-bot`

It contains:

```
config/Config.json        settings and credentials
config/SavedWords.json    remembered translations
stats.json                session statistics (shared with the CLI)
pages/                    diagnostic HTML dumps
screenshots/              diagnostic screenshots
logs/last-run.log         full log of the last run
```

You can edit the files by hand too — the app uses the same format as the CLI.


## 📱 Mobile: Android and iOS

Version 4.0.0 brings the bot to phones. The mobile apps are not a cut-down imitation: they use the **same answer engine**, typing humanization, saved words and PL/EN interface as the desktop. The difference is the shell — on a phone the bot runs while the app or browser tab is open, with no background automation.

### 🤖 Android: APK (recommended)

1. Download `instaling-bot-4.0.0-android.apk` from the [latest release](https://github.com/bmonekkk/instaling-bot/releases/latest).
2. Open the file and allow installation from this source when Android asks.
3. Launch **instaling-bot** and sign in to `instaling.pl` in the app window.
4. Open the learning page and press **Start** in the top bar.

The top bar has a **PL/EN** switch, a ⏰ reminder, Start and Stop. Session progress is shown below it. When a newer release exists, the app shows an **Update** button linking to GitHub.

**Reminder:** tap ⏰ to enable a daily notification at **17:00**. Android 13+ asks for notification permission. The reminder survives a reboot.

**Automation:** the app handles `instalingbot://start` and `instalingbot://stop` deep links. In Tasker, MacroDroid or a similar tool, add an "Open URL/Intent" action to start a session, for example when you connect to your home Wi-Fi. The bot still needs the app open and the website session signed in.

### 🍎 iOS: Safari + userscript (easiest)

Chrome on iOS does not support extensions, but Safari does:

1. Install the free **Userscripts** app from the App Store.
2. Enable it in **Settings → Safari → Extensions** and allow it on `instaling.pl`.
3. Open [instaling-bot.user.js](https://github.com/bmonekkk/instaling-bot/releases/latest/download/instaling-bot.user.js) in Safari and import it into Userscripts.
4. Visit `instaling.pl`, sign in and tap the floating 🤖 button.

The panel has Start/Stop, PL/EN and an answer counter. Settings and saved words live in the extension storage. The script updates itself through `@updateURL`.

### 🍏 iOS: IPA for SideStore / AltStore

For people who prefer a separate app:

1. Download `instaling-bot-4.0.0-ios.ipa` from the latest release.
2. Install [SideStore](https://sidestore.io/) or AltStore and add the IPA.
3. Sign in to `instaling.pl` in the app and press **Start**.

The IPA is **unsigned** — you sign it with your own Apple ID. A free account needs a refresh every **7 days**; SideStore can do that automatically. The app has the same PL/EN switch, 17:00 reminder and update button.

**Shortcuts:** the app accepts `instalingbot://start` and `instalingbot://stop`, so an iOS automation can start a session. The session only runs while the app is in the foreground.

### 🌐 Userscript on Android

Chrome for Android has no userscript manager. Use **Firefox for Android** with **Tampermonkey** or **Violentmonkey** and install the same `instaling-bot.user.js`. This is a good option if you do not want to install the APK.

You can also open the page with parameters: `?autostart=1` starts a session after loading, and `?lang=en` switches the interface to English — useful in shortcuts and automations.

### ⚠️ Mobile limitations

- A session runs only while the **app or tab is open**. The phone may suspend a WebView in the background; there is no hidden background mode.
- The mobile apps **do not store your password** — you sign in normally on the website, and cookies stay in the WebView.
- The APK and IPA are **not store-signed**. Install them at your own risk; they are not in the Play Store or App Store.
- The mobile reminder fires at a fixed time, without the desktop's repeat-every-N-minutes option.
- Full week/month/year statistics and saved-word export remain desktop-only.


## ⌨️ CLI: Linux and the terminal

The CLI remains supported as long as the desktop version exists. It is the recommended option for Linux and for everyone who prefers the terminal.

### ⚡ One-command installation

Node.js 22+ is required ([nodejs.org](https://nodejs.org/)). The whole program installs to `~/.local/share/instaling-bot`, and the `instaling-bot` launcher goes to `~/.local/bin`:

```bash
curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh | bash
```

The script preserves an existing `config/Config.json` and `SavedWords.json` when reinstalling. If `~/.local/bin` is not in `PATH`, add this to `~/.zshrc` or `~/.bashrc`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 🧰 Installing from source

```bash
git clone https://github.com/bmonekkk/instaling-bot.git
cd instaling-bot
npm install --omit=dev
cp config/Config.defaults.json config/Config.json
```

Fill in the credentials in `config/Config.json`:

```json
"credentials": {
    "login": "your-login-or-email",
    "password": "your-password"
}
```

`config/Config.json` and `config/SavedWords.json` are ignored by git, so credentials and saved words never reach the repository.

### 📋 Commands

```bash
instaling-bot help              # list commands and options
instaling-bot start             # check for updates, then start a session
instaling-bot                   # same as start
instaling-bot stats             # week, month, year and all time
instaling-bot stats --period month
instaling-bot stats --json      # output for scripts
instaling-bot remind            # background session reminder (Ctrl+C stops)
instaling-bot update-check      # compare with the latest release
instaling-bot version
```

After installing from source, the equivalents are `npm start`, `npm run stats`, `npm run remind` and `npm run update-check`.

`instaling-bot start` **checks the latest release first**. If a newer version is available, the bot will not start and shows a download link. Deliberate skip: `--skip-update-check` or `INSTALING_SKIP_UPDATE_CHECK=1`. If GitHub is temporarily unavailable, the CLI only warns and continues.

### 📊 Statistics in the CLI

Every session with at least one answer is written to `stats.json` (in the project directory or the desktop data folder). `instaling-bot stats` shows sessions, answers, correct, wrong, accuracy, new words and time for the week, month, year and all time. `--period week|month|year|all` narrows the result, and `--json` returns data for further processing.

### 🔔 Reminder in the CLI

The same `reminder` section in `Config.json` controls reminders in the desktop app and the CLI. To receive a daily session notification, leave this running in the background:

```bash
instaling-bot remind
```

The process checks every minute whether the chosen time has passed and whether today's session has not been completed yet. By default the notification is sent once a day; `reminder.repeat_minutes` (for example `30`) repeats it every 30 minutes until you complete a session. State is stored in `reminder-state.json` and shared with the bot run and the desktop app. Stop with `Ctrl+C`.

### 🔄 Updating the CLI

```bash
curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh | bash
```

When installed from source: `git pull && npm install --omit=dev`.

If Puppeteer did not download the browser during installation:

```bash
npx puppeteer browsers install chrome
```


## ⚙️ How the bot works

- Logs in to instaling.pl with the credentials from the configuration.
- Automatically dismisses the Google cookie consent dialog that covers the login form.
- Starts a new session or continues the previous one.
- Reads the sentence, the Polish word and the saved translation.
- Answers correctly in `valid_chance` cases (80% by default).
- When it is supposed to answer wrong, it picks one of three mistakes: an empty field, a different saved translation or a believable typo.
- Saves newly learned translations in `SavedWords.json`.
- Closes Chrome and saves the words when finished.

## 🧠 Typing humanization

- Every letter has its own random delay (`delays.type_min` / `type_max`).
- The bot sometimes takes a short pause while typing (`type_pause_chance`, `type_pause_min`, `type_pause_max`).
- With probability `typo_chance` it presses a wrong neighbouring key, deletes it with backspace and types the correct letter.
- The field value is always verified, so the simulated typo never breaks the answer.
- Navigation clicks (continue session, start) have short pauses (`quick_click_min` / `quick_click_max`).
- Login is the exception: credentials are typed quickly and precisely, and a rejected form is retried only once.

## 🛠️ Configuration

Template for all options: [`config/Config.defaults.json`](config/Config.defaults.json). The desktop app exposes the most important ones in the GUI, but the full file can be edited by hand.

- `credentials` — InstaLing login details
  - `login` — login or e-mail
  - `password` — password
- `sites` — sites used
  - `login` — login page; must be the official HTTPS `instaling.pl` login page (the bot refuses to start with any other address)
- `language` — desktop interface language: `pl` (default) or `en`; it can also be changed with the **PL/EN** buttons in the menu bar. Bot engine logs remain in Polish.
- `notifications.session_finished` — session-finished notification when the window is hidden or minimized (`true` by default)
- `INSTALING_LOGIN` / `INSTALING_PASSWORD` — environment variables with credentials; they take precedence over `credentials` in `Config.json`. Useful in CI and on servers where the password should not be written to disk.
- `delays` — wait times in milliseconds (1 s = 1000 ms); the bot picks a random value between min and max
  - `click_min` / `click_max` — default delay after clicking a button
  - `type_min` / `type_max` — delay per single letter
  - `type_pause_chance` — chance of an extra pause while typing (`0.12` = 12%)
  - `type_pause_min` / `type_pause_max` — length of that pause
  - `typo_chance` — chance of a simulated typo with backspace (`0.15` = 15%)
  - `quick_click_min` / `quick_click_max` — short pause after navigation clicks
  - `selector` — wait for an element on the page (increase on a slow connection)
  - `check_min` / `check_max` — wait for an answer to be checked
  - `next_word_min` / `next_word_max` — wait between words
- `valid_chance` — the share of answers that should be correct (`1` = 100%, `0.8` = 80%); on a failed attempt the bot picks one of three mistakes: an empty field, a different saved translation (fallback: a typo) or a typo
- `max_answers` — maximum number of answers in one run (`0` = no limit, useful for tests)
- `show_browser` — shows the Chrome window; set `false` on a headless server
- `mute_audio` — mutes browser audio
- `window_width` / `window_height` — Chrome window size
- `debug` — extra browser logs and page dumps
- `reminder` — daily session reminder (desktop and CLI)
  - `enabled` — `true` / `false`
  - `time` — time in `HH:MM` format, default `17:00` (local time)
  - `repeat_minutes` — repeat the reminder every N minutes until a session is done (`0` = once a day, max `1440`)
- `background` — desktop only
  - `run_in_tray` — closing the window hides the app to the tray instead of quitting
  - `start_at_login` — launch the app at system login

The default click delay is now `2000`–`4500` ms.


## 🆘 Troubleshooting

Problems are split into the **desktop app** and the **CLI**. The app's error dialog links directly to this section — it no longer opens a separate FAQ page.

### 🖥️ Desktop

- **📡 No internet** — check your connection and press **Start** again. The dialog closes only with the **Close** button.
- **Chrome missing from the installer** — reinstall the app from the official release.
- **The bot does not get past login** — check the login and password in the app. The bot types them precisely and retries once if the site temporarily rejects the form.
- **I want to see what the bot is doing** — enable **Show Chrome window** and **Debug logs**, then look in `pages/` and `screenshots/` in the data folder.
- **Antivirus / SmartScreen warning** — the installers are unsigned; this is expected. The source code is public.
- **Too much RAM in the background** — enable tray mode; closing the window releases the renderer process and leaves a lightweight main process with the icon.

### 📱 Mobile

- **The APK will not install** — allow installation from unknown sources for the browser or file manager that opens it. The APK is signed with a developer key, not by the Play Store.
- **"Could not find the session start button"** — sign in inside the app and open the learning page before pressing **Start**. The mobile bot does not log in for you.
- **The session stops when I lock the phone** — expected. WebView is suspended in the background, and 4.0 has no hidden mode. Keep the app in the foreground.
- **No notifications on Android 13+** — enable notification permission in the app settings and tap ⏰ again.
- **The IPA will not install in SideStore/AltStore** — it is unsigned; sign it with your own Apple ID. A free account needs a refresh after 7 days.
- **The userscript does not see the page** — check that the Userscripts/Tampermonkey extension is allowed on `instaling.pl` and that the script is enabled for that domain.
- **Chrome on Android does not run the userscript** — that is a Chrome limitation; use the APK or Firefox with Tampermonkey.

### ⌨️ CLI

- **The bot stops at login** — check the login and password in `config/Config.json`. The bot dismisses the cookie overlay itself; if problems persist, run with `"show_browser": true` and check `screenshots/answer-error.png`.
- **`Could not find the "start session" button`** — the site layout may have changed. Enable `"debug": true` and check `pages/answer-start-failed.html`.
- **Chrome missing** — run `npx puppeteer browsers install chrome`.
- **`instaling-bot: command not found`** — add `~/.local/bin` to `PATH` or run `node ~/.local/share/instaling-bot/bin/instaling-bot.js help`.
- **The CLI refuses to start because of an update** — download the new version with the `curl` installer or run `instaling-bot start --skip-update-check` if you deliberately stay on an older version.
- **No statistics** — `stats.json` is created after the first session with at least one answer. Check `instaling-bot stats --json`.
- After every attempt the bot saves page dumps in `pages/` and `screenshots/`.


## 🧱 Building from source

```bash
npm install
npm run desktop          # starts the Electron app
npm run check            # syntax of all files
npm run dist:win         # Windows .exe (NSIS)
npm run dist:mac         # macOS .pkg (macOS only)
npm run build:mobile     # userscript + core.js assets for APK/IPA
```

Before packaging, `npm run dist:win` / `dist:mac` automatically runs `npm run prepare:browser`, which copies Chrome for Testing to `resources/browser/` and creates a manifest.

The macOS installer must be built on macOS. The repository includes a GitHub Actions workflow (`.github/workflows/release.yml`) that builds the Windows `.exe`, macOS `.pkg`, APK, IPA and userscript.

**Mobile from source:**

```bash
npm install
npm run build:mobile
cd mobile/android && ./gradlew :app:assembleDebug     # debug APK
cd mobile/ios && xcodegen generate                     # Xcode project (requires XcodeGen)
```

A release APK is built with `./gradlew :app:assembleRelease`; without the `ANDROID_KEYSTORE_*` secrets it falls back to the debug key, so the file remains installable. The IPA needs macOS with full Xcode and is built unsigned in CI. Architecture details: [`MOBILE_PLAN.md`](MOBILE_PLAN.md).


## 📦 Recent changes

### 4.0.0 — 2026-10-27

- 📱 **Android APK.** A native WebView shell with Start/Stop, PL/EN, answer counter, a 17:00 reminder and an update button. Handles `instalingbot://start` and `instalingbot://stop` for Tasker/MacroDroid.
- 🍏 **iOS IPA.** An unsigned SideStore/AltStore app with the same engine, reminder and URL scheme for Shortcuts. The easiest iPhone path remains the Safari userscript.
- 🌐 **Userscript 4.0.** The shared engine in a floating panel for Safari iOS/iPadOS and Firefox on Android, with `?autostart=1`, `?lang=en` and automatic updates.
- 🧠 **Shared mobile engine.** Answers, typos, saved words and session statistics behave like the desktop; a run survives full instaling.pl page reloads.
- 🔔 **Native reminders.** A daily 17:00 notification in the APK and IPA, surviving an Android reboot and handling Android 13+ permissions.
- 🔐 **No passwords on the phone.** The mobile apps reuse the normal website session in the WebView and do not store credentials.
- 📚 **Documentation.** README (PL/EN), project site, wiki, `PROJECT_NOTES.md`, `CHANGELOG.md` and the mobile plan `MOBILE_PLAN.md`.

### 3.3.2 — 2026-10-27

- 📡 **Clearer no-internet message.** The offline dialog now only asks you to check the connection and no longer points at a FAQ you cannot open without internet. The **README FAQ** button remains for bot errors only.
- 📚 **Two latest releases in the README.** The changes section now shows the current release plus the previous one; the full history lives in `CHANGELOG.md`.

Full history: [CHANGELOG.md](CHANGELOG.md).


## 💬 Community and support

- 👋 **[Start here](https://github.com/bmonekkk/instaling-bot/discussions/1)** — the welcome discussion with links to everything.
- 💬 **[Discussions](https://github.com/bmonekkk/instaling-bot/discussions)** — questions (Q&A), ideas, show your setup (Show and tell) and polls.
- 🐛 **[Issues](https://github.com/bmonekkk/instaling-bot/issues)** — reproducible bugs. Use the template and remove private data from logs.
- 📚 **[Wiki](https://github.com/bmonekkk/instaling-bot/wiki)** — installation, CLI, configuration, troubleshooting and FAQ.
- 🤝 **[Contributing](CONTRIBUTING.md)** — how to help, submit a change and run the project locally.
- 📜 **[Code of Conduct](CODE_OF_CONDUCT.md)** — rules for a friendly community.
- 🔐 **[Security](SECURITY.md)** — private vulnerability reporting. Do not open a public issue.
- 🆘 **[Support](SUPPORT.md)** — where to find help and what to expect.

**Before asking:** check the FAQ, update to the latest version and search existing threads.
Never publish passwords, cookies, tokens, `Config.json` or logs with personal data.

This is a hobby project — responses are best-effort. Security comes first, then reproducible
bugs, then ideas and polish.


## ⚠️ Disclaimer

This project is for **educational purposes** only — it was created as an exercise in browser
automation (Puppeteer), cookie handling, selectors and web app logic. It is **not intended to
cheat** in learning or to bypass school or teacher rules. Use it responsibly, preferably to
practise and test your own skills.

- The project is **not affiliated** with InstaLing / instaling.pl or its owners.
- Automated use of the service may violate its terms of service. The user is solely responsible for how it is used.
- The software is provided **without any warranty** ("AS IS"), under the ISC license.
- Do not share your credentials with anyone. `Config.json` and `SavedWords.json` are ignored by git.

Ten projekt służy **celom edukacyjnym** — powstał jako ćwiczenie z automatyzacji przeglądarki. **Nie jest powiązany** z InstaLing i **nie służy do oszukiwania** w nauce. Używaj go odpowiedzialnie i na własną odpowiedzialność; automatyczne korzystanie z serwisu może naruszać jego regulamin.


## 📜 License

ISC — see the [LICENSE](LICENSE) file. The project is a continuation of [PanSzelescik/instaling-bot](https://github.com/PanSzelescik/instaling-bot).


## 🧑‍💻 For developers

Desktop architecture, data paths, the build process and the list of things that must not
break: [PROJECT_NOTES.md](PROJECT_NOTES.md).

Before opening a pull request, read **[CONTRIBUTING.md](CONTRIBUTING.md)** and run
`npm run check`, `npm test`, `git diff --check` and the CLI smoke test. `master` is protected,
and changes go through CI (syntax, unit tests, whitespace, `install.sh`, CLI) and CodeQL.

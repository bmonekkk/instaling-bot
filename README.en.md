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

The current version (**3.3.1**) combines three things:

- 🖥️ a desktop app with a GUI, live log, statistics and a bundled Chrome browser,
- ⌨️ a full CLI for Linux and the terminal, installed with a single `curl` command,
- 🧠 human-like typing: random delays, micro-pauses, typos fixed with backspace and three kinds of deliberate mistakes.

Version 3.3.0 added a **full Polish/English interface** (settings, dialogs, statistics, tray menu and notifications), an optional **session-finished notification** for hidden or minimized windows, and **security Phase 1**: owner-only permissions for `Config.json`, password redaction in logs, and `INSTALING_LOGIN` / `INSTALING_PASSWORD` environment overrides. Version 3.3.1 adds **daily update checks** — at startup, once a day and whenever a session starts — plus a **different tray icon** when a newer release is available. Statistics, repeating reminders and the 3.2.x CLI stay unchanged.

Open source, ISC license.


## 💙 Support the project

Instaling Bot is an independent open-source project maintained as a hobby. If you find it useful and want to support the time I spend developing, testing and maintaining it, you can buy me a virtual coffee.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H5P529J2VO)

Support is entirely voluntary and not required to use the project. The project is not officially affiliated with InstaLing. Donations do not guarantee specific features or release dates.


## ✨ Two versions, one engine

| | Desktop | CLI |
|---|---|---|
| Systems | Windows 10/11, macOS 13+ | Linux, macOS, Windows |
| Requires Node.js | **No** | Yes, Node.js 22+ |
| Interface | App window, settings, live log | Terminal |
| Browser | Chrome for Testing bundled in the installer | Downloaded by Puppeteer |
| Data | `%APPDATA%\instaling-bot` or `~/Library/Application Support/instaling-bot` | `config/` in the project directory |
| Statistics | **Statistics** button: week, month, year, all time | `instaling-bot stats` |
| Reminders | System notification + toast, optionally every N minutes | `instaling-bot remind`, same setting |
| Session end | Notification when the window is hidden or minimized | Message in the terminal |
| Updates | Release check + **Download** button | `instaling-bot update-check`; start blocks outdated builds |
| Updating | New installer from GitHub | Re-run `curl` or `git pull && npm install --omit=dev` |

Both variants use the same engine (`src/`), the same options and the same `SavedWords.json` format.

The desktop interface works in Polish and English. Switch languages with the **PL/EN** buttons in the menu bar; the choice is saved in `Config.json` (`language`) and also covers the tray menu and native notifications.

The session-finished notification is on by default and appears only when the window is hidden in the tray or minimized — turn it off with **Notify me when a session finishes**. `Config.json` is written with owner-only permissions (`600` on macOS/Linux, a private ACL on Windows), and passwords are redacted from logs and notifications. Instead of storing a password in the file, you can set `INSTALING_LOGIN` and `INSTALING_PASSWORD` — they take precedence over the config.


## 🖥️ Desktop: Windows and macOS

Download an installer from the [latest release](https://github.com/bmonekkk/instaling-bot/releases/latest):

- **Windows:** `instaling-bot-3.3.1-setup-win64.exe` (NSIS, x64)
- **macOS Apple Silicon:** `instaling-bot-3.3.1-macos-arm64.pkg`
- **macOS Intel:** `instaling-bot-3.3.1-macos-x64.pkg`

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

When the app cannot reach the internet, it shows a dialog with an explanation and a single **README FAQ** button that leads to the [Troubleshooting](#-troubleshooting) section. The same dialog appears on a bot error (for example a page layout change or rejected login). The dialog closes **only with the Close button** — it does not disappear when the network returns or when you click the background.

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

- **📡 No internet** — check your connection and press **Start** again. The help dialog links to the README FAQ and closes only with the **Close** button.
- **Chrome missing from the installer** — reinstall the app from the official release.
- **The bot does not get past login** — check the login and password in the app. The bot types them precisely and retries once if the site temporarily rejects the form.
- **I want to see what the bot is doing** — enable **Show Chrome window** and **Debug logs**, then look in `pages/` and `screenshots/` in the data folder.
- **Antivirus / SmartScreen warning** — the installers are unsigned; this is expected. The source code is public.
- **Too much RAM in the background** — enable tray mode; closing the window releases the renderer process and leaves a lightweight main process with the icon.

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
```

Before packaging, `npm run dist:win` / `dist:mac` automatically runs `npm run prepare:browser`, which copies Chrome for Testing to `resources/browser/` and creates a manifest.

The macOS installer must be built on macOS. The repository includes a GitHub Actions workflow (`.github/workflows/release.yml`) that builds the Windows `.exe` and the macOS `.pkg` for Apple Silicon and Intel.


## 📦 Changes in 3.3.1

- 🔄 **Daily update checks.** The app checks for a new release at startup, once a day, and whenever a session starts — including while minimized or in the tray. Finishing a session does not trigger a check.
- 🟥 **Tray update icon.** When a newer version is available, the tray icon changes (a red badge on Windows/Linux, an extra shape on macOS) and the menu shows an **Update available** item that opens the release.
- ☕ **Ko-fi in the tray menu.** **Support on Ko-fi** now sits directly below **Show window**.
- 📚 **Documentation.** README, wiki, project page and developer notes describe the new update cadence and tray icon.

Earlier changes: [CHANGELOG.md](CHANGELOG.md).


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

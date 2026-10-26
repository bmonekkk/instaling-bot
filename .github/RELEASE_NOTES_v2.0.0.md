# instaling-bot v2.0.0

First maintained release of the fork. This fixes the problem where the bot could not get past the login page and modernizes the whole stack.

## Highlights

- **Login fixed** - the Google Funding Choices cookie dialog was covering the entire login form, so every click on "ZALOGUJ" landed on the consent overlay. The dialog script is now blocked, with an automatic dismissal fallback.
- **Modern stack** - Puppeteer 9 -> 25, Chrome 156, Node.js 22+.
- **Actually works end-to-end** - verified login, session start, answering and saving words on the current instaling.pl.
- **No more GPLv3 uBlock bundle** - the unused 9.6 MB Manifest V2 extension was removed; ads/trackers are blocked with request interception.
- **Lighter dependencies** - `discord.js` and `axios` removed; webhook uses built-in `fetch`.

## Fixed bugs

- `canLogin()` was never called.
- `SavedWords.json` was written outside the project directory.
- `fs.rmdir(..., {recursive: true})` crashed on modern Node.
- `isVisible()` logic was inverted, breaking the "new word" screen.
- Login waited for `networkidle0`, which could hang forever because of ads.

## Configuration

Credentials now live in a clear `credentials` object:

```json
{
    "credentials": {
        "login": "your-login-or-email",
        "password": "your-password"
    }
}
```

Old configs with top-level `login` / `password` still work.

New optional `max_answers` setting limits a single run (`0` = unlimited).

## Install

```bash
git clone https://github.com/Bmonek/instaling-bot.git
cd instaling-bot
npm install
# fill config/Config.json (see config/Config.example.json)
npm start
```

## License and disclaimer

ISC (see LICENSE). This project is for educational purposes, is not affiliated with InstaLing, and is not intended to cheat in language learning. Use it responsibly and at your own risk.

---

Full changelog: [CHANGELOG.md](CHANGELOG.md)

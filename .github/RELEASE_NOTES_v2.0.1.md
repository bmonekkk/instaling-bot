# instaling-bot v2.0.1

Small but important update for Windows users, plus gentler default pacing.

## Fixed

- **Browser window is now visible** - Puppeteer hardcodes `windowsHide: true` when spawning Chrome on Windows, which hid the window and removed its taskbar entry. The launcher now patches this so the browser appears normally when `show_browser` is `true`.
- Verified twice end-to-end: window visible, login, session start, answer typed correctly and words saved.

## Changed

- **Slower default delays** for more natural pacing:
  - `click`: 3.5-6.5 s
  - `type`: 120-240 ms per character
  - `next_word`: 2-4.5 s
  - `check`: 3-5.5 s
  - `selector`: 15 s
- Removed Puppeteer's default `--enable-automation` flag.
- Basic fingerprint cleanup: `navigator.webdriver` hidden, `navigator.languages` set to `pl-PL`.
- Window opens at position `40,40` with `--no-first-run` and `--no-default-browser-check`.

These changes make the bot behave less like an aggressive script, but **no timing tweak can guarantee that a site won't detect automation**.

## Install / update

```bash
git pull
npm install
npm start
```

Existing `config/Config.json` files keep working (old top-level `login`/`password` are still accepted).

## License and disclaimer

ISC (see LICENSE). Educational project, not affiliated with InstaLing, not intended to cheat in language learning. Use responsibly and at your own risk.

---

Full changelog: [CHANGELOG.md](CHANGELOG.md)

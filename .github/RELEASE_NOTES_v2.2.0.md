# instaling-bot v2.2.0

More human behaviour, faster login, and a retro-looking project page.

## Human-like typing

The bot no longer types like a metronome:

- every character gets its own random delay (`delays.type_min` / `type_max`)
- occasional micro-pauses while typing (`type_pause_chance`, `type_pause_min`, `type_pause_max`)
- with `typo_chance` (default `0.15`) it presses a neighbouring key, waits, removes it with Backspace and types the correct character
- the field is verified afterwards, so a simulated typo can never corrupt the real answer

When `valid_chance` decides that an answer should be wrong, the bot now types a plausible misspelling (for example `perder` → `perde`) instead of submitting an empty field. That looks much more like a person making a mistake.

## Faster, safer login

- Credentials are typed with `typeExact()`: fast, verified, and with a direct-value fallback if the page transforms the input.
- If InstaLing rejects the first submit, the bot reloads the login page and retries **once**. A true wrong password still stops with a clear message.
- Login no longer uses the humanized typer, so a simulated typo cannot produce a fake "wrong password" error.

## Quick navigation

- Session buttons (`continue`, `start`) now use a 2.5 s navigation timeout instead of 8–15 s.
- After the click there is only a short random pause (`quick_click_min` / `quick_click_max`), and the next selector wait handles slow pages.

## Reliability fix

Some answer results (for example a "Literówka" / typo result) leave `#word` empty. The bot now falls back to the translation it already knows instead of crashing.

## New config options

```jsonc
"delays": {
  "type_min": 90,
  "type_max": 230,
  "type_pause_chance": 0.12,
  "type_pause_min": 250,
  "type_pause_max": 700,
  "typo_chance": 0.15,
  "quick_click_min": 120,
  "quick_click_max": 300
}
```

Existing `config/Config.json` files keep working; missing options use sensible defaults.

## Project page

The landing page at https://bmoneczek.github.io/instaling-bot/ was redesigned in a Windows 95/98 style, with a title bar, beveled panels, a taskbar and a working clock.

## Upgrade

```bash
git pull
npm install
npm start
```

## License and disclaimer

ISC (see LICENSE). Educational project, not affiliated with InstaLing, not intended to cheat in language learning. Human-like timing reduces obvious patterns but **cannot guarantee** that the bot will not be detected. Use responsibly and at your own risk.

---

Full changelog: [CHANGELOG.md](CHANGELOG.md)

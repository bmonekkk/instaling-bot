# instaling-bot v2.1.0

Cleanup release: smaller config, fewer options, fewer dependencies. The actual bot behaviour is unchanged apart from a safer default success rate.

## Changed

- **Default `valid_chance` is now `0.8`** (80% correct answers). Set it to `1` in `config/Config.json` if you want every answer to be correct.
- Config templates renamed:
  - `config/Config.example.json` → `config/Config.defaults.json`
  - `config/SavedWords.example.json` → `config/SavedWords.defaults.json`
- Only the `master` branch is kept in the repository.
- Removed the unused `wait_min` / `wait_max` delay options.

## Removed

- **`feature`** - the external `api.crawcik.space` word database and all related code. Words now come only from `config/SavedWords.json`.
- **`open_devtools`** - use the browser's own DevTools (F12) when `show_browser` is enabled.
- **`webhook`** - Discord webhook logging. Logs go to the console only.
- Dependencies `discord.js`, `axios`, `strip-ansi` and `unique-random-array`. Runtime dependencies are now just `chalk` and `puppeteer`.

## Fixed

- Removed the leftover `EventEmitter`/`stopBot` plumbing; shutdown is handled directly and errors exit with code `1`.
- README, project notes, landing page and `NOTICE` now match the real configuration.

## Upgrade

If you already have `config/Config.json`, just remove `feature`, `open_devtools`, `webhook`, `delays.wait_min` and `delays.wait_max` (they are ignored if left in place), then optionally set `"valid_chance": 0.8`.

```bash
git pull
npm install
npm start
```

## License and disclaimer

ISC (see LICENSE). Educational project, not affiliated with InstaLing, not intended to cheat in language learning. Use responsibly and at your own risk.

---

Full changelog: [CHANGELOG.md](CHANGELOG.md)

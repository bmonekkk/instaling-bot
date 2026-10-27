# Contributing / Współtworzenie

Thanks for helping! Możesz pisać po polsku lub po angielsku. 🌍

## Quick rules

- Be kind and assume good intent — see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- Search existing [issues](https://github.com/bmonekkk/instaling-bot/issues) and
  [discussions](https://github.com/bmonekkk/instaling-bot/discussions) first.
- Never paste real credentials, cookies, tokens or private data into an issue, discussion,
  PR or screenshot.
- Security problems go through [SECURITY.md](SECURITY.md), never a public issue.
- Keep pull requests focused. One bug fix or feature per PR is easier to review.

## Ways to help

- 🐛 Report reproducible bugs with the bug template.
- 💡 Suggest features and vote on ideas in Discussions → Ideas.
- 📝 Improve docs, the wiki, examples or translations.
- 🧪 Test on Windows, macOS or Linux and report what you see.
- 🎨 Share screenshots or UI improvements.
- ⭐ Star the repo if it is useful — it helps others find it.

## Development setup

Requirements: **Node.js 22+** and npm.

```bash
git clone https://github.com/bmonekkk/instaling-bot.git
cd instaling-bot
npm install
cp config/Config.defaults.json config/Config.json
```

Never commit `config/Config.json`, `SavedWords.json`, `stats.json`, logs or screenshots with
personal data. They are ignored by git.

Useful commands:

```bash
npm run desktop     # Electron app (development)
npm start           # CLI bot
npm run check       # syntax check for every JS file
npm test            # unit tests (node:test), no network or real data
npm run stats       # CLI statistics
npm run help        # CLI help
npm run dist:win    # Windows installer (run on Windows)
npm run dist:mac    # macOS package (run on macOS)
```

## Before opening a pull request

Run at least:

```bash
npm run check
npm test
git diff --check
bash -n install.sh
node bin/instaling-bot.js help
node bin/instaling-bot.js version
```

If you changed the desktop UI, add a screenshot or a short recording. If you changed
stats or reminders, include the scenario you tested (dates, intervals, expected output).

## Pull requests

1. Fork the repository and create a branch, e.g. `fix/reminder-repeat` or `feat/wiki-links`.
2. Keep the diff small and explain **what** and **why** in the PR description.
3. Link the issue or discussion it resolves.
4. Make sure CI is green.
5. Be ready for review comments. Maintainers may squash your commits.

The `master` branch is protected. Pull requests are the normal path for changes; the
maintainer can bypass protection for urgent releases.

## Commit messages

Use a short imperative subject, for example:

```text
Fix repeated reminder after midnight
Add CLI stats period filter
Document macOS Gatekeeper steps
```

Polish or English is fine. Avoid generic messages such as `update` or `fix stuff`.

## Release process

Maintainers release from `master` by pushing a `vX.Y.Z` tag. The release workflow builds
the Windows and macOS installers and creates a draft GitHub release. Do not create release
tags in a pull request.

## Questions?

Use [Discussions → Q&A](https://github.com/bmonekkk/instaling-bot/discussions/categories/q-a)
for usage questions. You can also open an issue if it is a reproducible bug.

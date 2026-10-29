# instaling.pl session app — captured API

Sanitised extract of a logged-in recon (`npm run audit:session -- --start`).
IDs, login and cookies are removed. Raw data lives in `research/session-recon/`
(gitignored).

## Entry points

```
POST /teacher.php?page=teacherActions        # login (action=login, log_email, log_password)
GET  /learning/dispatcher.php                # post-login redirect
GET  /student/pages/mainPage.php?student_id= # new student panel
GET  /app/session/app.php?child_id=          # the session app (AJAX)
```

The session app is a single document with jQuery 1.9.1 + jPlayer; all state changes
are JSON calls. `child_id` comes from the URL and matches `student_id`.

## Endpoints

| Endpoint | Method | Payload | Response |
|---|---|---|---|
| `server/actions/init_session.php` | POST | `child_id`, `start`, `end` (both empty) | `is_new`, `language_id`, `characters[]` |
| `server/actions/generate_next_word.php` | POST | `child_id`, `date` (client epoch ms) | word id, speech part, usage example, translations, word, `has_audio`, `audio_file_name`, `is_new_word`, `is_hint_available` — or `{summary}` when finished |
| `server/actions/save_answer.php` | POST | `child_id`, `word_id`, `answer`, `version` | `usage_example`, `translations`, `grade`, `word`, `answershow`, `has_audio` |
| `server/actions/getAudioUrl.php` | GET | `id` | `url` (then `GET /mp3/...`) |
| `server/actions/grade_report.php` | POST | `child_id`, `date` | marks, week stats |
| `server/actions/save_comment.php` | POST | `child_id`, `word_id`, `comment` | — |

## Important properties

- **No CSRF token, no nonce.** The only identifiers are `child_id` (in the URL), the
  word id from `generate_next_word`, and a `version` constant.
- **`version` is hard-coded** in the page: `C65E24B29A31C9931AD11AAA9C9707D2`, identical
  for every request and every user. It is a client/protocol version, not a per-session
  secret. A bot that hardcodes an old value would be rejected; driving the real page
  always sends the current one.
- **`save_answer` has no client timestamp.** The server therefore times the request
  itself.
- **Grade codes** returned by `save_answer`:
  - `1` correct ("Dobrze!")
  - `2` synonym ("Synonim")
  - `3` wrong case ("Zła wielkość liter")
  - `4` typo — one wrong letter or two neighbouring letters swapped ("Literówka")
  - anything else — wrong
- **Audio is a real request**: `getAudioUrl.php` → `/mp3/<file>`, played via jPlayer.
- **Cookies**: `PHPSESSID` (not `HttpOnly`, not `Secure`, `SameSite=None`), `app`,
  `_ga`, `_ga_<id>`, `FCCDCF`.
- **Third party on the session/dashboard**: gtag (UA + GA4), Google Funding Choices,
  refinery89, `uptimiarum.eu` RUM, doubleclick/adsbygoogle. The dashboard also calls
  `student/actions/adView.php?v=3:rail_right` (an ad impression).
- The old marketing pages and the session app are different codebases: the dashboard
  and session app load `jquery-3.5.1`, the session app itself `jquery-1.9.1`.

## What this means for detection

The server can reconstruct each word's timeline without any client cooperation:

```
think + typing   = t(save_answer)            - t(generate_next_word)
review + "next"  = t(next generate_next_word) - t(save_answer response)
session length   = t(last summary)           - t(init_session)
```

That is exactly the three pauses the bot implements. There is no separate "anti-bot"
signal to defeat — the timing *is* the signal.

It can also notice protocol abuse:

- `save_answer` for a `word_id` that was never served by `generate_next_word`;
- no `getAudioUrl` calls while `has_audio` is true;
- a `version` constant that is stale;
- `child_id` used from two sessions at once;
- an answer sequence that does not match the scheduled words.

Driving the real UI (which the bot does) avoids all of the protocol-level ones.
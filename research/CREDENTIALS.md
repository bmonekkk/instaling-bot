# Credential storage — why hashing does not work, and what to do instead

Short version: **you cannot hash the InstaLing password**, because the bot has to send
the real password to instaling.pl on every login. A hash is one-way; the site does not
accept it. Hashing is for *verifying* a secret you already hold, not for *replaying* one.

What we can do is **encrypt it with the OS keychain** so it is not readable as plaintext
in a file.

---

## What is stored today

| Location | Content | Protection |
|---|---|---|
| `<userData>/config/Config.json` | `credentials.login`, `credentials.password` in plaintext | `chmod 600` on POSIX, owner-only ACL on Windows |
| Process environment | `INSTALING_LOGIN` / `INSTALING_PASSWORD` (optional override) | visible to the same user, and via `/proc` on Linux |
| Child process | the engine reads the same `Config.json` | plaintext in memory |

So `chmod 600` stops *other users* on the machine, but not:

- a backup / Time Machine snapshot,
- malware running as the same user,
- a synced folder (if the userData directory is ever synced),
- anyone who picks up an unlocked laptop,
- a `cat` by the user themselves.

That is the real gap — not "the file is readable", but "the secret is recoverable".

## Option A — OS keychain (recommended)

Electron ships `safeStorage`, which encrypts with the platform's own key material:

- **macOS**: Keychain
- **Windows**: DPAPI (per-user)
- **Linux**: libsecret / kwallet, with a plaintext fallback when unavailable

Flow:

1. On save: `safeStorage.encryptString(password)` → base64 → store as
   `credentials.password_enc`, and remove `password`.
2. On load: decrypt into memory only. Never write the plaintext back.
3. When the engine child process starts, pass the decrypted value through
   `INSTALING_LOGIN` / `INSTALING_PASSWORD` in `env` (the engine already prefers env
   over the file), so `Config.json` never needs the plaintext.
4. The settings UI shows "saved" instead of the password, and only overwrites it when
   the user types a new one.

Sketch of the storage shape:

```json
{
  "credentials": {
    "login": "student1",
    "password_enc": "BASE64...",
    "password_scheme": "safeStorage-v1"
  }
}
```

Caveats:

- `safeStorage` is an Electron-main API. The CLI cannot use it, so the CLI keeps the
  env-var / prompt path and must not see `password_enc`.
- If the OS keychain is unavailable (headless Linux), do **not** silently fall back to
  plaintext — ask the user to use env vars or type the password each run.
- A stolen *unlocked* session can still decrypt, because that is the point of a
  keychain. This protects at rest, not against a live attacker.

## Option B — do not store it at all

Ask for the password on every run (or once per session), keep it in memory, and offer
`INSTALING_PASSWORD` for automation. This is the strongest option and the simplest to
reason about; it costs convenience. It also makes the "run from tray / scheduled
reminder" flows need an unlock prompt.

## Option C — what not to do

- **Hashing** (`bcrypt`, `sha256`, …): impossible, the site needs the plaintext.
- **Obfuscation** (base64, XOR, a hard-coded key in the binary): reversible, gives a
  false sense of security, and any local attacker can just run the same code.
- **Storing in the repo / a committed config**: never. The repo's
  `config/Config.defaults.json` has empty credentials on purpose.

## Recommendation

Go with **Option A for the desktop app** and **Option B for the CLI**:

- desktop: `safeStorage` + `password_enc`, decrypt in the main process, pass env to the
  engine child;
- CLI: env vars or a prompt, never a plaintext file;
- keep `chmod 600` as defence in depth;
- migrate on first launch: if a plaintext `password` is found, encrypt it, blank the
  field, and write the file atomically.

This also removes the reason `session-recon.js` currently reads `Config.json` directly:
after the migration it should read env vars or prompt (the `--manual` mode already does).

## Threat model in one line

Encryption protects the secret **at rest** (backups, stolen disk, casual reading).
It does not protect it from **code running as the same user** — nothing on the same
account can, once the app can decrypt it to log in.
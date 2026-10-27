# Security policy / Polityka bezpieczeństwa

## Supported versions

| Version | Supported |
|---|---|
| 3.2.x | ✅ |
| < 3.2 | ❌ |

Only the latest release receives security fixes. If you are on an older build, update first:
[latest release](https://github.com/bmonekkk/instaling-bot/releases/latest).

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Use GitHub private vulnerability reporting:

👉 https://github.com/bmonekkk/instaling-bot/security/advisories/new

Please include:

- affected version or commit,
- operating system and install method (desktop installer / CLI / source),
- steps to reproduce or a minimal proof of concept,
- impact and attack scenario,
- suggested fix, if you have one.

Never include real logins, passwords, cookies, tokens, saved words or other personal data.
Redact logs before sending them.

## Scope

In scope:

- credential handling and local storage,
- arbitrary code execution or command injection,
- unsafe file writes and path traversal,
- update-check trust and release/download integrity,
- dependency vulnerabilities that affect the app,
- HTML injection / XSS in the desktop UI,
- unsafe external links opened by the app,
- installer or packaging issues.

Out of scope:

- InstaLing terms of service and account bans,
- unsigned-installer warnings (documented and expected),
- social engineering,
- issues in third-party services or infrastructure,
- unsupported versions,
- reports that require access to someone else's account or data.

## Response targets

- acknowledgement within **3 business days**,
- initial triage within **7 days**,
- fix or mitigation target of **30 days** for critical issues,
- coordinated disclosure after a fixed release is available.

There is no bug bounty. If you want credit, say so and we will mention you in the advisory
or release notes.

## Safe harbour

We will not pursue legal action for good-faith research that follows this policy, stays
within your own accounts and data, and does not disrupt the service or other users.

## Polski

Luki bezpieczeństwa zgłaszaj **prywatnie** przez
[GitHub Security Advisories](https://github.com/bmonekkk/instaling-bot/security/advisories/new),
a nie w publicznym issue. Nie dołączaj prawdziwych danych logowania, ciasteczek, tokenów
ani logów z danymi osobowymi. Potwierdzenie zgłoszenia: do 3 dni roboczych. Naprawa
krytycznych problemów: cel 30 dni. Dziękuję za odpowiedzialne zgłaszanie!

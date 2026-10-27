# 🔐 Bezpieczeństwo

## Zgłaszanie luk

**Nie otwieraj publicznego issue.** Użyj prywatnego raportu:

👉 https://github.com/bmonekkk/instaling-bot/security/advisories/new

Podaj:

- wersję lub commit,
- system i sposób instalacji (instalator / CLI / źródła / APK / IPA / userscript),
- kroki reprodukcji lub minimalny proof of concept,
- wpływ i scenariusz ataku,
- proponowaną naprawę, jeśli ją znasz.

Nie dołączaj prawdziwych danych logowania, ciasteczek, tokenów, słówek ani logów z danymi
osobowymi. Zredaguj logi przed wysłaniem.

## Obsługiwane wersje

| Wersja | Wsparcie |
|---|---|
| 4.0.x (desktop, CLI, APK, IPA, userscript) | ✅ |
| 3.3.x | ✅ |
| < 3.3 | ❌ |

Aktualizuj do [najnowszego wydania](https://github.com/bmonekkk/instaling-bot/releases/latest).

## Zakres

W zakresie: obsługa danych logowania, lokalne zapisywanie plików, wykonanie kodu i wstrzykiwanie
poleceń, zaufanie do sprawdzania aktualizacji, integralność wydań, zależności wpływające na
aplikację, XSS/HTML injection w UI, niebezpieczne linki, pakowanie instalatorów oraz powłoki
mobilne: mostek JavaScript, to, czym może sterować treść strony, nawigacja, przechowywane dane
i deep linki.

Poza zakresem: regulamin InstaLing i bany kont, ostrzeżenia o niepodpisanych instalatorach,
social engineering, problemy w usługach zewnętrznych, nieobsługiwane wersje, sideloadowanie
APK/IPA na zrootowanym/zjailbreakowanym telefonie, to że bot zatrzyma się, gdy telefon
wstrzyma WebView w tle, oraz dostęp do odblokowanego telefonu przez osobę trzecią.

## Czasy odpowiedzi

- potwierdzenie w ciągu **3 dni roboczych**,
- wstępna analiza w ciągu **7 dni**,
- cel naprawy krytycznych problemów: **30 dni**,
- koordynowane ujawnienie po wydaniu poprawki.

Nie ma bug bounty. Jeśli chcesz kredyt, napisz — dodamy Cię do advisory lub release notes.

## Safe harbour

Nie podejmiemy kroków prawnych wobec badaczy działających w dobrej wierze, zgodnie z tą
polityką, w granicach własnych kont i danych, bez zakłócania usługi i innych użytkowników.

Pełna polityka: [SECURITY.md](https://github.com/bmonekkk/instaling-bot/blob/master/SECURITY.md)

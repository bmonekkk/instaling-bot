# 🆘 Rozwiązywanie problemów

Jeśli problemu nie ma poniżej, zajrzyj do
[README FAQ](https://github.com/bmonekkk/instaling-bot#-rozwiązywanie-problemów) lub
zadaj pytanie w [Discussions → Q&A](https://github.com/bmonekkk/instaling-bot/discussions/categories/q-a).
**Nie publikuj haseł, ciasteczek, tokenów ani prywatnych logów.**

## Desktop

### Brak internetu / offline

Sprawdź połączenie z internetem i naciśnij **Start** ponownie. Okno pomocy linkuje do FAQ
w README i zamyka się tylko przyciskiem **Zamknij**.

### Brak Chrome w instalatorze

Zainstaluj aplikację ponownie z [oficjalnego wydania](https://github.com/bmonekkk/instaling-bot/releases/latest).

### Bot nie przechodzi logowania

Sprawdź login i hasło w aplikacji. Bot wpisuje dane dokładnie i ponawia próbę raz, jeśli
strona chwilowo odrzuci formularz. Nakładkę cookies bot zamyka sam.

### Chcę zobaczyć, co robi bot

Włącz **Pokaż okno Chrome** i **Logi debug**, a potem zajrzyj do `pages/` i `screenshots/`
w folderze danych.

### Antywirus / SmartScreen ostrzega

Instalatory są niepodpisane; to oczekiwane. Kod źródłowy jest publiczny.

### Za dużo RAM w tle

Włącz tryb zasobnika. Zamknięcie okna niszczy proces renderowania i zostaje lekki proces
główny z ikoną.

### Statystyki są puste

`stats.json` powstaje po pierwszej sesji z co najmniej jedną odpowiedzią. Sprawdź, czy
aplikacja zakończyła sesję bez błędu, i odśwież okno statystyk.

## CLI

### `instaling-bot: command not found`

Dodaj `~/.local/bin` do `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Albo uruchom bezpośrednio:

```bash
node ~/.local/share/instaling-bot/bin/instaling-bot.js help
```

### Bot zatrzymuje się na logowaniu

Sprawdź login i hasło w `config/Config.json`. Przy problemach uruchom z
`"show_browser": true` i sprawdź `screenshots/answer-error.png`.

### `Could not find the "start session" button`

Strona mogła zmienić układ. Włącz `"debug": true` i sprawdź
`pages/answer-start-failed.html`. Jeśli problem jest powtarzalny, otwórz issue z fragmentem
HTML (bez danych osobowych).

### Brak Chrome

```bash
npx puppeteer browsers install chrome
```

### CLI odmawia startu z powodu aktualizacji

Pobierz nową wersję instalatorem `curl` albo — świadomie — uruchom:

```bash
instaling-bot start --skip-update-check
```

### Brak statystyk

`stats.json` powstaje po pierwszej sesji z co najmniej jedną odpowiedzią. Sprawdź:

```bash
instaling-bot stats --json
```

### Po każdej próbie zostają zrzuty

To celowe. `pages/` i `screenshots/` pomagają diagnozować problemy. Możesz je usunąć,
gdy nie są potrzebne.

## Aktualizacje

- **Desktop:** pobierz nowy instalator i uruchom go. Dane w folderze aplikacji zostają.
- **CLI `curl`:** ponownie uruchom instalator.
- **CLI ze źródeł:** `git pull && npm install --omit=dev`.
- **Brak internetu przy sprawdzaniu aktualizacji:** CLI ostrzega i kontynuuje; desktop
  pokaże komunikat i spróbuje ponownie później.

# instaling-bot 3.0.0 — aplikacja desktopowa

Pierwsze wydanie z **aplikacją desktopową dla Windows i macOS**. CLI pozostaje w pełni wspierane, szczególnie dla Linuksa i osób pracujących w terminalu. Oba warianty korzystają z tego samego silnika, konfiguracji i pliku `SavedWords.json`.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-3.0.0-setup.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-3.0.0-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-3.0.0-x64.pkg` | procesory Intel, Chrome w zestawie |
| Linux / terminal | — | użyj CLI: `npm install --omit=dev && npm start` |

Instalator desktopowy zawiera Chrome for Testing. **Nie trzeba instalować Node.js ani Chrome.**

## Najważniejsze zmiany

- Aplikacja Electron z retro interfejsem Windows 95/98, własnym paskiem tytułu i przyciskami Start/Stop.
- GUI: login i hasło, poprawność odpowiedzi, limit odpowiedzi, pokazywanie Chrome, wyciszenie, humanizacja pisania i tryb debug.
- Live log, liczniki odpowiedzi/dobrych/błędnych, czas pracy, skrót do folderu danych i `logs/last-run.log`.
- Graceful stop: bot kończy bieżący krok, zapisuje słówka, zamyka Chrome i dopiero potem kończy proces. Zamknięcie okna podczas pracy też zatrzymuje bota.
- Chrome for Testing jest dołączony do instalatora i przekazywany do silnika przez zmienne środowiskowe.
- Wspólny silnik dla desktopu i CLI: `src/`, `config/Config.json`, `config/SavedWords.json`.
- Bez zmian: obsługa cookies, poprawki logowania, szybka nawigacja, ludzkie pisanie z literówkami i backspace.
- Workflow GitHub Actions buduje Windows `.exe` oraz macOS `.pkg` dla arm64 i x64.

## Instalatory są niepodpisane

Nie ma jeszcze certyfikatu code signing, więc system może ostrzec przy pierwszym uruchomieniu:

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**. Jeśli `.pkg` nadal jest blokowany, można użyć `sudo installer -pkg instaling-bot-3.0.0-arm64.pkg -target /`.

To normalne dla niepodpisanych buildów. Kod źródłowy jest publiczny, a późniejsze wydania mogą dostać podpis, jeśli pojawi się certyfikat.

## Gdzie są dane?

- Windows: `%APPDATA%\instaling-bot`
- macOS: `~/Library/Application Support/instaling-bot`

```
config/Config.json        ustawienia i dane logowania
config/SavedWords.json    zapamiętane tłumaczenia
logs/last-run.log         pełny log ostatniego uruchomienia
pages/                    diagnostyczne zrzuty HTML
screenshots/              diagnostyczne zrzuty ekranu
```

## CLI (Linux i terminal)

```bash
git clone https://github.com/Bmoneczek/instaling-bot.git
cd instaling-bot
npm install --omit=dev
cp config/Config.defaults.json config/Config.json
# uzupełnij credentials.login i credentials.password
npm start
```

Wymagania: Node.js 22+. Jeśli Puppeteer nie pobrał przeglądarki, uruchom `npx puppeteer browsers install chrome`.

## Konfiguracja

Pełny wzór: [`config/Config.defaults.json`](https://github.com/Bmoneczek/instaling-bot/blob/master/config/Config.defaults.json). Desktop pokazuje najważniejsze opcje w GUI, ale plik można edytować ręcznie — aplikacja zachowuje nieznane pola i dodaje tylko brakujące domyślne.

- `valid_chance` — część poprawnych odpowiedzi (`0.8` = 80%).
- `max_answers` — limit odpowiedzi na uruchomienie (`0` = bez limitu).
- `delays.*` — opóźnienia pisania, mikro-pauzy, literówki i kliknięcia.
- `show_browser` / `mute_audio` — okno Chrome i dźwięk.
- `debug` — dodatkowe logi i zrzuty stron.

## Zastrzeżenie

Projekt ma charakter **edukacyjny** (nauka automatyzacji przeglądarki). Nie jest powiązany z InstaLing / instaling.pl i nie jest przeznaczony do oszukiwania w nauce. Automatyczne korzystanie z serwisu może naruszać jego regulamin — używaj odpowiedzialnie i na własną odpowiedzialność. Oprogramowanie jest dostarczane bez gwarancji (licencja ISC).

Pełna lista zmian: [CHANGELOG.md](https://github.com/Bmoneczek/instaling-bot/blob/master/CHANGELOG.md). Instrukcja i rozwiązywanie problemów: [README.md](https://github.com/Bmoneczek/instaling-bot#readme).

# instaling-bot 3.1.0 — losowe błędy, przypomnienia i aktualizacje

Wersja 3.1.0 rozwija aplikację desktopową i CLI: błędne odpowiedzi są teraz bardziej naturalne, o codziennej sesji przypomina powiadomienie, a aplikacja sama sprawdza nowe wydania. Silnik, konfiguracja i `SavedWords.json` pozostają wspólne dla obu wariantów.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-3.1.0-setup.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-3.1.0-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-3.1.0-x64.pkg` | procesory Intel, Chrome w zestawie |
| Linux / terminal | — | użyj CLI: `npm install --omit=dev && npm start` |

Instalator desktopowy zawiera Chrome for Testing. **Nie trzeba instalować Node.js ani Chrome.**

## Najważniejsze zmiany

- **Losowe typy błędów.** Gdy `valid_chance` zdecyduje o błędnej odpowiedzi, bot losuje z równym prawdopodobieństwem: puste pole, inne zapisane tłumaczenie z `SavedWords.json` (z fallbackiem na literówkę) albo wiarygodną literówkę. Suwak poprawności i opcja w `Config.json` działają jak dotychczas.
- **Szybsza pauza po kliknięciu.** Domyślne `delays.click_min` / `click_max` to teraz **2000–4500 ms** zamiast 3500–6500 ms. Istniejące konfiguracje zachowują swoje wartości.
- **Przypomnienie o codziennej sesji.** W ustawieniach włączasz przypomnienie i wybierasz godzinę (domyślnie `17:00`). O wybranej porze pojawia się powiadomienie systemowe i toast w aplikacji. Przypomnienie jest pomijane, jeśli danego dnia sesja została już wykonana. Stan (`lastSession`, `lastNotified`) trafia do `reminder-state.json`.
- **Praca w tle.** Opcjonalny tryb zasobnika (okno chowa się zamiast zamykać) i uruchamianie przy logowaniu systemu. Bez tych opcji aplikacja musi być po prostu otwarta.
- **Sprawdzanie aktualizacji.** Aplikacja sprawdza najnowsze wydanie na GitHubie przy starcie i co 6 godzin; banner z przyciskiem **Pobierz** otwiera stronę wydania. Nic nie jest pobierane ani instalowane automatycznie — instalatory są niepodpisane.
- **Ko-fi i autor.** W panelu ustawień jest informacja o wsparciu projektu, a w pasku stanu podpis `bmonekkk` z linkiem do profilu.
- **CLI z tymi samymi funkcjami.** Nowe polecenia:
  - `npm run remind` — lekka pętla przypomnień w tle (współdzieli konfigurację i stan z `npm start`),
  - `npm run update-check` — porównanie lokalnej wersji z najnowszym wydaniem,
  - `npm start` wypisuje krótką informację, gdy dostępna jest nowsza wersja.

## Konfiguracja

Nowe sekcje w `Config.json` (dodawane automatycznie do istniejących plików):

```jsonc
{
  "reminder": { "enabled": true, "time": "17:00" },
  "background": { "run_in_tray": false, "start_at_login": false }
}
```

Pełny wzór: [`config/Config.defaults.json`](https://github.com/bmonekkk/instaling-bot/blob/master/config/Config.defaults.json). Desktop pokazuje najważniejsze opcje w GUI, ale plik można edytować ręcznie — aplikacja zachowuje nieznane pola i dodaje tylko brakujące domyślne.

## Instalatory są niepodpisane

Nie ma jeszcze certyfikatu code signing, więc system może ostrzec przy pierwszym uruchomieniu:

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**. Jeśli `.pkg` nadal jest blokowany, można użyć `sudo installer -pkg instaling-bot-3.1.0-arm64.pkg -target /`.

Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia i zapisane słówka w folderze danych zostają zachowane.

## Gdzie są dane?

- Windows: `%APPDATA%\instaling-bot`
- macOS: `~/Library/Application Support/instaling-bot`

```
config/Config.json        ustawienia i dane logowania
config/SavedWords.json    zapamiętane tłumaczenia
reminder-state.json       stan codziennego przypomnienia
logs/last-run.log         pełny log ostatniego uruchomienia
pages/                    diagnostyczne zrzuty HTML
screenshots/              diagnostyczne zrzuty ekranu
```

## CLI (Linux i terminal)

```bash
git clone https://github.com/bmonekkk/instaling-bot.git
cd instaling-bot
npm install --omit=dev
cp config/Config.defaults.json config/Config.json
# uzupełnij credentials.login i credentials.password
npm start
```

Przydatne polecenia:

```bash
npm run remind         # przypomnienie o sesji w tle
npm run update-check   # sprawdzenie najnowszego wydania
```

Wymagania: Node.js 22+. Jeśli Puppeteer nie pobrał przeglądarki, uruchom `npx puppeteer browsers install chrome`.

## Zastrzeżenie

Projekt ma charakter **edukacyjny** (nauka automatyzacji przeglądarki). Nie jest powiązany z InstaLing / instaling.pl i nie jest przeznaczony do oszukiwania w nauce. Automatyczne korzystanie z serwisu może naruszać jego regulamin — używaj odpowiedzialnie i na własną odpowiedzialność. Oprogramowanie jest dostarczane bez gwarancji (licencja ISC).

Pełna lista zmian: [CHANGELOG.md](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md). Instrukcja i rozwiązywanie problemów: [README.md](https://github.com/bmonekkk/instaling-bot#readme).

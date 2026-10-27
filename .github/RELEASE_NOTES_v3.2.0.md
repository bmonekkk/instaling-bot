# instaling-bot 3.2.0 — statystyki, przypomnienia i nowe CLI

Wersja 3.2.0 dodaje statystyki sesji, powtarzane przypomnienia, przebudowane CLI z instalacją przez `curl` oraz automatyczne czyszczenie konsoli. Wersja desktopowa i CLI nadal korzystają z tego samego silnika i tych samych plików danych.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-3.2.0-setup-win64.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-3.2.0-macos-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-3.2.0-macos-x64.pkg` | procesory Intel, Chrome w zestawie |
| Linux / terminal | — | CLI: `curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh &#124; bash` |

Instalator desktopowy zawiera Chrome for Testing. **Nie trzeba instalować Node.js ani Chrome.**

## Co nowego

- **Statystyki sesji.** Przycisk **Statystyki** w konsoli pokazuje tydzień, miesiąc, rok i cały okres: sesje, odpowiedzi, poprawne, błędne, skuteczność, nowe słówka, czas i aktywne dni. Dane trafiają do `stats.json` i są wspólne z CLI.
- **Powtarzane przypomnienia.** Nowe ustawienie **Powtarzaj przypomnienie** (co 15, 30, 60, 120 lub 180 minut) przypomina o sesji do momentu jej ukończenia. Odpowiednik w configu: `reminder.repeat_minutes`.
- **Nowe CLI.** Polecenia `start`, `stats`, `remind`, `update-check`, `help` i `version`. Instalacja jedną komendą `curl`, launcher `instaling-bot` w `~/.local/bin`.
- **Aktualizacja przed startem.** `instaling-bot start` sprawdza najnowsze wydanie i nie uruchamia nieaktualnej wersji. Pominięcie: `--skip-update-check` lub `INSTALING_SKIP_UPDATE_CHECK=1`.
- **Szybki start na górze.** Przewodnik jest teraz bezpośrednio pod informacją o Ko-fi, nad formularzem logowania.
- **Czystsza konsola.** Dwie godziny po zakończeniu sesji aplikacja czyści log w oknie i plik `logs/last-run.log` — sesje uruchamiane z zasobnika nie zostawiają bałaganu.
- **Prostsze okna pomocy.** Usunięto przycisk „FAQ na stronie”; błąd i brak internetu prowadzą wyłącznie do FAQ w README. Okno nadal zamyka tylko **Zamknij**.

## Instalatory są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

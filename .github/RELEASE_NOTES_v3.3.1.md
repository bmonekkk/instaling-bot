# instaling-bot 3.3.1 — codzienne aktualizacje i ikona w zasobniku

Mała aktualizacja poprawiająca sprawdzanie nowych wersji w tle. Gdy aplikacja pracuje zminimalizowana lub w zasobniku, teraz sprawdza wydania raz na dobę oraz przy każdym rozpoczęciu sesji — ale nie po jej zakończeniu.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-3.3.1-setup-win64.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-3.3.1-macos-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-3.3.1-macos-x64.pkg` | procesory Intel, Chrome w zestawie |
| Linux / terminal | — | CLI: `curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh &#124; bash` |

## Co nowego

- **Codzienne sprawdzanie aktualizacji.** Aplikacja sprawdza nowe wydanie przy starcie, raz na dobę i przy rozpoczęciu sesji. Sprawdzanie przy starcie sesji nie blokuje bota, a zakończenie sesji nie uruchamia kolejnego sprawdzenia.
- **Ikona w zasobniku.** Gdy dostępna jest nowsza wersja, ikona dostaje czerwony znacznik na Windows/Linux lub dodatkowy kształt na macOS. Tooltip pokazuje numer wersji, a menu zawiera pozycję **Dostępna aktualizacja** prowadzącą do wydania.
- **Ko-fi w menu zasobnika.** Pozycja **Wesprzyj projekt na Ko-fi** jest teraz bezpośrednio pod **Pokaż okno**.
- **Stabilniejsze sprawdzanie.** Chwilowy błąd sieci nie usuwa już znalezionej wcześniej aktualizacji — banner i ikona zostają widoczne.

## Instalatory są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

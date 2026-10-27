# instaling-bot 3.3.2 — jaśniejszy komunikat o braku internetu

Mała aktualizacja porządkująca komunikaty i dokumentację. Okno offline nie odsyła już do FAQ, którego bez internetu nie otworzysz — prosi tylko o sprawdzenie połączenia.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-3.3.2-setup-win64.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-3.3.2-macos-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-3.3.2-macos-x64.pkg` | procesory Intel, Chrome w zestawie |
| Linux / terminal | — | CLI: `curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh &#124; bash` |

## Co nowego

- **Brak internetu bez martwego odsyłacza.** Okno offline mówi teraz tylko: sprawdź połączenie i spróbuj ponownie. Przycisk **FAQ w README** nie pojawia się przy błędach sieci, bo i tak nie da się go otworzyć bez internetu. Przy pozostałych błędach bota przycisk zostaje.
- **Dwie ostatnie wersje w README.** Sekcja zmian pokazuje bieżące wydanie oraz poprzednią wersję; pełna historia jest w `CHANGELOG.md`.
- **Spójna dokumentacja.** Poprawione opisy okna offline w README (PL/EN), na stronie projektu i w danych strukturalnych `FAQPage`.

## Instalatory są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

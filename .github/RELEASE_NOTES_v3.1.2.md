# instaling-bot 3.1.2 — okna pomocy zostają na ekranie

Wersja 3.1.2 to mała poprawka interfejsu: okno błędu i braku internetu nie znika już samo po powrocie sieci ani po kliknięciu ciemnego tła. Zamyka je wyłącznie przycisk **Zamknij**.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-3.1.2-setup.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-3.1.2-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-3.1.2-x64.pkg` | procesory Intel, Chrome w zestawie |
| Linux / terminal | — | użyj CLI: `npm install --omit=dev && npm start` |

Instalator desktopowy zawiera Chrome for Testing. **Nie trzeba instalować Node.js ani Chrome.**

## Co się zmieniło

- **Modal braku internetu i błędu bota zamyka się tylko przyciskiem.** Wcześniej po powrocie połączenia (lub przypadkowym kliknięciu tła) okno znikało po około pół sekundy. Teraz zostaje, dopóki użytkownik sam go nie zamknie.
- **Toast o powrocie internetu nadal działa.** Pojawia się krótkie powiadomienie „Połączenie z internetem wróciło”, ale nie zamyka otwartego okna pomocy.
- **Kliknięcie tła nie zamyka modala.** To zapobiega sytuacjom, w których okno znikało natychmiast po pojawieniu się pod kursorem.

## Reszta z 3.1.1

Bez zmian pozostają: monochromatyczna ikona w menu bar macOS, ukrywanie z Docka w trybie zasobnika, powiadomienia o końcu sesji, lżejsza praca w tle (ok. 50 MB przy starcie do zasobnika), Ko-fi nad logowaniem i dokumentacja autostartu.

## Instalatory są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia i zapisane słówka w folderze danych zostają zachowane.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

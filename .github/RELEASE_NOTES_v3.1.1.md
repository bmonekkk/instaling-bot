# instaling-bot 3.1.1 — lżejsza praca w tle i powiadomienia

Wersja 3.1.1 dopracowuje aplikację desktopową: tryb zasobnika zużywa teraz znacznie mniej RAM, na macOS działa jak natywna aplikacja z menu bar, a zakończoną sesję widać od razu w powiadomieniu. Silnik, konfiguracja i `SavedWords.json` pozostają bez zmian.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-3.1.1-setup.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-3.1.1-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-3.1.1-x64.pkg` | procesory Intel, Chrome w zestawie |
| Linux / terminal | — | użyj CLI: `npm install --omit=dev && npm start` |

Instalator desktopowy zawiera Chrome for Testing. **Nie trzeba instalować Node.js ani Chrome.**

## Najważniejsze zmiany

- **Lżejszy tryb zasobnika.** Zamknięcie okna niszczy proces renderowania, zamiast tylko go ukrywać. W tle zostaje lekki proces główny z ikoną: około **50 MB** przy starcie do zasobnika i poniżej 100 MB po otwarciu i zamknięciu okna. Interfejs odtwarza się po kliknięciu ikony, a wcześniejsze logi wracają do konsoli.
- **Natywny menu bar na macOS.** Ikona jest monochromatyczna i dopasowuje się do jasnego/ciemnego motywu. Po zamknięciu okna aplikacja znika z Docka — zostaje tylko ikona w menu bar. Otwarcie okna przywraca ikonę w Docku.
- **Powiadomienie o końcu sesji.** Sesja uruchomiona z menu ikony kończy się systemowym powiadomieniem z liczbą odpowiedzi i poprawnych (albo treścią błędu). Kliknięcie otwiera aplikację. Gdy okno jest widoczne, powiadomienie się nie pojawia.
- **Okno pomocy przy błędzie.** Brak internetu, utrata połączenia i błąd bota pokazują czytelne okno z przyciskami **FAQ na stronie** i **README**. Nie trzeba już szukać sekcji pomocy ręcznie.
- **Ko-fi nad logowaniem.** Informacja o wsparciu projektu jest teraz na górze panelu ustawień, widoczna od razu po uruchomieniu.
- **Autostart bez tajemnic.** README i ustawienia w aplikacji wyjaśniają, że po cichy start potrzeba **obu** przełączników: *Uruchamiaj przy logowaniu* i *Działaj w zasobniku*.

## Autostart i praca w tle

| Autostart | Tryb zasobnika | Co się dzieje po logowaniu |
|---|---|---|
| ✅ | ❌ | Otwiera się normalne okno aplikacji |
| ✅ | ✅ | Brak okna — tylko ikona w zasobniku / menu bar |
| ❌ | ✅ | Normalne okno przy ręcznym starcie; zamknięcie chowa do zasobnika |

Na macOS system może nie zgłosić, że aplikacja została uruchomiona w tle — wtedy okno może pojawić się mimo włączonego trybu zasobnika. To ograniczenie Electronu na macOS 13+.

## Instalatory są niepodpisane

Nie ma jeszcze certyfikatu code signing, więc system może ostrzec przy pierwszym uruchomieniu:

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**. Jeśli `.pkg` nadal jest blokowany, można użyć `sudo installer -pkg instaling-bot-3.1.1-arm64.pkg -target /`.

Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia i zapisane słówka w folderze danych zostają zachowane.

## Gdzie są dane?

- Windows: `%APPDATA%\instaling-bot`
- macOS: `~/Library/Application Support/instaling-bot`

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

# instaling-bot 4.2.2 — naprawiona szybkość klikania przycisków

Wydanie naprawcze do 4.2.1. Ustawienie **szybkość klikania przycisków** (`nav_min` / `nav_max`) działa teraz naprawdę na każdej platformie: instaling.pl przeładowuje stronę przy „dalej", „kontynuuj" i starcie sesji, a pauza była wcześniej liczona tylko w obrębie jednej strony — znikała po przeładowaniu, więc przejście między słówkami było zawsze tak szybkie jak wczytanie strony. Teraz silnik zapisuje termin pauzy przed kliknięciem i dolicza resztę na świeżej stronie.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.2.2-setup-win64.exe` | instalator NSIS |
| macOS 13+ (ARM64) | `instaling-bot-4.2.2-macos-arm64.pkg` | procesory Apple |
| macOS 13+ (Intel) | `instaling-bot-4.2.2-macos-x64.pkg` | procesory Intel |
| Android 7+ (uniwersalny) | `instaling-bot-4.2.2-android.apk` | APK, WebView |
| iPhone / iPad (iOS 16+) | `instaling-bot-4.2.2-ios.ipa` | SideStore/AltStore, bez podpisu |
| Safari iOS/iPadOS / Firefox Android | `instaling-bot.user.js` | userscript (4.2.3), aktualizuje się sam |
| Linux / terminal | — | CLI: `instaling-bot --help` |

> **Aktualizacja userscriptu (4.2.3).** Sam `instaling-bot.user.js` dostał wersję `4.2.3`, żeby menedżery skryptów pobrały poprawkę tempa klikania. Aplikacja desktopowa, Android i iOS są w wersji `4.2.2`. Userscript aktualizuje się automatycznie przez `releases/latest/download/instaling-bot.user.js`.

Strona projektu sama wykrywa system (Windows, macOS ARM64/Intel, Android, iPhone, iPad, Linux), podświetla zalecaną wersję i jednym przyciskiem pobiera pasujący plik oraz przewija do instrukcji instalacji. Pozostałe opcje zostają dostępne.

## Co nowego

- **Szybkość klikania przycisków działa też po przeładowaniu strony.** Pauza `nav_min` / `nav_max` była liczona tylko na jednej stronie; gdy instaling.pl przeładował stronę przy „dalej" / „kontynuuj" / starcie sesji, opóźnienie znikało i przejście między słówkami było zawsze tak szybkie jak wczytanie strony. Silnik zapisuje teraz termin pauzy przed kliknięciem (stan `navUntil`) i dolicza resztę na świeżej stronie — dotyczy to przycisku „dalej" na stronie wyniku, „kontynuuj", startu sesji i nowego słówka. Zachowanie pilnują dwa nowe testy.
- **Desktop czeka też przy starcie i kontynuacji sesji.** `nav_min` / `nav_max` sterują teraz nie tylko „dalej", ale i przyciskami startu / kontynuacji / nowej sesji (wspólny helper `navDelays()`).

## Ustawienia na każdej platformie

| | Desktop | Android / iOS | Userscript |
|---|---|---|---|
| Poprawność odpowiedzi | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Czasy pisania (klik, litery, literówka, pauza) | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Szybkość klikania przycisków (min/max) | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Godzina i częstotliwość przypomnienia | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Statystyki tydzień / miesiąc / rok / wszystko | ✓ | ✓ (📊) | ✓ (📊) |
| Przywróć domyślne | ✓ | ✓ | ✓ |

## Android: jak zainstalować

1. Pobierz APK i otwórz go na telefonie.
2. Zezwól na instalację z tego źródła, gdy Android zapyta.
3. Zaloguj się na `instaling.pl` w aplikacji, wejdź na stronę instaling.pl i naciśnij **Start**.
4. Dotknij ⚙, aby ustawić poprawność, czasy pisania, szybkość klikania oraz godzinę i częstotliwość przypomnienia; dotknij 📊, aby zobaczyć statystyki; dotknij ⏰, aby włączyć przypomnienie (Android 13+ poprosi o zgodę).

APK jest podpisany kluczem deweloperskim, nie przez Play Store.

## iOS: dwie drogi

**Najłatwiej — Safari + userscript:** zainstaluj darmowe **Userscripts** z App Store, włącz rozszerzenie w Safari, zaimportuj `instaling-bot.user.js` i otwórz stronę instaling.pl.

**Osobna aplikacja — IPA:** zainstaluj SideStore lub AltStore, dodaj `instaling-bot-4.2.2-ios.ipa` i podpisz własnym Apple ID. Darmowe konto wymaga odświeżania co 7 dni; SideStore potrafi robić to automatycznie.

## Ograniczenia mobilne

- Sesja działa tylko przy otwartej aplikacji lub karcie — telefon może wstrzymać WebView w tle.
- Brak trybu ukrytego i pracy w tle; zostaw aplikację na pierwszym planie.
- System limituje liczbę oczekujących powiadomień, więc iOS odbudowuje je przy każdym otwarciu aplikacji.
- Eksport słówek i praca w tle zostają w desktopie; mobile pokazują pełne statystyki tygodnia/miesiąca/roku.
- APK i IPA nie są w Play Store ani App Store.

## Instalatory desktopowe są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja desktopu polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

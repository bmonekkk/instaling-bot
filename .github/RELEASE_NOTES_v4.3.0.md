# instaling-bot 4.3.0 — dwie prawdziwe pauzy i naprawione „Gotowe" na iOS

Nowe wydanie porządkuje tempo pracy tak, jak robiłby to człowiek. Bot najpierw czeka chwilę po pojawieniu się słówka, zanim zacznie pisać, a po sprawdzeniu odpowiedzi czyta wynik przed kliknięciem „dalej". Na iOS pasek **„Gotowe"** nad klawiaturą liczbową ma jasny, klasyczny wygląd i niezawodnie chowa klawiaturę.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.3.0-setup-win64.exe` | instalator NSIS |
| macOS 13+ (ARM64) | `instaling-bot-4.3.0-macos-arm64.pkg` | procesory Apple |
| macOS 13+ (Intel) | `instaling-bot-4.3.0-macos-x64.pkg` | procesory Intel |
| Android 7+ (uniwersalny) | `instaling-bot-4.3.0-android.apk` | APK, WebView |
| iPhone / iPad (iOS 16+) | `instaling-bot-4.3.0-ios.ipa` | SideStore/AltStore, bez podpisu |
| Safari iOS/iPadOS / Firefox Android | `instaling-bot.user.js` | userscript (4.3.0), aktualizuje się sam |
| Linux / terminal | — | CLI: `instaling-bot --help` |

> **Aktualizacja userscriptu (4.3.0).** Sam `instaling-bot.user.js` dostał wersję `4.3.0`, żeby menedżery skryptów pobrały nowe ustawienia pauz. Aplikacja desktopowa, Android i iOS są w wersji `4.3.0`. Userscript aktualizuje się automatycznie przez `releases/latest/download/instaling-bot.user.js`.

Strona projektu sama wykrywa system (Windows, macOS ARM64/Intel, Android, iPhone, iPad, Linux), podświetla zalecaną wersję i jednym przyciskiem pobiera pasujący plik oraz przewija do instrukcji instalacji. Pozostałe opcje zostają dostępne.

## Co nowego

- **Pauza przed pisaniem (`think_min` / `think_max`, 1500–4000 ms).** Po pojawieniu się słówka bot czeka losowo wybrany czas, zanim wstawi pierwszy znak — tak jak człowiek, który najpierw pomyśli o tłumaczeniu.
- **Pauza po wyniku (`review_min` / `review_max`, 2500–5500 ms).** Przed „dalej" bot czyta wynik dłużej po literówce, złym słowie, pustym polu albo nowym słówku.
- **Krótka pauza po poprawnej odpowiedzi (`review_correct_min` / `review_correct_max`, 500–1200 ms).** Nadal konfigurowalna, ale szybsza niż po błędzie.
- **Wszystkie wartości losowe.** Każda pauza jest losowana z podanego zakresu, więc czasy różnią się między słówkami. Działa na desktopie, Androidzie, iOS i w userscripcie.
- **Stare pola ukryte.** `click_min` / `click_max` i `nav_min` / `nav_max` zniknęły z paneli ustawień, ale nadal działają jako ciche fallbacki dla starszych konfiguracji.
- **iOS „Gotowe".** Pasek nad klawiaturą wymusza jasną klawiaturę, używa klasycznej palety i chowa klawiaturę przez `UIApplication.sendAction`.

## Ustawienia na każdej platformie

| | Desktop | Android / iOS | Userscript |
|---|---|---|---|
| Poprawność odpowiedzi | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Pauza przed pisaniem (min/max) | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Pauza po błędzie lub nowym słówku (min/max) | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Pauza po poprawnej odpowiedzi (min/max) | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Czasy pisania (litery, literówka, pauza) | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Godzina i częstotliwość przypomnienia | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Statystyki tydzień / miesiąc / rok / wszystko | ✓ | ✓ (📊) | ✓ (📊) |
| Przywróć domyślne | ✓ | ✓ | ✓ |

## Android: jak zainstalować

1. Pobierz APK i otwórz go na telefonie.
2. Zezwól na instalację z tego źródła, gdy Android zapyta.
3. Zaloguj się na `instaling.pl` w aplikacji, wejdź na stronę instaling.pl i naciśnij **Start**.
4. Dotknij ⚙, aby ustawić poprawność, pauzy przed pisaniem i po wyniku, czasy pisania oraz godzinę i częstotliwość przypomnienia; dotknij 📊, aby zobaczyć statystyki; dotknij ⏰, aby włączyć przypomnienie (Android 13+ poprosi o zgodę).

APK jest podpisany kluczem deweloperskim, nie przez Play Store.

## iOS: dwie drogi

**Najłatwiej — Safari + userscript:** zainstaluj darmowe **Userscripts** z App Store, włącz rozszerzenie w Safari, zaimportuj `instaling-bot.user.js` i otwórz stronę instaling.pl.

**Osobna aplikacja — IPA:** zainstaluj SideStore lub AltStore, dodaj `instaling-bot-4.3.0-ios.ipa` i podpisz własnym Apple ID. Darmowe konto wymaga odświeżania co 7 dni; SideStore potrafi robić to automatycznie.

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

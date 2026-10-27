# instaling-bot 4.2.1 — statystyki wszędzie i wygodniejsze ustawienia

Wydanie porządkujące spójność wszystkich platform: desktop, Android, iOS i userscript mają teraz **ten sam panel statystyk** (tydzień / miesiąc / rok / wszystko), przycisk **Przywróć domyślne** i jedno wspólne ustawienie **szybkości klikania przycisków**. Częstotliwość przypomnienia wybierasz z listy także na telefonie, a panel userscriptu przestał wychodzić poza ekran w Safari.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.2.1-setup-win64.exe` | instalator NSIS |
| macOS 13+ (ARM64) | `instaling-bot-4.2.1-macos-arm64.pkg` | procesory Apple |
| macOS 13+ (Intel) | `instaling-bot-4.2.1-macos-x64.pkg` | procesory Intel |
| Android 7+ (uniwersalny) | `instaling-bot-4.2.1-android.apk` | APK, WebView, przypomnienia z listą częstotliwości |
| iPhone / iPad (iOS 16+) | `instaling-bot-4.2.1-ios.ipa` | SideStore/AltStore, bez podpisu |
| Safari iOS/iPadOS / Firefox Android | `instaling-bot.user.js` | userscript (4.2.2), aktualizuje się sam |
| Linux / terminal | — | CLI: `instaling-bot --help` |

> **Aktualizacja userscriptu (4.2.2).** Sam `instaling-bot.user.js` dostał wersję `4.2.2`, żeby menedżery skryptów pobrały nowy panel (statystyki + reset + szybkość klikania) oraz poprawkę wysokości panelu na Safari. Aplikacja desktopowa, Android i iOS są w wersji `4.2.1`. Userscript aktualizuje się automatycznie — link `releases/latest/download/instaling-bot.user.js` wskazuje na `4.2.2`.

Strona projektu sama wykrywa system (Windows, macOS ARM64/Intel, Android, iPhone, iPad, Linux), podświetla zalecaną wersję i jednym przyciskiem pobiera pasujący plik oraz przewija do instrukcji instalacji. Pozostałe opcje zostają dostępne.

## Co nowego

- **Statystyki na każdej platformie.** Android, iOS i userscript mają teraz ten sam panel co desktop: zakładki **tydzień / miesiąc / rok / wszystko** z sesjami, odpowiedziami, poprawnymi i błędnymi, skutecznością, nowymi słówkami, łącznym czasem i aktywnymi dniami. Wspólny silnik mobilny zapisuje sesje i czas trwania tak samo jak desktop, więc liczby się zgadzają.
- **Przywróć domyślne.** Jeden przycisk na desktopie, Androidzie, iOS i w userscripcie resetuje wszystkie ustawienia — **poza loginem, hasłem i językiem**.
- **Szybkość klikania przycisków.** Nowe wspólne `nav_min` / `nav_max` (domyślnie 2000/4500 ms) ustawia tempo klikania „dalej", logowania i startu sesji — spójnie na desktopie i telefonie.
- **Przypomnienia jak na desktopie.** Częstotliwość wybierasz teraz z listy (raz dziennie, co 15/30/60/120/180 min) również na Androidzie i iOS — koniec z wpisywaniem minut. Godzina przypomnienia jest wyrównana do lewej.
- **Poprawka panelu userscriptu na Safari.** Wysokość panelu opiera się na `100dvh` (z zapasem `100vh`) i ma `overscroll-behavior: contain`, więc panel nie wychodzi poza ekran i nie przewija strony pod spodem.

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

**Osobna aplikacja — IPA:** zainstaluj SideStore lub AltStore, dodaj `instaling-bot-4.2.1-ios.ipa` i podpisz własnym Apple ID. Darmowe konto wymaga odświeżania co 7 dni; SideStore potrafi robić to automatycznie.

## Ograniczenia mobilne

- Sesja działa tylko przy otwartej aplikacji lub karcie — telefon może wstrzymać WebView w tle.
- Brak trybu ukrytego i pracy w tle; zostaw aplikację na pierwszym planie.
- System limituje liczbę oczekujących powiadomień, więc iOS odbudowuje je przy każdym otwarciu aplikacji.
- Eksport słówek i praca w tle zostają w desktopie; mobile pokazują pełne statystyki tygodnia/miesiąca/roku.
- APK i IPA nie są w Play Store ani App Store.

## Instalatory desktopowe są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja desktopu polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane. Nowe pole `nav_min` / `nav_max` dostaje wartość domyślną, jeśli go nie ustawisz.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

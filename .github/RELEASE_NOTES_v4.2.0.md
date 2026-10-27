# instaling-bot 4.2.0 — pełna zgodność, czasy i przypomnienia

Wydanie domykające spójność wszystkich platform: desktop, telefon i userscript mają teraz ten sam klasyczny wygląd i pełny zestaw ustawień czasów, natywne przypomnienia powtarzają się co wybrany interwał i milkną po ukończeniu sesji danego dnia, a opcja limitu odpowiedzi została usunięta z każdej wersji.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.2.0-setup-win64.exe` | instalator NSIS |
| macOS 13+ (ARM64) | `instaling-bot-4.2.0-macos-arm64.pkg` | procesory Apple |
| macOS 13+ (Intel) | `instaling-bot-4.2.0-macos-x64.pkg` | procesory Intel |
| Android 7+ (uniwersalny) | `instaling-bot-4.2.0-android.apk` | APK, WebView, powtarzalne przypomnienie |
| iPhone / iPad (iOS 16+) | `instaling-bot-4.2.0-ios.ipa` | SideStore/AltStore, bez podpisu |
| Safari iOS/iPadOS / Firefox Android | `instaling-bot.user.js` | userscript (4.2.1), aktualizuje się sam |
| Linux / terminal | — | CLI: `instaling-bot --help` |

> **Aktualizacja userscriptu (4.2.1).** Sam `instaling-bot.user.js` dostał wersję `4.2.1`: czcionka panelu nie zmienia się już po starcie sesji, a główny przycisk wykryty jako macOS pobiera teraz plik `.pkg` (z podpowiedzią dla procesorów Intel). Aplikacja desktopowa, Android i iOS pozostają w wersji `4.2.0`. Userscript aktualizuje się automatycznie — link `releases/latest/download/instaling-bot.user.js` wskazuje na `4.2.1`.

Strona projektu sama wykrywa system (Windows, macOS ARM64/Intel, Android, iPhone, iPad, Linux), podświetla zalecaną wersję i jednym przyciskiem pobiera pasujący plik oraz przewija do instrukcji instalacji. Pozostałe opcje zostają dostępne.

## Co nowego

- **Jeden wygląd wszędzie.** Okno desktopu, panel userscriptu i strona dzielą ten sam klasyczny motyw: jasnoszare tło, czcionka Tahoma/MS Sans Serif, kwadratowe obramowania z fazowaniem i granatowy pasek tytułu.
- **Pełne ustawienia czasów na telefonie i w userscripcie.** Android, iOS i userscript mają teraz wszystkie suwaki humanizacji z desktopu: pauzę po kliknięciu (min/max), opóźnienie liter (min/max), szansę na literówkę i szansę na pauzę — obok poprawności odpowiedzi i autostartu. Wartości zapisują się i wracają po restarcie.
- **Natywne przypomnienia z powtarzaniem.** Android i iOS mogą powtarzać przypomnienie co 15/30/60/120/180 minut (albo raz dziennie) — tak jak desktop — i **przestają powiadamiać, gdy ukończysz sesję danego dnia**.
- **Userscript bez powiadomień w tle.** Gdy otworzysz kartę po godzinie przypomnienia, a dzisiejsza sesja nie jest zrobiona, panel pokazuje dyskretny banner na stronie. Prawdziwe powiadomienia zostają aplikacjom i systemowi.
- **Bez limitu odpowiedzi.** Opcja `max_answers` zniknęła z desktopu, CLI, telefonu, userscriptu i testów. Sesja trwa tak długo, jak prowadzi ją strona.
- **Porządki na stronie.** Jeden główny przycisk („Pobierz dla &lt;Twój system&gt;”), przycisk „Pobierz dla innego systemu”, karty pobierania z samym systemem, architekturą i formatem pliku, nowa sekcja „O bocie” (co to jest, jak działa, jak wykrywalne), skrócona sekcja CLI (`--help` + repozytorium) i poprawione sformułowania.

## Ustawienia na każdej platformie

| | Desktop | Android / iOS | Userscript |
|---|---|---|---|
| Poprawność odpowiedzi | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Czasy pisania (klik, litery, literówka, pauza) | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Godzina i powtarzanie przypomnienia | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Statystyki dnia / skuteczność / seria | ✓ | ✓ | ✓ |

## Android: jak zainstalować

1. Pobierz APK i otwórz go na telefonie.
2. Zezwól na instalację z tego źródła, gdy Android zapyta.
3. Zaloguj się na `instaling.pl` w aplikacji, wejdź na stronę instaling.pl i naciśnij **Start**.
4. Dotknij ⚙, aby ustawić poprawność, czasy pisania, godzinę i powtarzanie przypomnienia; dotknij ⏰, aby włączyć przypomnienie (Android 13+ poprosi o zgodę).

APK jest podpisany kluczem deweloperskim, nie przez Play Store.

## iOS: dwie drogi

**Najłatwiej — Safari + userscript:** zainstaluj darmowe **Userscripts** z App Store, włącz rozszerzenie w Safari, zaimportuj `instaling-bot.user.js` i otwórz stronę instaling.pl.

**Osobna aplikacja — IPA:** zainstaluj SideStore lub AltStore, dodaj `instaling-bot-4.2.0-ios.ipa` i podpisz własnym Apple ID. Darmowe konto wymaga odświeżania co 7 dni; SideStore potrafi robić to automatycznie.

## Ograniczenia mobilne

- Sesja działa tylko przy otwartej aplikacji lub karcie — telefon może wstrzymać WebView w tle.
- Brak trybu ukrytego i pracy w tle; zostaw aplikację na pierwszym planie.
- System limituje liczbę oczekujących powiadomień, więc iOS odbudowuje je przy każdym otwarciu aplikacji.
- Pełne statystyki tygodnia/miesiąca/roku i eksport słówek zostają w desktopie; mobile pokazują dzień, skuteczność i serię dni.
- APK i IPA nie są w Play Store ani App Store.

## Instalatory desktopowe są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja desktopu polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane. Istniejący klucz `max_answers` w `Config.json` jest po prostu ignorowany.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

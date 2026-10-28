# instaling-bot 4.3.1 — działająca aplikacja iOS, unoszące się „Gotowe" i Android jak iOS

Poprawkowe wydanie 4.3.1 naprawia aplikację iOS — nie wywala się już przy starcie na iOS 26 i nowszych — i przebudowuje **„Gotowe"**: nad klawiaturą liczbową unosi się teraz tylko klasyczny przycisk, bez szarego paska zasłaniającego stronę. Android dostał ten sam kompaktowy wygląd co iOS: mniejszy pasek tytułu z widocznym gradientem, który płynnie przechodzi w pasek stanu, oraz symetryczną ramkę okna. Wszystko z 4.3.0 — dwie ludzkie pauzy przed pisaniem i po wyniku — zostaje bez zmian.

## Naprawione w 4.3.1

- **iOS nie crashuje przy starcie.** Aplikacje budowane z SDK iOS 26 muszą korzystać z cyklu życia `UIScene`. Bez niego UIKit zgłaszał błąd i proces kończył się, zanim narysował pierwszy ekran (biały ekran albo powrót do pulpitu). Dodano `SceneDelegate` i `UIApplicationSceneManifest`; okno, kontroler główny i linki `instalingbot://start|stop` obsługuje teraz scena.
- **„Gotowe" to teraz unoszący się przycisk.** Zamiast `UIToolbar` (który na iOS 26 rysuje się jako wielka szklana pigułka) nad klawiaturą wisi tylko wypukły przycisk w stylu Windows 95, wyrównany do prawej krawędzi — bez szarego paska zasłaniającego stronę. Nadal chowa klawiaturę przez `UIApplication.sendAction`.
- **Android wygląda jak iOS.** Przyciski w pasku tytułu (EN, ⏰, 📊, ⚙) mają 34×30 dp zamiast domyślnych 88×48 dp, Start/Stop mają 34 dp wysokości, pasek ma 44 dp i ten sam granatowo-niebieski gradient co iOS, a napis „instaling-bot" mieści się w jednej linii. Ramkę okna rysuje teraz osobna powłoka, więc przyciski i WebView nie wystają poza obramowanie, a pasek stanu z zegarem i baterią ma ten sam granatowo-niebieski gradient co tytuł — jak na iOS.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.3.1-setup-win64.exe` | instalator NSIS |
| macOS 13+ (ARM64) | `instaling-bot-4.3.1-macos-arm64.pkg` | procesory Apple |
| macOS 13+ (Intel) | `instaling-bot-4.3.1-macos-x64.pkg` | procesory Intel |
| Android 7+ (uniwersalny) | `instaling-bot-4.3.1-android.apk` | APK, WebView |
| iPhone / iPad (iOS 16+) | `instaling-bot-4.3.1-ios.ipa` | SideStore/AltStore, bez podpisu |
| Safari iOS/iPadOS / Firefox Android | `instaling-bot.user.js` | userscript (4.3.1), aktualizuje się sam |
| Linux / terminal | — | CLI: `instaling-bot --help` |

> **Aktualizacja userscriptu (4.3.1).** Sam `instaling-bot.user.js` dostał wersję `4.3.1`, żeby menedżery skryptów pobrały nowe ustawienia pauz. Aplikacja desktopowa, Android i iOS są w wersji `4.3.1`. Userscript aktualizuje się automatycznie przez `releases/latest/download/instaling-bot.user.js`.

Strona projektu sama wykrywa system (Windows, macOS ARM64/Intel, Android, iPhone, iPad, Linux), podświetla zalecaną wersję i jednym przyciskiem pobiera pasujący plik oraz przewija do instrukcji instalacji. Pozostałe opcje zostają dostępne.

## Co nowego w 4.3.0

- **Pauza przed pisaniem (`think_min` / `think_max`, 1500–4000 ms).** Po pojawieniu się słówka bot czeka losowo wybrany czas, zanim wstawi pierwszy znak — tak jak człowiek, który najpierw pomyśli o tłumaczeniu.
- **Pauza po wyniku (`review_min` / `review_max`, 2500–5500 ms).** Przed „dalej" bot czyta wynik dłużej po literówce, złym słowie, pustym polu albo nowym słówku.
- **Krótka pauza po poprawnej odpowiedzi (`review_correct_min` / `review_correct_max`, 500–1200 ms).** Nadal konfigurowalna, ale szybsza niż po błędzie.
- **Wszystkie wartości losowe.** Każda pauza jest losowana z podanego zakresu, więc czasy różnią się między słówkami. Działa na desktopie, Androidzie, iOS i w userscripcie.
- **Stare pola ukryte.** `click_min` / `click_max` i `nav_min` / `nav_max` zniknęły z paneli ustawień, ale nadal działają jako ciche fallbacki dla starszych konfiguracji.
- **iOS „Gotowe".** Klawiatura liczbowa wymusza jasny motyw, a przycisk „Gotowe" chowa ją przez `UIApplication.sendAction` (w 4.3.1 przebudowany na unoszący się przycisk).

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

**Osobna aplikacja — IPA:** zainstaluj SideStore lub AltStore, dodaj `instaling-bot-4.3.1-ios.ipa` i podpisz własnym Apple ID. Darmowe konto wymaga odświeżania co 7 dni; SideStore potrafi robić to automatycznie.

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

# instaling-bot 4.1.0 — spójność na każdej platformie

Wydanie wyrównujące desktop, telefon i userscript: te same oznaczenia pobierania, automatyczne wykrywanie urządzenia na stronie, jedna ikona wszędzie oraz ustawienia poprawności, limitu i godziny przypomnienia również na telefonie i w userscripcie. Desktop i CLI zachowują wszystkie wcześniejsze funkcje.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.1.0-setup-win64.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-4.1.0-macos-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-4.1.0-macos-x64.pkg` | procesory Intel, Chrome w zestawie |
| Android 7+ (uniwersalny) | `instaling-bot-4.1.0-android.apk` | APK, WebView, konfigurowalne przypomnienie |
| iPhone / iPad (iOS 16+) | `instaling-bot-4.1.0-ios.ipa` | SideStore/AltStore, bez podpisu |
| Safari iOS/iPadOS / Firefox Android | `instaling-bot.user.js` | userscript, aktualizuje się sam |
| Linux / terminal | — | CLI: `curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh \| bash` |

Strona projektu sama wykrywa system (Windows, macOS ARM64/Intel, Android, iPhone, iPad, Linux) i podświetla zalecaną wersję — pozostałe opcje zostają dostępne.

## Co nowego

- **Spójne oznaczenia pobierania.** Każda opcja podaje system i minimalną wersję, architekturę oraz format pliku, w tej samej kolejności. Usunięto mylącą etykietę „Zalecana wersja” przy Androidzie.
- **Wykrywanie urządzenia na stronie.** Nowy moduł `docs/download-detect.js` rozpoznaje system po User-Agent Client Hints (architektura, bitowość), z heurystyką dla iPadOS (Safari podającego się za `MacIntel`) i bezpiecznym fallbackiem. Podświetla pasującą kartę i aktualizuje główny przycisk; wybór można zmienić ręcznie w polu **Twoje urządzenie**.
- **Ustawienia na telefonie.** Android i iOS mają panel ustawień: poprawność odpowiedzi, limit odpowiedzi i **konfigurowalna godzina przypomnienia** (`TimePickerDialog` / `UIDatePicker`). Wartości zapisują się (`SharedPreferences`/`UserDefaults`), trafiają do silnika i działają od razu przez `setConfig()` bez przeładowania.
- **Statystyki mobilne.** APK, IPA i userscript pokazują dzisiejsze odpowiedzi, skuteczność i serię dni — jak desktop.
- **Ustawienia userscriptu.** Panel z poprawnością, limitem i autostartem, zapisywany trwale; popup jest wyśrodkowany i nie wychodzi poza wąski ekran.
- **Jedna ikona.** Desktop, APK, IPA, userscript i strona używają tego samego znaku generowanego z `build/icon.png`.
- **Sesja bez haseł.** Aplikacje mobilne nadal nie zapisują danych logowania; Android utrwala ciasteczka sesji (`CookieManager.flush()`), żeby po powrocie nie trzeba było logować się ponownie.
- **Mniej rozpoznawalna powłoka.** Usunięto niestandardowy fragment User-Agenta z APK. To best-effort, nie gwarancja pełnej anonimowości.
- **FAQ.** Dodano wyjaśnienie okna Premium na desktopie (należy je zamknąć ręcznie; nie ukrywaj okna przeglądarki) i wspólną terminologię ustawień.
- **Bezpieczeństwo.** Plik konfiguracyjny CLI jest teraz chroniony uprawnieniami właściciela (jak w desktopie), Android nie otwiera linków z ramek reklamowych na zewnątrz, a Electron blokuje uprawnienia sieciowe i nawigację w oknie. Pełny przegląd i znane ograniczenia: [`SECURITY_AUDIT.md`](https://github.com/bmonekkk/instaling-bot/blob/master/SECURITY_AUDIT.md). Projekt nie twierdzi, że jest w 100% bezpieczny.

## Ustawienia i statystyki

| | Desktop | Android / iOS | Userscript |
|---|---|---|---|
| Poprawność odpowiedzi | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Limit odpowiedzi | ✓ | ✓ (⚙) | ✓ (Ustawienia) |
| Godzina przypomnienia | ✓ | ✓ (⚙) | — |
| Statystyki dnia / skuteczność / seria | ✓ | ✓ | ✓ |

## Android: jak zainstalować

1. Pobierz APK i otwórz go na telefonie.
2. Zezwól na instalację z tego źródła, gdy Android zapyta.
3. Zaloguj się na `instaling.pl` w aplikacji, wejdź na stronę nauki i naciśnij **Start**.
4. Dotknij ⚙, aby ustawić poprawność, limit i godzinę przypomnienia; dotknij ⏰, aby włączyć przypomnienie (Android 13+ poprosi o zgodę).

APK jest podpisany kluczem deweloperskim, nie przez Play Store.

## iOS: dwie drogi

**Najłatwiej — Safari + userscript:** zainstaluj darmowe **Userscripts** z App Store, włącz rozszerzenie w Safari, zaimportuj `instaling-bot.user.js` i otwórz stronę nauki.

**Osobna aplikacja — IPA:** zainstaluj SideStore lub AltStore, dodaj `instaling-bot-4.1.0-ios.ipa` i podpisz własnym Apple ID. Darmowe konto wymaga odświeżania co 7 dni; SideStore potrafi robić to automatycznie. Aplikacja obsługuje teraz także iPada (`TARGETED_DEVICE_FAMILY: 1,2`).

## Ograniczenia mobilne

- Sesja działa tylko przy otwartej aplikacji lub karcie — telefon może wstrzymać WebView w tle.
- Brak trybu ukrytego i pracy w tle; zostaw aplikację na pierwszym planie.
- Przypomnienie ma konfigurowalną godzinę, ale bez powtarzania co N minut.
- Pełne statystyki tygodnia/miesiąca/roku i eksport słówek zostają w desktopie; mobile pokazują dzień, skuteczność i serię dni.
- APK i IPA nie są w Play Store ani App Store.

## Instalatory desktopowe są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja desktopu polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

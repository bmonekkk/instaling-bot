# instaling-bot 4.0.0 — bot na telefonie

Pierwsze wydanie mobilne. Ten sam silnik, który napędza desktop i CLI, trafia teraz na Androida i iPhone'a — z interfejsem PL/EN, humanizacją pisania, zapamiętywaniem słówek i natywnymi przypomnieniami. Desktop i CLI zachowują wszystkie funkcje z 3.3.x.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.0.0-setup-win64.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-4.0.0-macos-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-4.0.0-macos-x64.pkg` | procesory Intel, Chrome w zestawie |
| Android 7+ | `instaling-bot-4.0.0-android.apk` | APK, WebView, przypomnienie 17:00 |
| iOS 16+ | `instaling-bot-4.0.0-ios.ipa` | SideStore/AltStore, bez podpisu |
| Safari iOS / Firefox Android | `instaling-bot.user.js` | userscript, aktualizuje się sam |
| Linux / terminal | — | CLI: `curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh \| bash` |

## Co nowego

- **Android APK.** Natywna powłoka WebView z paskiem Start/Stop, przełącznikiem PL/EN, licznikiem odpowiedzi, przypomnieniem o 17:00 i przyciskiem aktualizacji. Deep linki `instalingbot://start` i `instalingbot://stop` działają z Taskerem i MacroDroidem. Przypomnienie przetrwa restart telefonu.
- **iOS IPA.** Niepodpisana aplikacja UIKit/WKWebView dla SideStore/AltStore, z tym samym silnikiem, lokalnym powiadomieniem o 17:00 i schematem URL dla Skrótów. Zbudowana na macOS runnerze GitHub Actions.
- **Userscript.** Pływający panel dla Safari na iOS/iPadOS (rozszerzenie Userscripts) i Firefoksa na Androidzie (Tampermonkey/Violentmonkey). Obsługuje `?autostart=1`, `?lang=en`, `GM_setValue` i automatyczne aktualizacje.
- **Wspólny silnik mobilny.** Odpowiedzi, literówki, zapisywanie słówek i statystyki sesji działają jak w desktopie. instaling.pl przeładowuje stronę po sprawdzeniu odpowiedzi, więc silnik zapisuje stan i kończy rozliczenie odpowiedzi na stronie wyniku — sesja przeżywa nawigację.
- **Bezpieczeństwo mobilne.** Aplikacje nie czytają `Config.json` i nie zapisują haseł; korzystają z normalnej sesji strony w WebView.
- **Wydania.** Workflow buduje teraz APK, IPA i userscript razem z instalatorami desktopowymi. CI sprawdza bundle userscriptu, Android debug APK i niepodpisany build iOS.

## Android: jak zainstalować

1. Pobierz APK i otwórz go na telefonie.
2. Zezwól na instalację z tego źródła, gdy Android zapyta.
3. Zaloguj się na `instaling.pl` w aplikacji, wejdź na stronę nauki i naciśnij **Start**.
4. Dotknij ⏰, aby włączyć codzienne przypomnienie o 17:00 (Android 13+ poprosi o zgodę).

APK jest podpisany kluczem deweloperskim, nie przez Play Store.

## iOS: dwie drogi

**Najłatwiej — Safari + userscript:** zainstaluj darmowe **Userscripts** z App Store, włącz rozszerzenie w Safari, zaimportuj `instaling-bot.user.js` i otwórz stronę nauki.

**Osobna aplikacja — IPA:** zainstaluj SideStore lub AltStore, dodaj `instaling-bot-4.0.0-ios.ipa` i podpisz własnym Apple ID. Darmowe konto wymaga odświeżania co 7 dni; SideStore potrafi robić to automatycznie.

## Ograniczenia mobilne

- Sesja działa tylko przy otwartej aplikacji lub karcie — telefon może wstrzymać WebView w tle.
- Brak trybu ukrytego i pracy w tle w 4.0.
- Przypomnienie ma stałą godzinę 17:00, bez powtarzania co N minut.
- Pełne statystyki tygodnia/miesiąca/roku i eksport słówek zostają w desktopie.
- APK i IPA nie są w Play Store ani App Store.

## Instalatory desktopowe są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja desktopu polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

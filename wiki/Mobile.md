# 📱 Mobile: Android i iOS

Wersja 4.1.0 wyrównuje telefon z desktopem. Wszystkie warianty mobilne używają tego samego
silnika co desktop: odpowiedzi, literówki, zapamiętywanie słówek i interfejs PL/EN. Mają
też te same **ustawienia** (poprawność odpowiedzi, limit, godzina przypomnienia) oraz
**statystyki** (dzisiejsze odpowiedzi, skuteczność i seria dni).

Aplikacje mobilne **nie zapisują hasła**. Logujesz się normalnie na `instaling.pl` w ich
wbudowanej przeglądarce, a bot odpowiada w otwartej sesji. Sesja działa tylko przy
otwartej aplikacji lub karcie — telefon może wstrzymać WebView w tle.

## Android: APK (zalecane)

1. Pobierz `instaling-bot-4.1.0-android.apk` z
   [najnowszego wydania](https://github.com/bmonekkk/instaling-bot/releases/latest).
2. Otwórz plik i zezwól na instalację z tego źródła.
3. Zaloguj się na `instaling.pl` w aplikacji.
4. Wejdź na stronę nauki i naciśnij **Start**.

Górny pasek: **PL/EN**, ⏰ (przypomnienie), ⚙ (ustawienia), **Start**, **Stop**. Pod paskiem
widać status, licznik odpowiedzi i dzisiejsze statystyki. Gdy jest nowsze wydanie, pojawia
się przycisk **Aktualizacja**.

- **Ustawienia (⚙):** poprawność odpowiedzi, limit odpowiedzi i godzina przypomnienia.
  Wartości zapisują się w aplikacji i działają od razu.
- **Przypomnienie (⏰):** codzienne powiadomienie o wybranej godzinie (domyślnie 17:00).
- Android 7+ (minSdk 24), targetSdk 35.
- Android 13+ poprosi o zgodę na powiadomienia.
- Przypomnienie przetrwa restart telefonu (`BootReceiver` czyta zapisaną godzinę).
- Deep linki: `instalingbot://start` i `instalingbot://stop` (Tasker, MacroDroid).
- Release APK bez sekretów `ANDROID_KEYSTORE_*` jest podpisany kluczem debugowym, więc
  da się go zainstalować; nie jest to podpis Play Store.

## iOS: Safari + userscript (najłatwiej)

1. Zainstaluj darmową aplikację **Userscripts** z App Store.
2. Włącz rozszerzenie w **Ustawienia → Safari → Rozszerzenia** i zezwól na `instaling.pl`.
3. Otwórz
   [instaling-bot.user.js](https://github.com/bmonekkk/instaling-bot/releases/latest/download/instaling-bot.user.js)
   w Safari i zaimportuj skrypt.
4. Wejdź na `instaling.pl`, zaloguj się i dotknij logo bota.

Panel ma Start/Stop, PL/EN, licznik odpowiedzi, statystyki i rozwijane **Ustawienia**
(poprawność, limit, autostart). Ustawienia i słówka zapisują się w `GM_setValue`. Skrypt
aktualizuje się przez `@updateURL`.

## iOS: IPA dla SideStore / AltStore

1. Pobierz `instaling-bot-4.1.0-ios.ipa` z najnowszego wydania.
2. Zainstaluj [SideStore](https://sidestore.io/) lub AltStore i dodaj IPA.
3. Zaloguj się na `instaling.pl` i naciśnij **Start**.

IPA jest **niepodpisana** — podpisujesz ją własnym Apple ID. Darmowe konto wymaga
odświeżenia co **7 dni**; SideStore potrafi robić to automatycznie. Aplikacja ma PL/EN,
ustawienia sesji ze statystykami, konfigurowalne przypomnienie i przycisk aktualizacji.
Skróty iOS mogą użyć `instalingbot://start` / `instalingbot://stop`.

## Userscript na Androidzie

Chrome for Android nie obsługuje userscriptów. Użyj **Firefoksa for Android** z
**Tampermonkey** lub **Violentmonkey** i zainstaluj ten sam plik `instaling-bot.user.js`.

Parametry strony:

- `?autostart=1` — uruchamia sesję po załadowaniu,
- `?lang=en` — angielski interfejs.

## Ograniczenia

- Brak pracy w tle: sesja trwa tylko przy otwartej aplikacji/karcie.
- Brak zapisywania haseł na telefonie; Android utrwala ciasteczka sesji, więc po powrocie
  do aplikacji logowanie zwykle nie jest potrzebne.
- Przypomnienie ma konfigurowalną godzinę, ale bez powtarzania co N minut.
- Pełne statystyki tygodnia/miesiąca/roku i eksport słówek zostają w desktopie; mobile
  pokazują dzień, skuteczność i serię dni.
- APK i IPA są poza Play Store i App Store.

Więcej: [Instalacja](Installation) · [Problemy](Troubleshooting) · [FAQ](FAQ)

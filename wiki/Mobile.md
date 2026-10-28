# 📱 Mobile: Android i iOS

Wersja 4.3.0 porządkuje tempo pracy na telefonie: bot czeka chwilę po pojawieniu się
słówka, zanim zacznie pisać (`think_min` / `think_max`), a po sprawdzeniu odpowiedzi czyta
wynik przed „dalej" — dłużej po błędzie lub nowym słówku (`review_min` / `review_max`),
krótko po poprawnej odpowiedzi (`review_correct_min` / `review_correct_max`). Wszystkie
wartości są losowane z zakresu. Na iOS pasek **„Gotowe"** nad klawiaturą ma jasny,
klasyczny wygląd i niezawodnie chowa klawiaturę. Wszystkie warianty mobilne używają tego samego
silnika co desktop: odpowiedzi, literówki, zapamiętywanie słówek i interfejs PL/EN. Mają
też te same **ustawienia** (poprawność odpowiedzi, trzy zakresy pauz, czasy pisania,
literówki, godzina i częstotliwość przypomnienia), przycisk
**Przywróć domyślne** oraz **pełne statystyki** z zakładkami tydzień / miesiąc / rok /
wszystko (sesje, odpowiedzi, skuteczność, nowe słówka, czas i aktywne dni).

Aplikacje mobilne **nie zapisują hasła**. Logujesz się normalnie na `instaling.pl` w ich
wbudowanej przeglądarce, a bot odpowiada w otwartej sesji. Sesja działa tylko przy
otwartej aplikacji lub karcie — telefon może wstrzymać WebView w tle.

## Android: APK (zalecane)

1. Pobierz `instaling-bot-4.3.0-android.apk` z
   [najnowszego wydania](https://github.com/bmonekkk/instaling-bot/releases/latest).
2. Otwórz plik i zezwól na instalację z tego źródła.
3. Zaloguj się na `instaling.pl` w aplikacji.
4. Wejdź na stronę nauki i naciśnij **Start**.

Górny pasek: **PL/EN**, 📊 (statystyki), ⏰ (przypomnienie), ⚙ (ustawienia), **Start**,
**Stop**. Pod paskiem widać status, licznik odpowiedzi i dzisiejsze statystyki. Gdy jest
nowsze wydanie, pojawia się przycisk **Aktualizacja**.

- **Ustawienia (⚙):** poprawność odpowiedzi (`valid_chance`), pauza przed pisaniem
  (`think_min`/`think_max`), pauza po błędzie lub nowym słówku (`review_min`/`review_max`),
  pauza po poprawnej odpowiedzi (`review_correct_min`/`review_correct_max`), czasy pisania
  (`type_min`/`type_max`), szanse na pauzę i literówkę (`type_pause_chance`, `typo_chance`)
  oraz godzina i częstotliwość przypomnienia. Przycisk **Przywróć domyślne** resetuje
  wszystko poza loginem, hasłem i językiem. Wartości zapisują się w aplikacji i działają
  od razu.
- **Statystyki (📊):** panel z zakładkami tydzień / miesiąc / rok / wszystko — sesje,
  odpowiedzi, poprawne i błędne, skuteczność, nowe słówka, łączny czas i aktywne dni.
- **Przypomnienie (⏰):** codzienne powiadomienie o wybranej godzinie (domyślnie 17:00).
  Częstotliwość wybierasz z listy (raz dziennie lub co 15/30/60/120/180 min). Przypomnienia
  zatrzymują się, gdy ukończysz dzisiejszą sesję.
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

Panel ma Start/Stop, PL/EN, licznik odpowiedzi, przełączany **panel statystyk** (zakładki
tydzień / miesiąc / rok / wszystko) i **Przywróć domyślne**. Rozwijane **Ustawienia** mają
poprawność, pauzy przed pisaniem i po wyniku (`think_*`, `review_*`, `review_correct_*`),
czasy pisania oraz autostart. Ustawienia i słówka zapisują się w `GM_setValue`. Panel używa
`100dvh`, więc nie wychodzi poza ekran Safari. Skrypt aktualizuje się przez `@updateURL`.

Zamiast powiadomień w tle userscript pokazuje **banner na stronie**: pojawia się, gdy
otworzysz kartę `instaling.pl` po godzinie przypomnienia, a dzisiejsza sesja nie jest
jeszcze ukończona.

## iOS: IPA dla SideStore / AltStore

1. Pobierz `instaling-bot-4.3.0-ios.ipa` z najnowszego wydania.
2. Zainstaluj [SideStore](https://sidestore.io/) lub AltStore i dodaj IPA.
3. Zaloguj się na `instaling.pl` i naciśnij **Start**.

IPA jest **niepodpisana** — podpisujesz ją własnym Apple ID. Darmowe konto wymaga
odświeżenia co **7 dni**; SideStore potrafi robić to automatycznie. Aplikacja ma PL/EN,
ustawienia sesji (w tym szybkość klikania przycisków), **listę częstotliwości przypomnienia**
z godziną wyrównaną do lewej, **panel statystyk** (tydzień / miesiąc / rok / wszystko),
**Przywróć domyślne** i przycisk aktualizacji.
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
- Przypomnienie ma konfigurowalną godzinę i listę częstotliwości; powtarzanie zatrzymuje
  się po ukończeniu dzisiejszej sesji.
- Statystyki (tydzień / miesiąc / rok / wszystko) są na każdej platformie; eksport słówek
  zostaje w desktopie.
- APK i IPA są poza Play Store i App Store.

Więcej: [Instalacja](Installation) · [Problemy](Troubleshooting) · [FAQ](FAQ)

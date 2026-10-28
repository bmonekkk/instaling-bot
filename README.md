# instaling-bot 🤖

**🇵🇱 Polski · 🇬🇧 [English](README.en.md)**

Bot do automatycznego rozwiązywania słówek na [instaling.pl](https://instaling.pl) — teraz na **wszystkich urządzeniach: Windows, macOS, Android, iOS i w terminalu**.

<p align="center">
  <img src="docs/demo.gif" alt="Mem z kotem — i'm gonna touch u" width="480">
</p>

**Strona projektu:** https://bmonekkk.github.io/instaling-bot/ — bez trackerów, ciasteczek i skryptów analitycznych
**Najnowsza wersja:** https://github.com/bmonekkk/instaling-bot/releases/latest
**Wiki:** https://github.com/bmonekkk/instaling-bot/wiki
**Dyskusje:** https://github.com/bmonekkk/instaling-bot/discussions

[![CI](https://github.com/bmonekkk/instaling-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/bmonekkk/instaling-bot/actions/workflows/ci.yml)
[![CodeQL](https://github.com/bmonekkk/instaling-bot/actions/workflows/codeql.yml/badge.svg)](https://github.com/bmonekkk/instaling-bot/actions/workflows/codeql.yml)
[![Release](https://img.shields.io/github/v/release/bmonekkk/instaling-bot?label=release)](https://github.com/bmonekkk/instaling-bot/releases/latest)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Discussions](https://img.shields.io/github/discussions/bmonekkk/instaling-bot?label=discussions)](https://github.com/bmonekkk/instaling-bot/discussions)

Aktualna wersja (**4.2.2**) to wydanie spójności — desktop, telefon i userscript wyglądają i działają tak samo:

- 🖥️ **desktop** dla Windows i macOS: GUI, live log, statystyki i wbudowany Chrome,
- 📱 **Android APK** i **iOS**: wspólny silnik, interfejs PL/EN, ustawienia sesji, statystyki i konfigurowalne przypomnienia,
- 🌐 **userscript** dla Safari na iOS/iPadOS oraz Firefoksa na Androidzie, z trwałym panelem ustawień,
- ⌨️ pełnoprawne **CLI** dla Linuksa i terminala, instalowane jedną komendą `curl`,
- 🧠 humanizację pisania: losowe opóźnienia, mikro-pauzy, literówki poprawiane backspace'em i trzy rodzaje celowych błędów.

Wersja 4.2.2 poprawia **szybkość klikania przycisków** (`nav_min` / `nav_max`): instaling.pl przeładowuje stronę przy „dalej", „kontynuuj" i starcie sesji, a pauza była wcześniej liczona tylko w obrębie jednej strony — znikała po przeładowaniu, więc przejście między słówkami było zawsze tak szybkie jak wczytanie strony. Silnik zapisuje teraz termin pauzy przed kliknięciem i dolicza resztę na świeżej stronie, na desktopie i telefonie. Do tego desktop honoruje to ustawienie również przy starcie i kontynuacji sesji. Wydanie 4.2.1 wyrównało możliwości wszystkich platform: wspólny **panel statystyk** (tydzień / miesiąc / rok / wszystko: sesje, odpowiedzi, skuteczność, nowe słówka, czas, aktywne dni), przycisk **Przywróć domyślne** (resetuje wszystko poza loginem, hasłem i językiem), listę częstotliwości przypomnienia na Androidzie i iOS (raz dziennie, co 15/30/60/120/180 min) z godziną wyrównaną do lewej oraz panel userscriptu, który nie wychodzi już poza ekran w Safari (`100dvh`). Statystyki mobilne liczą sesje i czas trwania tak samo jak desktop. Aplikacje mobilne nadal nie zapisują haseł — korzystają z normalnej, trwałej sesji strony. Desktop i CLI zachowują wszystkie wcześniejsze funkcje.

Open source, licencja ISC.


## 💙 Wesprzyj rozwój projektu

Instaling Bot to niezależny projekt open source rozwijany hobbystycznie. Jeśli uważasz go za przydatny i chcesz wesprzeć mój czas poświęcony na rozwój, testowanie i utrzymanie kodu, możesz postawić mi wirtualną kawę.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H5P529J2VO)

Wsparcie jest całkowicie dobrowolne i nie jest wymagane do korzystania z projektu. Projekt nie jest oficjalnie powiązany z InstaLing. Wpłaty nie gwarantują konkretnych funkcji ani terminów aktualizacji.


## ✨ Cztery warianty, jeden silnik

| | Desktop | Android APK / iOS IPA | Userscript | CLI |
|---|---|---|---|---|
| Systemy | Windows 10/11, macOS 13+ | Android 7+ / iOS 16+ | Safari iOS, Firefox Android | Linux, macOS, Windows |
| Wymaga Node.js | **Nie** | **Nie** | **Nie** | Tak, Node.js 22+ |
| Interfejs | Okno aplikacji, ustawienia, live log | Natywny pasek + strona w WebView | Pływający panel na stronie | Terminal |
| Logowanie | w aplikacji | normalne logowanie na stronie | normalne logowanie na stronie | w aplikacji |
| Przeglądarka | Chrome for Testing w instalatorze | WebView systemowy | Twoja przeglądarka | Puppeteer |
| Statystyki | tydzień, miesiąc, rok, całość | dzień, skuteczność i seria dni | dzień, skuteczność i seria dni | `instaling-bot stats` |
| Przypomnienia | systemowe + toast, co N minut | natywne, co N minut po wybranej godzinie | baner na stronie po otwarciu karty | `instaling-bot remind` |
| Automatyzacja | zasobnik, autostart | `instalingbot://start` / `stop` | `?autostart=1` | polecenia CLI |
| Aktualizacja | nowy instalator | przycisk **Aktualizacja** | auto przez `@updateURL` | nowy `curl` |

Wszystkie warianty korzystają z tego samego silnika (`src/core/` i `mobile/engine/`), tych samych strategii odpowiedzi i humanizacji pisania. Zapamiętane słówka zostają lokalnie: desktop/CLI w `SavedWords.json`, mobile w pamięci WebView, a userscript w `GM_setValue`.

Interfejs desktopowy działa po polsku i angielsku. Język przełączasz przyciskami **PL/EN** na pasku menu; wybór zapisuje się w `Config.json` (`language`) i obejmuje też menu zasobnika oraz powiadomienia systemowe.

Powiadomienie o zakończeniu sesji jest domyślnie włączone i pojawia się tylko wtedy, gdy okno jest ukryte w zasobniku lub zminimalizowane — możesz je wyłączyć przełącznikiem **Powiadamiaj o zakończeniu sesji**. `Config.json` jest zapisywany z uprawnieniami tylko dla właściciela (`600` na macOS/Linux, prywatna lista ACL na Windows), a hasło jest maskowane w logach i powiadomieniach. Zamiast trzymać hasło w pliku możesz użyć zmiennych środowiskowych `INSTALING_LOGIN` i `INSTALING_PASSWORD` — mają pierwszeństwo przed konfiguracją.


## 🖥️ Desktop: Windows i macOS

Pobierz instalator z [najnowszego wydania](https://github.com/bmonekkk/instaling-bot/releases/latest):

- **Windows:** `instaling-bot-4.2.2-setup-win64.exe` (NSIS, x64)
- **macOS Apple Silicon:** `instaling-bot-4.2.2-macos-arm64.pkg`
- **macOS Intel:** `instaling-bot-4.2.2-macos-x64.pkg`

Instalator desktopowy zawiera własną przeglądarkę Chrome for Testing. Nie trzeba instalować Node.js ani Chrome.

### 📥 Instalacja i pierwsze uruchomienie

1. Uruchom instalator.
2. Otwórz **instaling-bot**.
3. Wpisz login i hasło do InstaLing.
4. Ustaw poprawność odpowiedzi (`80%` domyślnie).
5. Naciśnij **Start**.

Bot otworzy osobne okno Chrome, zaloguje się, rozpocznie lub kontynuuje sesję i będzie odpowiadał na słówka. Postęp, licznik odpowiedzi i błędy widać w konsoli aplikacji. Przycisk **Statystyki** pokazuje sesje, odpowiedzi, skuteczność i czas z ostatnich 7 dni, 30 dni, roku lub całego okresu.

### ⏰ Przypomnienie o codziennej sesji

W ustawieniach włącz **Przypominaj o codziennej sesji** i wybierz godzinę (domyślnie `17:00`). Gdy aplikacja działa — również ukryta w zasobniku — o wybranej porze pojawi się powiadomienie systemowe i toast w oknie. Opcja **Powtarzaj przypomnienie** wysyła je ponownie co 15, 30, 60, 120 lub 180 minut, dopóki nie ukończysz sesji. Przypomnienie jest pomijane, jeśli danego dnia bot zdążył już odpowiedzieć na co najmniej jedno słówko.

Opcjonalnie możesz włączyć **Działaj w zasobniku po zamknięciu okna** (okno chowa się zamiast zamykać) oraz **Uruchamiaj przy logowaniu systemu**. Bez tych opcji aplikacja musi być po prostu otwarta.

### 🚀 Autostart i praca w tle

Oba przełączniki są w **Ustawienia → Przypomnienia i praca w tle**:

| Autostart | Tryb zasobnika | Co się dzieje po logowaniu |
|---|---|---|
| ✅ | ❌ | Otwiera się normalne okno aplikacji |
| ✅ | ✅ | Brak okna — tylko ikona w zasobniku (Windows) / menu bar (macOS) |
| ❌ | ✅ | Normalne okno przy ręcznym starcie; zamknięcie chowa do zasobnika |

- Autostart jest **domyślnie wyłączony** i dotyczy aplikacji desktopowej; CLI uruchamiasz ręcznie.
- Aby aplikacja startowała po cichu, włącz **oba** przełączniki. Sam autostart otworzy okno na pulpicie.
- Na macOS tryb zasobnika chowa ikonę z Docka i przełącza aplikację w tryb akcesoriów — zostaje tylko ikona w menu bar, która dopasowuje się do jasnego/ciemnego motywu.
- Po zamknięciu okna w trybie zasobnika aplikacja niszczy okno (a nie tylko je ukrywa), żeby w tle zużywać mniej RAM. Interfejs odtworzy się po kliknięciu ikony.
- Sesję możesz uruchomić z menu ikony (**Start**). Gdy się skończy, dostaniesz powiadomienie systemowe z liczbą odpowiedzi — o ile włączysz **Powiadamiaj o zakończeniu sesji** i okno jest ukryte lub zminimalizowane.
- Ikona w zasobniku daje też **Stop**, **Pokaż okno**, **Wesprzyj projekt na Ko-fi** i **Zakończ**, a przy dostępnej aktualizacji — pozycję **Dostępna aktualizacja**.

### 🔄 Aktualizacje

Aplikacja sprawdza [najnowsze wydanie na GitHubie](https://github.com/bmonekkk/instaling-bot/releases/latest) przy starcie, raz na dobę oraz przy każdym rozpoczęciu sesji — także gdy działa zminimalizowana lub w zasobniku. Zakończenie sesji nie wywołuje sprawdzania. Gdy pojawi się nowsza wersja, u góry okna wyświetli się banner z przyciskiem **Pobierz**, a ikona w zasobniku zmieni się (czerwony znacznik na Windows/Linux, dodatkowy kształt na macOS). Instalatory są niepodpisane, więc aktualizacja polega na pobraniu i uruchomieniu nowego instalatora — aplikacja nie pobiera ani nie instaluje niczego samodzielnie. Sprawdzenie można też wywołać ręcznie przyciskiem **Sprawdź aktualizacje** w konsoli.

### 🔐 Instalatory są niepodpisane

Na razie nie ma certyfikatu code signing, więc system może ostrzec przy pierwszym uruchomieniu:

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

To normalne dla niepodpisanych buildów. Późniejsze wersje mogą dostać podpis, jeśli pojawi się certyfikat.

### 📡 Offline i błędy

Gdy aplikacja nie widzi internetu, pokazuje okno z prośbą o sprawdzenie połączenia i przyciskiem **Zamknij** — bez odsyłania do FAQ, którego bez sieci i tak nie otworzysz. Okno zamyka się **tylko przyciskiem Zamknij** — nie znika samo po powrocie sieci ani po kliknięciu tła. Przy błędzie bota (np. zmiana układu strony, odrzucone logowanie) pojawia się dodatkowy przycisk **FAQ w README** prowadzący do sekcji [Rozwiązywanie problemów](#-rozwiązywanie-problemów).

### 📁 Gdzie aplikacja trzyma dane?

Przycisk **Folder danych** w aplikacji otwiera właściwy katalog:

- Windows: `%APPDATA%\instaling-bot`
- macOS: `~/Library/Application Support/instaling-bot`

W środku znajdują się:

```
config/Config.json        ustawienia i dane logowania
config/SavedWords.json    zapamiętane tłumaczenia
stats.json                statystyki sesji (wspólne z CLI)
pages/                    diagnostyczne zrzuty HTML
screenshots/              diagnostyczne zrzuty ekranu
logs/last-run.log         pełny log ostatniego uruchomienia
```

Pliki można edytować także ręcznie — aplikacja używa tego samego formatu co CLI.


## 📱 Mobile: Android i iOS

Wersja 4.2.2 naprawia tempo klikania przycisków na telefonie (pauza działa teraz też po przeładowaniu strony). Aplikacje mobilne nie są okrojoną podróbką: używają **tego samego silnika odpowiedzi**, humanizacji pisania, zapisywania słówek i trybu PL/EN. Mają też **te same ustawienia** (poprawność odpowiedzi, opóźnienia klikania i pisania, szybkość klikania przycisków, szanse na pauzę i literówkę, godzina i częstotliwość przypomnienia) oraz **pełne statystyki** z zakładkami tydzień / miesiąc / rok / wszystko (sesje, odpowiedzi, skuteczność, nowe słówka, czas i aktywne dni). W każdym panelu ustawień jest **Przywróć domyślne**. Różnica jest w powłoce — na telefonie bot działa w otwartej aplikacji lub karcie przeglądarki, bez pracy w tle.

### 🤖 Android: APK (zalecane)

1. Pobierz `instaling-bot-4.2.2-android.apk` z [najnowszego wydania](https://github.com/bmonekkk/instaling-bot/releases/latest).
2. Otwórz plik na telefonie i zezwól na instalację z tego źródła (Android zapyta raz).
3. Uruchom **instaling-bot**, zaloguj się na `instaling.pl` w oknie aplikacji.
4. Wejdź na stronę nauki i naciśnij **Start** na górnym pasku.

Górny pasek ma przełącznik **PL/EN**, przycisk statystyk 📊, przypomnienie ⏰, ustawienia ⚙, Start i Stop. Pod paskiem widać status, licznik odpowiedzi oraz dzisiejsze statystyki. Gdy pojawi się nowsze wydanie, aplikacja pokaże przycisk **Aktualizacja** prowadzący do GitHuba.

**Ustawienia:** dotknij ⚙, aby zmienić poprawność odpowiedzi, opóźnienia klikania i pisania (`click_min` / `click_max`, `type_min` / `type_max`), **szybkość klikania przycisków** (`nav_min` / `nav_max`), szansę na pauzę (`type_pause_chance`), szansę na literówkę (`typo_chance`) oraz **godzinę i częstotliwość przypomnienia**. Przycisk **Przywróć domyślne** resetuje wszystkie ustawienia poza loginem, hasłem i językiem. Wartości zapisują się w aplikacji i obowiązują od razu, bez ponownego uruchamiania.

**Statystyki:** dotknij 📊, aby zobaczyć panel z zakładkami tydzień / miesiąc / rok / wszystko — sesje, odpowiedzi, poprawne i błędne, skuteczność, nowe słówka, łączny czas i aktywne dni. Liczby pochodzą z tego samego modelu co desktop.

**Przypomnienie:** dotknij ⏰, aby włączyć codzienne powiadomienie o wybranej godzinie (domyślnie **17:00**). Częstotliwość wybierasz z listy — raz dziennie albo co 15/30/60/120/180 min — a przypomnienia przestają przychodzić, gdy dzisiejsza sesja jest już ukończona. Android 13+ poprosi o zgodę na powiadomienia. Przypomnienie przetrwa restart telefonu.

**Automatyzacja:** aplikacja obsługuje deep linki `instalingbot://start` i `instalingbot://stop`. W Taskerze, MacroDroidzie lub innym automacie dodaj akcję „Otwórz URL/Intent”, aby uruchomić sesję np. po połączeniu z domowym Wi-Fi. Bot nadal potrzebuje otwartej aplikacji i zalogowanej sesji.

### 🍎 iOS: Safari + userscript (najłatwiejsza droga)

Chrome na iOS nie obsługuje rozszerzeń, ale Safari tak:

1. Zainstaluj darmową aplikację **Userscripts** z App Store.
2. Włącz ją w **Ustawienia → Safari → Rozszerzenia** i zezwól na `instaling.pl`.
3. Otwórz [instaling-bot.user.js](https://github.com/bmonekkk/instaling-bot/releases/latest/download/instaling-bot.user.js) w Safari i zaimportuj skrypt w Userscripts.
4. Wejdź na `instaling.pl`, zaloguj się i dotknij pływającego przycisku 🤖.

Panel userscriptu ma Start/Stop, PL/EN, licznik odpowiedzi, przełączany **panel statystyk** (zakładki tydzień / miesiąc / rok / wszystko) i **Przywróć domyślne**. Rozwiń **Ustawienia**, aby zmienić poprawność odpowiedzi, wszystkie desktopowe opóźnienia pisania i klikania (`click_min` / `click_max`, `type_min` / `type_max`, `typo_chance`, `type_pause_chance`), **szybkość klikania przycisków** (`nav_min` / `nav_max`) oraz autostart — wartości zapisują się trwale w pamięci rozszerzenia. Panel ma `max-height` oparty na `100dvh`, więc nie wychodzi poza ekran Safari. Słowa również zapisują się między sesjami. Userscript nie wysyła powiadomień przeglądarki: gdy otworzysz kartę po godzinie przypomnienia i dzisiejsza sesja nie jest ukończona, pokazuje mały baner na stronie. Skrypt aktualizuje się sam przez `@updateURL`.

### 🍏 iOS: IPA dla SideStore / AltStore

Dla osób, które wolą osobną aplikację:

1. Pobierz `instaling-bot-4.2.2-ios.ipa` z najnowszego wydania.
2. Zainstaluj [SideStore](https://sidestore.io/) lub AltStore i dodaj plik IPA.
3. Zaloguj się na `instaling.pl` w aplikacji i naciśnij **Start**.

IPA jest **niepodpisana** — podpisujesz ją własnym Apple ID. Darmowe konto wymaga odświeżania co **7 dni**; SideStore potrafi robić to automatycznie. Aplikacja ma to samo PL/EN, ustawienia sesji (poprawność, opóźnienia pisania i klikania, szybkość klikania przycisków, szanse na pauzę i literówkę), **listę częstotliwości przypomnienia** z godziną wyrównaną do lewej, **panel statystyk** (tydzień / miesiąc / rok / wszystko), **Przywróć domyślne** i przycisk aktualizacji.

**Skróty (Shortcuts):** aplikacja przyjmuje `instalingbot://start` i `instalingbot://stop`, więc możesz uruchomić sesję z automatyzacji iOS. Sesja działa tylko, gdy aplikacja jest na pierwszym planie.

### 🌐 Userscript na Androidzie

Chrome for Android nie ma menedżera userscriptów. Użyj **Firefoksa for Android** z **Tampermonkey** lub **Violentmonkey** i zainstaluj ten sam plik `instaling-bot.user.js`. To dobry wariant dla osób, które nie chcą instalować APK.

Możesz też otworzyć stronę z parametrami: `?autostart=1` uruchamia sesję po załadowaniu, a `?lang=en` ustawia angielski interfejs — przydatne w skrótach i automatyzacjach.

### ⚠️ Ograniczenia mobilne

- Sesja działa tylko przy **otwartej aplikacji lub karcie**. Telefon może wstrzymać WebView po przejściu w tło; nie ma ukrytej pracy w tle. Zostaw aplikację na pierwszym planie.
- Aplikacje mobilne **nie zapisują hasła** — logujesz się normalnie na stronie, a ciasteczka zostają w WebView (Android dopisuje je do trwałej sesji przy każdym przejściu w tło).
- APK i IPA są **niepodpisane przez store**. Instalujesz je na własną odpowiedzialność; nie ma ich w Play Store ani App Store.
- Pełne statystyki tygodnia/miesiąca/roku i eksport słówek pozostają w wersji desktopowej; mobile pokazują dzień, skuteczność i serię dni.


## ⌨️ CLI: Linux i terminal

Wersja CLI pozostaje wspierana tak długo, jak istnieje wersja desktopowa. To zalecany wariant dla Linuksa i wszystkich osób, które wolą terminal.

### ⚡ Instalacja jedną komendą

Wymagany jest Node.js 22+ ([nodejs.org](https://nodejs.org/)). Cały program instaluje się do `~/.local/share/instaling-bot`, a launcher `instaling-bot` trafia do `~/.local/bin`:

```bash
curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh | bash
```

Skrypt zachowuje istniejące `config/Config.json` i `SavedWords.json` przy ponownej instalacji. Jeśli `~/.local/bin` nie jest w `PATH`, dodaj do `~/.zshrc` lub `~/.bashrc`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 🧰 Instalacja ze źródeł

```bash
git clone https://github.com/bmonekkk/instaling-bot.git
cd instaling-bot
npm install --omit=dev
cp config/Config.defaults.json config/Config.json
```

Uzupełnij dane logowania w `config/Config.json`:

```json
"credentials": {
    "login": "twoj-login-lub-email",
    "password": "twoje-haslo"
}
```

Pliki `config/Config.json` i `config/SavedWords.json` są ignorowane przez git, więc dane logowania i słówka nie trafią do repozytorium.

### 📋 Polecenia

```bash
instaling-bot help              # lista poleceń i opcji
instaling-bot start             # sprawdza aktualizacje, potem uruchamia sesję
instaling-bot                   # to samo co start
instaling-bot stats             # tydzień, miesiąc, rok i cały okres
instaling-bot stats --period month
instaling-bot stats --json      # wynik dla skryptów
instaling-bot remind            # przypomnienie o sesji w tle (Ctrl+C kończy)
instaling-bot update-check      # porównanie z najnowszym wydaniem
instaling-bot version
```

Po instalacji ze źródeł odpowiedniki to `npm start`, `npm run stats`, `npm run remind` i `npm run update-check`.

`instaling-bot start` **najpierw sprawdza najnowsze wydanie**. Jeśli dostępna jest nowsza wersja, bot nie wystartuje i pokaże link do pobrania. Świadome pominięcie: `--skip-update-check` lub `INSTALING_SKIP_UPDATE_CHECK=1`. Gdy GitHub jest chwilowo niedostępny, CLI tylko ostrzega i kontynuuje.

### 📊 Statystyki w CLI

Każda sesja z co najmniej jedną odpowiedzią trafia do `stats.json` (w katalogu projektu lub w folderze danych desktopu). `instaling-bot stats` pokazuje sesje, odpowiedzi, poprawne, błędne, skuteczność, nowe słówka i czas dla tygodnia, miesiąca, roku oraz całego okresu. `--period week|month|year|all` zawęża wynik, a `--json` zwraca dane do dalszej obróbki.

### 🔔 Przypomnienie w CLI

Ta sama sekcja `reminder` w `Config.json` steruje przypomnieniem w desktopie i CLI. Aby otrzymywać powiadomienie o codziennej sesji, zostaw w tle:

```bash
instaling-bot remind
```

Proces sprawdza co minutę, czy minęła wybrana godzina i czy dzisiejsza sesja nie została jeszcze odhaczona. Domyślnie powiadomienie wysyła się raz dziennie; ustawienie `reminder.repeat_minutes` (np. `30`) powtarza je co 30 minut, dopóki nie ukończysz sesji. Stan trafia do `reminder-state.json` i jest wspólny z uruchomieniem bota oraz z desktopem. Zatrzymanie: `Ctrl+C`.

### 🔄 Aktualizacja CLI

```bash
curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh | bash
```

Przy instalacji ze źródeł: `git pull && npm install --omit=dev`.

Jeśli Puppeteer nie pobrał przeglądarki podczas instalacji:

```bash
npx puppeteer browsers install chrome
```


## ⚙️ Jak działa bot

- Loguje się na instaling.pl danymi z konfiguracji.
- Automatycznie zamyka okno zgody Google (cookies), które zasłania formularz logowania.
- Rozpoczyna nową sesję albo kontynuuje poprzednią.
- Odczytuje zdanie, polskie słowo i zapisane tłumaczenie.
- Odpowiada poprawnie w `valid_chance` przypadków (domyślnie 80%).
- Gdy ma odpowiedzieć źle, losuje jeden z trzech błędów: puste pole, inne zapisane tłumaczenie albo wiarygodną literówkę.
- Zapisuje nowo poznane tłumaczenia w `SavedWords.json`.
- Odpowiada, aż strona zakończy sesję — nie ma już limitu liczby odpowiedzi.
- Sam zamyka Chrome i zapisuje słówka po zakończeniu.

## 🧠 Humanizacja pisania

- Każda litera ma osobne, losowe opóźnienie (`delays.type_min` / `type_max`).
- Bot robi czasem krótką pauzę w trakcie pisania (`type_pause_chance`, `type_pause_min`, `type_pause_max`).
- Z szansą `typo_chance` naciska zły, sąsiedni klawisz, kasuje go backspace'em i wpisuje poprawną literę.
- Wartość pola jest zawsze weryfikowana, więc symulowana literówka nie psuje odpowiedzi.
- Kliknięcia nawigacyjne (kontynuuj sesję, rozpocznij) mają krótkie pauzy (`quick_click_min` / `quick_click_max`).
- Logowanie to wyjątek: dane są wpisywane szybko i dokładnie, a odrzucony formularz jest ponawiany tylko raz.

## 🛠️ Konfiguracja

Wzór wszystkich opcji: [`config/Config.defaults.json`](config/Config.defaults.json). Desktop pokazuje najważniejsze z nich w GUI, ale pełny plik można edytować ręcznie.

- `credentials` — dane logowania do InstaLing
  - `login` — login lub e-mail
  - `password` — hasło
- `sites` — używane strony
  - `login` — strona logowania; musi wskazywać oficjalną stronę logowania `instaling.pl` po HTTPS (bot odmówi startu dla innego adresu)
- `language` — język interfejsu desktopowego: `pl` (domyślnie) lub `en`; można go też zmienić przyciskami **PL/EN** na pasku menu. Logi silnika bota pozostają po polsku.
- `notifications.session_finished` — powiadomienie o zakończeniu sesji, gdy okno jest ukryte lub zminimalizowane (`true` domyślnie)
- `INSTALING_LOGIN` / `INSTALING_PASSWORD` — zmienne środowiskowe z danymi logowania; mają pierwszeństwo przed `credentials` w `Config.json`. Przydatne w CI i na serwerach, gdzie hasło nie powinno trafiać na dysk.
- `delays` — czasy oczekiwania w milisekundach (1 s = 1000 ms); bot losuje wartość między min i max
  - `click_min` / `click_max` — domyślne opóźnienie po kliknięciu w przycisk
  - `nav_min` / `nav_max` — pauza przed przejściem dalej (następne słówko, logowanie, start/kontynuacja sesji); działa też po przeładowaniu strony
  - `type_min` / `type_max` — opóźnienie na pojedynczą literę
  - `type_pause_chance` — szansa na dodatkową pauzę w trakcie pisania (`0.12` = 12%)
  - `type_pause_min` / `type_pause_max` — długość takiej pauzy
  - `typo_chance` — szansa na symulowaną literówkę z backspace (`0.15` = 15%)
  - `quick_click_min` / `quick_click_max` — krótka pauza po kliknięciach nawigacyjnych
  - `selector` — oczekiwanie na element na stronie (zwiększ, jeśli masz wolne łącze)
  - `check_min` / `check_max` — oczekiwanie na sprawdzenie odpowiedzi (wewnętrzny fallback)
  - `next_word_min` / `next_word_max` — oczekiwanie między słówkami (wewnętrzny fallback)
- `valid_chance` — jaka część odpowiedzi ma być poprawna (`1` = 100%, `0.8` = 80%); przy nieudanej próbie bot losuje jeden z trzech błędów: puste pole, inne zapisane tłumaczenie (fallback: literówka) lub literówkę
- `show_browser` — pokazuje okno Chrome; ustaw `false` na serwerze bez GUI
- `mute_audio` — wycisza dźwięk przeglądarki
- `window_width` / `window_height` — rozmiar okna Chrome
- `debug` — dodatkowe logi z przeglądarki i zrzuty stron
- `reminder` — przypomnienie o codziennej sesji (desktop i CLI)
  - `enabled` — `true` / `false`
  - `time` — godzina w formacie `HH:MM`, domyślnie `17:00` (czas lokalny)
  - `repeat_minutes` — powtarzaj przypomnienie co N minut do wykonania sesji (`0` = raz dziennie, maks. `1440`)
- `background` — tylko desktop
  - `run_in_tray` — zamknięcie okna chowa aplikację do zasobnika zamiast ją zamykać
  - `start_at_login` — uruchamiaj aplikację przy logowaniu systemu

Domyślne opóźnienie po kliknięciu to teraz `2000`–`4500` ms.


## 🆘 Rozwiązywanie problemów

Problemy są podzielone na **aplikację desktopową**, **mobile** i **CLI**. Okno błędu w aplikacji linkuje bezpośrednio do tej sekcji — nie otwiera już osobnego FAQ na stronie.

### 🖥️ Desktop

- **📡 Brak internetu** — sprawdź połączenie z internetem i naciśnij **Start** ponownie. Okno zamyka się tylko przyciskiem **Zamknij**.
- **Brak przeglądarki Chrome w instalatorze** — zainstaluj aplikację ponownie z oficjalnego wydania.
- **Bot nie przechodzi logowania** — sprawdź login i hasło w aplikacji. Bot wpisuje dane dokładnie i ponawia próbę raz, jeśli strona chwilowo odrzuci formularz.
- **Chcę zobaczyć, co robi bot** — włącz **Pokaż okno Chrome** i **Logi debug**, a potem zajrzyj do `pages/` i `screenshots/` w folderze danych.
- **Antywirus / SmartScreen ostrzega** — instalatory są niepodpisane; to oczekiwane. Kod źródłowy jest publiczny.
- **Za dużo RAM w tle** — włącz tryb zasobnika; zamknięcie okna zwalnia proces renderowania i zostaje lekki proces główny z ikoną.

### 📱 Mobile

- **APK się nie instaluje** — zezwól na instalację z nieznanych źródeł dla przeglądarki lub menedżera plików, którym otwierasz plik. APK jest podpisany kluczem deweloperskim, nie przez Play Store.
- **„Nie znalazłem przycisku startu sesji"** — zaloguj się w oknie aplikacji i otwórz stronę nauki, zanim naciśniesz **Start**. Bot nie loguje się za Ciebie na telefonie.
- **Sesja zatrzymuje się po zablokowaniu telefonu** — to normalne. WebView jest wstrzymywany w tle — bot nie działa w tle na telefonie. Zostaw aplikację na pierwszym planie na czas sesji (przypomnienie i tak dotrze).
- **Brak powiadomień na Androidzie 13+** — włącz uprawnienie powiadomień w ustawieniach aplikacji i ponownie dotknij ⏰.
- **IPA nie instaluje się w SideStore/AltStore** — plik jest niepodpisany; podpisz go własnym Apple ID. Darmowe konto wymaga odświeżenia po 7 dniach.
- **Userscript nie widzi strony** — sprawdź, czy rozszerzenie Userscripts/Tampermonkey ma zgodę dla `instaling.pl` i czy skrypt jest włączony dla tej domeny.
- **Chrome na Androidzie nie uruchamia userscriptu** — to ograniczenie Chrome; użyj APK albo Firefoksa z Tampermonkey.

### ⌨️ CLI

- **Bot zatrzymuje się na logowaniu** — sprawdź login i hasło w `config/Config.json`. Nakładkę cookies bot zamyka sam; przy problemach uruchom z `"show_browser": true` i sprawdź `screenshots/answer-error.png`.
- **`Could not find the "start session" button`** — strona mogła zmienić układ. Włącz `"debug": true` i sprawdź `pages/answer-start-failed.html`.
- **Brak Chrome** — uruchom `npx puppeteer browsers install chrome`.
- **`instaling-bot: command not found`** — dodaj `~/.local/bin` do `PATH` albo uruchom `node ~/.local/share/instaling-bot/bin/instaling-bot.js help`.
- **CLI odmawia startu z powodu aktualizacji** — pobierz nową wersję instalatorem `curl` lub uruchom `instaling-bot start --skip-update-check`, jeśli świadomie zostajesz na starszej wersji.
- **Brak statystyk** — `stats.json` powstaje po pierwszej sesji z co najmniej jedną odpowiedzią. Sprawdź `instaling-bot stats --json`.
- Po każdej próbie bot zapisuje zrzuty strony w `pages/` i `screenshots/`.


## 🧱 Budowanie ze źródeł

```bash
npm install
npm run desktop          # uruchamia aplikację Electron
npm run check            # składnia wszystkich plików
npm run dist:win         # Windows .exe (NSIS)
npm run dist:mac         # macOS .pkg (tylko na macOS)
npm run build:mobile     # userscript + zasoby core.js dla APK/IPA
```

Przed pakowaniem `npm run dist:win` / `dist:mac` automatycznie uruchamia `npm run prepare:browser`, które kopiuje Chrome for Testing do `resources/browser/` i tworzy manifest.

Instalator macOS musi być zbudowany na macOS. Repozytorium zawiera workflow GitHub Actions (`.github/workflows/release.yml`), który buduje Windows `.exe`, macOS `.pkg`, APK, IPA i userscript.

**Mobile ze źródeł:**

```bash
npm install
npm run build:mobile
cd mobile/android && ./gradlew :app:assembleDebug     # APK debug
cd mobile/ios && xcodegen generate                     # projekt Xcode (wymaga XcodeGen)
```

APK release buduje `./gradlew :app:assembleRelease`; bez sekretów `ANDROID_KEYSTORE_*` używa klucza debugowego, więc plik da się zainstalować. IPA wymaga macOS z pełnym Xcode i jest budowana bez podpisu w CI. Szczegóły architektury: [`MOBILE_PLAN.md`](MOBILE_PLAN.md).


## 📦 Ostatnie zmiany

### 4.2.2 — 2026-10-28

- ⏱️ **Naprawione tempo klikania przycisków na telefonie.** Pauza `nav_min` / `nav_max` była liczona tylko w obrębie jednej strony, więc gdy instaling.pl przeładował stronę przy „dalej" / „kontynuuj" / starcie sesji, opóźnienie znikało i przejście między słówkami było zawsze tak szybkie jak wczytanie strony. Silnik zapisuje teraz termin pauzy przed kliknięciem (`navUntil`) i dolicza resztę na świeżej stronie, więc przejście naprawdę czeka `nav_min`–`nav_max`. Dwa nowe testy pilnują tego zachowania.
- 🖥️ **Desktop też czeka przy starcie i kontynuacji sesji.** `nav_min` / `nav_max` sterują teraz nie tylko „dalej", ale i przyciskami startu / kontynuacji / nowej sesji (wspólny helper `navDelays()`).
- 🔢 **Porządki.** Wersja podniesiona do `4.2.2` (userscript `4.2.3`) w `package.json`, projekcie iOS (`MARKETING_VERSION` 4.2.2 / `CURRENT_PROJECT_VERSION` 40202), interfejsie desktopu, stronie, README (PL/EN), wiki, `docs/llms.txt`, `PROJECT_NOTES.md` i notatkach wydania.

### 4.2.1 — 2026-10-28

- 📊 **Statystyki na każdej platformie.** Android, iOS i userscript mają teraz ten sam panel co desktop: zakładki tydzień / miesiąc / rok / wszystko z sesjami, odpowiedziami, skutecznością, nowymi słówkami, łącznym czasem i aktywnymi dniami. Silnik mobilny zapisuje sesje i czas trwania tak samo jak desktop.
- ♻️ **Przywróć domyślne.** Desktop, Android, iOS i userscript mają przycisk resetujący wszystkie ustawienia poza loginem, hasłem i językiem.
- ⏱️ **Szybkość klikania przycisków.** Jedno wspólne ustawienie `nav_min` / `nav_max` (domyślnie 2000/4500 ms) steruje tempem klikania „dalej", logowania i startu sesji — na desktopie i telefonie.
- ⏰ **Przypomnienia jak na desktopie.** Częstotliwość wybierasz z listy (raz dziennie, co 15/30/60/120/180 min) także na Androidzie i iOS — koniec z wpisywaniem minut. Godzina przypomnienia jest wyrównana do lewej na iOS i w userscripcie.
- 🐛 **Panel userscriptu na Safari.** Wysokość panelu opiera się na `100dvh` (z zapasem `100vh`) i ma `overscroll-behavior: contain`, więc nie wychodzi poza ekran i nie przewija strony pod spodem.
- 🐛 **Porządki.** Userscript to teraz `4.2.2` (aplikacja pozostaje `4.2.1`), wersjonowanie podniesione w `package.json`, projekcie iOS (`MARKETING_VERSION` 4.2.1 / `CURRENT_PROJECT_VERSION` 40201), interfejsie desktopu, stronie, README (PL/EN), wiki, `docs/llms.txt`, `PROJECT_NOTES.md` i notatkach wydania.

### 4.2.0 — 2026-10-27

- ⌨️ **Pełne tempo pisania na telefonie i w userscripcie.** Android, iOS i userscript mają teraz wszystkie desktopowe opóźnienia i szanse: `click_min` / `click_max`, `type_min` / `type_max`, `typo_chance` i `type_pause_chance`, obok poprawności odpowiedzi (`valid_chance`).
- 🧹 **Bez limitu odpowiedzi.** Opcja `max_answers` została usunięta wszędzie; uruchomienie po prostu podąża za stroną do końca sesji, a wskazówki „ustaw 1, żeby przetestować" zniknęły z dokumentacji.
- 🔔 **Powtarzalne przypomnienia mobilne.** Natywne przypomnienia na Androidzie i iOS powtarzają się co N minut jak w desktopie i przestają przychodzić, gdy dzisiejsza sesja jest ukończona.
- 🌐 **Userscript bez powiadomień w tle.** Zamiast powiadomień przeglądarki skrypt pokazuje mały baner na stronie, gdy otworzysz kartę po godzinie przypomnienia i dzisiejsza sesja nie jest ukończona; prawdziwe powiadomienia zostają aplikacjom mobilnym i systemowi.
- 🎨 **Jednolity wygląd.** Okno desktopu, panel userscriptu i strona projektu dzielą jeden klasyczny styl: jasnoszary, Tahoma / MS Sans Serif, kwadratowe beleczki i granatowy pasek tytułu.
- 🏠 **Strona projektu.** Nowy główny przycisk „Pobierz dla <twojego systemu>" pobiera zalecany build i przewija do pasującej instrukcji, obok jest „Pobierz dla innego systemu"; karty pokazują tylko system i minimalną wersję, architekturę oraz format, doszła sekcja **O bocie** (czym jest, jak działa i jak wykrywalny), dokumentacja CLI ograniczyła się do `--help` i linku do GitHuba, a odznaki odzwierciedlają Androida, iOS, userscript, PL/EN, statystyki, przypomnienia, ustawienia i wykrywanie urządzeń.
- 📅 **Trwalsze przypomnienia Androida.** APK śledzi `dateKey` / `last_session_date` i planuje powtarzalne przypomnienia; powłoka iOS odbudowuje ograniczoną partię powiadomień jednorazowych.
- 🐛 **Porządki.** Naprawiono alert CodeQL `java/unused-parameter` w powłoce Androida; wersję podbito w `package.json`, projekcie iOS (xcodegen: `MARKETING_VERSION` 4.2.0, `CURRENT_PROJECT_VERSION` 40200), domyślnych ustawieniach silnika, interfejsie desktopu, stronie, README, wiki, `docs/llms.txt`, `PROJECT_NOTES.md` i notatkach wydania.

### 4.1.0 — 2026-10-27

- 🏷️ **Spójne oznaczenia pobierania.** Każda opcja na stronie podaje system i minimalną wersję, architekturę oraz format pliku. Strona **sama wykrywa urządzenie** (Windows, macOS ARM64/Intel, Android, iPhone, iPad, Linux) i podświetla zalecaną wersję; pozostałe zostają dostępne, a wybór można zmienić ręcznie.
- ⚙️ **Ustawienia na telefonie.** Android i iOS mają panel ustawień: poprawność odpowiedzi, limit odpowiedzi i **konfigurowalna godzina przypomnienia**. Wartości zapisują się i działają od razu.
- 📊 **Statystyki mobilne.** APK, IPA i userscript pokazują dzisiejsze odpowiedzi, skuteczność i serię dni — jak desktop.
- 🌐 **Ustawienia userscriptu.** Panel z poprawnością, limitem i autostartem, zapisywany trwale; popup jest wyśrodkowany i nie wychodzi poza wąski ekran.
- 🎨 **Jedna ikona.** Desktop, APK, IPA, userscript i strona używają tego samego znaku (generowanego z `build/icon.png`).
- 🔐 **Sesja bez haseł.** Aplikacje mobilne nadal nie zapisują danych logowania; Android utrwala ciasteczka sesji, żeby po powrocie nie trzeba było logować się ponownie.
- 🕵️ **Mniej rozpoznawalna powłoka.** Usunięto niestandardowy fragment User-Agenta z APK; to best-effort, nie gwarancja pełnej anonimowości.
- ❓ **FAQ.** Dodano wyjaśnienie okna Premium na desktopie i wspólną terminologię ustawień.

### 4.0.0 — 2026-10-27

- 📱 **Android APK.** Natywna powłoka WebView z paskiem Start/Stop, przełącznikiem PL/EN, licznikiem odpowiedzi, przypomnieniem o 17:00 i przyciskiem aktualizacji. Obsługuje `instalingbot://start` i `instalingbot://stop` dla Taskera/MacroDroida.
- 🍏 **iOS IPA.** Niepodpisana aplikacja dla SideStore/AltStore z tym samym silnikiem, przypomnieniem i schematem URL dla Skrótów. Najprostsza droga na iPhone'a to userscript w Safari.
- 🌐 **Userscript 4.0.** Wspólny silnik w pływającym panelu dla Safari iOS/iPadOS oraz Firefoksa na Androidzie, z `?autostart=1`, `?lang=en` i automatyczną aktualizacją.
- 🧠 **Wspólny silnik mobilny.** Odpowiedzi, literówki, zapisywanie słówek i statystyki sesji działają tak samo jak w desktopie; sesja przeżywa pełne przeładowanie strony instaling.pl.
- 🔔 **Natywne przypomnienia.** Codzienne powiadomienie o 17:00 w APK i IPA, z zachowaniem po restarcie Androida i obsługą uprawnień Android 13+.
- 🔐 **Bez haseł na telefonie.** Aplikacje mobilne korzystają z normalnej sesji strony w WebView; nie zapisują danych logowania.
- 📚 **Dokumentacja.** README (PL/EN), strona projektu, wiki, `PROJECT_NOTES.md`, `CHANGELOG.md` i plan mobilny `MOBILE_PLAN.md`.

Pełna historia: [CHANGELOG.md](CHANGELOG.md).


## 💬 Społeczność i wsparcie

- 👋 **[Zacznij tutaj](https://github.com/bmonekkk/instaling-bot/discussions/1)** — wątek powitalny z linkami do wszystkiego.
- 💬 **[Dyskusje](https://github.com/bmonekkk/instaling-bot/discussions)** — pytania (Q&A), pomysły (Ideas), pokaż swój setup (Show and tell) i ankiety.
- 🐛 **[Issues](https://github.com/bmonekkk/instaling-bot/issues)** — powtarzalne błędy. Użyj szablonu i usuń dane prywatne z logów.
- 📚 **[Wiki](https://github.com/bmonekkk/instaling-bot/wiki)** — instalacja, CLI, konfiguracja, problemy i FAQ.
- 🤝 **[Contributing](CONTRIBUTING.md)** — jak pomóc, zgłosić zmianę i uruchomić projekt lokalnie.
- 📜 **[Code of Conduct](CODE_OF_CONDUCT.md)** — zasady życzliwej społeczności.
- 🔐 **[Security](SECURITY.md)** — prywatne zgłaszanie luk. Nie otwieraj publicznego issue.
- 🆘 **[Support](SUPPORT.md)** — gdzie szukać pomocy i czego oczekiwać.

**Zanim zapytasz:** sprawdź FAQ, zaktualizuj do najnowszej wersji i wyszukaj istniejące wątki.
Nigdy nie publikuj haseł, ciasteczek, tokenów, `Config.json` ani logów z danymi osobowymi.

Projekt rozwijam hobbystycznie — odpowiedzi są best-effort. Bezpieczeństwo ma priorytet,
potem powtarzalne błędy, a na końcu pomysły i kosmetyka.


## ⚠️ Disclaimer / Zastrzeżenia

Projekt ma charakter **edukacyjny** — powstał jako ćwiczenie z automatyzacji przeglądarki (Puppeteer), obsługi cookies, selektorów i logiki aplikacji webowej. **Nie jest przeznaczony do oszukiwania w nauce** ani do obchodzenia zasad szkoły czy nauczyciela. Używaj go odpowiedzialnie, najlepiej do nauki i testowania własnych umiejętności.

- Projekt **nie jest powiązany** z InstaLing / instaling.pl ani z jego właścicielami.
- Automatyczne korzystanie z serwisu może naruszać jego regulamin. Za sposób użycia odpowiada wyłącznie użytkownik.
- Oprogramowanie jest dostarczane **bez żadnej gwarancji** ("AS IS"), zgodnie z licencją ISC.
- Nie udostępniaj swoich danych logowania innym osobom. Pliki `Config.json` i `SavedWords.json` są ignorowane przez git.

This project is for **educational purposes** only (browser automation practice). It is **not affiliated with InstaLing** and is **not intended to cheat** in language learning. Use it responsibly and at your own risk; automated use may violate the service's terms.


## 📜 Licencja

ISC — zobacz plik [LICENSE](LICENSE). Projekt jest kontynuacją [PanSzelescik/instaling-bot](https://github.com/PanSzelescik/instaling-bot).


## 🧑‍💻 Dla deweloperów

Architektura desktopu, ścieżki danych, proces budowania i lista rzeczy, których nie wolno
zepsuć: [PROJECT_NOTES.md](PROJECT_NOTES.md).

Zanim otworzysz pull request, przeczytaj **[CONTRIBUTING.md](CONTRIBUTING.md)** i uruchom
`npm run check`, `npm test`, `git diff --check` oraz smoke test CLI. `master` jest chroniony,
a zmiany przechodzą przez CI (składnia, testy jednostkowe, biała spacja, `install.sh`, CLI)
i CodeQL.

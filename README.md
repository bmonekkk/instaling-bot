# instaling-bot 🤖

Bot do automatycznego rozwiązywania słówek na [instaling.pl](https://instaling.pl) — teraz także jako **aplikacja desktopowa dla Windows i macOS**.

**Strona projektu:** https://bmonekkk.github.io/instaling-bot/
**Najnowsza wersja:** https://github.com/bmonekkk/instaling-bot/releases/latest

Aktualna wersja (**3.1.1**) łączy trzy rzeczy:

- aplikację desktopową z GUI, logiem na żywo i wbudowaną przeglądarką Chrome,
- nadal w pełni działającą wersję CLI (`npm start`) dla Linuksa i terminala,
- humanizację pisania: losowe opóźnienia, mikro-pauzy, literówki poprawiane backspace'em i trzy rodzaje celowych błędów.

W 3.1.1 doszły też: natywna ikona w menu bar macOS (monochromatyczna, dopasowana do motywu), ukrywanie aplikacji z Docka w trybie zasobnika, powiadomienie o zakończeniu sesji uruchomionej z ikony, okno pomocy przy błędzie lub braku internetu oraz dużo lżejsza praca w tle (okno jest niszczone po zamknięciu).

Open source, licencja ISC.


## 💙 Wesprzyj rozwój projektu

Instaling Bot to niezależny projekt open source rozwijany hobbystycznie. Jeśli uważasz go za przydatny i chcesz wesprzeć mój czas poświęcony na rozwój, testowanie i utrzymanie kodu, możesz postawić mi wirtualną kawę.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H5P529J2VO)

Wsparcie jest całkowicie dobrowolne i nie jest wymagane do korzystania z projektu. Projekt nie jest oficjalnie powiązany z InstaLing. Wpłaty nie gwarantują konkretnych funkcji ani terminów aktualizacji.


## ✨ Dwie wersje, jeden silnik

| | Desktop | CLI |
|---|---|---|
| Systemy | Windows 10/11, macOS 13+ | Linux, macOS, Windows |
| Wymaga Node.js | **Nie** | Tak, Node.js 22+ |
| Interfejs | Okno aplikacji, ustawienia, live log | Terminal |
| Przeglądarka | Chrome for Testing dołączony do instalatora | Pobierany przez Puppeteer |
| Dane | `%APPDATA%\instaling-bot` lub `~/Library/Application Support/instaling-bot` | `config/` w katalogu projektu |
| Przypomnienia | powiadomienie systemowe + toast w aplikacji | `npm run remind` w tle |
| Aktualizacje | sprawdzanie wydań + przycisk **Pobierz** | `npm run update-check` i komunikat przy starcie |
| Aktualizacja | nowy instalator z GitHuba | `git pull && npm install --omit=dev` |

Oba warianty korzystają z tego samego silnika (`src/`), tych samych opcji i formatu `SavedWords.json`.


## 🖥️ Desktop: Windows i macOS

Pobierz instalator z [najnowszego wydania](https://github.com/bmonekkk/instaling-bot/releases/latest):

- **Windows:** `instaling-bot-3.1.1-setup.exe` (NSIS, x64)
- **macOS Apple Silicon:** `instaling-bot-3.1.1-arm64.pkg`
- **macOS Intel:** `instaling-bot-3.1.1-x64.pkg`

Instalator desktopowy zawiera własną przeglądarkę Chrome for Testing. Nie trzeba instalować Node.js ani Chrome.

### Instalacja i pierwsze uruchomienie

1. Uruchom instalator.
2. Otwórz **instaling-bot**.
3. Wpisz login i hasło do InstaLing.
4. Ustaw poprawność odpowiedzi (`80%` domyślnie) i limit odpowiedzi (`0` = bez limitu).
5. Naciśnij **Start**.

Bot otworzy osobne okno Chrome, zaloguje się, rozpocznie lub kontynuuje sesję i będzie odpowiadał na słówka. Postęp, licznik odpowiedzi i błędy widać w konsoli aplikacji.

### Przypomnienie o codziennej sesji

W ustawieniach włącz **Przypominaj o codziennej sesji** i wybierz godzinę (domyślnie `17:00`). Gdy aplikacja działa — również ukryta w zasobniku — o wybranej porze pojawi się powiadomienie systemowe i toast w oknie. Przypomnienie jest pomijane, jeśli danego dnia bot zdążył już odpowiedzieć na co najmniej jedno słówko.

Opcjonalnie możesz włączyć **Działaj w zasobniku po zamknięciu okna** (okno chowa się zamiast zamykać) oraz **Uruchamiaj przy logowaniu systemu**. Bez tych opcji aplikacja musi być po prostu otwarta.

### 🚀 Autostart i praca w tle

Oba przełączniki są w **Ustawienia → Przypomnienia i praca w tle**:

| Autostart | Tryb zasobnika | Co się dzieje po logowaniu |
|---|---|---|
| ✅ | ❌ | Otwiera się normalne okno aplikacji |
| ✅ | ✅ | Brak okna — tylko ikona w zasobniku (Windows) / menu bar (macOS) |
| ❌ | ✅ | Normalne okno przy ręcznym starcie; zamknięcie chowa do zasobnika |

- Autostart działa w zainstalowanej aplikacji (nie w trybie CLI) i jest **domyślnie wyłączony**.
- Aby aplikacja startowała po cichu, włącz **oba** przełączniki. Sam autostart otworzy okno na pulpicie.
- Na macOS tryb zasobnika chowa ikonę z Docka i przełącza aplikację w tryb akcesoriów — zostaje tylko ikona w menu bar, która dopasowuje się do jasnego/ciemnego motywu.
- Po zamknięciu okna w trybie zasobnika aplikacja niszczy okno (a nie tylko je ukrywa), żeby w tle zużywać mniej RAM. Interfejs odtworzy się po kliknięciu ikony.
- Sesję możesz uruchomić z menu ikony (**Start**). Gdy się skończy, dostaniesz powiadomienie systemowe z liczbą odpowiedzi — okno nie musi być otwarte.
- Ikona w zasobniku daje też **Stop**, **Pokaż okno** i **Zakończ**.

### Aktualizacje

Aplikacja sprawdza [najnowsze wydanie na GitHubie](https://github.com/bmonekkk/instaling-bot/releases/latest) przy starcie i co kilka godzin. Gdy pojawi się nowsza wersja, u góry okna wyświetli się banner z przyciskiem **Pobierz**, który otwiera stronę wydania. Instalatory są niepodpisane, więc aktualizacja polega na pobraniu i uruchomieniu nowego instalatora — aplikacja nie pobiera ani nie instaluje niczego samodzielnie. Sprawdzenie można też wywołać ręcznie przyciskiem **Sprawdź aktualizacje** w konsoli.

### Instalatory są niepodpisane

Na razie nie ma certyfikatu code signing, więc system może ostrzec przy pierwszym uruchomieniu:

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

To normalne dla niepodpisanych buildów. Późniejsze wersje mogą dostać podpis, jeśli pojawi się certyfikat.

### 📡 Offline i błędy

Gdy aplikacja nie widzi internetu, pokazuje okno z wyjaśnieniem i dwoma skrótami: **FAQ na stronie** oraz **README**. To samo okno pojawia się przy błędzie bota (np. zmiana układu strony, odrzucone logowanie) — z linkiem do sekcji pomocy, żeby nie trzeba było szukać jej ręcznie.

### Gdzie aplikacja trzyma dane?

Przycisk **Folder danych** w aplikacji otwiera właściwy katalog:

- Windows: `%APPDATA%\instaling-bot`
- macOS: `~/Library/Application Support/instaling-bot`

W środku znajdują się:

```
config/Config.json        ustawienia i dane logowania
config/SavedWords.json    zapamiętane tłumaczenia
pages/                    diagnostyczne zrzuty HTML
screenshots/              diagnostyczne zrzuty ekranu
logs/last-run.log         pełny log ostatniego uruchomienia
```

Pliki można edytować także ręcznie — aplikacja używa tego samego formatu co CLI.


## ⌨️ CLI: Linux i terminal

Wersja CLI pozostaje wspierana tak długo, jak istnieje wersja desktopowa. To zalecany wariant dla Linuksa i wszystkich osób, które wolą terminal.

### Instalacja

1. Zainstaluj Node.js 22 lub nowszy: https://nodejs.org/
2. Sklonuj repozytorium:

```bash
git clone https://github.com/bmonekkk/instaling-bot.git
cd instaling-bot
```

3. Zainstaluj zależności (wersja CLI nie potrzebuje Electrona):

```bash
npm install --omit=dev
```

4. Skopiuj szablon konfiguracji i uzupełnij dane logowania:

```bash
cp config/Config.defaults.json config/Config.json
```

```json
"credentials": {
    "login": "twoj-login-lub-email",
    "password": "twoje-haslo"
}
```

5. Uruchom bota:

```bash
npm start
```

Pliki `config/Config.json` i `config/SavedWords.json` są ignorowane przez git, więc dane logowania i słówka nie trafią do repozytorium.

### Przypomnienie w CLI

Ta sama sekcja `reminder` w `Config.json` steruje przypomnieniem w CLI. Aby otrzymywać powiadomienie o codziennej sesji, zostaw w tle:

```bash
npm run remind
```

Proces sprawdza co minutę, czy minęła wybrana godzina i czy dzisiejsza sesja nie została jeszcze odhaczona. Powiadomienie wysyła się najwyżej raz dziennie; stan trafia do `reminder-state.json` w katalogu projektu i jest wspólny z `npm start`. Zatrzymanie: `Ctrl+C`.

### Sprawdzanie aktualizacji w CLI

```bash
npm run update-check   # porównuje lokalną wersję z najnowszym wydaniem na GitHubie
```

`npm start` dodatkowo wypisuje na starcie krótką informację, gdy dostępna jest nowsza wersja. Aktualizacja to `git pull && npm install --omit=dev`.

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
  - `login` — strona logowania
- `delays` — czasy oczekiwania w milisekundach (1 s = 1000 ms); bot losuje wartość między min i max
  - `click_min` / `click_max` — domyślne opóźnienie po kliknięciu w przycisk
  - `type_min` / `type_max` — opóźnienie na pojedynczą literę
  - `type_pause_chance` — szansa na dodatkową pauzę w trakcie pisania (`0.12` = 12%)
  - `type_pause_min` / `type_pause_max` — długość takiej pauzy
  - `typo_chance` — szansa na symulowaną literówkę z backspace (`0.15` = 15%)
  - `quick_click_min` / `quick_click_max` — krótka pauza po kliknięciach nawigacyjnych
  - `selector` — oczekiwanie na element na stronie (zwiększ, jeśli masz wolne łącze)
  - `check_min` / `check_max` — oczekiwanie na sprawdzenie odpowiedzi
  - `next_word_min` / `next_word_max` — oczekiwanie między słówkami
- `valid_chance` — jaka część odpowiedzi ma być poprawna (`1` = 100%, `0.8` = 80%); przy nieudanej próbie bot losuje jeden z trzech błędów: puste pole, inne zapisane tłumaczenie (fallback: literówka) lub literówkę
- `max_answers` — maksymalna liczba odpowiedzi w jednym uruchomieniu (`0` = bez limitu, przydatne do testów)
- `show_browser` — pokazuje okno Chrome; ustaw `false` na serwerze bez GUI
- `mute_audio` — wycisza dźwięk przeglądarki
- `window_width` / `window_height` — rozmiar okna Chrome
- `debug` — dodatkowe logi z przeglądarki i zrzuty stron
- `reminder` — przypomnienie o codziennej sesji (desktop i CLI)
  - `enabled` — `true` / `false`
  - `time` — godzina w formacie `HH:MM`, domyślnie `17:00` (czas lokalny)
- `background` — tylko desktop
  - `run_in_tray` — zamknięcie okna chowa aplikację do zasobnika zamiast ją zamykać
  - `start_at_login` — uruchamiaj aplikację przy logowaniu systemu

Domyślne opóźnienie po kliknięciu to teraz `2000`–`4500` ms.


## 🆘 Rozwiązywanie problemów

### Desktop

- **📡 Brak internetu** — aplikacja pokaże okno z linkiem do FAQ. Sprawdź sieć i naciśnij **Start** ponownie.
- **Brak przeglądarki Chrome w instalatorze** — zainstaluj aplikację ponownie z oficjalnego wydania.
- **Bot nie przechodzi logowania** — sprawdź login i hasło w aplikacji. Bot wpisuje dane dokładnie i ponawia próbę raz, jeśli strona chwilowo odrzuci formularz.
- **Chcę zobaczyć, co robi bot** — włącz **Pokaż okno Chrome** i **Logi debug**, a potem zajrzyj do `pages/` i `screenshots/` w folderze danych.
- **Antywirus / SmartScreen ostrzega** — instalatory są niepodpisane; to oczekiwane. Kod źródłowy jest publiczny.
- **Za dużo RAM w tle** — włącz tryb zasobnika; zamknięcie okna zwalnia proces renderowania i zostaje lekki proces główny z ikoną.

### CLI

- **Bot zatrzymuje się na logowaniu** — sprawdź login i hasło. Nakładkę cookies bot zamyka sam; przy problemach uruchom z `"show_browser": true` i sprawdź `screenshots/answer-error.png`.
- **`Could not find the "start session" button`** — strona mogła zmienić układ. Włącz `"debug": true` i sprawdź `pages/answer-start-failed.html`.
- **Brak Chrome** — uruchom `npx puppeteer browsers install chrome`.
- Po każdej próbie bot zapisuje zrzuty strony w `pages/` i `screenshots/`.


## 🧱 Budowanie ze źródeł

```bash
npm install
npm run desktop          # uruchamia aplikację Electron
npm run check            # składnia wszystkich plików
npm run dist:win         # Windows .exe (NSIS)
npm run dist:mac         # macOS .pkg (tylko na macOS)
```

Przed pakowaniem `npm run dist:win` / `dist:mac` automatycznie uruchamia `npm run prepare:browser`, które kopiuje Chrome for Testing do `resources/browser/` i tworzy manifest.

Instalator macOS musi być zbudowany na macOS. Repozytorium zawiera workflow GitHub Actions (`.github/workflows/release.yml`), który buduje Windows `.exe` oraz macOS `.pkg` dla Apple Silicon i Intel.


## 📦 Zmiany w wersji 3.1.1

- **Lżejszy tryb zasobnika.** Zamknięcie okna niszczy renderer, a nie tylko go ukrywa — w tle zostaje około **50 MB** przy starcie do zasobnika i poniżej 100 MB po otwarciu i zamknięciu okna. Okno i logi wracają po kliknięciu ikony.
- **Natywny menu bar macOS.** Monochromatyczna ikona dopasowuje się do motywu; po zamknięciu okna aplikacja znika z Docka i działa tylko z menu bar.
- **Powiadomienie o końcu sesji** uruchomionej z ikony (na każdym systemie), z liczbą odpowiedzi lub treścią błędu. Kliknięcie otwiera aplikację.
- **Okno pomocy** przy braku internetu i błędzie bota, z linkami do FAQ i README.
- **Ko-fi nad formularzem logowania**, żeby wsparcie było widoczne od razu.
- **Dokumentacja autostartu** w README i w ustawieniach aplikacji — po cichy start wymaga obu przełączników.

## Zmiany w wersji 3.1.0

- Błędne odpowiedzi są losowane równo między trzy typy: puste pole, inne zapisane tłumaczenie i literówka. `valid_chance` nadal decyduje, jak często bot odpowiada źle.
- Domyślna pauza po kliknięciu skrócona z 3500–6500 ms do **2000–4500 ms**.
- Przypomnienie o codziennej sesji: godzina konfigurowana w aplikacji (domyślnie 17:00), powiadomienie systemowe + toast, pomijane po wykonanej sesji. W CLI odpowiada za to `npm run remind`.
- Opcjonalna praca w zasobniku systemowym i uruchamianie przy logowaniu (desktop).
- Sprawdzanie nowych wydań na GitHubie w aplikacji i w CLI (`npm run update-check`); przycisk **Pobierz** otwiera stronę wydania.
- W aplikacji dodano informację o wsparciu przez Ko-fi oraz podpis autora (`bmonekkk`).
- Ujednolicono nazwę autora i adresy projektu w całym repozytorium oraz na stronie projektu.

## Zmiany w wersji 3.0.0

- Dodano aplikację desktopową Electron dla Windows i macOS.
- Dodano GUI: dane logowania, poprawność odpowiedzi, limit, humanizacja, Start/Stop, live log, liczniki i folder danych.
- Chrome for Testing jest dołączony do instalatora — desktop nie wymaga Node.js ani przeglądarki w systemie.
- Dodano instalator Windows `.exe` (NSIS) i macOS `.pkg` (arm64 + x64).
- Silnik, konfiguracja i `SavedWords.json` są wspólne dla desktopu i CLI.
- CLI pozostaje w pełni wspierane, ze wszystkimi poprawkami z 2.2.x.

Wcześniejsze zmiany: [CHANGELOG.md](CHANGELOG.md).


## Disclaimer / Zastrzeżenia

Projekt ma charakter **edukacyjny** — powstał jako ćwiczenie z automatyzacji przeglądarki (Puppeteer), obsługi cookies, selektorów i logiki aplikacji webowej. **Nie jest przeznaczony do oszukiwania w nauce** ani do obchodzenia zasad szkoły czy nauczyciela. Używaj go odpowiedzialnie, najlepiej do nauki i testowania własnych umiejętności.

- Projekt **nie jest powiązany** z InstaLing / instaling.pl ani z jego właścicielami.
- Automatyczne korzystanie z serwisu może naruszać jego regulamin. Za sposób użycia odpowiada wyłącznie użytkownik.
- Oprogramowanie jest dostarczane **bez żadnej gwarancji** ("AS IS"), zgodnie z licencją ISC.
- Nie udostępniaj swoich danych logowania innym osobom. Pliki `Config.json` i `SavedWords.json` są ignorowane przez git.

This project is for **educational purposes** only (browser automation practice). It is **not affiliated with InstaLing** and is **not intended to cheat** in language learning. Use it responsibly and at your own risk; automated use may violate the service's terms.


## Licencja

ISC — zobacz plik [LICENSE](LICENSE). Projekt jest kontynuacją [PanSzelescik/instaling-bot](https://github.com/PanSzelescik/instaling-bot).


## Dla deweloperów

Architektura desktopu, ścieżki danych, proces budowania i lista rzeczy, których nie wolno zepsuć: [PROJECT_NOTES.md](PROJECT_NOTES.md).

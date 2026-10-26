# instaling-bot

Bot dla automatycznego rozwiązywania słówek na [instaling.pl](https://instaling.pl).

**Strona projektu:** https://bmoneczek.github.io/instaling-bot/
**Najnowsza wersja:** https://github.com/Bmoneczek/instaling-bot/releases/latest

Działająca wersja (2.2.1): obsługa okna zgody na cookies, Puppeteer 25, Node.js 22+, aktualne selektory strony oraz ludzkie pisanie z literówkami i backspace. Open source, licencja ISC.

Wymaga **Node.js 22+** (testowane na Node 26) oraz przeglądarki instalowanej automatycznie przez Puppeteer.

# Instalacja

1. Pobierz i zainstaluj Node.js (22 lub nowszy): https://nodejs.org/
2. Sklonuj repozytorium:
   ```
   git clone https://github.com/Bmoneczek/instaling-bot.git
   ```
3. Wejdź do katalogu projektu i zainstaluj zależności:
   ```
   npm install
   ```
4. Skopiuj `config/Config.defaults.json` do `config/Config.json` i uzupełnij dane logowania:
   ```json
   "credentials": {
       "login": "twoj-login-lub-email",
       "password": "twoje-haslo"
   }
   ```
5. Uruchom:
   ```
   npm start
   ```

Pliki `config/Config.json` i `config/SavedWords.json` są ignorowane przez git, więc Twoje dane i słówka nie trafią do repozytorium.

# Sposób działania

- Logowanie za pomocą danych z `config/Config.json` (`credentials.login`, `credentials.password`).
- Automatyczne zamykanie okna zgody na cookies (Google Funding Choices), które zasłania formularz logowania.
- Uruchomienie nauki słówek.
- Udzielanie odpowiedzi na podane słówka:
  - Domyślnie 80% odpowiedzi jest poprawnych (`valid_chance: 0.8`). Możesz to zmienić w `config/Config.json` (`1` - `100%`, `0.9` - `90%`...).
  - Gdy bot ma odpowiedzieć źle, wpisuje wiarygodną literówkę zamiast zostawiać puste pole.
  - Słówko musi być dostępne w `config/SavedWords.json`.
  - Jeśli nie jest dostępne, bot zapisuje prawidłowe tłumaczenie, aby użyć go później.
- Gdy nauka się zakończy, **nie zamykaj okna przeglądarki** - bot sam je zamknie i zapisze poznane słówka.

# Humanizacja pisania

- Każda litera jest wpisywana z osobnym, losowym opóźnieniem (`delays.type_min` / `type_max`).
- Bot robi czasem krótką pauzę w trakcie pisania (`type_pause_chance`, `type_pause_min`, `type_pause_max`).
- Z szansą `typo_chance` bot naciska zły, sąsiedni klawisz, kasuje go backspace'em i wpisuje poprawną literę. Wartość pola jest zawsze weryfikowana, więc symulowana literówka nie psuje odpowiedzi.
- Kliknięcia nawigacyjne (kontynuuj sesję, rozpocznij) mają krótkie, losowe pauzy (`quick_click_min` / `quick_click_max`), więc nie czekają niepotrzebnie.
- Logowanie to wyjątek: dane są wpisywane szybko i dokładnie, a jeśli strona odrzuci formularz, bot ponawia próbę tylko raz.

# Objaśnienie configu

Wzór wszystkich opcji: [`config/Config.defaults.json`](config/Config.defaults.json).

- `credentials` - dane logowania do InstaLing
  - `login` - login lub e-mail
  - `password` - hasło
- `sites` - używane strony
  - `login` - strona, na której bot ma się zalogować
- `delays` - czasy oczekiwania w milisekundach (1 s = 1000 ms); bot losuje wartość między min i max
  - `click_min` / `click_max` - domyślne opóźnienie po kliknięciu w przycisk
  - `type_min` / `type_max` - opóźnienie na pojedynczą literę
  - `type_pause_chance` - szansa na dodatkową pauzę w trakcie pisania (`0.12` = 12%)
  - `type_pause_min` / `type_pause_max` - długość takiej pauzy
  - `typo_chance` - szansa na symulowaną literówkę z backspace (`0.15` = 15%)
  - `quick_click_min` / `quick_click_max` - krótka pauza po kliknięciach nawigacyjnych
  - `selector` - oczekiwanie na element na stronie (zwiększ, jeśli masz wolne łącze)
  - `check_min` / `check_max` - oczekiwanie na sprawdzenie odpowiedzi
  - `next_word_min` / `next_word_max` - oczekiwanie między słówkami
- `valid_chance` - jaka część odpowiedzi ma być poprawna (`1` - `100%`, `0.8` - `80%`...); przy nieudanej próbie bot wpisuje literówkę
- `max_answers` - maksymalna liczba odpowiedzi w jednym uruchomieniu (`0` = bez limitu, przydatne do testów)
- `show_browser` - pokazuje okno przeglądarki na żywo; ustaw `false` na serwerze bez GUI (np. Linux bez X)
- `mute_audio` - wycisza dźwięk przeglądarki
- `window_width` / `window_height` - rozmiar okna przeglądarki
- `debug` - dodatkowe logi z przeglądarki (przydatne przy zmianach na stronie)

# Rozwiązywanie problemów

- **Bot zatrzymuje się na logowaniu** - sprawdź login i hasło. Bot wpisuje dane dokładnie i ponawia próbę raz, jeśli strona chwilowo odrzuci formularz. Nakładkę cookies bot zamyka sam; jeśli nadal jest widoczna, uruchom z `"show_browser": true` i sprawdź `screenshots/answer-error.png`.
- **`Could not find the "start session" button`** - strona instaling.pl mogła zmienić układ. Włącz `"debug": true` i sprawdź `pages/answer-start-failed.html`.
- **Brak Chrome** - uruchom `npx puppeteer browsers install chrome`, jeśli `npm install` nie pobrał przeglądarki.
- Po każdej próbie bot zapisuje zrzuty strony w `pages/` i `screenshots/` - to najlepsze źródło informacji o błędzie.

# Zmiany w tej wersji (2.2.1)

- Poprawiono nazwę autora na **Bmoneczek** w konsoli, `package.json`, `LICENSE` i `NOTICE`. Oryginalny projekt, jego autor i link do upstreamu pozostają w atrybucji bez zmian.
- Dodano ludzkie pisanie: losowe opóźnienia na każdą literę, mikro-pauzy oraz symulowane literówki poprawiane backspace'em.
- Gdy `valid_chance` każe odpowiedzieć źle, bot wpisuje wiarygodną literówkę zamiast pustego pola.
- Logowanie jest szybkie i dokładne: dane są weryfikowane przed wysłaniem, a nieudany submit jest ponawiany tylko raz.
- Kliknięcia nawigacyjne (kontynuuj / rozpocznij sesję) mają krótkie pauzy i nie czekają na zbędne nawigacje.
- Nowe opcje w `delays`: `type_pause_chance`, `type_pause_min`, `type_pause_max`, `typo_chance`, `quick_click_min`, `quick_click_max`.
- Strona projektu została przeprojektowana w stylu retro Windows 95/98.

Wcześniejsze zmiany: [CHANGELOG.md](CHANGELOG.md).

# Disclaimer / Zastrzeżenia

Projekt ma charakter **edukacyjny** - powstał jako ćwiczenie z automatyzacji przeglądarki (Puppeteer), obsługi cookies, selektorów i logiki aplikacji webowej. **Nie jest przeznaczony do oszukiwania w nauce** ani do obchodzenia zasad szkoły czy nauczyciela. Używaj go odpowiedzialnie, najlepiej do nauki i testowania własnych umiejętności.

- Projekt **nie jest powiązany** z InstaLing / instaling.pl ani z jego właścicielami.
- Automatyczne korzystanie z serwisu może naruszać jego regulamin. Za sposób użycia odpowiada wyłącznie użytkownik.
- Oprogramowanie jest dostarczane **bez żadnej gwarancji** ("AS IS"), zgodnie z licencją ISC.
- Nie udostępniaj swoich danych logowania innym osobom. Pliki `config/Config.json` i `config/SavedWords.json` są ignorowane przez git.

This project is for **educational purposes** only (browser automation practice). It is **not affiliated with InstaLing** and is **not intended to cheat** in language learning. Use it responsibly and at your own risk; automated use may violate the service's terms.

# Licencja

ISC - zobacz plik [LICENSE](LICENSE). Projekt jest kontynuacją [PanSzelescik/instaling-bot](https://github.com/PanSzelescik/instaling-bot).

# Dla deweloperów

Opis działania, architektury, znanych ograniczeń i planów na wersję desktopową: [PROJECT_NOTES.md](PROJECT_NOTES.md).

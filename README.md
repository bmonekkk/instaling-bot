# instaling-bot

Bot dla automatycznego rozwiązywania słówek na [instaling.pl](https://instaling.pl).

**Strona projektu:** https://bmoneczek.github.io/instaling-bot/
**Najnowsza wersja:** https://github.com/Bmoneczek/instaling-bot/releases/latest

Działająca wersja (fix 2026): obsługa okna zgody na cookies, Puppeteer 25, Node.js 22+, aktualne selektory strony. Open source, licencja ISC.

Wymaga **Node.js 22+** (testowane na Node 26) oraz przeglądarki instalowanej automatycznie przez Puppeteer.

# Instalacja

1. Pobierz i zainstaluj Node.js (22 lub nowszy): https://nodejs.org/
2. Sklonuj repozytorium:
   ```
   git clone https://github.com/Bmonek/instaling-bot.git
   ```
3. Wpisz komendę:
   ```
   npm install
   ```
4. W pliku `config/Config.json` uzupełnij dane logowania:
   ```json
   "credentials": {
       "login": "twoj-login-lub-email",
       "password": "twoje-haslo"
   }
   ```
   Możesz też skopiować `config/Config.example.json` do `config/Config.json` i wypełnić go.
5. Aby uruchomić:
   ```
   npm run start
   ```

# Sposób działania

- Logowanie za pomocą danych w `config/Config.json` (`credentials.login`, `credentials.password`).
- Automatyczne zamykanie okna zgody na cookies (Google Funding Choices), które zasłania formularz logowania.
- Uruchomienie nauki słówek.
- Udzielanie odpowiedzi na podane słówka:
  - Domyślnie odpowiedź jest udzielana dla wszystkich słówek, możesz to zmienić ustalając `valid_chance` w `config/Config.json` (`1` - `100%`, `0.85` - `85%`...).
  - Słówko musi być dostępne w `config/SavedWords.json`.
  - Jeśli nie jest dostępne, zostanie zapisane prawidłowe tłumaczenie, w celu udzielania poprawnych odpowiedzi później.
- Gdy nauka słówek się zakończy **nie zamykaj okna przeglądarki!** Przeglądarka zamknie się sama i zapisze poznane słówka.

# Objaśnienie configu

- `credentials` - dane logowania do InstaLing
  - `login` - login lub e-mail
  - `password` - hasło
- `sites` - używane strony
  - `login` - strona na której bot ma się zalogować
- `delays` - czas oczekiwania w milisekundach na podane czynności (1 s = 1000 ms), bot losuje czas oczekiwania między min a max
  - `click_min` - minimalny czas oczekiwania po kliknięciu w przycisk
  - `click_max` - maksymalny czas oczekiwania po kliknięciu w przycisk
  - `type_min` - minimalny czas wpisywania tekstu w pole tekstowe
  - `type_max` - maksymalny czas wpisywania tekstu w pole tekstowe
  - `selector` - czas oczekiwania na dowolny element na stronie, aby móc go np. przeczytać (jeśli masz naprawdę powolny internet to możesz spróbować zwiększyć tę wartość)
  - `wait_min` - minimalny czas oczekiwania po kliknięciu w przycisk gdy nie zmienia się adres strony, ale zmienia się jej zawartość
  - `wait_max` - maksymalny czas oczekiwania po kliknięciu w przycisk gdy nie zmienia się adres strony, ale zmienia się jej zawartość
  - `check_min` - minimalny czas oczekiwania na sprawdzenie poprawności wpisanego słówka
  - `check_max` - maksymalny czas oczekiwania na sprawdzenie poprawności wpisanego słówka
  - `next_word_min` - minimalny czas oczekiwania między słówkami
  - `next_word_max` - maksymalny czas oczekiwania między słówkami
- `valid_chance` - jaka część udzielonych odpowiedzi ma być prawidłowa (`1` - `100%`, `0.85` - `85%`...)
- `max_answers` - maksymalna liczba odpowiedzi w jednym uruchomieniu (`0` = bez limitu, przydatne do testów)
- `feature` - **opcjonalne** konto zewnętrznej bazy słówek (`api.crawcik.space`). Nie wpisuj tutaj danych logowania do InstaLing! Pozostaw puste, jeśli nie używasz tej usługi.
- `show_browser` - umożliwia widzenie przeglądarki na żywo, bądź jej ukrycie, przydatne jeśli bot jest uruchamiany na Linuxie gdzie nie mamy GUI (wtedy należy wpisać `false`, gdyż bot nie wystartuje)
- `open_devtools` - pozwala na otwarcie narzędzi deweloperskich razem ze startem bota (uwaga! `show_browser` jest wtedy traktowany jako `true`)
- `mute_audio` - pozwala na wyciszenie dźwięku z przeglądarki
- `window_width` / `window_height` - rozmiar okna przeglądarki
- `debug` - umożliwia wyświetlanie dodatkowych logów z przeglądarki (nie są one wysyłane przez webhook!)
- `webhook` - możesz tutaj wpisać adres URL [webhooka Discorda](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks), wtedy logi są wysyłane również przez tego webhooka

# Rozwiązywanie problemów

- **Bot zatrzymuje się na logowaniu** - upewnij się, że login i hasło są poprawne. Bot sam zamyka okno cookies; jeśli mimo to widzisz nakładkę, uruchom z `"show_browser": true` i sprawdź `screenshots/answer-error.png`.
- **`Could not find the "start session" button`** - strona instaling.pl mogła zmienić układ. Włącz `"debug": true` i wyślij zawartość `pages/answer-start-failed.html`.
- **Brak Chrome** - uruchom `npx puppeteer browsers install chrome`, jeśli `npm install` nie pobrał przeglądarki.
- Po każdej próbie bot zapisuje zrzuty strony w `pages/` i `screenshots/` - to najlepsze źródło informacji o błędzie.

# Zmiany w tej wersji

- Zaktualizowano Puppeteer do wersji 25 (obsługa współczesnego Chrome i Node 22+).
- Usunięto stary uBlock Origin (Manifest V2 nie jest już obsługiwany, a rozszerzenie nie było już używane) - reklamy i skrypty śledzące są blokowane przez przechwytywanie żądań.
- Naprawiono blokadę logowania przez okno zgody Google (cookies).
- Naprawiono `canLogin()`, zapis `SavedWords.json`, czyszczenie katalogów i wykrywanie widoczności elementów.
- Dodano wiele alternatywnych selektorów dla stron logowania i sesji.
- Webhook Discorda nie wymaga już `discord.js` (używa wbudowanego `fetch`).
- Przeniesiono dane logowania do sekcji `credentials` (stare konfiguracje z `login`/`password` na najwyższym poziomie nadal działają).
- Dodano licencję ISC i sekcję Disclaimer.

# Disclaimer / Zastrzeżenia

Projekt ma charakter **edukacyjny** - powstał jako ćwiczenie z automatyzacji przeglądarki (Puppeteer), obsługi cookies, selektorów i logiki aplikacji webowej. **Nie jest przeznaczony do oszukiwania w nauce** ani do obchodzenia zasad szkoły czy nauczyciela. Używaj go odpowiedzialnie, najlepiej do nauki i testowania własnych umiejętności.

- Projekt **nie jest powiązany** z InstaLing / instaling.pl ani z jego właścicielami.
- Automatyczne korzystanie z serwisu może naruszać jego regulamin. Za sposób użycia odpowiada wyłącznie użytkownik.
- Oprogramowanie jest dostarczane **bez żadnej gwarancji** ("AS IS"), zgodnie z licencją ISC.
- Nie udostępniaj swoich danych logowania innym osobom. Pliki `config/Config.json` i `config/SavedWords.json` są ignorowane przez git.

This project is for **educational purposes** only (browser automation practice). It is **not affiliated with InstaLing** and is **not intended to cheat** in language learning. Use it responsibly and at your own risk; automated use may violate the service's terms.

# Licencja

ISC - zobacz plik [LICENSE](LICENSE). Projekt jest kontynuacją [PanSzelescik/instaling-bot](https://github.com/PanSzelescik/instaling-bot).


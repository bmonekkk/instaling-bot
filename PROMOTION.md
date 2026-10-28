# PROMOTION.md — jak wypromować instaling-bot

Zbiór gotowych materiałów i checklist do zwiększania widoczności projektu.
Wszystko jest opcjonalne — bierz to, co pasuje.

Strona: https://bmonekkk.github.io/instaling-bot/ · Repo: https://github.com/bmonekkk/instaling-bot

---

## 1. Indeksacja i wyszukiwarki (zrób raz, potem pilnuj)

- [x] **Google Search Console** — usługa `https://bmonekkk.github.io/instaling-bot/` dodana
      i potwierdzona (plik `google0890551163baf2b9.html` leży w `docs/`).
- [x] Sitemapa wysłana: `https://bmonekkk.github.io/instaling-bot/sitemap.xml`.
- [x] Dla strony głównej zrobione **URL Inspection → Request indexing** (ponów po większych zmianach).
- [x] **Bing Webmaster Tools** — strona dodana i potwierdzona (`BingSiteAuth.xml`).
- [x] Sitemapa wysłana również do Binga.
- [x] **IndexNow** (Bing + Yandex) — wysłane (`npm run indexnow`, HTTP 200). Klucz:
      `docs/4378f80532d5cec0574a28e80a26421e.txt`. Powtarzaj po każdym deployu.
      Ponieważ strona jest projektowa (pod `bmonekkk.github.io/instaling-bot/`), klucz leży
      w podkatalogu — użyj `keyLocation`. Po każdym deployu możesz zgłosić zmiany:

      ```bash
      curl -s -X POST "https://api.indexnow.org/indexnow" \
        -H "Content-Type: application/json" \
        -d '{
          "host": "bmonekkk.github.io",
          "key": "4378f80532d5cec0574a28e80a26421e",
          "keyLocation": "https://bmonekkk.github.io/instaling-bot/4378f80532d5cec0574a28e80a26421e.txt",
          "urlList": [
            "https://bmonekkk.github.io/instaling-bot/"
          ]
        }'
      ```

- [ ] Sprawdź dane strukturalne: **Rich Results Test** i **Schema Markup Validator**
      (strona ma już `WebSite`, `SoftwareApplication`, `SoftwareSourceCode`, `FAQPage`).
- [ ] Sprawdź Core Web Vitals (PageSpeed Insights) — strona jest statyczna, powinno być zielono.

## 2. Analityka

Strona jest w 100% bez trackerów — żadnych skryptów analitycznych ani ciasteczek.
Ruch sprawdzamy w panelach wyszukiwarek, które nie wymagają niczego po stronie
strony:

- [ ] **Google Search Console** → Skuteczność (wyświetlenia, kliknięcia, zapytania, top strony).
- [ ] **Bing Webmaster Tools** → Site Explorer / Statystyki wyszukiwania.

Te dane są wystarczające do monitorowania SEO, a odwiedzający blokujący trackery
(np. AdGuard) i tak byliby niewidoczni dla skryptu analitycznego.

## 3. Backlinki i katalogi

- [ ] Dopisz projekt do **alternativeto.net** (kategoria: Language Learning / Education).
- [ ] **Product Hunt** — premiera z krótkim demo (GIF `docs/demo.gif`).
- [ ] Listy „awesome": awesome-selfhosted, awesome-cli-apps, awesome-electron, awesome-puppeteer.
- [ ] Artykuł na **dev.to** / Medium („Jak zbudowałem bota do nauki słówek na wszystkich platformach”)
      z linkiem do strony i repo.
- [ ] Wpis na blogu / portfolio z linkiem do strony.
- [ ] Uzupełnione **Topics** i opis repo (już zrobione) — pomaga w wyszukiwarce GitHuba.

## 4. Gotowe teksty do wklejenia

### 4a. Wykop.pl (PL) — znalezisko, limit ok. 1400 znaków

**Tytuł:** instaling-bot 4.3.1 — bot do instaling.pl na desktop, Androida, iOS i w terminalu (open source)

**Opis:**

> Zrobiłem bota do instaling.pl, który działa wszędzie: aplikacja na Windows i macOS, APK na
> Androida, niepodpisana IPA na iOS (SideStore/AltStore) oraz userscript do Safari/Firefoksa.
> Jeden wspólny silnik, interfejs PL/EN.
>
> Najnowsze wydanie dodaje dwie prawdziwe pauzy. Bot najpierw chwilę „myśli" o tłumaczeniu,
> zanim zacznie pisać, a po sprawdzeniu odpowiedzi czyta wynik przed „dalej" — dłużej po
> literówce, złym słowie, pustym polu lub nowym słówku, krótko po poprawnej odpowiedzi.
> Wszystkie czasy są losowane z podanego zakresu, do tego literówki z backspace, więc tempo
> wygląda po ludzku.
>
> Poprawiłem też iOS: wcześniejsza wersja crashowała przy starcie na iOS 26 (biały ekran),
> teraz aplikacja startuje normalnie, a „Gotowe" nad klawiaturą to pojedynczy klasyczny
> przycisk zamiast paska zasłaniającego pół ekranu. Android dostał ten sam kompaktowy wygląd.
>
> Bez backendu i telemetrii, nigdy nie zapisuje hasła — korzysta z normalnej sesji strony.
> Projekt edukacyjny, niepowiązany z InstaLing; automatyczne korzystanie z serwisu może
> naruszać jego regulamin.
>
> Strona: https://bmonekkk.github.io/instaling-bot/
> Kod: https://github.com/bmonekkk/instaling-bot

**Tagi:** #opensource #programowanie #instaling (jeśli któryś nie istnieje, użyj #bot i #javascript)

**Wskazówki:** wrzucaj od poniedziałku do czwartku, rano 9–11 CET. Nie dopisuj „proszę o
wykop" w opisie — Wykop to karze. Odpowiadaj w komentarzach, w tym na pytanie o regulamin.

### 4b. Reddit (EN)

**Tytuł:**

> I built an open-source bot for instaling.pl that runs on Windows, macOS, Android, iOS and the terminal

**Treść (r/opensource, r/SideProject):**

> instaling.pl is a Polish vocabulary site schools use; it hands out a daily session of words.
> This is a bot that does the session for you without looking robotic.
>
> One shared JS engine (lexer/selector layer, typing layer, answer layer) powers five targets:
> an Electron desktop app with a bundled Chrome for Testing, an Android WebView shell, an
> unsigned iOS IPA, a Safari/Firefox userscript, and a Node.js CLI. Same settings, same stats,
> same classic UI on all of them.
>
> The part I spent the most time on is timing. There are no fixed sleeps — three randomised
> ranges instead: a pause before the first keystroke (thinking about the translation), a
> longer read after a misspelling, wrong word, blank answer or a new word, and a short one
> after a correct answer. On top of that: per-letter delays, deliberate typos that get
> backspaced, and wrong answers picked at random between blank / another saved translation /
> a misspelling.
>
> Everything is local. No backend, no telemetry, and the mobile shells never store your
> password — they keep the site's normal session.
>
> Repo: https://github.com/bmonekkk/instaling-bot
> Site: https://bmonekkk.github.io/instaling-bot/
>
> It's an educational project, not affiliated with InstaLing, and automating the site may
> violate its ToS — I say that up front rather than pretend otherwise.

**Wariant r/androidapps (krótko):**

> I made an open-source Android app that automates the daily vocabulary session on instaling.pl
> (a Polish learning site). It's a plain Java WebView shell over a shared JS engine: native
> Start/Stop, PL/EN, a ⚙ settings dialog (accuracy, three randomised human-like pauses, typing
> delays, reminder time and frequency), 📊 week/month/year stats, and a reminder that repeats
> every N minutes and skips a day once the session is done.
>
> It's an APK (not on Play Store), signed with a debug key, Android 7+. There's also a
> userscript if you prefer Firefox + Tampermonkey.
>
> https://github.com/bmonekkk/instaling-bot/releases/latest

**Wskazówki:** sprawdź zasady subredditu przed wklejeniem — część banuje self-promo w tytule.
Odpowiadaj na komentarze, nie edytuj treści po fakcie.

### 4c. Show HN (EN)

**Tytuł:** Show HN: instaling-bot – open-source vocabulary bot for instaling.pl on every platform

**Treść (bez marketingu, konkrety):**

> instaling.pl is a Polish vocabulary practice site used in schools: you get a daily session
> of words. This is a bot that does the session for you in a way that doesn't look robotic.
>
> One shared JS engine (selectors, typing, answer logic) powers five targets: an Electron
> desktop app with a bundled Chrome for Testing, an Android WebView shell, an unsigned iOS
> IPA, a browser userscript, and a Node.js CLI.
>
> The timing model is the interesting part. Instead of fixed sleeps there are three
> randomised ranges — a pause before the first keystroke (thinking about the translation), a
> longer read after a misspelling / wrong word / blank / new word, and a short one after a
> correct answer. Plus erratic per-letter delays, occasional typos that get backspaced, and
> wrong answers chosen randomly between blank, another saved translation and a misspelling.
>
> Everything runs locally: no backend, no telemetry, and the shells never store the password
> (they reuse the normal site session).
>
> It's an educational project, not affiliated with InstaLing, and automating the site may
> violate its ToS — flagging that rather than burying it.
>
> https://bmonekkk.github.io/instaling-bot/

**Wskazówki:** wrzucaj wtorek–czwartek, 8–10 ET (14–16 CET). Link prowadzi do strony, nie do
repo. Nie proś o głosy. Zostaw pierwszy komentarz z detalami o silniku — ludzie tam pójdą.

### 4d. Product Hunt (EN)

- **Tagline (≤60):** Automate your instaling.pl vocabulary practice on any device.
- **Description (≤260):** Open-source bot for instaling.pl on Windows, macOS, Android, iOS and
  the terminal. It types like a person: pauses to think before answering, reads the result
  after a mistake, randomises every delay and fixes its own typos. Stats and reminders on
  every platform.
- **Pierwszy komentarz (maker):** I built this because the daily session is repetitive but the
  site is easy to spot as a robot if the timing is constant. So the engine randomises three
  pauses, mistypes and backspaces occasionally, and mixes up wrong-answer types. It runs on
  five targets from one codebase, stores no passwords and has no backend. Happy to answer
  anything about the engine or the packaging.
- **Grafiki:** logo 240×240 (jest `build/icon.png`), galeria 1270×760 — użyj zrzutów desktopu,
  Androida i iOS (`docs/demo.gif` to mem, nie zostawiaj go jako jedynego „demka").
- **Wskazówki:** premiera startuje 00:01 PT (09:01 CET). Odpowiadaj na komentarze przez cały
  dzień — PH punktuje zaangażowanie, nie sam wpis.

## 5. Rytm publikacji

- Do każdego wydania dołącz link do **strony głównej** i do README/wiki w repo.
- Aktualizuj `CHANGELOG.md`, `docs/llms.txt` i `docs/sitemap.xml` — pomaga to też wyszukiwarkom
  i asystentom AI.
- Strona jest teraz jednym `index.html`; nowy temat dodawaj jako sekcję na stronie głównej
  (link z kotwicą), dopóki nie uzbiera się dość treści na osobny adres.

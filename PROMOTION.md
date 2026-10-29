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

**Tytuł:** instaling-bot — otwartoźródłowy bot do instaling.pl, który działa na każdym systemie

**Opis:**

> instaling.pl daje codzienną sesję słówek. instaling-bot robi ją za Ciebie — na Windows,
> macOS, Androidzie, iPhonie/iPadzie albo w terminalu. Loguje się Twoimi danymi, wchodzi na
> stronę sesji i odpowiada na kolejne słówka.
>
> Jak to działa: program otwiera prawdziwą przeglądarkę (na desktopie z wbudowanym Chrome),
> czyta każde słówko i wpisuje tłumaczenie. Poprawne odpowiedzi zapamiętuje między
> uruchomieniami, więc raz wpisane słówko nie przepada. Pisze „po ludzku": losowe opóźnienia
> między literami, chwila namysłu przed pierwszą literą, czasem literówka poprawiona
> backspace'em. Domyślnie trafia w 80%, a część błędów celowo zostawia pustą albo błędną —
> losowo puste pole, inne zapisane tłumaczenie lub literówka.
>
> Jeden wspólny silnik obsługuje pięć wersji: desktop (Windows/macOS), APK na Androida, IPA
> na iOS, userscript do Safari/Firefoksa i CLI na Linuksa. Interfejs PL/EN, statystyki
> tygodnia/miesiąca/roku i przypomnienie o sesji na każdej platformie.
>
> Wszystko działa lokalnie: bez backendu i telemetrii. Wersje mobilne nie zapisują hasła —
> korzystają z normalnej sesji strony.
>
> Projekt edukacyjny, niepowiązany z InstaLing; automatyczne korzystanie z serwisu może
> naruszać jego regulamin.
>
> Strona: https://bmonekkk.github.io/instaling-bot/
> Kod: https://github.com/bmonekkk/instaling-bot

**Tagi:** #opensource #programowanie #javascript
**Wskazówki:** pon–czw, 9–11 CET. Bez „proszę o wykop". Odpowiadaj w komentarzach, w tym na
pytanie o regulamin serwisu.

### 4b. Reddit (EN)

**Tytuł:**

> I built an open-source bot that does my daily instaling.pl vocabulary session on Windows, macOS, Android, iOS and the terminal

**Treść (r/opensource, r/SideProject):**

> instaling.pl is a vocabulary site Polish schools use. Students get a daily session of words,
> which is exactly the kind of repetitive task that's worth automating.
>
> The bot does the whole session: it opens a real browser (desktop ships Chrome for Testing),
> logs in with your credentials, starts or resumes the session, reads each prompt and types
> the translation. Correct answers are remembered between runs, so words you've already seen
> don't have to be retyped.
>
> The interesting part is making it not look robotic. Typing has random per-letter delays, a
> pause before the first keystroke, and occasional deliberate typos that get backspaced. By
> default it answers 80% correctly, and the remaining answers are randomised between a blank
> field, a different saved translation and a misspelling — the same spread of mistakes a
> person makes.
>
> One shared JS engine powers five targets: an Electron desktop app, an Android WebView
> shell, an unsigned iOS IPA, a Safari/Firefox userscript and a Node.js CLI. All of them share
> the same settings, PL/EN interface, week/month/year statistics and session reminders.
>
> Everything runs locally: no backend, no telemetry, and the mobile versions never store your
> password — they reuse the site's normal session.
>
> Repo: https://github.com/bmonekkk/instaling-bot
> Site: https://bmonekkk.github.io/instaling-bot/
>
> It's an educational project, not affiliated with InstaLing, and automating the site may
> violate its ToS.

**Wariant r/androidapps (krótko):**

> I built an open-source Android app that automates the daily vocabulary session on
> instaling.pl (a site Polish schools use for language learning). It's a plain Java WebView
> shell around a shared JS engine: native Start/Stop, PL/EN, a ⚙ settings dialog (answer
> accuracy, typing speed, human-like pauses, reminder time and frequency), 📊 week/month/year
> stats, and a reminder that repeats every N minutes and stays quiet once the day's session
> is done. It remembers translations between runs.
>
> APK, Android 7+, signed with a debug key (not on Play Store). There's also a userscript if
> you'd rather use Firefox + Tampermonkey.
>
> https://github.com/bmonekkk/instaling-bot/releases/latest

**Wskazówki:** sprawdź zasady subredditu — część banuje self-promo w tytule. Odpowiadaj na
komentarze.

### 4c. Show HN (EN)

**Tytuł:** Show HN: instaling-bot – an open-source vocabulary bot for instaling.pl on five platforms

**Treść (konkrety, bez marketingu):**

> instaling.pl is a vocabulary practice site used in Polish schools: every student gets a
> daily session of words. This automates that session.
>
> It drives a real browser — Chrome for Testing on desktop, WKWebView on iOS, a plain WebView
> on Android, or your own browser via a userscript. It logs in, starts or resumes the session,
> reads each prompt and answers, remembering translations between runs. Five targets share one
> engine: Electron desktop, Android APK, unsigned iOS IPA, userscript, Node.js CLI.
>
> What I found interesting is the timing. Fixed sleeps are the easiest tell, so typing uses
> random per-letter delays, a pause before the first keystroke, and occasional typos that get
> backspaced. Accuracy defaults to 80%, and the misses are randomised between a blank answer,
> another saved translation and a misspelling, rather than always the same failure.
>
> Everything is local — no backend, no telemetry, and the shells never store the password,
> they reuse the site session.
>
> It's an educational project, not affiliated with InstaLing, and automating the site may
> violate its ToS — saying that plainly rather than burying it.
>
> https://bmonekkk.github.io/instaling-bot/

**Wskazówki:** wt–czw, 8–10 ET (14–16 CET). Link do strony, nie do repo. Nie proś o głosy.
Zostaw pierwszy komentarz z detalami o silniku i odpowiadaj na pytania o regulamin.

### 4d. Product Hunt (EN)

- **Tagline (≤60):** Your daily instaling.pl vocabulary session, done for you.
- **Description (≤260):** Open-source bot that does your daily instaling.pl vocabulary session
  for you, on Windows, macOS, Android, iOS and the terminal. It types like a person — random
  delays, thinking pauses, typos it fixes itself — remembers translations, and keeps stats and
  reminders on every platform.
- **Pierwszy komentarz (maker):** I built this because a daily vocabulary session is repetitive,
  but a bot with constant timing is obvious. So the engine randomises typing delays, pauses
  before answering, mistypes and backspaces occasionally, and mixes up the kind of mistake it
  makes. It drives a real browser, remembers the words it learned, and runs on five platforms
  from one codebase. No backend, no telemetry; on the desktop the password is encrypted in
  the OS keychain, and the phones never store it.
- **Grafiki:** logo 240×240 (`build/icon.png`), galeria 1270×760 — zrzuty desktopu, Androida
  i iOS pokazujące sesję i panel ustawień.
- **Wskazówki:** premiera 00:01 PT (09:01 CET). Obsadź komentarze przez cały dzień.

### 4e. GitHub Discussions (ogłoszenie o wydaniu)

Opublikowane: https://github.com/bmonekkk/instaling-bot/discussions/3
Tytuł: **🎉 instaling-bot 4.3.1 — udało się, wszystko działa!**

Ton jest celowo swobodny („udało się"), a treść wypunktowana: iOS startuje, „Gotowe" to
pojedynczy przycisk, Android wygląda jak iOS, dwie pauzy zostają + tabela plików i link do
releases. To jedyne miejsce, gdzie opisujemy zmiany w wydaniu — posty promocyjne (4a–4d)
mają przedstawiać projekt, a nie changelog.

### 4f. Krótkie „co nowego" — tylko do posta o wydaniu

- dwie losowe pauzy (myślenie przed pisaniem, czytanie wyniku przed „dalej"),
- „Gotowe" jako unoszący się przycisk na iOS + brak crasha na iOS 26,
- Android jak iOS: kompaktowy pasek tytułu, gradient w pasku stanu, symetryczna ramka,
- jeden silnik na desktop, Androida, iOS, userscript i CLI,
- statystyki tygodnia/miesiąca/roku i przypomnienia na każdej platformie,
- bez backendu, bez telemetrii, hasło na desktopie szyfrowane w pęku kluczy systemu, a na telefonach nigdy nie zapisywane.

## 5. Rytm publikacji

- Do każdego wydania dołącz link do **strony głównej** i do README/wiki w repo.
- Aktualizuj `CHANGELOG.md`, `docs/llms.txt` i `docs/sitemap.xml` — pomaga to też wyszukiwarkom
  i asystentom AI.
- Strona jest teraz jednym `index.html`; nowy temat dodawaj jako sekcję na stronie głównej
  (link z kotwicą), dopóki nie uzbiera się dość treści na osobny adres.

## 6. Gdzie to wkleić — gotowe linki

Posty z sekcji 4 wklejasz ręcznie (żadna z tych platform nie pozwala publikować w Twoim
imieniu bez Twojego konta). Żeby było szybciej:

| Platforma | Link do wklejenia |
|---|---|
| Wykop (znalezisko) | https://wykop.pl/dodaj/link |
| Reddit — z wypełnionym tytułem i linkiem | `https://www.reddit.com/submit?type=LINK&title=<TYTUŁ>&url=<URL>` |
| Hacker News (Show HN) | https://news.ycombinator.com/submit |
| Product Hunt | https://www.producthunt.com/posts/new |

Przy Reddicie wystarczy zakodować tytuł i link (`%20` za spację) — formularz otworzy się
wypełniony, zostaje wybrać subreddit i wysłać.

**Czego nie da się zautomatyzować:** HN nie ma API do pisania (posty tylko z przeglądarki, a
zalewanie go skryptami kończy się banem), Product Hunt uruchamia premierę przez stronę, a
Wykop i Reddit mają API, ale wymagają Twoich kluczy i logowania — poza tym oba serwisy traktują
automatyczne self-promo jak spam. GitHub Actions może natomiast ogłaszać nowe wydania
automatycznie w **GitHub Discussions**, jeśli kiedyś będziesz chciał.

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

### 4a. Wykop.pl (PL)

> **instaling-bot 4.3.1 — bot do instaling.pl na wszystkie systemy (open source)**
>
> Zrobiłem otwartoźródłowego bota do instaling.pl: desktop na Windows i macOS, APK na
> Androida, niepodpisana IPA na iOS (SideStore/AltStore), userscript do Safari i Firefoksa
> oraz CLI na Linuksa. Jeden wspólny silnik i interfejs PL/EN.
>
> Najnowsze wydanie dodaje dwie prawdziwe pauzy: bot najpierw „myśli" o tłumaczeniu, zanim
> zacznie pisać, a po sprawdzeniu odpowiedzi chwilę czyta wynik, zanim kliknie „dalej".
> Każdy czas jest losowany z podanego zakresu, więc tempo wygląda po ludzku. Do tego
> literówki z backspace, statystyki tygodnia/miesiąca/roku i przypomnienia na każdej platformie.
>
> Bez backendu i telemetrii, nigdy nie zapisuje hasła — korzysta z normalnej sesji strony.
> Projekt edukacyjny, niepowiązany z InstaLing. #opensource #programowanie #koa

### 4b. Reddit (EN)

Subreddity: `r/opensource`, `r/SideProject`, `r/androidapps`, `r/learnpolish` (delikatnie).

> **I built an open-source vocabulary bot for instaling.pl that runs on Windows, macOS, Android, iOS and the terminal**
>
> One answer engine powers a desktop app, an Android APK, an unsigned iOS IPA, a
> Safari/Firefox userscript and a CLI. The latest release adds two human-like pauses: it
> waits before the first keystroke as if thinking about the translation, then reads the
> result before hitting "next" — longer after a mistake or a new word, briefly after a
> correct answer. Every delay is randomised, on top of per-letter timing and corrected typos.
> Stats and reminders on every platform, and your password is never stored.
>
> Site: https://bmonekkk.github.io/instaling-bot/ · Code: https://github.com/bmonekkk/instaling-bot
>
> Educational project, not affiliated with InstaLing.

### 4c. Show HN (EN)

> **Show HN: instaling-bot – open-source vocab bot for instaling.pl on every platform**
>
> One shared JS engine powers a Windows/macOS desktop app (Electron), an Android WebView
> shell, an unsigned iOS IPA, a userscript for Safari and Firefox-on-Android, and a Node.js
> CLI. The engine answers a daily vocabulary session the way a person might: it pauses to
> "think" before typing, reads the result before continuing (longer after a typo, wrong word
> or new word), randomises every delay and occasionally mistypes then backspaces. Plus
> week/month/year stats and reminders. Local-only, no accounts, no password storage.
>
> https://bmonekkk.github.io/instaling-bot/

### 4d. Product Hunt (EN)

- **Tagline:** Automate your instaling.pl vocabulary practice on any device.
- **Description:** Open-source bot for instaling.pl — desktop (Windows/macOS), Android APK,
  iOS IPA and userscript, plus a CLI. It types like a human: a pause to "think" before
  answering, a longer read after a mistake, randomised delays and corrected typos. Configurable
  accuracy, stats and reminders on every platform. No backend, no telemetry, passwords are
  never stored.

### 4e. GitHub Discussions (announcement)

> **instaling-bot 4.3.1 — działający iOS, unoszące się „Gotowe" i Android jak iOS**
>
> 4.3.1 to wydanie poprawkowe: aplikacja iOS nie crashuje już przy starcie na iOS 26 (cykl
> życia `UIScene`), a „Gotowe" nad klawiaturą to teraz pojedynczy, klasyczny przycisk bez
> szarego paska. Android dostał ten sam kompaktowy wygląd co iOS — mniejszy pasek tytułu,
> gradient przedłużony w pasek stanu i symetryczną ramkę okna.
>
> Dwóch ludzkich pauz z 4.3.0 (myślenie przed pisaniem i czytanie wyniku przed „dalej")
> nie ruszamy. Pełna lista zmian: [CHANGELOG](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).
> Pobierz: https://github.com/bmonekkk/instaling-bot/releases/latest

### 4f. Krótkie „co nowego w 4.3.1" do wklejenia

- dwie losowe pauzy (myślenie przed pisaniem, czytanie wyniku przed „dalej"),
- „Gotowe" jako unoszący się przycisk na iOS + brak crasha na iOS 26,
- Android jak iOS: kompaktowy pasek tytułu, gradient w pasku stanu, symetryczna ramka,
- jeden silnik na desktop, Androida, iOS, userscript i CLI,
- statystyki tygodnia/miesiąca/roku i przypomnienia na każdej platformie,
- bez backendu, bez telemetrii, hasła nigdy nie są zapisywane.

## 5. Rytm publikacji

- Do każdego wydania dołącz link do **strony głównej** i do README/wiki w repo.
- Aktualizuj `CHANGELOG.md`, `docs/llms.txt` i `docs/sitemap.xml` — pomaga to też wyszukiwarkom
  i asystentom AI.
- Strona jest teraz jednym `index.html`; nowy temat dodawaj jako sekcję na stronie głównej
  (link z kotwicą), dopóki nie uzbiera się dość treści na osobny adres.

# PROMOTION.md — jak wypromować instaling-bot

Zbiór gotowych materiałów i checklist do zwiększania widoczności projektu.
Wszystko jest opcjonalne — bierz to, co pasuje.

Strona: https://bmonekkk.github.io/instaling-bot/ · Repo: https://github.com/bmonekkk/instaling-bot

---

## 1. Indeksacja i wyszukiwarki (zrób raz, potem pilnuj)

- [ ] **Google Search Console** — dodaj usługę `https://bmonekkk.github.io/instaling-bot/`,
      potwierdź własność (plik `google0890551163baf2b9.html` jest już w `docs/`).
- [ ] Wyślij sitemapę: `https://bmonekkk.github.io/instaling-bot/sitemap.xml`.
- [ ] Dla strony głównej użyj **URL Inspection → Request indexing** po każdej większej zmianie.
- [ ] **Bing Webmaster Tools** — dodaj stronę i potwierdź własność (wygeneruj `BingSiteAuth.xml`
      albo dodaj `<meta name="msvalidate.01" ...>` do `<head>`).
- [ ] Wyślij sitemapę również do Binga.
- [ ] **IndexNow** (Bing + Yandex) — jest już gotowy klucz:
      plik `docs/4378f80532d5cec0574a28e80a26421e.txt`.
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

Strona jest domyślnie bez trackerów. Żeby widzieć ruch, utwórz darmowe konto w
[GoatCounter](https://www.goatcounter.com/) i wpisz subkonto w `docs/analytics.js`:

```js
var GOATCOUNTER_SUBACCOUNT = 'instaling-bot'; // -> https://instaling-bot.goatcounter.com
```

GoatCounter nie używa ciasteczek ani odcisków palca, więc jest przyjazny RODO.

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

> **instaling-bot — bot do instaling.pl na wszystkie systemy (open source)**
>
> Zrobiłem otwartoźródłowego bota do instaling.pl: aplikacja desktop (Windows/macOS),
> APK na Androida, IPA i userscript na iOS, CLI na Linuksa i do terminala. Wspólny silnik,
> humanizacja pisania (losowe pauzy i literówki), statystyki i przypomnienia. Interfejs PL/EN.
> Bez backendu i telemetrii, nie zapisuje haseł.
>
> Strona: https://bmonekkk.github.io/instaling-bot/ · Kod: https://github.com/bmonekkk/instaling-bot
>
> Projekt edukacyjny, niepowiązany z InstaLing. #opensource #programowanie

### 4b. Reddit (EN)

Subreddity: `r/opensource`, `r/SideProject`, `r/androidapps`, `r/learnpolish` (delikatnie).

> **I built an open-source vocabulary bot for instaling.pl that works on Windows, macOS, Android, iOS, and the terminal**
>
> It shares one answer engine across a desktop app, an Android APK, an unsigned iOS IPA,
> a Safari/Firefox userscript, and a CLI. It types human-like (random delays, corrected typos),
> keeps stats and reminders, and never stores your password. No backend, no telemetry.
>
> Site: https://bmonekkk.github.io/instaling-bot/ · Code: https://github.com/bmonekkk/instaling-bot
>
> It's an educational project, not affiliated with InstaLing.

### 4c. Show HN (EN)

> **Show HN: instaling-bot – open-source vocab bot for instaling.pl on every platform**
>
> One shared JS engine powers a Windows/macOS desktop app (Electron), an Android WebView
> shell, an unsigned iOS IPA, a userscript for Safari and Firefox-on-Android, and a Node.js CLI.
> It automates a daily vocabulary session with human-like typing (random delays, corrected
> typos, believable mistakes), plus stats and reminders. Local-only, no password storage.
>
> https://bmonekkk.github.io/instaling-bot/

### 4d. Product Hunt (EN)

- **Tagline:** Automate your instaling.pl vocabulary practice on any device.
- **Description:** Open-source bot for instaling.pl — desktop (Windows/macOS), Android APK,
  iOS IPA and userscript, and a CLI. Human-like typing, configurable accuracy, stats and
  reminders. No backend, no telemetry, passwords are never stored.

## 5. Rytm publikacji

- Do każdego wydania dołącz link do **strony głównej** i do README/wiki w repo.
- Aktualizuj `CHANGELOG.md`, `docs/llms.txt` i `docs/sitemap.xml` — pomaga to też wyszukiwarkom
  i asystentom AI.
- Strona jest teraz jednym `index.html`; nowy temat dodawaj jako sekcję na stronie głównej
  (link z kotwicą), dopóki nie uzbiera się dość treści na osobny adres.

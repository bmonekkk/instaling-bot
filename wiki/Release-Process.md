# 📦 Proces wydań

## Wersjonowanie

Projekt używa semver-ish `MAJOR.MINOR.PATCH`:

- **MAJOR** — duże zmiany łamiące zgodność,
- **MINOR** — nowe funkcje,
- **PATCH** — poprawki błędów i bezpieczeństwa.

Tag ma przedrostek `v`, np. `v4.0.0`, ale **tytuł wydania to sam numer**: `4.0.0`.

## Jak powstaje wydanie

1. Zmiany trafiają na `master` przez pull request (lub bezpośrednio przy pilnym wydaniu).
2. Maintainer aktualizuje `package.json`, `package-lock.json`, `CHANGELOG.md` i
   `.github/RELEASE_NOTES_vX.Y.Z.md`. Wersję Androida czyta się z `package.json`, a wersję
   iOS z `MARKETING_VERSION` w `mobile/ios/project.yml`.
3. Maintainer wypycha tag:

   ```bash
   git tag -a vX.Y.Z -m "instaling-bot X.Y.Z"
   git push origin vX.Y.Z
   ```

4. Workflow `.github/workflows/release.yml` buduje:
   - `instaling-bot-X.Y.Z-setup-win64.exe`,
   - `instaling-bot-X.Y.Z-macos-arm64.pkg`,
   - `instaling-bot-X.Y.Z-macos-x64.pkg`,
   - `instaling-bot-X.Y.Z-android.apk`,
   - `instaling-bot-X.Y.Z-ios.ipa`,
   - `instaling-bot.user.js`.
5. Workflow tworzy **draft release** z notatkami z `.github/RELEASE_NOTES_vX.Y.Z.md`.
6. Maintainer sprawdza assety, publikuje release i oznacza go jako latest.

## Instalatory i pliki mobilne

Są niepodpisane. Windows SmartScreen i macOS Gatekeeper mogą ostrzec. To oczekiwane.
Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. APK jest podpisywany
kluczem debugowym, jeśli nie ustawiono sekretów `ANDROID_KEYSTORE_*`, a IPA podpisujesz
własnym Apple ID (SideStore/AltStore). Userscript aktualizuje się przez `@updateURL`.

## Sprawdzanie aktualizacji

- Desktop sprawdza GitHub Releases przy starcie i co kilka godzin.
- Mobile (APK/IPA/userscript) pokazuje przycisk/link aktualizacji, ale nie instaluje jej sam.
- CLI `instaling-bot start` sprawdza wydanie **przed** startem i blokuje nieaktualną wersję.
- `instaling-bot update-check` porównuje wersje bez uruchamiania bota.
- Pominięcie blokady: `--skip-update-check` lub `INSTALING_SKIP_UPDATE_CHECK=1`.

## Hotfix bezpieczeństwa

1. Przygotuj poprawkę na branchu `security/...`.
2. Nie ujawniaj szczegółów publicznie przed wydaniem.
3. Wydaj patch (np. `3.2.1`) i advisory.
4. Podziękuj zgłaszającemu, jeśli wyraził zgodę.

Więcej: [Bezpieczeństwo](Security) · [Współtworzenie](Contributing)

## Wiki

Źródłem prawdy dla wiki są pliki `wiki/*.md` w repozytorium. Workflow
`.github/workflows/wiki.yml` kopiuje je do repozytorium `.wiki.git` po każdym
pushu, który zmienia `wiki/` — edycję wprowadzasz w repo i nie musisz nic klikać
w zakładce **Wiki**.

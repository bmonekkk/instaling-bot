# 🤝 Współtworzenie

Dziękuję za pomoc! Możesz pisać po polsku lub po angielsku.

## Szybkie zasady

- Bądź życzliwy — obowiązuje [Code of Conduct](https://github.com/bmonekkk/instaling-bot/blob/master/CODE_OF_CONDUCT.md).
- Najpierw sprawdź istniejące issues i discussions.
- Nie wklejaj haseł, ciasteczek, tokenów ani prywatnych logów.
- Problemy bezpieczeństwa zgłaszaj prywatnie przez [SECURITY.md](https://github.com/bmonekkk/instaling-bot/blob/master/SECURITY.md).
- Jeden pull request = jedna zmiana.

## Jak pomóc

- 🐛 zgłaszaj powtarzalne błędy,
- 💡 dodawaj pomysły i głosuj w Discussions → Ideas,
- 📝 poprawiaj dokumentację, wiki, przykłady i tłumaczenia,
- 🧪 testuj na Windows, macOS i Linuksie,
- 🎨 proponuj zmiany UI,
- ⭐ dodaj gwiazdkę, jeśli projekt jest przydatny.

## Środowisko deweloperskie

Wymagany Node.js 22+.

```bash
git clone https://github.com/bmonekkk/instaling-bot.git
cd instaling-bot
npm install
cp config/Config.defaults.json config/Config.json
```

Przydatne polecenia:

```bash
npm run desktop     # aplikacja Electron
npm start           # CLI
npm run check       # składnia wszystkich plików JS
npm test            # testy jednostkowe (node:test)
npm run build:mobile # bundle core.js + userscript do APK/IPA
npm run stats       # statystyki CLI
npm run help        # pomoc CLI
npm run dist:win    # instalator Windows (na Windows)
npm run dist:mac    # pakiet macOS (na macOS)
```

Zmiany w silniku mobilnym (`mobile/engine/`, `src/core/`) testuj przez `npm run build:mobile`
i `npm test`. APK zbudujesz lokalnie tak (wymaga Android SDK i JDK 21):

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
cd mobile/android && ./gradlew :app:assembleDebug
```

Dla iOS: `cd mobile/ios && xcodegen generate`, potem build w Xcode (bez podpisu). IPA jest
budowana w CI na runnerze macOS.

## Przed pull requestem

```bash
npm run check
npm test
git diff --check
bash -n install.sh
node bin/instaling-bot.js help
node bin/instaling-bot.js version
```

Jeśli zmieniasz UI, dołącz zrzut ekranu. Jeśli zmieniasz statystyki lub przypomnienia,
opisz przetestowany scenariusz.

## Pull request

1. Zrób fork i branch, np. `fix/reminder-repeat`.
2. Opisz **co** i **dlaczego** zmieniasz.
3. Połącz issue lub discussion.
4. Dopilnuj zielonego CI.
5. Maintainer może squashować commity.

`master` jest chroniony. Pull requesty to normalna droga zmian; maintainer może ominąć
ochronę przy pilnych wydaniach.

## Commity

Krótki tryb rozkazujący, np.:

```text
Fix repeated reminder after midnight
Add CLI stats period filter
Document macOS Gatekeeper steps
```

Polski lub angielski — oba są w porządku.

## Wydania

Wydania robi maintainer, wypychając tag `vX.Y.Z` z `master`. Workflow buduje instalatory
i tworzy draft release. Nie twórz tagów wydania w pull requeście.

Więcej: [CONTRIBUTING.md](https://github.com/bmonekkk/instaling-bot/blob/master/CONTRIBUTING.md)

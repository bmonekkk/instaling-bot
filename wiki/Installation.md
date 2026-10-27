# 📥 Instalacja

## Desktop: Windows i macOS

Pobierz plik z [najnowszego wydania](https://github.com/bmonekkk/instaling-bot/releases/latest):

| System | Plik |
|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.2.1-setup-win64.exe` |
| macOS 13+ (Apple Silicon) | `instaling-bot-4.2.1-macos-arm64.pkg` |
| macOS 13+ (Intel) | `instaling-bot-4.2.1-macos-x64.pkg` |

Instalator zawiera Chrome for Testing — **nie trzeba instalować Node.js ani Chrome**.

### Instalatory są niepodpisane

To oczekiwane dla buildów bez certyfikatu code signing:

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację
  w **System Settings → Privacy & Security**.

Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, słówka,
statystyki i przypomnienia zostają w folderze danych.

## Mobile: Android i iOS

| System | Plik |
|---|---|
| Android 7+ | `instaling-bot-4.2.1-android.apk` |
| iOS 16+ (SideStore/AltStore) | `instaling-bot-4.2.1-ios.ipa` |
| Safari iOS / Firefox Android | `instaling-bot.user.js` |

APK instalujesz jak każdy plik spoza sklepu (zezwól na instalację z tego źródła). IPA jest
niepodpisana — podpisz ją własnym Apple ID w SideStore/AltStore; darmowe konto wymaga
odświeżenia co 7 dni. Najłatwiejsza droga na iPhone'a to Safari + rozszerzenie Userscripts
i plik `.user.js`.

Aplikacje mobilne nie zapisują hasła: logujesz się na `instaling.pl` w ich WebView.
Sesja działa tylko przy otwartej aplikacji lub karcie. Pełna instrukcja: [Mobile](Mobile).

## CLI: Linux, macOS i Windows

Wymagany jest **Node.js 22+** ([nodejs.org](https://nodejs.org/)).

### Jedna komenda

```bash
curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh | bash
```

Program trafia do `~/.local/share/instaling-bot`, a launcher `instaling-bot` do
`~/.local/bin`. Jeśli katalogu nie ma w `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Dodaj tę linię do `~/.zshrc` lub `~/.bashrc`. Ponowna instalacja zachowuje
`config/Config.json` i `SavedWords.json`.

### Ze źródeł

```bash
git clone https://github.com/bmonekkk/instaling-bot.git
cd instaling-bot
npm install --omit=dev
cp config/Config.defaults.json config/Config.json
```

Uzupełnij `config/Config.json`:

```json
"credentials": {
    "login": "twoj-login-lub-email",
    "password": "twoje-haslo"
}
```

Uruchom:

```bash
npm start
# lub po instalacji curl:
instaling-bot start
```

## Pierwsze uruchomienie

1. Wpisz login i hasło do InstaLing.
2. Ustaw `valid_chance` (domyślnie 80%) i opcjonalnie czasy pisania oraz klikania.
3. Naciśnij **Start** / uruchom `instaling-bot start`.
4. Bot otworzy Chrome, zaloguje się i zacznie odpowiadać.

Przed startem CLI sprawdza najnowsze wydanie. Aktualizacja: ponowny `curl` lub
`git pull && npm install --omit=dev`.

## Brak Chrome w CLI

Jeśli Puppeteer nie pobrał przeglądarki:

```bash
npx puppeteer browsers install chrome
```

Więcej: [CLI](CLI) · [Konfiguracja](Configuration) · [Problemy](Troubleshooting)

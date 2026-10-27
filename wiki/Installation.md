# 📥 Instalacja

## Desktop: Windows i macOS

Pobierz plik z [najnowszego wydania](https://github.com/bmonekkk/instaling-bot/releases/latest):

| System | Plik |
|---|---|
| Windows 10/11 (x64) | `instaling-bot-3.3.0-setup-win64.exe` |
| macOS 13+ (Apple Silicon) | `instaling-bot-3.3.0-macos-arm64.pkg` |
| macOS 13+ (Intel) | `instaling-bot-3.3.0-macos-x64.pkg` |

Instalator zawiera Chrome for Testing — **nie trzeba instalować Node.js ani Chrome**.

### Instalatory są niepodpisane

To oczekiwane dla buildów bez certyfikatu code signing:

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację
  w **System Settings → Privacy & Security**.

Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, słówka,
statystyki i przypomnienia zostają w folderze danych.

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
2. Ustaw `valid_chance` (domyślnie 80%) i `max_answers` (0 = bez limitu).
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

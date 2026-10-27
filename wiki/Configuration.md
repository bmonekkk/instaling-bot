# ⚙️ Konfiguracja

Wzór wszystkich opcji: [`config/Config.defaults.json`](https://github.com/bmonekkk/instaling-bot/blob/master/config/Config.defaults.json).
Desktop pokazuje najważniejsze opcje w GUI, ale pełny plik można edytować ręcznie.

## Pliki i foldery

### Desktop

| System | Folder danych |
|---|---|
| Windows | `%APPDATA%\instaling-bot` |
| macOS | `~/Library/Application Support/instaling-bot` |

### CLI

`config/` w katalogu projektu. Po instalacji `curl`: `~/.local/share/instaling-bot/config/`.

### Zawartość

```text
config/Config.json        ustawienia i dane logowania
config/SavedWords.json    zapamiętane tłumaczenia
stats.json                statystyki sesji (wspólne z CLI)
reminder-state.json       stan przypomnień
logs/last-run.log         log ostatniego uruchomienia
pages/                    diagnostyczne zrzuty HTML
screenshots/              diagnostyczne zrzuty ekranu
```

`Config.json`, `SavedWords.json`, `stats.json` i logi nie powinny trafiać do repozytorium.

## Najważniejsze opcje

| Opcja | Znaczenie |
|---|---|
| `credentials.login` / `password` | dane logowania do InstaLing |
| `valid_chance` | część poprawnych odpowiedzi, np. `0.8` = 80% |
| `max_answers` | limit odpowiedzi na sesję, `0` = bez limitu |
| `show_browser` | pokazuje okno Chrome; `false` na serwerze bez GUI |
| `mute_audio` | wycisza dźwięk przeglądarki |
| `window_width` / `window_height` | rozmiar okna Chrome |
| `debug` | dodatkowe logi i zrzuty stron |
| `reminder.enabled` | włącza przypomnienie |
| `reminder.time` | godzina `HH:MM`, domyślnie `17:00` |
| `reminder.repeat_minutes` | powtarzanie co N minut, `0` = raz dziennie |
| `background.run_in_tray` | zamykanie okna chowa aplikację do zasobnika |
| `background.start_at_login` | uruchamianie przy logowaniu systemu |

## Humanizacja pisania

- `delays.type_min` / `type_max` — opóźnienie na literę.
- `delays.type_pause_chance` — szansa na pauzę w trakcie pisania.
- `delays.typo_chance` — szansa na symulowaną literówkę z backspace.
- `delays.click_min` / `click_max` — opóźnienie po kliknięciu.
- `delays.quick_click_min` / `quick_click_max` — krótka pauza po nawigacji.

Więcej w [README → Konfiguracja](https://github.com/bmonekkk/instaling-bot#%EF%B8%8F-konfiguracja)
i [README → Humanizacja](https://github.com/bmonekkk/instaling-bot#-humanizacja-pisania).

## Prywatność

Bot działa lokalnie. Nie wysyła danych logowania ani słówek na żaden serwer. Dane trafiają
do plików w folderze aplikacji. Nie publikuj `Config.json` ani logów — usuń z nich dane
osobowe przed wklejeniem do issue.

Adres `sites.login` jest walidowany: musi wskazywać oficjalną stronę logowania `instaling.pl`
po HTTPS. Dzięki temu zmodyfikowany `Config.json` nie może przekierować loginu i hasła na obcą
stronę.

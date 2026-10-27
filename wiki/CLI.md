# ⌨️ CLI

CLI jest w pełni wspierane na Linuksie, macOS i Windows (terminal). Wymaga Node.js 22+.

## Instalacja

```bash
curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh | bash
```

Szczegóły: [Instalacja](Installation).

## Polecenia

```bash
instaling-bot help              # lista poleceń i opcji
instaling-bot start             # sprawdza aktualizacje, potem uruchamia sesję
instaling-bot                   # to samo co start
instaling-bot stats             # tydzień, miesiąc, rok i cały okres
instaling-bot stats --period month
instaling-bot stats --json      # wynik dla skryptów
instaling-bot remind            # przypomnienie o sesji w tle (Ctrl+C kończy)
instaling-bot update-check      # porównanie z najnowszym wydaniem
instaling-bot version
```

Po instalacji ze źródeł odpowiedniki to `npm start`, `npm run stats`, `npm run remind`
i `npm run update-check`.

## Aktualizacje przed startem

`instaling-bot start` **najpierw sprawdza najnowsze wydanie**. Jeśli dostępna jest nowsza
wersja, bot nie wystartuje i pokaże link do pobrania.

Świadome pominięcie:

```bash
instaling-bot start --skip-update-check
# lub
INSTALING_SKIP_UPDATE_CHECK=1 instaling-bot start
```

Gdy GitHub jest chwilowo niedostępny, CLI tylko ostrzega i kontynuuje.

## Statystyki

Każda sesja z co najmniej jedną odpowiedzią trafia do `stats.json`. CLI pokazuje sesje,
odpowiedzi, poprawne, błędne, skuteczność, nowe słówka i czas.

```bash
instaling-bot stats
instaling-bot stats --period week
instaling-bot stats --period year --json
```

`--period` przyjmuje `week`, `month`, `year` lub `all`. Statystyki są wspólne z aplikacją
desktopową.

## Przypomnienia

Ta sama sekcja `reminder` w `Config.json` steruje desktopem i CLI:

```bash
instaling-bot remind
```

Proces sprawdza co minutę, czy minęła wybrana godzina i czy dzisiejsza sesja nie została
odhaczona. Domyślnie powiadomienie wysyła się raz dziennie. `reminder.repeat_minutes`
(np. `30`) powtarza je co 30 minut, dopóki nie ukończysz sesji. Zatrzymanie: `Ctrl+C`.

## Aktualizacja CLI

```bash
curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh | bash
```

Ze źródeł:

```bash
git pull && npm install --omit=dev
```

Więcej: [Konfiguracja](Configuration) · [Problemy](Troubleshooting)

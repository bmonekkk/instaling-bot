# instaling-bot 3.3.0 — interfejs PL/EN, powiadomienia i bezpieczniejsza konfiguracja

Wersja 3.3.0 dodaje pełny interfejs polski/angielski, powiadomienie o zakończeniu sesji dla okna ukrytego lub zminimalizowanego oraz pierwszy etap bezpieczeństwa. Statystyki, przypomnienia i CLI z 3.2.x działają bez zmian.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-3.3.0-setup-win64.exe` | instalator NSIS, Chrome w zestawie |
| macOS 13+ (Apple Silicon) | `instaling-bot-3.3.0-macos-arm64.pkg` | Apple Silicon, Chrome w zestawie |
| macOS 13+ (Intel) | `instaling-bot-3.3.0-macos-x64.pkg` | procesory Intel, Chrome w zestawie |
| Linux / terminal | — | CLI: `curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh &#124; bash` |

Instalator desktopowy zawiera Chrome for Testing. **Nie trzeba instalować Node.js ani Chrome.**

## Co nowego

- **Pełny interfejs PL/EN.** Przełącznik na pasku menu tłumaczy ustawienia, dialogi błędów, statystyki, menu zasobnika i powiadomienia systemowe. Wybór zapisuje się jako `language` w `Config.json`. Logi silnika bota pozostają po polsku.
- **Powiadomienie o zakończeniu sesji.** Nowy przełącznik **Powiadamiaj o zakończeniu sesji** (config: `notifications.session_finished`, domyślnie `true`) pokazuje wynik lub błąd, gdy okno jest ukryte w zasobniku albo zminimalizowane. Widoczne okno nie generuje duplikatu.
- **Bezpieczeństwo, etap 1.** `Config.json` otrzymuje uprawnienia tylko dla właściciela: `600` na macOS/Linux i prywatną listę ACL na Windows. Hasła są maskowane w logach i powiadomieniach.
- **Dane logowania ze środowiska.** `INSTALING_LOGIN` i `INSTALING_PASSWORD` mają pierwszeństwo przed `Config.json`. Desktop pokazuje, które pola pochodzą ze środowiska, i blokuje ich przypadkową edycję.
- **SEO i strona projektu.** Uporządkowany tytuł i metadane, dane strukturalne `WebSite` oraz odświeżony `SoftwareApplication`, nowy `lastmod` mapy strony i ponowne zgłoszenie IndexNow.
- **Dokumentacja.** README, wiki i strona opisują interfejs PL/EN, powiadomienia, zmienne środowiskowe i zasady bezpieczeństwa.

## Instalatory są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane. Istniejące konfiguracje automatycznie otrzymają `notifications.session_finished: true`.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).

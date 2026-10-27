# ❓ FAQ

## Czy to jest oficjalne narzędzie InstaLing?

Nie. Projekt jest niezależny i nie jest powiązany z InstaLing ani z jego właścicielami.

## Czy mogę tego używać w szkole?

Projekt ma charakter **edukacyjny** — powstał jako ćwiczenie z automatyzacji przeglądarki.
Nie jest przeznaczony do oszukiwania w nauce ani do obchodzenia zasad szkoły. Automatyczne
korzystanie z serwisu może naruszać jego regulamin. Decyzja i odpowiedzialność należą do
Ciebie.

## Czy bot wysyła moje dane na jakiś serwer?

Nie. Bot działa lokalnie. Login, hasło, słówka i statystyki są zapisywane w plikach w folderze
aplikacji. Nie ma własnego backendu ani telemetrii.

## Gdzie są moje dane?

- **Windows:** `%APPDATA%\instaling-bot`
- **macOS:** `~/Library/Application Support/instaling-bot`
- **CLI:** `config/` w katalogu projektu lub `~/.local/share/instaling-bot`

Pliki: `Config.json`, `SavedWords.json`, `stats.json`, `reminder-state.json`, `logs/`,
`pages/`, `screenshots/`.

## Czy mogę używać wielu kont?

Tak, ale każde konto powinno mieć osobny folder danych lub osobny `Config.json`. Nie
uruchamiaj dwóch sesji na tym samym koncie jednocześnie.

## Dlaczego statystyki są puste?

`stats.json` powstaje po pierwszej sesji z co najmniej jedną odpowiedzią. Statystyki nie
są uzupełniane wstecz dla sesji sprzed aktualizacji.

## Dlaczego przypomnienie się nie pojawia?

- aplikacja musi działać (także w zasobniku),
- musi być po wybranej godzinie,
- dzisiejsza sesja nie może być jeszcze ukończona,
- przy `repeat_minutes` kolejne przypomnienie pojawi się po wybranym interwale.

## Czy aplikacja aktualizuje się sama?

Nie. Desktop pokazuje banner z linkiem do wydania, ale nie pobiera ani nie instaluje
aktualizacji automatycznie. CLI blokuje start nieaktualnej wersji, ale nie aktualizuje się
samo.

## Dlaczego instalatory są niepodpisane?

Projekt nie ma certyfikatu code signing. Windows SmartScreen i macOS Gatekeeper mogą
ostrzec przy pierwszym uruchomieniu. To oczekiwane; kod źródłowy jest publiczny.

## Jakie języki są obsługiwane?

Wszystkie języki dostępne na instaling.pl, m.in. angielski, niemiecki, francuski, włoski
i hiszpański. Interfejs aplikacji jest po polsku i angielsku (PL/EN w desktopie, APK, IPA
i userscripcie).

## Czy jest wersja desktopowa na Linuksa?

Nie. Na Linuksie działa CLI. Aplikacja desktopowa jest budowana dla Windows i macOS.

## Desktop: wyskakuje okno o Premium — czy to błąd?

Nie. Na części kont InstaLing w trakcie sesji pojawia się okno zachęcające do Premium lub
konta nauczyciela. To zachowanie strony, a nie bota. Zamknij je lub pomiń **ręcznie**
(kliknij w oknie Chrome). Jeśli wiesz, że to okno pojawia się na Twoim koncie, **nie
ukrywaj okna przeglądarki** w trakcie sesji — możesz użyć trybu zasobnika, ale wróć do
okna, gdy zauważysz, że sesja stoi.

## Gdzie zmienić ustawienia na telefonie?

- **Android / iOS (APK, IPA):** naciśnij **⚙** na górnym pasku. Zmienisz poprawność
  odpowiedzi, czasy pisania, godzinę przypomnienia i jego powtarzanie; wartości zapisują
  się od razu.
- **Userscript:** kliknij logo bota i rozwiń **Ustawienia** — poprawność, czasy pisania
  i autostart.

## Czy jest wersja na telefon?

Tak, od wersji 4.0.0. Na **Androidzie** najprościej użyć pliku APK. Na **iPhone** możesz
użyć userscriptu w Safari albo niepodpisanej IPA przez SideStore/AltStore. Chrome na
Androidzie nie obsługuje userscriptów — użyj Firefoksa z Tampermonkey lub Violentmonkey.
Szczegóły: [Mobile](Mobile).

## Czy aplikacja mobilna zapisuje moje hasło?

Nie. Logujesz się normalnie na `instaling.pl` w przeglądarce wbudowanej w aplikację, a bot
odpowiada w otwartej sesji. Aplikacje mobilne nie czytają `Config.json` i nie zapisują
poświadczeń — trzymają tylko zapamiętane słówka i ustawienia (WebView storage na Androidzie
i iOS, `GM_setValue` w userscripcie).

## Dlaczego bot mobilny zatrzymuje się w tle?

Telefon może wstrzymać WebView/kartę, gdy aplikacja jest w tle. Sesja działa tylko przy
otwartej aplikacji lub karcie. Przypomnienie o wybranej godzinie i tak przyjdzie — na
Androidzie przetrwa też restart telefonu.

## Gdzie mobilny bot trzyma dane?

- **Android / iOS (APK, IPA):** pamięć WebView w aplikacji — zapamiętane słówka i ustawienia.
- **Userscript:** `GM_setValue` (magazyn Tampermonkey/Violentmonkey/Userscripts).

Statystyki i `stats.json` to funkcja desktopu i CLI.

## Jak zgłosić błąd lub pomysł?

- **Błąd:** [Issues](https://github.com/bmonekkk/instaling-bot/issues) z szablonem.
- **Pomysł:** [Discussions → Ideas](https://github.com/bmonekkk/instaling-bot/discussions/categories/ideas).
- **Pytanie:** [Discussions → Q&A](https://github.com/bmonekkk/instaling-bot/discussions/categories/q-a).
- **Bezpieczeństwo:** [prywatny raport](https://github.com/bmonekkk/instaling-bot/security/advisories/new).

## Czy projekt przyjmuje pull requesty?

Tak! Zobacz [CONTRIBUTING.md](https://github.com/bmonekkk/instaling-bot/blob/master/CONTRIBUTING.md)
i [Współtworzenie](Contributing).

## Czy można wesprzeć projekt?

Tak, dobrowolnie przez [Ko-fi](https://ko-fi.com/H5P529J2VO). Wsparcie nie gwarantuje
konkretnych funkcji ani terminów.

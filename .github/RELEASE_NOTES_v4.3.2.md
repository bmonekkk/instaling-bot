# instaling-bot 4.3.2 — hasło desktopu w pęku kluczy systemu

Wydanie bezpieczeństwa 4.3.2 zmienia sposób przechowywania hasła w aplikacji desktopowej. `Config.json` nie zawiera już hasła jawnym tekstem — zostaje tylko `password_enc`, zaszyfrowany przez Electron `safeStorage`: **Keychain** na macOS, **DPAPI** na Windows i **libsecret/kwallet** na Linuksie. Istniejący jawny wpis jest migrowany automatycznie przy pierwszym uruchomieniu, więc nie trzeba nic wpisywać ponownie.

To wydanie dotyczy wyłącznie desktopu. Android, iOS i userscript nigdy nie zapisywały haseł — korzystają z normalnej, trwałej sesji strony — i pozostają bez zmian funkcjonalnych.

## Naprawione w 4.3.2

- **Hasło nie leży już w pliku jawnym tekstem.** `Config.json` przechowuje tylko zaszyfrowany blob `password_enc` i `password_scheme: safeStorage-v1`. Klucz dostarcza systemowy pęk kluczy użytkownika.
- **Automatyczna migracja.** Przy pierwszym uruchomieniu po aktualizacji bot znajduje stary wpis `credentials.password` (albo jeszcze starsze `login` / `password` na najwyższym poziomie), szyfruje go, usuwa jawną wartość i zapisuje plik ponownie. Ustawienia, słówka, statystyki i przypomnienia zostają zachowane.
- **Interfejs nie dostaje hasła.** Panel ustawień pokazuje „zapisane" i wysyła nową wartość tylko wtedy, gdy ją wpiszesz; puste pole oznacza „zachowaj obecne". Hasło nie trafia już do pamięci renderera.
- **Silnik dostaje dane na czas jednego przebiegu.** Główny proces odszyfrowuje hasło i przekazuje je procesowi potomnemu przez `INSTALING_LOGIN` / `INSTALING_PASSWORD`, które i tak mają pierwszeństwo przed plikiem.
- **Bezpieczny fallback.** Gdy systemowy pęk kluczy jest niedostępny (np. minimalny Linux bez libsecret), aplikacja zachowuje dotychczasowe zachowanie zamiast zgubić hasło. Gdy bloba nie da się odszyfrować — np. po resecie pęku albo skopiowaniu configu na inny komputer — bot czyści pole i prosi o hasło ponownie.
- **Ochrona pliku zostaje.** `chmod 600` / prywatna lista ACL na Windows nadal działa jako druga warstwa, obok szyfrowania.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.3.2-setup-win64.exe` | instalator NSIS |
| macOS 13+ (ARM64) | `instaling-bot-4.3.2-macos-arm64.pkg` | procesory Apple |
| macOS 13+ (Intel) | `instaling-bot-4.3.2-macos-x64.pkg` | procesory Intel |
| Android 7+ (uniwersalny) | `instaling-bot-4.3.2-android.apk` | APK, WebView |
| iPhone / iPad (iOS 16+) | `instaling-bot-4.3.2-ios.ipa` | SideStore/AltStore, bez podpisu |
| Safari iOS/iPadOS / Firefox Android | `instaling-bot.user.js` | userscript (4.3.2), aktualizuje się sam |
| Linux / terminal | — | CLI: `instaling-bot --help` |

> **Aktualizacja userscriptu (4.3.2).** Sam `instaling-bot.user.js` dostał wersję `4.3.2`, żeby menedżery skryptów pobrały nowy bundle. Aplikacja desktopowa, Android i iOS są w wersji `4.3.2`. Userscript aktualizuje się automatycznie przez `releases/latest/download/instaling-bot.user.js`.

Strona projektu sama wykrywa system (Windows, macOS ARM64/Intel, Android, iPhone, iPad, Linux), podświetla zalecaną wersję i jednym przyciskiem pobiera pasujący plik oraz przewija do instrukcji instalacji. Pozostałe opcje zostają dostępne.

## Co się zmienia po aktualizacji desktopu

1. Pobierz i uruchom nowy instalator dla swojego systemu.
2. Otwórz aplikację — jeśli wcześniej zapisano hasło jawnym tekstem, zostanie ono zaszyfrowane przy starcie.
3. W ustawieniach pole hasła będzie puste z podpisem „zapisane — pozostaw puste, aby zachować". Wpisz nowe hasło tylko wtedy, gdy chcesz je zmienić.
4. Jeśli system zapyta o dostęp do pęku kluczy, zezwól aplikacji — to standardowe zachowanie Keychain/DPAPI/libsecret.

## Wcześniejsze zmiany działają bez zmian

- **4.3.1:** aplikacja iOS nie crashuje na iOS 26, „Gotowe" to unoszący się przycisk, a Android ma kompaktowy wygląd i pasek stanu jak iOS.
- **4.3.0:** trzy losowe zakresy pauz — przed pisaniem, po błędzie lub nowym słówku i krótko po poprawnej odpowiedzi.
- Statystyki tydzień / miesiąc / rok / wszystko, przypomnienia z powtarzaniem i wspólny silnik na desktopie, Androidzie, iOS oraz w userscripcie zostają bez zmian.

## Ograniczenia mobilne

- Sesja działa tylko przy otwartej aplikacji lub karcie — telefon może wstrzymać WebView w tle.
- Brak trybu ukrytego i pracy w tle; zostaw aplikację na pierwszym planie.
- System limituje liczbę oczekujących powiadomień, więc iOS odbudowuje je przy każdym otwarciu aplikacji.
- Eksport słówek i praca w tle zostają w desktopie; mobile pokazują pełne statystyki tygodnia/miesiąca/roku.
- APK i IPA nie są w Play Store ani App Store.

## Instalatory desktopowe są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja desktopu polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).
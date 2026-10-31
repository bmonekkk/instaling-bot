# instaling-bot 4.3.3 — powiadomienia działają też na macOS

Wydanie poprawkowe 4.3.3 naprawia powiadomienia w aplikacji desktopowej na macOS. Natywne powiadomienia Electron korzystają z systemowego API `UNNotification`, które **odrzuca niepodpisane aplikacje** — `Notification.show()` kończyło się błędem (`UNErrorDomain` 1, `notificationsNotAllowed`), więc banner o końcu sesji nigdy się nie pojawiał, mimo że opcja była włączona. Instalatory są celowo niepodpisane (bez certyfikatu Apple), dlatego bot wykrywa ten błąd i wysyła komunikat awaryjną ścieżką przez `osascript`, którą system dostarcza.

Poprawka obejmuje **powiadomienie o końcu sesji** i **codzienne przypomnienie**. Windows i Linux działają bez zmian — tam natywne powiadomienia były sprawne od początku.

## Aktualizacja plików mobilnych (bez nowego wydania)

APK, IPA i userscript w tym wydaniu zostały przebudowane 2026-10-31, żeby dodać **wsparcie na Ko-fi**:

- **Android APK** i **iOS IPA** mają teraz przycisk **☕** w pasku tytułu (obok ⚙), który otwiera `https://ko-fi.com/bmonekkk`.
- **Userscript** ma drugi link na dole panelu: **☕ Wesprzyj projekt na Ko-fi** / **☕ Support on Ko-fi**. Jego wersja to `4.3.3.1`, więc menedżery skryptów pobiorą aktualizację automatycznie.
- Wersje aplikacji pozostają `4.3.3` (iOS 40303); to nadal to samo wydanie. Jeśli masz już zainstalowany APK/IPA 4.3.3, pobierz plik ponownie, żeby zobaczyć nowy przycisk.

## Naprawione w 4.3.3

- **Powiadomienia na macOS wreszcie się pokazują.** Gdy natywne API zwróci błąd, wiadomość jest wysyłana przez `osascript` (`display notification`). Banner pojawia się wtedy, gdy okno jest ukryte w zasobniku, zminimalizowane albo zamknięte — widoczne okno nadal nie dostaje duplikatu.
- **Przypomnienia też.** Codzienne przypomnienie o sesji korzysta z tej samej ścieżki, więc na macOS również jest widoczne.
- **Windows i Linux bez zmian.** Natywna ścieżka uruchamia się pierwsza; Windows nadal ustawia `AppUserModelId`, a podpisane buildy zachowują klikalne powiadomienie.
- **Bezpieczeństwo bez zmian.** Treść nadal przechodzi przez `redact()`, a `osascript` jest wywoływany bez powłoki, na stałej ścieżce `/usr/bin/osascript`.

## Pobierz

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 (x64) | `instaling-bot-4.3.3-setup-win64.exe` | instalator NSIS |
| macOS 13+ (ARM64) | `instaling-bot-4.3.3-macos-arm64.pkg` | procesory Apple |
| macOS 13+ (Intel) | `instaling-bot-4.3.3-macos-x64.pkg` | procesory Intel |
| Android 7+ (uniwersalny) | `instaling-bot-4.3.3-android.apk` | APK, WebView |
| iPhone / iPad (iOS 16+) | `instaling-bot-4.3.3-ios.ipa` | SideStore/AltStore, bez podpisu |
| Safari iOS/iPadOS / Firefox Android | `instaling-bot.user.js` | userscript (4.3.3.1), aktualizuje się sam |
| Linux / terminal | — | CLI: `instaling-bot --help` |

> **Aktualizacja userscriptu (4.3.3).** Sam `instaling-bot.user.js` dostał wersję `4.3.3`, żeby menedżery skryptów pobrały nowy bundle. Userscript aktualizuje się automatycznie przez `releases/latest/download/instaling-bot.user.js`.

## Co się zmienia po aktualizacji desktopu

1. Pobierz i uruchom nowy instalator dla swojego systemu.
2. Na macOS uruchom sesję i zwiń okno do zasobnika (albo zminimalizuj). Po zakończeniu sesji pojawi się powiadomienie z liczbą odpowiedzi.
3. Jeśli system zapyta o zgodę na powiadomienia od „Script Editor", zezwól — to nośnik awaryjnej ścieżki na niepodpisanych buildach.
4. Ustawienia, zapisane słówka, statystyki i hasło w pęku kluczy zostają zachowane.

## Wcześniejsze zmiany działają bez zmian

- **4.3.2:** hasło desktopu szyfrowane w pęku kluczy systemu (`safeStorage`) z automatyczną migracją starego jawnego wpisu.
- **4.3.1:** aplikacja iOS nie crashuje na iOS 26, „Gotowe" to unoszący się przycisk, a Android ma kompaktowy wygląd i pasek stanu jak iOS.
- **4.3.0:** trzy losowe zakresy pauz — przed pisaniem, po błędzie lub nowym słówku i krótko po poprawnej odpowiedzi.

## Ograniczenia mobilne

- Sesja działa tylko przy otwartej aplikacji lub karcie — telefon może wstrzymać WebView w tle.
- Brak trybu ukrytego i pracy w tle; zostaw aplikację na pierwszym planie.
- System limituje liczbę oczekujących powiadomień, więc iOS odbudowuje je przy każdym otwarciu aplikacji.
- APK i IPA nie są w Play Store ani App Store.

## Instalatory desktopowe są niepodpisane

- **Windows:** SmartScreen → **More info** → **Run anyway**.
- **macOS:** kliknij instalator prawym przyciskiem → **Open**, albo zatwierdź aplikację w **System Settings → Privacy & Security**.

Aktualizacja desktopu polega na pobraniu i uruchomieniu nowego instalatora. Ustawienia, zapisane słówka, przypomnienia i statystyki w folderze danych zostają zachowane.

## Pełna lista zmian

Zobacz [`CHANGELOG.md`](https://github.com/bmonekkk/instaling-bot/blob/master/CHANGELOG.md).
#!/usr/bin/env bash
# instaling-bot CLI installer.
#
#   curl -fsSL https://raw.githubusercontent.com/bmonekkk/instaling-bot/master/install.sh | bash
#
# Installs the CLI into ~/.local/share/instaling-bot and creates a launcher in
# ~/.local/bin. Override the locations with INSTALING_HOME and INSTALING_BIN.
# The desktop app is installed separately from the GitHub releases page.

set -euo pipefail

REPOSITORY="bmonekkk/instaling-bot"
BRANCH="${INSTALING_BRANCH:-master}"
ARCHIVE="https://github.com/${REPOSITORY}/archive/refs/heads/${BRANCH}.tar.gz"
INSTALL_DIR="${INSTALING_HOME:-$HOME/.local/share/instaling-bot}"
BIN_DIR="${INSTALING_BIN:-$HOME/.local/bin}"
LAUNCHER="$BIN_DIR/instaling-bot"

say() {
    printf '%s\n' "$*"
}

fail() {
    printf 'Błąd: %s\n' "$*" >&2
    exit 1
}

command -v node >/dev/null 2>&1 || fail "nie znaleziono Node.js. Zainstaluj Node.js 22+ z https://nodejs.org/"
command -v npm >/dev/null 2>&1 || fail "nie znaleziono npm. Zainstaluj Node.js 22+ z https://nodejs.org/"
command -v curl >/dev/null 2>&1 || fail "nie znaleziono curl."
command -v tar >/dev/null 2>&1 || fail "nie znaleziono tar."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
    fail "wymagany jest Node.js 22 lub nowszy (masz $(node --version))."
fi

say "instaling-bot — instalacja CLI"
say "  katalog:  $INSTALL_DIR"
say "  launcher: $LAUNCHER"
say ""

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/instaling-bot.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

say "Pobieranie źródeł ($BRANCH)..."
curl -fsSL "$ARCHIVE" | tar -xz -C "$TMP_DIR" --strip-components=1

mkdir -p "$INSTALL_DIR" "$BIN_DIR"
# Keep an existing Config.json and SavedWords.json: the archive only contains
# the *.defaults.json templates.
cp -R "$TMP_DIR/." "$INSTALL_DIR/"

say "Instalowanie zależności (bez Electrona)..."
(
    cd "$INSTALL_DIR"
    npm install --omit=dev --no-fund --no-audit
)

if [ ! -f "$INSTALL_DIR/config/Config.json" ]; then
    cp "$INSTALL_DIR/config/Config.defaults.json" "$INSTALL_DIR/config/Config.json"
    say "Utworzono config/Config.json — wpisz w nim login i hasło."
fi

cat > "$LAUNCHER" <<EOF
#!/usr/bin/env sh
exec node "$INSTALL_DIR/bin/instaling-bot.js" "\$@"
EOF
chmod +x "$LAUNCHER"

say ""
say "Gotowe. Uruchom:"
say "  instaling-bot help"
say "  instaling-bot start"
say ""
say "Konfiguracja: $INSTALL_DIR/config/Config.json"
say "Statystyki:   instaling-bot stats"
say ""
case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *)
        say "Uwaga: $BIN_DIR nie jest w PATH. Dodaj do ~/.zshrc lub ~/.bashrc:"
        say "  export PATH=\"$BIN_DIR:\$PATH\""
        ;;
esac

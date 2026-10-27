#!/usr/bin/env bash
# Sync the wiki/ directory to the GitHub wiki repository.
#
# Usage:
#   scripts/sync-wiki.sh [owner/repo]
#
# The wiki must already be initialized in the GitHub UI. GitHub does not expose
# an API to create the first wiki page, so the first visit must be manual:
#   https://github.com/bmonekkk/instaling-bot/wiki
# Click "Create the first page", save anything, then run this script.

set -euo pipefail

REPO="${1:-bmonekkk/instaling-bot}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/wiki"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/instaling-wiki.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

if [ ! -d "$SOURCE" ]; then
    echo "Wiki source not found: $SOURCE" >&2
    exit 1
fi

if ! git clone --quiet "https://github.com/${REPO}.wiki.git" "$WORK/repo" 2>/dev/null; then
    echo "Wiki repository does not exist yet."
    echo "Open https://github.com/${REPO}/wiki, create the first page, then rerun this script."
    exit 1
fi

# Replace the wiki contents with our source, keeping .git intact.
find "$WORK/repo" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$SOURCE/." "$WORK/repo/"

cd "$WORK/repo"
git add -A
if git diff --cached --quiet; then
    echo "Wiki is already up to date."
    exit 0
fi

git -c user.name="instaling-bot" \
    -c user.email="bmonekkk@users.noreply.github.com" \
    commit -m "Sync wiki from repository"
git push
echo "Wiki updated: https://github.com/${REPO}/wiki"

#!/usr/bin/env bash
# Submit the project page to IndexNow (Bing, Yandex, Seznam, Naver and other
# IndexNow participants). Google does not use IndexNow; submit the sitemap in
# Google Search Console instead.
#
# Usage:
#   scripts/submit-indexnow.sh [url ...]
#
# The key file lives in docs/<key>.txt and must be deployed before this runs.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="bmonekkk.github.io"
SITE="https://${HOST}/instaling-bot"

KEY_NAME="$(find "$ROOT/docs" -maxdepth 1 -type f -name '*.txt' -exec basename {} .txt \; \
    | grep -E '^[0-9a-f]{32}$' | head -n 1 || true)"

if [ -z "$KEY_NAME" ]; then
    echo "IndexNow key file not found in docs/ (expected a 32-character hex name)." >&2
    exit 1
fi

KEY="$(cat "$ROOT/docs/${KEY_NAME}.txt")"
KEY_LOCATION="${SITE}/${KEY_NAME}.txt"

if [ "$#" -gt 0 ]; then
    URLS=("$@")
else
    URLS=("${SITE}/")
fi

URL_JSON="$(printf '"%s",' "${URLS[@]}")"
URL_JSON="[${URL_JSON%,}]"

PAYLOAD="$(printf '{"host":"%s","key":"%s","keyLocation":"%s","urlList":%s}' \
    "$HOST" "$KEY" "$KEY_LOCATION" "$URL_JSON")"

echo "Key file:  $KEY_LOCATION"
echo "Submitting: ${URLS[*]}"

STATUS="$(curl -sS -o /tmp/indexnow-response.txt -w '%{http_code}' \
    -X POST 'https://api.indexnow.org/indexnow' \
    -H 'Content-Type: application/json; charset=utf-8' \
    --data "$PAYLOAD")"

echo "HTTP $STATUS"
cat /tmp/indexnow-response.txt 2>/dev/null || true

case "$STATUS" in
    200|202) echo "IndexNow accepted the submission." ;;
    *) echo "IndexNow returned HTTP $STATUS — check the key file deployment." >&2; exit 1 ;;
esac

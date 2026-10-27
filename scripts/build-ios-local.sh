#!/usr/bin/env bash
# Builds an unsigned iOS .ipa locally with Xcode, mirroring the CI "iOS IPA" job
# in .github/workflows/release.yml. Use it to test iOS changes without waiting
# for GitHub Actions.
#
# Prerequisites:
#   - Xcode (from the App Store) — no sudo needed; this script sets DEVELOPER_DIR
#   - xcodegen      (brew install xcodegen)
#   - Node + npm deps (npm ci)
#
# Usage:
#   ./scripts/build-ios-local.sh
#
# Output: release-assets/instaling-bot-<version>-ios.ipa

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# 1. Locate Xcode without sudo. We never run "xcode-select -s" (that needs a
#    password); instead we point DEVELOPER_DIR straight at Xcode.app.
if [[ -z "${DEVELOPER_DIR:-}" ]]; then
    if [[ -d /Applications/Xcode.app ]]; then
        export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
    else
        XCODE_APP="$(ls -d /Applications/Xcode*.app 2>/dev/null | head -1 || true)"
        if [[ -n "$XCODE_APP" ]]; then
            export DEVELOPER_DIR="$XCODE_APP/Contents/Developer"
        fi
    fi
fi

if ! command -v xcodebuild >/dev/null 2>&1 || ! xcodebuild -version >/dev/null 2>&1; then
    echo "error: Xcode not found or not selected." >&2
    echo "Install Xcode from the App Store, then re-run this script." >&2
    exit 1
fi

echo "Using $(xcodebuild -version | head -1)  (DEVELOPER_DIR=${DEVELOPER_DIR:-<default>})"

command -v xcodegen >/dev/null 2>&1 || {
    echo "error: xcodegen missing. Install it with: brew install xcodegen" >&2
    exit 1
}

# 2. Refresh the shared engine bundle and regenerate the Xcode project.
npm run build:mobile
(cd mobile/ios && xcodegen generate)

# 3. Build the unsigned app (same flags as CI).
(cd mobile/ios && xcodebuild \
    -project InstalingBot.xcodeproj \
    -scheme InstalingBot \
    -configuration Release \
    -sdk iphoneos \
    -destination 'generic/platform=iOS' \
    -derivedDataPath build \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY="" \
    ONLY_ACTIVE_ARCH=NO \
    build)

# 4. Package the .ipa for SideStore/AltStore.
VERSION="$(node -p "require('./package.json').version")"
APP="mobile/ios/build/Build/Products/Release-iphoneos/InstalingBot.app"
rm -rf mobile/ios/build/Payload
mkdir -p mobile/ios/build/Payload release-assets
cp -R "$APP" mobile/ios/build/Payload/
(cd mobile/ios/build && zip -qry "instaling-bot-${VERSION}-ios.ipa" Payload)
mv "mobile/ios/build/instaling-bot-${VERSION}-ios.ipa" release-assets/

echo "Built release-assets/instaling-bot-${VERSION}-ios.ipa"

#!/usr/bin/env python3
"""Generates the app icon PNGs for the mobile shells without external deps.

Run from the repository root: python3 scripts/generate-icons.py
"""

import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IOS_ICON = os.path.join(ROOT, "mobile/ios/InstalingBot/Resources/Assets.xcassets/AppIcon.appiconset")
IOS_ICONSET = os.path.join(IOS_ICON, "Contents.json")
ANDROID_RES = os.path.join(ROOT, "mobile/android/app/src/main/res")
ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

DARK = (17, 24, 39)
GREEN = (22, 101, 52)
LIGHT = (220, 252, 231)
ACCENT = (34, 197, 94)


def blend(base, top, alpha):
    return tuple(round(b + (t - b) * alpha) for b, t in zip(base, top))


def pixel(x, y, size):
    cx = cy = size / 2
    dx, dy = x - cx, y - cy
    radius = size * 0.46
    if dx * dx + dy * dy > radius * radius:
        return DARK

    color = GREEN
    # Rounded card.
    left, right = size * 0.24, size * 0.76
    top, bottom = size * 0.32, size * 0.70
    corner = size * 0.06
    if left <= x <= right and top <= y <= bottom:
        inset_x = min(x - left, right - x)
        inset_y = min(y - top, bottom - y)
        if inset_x >= corner or inset_y >= corner or (
            (corner - inset_x) ** 2 + (corner - inset_y) ** 2 <= corner * corner
        ):
            color = LIGHT

    # Eyes and smile on the card.
    for eye_x in (0.39, 0.61):
        ex, ey = size * eye_x, size * 0.47
        if (x - ex) ** 2 + (y - ey) ** 2 <= (size * 0.035) ** 2:
            color = GREEN
    smile_y = size * 0.57
    if abs(y - smile_y) <= size * 0.018 and size * 0.42 <= x <= size * 0.58:
        color = GREEN

    # Soft highlight in the corner.
    highlight = math.hypot(x - size * 0.30, y - size * 0.22)
    if highlight < size * 0.16:
        color = blend(color, ACCENT, 0.22)

    # Anti-aliased edge.
    edge = radius - math.hypot(dx, dy)
    if edge < 2:
        color = blend(DARK, color, max(0.0, edge / 2))
    return color


def write_png(path, size):
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            row.extend((*pixel(x + 0.5, y + 0.5, size), 255))
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(name, payload):
        body = name + payload
        return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    # AAPT2 on macOS crashes on PNGs without an sRGB chunk; it is also good
    # practice for consistent colours on Android and iOS.
    png += chunk(b"sRGB", b"\x00")
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as handle:
        handle.write(png)


def main():
    os.makedirs(IOS_ICON, exist_ok=True)
    write_png(os.path.join(IOS_ICON, "icon-1024.png"), 1024)

    with open(IOS_ICONSET, "w", encoding="utf-8") as handle:
        handle.write("""{
  "images": [
    {
      "filename": "icon-1024.png",
      "idiom": "universal",
      "platform": "ios",
      "size": "1024x1024"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
}
""")

    print("wrote", os.path.relpath(IOS_ICON, ROOT))

    for folder, size in ANDROID_SIZES.items():
        target = os.path.join(ANDROID_RES, folder)
        os.makedirs(target, exist_ok=True)
        write_png(os.path.join(target, "ic_launcher.png"), size)
        print("wrote", os.path.relpath(target, ROOT))


if __name__ == "__main__":
    main()

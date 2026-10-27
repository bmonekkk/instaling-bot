#!/usr/bin/env python3
"""Generates every raster app icon from the project's official icon.

`build/icon.png` is the single source of truth (the desktop icon, the same mark
as docs/favicon.svg). This script derives the Android mipmaps, the iOS app
icon, the website PNG favicons and the userscript bubble icon from it, so all
platforms and the website show exactly the same artwork. Pure Python, no deps.

Run from the repository root: python3 scripts/generate-icons.py
"""

import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "build", "icon.png")
IOS_ICON = os.path.join(ROOT, "mobile/ios/InstalingBot/Resources/Assets.xcassets/AppIcon.appiconset")
IOS_ICONSET = os.path.join(IOS_ICON, "Contents.json")
ANDROID_RES = os.path.join(ROOT, "mobile/android/app/src/main/res")
DOCS = os.path.join(ROOT, "docs")
USERSCRIPT_ICON = os.path.join(ROOT, "mobile/userscript/icon.png")

ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


# --------------------------------------------------------------------- read

def read_png(path):
    """Decodes an 8-bit non-interlaced PNG into (width, height, RGBA bytes)."""
    with open(path, "rb") as handle:
        data = handle.read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")

    pos = 8
    width = height = depth = color = interlace = None
    idat = bytearray()
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos:pos + 4])
        name = data[pos + 4:pos + 8]
        payload = data[pos + 8:pos + 8 + length]
        pos += 12 + length
        if name == b"IHDR":
            width, height, depth, color, _, _, interlace = struct.unpack(">IIBBBBB", payload)
        elif name == b"IDAT":
            idat += payload
        elif name == b"IEND":
            break

    if depth != 8 or interlace != 0 or color not in (2, 6):
        raise ValueError(f"unsupported PNG format (depth={depth}, color={color}, interlace={interlace})")

    channels = 4 if color == 6 else 3
    raw = zlib.decompress(bytes(idat))
    stride = width * channels
    out = bytearray(width * height * 4)
    previous = bytearray(stride)
    offset = 0
    for y in range(height):
        filt = raw[offset]
        offset += 1
        line = bytearray(raw[offset:offset + stride])
        offset += stride
        if filt == 1:
            for i in range(channels, stride):
                line[i] = (line[i] + line[i - channels]) & 0xFF
        elif filt == 2:
            for i in range(stride):
                line[i] = (line[i] + previous[i]) & 0xFF
        elif filt == 3:
            for i in range(stride):
                left = line[i - channels] if i >= channels else 0
                line[i] = (line[i] + ((left + previous[i]) >> 1)) & 0xFF
        elif filt == 4:
            for i in range(stride):
                left = line[i - channels] if i >= channels else 0
                up = previous[i]
                upleft = previous[i - channels] if i >= channels else 0
                pa, pb, pc = abs(up - upleft), abs(left - upleft), abs(left + up - 2 * upleft)
                if pa <= pb and pa <= pc:
                    pred = up
                elif pb <= pc:
                    pred = left
                else:
                    pred = upleft
                line[i] = (line[i] + pred) & 0xFF
        elif filt != 0:
            raise ValueError(f"unknown PNG filter {filt}")

        base = y * width * 4
        for x in range(width):
            src = x * channels
            dst = base + x * 4
            out[dst] = line[src]
            out[dst + 1] = line[src + 1]
            out[dst + 2] = line[src + 2]
            out[dst + 3] = line[src + 3] if channels == 4 else 255
        previous = line

    return width, height, out


# ------------------------------------------------------------------ resize

def _sample(pixels, width, height, xs, ys):
    """Average of the source pixels inside the fractional rectangle (xs, ys)."""
    x0, x1 = xs
    y0, y1 = ys
    xa, xb = max(0, int(x0)), min(width, int(x1 + 0.999999))
    ya, yb = max(0, int(y0)), min(height, int(y1 + 0.999999))
    if xa >= xb or ya >= yb:
        return (0, 0, 0, 0)
    total = [0.0, 0.0, 0.0, 0.0]
    weight = 0.0
    for y in range(ya, yb):
        wy = min(y + 1, y1) - max(y, y0)
        if wy <= 0:
            continue
        row = y * width * 4
        for x in range(xa, xb):
            wx = min(x + 1, x1) - max(x, x0)
            if wx <= 0:
                continue
            w = wx * wy
            idx = row + x * 4
            total[0] += pixels[idx] * w
            total[1] += pixels[idx + 1] * w
            total[2] += pixels[idx + 2] * w
            total[3] += pixels[idx + 3] * w
            weight += w
    if weight == 0:
        return (0, 0, 0, 0)
    return tuple(total[i] / weight for i in range(4))


def _bilinear(pixels, width, height, x, y):
    x = min(max(x, 0), width - 1)
    y = min(max(y, 0), height - 1)
    x0, y0 = int(x), int(y)
    x1, y1 = min(x0 + 1, width - 1), min(y0 + 1, height - 1)
    fx, fy = x - x0, y - y0
    out = [0.0, 0.0, 0.0, 0.0]
    for cx, wx in ((x0, 1 - fx), (x1, fx)):
        for cy, wy in ((y0, 1 - fy), (y1, fy)):
            w = wx * wy
            idx = (cy * width + cx) * 4
            for c in range(4):
                out[c] += pixels[idx + c] * w
    return tuple(out)


def resize(pixels, width, height, size):
    out = bytearray(size * size * 4)
    scale = width / size
    for dy in range(size):
        for dx in range(size):
            if scale >= 1:
                r, g, b, a = _sample(
                    pixels, width, height,
                    (dx * scale, (dx + 1) * scale),
                    (dy * scale, (dy + 1) * scale)
                )
            else:
                cx = (dx + 0.5) / size * width - 0.5
                cy = (dy + 0.5) / size * height - 0.5
                r, g, b, a = _bilinear(pixels, width, height, cx, cy)
            idx = (dy * size + dx) * 4
            out[idx] = round(min(255, max(0, r)))
            out[idx + 1] = round(min(255, max(0, g)))
            out[idx + 2] = round(min(255, max(0, b)))
            out[idx + 3] = round(min(255, max(0, a)))
    return out


# ------------------------------------------------------------------- write

def _chunk(name, payload):
    body = name + payload
    return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def encode_png(size, rgba):
    rows = []
    stride = size * 4
    for y in range(size):
        rows.append(b"\x00" + bytes(rgba[y * stride:(y + 1) * stride]))
    png = b"\x89PNG\r\n\x1a\n"
    png += _chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    # AAPT2 on macOS crashes on PNGs without an sRGB chunk; it is also good
    # practice for consistent colours on Android and iOS.
    png += _chunk(b"sRGB", b"\x00")
    png += _chunk(b"IDAT", zlib.compress(b"".join(rows), 9))
    png += _chunk(b"IEND", b"")
    return png


def write_png(path, size, pixels):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as handle:
        handle.write(encode_png(size, pixels))


def write_ico(path, entries):
    """entries: list of (size, rgba). Stores PNG payloads inside the ICO."""
    images = [(size, encode_png(size, rgba)) for size, rgba in entries]
    header = struct.pack("<HHH", 0, 1, len(images))
    offset = 6 + 16 * len(images)
    directory = bytearray()
    blob = bytearray()
    for size, png in images:
        dim = 0 if size >= 256 else size
        directory += struct.pack("<BBBBHHII", dim, dim, 0, 0, 1, 32, len(png), offset)
        blob += png
        offset += len(png)
    with open(path, "wb") as handle:
        handle.write(header + bytes(directory) + bytes(blob))


IOS_CONTENTS = """{
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
"""


def main():
    src_w, src_h, src = read_png(SOURCE)
    print(f"source {os.path.relpath(SOURCE, ROOT)} ({src_w}x{src_h})")

    cache = {}

    def render(size):
        if size not in cache:
            cache[size] = resize(src, src_w, src_h, size)
        return cache[size]

    os.makedirs(IOS_ICON, exist_ok=True)
    write_png(os.path.join(IOS_ICON, "icon-1024.png"), 1024, render(1024))
    with open(IOS_ICONSET, "w", encoding="utf-8") as handle:
        handle.write(IOS_CONTENTS)
    print("wrote", os.path.relpath(IOS_ICON, ROOT))

    for folder, size in ANDROID_SIZES.items():
        target = os.path.join(ANDROID_RES, folder)
        write_png(os.path.join(target, "ic_launcher.png"), size, render(size))
        print("wrote", os.path.relpath(target, ROOT))

    write_png(os.path.join(DOCS, "favicon-32.png"), 32, render(32))
    write_png(os.path.join(DOCS, "favicon-96.png"), 96, render(96))
    write_png(os.path.join(DOCS, "apple-touch-icon.png"), 180, render(180))
    write_ico(
        os.path.join(DOCS, "favicon.ico"),
        [(16, render(16)), (32, render(32)), (48, render(48))]
    )
    print("wrote", os.path.relpath(os.path.join(DOCS, "favicon.ico"), ROOT))

    write_png(USERSCRIPT_ICON, 96, render(96))
    print("wrote", os.path.relpath(USERSCRIPT_ICON, ROOT))


if __name__ == "__main__":
    main()

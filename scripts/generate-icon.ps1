Add-Type -AssemblyName System.Drawing

$size = 512
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

function New-RoundPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

# Desktop background.
$bgRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, [System.Drawing.Color]::FromArgb(255, 6, 15, 30), [System.Drawing.Color]::FromArgb(255, 18, 50, 76), 90.0)
$g.FillRectangle($bgBrush, $bgRect)
$bgBrush.Dispose()

$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 56, 189, 248), 2)
for ($i = 0; $i -le $size; $i += 32) {
    $g.DrawLine($gridPen, $i, 0, $i, $size)
    $g.DrawLine($gridPen, 0, $i, $size, $i)
}
$gridPen.Dispose()

$glow = New-Object System.Drawing.Drawing2D.GraphicsPath
$glow.AddEllipse(-80, -120, 672, 672)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glow)
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(52, 56, 189, 248)
$glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 56, 189, 248))
$g.FillPath($glowBrush, $glow)
$glowBrush.Dispose()
$glow.Dispose()

# Window shadow.
$shadow = New-RoundPath 70 82 392 356 10
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(130, 0, 0, 0))
$g.FillPath($shadowBrush, $shadow)
$shadowBrush.Dispose()
$shadow.Dispose()

# Window body.
$win = New-RoundPath 56 68 400 356 8
$winBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 192, 192, 192))
$g.FillPath($winBrush, $win)
$winBrush.Dispose()

$winPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 0, 0, 0), 6)
$g.DrawPath($winPen, $win)
$winPen.Dispose()
$win.Dispose()

# Window title bar.
$titlePath = New-RoundPath 68 80 376 48 4
$titleRect = New-Object System.Drawing.Rectangle(68, 80, 376, 48)
$titleBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($titleRect, [System.Drawing.Color]::FromArgb(255, 0, 0, 128), [System.Drawing.Color]::FromArgb(255, 56, 189, 248), 0.0)
$g.FillPath($titleBrush, $titlePath)
$titleBrush.Dispose()
$titlePath.Dispose()

$titleFont = New-Object System.Drawing.Font("Tahoma", 21, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$titleBrushText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString("instaling-bot", $titleFont, $titleBrushText, 108, 92)
$titleBrushText.Dispose()
$titleFont.Dispose()

# Window control buttons.
$buttonBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 192, 192, 192))
$buttonPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 40, 40, 40), 3)
foreach ($x in 354, 382, 410) {
    $g.FillRectangle($buttonBrush, $x, 90, 22, 22)
    $g.DrawRectangle($buttonPen, $x, 90, 22, 22)
}
$buttonPen.Dispose()

$glyphPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 0, 0, 0), 3)
$g.DrawLine($glyphPen, 359, 102, 368, 102)
$g.DrawRectangle($glyphPen, 387, 96, 11, 10)
$g.DrawLine($glyphPen, 414, 95, 426, 107)
$g.DrawLine($glyphPen, 426, 95, 414, 107)
$glyphPen.Dispose()

# Screen.
$screen = New-RoundPath 84 146 344 206 6
$screenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 7, 17, 31))
$g.FillPath($screenBrush, $screen)
$screenBrush.Dispose()

$screenPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 56, 189, 248), 4)
$g.DrawPath($screenPen, $screen)
$screenPen.Dispose()
$screen.Dispose()

# Scanlines.
$scanPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(22, 56, 189, 248), 2)
for ($y = 156; $y -lt 348; $y += 16) {
    $g.DrawLine($scanPen, 92, $y, 420, $y)
}
$scanPen.Dispose()

# Robot antenna.
$antennaPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 56, 189, 248), 6)
$g.DrawLine($antennaPen, 256, 164, 256, 190)
$antennaPen.Dispose()
$antennaBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
$g.FillEllipse($antennaBrush, 244, 154, 24, 24)
$antennaBrush.Dispose()

# Robot ears.
$earBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 120, 130, 145))
$earPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 20, 28, 40), 5)
$g.FillRectangle($earBrush, 142, 236, 26, 64)
$g.DrawRectangle($earPen, 142, 236, 26, 64)
$g.FillRectangle($earBrush, 344, 236, 26, 64)
$g.DrawRectangle($earPen, 344, 236, 26, 64)
$earBrush.Dispose()
$earPen.Dispose()

# Robot head.
$head = New-RoundPath 164 194 184 138 22
$headBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Rectangle(164, 194, 184, 138)), [System.Drawing.Color]::FromArgb(255, 226, 232, 240), [System.Drawing.Color]::FromArgb(255, 148, 163, 184), 90.0)
$g.FillPath($headBrush, $head)
$headBrush.Dispose()
$headPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 15, 23, 42), 6)
$g.DrawPath($headPen, $head)
$headPen.Dispose()
$head.Dispose()

# Eyes.
$eyeGlow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(70, 56, 189, 248))
$g.FillEllipse($eyeGlow, 186, 224, 58, 42)
$g.FillEllipse($eyeGlow, 268, 224, 58, 42)
$eyeGlow.Dispose()
$eyeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
$g.FillEllipse($eyeBrush, 198, 232, 34, 26)
$g.FillEllipse($eyeBrush, 280, 232, 34, 26)
$eyeBrush.Dispose()
$pupilBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 7, 17, 31))
$g.FillEllipse($pupilBrush, 209, 238, 12, 14)
$g.FillEllipse($pupilBrush, 291, 238, 12, 14)
$pupilBrush.Dispose()

# Smile.
$smilePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 15, 23, 42), 5)
$g.DrawArc($smilePen, 218, 270, 76, 42, 10, 160)
$smilePen.Dispose()

# Chest / status strip.
$stripBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 51, 65, 85))
$g.FillRectangle($stripBrush, 84, 368, 344, 34)
$stripBrush.Dispose()
$stripPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 0, 0, 0), 3)
$g.DrawRectangle($stripPen, 84, 368, 344, 34)
$stripPen.Dispose()

$statusBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
$g.FillEllipse($statusBrush, 98, 378, 14, 14)
$statusBrush.Dispose()

$statusFont = New-Object System.Drawing.Font("Consolas", 17, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$statusTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 232, 240))
$g.DrawString("READY", $statusFont, $statusTextBrush, 122, 375)
$statusTextBrush.Dispose()
$statusFont.Dispose()

# Little dialog button.
$okPath = New-RoundPath 332 372 80 26 4
$okBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 192, 192, 192))
$g.FillPath($okBrush, $okPath)
$okBrush.Dispose()
$okPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 0, 0, 0), 3)
$g.DrawPath($okPen, $okPath)
$okPen.Dispose()
$okPath.Dispose()

$okFont = New-Object System.Drawing.Font("Tahoma", 15, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$okTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
$g.DrawString("OK", $okFont, $okTextBrush, 363, 377)
$okTextBrush.Dispose()
$okFont.Dispose()

$buttonBrush.Dispose()

$out = Join-Path $PSScriptRoot "..\build\icon.png"
$full = [System.IO.Path]::GetFullPath($out)
New-Item -ItemType Directory -Path (Split-Path $full) -Force | Out-Null
$g.Dispose()
$bmp.Save($full, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Icon written to $full"

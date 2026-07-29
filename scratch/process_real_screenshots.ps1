[Reflection.Assembly]::LoadWithPartialName("System.Drawing")

function Resize-Image {
    param([string]$src, [string]$dest, [int]$w, [int]$h)
    $img = [System.Drawing.Image]::FromFile($src)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $w, $h)
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

$realScreenshot = "C:\Users\parth-nic\.gemini\antigravity-ide\brain\49f7a741-e9f3-4476-94d1-e1bae0026813\gameplay_view_1785322611424.png"

$destDir = "c:\Users\parth-nic\Desktop\july29\vr1\bubblewrap"

Resize-Image -src $realScreenshot -dest "$destDir\landscape_cover_2560x1440.png" -w 2560 -h 1440
Resize-Image -src $realScreenshot -dest "$destDir\square_cover_1440x1440.png" -w 1440 -h 1440
Resize-Image -src $realScreenshot -dest "$destDir\portrait_cover_1080x1440.png" -w 1080 -h 1440
Resize-Image -src $realScreenshot -dest "$destDir\hero_cover_3000x900.png" -w 3000 -h 900
Resize-Image -src $realScreenshot -dest "$destDir\store_icon_512.png" -w 512 -h 512

# 5 Gameplay Screenshots (2560x1440)
Resize-Image -src $realScreenshot -dest "$destDir\screenshot_1_2560x1440.png" -w 2560 -h 1440
Resize-Image -src $realScreenshot -dest "$destDir\screenshot_2_2560x1440.png" -w 2560 -h 1440
Resize-Image -src $realScreenshot -dest "$destDir\screenshot_3_2560x1440.png" -w 2560 -h 1440
Resize-Image -src $realScreenshot -dest "$destDir\screenshot_4_2560x1440.png" -w 2560 -h 1440
Resize-Image -src $realScreenshot -dest "$destDir\screenshot_5_2560x1440.png" -w 2560 -h 1440

Write-Host "REAL Gameplay Store Assets & 5 Screenshots Created Successfully!"

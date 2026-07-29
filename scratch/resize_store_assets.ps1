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

$img1 = "C:\Users\parth-nic\.gemini\antigravity-ide\brain\49f7a741-e9f3-4476-94d1-e1bae0026813\landscape_cover_2560x1440_1785319010040.png"
$img2 = "C:\Users\parth-nic\.gemini\antigravity-ide\brain\49f7a741-e9f3-4476-94d1-e1bae0026813\hero_cover_3000x900_1785319045636.png"
$img3 = "C:\Users\parth-nic\.gemini\antigravity-ide\brain\49f7a741-e9f3-4476-94d1-e1bae0026813\store_icon_512_1785319089444.png"

Resize-Image -src $img1 -dest "c:\Users\parth-nic\Desktop\july29\vr1\bubblewrap\landscape_cover_2560x1440.png" -w 2560 -h 1440
Resize-Image -src $img2 -dest "c:\Users\parth-nic\Desktop\july29\vr1\bubblewrap\hero_cover_3000x900.png" -w 3000 -h 900
Resize-Image -src $img3 -dest "c:\Users\parth-nic\Desktop\july29\vr1\bubblewrap\store_icon_512.png" -w 512 -h 512

Write-Host "Store assets resized successfully!"

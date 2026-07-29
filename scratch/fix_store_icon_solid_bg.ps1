[Reflection.Assembly]::LoadWithPartialName("System.Drawing")

function Process-Solid-Image {
    param([string]$src, [string]$dest, [int]$w, [int]$h, [bool]$isIcon = $false)
    
    $img = [System.Drawing.Image]::FromFile($src)
    # Create 24-bit RGB bitmap (No Alpha channel -> 100% Solid Background!)
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Fill solid dark background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 5, 2, 26))
    $g.FillRectangle($bgBrush, 0, 0, $w, $h)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $w, $h)
    
    # Save as 24-bit PNG
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $bgBrush.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

$sc1 = "C:\Users\parth-nic\.gemini\antigravity-ide\brain\49f7a741-e9f3-4476-94d1-e1bae0026813\screenshot_1_1785323210600.png"
$sc2 = "C:\Users\parth-nic\.gemini\antigravity-ide\brain\49f7a741-e9f3-4476-94d1-e1bae0026813\screenshot_2_1785323215396.png"
$sc3 = "C:\Users\parth-nic\.gemini\antigravity-ide\brain\49f7a741-e9f3-4476-94d1-e1bae0026813\screenshot_3_1785323220150.png"
$sc4 = "C:\Users\parth-nic\.gemini\antigravity-ide\brain\49f7a741-e9f3-4476-94d1-e1bae0026813\screenshot_4_1785323226949.png"
$sc5 = "C:\Users\parth-nic\.gemini\antigravity-ide\brain\49f7a741-e9f3-4476-94d1-e1bae0026813\screenshot_5_1785323233093.png"

$destDir = "c:\Users\parth-nic\Desktop\july29\vr1\bubblewrap"

# Create 100% Solid 512x512 Icon
Process-Solid-Image -src $sc1 -dest "$destDir\store_icon_512.png" -w 512 -h 512 -isIcon $true

# Create 5 Solid 2560x1440 Live Gameplay Screenshots
Process-Solid-Image -src $sc1 -dest "$destDir\screenshot_1_2560x1440.png" -w 2560 -h 1440
Process-Solid-Image -src $sc2 -dest "$destDir\screenshot_2_2560x1440.png" -w 2560 -h 1440
Process-Solid-Image -src $sc3 -dest "$destDir\screenshot_3_2560x1440.png" -w 2560 -h 1440
Process-Solid-Image -src $sc4 -dest "$destDir\screenshot_4_2560x1440.png" -w 2560 -h 1440
Process-Solid-Image -src $sc5 -dest "$destDir\screenshot_5_2560x1440.png" -w 2560 -h 1440

Write-Host "Solid Background Icon & 5 Live Screenshots Created Successfully!"

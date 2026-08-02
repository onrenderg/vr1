[Reflection.Assembly]::LoadWithPartialName("System.Drawing")

function Resize-Image {
    param([string]$src, [string]$dest, [int]$w, [int]$h)
    $img = [System.Drawing.Image]::FromFile($src)
    # Create 24-bit RGB bitmap (No Alpha channel -> 100% Solid Background)
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Fill solid dark background first
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
    Write-Host "  Created: $dest"
}

$brainDir = "C:\Users\acer\.gemini\antigravity-ide\brain\dd17b3bc-0697-4756-8f7d-952343ed96e4"
$destDir = "c:\Users\acer\Desktop\Aug1\vr1\bubblewrap"

# ============================================================
# COVER ART (with "Arcade Cockpit" branding) - Fixes VRC.Quest.Asset.2
# ============================================================
Write-Host "`n=== Resizing Cover Art with Branding ==="

# Landscape Cover: 2560x1440 (16:9)
$landscapeSrc = "$brainDir\landscape_cover_1785670727130.png"
Resize-Image -src $landscapeSrc -dest "$destDir\landscape_cover_2560x1440.png" -w 2560 -h 1440

# Square Cover: 1440x1440 (1:1)
$squareSrc = "$brainDir\square_cover_1785670761787.png"
Resize-Image -src $squareSrc -dest "$destDir\square_cover_1440x1440.png" -w 1440 -h 1440

# Portrait Cover: 1080x1440 (3:4)
$portraitSrc = "$brainDir\portrait_cover_1785670789752.png"
Resize-Image -src $portraitSrc -dest "$destDir\portrait_cover_1080x1440.png" -w 1080 -h 1440

# ============================================================
# SCREENSHOTS (clean, no UI overlays) - Fixes VRC.Quest.Asset.5
# ============================================================
Write-Host "`n=== Resizing Clean Screenshots ==="

# Screenshot 2: 2560x1440
$sc2Src = "$brainDir\screenshot_2_clean_1785670823153.png"
Resize-Image -src $sc2Src -dest "$destDir\screenshot_2_2560x1440.png" -w 2560 -h 1440

# Screenshot 5: 2560x1440
$sc5Src = "$brainDir\screenshot_5_clean_1785670837844.png"
Resize-Image -src $sc5Src -dest "$destDir\screenshot_5_2560x1440.png" -w 2560 -h 1440

Write-Host "`n=== ALL DONE! Fixed assets saved to $destDir ==="
Write-Host "Cover Art: landscape_cover_2560x1440.png, square_cover_1440x1440.png, portrait_cover_1080x1440.png"
Write-Host "Screenshots: screenshot_2_2560x1440.png, screenshot_5_2560x1440.png"

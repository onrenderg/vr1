[Reflection.Assembly]::LoadWithPartialName("System.Drawing")

$dir = "c:\Users\acer\Desktop\Aug1\vr1\bubblewrap"

function Clean-BottomRightIcon {
    param([string]$filePath)

    if (-not (Test-Path $filePath)) { return }

    # Load image into editable Bitmap
    $img = [System.Drawing.Image]::FromFile($filePath)
    $bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, 0, 0, $img.Width, $img.Height)
    $img.Dispose()

    # The VR fullscreen button icon is located at the bottom-right corner.
    # In a 2560x1440 image, it spans approximately x: 2430 to 2560, y: 1330 to 1440.
    # We sample the clean background color just above/left of the icon (e.g. at x=2420, y=1350)
    $bgPixel = $bmp.GetPixel(2420, 1350)
    $brush = New-Object System.Drawing.SolidBrush($bgPixel)

    # Fill a rectangle over the bottom-right corner to completely remove the VR icon box
    # Rect: x=2420, y=1330, width=140, height=110
    $g.FillRectangle($brush, 2420, 1330, 140, 110)

    # Save cleaned image back to disk
    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)

    $brush.Dispose()
    $g.Dispose()
    $bmp.Dispose()

    Write-Host "Cleaned bottom-right VR icon from: $filePath"
}

# Clean all 5 screenshots
for ($i = 1; $i -le 5; $i++) {
    Clean-BottomRightIcon -filePath "$dir\screenshot_${i}_2560x1440.png"
}

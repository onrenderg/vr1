[Reflection.Assembly]::LoadWithPartialName("System.Drawing")

$dir = "c:\Users\acer\Desktop\Aug1\vr1\bubblewrap"
for ($i = 1; $i -le 5; $i++) {
    $file = "$dir\screenshot_${i}_2560x1440.png"
    if (Test-Path $file) {
        $bmp = [System.Drawing.Bitmap]::FromFile($file)
        Write-Host "File: screenshot_${i}_2560x1440.png - Size: $($bmp.Width)x$($bmp.Height)"
        # Sample color from slightly above the bottom-right icon area (e.g., x=2500, y=1300)
        $sampleColor = $bmp.GetPixel(2500, 1300)
        Write-Host "Sample color near bottom-right: R=$($sampleColor.R), G=$($sampleColor.G), B=$($sampleColor.B)"
        $bmp.Dispose()
    }
}

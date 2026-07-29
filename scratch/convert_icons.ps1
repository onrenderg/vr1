[Reflection.Assembly]::LoadWithPartialName("System.Drawing")
$srcPath = "c:\Users\parth-nic\Desktop\july29\vr1\icon-512.png"
$tmpPath = "c:\Users\parth-nic\Desktop\july29\vr1\icon-512-real.png"
$p192Path = "c:\Users\parth-nic\Desktop\july29\vr1\icon-192.png"

$img = [System.Drawing.Image]::FromFile($srcPath)
$img.Save($tmpPath, [System.Drawing.Imaging.ImageFormat]::Png)

$bmp = New-Object System.Drawing.Bitmap($img, 192, 192)
$bmp.Save($p192Path, [System.Drawing.Imaging.ImageFormat]::Png)

$img.Dispose()
$bmp.Dispose()

Move-Item -Path $tmpPath -Destination $srcPath -Force
Write-Host "Icons converted successfully!"

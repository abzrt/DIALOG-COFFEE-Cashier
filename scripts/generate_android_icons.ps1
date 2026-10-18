Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "assets\dialog_logo.jpg"
Write-Host "Source image: $srcPath"
$src = [System.Drawing.Image]::FromFile($srcPath)

function Resize-SquareImage {
    param (
        [System.Drawing.Image]$source,
        [int]$size,
        [string]$outputPath,
        [bool]$isRound = $false,
        [double]$scaleFactor = 1.0,
        [System.Drawing.Color]$bgColor = [System.Drawing.Color]::Transparent
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear($bgColor)

    if ($isRound) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $size, $size)
        $g.SetClip($path)
    }

    if ($scaleFactor -lt 1.0) {
        $targetSize = [int]($size * $scaleFactor)
        $offset = [int](($size - $targetSize) / 2)
        $g.DrawImage($source, $offset, $offset, $targetSize, $targetSize)
    } else {
        $g.DrawImage($source, 0, 0, $size, $size)
    }

    $g.Dispose()

    $dir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $outputPath ($size x $size)"
}

$densities = @(
    @{ Name = "mdpi"; Size = 48; FgSize = 108 },
    @{ Name = "hdpi"; Size = 72; FgSize = 162 },
    @{ Name = "xhdpi"; Size = 96; FgSize = 216 },
    @{ Name = "xxhdpi"; Size = 144; FgSize = 324 },
    @{ Name = "xxxhdpi"; Size = 192; FgSize = 432 }
)

$resBase = "android\app\src\main\res"

foreach ($d in $densities) {
    $folder = Join-Path $resBase "mipmap-$($d.Name)"
    
    # 1. Standard square launcher
    Resize-SquareImage -source $src -size $d.Size -outputPath (Join-Path $folder "ic_launcher.png") -isRound $false
    
    # 2. Round launcher
    Resize-SquareImage -source $src -size $d.Size -outputPath (Join-Path $folder "ic_launcher_round.png") -isRound $true
    
    # 3. Adaptive Foreground launcher (safe margin ~70% size on transparent background)
    Resize-SquareImage -source $src -size $d.FgSize -outputPath (Join-Path $folder "ic_launcher_foreground.png") -isRound $false -scaleFactor 0.72
}

# Web and PWA icons
Resize-SquareImage -source $src -size 192 -outputPath "assets\icon-192.png" -isRound $false
Resize-SquareImage -source $src -size 512 -outputPath "assets\icon-512.png" -isRound $false
Resize-SquareImage -source $src -size 192 -outputPath "www\assets\icon-192.png" -isRound $false
Resize-SquareImage -source $src -size 512 -outputPath "www\assets\icon-512.png" -isRound $false

# Also update splash.png
function Generate-Splash {
    param (
        [System.Drawing.Image]$source,
        [int]$width,
        [int]$height,
        [string]$outputPath
    )
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::White)

    $logoSize = [Math]::Min([Math]::Min($width, $height) * 0.45, 300)
    $offsetX = [int](($width - $logoSize) / 2)
    $offsetY = [int](($height - $logoSize) / 2)

    $g.DrawImage($source, $offsetX, $offsetY, [int]$logoSize, [int]$logoSize)
    $g.Dispose()

    $dir = [System.IO.Path]::GetDirectoryName($outputPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved Splash: $outputPath ($width x $height)"
}

Generate-Splash -source $src -width 480 -height 800 -outputPath (Join-Path $resBase "drawable\splash.png")

$splashDrawables = @(
    @{ Path = "drawable-land-mdpi\splash.png"; W = 480; H = 320 },
    @{ Path = "drawable-land-hdpi\splash.png"; W = 800; H = 480 },
    @{ Path = "drawable-land-xhdpi\splash.png"; W = 1280; H = 720 },
    @{ Path = "drawable-land-xxhdpi\splash.png"; W = 1600; H = 960 },
    @{ Path = "drawable-land-xxxhdpi\splash.png"; W = 1920; H = 1280 },
    @{ Path = "drawable-port-mdpi\splash.png"; W = 320; H = 480 },
    @{ Path = "drawable-port-hdpi\splash.png"; W = 480; H = 800 },
    @{ Path = "drawable-port-xhdpi\splash.png"; W = 720; H = 1280 },
    @{ Path = "drawable-port-xxhdpi\splash.png"; W = 960; H = 1600 },
    @{ Path = "drawable-port-xxxhdpi\splash.png"; W = 1280; H = 1920 }
)

foreach ($s in $splashDrawables) {
    Generate-Splash -source $src -width $s.W -height $s.H -outputPath (Join-Path $resBase $s.Path)
}

$src.Dispose()
Write-Host "All icons and splash screens successfully generated from user logo!"

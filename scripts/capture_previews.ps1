$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$baseUrl = "http://127.0.0.1:3000"
$baseDir = "C:\Users\user\.gemini\antigravity-ide\scratch\DIALOG-COFFEE-Cashier"
$artifactDir = "C:\Users\user\.gemini\antigravity-ide\brain\a85dbb76-4dc3-4b0f-ad9a-93f616e1a3f2"

$devices = @(
    @{ Name = "mobile_phone"; W = 412; H = 915 },
    @{ Name = "mobile_small"; W = 375; H = 812 },
    @{ Name = "tablet_portrait"; W = 800; H = 1200 },
    @{ Name = "tablet_landscape"; W = 1200; H = 800 }
)

foreach ($d in $devices) {
    $outPath = Join-Path $baseDir "preview_$($d.Name).png"
    $artPath = Join-Path $artifactDir "preview_$($d.Name).png"
    $args = @(
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--screenshot=$outPath",
        "--window-size=$($d.W),$($d.H)",
        $baseUrl
    )
    $p = Start-Process -FilePath $chrome -ArgumentList $args -PassThru -Wait
    if (Test-Path $outPath) {
        Copy-Item $outPath $artPath -Force
        Write-Host "Captured $($d.Name): $($d.W)x$($d.H) -> $outPath"
    } else {
        Write-Host "Failed to capture $($d.Name)"
    }
}

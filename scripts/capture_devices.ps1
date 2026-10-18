$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$baseDir = "C:\Users\user\.gemini\antigravity-ide\scratch\DIALOG-COFFEE-Cashier"
$artifactDir = "C:\Users\user\.gemini\antigravity-ide\brain\70b3043b-4b95-4724-ac5d-e078078253c5"

# 1. Capture Both Phone and Tablet side by side
$outBoth = Join-Path $baseDir "preview_kasir_devices.png"
$artBoth = Join-Path $artifactDir "preview_kasir_devices.png"
$argsBoth = @(
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--screenshot=$outBoth",
    "--window-size=1400,980",
    "http://127.0.0.1:3000/preview.html"
)
Start-Process -FilePath $chrome -ArgumentList $argsBoth -Wait
if (Test-Path $outBoth) {
    Copy-Item $outBoth $artBoth -Force
    Write-Host "Captured Both: $outBoth"
}

# 2. Capture Phone only
$outPhone = Join-Path $baseDir "preview_kasir_phone.png"
$artPhone = Join-Path $artifactDir "preview_kasir_phone.png"
$argsPhone = @(
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--screenshot=$outPhone",
    "--window-size=520,980",
    "http://127.0.0.1:3000/preview.html"
)
Start-Process -FilePath $chrome -ArgumentList $argsPhone -Wait
if (Test-Path $outPhone) {
    Copy-Item $outPhone $artPhone -Force
    Write-Host "Captured Phone: $outPhone"
}

# 3. Capture Tablet only
$outTablet = Join-Path $baseDir "preview_kasir_tablet.png"
$artTablet = Join-Path $artifactDir "preview_kasir_tablet.png"
$argsTablet = @(
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--screenshot=$outTablet",
    "--window-size=920,980",
    "http://127.0.0.1:3000/preview.html"
)
Start-Process -FilePath $chrome -ArgumentList $argsTablet -Wait
if (Test-Path $outTablet) {
    Copy-Item $outTablet $artTablet -Force
    Write-Host "Captured Tablet: $outTablet"
}

# 4. Capture Receipt Modal (Cetak Struk & Simpan PDF)
$outStruk = Join-Path $baseDir "preview_struk_devices.png"
$artStruk = Join-Path $artifactDir "preview_struk_devices.png"
$argsStruk = @(
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--virtual-time-budget=4000",
    "--screenshot=$outStruk",
    "--window-size=1400,980",
    "http://127.0.0.1:3000/preview.html#receipt"
)
Start-Process -FilePath $chrome -ArgumentList $argsStruk -Wait
if (Test-Path $outStruk) {
    Copy-Item $outStruk $artStruk -Force
    Write-Host "Captured Struk Preview: $outStruk"
}

Write-Host "All preview screenshots generated successfully!"


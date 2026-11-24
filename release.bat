@echo off
setlocal
title DIALOG COFFEE - Auto Release APK to GitHub

echo ========================================================
echo   DIALOG COFFEE CASHIER - ONE-CLICK AUTO RELEASE GITHUB
echo ========================================================
echo.
echo Sedang memproses rilis baru dan mengirim ke GitHub...
echo.

node scripts\release.js %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Rilis otomatis gagal. Periksa pesan error di atas.
    echo.
) else (
    echo.
    echo [SUKSES] Rilis berhasil! GitHub Actions sedang memproses APK.
    echo.
)

pause

---
description: Otomatisasi rilis APK ke GitHub setelah setiap perubahan kode
globs: *
---

# Aturan Otomatisasi Rilis APK DIALOG COFFEE

Setiap kali pengguna meminta perubahan kode pada aplikasi ini (seperti penambahan menu, perbaikan bug, penyesuaian tampilan, atau fitur kasir):
1. Terapkan perubahan kode sesuai permintaan pengguna dengan mempertahankan struktur kode yang ada.
2. Sinkronkan berkas web ke Android (`node scripts/sync-android.js`).
3. Jalankan kompilasi APK rilis dan otomatisasi rilis (`node scripts/release.js` atau `gradlew assembleRelease`).
4. Pastikan berkas APK rilis (`dialog-coffee-cashier-release.apk`) ikut ter-commit.
5. Push commit dan tag ke GitHub repository `origin/main`.
6. Informasikan kepada pengguna nomor versi baru yang sudah terbit di GitHub sehingga dapat langsung di-update di perangkat Android kasir.

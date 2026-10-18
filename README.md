# ☕ DIALOG COFFEE Cashier

Aplikasi Kasir & Pembukuan Keuangan Modern untuk **Android** dan **Web** yang dirancang khusus untuk kedai kopi (coffee shop) **DIALOG COFFEE**. Aplikasi ini mencatat pemasukan dan pengeluaran secara terperinci serta menyediakan fitur ekspor laporan resmi ke format **Microsoft Word (.docx)** dan **Adobe PDF (.pdf)**.

![DIALOG COFFEE Logo](assets/dialog_logo.jpg)

---

## ✨ Fitur Utama

### 1. 🛒 Kasir Digital (Point of Sale / POS)
- **Katalog Menu Kopi Lengkap**: Kategori Signature Coffee, Espresso Bar, Non-Coffee, Manual Brew, dan Pastry & Snacks.
- **Pencarian Cepat & Filter Kategori**: Cari nama produk secara instan.
- **Keranjang Pesanan Interaktif**: Tambah/kurang kuantitas, hitung subtotal otomatis, dan pajak restoran (PB1).
- **Proses Checkout Cepat**:
  - Pilihan metode bayar: Tunai (Cash), QRIS, Transfer Bank, dan Kartu Debit.
  - Tombol cepat uang pecahan (*Uang Pas, Rp 20.000, Rp 50.000, Rp 100.000, Rp 200.000, Rp 500.000*).
  - Perhitungan uang kembalian secara *real-time*.
- **Struk Kasir Thermal (Thermal Receipt)**:
  - Tampilan struk ala cafe modern dengan rincian item, nomor nota, nama kasir, dan pesan footer.
  - Opsi **Cetak Struk Langsung** (mendukung printer thermal 58mm & 80mm).
  - Opsi **Unduh Struk PDF**.

### 2. 💰 Buku Kas Keuangan Detail (Pemasukan & Pengeluaran)
- **Ringkasan Metrik Realtime (KPI Cards)**:
  - Total Pemasukan
  - Total Pengeluaran
  - Laba / (Rugi) Bersih
  - Saldo Kas di Laci Kasir
- **Pencatatan Pengeluaran Terperinci**:
  - Kategori pengeluaran cafe: *Bahan Baku (Biji Kopi, Susu, Sirup, Powder), Kemasan (Cup, Sedotan, Seal, Paper Bag), Operasional (Listrik PLN, Air, Gas, WiFi), Gaji Barista & Staff, Perawatan Alat Mesin Espresso, Perlengkapan Kebersihan, Pemasaran & Promo, dll.*
  - Tanggal & waktu transaksi.
  - Metode bayar (Kas Toko, Petty Cash, Rekening Operasional, QRIS, Transfer).
  - Penanggung Jawab / PIC kasir.
  - Nomor referensi / nomor nota supplier.
- **Pencatatan Pemasukan Manual**:
  - Modal Awal Kasir (*Opening Float*), Penjualan Biji Kopi Sangrai (*Beans*), Katering / Event, Merchandise.
- **Riwayat & Filter Transaksi**:
  - Filter berdasarkan tipe (*Semua, Pemasukan, Pengeluaran*), kategori, dan kotak pencarian nomor nota / deskripsi.
  - Hapus dan tinjau struk transaksi lama.

### 3. 📈 Laporan & Analitik Interaktif
- **Filter Rentang Tanggal**: Hari Ini, Kemarin, 7 Hari Terakhir, Bulan Ini, Bulan Lalu, Semua Waktu, atau Custom Tanggal Dari - Sampai.
- **Visualisasi Grafik**:
  - Grafik Batang Tren Arus Kas Harian (Pemasukan vs Pengeluaran).
  - Diagram Donat (*Donut Chart*) Komposisi Pengeluaran Terbesar.
- **Peringkat 5 Menu Terlaris**: Pantau menu kopi yang paling banyak dipesan pelanggan.

### 4. 📑 Pusat Ekspor Dokumen Resmi (Word & PDF)
- **📄 Ekspor ke PDF (.pdf)**:
  - Kop surat resmi DIALOG COFFEE beserta alamat dan kontak.
  - Kotak ringkasan eksekutif (Total Masuk, Total Keluar, Laba Bersih, Jumlah Transaksi).
  - Tabel detail transaksi rapi dengan nomor, waktu, ID nota, jenis, kategori, rincian per item, metode bayar, dan nominal.
  - Lembar pengesahan tanda tangan: **Kasir On Duty** dan **Store Manager / Owner**.
- **📝 Ekspor ke Microsoft Word (.docx)**:
  - Berkas asli OpenXML Word (.docx) berformat landscape A4.
  - Tabel terstruktur rapi dengan border dan header berwarna tema cafe.
  - 100% kompatibel dan dapat diedit di **Microsoft Word**, **Google Docs**, dan **WPS Office**.
- **📊 Ekspor ke Excel (.csv)**:
  - Format tabular CSV standar untuk analisis lanjutan di spreadsheet.

### 5. 📱 Kompatibilitas Android & Mobile First
- Proyek Android siap build dengan **Capacitor** di folder `android/`.
- UI Responsif khusus Android:
  - Bottom Navigation Bar khas aplikasi mobile Android.
  - Animasi sentuh responsif.
  - Efek suara audio synthesizer (klik tombol & denting kasir).
  - Berfungsi offline tanpa kuota internet dengan Service Worker (`sw.js`).
  - Mode PWA (*Progressive Web App*) yang dapat ditambahkan ke layar utama (*Add to Home screen*).

---

## 📂 Struktur Direktori Proyek

```
DIALOG-COFFEE-Cashier/
├── index.html              # Antarmuka utama aplikasi Kasir & Buku Kas
├── manifest.json           # Android Web App Manifest
├── sw.js                   # Service Worker untuk caching offline Android
├── capacitor.config.json   # Konfigurasi Capacitor Android
├── package.json            # Dependensi dan npm scripts
├── assets/
│   └── dialog_logo.jpg     # Logo resmi DIALOG COFFEE
├── css/
│   └── style.css           # Design system tema kopi dark lux & responsive
├── js/
│   ├── app.js              # Controller utama, navigasi, jam, efek audio
│   ├── storage.js          # Pengelola data LocalStorage & data sampel
│   ├── pos.js              # Modul Kasir POS, keranjang, checkout & struk
│   ├── finance.js          # Modul Buku Kas pemasukan & pengeluaran detail
│   ├── reports.js          # Modul analitik, grafik Chart.js, & filter
│   ├── export-pdf.js       # Generator dokumen PDF (jsPDF + autotable)
│   └── export-word.js      # Generator dokumen Word .docx asli (JSZip)
├── libs/                   # Pustaka offline lokal (jsPDF, JSZip, Chart.js)
├── scripts/
│   └── sync-android.js     # Script otomatisasi sinkronisasi ke folder www
├── www/                    # Web assets yang disinkronkan untuk Android
└── android/                # Native Android Studio Project (Gradle, Manifest, Java)
    ├── app/
    │   ├── src/main/AndroidManifest.xml
    │   └── src/main/java/id/dialogcoffee/cashier/MainActivity.java
    ├── build.gradle
    └── gradlew.bat
```

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Langsung di Browser / Komputer Kasir
Aplikasi tidak memerlukan server backend khusus dan dapat langsung dibuka:
```bash
# Menggunakan live server bawaan:
npm run start
```
Buka browser pada alamat `http://localhost:3000`.

### Opsi 2: Membuka & Membangun di Android Studio
Proyek ini sudah dilengkapi folder native Android:
```bash
# 1. Sinkronisasi perubahan web ke project Android
npm run sync

# 2. Buka project di Android Studio
npm run android
```
Di Android Studio, Anda dapat langsung mengklik tombol **Run ▶** untuk menguji di emulator / HP Android, atau memilih menu **Build > Build Bundle(s) / APK(s) > Build APK(s)** untuk menghasilkan file instalasi `.apk`.

### Opsi 3: Membangun APK Debug via Terminal
Jika Android SDK dan Gradle sudah terpasang pada komputer:
```bash
npm run build:apk
```
File APK akan dibuat di `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🔒 Keamanan Data & Cadangan
- Semua transaksi disimpan secara otomatis di memori internal perangkat.
- Tersedia fitur **Unduh Cadangan Data (JSON)** dan **Pulihkan Data** di menu Pengaturan untuk memastikan riwayat pembukuan kasir Anda selalu aman dan dapat dipindahkan antar perangkat.

---

*DIALOG COFFEE Cashier — Great Coffee, Honest Conversations.*

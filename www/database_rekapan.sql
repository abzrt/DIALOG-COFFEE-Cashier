-- =============================================================================
-- DIALOG COFFEE - DATABASE REKAPAN KASIR & ARUS KAS (myphp.id / MySQL)
-- =============================================================================
-- Target Database: un9c3d11_dialog_database
-- Target User    : un9c3d11_dialog_coffee
--
-- CARA IMPORT DI phpMyAdmin myphp.id:
-- 1. Buka phpMyAdmin, lalu klik nama database "un9c3d11_dialog_database" di sebelah kiri.
-- 2. Klik tab menu "Import" di bagian atas.
-- 3. Pilih file "database_rekapan.sql" ini dan klik "Kirim" / "Go".
-- =============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+08:00"; -- Waktu Indonesia Tengah (WITA / Kalimantan Utara)

-- -----------------------------------------------------------------------------
-- 1. TABEL: tb_rekapan_closing (Catatan Rekapan Closing Tiap Shift & Harian)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_rekapan_closing` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `closing_id` VARCHAR(64) NOT NULL COMMENT 'ID Unik Closing (Contoh: CLS-1729501234567)',
  `tanggal` DATE NOT NULL COMMENT 'Tanggal Closing (YYYY-MM-DD)',
  `waktu` DATETIME NOT NULL COMMENT 'Waktu Lengkap Closing',
  `shift` VARCHAR(50) NOT NULL COMMENT 'Shift (Shift 1 / Shift 2 / Total Hari Ini)',
  `barista` VARCHAR(150) NOT NULL COMMENT 'Nama Barista On Duty saat Closing',
  `total_pemasukan` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total Uang Masuk Shift/Hari Ini',
  `total_pengeluaran` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total Uang Keluar Shift/Hari Ini',
  `laba_bersih` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Laba / Rugi Bersih (Pemasukan - Pengeluaran)',
  `kas_laci_fisik` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Uang Tunai Fisik di Laci Kasir',
  `jumlah_transaksi` INT(11) NOT NULL DEFAULT 0 COMMENT 'Total Volume Transaksi',
  `wa_gateway_status` VARCHAR(20) DEFAULT 'SENT' COMMENT 'Status Pengiriman WA ke Owner (+6285334101996)',
  `catatan` TEXT DEFAULT NULL COMMENT 'Catatan Khusus Barista',
  `data_json` LONGTEXT DEFAULT NULL COMMENT 'Backup Mentah JSON Struktur Transaksi',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_closing_id` (`closing_id`),
  KEY `idx_tanggal` (`tanggal`),
  KEY `idx_shift` (`shift`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABEL: tb_transaksi (Seluruh Transaksi Pemasukan Kasir & Pengeluaran Kas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_transaksi` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `trx_id` VARCHAR(64) NOT NULL COMMENT 'ID Transaksi (Contoh: TRX-982144)',
  `closing_id` VARCHAR(64) DEFAULT NULL COMMENT 'Relasi ke Closing jika sudah ditutup',
  `tanggal_waktu` DATETIME NOT NULL COMMENT 'Waktu Terjadinya Transaksi',
  `tanggal` DATE NOT NULL COMMENT 'Tanggal Transaksi untuk agregasi cepat',
  `tipe` ENUM('income','expense') NOT NULL COMMENT 'Tipe: income (Pemasukan) atau expense (Pengeluaran)',
  `kategori` VARCHAR(100) NOT NULL COMMENT 'Kategori (Penjualan Kopi, Bahan Baku, Operasional, dll)',
  `nominal` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal Transaksi (Rp)',
  `metode_pembayaran` VARCHAR(50) NOT NULL DEFAULT 'Tunai' COMMENT 'Tunai, QRIS, Transfer Bank, Petty Cash, Debit',
  `shift` VARCHAR(50) NOT NULL DEFAULT 'Shift 1' COMMENT 'Shift kerja yang mencatat',
  `kasir_barista` VARCHAR(150) DEFAULT NULL COMMENT 'Nama Petugas Kasir / Barista',
  `nama_pelanggan` VARCHAR(100) DEFAULT NULL COMMENT 'Nama Pemesan / Meja (Draft & Transaksi)',
  `nomor_seat` VARCHAR(50) DEFAULT NULL COMMENT 'Nomor Meja / Seat',
  `keterangan` TEXT DEFAULT NULL COMMENT 'Keterangan / Rincian Menu / Catatan',
  `nomor_referensi` VARCHAR(100) DEFAULT NULL COMMENT 'Nomor Nota Supplier / Ref Bank',
  `subtotal` DECIMAL(15,2) DEFAULT 0.00,
  `pajak` DECIMAL(15,2) DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trx_id` (`trx_id`),
  KEY `idx_trx_tanggal` (`tanggal`),
  KEY `idx_trx_tipe` (`tipe`),
  KEY `idx_trx_metode` (`metode_pembayaran`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABEL: tb_transaksi_items (Rincian Produk / Menu per Nota Kasir)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_transaksi_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `trx_id` VARCHAR(64) NOT NULL,
  `menu_id` VARCHAR(64) DEFAULT NULL,
  `nama_produk` VARCHAR(150) NOT NULL,
  `kategori_produk` VARCHAR(100) DEFAULT NULL,
  `harga_satuan` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `jumlah` INT(11) NOT NULL DEFAULT 1,
  `total_harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_trx_id` (`trx_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABEL: tb_arus_kas_harian (Tabel Agregat Cepat Harian)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_arus_kas_harian` (
  `tanggal` DATE NOT NULL,
  `total_pemasukan` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_pengeluaran` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `laba_bersih` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `pemasukan_tunai` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `pemasukan_non_tunai` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `jumlah_transaksi` INT(11) NOT NULL DEFAULT 0,
  `terakhir_sinkron` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. VIEW: v_rekap_bulanan (Rekapitulasi Otomatis Arus Kas per Bulan)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_rekap_bulanan` AS
SELECT 
  YEAR(`tanggal`) AS `tahun`,
  MONTH(`tanggal`) AS `bulan_angka`,
  DATE_FORMAT(`tanggal`, '%M %Y') AS `bulan_nama`,
  SUM(`total_pemasukan`) AS `total_pemasukan`,
  SUM(`total_pengeluaran`) AS `total_pengeluaran`,
  SUM(`laba_bersih`) AS `laba_bersih`,
  SUM(`jumlah_transaksi`) AS `total_transaksi`
FROM `tb_arus_kas_harian`
GROUP BY YEAR(`tanggal`), MONTH(`tanggal`)
ORDER BY `tahun` DESC, `bulan_angka` DESC;

-- -----------------------------------------------------------------------------
-- 6. VIEW: v_rekap_tahunan (Rekapitulasi Otomatis Arus Kas per Tahun)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_rekap_tahunan` AS
SELECT 
  YEAR(`tanggal`) AS `tahun`,
  SUM(`total_pemasukan`) AS `total_pemasukan`,
  SUM(`total_pengeluaran`) AS `total_pengeluaran`,
  SUM(`laba_bersih`) AS `laba_bersih`,
  SUM(`jumlah_transaksi`) AS `total_transaksi`
FROM `tb_arus_kas_harian`
GROUP BY YEAR(`tanggal`)
ORDER BY `tahun` DESC;

-- -----------------------------------------------------------------------------
-- 7. TABEL: tb_pengaturan (Pengaturan Sinkronisasi Antar Device, PIN Owner & Password Barista)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_pengaturan` (
  `kunci` VARCHAR(64) NOT NULL COMMENT 'Kunci konfigurasi (baristaPin, ownerPin, menuList, dll)',
  `nilai` LONGTEXT NOT NULL COMMENT 'Nilai pengaturan terkini',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`kunci`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tb_pengaturan` (`kunci`, `nilai`) VALUES 
('baristaPin', '6969'),
('ownerPin', '1996')
ON DUPLICATE KEY UPDATE `kunci` = `kunci`;

COMMIT;


<?php
/**
 * =============================================================================
 * DIALOG COFFEE - REST API SINKRONISASI DATABASE REKAPAN (myphp.id / MySQL)
 * =============================================================================
 * Berkas ini diunggah ke hosting myphp.id Anda (misal di folder public_html atau htdocs).
 * Berfungsi menerima dan menyimpan rekapan closing kasir, transaksi harian,
 * serta menyajikan data arus kas masuk dan keluar secara terstruktur.
 * =============================================================================
 */

// 1. SET HEADER & CORS (AGAR BISA DIAKSES DARI APLIKASI WEB MAUPUN ANDROID APK)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key');

// Tangani Preflight Request dari browser / Capacitor Android
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// =============================================================================
// 2. KONFIGURASI KONEKSI DATABASE myphp.id
// =============================================================================
// Kredensial database resmi myphp.id DIALOG COFFEE:
$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_USER = getenv('DB_USER') ?: 'un9c3d11_dialog_coffee';        // Username database myphp.id Anda
$DB_NAME = getenv('DB_NAME') ?: 'un9c3d11_dialog_database';      // Nama database myphp.id Anda
$DB_PASS = getenv('DB_PASS') ?: 'Telkom@147';                    // Password database myphp.id Anda
$API_KEY = 'dialog2026';                                    // Kunci rahasia sinkronisasi

// Baca parameter aksi
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : 'ping');

// Helper response JSON
function sendResponse($success, $message, $data = null, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'timestamp' => date('c'),
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// =============================================================================
// 3. KONEKSI KE DATABASE MYSQL
// =============================================================================
// Nonaktifkan mode exception bawaan PHP 8.1+ agar penanganan error terkendali
if (function_exists('mysqli_report')) {
    @mysqli_report(MYSQLI_REPORT_OFF);
}

$conn = null;
$connectException = null;

try {
    $conn = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
} catch (Throwable $e) {
    $connectException = $e->getMessage();
}

if (!$conn || $conn->connect_error) {
    try {
        $conn = @new mysqli($DB_HOST, $DB_USER, $DB_PASS);
    } catch (Throwable $e) {
        if (!$connectException) $connectException = $e->getMessage();
    }

    if (!$conn || $conn->connect_error) {
        $errDetail = ($conn && $conn->connect_error) ? $conn->connect_error : ($connectException ?: 'Koneksi ditolak');
        if ($action === 'ping') {
            sendResponse(false, 'Gagal terhubung ke MySQL: ' . $errDetail . '. Pastikan username dan password MySQL di cPanel sudah sesuai serta sudah ditambahkan ke database (Add User to Database).', null, 200);
        } else {
            sendResponse(false, 'Database connection error: ' . $errDetail, null, 200);
        }
    }

    @$conn->query("CREATE DATABASE IF NOT EXISTS `$DB_NAME` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    if (!@$conn->select_db($DB_NAME)) {
        sendResponse(false, "Database '$DB_NAME' belum ditemukan di server MySQL. Silakan pastikan database sudah dibuat di akun hosting Anda.", null, 200);
    }
}

// Pastikan charset UTF-8mb4
if ($conn) {
    @$conn->set_charset('utf8mb4');
}

// Inisialisasi Tabel Otomatis jika belum dibuat
initTablesIfNotExist($conn);

function initTablesIfNotExist($db) {
    $sql1 = "CREATE TABLE IF NOT EXISTS `tb_rekapan_closing` (
      `id` INT(11) NOT NULL AUTO_INCREMENT,
      `closing_id` VARCHAR(64) NOT NULL,
      `tanggal` DATE NOT NULL,
      `waktu` DATETIME NOT NULL,
      `shift` VARCHAR(50) NOT NULL,
      `barista` VARCHAR(150) NOT NULL,
      `total_pemasukan` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `total_pengeluaran` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `laba_bersih` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `kas_laci_fisik` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `jumlah_transaksi` INT(11) NOT NULL DEFAULT 0,
      `wa_gateway_status` VARCHAR(20) DEFAULT 'SENT',
      `catatan` TEXT DEFAULT NULL,
      `data_json` LONGTEXT DEFAULT NULL,
      `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uk_closing_id` (`closing_id`),
      KEY `idx_tanggal` (`tanggal`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    @$db->query($sql1);

    $sql2 = "CREATE TABLE IF NOT EXISTS `tb_transaksi` (
      `id` INT(11) NOT NULL AUTO_INCREMENT,
      `trx_id` VARCHAR(64) NOT NULL,
      `closing_id` VARCHAR(64) DEFAULT NULL,
      `tanggal_waktu` DATETIME NOT NULL,
      `tanggal` DATE NOT NULL,
      `tipe` ENUM('income','expense') NOT NULL,
      `kategori` VARCHAR(100) NOT NULL,
      `nominal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `metode_pembayaran` VARCHAR(50) NOT NULL DEFAULT 'Tunai',
      `shift` VARCHAR(50) NOT NULL DEFAULT 'Shift 1',
      `kasir_barista` VARCHAR(150) DEFAULT NULL,
      `nama_pelanggan` VARCHAR(100) DEFAULT NULL,
      `nomor_seat` VARCHAR(50) DEFAULT NULL,
      `keterangan` TEXT DEFAULT NULL,
      `nomor_referensi` VARCHAR(100) DEFAULT NULL,
      `subtotal` DECIMAL(15,2) DEFAULT 0.00,
      `pajak` DECIMAL(15,2) DEFAULT 0.00,
      `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `uk_trx_id` (`trx_id`),
      KEY `idx_trx_tanggal` (`tanggal`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    @$db->query($sql2);

    $sql3 = "CREATE TABLE IF NOT EXISTS `tb_transaksi_items` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    @$db->query($sql3);

    $sql4 = "CREATE TABLE IF NOT EXISTS `tb_arus_kas_harian` (
      `tanggal` DATE NOT NULL,
      `total_pemasukan` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `total_pengeluaran` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `laba_bersih` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `pemasukan_tunai` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `pemasukan_non_tunai` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      `jumlah_transaksi` INT(11) NOT NULL DEFAULT 0,
      `terakhir_sinkron` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`tanggal`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    @$db->query($sql4);

    $sql5 = "CREATE TABLE IF NOT EXISTS `tb_pengaturan` (
      `kunci` VARCHAR(64) NOT NULL,
      `nilai` TEXT NOT NULL,
      `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`kunci`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    @$db->query($sql5);
}

// =============================================================================
// 4. ROUTING AKSI API
// =============================================================================

// AKSI 1: PING / TEST KONEKSI
if ($action === 'ping') {
    $resCount = $conn->query("SELECT COUNT(*) as total FROM tb_rekapan_closing");
    $totalClosing = $resCount ? $resCount->fetch_assoc()['total'] : 0;

    $resTrx = $conn->query("SELECT COUNT(*) as total FROM tb_transaksi");
    $totalTrx = $resTrx ? $resTrx->fetch_assoc()['total'] : 0;

    sendResponse(true, 'Koneksi database MySQL myphp.id berhasil & aktif!', [
        'database' => $DB_NAME,
        'host' => $DB_HOST,
        'server_info' => $conn->server_info,
        'total_closing_tercatat' => (int)$totalClosing,
        'total_transaksi_tercatat' => (int)$totalTrx,
        'status' => 'ONLINE'
    ]);
}

// Baca Payload JSON jika metode POST
$inputJSON = file_get_contents('php://input');
$payload = json_decode($inputJSON, true) ?: $_POST;

// Validasi Token / API Key jika dikirimkan
$requestApiKey = isset($_SERVER['HTTP_X_API_KEY']) ? $_SERVER['HTTP_X_API_KEY'] : (isset($payload['api_key']) ? $payload['api_key'] : '');
if (!empty($API_KEY) && !empty($requestApiKey) && $requestApiKey !== $API_KEY) {
    sendResponse(false, 'API Key keamanan tidak valid!', null, 401);
}

// AKSI 2: SINKRONISASI REKAPAN CLOSING SHIFT
if ($action === 'sync_closing') {
    $closing = isset($payload['closing']) ? $payload['closing'] : $payload;
    if (empty($closing)) {
        sendResponse(false, 'Data rekapan closing kosong.', null, 400);
    }

    $closingId = isset($closing['id']) ? $closing['id'] : 'CLS-' . time();
    $timestamp = isset($closing['timestamp']) ? $closing['timestamp'] : date('Y-m-d H:i:s');
    $dateOnly = substr($timestamp, 0, 10);
    $shift = isset($closing['shift']) ? $closing['shift'] : 'Shift 1';
    $baristas = isset($closing['baristas']) ? $closing['baristas'] : 'Ardi & Anca';
    $totalIncome = floatval(isset($closing['totalIncome']) ? $closing['totalIncome'] : 0);
    $totalExpense = floatval(isset($closing['totalExpense']) ? $closing['totalExpense'] : 0);
    $netProfit = floatval(isset($closing['netProfit']) ? $closing['netProfit'] : ($totalIncome - $totalExpense));
    $cashPhysical = floatval(isset($closing['cashPhysical']) ? $closing['cashPhysical'] : 0);
    $trxCount = intval(isset($closing['trxCount']) ? $closing['trxCount'] : 0);
    $waStatus = 'SENT';
    $rawJSON = json_encode($closing, JSON_UNESCAPED_UNICODE);

    // Simpan / Perbarui tb_rekapan_closing
    $stmt = $conn->prepare("INSERT INTO tb_rekapan_closing 
        (closing_id, tanggal, waktu, shift, barista, total_pemasukan, total_pengeluaran, laba_bersih, kas_laci_fisik, jumlah_transaksi, wa_gateway_status, data_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        waktu = VALUES(waktu), shift = VALUES(shift), barista = VALUES(barista),
        total_pemasukan = VALUES(total_pemasukan), total_pengeluaran = VALUES(total_pengeluaran),
        laba_bersih = VALUES(laba_bersih), kas_laci_fisik = VALUES(kas_laci_fisik),
        jumlah_transaksi = VALUES(jumlah_transaksi), data_json = VALUES(data_json)");
    
    $stmt->bind_param('sssssddddiss', $closingId, $dateOnly, $timestamp, $shift, $baristas, $totalIncome, $totalExpense, $netProfit, $cashPhysical, $trxCount, $waStatus, $rawJSON);
    $stmt->execute();
    $stmt->close();

    // Simpan juga transaksi yang disertakan (jika ada)
    if (!empty($closing['transactions']) && is_array($closing['transactions'])) {
        saveTransactionBatch($conn, $closing['transactions'], $closingId);
    }

    // Perbarui agregat harian
    updateDailyAggregate($conn, $dateOnly);

    sendResponse(true, "Rekapan closing $shift ($dateOnly) berhasil disimpan ke database myphp.id!", [
        'closing_id' => $closingId,
        'tanggal' => $dateOnly,
        'shift' => $shift,
        'laba_bersih' => $netProfit
    ]);
}

// AKSI 3: SINKRONISASI BATCH SEMUA DATA (TRANSAKSI & CLOSING OFFLINE)
if ($action === 'sync_all') {
    $transactions = isset($payload['transactions']) ? $payload['transactions'] : [];
    $closings = isset($payload['closings']) ? $payload['closings'] : [];

    $savedTrx = 0;
    if (!empty($transactions) && is_array($transactions)) {
        $savedTrx = saveTransactionBatch($conn, $transactions);
    }

    $savedClosings = 0;
    if (!empty($closings) && is_array($closings)) {
        foreach ($closings as $c) {
            $cid = isset($c['id']) ? $c['id'] : 'CLS-' . time();
            $cts = isset($c['timestamp']) ? $c['timestamp'] : date('Y-m-d H:i:s');
            $cDate = substr($cts, 0, 10);
            $cShift = isset($c['shift']) ? $c['shift'] : 'Shift 1';
            $cBarista = isset($c['baristas']) ? $c['baristas'] : 'Barista';
            $cIn = floatval(isset($c['totalIncome']) ? $c['totalIncome'] : 0);
            $cOut = floatval(isset($c['totalExpense']) ? $c['totalExpense'] : 0);
            $cNet = floatval(isset($c['netProfit']) ? $c['netProfit'] : 0);
            $cCash = floatval(isset($c['cashPhysical']) ? $c['cashPhysical'] : 0);
            $cCount = intval(isset($c['trxCount']) ? $c['trxCount'] : 0);
            $raw = json_encode($c, JSON_UNESCAPED_UNICODE);

            $stmt = $conn->prepare("INSERT INTO tb_rekapan_closing 
                (closing_id, tanggal, waktu, shift, barista, total_pemasukan, total_pengeluaran, laba_bersih, kas_laci_fisik, jumlah_transaksi, wa_gateway_status, data_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SENT', ?)
                ON DUPLICATE KEY UPDATE 
                total_pemasukan=VALUES(total_pemasukan), total_pengeluaran=VALUES(total_pengeluaran), laba_bersih=VALUES(laba_bersih)");
            $stmt->bind_param('sssssddddis', $cid, $cDate, $cts, $cShift, $cBarista, $cIn, $cOut, $cNet, $cCash, $cCount, $raw);
            $stmt->execute();
            $stmt->close();
            $savedClosings++;

            updateDailyAggregate($conn, $cDate);
        }
    }

    sendResponse(true, "Sinkronisasi batch selesai: $savedTrx transaksi & $savedClosings rekapan closing tersimpan.", [
        'transactions_saved' => $savedTrx,
        'closings_saved' => $savedClosings
    ]);
}

// AKSI 4: AMBIL REKAPAN SUMMARY DARI DATABASE
if ($action === 'get_rekapan') {
    $period = isset($_GET['period']) ? $_GET['period'] : 'monthly';
    $year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');

    if ($period === 'yearly') {
        $q = $conn->query("SELECT * FROM v_rekap_tahunan LIMIT 5");
    } else if ($period === 'monthly') {
        $stmt = $conn->prepare("SELECT * FROM v_rekap_bulanan WHERE tahun = ?");
        $stmt->bind_param('i', $year);
        $stmt->execute();
        $q = $stmt->get_result();
    } else {
        $q = $conn->query("SELECT * FROM tb_arus_kas_harian ORDER BY tanggal DESC LIMIT 31");
    }

    $results = [];
    if ($q) {
        while ($row = $q->fetch_assoc()) {
            $results[] = $row;
        }
    }

    sendResponse(true, 'Data rekapan berhasil diambil dari database MySQL myphp.id', $results);
}

// AKSI 5: SIMPAN PENGATURAN / PASSWORD BARISTA KE CLOUD
if ($action === 'save_settings') {
    $settingsData = isset($payload['settings']) ? $payload['settings'] : $payload;
    if (empty($settingsData) || !is_array($settingsData)) {
        sendResponse(false, 'Data pengaturan tidak valid.', null, 400);
    }

    $stmt = $conn->prepare("INSERT INTO tb_pengaturan (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)");
    $savedCount = 0;
    foreach ($settingsData as $key => $val) {
        if ($key === 'api_key') continue;
        $k = strval($key);
        $v = is_scalar($val) ? strval($val) : json_encode($val, JSON_UNESCAPED_UNICODE);
        $stmt->bind_param('ss', $k, $v);
        $stmt->execute();
        $savedCount++;
    }
    $stmt->close();

    sendResponse(true, 'Pengaturan & Password berhasil disinkronkan ke Cloud Database!', [
        'saved_count' => $savedCount,
        'baristaPin' => isset($settingsData['baristaPin']) ? $settingsData['baristaPin'] : null
    ]);
}

// AKSI 6: AMBIL PENGATURAN / PASSWORD TERBARU DARI CLOUD
if ($action === 'get_settings') {
    $q = $conn->query("SELECT kunci, nilai FROM tb_pengaturan");
    $settings = [
        'baristaPin' => '6969',
        'ownerPin' => '1996'
    ];
    if ($q) {
        while ($row = $q->fetch_assoc()) {
            $settings[$row['kunci']] = $row['nilai'];
        }
    }
    sendResponse(true, 'Pengaturan cloud berhasil diambil', $settings);
}

// Fallback Helper Functions
function saveTransactionBatch($db, $trxList, $closingId = null) {
    $count = 0;
    $stmtTrx = $db->prepare("INSERT INTO tb_transaksi 
        (trx_id, closing_id, tanggal_waktu, tanggal, tipe, kategori, nominal, metode_pembayaran, shift, kasir_barista, nama_pelanggan, nomor_seat, keterangan, nomor_referensi, subtotal, pajak)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        closing_id=VALUES(closing_id), nominal=VALUES(nominal), metode_pembayaran=VALUES(metode_pembayaran), shift=VALUES(shift)");

    $stmtItem = $db->prepare("INSERT INTO tb_transaksi_items 
        (trx_id, menu_id, nama_produk, kategori_produk, harga_satuan, jumlah, total_harga)
        VALUES (?, ?, ?, ?, ?, ?, ?)");

    foreach ($trxList as $t) {
        $tid = isset($t['id']) ? $t['id'] : 'TRX-' . time() . '-' . rand(100, 999);
        $dt = isset($t['date']) ? $t['date'] : date('Y-m-d H:i:s');
        $dateOnly = substr($dt, 0, 10);
        $type = (isset($t['type']) && $t['type'] === 'expense') ? 'expense' : 'income';
        $cat = isset($t['category']) ? $t['category'] : ($type === 'income' ? 'Penjualan' : 'Operasional');
        $nominal = floatval(isset($t['amount']) ? $t['amount'] : 0);
        $method = isset($t['paymentMethod']) ? $t['paymentMethod'] : 'Tunai';
        $shift = isset($t['shift']) ? $t['shift'] : 'Shift 1';
        $kasir = isset($t['cashier']) ? $t['cashier'] : (isset($t['baristas']) ? $t['baristas'] : 'Barista');
        $cust = isset($t['customerName']) ? $t['customerName'] : null;
        $seat = isset($t['seatNumber']) ? $t['seatNumber'] : null;
        $desc = isset($t['description']) ? $t['description'] : null;
        $ref = isset($t['referenceNo']) ? $t['referenceNo'] : null;
        $sub = floatval(isset($t['subtotal']) ? $t['subtotal'] : $nominal);
        $pajak = floatval(isset($t['taxAmount']) ? $t['taxAmount'] : 0);

        $stmtTrx->bind_param('ssssssdsssssssdd', 
            $tid, $closingId, $dt, $dateOnly, $type, $cat, $nominal, 
            $method, $shift, $kasir, $cust, $seat, $desc, $ref, $sub, $pajak
        );
        $stmtTrx->execute();
        $count++;

        // Simpan rincian produk jika ada
        if (!empty($t['items']) && is_array($t['items'])) {
            // Hapus items lama agar tidak duplikat
            $db->query("DELETE FROM tb_transaksi_items WHERE trx_id = '" . $db->real_escape_string($tid) . "'");
            foreach ($t['items'] as $it) {
                $mId = isset($it['id']) ? $it['id'] : null;
                $mName = isset($it['name']) ? $it['name'] : 'Menu Kopi';
                $mCat = isset($it['category']) ? $it['category'] : 'coffee';
                $mPrice = floatval(isset($it['price']) ? $it['price'] : 0);
                $mQty = intval(isset($it['quantity']) ? $it['quantity'] : 1);
                $mTotal = $mPrice * $mQty;

                $stmtItem->bind_param('ssssdid', $tid, $mId, $mName, $mCat, $mPrice, $mQty, $mTotal);
                $stmtItem->execute();
            }
        }
    }

    $stmtTrx->close();
    $stmtItem->close();
    return $count;
}

function updateDailyAggregate($db, $dateStr) {
    $dbDate = $db->real_escape_string($dateStr);
    $q = $db->query("SELECT 
        SUM(CASE WHEN tipe = 'income' THEN nominal ELSE 0 END) as total_in,
        SUM(CASE WHEN tipe = 'expense' THEN nominal ELSE 0 END) as total_out,
        SUM(CASE WHEN tipe = 'income' AND metode_pembayaran = 'Tunai' THEN nominal ELSE 0 END) as cash_in,
        SUM(CASE WHEN tipe = 'income' AND metode_pembayaran != 'Tunai' THEN nominal ELSE 0 END) as non_cash_in,
        COUNT(*) as total_trx
        FROM tb_transaksi WHERE tanggal = '$dbDate'");

    if ($q && $row = $q->fetch_assoc()) {
        $in = floatval($row['total_in']);
        $out = floatval($row['total_out']);
        $net = $in - $out;
        $cashIn = floatval($row['cash_in']);
        $nonCashIn = floatval($row['non_cash_in']);
        $cnt = intval($row['total_trx']);

        $stmt = $db->prepare("INSERT INTO tb_arus_kas_harian 
            (tanggal, total_pemasukan, total_pengeluaran, laba_bersih, pemasukan_tunai, pemasukan_non_tunai, jumlah_transaksi)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            total_pemasukan=VALUES(total_pemasukan), total_pengeluaran=VALUES(total_pengeluaran),
            laba_bersih=VALUES(laba_bersih), pemasukan_tunai=VALUES(pemasukan_tunai),
            pemasukan_non_tunai=VALUES(pemasukan_non_tunai), jumlah_transaksi=VALUES(jumlah_transaksi)");
        $stmt->bind_param('sdddddi', $dateStr, $in, $out, $net, $cashIn, $nonCashIn, $cnt);
        $stmt->execute();
        $stmt->close();
    }
}

// Fallback jika aksi tidak dikenali
sendResponse(false, 'Aksi tidak valid. Gunakan action=ping, action=sync_closing, action=sync_all, action=get_rekapan, action=save_settings, atau action=get_settings.', null, 400);

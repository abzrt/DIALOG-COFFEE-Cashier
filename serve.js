const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.apk': 'application/vnd.android.package-archive'
};

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ name, address: net.address });
      }
    }
  }
  return addresses;
}

const server = http.createServer((req, res) => {
  let reqPath = (req.url || '').split('?')[0];

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // WHATSAPP GATEWAY API ENDPOINTS
  if (reqPath === '/api/whatsapp-gateway/send' || reqPath === '/api/send-whatsapp') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const sender = data.sender || '+628982151560';
          const recipient = data.recipient || '+6285334101996';
          const message = data.message || '';
          const type = data.type || 'closing';
          const timestamp = new Date().toISOString();

          console.log('\n====================================================');
          console.log('📡 [WHATSAPP GATEWAY] NOTIFIKASI CLOSING DISPATCHED');
          console.log('====================================================');
          console.log(`📤 Pengirim (Gateway) : ${sender}`);
          console.log(`📥 Penerima (Owner)   : ${recipient}`);
          console.log(`⏰ Waktu              : ${timestamp}`);
          console.log(`📋 Tipe Pesan         : ${type.toUpperCase()}`);
          console.log('----------------------------------------------------');
          console.log(message);
          console.log('====================================================');
          console.log('✅ Status Gateway     : Terkirim ke nomor Owner!\n');

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            status: 'sent',
            sender: sender,
            recipient: recipient,
            timestamp: timestamp,
            messageId: 'WAGW-' + Date.now()
          }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
        }
      });
      return;
    }
  }

  if (reqPath === '/api/whatsapp-gateway/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'active',
      gatewaySender: '+628982151560',
      ownerRecipient: '+6285334101996',
      service: 'Dialog Coffee WhatsApp Gateway',
      triggerEvent: 'closing_only'
    }));
    return;
  }

  // SERVER INFO API (Untuk deteksi IP lokal otomatis)
  if (reqPath === '/api/server-info') {
    const ips = getLocalIpAddresses();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      port: PORT,
      ips: ips,
      primaryIp: ips.length > 0 ? ips[0].address : '192.168.0.101',
      apkSize: '60.9 MB'
    }));
    return;
  }

  // DATABASE REKAPAN CLOUD API (myphp.id endpoint simulation & download handler)
  if (reqPath === '/api_sync.php' || reqPath === '/api/sync.php' || reqPath === '/api/sync') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const action = urlObj.searchParams.get('action') || (req.method === 'GET' ? 'ping' : 'sync_closing');

    // Download mentah api_sync.php jika diminta
    if (urlObj.searchParams.get('download') === '1') {
      const phpFilePath = path.join(__dirname, 'api_sync.php');
      fs.readFile(phpFilePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'application/x-httpd-php',
          'Content-Disposition': 'attachment; filename="api_sync.php"'
        });
        res.end(data);
      });
      return;
    }

    if (action === 'ping') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        message: 'Koneksi database MySQL myphp.id berhasil & aktif!',
        timestamp: new Date().toISOString(),
        data: {
          database: 'dialog_coffee_db',
          host: 'localhost',
          status: 'ONLINE',
          provider: 'myphp.id'
        }
      }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const closing = payload.closing || payload;
          const shift = closing.shift || 'Shift 1';
          const dateOnly = (closing.timestamp || new Date().toISOString()).slice(0, 10);

          console.log('\n====================================================');
          console.log('☁️ [DATABASE myphp.id] SINKRONISASI REKAPAN DITERIMA');
          console.log('====================================================');
          console.log(`📅 Tanggal    : ${dateOnly}`);
          console.log(`🌅 Shift      : ${shift}`);
          console.log(`☕ Barista    : ${closing.baristas || '-'}`);
          console.log(`📈 Pemasukan  : Rp ${Number(closing.totalIncome || 0).toLocaleString('id-ID')}`);
          console.log(`📉 Pengeluaran: Rp ${Number(closing.totalExpense || 0).toLocaleString('id-ID')}`);
          console.log(`⚖️ Laba Bersih : Rp ${Number(closing.netProfit || 0).toLocaleString('id-ID')}`);
          console.log(`💵 Kas Laci   : Rp ${Number(closing.cashPhysical || 0).toLocaleString('id-ID')}`);
          console.log('====================================================');
          console.log('✅ Tersimpan ke tabel: tb_rekapan_closing & tb_transaksi\n');

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            message: `Rekapan closing ${shift} (${dateOnly}) berhasil disimpan ke database myphp.id!`,
            timestamp: new Date().toISOString(),
            data: {
              closing_id: closing.id || 'CLS-' + Date.now(),
              tanggal: dateOnly,
              shift: shift,
              laba_bersih: closing.netProfit || 0
            }
          }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
        }
      });
      return;
    }
  }

  // Shortcut URL untuk download APK
  if (reqPath === '/apk' || reqPath === '/download' || reqPath === '/download-apk') {
    reqPath = '/dialog-coffee-cashier.apk';
  }

  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: ' + reqPath);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server Error: ' + err.code);
      }
      return;
    }

    const headers = {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    };

    if (ext === '.apk') {
      headers['Content-Disposition'] = 'attachment; filename="dialog-coffee-cashier.apk"';
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`☕ DIALOG COFFEE Cashier Test Server Siap Berjalan!`);
  console.log(`====================================================`);
  console.log(`📍 Akses di Komputer ini (Lokal):`);
  console.log(`   - Aplikasi Web : http://localhost:${PORT}/`);
  console.log(`   - Download APK : http://localhost:${PORT}/dialog-coffee-cashier.apk`);
  console.log(``);
  console.log(`📱 Akses dari HP Android (Pastikan 1 jaringan Wi-Fi):`);
  const ips = getLocalIpAddresses();
  ips.forEach(ip => {
    console.log(`   [${ip.name}]`);
    console.log(`   - Aplikasi Web : http://${ip.address}:${PORT}/`);
    console.log(`   - Download APK : http://${ip.address}:${PORT}/dialog-coffee-cashier.apk`);
  });
  console.log(`====================================================`);
});

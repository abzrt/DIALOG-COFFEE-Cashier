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
  let reqPath = req.url.split('?')[0];

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

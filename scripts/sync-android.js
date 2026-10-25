const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const distDir = path.resolve(srcDir, 'www');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

console.log('🔄 Menyiapkan folder www untuk Android build...');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const itemsToCopy = ['index.html', 'manifest.json', 'sw.js', 'css', 'js', 'assets', 'libs', 'api_sync.php', 'database_rekapan.sql', 'download.html', 'preview.html'];

itemsToCopy.forEach(item => {
  const itemSrc = path.join(srcDir, item);
  const itemDest = path.join(distDir, item);
  if (fs.existsSync(itemSrc)) {
    copyRecursiveSync(itemSrc, itemDest);
    console.log(`  ✓ Tersalin: ${item}`);
  }
});

console.log('✅ Sinkronisasi www selesai!');

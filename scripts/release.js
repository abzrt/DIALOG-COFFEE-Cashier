const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const versionJsonPath = path.join(rootDir, 'version.json');
const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
const updaterJsPath = path.join(rootDir, 'js', 'updater.js');
const indexHtmlPath = path.join(rootDir, 'index.html');
const swJsPath = path.join(rootDir, 'sw.js');

function runCmd(cmd) {
  console.log(`  > ${cmd}`);
  try {
    return execSync(cmd, { cwd: rootDir, stdio: 'inherit', encoding: 'utf8' });
  } catch (e) {
    console.error(`❌ Gagal mengeksekusi perintah: ${cmd}`);
    throw e;
  }
}

console.log('========================================================');
console.log('🚀 DIALOG COFFEE - OTOMATISASI RILIS APK KE GITHUB');
console.log('========================================================');

// 1. Baca version.json saat ini
if (!fs.existsSync(versionJsonPath)) {
  console.error('❌ File version.json tidak ditemukan!');
  process.exit(1);
}

const currentVersion = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
const oldCode = parseInt(currentVersion.versionCode, 10) || 5;
const oldName = String(currentVersion.versionName || '1.4').trim();

// Tentukan versi baru dari argumen CLI atau otomatis naikkan
const args = process.argv.slice(2);
let newName = args[0];
let customChangelog = args[1];

if (!newName) {
  // Otomatis naikkan minor version (misal: 1.4 -> 1.5)
  const parts = oldName.split('.').map(n => parseInt(n, 10) || 0);
  if (parts.length >= 2) {
    parts[parts.length - 1] += 1;
    newName = parts.join('.');
  } else {
    newName = oldName + '.1';
  }
} else {
  newName = newName.replace(/^v/i, '').trim();
}

const newCode = oldCode + 1;
const todayStr = new Date().toISOString().slice(0, 10);
const newChangelog = customChangelog || `Versi rilis resmi v${newName} (Build #${newCode}) - Pembaruan otomatis via GitHub.`;

console.log(`\n📌 Versi Sebelumnya: v${oldName} (Build #${oldCode})`);
console.log(`✨ Versi Baru       : v${newName} (Build #${newCode})`);
console.log(`📝 Catatan Rilis    : ${newChangelog}\n`);

// 2. Perbarui version.json
currentVersion.versionCode = newCode;
currentVersion.versionName = newName;
currentVersion.releaseDate = todayStr;
currentVersion.changelog = newChangelog;
currentVersion.apkUrl = `https://raw.githubusercontent.com/${currentVersion.githubRepo || 'abzrt/DIALOG-COFFEE-Cashier'}/main/dialog-coffee-cashier-v${newName}.apk`;
currentVersion.fallbackApkUrl = `https://raw.githubusercontent.com/${currentVersion.githubRepo || 'abzrt/DIALOG-COFFEE-Cashier'}/main/dialog-coffee-cashier-release.apk`;
currentVersion.downloadPageUrl = `https://github.com/${currentVersion.githubRepo || 'abzrt/DIALOG-COFFEE-Cashier'}`;

fs.writeFileSync(versionJsonPath, JSON.stringify(currentVersion, null, 2) + '\n', 'utf8');
console.log('✓ version.json diperbarui');

// Sinkronkan metadata versi ke Firebase RTDB agar auto-updater 100% selalu bisa membaca versi terbaru
try {
  const https = require('https');
  const payload = JSON.stringify(currentVersion);
  const req = https.request('https://tech-solution-6441a-default-rtdb.asia-southeast1.firebasedatabase.app/app_version.json', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  });
  req.on('error', () => {});
  req.write(payload);
  req.end();
  console.log('✓ Metadata versi dikirim ke Firebase RTDB (/app_version.json)');
} catch (e) {}

// 3. Perbarui android/app/build.gradle
if (fs.existsSync(buildGradlePath)) {
  let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
  gradleContent = gradleContent.replace(/versionName\s+["'][^"']+["']/, `versionName "${newName}"`);
  fs.writeFileSync(buildGradlePath, gradleContent, 'utf8');
  console.log('✓ android/app/build.gradle diperbarui');
}

// 4. Perbarui js/updater.js
if (fs.existsSync(updaterJsPath)) {
  let updaterContent = fs.readFileSync(updaterJsPath, 'utf8');
  updaterContent = updaterContent.replace(
    /CURRENT_VERSION:\s*\{[\s\S]*?versionCode:\s*\d+,[\s\S]*?versionName:\s*['"][^'"]+['"][\s\S]*?\}/,
    `CURRENT_VERSION: {\n    versionCode: ${newCode},\n    versionName: '${newName}'\n  }`
  );
  fs.writeFileSync(updaterJsPath, updaterContent, 'utf8');
  console.log('✓ js/updater.js diperbarui');
}

// 5. Perbarui index.html (tampilan versi & cache busting)
if (fs.existsSync(indexHtmlPath)) {
  let indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
  indexContent = indexContent.replace(/v\d+\.\d+\s*\(Build\s*#\d+\)/g, `v${newName} (Build #${newCode})`);
  const cacheBust = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  indexContent = indexContent.replace(/\.js\?v=\d+_\d+/g, `.js?v=${cacheBust}`);
  fs.writeFileSync(indexHtmlPath, indexContent, 'utf8');
  console.log('✓ index.html diperbarui');
}

// 6. Perbarui sw.js (cache name)
if (fs.existsSync(swJsPath)) {
  let swContent = fs.readFileSync(swJsPath, 'utf8');
  const cacheMatch = swContent.match(/dialog-coffee-cache-v(\d+)/);
  if (cacheMatch) {
    const nextCacheNum = parseInt(cacheMatch[1], 10) + 1;
    swContent = swContent.replace(/dialog-coffee-cache-v\d+/, `dialog-coffee-cache-v${nextCacheNum}`);
    fs.writeFileSync(swJsPath, swContent, 'utf8');
    console.log(`✓ sw.js cache dinaikkan ke v${nextCacheNum}`);
  }
}

// 7. Sinkronkan folder www dan salin ke Android
console.log('\n🔄 Sinkronisasi berkas web ke proyek Android...');
runCmd('node scripts/sync-android.js');
runCmd('node node_modules/@capacitor/cli/bin/capacitor copy android');

// 8. Kompilasi APK rilis baru secara otomatis
console.log('\n🔨 Mengompilasi APK rilis baru...');
const isWin = process.platform === 'win32';
const gradlewCmd = isWin ? 'gradlew.bat' : './gradlew';
console.log(`  > ${gradlewCmd} assembleRelease (in android/)`);
execSync(`${gradlewCmd} assembleRelease`, { cwd: path.join(rootDir, 'android'), stdio: 'inherit' });

// Salin file APK rilis ke root dengan nomor versi rilis agar langsung ter-commit dan ter-push ke GitHub
const builtApkPath = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const targetVersionedApk = path.join(rootDir, `dialog-coffee-cashier-v${newName}.apk`);
const targetReleaseApk = path.join(rootDir, 'dialog-coffee-cashier-release.apk');
const targetApk = path.join(rootDir, 'dialog-coffee-cashier.apk');

// Bersihkan APK versi lama di root jika ada agar repositori tetap rapi
const rootFiles = fs.readdirSync(rootDir);
rootFiles.forEach(file => {
  if (/^dialog-coffee-cashier-v\d+.*\.apk$/i.test(file) && file !== `dialog-coffee-cashier-v${newName}.apk`) {
    try {
      fs.unlinkSync(path.join(rootDir, file));
      console.log(`  - Menghapus APK versi lama: ${file}`);
    } catch (e) {}
  }
});

if (fs.existsSync(builtApkPath)) {
  fs.copyFileSync(builtApkPath, targetVersionedApk);
  fs.copyFileSync(builtApkPath, targetReleaseApk);
  fs.copyFileSync(builtApkPath, targetApk);
  console.log(`✓ APK rilis versi baru berhasil dikompilasi: dialog-coffee-cashier-v${newName}.apk`);
  console.log('✓ APK rilis umum diperbarui: dialog-coffee-cashier-release.apk');
}

// 9. Commit Git (Termasuk file APK), Buat Tag, dan Push ke GitHub
console.log('\n📦 Mengirim rilis baru ke GitHub...');
const commitMsg = `chore: release version v${newName} (Build #${newCode})`;
const tagMsg = `Release v${newName} (Build #${newCode})`;
const tagName = `v${newName}`;

runCmd('git add -A');
runCmd(`git commit -m "${commitMsg}"`);
runCmd(`git tag -a ${tagName} -m "${tagMsg}"`);
runCmd('git push origin main');
runCmd(`git push origin ${tagName}`);

console.log('\n========================================================');
console.log(`🎉 RILIS OTOMATIS v${newName} (Build #${newCode}) BERHASIL DI-PUSH KE GITHUB!`);
console.log('GitHub Actions akan otomatis mengompilasi APK dan menerbitkan rilis di:');
console.log(`🔗 https://github.com/${currentVersion.githubRepo || 'abzrt/DIALOG-COFFEE-Cashier'}/releases/tag/${tagName}`);
console.log('========================================================\n');

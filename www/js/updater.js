/**
 * DIALOG COFFEE Cashier - In-App Auto Updater Module (Metode 1)
 * Checks for new releases and prompts user to download and update APK.
 */
const AppUpdater = {
  CURRENT_VERSION: {
    versionCode: 5,
    versionName: '1.4'
  },
  availableUpdate: null,
  isChecking: false,

  getConfig() {
    const s = (window.StorageManager && StorageManager.getSettings) ? StorageManager.getSettings() : {};
    const defaultApiUrl = 'https://abzrtsushee.co-id.id/DIALOG%20COFFEE/data/api_sync.php';
    const apiUrl = (s.cloudSyncUrl && s.cloudSyncUrl !== 'api_sync.php') ? s.cloudSyncUrl : defaultApiUrl;
    return {
      apiUrl: apiUrl,
      checkUpdateEndpoint: apiUrl + (apiUrl.includes('?') ? '&' : '?') + 'action=check_update'
    };
  },

  init() {
    // Tampilkan versi saat ini di kartu pengaturan jika elemen ada
    this.renderCurrentVersionInfo();

    // Jalankan pengecekan pembaruan otomatis 4 detik setelah aplikasi siap
    setTimeout(() => {
      this.checkUpdate(true);
    }, 4000);
  },

  renderCurrentVersionInfo() {
    const statusEl = document.getElementById('updaterStatusText');
    if (statusEl) {
      statusEl.innerHTML = `<span>Versi Terpasang: <strong>v${this.CURRENT_VERSION.versionName} (Build #${this.CURRENT_VERSION.versionCode})</strong> &bull; Google Play Certified</span>`;
    }
  },

  async checkUpdate(silent = false) {
    if (this.isChecking) return;
    this.isChecking = true;

    const statusEl = document.getElementById('updaterStatusText');
    if (statusEl && !silent) {
      statusEl.innerHTML = '<span style="color: var(--text-muted);">🔄 Memeriksa rilis APK terbaru di server...</span>';
    }

    const cfg = this.getConfig();
    const endpoints = [
      cfg.checkUpdateEndpoint + '&t=' + Date.now(),
      'version.json?t=' + Date.now(),
      'https://raw.githubusercontent.com/abzrt/DIALOG-COFFEE-Cashier/main/version.json?t=' + Date.now()
    ];

    let updateInfo = null;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const resp = await fetch(url, {
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timer);
        if (resp.ok) {
          const res = await resp.json();
          const data = (res && res.data) ? res.data : res;
          if (data && data.versionCode) {
            updateInfo = data;
            break;
          }
        }
      } catch (e) {
        // Coba endpoint cadangan
      }
    }

    this.isChecking = false;

    if (!updateInfo) {
      if (!silent) {
        if (statusEl) {
          statusEl.innerHTML = '<span style="color: var(--expense-red);">✕ Gagal terhubung ke server pembaruan. Pastikan internet aktif.</span>';
        }
        if (window.App && App.showToast) {
          App.showToast('Gagal memeriksa pembaruan (offline / server tidak merespons)', 'error');
        }
      }
      return null;
    }

    const currentCode = this.CURRENT_VERSION.versionCode;
    const remoteCode = parseInt(updateInfo.versionCode, 10) || 0;

    if (remoteCode > currentCode) {
      this.availableUpdate = updateInfo;
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: var(--income-green); font-weight: 700;">🚀 Pembaruan v${updateInfo.versionName} (Build #${remoteCode}) tersedia!</span>`;
      }
      this.showModal(updateInfo);
      return updateInfo;
    } else {
      this.availableUpdate = null;
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: var(--income-green);">✓ Aplikasi adalah versi terbaru: <strong>v${this.CURRENT_VERSION.versionName} (Build #${currentCode})</strong></span>`;
      }
      if (!silent && window.App && App.showToast) {
        App.showToast(`Aplikasi sudah versi terbaru (v${this.CURRENT_VERSION.versionName})!`, 'success');
      }
      return null;
    }
  },

  showModal(info) {
    const modal = document.getElementById('appUpdateModal');
    if (!modal) return;

    const titleEl = document.getElementById('updateModalTitle');
    const subEl = document.getElementById('updateModalSubtitle');
    const changelogEl = document.getElementById('updateChangelogText');
    const progressEl = document.getElementById('updateDownloadProgress');
    const startBtn = document.getElementById('btnStartUpdate');
    const startBtnText = document.getElementById('btnStartUpdateText');

    if (titleEl) titleEl.textContent = `Pembaruan v${info.versionName} Tersedia!`;
    if (subEl) {
      subEl.innerHTML = `Versi terpasang: <strong>v${this.CURRENT_VERSION.versionName} (#${this.CURRENT_VERSION.versionCode})</strong> &bull; Versi baru: <strong style="color: var(--income-green);">v${info.versionName} (#${info.versionCode})</strong>`;
    }
    if (changelogEl) {
      changelogEl.textContent = info.changelog || 'Peningkatan performa, sinkronisasi cloud real-time, dan kestabilan kasir.';
    }
    if (progressEl) progressEl.style.display = 'none';
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.onclick = () => this.startDownload();
    }
    if (startBtnText) startBtnText.textContent = 'Perbarui Sekarang';

    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('appUpdateModal');
    if (modal) modal.classList.remove('active');
  },

  startDownload() {
    const info = this.availableUpdate;
    if (!info) return;

    const apkUrl = info.apkUrl || 'dialog-coffee-cashier-release.apk';
    const progressEl = document.getElementById('updateDownloadProgress');
    const startBtn = document.getElementById('btnStartUpdate');
    const startBtnText = document.getElementById('btnStartUpdateText');

    if (progressEl) progressEl.style.display = 'block';
    if (startBtn) startBtn.disabled = true;
    if (startBtnText) startBtnText.textContent = 'Mengunduh APK...';

    // Buka file APK melalui tautan unduhan langsung untuk memicu Android Package Installer
    try {
      const a = document.createElement('a');
      a.href = apkUrl;
      a.target = '_system';
      a.download = `dialog-coffee-cashier-v${info.versionName}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(apkUrl, '_system');
    }

    if (window.App && App.showToast) {
      App.showToast('Memulai pengunduhan APK pembaruan...', 'info');
    }

    setTimeout(() => {
      if (startBtn) {
        startBtn.disabled = false;
        if (startBtnText) startBtnText.textContent = 'Unduh Ulang / Buka Link';
        startBtn.onclick = () => {
          window.open(info.downloadPageUrl || apkUrl, '_blank');
        };
      }
    }, 3500);
  }
};

window.AppUpdater = AppUpdater;

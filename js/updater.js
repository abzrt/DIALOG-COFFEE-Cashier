/**
 * DIALOG COFFEE Cashier - In-App Auto Updater Module via GitHub
 * Checks GitHub Releases and version definitions for new builds,
 * prompts user with changelog modal, and downloads APK updates directly from GitHub.
 */
const AppUpdater = {
  CURRENT_VERSION: {
    versionCode: 6,
    versionName: '1.5'
  },
  DEFAULT_GITHUB_REPO: 'abzrt/DIALOG-COFFEE-Cashier',
  availableUpdate: null,
  isChecking: false,

  getConfig() {
    const s = (window.StorageManager && StorageManager.getSettings) ? StorageManager.getSettings() : {};
    const defaultApiUrl = 'https://abzrtsushee.co-id.id/DIALOG%20COFFEE/data/api_sync.php';
    const apiUrl = (s.cloudSyncUrl && s.cloudSyncUrl !== 'api_sync.php') ? s.cloudSyncUrl : defaultApiUrl;
    const repo = (s.githubRepo || this.DEFAULT_GITHUB_REPO).trim();
    const token = (s.githubToken || '').trim();

    return {
      githubRepo: repo,
      githubToken: token,
      githubApiEndpoint: `https://api.github.com/repos/${repo}/releases/latest`,
      githubRawEndpoint: `https://raw.githubusercontent.com/${repo}/main/version.json`,
      githubDirectApkUrl: `https://github.com/${repo}/raw/main/dialog-coffee-cashier-release.apk`,
      githubReleasesPage: `https://github.com/${repo}/releases/latest`,
      githubLatestApkUrl: `https://github.com/${repo}/releases/latest/download/dialog-coffee-cashier-release.apk`,
      apiUrl: apiUrl,
      checkUpdateEndpoint: apiUrl + (apiUrl.includes('?') ? '&' : '?') + 'action=check_update'
    };
  },

  init() {
    this.renderCurrentVersionInfo();

    // Jalankan pengecekan pembaruan otomatis via GitHub 4 detik setelah aplikasi siap
    setTimeout(() => {
      this.checkUpdate(true);
    }, 4000);

    // Pengecekan berkala otomatis setiap 30 menit
    setInterval(() => {
      this.checkUpdate(true);
    }, 30 * 60 * 1000);

    // Cek ulang saat aplikasi dibuka kembali / resume dari background
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkUpdate(true);
      }
    });
  },

  showBanner(info) {
    const banner = document.getElementById('appUpdateStickyBanner');
    const textEl = document.getElementById('updateBannerText');
    if (!banner) return;
    if (textEl && info) {
      textEl.textContent = `Pembaruan APK versi v${info.versionName} (#${info.versionCode}) tersedia di GitHub!`;
    }
    banner.style.display = 'flex';
  },

  hideBanner() {
    const banner = document.getElementById('appUpdateStickyBanner');
    if (banner) banner.style.display = 'none';
  },

  renderCurrentVersionInfo() {
    const statusEl = document.getElementById('updaterStatusText');
    if (statusEl) {
      statusEl.innerHTML = `<span>Versi Terpasang: <strong>v${this.CURRENT_VERSION.versionName} (Build #${this.CURRENT_VERSION.versionCode})</strong> &bull; Sumber Rilis: GitHub Releases</span>`;
    }
  },

  // Helper untuk membandingkan semver string (contoh: "1.5" > "1.4")
  compareSemver(v1, v2) {
    const p1 = String(v1).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const p2 = String(v2).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(p1.length, p2.length);
    for (let i = 0; i < maxLen; i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  },

  async checkUpdate(silent = false) {
    if (this.isChecking) return;
    this.isChecking = true;

    const statusEl = document.getElementById('updaterStatusText');
    if (statusEl && !silent) {
      statusEl.innerHTML = '<span style="color: var(--text-muted);">🔄 Memeriksa rilis APK terbaru di GitHub...</span>';
    }

    const cfg = this.getConfig();
    let updateInfo = null;

    // 1. Cek langsung via GitHub Releases API
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const headers = { 'Accept': 'application/vnd.github.v3+json' };
      if (cfg.githubToken) {
        headers['Authorization'] = `Bearer ${cfg.githubToken}`;
      }

      const ghResp = await fetch(cfg.githubApiEndpoint + '?t=' + Date.now(), {
        cache: 'no-store',
        headers: headers,
        signal: controller.signal
      });
      clearTimeout(timer);

      if (ghResp.ok) {
        const ghRelease = await ghResp.json();
        if (ghRelease && ghRelease.tag_name) {
          const tagName = String(ghRelease.tag_name).trim();
          const cleanVersionName = tagName.replace(/^v/i, '');
          
          // Cari asset file .apk di dalam rilis GitHub
          let apkDownloadUrl = cfg.githubLatestApkUrl;
          if (Array.isArray(ghRelease.assets) && ghRelease.assets.length > 0) {
            const apkAsset = ghRelease.assets.find(a => a.name && a.name.toLowerCase().endsWith('.apk'));
            if (apkAsset && apkAsset.browser_download_url) {
              apkDownloadUrl = apkAsset.browser_download_url;
            }
          }

          // Ekstrak nomor build jika tercantum dalam deskripsi / release notes
          let detectedBuildCode = 0;
          const buildMatch = String(ghRelease.body || '').match(/build\s*#?(\d+)/i) || String(ghRelease.name || '').match(/build\s*#?(\d+)/i);
          if (buildMatch) {
            detectedBuildCode = parseInt(buildMatch[1], 10);
          } else {
            // Estimasikan dari semver
            const comp = this.compareSemver(cleanVersionName, this.CURRENT_VERSION.versionName);
            detectedBuildCode = (comp > 0) ? (this.CURRENT_VERSION.versionCode + 1) : this.CURRENT_VERSION.versionCode;
          }

          updateInfo = {
            versionCode: detectedBuildCode,
            versionName: cleanVersionName,
            apkUrl: apkDownloadUrl,
            downloadPageUrl: ghRelease.html_url || cfg.githubReleasesPage,
            releaseDate: ghRelease.published_at ? ghRelease.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            changelog: ghRelease.body || ghRelease.name || `Pembaruan resmi ${tagName} via GitHub.`
          };
        }
      }
    } catch (e) {
      // Lanjut ke endpoint cadangan
    }

    // 2. Jika GitHub Releases API belum ada atau kena limit, cek version.json di GitHub Raw / Server
    if (!updateInfo) {
      const fallbackUrls = [
        cfg.githubRawEndpoint + '?t=' + Date.now(),
        cfg.checkUpdateEndpoint + '&t=' + Date.now(),
        'version.json?t=' + Date.now()
      ];

      for (const url of fallbackUrls) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const headers = {};
          if (cfg.githubToken && url.includes('github')) {
            headers['Authorization'] = `Bearer ${cfg.githubToken}`;
          }
          const resp = await fetch(url, {
            cache: 'no-store',
            headers: headers,
            signal: controller.signal
          });
          clearTimeout(timer);
          if (resp.ok) {
            const res = await resp.json();
            const data = (res && res.data) ? res.data : res;
            if (data && data.versionCode) {
              updateInfo = data;
              // Pastikan apkUrl mengarah ke direct raw atau release GitHub
              if (!updateInfo.apkUrl) {
                updateInfo.apkUrl = cfg.githubDirectApkUrl || cfg.githubLatestApkUrl;
              }
              if (!updateInfo.downloadPageUrl) {
                updateInfo.downloadPageUrl = cfg.githubReleasesPage;
              }
              break;
            }
          }
        } catch (err) {}
      }
    }

    this.isChecking = false;

    if (!updateInfo) {
      if (!silent) {
        if (statusEl) {
          statusEl.innerHTML = '<span style="color: var(--expense-red);">✕ Gagal terhubung ke GitHub Releases. Pastikan koneksi internet aktif.</span>';
        }
        if (window.App && App.showToast) {
          App.showToast('Gagal memeriksa rilis GitHub (offline / server GitHub tidak merespons)', 'error');
        }
      }
      return null;
    }

    const currentCode = this.CURRENT_VERSION.versionCode;
    const remoteCode = parseInt(updateInfo.versionCode, 10) || 0;
    const semverDiff = this.compareSemver(updateInfo.versionName, this.CURRENT_VERSION.versionName);

    // Deteksi apakah rilis lebih baru berdasarkan versionCode atau semver
    const isNewer = remoteCode > currentCode || semverDiff > 0;

    if (isNewer) {
      this.availableUpdate = updateInfo;
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: var(--income-green); font-weight: 700;">🚀 Pembaruan GitHub v${updateInfo.versionName} (Build #${remoteCode}) tersedia!</span>`;
      }
      this.showBanner(updateInfo);
      this.showModal(updateInfo);
      return updateInfo;
    } else {
      this.availableUpdate = null;
      this.hideBanner();
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: var(--income-green);">✓ Aplikasi adalah versi terbaru: <strong>v${this.CURRENT_VERSION.versionName} (Build #${currentCode})</strong> via GitHub</span>`;
      }
      if (!silent && window.App && App.showToast) {
        App.showToast(`Aplikasi sudah versi terbaru di GitHub (v${this.CURRENT_VERSION.versionName})!`, 'success');
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

    if (titleEl) titleEl.textContent = `Pembaruan GitHub v${info.versionName} Tersedia!`;
    if (subEl) {
      subEl.innerHTML = `Versi terpasang: <strong>v${this.CURRENT_VERSION.versionName} (#${this.CURRENT_VERSION.versionCode})</strong> &bull; Rilis Baru: <strong style="color: var(--income-green);">v${info.versionName} (#${info.versionCode})</strong> &bull; GitHub Releases`;
    }
    if (changelogEl) {
      changelogEl.textContent = info.changelog || 'Peningkatan performa, sinkronisasi cloud real-time, dan pembaruan rilis GitHub.';
    }
    if (progressEl) progressEl.style.display = 'none';
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.onclick = () => this.startDownload();
    }
    if (startBtnText) startBtnText.textContent = 'Unduh & Perbarui dari GitHub';

    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('appUpdateModal');
    if (modal) modal.classList.remove('active');
  },

  startDownload() {
    const info = this.availableUpdate;
    if (!info) return;

    const cfg = this.getConfig();
    const apkUrl = info.apkUrl || cfg.githubDirectApkUrl || cfg.githubLatestApkUrl;
    const progressEl = document.getElementById('updateDownloadProgress');
    const startBtn = document.getElementById('btnStartUpdate');
    const startBtnText = document.getElementById('btnStartUpdateText');

    if (progressEl) progressEl.style.display = 'block';
    if (startBtn) startBtn.disabled = true;
    if (startBtnText) startBtnText.textContent = 'Mengunduh APK dari GitHub...';

    // Buka tautan APK GitHub untuk memicu Download Manager bawaan Android
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
      App.showToast('Memulai pengunduhan APK rilis dari GitHub...', 'info');
    }

    setTimeout(() => {
      if (startBtn) {
        startBtn.disabled = false;
        if (startBtnText) startBtnText.textContent = 'Buka Halaman Rilis GitHub';
        startBtn.onclick = () => {
          window.open(info.downloadPageUrl || cfg.githubReleasesPage, '_blank');
        };
      }
    }, 4000);
  }
};

window.AppUpdater = AppUpdater;

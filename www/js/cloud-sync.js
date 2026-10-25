/**
 * DIALOG COFFEE Cashier - Cloud Database Sync Module (myphp.id / MySQL)
 * Handles automatic and manual synchronization of cashier reports,
 * shift closings, and transactions to a remote PHP/MySQL server on myphp.id.
 */

const CloudSync = {
  isSyncing: false,

  getConfig() {
    const s = StorageManager.getSettings();
    const defaultUrl = 'https://abzrtsushee.co-id.id/DIALOG%20COFFEE/data/api_sync.php';
    const currentUrl = (s.cloudSyncUrl || '').trim();
    return {
      url: (!currentUrl || currentUrl === 'api_sync.php') ? defaultUrl : currentUrl,
      apiKey: (s.cloudApiKey || 'dialog2026').trim(),
      autoSync: s.cloudAutoSync !== false,
      lastSync: s.lastCloudSync || null
    };
  },

  resolveUrl(endpoint) {
    const cfg = this.getConfig();
    let url = endpoint || cfg.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Relative path: resolve to current host
      const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
      url = new URL(url, base).href;
    }
    return url;
  },

  async testConnection(customUrl) {
    const cfg = this.getConfig();
    const targetUrl = this.resolveUrl(customUrl || cfg.url);
    const pingUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=ping&t=' + Date.now();

    const statusEl = document.getElementById('cloudSyncStatusText');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: var(--text-muted);">🔄 Menguji koneksi ke ${targetUrl}...</span>`;
    }

    try {
      const resp = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': cfg.apiKey
        }
      });

      let res = null;
      try {
        res = await resp.json();
      } catch (err) {}

      if (!resp.ok) {
        throw new Error(res?.message || `HTTP Error ${resp.status}: ${resp.statusText}`);
      }
      if (res.success) {
        if (statusEl) {
          statusEl.innerHTML = `<span style="color: var(--income-green); font-weight: 700;">✓ Database Terhubung: ${res.data?.database || 'MySQL myphp.id'} (${res.data?.status || 'ONLINE'})</span>`;
        }
        if (window.App) {
          App.playChime();
          App.showToast('Koneksi ke database MySQL myphp.id Berhasil!', 'success');
        }
        return true;
      } else {
        throw new Error(res.message || 'Gagal terhubung ke database');
      }
    } catch (e) {
      console.warn('Cloud Sync test connection failed:', e);
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: var(--expense-red); font-weight: 700;">✕ Gagal: ${e.message}</span>`;
      }
      if (window.App) {
        App.playBeep(260, 0.15, 'sawtooth');
        App.showToast(`Koneksi database gagal: ${e.message}`, 'error');
      }
      return false;
    }
  },

  async syncClosingRecord(closingSummary) {
    if (!closingSummary) return;
    const cfg = this.getConfig();
    if (!cfg.autoSync) return;

    const targetUrl = this.resolveUrl(cfg.url);
    const syncUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=sync_closing';

    console.log('☁️ Mengirim rekapan closing ke database myphp.id...');

    try {
      const resp = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Api-Key': cfg.apiKey
        },
        body: JSON.stringify({
          api_key: cfg.apiKey,
          closing: closingSummary
        })
      });

      if (resp.ok) {
        const res = await resp.json();
        if (res.success) {
          console.log('✅ Rekapan closing berhasil tersimpan di database myphp.id:', res);
          const s = StorageManager.getSettings();
          s.lastCloudSync = new Date().toISOString();
          StorageManager.saveSettings(s);
          this.updateStatusBadge();
          if (window.App) {
            App.showToast('Rekapan closing tersimpan di database cloud (myphp.id)!', 'success');
          }
        }
      }
    } catch (e) {
      console.warn('Gagal sinkronisasi closing ke cloud (offline/server down):', e);
    }
  },

  async syncAllData() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const cfg = this.getConfig();
    const targetUrl = this.resolveUrl(cfg.url);
    const syncUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=sync_all';

    const transactions = StorageManager.getTransactions();
    const closings = StorageManager.getClosings ? StorageManager.getClosings() : [];

    if (window.App) App.showToast('Memulai sinkronisasi seluruh data ke database myphp.id...', 'info');

    const statusEl = document.getElementById('cloudSyncStatusText');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: var(--text-muted);">🔄 Menyinkronkan ${transactions.length} transaksi & ${closings.length} rekapan closing...</span>`;
    }

    try {
      const resp = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Api-Key': cfg.apiKey
        },
        body: JSON.stringify({
          api_key: cfg.apiKey,
          transactions: transactions,
          closings: closings
        })
      });

      if (!resp.ok) {
        throw new Error(`HTTP Error ${resp.status}`);
      }

      const res = await resp.json();
      if (res.success) {
        const s = StorageManager.getSettings();
        s.lastCloudSync = new Date().toISOString();
        StorageManager.saveSettings(s);
        this.updateStatusBadge();

        if (statusEl) {
          statusEl.innerHTML = `<span style="color: var(--income-green); font-weight: 700;">✓ Sukses: ${res.message}</span>`;
        }
        if (window.App) {
          App.playChime();
          App.showToast('Semua rekapan berhasil tersinkron ke database myphp.id!', 'success');
        }
      } else {
        throw new Error(res.message || 'Gagal sinkronisasi data');
      }
    } catch (e) {
      console.error('Sync all data failed:', e);
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: var(--expense-red); font-weight: 700;">✕ Gagal: ${e.message}</span>`;
      }
      if (window.App) {
        App.playBeep(260, 0.15, 'sawtooth');
        App.showToast(`Sinkronisasi gagal: ${e.message}`, 'error');
      }
    } finally {
      this.isSyncing = false;
    }
  },

  updateStatusBadge() {
    const s = StorageManager.getSettings();
    const lastSync = s.lastCloudSync;
    const badgeEls = document.querySelectorAll('.cloud-sync-last-time');
    badgeEls.forEach(el => {
      if (lastSync) {
        const d = new Date(lastSync);
        el.textContent = `Terakhir Sinkron: ${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        el.textContent = 'Terakhir Sinkron: Belum pernah';
      }
    });
  },

  downloadSQL() {
    const a = document.createElement('a');
    a.href = 'database_rekapan.sql';
    a.download = 'database_rekapan.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (window.App) App.showToast('Mengunduh database_rekapan.sql untuk phpMyAdmin myphp.id', 'info');
  },

  downloadPHP() {
    const a = document.createElement('a');
    a.href = 'api_sync.php?download=1';
    a.download = 'api_sync.php';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (window.App) App.showToast('Mengunduh api_sync.php untuk diunggah ke hosting myphp.id', 'info');
  },

  init() {
    this.fetchSettingsFromCloud();
    if (!this._syncInterval) {
      this._syncInterval = setInterval(() => {
        this.fetchSettingsFromCloud();
      }, 60000);
    }
    window.addEventListener('focus', () => {
      this.fetchSettingsFromCloud();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchSettingsFromCloud();
      }
    });
  },

  async syncSettingsToCloud(settings) {
    if (!settings) settings = StorageManager.getSettings();
    const cfg = this.getConfig();
    const payload = {
      api_key: cfg.apiKey,
      settings: {
        baristaPin: settings.baristaPin || '6969',
        ownerPin: settings.ownerPin || '1996',
        cafeName: settings.cafeName || 'DIALOG COFFEE',
        updatedAt: new Date().toISOString()
      }
    };

    const trySync = async (targetEndpoint, timeoutMs = 3500) => {
      const targetUrl = this.resolveUrl(targetEndpoint);
      const syncUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=save_settings';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const resp = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Api-Key': cfg.apiKey
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    };

    try {
      const res = await trySync(cfg.url, 3000);
      if (res && res.success) {
        console.log('⚡ Password/Pengaturan berhasil disinkronkan ke Cloud (Respon Cepat):', res);
        return true;
      }
    } catch (e) {
      if (window.location && window.location.protocol.startsWith('http') && cfg.url !== 'api_sync.php') {
        try {
          const resLocal = await trySync('api_sync.php', 2000);
          if (resLocal && resLocal.success) {
            console.log('⚡ Password/Pengaturan tersinkron ke local test server (Respon Cepat):', resLocal);
            return true;
          }
        } catch (errLocal) {}
      }
      console.warn('Gagal menyinkronkan pengaturan ke cloud:', e);
    }
    return false;
  },

  async fetchSettingsFromCloud(timeoutMs = 2500) {
    const cfg = this.getConfig();
    const tryFetch = async (targetEndpoint) => {
      const targetUrl = this.resolveUrl(targetEndpoint);
      const fetchUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=get_settings&t=' + Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const resp = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': cfg.apiKey
          },
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    };

    let res = null;
    try {
      res = await tryFetch(cfg.url);
    } catch (e) {
      if (window.location && window.location.protocol.startsWith('http') && cfg.url !== 'api_sync.php') {
        try {
          res = await tryFetch('api_sync.php');
        } catch (errLocal) {}
      }
    }

    if (res && res.success && res.data) {
      const cloudData = res.data;
      const s = StorageManager.getSettings();
      let hasChange = false;

      if (cloudData.baristaPin && String(cloudData.baristaPin).trim() !== String(s.baristaPin).trim()) {
        console.log(`🔄 Password barista diperbarui dari Cloud: ${s.baristaPin} -> ${cloudData.baristaPin}`);
        s.baristaPin = String(cloudData.baristaPin).trim();
        hasChange = true;
      }
      if (cloudData.ownerPin && String(cloudData.ownerPin).trim() !== String(s.ownerPin).trim()) {
        s.ownerPin = String(cloudData.ownerPin).trim();
        hasChange = true;
      }

      if (hasChange) {
        StorageManager.saveSettings(s);
        const cfgBaristaInput = document.getElementById('cfgBaristaPin');
        if (cfgBaristaInput) cfgBaristaInput.value = s.baristaPin;
        const cfgOwnerInput = document.getElementById('cfgOwnerPin');
        if (cfgOwnerInput) cfgOwnerInput.value = s.ownerPin;
      }
      return cloudData;
    }
    return null;
  }
};

window.CloudSync = CloudSync;

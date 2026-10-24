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
  }
};

window.CloudSync = CloudSync;

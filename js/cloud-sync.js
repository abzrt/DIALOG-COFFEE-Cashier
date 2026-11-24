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

    const payload = {
      api_key: cfg.apiKey,
      closing: closingSummary
    };

    const trySync = async (endpoint, timeoutMs = 15000) => {
      const targetUrl = this.resolveUrl(endpoint);
      const syncUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=sync_closing';
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

    console.log('☁️ Mengirim rekapan closing ke database cloud...');

    try {
      const res = await trySync(cfg.url, 15000);
      if (res && res.success) {
        console.log('✅ Rekapan closing berhasil tersimpan di database cloud:', res);
        const s = StorageManager.getSettings();
        s.lastCloudSync = new Date().toISOString();
        StorageManager.saveSettings(s);
        this.updateStatusBadge();
        if (window.App) {
          App.showToast('✅ Rekapan closing tersimpan otomatis di database!', 'success');
        }
        return true;
      }
    } catch (e) {
      if (window.location && window.location.protocol.startsWith('http') && cfg.url !== 'api_sync.php') {
        try {
          const resLocal = await trySync('api_sync.php', 4000);
          if (resLocal && resLocal.success) {
            console.log('✅ Rekapan closing tersimpan di local server database:', resLocal);
            const s = StorageManager.getSettings();
            s.lastCloudSync = new Date().toISOString();
            StorageManager.saveSettings(s);
            this.updateStatusBadge();
            if (window.App) {
              App.showToast('✅ Rekapan closing tersimpan otomatis di database!', 'success');
            }
            return true;
          }
        } catch (errLocal) {}
      }
      console.warn('Gagal sinkronisasi closing ke cloud (offline/server down):', e);
    }
    return false;
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
        this.fetchTransactionsFromCloud(6000);
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

  _fetchPromise: null,
  _isSavingSettings: false,
  _syncVersion: 0,

  init() {
    this.fetchSettingsFromCloud(8000, true);
    this.fetchTransactionsFromCloud(8000);

    if (!this._syncInterval) {
      this._syncInterval = setInterval(() => {
        const isLoginModalActive = document.getElementById('accountLoginModal')?.classList.contains('active');
        if (isLoginModalActive || document.visibilityState === 'visible') {
          this.fetchSettingsFromCloud(5000);
          this.fetchTransactionsFromCloud(5000);
        }
      }, 5000);
    }
    window.addEventListener('focus', () => {
      this.fetchSettingsFromCloud(5000);
      this.fetchTransactionsFromCloud(5000);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.fetchSettingsFromCloud(5000, true);
        this.fetchTransactionsFromCloud(5000);
      }
    });
    window.addEventListener('touchstart', (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#settingsForm')) return;
      const now = Date.now();
      if (!this._lastTouchSync || now - this._lastTouchSync > 10000) {
        this._lastTouchSync = now;
        this.fetchSettingsFromCloud(5000);
        this.fetchTransactionsFromCloud(5000);
      }
    }, { passive: true });
  },

  async syncSettingsToCloud(settings) {
    if (!settings) settings = StorageManager.getSettings();
    this._isSavingSettings = true;
    this._syncVersion++;
    const cfg = this.getConfig();
    const currentMenu = (window.StorageManager && StorageManager.getMenu) ? StorageManager.getMenu() : [];
    const payload = {
      api_key: cfg.apiKey,
      settings: {
        baristaPin: String(settings.baristaPin ?? '6969').trim() || '6969',
        ownerPin: String(settings.ownerPin ?? '1996').trim() || '1996',
        cafeName: settings.cafeName || 'DIALOG COFFEE',
        tagline: settings.tagline || '',
        address: settings.address || '',
        phone: settings.phone || '',
        instagram: settings.instagram || '',
        gatewayPhone: settings.gatewayPhone || '',
        ownerPhone: settings.ownerPhone || '',
        taxRate: Number(settings.taxRate) || 0,
        taxEnabled: settings.taxEnabled === true,
        receiptFooter: settings.receiptFooter || '',
        baristas: settings.baristas || ['Ardi', 'Anca', 'Jhonson', 'Si Pur'],
        menuList: currentMenu,
        updatedAt: new Date().toISOString()
      }
    };

    const trySync = async (targetEndpoint, timeoutMs = 15000) => {
      const targetUrl = this.resolveUrl(targetEndpoint);
      const syncUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=save_settings&t=' + Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const resp = await fetch(syncUrl, {
          method: 'POST',
          cache: 'no-store',
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
      const res = await trySync(cfg.url, 15000);
      if (res && res.success) {
        console.log('⚡ Password/Pengaturan berhasil disinkronkan ke Cloud (Respon Cepat):', res);
        return true;
      }
    } catch (e) {
      if (window.location && window.location.protocol.startsWith('http') && cfg.url !== 'api_sync.php') {
        try {
          const resLocal = await trySync('api_sync.php', 3000);
          if (resLocal && resLocal.success) {
            console.log('⚡ Password/Pengaturan tersinkron ke local test server (Respon Cepat):', resLocal);
            return true;
          }
        } catch (errLocal) {}
      }
      console.warn('Gagal menyinkronkan pengaturan ke cloud:', e);
    } finally {
      this._isSavingSettings = false;
    }
    return false;
  },

  async fetchSettingsFromCloud(timeoutMs = 15000, forceFresh = false) {
    if (this._isSavingSettings) {
      return null;
    }
    if (this._fetchPromise && !forceFresh) {
      return this._fetchPromise;
    }

    const fetchVersion = this._syncVersion;

    this._fetchPromise = (async () => {
      const cfg = this.getConfig();
      const tryFetch = async (targetEndpoint) => {
        const targetUrl = this.resolveUrl(targetEndpoint);
        const fetchUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=get_settings&t=' + Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const resp = await fetch(fetchUrl, {
            method: 'GET',
            cache: 'no-store',
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

      // Abaikan hasil fetch jika Owner baru saja menyimpan pengaturan selama request berlangsung
      if (this._isSavingSettings || fetchVersion !== this._syncVersion) {
        return null;
      }

      if (res && res.success && res.data) {
        const cloudData = res.data;
        const s = StorageManager.getSettings();
        let hasChange = false;
        let baristaPinChanged = false;
        let menuChanged = false;

        if (cloudData.baristaPin !== undefined && cloudData.baristaPin !== null && String(cloudData.baristaPin).trim() !== '') {
          const newBaristaPin = String(cloudData.baristaPin).trim();
          if (newBaristaPin !== String(s.baristaPin).trim()) {
            console.log(`🔄 Password barista diperbarui dari Cloud: ${s.baristaPin} -> ${newBaristaPin}`);
            s.baristaPin = newBaristaPin;
            hasChange = true;
            baristaPinChanged = true;
          }
        }
        if (cloudData.ownerPin !== undefined && cloudData.ownerPin !== null && String(cloudData.ownerPin).trim() !== '') {
          const newOwnerPin = String(cloudData.ownerPin).trim();
          if (newOwnerPin !== String(s.ownerPin).trim()) {
            s.ownerPin = newOwnerPin;
            hasChange = true;
          }
        }
        if (cloudData.cafeName && cloudData.cafeName !== s.cafeName) {
          s.cafeName = cloudData.cafeName;
          hasChange = true;
        }
        if (cloudData.tagline !== undefined && cloudData.tagline !== s.tagline) {
          s.tagline = cloudData.tagline;
          hasChange = true;
        }
        if (cloudData.address !== undefined && cloudData.address !== s.address) {
          s.address = cloudData.address;
          hasChange = true;
        }
        if (cloudData.phone !== undefined && cloudData.phone !== s.phone) {
          s.phone = cloudData.phone;
          hasChange = true;
        }
        if (cloudData.instagram !== undefined && cloudData.instagram !== s.instagram) {
          s.instagram = cloudData.instagram;
          hasChange = true;
        }
        if (cloudData.gatewayPhone !== undefined && cloudData.gatewayPhone !== s.gatewayPhone) {
          s.gatewayPhone = cloudData.gatewayPhone;
          hasChange = true;
        }
        if (cloudData.ownerPhone !== undefined && cloudData.ownerPhone !== s.ownerPhone) {
          s.ownerPhone = cloudData.ownerPhone;
          hasChange = true;
        }
        if (cloudData.taxRate !== undefined && Number(cloudData.taxRate) !== Number(s.taxRate)) {
          s.taxRate = Number(cloudData.taxRate);
          hasChange = true;
        }
        if (cloudData.taxEnabled !== undefined) {
          const newTaxEnabled = cloudData.taxEnabled === true || cloudData.taxEnabled === 'true' || cloudData.taxEnabled === 1 || cloudData.taxEnabled === '1';
          if (newTaxEnabled !== !!s.taxEnabled) {
            s.taxEnabled = newTaxEnabled;
            hasChange = true;
          }
        }
        if (cloudData.receiptFooter !== undefined && cloudData.receiptFooter !== s.receiptFooter) {
          s.receiptFooter = cloudData.receiptFooter;
          hasChange = true;
        }
        if (cloudData.baristas !== undefined) {
          let bList = cloudData.baristas;
          if (typeof bList === 'string') {
            try { bList = JSON.parse(bList); } catch (e) {}
          }
          if (Array.isArray(bList) && bList.length > 0 && JSON.stringify(bList) !== JSON.stringify(s.baristas)) {
            s.baristas = bList;
            hasChange = true;
          }
        }

        // Sinkronisasi Menu Produk, Harga, Kategori & Deskripsi ke Kasir Barista
        let cloudMenu = cloudData.menuList || cloudData.menu;
        if (typeof cloudMenu === 'string') {
          try { cloudMenu = JSON.parse(cloudMenu); } catch (e) {}
        }
        if (Array.isArray(cloudMenu) && cloudMenu.length > 0) {
          const localMenu = StorageManager.getMenu();
          if (JSON.stringify(cloudMenu) !== JSON.stringify(localMenu)) {
            console.log('🔄 Menu produk & harga diperbarui dari Cloud!');
            StorageManager.saveMenu(cloudMenu);
            menuChanged = true;
          }
        }

        if (hasChange) {
          StorageManager.saveSettings(s);
          const cfgBaristaInput = document.getElementById('cfgBaristaPin');
          if (cfgBaristaInput && document.activeElement !== cfgBaristaInput) {
            cfgBaristaInput.value = s.baristaPin;
          }
          const cfgOwnerInput = document.getElementById('cfgOwnerPin');
          if (cfgOwnerInput && document.activeElement !== cfgOwnerInput) {
            cfgOwnerInput.value = s.ownerPin;
          }
          if (window.App && App.loadShiftHeader) {
            App.loadShiftHeader();
          }

          // Jika di perangkat ini sedang login sebagai Barista dan Owner mengubah password Barista, wajibkan login ulang dengan PIN baru
          if (baristaPinChanged && window.AuthModule && AuthModule.isBarista()) {
            AuthModule.clearSession();
            AuthModule.openLoginModal(false);
            if (window.App && App.showToast) {
              App.showToast('🔐 Password Barista telah diperbarui oleh Owner. Silakan login dengan PIN baru.', 'info');
            }
          }
        }

        if (menuChanged) {
          if (window.POSModule) {
            POSModule.renderMenu();
            POSModule.renderCart();
          }
          if (window.App && App.renderSettingsMenuList) {
            App.renderSettingsMenuList();
          }
        }
        return cloudData;
      }
      return null;
    })().finally(() => {
      this._fetchPromise = null;
    });

    return this._fetchPromise;
  },

  _isFetchingTrx: false,
  async fetchTransactionsFromCloud(timeoutMs = 8000) {
    if (this._isFetchingTrx) return null;
    this._isFetchingTrx = true;

    const cfg = this.getConfig();
    const tryFetchTrx = async (endpoint) => {
      const targetUrl = this.resolveUrl(endpoint);
      const url = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=get_transactions&t=' + Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
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
      res = await tryFetchTrx(cfg.url);
    } catch (e) {
      if (window.location && window.location.protocol.startsWith('http') && cfg.url !== 'api_sync.php') {
        try {
          res = await tryFetchTrx('api_sync.php');
        } catch (errLocal) {}
      }
    }

    this._isFetchingTrx = false;

    if (res && res.success && res.data) {
      const remoteTrx = res.data.transactions || [];
      const remoteClosings = res.data.closings || [];

      let hasTrxChanges = false;
      if (Array.isArray(remoteTrx) && remoteTrx.length > 0) {
        const localTrx = StorageManager.getTransactions();
        const localIdMap = new Set(localTrx.map(t => t.id));
        const merged = [...localTrx];

        remoteTrx.forEach(rt => {
          if (rt && rt.id && !localIdMap.has(rt.id)) {
            merged.push(rt);
            localIdMap.add(rt.id);
            hasTrxChanges = true;
          }
        });

        if (hasTrxChanges) {
          merged.sort((a, b) => new Date(b.date) - new Date(a.date));
          StorageManager.saveAllTransactions(merged);
          console.log(`☁️ ${remoteTrx.length} transaksi cloud berhasil disinkronkan ke lokal.`);
        }
      }

      if (Array.isArray(remoteClosings) && remoteClosings.length > 0) {
        const localClosings = StorageManager.getClosings ? StorageManager.getClosings() : [];
        const localCloseIdMap = new Set(localClosings.map(c => c.id));
        let closeChanged = false;
        remoteClosings.forEach(rc => {
          if (rc && rc.id && !localCloseIdMap.has(rc.id)) {
            localClosings.push(rc);
            localCloseIdMap.add(rc.id);
            closeChanged = true;
          }
        });
        if (closeChanged) {
          if (StorageManager.saveAllClosings) {
            StorageManager.saveAllClosings(localClosings);
          } else {
            localStorage.setItem('dialog_coffee_closings_v3', JSON.stringify(localClosings));
          }
        }
      }

      if (hasTrxChanges || closeChanged) {
        if (window.OwnerModule && OwnerModule.isLoggedIn()) {
          OwnerModule.renderAll();
        }
        if (window.FinanceModule) {
          FinanceModule.renderAll();
        }
        if (window.ReportsModule) {
          ReportsModule.renderAll();
        }
      }
      return res.data;
    }
    return null;
  },

  async pushTransactionToCloud(trx) {
    if (!trx) return;
    const cfg = this.getConfig();
    if (!cfg.autoSync) return;

    try {
      const targetUrl = this.resolveUrl(cfg.url);
      const syncUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=sync_all';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Api-Key': cfg.apiKey
        },
        body: JSON.stringify({
          api_key: cfg.apiKey,
          transactions: [trx]
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
    } catch (e) {
      console.warn('Silent cloud transaction push failed (akan dicoba lagi saat closing/syncAll):', e);
    }
  },

  async deleteTransactionFromCloud(trxId) {
    if (!trxId) return;
    const cfg = this.getConfig();
    if (!cfg.autoSync) return;

    try {
      const targetUrl = this.resolveUrl(cfg.url);
      const syncUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'action=delete_transaction';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Api-Key': cfg.apiKey
        },
        body: JSON.stringify({
          api_key: cfg.apiKey,
          id: trxId
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
    } catch (e) {
      console.warn('Gagal menghapus transaksi dari cloud:', e);
    }
  }
};

window.CloudSync = CloudSync;

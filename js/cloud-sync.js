/**
 * DIALOG COFFEE Cashier - Real-Time Cloud Sync Module (Google Firebase Realtime Database)
 * Features:
 * - Real-time WebSocket synchronization for Transactions, Closings, Settings, Menu & PINs
 * - Anti Dual-Login with instant presence lock and onDisconnect cleanup
 * - Offline-first fallback to local storage
 */

const CloudSync = {
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyDjRXQX7W12N8_dIKf8f2OOPX2uD4OfKMA",
    authDomain: "tech-solution-6441a.firebaseapp.com",
    databaseURL: "https://tech-solution-6441a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "tech-solution-6441a",
    storageBucket: "tech-solution-6441a.firebasestorage.app",
    messagingSenderId: "415798163888",
    appId: "1:415798163888:web:0ffa4b8addce447251fe75"
  },
  db: null,
  isFirebaseReady: false,
  isFirebaseConnected: false,
  isSyncing: false,
  _isSavingSettings: false,
  _syncVersion: 0,
  _fetchPromise: null,
  _isFetchingTrx: false,

  getConfig() {
    const s = StorageManager.getSettings();
    return {
      url: s.cloudSyncUrl || this.FIREBASE_CONFIG.databaseURL,
      apiKey: (s.cloudApiKey || 'dialog2026').trim(),
      autoSync: s.cloudAutoSync !== false,
      lastSync: s.lastCloudSync || null
    };
  },

  init() {
    this.initFirebase();
  },

  initFirebase() {
    if (this.isFirebaseReady && this.db) return this.db;

    if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
      try {
        if (!firebase.apps || !firebase.apps.length) {
          firebase.initializeApp(this.FIREBASE_CONFIG);
        }
        this.db = firebase.database();
        this.isFirebaseReady = true;
        console.log('🔥 Google Firebase Realtime Database Aktif (Singapura)');

        // 1. Status Koneksi Real-Time
        this.db.ref('.info/connected').on('value', snap => {
          this.isFirebaseConnected = (snap.val() === true);
          this.updateStatusBadge();
        });

        // 2. Real-Time Listener: Anti Dual-Login
        this.listenActiveSession();

        // 3. Real-Time Listener: Settings (PIN & Menu)
        this.listenSettings();

        // 4. Real-Time Listener: Transaksi Kasir
        this.listenTransactions();

        // Tarik data awal dari Firebase saat startup
        this.fetchSettingsFromCloud();
        this.fetchTransactionsFromCloud();

        return this.db;
      } catch (e) {
        console.warn('Gagal inisialisasi Firebase:', e);
      }
    }
    return null;
  },

  async testConnection() {
    const statusEl = document.getElementById('cloudSyncStatusText');
    if (statusEl) {
      statusEl.innerHTML = '<span style="color: var(--text-muted);">🔄 Menguji koneksi ke Google Firebase (Singapura)...</span>';
    }

    try {
      this.initFirebase();
      if (!this.db) {
        const resp = await fetch(this.FIREBASE_CONFIG.databaseURL + '/.json?shallow=true');
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
      } else {
        await this.db.ref('_ping').set({ time: Date.now(), status: 'OK' });
      }

      if (statusEl) {
        statusEl.innerHTML = '<span style="color: var(--income-green); font-weight: 700;">✓ Database Terhubung: Google Firebase Realtime Database (Singapura - ONLINE)</span>';
      }
      if (window.App) {
        App.playChime();
        App.showToast('Koneksi ke Google Firebase Realtime Database Berhasil!', 'success');
      }
      return true;
    } catch (e) {
      console.warn('Firebase test connection failed:', e);
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

  async checkAndRegisterLoginSession(role, userName, deviceId, force = false) {
    this.initFirebase();
    const token = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

    if (this.db) {
      try {
        const sessionRef = this.db.ref('active_session');
        const snap = await sessionRef.once('value');
        const active = snap.val();

        if (!force && active && active.token) {
          const myToken = window.AuthModule ? AuthModule.getSessionToken() : '';
          const isSameDevice = (deviceId && active.deviceId === deviceId);
          const isSameToken = (active.token === myToken);

          if (!isSameDevice && !isSameToken) {
            const roleLabel = active.roleLabel || (active.role === 'owner' ? 'Owner' : 'Barista');
            const user = active.user || roleLabel;
            return {
              success: false,
              message: `Tidak bisa dual login! Akun saat ini sedang aktif digunakan oleh ${roleLabel} (${user}) di perangkat lain. Harap logout terlebih dahulu.`,
              data: { active_session: active }
            };
          }
        }

        const newSession = {
          role: role,
          roleLabel: role === 'owner' ? 'Owner' : 'Barista',
          user: userName,
          token: token,
          deviceId: deviceId,
          loginTime: new Date().toISOString(),
          lastPing: Date.now()
        };

        await sessionRef.set(newSession);

        // onDisconnect handler: jika perangkat mati/koneksi putus/aplikasi tertutup,
        // Firebase otomatis melepaskan status sesi aktif di cloud!
        sessionRef.onDisconnect().remove();

        return {
          success: true,
          message: `Login sesi berhasil untuk ${newSession.roleLabel}`,
          data: newSession
        };
      } catch (e) {
        console.warn('Firebase checkAndRegisterLoginSession error:', e);
        return { success: true, offline: true, data: { token: token } };
      }
    }

    return { success: true, offline: true, data: { token: token } };
  },

  async logoutSession(token) {
    this.initFirebase();
    if (this.db) {
      try {
        const sessionRef = this.db.ref('active_session');
        sessionRef.onDisconnect().cancel();
        await sessionRef.remove();
        console.log('⚡ Sesi logout dari Firebase berhasil');
      } catch (e) {
        console.warn('Gagal logout sesi di Firebase:', e);
      }
    }
  },

  async pingSession(token) {
    this.initFirebase();
    if (this.db && token) {
      try {
        await this.db.ref('active_session/lastPing').set(Date.now());
      } catch (e) {}
    }
  },

  async getActiveSession() {
    this.initFirebase();
    if (this.db) {
      try {
        const snap = await this.db.ref('active_session').once('value');
        return { success: true, data: snap.val() };
      } catch (e) {}
    }
    return null;
  },

  listenActiveSession() {
    if (!this.db) return;
    this.db.ref('active_session').on('value', snap => {
      const active = snap.val();
      const myDeviceId = window.AuthModule ? AuthModule.getDeviceId() : '';
      const myToken = window.AuthModule ? AuthModule.getSessionToken() : '';
      const modal = document.getElementById('accountLoginModal');
      const noticeEl = document.getElementById('authActiveSessionNotice');
      const noticeTitle = document.getElementById('authActiveSessionTitle');
      const noticeDesc = document.getElementById('authActiveSessionDesc');

      // 1. Tampilkan peringatan real-time di modal login jika ada perangkat lain yang aktif
      if (modal && modal.classList.contains('active')) {
        if (active && active.token && active.deviceId !== myDeviceId) {
          if (noticeEl) {
            noticeEl.style.display = 'block';
            if (noticeTitle) noticeTitle.textContent = 'Akun Sedang Digunakan di Perangkat Lain';
            if (noticeDesc) {
              noticeDesc.innerHTML = `Sistem membatasi 1 sesi aktif (Anti Dual-Login). Akun kasir saat ini sedang aktif digunakan oleh <strong>${active.roleLabel || active.role} (${active.user || 'Aktif'})</strong> di perangkat lain.<br><small style="color:var(--text-muted);">Sesi tersebut harus logout terlebih dahulu agar Anda dapat masuk.</small>`;
            }
          }
        } else if (window.AuthModule && !AuthModule.isLoggedIn()) {
          if (noticeEl) noticeEl.style.display = 'none';
        }
      }

      // 2. Jika perangkat ini sedang login, tetapi di Firebase sesi sudah ditutup oleh device lain (misal Owner force logout)
      if (window.AuthModule && AuthModule.isLoggedIn()) {
        if (!active || (active.token !== myToken && active.deviceId !== myDeviceId)) {
          AuthModule.clearSession();
          AuthModule.applyRoleUI(null);
          AuthModule.openLoginModal(false);
          if (window.App && App.showToast) {
            App.showToast('ℹ️ Sesi akun Anda telah diakhiri dari perangkat lain.', 'info');
          }
        }
      }
    });
  },

  listenSettings() {
    if (!this.db) return;
    this.db.ref('settings').on('value', snap => {
      const cloudData = snap.val();
      if (cloudData && typeof cloudData === 'object' && !this._isSavingSettings) {
        this.applyCloudSettings(cloudData);
      }
    });
  },

  async syncSettingsToCloud(settings) {
    if (!settings) settings = StorageManager.getSettings();
    this._isSavingSettings = true;
    this._syncVersion++;
    const currentMenu = (window.StorageManager && StorageManager.getMenu) ? StorageManager.getMenu() : [];

    const payload = {
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
    };

    this.initFirebase();
    if (this.db) {
      try {
        await this.db.ref('settings').set(payload);
        console.log('⚡ Pengaturan/PIN berhasil disinkronkan ke Firebase');
        this._isSavingSettings = false;
        return true;
      } catch (e) {
        console.warn('Gagal simpan pengaturan ke Firebase:', e);
      }
    }
    this._isSavingSettings = false;
    return false;
  },

  async fetchSettingsFromCloud() {
    this.initFirebase();
    if (this.db) {
      try {
        const snap = await this.db.ref('settings').once('value');
        const data = snap.val();
        if (data) {
          this.applyCloudSettings(data);
          return data;
        }
      } catch (e) {
        console.warn('fetchSettingsFromCloud error:', e);
      }
    }
    return null;
  },

  applyCloudSettings(cloudData) {
    if (!cloudData || typeof cloudData !== 'object') return;
    const s = StorageManager.getSettings();
    let hasChange = false;
    let baristaPinChanged = false;
    let menuChanged = false;

    if (cloudData.baristaPin !== undefined && cloudData.baristaPin !== null && String(cloudData.baristaPin).trim() !== '') {
      const newBaristaPin = String(cloudData.baristaPin).trim();
      if (newBaristaPin !== String(s.baristaPin).trim()) {
        console.log(`🔄 Password barista diperbarui dari Firebase: ${s.baristaPin} -> ${newBaristaPin}`);
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

    // Sinkronisasi Menu Produk & Harga
    let cloudMenu = cloudData.menuList || cloudData.menu;
    if (typeof cloudMenu === 'string') {
      try { cloudMenu = JSON.parse(cloudMenu); } catch (e) {}
    }
    if (Array.isArray(cloudMenu) && cloudMenu.length > 0) {
      const localMenu = StorageManager.getMenu();
      if (JSON.stringify(cloudMenu) !== JSON.stringify(localMenu)) {
        console.log('🔄 Menu produk & harga diperbarui dari Firebase!');
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
  },

  async pushTransactionToCloud(trx) {
    if (!trx || !trx.id) return;
    this.initFirebase();
    if (this.db) {
      try {
        await this.db.ref('transactions/' + trx.id).set(trx);
        console.log('⚡ Transaksi tersimpan instan ke Firebase:', trx.id);
      } catch (e) {
        console.warn('Gagal push transaksi ke Firebase:', e);
      }
    }
  },

  async deleteTransactionFromCloud(trxId) {
    if (!trxId) return;
    this.initFirebase();
    if (this.db) {
      try {
        await this.db.ref('transactions/' + trxId).remove();
        console.log('⚡ Transaksi dihapus dari Firebase:', trxId);
      } catch (e) {
        console.warn('Gagal delete transaksi dari Firebase:', e);
      }
    }
  },

  listenTransactions() {
    if (!this.db) return;

    this.db.ref('transactions').on('child_added', snap => {
      const trx = snap.val();
      if (trx && trx.id && window.StorageManager) {
        const local = StorageManager.getTransactions();
        if (!local.some(t => t.id === trx.id)) {
          local.unshift(trx);
          StorageManager.saveAllTransactions(local);
          if (window.OwnerModule && typeof OwnerModule.renderAll === 'function' && OwnerModule.isLoggedIn()) {
            OwnerModule.renderAll();
          }
          if (window.ReportsModule && typeof ReportsModule.renderSummaryCards === 'function') {
            ReportsModule.renderSummaryCards();
          }
        }
      }
    });

    this.db.ref('transactions').on('child_removed', snap => {
      const trx = snap.val();
      if (trx && trx.id && window.StorageManager) {
        let local = StorageManager.getTransactions();
        const before = local.length;
        local = local.filter(t => t.id !== trx.id);
        if (local.length !== before) {
          StorageManager.saveAllTransactions(local);
          if (window.OwnerModule && typeof OwnerModule.renderAll === 'function' && OwnerModule.isLoggedIn()) {
            OwnerModule.renderAll();
          }
        }
      }
    });
  },

  async fetchTransactionsFromCloud() {
    this.initFirebase();
    if (this.db) {
      try {
        const snap = await this.db.ref('transactions').once('value');
        const data = snap.val();
        if (data && typeof data === 'object') {
          const remoteList = Object.values(data);
          if (remoteList.length > 0 && window.StorageManager) {
            const local = StorageManager.getTransactions();
            const localMap = new Map();
            local.forEach(t => localMap.set(t.id, t));
            remoteList.forEach(t => {
              if (t && t.id) localMap.set(t.id, t);
            });
            const merged = Array.from(localMap.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            StorageManager.saveAllTransactions(merged);
            if (window.OwnerModule && typeof OwnerModule.renderAll === 'function' && OwnerModule.isLoggedIn()) {
              OwnerModule.renderAll();
            }
          }
        }
      } catch (e) {
        console.warn('fetchTransactionsFromCloud error:', e);
      }
    }
  },

  async syncClosingRecord(closingSummary) {
    if (!closingSummary) return false;
    this.initFirebase();
    if (this.db) {
      try {
        const closingId = closingSummary.id || ('closing_' + Date.now());
        await this.db.ref('closings/' + closingId).set(closingSummary);
        const s = StorageManager.getSettings();
        s.lastCloudSync = new Date().toISOString();
        StorageManager.saveSettings(s);
        this.updateStatusBadge();
        if (window.App) {
          App.showToast('✅ Rekapan closing tersimpan instan di Firebase!', 'success');
        }
        return true;
      } catch (e) {
        console.warn('Gagal sync closing ke Firebase:', e);
      }
    }
    return false;
  },

  async syncAllData() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.initFirebase();

    const transactions = StorageManager.getTransactions();
    const closings = StorageManager.getClosings ? StorageManager.getClosings() : [];

    const statusEl = document.getElementById('cloudSyncStatusText');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: var(--text-muted);">🔄 Menyinkronkan ${transactions.length} transaksi & ${closings.length} closing ke Firebase...</span>`;
    }

    try {
      if (this.db) {
        const updates = {};
        transactions.forEach(t => { updates['transactions/' + t.id] = t; });
        closings.forEach(c => { updates['closings/' + (c.id || ('closing_' + Date.now()))] = c; });
        await this.db.ref().update(updates);

        const s = StorageManager.getSettings();
        s.lastCloudSync = new Date().toISOString();
        StorageManager.saveSettings(s);
        this.updateStatusBadge();

        if (statusEl) {
          statusEl.innerHTML = '<span style="color: var(--income-green); font-weight: 700;">✓ Seluruh data transaksi & closing berhasil tersimpan di Firebase!</span>';
        }
        if (window.App) {
          App.playChime();
          App.showToast('Sinkronisasi seluruh data ke Firebase berhasil!', 'success');
        }
        return true;
      }
    } catch (e) {
      console.warn('syncAllData Firebase failed:', e);
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: var(--expense-red); font-weight: 700;">✕ Gagal: ${e.message}</span>`;
      }
      if (window.App) {
        App.showToast('Gagal sinkronisasi data ke Firebase: ' + e.message, 'error');
      }
    } finally {
      this.isSyncing = false;
    }
    return false;
  },

  updateStatusBadge() {
    const s = StorageManager.getSettings();
    const lastSync = s.lastCloudSync;
    const badgeEls = document.querySelectorAll('.cloud-sync-last-time');
    badgeEls.forEach(el => {
      const connStr = this.isFirebaseConnected ? '🟢 Firebase Online' : '⚪ Offline';
      if (lastSync) {
        const d = new Date(lastSync);
        el.innerHTML = `${connStr} &bull; Sinkron: ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        el.innerHTML = `${connStr} &bull; Siap Sinkron`;
      }
    });
  }
};

window.CloudSync = CloudSync;

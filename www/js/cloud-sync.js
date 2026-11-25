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
          if (this.isFirebaseConnected) {
            this.syncPendingTransactions();
          }
        });

        // Auto-fetch saat aplikasi dibuka kembali / resume dari background
        if (!this._hasVisibilityListener) {
          this._hasVisibilityListener = true;
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isFirebaseConnected) {
              this.fetchTransactionsFromCloud();
            }
          });
        }

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

  _activeSessions: {},

  async checkAndRegisterLoginSession(role, userName, deviceId, force = false) {
    this.initFirebase();
    const roleKey = (role || 'barista').toLowerCase() === 'owner' ? 'owner' : 'barista';
    const roleLabel = roleKey === 'owner' ? 'Owner' : 'Barista';
    const token = 'sess_' + roleKey + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

    if (this.db) {
      try {
        const sessionRef = this.db.ref(`active_sessions/${roleKey}`);
        const snap = await sessionRef.once('value');
        const active = snap.val();

        if (!force && active && active.token) {
          const myToken = window.AuthModule ? AuthModule.getSessionToken() : '';
          const isSameDevice = (deviceId && active.deviceId === deviceId);
          const isSameToken = (active.token === myToken);

          if (!isSameDevice && !isSameToken) {
            const user = active.user || roleLabel;
            return {
              success: false,
              message: `Tidak bisa dual login ${roleLabel}! Akun ${roleLabel} saat ini sedang aktif digunakan oleh ${user} di perangkat lain. Harap logout terlebih dahulu.`,
              data: { active_session: active }
            };
          }
        }

        const newSession = {
          role: roleKey,
          roleLabel: roleLabel,
          user: userName,
          token: token,
          deviceId: deviceId,
          loginTime: new Date().toISOString(),
          lastPing: Date.now()
        };

        if (window.AuthModule && AuthModule.SESSION_TOKEN_KEY) {
          try { localStorage.setItem(AuthModule.SESSION_TOKEN_KEY, token); } catch (e) {}
        }

        await sessionRef.set(newSession);

        // Jangan hapus sesi saat koneksi terputus atau aplikasi ditutup (hindari auto-logout)
        // Sesi tetap bertahan di cloud dan di perangkat lokal sampai pengguna mengklik tombol Logout manual
        try { sessionRef.onDisconnect().cancel(); } catch (e) {}

        // Hapus node legacy active_session jika masih tersisa
        try { this.db.ref('active_session').remove(); } catch (e) {}

        return {
          success: true,
          message: `Login sesi berhasil untuk ${roleLabel}`,
          data: newSession
        };
      } catch (e) {
        console.warn('Firebase checkAndRegisterLoginSession error:', e);
        return { success: true, offline: true, data: { token: token } };
      }
    }

    return { success: true, offline: true, data: { token: token } };
  },

  async logoutSession(role, token) {
    this.initFirebase();
    const roleKey = (role || (window.AuthModule ? AuthModule.getCurrentRole() : null) || 'barista').toLowerCase() === 'owner' ? 'owner' : 'barista';
    if (this.db) {
      try {
        const sessionRef = this.db.ref(`active_sessions/${roleKey}`);
        sessionRef.onDisconnect().cancel();
        await sessionRef.remove();

        // Bersihkan legacy node jika ada
        try { this.db.ref('active_session').remove(); } catch (e) {}
        console.log(`⚡ Sesi ${roleKey} logout dari Firebase berhasil`);
      } catch (e) {
        console.warn(`Gagal logout sesi ${roleKey} di Firebase:`, e);
      }
    }
  },

  async pingSession(role, token) {
    this.initFirebase();
    const roleKey = (role || (window.AuthModule ? AuthModule.getCurrentRole() : null) || 'barista').toLowerCase() === 'owner' ? 'owner' : 'barista';
    if (this.db && token) {
      try {
        await this.db.ref(`active_sessions/${roleKey}/lastPing`).set(Date.now());
      } catch (e) {}
    }
  },

  async getActiveSession(role) {
    this.initFirebase();
    if (this.db) {
      try {
        if (role) {
          const roleKey = role.toLowerCase() === 'owner' ? 'owner' : 'barista';
          const snap = await this.db.ref(`active_sessions/${roleKey}`).once('value');
          return { success: true, data: snap.val() };
        } else {
          const snap = await this.db.ref('active_sessions').once('value');
          return { success: true, data: snap.val() };
        }
      } catch (e) {}
    }
    return null;
  },

  updateModalSessionNotice() {
    const modal = document.getElementById('accountLoginModal');
    const noticeEl = document.getElementById('authActiveSessionNotice');
    const noticeTitle = document.getElementById('authActiveSessionTitle');
    const noticeDesc = document.getElementById('authActiveSessionDesc');
    if (!modal || !modal.classList.contains('active')) return;

    const myDeviceId = window.AuthModule ? AuthModule.getDeviceId() : '';
    const selectedRole = (window.AuthModule && AuthModule.selectedRole) ? AuthModule.selectedRole : 'barista';
    const roleSession = this._activeSessions ? this._activeSessions[selectedRole] : null;

    if (roleSession && roleSession.token && roleSession.deviceId !== myDeviceId) {
      if (noticeEl) {
        noticeEl.style.display = 'block';
        const roleLabel = selectedRole === 'owner' ? 'Owner' : 'Barista';
        if (noticeTitle) noticeTitle.textContent = `Akun ${roleLabel} Sedang Digunakan di Perangkat Lain`;
        if (noticeDesc) {
          noticeDesc.innerHTML = `Sistem membatasi 1 sesi aktif per role (${roleLabel}). Akun ${roleLabel} saat ini sedang aktif digunakan oleh <strong>${roleSession.user || roleLabel}</strong> di perangkat lain.<br><small style="color:var(--text-muted);">Sesi ${roleLabel} tersebut harus logout terlebih dahulu agar Anda dapat masuk sebagai ${roleLabel}. Role lain tetap dapat digunakan secara bersamaan.</small>`;
        }
      }
    } else {
      if (noticeEl) noticeEl.style.display = 'none';
    }
  },

  listenActiveSession() {
    if (!this.db) return;

    // Bersihkan sesi legacy jika ada
    try { this.db.ref('active_session').remove(); } catch (e) {}

    this.db.ref('active_sessions').on('value', snap => {
      const sessions = snap.val() || {};
      this._activeSessions = sessions;
      const myDeviceId = window.AuthModule ? AuthModule.getDeviceId() : '';
      const myToken = window.AuthModule ? AuthModule.getSessionToken() : '';
      const currentRole = window.AuthModule ? AuthModule.getCurrentRole() : null;

      // 1. Tampilkan peringatan real-time di modal login khusus untuk role yang sedang dipilih
      this.updateModalSessionNotice();

      // 2. Jika perangkat ini sedang login dengan role tertentu, HANYA cek sesi untuk role ini
      if (currentRole && window.AuthModule && AuthModule.isLoggedIn()) {
        const myRoleKey = currentRole.toLowerCase() === 'owner' ? 'owner' : 'barista';
        const myRoleSession = sessions[myRoleKey];

        // Logout otomatis HANYA terjadi jika sesi akun ini benar-benar diambil alih oleh perangkat fisik lain di cloud
        const isTakenByOtherDevice = myRoleSession && myRoleSession.deviceId && myRoleSession.deviceId !== myDeviceId && myRoleSession.token && myRoleSession.token !== myToken;
        if (isTakenByOtherDevice) {
          AuthModule.clearSession();
          AuthModule.applyRoleUI(null);
          AuthModule.openLoginModal(false);
          if (window.App && App.showToast) {
            App.showToast(`ℹ️ Sesi ${myRoleKey === 'owner' ? 'Owner' : 'Barista'} Anda telah dialihkan ke perangkat lain.`, 'info');
          }
        } else if (!myRoleSession && myToken) {
          // Jika sesi di cloud belum ada / terhapus sementara tapi di perangkat lokal masih login,
          // daftarkan kembali sesi perangkat ini ke cloud agar tidak auto-logout saat aplikasi dibuka kembali
          this.checkAndRegisterLoginSession(currentRole, currentRole === 'owner' ? 'Owner' : 'Barista', myDeviceId);
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
        const s = StorageManager.getSettings();
        s.lastCloudSync = new Date().toISOString();
        StorageManager.saveSettings(s);
      } catch (e) {
        console.warn('Gagal push transaksi ke Firebase:', e);
      }
    }
  },

  async syncPendingTransactions() {
    this.initFirebase();
    if (!this.db || !this.isFirebaseConnected) return;
    try {
      const snap = await this.db.ref('transactions').once('value');
      const cloudData = snap.val() || {};
      const local = StorageManager.getTransactions();
      const promises = [];
      local.forEach(t => {
        if (t && t.id && !cloudData[t.id]) {
          promises.push(this.db.ref('transactions/' + t.id).set(t));
        }
      });
      if (promises.length > 0) {
        await Promise.all(promises);
        console.log(`⚡ ${promises.length} transaksi lokal berhasil disinkronkan ke cloud.`);
      }
    } catch (e) {
      console.warn('syncPendingTransactions error:', e);
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

  _trxRenderTimer: null,

  _scheduleTrxUIRender() {
    if (this._trxRenderTimer) clearTimeout(this._trxRenderTimer);
    this._trxRenderTimer = setTimeout(() => {
      this._trxRenderTimer = null;
      if (window.OwnerModule && typeof OwnerModule.renderAll === 'function' && OwnerModule.isLoggedIn()) {
        try { OwnerModule.renderAll(); } catch (e) {}
      }
      if (window.FinanceModule && typeof FinanceModule.renderAll === 'function') {
        try { FinanceModule.renderAll(); } catch (e) {}
      }
      if (window.ReportsModule && typeof ReportsModule.renderAll === 'function') {
        try { ReportsModule.renderAll(); } catch (e) {}
      }
      if (window.POSModule && typeof POSModule.renderSpeedBar === 'function') {
        try { POSModule.renderSpeedBar(); } catch (e) {}
      }
    }, 250);
  },

  listenTransactions() {
    if (!this.db) return;

    let initialSyncDone = false;
    this.db.ref('transactions').once('value').then(() => {
      initialSyncDone = true;
    }).catch(() => {
      initialSyncDone = true;
    });

    this.db.ref('transactions').on('child_added', snap => {
      const trx = snap.val();
      if (trx && trx.id && window.StorageManager) {
        const local = StorageManager.getTransactions();
        const exists = local.some(t => t.id === trx.id);
        if (!exists) {
          local.unshift(trx);
          StorageManager.saveAllTransactions(local);

          const myDeviceId = window.AuthModule && typeof AuthModule.getDeviceId === 'function' ? AuthModule.getDeviceId() : '';
          const isFromOtherDevice = trx.deviceId && trx.deviceId !== myDeviceId;

          // 1. Sinkronkan semua tampilan secara ter-debounce (mencegah freeze saat burst data awal)
          this._scheduleTrxUIRender();

          // 2. Beri notifikasi audio visual instan pada HP Owner hanya untuk transaksi live baru dari Barista
          if (initialSyncDone && isFromOtherDevice && window.AuthModule && AuthModule.isOwner()) {
            if (window.App && typeof App.playChime === 'function') {
              App.playChime();
            }
            if (window.App && typeof App.showToast === 'function') {
              const isInc = trx.type === 'income';
              const icon = isInc ? '☕' : '📉';
              const title = isInc ? 'Transaksi Masuk (Barista)' : 'Pengeluaran Dicatat (Barista)';
              const desc = trx.items && trx.items.length 
                ? trx.items.map(i => `${i.name} x${i.qty}`).join(', ') 
                : (trx.description || trx.category);
              App.showToast(`${icon} ${title}: ${App.formatRupiah(trx.amount)} • ${desc}`, isInc ? 'success' : 'info', 5000);
            }
          }
        }
      }
    });

    this.db.ref('transactions').on('child_changed', snap => {
      const trx = snap.val();
      if (trx && trx.id && window.StorageManager) {
        let local = StorageManager.getTransactions();
        const idx = local.findIndex(t => t.id === trx.id);
        if (idx >= 0) {
          local[idx] = trx;
        } else {
          local.unshift(trx);
        }
        StorageManager.saveAllTransactions(local);
        this._scheduleTrxUIRender();
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
          this._scheduleTrxUIRender();
        }
      }
    });
  },

  async fetchTransactionsFromCloud() {
    if (this._isFetchingTrx) return;
    this._isFetchingTrx = true;
    this.initFirebase();
    try {
      if (this.db) {
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
            this._scheduleTrxUIRender();
          }
        }
      }
    } catch (e) {
      console.warn('fetchTransactionsFromCloud error:', e);
    } finally {
      this._isFetchingTrx = false;
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

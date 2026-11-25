/**
 * DIALOG COFFEE Cashier - Authentication & Role Management Module
 * Manages Owner (PIN: 1996) and Barista (PIN: 6969) roles.
 * Controls access restriction so that the 'Pengaturan' tab is exclusively visible to Owner.
 */

const AuthModule = {
  SESSION_KEY: 'dialog_coffee_user_role_v1',
  REMEMBERED_KEY: 'dialog_coffee_remembered_role_v1',
  SESSION_TOKEN_KEY: 'dialog_coffee_session_token_v1',
  DEVICE_ID_KEY: 'dialog_coffee_device_id_v1',
  selectedRole: 'barista', // 'owner' | 'barista'

  init() {
    this.bindEvents();
    const currentRole = this.getCurrentRole();
    if (currentRole) {
      if (currentRole === 'owner' && window.OwnerModule) {
        OwnerModule.setLoggedIn(true);
      }
      this.applyRoleUI(currentRole);
      // Pastikan sesi aktif di cloud selalu tersinkronisasi saat aplikasi dibuka kembali tanpa auto-logout
      if (window.CloudSync && CloudSync.checkAndRegisterLoginSession) {
        const userName = currentRole === 'owner' ? 'Owner' : 'Barista';
        CloudSync.checkAndRegisterLoginSession(currentRole, userName, this.getDeviceId()).then(res => {
          if (res && res.data && res.data.token) {
            try { localStorage.setItem(this.SESSION_TOKEN_KEY, res.data.token); } catch (e) {}
          }
        });
      }
    } else {
      // Not logged in yet: display mandatory login modal on first app launch
      this.openLoginModal(false);
    }
  },

  getDeviceId() {
    let id = '';
    try {
      id = localStorage.getItem(this.DEVICE_ID_KEY);
      if (!id) {
        id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem(this.DEVICE_ID_KEY, id);
      }
    } catch (e) {
      id = 'dev_' + Date.now();
    }
    return id;
  },

  getSessionToken() {
    try {
      return localStorage.getItem(this.SESSION_TOKEN_KEY) || '';
    } catch (e) {
      return '';
    }
  },

  getCurrentRole() {
    try {
      return localStorage.getItem(this.SESSION_KEY) || sessionStorage.getItem(this.SESSION_KEY);
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getCurrentRole();
  },

  isOwner() {
    return this.getCurrentRole() === 'owner';
  },

  isBarista() {
    return this.getCurrentRole() === 'barista';
  },

  setRole(role) {
    try {
      localStorage.setItem(this.SESSION_KEY, role);
      localStorage.setItem(this.REMEMBERED_KEY, role);
      sessionStorage.setItem(this.SESSION_KEY, role);
    } catch (e) {}
    this.applyRoleUI(role);
  },

  clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.SESSION_TOKEN_KEY);
    } catch (e) {}
    if (window.OwnerModule) {
      OwnerModule.setLoggedIn(false);
    }
  },

  async logout() {
    const token = this.getSessionToken();
    const currentRole = this.getCurrentRole() || this.selectedRole || 'barista';
    if (window.CloudSync && CloudSync.logoutSession) {
      try {
        await CloudSync.logoutSession(currentRole, token);
      } catch (e) {}
    }
    this.clearSession();
    this.applyRoleUI(null);
    if (window.App) {
      App.playBeep(440, 0.1);
      App.showToast('Sesi berhasil logout. Sistem siap digunakan oleh pengguna berikutnya.', 'info');
    }
    this.openLoginModal(false);
  },

  async forceReleaseSession() {
    const role = this.selectedRole || this.getCurrentRole() || 'barista';
    const roleLabel = role === 'owner' ? 'Owner' : 'Barista';
    if (!confirm(`Apakah Anda yakin ingin melepas paksa sesi aktif ${roleLabel} di cloud? Gunakan ini jika perangkat sebelumnya mati atau kehabisan baterai.`)) {
      return;
    }
    if (window.CloudSync && CloudSync.logoutSession) {
      await CloudSync.logoutSession(role);
    }
    this.clearSession();
    this.openLoginModal(false);
    if (window.App) {
      App.showToast(`Sesi ${roleLabel} di cloud telah dibebaskan. Silakan login sekarang.`, 'success');
    }
  },

  selectRole(role) {
    this.selectedRole = role;
    try {
      localStorage.setItem(this.REMEMBERED_KEY, role);
    } catch (e) {}
    const ownerCard = document.getElementById('roleCardOwner');
    const baristaCard = document.getElementById('roleCardBarista');
    const pinLabel = document.getElementById('authPinLabel');
    const pinInput = document.getElementById('authPinInput');
    const roleTitle = document.getElementById('authModalRoleTitle');
    const submitBtn = document.getElementById('btnSubmitAuth');
    const err = document.getElementById('authPinError');

    if (err) err.style.display = 'none';

    if (role === 'owner') {
      if (ownerCard) ownerCard.classList.add('selected');
      if (baristaCard) baristaCard.classList.remove('selected');
      if (pinLabel) pinLabel.innerHTML = I18N.t('enterOwnerPin');
      if (pinInput) pinInput.placeholder = '****';
      if (roleTitle) roleTitle.textContent = I18N.t('ownerAccountLogin');
      if (submitBtn) submitBtn.innerHTML = `<span>👑</span> ${I18N.t('loginAsOwner')}`;
    } else {
      if (baristaCard) baristaCard.classList.add('selected');
      if (ownerCard) ownerCard.classList.remove('selected');
      if (pinLabel) pinLabel.innerHTML = I18N.t('enterBaristaPin');
      if (pinInput) pinInput.placeholder = '****';
      if (roleTitle) roleTitle.textContent = I18N.t('baristaAccountLogin');
      if (submitBtn) submitBtn.innerHTML = `<span>☕</span> ${I18N.t('loginAsBarista')}`;
    }

    if (pinInput) {
      pinInput.value = '';
      setTimeout(() => pinInput.focus(), 150);
    }

    // Perbarui peringatan sesi aktif sesuai role yang baru dipilih
    if (window.CloudSync && CloudSync.updateModalSessionNotice) {
      CloudSync.updateModalSessionNotice();
    }

    if (window.CloudSync && CloudSync.fetchSettingsFromCloud) {
      CloudSync.fetchSettingsFromCloud(5000);
    }
  },

  openLoginModal(canCancel = false) {
    const modal = document.getElementById('accountLoginModal');
    if (!modal) return;

    const cancelBtn = document.getElementById('btnCancelAuthModal');
    const exitBtn = document.getElementById('btnExitAppFromLogin');
    const closeBtn = document.getElementById('btnCloseAuthModal');
    const noticeEl = document.getElementById('authActiveSessionNotice');
    const noticeTitle = document.getElementById('authActiveSessionTitle');
    const noticeDesc = document.getElementById('authActiveSessionDesc');
    const current = this.getCurrentRole();

    // If already logged in, permit cancelling out of modal
    const allowClose = canCancel && !!current;
    if (cancelBtn) cancelBtn.style.display = allowClose ? 'inline-block' : 'none';
    if (closeBtn) closeBtn.style.display = allowClose ? 'block' : 'none';
    if (exitBtn) exitBtn.style.display = allowClose ? 'none' : 'inline-block';

    // Tampilkan peringatan sesi jika sudah login lokal atau aktif di perangkat lain
    if (current) {
      if (noticeEl) {
        noticeEl.style.display = 'block';
        if (noticeTitle) noticeTitle.textContent = 'Sesi Sedang Aktif di Perangkat Ini';
        if (noticeDesc) {
          noticeDesc.innerHTML = `Perangkat ini saat ini login sebagai <strong>${current === 'owner' ? 'Owner' : 'Barista'}</strong>. Untuk login akun lain atau membebaskan sesi, silakan klik tombol <strong>Keluar / Logout</strong> di bawah.`;
        }
      }
    } else {
      if (noticeEl) noticeEl.style.display = 'none';
    }

    // Set active selection: remember choice from localStorage or current role, default barista
    let targetRole = 'barista';
    try {
      targetRole = localStorage.getItem(this.REMEMBERED_KEY) || current || 'barista';
    } catch (e) {
      targetRole = current || 'barista';
    }
    this.selectRole(targetRole);

    const err = document.getElementById('authPinError');
    if (err) err.style.display = 'none';

    modal.classList.add('active');

    // Sinkronkan status modal dengan sesi cloud
    if (window.CloudSync && CloudSync.updateModalSessionNotice) {
      CloudSync.updateModalSessionNotice();
    }

    // Sinkronkan password terbaru dari cloud saat modal dibuka
    if (window.CloudSync && CloudSync.fetchSettingsFromCloud) {
      CloudSync.fetchSettingsFromCloud();
    }
  },

  closeLoginModal() {
    // Only permit closing if already authenticated
    if (!this.isLoggedIn()) {
      this.showError('Silakan login terlebih dahulu untuk mengakses aplikasi kasir.');
      return;
    }
    const modal = document.getElementById('accountLoginModal');
    if (modal) modal.classList.remove('active');
  },

  async submitLogin() {
    const pinInput = document.getElementById('authPinInput');
    const enteredPin = (pinInput ? pinInput.value : '').trim();
    let settings = StorageManager.getSettings();

    let expectedOwnerPin = (settings.ownerPin || '1996').trim();
    let expectedBaristaPin = (settings.baristaPin || '6969').trim();

    if (!enteredPin) {
      this.showError('Silakan masukkan PIN / Password terlebih dahulu.');
      return;
    }

    // Blokir jika perangkat ini belum logout dari sesi aktifnya
    if (this.isLoggedIn()) {
      const activeRoleLabel = this.isOwner() ? 'Owner' : 'Barista';
      this.showError(`Anda saat ini masih login sebagai ${activeRoleLabel}. Harap tekan tombol "Keluar / Logout" terlebih dahulu.`);
      if (window.App) App.playBeep(260, 0.15, 'sawtooth');
      return;
    }

    if (this.selectedRole === 'owner') {
      // Selalu sinkronkan PIN terbaru dari cloud sebelum verifikasi agar perubahan PIN langsung berlaku di semua perangkat
      if (window.CloudSync && CloudSync.fetchSettingsFromCloud) {
        const errEl = document.getElementById('authPinError');
        if (errEl && enteredPin !== expectedOwnerPin) {
          errEl.textContent = '🔄 Checking...';
          errEl.style.display = 'block';
          errEl.style.color = 'var(--primary, #c9933a)';
        }
        await CloudSync.fetchSettingsFromCloud(6000, true);
        settings = StorageManager.getSettings();
        expectedOwnerPin = String(settings.ownerPin ?? '1996').trim() || '1996';
      }

      if (enteredPin === expectedOwnerPin) {
        // Verifikasi Anti Dual-Login di Cloud
        if (window.CloudSync && CloudSync.checkAndRegisterLoginSession) {
          const sessionCheck = await CloudSync.checkAndRegisterLoginSession('owner', 'Owner', this.getDeviceId());
          if (sessionCheck && sessionCheck.success === false) {
            this.showError(sessionCheck.message || 'Tidak bisa dual login! Akun sedang aktif di perangkat lain.');
            if (window.App) App.playBeep(260, 0.25, 'sawtooth');
            return;
          }
          if (sessionCheck && sessionCheck.data && sessionCheck.data.token) {
            try { localStorage.setItem(this.SESSION_TOKEN_KEY, sessionCheck.data.token); } catch (e) {}
          }
        }

        this.setRole('owner');
        if (window.OwnerModule) {
          OwnerModule.setLoggedIn(true);
          OwnerModule.renderAll();
        }
        if (window.CloudSync && CloudSync.fetchTransactionsFromCloud) {
          CloudSync.fetchTransactionsFromCloud(6000);
        }
        if (pinInput) pinInput.value = '';
        const modal = document.getElementById('accountLoginModal');
        if (modal) modal.classList.remove('active');
        if (window.App) {
          App.playChime();
          App.showToast('Selamat datang, Owner DIALOG COFFEE! Tab Pengaturan aktif.', 'success');
        }
      } else {
        if (window.App) App.playBeep(260, 0.15, 'sawtooth');
        this.showError('PIN salah!');
        if (pinInput) { pinInput.value = ''; pinInput.focus(); }
      }
    } else {
      // Role Barista: Selalu tarik PIN terbaru dari cloud sebelum verifikasi agar PIN lama otomatis tertolak di semua perangkat
      if (window.CloudSync && CloudSync.fetchSettingsFromCloud) {
        const errEl = document.getElementById('authPinError');
        if (errEl && enteredPin !== expectedBaristaPin) {
          errEl.textContent = '🔄 Checking...';
          errEl.style.display = 'block';
          errEl.style.color = 'var(--primary, #c9933a)';
        }
        await CloudSync.fetchSettingsFromCloud(6000, true);
        settings = StorageManager.getSettings();
        expectedBaristaPin = String(settings.baristaPin ?? '6969').trim() || '6969';
      }

      if (enteredPin === expectedBaristaPin) {
        // Verifikasi Anti Dual-Login di Cloud
        if (window.CloudSync && CloudSync.checkAndRegisterLoginSession) {
          const activeShift = (window.App && App.activeShift) ? App.activeShift : 'Shift 1';
          const barista1 = (window.App && App.activeBarista1) ? App.activeBarista1 : 'Barista';
          const userName = `${barista1} (${activeShift})`;
          const sessionCheck = await CloudSync.checkAndRegisterLoginSession('barista', userName, this.getDeviceId());
          if (sessionCheck && sessionCheck.success === false) {
            this.showError(sessionCheck.message || 'Tidak bisa dual login! Akun sedang aktif di perangkat lain.');
            if (window.App) App.playBeep(260, 0.25, 'sawtooth');
            return;
          }
          if (sessionCheck && sessionCheck.data && sessionCheck.data.token) {
            try { localStorage.setItem(this.SESSION_TOKEN_KEY, sessionCheck.data.token); } catch (e) {}
          }
        }

        this.setRole('barista');
        if (window.OwnerModule) OwnerModule.setLoggedIn(false);
        if (window.CloudSync && CloudSync.fetchTransactionsFromCloud) {
          CloudSync.fetchTransactionsFromCloud(6000);
        }
        if (pinInput) pinInput.value = '';
        const modal = document.getElementById('accountLoginModal');
        if (modal) modal.classList.remove('active');
        if (window.App) {
          App.playChime();
          App.showToast('Selamat datang, Barista DIALOG COFFEE! Selamat bertugas.', 'success');
          // If currently on settings or owner tab, redirect to POS tab
          if (App.activeTab === 'settings' || App.activeTab === 'owner') {
            App.switchTab('pos');
          }
        }
      } else {
        if (window.App) App.playBeep(260, 0.15, 'sawtooth');
        this.showError('PIN salah!');
        if (pinInput) { pinInput.value = ''; pinInput.focus(); }
      }
    }
  },

  showError(msg) {
    const err = document.getElementById('authPinError');
    if (err) {
      err.textContent = msg;
      err.style.display = 'block';
      err.style.color = '';
    }
  },

  appendPinDigit(digit) {
    const pinInput = document.getElementById('authPinInput');
    if (!pinInput) return;
    if (pinInput.value.length < 12) {
      pinInput.value += digit;
    }
    const err = document.getElementById('authPinError');
    if (err) err.style.display = 'none';
  },

  clearPin() {
    const pinInput = document.getElementById('authPinInput');
    if (pinInput) pinInput.value = '';
    const err = document.getElementById('authPinError');
    if (err) err.style.display = 'none';
  },

  backspacePin() {
    const pinInput = document.getElementById('authPinInput');
    if (pinInput && pinInput.value.length > 0) {
      pinInput.value = pinInput.value.slice(0, -1);
    }
  },

  togglePinVisibility() {
    const pinInput = document.getElementById('authPinInput');
    const eyeBtn = document.getElementById('btnToggleAuthEye');
    if (!pinInput) return;
    if (pinInput.type === 'password') {
      pinInput.type = 'text';
      if (eyeBtn) eyeBtn.textContent = '🔒';
    } else {
      pinInput.type = 'password';
      if (eyeBtn) eyeBtn.textContent = '👁️';
    }
  },

  applyRoleUI(role) {
    const isOwner = role === 'owner';

    // 1. Tab Pengaturan (Desktop & Mobile) - Strictly only visible to Owner
    const settingsTabs = document.querySelectorAll('[data-target-tab="settings"]');
    settingsTabs.forEach(el => {
      if (isOwner) {
        el.classList.remove('hidden-by-role');
      } else {
        el.classList.add('hidden-by-role');
      }
    });

    // 2. Tab Owner (Desktop & Mobile)
    const ownerTabs = document.querySelectorAll('[data-target-tab="owner"]');
    ownerTabs.forEach(el => {
      if (isOwner) {
        el.classList.remove('hidden-by-role');
      } else {
        el.classList.add('hidden-by-role');
      }
    });

    // 3. Update User Role Chip in Top Appbar
    const chipText = document.getElementById('topUserRoleText');
    const chipIcon = document.getElementById('topUserRoleIcon');
    const chipEl = document.getElementById('topUserRoleChip');
    if (chipText && chipIcon) {
      if (isOwner) {
        chipIcon.textContent = '👑';
        chipText.textContent = 'Owner';
        if (chipEl) {
          chipEl.classList.add('role-chip-owner');
          chipEl.classList.remove('role-chip-barista');
          chipEl.title = 'Akun Aktif: Pemilik (Owner) - Pengaturan Terbuka. Klik untuk ganti akun.';
        }
      } else {
        chipIcon.textContent = '☕';
        chipText.textContent = 'Barista';
        if (chipEl) {
          chipEl.classList.add('role-chip-barista');
          chipEl.classList.remove('role-chip-owner');
          chipEl.title = 'Akun Aktif: Barista - Pengaturan Hanya untuk Owner. Klik untuk ganti akun.';
        }
      }
    }

    // 4. If Barista is currently viewing settings or owner, redirect immediately to POS
    if (!isOwner && window.App) {
      if (App.activeTab === 'settings' || App.activeTab === 'owner') {
        App.switchTab('pos');
      }
    }
  },

  bindEvents() {
    const pinInput = document.getElementById('authPinInput');
    if (pinInput) {
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitLogin();
        }
      });
    }
  }
};

window.AuthModule = AuthModule;

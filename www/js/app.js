/**
 * DIALOG COFFEE Cashier - Core Application Controller
 * Manages monochrome theme toggle, language switcher, 2-shift 2-barista modal,
 * audio chime effects, and settings management.
 */

const App = {
  activeTab: 'pos',
  audioCtx: null,
  soundEnabled: true,

  init() {
    this.initTheme();
    this.initAudio();
    this.soundEnabled = StorageManager.getSettings().soundEnabled !== false;
    this.initClock();
    this.bindNavigation();
    this.initBackButton();
    this.loadShiftHeader();
    window.addEventListener('resize', () => this.loadShiftHeader());
    this.loadSettingsForm();
    this.bindSettingsEvents();
    this.renderSettingsMenuList();

    // Inisialisasi i18n
    if (window.I18N) I18N.init();

    // Inisialisasi Modul-Modul
    if (window.POSModule) POSModule.init();
    if (window.FinanceModule) FinanceModule.init();
    if (window.ReportsModule) ReportsModule.init();
    if (window.OwnerModule) OwnerModule.init();
    if (window.AuthModule) AuthModule.init();
    if (window.CloudSync && CloudSync.init) CloudSync.init();

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Direct modal trigger if query param ?modal=receipt or hash #receipt is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('modal') === 'receipt' || window.location.hash.includes('receipt')) {
      setTimeout(() => this.testReceiptPrintModal(), 300);
    }

    console.log('☕ DIALOG COFFEE Cashier (Monochrome Edition) initialized.');

    // Sembunyikan Splash Screen secara halus
    this.hideSplashScreen();
  },

  hideSplashScreen() {
    const splash = document.getElementById('appSplashScreen');
    if (!splash) return;
    setTimeout(() => {
      splash.classList.add('splash-hidden');
      setTimeout(() => {
        splash.style.display = 'none';
      }, 550);
    }, 1200); // Tampilkan splash screen 1.2 detik untuk animasi logo & memuat data
  },

  // THEME MANAGEMENT (MONOCHROME LIGHT / DARK)
  initTheme() {
    const s = StorageManager.getSettings();
    const savedTheme = s.theme || localStorage.getItem('dialog_coffee_theme') || 'light';
    this.setTheme(savedTheme);
  },

  setTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('dialog_coffee_theme', theme);

    // Sinkronkan statusbar Android native
    if (window.AndroidBridge && typeof window.AndroidBridge.setStatusBarTheme === 'function') {
      try {
        window.AndroidBridge.setStatusBarTheme(isDark);
      } catch (e) {}
    }

    // Perbarui meta theme-color browser
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#09090b' : '#ffffff');
    }

    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.textContent = isDark ? '☀️' : '🌙';
      btn.title = isDark ? 'Ganti ke Tema Putih' : 'Ganti ke Tema Gelap';
    }
  },

  toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    this.setTheme(newTheme);
    const s = StorageManager.getSettings();
    s.theme = newTheme;
    StorageManager.saveSettings(s);

    if (window.ReportsModule && ReportsModule.renderAll) {
      ReportsModule.renderAll();
    }
    this.showToast(newTheme === 'dark' ? 'Tema Hitam Diaktifkan' : 'Tema Putih Diaktifkan', 'info');
  },

  // SHIFT & BARISTA MODAL (1 SHIFT = 2 BARISTA)
  loadShiftHeader() {
    const s = StorageManager.getSettings();
    const shiftChip = document.getElementById('topShiftDisplay');
    if (shiftChip) {
      const w = window.innerWidth;
      if (w <= 480 || (w >= 768 && w <= 1180)) {
        shiftChip.textContent = `S${(s.activeShift || '1').replace(/\D/g, '') || '1'}`;
      } else if (w <= 767) {
        shiftChip.textContent = `${s.activeShift || 'Shift 1'}`;
      } else if (w <= 950) {
        shiftChip.textContent = `${s.activeShift || 'Shift 1'}: ${s.activeBarista1 || 'Ardi'}`;
      } else {
        shiftChip.textContent = `${s.activeShift || 'Shift 1'}: ${s.activeBarista1 || 'Ardi'} & ${s.activeBarista2 || 'Anca'}`;
      }
      if (shiftChip.parentElement) {
        shiftChip.parentElement.title = `Shift: ${s.activeShift || 'Shift 1'} (${s.activeBarista1 || 'Ardi'} & ${s.activeBarista2 || 'Anca'})`;
      }
    }

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      const lang = window.I18N ? I18N.currentLang : 'id';
      langBtn.innerHTML = window.innerWidth <= 767 ? (lang === 'id' ? 'ID' : 'EN') : (lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN');
    }
  },

  openShiftModal() {
    const modal = document.getElementById('shiftModal');
    if (!modal) return;

    const s = StorageManager.getSettings();
    const baristas = s.baristas || ['Ardi', 'Anca', 'Jhonson', 'Si Pur'];

    // Set Shift Radio
    const shiftSelect = document.getElementById('shiftSelectInput');
    if (shiftSelect) shiftSelect.value = s.activeShift || 'Shift 1';

    // Populate Barista 1
    const b1Select = document.getElementById('barista1Select');
    if (b1Select) {
      b1Select.innerHTML = baristas.map(b => 
        `<option value="${b}" ${b === s.activeBarista1 ? 'selected' : ''}>${b}</option>`
      ).join('');
    }

    // Populate Barista 2
    const b2Select = document.getElementById('barista2Select');
    if (b2Select) {
      b2Select.innerHTML = baristas.map(b => 
        `<option value="${b}" ${b === s.activeBarista2 ? 'selected' : ''}>${b}</option>`
      ).join('');
    }

    // Tampilkan akun aktif (Owner / Barista)
    const roleTextEl = document.getElementById('shiftModalRoleText');
    if (roleTextEl) {
      roleTextEl.textContent = (window.AuthModule && AuthModule.isOwner()) ? '👑 Owner' : '☕ Barista';
    }

    modal.classList.add('active');
  },

  closeShiftModal() {
    const modal = document.getElementById('shiftModal');
    if (modal) modal.classList.remove('active');
  },

  saveShiftConfig() {
    const shift = document.getElementById('shiftSelectInput').value;
    const b1 = document.getElementById('barista1Select').value;
    const b2 = document.getElementById('barista2Select').value;

    if (b1 === b2) {
      alert('Peringatan: Barista 1 dan Barista 2 sebaiknya adalah 2 orang berbeda.');
    }

    StorageManager.updateShift(shift, b1, b2);
    this.loadShiftHeader();
    this.closeShiftModal();

    this.playBeep(660, 0.08);
    this.showToast(`Shift aktif diperbarui: ${shift} (${b1} & ${b2})`, 'success');
  },

  // Audio Synthesizer
  initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) this.audioCtx = new AudioContext();
  },

  playBeep(freq = 440, duration = 0.05, type = 'sine') {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  },

  playChime() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (e) {}
  },

  toggleSound(forceValue) {
    this.soundEnabled = typeof forceValue === 'boolean' ? forceValue : !this.soundEnabled;
    const s = StorageManager.getSettings();
    s.soundEnabled = this.soundEnabled;
    StorageManager.saveSettings(s);
    const soundCheck = document.getElementById('cfgSoundEnabled');
    if (soundCheck) soundCheck.checked = this.soundEnabled;
    this.showToast(this.soundEnabled ? 'Suara Diaktifkan' : 'Suara Dimatikan', 'info');
  },

  // Clock
  initClock() {
    const clockEl = document.getElementById('topClockDisplay');
    const update = () => {
      if (!clockEl) return;
      const now = new Date();
      clockEl.textContent = now.toLocaleDateString(I18N.currentLang === 'id' ? 'id-ID' : 'en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    update();
    setInterval(update, 1000);
  },

  // Tab Navigation
  bindNavigation() {
    const navButtons = document.querySelectorAll('[data-target-tab]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target-tab');
        this.switchTab(target);
      });
    });
  },

  switchTab(tabId) {
    if (tabId === 'settings' && window.AuthModule && !AuthModule.isOwner()) {
      this.showToast('Akses dibatasi: Tab Pengaturan hanya dapat dikelola oleh Owner.', 'error');
      AuthModule.openLoginModal(true);
      return;
    }

    if (tabId === 'owner' && window.AuthModule && !AuthModule.isOwner()) {
      AuthModule.openLoginModal(true);
      return;
    }

    if (tabId === 'owner' && window.OwnerModule && !OwnerModule.isLoggedIn()) {
      OwnerModule.openLoginModal();
      return;
    }

    this.activeTab = tabId;
    this.playBeep(520, 0.03);

    document.querySelectorAll('[data-target-tab]').forEach(btn => {
      if (btn.getAttribute('data-target-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      if (sec.id === `view-${tabId}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    if (tabId === 'pos' && window.POSModule) {
      POSModule.renderMenu();
    } else if (tabId === 'finance' && window.FinanceModule) {
      FinanceModule.renderAll();
    } else if (tabId === 'reports' && window.ReportsModule) {
      ReportsModule.renderAll();
    } else if (tabId === 'owner' && window.OwnerModule) {
      OwnerModule.renderAll();
    } else if (tabId === 'settings') {
      this.loadSettingsForm();
      this.renderSettingsMenuList();
    }


    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Toast
  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  },

  // Settings Management
  loadSettingsForm() {
    const s = StorageManager.getSettings();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };

    setVal('cfgCafeName', s.cafeName);
    setVal('cfgTagline', s.tagline);
    setVal('cfgAddress', s.address);
    setVal('cfgPhone', s.phone);
    setVal('cfgInstagram', s.instagram || '@dialogcoffee.nnk');
    setVal('cfgGatewayPhone', s.gatewayPhone || '08982151560');
    setVal('cfgOwnerPhone', s.ownerPhone || '085334101996');
    setVal('cfgOwnerPin', s.ownerPin || '1996');
    setVal('cfgBaristaPin', s.baristaPin || '6969');
    setVal('cfgTaxRate', s.taxRate);
    setVal('cfgReceiptFooter', s.receiptFooter);
    setVal('cfgCloudSyncUrl', s.cloudSyncUrl || 'api_sync.php');
    setVal('cfgCloudApiKey', s.cloudApiKey || 'dialog2026');

    const taxCheck = document.getElementById('cfgTaxEnabled');
    if (taxCheck) taxCheck.checked = !!s.taxEnabled;

    const soundCheck = document.getElementById('cfgSoundEnabled');
    if (soundCheck) soundCheck.checked = s.soundEnabled !== false;

    const autoSyncCheck = document.getElementById('cfgCloudAutoSync');
    if (autoSyncCheck) autoSyncCheck.checked = s.cloudAutoSync !== false;

    if (window.CloudSync && CloudSync.updateStatusBadge) CloudSync.updateStatusBadge();
  },

  bindSettingsEvents() {
    const form = document.getElementById('settingsForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const origBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>⏳</span> Menyimpan ke Database Cloud...';
        }

        const updated = {
          ...StorageManager.getSettings(),
          cafeName: document.getElementById('cfgCafeName').value.trim() || 'DIALOG COFFEE',
          tagline: document.getElementById('cfgTagline').value.trim(),
          address: document.getElementById('cfgAddress').value.trim(),
          phone: document.getElementById('cfgPhone').value.trim(),
          instagram: (document.getElementById('cfgInstagram') ? document.getElementById('cfgInstagram').value.trim() : '') || '@dialogcoffee.nnk',
          gatewayPhone: (document.getElementById('cfgGatewayPhone') ? document.getElementById('cfgGatewayPhone').value.trim() : '') || '08982151560',
          ownerPhone: document.getElementById('cfgOwnerPhone').value.trim() || '085334101996',
          ownerPin: (document.getElementById('cfgOwnerPin') ? document.getElementById('cfgOwnerPin').value.trim() : '') || '1996',
          baristaPin: (document.getElementById('cfgBaristaPin') ? document.getElementById('cfgBaristaPin').value.trim() : '') || '6969',
          cloudSyncUrl: document.getElementById('cfgCloudSyncUrl') ? document.getElementById('cfgCloudSyncUrl').value.trim() : (StorageManager.getSettings().cloudSyncUrl || 'https://abzrtsushee.co-id.id/DIALOG%20COFFEE/data/api_sync.php'),
          cloudApiKey: document.getElementById('cfgCloudApiKey') ? document.getElementById('cfgCloudApiKey').value.trim() : (StorageManager.getSettings().cloudApiKey || 'dialog2026'),
          cloudAutoSync: document.getElementById('cfgCloudAutoSync') ? document.getElementById('cfgCloudAutoSync').checked : (StorageManager.getSettings().cloudAutoSync !== false),
          taxRate: Number(document.getElementById('cfgTaxRate').value) || 0,
          taxEnabled: document.getElementById('cfgTaxEnabled').checked,
          receiptFooter: document.getElementById('cfgReceiptFooter').value
        };

        StorageManager.saveSettings(updated);
        try { localStorage.setItem('dialog_coffee_tax_configured', '1'); } catch (e) {}
        this.loadSettingsForm();
        if (window.POSModule) POSModule.renderCart();

        let cloudSuccess = false;
        if (window.CloudSync && CloudSync.syncSettingsToCloud) {
          try {
            cloudSuccess = await CloudSync.syncSettingsToCloud(updated);
          } catch (err) {
            console.warn('Sync settings error:', err);
          }
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnText;
        }

        App.playBeep(660, 0.08);
        if (cloudSuccess) {
          this.showToast('✅ Pengaturan & PIN berhasil tersimpan di Database Cloud!', 'success');
        } else {
          this.showToast('Pengaturan tersimpan lokal. Database cloud akan disinkronkan otomatis.', 'info');
        }
      });
    }

    const backupBtn = document.getElementById('btnDownloadBackup');
    if (backupBtn) {
      backupBtn.addEventListener('click', () => {
        const json = StorageManager.exportFullBackupJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const safeDate = new Date().toISOString().split('T')[0];
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Backup_DIALOG_COFFEE_${safeDate}.json`;
        a.click();
        App.showToast('Cadangan data berhasil diunduh', 'success');
      });
    }

    const restoreInput = document.getElementById('restoreFileInput');
    if (restoreInput) {
      restoreInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = StorageManager.importBackupJSON(event.target.result);
          if (res.success) {
            alert(`Berhasil memulihkan ${res.count} transaksi dari cadangan!`);
            location.reload();
          } else {
            alert('Gagal memulihkan cadangan: ' + res.error);
          }
        };
        reader.readAsText(file);
      });
    }

    const resetBtn = document.getElementById('btnResetDemoData');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Kembalikan semua menu dan konfigurasi ke pengaturan awal DIALOG COFFEE?')) {
          StorageManager.resetAllData();
          location.reload();
        }
      });
    }

    const clearTrxBtn = document.getElementById('btnClearTransactions');
    if (clearTrxBtn) {
      clearTrxBtn.addEventListener('click', () => {
        if (confirm('Kosongkan semua data transaksi kasir dan rekapan? Semua angka pemasukan dan pengeluaran akan dimulai dari Rp 0.')) {
          StorageManager.clearAllTransactions();
          location.reload();
        }
      });
    }
  },

  toggleSettingsPin(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.textContent = '🔒';
    } else {
      input.type = 'password';
      if (btn) btn.textContent = '👁️';
    }
  },

  // =========================================================================
  // OWNER MENU MANAGEMENT (PENGATURAN MENU KHUSUS OWNER)
  // =========================================================================
  renderSettingsMenuList() {
    const container = document.getElementById('settingsMenuListContainer');
    if (!container) return;

    const searchInput = document.getElementById('settingsMenuSearchInput');
    const catSelect = document.getElementById('settingsMenuCategoryFilter');
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const selectedCat = catSelect ? catSelect.value : 'all';

    const menu = StorageManager.getMenu();

    const filtered = menu.filter(item => {
      const matchCat = (selectedCat === 'all') || (item.category === selectedCat);
      const matchQuery = !query || 
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.badge && item.badge.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">🔍</div>
          <p style="font-weight: 700; margin: 0;">${I18N.t('menuNotFound')}</p>
          <span style="font-size: 0.78rem;">${I18N.t('menuNotFoundSub')}</span>
        </div>
      `;
      return;
    }

    const catLabels = {
      'coffee-flavor': '☕ Coffee & Flavor',
      'signature': '⭐ Signature Drinks',
      'non-coffee': '🍵 Non-Coffee',
      'custom': I18N.t('catCustom')
    };

    container.innerHTML = filtered.map(item => {
      const isCustom = item.category === 'custom' || (item.id && String(item.id).startsWith('custom-')) || item.badge === 'Custom';
      const bgImg = isCustom ? 'assets/dialog_logo.jpg' : (item.image || 'assets/menu/dialog_coffee.jpg');
      const catLabel = catLabels[item.category] || item.category || 'Menu';

      return `
        <div class="settings-menu-item-row">
          <div class="settings-menu-item-thumb">
            <img src="${bgImg}" alt="${item.name}" onerror="this.src='assets/dialog_logo.jpg'">
          </div>
          <div class="settings-menu-item-details">
            <div class="settings-menu-item-name">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;">${item.name}</span>
              ${item.badge ? `<span class="badge-tag" style="font-size: 0.6rem; padding: 2px 6px; flex-shrink: 0;">${item.badge}</span>` : ''}
            </div>
            <div class="settings-menu-item-price-val">${App.formatRupiah(item.price)}</div>
            <div class="settings-menu-item-meta">${catLabel}${item.desc ? ` • ${item.desc}` : ''}</div>
          </div>
          <div class="settings-menu-item-actions">
            <button type="button" class="btn-table-action" title="${I18N.currentLang === 'en' ? 'Edit Item' : 'Edit Menu'}" onclick="App.openEditMenuModal('${item.id}')">
              ✏️
            </button>
            <button type="button" class="btn-table-action delete" title="${I18N.currentLang === 'en' ? 'Delete Item' : 'Hapus Menu'}" onclick="App.deleteMenuItem('${item.id}')">
              🗑️
            </button>
          </div>
        </div>
      `;

    }).join('');
  },

  openEditMenuModal(itemId) {
    const menu = StorageManager.getMenu();
    const item = menu.find(m => String(m.id) === String(itemId));
    if (!item) return;

    const modal = document.getElementById('settingsMenuEditModal');
    if (!modal) return;

    const idInput = document.getElementById('ownerMenuEditId');
    const nameInput = document.getElementById('ownerMenuEditName');
    const priceInput = document.getElementById('ownerMenuEditPrice');
    const catInput = document.getElementById('ownerMenuEditCategory');
    const badgeInput = document.getElementById('ownerMenuEditBadge');
    const descInput = document.getElementById('ownerMenuEditDesc');
    const title = document.getElementById('ownerMenuModalTitle');
    const saveText = document.getElementById('btnSaveOwnerMenuText');
    const deleteBtn = document.getElementById('btnDeleteOwnerMenuItem');
    const err = document.getElementById('ownerMenuEditError');

    if (idInput) idInput.value = item.id;
    if (nameInput) nameInput.value = item.name || '';
    if (priceInput) priceInput.value = item.price || 0;
    if (catInput) catInput.value = item.category || 'coffee-flavor';
    if (badgeInput) badgeInput.value = item.badge || '';
    if (descInput) descInput.value = item.desc || '';
    if (title) title.textContent = I18N.t('editMenuTitle');
    if (saveText) saveText.textContent = I18N.t('saveChangesBtn');
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    if (err) { err.style.display = 'none'; err.textContent = ''; }

    modal.classList.add('active');
    setTimeout(() => { if (nameInput) nameInput.focus(); }, 150);
  },

  openAddMenuModal() {
    const modal = document.getElementById('settingsMenuEditModal');
    if (!modal) return;

    const idInput = document.getElementById('ownerMenuEditId');
    const nameInput = document.getElementById('ownerMenuEditName');
    const priceInput = document.getElementById('ownerMenuEditPrice');
    const catInput = document.getElementById('ownerMenuEditCategory');
    const badgeInput = document.getElementById('ownerMenuEditBadge');
    const descInput = document.getElementById('ownerMenuEditDesc');
    const title = document.getElementById('ownerMenuModalTitle');
    const saveText = document.getElementById('btnSaveOwnerMenuText');
    const deleteBtn = document.getElementById('btnDeleteOwnerMenuItem');
    const err = document.getElementById('ownerMenuEditError');

    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '';
    if (catInput) catInput.value = 'coffee-flavor';
    if (badgeInput) badgeInput.value = '';
    if (descInput) descInput.value = '';
    if (title) title.textContent = I18N.t('addMenuTitle');
    if (saveText) saveText.textContent = I18N.t('addToMenuBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (err) { err.style.display = 'none'; err.textContent = ''; }

    modal.classList.add('active');
    setTimeout(() => { if (nameInput) nameInput.focus(); }, 150);
  },

  closeEditMenuModal() {
    const modal = document.getElementById('settingsMenuEditModal');
    if (modal) modal.classList.remove('active');
  },

  saveMenuModal() {
    const idInput = document.getElementById('ownerMenuEditId');
    const nameInput = document.getElementById('ownerMenuEditName');
    const priceInput = document.getElementById('ownerMenuEditPrice');
    const catInput = document.getElementById('ownerMenuEditCategory');
    const badgeInput = document.getElementById('ownerMenuEditBadge');
    const descInput = document.getElementById('ownerMenuEditDesc');
    const err = document.getElementById('ownerMenuEditError');

    const id = idInput ? idInput.value.trim() : '';
    const name = nameInput ? nameInput.value.trim() : '';
    const price = Number(priceInput ? priceInput.value : 0);
    const category = catInput ? catInput.value : 'coffee-flavor';
    const badge = badgeInput ? badgeInput.value.trim() : '';
    const desc = descInput ? descInput.value.trim() : '';

    if (!name) {
      if (err) { err.textContent = 'Silakan masukkan nama menu!'; err.style.display = 'block'; }
      if (nameInput) nameInput.focus();
      return;
    }

    if (isNaN(price) || price < 0) {
      if (err) { err.textContent = 'Harga harus berupa angka valid (minimal Rp 0)!'; err.style.display = 'block'; }
      if (priceInput) priceInput.focus();
      return;
    }

    const menu = StorageManager.getMenu();

    if (id) {
      // EDIT MENU YANG SUDAH ADA
      const idx = menu.findIndex(m => String(m.id) === String(id));
      if (idx !== -1) {
        menu[idx].name = name;
        menu[idx].price = price;
        menu[idx].category = category;
        menu[idx].badge = badge;
        menu[idx].desc = desc;
      }
    } else {
      // TAMBAH MENU BARU
      const newId = 'menu-' + Date.now();
      menu.push({
        id: newId,
        name: name,
        price: price,
        category: category,
        badge: badge,
        desc: desc || 'Menu DIALOG COFFEE',
        icon: category === 'non-coffee' ? '🍵' : '☕',
        image: 'assets/dialog_logo.jpg'
      });
    }

    StorageManager.saveMenu(menu);
    this.renderSettingsMenuList();
    if (window.POSModule) {
      POSModule.renderMenu();
      if (id && POSModule.cart) {
        POSModule.cart.forEach(c => {
          if (String(c.id) === String(id)) {
            c.name = name;
            c.price = price;
          }
        });
        POSModule.renderCart();
      }
    }

    this.closeEditMenuModal();
    this.playBeep(660, 0.08);
    this.showToast(`Menu "${name}" berhasil ${id ? 'diperbarui' : 'ditambahkan'}!`, 'success');
  },

  deleteMenuItem(itemId) {
    if (!itemId) return;
    const menu = StorageManager.getMenu();
    const item = menu.find(m => String(m.id) === String(itemId));
    const itemName = item ? item.name : 'menu';

    if (!confirm(`Apakah Anda yakin ingin menghapus menu "${itemName}" dari daftar kasir?`)) {
      return;
    }

    const updated = menu.filter(m => String(m.id) !== String(itemId));

    StorageManager.saveMenu(updated);
    this.renderSettingsMenuList();
    if (window.POSModule) {
      POSModule.renderMenu();
    }
    this.closeEditMenuModal();
    this.showToast(`Menu "${itemName}" berhasil dihapus.`, 'info');
  },

  resetMenuToDefault() {
    if (!confirm('Kembalikan semua daftar menu ke menu bawaan resmi DIALOG COFFEE? Semua perubahan harga dan menu tambahan akan direset.')) {
      return;
    }
    StorageManager.resetMenuToDefault();
    this.renderSettingsMenuList();
    if (window.POSModule) {
      POSModule.renderMenu();
    }
    this.showToast('Daftar menu berhasil dikembalikan ke standar DIALOG COFFEE!', 'success');
  },



  scrollToCart() {
    const cart = document.querySelector('.pos-cart-panel');
    if (cart) {
      const mobileCartBar = document.getElementById('mobileCartBar');
      if (mobileCartBar) mobileCartBar.classList.remove('visible');
      if (window.POSModule) POSModule.isCartInView = true;
      cart.scrollIntoView({ behavior: 'smooth', block: 'start' });
      cart.classList.add('pulse-highlight');
      setTimeout(() => cart.classList.remove('pulse-highlight'), 1000);
    }
  },

  formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  },

  formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString(I18N.currentLang === 'id' ? 'id-ID' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getSampleReceiptTransaction() {
    const settings = StorageManager.getSettings();
    return {
      id: 'POS-DEMO-001',
      date: new Date().toISOString(),
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 40000,
      subtotal: 40000,
      tax: settings.taxEnabled ? Math.round((40000 * (settings.taxRate || 10)) / 100) : 0,
      cashTendered: 50000,
      change: 10000,
      paymentMethod: 'Tunai',
      shift: settings.activeShift || 'Shift 1',
      baristas: `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'}`,
      cashier: settings.activeCashier || 'Ardi',
      description: 'Penjualan Kasir (DIALOG COFFEE x1, CARAMEL REGAL x1)',
      refNo: 'POS-DEMO-001',
      items: [
        { name: 'DIALOG COFFEE', qty: 1, price: 20000, subtotal: 20000 },
        { name: 'CARAMEL REGAL', qty: 1, price: 20000, subtotal: 20000 }
      ]
    };
  },

  testReceiptPrintModal() {
    const trx = this.getSampleReceiptTransaction();
    if (window.POSModule) {
      POSModule.showReceiptModal(trx);
    }
  },

  testReceiptPrint() {
    const trx = this.getSampleReceiptTransaction();
    if (window.POSModule) {
      POSModule.showReceiptModal(trx);
      POSModule.printReceipt();
    }
  },

  testReceiptPDF() {
    const trx = this.getSampleReceiptTransaction();
    if (window.PDFExporter) {
      PDFExporter.exportReceiptPDF(trx);
    }
  },

  // BACK BUTTON & EXIT NOTIFICATION HANDLER (HP ANDROID & BROWSER)
  initBackButton() {
    // Inisialisasi history state untuk mendeteksi tombol back di browser / HP
    try {
      window.history.pushState({ page: 'dialog-cashier' }, '');
      window.addEventListener('popstate', (e) => {
        window.history.pushState({ page: 'dialog-cashier' }, '');
        this.handleHardwareBackButton();
      });
    } catch (e) {}

    // Listener Capacitor Native Back Button (Android APK)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('backButton', () => {
        this.handleHardwareBackButton();
      });
    }

    document.addEventListener('backbutton', () => {
      this.handleHardwareBackButton();
    }, false);
  },

  handleHardwareBackButton() {
    // 1. Cek apakah ada modal yang terbuka, jika ada tutup modal tersebut (kecuali modal login jika belum login)
    const openModals = document.querySelectorAll('.modal-backdrop.active');
    if (openModals.length > 0) {
      if (document.getElementById('accountLoginModal')?.classList.contains('active') && window.AuthModule && !AuthModule.isLoggedIn()) {
        return;
      }
      openModals.forEach(modal => modal.classList.remove('active'));
      return;
    }

    // 2. Jika sedang di tab selain Kasir (POS), kembali ke Kasir terlebih dahulu
    if (this.activeTab !== 'pos') {
      this.switchTab('pos');
      return;
    }

    // 3. Jika sudah di halaman utama Kasir dan tidak ada modal, jalankan notifikasi keluar
    const now = Date.now();
    if (!this.lastBackPressTime || (now - this.lastBackPressTime > 2500)) {
      this.lastBackPressTime = now;
      this.playBeep(440, 0.06);
      this.showToast('Tekan kembali sekali lagi untuk menutup aplikasi', 'info');
    } else {
      this.lastBackPressTime = 0;
      this.openExitModal();
    }
  },

  openExitModal() {
    const modal = document.getElementById('exitModal');
    if (modal) {
      modal.classList.add('active');
      this.playBeep(520, 0.08);
    }
  },

  closeExitModal() {
    const modal = document.getElementById('exitModal');
    if (modal) modal.classList.remove('active');
  },

  confirmExitApp() {
    this.closeExitModal();
    this.showToast('Menutup aplikasi...', 'info');

    setTimeout(() => {
      // 1. AndroidBridge Interface (Custom Native Android Bridge)
      if (window.AndroidBridge && typeof window.AndroidBridge.exitApp === 'function') {
        window.AndroidBridge.exitApp();
        return;
      }

      // 2. Capacitor App Plugin Native exit
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App && typeof window.Capacitor.Plugins.App.exitApp === 'function') {
        window.Capacitor.Plugins.App.exitApp();
        return;
      }

      // 3. Cordova / WebView exit
      if (navigator.app && navigator.app.exitApp) {
        navigator.app.exitApp();
        return;
      }

      // 4. Standard Window Close
      try {
        window.close();
      } catch (e) {}

      // 5. Fallback Browser: jika browser memblokir window.close(), tampilkan layar sesi ditutup
      setTimeout(() => {
        this.renderExitScreen();
      }, 350);
    }, 300);
  },

  renderExitScreen() {
    document.body.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #09090b; color: #f4f4f5; text-align: center; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="font-size: 3.5rem; margin-bottom: 16px;">☕</div>
        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 8px;">Aplikasi Kasir DIALOG COFFEE Ditutup</h2>
        <p style="font-size: 0.95rem; color: #a1a1aa; max-width: 360px; line-height: 1.5; margin-bottom: 24px;">
          Sesi kasir telah dihentikan dengan aman. Seluruh data transaksi dan pembukuan tersimpan rapi. Anda dapat menutup tab browser ini.
        </p>
        <button onclick="window.location.reload()" style="background: #e4e4e7; color: #18181b; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.9rem;">
          🔄 Buka Kasir Kembali
        </button>
      </div>
    `;
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

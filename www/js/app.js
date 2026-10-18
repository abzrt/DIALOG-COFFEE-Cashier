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
    this.initClock();
    this.bindNavigation();
    this.loadShiftHeader();
    this.loadSettingsForm();
    this.bindSettingsEvents();

    // Inisialisasi i18n
    if (window.I18N) I18N.init();

    // Inisialisasi Modul-Modul
    if (window.POSModule) POSModule.init();
    if (window.FinanceModule) FinanceModule.init();
    if (window.ReportsModule) ReportsModule.init();

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    console.log('☕ DIALOG COFFEE Cashier (Monochrome Edition) initialized.');
  },

  // THEME MANAGEMENT (MONOCHROME LIGHT / DARK)
  initTheme() {
    const s = StorageManager.getSettings();
    const savedTheme = s.theme || localStorage.getItem('dialog_coffee_theme') || 'light';
    this.setTheme(savedTheme);
  },

  setTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('dialog_coffee_theme', theme);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Ganti ke Tema Putih' : 'Ganti ke Tema Gelap';
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
      shiftChip.textContent = `${s.activeShift || 'Shift 1'}: ${s.activeBarista1 || 'Ardi'} & ${s.activeBarista2 || 'Anca'}`;
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

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const btn = document.getElementById('soundToggleBtn');
    if (btn) btn.textContent = this.soundEnabled ? '🔔' : '🔕';
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
    } else if (tabId === 'settings') {
      this.loadSettingsForm();
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
    setVal('cfgOwnerPhone', s.ownerPhone || '085334101996');
    setVal('cfgTaxRate', s.taxRate);
    setVal('cfgReceiptFooter', s.receiptFooter);

    const taxCheck = document.getElementById('cfgTaxEnabled');
    if (taxCheck) taxCheck.checked = !!s.taxEnabled;
  },

  bindSettingsEvents() {
    const form = document.getElementById('settingsForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          ...StorageManager.getSettings(),
          cafeName: document.getElementById('cfgCafeName').value.trim() || 'DIALOG COFFEE',
          tagline: document.getElementById('cfgTagline').value.trim(),
          address: document.getElementById('cfgAddress').value.trim(),
          phone: document.getElementById('cfgPhone').value.trim(),
          ownerPhone: document.getElementById('cfgOwnerPhone').value.trim() || '085334101996',
          taxRate: Number(document.getElementById('cfgTaxRate').value) || 0,
          taxEnabled: document.getElementById('cfgTaxEnabled').checked,
          receiptFooter: document.getElementById('cfgReceiptFooter').value
        };

        StorageManager.saveSettings(updated);
        this.loadSettingsForm();
        if (window.POSModule) POSModule.renderCart();
        App.playBeep(660, 0.08);
        this.showToast('Pengaturan cafe dan nomor WhatsApp berhasil disimpan!', 'success');
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


  scrollToCart() {
    const cart = document.querySelector('.pos-cart-panel');
    if (cart) {
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
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

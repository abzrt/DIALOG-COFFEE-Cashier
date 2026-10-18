/**
 * DIALOG COFFEE Cashier - Core Application Controller
 * Manages navigation, audio effects, settings form, backup/restore, and UI initialization.
 */

const App = {
  activeTab: 'pos',
  audioCtx: null,
  soundEnabled: true,

  init() {
    this.initAudio();
    this.initClock();
    this.bindNavigation();
    this.loadSettingsForm();
    this.bindSettingsEvents();

    // Inisialisasi Modul-Modul
    if (window.POSModule) POSModule.init();
    if (window.FinanceModule) FinanceModule.init();
    if (window.ReportsModule) ReportsModule.init();

    // Daftarkan Service Worker jika didukung
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('SW registration note:', err);
      });
    }

    console.log('☕ DIALOG COFFEE Cashier initialized successfully.');
  },

  // Audio Synthesizer (Zero-dependency Web Audio API)
  initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioCtx = new AudioContext();
    }
  },

  playBeep(freq = 440, duration = 0.05, type = 'sine') {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
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
    } catch (e) {
      // Audio not permitted yet
    }
  },

  playChime() {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
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
    if (btn) {
      btn.textContent = this.soundEnabled ? '🔔' : '🔕';
      btn.title = this.soundEnabled ? 'Suara Aktif' : 'Suara Dimatikan';
    }
    this.showToast(this.soundEnabled ? 'Efek audio diaktifkan' : 'Efek audio dimatikan', 'info');
  },

  // Real-time Clock
  initClock() {
    const clockEl = document.getElementById('topClockDisplay');
    const update = () => {
      if (!clockEl) return;
      const now = new Date();
      clockEl.textContent = now.toLocaleDateString('id-ID', {
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
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-target-tab');
        this.switchTab(target);
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    this.playBeep(520, 0.03);

    // Update Top & Bottom Nav Active State
    document.querySelectorAll('[data-target-tab]').forEach(btn => {
      if (btn.getAttribute('data-target-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Views
    document.querySelectorAll('.view-section').forEach(sec => {
      if (sec.id === `view-${tabId}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Refresh data per view
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

  // Toast Notification
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
    setVal('cfgActiveCashier', s.activeCashier);
    setVal('cfgTaxRate', s.taxRate);
    setVal('cfgReceiptFooter', s.receiptFooter);

    const taxCheck = document.getElementById('cfgTaxEnabled');
    if (taxCheck) taxCheck.checked = !!s.taxEnabled;

    const shiftDisplay = document.getElementById('topShiftCashier');
    if (shiftDisplay) shiftDisplay.textContent = s.activeCashier;
  },

  bindSettingsEvents() {
    const form = document.getElementById('settingsForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          cafeName: document.getElementById('cfgCafeName').value.trim() || 'DIALOG COFFEE',
          tagline: document.getElementById('cfgTagline').value.trim(),
          address: document.getElementById('cfgAddress').value.trim(),
          phone: document.getElementById('cfgPhone').value.trim(),
          activeCashier: document.getElementById('cfgActiveCashier').value.trim() || 'Kasir On Duty',
          taxRate: Number(document.getElementById('cfgTaxRate').value) || 0,
          taxEnabled: document.getElementById('cfgTaxEnabled').checked,
          receiptFooter: document.getElementById('cfgReceiptFooter').value
        };

        StorageManager.saveSettings(updated);
        this.loadSettingsForm();
        if (window.POSModule) POSModule.renderCart();
        App.playBeep(660, 0.08);
        this.showToast('Pengaturan toko berhasil diperbarui!', 'success');
      });
    }

    // Backup JSON download
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

    // Restore JSON upload
    const restoreInput = document.getElementById('restoreFileInput');
    if (restoreInput) {
      restoreInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = StorageManager.importBackupJSON(event.target.result);
          if (res.success) {
            alert(`Berhasil memulihkan ${res.count} transaksi dari berkas cadangan!`);
            location.reload();
          } else {
            alert('Gagal memulihkan cadangan: ' + res.error);
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset Demo Data
    const resetBtn = document.getElementById('btnResetDemoData');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Kembalikan semua data ke sampel demo awal DIALOG COFFEE?')) {
          StorageManager.resetAllData();
          location.reload();
        }
      });
    }
  },

  // Helpers
  formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  },

  formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
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

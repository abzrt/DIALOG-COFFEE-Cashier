/**
 * DIALOG COFFEE Cashier - Data Storage & Persistence Module
 * Updated with exact customer menu, 2-shift 2-barista structure, owner WhatsApp configuration.
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'dialog_coffee_transactions_v2',
  MENU: 'dialog_coffee_menu_v2',
  SETTINGS: 'dialog_coffee_settings_v2',
  CLOSINGS: 'dialog_coffee_closings_v2'
};

// 1. MENU EXACT DIALOG COFFEE SESUAI PERMINTAAN USER
const DEFAULT_MENU = [
  // NON-COFFEE
  { id: 'nc-1', name: 'BISCOFF', category: 'non-coffee', price: 22000, desc: 'Lotus Biscoff creamy blend dengan remahan biskuit karamel', badge: 'Favorit', icon: '🍪' },
  { id: 'nc-2', name: 'CARAMEL REGAL', category: 'non-coffee', price: 20000, desc: 'Fresh milk berpadu saus karamel lezat dan biskuit Marie Regal', badge: 'Terlaris', icon: '🥛' },
  { id: 'nc-3', name: 'COKLAT', category: 'non-coffee', price: 18000, desc: 'Dark chocolate pekat premium dengan susu segar gurih manis pas', badge: '', icon: '🍫' },
  { id: 'nc-4', name: 'THAITEA', category: 'non-coffee', price: 15000, desc: 'Teh Thailand asli aromatik dipadu susu kental manis segar', badge: 'Segar', icon: '🧋' },
  { id: 'nc-5', name: 'GREENTEA', category: 'non-coffee', price: 15000, desc: 'Matcha green tea lembut menyegarkan kaya antioksidan', badge: '', icon: '🍵' },

  // SIGNATURE DRINKS
  { id: 'sig-1', name: 'DIALOG COFFEE', category: 'signature', price: 20000, desc: 'Signature house blend espresso, susu segar creamy & gula aren spesial Dialog', badge: 'Signature Utama', icon: '☕' },
  { id: 'sig-2', name: 'COFFEE SECRET', category: 'signature', price: 20000, desc: 'Kombinasi rahasia racikan barista Dialog dengan aroma misterius & manis', badge: 'Secret Recipe', icon: '✨' },
  { id: 'sig-3', name: 'COFFEE MITOS', category: 'signature', price: 20000, desc: 'Sentuhan kopi pekat dengan aftertaste butterscotch yang melegenda', badge: 'Favorit', icon: '☕' },
  { id: 'sig-4', name: 'AMERICANO', category: 'signature', price: 18000, desc: 'Double shot espresso arabica murni dengan air mineral dingin / panas', badge: 'Klasik', icon: '☕' },

  // COFFEE & FLAVOR
  { id: 'flv-1', name: 'AMERICANO', category: 'coffee-flavor', price: 18000, desc: 'Espresso blend klasik dengan notes nutty dan clean finish', badge: '', icon: '☕' },
  { id: 'flv-2', name: 'LEMSKUY', category: 'coffee-flavor', price: 18000, desc: 'Espresso mocktail dipadu lemon segar menyegarkan hari', badge: 'Fresh', icon: '🍋' },
  { id: 'flv-3', name: 'CARAMEL MACHIATO', category: 'coffee-flavor', price: 18000, desc: 'Layered espresso dengan vanilla foam dan saus karamel manis', badge: 'Favorit', icon: '🍮' },
  { id: 'flv-4', name: 'VANILLA', category: 'coffee-flavor', price: 18000, desc: 'Kopi susu beraroma vanila madagascar lembut dan wangi', badge: '', icon: '🍦' },
  { id: 'flv-5', name: 'CARAMEL', category: 'coffee-flavor', price: 18000, desc: 'Kopi susu berpadu sirup karamel bakar kental gurih', badge: '', icon: '🍯' },
  { id: 'flv-6', name: 'BUTTERSHCOOT', category: 'coffee-flavor', price: 18000, desc: 'Perpaduan brown sugar, mentega panggang, dan espresso lembut', badge: 'Best Pick', icon: '🧈' },
  { id: 'flv-7', name: 'TIRAMISU', category: 'coffee-flavor', price: 18000, desc: 'Sensasi rasa cake tiramisu Italia berpadu microfoam susu', badge: '', icon: '🍰' },
  { id: 'flv-8', name: 'HAZELNUT', category: 'coffee-flavor', price: 18000, desc: 'Kopi susu kaya aroma kacang hazelnut panggang aromatik', badge: '', icon: '🌰' },
  { id: 'flv-9', name: 'PANDAN', category: 'coffee-flavor', price: 18000, desc: 'Kopi susu khas nusantara dengan wangi pandan alami yang legit', badge: 'Khas', icon: '🍃' }
];

// Profil dan Pengaturan Toko (Owner WhatsApp: 085334101996, Barista & Shift)
const DEFAULT_SETTINGS = {
  cafeName: 'DIALOG COFFEE',
  tagline: 'Great Coffee, Honest Conversations',
  address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
  phone: '0853-3410-1996',
  ownerPhone: '085334101996',
  instagram: '@dialogcoffee.id',
  taxRate: 10,
  taxEnabled: true,
  currency: 'IDR',
  language: 'id',
  theme: 'light', // 'light' or 'dark' (Monochrome Black & White)
  
  // Daftar 4 Barista Resmi
  baristas: ['Ardi', 'Anca', 'Jhonson', 'Si Pur'],
  
  // Shift Aktif Saat Ini (1 Shift = 2 Orang Barista)
  activeShift: 'Shift 1',
  activeBarista1: 'Ardi',
  activeBarista2: 'Anca',
  activeCashier: 'Shift 1 (Ardi & Anca)',

  receiptFooter: 'Terima kasih atas kunjungannya!\nNikmati setiap tetes kopi dan percakapan hangat.\nTag kami di IG @dialogcoffee.id'
};

// Data Transaksi Sampel Realistis
function generateSampleTransactions() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const d1 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    // Kemarin
    {
      id: 'POS-261017-01',
      date: `${d1}T09:15:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 62000,
      paymentMethod: 'QRIS',
      shift: 'Shift 1',
      cashier: 'Shift 1 (Ardi & Anca)',
      description: 'Penjualan Kasir (DIALOG COFFEE x2, BISCOFF x1)',
      refNo: 'POS-01',
      items: [
        { name: 'DIALOG COFFEE', qty: 2, price: 20000, subtotal: 40000 },
        { name: 'BISCOFF', qty: 1, price: 22000, subtotal: 22000 }
      ]
    },
    {
      id: 'TRX-10201',
      date: `${d1}T11:00:00`,
      type: 'expense',
      category: 'Bahan Baku',
      amount: 180000,
      paymentMethod: 'Petty Cash',
      shift: 'Shift 1',
      cashier: 'Ardi',
      description: 'Beli Fresh Milk 6 Liter & Biskuit Marie Regal 4 Bungkus',
      refNo: 'NOTA-REG-01',
      items: []
    },
    {
      id: 'POS-261017-02',
      date: `${d1}T17:30:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 76000,
      paymentMethod: 'Tunai',
      shift: 'Shift 2',
      cashier: 'Shift 2 (Jhonson & Si Pur)',
      description: 'Penjualan Kasir (CARAMEL MACHIATO x2, COKLAT x2)',
      refNo: 'POS-02',
      items: [
        { name: 'CARAMEL MACHIATO', qty: 2, price: 18000, subtotal: 36000 },
        { name: 'COKLAT', qty: 2, price: 18000, subtotal: 36000 }
      ]
    },

    // Hari Ini
    {
      id: 'TRX-10202',
      date: `${todayStr}T08:00:00`,
      type: 'income',
      category: 'Modal Awal Kasir',
      amount: 300000,
      paymentMethod: 'Tunai',
      shift: 'Shift 1',
      cashier: 'Shift 1 (Ardi & Anca)',
      description: 'Kas modal awal laci kasir Shift 1 (Opening Float)',
      refNo: 'FLOAT-01',
      items: []
    },
    {
      id: 'POS-261018-01',
      date: `${todayStr}T09:30:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 60000,
      paymentMethod: 'QRIS',
      shift: 'Shift 1',
      cashier: 'Shift 1 (Ardi & Anca)',
      description: 'Penjualan Kasir (DIALOG COFFEE x1, COFFEE SECRET x1, CARAMEL REGAL x1)',
      refNo: 'POS-03',
      items: [
        { name: 'DIALOG COFFEE', qty: 1, price: 20000, subtotal: 20000 },
        { name: 'COFFEE SECRET', qty: 1, price: 20000, subtotal: 20000 },
        { name: 'CARAMEL REGAL', qty: 1, price: 20000, subtotal: 20000 }
      ]
    },
    {
      id: 'TRX-10203',
      date: `${todayStr}T11:15:00`,
      type: 'expense',
      category: 'Kemasan & Perlengkapan',
      amount: 95000,
      paymentMethod: 'Tunai',
      shift: 'Shift 1',
      cashier: 'Anca',
      description: 'Restock Cup Takeaway 14oz (150 pcs) & Sedotan Kertas',
      refNo: 'NOTA-CUP-18',
      items: []
    },
    {
      id: 'POS-261018-02',
      date: `${todayStr}T13:45:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 54000,
      paymentMethod: 'Tunai',
      shift: 'Shift 1',
      cashier: 'Shift 1 (Ardi & Anca)',
      description: 'Penjualan Kasir (BUTTERSHCOOT x1, LEMSKUY x1, THAITEA x1)',
      refNo: 'POS-04',
      items: [
        { name: 'BUTTERSHCOOT', qty: 1, price: 18000, subtotal: 18000 },
        { name: 'LEMSKUY', qty: 1, price: 18000, subtotal: 18000 },
        { name: 'THAITEA', qty: 1, price: 15000, subtotal: 15000 }
      ]
    },
    {
      id: 'POS-261018-03',
      date: `${todayStr}T16:30:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 58000,
      paymentMethod: 'QRIS',
      shift: 'Shift 2',
      cashier: 'Shift 2 (Jhonson & Si Pur)',
      description: 'Penjualan Kasir (COFFEE MITOS x1, BISCOFF x1, AMERICANO x1)',
      refNo: 'POS-05',
      items: [
        { name: 'COFFEE MITOS', qty: 1, price: 20000, subtotal: 20000 },
        { name: 'BISCOFF', qty: 1, price: 22000, subtotal: 22000 },
        { name: 'AMERICANO', qty: 1, price: 18000, subtotal: 18000 }
      ]
    }
  ];
}

const StorageManager = {
  // TRANSACTIONS
  getTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        const sample = generateSampleTransactions();
        this.saveAllTransactions(sample);
        return sample;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading transactions:', e);
      return [];
    }
  },

  saveAllTransactions(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving transactions:', e);
    }
  },

  addTransaction(trx) {
    const list = this.getTransactions();
    const settings = this.getSettings();

    if (!trx.id) {
      trx.id = 'TRX-' + Date.now().toString().slice(-6);
    }
    if (!trx.date) {
      trx.date = new Date().toISOString();
    }
    if (!trx.shift) {
      trx.shift = settings.activeShift || 'Shift 1';
    }
    if (!trx.cashier) {
      trx.cashier = settings.activeCashier;
    }

    list.unshift(trx);
    this.saveAllTransactions(list);
    return trx;
  },

  deleteTransaction(id) {
    let list = this.getTransactions();
    const beforeCount = list.length;
    list = list.filter(t => t.id !== id);
    this.saveAllTransactions(list);
    return list.length < beforeCount;
  },

  // MENU
  getMenu() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MENU);
      if (!data) {
        this.saveMenu(DEFAULT_MENU);
        return DEFAULT_MENU;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading menu:', e);
      return DEFAULT_MENU;
    }
  },

  saveMenu(menuList) {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuList));
    } catch (e) {
      console.error('Error saving menu:', e);
    }
  },

  // SETTINGS & SHIFT
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Error reading settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  updateShift(shiftName, b1, b2) {
    const s = this.getSettings();
    s.activeShift = shiftName;
    s.activeBarista1 = b1;
    s.activeBarista2 = b2;
    s.activeCashier = `${shiftName} (${b1} & ${b2})`;
    this.saveSettings(s);
    return s;
  },

  // CLOSINGS
  getClosings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLOSINGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveClosing(closingData) {
    const list = this.getClosings();
    list.unshift(closingData);
    localStorage.setItem(STORAGE_KEYS.CLOSINGS, JSON.stringify(list));
    return closingData;
  },

  // BACKUP & RESTORE
  exportFullBackupJSON() {
    const payload = {
      app: 'DIALOG COFFEE Cashier',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      menu: this.getMenu(),
      transactions: this.getTransactions(),
      closings: this.getClosings()
    };
    return JSON.stringify(payload, null, 2);
  },

  importBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        throw new Error('Format berkas cadangan tidak valid');
      }
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.menu && Array.isArray(parsed.menu)) this.saveMenu(parsed.menu);
      this.saveAllTransactions(parsed.transactions);
      if (parsed.closings) localStorage.setItem(STORAGE_KEYS.CLOSINGS, JSON.stringify(parsed.closings));
      return { success: true, count: parsed.transactions.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  resetAllData() {
    const sample = generateSampleTransactions();
    this.saveAllTransactions(sample);
    this.saveMenu(DEFAULT_MENU);
    this.saveSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CLOSINGS);
    return true;
  }
};

window.StorageManager = StorageManager;

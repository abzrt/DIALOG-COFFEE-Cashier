/**
 * DIALOG COFFEE Cashier - Data Storage & Persistence Module
 * Manages LocalStorage, initial seed data, transactions, and settings.
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'dialog_coffee_transactions_v1',
  MENU: 'dialog_coffee_menu_v1',
  SETTINGS: 'dialog_coffee_settings_v1'
};

// Menu default coffee shop
const DEFAULT_MENU = [
  // Signature Coffee
  { id: 'sig-1', name: 'Kopi Susu Dialog Aren', category: 'signature', price: 24000, desc: 'Espresso blend, fresh milk, sirup aren organik khas Dialog', badge: 'Terlaris', icon: '☕' },
  { id: 'sig-2', name: 'Caramel Velvet Macchiato', category: 'signature', price: 32000, desc: 'Layered espresso, vanilla foam, drizzle salted caramel', badge: 'Favorit', icon: '🍮' },
  { id: 'sig-3', name: 'Pistachio Cream Latte', category: 'signature', price: 35000, desc: 'Espresso arabica dengan saus pistachio asli dan foam lembut', badge: 'Baru', icon: '🥜' },
  { id: 'sig-4', name: 'Cold Brew Vanilla Cloud', category: 'signature', price: 28000, desc: 'Cold brew 16 jam dengan topping sweet cream vanilla float', badge: 'Segar', icon: '🧊' },

  // Espresso Bar
  { id: 'esp-1', name: 'Espresso Double Shot', category: 'espresso', price: 18000, desc: 'Ekstraksi murni 100% Arabica House Blend Dialog', badge: '', icon: '☕' },
  { id: 'esp-2', name: 'Americano / Long Black', category: 'espresso', price: 22000, desc: 'Double espresso dengan air mineral panas atau es dingin', badge: 'Klasik', icon: '☕' },
  { id: 'esp-3', name: 'Caffe Latte', category: 'espresso', price: 28000, desc: 'Espresso halus berpadu microfoam susu creamy', badge: '', icon: '🥛' },
  { id: 'esp-4', name: 'Cappuccino', category: 'espresso', price: 28000, desc: 'Rasio seimbang espresso, steamed milk, dan foam tebal bertabur cocoa', badge: '', icon: '☕' },
  { id: 'esp-5', name: 'Flat White', category: 'espresso', price: 30000, desc: 'Double ristretto dengan velvety microfoam khas Australia', badge: '', icon: '☕' },

  // Non-Coffee
  { id: 'non-1', name: 'Uji Matcha Latte', category: 'non-coffee', price: 32000, desc: 'Matcha grade artisanal Kyoto dengan steamed fresh milk', badge: 'Favorit', icon: '🍵' },
  { id: 'non-2', name: 'Belgian Dark Chocolate', category: 'non-coffee', price: 30000, desc: 'Cokelat Belgia 70% kaya rasa dan manis pas', badge: '', icon: '🍫' },
  { id: 'non-3', name: 'Red Velvet Silk', category: 'non-coffee', price: 29000, desc: 'Kombinasi red velvet, vanilla, dan kelembutan susu', badge: '', icon: '🍰' },
  { id: 'non-4', name: 'Earl Grey Milk Tea', category: 'non-coffee', price: 26000, desc: 'Teh hitam bergamot aromatik dipadukan susu creamy', badge: '', icon: '🧋' },

  // Manual Brew
  { id: 'man-1', name: 'V60 Gayo Winey Honey', category: 'manual-brew', price: 32000, desc: 'Notes berry, floral jasmine, medium body yang bersih', badge: 'Single Origin', icon: '🫖' },
  { id: 'man-2', name: 'Japanese Drip Flores Bajawa', category: 'manual-brew', price: 34000, desc: 'Diseduh langsung di atas es batu dengan aroma cokelat nutty', badge: '', icon: '🧊' },

  // Pastry & Snacks
  { id: 'pas-1', name: 'Butter Croissant French Style', category: 'pastry', price: 25000, desc: 'Pastry renyah berlapis dengan aroma butter New Zealand', badge: 'Fresh Oven', icon: '🥐' },
  { id: 'pas-2', name: 'Almond Pain au Chocolat', category: 'pastry', price: 32000, desc: 'Croissant cokelat dengan taburan almond panggang renyah', badge: '', icon: '🥐' },
  { id: 'pas-3', name: 'Dialog Truffle Fries', category: 'pastry', price: 28000, desc: 'Kentang goreng renyah bumbu truffle oil dan parmesan herb', badge: 'Snack', icon: '🍟' }
];

// Profil dan Pengaturan Toko
const DEFAULT_SETTINGS = {
  cafeName: 'DIALOG COFFEE',
  tagline: 'Great Coffee, Honest Conversations',
  address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
  phone: '0812-3456-7890',
  instagram: '@dialogcoffee.id',
  taxRate: 10,
  taxEnabled: true,
  currency: 'IDR',
  activeCashier: 'Aldi Pratama (Barista)',
  receiptFooter: 'Terima kasih atas kunjungannya!\nNikmati setiap tetes kopi dan percakapan hangat.\nTag kami di IG @dialogcoffee.id'
};

// Data Transaksi Contoh (Realistis untuk cafe)
function generateSampleTransactions() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const d1 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const d2 = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    // Kemarin Lusa
    {
      id: 'TRX-10101',
      date: `${d2}T08:00:00`,
      type: 'income',
      category: 'Modal Awal Kasir',
      amount: 500000,
      paymentMethod: 'Tunai',
      cashier: 'Aldi Pratama',
      description: 'Modal receh kasir pembukaan toko (Opening Float)',
      refNo: 'FLOAT-01',
      items: []
    },
    {
      id: 'TRX-10102',
      date: `${d2}T10:15:00`,
      type: 'expense',
      category: 'Bahan Baku',
      amount: 450000,
      paymentMethod: 'Rekening Operasional',
      cashier: 'Rian (Store Manager)',
      description: 'Beli 3kg Biji Kopi House Blend Arabica & Robusta',
      refNo: 'INV-ROAST-88',
      items: []
    },
    {
      id: 'TRX-10103',
      date: `${d2}T14:30:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 148000,
      paymentMethod: 'QRIS',
      cashier: 'Aldi Pratama',
      description: 'Pesanan meja 03 (3x Kopi Susu Dialog, 2x Butter Croissant)',
      refNo: 'POS-26101',
      items: [
        { name: 'Kopi Susu Dialog Aren', qty: 3, price: 24000, subtotal: 72000 },
        { name: 'Butter Croissant French Style', qty: 2, price: 25000, subtotal: 50000 }
      ]
    },

    // Kemarin
    {
      id: 'TRX-10104',
      date: `${d1}T09:00:00`,
      type: 'expense',
      category: 'Bahan Baku',
      amount: 320000,
      paymentMethod: 'Petty Cash',
      cashier: 'Aldi Pratama',
      description: 'Restock Fresh Milk Greenfields 1 Karton (12 Liter) & Sirup Aren',
      refNo: 'NOTA-MILK-12',
      items: []
    },
    {
      id: 'TRX-10105',
      date: `${d1}T11:45:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 98000,
      paymentMethod: 'Tunai',
      cashier: 'Aldi Pratama',
      description: 'Pesanan Takeaway (1x Pistachio Cream, 1x V60 Gayo, 1x Truffle Fries)',
      refNo: 'POS-26102',
      items: [
        { name: 'Pistachio Cream Latte', qty: 1, price: 35000, subtotal: 35000 },
        { name: 'V60 Gayo Winey Honey', qty: 1, price: 32000, subtotal: 32000 },
        { name: 'Dialog Truffle Fries', qty: 1, price: 28000, subtotal: 28000 }
      ]
    },
    {
      id: 'TRX-10106',
      date: `${d1}T15:20:00`,
      type: 'expense',
      category: 'Operasional',
      amount: 250000,
      paymentMethod: 'Rekening Operasional',
      cashier: 'Rian (Store Manager)',
      description: 'Token Listrik PLN Cafe dan Langganan Internet WiFi Biznet',
      refNo: 'PLN-9921',
      items: []
    },
    {
      id: 'TRX-10107',
      date: `${d1}T19:30:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 215000,
      paymentMethod: 'Transfer Bank',
      cashier: 'Aldi Pratama',
      description: 'Pesanan Komunitas Kopi (5x Americano, 2x Caramel Velvet, 2x Croissant)',
      refNo: 'POS-26103',
      items: [
        { name: 'Americano / Long Black', qty: 5, price: 22000, subtotal: 110000 },
        { name: 'Caramel Velvet Macchiato', qty: 2, price: 32000, subtotal: 64000 },
        { name: 'Butter Croissant French Style', qty: 2, price: 25000, subtotal: 50000 }
      ]
    },

    // Hari Ini
    {
      id: 'TRX-10108',
      date: `${todayStr}T08:30:00`,
      type: 'income',
      category: 'Modal Awal Kasir',
      amount: 500000,
      paymentMethod: 'Tunai',
      cashier: 'Aldi Pratama',
      description: 'Kas awal laci kasir hari ini (Opening Cash Drawer)',
      refNo: 'FLOAT-TODAY',
      items: []
    },
    {
      id: 'TRX-10109',
      date: `${todayStr}T09:40:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 82000,
      paymentMethod: 'QRIS',
      cashier: 'Aldi Pratama',
      description: 'Sarapan pagi (2x Kopi Susu Dialog Aren, 1x Almond Croissant)',
      refNo: 'POS-26104',
      items: [
        { name: 'Kopi Susu Dialog Aren', qty: 2, price: 24000, subtotal: 48000 },
        { name: 'Almond Pain au Chocolat', qty: 1, price: 32000, subtotal: 32000 }
      ]
    },
    {
      id: 'TRX-10110',
      date: `${todayStr}T11:15:00`,
      type: 'expense',
      category: 'Kemasan & Perlengkapan',
      amount: 175000,
      paymentMethod: 'Petty Cash',
      cashier: 'Aldi Pratama',
      description: 'Beli Cup Takeaway 16oz (200 pcs), Sedotan Oxo-Biodegradable, dan Tissue',
      refNo: 'NOTA-CUP-44',
      items: []
    },
    {
      id: 'TRX-10111',
      date: `${todayStr}T13:00:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 142000,
      paymentMethod: 'Tunai',
      cashier: 'Aldi Pratama',
      description: 'Makan siang & ngopi (2x Caffe Latte, 1x Cold Brew Vanilla, 2x Truffle Fries)',
      refNo: 'POS-26105',
      items: [
        { name: 'Caffe Latte', qty: 2, price: 28000, subtotal: 56000 },
        { name: 'Cold Brew Vanilla Cloud', qty: 1, price: 28000, subtotal: 28000 },
        { name: 'Dialog Truffle Fries', qty: 2, price: 28000, subtotal: 56000 }
      ]
    },
    {
      id: 'TRX-10112',
      date: `${todayStr}T14:45:00`,
      type: 'expense',
      category: 'Perawatan Alat',
      amount: 120000,
      paymentMethod: 'Tunai',
      cashier: 'Aldi Pratama',
      description: 'Bubuk Pembersih Backflush Mesin Espresso Cafiza & Water Filter Cartridge',
      refNo: 'NOTA-SERV-09',
      items: []
    },
    {
      id: 'TRX-10113',
      date: `${todayStr}T16:20:00`,
      type: 'income',
      category: 'Penjualan Kasir',
      amount: 126000,
      paymentMethod: 'QRIS',
      cashier: 'Aldi Pratama',
      description: 'Sore santai (2x Uji Matcha Latte, 1x Flat White, 1x Butter Croissant)',
      refNo: 'POS-26106',
      items: [
        { name: 'Uji Matcha Latte', qty: 2, price: 32000, subtotal: 64000 },
        { name: 'Flat White', qty: 1, price: 30000, subtotal: 30000 },
        { name: 'Butter Croissant French Style', qty: 1, price: 25000, subtotal: 25000 }
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
    if (!trx.id) {
      trx.id = 'TRX-' + Date.now().toString().slice(-6);
    }
    if (!trx.date) {
      trx.date = new Date().toISOString();
    }
    list.unshift(trx);
    this.saveAllTransactions(list);
    return trx;
  },

  updateTransaction(id, updatedFields) {
    const list = this.getTransactions();
    const index = list.findIndex(t => t.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      this.saveAllTransactions(list);
      return list[index];
    }
    return null;
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

  addMenuItem(item) {
    const menu = this.getMenu();
    if (!item.id) {
      item.id = 'item-' + Date.now().toString().slice(-5);
    }
    menu.push(item);
    this.saveMenu(menu);
    return item;
  },

  updateMenuItem(id, updatedFields) {
    const menu = this.getMenu();
    const index = menu.findIndex(m => m.id === id);
    if (index !== -1) {
      menu[index] = { ...menu[index], ...updatedFields };
      this.saveMenu(menu);
      return menu[index];
    }
    return null;
  },

  deleteMenuItem(id) {
    let menu = this.getMenu();
    menu = menu.filter(m => m.id !== id);
    this.saveMenu(menu);
    return true;
  },

  // SETTINGS
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

  // BACKUP & RESTORE
  exportFullBackupJSON() {
    const payload = {
      app: 'DIALOG COFFEE Cashier',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      menu: this.getMenu(),
      transactions: this.getTransactions()
    };
    return JSON.stringify(payload, null, 2);
  },

  importBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        throw new Error('Format berkas cadangan tidak valid (transaksi tidak ditemukan)');
      }
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.menu && Array.isArray(parsed.menu)) this.saveMenu(parsed.menu);
      this.saveAllTransactions(parsed.transactions);
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
    return true;
  }
};

window.StorageManager = StorageManager;

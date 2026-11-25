/**
 * DIALOG COFFEE Cashier - Data Storage & Persistence Module
 * Cleaned: Default transaction data is now completely empty (0 transactions).
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'dialog_coffee_transactions_v3',
  MENU: 'dialog_coffee_menu_v2',
  SETTINGS: 'dialog_coffee_settings_v2',
  CLOSINGS: 'dialog_coffee_closings_v3',
  SAVED_ORDERS: 'dialog_coffee_saved_orders_v1',
  INVENTORY: 'dialog_coffee_inventory_v1',
  RECIPES: 'dialog_coffee_recipes_v1'
};

// Bersihkan riwayat demo versi sebelumnya secara otomatis
try {
  localStorage.removeItem('dialog_coffee_transactions_v1');
  localStorage.removeItem('dialog_coffee_transactions_v2');
  localStorage.removeItem('dialog_coffee_closings_v2');
} catch (e) {}


// 1. MENU EXACT DIALOG COFFEE
const DEFAULT_MENU = [
  // NON-COFFEE
  { id: 'nc-1', name: 'BISCOFF', category: 'non-coffee', price: 22000, desc: 'Lotus Biscoff creamy blend dengan remahan biskuit karamel', badge: 'Favorit', icon: '🍪', image: 'assets/menu/biscoff.jpg' },
  { id: 'nc-2', name: 'CARAMEL REGAL', category: 'non-coffee', price: 20000, desc: 'Fresh milk berpadu saus karamel lezat dan biskuit Marie Regal', badge: 'Terlaris', icon: '🥛', image: 'assets/menu/caramel_regal.jpg' },
  { id: 'nc-3', name: 'COKLAT', category: 'non-coffee', price: 18000, desc: 'Dark chocolate pekat premium dengan susu segar gurih manis pas', badge: '', icon: '🍫', image: 'assets/menu/coklat.jpg' },
  { id: 'nc-4', name: 'THAITEA', category: 'non-coffee', price: 15000, desc: 'Teh Thailand asli aromatik dipadu susu kental manis segar', badge: 'Segar', icon: '🧋', image: 'assets/menu/thaitea.jpg' },
  { id: 'nc-5', name: 'GREENTEA', category: 'non-coffee', price: 15000, desc: 'Matcha green tea lembut menyegarkan kaya antioksidan', badge: '', icon: '🍵', image: 'assets/menu/greentea.jpg' },

  // SIGNATURE DRINKS
  { id: 'sig-1', name: 'DIALOG COFFEE', category: 'signature', price: 20000, desc: 'Signature house blend espresso, susu segar creamy & gula aren spesial Dialog', badge: 'Signature Utama', icon: '☕', image: 'assets/menu/dialog_coffee.jpg' },
  { id: 'sig-2', name: 'COFFEE SECRET', category: 'signature', price: 20000, desc: 'Kombinasi rahasia racikan barista Dialog dengan aroma manis misterius', badge: 'Secret Recipe', icon: '✨', image: 'assets/menu/dialog_coffee.jpg' },
  { id: 'sig-3', name: 'COFFEE MITOS', category: 'signature', price: 20000, desc: 'Sentuhan kopi pekat dengan aftertaste butterscotch yang melegenda', badge: 'Favorit', icon: '☕', image: 'assets/menu/dialog_coffee.jpg' },
  { id: 'sig-4', name: 'AMERICANO', category: 'signature', price: 18000, desc: 'Double shot espresso arabica murni dengan air mineral dingin / panas', badge: 'Klasik', icon: '☕', image: 'assets/menu/americano.jpg' },

  // COFFEE & FLAVOR
  { id: 'flv-1', name: 'AMERICANO', category: 'coffee-flavor', price: 18000, desc: 'Espresso blend klasik dengan notes nutty dan clean finish', badge: '', icon: '☕', image: 'assets/menu/americano.jpg' },
  { id: 'flv-2', name: 'LEMSKUY', category: 'coffee-flavor', price: 18000, desc: 'Espresso mocktail dipadu lemon segar menyegarkan hari', badge: 'Fresh', icon: '🍋', image: 'assets/menu/lemskuy.jpg' },
  { id: 'flv-3', name: 'CARAMEL MACHIATO', category: 'coffee-flavor', price: 18000, desc: 'Layered espresso dengan vanilla foam dan saus karamel manis', badge: 'Favorit', icon: '🍮', image: 'assets/menu/caramel_machiato.jpg' },
  { id: 'flv-4', name: 'VANILLA', category: 'coffee-flavor', price: 18000, desc: 'Kopi susu beraroma vanila madagascar lembut dan wangi', badge: '', icon: '🍦', image: 'assets/menu/vanilla.jpg' },
  { id: 'flv-5', name: 'CARAMEL', category: 'coffee-flavor', price: 18000, desc: 'Kopi susu berpadu sirup karamel bakar kental gurih', badge: '', icon: '🍯', image: 'assets/menu/caramel_machiato.jpg' },
  { id: 'flv-6', name: 'BUTTERSHCOOT', category: 'coffee-flavor', price: 18000, desc: 'Perpaduan brown sugar, mentega panggang, dan espresso lembut', badge: 'Best Pick', icon: '🧈', image: 'assets/menu/dialog_coffee.jpg' },
  { id: 'flv-7', name: 'TIRAMISU', category: 'coffee-flavor', price: 18000, desc: 'Sensasi rasa cake tiramisu Italia berpadu microfoam susu', badge: '', icon: '🍰', image: 'assets/menu/tiramisu.jpg' },
  { id: 'flv-8', name: 'HAZELNUT', category: 'coffee-flavor', price: 18000, desc: 'Kopi susu kaya aroma kacang hazelnut panggang aromatik', badge: '', icon: '🌰', image: 'assets/menu/hazelnut.jpg' },
  { id: 'flv-9', name: 'PANDAN', category: 'coffee-flavor', price: 18000, desc: 'Kopi susu khas nusantara dengan wangi pandan alami yang legit', badge: 'Khas', icon: '🍃', image: 'assets/menu/pandan.jpg' }
];

// Profil dan Pengaturan Toko
const DEFAULT_SETTINGS = {
  cafeName: 'DIALOG COFFEE',
  tagline: 'Good Coffee, Good Dialog',
  address: 'Jl. Tien Soeharto, Rt. 012 Kec. Nunukan Timur, Kab. Nunukan Kalimantan Utara',
  phone: '085334101996',
  ownerPhone: '085334101996',
  gatewayPhone: '08982151560',
  instagram: '@dialogcoffee.nnk',
  taxRate: 10,
  taxEnabled: false,
  currency: 'IDR',
  language: 'id',
  theme: 'light',
  
  // 4 Barista Resmi
  baristas: ['Ardi', 'Anca', 'Jhonson', 'Si Pur'],
  
  // Shift Aktif
  activeShift: 'Shift 1',
  activeBarista1: 'Ardi',
  activeBarista2: 'Anca',
  activeCashier: 'Shift 1 (Ardi & Anca)',

  // Owner PIN (Default: 1996) & Barista Password (Default: 6969)
  ownerPin: '1996',
  baristaPin: '6969',

  // Cloud Database (Google Firebase Realtime Database)
  cloudSyncUrl: 'https://tech-solution-6441a-default-rtdb.asia-southeast1.firebasedatabase.app',
  cloudApiKey: 'dialog2026',
  cloudAutoSync: true,
  lastCloudSync: null,

  receiptFooter: 'Terima kasih atas kunjungannya!\nNikmati setiap tetes kopi dan percakapan hangat.\nTag kami di IG @dialogcoffee.nnk'
};

// 3. INVENTARIS BAHAN BAKU & RESEP MENU (BILL OF MATERIALS - BOM)
const DEFAULT_INVENTORY = [
  { id: 'ing-coffee', name: 'Biji Kopi Arabica (House Blend)', unit: 'gram', stock: 5000, minStock: 500, icon: '☕' },
  { id: 'ing-milk', name: 'Susu Segar UHT Full Cream', unit: 'ml', stock: 12000, minStock: 2000, icon: '🥛' },
  { id: 'ing-aren', name: 'Gula Aren Cair Spesial Dialog', unit: 'ml', stock: 3500, minStock: 500, icon: '🍯' },
  { id: 'ing-caramel', name: 'Sirup Karamel', unit: 'ml', stock: 1500, minStock: 300, icon: '🍮' },
  { id: 'ing-cup', name: 'Cup & Lid 14/16oz', unit: 'pcs', stock: 300, minStock: 40, icon: '🥤' },
  { id: 'ing-straw', name: 'Sedotan Higienis', unit: 'pcs', stock: 350, minStock: 50, icon: '🥢' }
];

const DEFAULT_RECIPES = {
  // Signature Drinks
  'sig-1': [{ id: 'ing-coffee', amount: 18 }, { id: 'ing-milk', amount: 100 }, { id: 'ing-aren', amount: 25 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  'sig-2': [{ id: 'ing-coffee', amount: 18 }, { id: 'ing-milk', amount: 100 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  'sig-3': [{ id: 'ing-coffee', amount: 18 }, { id: 'ing-milk', amount: 100 }, { id: 'ing-caramel', amount: 15 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  'sig-4': [{ id: 'ing-coffee', amount: 18 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  // Coffee & Flavor
  'flv-1': [{ id: 'ing-coffee', amount: 18 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  'flv-3': [{ id: 'ing-coffee', amount: 18 }, { id: 'ing-milk', amount: 100 }, { id: 'ing-caramel', amount: 20 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  'flv-4': [{ id: 'ing-coffee', amount: 18 }, { id: 'ing-milk', amount: 100 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  'flv-5': [{ id: 'ing-coffee', amount: 18 }, { id: 'ing-milk', amount: 100 }, { id: 'ing-caramel', amount: 20 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  // Non-Coffee
  'nc-1': [{ id: 'ing-milk', amount: 130 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  'nc-2': [{ id: 'ing-milk', amount: 120 }, { id: 'ing-caramel', amount: 20 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }],
  'nc-3': [{ id: 'ing-milk', amount: 130 }, { id: 'ing-cup', amount: 1 }, { id: 'ing-straw', amount: 1 }]
};

const StorageManager = {
  // TRANSACTIONS (KOSONG SECARA DEFAULT)
  getTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        this.saveAllTransactions([]);
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading transactions:', e);
      return [];
    }
  },

  saveAllTransactions(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list || []));
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
    if (!trx.deviceId && window.AuthModule && typeof AuthModule.getDeviceId === 'function') {
      trx.deviceId = AuthModule.getDeviceId();
    }
    if (!trx.userRole && window.AuthModule && typeof AuthModule.getCurrentRole === 'function') {
      trx.userRole = AuthModule.getCurrentRole() || 'barista';
    }

    if (!settings.shiftOpenedAt) {
      settings.shiftOpenedAt = trx.date || new Date().toISOString();
      this.saveSettings(settings);
    }

    list.unshift(trx);
    this.saveAllTransactions(list);

    // Otomatis sinkronkan transaksi baru ke cloud database baik di login Barista maupun Owner
    if (window.CloudSync && typeof CloudSync.pushTransactionToCloud === 'function') {
      CloudSync.pushTransactionToCloud(trx);
    }

    return trx;
  },

  deleteTransaction(id) {
    let list = this.getTransactions();
    const beforeCount = list.length;
    list = list.filter(t => t.id !== id);
    this.saveAllTransactions(list);
    if (window.CloudSync && typeof CloudSync.deleteTransactionFromCloud === 'function') {
      CloudSync.deleteTransactionFromCloud(id);
    }
    return list.length < beforeCount;
  },

  clearAllTransactions() {
    this.saveAllTransactions([]);
    localStorage.removeItem(STORAGE_KEYS.CLOSINGS);
    localStorage.removeItem('dialog_coffee_transactions_v1');
    localStorage.removeItem('dialog_coffee_transactions_v2');
    localStorage.removeItem('dialog_coffee_closings_v2');
    return true;
  },

  // MENU
  getMenu() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MENU);
      if (!data) {
        this.saveMenu(DEFAULT_MENU);
        return DEFAULT_MENU;
      }
      const parsed = JSON.parse(data);
      let needsSave = false;
      const updated = parsed.map(item => {
        const def = DEFAULT_MENU.find(d => d.id === item.id);
        if (def && (!item.image || item.image !== def.image)) {
          item.image = def.image;
          needsSave = true;
        }
        return item;
      });
      if (needsSave) this.saveMenu(updated);
      return updated;
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

  getDefaultMenu() {
    return JSON.parse(JSON.stringify(DEFAULT_MENU));
  },

  resetMenuToDefault() {
    const def = JSON.parse(JSON.stringify(DEFAULT_MENU));
    this.saveMenu(def);
    return def;
  },


  // SETTINGS & SHIFT
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      const parsed = JSON.parse(data);
      // Migrasi data jika masih tersimpan data demo lama di localStorage
      if (!parsed.tagline || parsed.tagline.includes('Great Coffee') || parsed.tagline.includes('Honest Conversations')) {
        parsed.tagline = DEFAULT_SETTINGS.tagline;
      }
      if (!parsed.address || parsed.address.includes('Senopati')) {
        parsed.address = DEFAULT_SETTINGS.address;
      }
      if (!parsed.instagram || parsed.instagram.includes('@dialogcoffee.id')) {
        parsed.instagram = DEFAULT_SETTINGS.instagram;
      }
      if (!parsed.receiptFooter || parsed.receiptFooter.includes('@dialogcoffee.id')) {
        parsed.receiptFooter = DEFAULT_SETTINGS.receiptFooter;
      }
      if (!parsed.phone || parsed.phone === '0853-3410-1996') {
        parsed.phone = '085334101996';
      }
      if (!localStorage.getItem('dialog_coffee_tax_configured')) {
        parsed.taxEnabled = false;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
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
    const isShiftChanged = s.activeShift !== shiftName;
    s.activeShift = shiftName;
    s.activeBarista1 = b1;
    s.activeBarista2 = b2;
    s.activeCashier = `${shiftName} (${b1} & ${b2})`;
    if (isShiftChanged || !s.shiftOpenedAt) {
      s.shiftOpenedAt = new Date().toISOString();
    }
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

  saveAllClosings(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.CLOSINGS, JSON.stringify(list || []));
    } catch (e) {
      console.error('Error saving closings:', e);
    }
  },

  // BACKUP & RESTORE
  exportFullBackupJSON() {
    const payload = {
      app: 'DIALOG COFFEE Cashier',
      version: '3.0',
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

  // SAVED ORDERS (HOLD / PENDING BILLS)
  getSavedOrders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_ORDERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading saved orders:', e);
      return [];
    }
  },

  saveAllSavedOrders(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_ORDERS, JSON.stringify(list || []));
    } catch (e) {
      console.error('Error saving saved orders:', e);
    }
  },

  addSavedOrder(order) {
    let list = this.getSavedOrders();
    if (!order.id) {
      order.id = 'ORD-' + Date.now().toString().slice(-6);
    }
    if (!order.date) {
      order.date = new Date().toISOString();
    }
    const existingIndex = list.findIndex(o => o.id === order.id);
    if (existingIndex >= 0) {
      list[existingIndex] = order;
    } else {
      list.unshift(order);
    }
    this.saveAllSavedOrders(list);
    return order;
  },

  removeSavedOrder(id) {
    let list = this.getSavedOrders();
    list = list.filter(o => o.id !== id);
    this.saveAllSavedOrders(list);
    return list;
  },

  // INVENTARIS BAHAN BAKU & RESEP MENU (BOM)
  getInventory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (!data) {
        this.saveInventory(DEFAULT_INVENTORY);
        return JSON.parse(JSON.stringify(DEFAULT_INVENTORY));
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading inventory:', e);
      return JSON.parse(JSON.stringify(DEFAULT_INVENTORY));
    }
  },

  saveInventory(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(list || []));
    } catch (e) {
      console.error('Error saving inventory:', e);
    }
  },

  getRecipes() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (!data) {
        this.saveRecipes(DEFAULT_RECIPES);
        return JSON.parse(JSON.stringify(DEFAULT_RECIPES));
      }
      return JSON.parse(data);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_RECIPES));
    }
  },

  saveRecipes(recipes) {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes || {}));
    } catch (e) {
      console.error('Error saving recipes:', e);
    }
  },

  restockIngredient(ingId, amount) {
    const inv = this.getInventory();
    const item = inv.find(i => i.id === ingId);
    if (!item) return false;
    item.stock = (Number(item.stock) || 0) + Number(amount);
    this.saveInventory(inv);
    return item;
  },

  deductIngredientsForOrder(cartItems) {
    if (!cartItems || !cartItems.length) return [];
    const inv = this.getInventory();
    const recipes = this.getRecipes();
    const lowStockAlerts = [];

    cartItems.forEach(cartItem => {
      const recipe = recipes[cartItem.id];
      if (recipe && Array.isArray(recipe)) {
        recipe.forEach(rec => {
          const ing = inv.find(i => i.id === rec.id);
          if (ing) {
            const deductAmt = (Number(rec.amount) || 0) * (Number(cartItem.qty) || 1);
            ing.stock = Math.max(0, (Number(ing.stock) || 0) - deductAmt);
            if (ing.stock <= (Number(ing.minStock) || 0)) {
              if (!lowStockAlerts.find(a => a.id === ing.id)) {
                lowStockAlerts.push({ id: ing.id, name: ing.name, stock: ing.stock, unit: ing.unit });
              }
            }
          }
        });
      }
    });

    this.saveInventory(inv);
    return lowStockAlerts;
  },

  resetAllData() {
    this.saveAllTransactions([]);
    this.saveMenu(DEFAULT_MENU);
    this.saveSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CLOSINGS);
    localStorage.removeItem('dialog_coffee_transactions_v1');
    localStorage.removeItem('dialog_coffee_transactions_v2');
    return true;
  }
};

window.StorageManager = StorageManager;

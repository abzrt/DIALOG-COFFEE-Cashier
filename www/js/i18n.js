/**
 * DIALOG COFFEE Cashier - Bilingual Internationalization (i18n) Module
 * Supports Bahasa Indonesia (id) and English (en).
 */

const I18N = {
  currentLang: 'id',

  translations: {
    id: {
      appName: 'DIALOG COFFEE',
      cashierBadge: 'KASIR',
      posTab: 'Kasir (POS)',
      financeTab: 'Buku Kas',
      reportsTab: 'Laporan & Grafik',
      exportTab: 'Ekspor Dokumen',
      settingsTab: 'Pengaturan',
      
      // Shift & Barista
      shiftModalTitle: 'Pengaturan Shift & Barista',
      activeShift: 'Shift Aktif',
      barista1: 'Barista 1',
      barista2: 'Barista 2',
      saveShift: 'Simpan Shift',
      shift1Label: 'Shift 1 (Pagi - Siang)',
      shift2Label: 'Shift 2 (Sore - Malam)',

      // POS
      searchPlaceholder: 'Cari menu kopi, non-coffee, flavor...',
      allMenu: 'Semua Menu',
      catNonCoffee: 'Non-Coffee',
      catSignature: 'Signature Drinks',
      catFlavor: 'Coffee & Flavor',
      cartTitle: 'Pesanan Aktif',
      clearCart: 'Kosongkan',
      emptyCartText: 'Keranjang masih kosong',
      emptyCartSub: 'Pilih produk di menu untuk mulai transaksi',
      subtotal: 'Subtotal:',
      taxPB1: 'Pajak PB1 (10%):',
      totalPay: 'Total Bayar:',
      checkoutBtn: 'Lanjut Pembayaran',

      // Payment Modal
      payModalTitle: 'Pembayaran Transaksi',
      totalBill: 'Total Tagihan',
      payMethod: 'Metode Pembayaran',
      cashTendered: 'Nominal Diterima (Rp)',
      exactCash: 'Uang Pas',
      changeDue: 'Kembalian:',
      additionalNotes: 'Catatan Tambahan (Opsional)',
      cancel: 'Batal',
      payAndPrint: 'Bayar & Cetak Struk',
      payAndSendWA: 'Bayar & Kirim Info ke WA Owner',

      // Receipt Modal
      receiptTitle: 'Struk Pembayaran',
      printReceipt: 'Cetak Struk',
      downloadPDFReceipt: 'Unduh PDF Struk',
      sendReceiptWA: 'Kirim Struk ke WA Owner',

      // Finance (Buku Kas)
      totalIncome: 'Total Pemasukan',
      totalExpense: 'Total Pengeluaran',
      netProfit: 'Laba / (Rugi) Bersih',
      cashInDrawer: 'Kas di Laci (Tunai)',
      incomeSub: 'Penjualan kasir & kas masuk',
      expenseSub: 'Bahan baku, operasional, & gaji',
      profitSub: 'Pemasukan dikurangi pengeluaran',
      cashSub: 'Saldo fisik uang tunai saat ini',
      recordIncome: 'Catat Pemasukan',
      recordExpense: 'Catat Pengeluaran Detail',
      allTypes: 'Semua Tipe Transaksi',
      incomeOnly: 'Hanya Pemasukan',
      expenseOnly: 'Hanya Pengeluaran',
      allCategories: 'Semua Kategori',
      searchTrxPlaceholder: 'Cari transaksi / nota...',
      closingBtn: 'Closing Kasir & Rekap WA',

      // Closing Modal
      closingModalTitle: 'Closing Shift & Rekapan Harian',
      closingDate: 'Waktu Closing:',
      closingShift: 'Shift Bertugas:',
      closingBaristas: 'Barista On Duty:',
      closingTotalIncome: 'Pemasukan Hari Ini:',
      closingTotalExpense: 'Pengeluaran Hari Ini:',
      closingNetProfit: 'Laba Bersih Hari Ini:',
      closingCashPhysical: 'Kas Fisik Tunai di Laci:',
      sendClosingWA: 'Kirim Rekapan Closing ke WA Owner (085334101996)',

      // Reports
      filterPeriod: 'Filter Periode Laporan:',
      today: 'Hari Ini',
      yesterday: 'Kemarin',
      sevenDays: '7 Hari Terakhir',
      thisMonth: 'Bulan Ini',
      lastMonth: 'Bulan Lalu',
      allTime: 'Semua Waktu',
      customRange: 'Rentang Tanggal Khusus',
      downloadPDF: 'Unduh PDF',
      downloadWord: 'Unduh Word',
      cashflowTrendTitle: 'Tren Arus Kas Harian (Pemasukan vs Pengeluaran)',
      expenseDonutTitle: 'Komposisi Kategori Pengeluaran',
      top5Products: '5 Produk Terlaris (Periode Ini)',

      // Export Hub
      exportHubTitle: 'Pusat Ekspor Laporan Keuangan & Kasir',
      exportHubDesc: 'Cetak dan unduh laporan arus kas resmi DIALOG COFFEE dalam format Microsoft Word (.docx) dan Adobe PDF (.pdf) lengkap dengan rincian nota dan tanda tangan pengesahan.',
      exportScope: 'Cakupan Transaksi Ekspor:',
      exportScopeAll: 'Semua Data (Pemasukan & Pengeluaran)',
      exportScopeIncome: 'Hanya Pemasukan',
      exportScopeExpense: 'Hanya Pengeluaran',
      pdfCardTitle: 'Laporan Resmi PDF (.pdf)',
      wordCardTitle: 'Dokumen Microsoft Word (.docx)',
      csvCardTitle: 'Lembar Sebar Excel (.csv)',

      // Settings
      settingsProfileTitle: 'Profil Cafe & Pengaturan',
      cafeNameLabel: 'Nama Cafe / Brand',
      taglineLabel: 'Tagline / Slogan',
      addressLabel: 'Alamat Lengkap',
      phoneLabel: 'Nomor Telepon Cafe',
      ownerWALabel: 'Nomor WhatsApp Owner (Untuk Notifikasi & Closing)',
      taxRateLabel: 'Pajak Restoran / PB1 (%)',
      enableTax: 'Aktifkan Pajak',
      footerReceiptLabel: 'Pesan Footer Struk',
      saveProfileBtn: 'Simpan Pengaturan',
      backupTitle: 'Manajemen Cadangan Data & Pemulihan',
      backupDesc: 'Data kasir dan transaksi disimpan aman di perangkat. Anda dapat mengunduh berkas cadangan JSON kapan saja.',
      downloadBackupBtn: 'Unduh Cadangan Data (Backup JSON)',
      restoreLabel: 'Pulihkan Data dari Berkas Cadangan:',
      resetDemoBtn: 'Reset & Muat Ulang Data Sampel DIALOG COFFEE'
    },

    en: {
      appName: 'DIALOG COFFEE',
      cashierBadge: 'CASHIER',
      posTab: 'POS Cashier',
      financeTab: 'Cash Book',
      reportsTab: 'Reports & Charts',
      exportTab: 'Export Documents',
      settingsTab: 'Settings',

      // Shift & Barista
      shiftModalTitle: 'Shift & Barista Management',
      activeShift: 'Active Shift',
      barista1: 'Barista 1',
      barista2: 'Barista 2',
      saveShift: 'Save Shift',
      shift1Label: 'Shift 1 (Morning - Afternoon)',
      shift2Label: 'Shift 2 (Afternoon - Night)',

      // POS
      searchPlaceholder: 'Search coffee, non-coffee, flavors...',
      allMenu: 'All Items',
      catNonCoffee: 'Non-Coffee',
      catSignature: 'Signature Drinks',
      catFlavor: 'Coffee & Flavor',
      cartTitle: 'Active Order',
      clearCart: 'Clear',
      emptyCartText: 'Cart is currently empty',
      emptyCartSub: 'Select items from menu to start order',
      subtotal: 'Subtotal:',
      taxPB1: 'PB1 Tax (10%):',
      totalPay: 'Total Due:',
      checkoutBtn: 'Proceed to Payment',

      // Payment Modal
      payModalTitle: 'Payment Checkout',
      totalBill: 'Total Bill',
      payMethod: 'Payment Method',
      cashTendered: 'Cash Tendered (Rp)',
      exactCash: 'Exact Amount',
      changeDue: 'Change Due:',
      additionalNotes: 'Additional Notes (Optional)',
      cancel: 'Cancel',
      payAndPrint: 'Pay & Print Receipt',
      payAndSendWA: 'Pay & Send Info to Owner WA',

      // Receipt Modal
      receiptTitle: 'Payment Receipt',
      printReceipt: 'Print Receipt',
      downloadPDFReceipt: 'Download PDF Receipt',
      sendReceiptWA: 'Send Receipt to Owner WA',

      // Finance
      totalIncome: 'Total Income',
      totalExpense: 'Total Expenses',
      netProfit: 'Net Profit / (Loss)',
      cashInDrawer: 'Cash in Drawer',
      incomeSub: 'Sales revenue & cash in',
      expenseSub: 'Raw material, utility, & wages',
      profitSub: 'Income minus expenses',
      cashSub: 'Current physical cash in register',
      recordIncome: 'Record Income',
      recordExpense: 'Record Detailed Expense',
      allTypes: 'All Transaction Types',
      incomeOnly: 'Income Only',
      expenseOnly: 'Expenses Only',
      allCategories: 'All Categories',
      searchTrxPlaceholder: 'Search transaction / receipt...',
      closingBtn: 'Closing & WhatsApp Summary',

      // Closing Modal
      closingModalTitle: 'Shift Closing & Daily Summary',
      closingDate: 'Closing Time:',
      closingShift: 'Active Shift:',
      closingBaristas: 'Baristas on Duty:',
      closingTotalIncome: "Today's Total Income:",
      closingTotalExpense: "Today's Total Expenses:",
      closingNetProfit: "Today's Net Profit:",
      closingCashPhysical: 'Physical Cash in Register:',
      sendClosingWA: 'Send Closing Summary to Owner WA (085334101996)',

      // Reports
      filterPeriod: 'Report Period Filter:',
      today: 'Today',
      yesterday: 'Yesterday',
      sevenDays: 'Last 7 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      allTime: 'All Time',
      customRange: 'Custom Date Range',
      downloadPDF: 'Download PDF',
      downloadWord: 'Download Word',
      cashflowTrendTitle: 'Daily Cash Flow Trend (Income vs Expense)',
      expenseDonutTitle: 'Expense Breakdown by Category',
      top5Products: 'Top 5 Best-Selling Products',

      // Export Hub
      exportHubTitle: 'Financial & Cashier Export Hub',
      exportHubDesc: 'Print and download official DIALOG COFFEE cash flow statements in Microsoft Word (.docx) and Adobe PDF (.pdf) format complete with item details and signature sign-offs.',
      exportScope: 'Export Transaction Scope:',
      exportScopeAll: 'All Records (Income & Expenses)',
      exportScopeIncome: 'Income Only',
      exportScopeExpense: 'Expenses Only',
      pdfCardTitle: 'Official PDF Report (.pdf)',
      wordCardTitle: 'Microsoft Word Document (.docx)',
      csvCardTitle: 'Excel Spreadsheet (.csv)',

      // Settings
      settingsProfileTitle: 'Cafe Profile & Configuration',
      cafeNameLabel: 'Cafe / Brand Name',
      taglineLabel: 'Tagline / Slogan',
      addressLabel: 'Full Address',
      phoneLabel: 'Cafe Contact Number',
      ownerWALabel: "Owner's WhatsApp (For Notifications & Closing)",
      taxRateLabel: 'PB1 Restaurant Tax (%)',
      enableTax: 'Enable Tax',
      footerReceiptLabel: 'Receipt Footer Message',
      saveProfileBtn: 'Save Settings',
      backupTitle: 'Data Backup & Restore',
      backupDesc: 'Cashier and financial records are securely kept in local device storage. You can download a JSON backup anytime.',
      downloadBackupBtn: 'Download Full Backup (JSON)',
      restoreLabel: 'Restore Data from Backup File:',
      resetDemoBtn: 'Reset & Reload DIALOG COFFEE Sample Data'
    }
  },

  init() {
    const saved = localStorage.getItem('dialog_coffee_lang') || 'id';
    this.setLanguage(saved);
  },

  t(key) {
    const lang = this.translations[this.currentLang] || this.translations.id;
    return lang[key] || key;
  },

  setLanguage(lang) {
    if (!this.translations[lang]) lang = 'id';
    this.currentLang = lang;
    localStorage.setItem('dialog_coffee_lang', lang);

    // Update UI elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && this.translations[this.currentLang][key]) {
        el.textContent = this.translations[this.currentLang][key];
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && this.translations[this.currentLang][key]) {
        el.placeholder = this.translations[this.currentLang][key];
      }
    });

    // Update Language Button Indicator
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.innerHTML = lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN';
      langBtn.title = lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia';
    }

    // Refresh modules if initialized
    if (window.POSModule && typeof POSModule.renderCategories === 'function') {
      POSModule.renderCategories();
    }
    if (window.FinanceModule && typeof FinanceModule.renderAll === 'function') {
      FinanceModule.renderCategoryOptions();
    }
  },

  toggleLanguage() {
    const newLang = this.currentLang === 'id' ? 'en' : 'id';
    this.setLanguage(newLang);
    if (window.App && typeof App.showToast === 'function') {
      App.showToast(newLang === 'id' ? 'Bahasa diubah ke Bahasa Indonesia' : 'Language changed to English', 'info');
    }
  }
};

window.I18N = I18N;

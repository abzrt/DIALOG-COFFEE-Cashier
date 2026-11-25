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
      posTab: 'Kasir',
      financeTab: 'Buku Kas',
      reportsTab: 'Laporan',
      exportTab: 'Ekspor',
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
      viewCartBtn: 'Lihat Pesanan',
      seatNumber: 'Nomor Seat / Meja',
      customerName: 'Nama Pelanggan',
      holdOrderBtn: 'Simpan ke Draft',
      holdOrderModalTitle: 'Simpan Order (Draft / Open Bill)',
      savedOrders: 'Draft Order',
      savedOrdersTitle: 'Daftar Draft Orderan',
      noSavedOrders: 'Belum ada draft orderan tersimpan.',
      draftOrders: 'Draft Order',
      draftOrdersTitle: 'Daftar Draft Orderan',
      orderNameLabel: 'Nama Orderan / Pemesan',
      orderNamePlaceholder: 'Masukkan nama pemesan / meja (Wajib)...',
      saveDraftBtn: 'Simpan ke Draft',
      noDrafts: 'Belum ada draft orderan tersimpan.',
      openAndPay: 'Bayar Sekarang',
      openAndEdit: 'Buka Keranjang',

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
      resetDemoBtn: 'Reset & Muat Ulang Data Sampel DIALOG COFFEE',

      // Owner Menu & Dashboard
      ownerTab: 'Owner',
      ownerPortalTitle: 'Portal Kontrol Arus Kas Owner',
      ownerPortalDesc: 'Pemantauan alur pemasukan dan pengeluaran secara detil tiap hari, bulan, dan tahun.',
      ownerDailyTab: 'Alur Kas Harian',
      ownerMonthlyTab: 'Alur Kas Bulanan',
      ownerYearlyTab: 'Alur Kas Tahunan',
      ownerLoginModalTitle: 'Login Khusus Owner',
      ownerPinLabel: 'PIN Keamanan Owner',
      ownerPinPlaceholder: 'Masukkan PIN owner...',
      ownerPinSubmit: 'Masuk Area Owner',
      ownerLogoutBtn: 'Keluar Sesi Owner',

      // Table Headers
      thDateId: 'Tanggal & ID',
      thTimeId: 'Jam & ID',
      thType: 'Tipe',
      thCategoryShift: 'Kategori & Shift',
      thDescription: 'Keterangan / Rincian',
      thDescriptionMenu: 'Keterangan / Rincian Menu',
      thMethod: 'Metode',
      thAmount: 'Nominal',
      thAction: 'Aksi',
      thDetail: 'Detail',

      // Auth & Role Modal
      authModalTitle: 'Login Akun DIALOG COFFEE',
      appSubTitle: 'Sistem Kasir & Pembukuan',
      selectRolePrompt: 'Pilih peran akun Anda untuk melanjutkan:',
      fullAccessBadge: 'Akses Penuh',
      ownerCardDesc: 'Pengaturan & Arus Kas',
      dailyCashierBadge: 'Kasir Harian',
      baristaCardDesc: 'Kasir POS & Pesanan',
      enterOwnerPin: '👑 Masukkan PIN Pemilik (Owner):',
      enterBaristaPin: '☕ Masukkan PIN Barista:',
      loginAsOwner: 'Masuk Sebagai Owner',
      loginAsBarista: 'Masuk Sebagai Barista',
      ownerAccountLogin: 'Login Akun Owner',
      baristaAccountLogin: 'Login Akun Barista',
      pinIncorrect: 'PIN salah!',
      checking: 'Checking...',

      // Settings Extra
      instagramLabel: '📸 Akun Instagram Cafe',
      gatewayPhoneLabel: '📡 Nomor WhatsApp Gateway (Pengirim)',
      gatewayPhoneHint: 'Nomor gateway pengirim (+628982151560) khusus untuk mengirim rekapan closing',
      ownerPhoneHint: 'Nomor WhatsApp Owner (+62 85334101996) penerima rekapan closing kasir',
      ownerPinSettingLabel: '🔐 PIN Keamanan Owner (Akses Pengaturan & Owner)',
      ownerPinHint: 'PIN rahasia pemilik untuk membuka Tab Pengaturan & Dashboard Owner',
      baristaPinLabel: '☕ PIN Login Barista',
      baristaPinHint: 'PIN untuk login akun Barista ke kasir',
      printerSettingsTitle: 'Printer & Struk Kasir',
      printerSettingsDesc: 'Pengaturan pencetakan struk transaksi kasir. Kompatibel dengan printer thermal POS 80mm/58mm (Bluetooth, USB, WiFi, Network) serta opsi simpan struk format PDF jika printer belum terhubung.',
      testPrintBtn: 'Uji Cetak Printer',
      testPdfBtn: 'Uji Simpan PDF',
      cloudDbTitle: 'Database Real-Time Cloud (Google Firebase)',
      cloudDbDesc: 'Koneksi database real-time berjalan otomatis di latar belakang untuk mengamankan rekapan closing dan transaksi kasir ke Google Firebase.',
      testDbBtn: 'Uji Koneksi Database',
      syncAllDbBtn: 'Sinkronkan Seluruh Data',
      clearTrxHistoryBtn: 'Kosongkan Seluruh Riwayat Transaksi (Mulai Dari Nol)',
      resetSettingsDefaultBtn: 'Reset Menu & Pengaturan Default',

      // Menu Management (Owner)
      menuManagementTitle: 'Kelola & Edit Menu Cafe (Khusus Owner)',
      menuManagementDesc: 'Ubah nama, harga jual satuan, atau kategori pada semua menu kasir DIALOG COFFEE yang aktif.',
      searchMenuPlaceholder: '🔍 Cari menu...',
      addMenuBtn: 'Tambah Menu',
      resetDefaultBtn: 'Reset Default',
      editMenuTitle: 'Edit Menu Cafe',
      addMenuTitle: 'Tambah Menu Baru',
      addToMenuBtn: 'Tambah ke Menu',
      menuNameLabel: '☕ Nama Menu:',
      menuNamePlaceholder: 'Contoh: DIALOG COFFEE, AMERICANO, dll...',
      menuPriceLabel: '💵 Harga Satuan (Rp):',
      menuCategoryLabel: '🏷️ Kategori:',
      menuBadgeLabel: '⭐ Badge / Label (Opsional):',
      menuBadgePlaceholder: 'Contoh: Favorit, Terlaris, Best Pick...',
      menuDescLabel: '📝 Deskripsi Singkat:',
      menuDescPlaceholder: 'Keterangan rasa atau komposisi menu...',
      deleteMenuBtn: 'Hapus Menu',
      saveChangesBtn: 'Simpan Perubahan',
      menuNotFound: 'Menu tidak ditemukan',
      menuNotFoundSub: 'Coba gunakan kata kunci pencarian atau kategori lain.',
      catCustom: '✨ Custom / Lainnya',

      // Custom Menu POS Modal
      customMenuTitle: 'Tambah Custom Menu',
      customMenuDesc: 'Masukkan item pesanan khusus atau menu di luar daftar tetap:',
      customItemNameLabel: '📝 Nama Menu / Item Custom:',
      customItemNamePlaceholder: 'Contoh: Extra Espresso Shot, Snack, dsb...',
      customItemPriceLabel: '💵 Harga Satuan (Rp):',
      customItemQtyLabel: '🔢 Jumlah (Qty):',
      customItemCategoryLabel: '🏷️ Kategori Menu:',
      customItemSavePermanentLabel: 'Simpan ke daftar menu tetap (bisa dipilih lagi nanti)',
      addToCartBtn: 'Masukkan ke Pesanan',

      // Exit Modal
      exitModalTitle: 'Keluar dari Aplikasi',
      exitModalHeading: 'Tutup Aplikasi Kasir?',
      exitModalDesc: 'Apakah Anda ingin keluar dari aplikasi DIALOG COFFEE? Seluruh data kasir dan pembukuan shift tetap tersimpan aman.',
      exitConfirmBtn: 'Keluar',

      // Additional UI keys
      switchAccountBtn: '⇅ Ganti Akun',
      closeThisShiftBtn: 'Closing Shift Ini',
      selectShiftToClose: 'Pilih Shift yang Ditutup:',
      totalTodayTab: '📊 Total Hari Ini',
      incomeThisShift: 'Pemasukan Shift Ini:',
      expenseThisShift: 'Pengeluaran Shift Ini:',
      netProfitThisShift: 'Laba Bersih Shift Ini:',
      physicalCashInDrawer: 'Uang Fisik Kas di Laci:',
      trxCountLabel: 'Jumlah Transaksi:',
      closeOrCancel: 'Tutup / Batal',
      activeDraftBadge: 'Draft Aktif',
      saveBtn: 'Simpan',
      txVolume: 'Volume Transaksi',
      downloadWordDocBtn: 'Unduh Dokumen Word (.docx)',
      downloadPdfDocBtn: 'Unduh Dokumen PDF (.pdf)',
      downloadCsvBtn: 'Unduh Berkas CSV / Excel (.csv)',
      incomeCashBtn: '▲ Pemasukan Kas',
      expenseCashBtn: '▼ Pengeluaran Kas',
      trxCategoryLabel: 'Kategori Transaksi',
      trxAmountLabel: 'Nominal Transaksi (Rp)',
      trxDateTimeLabel: 'Tanggal & Waktu Transaksi',
      trxDescLabel: 'Keterangan / Rincian Detail Transaksi',
      trxPicLabel: 'Penanggung Jawab / Barista',
      trxRefLabel: 'Nomor Referensi / Nomor Nota Supplier (Opsional)'
    },

    en: {
      appName: 'DIALOG COFFEE',
      cashierBadge: 'CASHIER',
      posTab: 'Cashier',
      financeTab: 'Ledger',
      reportsTab: 'Reports',
      exportTab: 'Export',
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
      viewCartBtn: 'View Order',
      seatNumber: 'Seat / Table No.',
      customerName: 'Customer Name',
      holdOrderBtn: 'Save to Draft',
      holdOrderModalTitle: 'Save Order (Draft / Open Bill)',
      savedOrders: 'Draft Orders',
      savedOrdersTitle: 'Draft Orders List',
      noSavedOrders: 'No draft orders yet.',
      draftOrders: 'Draft Orders',
      draftOrdersTitle: 'Draft Orders List',
      orderNameLabel: 'Order / Customer Name',
      orderNamePlaceholder: 'Enter customer name / table (Required)...',
      saveDraftBtn: 'Save to Draft',
      noDrafts: 'No draft orders yet.',
      openAndPay: 'Pay Now',
      openAndEdit: 'Open Cart',

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
      resetDemoBtn: 'Reset & Reload DIALOG COFFEE Sample Data',

      // Owner Menu & Dashboard
      ownerTab: 'Owner',
      ownerPortalTitle: 'Owner Cashflow Control Portal',
      ownerPortalDesc: 'Detailed monitoring of income and expenses per day, month, and year.',
      ownerDailyTab: 'Daily Cashflow',
      ownerMonthlyTab: 'Monthly Cashflow',
      ownerYearlyTab: 'Yearly Cashflow',
      ownerLoginModalTitle: 'Owner Private Login',
      ownerPinLabel: 'Owner Security PIN',
      ownerPinPlaceholder: 'Enter owner PIN...',
      ownerPinSubmit: 'Enter Owner Area',
      ownerLogoutBtn: 'Lock / Logout Session',

      // Table Headers
      thDateId: 'Date & ID',
      thTimeId: 'Time & ID',
      thType: 'Type',
      thCategoryShift: 'Category & Shift',
      thDescription: 'Description / Details',
      thDescriptionMenu: 'Item Details & Menu',
      thMethod: 'Method',
      thAmount: 'Amount',
      thAction: 'Action',
      thDetail: 'Detail',

      // Auth & Role Modal
      authModalTitle: 'DIALOG COFFEE Account Login',
      appSubTitle: 'POS & Ledger System',
      selectRolePrompt: 'Select your account role to proceed:',
      fullAccessBadge: 'Full Access',
      ownerCardDesc: 'Settings & Cash Flow',
      dailyCashierBadge: 'Daily Cashier',
      baristaCardDesc: 'POS Cashier & Orders',
      enterOwnerPin: '👑 Enter Owner PIN:',
      enterBaristaPin: '☕ Enter Barista PIN:',
      loginAsOwner: 'Log In as Owner',
      loginAsBarista: 'Log In as Barista',
      ownerAccountLogin: 'Owner Account Login',
      baristaAccountLogin: 'Barista Account Login',
      pinIncorrect: 'PIN incorrect!',
      checking: 'Checking...',

      // Settings Extra
      instagramLabel: '📸 Cafe Instagram Account',
      gatewayPhoneLabel: '📡 WhatsApp Gateway Number (Sender)',
      gatewayPhoneHint: 'Sender gateway number (+628982151560) used to send closing summaries',
      ownerPhoneHint: "Owner's WhatsApp number (+62 85334101996) receiving cashier closing summaries",
      ownerPinSettingLabel: '🔐 Owner Security PIN (Settings & Owner Access)',
      ownerPinHint: 'Secret owner PIN to open Settings Tab & Owner Dashboard',
      baristaPinLabel: '☕ Barista Login PIN',
      baristaPinHint: 'PIN for Barista cashier login',
      printerSettingsTitle: 'Printer & Thermal Receipt',
      printerSettingsDesc: 'Cashier receipt printing settings. Compatible with 80mm/58mm POS thermal printers (Bluetooth, USB, WiFi, Network) and PDF receipt saving option.',
      testPrintBtn: 'Test Print',
      testPdfBtn: 'Test Save PDF',
      cloudDbTitle: 'Cloud Real-Time Database (Google Firebase)',
      cloudDbDesc: 'Automatic real-time cloud database connection to secure closing summaries and cashier transactions to Google Firebase.',
      testDbBtn: 'Test DB Connection',
      syncAllDbBtn: 'Sync All Records',
      clearTrxHistoryBtn: 'Clear All Transaction History (Fresh Start)',
      resetSettingsDefaultBtn: 'Reset Menu & Default Settings',

      // Menu Management (Owner)
      menuManagementTitle: 'Manage & Edit Cafe Menu (Owner Only)',
      menuManagementDesc: 'Update name, unit price, or category across all active DIALOG COFFEE menu items.',
      searchMenuPlaceholder: '🔍 Search menu...',
      addMenuBtn: 'Add Menu',
      resetDefaultBtn: 'Reset Default',
      editMenuTitle: 'Edit Cafe Menu',
      addMenuTitle: 'Add New Menu Item',
      addToMenuBtn: 'Add to Menu',
      menuNameLabel: '☕ Item Name:',
      menuNamePlaceholder: 'e.g., DIALOG COFFEE, AMERICANO...',
      menuPriceLabel: '💵 Unit Price (Rp):',
      menuCategoryLabel: '🏷️ Category:',
      menuBadgeLabel: '⭐ Badge / Label (Optional):',
      menuBadgePlaceholder: 'e.g., Favorite, Best Seller, Top Pick...',
      menuDescLabel: '📝 Short Description:',
      menuDescPlaceholder: 'Flavor notes or ingredients...',
      deleteMenuBtn: 'Delete Item',
      saveChangesBtn: 'Save Changes',
      menuNotFound: 'No menu item found',
      menuNotFoundSub: 'Try a different search keyword or category filter.',
      catCustom: '✨ Custom / Others',

      // Custom Menu POS Modal
      customMenuTitle: 'Add Custom Menu Item',
      customMenuDesc: 'Enter custom item or special order outside standard menu:',
      customItemNameLabel: '📝 Custom Item Name:',
      customItemNamePlaceholder: 'e.g., Extra Espresso Shot, Snack, etc...',
      customItemPriceLabel: '💵 Unit Price (Rp):',
      customItemQtyLabel: '🔢 Quantity (Qty):',
      customItemCategoryLabel: '🏷️ Menu Category:',
      customItemSavePermanentLabel: 'Save to permanent menu list (reusable later)',
      addToCartBtn: 'Add to Order',

      // Exit Modal
      exitModalTitle: 'Exit Application',
      exitModalHeading: 'Exit Cashier App?',
      exitModalDesc: 'Are you sure you want to exit DIALOG COFFEE? All cashier data and shift records remain safely stored.',
      exitConfirmBtn: 'Exit',

      // Additional UI keys
      switchAccountBtn: '⇅ Switch Account',
      closeThisShiftBtn: 'Close This Shift',
      selectShiftToClose: 'Select Shift to Close:',
      totalTodayTab: '📊 Today Total',
      incomeThisShift: 'This Shift Income:',
      expenseThisShift: 'This Shift Expense:',
      netProfitThisShift: 'This Shift Net Profit:',
      physicalCashInDrawer: 'Physical Cash in Drawer:',
      trxCountLabel: 'Transaction Count:',
      closeOrCancel: 'Close / Cancel',
      activeDraftBadge: 'Active Draft',
      saveBtn: 'Save',
      txVolume: 'Transaction Volume',
      downloadWordDocBtn: 'Download Word Document (.docx)',
      downloadPdfDocBtn: 'Download PDF Document (.pdf)',
      downloadCsvBtn: 'Download CSV / Excel File (.csv)',
      incomeCashBtn: '▲ Cash Income',
      expenseCashBtn: '▼ Cash Expense',
      trxCategoryLabel: 'Transaction Category',
      trxAmountLabel: 'Transaction Amount (Rp)',
      trxDateTimeLabel: 'Transaction Date & Time',
      trxDescLabel: 'Transaction Details / Description',
      trxPicLabel: 'Person in Charge / Barista',
      trxRefLabel: 'Reference / Invoice No. (Optional)'
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
      const isMobile = window.innerWidth <= 767;
      langBtn.innerHTML = isMobile ? lang.toUpperCase() : (lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN');
      langBtn.title = lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia';
    }

    // Refresh dynamic modules if initialized
    if (window.POSModule && typeof POSModule.renderCategories === 'function') {
      POSModule.renderCategories();
    }
    if (window.POSModule && typeof POSModule.renderCart === 'function') {
      POSModule.renderCart();
    }
    if (window.FinanceModule && typeof FinanceModule.renderCategoryOptions === 'function') {
      FinanceModule.renderCategoryOptions();
    }
    if (window.FinanceModule && typeof FinanceModule.renderTable === 'function') {
      FinanceModule.renderTable();
    }
    if (window.App && typeof App.renderSettingsMenuList === 'function') {
      App.renderSettingsMenuList();
    }
    if (window.AuthModule && typeof AuthModule.selectRole === 'function') {
      AuthModule.selectRole(AuthModule.selectedRole || 'barista');
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

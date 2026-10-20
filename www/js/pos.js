/**
 * DIALOG COFFEE Cashier - Point of Sale (POS) Module
 * Updated for exact menu categories (Non-Coffee, Signature Drinks, Coffee & Flavor),
 * WhatsApp owner notification on checkout, and bilingual translations.
 */

const POSModule = {
  activeCategory: 'all',
  searchQuery: '',
  cart: [],
  lastCheckoutTransaction: null,

  init() {
    this.renderCategories();
    this.renderMenu();
    this.renderCart();
    this.bindEvents();
  },

  bindEvents() {
    const searchInput = document.getElementById('posSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderMenu();
      });
    }

    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        if (this.cart.length === 0) return;
        if (confirm(I18N.t('clearCart') + '?')) {
          this.clearCart();
          App.showToast(I18N.currentLang === 'id' ? 'Keranjang dikosongkan' : 'Cart emptied', 'info');
        }
      });
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        this.openPaymentModal();
      });
    }
  },

  renderCategories() {
    const container = document.getElementById('posCategories');
    if (!container) return;

    const isId = I18N.currentLang === 'id';
    const categories = [
      { id: 'all', label: isId ? '☕ Semua Menu' : '☕ All Items' },
      { id: 'non-coffee', label: '🍵 Non-Coffee' },
      { id: 'signature', label: '⭐ Signature Drinks' },
      { id: 'coffee-flavor', label: '☕ Coffee & Flavor' }
    ];

    container.innerHTML = categories.map(cat => `
      <button class="category-chip ${this.activeCategory === cat.id ? 'active' : ''}" 
              onclick="POSModule.setCategory('${cat.id}')">
        ${cat.label}
      </button>
    `).join('');
  },

  setCategory(catId) {
    this.activeCategory = catId;
    this.renderCategories();
    this.renderMenu();
    App.playBeep(440, 0.04);
  },

  renderMenu() {
    const container = document.getElementById('posMenuGrid');
    if (!container) return;

    const allMenu = StorageManager.getMenu();
    const filtered = allMenu.filter(item => {
      const matchCat = this.activeCategory === 'all' || item.category === this.activeCategory;
      const matchSearch = !this.searchQuery || 
        item.name.toLowerCase().includes(this.searchQuery) ||
        (item.desc && item.desc.toLowerCase().includes(this.searchQuery));
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
          <p>${I18N.currentLang === 'id' ? 'Menu tidak ditemukan.' : 'No menu items found.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => `
      <div class="menu-card" onclick="POSModule.addToCart('${item.id}')">
        <div class="menu-card-bg" style="background-image: url('${item.image || 'assets/menu/dialog_coffee.jpg'}');"></div>
        <div class="card-top">
          <div class="item-icon-box">${item.icon || '☕'}</div>
          ${item.badge ? `<span class="badge-tag">${item.badge}</span>` : ''}
        </div>
        <div class="item-title">${item.name}</div>
        <div class="item-desc">${item.desc || ''}</div>
        <div class="card-bottom">
          <div class="item-price">${App.formatRupiah(item.price)}</div>
          <div class="add-btn">+</div>
        </div>
      </div>
    `).join('');
  },

  addToCart(itemId) {
    const menu = StorageManager.getMenu();
    const item = menu.find(m => m.id === itemId);
    if (!item) return;

    const existing = this.cart.find(c => c.id === itemId);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: 1
      });
    }

    App.playBeep(660, 0.05);
    this.renderCart();
  },

  updateQty(itemId, delta) {
    const item = this.cart.find(c => c.id === itemId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      this.cart = this.cart.filter(c => c.id !== itemId);
    }
    App.playBeep(520, 0.03);
    this.renderCart();
  },

  clearCart() {
    this.cart = [];
    this.renderCart();
  },

  calculateTotals() {
    const subtotal = this.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const settings = StorageManager.getSettings();
    const taxRate = settings.taxEnabled ? (settings.taxRate || 0) : 0;
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxRate, taxAmount, total };
  },

  renderCart() {
    const listContainer = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('cartSubtotal');
    const taxRateLabelEl = document.getElementById('cartTaxRateLabel');
    const taxAmountEl = document.getElementById('cartTaxAmount');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const mobileCartBar = document.getElementById('mobileCartBar');
    const mcbCount = document.getElementById('mcbCount');
    const mcbTotal = document.getElementById('mcbTotal');

    if (!listContainer) return;

    if (this.cart.length === 0) {
      listContainer.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">☕</div>
          <p style="font-weight: 700;">${I18N.t('emptyCartText')}</p>
          <span style="font-size: 0.75rem;">${I18N.t('emptyCartSub')}</span>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = 'Rp 0';
      if (taxAmountEl) taxAmountEl.textContent = 'Rp 0';
      if (totalEl) totalEl.textContent = 'Rp 0';
      if (checkoutBtn) checkoutBtn.disabled = true;
      if (mobileCartBar) mobileCartBar.classList.remove('visible');
      return;
    }

    listContainer.innerHTML = this.cart.map(item => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-unit-price">${App.formatRupiah(item.price)}</div>
        </div>
        <div class="cart-item-actions">
          <button class="qty-btn" onclick="POSModule.updateQty('${item.id}', -1)">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="POSModule.updateQty('${item.id}', 1)">+</button>
        </div>
        <div class="cart-item-subtotal">${App.formatRupiah(item.price * item.qty)}</div>
      </div>
    `).join('');

    const { subtotal, taxRate, taxAmount, total } = this.calculateTotals();
    if (subtotalEl) subtotalEl.textContent = App.formatRupiah(subtotal);
    if (taxRateLabelEl) taxRateLabelEl.textContent = `Pajak PB1 (${taxRate}%):`;
    if (taxAmountEl) taxAmountEl.textContent = App.formatRupiah(taxAmount);
    if (totalEl) totalEl.textContent = App.formatRupiah(total);
    if (checkoutBtn) checkoutBtn.disabled = false;

    // Update Mobile Quick Cart Bar
    if (mobileCartBar) {
      const totalCount = this.cart.reduce((s, i) => s + i.qty, 0);
      if (mcbCount) mcbCount.textContent = `${totalCount} item`;
      if (mcbTotal) mcbTotal.textContent = App.formatRupiah(total);
      mobileCartBar.classList.add('visible');
    }
  },

  // PAYMENT MODAL
  openPaymentModal() {
    if (this.cart.length === 0) return;
    const { total } = this.calculateTotals();

    const totalDisplay = document.getElementById('payModalTotal');
    if (totalDisplay) totalDisplay.textContent = App.formatRupiah(total);

    const cashInput = document.getElementById('payCashInput');
    if (cashInput) cashInput.value = total;

    this.updatePaymentChange();

    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.add('active');
  },

  closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.remove('active');
  },

  setQuickCash(amount) {
    const { total } = this.calculateTotals();
    const cashInput = document.getElementById('payCashInput');
    if (!cashInput) return;

    if (amount === 'exact') {
      cashInput.value = total;
    } else {
      cashInput.value = amount;
    }
    this.updatePaymentChange();
    App.playBeep(520, 0.03);
  },

  updatePaymentChange() {
    const { total } = this.calculateTotals();
    const cashInput = document.getElementById('payCashInput');
    const changeDisplay = document.getElementById('payModalChange');
    const methodSelect = document.getElementById('payMethodSelect');

    const cashTendered = Number(cashInput ? cashInput.value : 0);
    const method = methodSelect ? methodSelect.value : 'Tunai';

    let change = (method === 'Tunai') ? (cashTendered - total) : 0;

    if (changeDisplay) {
      if (change < 0) {
        changeDisplay.textContent = `Kurang ${App.formatRupiah(Math.abs(change))}`;
        changeDisplay.style.color = 'var(--expense-red)';
      } else {
        changeDisplay.textContent = App.formatRupiah(change);
        changeDisplay.style.color = 'var(--income-green)';
      }
    }
  },

  processCheckout(sendWhatsApp = false) {
    const { subtotal, taxAmount, total } = this.calculateTotals();
    const cashInput = document.getElementById('payCashInput');
    const methodSelect = document.getElementById('payMethodSelect');
    const notesInput = document.getElementById('payNotesInput');

    const method = methodSelect ? methodSelect.value : 'Tunai';
    const cashTendered = Number(cashInput ? cashInput.value : 0);

    if (method === 'Tunai' && cashTendered < total) {
      alert(`Nominal pembayaran tunai kurang Rp ${(total - cashTendered).toLocaleString('id-ID')}`);
      return;
    }

    const settings = StorageManager.getSettings();
    const now = new Date();
    const invoiceId = 'POS-' + now.getFullYear().toString().slice(-2) + 
      String(now.getMonth() + 1).padStart(2, '0') + 
      String(now.getDate()).padStart(2, '0') + '-' + 
      Math.floor(1000 + Math.random() * 9000);

    const itemsSummary = this.cart.map(c => ({
      name: c.name,
      qty: c.qty,
      price: c.price,
      subtotal: c.qty * c.price
    }));

    const description = `Penjualan Kasir (${this.cart.map(i => `${i.name} x${i.qty}`).join(', ')})`;

    const newTransaction = {
      id: invoiceId,
      date: now.toISOString(),
      type: 'income',
      category: 'Penjualan Kasir',
      amount: total,
      subtotal: subtotal,
      tax: taxAmount,
      cashTendered: method === 'Tunai' ? cashTendered : total,
      change: method === 'Tunai' ? (cashTendered - total) : 0,
      paymentMethod: method,
      shift: settings.activeShift || 'Shift 1',
      baristas: `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'}`,
      cashier: settings.activeCashier,
      description: notesInput && notesInput.value ? `${description} - ${notesInput.value}` : description,
      refNo: invoiceId,
      items: itemsSummary
    };

    StorageManager.addTransaction(newTransaction);
    this.lastCheckoutTransaction = newTransaction;

    App.playChime();
    this.closePaymentModal();
    this.clearCart();

    // Tampilkan Struk
    this.showReceiptModal(newTransaction);

    // Kirim notifikasi WA ke owner jika diminta
    if (sendWhatsApp && window.WhatsAppNotifier) {
      WhatsAppNotifier.notifyIncome(newTransaction);
    }

    // Refresh data Buku Kas & Laporan
    if (window.FinanceModule) window.FinanceModule.renderAll();
    if (window.ReportsModule) window.ReportsModule.renderAll();

    App.showToast(`Transaksi ${invoiceId} berhasil dicatat!`, 'success');
  },

  // RECEIPT MODAL
  showReceiptModal(trx) {
    const modal = document.getElementById('receiptModal');
    const receiptContainer = document.getElementById('receiptContent');
    if (!modal || !receiptContainer) return;

    if (trx) {
      this.lastCheckoutTransaction = trx;
    } else {
      trx = this.lastCheckoutTransaction;
    }
    if (!trx) return;

    const settings = StorageManager.getSettings();

    let itemsHtml = '';
    if (trx.items && trx.items.length > 0) {
      itemsHtml = trx.items.map(it => `
        <div class="receipt-item-line">
          <div style="font-weight: 800;">${it.name}</div>
          <div style="display: flex; justify-content: space-between;">
            <span>${it.qty} x ${App.formatRupiah(it.price)}</span>
            <span style="font-weight: 700;">${App.formatRupiah(it.subtotal || it.qty * it.price)}</span>
          </div>
        </div>
      `).join('');
    } else {
      itemsHtml = `
        <div class="receipt-item-line">
          <div>${trx.description || trx.category}</div>
          <div style="text-align: right; font-weight: 800;">${App.formatRupiah(trx.amount)}</div>
        </div>
      `;
    }

    receiptContainer.innerHTML = `
      <div class="receipt-paper">
        <div class="receipt-header-center">
          <img src="assets/dialog_logo.jpg" alt="Logo" style="width: 48px; height: 48px; object-fit: contain; margin-bottom: 4px; border-radius: 4px;">
          <h4>${settings.cafeName}</h4>
          <div style="font-size: 10px; color: #333;">${settings.tagline}</div>
          <div style="font-size: 9px; color: #555; margin-top: 2px;">${settings.address}</div>
          <div style="font-size: 9px; color: #555;">WA Owner: ${settings.ownerPhone || '085334101996'}</div>
        </div>

        <div class="receipt-divider"></div>

        <div class="receipt-row"><span>No. Nota:</span><span style="font-weight: 800;">${trx.id}</span></div>
        <div class="receipt-row"><span>Waktu   :</span><span>${App.formatDateTime(trx.date)}</span></div>
        <div class="receipt-row"><span>Shift   :</span><span>${trx.shift || settings.activeShift || 'Shift 1'}</span></div>
        <div class="receipt-row"><span>Barista :</span><span>${trx.baristas || `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'}`}</span></div>
        <div class="receipt-row"><span>Metode  :</span><span>${trx.paymentMethod || 'Tunai'}</span></div>

        <div class="receipt-divider"></div>

        <div>${itemsHtml}</div>

        <div class="receipt-divider"></div>

        ${trx.subtotal ? `<div class="receipt-row"><span>Subtotal:</span><span>${App.formatRupiah(trx.subtotal)}</span></div>` : ''}
        ${trx.tax ? `<div class="receipt-row"><span>Pajak (PB1 10%):</span><span>${App.formatRupiah(trx.tax)}</span></div>` : ''}

        <div class="receipt-row" style="font-size: 13px; font-weight: 900; margin-top: 4px;">
          <span>TOTAL:</span>
          <span>${App.formatRupiah(trx.amount)}</span>
        </div>

        ${trx.cashTendered ? `
          <div class="receipt-row"><span>Bayar (Tunai):</span><span>${App.formatRupiah(trx.cashTendered)}</span></div>
          <div class="receipt-row"><span>Kembalian:</span><span>${App.formatRupiah(trx.change || 0)}</span></div>
        ` : ''}

        <div class="receipt-divider"></div>

        <div class="receipt-footer-text">
          ${(settings.receiptFooter || 'Terima Kasih Atas Kunjungan Anda\nFollow IG: @dialogcoffee').replace(/\n/g, '<br>')}
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.classList.remove('active');
  },

  printReceipt() {
    if (!this.lastCheckoutTransaction) {
      App.showToast('Tidak ada data transaksi untuk dicetak', 'warning');
      return;
    }

    try {
      App.showToast('Membuka dialog pencetakan printer...', 'info', 2500);
      window.print();

      // Panduan jika printer fisik belum terhubung
      setTimeout(() => {
        App.showToast('💡 Belum ada printer terhubung? Klik tombol "Simpan PDF" untuk menyimpan struk digital.', 'info', 5000);
      }, 1500);
    } catch (err) {
      console.warn('Gagal memicu pencetakan:', err);
      App.showToast('Printer fisik tidak terdeteksi. Mengalihkan ke unduhan PDF...', 'warning', 3500);
      this.downloadReceiptPDF();
    }
  },

  downloadReceiptPDF() {
    if (!this.lastCheckoutTransaction) {
      App.showToast('Tidak ada data transaksi untuk disimpan', 'warning');
      return;
    }
    PDFExporter.exportReceiptPDF(this.lastCheckoutTransaction);
    App.playBeep(880, 0.08);
  },

  sendCurrentReceiptWA() {
    if (!this.lastCheckoutTransaction) return;
    WhatsAppNotifier.notifyIncome(this.lastCheckoutTransaction);
  }
};

window.POSModule = POSModule;

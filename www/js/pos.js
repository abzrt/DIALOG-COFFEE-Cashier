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
  isCartInView: false,
  activeSavedOrderId: null,
  currentOrderName: '',

  init() {
    this.renderCategories();
    this.renderMenu();
    this.renderCart();
    this.bindEvents();
    this.initCartObserver();
    this.updateSavedOrdersBadge();
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

    // Checkout button is handled via onclick="POSModule.proceedToPaymentWithDraft()"
  },

  initCartObserver() {
    const cartPanel = document.querySelector('.pos-cart-panel');
    const mobileCartBar = document.getElementById('mobileCartBar');
    if (!cartPanel || !mobileCartBar) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isCartInView = entry.isIntersecting;
          if (entry.isIntersecting) {
            mobileCartBar.classList.remove('visible');
          } else if (this.cart.length > 0) {
            mobileCartBar.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });
      observer.observe(cartPanel);
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
      { id: 'coffee-flavor', label: '☕ Coffee & Flavor' },
      { id: 'custom', label: '✨ Custom Menu' }
    ];

    container.innerHTML = categories.map(cat => `
      <button class="category-chip ${this.activeCategory === cat.id ? 'active' : ''}" 
              onclick="POSModule.setCategory('${cat.id}')">
        ${cat.label}
      </button>
    `).join('') + `
      <button type="button" class="category-chip custom-menu-action-chip" 
              onclick="POSModule.openCustomMenuModal()" 
              style="border: 1.5px dashed var(--border-color); font-weight: 700; background: var(--bg-surface); display: inline-flex; align-items: center; gap: 4px;" title="Tambah Item / Menu Custom">
        <span>➕</span> ${isId ? 'Input Custom' : 'Custom Item'}
      </button>
    `;
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

    const customCardHtml = `
      <div class="menu-card custom-menu-card" onclick="POSModule.openCustomMenuModal()" style="border: 2px dashed var(--border-color); cursor: pointer; background: var(--card-bg, #ffffff);">
        <div class="card-top">
          <div class="item-icon-box" style="background: var(--text-primary); color: var(--bg-surface);">✨</div>
          <span class="badge-tag" style="background: var(--text-primary); color: var(--bg-surface);">Kustom</span>
        </div>
        <div class="item-title">+ Custom Menu</div>
        <div class="item-desc">Input pesanan kustom / menu khusus secara manual</div>
        <div class="card-bottom">
          <div class="item-price" style="font-size: 0.8rem; color: var(--text-muted);">Bebas Harga</div>
          <div class="add-btn">+</div>
        </div>
      </div>
    `;

    if (filtered.length === 0) {
      container.innerHTML = customCardHtml + `
        <div style="grid-column: 2 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
          <p>${I18N.currentLang === 'id' ? 'Menu tidak ditemukan.' : 'No menu items found.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = customCardHtml + filtered.map(item => `
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
    this.activeSavedOrderId = null;
    this.currentOrderName = '';
    const nameInput = document.getElementById('cartOrderName');
    if (nameInput) {
      nameInput.value = '';
      nameInput.classList.remove('highlight-error');
    }
    const badge = document.getElementById('activeDraftBadge');
    if (badge) {
      badge.style.display = 'none';
      badge.textContent = 'Draft Aktif';
    }
    const seatInput = document.getElementById('paySeatInput');
    const custInput = document.getElementById('payCustomerInput');
    const notesInput = document.getElementById('payNotesInput');
    if (seatInput) seatInput.value = '';
    if (custInput) custInput.value = '';
    if (notesInput) notesInput.value = '';
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
    const holdCartQuickBtn = document.getElementById('holdCartQuickBtn');
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
      if (holdCartQuickBtn) holdCartQuickBtn.disabled = true;
      if (mobileCartBar) mobileCartBar.classList.remove('visible');
      this.updateSavedOrdersBadge();
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
    if (holdCartQuickBtn) holdCartQuickBtn.disabled = false;

    // Update Mobile Quick Cart Bar
    if (mobileCartBar) {
      const totalCount = this.cart.reduce((s, i) => s + i.qty, 0);
      if (mcbCount) mcbCount.textContent = `${totalCount} item`;
      if (mcbTotal) mcbTotal.textContent = App.formatRupiah(total);
      if (!this.isCartInView) {
        mobileCartBar.classList.add('visible');
      }
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
    const seatInput = document.getElementById('paySeatInput');
    const customerInput = document.getElementById('payCustomerInput');

    const method = methodSelect ? methodSelect.value : 'Tunai';
    const cashTendered = Number(cashInput ? cashInput.value : 0);
    const seatNumber = seatInput ? seatInput.value.trim() : '';
    const customerName = (customerInput ? customerInput.value.trim() : '') || this.currentOrderName || '';

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

    let labelInfo = [];
    if (seatNumber) labelInfo.push(`Seat: ${seatNumber}`);
    if (customerName) labelInfo.push(`Pelanggan: ${customerName}`);
    const metaPrefix = labelInfo.length > 0 ? `[${labelInfo.join(' | ')}] ` : '';

    let description = `${metaPrefix}Penjualan Kasir (${this.cart.map(i => `${i.name} x${i.qty}`).join(', ')})`;
    if (notesInput && notesInput.value) {
      description += ` - ${notesInput.value}`;
    }

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
      seatNumber: seatNumber,
      customerName: customerName,
      description: description,
      refNo: invoiceId,
      items: itemsSummary
    };

    StorageManager.addTransaction(newTransaction);
    this.lastCheckoutTransaction = newTransaction;

    // Hapus dari daftar order tersimpan jika checkout berasal dari open bill
    if (this.activeSavedOrderId) {
      StorageManager.removeSavedOrder(this.activeSavedOrderId);
      this.activeSavedOrderId = null;
      this.updateSavedOrdersBadge();
    }

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
        ${trx.seatNumber ? `<div class="receipt-row"><span>Seat/Meja:</span><span style="font-weight: 800;">${trx.seatNumber}</span></div>` : ''}
        ${trx.customerName ? `<div class="receipt-row"><span>Pelanggan:</span><span style="font-weight: 800;">${trx.customerName}</span></div>` : ''}
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
  },

  // =========================================================================
  // HOLD / SAVED ORDERS (OPEN BILLS BERDASARKAN NOMOR SEAT & NAMA PELANGGAN)
  // =========================================================================
  openHoldOrderModal() {
    if (this.cart.length === 0) {
      App.showToast('Keranjang masih kosong', 'info');
      return;
    }
    const { total } = this.calculateTotals();
    const count = this.cart.reduce((s, i) => s + i.qty, 0);

    const countEl = document.getElementById('holdModalItemCount');
    const totalEl = document.getElementById('holdModalTotal');
    if (countEl) countEl.textContent = `${count} item`;
    if (totalEl) totalEl.textContent = App.formatRupiah(total);

    const paySeat = document.getElementById('paySeatInput');
    const payCust = document.getElementById('payCustomerInput');
    const holdSeat = document.getElementById('holdSeatInput');
    const holdCust = document.getElementById('holdCustomerInput');
    if (holdSeat && paySeat) holdSeat.value = paySeat.value;
    if (holdCust && payCust) holdCust.value = payCust.value;

    const modal = document.getElementById('holdOrderModal');
    if (modal) modal.classList.add('active');
  },

  closeHoldOrderModal() {
    const modal = document.getElementById('holdOrderModal');
    if (modal) modal.classList.remove('active');
  },

  confirmSaveHoldOrder() {
    if (this.cart.length === 0) return;
    const seatInput = document.getElementById('holdSeatInput');
    const custInput = document.getElementById('holdCustomerInput');
    const notesInput = document.getElementById('holdNotesInput');

    const seat = seatInput ? seatInput.value.trim() : '';
    const customer = custInput ? custInput.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!seat && !customer) {
      alert('Mohon isi Nomor Seat/Meja atau Nama Pelanggan agar pesanan mudah dikenali.');
      if (seatInput) seatInput.focus();
      return;
    }

    const { subtotal, taxAmount, total } = this.calculateTotals();
    const order = {
      id: this.activeSavedOrderId || ('ORD-' + Date.now().toString().slice(-6)),
      date: new Date().toISOString(),
      seatNumber: seat,
      customerName: customer,
      notes: notes,
      items: JSON.parse(JSON.stringify(this.cart)),
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: total
    };

    StorageManager.addSavedOrder(order);
    this.activeSavedOrderId = null;
    this.cart = [];
    this.renderCart();
    this.closeHoldOrderModal();
    this.updateSavedOrdersBadge();

    if (seatInput) seatInput.value = '';
    if (custInput) custInput.value = '';
    if (notesInput) notesInput.value = '';

    const label = [seat ? `Seat ${seat}` : '', customer].filter(Boolean).join(' - ');
    App.showToast(`Pesanan (${label}) berhasil disimpan!`, 'success');
  },

  saveCurrentOrderPending() {
    if (this.cart.length === 0) return;
    const seatInput = document.getElementById('paySeatInput');
    const custInput = document.getElementById('payCustomerInput');
    const notesInput = document.getElementById('payNotesInput');

    const seat = seatInput ? seatInput.value.trim() : '';
    const customer = custInput ? custInput.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!seat && !customer) {
      alert('Mohon isi Nomor Seat/Meja atau Nama Pelanggan terlebih dahulu untuk menyimpan order.');
      if (seatInput) seatInput.focus();
      return;
    }

    const { subtotal, taxAmount, total } = this.calculateTotals();
    const order = {
      id: this.activeSavedOrderId || ('ORD-' + Date.now().toString().slice(-6)),
      date: new Date().toISOString(),
      seatNumber: seat,
      customerName: customer,
      notes: notes,
      items: JSON.parse(JSON.stringify(this.cart)),
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: total
    };

    StorageManager.addSavedOrder(order);
    this.activeSavedOrderId = null;
    this.cart = [];
    this.renderCart();
    this.closePaymentModal();
    this.updateSavedOrdersBadge();

    if (seatInput) seatInput.value = '';
    if (custInput) custInput.value = '';
    if (notesInput) notesInput.value = '';

    const label = [seat ? `Seat ${seat}` : '', customer].filter(Boolean).join(' - ');
    App.showToast(`Order (${label}) berhasil disimpan! Siap dibayar nanti.`, 'success');
  },

  // FITUR DRAFT ORDER DENGAN NAMA PEMESAN
  onOrderNameInput(val) {
    this.currentOrderName = (val || '').trim();
    const input = document.getElementById('cartOrderName');
    if (input) input.classList.remove('highlight-error');
  },

  saveCurrentCartToDraft() {
    if (this.cart.length === 0) {
      App.showToast(I18N.currentLang === 'id' ? 'Keranjang masih kosong' : 'Cart is empty', 'info');
      return;
    }

    const nameInput = document.getElementById('cartOrderName');
    const orderName = (nameInput ? nameInput.value.trim() : '') || this.currentOrderName;

    if (!orderName) {
      if (nameInput) {
        nameInput.classList.add('highlight-error');
        nameInput.focus();
        App.scrollToCart();
      }
      alert('Mohon masukkan Nama Orderan / Pemesan terlebih dahulu untuk menyimpan ke draft.');
      return;
    }

    const { subtotal, taxAmount, total } = this.calculateTotals();
    const draftId = this.activeSavedOrderId || ('DFT-' + Date.now().toString().slice(-6));

    const draftOrder = {
      id: draftId,
      date: new Date().toISOString(),
      customerName: orderName,
      seatNumber: '',
      notes: '',
      items: JSON.parse(JSON.stringify(this.cart)),
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: total
    };

    StorageManager.addSavedOrder(draftOrder);
    this.activeSavedOrderId = null;
    this.currentOrderName = '';
    if (nameInput) nameInput.value = '';

    const badge = document.getElementById('activeDraftBadge');
    if (badge) badge.style.display = 'none';

    this.cart = [];
    this.renderCart();
    this.updateSavedOrdersBadge();

    App.showToast(`Draft orderan "${orderName}" berhasil disimpan!`, 'success');
  },

  proceedToPaymentWithDraft() {
    if (this.cart.length === 0) {
      App.showToast(I18N.currentLang === 'id' ? 'Keranjang masih kosong' : 'Cart is empty', 'info');
      return;
    }

    const nameInput = document.getElementById('cartOrderName');
    const orderName = (nameInput ? nameInput.value.trim() : '') || this.currentOrderName;

    if (!orderName) {
      if (nameInput) {
        nameInput.classList.add('highlight-error');
        nameInput.focus();
        App.scrollToCart();
      }
      alert('Mohon masukkan Nama Orderan / Pemesan terlebih dahulu sebelum pembayaran.');
      return;
    }

    // Semua orderan otomatis terdraft dulu sesuai nama yang memesan sebelum di bayar
    const { subtotal, taxAmount, total } = this.calculateTotals();
    const draftId = this.activeSavedOrderId || ('DFT-' + Date.now().toString().slice(-6));

    const draftOrder = {
      id: draftId,
      date: new Date().toISOString(),
      customerName: orderName,
      seatNumber: '',
      notes: '',
      items: JSON.parse(JSON.stringify(this.cart)),
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: total
    };

    StorageManager.addSavedOrder(draftOrder);
    this.activeSavedOrderId = draftId;
    this.currentOrderName = orderName;
    this.updateSavedOrdersBadge();

    const badge = document.getElementById('activeDraftBadge');
    if (badge) {
      badge.style.display = 'inline-block';
      badge.textContent = `Draft: ${orderName}`;
    }

    // Sinkronkan nama ke modal pembayaran
    const custInput = document.getElementById('payCustomerInput');
    if (custInput) custInput.value = orderName;

    this.openPaymentModal();
  },

  openSavedOrdersModal() {
    this.renderSavedOrdersList();
    const modal = document.getElementById('savedOrdersModal');
    if (modal) modal.classList.add('active');
  },

  closeSavedOrdersModal() {
    const modal = document.getElementById('savedOrdersModal');
    if (modal) modal.classList.remove('active');
  },

  renderSavedOrdersList() {
    const container = document.getElementById('savedOrdersList');
    if (!container) return;

    const orders = StorageManager.getSavedOrders();
    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📋</div>
          <p style="font-weight: 700;">${I18N.t('noDrafts') || 'Belum ada draft orderan'}</p>
          <span style="font-size: 0.78rem;">Orderan yang disimpan atau diproses dengan nama pemesan akan terdraft di sini.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(ord => {
      const itemsSummary = (ord.items || []).map(i => `${i.name} (x${i.qty})`).join(', ');
      const title = ord.customerName ? `👤 ${ord.customerName}` : (ord.seatNumber ? `🪑 ${ord.seatNumber}` : 'Draft Tanpa Nama');
      const seatTag = (ord.seatNumber && ord.customerName) ? ` • 🪑 ${ord.seatNumber}` : '';

      return `
        <div class="saved-order-card">
          <div class="soc-header">
            <span class="soc-tag">${title}${seatTag}</span>
            <span class="soc-time">${App.formatDateTime(ord.date)}</span>
          </div>
          <div class="soc-items">${itemsSummary}</div>
          ${ord.notes ? `<div style="font-size: 0.72rem; color: var(--text-muted);">📝 ${ord.notes}</div>` : ''}
          <div class="soc-footer">
            <div class="soc-total">${App.formatRupiah(ord.total)}</div>
            <div class="soc-actions">
              <button type="button" class="btn-primary-action btn-closing" style="padding: 6px 12px; font-size: 0.78rem;" onclick="POSModule.loadSavedOrder('${ord.id}', true)">
                💳 Bayar
              </button>
              <button type="button" class="btn-primary-action" style="padding: 6px 10px; font-size: 0.78rem; background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-color);" onclick="POSModule.loadSavedOrder('${ord.id}', false)">
                ✏️ Edit Draft
              </button>
              <button type="button" class="btn-primary-action" style="padding: 6px 8px; font-size: 0.78rem; background: transparent; color: var(--expense-red); border: 1px solid transparent;" onclick="POSModule.deleteSavedOrder('${ord.id}')" title="Hapus Draft">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  loadSavedOrder(id, openPayment = false) {
    if (this.cart.length > 0 && !confirm('Ganti pesanan aktif saat ini dengan draft ini?')) {
      return;
    }

    const orders = StorageManager.getSavedOrders();
    const ord = orders.find(o => o.id === id);
    if (!ord) return;

    this.cart = JSON.parse(JSON.stringify(ord.items || []));
    this.activeSavedOrderId = ord.id;
    this.currentOrderName = ord.customerName || ord.seatNumber || '';

    const nameInput = document.getElementById('cartOrderName');
    if (nameInput) {
      nameInput.value = this.currentOrderName;
      nameInput.classList.remove('highlight-error');
    }

    const badge = document.getElementById('activeDraftBadge');
    if (badge) {
      badge.style.display = 'inline-block';
      badge.textContent = `Draft: ${this.currentOrderName || ord.id}`;
    }

    this.renderCart();

    const seatInput = document.getElementById('paySeatInput');
    const custInput = document.getElementById('payCustomerInput');
    const notesInput = document.getElementById('payNotesInput');
    if (seatInput) seatInput.value = ord.seatNumber || '';
    if (custInput) custInput.value = ord.customerName || this.currentOrderName;
    if (notesInput) notesInput.value = ord.notes || '';

    this.closeSavedOrdersModal();

    if (openPayment) {
      this.openPaymentModal();
    } else {
      const label = [ord.seatNumber ? `Seat ${ord.seatNumber}` : '', ord.customerName].filter(Boolean).join(' - ') || ord.id;
      App.showToast(`Draft (${label}) dimuat ke keranjang!`, 'info');
      App.scrollToCart();
    }
  },

  deleteSavedOrder(id) {
    if (!confirm('Hapus draft orderan ini?')) return;
    StorageManager.removeSavedOrder(id);
    if (this.activeSavedOrderId === id) {
      this.activeSavedOrderId = null;
      const badge = document.getElementById('activeDraftBadge');
      if (badge) badge.style.display = 'none';
    }
    this.renderSavedOrdersList();
    this.updateSavedOrdersBadge();
    App.showToast('Draft orderan dihapus', 'info');
  },

  updateSavedOrdersBadge() {
    const badge = document.getElementById('savedOrdersCount');
    const btn = document.getElementById('savedOrdersBtn');
    const orders = StorageManager.getSavedOrders();
    const count = orders.length;

    if (badge) badge.textContent = count;
    if (btn) {
      if (count > 0) {
        btn.classList.add('has-items');
      } else {
        btn.classList.remove('has-items');
      }
    }
  },

  // CUSTOM MENU MODAL HANDLERS
  openCustomMenuModal() {
    const modal = document.getElementById('customMenuModal');
    if (!modal) return;
    const nameInput = document.getElementById('customItemName');
    const priceInput = document.getElementById('customItemPrice');
    const qtyInput = document.getElementById('customItemQty');
    const err = document.getElementById('customMenuError');
    const perm = document.getElementById('customItemSavePermanent');

    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '';
    if (qtyInput) qtyInput.value = '1';
    if (perm) perm.checked = false;
    if (err) { err.style.display = 'none'; err.textContent = ''; }

    modal.classList.add('active');
    setTimeout(() => { if (nameInput) nameInput.focus(); }, 150);
  },

  closeCustomMenuModal() {
    const modal = document.getElementById('customMenuModal');
    if (modal) modal.classList.remove('active');
  },

  submitCustomMenu() {
    const nameInput = document.getElementById('customItemName');
    const priceInput = document.getElementById('customItemPrice');
    const qtyInput = document.getElementById('customItemQty');
    const catInput = document.getElementById('customItemCategory');
    const permInput = document.getElementById('customItemSavePermanent');
    const err = document.getElementById('customMenuError');

    const name = (nameInput ? nameInput.value.trim() : '');
    const price = Number(priceInput ? priceInput.value : 0);
    const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : 1, 10) || 1);
    const category = catInput ? catInput.value : 'custom';
    const isPermanent = permInput ? permInput.checked : false;

    if (!name) {
      if (err) {
        err.textContent = 'Silakan masukkan nama menu / item custom!';
        err.style.display = 'block';
      }
      if (nameInput) nameInput.focus();
      return;
    }

    if (isNaN(price) || price < 0) {
      if (err) {
        err.textContent = 'Harga harus berupa angka valid (minimal Rp 0)!';
        err.style.display = 'block';
      }
      if (priceInput) priceInput.focus();
      return;
    }

    const customId = 'custom-' + Date.now();

    // Jika dipilih untuk disimpan permanen ke daftar menu
    if (isPermanent) {
      const menuList = StorageManager.getMenu();
      menuList.push({
        id: customId,
        name: name,
        category: category,
        price: price,
        desc: 'Menu Custom DIALOG COFFEE',
        badge: 'Custom',
        icon: '✨',
        image: 'assets/menu/dialog_coffee.jpg'
      });
      StorageManager.saveMenu(menuList);
      this.renderMenu();
    }

    // Masukkan langsung ke keranjang belanja
    const existing = this.cart.find(c => c.name.toLowerCase() === name.toLowerCase() && c.price === price);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({
        id: customId,
        name: name,
        price: price,
        qty: qty
      });
    }

    App.playBeep(660, 0.08);
    this.renderCart();
    this.closeCustomMenuModal();
    App.showToast(`Custom menu "${name}" (${qty}x) ditambahkan ke pesanan!`, 'success');
  }
};

window.POSModule = POSModule;

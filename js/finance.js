/**
 * DIALOG COFFEE Cashier - Finance & Bookkeeping Module
 * Manages detailed recording of income and expenses, cash flow balance, and transaction history.
 */

const FinanceModule = {
  currentFilterType: 'all',
  currentCategory: 'all',
  searchQuery: '',

  init() {
    this.bindEvents();
    this.renderAll();
  },

  bindEvents() {
    const filterType = document.getElementById('financeTypeFilter');
    if (filterType) {
      filterType.addEventListener('change', (e) => {
        this.currentFilterType = e.target.value;
        this.renderTable();
      });
    }

    const filterCat = document.getElementById('financeCategoryFilter');
    if (filterCat) {
      filterCat.addEventListener('change', (e) => {
        this.currentCategory = e.target.value;
        this.renderTable();
      });
    }

    const searchInput = document.getElementById('financeSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderTable();
      });
    }
  },

  renderAll() {
    this.renderKPIs();
    this.renderCategoryOptions();
    this.renderTable();
  },

  calculateMetrics(transactions) {
    let totalIncome = 0;
    let totalExpense = 0;
    let cashBalance = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') {
        totalIncome += amt;
        if (t.paymentMethod === 'Tunai' || !t.paymentMethod) {
          cashBalance += amt;
        }
      } else {
        totalExpense += amt;
        if (t.paymentMethod === 'Tunai' || t.paymentMethod === 'Petty Cash' || !t.paymentMethod) {
          cashBalance -= amt;
        }
      }
    });

    const netProfit = totalIncome - totalExpense;
    return { totalIncome, totalExpense, netProfit, cashBalance };
  },

  renderKPIs() {
    const all = StorageManager.getTransactions();
    const { totalIncome, totalExpense, netProfit, cashBalance } = this.calculateMetrics(all);

    const incomeEl = document.getElementById('kpiTotalIncome');
    const expenseEl = document.getElementById('kpiTotalExpense');
    const profitEl = document.getElementById('kpiNetProfit');
    const cashEl = document.getElementById('kpiCashBalance');

    if (incomeEl) incomeEl.textContent = App.formatRupiah(totalIncome);
    if (expenseEl) expenseEl.textContent = App.formatRupiah(totalExpense);
    if (profitEl) {
      profitEl.textContent = (netProfit < 0 ? '-' : '+') + App.formatRupiah(Math.abs(netProfit));
      profitEl.style.color = netProfit >= 0 ? 'var(--income-green)' : 'var(--expense-red)';
    }
    if (cashEl) cashEl.textContent = App.formatRupiah(cashBalance);
  },

  renderCategoryOptions() {
    const select = document.getElementById('financeCategoryFilter');
    if (!select) return;

    const all = StorageManager.getTransactions();
    const categories = new Set();
    all.forEach(t => { if (t.category) categories.add(t.category); });

    let opts = '<option value="all">Semua Kategori</option>';
    categories.forEach(cat => {
      opts += `<option value="${cat}">${cat}</option>`;
    });
    select.innerHTML = opts;
  },

  getFilteredTransactions() {
    const all = StorageManager.getTransactions();
    return all.filter(t => {
      // Type filter
      if (this.currentFilterType !== 'all' && t.type !== this.currentFilterType) return false;

      // Category filter
      if (this.currentCategory !== 'all' && t.category !== this.currentCategory) return false;

      // Search query
      if (this.searchQuery) {
        const query = this.searchQuery;
        const matchId = (t.id || '').toLowerCase().includes(query);
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        const matchCat = (t.category || '').toLowerCase().includes(query);
        const matchRef = (t.refNo || '').toLowerCase().includes(query);
        const matchCashier = (t.cashier || '').toLowerCase().includes(query);
        if (!matchId && !matchDesc && !matchCat && !matchRef && !matchCashier) return false;
      }

      return true;
    });
  },

  renderTable() {
    const tbody = document.getElementById('financeTableBody');
    const countEl = document.getElementById('financeRowCount');
    if (!tbody) return;

    const filtered = this.getFilteredTransactions();
    if (countEl) countEl.textContent = `${filtered.length} Transaksi Tercatat`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">📑</div>
            <p>Tidak ada transaksi yang cocok dengan kriteria pencarian/filter.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((t, idx) => {
      const isIncome = t.type === 'income';
      const itemsDetail = t.items && t.items.length > 0
        ? `<div style="font-size: 0.72rem; color: var(--accent-gold-light); margin-top: 2px;">Items: ${t.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</div>`
        : '';

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${idx + 1}</td>
          <td>
            <div style="font-weight: 600; font-size: 0.8rem; color: var(--text-primary);">${App.formatDateTime(t.date)}</div>
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">${t.id} ${t.refNo ? `• Ref: ${t.refNo}` : ''}</div>
          </td>
          <td>
            <span class="type-pill ${isIncome ? 'income' : 'expense'}">
              ${isIncome ? '▲ Masuk' : '▼ Keluar'}
            </span>
          </td>
          <td>
            <span style="font-weight: 600; font-size: 0.8rem; color: var(--text-primary);">${t.category || '-'}</span>
          </td>
          <td>
            <div style="max-width: 260px; line-height: 1.3;">
              <span style="color: var(--text-secondary);">${t.description || '-'}</span>
              ${itemsDetail}
            </div>
          </td>
          <td>
            <span style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem;">
              ${t.paymentMethod || 'Tunai'}
            </span>
          </td>
          <td style="text-align: right;">
            <span class="amount-text ${isIncome ? 'income' : 'expense'}">
              ${isIncome ? '+' : '-'}${App.formatRupiah(t.amount)}
            </span>
          </td>
          <td>
            <div class="action-row-btns">
              ${t.items && t.items.length > 0 ? `
                <button class="btn-table-action" title="Lihat Struk" onclick="POSModule.showReceiptModal(StorageManager.getTransactions().find(x => x.id === '${t.id}'))">
                  🧾
                </button>
              ` : ''}
              <button class="btn-table-action delete" title="Hapus Transaksi" onclick="FinanceModule.deleteEntry('${t.id}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  deleteEntry(id) {
    if (!confirm(`Hapus transaksi dengan ID ${id}? Tindakan ini akan memperbarui saldo dan riwayat.`)) return;

    const ok = StorageManager.deleteTransaction(id);
    if (ok) {
      App.showToast(`Transaksi ${id} telah dihapus`, 'info');
      this.renderAll();
      if (window.ReportsModule) window.ReportsModule.renderAll();
    }
  },

  // MODAL RECORD INCOME / EXPENSE
  openRecordModal(type = 'income') {
    const modal = document.getElementById('recordTransactionModal');
    if (!modal) return;

    this.setModalType(type);

    const now = new Date();
    // Format YYYY-MM-DDTHH:MM for datetime-local
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
    
    const dateInput = document.getElementById('trxModalDate');
    if (dateInput) dateInput.value = localISOTime;

    const amountInput = document.getElementById('trxModalAmount');
    if (amountInput) amountInput.value = '';

    const descInput = document.getElementById('trxModalDesc');
    if (descInput) descInput.value = '';

    const refInput = document.getElementById('trxModalRef');
    if (refInput) refInput.value = '';

    const settings = StorageManager.getSettings();
    const picInput = document.getElementById('trxModalPic');
    if (picInput) picInput.value = settings.activeCashier;

    modal.classList.add('active');
  },

  closeRecordModal() {
    const modal = document.getElementById('recordTransactionModal');
    if (modal) modal.classList.remove('active');
  },

  setModalType(type) {
    const btnIncome = document.getElementById('modalTypeIncomeBtn');
    const btnExpense = document.getElementById('modalTypeExpenseBtn');
    const categorySelect = document.getElementById('trxModalCategory');

    if (type === 'income') {
      if (btnIncome) btnIncome.classList.add('active');
      if (btnExpense) btnExpense.classList.remove('active');

      if (categorySelect) {
        categorySelect.innerHTML = `
          <option value="Penjualan Kasir">Penjualan Kasir (POS)</option>
          <option value="Modal Awal Kasir">Modal Awal Kasir (Opening Float)</option>
          <option value="Penjualan Biji Kopi">Penjualan Biji Kopi (Roasted Beans)</option>
          <option value="Katering / Event Luar">Katering / Event Luar</option>
          <option value="Merchandise / Tumbler">Merchandise / Tumbler / Alat Kopi</option>
          <option value="Pemasukan Lainnya">Pemasukan Lainnya</option>
        `;
      }
    } else {
      if (btnIncome) btnIncome.classList.remove('active');
      if (btnExpense) btnExpense.classList.add('active');

      if (categorySelect) {
        categorySelect.innerHTML = `
          <option value="Bahan Baku">Bahan Baku (Biji Kopi, Fresh Milk, Sirup, Powder)</option>
          <option value="Kemasan & Perlengkapan">Kemasan (Cup, Sedotan, Seal, Paper Bag)</option>
          <option value="Operasional">Operasional (Listrik PLN, Air, Gas, WiFi)</option>
          <option value="Gaji & Uang Makan">Gaji Barista, Staff, & Uang Makan</option>
          <option value="Perawatan Alat">Perawatan & Servis Mesin Espresso / Grinder</option>
          <option value="Kebersihan & Sanitasi">Perlengkapan Kebersihan & Sanitasi</option>
          <option value="Pemasaran & Promo">Pemasaran, Iklan & Promo Cafe</option>
          <option value="Pengeluaran Lainnya">Pengeluaran Lain-lain</option>
        `;
      }
    }

    this._modalActiveType = type;
  },

  saveModalTransaction() {
    const type = this._modalActiveType || 'income';
    const category = document.getElementById('trxModalCategory').value;
    const amount = Number(document.getElementById('trxModalAmount').value || 0);
    const dateVal = document.getElementById('trxModalDate').value;
    const desc = document.getElementById('trxModalDesc').value.trim();
    const method = document.getElementById('trxModalMethod').value;
    const pic = document.getElementById('trxModalPic').value.trim();
    const ref = document.getElementById('trxModalRef').value.trim();

    if (!amount || amount <= 0) {
      alert('Harap masukkan nominal transaksi yang valid (lebih dari 0).');
      return;
    }

    if (!desc) {
      alert('Harap masukkan deskripsi / keterangan transaksi.');
      return;
    }

    const newTrx = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      type: type,
      category: category,
      amount: amount,
      paymentMethod: method,
      cashier: pic || 'Petugas',
      description: desc,
      refNo: ref || '-',
      items: []
    };

    StorageManager.addTransaction(newTrx);
    this.closeRecordModal();
    this.renderAll();
    if (window.ReportsModule) window.ReportsModule.renderAll();

    App.playBeep(type === 'income' ? 700 : 350, 0.1);
    App.showToast(`Berhasil mencatat ${type === 'income' ? 'pemasukan' : 'pengeluaran'} ${App.formatRupiah(amount)}`, 'success');
  }
};

window.FinanceModule = FinanceModule;

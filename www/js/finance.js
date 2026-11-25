/**
 * DIALOG COFFEE Cashier - Finance & Bookkeeping Module
 * Updated for detailed income/expense recording, 2-shift 2-barista attribution,
 * WhatsApp notifications, and Daily Closing Shift summary to owner.
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

    const isId = I18N.currentLang === 'id';
    let opts = `<option value="all">${isId ? 'Semua Kategori' : 'All Categories'}</option>`;
    categories.forEach(cat => {
      opts += `<option value="${cat}">${cat}</option>`;
    });
    select.innerHTML = opts;
  },

  getFilteredTransactions() {
    const all = StorageManager.getTransactions();
    return all.filter(t => {
      if (this.currentFilterType !== 'all' && t.type !== this.currentFilterType) return false;
      if (this.currentCategory !== 'all' && t.category !== this.currentCategory) return false;

      if (this.searchQuery) {
        const query = this.searchQuery;
        const matchId = (t.id || '').toLowerCase().includes(query);
        const matchDesc = (t.description || '').toLowerCase().includes(query);
        const matchCat = (t.category || '').toLowerCase().includes(query);
        const matchRef = (t.refNo || '').toLowerCase().includes(query);
        const matchCashier = (t.cashier || '').toLowerCase().includes(query);
        const matchShift = (t.shift || '').toLowerCase().includes(query);
        const matchCustomer = (t.customerName || '').toLowerCase().includes(query);
        const matchSeat = (t.seatNumber || '').toLowerCase().includes(query);
        if (!matchId && !matchDesc && !matchCat && !matchRef && !matchCashier && !matchShift && !matchCustomer && !matchSeat) return false;
      }

      return true;
    });
  },

  renderTable() {
    const tbody = document.getElementById('financeTableBody');
    const countEl = document.getElementById('financeRowCount');
    if (!tbody) return;

    const filtered = this.getFilteredTransactions();
    const isId = I18N.currentLang === 'id';
    if (countEl) countEl.textContent = `${filtered.length} ${isId ? 'Transaksi Tercatat' : 'Transactions Recorded'}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">📑</div>
            <p>${isId ? 'Tidak ada transaksi yang cocok.' : 'No matching transactions.'}</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((t, idx) => {
      const isIncome = t.type === 'income';
      const itemsDetail = t.items && t.items.length > 0
        ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Items: ${t.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</div>`
        : '';

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; font-size: 0.8rem; color: var(--text-primary);">${App.formatDateTime(t.date)}</div>
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">${t.id} ${t.refNo ? `• Ref: ${t.refNo}` : ''}</div>
          </td>
          <td>
            <span class="type-pill ${isIncome ? 'income' : 'expense'}">
              ${isIncome ? (isId ? '▲ Masuk' : '▲ Income') : (isId ? '▼ Keluar' : '▼ Expense')}
            </span>
          </td>
          <td>
            <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${t.category || '-'}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${t.shift || 'Shift 1'} • ${t.cashier || 'Barista'}</div>
            ${(t.seatNumber || t.customerName) ? `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${t.seatNumber ? `🪑 ${t.seatNumber}` : ''} ${t.customerName ? `👤 ${t.customerName}` : ''}</div>` : ''}
          </td>
          <td>
            <div style="max-width: 250px; line-height: 1.3;">
              <span style="color: var(--text-secondary);">${t.description || '-'}</span>
              ${itemsDetail}
            </div>
          </td>
          <td>
            <span style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
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
              <button class="btn-table-action" title="Kirim Info ke WA Owner" onclick="FinanceModule.sendTransactionWA('${t.id}')">
                📲
              </button>
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

  sendTransactionWA(id) {
    const all = StorageManager.getTransactions();
    const trx = all.find(x => x.id === id);
    if (!trx) return;

    if (trx.type === 'income') {
      WhatsAppNotifier.notifyIncome(trx);
    } else {
      WhatsAppNotifier.notifyExpense(trx);
    }
    App.showToast('Membuka WhatsApp untuk mengirim rincian transaksi', 'info');
  },

  deleteEntry(id) {
    if (!confirm(`Hapus transaksi dengan ID ${id}? Tindakan ini akan memperbarui saldo.`)) return;

    const ok = StorageManager.deleteTransaction(id);
    if (ok) {
      App.showToast(`Transaksi ${id} dihapus`, 'info');
      this.renderAll();
      if (window.ReportsModule) window.ReportsModule.renderAll();
    }
  },

  // MODAL CATAT PEMASUKAN & PENGELUARAN
  openRecordModal(type = 'income') {
    const modal = document.getElementById('recordTransactionModal');
    if (!modal) return;

    this.setModalType(type);

    const now = new Date();
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
    if (picInput) picInput.value = `${settings.activeBarista1 || 'Ardi'} (${settings.activeShift || 'Shift 1'})`;

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
          <option value="Penjualan Biji Kopi">Penjualan Biji Kopi Sangrai (Beans)</option>
          <option value="Katering / Event">Katering / Event Luar</option>
          <option value="Pemasukan Lainnya">Pemasukan Lainnya</option>
        `;
      }
    } else {
      if (btnIncome) btnIncome.classList.remove('active');
      if (btnExpense) btnExpense.classList.add('active');

      if (categorySelect) {
        categorySelect.innerHTML = `
          <option value="Bahan Baku">Bahan Baku (Biji Kopi, Fresh Milk, Sirup, Biskuit Regal/Biscoff)</option>
          <option value="Kemasan & Perlengkapan">Kemasan (Cup, Sedotan, Seal, Paper Bag)</option>
          <option value="Operasional">Operasional (Listrik PLN, Air, Gas, WiFi)</option>
          <option value="Gaji & Uang Makan">Gaji Barista & Uang Makan</option>
          <option value="Perawatan Alat">Perawatan & Servis Mesin Espresso / Grinder</option>
          <option value="Kebersihan & Sanitasi">Perlengkapan Kebersihan</option>
          <option value="Pemasaran & Promo">Pemasaran & Promo Cafe</option>
          <option value="Pengeluaran Lainnya">Pengeluaran Lain-lain</option>
        `;
      }
    }

    this._modalActiveType = type;
  },

  saveModalTransaction(sendWhatsApp = false) {
    const type = this._modalActiveType || 'income';
    const category = document.getElementById('trxModalCategory').value;
    const amount = Number(document.getElementById('trxModalAmount').value || 0);
    const dateVal = document.getElementById('trxModalDate').value;
    const desc = document.getElementById('trxModalDesc').value.trim();
    const method = document.getElementById('trxModalMethod').value;
    const pic = document.getElementById('trxModalPic').value.trim();
    const ref = document.getElementById('trxModalRef').value.trim();

    if (!amount || amount <= 0) {
      alert('Harap masukkan nominal transaksi yang valid.');
      return;
    }

    if (!desc) {
      alert('Harap masukkan deskripsi / keterangan transaksi.');
      return;
    }

    const settings = StorageManager.getSettings();

    const newTrx = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      type: type,
      category: category,
      amount: amount,
      paymentMethod: method,
      shift: settings.activeShift || 'Shift 1',
      baristas: `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'}`,
      cashier: pic || settings.activeCashier,
      description: desc,
      refNo: ref || '-',
      items: []
    };

    StorageManager.addTransaction(newTrx);
    this.closeRecordModal();
    this.renderAll();
    if (window.ReportsModule) window.ReportsModule.renderAll();

    // Kirim notifikasi WA ke owner jika diminta
    if (sendWhatsApp) {
      if (type === 'income') WhatsAppNotifier.notifyIncome(newTrx);
      else WhatsAppNotifier.notifyExpense(newTrx);
    }

    App.playBeep(type === 'income' ? 700 : 350, 0.08);
    App.showToast(`Berhasil mencatat ${type === 'income' ? 'pemasukan' : 'pengeluaran'} ${App.formatRupiah(amount)}`, 'success');
  },

  // CLOSING SHIFT & REKAPAN HARIAN PER SHIFT
  selectedClosingShift: 'Shift 1',

  openClosingModal(targetShift) {
    const modal = document.getElementById('closingShiftModal');
    if (!modal) return;

    const settings = StorageManager.getSettings();
    this.selectedClosingShift = targetShift || settings.activeShift || 'Shift 1';
    this.calculateAndRenderClosing();

    modal.classList.add('active');
  },

  onClosingShiftChange(newShift) {
    this.selectedClosingShift = newShift;
    this.calculateAndRenderClosing();
  },

  calculateAndRenderClosing() {
    const all = StorageManager.getTransactions();
    const closings = StorageManager.getClosings();
    const now = new Date();
    const settings = StorageManager.getSettings();

    // 1. Kumpulkan ID transaksi yang sudah pernah tercatat di closing sebelumnya
    const closedTrxIds = new Set();
    closings.forEach(c => {
      if (c && Array.isArray(c.transactions)) {
        c.transactions.forEach(t => {
          if (t && t.id) closedTrxIds.add(t.id);
        });
      }
    });

    // 2. Tentukan batas waktu buka shift (awal open) hingga closing saat ini
    const targetShift = this.selectedClosingShift;
    const prevClosings = closings.filter(c => {
      const cTime = c && c.timestamp ? new Date(c.timestamp).getTime() : (c && c.date ? new Date(c.date).getTime() : 0);
      return cTime > 0 && cTime <= now.getTime();
    });

    let lastClosingTimeMs = 0;
    if (targetShift !== 'all') {
      const lastSameShiftClosing = prevClosings.find(c => c.shift === targetShift);
      if (lastSameShiftClosing) {
        lastClosingTimeMs = new Date(lastSameShiftClosing.timestamp || lastSameShiftClosing.date).getTime();
      }
    }
    if (!lastClosingTimeMs && prevClosings.length > 0) {
      lastClosingTimeMs = new Date(prevClosings[0].timestamp || prevClosings[0].date).getTime();
    }

    // 3. Filter seluruh transaksi dari awal open shift hingga closing (lintas tanggal)
    const shiftTrx = all.filter(t => {
      if (!t || !t.date) return false;
      const tTime = new Date(t.date).getTime();
      if (isNaN(tTime)) return false;

      // Transaksi harus sebelum atau tepat saat closing dilakukan
      if (tTime > now.getTime()) return false;

      // Jangan masukkan transaksi yang sudah pernah di-closing sebelumnya
      if (closedTrxIds.has(t.id)) return false;

      // Jika ada waktu closing sebelumnya, ambil transaksi setelah closing tersebut
      if (lastClosingTimeMs && tTime <= lastClosingTimeMs) return false;

      // Batas toleransi maksimal jika tidak ada riwayat closing sama sekali (48 jam terakhir)
      if (!lastClosingTimeMs && (now.getTime() - tTime) > 48 * 3600 * 1000) return false;

      // Filter shift jika bukan 'all'
      if (targetShift === 'Shift 1') {
        return (t.shift || 'Shift 1') === 'Shift 1';
      } else if (targetShift === 'Shift 2') {
        return t.shift === 'Shift 2';
      }
      return true;
    });

    // Tentukan waktu awal open sebenarnya berdasarkan transaksi tertua pada shift ini atau settings.shiftOpenedAt
    let openedAt = null;
    if (shiftTrx.length > 0) {
      const earliestTrxTime = Math.min(...shiftTrx.map(t => new Date(t.date).getTime()));
      openedAt = new Date(earliestTrxTime).toISOString();
      if (settings.shiftOpenedAt) {
        const sOpen = new Date(settings.shiftOpenedAt).getTime();
        if (!isNaN(sOpen) && sOpen <= earliestTrxTime && (earliestTrxTime - sOpen) < 24 * 3600 * 1000) {
          openedAt = settings.shiftOpenedAt;
        }
      }
    } else {
      openedAt = settings.shiftOpenedAt || now.toISOString();
    }

    // Label Shift & Barista
    let shiftLabel = 'Semua Shift (Total Operasional)';
    let baristas = 'Semua Barista';

    if (this.selectedClosingShift === 'Shift 1') {
      shiftLabel = 'Shift 1 (Pagi - Siang)';
      baristas = (settings.activeShift === 'Shift 1') 
        ? `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'}`
        : 'Ardi & Anca';
    } else if (this.selectedClosingShift === 'Shift 2') {
      shiftLabel = 'Shift 2 (Sore - Malam)';
      baristas = (settings.activeShift === 'Shift 2') 
        ? `${settings.activeBarista1 || 'Jhonson'} & ${settings.activeBarista2 || 'Si Pur'}`
        : 'Jhonson & Si Pur';
    } else {
      shiftLabel = 'Semua Shift (Total Operasional)';
      baristas = `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'} (Aktif)`;
    }

    // Jika ada catatan barista spesifik di transaksi shift ini, utamakan
    const sampleWithBarista = shiftTrx.find(t => t.baristas);
    if (sampleWithBarista && sampleWithBarista.baristas) {
      baristas = sampleWithBarista.baristas;
    }

    let todayIncome = 0;
    let todayExpense = 0;
    let cashBalance = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    const todayExpensesList = [];

    shiftTrx.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') {
        todayIncome += amt;
        incomeCount++;
        if (t.paymentMethod === 'Tunai' || !t.paymentMethod) cashBalance += amt;
      } else {
        todayExpense += amt;
        expenseCount++;
        todayExpensesList.push(t);
        if (t.paymentMethod === 'Tunai' || t.paymentMethod === 'Petty Cash' || !t.paymentMethod) cashBalance -= amt;
      }
    });

    const netProfit = todayIncome - todayExpense;

    this._currentClosingSummary = {
      id: 'CLS-' + Date.now(),
      date: now.toISOString(),
      timestamp: now.toISOString(),
      openedAt: openedAt,
      closedAt: now.toISOString(),
      shift: this.selectedClosingShift === 'all' ? 'Semua Shift (Total Operasional)' : this.selectedClosingShift,
      shiftLabel: shiftLabel,
      baristas: baristas,
      totalIncome: todayIncome,
      totalExpense: todayExpense,
      netProfit: netProfit,
      cashBalance: cashBalance,
      cashPhysical: cashBalance,
      transactionCount: shiftTrx.length,
      trxCount: shiftTrx.length,
      incomeCount: incomeCount,
      expenseCount: expenseCount,
      expenses: todayExpensesList,
      transactions: shiftTrx
    };

    // Update Tab Buttons Active State
    const tab1 = document.getElementById('closingTabShift1');
    const tab2 = document.getElementById('closingTabShift2');
    const tabAll = document.getElementById('closingTabAll');
    if (tab1) tab1.classList.toggle('active', this.selectedClosingShift === 'Shift 1');
    if (tab2) tab2.classList.toggle('active', this.selectedClosingShift === 'Shift 2');
    if (tabAll) tabAll.classList.toggle('active', this.selectedClosingShift === 'all');

    // Render data di modal
    const shiftDisplayEl = document.getElementById('closingShiftDisplay');
    if (shiftDisplayEl) shiftDisplayEl.textContent = shiftLabel;

    const baristaDisplayEl = document.getElementById('closingBaristaDisplay');
    if (baristaDisplayEl) baristaDisplayEl.textContent = baristas;

    const incomeDisplayEl = document.getElementById('closingIncomeDisplay');
    if (incomeDisplayEl) incomeDisplayEl.textContent = App.formatRupiah(todayIncome);

    const expenseDisplayEl = document.getElementById('closingExpenseDisplay');
    if (expenseDisplayEl) expenseDisplayEl.textContent = App.formatRupiah(todayExpense);
    
    const profitEl = document.getElementById('closingProfitDisplay');
    if (profitEl) {
      profitEl.textContent = (netProfit < 0 ? '-' : '+') + App.formatRupiah(Math.abs(netProfit));
      profitEl.style.color = netProfit >= 0 ? 'var(--income-green)' : 'var(--expense-red)';
    }

    const cashDisplayEl = document.getElementById('closingCashDisplay');
    if (cashDisplayEl) cashDisplayEl.textContent = App.formatRupiah(cashBalance);

    const countDisplayEl = document.getElementById('closingCountDisplay');
    if (countDisplayEl) {
      let periodNote = '';
      if (openedAt) {
        const dOpen = new Date(openedAt);
        const fmt = d => `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        periodNote = ` • (${fmt(dOpen)} - ${fmt(now)})`;
      }
      countDisplayEl.textContent = `${shiftTrx.length} (${incomeCount} Masuk, ${expenseCount} Keluar)${periodNote}`;
    }

    const btnWA = document.getElementById('btnSubmitClosingWA');
    if (btnWA) {
      const targetName = this.selectedClosingShift === 'all' ? 'Total Hari Ini' : this.selectedClosingShift;
      btnWA.innerHTML = `<span>📲</span> Kirim Closing ${targetName} via WA Gateway (+628982151560) ke Owner (+62 85334101996)`;
    }
  },

  closeClosingModal() {
    const modal = document.getElementById('closingShiftModal');
    if (modal) modal.classList.remove('active');
  },

  sendClosingWA() {
    if (!this._currentClosingSummary) return;

    WhatsAppNotifier.notifyClosingShift(this._currentClosingSummary);
    StorageManager.saveClosing(this._currentClosingSummary);

    // Tandai waktu mulai siklus shift berikutnya setelah closing disimpan
    const settings = StorageManager.getSettings();
    settings.shiftOpenedAt = new Date().toISOString();
    StorageManager.saveSettings(settings);

    // Otomatis sinkronkan seluruh rekapan closing dan transaksi ke database cloud
    if (window.CloudSync) {
      if (typeof CloudSync.syncClosingRecord === 'function') {
        CloudSync.syncClosingRecord(this._currentClosingSummary);
      }
      if (typeof CloudSync.syncAllData === 'function') {
        CloudSync.syncAllData();
      }
    }

    if (window.OwnerModule && OwnerModule.isLoggedIn()) {
      OwnerModule.renderAll();
    }

    const shiftName = this.selectedClosingShift === 'all' ? 'Total Hari Ini' : this.selectedClosingShift;
    App.showToast(`Rekapan closing ${shiftName} berhasil dikirim via WA Gateway ke Owner (+6285334101996)!`, 'success');
    this.closeClosingModal();
  }
};

window.FinanceModule = FinanceModule;

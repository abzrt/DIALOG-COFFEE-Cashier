/**
 * DIALOG COFFEE Cashier - Owner Dashboard & Cash Flow Module
 * Dedicated VIP Owner portal for in-depth daily, monthly, and yearly
 * cashflow analysis (pemasukan vs pengeluaran) with PIN authentication.
 */

const OwnerModule = {
  sessionKey: 'dialog_coffee_owner_auth_v1',
  currentMode: 'daily', // 'daily' | 'monthly' | 'yearly'
  selectedDate: '', // 'YYYY-MM-DD'
  selectedMonth: 0, // 0 - 11
  selectedYear: 2026,
  selectedShift: 'all',
  chartInstance: null,

  init() {
    const today = new Date();
    this.selectedDate = this.formatDateInput(today);
    this.selectedMonth = today.getMonth();
    this.selectedYear = today.getFullYear();

    this.bindEvents();
    this.updateOwnerNavBadges();
  },

  isLoggedIn() {
    try {
      return localStorage.getItem(this.sessionKey) === 'true' || sessionStorage.getItem(this.sessionKey) === 'true' || (window.AuthModule && AuthModule.isOwner());
    } catch (e) {
      return false;
    }
  },

  setLoggedIn(status) {
    try {
      if (status) {
        localStorage.setItem(this.sessionKey, 'true');
        sessionStorage.setItem(this.sessionKey, 'true');
      } else {
        localStorage.removeItem(this.sessionKey);
        sessionStorage.removeItem(this.sessionKey);
      }
    } catch (e) {}
    this.updateOwnerNavBadges();
  },

  updateOwnerNavBadges() {
    const isAuth = this.isLoggedIn();
    const topBtn = document.getElementById('topOwnerBtn');
    if (topBtn) {
      if (isAuth) {
        topBtn.classList.add('owner-active-online');
        topBtn.title = 'Area Owner (Online) - Klik untuk buka Dashboard';
      } else {
        topBtn.classList.remove('owner-active-online');
        topBtn.title = 'Login Khusus Owner (Arus Kas Harian, Bulanan, Tahunan)';
      }
    }

    const navTabs = document.querySelectorAll('[data-target-tab="owner"]');
    navTabs.forEach(tab => {
      if (isAuth) {
        tab.classList.add('owner-tab-authenticated');
      } else {
        tab.classList.remove('owner-tab-authenticated');
      }
    });
  },

  handleOwnerClick() {
    if (window.AuthModule && !AuthModule.isOwner()) {
      AuthModule.openLoginModal(true);
      return;
    }
    if (this.isLoggedIn()) {
      if (window.App && App.switchTab) {
        App.switchTab('owner');
      }
    } else {
      this.openLoginModal();
    }
  },

  openLoginModal() {
    const modal = document.getElementById('ownerLoginModal');
    if (!modal) return;
    const pinInput = document.getElementById('ownerPinInput');
    if (pinInput) {
      pinInput.value = '';
    }
    const err = document.getElementById('ownerPinError');
    if (err) err.style.display = 'none';

    modal.classList.add('active');
    setTimeout(() => {
      if (pinInput) pinInput.focus();
    }, 200);
  },

  closeLoginModal() {
    const modal = document.getElementById('ownerLoginModal');
    if (modal) modal.classList.remove('active');
  },

  togglePinVisibility() {
    const pinInput = document.getElementById('ownerPinInput');
    const eyeBtn = document.getElementById('btnTogglePinEye');
    if (!pinInput) return;
    if (pinInput.type === 'password') {
      pinInput.type = 'text';
      if (eyeBtn) eyeBtn.textContent = '🔒';
    } else {
      pinInput.type = 'password';
      if (eyeBtn) eyeBtn.textContent = '👁️';
    }
  },

  appendPinDigit(digit) {
    const pinInput = document.getElementById('ownerPinInput');
    if (!pinInput) return;
    if (pinInput.value.length < 12) {
      pinInput.value += digit;
    }
    const err = document.getElementById('ownerPinError');
    if (err) err.style.display = 'none';
  },

  clearPin() {
    const pinInput = document.getElementById('ownerPinInput');
    if (pinInput) pinInput.value = '';
    const err = document.getElementById('ownerPinError');
    if (err) err.style.display = 'none';
  },

  backspacePin() {
    const pinInput = document.getElementById('ownerPinInput');
    if (pinInput && pinInput.value.length > 0) {
      pinInput.value = pinInput.value.slice(0, -1);
    }
  },

  async submitLogin() {
    const pinInput = document.getElementById('ownerPinInput');
    const enteredPin = (pinInput ? pinInput.value : '').trim();
    let settings = StorageManager.getSettings();
    let realPin = (settings.ownerPin || '1996').trim();

    if (!enteredPin) {
      this.showLoginError('Masukkan PIN keamanan Owner terlebih dahulu.');
      return;
    }

    // Selalu sinkronkan PIN terbaru dari cloud
    if (window.CloudSync && CloudSync.fetchSettingsFromCloud) {
      const errEl = document.getElementById('ownerPinError');
      if (errEl && enteredPin !== realPin) {
        errEl.textContent = '🔄 Checking...';
        errEl.style.display = 'block';
        errEl.style.color = 'var(--primary, #c9933a)';
      }
      await CloudSync.fetchSettingsFromCloud(6000, true);
      settings = StorageManager.getSettings();
      realPin = String(settings.ownerPin ?? '1996').trim() || '1996';
    }

    if (enteredPin === realPin) {
      // Verifikasi anti dual-login di Cloud
      if (window.CloudSync && CloudSync.checkAndRegisterLoginSession && window.AuthModule) {
        const devId = AuthModule.getDeviceId();
        const sessionCheck = await CloudSync.checkAndRegisterLoginSession('owner', 'Owner', devId);
        if (sessionCheck && sessionCheck.success === false) {
          this.showLoginError(sessionCheck.message || 'Tidak bisa dual login! Akun sedang aktif digunakan.');
          if (window.App) App.playBeep(260, 0.25, 'sawtooth');
          return;
        }
        if (sessionCheck && sessionCheck.data && sessionCheck.data.token) {
          try { localStorage.setItem(AuthModule.SESSION_TOKEN_KEY, sessionCheck.data.token); } catch (e) {}
        }
      }

      this.setLoggedIn(true);
      if (window.AuthModule) {
        AuthModule.setRole('owner');
      }
      this.closeLoginModal();
      if (window.App) {
        App.playChime();
        App.showToast('Selamat datang, Pemilik DIALOG COFFEE!', 'success');
        App.switchTab('owner');
      }
      this.renderAll();
    } else {
      if (window.App) App.playBeep(260, 0.15, 'sawtooth');
      this.showLoginError('PIN salah!');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
  },

  showLoginError(msg) {
    const err = document.getElementById('ownerPinError');
    if (err) {
      err.textContent = msg;
      err.style.display = 'block';
    }
  },

  async logout() {
    this.setLoggedIn(false);
    if (window.AuthModule) {
      await AuthModule.logout();
    } else if (window.App) {
      App.playBeep(440, 0.08);
      App.showToast('Sesi Owner ditutup.', 'info');
      App.switchTab('pos');
    }
  },

  bindEvents() {
    // PIN input Enter key
    const pinInput = document.getElementById('ownerPinInput');
    if (pinInput) {
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitLogin();
        }
      });
    }

    // Timeframe tabs
    const timeframeTabs = document.querySelectorAll('[data-owner-timeframe]');
    timeframeTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-owner-timeframe');
        this.setTimeframeMode(mode);
      });
    });

    // Daily Date Picker
    const dateInput = document.getElementById('ownerDailyDate');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        if (e.target.value) {
          this.selectedDate = e.target.value;
          this.renderDaily();
        }
      });
    }

    // Daily Shift Filter
    const shiftFilter = document.getElementById('ownerDailyShiftFilter');
    if (shiftFilter) {
      shiftFilter.addEventListener('change', (e) => {
        this.selectedShift = e.target.value;
        this.renderDaily();
      });
    }

    // Monthly Month & Year Pickers
    const monthSelect = document.getElementById('ownerMonthlyMonth');
    const yearSelect = document.getElementById('ownerMonthlyYear');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        this.selectedMonth = parseInt(e.target.value, 10);
        this.renderMonthly();
      });
    }
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this.selectedYear = parseInt(e.target.value, 10);
        this.renderMonthly();
      });
    }

    // Yearly Year Picker
    const yearlyYearSelect = document.getElementById('ownerYearlyYear');
    if (yearlyYearSelect) {
      yearlyYearSelect.addEventListener('change', (e) => {
        this.selectedYear = parseInt(e.target.value, 10);
        this.renderYearly();
      });
    }
  },

  setTimeframeMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('[data-owner-timeframe]').forEach(btn => {
      if (btn.getAttribute('data-owner-timeframe') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const panels = {
      daily: document.getElementById('ownerDailyPanel'),
      monthly: document.getElementById('ownerMonthlyPanel'),
      yearly: document.getElementById('ownerYearlyPanel')
    };

    Object.keys(panels).forEach(key => {
      if (panels[key]) {
        panels[key].style.display = key === mode ? 'block' : 'none';
      }
    });

    if (mode === 'daily') {
      this.renderDaily();
    } else if (mode === 'monthly') {
      this.renderMonthly();
    } else if (mode === 'yearly') {
      this.renderYearly();
    }
  },

  // Helper date formatting
  formatDateInput(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  },

  formatPercent(val) {
    return (Number(val) || 0).toFixed(1) + '%';
  },

  formatDateIndo(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  },

  getMonthNameIndo(mIdx) {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[mIdx] || '';
  },

  // RENDER MASTER
  renderAll() {
    if (!this.isLoggedIn()) {
      const lockedBox = document.getElementById('ownerLockedNotice');
      const contentBox = document.getElementById('ownerAuthenticatedContent');
      if (lockedBox) lockedBox.style.display = 'block';
      if (contentBox) contentBox.style.display = 'none';
      return;
    }

    const lockedBox = document.getElementById('ownerLockedNotice');
    const contentBox = document.getElementById('ownerAuthenticatedContent');
    if (lockedBox) lockedBox.style.display = 'none';
    if (contentBox) contentBox.style.display = 'block';

    // Populate Year Select Options if empty
    this.populateYearOptions();

    // Render Lifetime Quick Summary
    this.renderLifetimeKPIs();

    // Render current active mode
    this.setTimeframeMode(this.currentMode);

    // Tarik transaksi & closing terbaru dari database cloud jika online
    if (window.CloudSync && CloudSync.fetchTransactionsFromCloud) {
      CloudSync.fetchTransactionsFromCloud(6000);
    }
  },

  populateYearOptions() {
    const all = StorageManager.getTransactions();
    const years = new Set();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear - 1);
    years.add(currentYear + 1);

    all.forEach(t => {
      if (t.date) {
        const y = new Date(t.date).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    ['ownerMonthlyYear', 'ownerYearlyYear'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const val = this.selectedYear;
        el.innerHTML = sortedYears.map(y => `<option value="${y}" ${y === val ? 'selected' : ''}>Tahun ${y}</option>`).join('');
      }
    });

    const monthEl = document.getElementById('ownerMonthlyMonth');
    if (monthEl) {
      monthEl.value = this.selectedMonth;
    }
  },

  renderLifetimeKPIs() {
    const all = StorageManager.getTransactions();
    let totalIn = 0;
    let totalOut = 0;
    all.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') totalIn += amt;
      else totalOut += amt;
    });

    const net = totalIn - totalOut;
    const elIn = document.getElementById('ownerLifetimeIncome');
    const elOut = document.getElementById('ownerLifetimeExpense');
    const elNet = document.getElementById('ownerLifetimeNet');

    if (elIn) elIn.textContent = this.formatRupiah(totalIn);
    if (elOut) elOut.textContent = this.formatRupiah(totalOut);
    if (elNet) {
      elNet.textContent = (net < 0 ? '-' : '+') + this.formatRupiah(Math.abs(net));
      elNet.style.color = net >= 0 ? 'var(--income-green)' : 'var(--expense-red)';
    }
  },

  // =========================================================================
  // 1. HARIAN (PER HARI)
  // =========================================================================
  setDailyDate(dateStr) {
    this.selectedDate = dateStr;
    const dateInput = document.getElementById('ownerDailyDate');
    if (dateInput) dateInput.value = dateStr;
    this.renderDaily();
  },

  changeDailyOffset(days) {
    const cur = new Date(this.selectedDate || new Date());
    cur.setDate(cur.getDate() + days);
    this.setDailyDate(this.formatDateInput(cur));
  },

  goToToday() {
    this.setDailyDate(this.formatDateInput(new Date()));
  },

  renderDaily() {
    if (!this.selectedDate) {
      this.selectedDate = this.formatDateInput(new Date());
    }
    const dateInput = document.getElementById('ownerDailyDate');
    if (dateInput && dateInput.value !== this.selectedDate) {
      dateInput.value = this.selectedDate;
    }

    const titleEl = document.getElementById('ownerDailyTitleDisplay');
    if (titleEl) {
      titleEl.textContent = this.formatDateIndo(this.selectedDate);
    }

    const all = StorageManager.getTransactions();
    const targetDateStr = this.selectedDate;
    const shiftFilter = this.selectedShift;

    // Filter per hari
    const dayTrx = all.filter(t => {
      if (!t.date) return false;
      let dStr = '';
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) {
        dStr = this.formatDateInput(d);
      } else {
        dStr = String(t.date).slice(0, 10);
      }
      if (dStr !== targetDateStr) return false;
      if (shiftFilter !== 'all' && t.shift && !t.shift.includes(shiftFilter)) return false;
      return true;
    });

    // Calculate metrics
    let income = 0;
    let expense = 0;
    let cashIn = 0;
    let nonCashIn = 0;
    let shift1Net = 0;
    let shift2Net = 0;

    dayTrx.forEach(t => {
      const amt = Number(t.amount || 0);
      const isShift1 = t.shift && t.shift.includes('Shift 1');
      if (t.type === 'income') {
        income += amt;
        if (t.paymentMethod === 'Tunai' || !t.paymentMethod) {
          cashIn += amt;
        } else {
          nonCashIn += amt;
        }
        if (isShift1) shift1Net += amt; else shift2Net += amt;
      } else {
        expense += amt;
        if (isShift1) shift1Net -= amt; else shift2Net -= amt;
      }
    });

    const net = income - expense;
    const margin = income > 0 ? (net / income) * 100 : 0;

    // Update KPI Displays
    const elIn = document.getElementById('ownerDailyTotalIncome');
    const elOut = document.getElementById('ownerDailyTotalExpense');
    const elNet = document.getElementById('ownerDailyNetProfit');
    const elMargin = document.getElementById('ownerDailyMargin');
    const elCash = document.getElementById('ownerDailyCashBreakdown');
    const elShifts = document.getElementById('ownerDailyShiftsBreakdown');
    const elCount = document.getElementById('ownerDailyCount');

    if (elIn) elIn.textContent = this.formatRupiah(income);
    if (elOut) elOut.textContent = this.formatRupiah(expense);
    if (elNet) {
      elNet.textContent = (net < 0 ? '-' : '+') + this.formatRupiah(Math.abs(net));
      elNet.style.color = net >= 0 ? 'var(--income-green)' : 'var(--expense-red)';
    }
    if (elMargin) elMargin.textContent = `Margin: ${this.formatPercent(margin)}`;
    if (elCash) {
      elCash.innerHTML = `<span>💵 Tunai: <strong>${this.formatRupiah(cashIn)}</strong></span> • <span>📱 Non-Tunai: <strong>${this.formatRupiah(nonCashIn)}</strong></span>`;
    }
    if (elShifts) {
      elShifts.innerHTML = `<span>🌅 Shift 1: <strong>${this.formatRupiah(shift1Net)}</strong></span> | <span>🌙 Shift 2: <strong>${this.formatRupiah(shift2Net)}</strong></span>`;
    }
    if (elCount) elCount.textContent = `${dayTrx.length} Transaksi`;

    // Render detailed table
    const tbody = document.getElementById('ownerDailyTableBody');
    if (!tbody) return;

    if (dayTrx.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 6px;">🍃</div>
            <div style="font-weight: 700;">Belum ada catatan alur kas pada tanggal ini</div>
            <div style="font-size: 0.8rem;">Pemasukan kasir atau pengeluaran operasional akan otomatis muncul di sini.</div>
          </td>
        </tr>
      `;
      return;
    }

    // Sort: newest first or chronologically
    const sorted = [...dayTrx].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sorted.map((t, idx) => {
      const isInc = t.type === 'income';
      const d = new Date(t.date);
      const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
      const typeBadge = isInc 
        ? `<span class="badge-type-income">▲ Masuk</span>` 
        : `<span class="badge-type-expense">▼ Keluar</span>`;

      // Item summary
      let itemsSummary = t.description || '-';
      if (t.items && Array.isArray(t.items) && t.items.length > 0) {
        itemsSummary = t.items.map(it => `${it.quantity}x ${it.name}`).join(', ');
        if (t.customerName || t.seatNumber) {
          itemsSummary = `<strong>[${t.customerName || ''}${t.seatNumber ? ' • ' + t.seatNumber : ''}]</strong> ${itemsSummary}`;
        }
      }

      return `
        <tr>
          <td style="width: 35px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">${idx + 1}</td>
          <td style="white-space: nowrap;">
            <div style="font-weight: 800; font-family: var(--font-mono); font-size: 0.88rem;">${timeStr}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">${t.id || ''}</div>
          </td>
          <td>${typeBadge}</td>
          <td>
            <div style="font-weight: 700; font-size: 0.82rem;">${t.category || (isInc ? 'Penjualan Kopi' : 'Operasional')}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${t.shift || 'Shift 1'} (${t.baristas || t.cashier || 'Barista'})</div>
          </td>
          <td style="max-width: 260px;">
            <div style="font-size: 0.82rem; line-height: 1.4; color: var(--text-primary);">${itemsSummary}</div>
            ${t.referenceNo ? `<div style="font-size: 0.7rem; color: var(--text-muted);">Ref/Nota: ${t.referenceNo}</div>` : ''}
          </td>
          <td style="white-space: nowrap;">
            <span class="payment-method-pill">${t.paymentMethod || 'Tunai'}</span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="font-family: var(--font-mono); font-weight: 800; font-size: 0.95rem; color: ${isInc ? 'var(--income-green)' : 'var(--expense-red)'};">
              ${isInc ? '+' : '-'}${this.formatRupiah(t.amount)}
            </div>
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-table-action" onclick="OwnerModule.viewTransactionDetail('${t.id}')" title="Lihat Rincian Transaksi">
              👁️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // =========================================================================
  // 2. BULANAN (PER BULAN)
  // =========================================================================
  changeMonthlyOffset(monthOffset) {
    let m = this.selectedMonth + monthOffset;
    let y = this.selectedYear;
    if (m > 11) {
      m = 0;
      y += 1;
    } else if (m < 0) {
      m = 11;
      y -= 1;
    }
    this.selectedMonth = m;
    this.selectedYear = y;

    const mSel = document.getElementById('ownerMonthlyMonth');
    const ySel = document.getElementById('ownerMonthlyYear');
    if (mSel) mSel.value = m;
    if (ySel) ySel.value = y;

    this.renderMonthly();
  },

  goToThisMonth() {
    const now = new Date();
    this.selectedMonth = now.getMonth();
    this.selectedYear = now.getFullYear();

    const mSel = document.getElementById('ownerMonthlyMonth');
    const ySel = document.getElementById('ownerMonthlyYear');
    if (mSel) mSel.value = this.selectedMonth;
    if (ySel) ySel.value = this.selectedYear;

    this.renderMonthly();
  },

  renderMonthly() {
    const month = this.selectedMonth;
    const year = this.selectedYear;
    const monthName = this.getMonthNameIndo(month);

    const titleEl = document.getElementById('ownerMonthlyTitleDisplay');
    if (titleEl) {
      titleEl.textContent = `${monthName} ${year}`;
    }

    const all = StorageManager.getTransactions();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map day 1..daysInMonth
    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = {
        day: d,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        income: 0,
        expense: 0,
        count: 0
      };
    }

    let monthIncome = 0;
    let monthExpense = 0;
    let totalCount = 0;

    all.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const dayNum = d.getDate();
        const amt = Number(t.amount || 0);
        if (dailyMap[dayNum]) {
          dailyMap[dayNum].count += 1;
          totalCount += 1;
          if (t.type === 'income') {
            dailyMap[dayNum].income += amt;
            monthIncome += amt;
          } else {
            dailyMap[dayNum].expense += amt;
            monthExpense += amt;
          }
        }
      }
    });

    const monthNet = monthIncome - monthExpense;
    const margin = monthIncome > 0 ? (monthNet / monthIncome) * 100 : 0;
    const avgDailyIncome = monthIncome / daysInMonth;

    // Update KPI Displays
    const elIn = document.getElementById('ownerMonthlyTotalIncome');
    const elOut = document.getElementById('ownerMonthlyTotalExpense');
    const elNet = document.getElementById('ownerMonthlyNetProfit');
    const elMargin = document.getElementById('ownerMonthlyMargin');
    const elAvg = document.getElementById('ownerMonthlyAvgDaily');
    const elCount = document.getElementById('ownerMonthlyCount');

    if (elIn) elIn.textContent = this.formatRupiah(monthIncome);
    if (elOut) elOut.textContent = this.formatRupiah(monthExpense);
    if (elNet) {
      elNet.textContent = (monthNet < 0 ? '-' : '+') + this.formatRupiah(Math.abs(monthNet));
      elNet.style.color = monthNet >= 0 ? 'var(--income-green)' : 'var(--expense-red)';
    }
    if (elMargin) elMargin.textContent = `Margin Bersih: ${this.formatPercent(margin)}`;
    if (elAvg) elAvg.textContent = `Rata-rata: ${this.formatRupiah(avgDailyIncome)} / hari`;
    if (elCount) elCount.textContent = `${totalCount} Transaksi (${daysInMonth} Hari)`;

    // Render Table
    const tbody = document.getElementById('ownerMonthlyTableBody');
    if (tbody) {
      const rows = [];
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

      for (let d = 1; d <= daysInMonth; d++) {
        const item = dailyMap[d];
        const dateObj = new Date(year, month, d);
        const dayName = days[dateObj.getDay()];
        const net = item.income - item.expense;
        const hasData = item.count > 0;

        rows.push(`
          <tr style="${hasData ? '' : 'opacity: 0.6;'}">
            <td style="font-weight: 700; white-space: nowrap;">
              ${dayName}, ${d} ${monthName.slice(0, 3)} ${year}
            </td>
            <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: ${item.income > 0 ? 'var(--income-green)' : 'var(--text-muted)'};">
              ${this.formatRupiah(item.income)}
            </td>
            <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: ${item.expense > 0 ? 'var(--expense-red)' : 'var(--text-muted)'};">
              ${this.formatRupiah(item.expense)}
            </td>
            <td style="text-align: right; font-family: var(--font-mono); font-weight: 800; color: ${net > 0 ? 'var(--income-green)' : net < 0 ? 'var(--expense-red)' : 'var(--text-muted)'};">
              ${net === 0 ? 'Rp 0' : (net < 0 ? '-' : '+') + this.formatRupiah(Math.abs(net))}
            </td>
            <td style="text-align: center; color: var(--text-muted); font-size: 0.8rem;">
              ${item.count} trx
            </td>
            <td style="text-align: center;">
              <button type="button" class="btn-table-action" onclick="OwnerModule.goToDay('${item.dateStr}')" title="Buka Detail Arus Kas Hari Ini">
                🔍 Buka Hari
              </button>
            </td>
          </tr>
        `);
      }
      tbody.innerHTML = rows.join('');
    }

    // Render Chart
    this.renderMonthlyChart(dailyMap, daysInMonth, monthName);
  },

  renderMonthlyChart(dailyMap, daysInMonth, monthName) {
    const canvas = document.getElementById('ownerMonthlyChartCanvas');
    if (!canvas || !window.Chart) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const labels = [];
    const incomeData = [];
    const expenseData = [];

    for (let d = 1; d <= daysInMonth; d++) {
      labels.push(`${d}`);
      incomeData.push(dailyMap[d].income);
      expenseData.push(dailyMap[d].expense);
    }

    const isDark = document.body.classList.contains('dark-theme');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#a1a1aa' : '#71717a';

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pemasukan (Rp)',
            data: incomeData,
            backgroundColor: '#15803d',
            borderRadius: 4
          },
          {
            label: 'Pengeluaran (Rp)',
            data: expenseData,
            backgroundColor: '#b91c1c',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif", weight: 600 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: Rp ${Number(ctx.raw).toLocaleString('id-ID')}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (val) => 'Rp ' + (val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000).toFixed(0) + 'k')
            }
          }
        }
      }
    });
  },

  // =========================================================================
  // 3. TAHUNAN (PER TAHUN)
  // =========================================================================
  changeYearlyOffset(offset) {
    this.selectedYear += offset;
    const ySel = document.getElementById('ownerYearlyYear');
    if (ySel) ySel.value = this.selectedYear;
    this.renderYearly();
  },

  goToThisYear() {
    this.selectedYear = new Date().getFullYear();
    const ySel = document.getElementById('ownerYearlyYear');
    if (ySel) ySel.value = this.selectedYear;
    this.renderYearly();
  },

  renderYearly() {
    const year = this.selectedYear;
    const titleEl = document.getElementById('ownerYearlyTitleDisplay');
    if (titleEl) {
      titleEl.textContent = `Tahun Buku ${year}`;
    }

    const all = StorageManager.getTransactions();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const monthlyMap = {};
    for (let m = 0; m < 12; m++) {
      monthlyMap[m] = {
        monthIndex: m,
        monthName: months[m],
        income: 0,
        expense: 0,
        count: 0
      };
    }

    let yearIncome = 0;
    let yearExpense = 0;
    let totalCount = 0;

    all.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        const amt = Number(t.amount || 0);
        if (monthlyMap[m]) {
          monthlyMap[m].count += 1;
          totalCount += 1;
          if (t.type === 'income') {
            monthlyMap[m].income += amt;
            yearIncome += amt;
          } else {
            monthlyMap[m].expense += amt;
            yearExpense += amt;
          }
        }
      }
    });

    const yearNet = yearIncome - yearExpense;
    const margin = yearIncome > 0 ? (yearNet / yearIncome) * 100 : 0;
    const avgMonthlyIncome = yearIncome / 12;

    // Find Best Month
    let bestMonthName = '-';
    let bestMonthIncome = 0;
    for (let m = 0; m < 12; m++) {
      if (monthlyMap[m].income > bestMonthIncome) {
        bestMonthIncome = monthlyMap[m].income;
        bestMonthName = months[m];
      }
    }

    // Update KPI Displays
    const elIn = document.getElementById('ownerYearlyTotalIncome');
    const elOut = document.getElementById('ownerYearlyTotalExpense');
    const elNet = document.getElementById('ownerYearlyNetProfit');
    const elMargin = document.getElementById('ownerYearlyMargin');
    const elBest = document.getElementById('ownerYearlyBestMonth');
    const elCount = document.getElementById('ownerYearlyCount');

    if (elIn) elIn.textContent = this.formatRupiah(yearIncome);
    if (elOut) elOut.textContent = this.formatRupiah(yearExpense);
    if (elNet) {
      elNet.textContent = (yearNet < 0 ? '-' : '+') + this.formatRupiah(Math.abs(yearNet));
      elNet.style.color = yearNet >= 0 ? 'var(--income-green)' : 'var(--expense-red)';
    }
    if (elMargin) elMargin.textContent = `Margin Tahunan: ${this.formatPercent(margin)}`;
    if (elBest) elBest.textContent = `Bulan Terbaik: ${bestMonthName} (${this.formatRupiah(bestMonthIncome)})`;
    if (elCount) elCount.textContent = `${totalCount} Transaksi Total (Rata-rata: ${this.formatRupiah(avgMonthlyIncome)} / bln)`;

    // Render Table
    const tbody = document.getElementById('ownerYearlyTableBody');
    if (tbody) {
      const rows = [];
      for (let m = 0; m < 12; m++) {
        const item = monthlyMap[m];
        const net = item.income - item.expense;
        const mMargin = item.income > 0 ? (net / item.income) * 100 : 0;
        const hasData = item.count > 0;

        rows.push(`
          <tr style="${hasData ? '' : 'opacity: 0.6;'}">
            <td style="font-weight: 700; font-size: 0.88rem;">
              ${item.monthName} ${year}
            </td>
            <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: ${item.income > 0 ? 'var(--income-green)' : 'var(--text-muted)'};">
              ${this.formatRupiah(item.income)}
            </td>
            <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: ${item.expense > 0 ? 'var(--expense-red)' : 'var(--text-muted)'};">
              ${this.formatRupiah(item.expense)}
            </td>
            <td style="text-align: right; font-family: var(--font-mono); font-weight: 800; color: ${net > 0 ? 'var(--income-green)' : net < 0 ? 'var(--expense-red)' : 'var(--text-muted)'};">
              ${net === 0 ? 'Rp 0' : (net < 0 ? '-' : '+') + this.formatRupiah(Math.abs(net))}
            </td>
            <td style="text-align: center; font-weight: 600; font-size: 0.8rem;">
              ${item.income > 0 ? this.formatPercent(mMargin) : '-'}
            </td>
            <td style="text-align: center; color: var(--text-muted); font-size: 0.8rem;">
              ${item.count} trx
            </td>
            <td style="text-align: center;">
              <button type="button" class="btn-table-action" onclick="OwnerModule.goToMonth(${year}, ${m})" title="Buka Detail Rekap Bulan Ini">
                📊 Buka Bulan
              </button>
            </td>
          </tr>
        `);
      }
      tbody.innerHTML = rows.join('');
    }

    // Render Yearly Chart
    this.renderYearlyChart(monthlyMap, year, months);
  },

  renderYearlyChart(monthlyMap, year, months) {
    const canvas = document.getElementById('ownerYearlyChartCanvas');
    if (!canvas || !window.Chart) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const labels = months.map(m => m.slice(0, 3));
    const incomeData = [];
    const expenseData = [];

    for (let m = 0; m < 12; m++) {
      incomeData.push(monthlyMap[m].income);
      expenseData.push(monthlyMap[m].expense);
    }

    const isDark = document.body.classList.contains('dark-theme');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#a1a1aa' : '#71717a';

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pemasukan (Rp)',
            data: incomeData,
            backgroundColor: '#15803d',
            borderRadius: 4
          },
          {
            label: 'Pengeluaran (Rp)',
            data: expenseData,
            backgroundColor: '#b91c1c',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif", weight: 600 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: Rp ${Number(ctx.raw).toLocaleString('id-ID')}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (val) => 'Rp ' + (val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000).toFixed(0) + 'k')
            }
          }
        }
      }
    });
  },

  // Drilldown Jump Functions
  goToDay(dateStr) {
    this.selectedDate = dateStr;
    this.setTimeframeMode('daily');
    const dateInput = document.getElementById('ownerDailyDate');
    if (dateInput) dateInput.value = dateStr;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goToMonth(year, monthIdx) {
    this.selectedYear = year;
    this.selectedMonth = monthIdx;
    this.setTimeframeMode('monthly');
    const mSel = document.getElementById('ownerMonthlyMonth');
    const ySel = document.getElementById('ownerMonthlyYear');
    if (mSel) mSel.value = monthIdx;
    if (ySel) ySel.value = year;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  viewTransactionDetail(id) {
    const all = StorageManager.getTransactions();
    const t = all.find(item => item.id === id);
    if (!t) return;

    let msg = `Detail Transaksi ${t.id}\n`;
    msg += `Waktu: ${new Date(t.date).toLocaleString('id-ID')}\n`;
    msg += `Tipe: ${t.type === 'income' ? 'Pemasukan Kasir' : 'Pengeluaran Kas'}\n`;
    msg += `Nominal: ${this.formatRupiah(t.amount)}\n`;
    msg += `Metode: ${t.paymentMethod || 'Tunai'}\n`;
    msg += `Shift: ${t.shift || 'Shift 1'} (${t.baristas || t.cashier || 'Barista'})\n`;
    msg += `Kategori: ${t.category || '-'}\n`;
    msg += `Keterangan: ${t.description || '-'}\n`;

    if (t.items && Array.isArray(t.items)) {
      msg += `\nRincian Item Pesanan:\n`;
      t.items.forEach(it => {
        msg += `- ${it.quantity}x ${it.name} (${this.formatRupiah(it.price)}) = ${this.formatRupiah(it.price * it.quantity)}\n`;
      });
      if (t.subtotal) msg += `Subtotal: ${this.formatRupiah(t.subtotal)}\n`;
      if (t.taxAmount) msg += `Pajak: ${this.formatRupiah(t.taxAmount)}\n`;
      msg += `Total: ${this.formatRupiah(t.amount)}\n`;
    }

    alert(msg);
  },

  // =========================================================================
  // EKSPOR KHUSUS OWNER (PDF & CSV)
  // =========================================================================
  exportOwnerPDF() {
    if (!window.jspdf) {
      alert('Modul PDF sedang dimuat, silakan coba sesaat lagi.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const settings = StorageManager.getSettings();

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DIALOG COFFEE - LAPORAN EKSEKUTIF OWNER', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.address} | WA Owner: ${settings.ownerPhone}`, 14, 24);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')} | Periode: ${this.currentMode.toUpperCase()}`, 14, 29);
    doc.line(14, 32, 196, 32);

    let startY = 38;

    if (this.currentMode === 'daily') {
      const all = StorageManager.getTransactions();
      const targetDateStr = this.selectedDate;
      const dayTrx = all.filter(t => t.date && t.date.slice(0, 10) === targetDateStr);

      let income = 0;
      let expense = 0;
      dayTrx.forEach(t => {
        if (t.type === 'income') income += Number(t.amount || 0);
        else expense += Number(t.amount || 0);
      });
      const net = income - expense;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rekap Arus Kas Harian: ${this.formatDateIndo(targetDateStr)}`, 14, startY);
      startY += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Pemasukan: ${this.formatRupiah(income)}   |   Total Pengeluaran: ${this.formatRupiah(expense)}   |   Laba Bersih: ${this.formatRupiah(net)}`, 14, startY);
      startY += 8;

      const tableData = dayTrx.map((t, idx) => {
        const timeStr = t.date ? new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
        return [
          idx + 1,
          timeStr,
          t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          t.category || '-',
          t.description || (t.items ? t.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : '-'),
          t.paymentMethod || 'Tunai',
          (t.type === 'income' ? '+' : '-') + this.formatRupiah(t.amount)
        ];
      });

      if (doc.autoTable) {
        doc.autoTable({
          startY: startY,
          head: [['No', 'Jam', 'Tipe', 'Kategori', 'Rincian / Items', 'Metode', 'Nominal']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [9, 9, 11] }
        });
      }
    } else if (this.currentMode === 'monthly') {
      const month = this.selectedMonth;
      const year = this.selectedYear;
      const monthName = this.getMonthNameIndo(month);
      const all = StorageManager.getTransactions();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const tableData = [];
      let totalIn = 0;
      let totalOut = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        let dIn = 0;
        let dOut = 0;
        let dCount = 0;

        all.forEach(t => {
          if (!t.date) return;
          const dt = new Date(t.date);
          if (dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === d) {
            dCount++;
            if (t.type === 'income') dIn += Number(t.amount || 0);
            else dOut += Number(t.amount || 0);
          }
        });

        totalIn += dIn;
        totalOut += dOut;
        const dNet = dIn - dOut;
        tableData.push([
          `${d} ${monthName.slice(0, 3)} ${year}`,
          this.formatRupiah(dIn),
          this.formatRupiah(dOut),
          this.formatRupiah(dNet),
          `${dCount} trx`
        ]);
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rekap Arus Kas Bulanan: ${monthName} ${year}`, 14, startY);
      startY += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Pemasukan: ${this.formatRupiah(totalIn)}  |  Total Pengeluaran: ${this.formatRupiah(totalOut)}  |  Laba Bersih: ${this.formatRupiah(totalIn - totalOut)}`, 14, startY);
      startY += 8;

      if (doc.autoTable) {
        doc.autoTable({
          startY: startY,
          head: [['Tanggal', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Laba Bersih (Rp)', 'Volume']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [9, 9, 11] }
        });
      }
    } else {
      // Yearly
      const year = this.selectedYear;
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const all = StorageManager.getTransactions();

      const tableData = [];
      let totalIn = 0;
      let totalOut = 0;

      for (let m = 0; m < 12; m++) {
        let mIn = 0;
        let mOut = 0;
        let mCount = 0;

        all.forEach(t => {
          if (!t.date) return;
          const dt = new Date(t.date);
          if (dt.getFullYear() === year && dt.getMonth() === m) {
            mCount++;
            if (t.type === 'income') mIn += Number(t.amount || 0);
            else mOut += Number(t.amount || 0);
          }
        });

        totalIn += mIn;
        totalOut += mOut;
        const mNet = mIn - mOut;
        const mMargin = mIn > 0 ? ((mNet / mIn) * 100).toFixed(1) + '%' : '-';

        tableData.push([
          months[m],
          this.formatRupiah(mIn),
          this.formatRupiah(mOut),
          this.formatRupiah(mNet),
          mMargin,
          `${mCount} trx`
        ]);
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rekap Arus Kas Tahunan: Tahun ${year}`, 14, startY);
      startY += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Pemasukan: ${this.formatRupiah(totalIn)}  |  Total Pengeluaran: ${this.formatRupiah(totalOut)}  |  Laba Bersih: ${this.formatRupiah(totalIn - totalOut)}`, 14, startY);
      startY += 8;

      if (doc.autoTable) {
        doc.autoTable({
          startY: startY,
          head: [['Bulan', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Laba Bersih (Rp)', 'Margin (%)', 'Volume']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [9, 9, 11] }
        });
      }
    }

    doc.save(`DIALOG-COFFEE-Rekap-Owner-${this.currentMode}-${Date.now()}.pdf`);
    if (window.App) App.showToast('Laporan PDF Owner berhasil diunduh.', 'success');
  },

  exportOwnerCSV() {
    let csv = 'sep=,\n';
    const all = StorageManager.getTransactions();

    if (this.currentMode === 'daily') {
      csv += `"No","Waktu","ID","Tipe","Kategori","Shift","Keterangan / Rincian","Metode","Nominal (Rp)"\n`;
      const targetDateStr = this.selectedDate;
      const dayTrx = all.filter(t => t.date && t.date.slice(0, 10) === targetDateStr);

      dayTrx.forEach((t, idx) => {
        const timeStr = t.date ? new Date(t.date).toLocaleTimeString('id-ID') : '-';
        const desc = (t.description || (t.items ? t.items.map(i => `${i.quantity}x ${i.name}`).join('; ') : '-')).replace(/"/g, '""');
        csv += `"${idx + 1}","${timeStr}","${t.id || ''}","${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}","${t.category || ''}","${t.shift || ''}","${desc}","${t.paymentMethod || 'Tunai'}","${t.amount || 0}"\n`;
      });
    } else if (this.currentMode === 'monthly') {
      csv += `"Tanggal","Pemasukan (Rp)","Pengeluaran (Rp)","Laba Bersih (Rp)","Jumlah Transaksi"\n`;
      const year = this.selectedYear;
      const month = this.selectedMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        let dIn = 0;
        let dOut = 0;
        let dCount = 0;
        all.forEach(t => {
          if (!t.date) return;
          const dt = new Date(t.date);
          if (dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === d) {
            dCount++;
            if (t.type === 'income') dIn += Number(t.amount || 0);
            else dOut += Number(t.amount || 0);
          }
        });
        csv += `"${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}","${dIn}","${dOut}","${dIn - dOut}","${dCount}"\n`;
      }
    } else {
      csv += `"Bulan","Pemasukan (Rp)","Pengeluaran (Rp)","Laba Bersih (Rp)","Jumlah Transaksi"\n`;
      const year = this.selectedYear;
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

      for (let m = 0; m < 12; m++) {
        let mIn = 0;
        let mOut = 0;
        let mCount = 0;
        all.forEach(t => {
          if (!t.date) return;
          const dt = new Date(t.date);
          if (dt.getFullYear() === year && dt.getMonth() === m) {
            mCount++;
            if (t.type === 'income') mIn += Number(t.amount || 0);
            else mOut += Number(t.amount || 0);
          }
        });
        csv += `"${months[m]} ${year}","${mIn}","${mOut}","${mIn - mOut}","${mCount}"\n`;
      }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIALOG-COFFEE-Rekap-Owner-${this.currentMode}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.App) App.showToast('Berkas CSV Rekap Owner berhasil diunduh.', 'success');
  }
};

window.OwnerModule = OwnerModule;

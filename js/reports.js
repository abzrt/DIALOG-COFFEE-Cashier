/**
 * DIALOG COFFEE Cashier - Reports & Analytics Module
 * Provides date-range filtering, trend charts with Chart.js, and export triggers.
 */

const ReportsModule = {
  currentPeriodPreset: 'this_month',
  chartInstanceTrend: null,
  chartInstanceDonut: null,

  init() {
    this.bindEvents();
    this.renderAll();
  },

  bindEvents() {
    const periodSelect = document.getElementById('reportPeriodSelect');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        this.currentPeriodPreset = e.target.value;
        const customWrapper = document.getElementById('customDateRangeWrapper');
        if (customWrapper) {
          customWrapper.style.display = this.currentPeriodPreset === 'custom' ? 'flex' : 'none';
        }
        this.renderAll();
      });
    }

    const startDateInput = document.getElementById('reportCustomStart');
    const endDateInput = document.getElementById('reportCustomEnd');
    if (startDateInput && endDateInput) {
      startDateInput.addEventListener('change', () => this.renderAll());
      endDateInput.addEventListener('change', () => this.renderAll());
    }
  },

  getTransactionsForPeriod() {
    const all = StorageManager.getTransactions();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return all.filter(t => {
      const d = new Date(t.date);

      switch (this.currentPeriodPreset) {
        case 'today':
          return d >= startOfToday;
        case 'yesterday': {
          const yestStart = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
          return d >= yestStart && d < startOfToday;
        }
        case '7days': {
          const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= sevenDaysAgo;
        }
        case 'this_month': {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return d >= startOfMonth;
        }
        case 'last_month': {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          return d >= startOfLastMonth && d <= endOfLastMonth;
        }
        case 'custom': {
          const startVal = document.getElementById('reportCustomStart').value;
          const endVal = document.getElementById('reportCustomEnd').value;
          if (startVal && d < new Date(startVal + 'T00:00:00')) return false;
          if (endVal && d > new Date(endVal + 'T23:59:59')) return false;
          return true;
        }
        case 'all':
        default:
          return true;
      }
    });
  },

  getPeriodLabel() {
    const sel = document.getElementById('reportPeriodSelect');
    if (!sel) return 'Periode Laporan';
    if (this.currentPeriodPreset === 'custom') {
      const s = document.getElementById('reportCustomStart').value || 'Awal';
      const e = document.getElementById('reportCustomEnd').value || 'Sekarang';
      return `Custom (${s} s/d ${e})`;
    }
    return sel.options[sel.selectedIndex]?.text || 'Bulan Ini';
  },

  renderAll() {
    const transactions = this.getTransactionsForPeriod();
    this.renderKPIs(transactions);
    this.renderCharts(transactions);
    this.renderTopProducts(transactions);
  },

  renderKPIs(transactions) {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount || 0);
      else expense += Number(t.amount || 0);
    });
    const net = income - expense;

    const repIncome = document.getElementById('reportTotalIncome');
    const repExpense = document.getElementById('reportTotalExpense');
    const repNet = document.getElementById('reportNetProfit');
    const repCount = document.getElementById('reportTotalCount');

    if (repIncome) repIncome.textContent = App.formatRupiah(income);
    if (repExpense) repExpense.textContent = App.formatRupiah(expense);
    if (repNet) {
      repNet.textContent = (net < 0 ? '-' : '+') + App.formatRupiah(Math.abs(net));
      repNet.style.color = net >= 0 ? 'var(--income-green)' : 'var(--expense-red)';
    }
    if (repCount) repCount.textContent = `${transactions.length} Transaksi`;
  },

  renderCharts(transactions) {
    if (!window.Chart) return;

    // 1. Trend Chart (Daily aggregation)
    const dailyMap = {};
    transactions.forEach(t => {
      const dKey = t.date.split('T')[0];
      if (!dailyMap[dKey]) dailyMap[dKey] = { income: 0, expense: 0 };
      if (t.type === 'income') dailyMap[dKey].income += Number(t.amount || 0);
      else dailyMap[dKey].expense += Number(t.amount || 0);
    });

    const sortedDates = Object.keys(dailyMap).sort();
    const labels = sortedDates.map(d => {
      const parts = d.split('-');
      return `${parts[2]}/${parts[1]}`;
    });
    const incomeData = sortedDates.map(d => dailyMap[d].income);
    const expenseData = sortedDates.map(d => dailyMap[d].expense);

    const canvasTrend = document.getElementById('trendChartCanvas');
    if (canvasTrend) {
      if (this.chartInstanceTrend) this.chartInstanceTrend.destroy();

      this.chartInstanceTrend = new Chart(canvasTrend, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['Belum ada data'],
          datasets: [
            {
              label: 'Pemasukan (Rp)',
              data: incomeData.length > 0 ? incomeData : [0],
              backgroundColor: 'rgba(34, 197, 94, 0.75)',
              borderColor: '#22c55e',
              borderWidth: 1,
              borderRadius: 6
            },
            {
              label: 'Pengeluaran (Rp)',
              data: expenseData.length > 0 ? expenseData : [0],
              backgroundColor: 'rgba(239, 68, 68, 0.75)',
              borderColor: '#ef4444',
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#b8aea3', font: { family: 'Plus Jakarta Sans', size: 11 } }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#7e7367' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#7e7367',
                callback: function(val) {
                  return 'Rp ' + (val / 1000).toLocaleString('id-ID') + 'k';
                }
              }
            }
          }
        }
      });
    }

    // 2. Expense Category Donut Chart
    const expCategories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Lain-lain';
      expCategories[cat] = (expCategories[cat] || 0) + Number(t.amount || 0);
    });

    const catLabels = Object.keys(expCategories);
    const catData = Object.values(expCategories);

    const canvasDonut = document.getElementById('categoryDonutCanvas');
    if (canvasDonut) {
      if (this.chartInstanceDonut) this.chartInstanceDonut.destroy();

      const palette = ['#c59b6d', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

      this.chartInstanceDonut = new Chart(canvasDonut, {
        type: 'doughnut',
        data: {
          labels: catLabels.length > 0 ? catLabels : ['Belum ada pengeluaran'],
          datasets: [{
            data: catData.length > 0 ? catData : [1],
            backgroundColor: catLabels.length > 0 ? palette.slice(0, catLabels.length) : ['#382c23'],
            borderWidth: 2,
            borderColor: '#181410'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#b8aea3', font: { family: 'Plus Jakarta Sans', size: 10 }, boxWidth: 12 }
            }
          },
          cutout: '68%'
        }
      });
    }
  },

  renderTopProducts(transactions) {
    const container = document.getElementById('topProductsContainer');
    if (!container) return;

    const productMap = {};
    transactions.filter(t => t.type === 'income' && t.items && t.items.length > 0).forEach(t => {
      t.items.forEach(it => {
        if (!productMap[it.name]) productMap[it.name] = { qty: 0, revenue: 0 };
        productMap[it.name].qty += it.qty;
        productMap[it.name].revenue += (it.subtotal || it.qty * it.price);
      });
    });

    const sorted = Object.entries(productMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    if (sorted.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem;">Belum ada data penjualan produk pada periode ini.</p>`;
      return;
    }

    container.innerHTML = sorted.map((p, i) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 800; color: var(--accent-gold); font-size: 0.85rem; width: 16px;">#${i + 1}</span>
          <span style="font-weight: 600; font-size: 0.85rem;">${p.name}</span>
        </div>
        <div style="text-align: right;">
          <span style="font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); font-size: 0.85rem;">${p.qty} terjual</span>
          <div style="font-size: 0.72rem; color: var(--accent-gold-light);">${App.formatRupiah(p.revenue)}</div>
        </div>
      </div>
    `).join('');
  },

  // TRIGGER EXPORTS
  triggerExportPDF() {
    const transactions = this.getTransactionsForPeriod();
    const periodLabel = this.getPeriodLabel();
    const filterType = document.getElementById('exportScopeFilter')?.value || 'all';

    let toExport = transactions;
    if (filterType !== 'all') {
      toExport = transactions.filter(t => t.type === filterType);
    }

    if (toExport.length === 0) {
      alert('Tidak ada transaksi untuk diekspor pada filter ini.');
      return;
    }

    App.playBeep(880, 0.08);
    PDFExporter.exportFinancialReport(toExport, {
      periodLabel: periodLabel,
      filterType: filterType
    });
    App.showToast('Laporan PDF berhasil diunduh!', 'success');
  },

  triggerExportWord() {
    const transactions = this.getTransactionsForPeriod();
    const periodLabel = this.getPeriodLabel();
    const filterType = document.getElementById('exportScopeFilter')?.value || 'all';

    let toExport = transactions;
    if (filterType !== 'all') {
      toExport = transactions.filter(t => t.type === filterType);
    }

    if (toExport.length === 0) {
      alert('Tidak ada transaksi untuk diekspor pada filter ini.');
      return;
    }

    App.playBeep(880, 0.08);
    WordExporter.exportToDocx(toExport, {
      periodLabel: periodLabel,
      filterType: filterType
    });
    App.showToast('Laporan Word (.docx) berhasil dibuat!', 'success');
  },

  triggerExportCSV() {
    const transactions = this.getTransactionsForPeriod();
    if (transactions.length === 0) {
      alert('Tidak ada transaksi untuk diekspor.');
      return;
    }

    let csvContent = 'No,Tanggal,ID Nota,Tipe,Kategori,Keterangan,Metode Pembayaran,Pemasukan,Pengeluaran,Kasir\n';

    transactions.forEach((t, i) => {
      const isIncome = t.type === 'income';
      const itemsDetail = t.items && t.items.length > 0 ? t.items.map(x => `${x.name} (x${x.qty})`).join('; ') : '';
      const fullDesc = itemsDetail ? `${t.description || ''} [Item: ${itemsDetail}]` : (t.description || '');
      const cleanDesc = `"${fullDesc.replace(/"/g, '""')}"`;
      const cleanCat = `"${(t.category || '').replace(/"/g, '""')}"`;

      csvContent += `${i + 1},${t.date},${t.id},${isIncome ? 'PEMASUKAN' : 'PENGELUARAN'},${cleanCat},${cleanDesc},${t.paymentMethod || 'Tunai'},${isIncome ? t.amount : 0},${!isIncome ? t.amount : 0},"${t.cashier || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `Laporan_DIALOG_COFFEE_${new Date().toISOString().split('T')[0]}.csv`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 1500);

    App.showToast('Laporan CSV berhasil diunduh!', 'success');
  }
};

window.ReportsModule = ReportsModule;

/**
 * DIALOG COFFEE Cashier - PDF Export Module
 * Generates executive-ready PDF financial reports and receipts using jsPDF and jspdf-autotable.
 */

const PDFExporter = {
  formatRupiah(number) {
    return 'Rp ' + Number(number || 0).toLocaleString('id-ID');
  },

  formatDateTime(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatDateOnly(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  },

  /**
   * Export comprehensive financial report to PDF
   * @param {Array} transactions 
   * @param {Object} options { title, periodLabel, cashierName, settings }
   */
  async exportFinancialReport(transactions, options = {}) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert('Pustaka jsPDF belum termuat. Harap periksa koneksi atau berkas libs.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const settings = options.settings || StorageManager.getSettings();
    const periodLabel = options.periodLabel || 'Semua Periode';
    const cashierName = options.cashierName || settings.activeCashier;
    const filterType = options.filterType || 'all';

    // Perhitungan Total
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income') {
        totalIncome += amt;
        incomeCount++;
      } else {
        totalExpense += amt;
        expenseCount++;
      }
    });

    const netProfit = totalIncome - totalExpense;

    // Palette Warna Brand Dialog Coffee (Black & White Minimalist)
    const primaryColor = [18, 18, 20]; // Sleek Jet Black (#121214)
    const accentColor = [50, 50, 55]; // Charcoal accent
    const grayBg = [245, 245, 247];
    const textDark = [20, 20, 22];
    const textMuted = [100, 100, 105];
    const greenColor = [21, 128, 61];
    const redColor = [185, 28, 28];

    // 1. KOP SURAT & BRAND HEADER
    // Background banner header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 38, 'F');

    // Accent line
    doc.setFillColor(...accentColor);
    doc.rect(0, 38, 210, 2, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(settings.cafeName.toUpperCase(), 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text(settings.tagline, 14, 23);
    doc.text(`${settings.address} | WA Owner: ${settings.ownerPhone || '085334101996'}`, 14, 29);

    // Document Title Badge (Right Side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('LAPORAN KASIR & KEUANGAN', 196, 17, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(200, 200, 200);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 196, 24, { align: 'right' });
    doc.text(`Petugas: ${cashierName}`, 196, 30, { align: 'right' });


    // 2. METADATA & PERIODE BANNER
    let curY = 46;
    doc.setFillColor(...grayBg);
    doc.roundedRect(14, curY, 182, 12, 2, 2, 'F');
    doc.setDrawColor(220, 215, 210);
    doc.roundedRect(14, curY, 182, 12, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...textDark);
    doc.text(`Periode Laporan:`, 18, curY + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.text(periodLabel, 48, curY + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.text(`Filter Tipe:`, 120, curY + 7.5);
    doc.setFont('helvetica', 'normal');
    const filterText = filterType === 'income' ? 'Hanya Pemasukan' : filterType === 'expense' ? 'Hanya Pengeluaran' : 'Semua Transaksi (Pemasukan & Pengeluaran)';
    doc.text(filterText, 142, curY + 7.5);

    // 3. EXECUTIVE SUMMARY BOXES (KPI CARDS)
    curY += 16;
    const boxW = 43;
    const boxH = 22;
    const gap = 3.3;

    // Box 1: Total Pemasukan
    doc.setFillColor(240, 253, 244); // light green
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, curY, boxW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('TOTAL PEMASUKAN', 18, curY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(21, 128, 61);
    doc.text(this.formatRupiah(totalIncome), 18, curY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`${incomeCount} transaksi masuk`, 18, curY + 18);

    // Box 2: Total Pengeluaran
    const box2X = 14 + boxW + gap;
    doc.setFillColor(254, 242, 242); // light red
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(box2X, curY, boxW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text('TOTAL PENGELUARAN', box2X + 4, curY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28);
    doc.text(this.formatRupiah(totalExpense), box2X + 4, curY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`${expenseCount} transaksi keluar`, box2X + 4, curY + 18);

    // Box 3: Laba / Rugi Bersih
    const box3X = box2X + boxW + gap;
    doc.setFillColor(255, 251, 235); // light amber
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(box3X, curY, boxW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text('LABA / (RUGI) BERSIH', box3X + 4, curY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(netProfit >= 0 ? 21 : 185, netProfit >= 0 ? 128 : 28, netProfit >= 0 ? 61 : 28);
    doc.text((netProfit < 0 ? '-' : '+') + this.formatRupiah(Math.abs(netProfit)), box3X + 4, curY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(netProfit >= 0 ? 'Surplus Operasional' : 'Defisit Operasional', box3X + 4, curY + 18);

    // Box 4: Total Transaksi
    const box4X = box3X + boxW + gap;
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(box4X, curY, boxW, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text('TOTAL TRANSAKSI', box4X + 4, curY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text(`${transactions.length} Data`, box4X + 4, curY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Tercatat di sistem`, box4X + 4, curY + 18);

    // 4. TABEL TRANSAKSI DETAIL
    curY += 28;

    const tableRows = transactions.map((t, index) => {
      const isIncome = t.type === 'income';
      const itemsDetail = t.items && t.items.length > 0
        ? t.items.map(i => `${i.name} (x${i.qty})`).join(', ')
        : '';
      const fullDesc = itemsDetail ? `${t.description || '-'} [Item: ${itemsDetail}]` : (t.description || '-');

      return [
        (index + 1).toString(),
        PDFExporter.formatDateTime(t.date),
        t.id,
        isIncome ? 'PEMASUKAN' : 'PENGELUARAN',
        t.category || '-',
        fullDesc,
        t.paymentMethod || 'Tunai',
        isIncome ? PDFExporter.formatRupiah(t.amount) : '-',
        !isIncome ? PDFExporter.formatRupiah(t.amount) : '-'
      ];
    });

    doc.autoTable({
      startY: curY,
      head: [[
        'No',
        'Tanggal & Jam',
        'ID / Nota',
        'Tipe',
        'Kategori',
        'Keterangan & Rincian',
        'Metode',
        'Masuk',
        'Keluar'
      ]],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: textDark,
        valign: 'middle',
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 24 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        4: { cellWidth: 22 },
        5: { cellWidth: 42 },
        6: { halign: 'center', cellWidth: 16 },
        7: { halign: 'right', cellWidth: 20, textColor: [21, 128, 61], fontStyle: 'bold' },
        8: { halign: 'right', cellWidth: 20, textColor: [185, 28, 28], fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.section === 'body') {
          if (data.column.index === 3) {
            if (data.cell.raw === 'PEMASUKAN') {
              data.cell.styles.textColor = [21, 128, 61];
            } else {
              data.cell.styles.textColor = [185, 28, 28];
            }
          }
        }
      },
      foot: [[
        { content: 'TOTAL KESELURUHAN', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8.5 } },
        { content: this.formatRupiah(totalIncome), styles: { halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61], fontSize: 8.5 } },
        { content: this.formatRupiah(totalExpense), styles: { halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28], fontSize: 8.5 } }
      ]],
      footStyles: {
        fillColor: [243, 244, 246]
      },
      margin: { left: 14, right: 14, bottom: 35 }
    });

    // 5. KOLOM TANDA TANGAN / PENGESAHAN (SIGNATURE BLOCK)
    let finalY = doc.lastAutoTable.finalY + 10;
    if (finalY > 245) {
      doc.addPage();
      finalY = 25;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);

    // Kiri: Dibuat oleh Kasir
    doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 25, finalY);
    doc.text('Dibuat & Divalidasi Oleh,', 25, finalY + 5);
    doc.text('( Kasir / Barista On Duty )', 25, finalY + 26);
    doc.setFont('helvetica', 'bold');
    doc.text(cashierName, 25, finalY + 31);
    doc.setDrawColor(150, 150, 150);
    doc.line(25, finalY + 27, 75, finalY + 27);

    // Kanan: Disetujui oleh Owner / Store Manager
    doc.setFont('helvetica', 'normal');
    doc.text('Mengetahui & Menyetujui,', 140, finalY + 5);
    doc.text('( Store Manager / Owner )', 140, finalY + 26);
    doc.setFont('helvetica', 'bold');
    doc.text('Rian Hidayat, S.E.', 140, finalY + 31);
    doc.setDrawColor(150, 150, 150);
    doc.line(140, finalY + 27, 190, finalY + 27);

    // 6. FOOTER NUMBERING
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...textMuted);
      doc.text(
        `DIALOG COFFEE Financial Ledger • Dokumen Resmi Kasir • Dicetak otomatis pada sistem`,
        14,
        290
      );
      doc.text(
        `Halaman ${i} dari ${pageCount}`,
        196,
        290,
        { align: 'right' }
      );
    }

    // Save PDF file
    const safeDate = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Keuangan_DIALOG_COFFEE_${safeDate}.pdf`;
    doc.save(filename);
    return filename;
  },

  /**
   * Export individual transaction receipt to printable PDF
   * Supports thermal roll format (80mm width) with dynamic height based on item count.
   * If user has no physical printer, this generates an exact digital replica of the receipt.
   */
  async exportReceiptPDF(trx, settings) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert('Pustaka jsPDF belum termuat. Harap periksa koneksi atau berkas libs.');
      return;
    }

    const set = settings || StorageManager.getSettings();
    const items = trx.items || [];
    const itemCount = items.length > 0 ? items.length : 1;
    const footerLines = (set.receiptFooter || 'Terima Kasih Atas Kunjungan Anda\nFollow IG: @dialogcoffee').split('\n').filter(Boolean);

    // Calculate dynamic receipt height in mm:
    // Header & Meta: ~55mm, Items: ~9mm per item, Totals/Pay: ~36mm, Footer: ~5mm per line + 15mm padding
    const dynamicHeight = Math.max(130, 55 + (itemCount * 9) + 36 + (footerLines.length * 5) + 15);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, dynamicHeight]
    });

    // 1. BRAND HEADER
    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text((set.cafeName || 'DIALOG COFFEE').toUpperCase(), 40, 10, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(set.tagline || 'Authentic Artisan Coffee & Roastery', 40, 14.5, { align: 'center' });

    // Address (wrap text if long)
    const addressLines = doc.splitTextToSize(set.address || 'Jl. Melati No. 45, Jakarta Selatan', 70);
    doc.text(addressLines, 40, 18.5, { align: 'center' });
    let curY = 18.5 + (addressLines.length * 3.5);

    doc.setFontSize(7);
    doc.text(`WA Owner: ${set.ownerPhone || '085334101996'}`, 40, curY, { align: 'center' });
    curY += 3.5;

    // Dashed divider line
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(0, 0, 0);
    doc.line(5, curY, 75, curY);
    curY += 4.5;

    // 2. TRANSACTION METADATA
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`No. Nota : ${trx.id}`, 6, curY); curY += 4;
    doc.text(`Waktu    : ${PDFExporter.formatDateTime(trx.date)}`, 6, curY); curY += 4;
    doc.text(`Shift    : ${trx.shift || set.activeShift || 'Shift 1'}`, 6, curY); curY += 4;
    doc.text(`Barista  : ${trx.baristas || `${set.activeBarista1 || 'Ardi'} & ${set.activeBarista2 || 'Anca'}`}`, 6, curY); curY += 4;
    doc.text(`Metode   : ${trx.paymentMethod || 'Tunai'}`, 6, curY); curY += 4;

    doc.line(5, curY, 75, curY);
    curY += 4.5;

    // 3. PURCHASED ITEMS
    if (items.length > 0) {
      items.forEach(it => {
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.text(`${it.name}`, 6, curY);
        curY += 3.8;

        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        const itemLine = `${it.qty} x ${PDFExporter.formatRupiah(it.price)}`;
        doc.text(itemLine, 9, curY);
        doc.text(PDFExporter.formatRupiah(it.subtotal || it.qty * it.price), 74, curY, { align: 'right' });
        curY += 4.5;
      });
    } else {
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.text(trx.description || trx.category || 'Penjualan Kasir', 6, curY);
      curY += 4;
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text(PDFExporter.formatRupiah(trx.amount), 74, curY, { align: 'right' });
      curY += 5;
    }

    doc.line(5, curY, 75, curY);
    curY += 4.5;

    // 4. SUBTOTAL & TAX (PB1) & TOTAL
    if (trx.subtotal) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text('Subtotal:', 6, curY);
      doc.text(PDFExporter.formatRupiah(trx.subtotal), 74, curY, { align: 'right' });
      curY += 4;
    }

    if (trx.tax) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text('Pajak PB1 (10%):', 6, curY);
      doc.text(PDFExporter.formatRupiah(trx.tax), 74, curY, { align: 'right' });
      curY += 4;
    }

    // GRAND TOTAL
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.text('TOTAL:', 6, curY);
    doc.text(PDFExporter.formatRupiah(trx.amount), 74, curY, { align: 'right' });
    curY += 5.5;

    // CASH TENDERED & CHANGE
    if (trx.paymentMethod === 'Tunai' || trx.cashTendered) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text('Tunai:', 6, curY);
      doc.text(PDFExporter.formatRupiah(trx.cashTendered || trx.amount), 74, curY, { align: 'right' });
      curY += 4;

      doc.text('Kembalian:', 6, curY);
      doc.text(PDFExporter.formatRupiah(trx.change || 0), 74, curY, { align: 'right' });
      curY += 4.5;
    }

    doc.line(5, curY, 75, curY);
    curY += 5;

    // 5. FOOTER
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    footerLines.forEach(line => {
      doc.text(line, 40, curY, { align: 'center' });
      curY += 3.8;
    });

    const filename = `Struk_DIALOG_COFFEE_${trx.id}.pdf`;
    doc.save(filename);

    if (window.App && App.showToast) {
      App.showToast(`Struk ${trx.id} berhasil disimpan sebagai file PDF!`, 'success', 3500);
    }
    return filename;
  }
};

window.PDFExporter = PDFExporter;

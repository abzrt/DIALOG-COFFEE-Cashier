/**
 * DIALOG COFFEE Cashier - Microsoft Word (.docx & .doc) Export Module
 * Generates formatted Word documents using JSZip (native .docx) with tables, styled headers, and metadata.
 */

const WordExporter = {
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

  escapeXml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  /**
   * Export to native Microsoft Word (.docx) using OpenXML and JSZip
   */
  async exportToDocx(transactions, options = {}) {
    if (!window.JSZip) {
      alert('Pustaka JSZip belum termuat. Mencoba menggunakan metode Word alternatif.');
      this.exportToHtmlDoc(transactions, options);
      return;
    }

    const zip = new window.JSZip();
    const settings = options.settings || StorageManager.getSettings();
    const periodLabel = options.periodLabel || 'Semua Periode';
    const cashierName = options.cashierName || settings.activeCashier;
    const filterType = options.filterType || 'all';

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

    // 1. [Content_Types].xml
    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

    // 2. _rels/.rels
    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    // 3. word/_rels/document.xml.rels
    const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    // 4. word/styles.xml
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="21"/>
        <w:color w:val="231F20"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

    // Helper functions for Word XML elements
    const p = (text, opts = {}) => {
      const bold = opts.bold ? '<w:b/>' : '';
      const italic = opts.italic ? '<w:i/>' : '';
      const sz = opts.sz ? `<w:sz w:val="${opts.sz}"/>` : '';
      const color = opts.color ? `<w:color w:val="${opts.color}"/>` : '';
      const jc = opts.align ? `<w:jc w:val="${opts.align}"/>` : '';
      const space = opts.space ? `<w:spacing w:before="${opts.space.before || 0}" w:after="${opts.space.after || 100}"/>` : '';
      return `<w:p><w:pPr>${jc}${space}</w:pPr><w:r><w:rPr>${bold}${italic}${sz}${color}</w:rPr><w:t xml:space="preserve">${this.escapeXml(text)}</w:t></w:r></w:p>`;
    };

    const cell = (content, opts = {}) => {
      const bg = opts.bg ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.bg}"/>` : '';
      const width = opts.w ? `<w:tcW w:w="${opts.w}" w:type="dxa"/>` : '';
      const align = opts.align ? opts.align : 'left';
      const bold = opts.bold ? '<w:b/>' : '';
      const color = opts.color ? `<w:color w:val="${opts.color}"/>` : '';
      const sz = opts.sz ? `<w:sz w:val="${opts.sz}"/>` : '<w:sz w:val="18"/>';
      
      const tcBorders = `<w:tcBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
      </w:tcBorders>`;

      return `<w:tc>
        <w:tcPr>${width}${bg}${tcBorders}<w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar></w:tcPr>
        <w:p>
          <w:pPr><w:jc w:val="${align}"/><w:spacing w:after="0" w:before="0"/></w:pPr>
          <w:r><w:rPr>${bold}${color}${sz}</w:rPr><w:t xml:space="preserve">${this.escapeXml(content)}</w:t></w:r>
        </w:p>
      </w:tc>`;
    };

    // Build Table Rows for Transactions
    let tableRowsXml = ``;

    // Table Header
    tableRowsXml += `<w:tr>
      <w:trPr><w:tblHeader/></w:trPr>
      ${cell('No', { bg: '38220F', color: 'FFFFFF', bold: true, align: 'center', w: 500, sz: 18 })}
      ${cell('Tanggal & Jam', { bg: '38220F', color: 'FFFFFF', bold: true, align: 'center', w: 1600, sz: 18 })}
      ${cell('No. Nota', { bg: '38220F', color: 'FFFFFF', bold: true, align: 'center', w: 1200, sz: 18 })}
      ${cell('Tipe', { bg: '38220F', color: 'FFFFFF', bold: true, align: 'center', w: 1200, sz: 18 })}
      ${cell('Kategori', { bg: '38220F', color: 'FFFFFF', bold: true, align: 'left', w: 1500, sz: 18 })}
      ${cell('Keterangan & Rincian Item', { bg: '38220F', color: 'FFFFFF', bold: true, align: 'left', w: 3000, sz: 18 })}
      ${cell('Metode', { bg: '38220F', color: 'FFFFFF', bold: true, align: 'center', w: 1100, sz: 18 })}
      ${cell('Pemasukan (Rp)', { bg: '38220F', color: 'FFFFFF', bold: true, align: 'right', w: 1400, sz: 18 })}
      ${cell('Pengeluaran (Rp)', { bg: '38220F', color: 'FFFFFF', bold: true, align: 'right', w: 1400, sz: 18 })}
    </w:tr>`;

    transactions.forEach((t, idx) => {
      const isIncome = t.type === 'income';
      const itemsDetail = t.items && t.items.length > 0
        ? t.items.map(i => `${i.name} (x${i.qty})`).join(', ')
        : '';
      const fullDesc = itemsDetail ? `${t.description || '-'} [Item: ${itemsDetail}]` : (t.description || '-');
      const rowBg = idx % 2 === 1 ? 'F9FAFB' : 'FFFFFF';

      tableRowsXml += `<w:tr>
        ${cell(String(idx + 1), { bg: rowBg, align: 'center', w: 500 })}
        ${cell(this.formatDateTime(t.date), { bg: rowBg, align: 'center', w: 1600 })}
        ${cell(t.id, { bg: rowBg, align: 'center', w: 1200 })}
        ${cell(isIncome ? 'PEMASUKAN' : 'PENGELUARAN', { bg: rowBg, color: isIncome ? '15803D' : 'B91C1C', bold: true, align: 'center', w: 1200 })}
        ${cell(t.category || '-', { bg: rowBg, w: 1500 })}
        ${cell(fullDesc, { bg: rowBg, w: 3000 })}
        ${cell(t.paymentMethod || 'Tunai', { bg: rowBg, align: 'center', w: 1100 })}
        ${cell(isIncome ? this.formatRupiah(t.amount) : '-', { bg: rowBg, color: '15803D', bold: isIncome, align: 'right', w: 1400 })}
        ${cell(!isIncome ? this.formatRupiah(t.amount) : '-', { bg: rowBg, color: 'B91C1C', bold: !isIncome, align: 'right', w: 1400 })}
      </w:tr>`;
    });

    // Foot Row
    tableRowsXml += `<w:tr>
      ${cell('TOTAL KESELURUHAN', { bg: 'F3F4F6', bold: true, align: 'right', w: 10100, sz: 19 })}
      ${cell(this.formatRupiah(totalIncome), { bg: 'F3F4F6', color: '15803D', bold: true, align: 'right', w: 1400, sz: 19 })}
      ${cell(this.formatRupiah(totalExpense), { bg: 'F3F4F6', color: 'B91C1C', bold: true, align: 'right', w: 1400, sz: 19 })}
    </w:tr>`;

    // Build Word Document XML
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- BRAND HEADER -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="40"/><w:color w:val="38220F"/></w:rPr><w:t>${this.escapeXml(settings.cafeName)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="40"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="78716C"/></w:rPr><w:t>${this.escapeXml(settings.tagline)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="160"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="18"/><w:color w:val="8C7B70"/></w:rPr><w:t>${this.escapeXml(settings.address)} | Telp: ${this.escapeXml(settings.phone)}</w:t></w:r>
    </w:p>

    <!-- HORIZONTAL DIVIDER LINE -->
    <w:p>
      <w:pPr><w:pBdr><w:bottom w:val="single" w:sz="18" w:space="1" w:color="C59B6D"/></w:pPr><w:spacing w:after="240"/></w:pPr>
    </w:p>

    <!-- TITLE -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F2937"/></w:rPr><w:t>LAPORAN DETAIL KASIR &amp; ARUS KAS KEUANGAN</w:t></w:r>
    </w:p>

    <!-- METADATA BOX -->
    <w:tbl>
      <w:tblPr><w:tblW w:w="12900" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="E5E7EB"/><w:left w:val="single" w:sz="4" w:color="E5E7EB"/><w:bottom w:val="single" w:sz="4" w:color="E5E7EB"/><w:right w:val="single" w:sz="4" w:color="E5E7EB"/></w:tblBorders></w:tblPr>
      <w:tr>
        ${cell('Periode Laporan:', { bg: 'F9FAFB', bold: true, w: 2200 })}
        ${cell(periodLabel, { bg: 'FFFFFF', w: 4250 })}
        ${cell('Tanggal Dicetak:', { bg: 'F9FAFB', bold: true, w: 2200 })}
        ${cell(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), { bg: 'FFFFFF', w: 4250 })}
      </w:tr>
      <w:tr>
        ${cell('Kasir / Petugas:', { bg: 'F9FAFB', bold: true, w: 2200 })}
        ${cell(cashierName, { bg: 'FFFFFF', w: 4250 })}
        ${cell('Filter Tipe:', { bg: 'F9FAFB', bold: true, w: 2200 })}
        ${cell(filterType === 'income' ? 'Pemasukan Saja' : filterType === 'expense' ? 'Pengeluaran Saja' : 'Semua Transaksi', { bg: 'FFFFFF', w: 4250 })}
      </w:tr>
    </w:tbl>

    <w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>

    <!-- RINGKASAN KEUANGAN (KPI) -->
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="38220F"/></w:rPr><w:t>A. RINGKASAN EKSEKUTIF</w:t></w:r>
    </w:p>

    <w:tbl>
      <w:tblPr><w:tblW w:w="12900" w:type="dxa"/><w:jc w:val="center"/></w:tblPr>
      <w:tr>
        ${cell('Total Pemasukan', { bg: 'DCFCE7', bold: true, align: 'center', w: 3225 })}
        ${cell('Total Pengeluaran', { bg: 'FEE2E2', bold: true, align: 'center', w: 3225 })}
        ${cell('Laba / (Rugi) Bersih', { bg: 'FEF3C7', bold: true, align: 'center', w: 3225 })}
        ${cell('Total Transaksi', { bg: 'F3F4F6', bold: true, align: 'center', w: 3225 })}
      </w:tr>
      <w:tr>
        ${cell(this.formatRupiah(totalIncome), { bg: 'F0FDF4', color: '15803D', bold: true, align: 'center', sz: 24, w: 3225 })}
        ${cell(this.formatRupiah(totalExpense), { bg: 'FEF2F2', color: 'B91C1C', bold: true, align: 'center', sz: 24, w: 3225 })}
        ${cell((netProfit < 0 ? '-' : '+') + this.formatRupiah(Math.abs(netProfit)), { bg: 'FFFBEB', color: netProfit >= 0 ? '15803D' : 'B91C1C', bold: true, align: 'center', sz: 24, w: 3225 })}
        ${cell(`${transactions.length} Data (${incomeCount} Masuk, ${expenseCount} Keluar)`, { bg: 'FAFAFA', align: 'center', sz: 19, w: 3225 })}
      </w:tr>
    </w:tbl>

    <w:p><w:pPr><w:spacing w:after="200"/></w:pPr></w:p>

    <!-- RINCIAN TABEL TRANSAKSI -->
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="38220F"/></w:rPr><w:t>B. RINCIAN BUKU KAS TRANSAKSI LENGKAP</w:t></w:r>
    </w:p>

    <w:tbl>
      <w:tblPr><w:tblW w:w="12900" w:type="dxa"/><w:jc w:val="center"/></w:tblPr>
      ${tableRowsXml}
    </w:tbl>

    <w:p><w:pPr><w:spacing w:after="280"/></w:pPr></w:p>

    <!-- LEMBAR PENGESAHAN / TANDA TANGAN -->
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="38220F"/></w:rPr><w:t>C. PENGESAHAN LAPORAN</w:t></w:r>
    </w:p>

    <w:tbl>
      <w:tblPr><w:tblW w:w="12900" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tblBorders></w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="6450" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>Jakarta, ${this.escapeXml(this.formatDateOnly(new Date().toISOString()))}</w:t></w:r></w:p>
          <w:p><w:r><w:t>Dibuat &amp; Diverifikasi Oleh,</w:t></w:r></w:p>
          <w:p><w:pPr><w:spacing w:before="1000"/></w:pPr><w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>${this.escapeXml(cashierName)}</w:t></w:r></w:p>
          <w:p><w:r><w:rPr><w:i/></w:rPr><w:t>Kasir / Barista On Duty</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="6450" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>&#160;</w:t></w:r></w:p>
          <w:p><w:r><w:t>Mengetahui &amp; Menyetujui,</w:t></w:r></w:p>
          <w:p><w:pPr><w:spacing w:before="1000"/></w:pPr><w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>Rian Hidayat, S.E.</w:t></w:r></w:p>
          <w:p><w:r><w:rPr><w:i/></w:rPr><w:t>Store Manager / Owner DIALOG COFFEE</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <!-- SECTION PROPERTIES (Landscape or Portrait A4) -->
    <w:sectPr>
      <!-- A4 Landscape (16838 x 11906 dxa) for spacious financial table -->
      <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    zip.file('[Content_Types].xml', contentTypesXml);
    zip.folder('_rels').file('.rels', relsXml);
    const wordFolder = zip.folder('word');
    wordFolder.file('document.xml', documentXml);
    wordFolder.file('styles.xml', stylesXml);
    wordFolder.folder('_rels').file('document.xml.rels', docRelsXml);

    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const safeDate = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Keuangan_DIALOG_COFFEE_${safeDate}.docx`;

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    }, 1500);

    return filename;
  },

  /**
   * Export to HTML-based Word document (.doc) as complementary/fallback option
   */
  exportToHtmlDoc(transactions, options = {}) {
    const settings = options.settings || StorageManager.getSettings();
    const periodLabel = options.periodLabel || 'Semua Periode';
    const cashierName = options.cashierName || settings.activeCashier;

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += Number(t.amount || 0);
      else totalExpense += Number(t.amount || 0);
    });
    const netProfit = totalIncome - totalExpense;

    let rowsHtml = '';
    transactions.forEach((t, i) => {
      const isIncome = t.type === 'income';
      const itemsDetail = t.items && t.items.length > 0 ? t.items.map(x => `${x.name} (x${x.qty})`).join(', ') : '';
      const fullDesc = itemsDetail ? `${t.description || '-'} [Item: ${itemsDetail}]` : (t.description || '-');

      rowsHtml += `<tr>
        <td style="text-align:center;">${i + 1}</td>
        <td style="text-align:center;">${this.formatDateTime(t.date)}</td>
        <td style="text-align:center;">${t.id}</td>
        <td style="text-align:center; font-weight:bold; color:${isIncome ? '#15803d' : '#b91c1c'};">${isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}</td>
        <td>${t.category || '-'}</td>
        <td>${fullDesc}</td>
        <td style="text-align:center;">${t.paymentMethod || 'Tunai'}</td>
        <td style="text-align:right; font-weight:bold; color:#15803d;">${isIncome ? this.formatRupiah(t.amount) : '-'}</td>
        <td style="text-align:right; font-weight:bold; color:#b91c1c;">${!isIncome ? this.formatRupiah(t.amount) : '-'}</td>
      </tr>`;
    });

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Laporan DIALOG COFFEE</title>
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1f2937; }
          .header { text-align: center; border-bottom: 3px solid #c59b6d; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 24pt; font-weight: bold; color: #38220f; margin: 0; }
          .subtitle { font-size: 11pt; color: #78716c; margin: 4px 0; }
          .meta-table, .data-table, .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .data-table th, .data-table td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 9.5pt; }
          .data-table th { background-color: #38220f; color: #ffffff; text-align: center; }
          .kpi-table td { padding: 10px; border: 1px solid #e5e7eb; text-align: center; }
          .kpi-title { font-size: 8.5pt; color: #6b7280; font-weight: bold; }
          .kpi-val { font-size: 13pt; font-weight: bold; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${settings.cafeName}</div>
          <div class="subtitle">${settings.tagline}</div>
          <div class="subtitle">${settings.address} | Telp: ${settings.phone}</div>
        </div>
        <h2 style="text-align:center; color:#1f2937;">LAPORAN KEUANGAN KASIR</h2>
        <p><strong>Periode:</strong> ${periodLabel} | <strong>Dicetak:</strong> ${new Date().toLocaleString('id-ID')} | <strong>Kasir:</strong> ${cashierName}</p>
        
        <table class="kpi-table">
          <tr>
            <td style="background:#f0fdf4;"><div class="kpi-title">TOTAL PEMASUKAN</div><div class="kpi-val" style="color:#15803d;">${this.formatRupiah(totalIncome)}</div></td>
            <td style="background:#fef2f2;"><div class="kpi-title">TOTAL PENGELUARAN</div><div class="kpi-val" style="color:#b91c1c;">${this.formatRupiah(totalExpense)}</div></td>
            <td style="background:#fffbeb;"><div class="kpi-title">LABA / (RUGI) BERSIH</div><div class="kpi-val" style="color:${netProfit >= 0 ? '#15803d' : '#b91c1c'};">${(netProfit < 0 ? '-' : '+') + this.formatRupiah(Math.abs(netProfit))}</div></td>
            <td style="background:#f9fafb;"><div class="kpi-title">TOTAL TRANSAKSI</div><div class="kpi-val">${transactions.length} Data</div></td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>No. Nota</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th>Keterangan</th>
              <th>Metode</th>
              <th>Pemasukan</th>
              <th>Pengeluaran</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background:#f3f4f6; font-weight:bold;">
              <td colspan="7" style="text-align:right;">TOTAL KESELURUHAN:</td>
              <td style="text-align:right; color:#15803d;">${this.formatRupiah(totalIncome)}</td>
              <td style="text-align:right; color:#b91c1c;">${this.formatRupiah(totalExpense)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const filename = `Laporan_DIALOG_COFFEE_${new Date().toISOString().split('T')[0]}.doc`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 1500);
  }
};

window.WordExporter = WordExporter;

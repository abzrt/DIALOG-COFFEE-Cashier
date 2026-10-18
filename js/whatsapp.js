/**
 * DIALOG COFFEE Cashier - WhatsApp Owner Notification Module
 * Sends formatted WhatsApp messages for Income, Expenses, and Shift Closing to owner (085334101996).
 */

const WhatsAppNotifier = {
  getOwnerPhone() {
    const s = StorageManager.getSettings();
    let phone = s.ownerPhone || '085334101996';
    // Format to 62...
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }
    return phone;
  },

  formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  },

  formatDateTime(iso) {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';
  },

  openWhatsApp(text) {
    const phone = this.getOwnerPhone();
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    
    // Copy to clipboard as convenient backup
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    window.open(url, '_blank');
  },

  /**
   * Notifikasi Pemasukan Kasir / Penjualan Baru
   */
  notifyIncome(trx) {
    const settings = StorageManager.getSettings();
    const shift = settings.activeShift || 'Shift 1';
    const baristas = `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'}`;

    let itemLines = '';
    if (trx.items && trx.items.length > 0) {
      itemLines = trx.items.map(i => `• ${i.name} (x${i.qty}) = ${this.formatRupiah(i.subtotal || i.qty * i.price)}`).join('\n');
    } else {
      itemLines = `• ${trx.description || trx.category}`;
    }

    const message = 
`☕ *DIALOG COFFEE - NOTIFIKASI PEMASUKAN*
━━━━━━━━━━━━━━━━━━━━
📅 *Waktu:* ${this.formatDateTime(trx.date)}
🧾 *No. Nota:* ${trx.id}
👥 *Shift:* ${shift} (${baristas})
💵 *Total Masuk:* *${this.formatRupiah(trx.amount)}*
💳 *Metode:* ${trx.paymentMethod || 'Tunai'}
${trx.cashTendered ? `💰 *Bayar Tunai:* ${this.formatRupiah(trx.cashTendered)} | *Kembalian:* ${this.formatRupiah(trx.change || 0)}\n` : ''}
📋 *Rincian Pesanan:*
${itemLines}
${trx.description && !trx.items?.length ? `📝 *Keterangan:* ${trx.description}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
*Status:* ✅ Transaksi Berhasil Dicatat`;

    this.openWhatsApp(message);
  },

  /**
   * Notifikasi Pengeluaran Cafe Baru
   */
  notifyExpense(trx) {
    const settings = StorageManager.getSettings();
    const shift = settings.activeShift || 'Shift 1';
    const baristas = `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'}`;

    const message = 
`☕ *DIALOG COFFEE - NOTIFIKASI PENGELUARAN*
━━━━━━━━━━━━━━━━━━━━
📅 *Waktu:* ${this.formatDateTime(trx.date)}
🧾 *ID Transaksi:* ${trx.id} ${trx.refNo ? `(Ref: ${trx.refNo})` : ''}
👥 *Shift:* ${shift} (${baristas})
🏷️ *Kategori:* *${trx.category || 'Operasional'}*
💸 *Jumlah Pengeluaran:* *${this.formatRupiah(trx.amount)}*
💳 *Sumber Dana:* ${trx.paymentMethod || 'Kas Tunai'}
👤 *Penanggung Jawab:* ${trx.cashier || baristas}
📝 *Keterangan Detail:*
${trx.description || '-'}
━━━━━━━━━━━━━━━━━━━━
*Status:* ⚠️ Pengeluaran Telah Dicatat di Buku Kas`;

    this.openWhatsApp(message);
  },

  /**
   * Rekapan Harian / Closing Shift Kasir
   */
  notifyClosingShift(summary) {
    const settings = StorageManager.getSettings();
    const shift = summary.shift || settings.activeShift || 'Shift 1';
    const baristas = summary.baristas || `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'}`;
    const dateStr = this.formatDateTime(new Date().toISOString());

    let expenseListStr = '';
    if (summary.expenses && summary.expenses.length > 0) {
      expenseListStr = summary.expenses.map((e, idx) => 
        `${idx + 1}. ${e.category}: ${e.description || '-'} (*${this.formatRupiah(e.amount)}*)`
      ).join('\n');
    } else {
      expenseListStr = '• Tidak ada pengeluaran pada shift ini.';
    }

    const message = 
`🔒 *DIALOG COFFEE - REKAPAN CLOSING KASIR*
━━━━━━━━━━━━━━━━━━━━
📅 *Waktu Closing:* ${dateStr}
🏢 *Outlet:* ${settings.cafeName}
👥 *Shift Bertugas:* *${shift}*
☕ *Barista On Duty:* *${baristas}*
━━━━━━━━━━━━━━━━━━━━
📊 *RINGKASAN KEUANGAN HARI INI:*
📈 *Total Pemasukan:* *${this.formatRupiah(summary.totalIncome)}*
📉 *Total Pengeluaran:* *${this.formatRupiah(summary.totalExpense)}*
⚖️ *Laba / (Rugi) Bersih:* *${this.formatRupiah(summary.netProfit)}*
💵 *Uang Fisik Kas di Laci:* *${this.formatRupiah(summary.cashBalance)}*
📦 *Total Transaksi:* ${summary.transactionCount} Transaksi (${summary.incomeCount} Masuk, ${summary.expenseCount} Keluar)
━━━━━━━━━━━━━━━━━━━━
🔻 *RINCIAN PENGELUARAN HARI INI:*
${expenseListStr}
━━━━━━━━━━━━━━━━━━━━
*Catatan Closing:* Seluruh data transaksi dan stok telah divalidasi oleh tim barista yang bertugas.
Terima kasih, salam hangat dari tim Barista DIALOG COFFEE!`;

    this.openWhatsApp(message);
  }
};

window.WhatsAppNotifier = WhatsAppNotifier;

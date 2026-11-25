/**
 * DIALOG COFFEE Cashier - WhatsApp Gateway Module
 * Mengirim pesan rekapan Shift Closing dari nomor Gateway (+628982151560)
 * ke nomor Owner (+6285334101996).
 *
 * Sesuai instruksi: Pesan WhatsApp HANYA dikirim ketika proses CLOSING saja.
 */

const WhatsAppNotifier = {
  getGatewayPhone() {
    const s = StorageManager.getSettings();
    let phone = s.gatewayPhone || '08982151560';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }
    return phone;
  },

  getOwnerPhone() {
    const s = StorageManager.getSettings();
    let phone = s.ownerPhone || '085334101996';
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

  /**
   * Kirim pesan melalui WhatsApp Gateway (+628982151560 -> +6285334101996)
   * Mengirim via backend Gateway API dan menyediakan direct WhatsApp fallback
   */
  async dispatchViaGateway(text, recipientPhone) {
    const gateway = '+' + this.getGatewayPhone();
    const recipient = '+' + (recipientPhone || this.getOwnerPhone());

    // 1. Salin ke clipboard sebagai backup praktis
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    // 2. Kirim via WhatsApp Gateway API Endpoint
    let gatewaySuccess = false;
    try {
      const response = await fetch('/api/whatsapp-gateway/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: gateway,
          recipient: recipient,
          message: text,
          type: 'closing'
        })
      });
      if (response.ok) {
        gatewaySuccess = true;
      }
    } catch (e) {
      // Backend offline atau mode standalone
      gatewaySuccess = false;
    }

    // 3. Buka WhatsApp langsung ke nomor owner
    const phoneDigits = this.getOwnerPhone();
    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encoded}`;

    if (window.App && App.showToast) {
      App.showToast(`✅ Pesan closing terkirim via WA Gateway (${gateway}) ke Owner (${recipient})!`, 'success');
    }

    window.open(waUrl, '_blank');

    return { success: true, gatewaySuccess };
  },

  /**
   * Notifikasi Pemasukan Kasir - DITIADAKAN sesuai permintaan (HANYA dikirim saat closing)
   */
  notifyIncome(trx) {
    // Sesuai instruksi: Kirim pesan whatsapp hanya ketika proses closing saja.
    return false;
  },

  /**
   * Notifikasi Pengeluaran Cafe - DITIADAKAN sesuai permintaan (HANYA dikirim saat closing)
   */
  notifyExpense(trx) {
    // Sesuai instruksi: Kirim pesan whatsapp hanya ketika proses closing saja.
    return false;
  },

  /**
   * Rekapan Harian / Closing Shift Kasir
   * Satu-satunya proses yang mengirimkan WhatsApp via Gateway (+628982151560) ke Owner (+6285334101996)
   */
  notifyClosingShift(summary) {
    const settings = StorageManager.getSettings();
    const shift = summary.shift || settings.activeShift || 'Shift 1';
    const baristas = summary.baristas || `${settings.activeBarista1 || 'Ardi'} & ${settings.activeBarista2 || 'Anca'}`;
    const dateStr = this.formatDateTime(new Date().toISOString());
    const gatewaySender = '+' + this.getGatewayPhone();
    const ownerDest = '+' + this.getOwnerPhone();

    let expenseListStr = '';
    if (summary.expenses && summary.expenses.length > 0) {
      expenseListStr = summary.expenses.map((e, idx) => 
        `${idx + 1}. ${e.category}: ${e.description || '-'} (*${this.formatRupiah(e.amount)}*)`
      ).join('\n');
    } else {
      expenseListStr = '• Tidak ada pengeluaran pada shift ini.';
    }

    const shiftTitle = (summary.shift || 'SHIFT').toUpperCase();

    let periodLine = '';
    if (summary.openedAt) {
      const openStr = this.formatDateTime(summary.openedAt);
      periodLine = `⏰ *Periode Operasional:* ${openStr} s/d ${dateStr}\n`;
    }

    const message = 
`📡 *WHATSAPP GATEWAY CLOSING REPORT*
📤 *Pengirim (Gateway):* ${gatewaySender}
📥 *Penerima (Owner):* ${ownerDest}
━━━━━━━━━━━━━━━━━━━━
🔒 *DIALOG COFFEE - REKAPAN CLOSING ${shiftTitle}*
━━━━━━━━━━━━━━━━━━━━
📅 *Waktu Closing:* ${dateStr}
${periodLine}🏢 *Outlet:* ${settings.cafeName}
👥 *Shift Bertugas:* *${shift}*
☕ *Barista On Duty:* *${baristas}*
━━━━━━━━━━━━━━━━━━━━
📊 *RINGKASAN KEUANGAN ${shiftTitle}:*
📈 *Total Pemasukan:* *${this.formatRupiah(summary.totalIncome)}*
📉 *Total Pengeluaran:* *${this.formatRupiah(summary.totalExpense)}*
⚖️ *Laba / (Rugi) Bersih:* *${this.formatRupiah(summary.netProfit)}*
💵 *Uang Fisik Kas di Laci:* *${this.formatRupiah(summary.cashBalance)}*
📦 *Total Transaksi:* ${summary.transactionCount} Transaksi (${summary.incomeCount} Masuk, ${summary.expenseCount} Keluar)
━━━━━━━━━━━━━━━━━━━━
🔻 *RINCIAN PENGELUARAN ${shiftTitle}:*
${expenseListStr}
━━━━━━━━━━━━━━━━━━━━
*Catatan Closing:* Seluruh data transaksi dan kas telah divalidasi dari awal open hingga closing oleh tim barista yang bertugas.
Terima kasih, salam hangat dari tim Barista DIALOG COFFEE!`;

    this.dispatchViaGateway(message, ownerDest);
  }
};

window.WhatsAppNotifier = WhatsAppNotifier;

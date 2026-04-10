const FONNTE_API_URL = "https://api.fonnte.com/send";

export const sendWhatsAppNotification = async ({ to, message }) => {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.warn("[Fonnte] FONNTE_TOKEN belum diatur, notifikasi WA dilewati");
    return null;
  }

  try {
    const response = await fetch(FONNTE_API_URL, {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: new URLSearchParams({
        target: to,
        message,
        countryCode: "62",
      }),
    });

    const result = await response.json();
    if (!result.status) {
      console.error("[Fonnte] Gagal kirim notifikasi:", result);
    }
    return result;
  } catch (error) {
    console.error("[Fonnte] Error kirim notifikasi WA:", error.message);
    return null;
  }
};

export const buildOrderNotificationMessage = ({
  code,
  customerName,
  phone,
  destination,
  orderDate,
  deliveryMethod,
  items,
  totalPrice,
  note,
}) => {
  const itemLines = items
    .map((item, i) => `  ${i + 1}. ${item.name} x${item.quantity} - Rp ${Number(item.subtotal).toLocaleString("id-ID")}`)
    .join("\n");

  const formatRupiah = (val) => `Rp ${Number(val).toLocaleString("id-ID")}`;
  const metodePengiriman = deliveryMethod === "dikirim" ? "Dikirim" : "Ambil Sendiri";

  return `📋 *PESANAN BARU MASUK*

🔖 Kode Order: *${code}*
👤 Nama Pemesan: *${customerName}*
📱 No. WhatsApp: ${phone}
📍 Tujuan: ${destination}
📅 Tanggal Pesanan: ${orderDate}
🚚 Metode Pengiriman: ${metodePengiriman}

🛒 *Detail Pesanan:*
${itemLines}

💰 *Total Harga: ${formatRupiah(totalPrice)}*${note ? `\n📝 Catatan: ${note}` : ""}

---
_Notifikasi otomatis dari sistem Catering Dhewi_`;
};

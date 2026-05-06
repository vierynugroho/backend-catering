fitur delete di category: menghapus data kategori, namun sebelumnya akan merubah semua menu terkait ke uncategorized (categori_id = null)

fitur delete di menu & user: mengubah is_active menjadi false

---

## Timezone

Kontrak API: **FE kirim & terima UTC** (ISO-8601, contoh: `"2026-05-04T17:00:00.000Z"`).

- Kolom `timestamp` (mis. `eventDate` di `orders`, `created_at`, `updated_at`, `delivered_at`) disimpan & dikembalikan dalam UTC.
- Kolom `date` (mis. `event_date` di `stock_orders`) disimpan sebagai **kalender date WIB** (`Asia/Jakarta`), karena domain bisnis Indonesia.
  - Contoh: FE kirim `"2026-05-04T17:00:00.000Z"` (= 5 Mei 00:00 WIB) → tersimpan sebagai `2026-05-05`.
- Pesan yang ditampilkan ke user (error message, notifikasi WhatsApp, invoice PDF, periode laporan export) selalu pakai format WIB.

Konfigurasi: `momentTZ.tz.setDefault("UTC")` di [src/app.js](src/app.js). Konversi WIB dilakukan eksplisit di [src/utils/helpers.js](src/utils/helpers.js) (`setDate`, `formatDateWIB`).

---

## Stock Order (`current_stock`)

**Invariant:** `currentStock` = jumlah order **aktif** (status ≠ `pesanan_dibatalkan`) untuk `eventDate` (kalender date WIB) tersebut.

`outOfStock = currentStock >= maxStock`. Jika belum ada record `stock_orders` untuk tanggal yang dipilih, order ditolak (`is_available: false`).

Aturan update `currentStock`:

| Aksi | Efek pada `currentStock` |
|---|---|
| Create order baru | `+1` di tanggal order |
| Update order: ubah tanggal (status tetap aktif) | `-1` di tanggal lama, `+1` di tanggal baru |
| Update order: status aktif → `pesanan_dibatalkan` | `-1` di tanggal order |
| Update order: status `pesanan_dibatalkan` → aktif | `+1` di tanggal order |
| Customer cancel order | `-1` di tanggal order |
| Delete order yang masih aktif | `-1` di tanggal order |
| Delete order yang sudah `pesanan_dibatalkan` | tidak berubah (sudah di-handle saat cancel) |

Order bisa diperbarui terkait perubahan tanggal & status hanya jika order **belum diproses** (`order_status !== "pesanan_diproses"`).

---

API Docs: https://documenter.getpostman.com/view/22814931/2sBXcGEzuN

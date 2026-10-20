# Mie Ayam Suka Rasa — aplikasi kasir sederhana

Fitur:
- Menu awal sesuai daftar harga yang diminta.
- Tambah menu dan harga secara manual.
- Input no. antrean/nama, jumlah menu, uang dibayar.
- Hitung total, kembalian, dan status **BELUM LUNAS** otomatis.
- Struk pelanggan dan salinan dapur/chef pada satu halaman cetak.
- Laporan penjualan harian/bulanan: total penjualan dan uang diterima.
- REST API untuk daftar menu, tambah menu, detail pesanan, laporan, dan health check.
- SQLite untuk uji lokal; PostgreSQL melalui `DATABASE_URL` untuk deployment online.

## Jalankan lokal (Windows PowerShell)

```powershell
cd mie_ayam_suka_rasa
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```
Buka http://127.0.0.1:5000

Jika PowerShell memblokir aktivasi, jalankan `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` lalu `.\.venv\Scripts\python.exe app.py`.

## Database online gratis (Supabase PostgreSQL)

1. Buat project di Supabase dan buka **Project Settings → Database → Connect**.
2. Salin connection string PostgreSQL/Session Pooler. Jangan gunakan password asli di kode atau kirim ke orang lain.
3. Isi `DATABASE_URL` di environment variables hosting. Gunakan connection string yang benar dari Supabase, URL-encode karakter khusus pada password, dan jangan commit `.env`.
4. `app.py` menjalankan `db.create_all()` untuk membuat tabel saat aplikasi mulai. `schema.sql` tersedia sebagai referensi.
5. Supabase free tier dan hosting gratis dapat memiliki batas kuota, jeda/sleep, atau kebijakan yang berubah. Periksa ketentuan terkini; layanan gratis bukan jaminan uptime produksi.

## Deploy online

Contoh umum: deploy repository GitHub ke layanan hosting yang menyediakan free tier untuk web service Python. Set build command `pip install -r requirements.txt`, start command `gunicorn app:app`, lalu isi environment variables `DATABASE_URL` dan `SECRET_KEY`. Pilih layanan yang free tier-nya masih tersedia dan sesuai wilayah/kebijakan saat deploy. Database lokal SQLite tidak cocok untuk banyak hosting ephemeral karena data dapat hilang saat instance dibuat ulang; gunakan PostgreSQL online.

## API

Semua endpoint tersedia pada domain aplikasi yang sudah dideploy.

- `GET /health` — status aplikasi.
- `GET /api/products` — menu aktif.
- `POST /api/products` — tambah menu JSON:
  ```json
  {"name":"Es Teh","price":5000}
  ```
- `GET /api/orders/1` — detail pesanan JSON.
- `GET /api/reports?period=daily&date=2026-10-20` — laporan harian.
- `GET /api/reports?period=monthly&date=2026-10` — laporan bulanan.

Contoh:
```bash
curl https://DOMAIN-ANDA/api/products
curl -X POST https://DOMAIN-ANDA/api/products -H "Content-Type: application/json" -d '{"name":"Es Teh","price":5000}'
```

## Catatan penting sebelum dipakai sungguhan
- Ini starter app kasir tanpa login. Jangan buka ke internet untuk penggunaan publik sebelum menambahkan login/otorisasi, HTTPS, backup database, dan proteksi endpoint tambah menu.
- Belum ada fitur edit/hapus transaksi, void/refund, metode pembayaran, multi-kasir, atau sinkronisasi printer khusus. Cetak memakai dialog browser; pilih printer thermal dan ukuran kertas yang sesuai.
- Waktu transaksi menggunakan waktu server. Pastikan zona waktu hosting sesuai atau atur zona waktu sebelum penggunaan.
- Nilai `payment_received` mencatat uang yang diserahkan. Bila uang lebih kecil dari total, struk menampilkan **BELUM LUNAS** dan sisa pembayaran.

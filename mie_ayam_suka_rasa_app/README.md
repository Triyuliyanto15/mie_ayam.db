# Kasir Mie Ayam Suka Rasa

Aplikasi kasir web (HTML + JavaScript) dengan database Supabase, dipasang lewat Vercel.

## Peta file: mau ubah apa, buka file mana

| Yang ingin diubah | File |
|---|---|
| Warna, ukuran, tampilan | `css/style.css` (warna utama di bagian `:root` paling atas) |
| Alamat/kunci Supabase, format Rupiah, tanggal | `js/config.js` |
| Judul toko dan tombol tab di atas | `index.html` |
| **Tab Menu** | `views/menu.html` + `js/menu.js` |
| **Tab Kasir** (keranjang, uang diterima, kembalian) | `views/kasir.html` + `js/kasir.js` |
| **Nota cetak** (isi dan nama toko di nota) | `js/nota.js` (tampilan cetak ada di `css/style.css`, bagian `#receipt`) |
| **Tab Antrean** | `views/antrean.html` + `js/antrean.js` |
| **Suara pemanggil** (kalimat yang diucapkan) | `js/suara.js` (fungsi `callText`) |
| **Tab Laporan** | `views/laporan.html` + `js/laporan.js` |
| **Tab Produk** + upload foto | `views/produk.html` + `js/produk.js` |
| Login admin/kasir | `views/login.html` + `js/auth.js` |
| Perpindahan antar tab | `js/app.js` |
| Urutan file yang dimuat | `js/main.js` |

Aturan sederhana: file di folder `views/` berisi **tampilan (HTML)** tiap tab, file di folder `js/` berisi **cara kerjanya**.

## Catatan
- Setelah mengubah file di GitHub, Vercel otomatis memasang ulang dalam beberapa menit.
- Aplikasi tidak bisa dibuka dengan klik dua kali `index.html` dari komputer, karena memuat file lain lewat internet. Gunakan alamat Vercel untuk mencoba.
- Jika halaman kosong atau tulisan "Aplikasi gagal dimuat", cek nama file di `js/main.js` sudah sesuai dengan file di folder.
- Foto produk disimpan di Supabase Storage (bucket `menu-images`).

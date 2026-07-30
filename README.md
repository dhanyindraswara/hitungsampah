# Trash Return Tracker

**Bawa sampahmu turun.** — Take your trash home.

Banyak gunung di Indonesia mewajibkan pendaki membawa turun seluruh sampahnya.
Saat ini petugas menghitung setiap bungkus satu per satu, sebelum naik dan
sesudah turun — lambat, rawan salah, dan bikin antrean panjang saat musim ramai.

Aplikasi ini menggantikan proses itu: foto semua bungkus makanan dan minuman
sebelum naik, foto sampah yang kamu bawa turun, lalu aplikasi membandingkan
keduanya dan menunjukkan persis apa yang belum kembali.

A mobile-first, installable PWA. Everything runs on the device — no account, no
upload, and it keeps working without signal at the trailhead gate.

## Menjalankan

```bash
npm install
npm run dev        # dev server
npm run build      # production build ke dist/
npm run preview    # serve hasil build
npm run icons      # regenerate ikon PNG dari public/icon.svg
```

`dist/` adalah bundle statis — bisa langsung dideploy ke GitHub Pages, Netlify,
Vercel, atau Cloudflare Pages tanpa server dan tanpa API key.

## Live

**https://dhanyindraswara.github.io/hitungsampah/**

Setiap push ke `main` otomatis di-build dan dideploy lewat
`.github/workflows/deploy.yml`.

> **Wajib sekali di awal:** buka **Settings → Pages → Build and deployment** dan
> setel *Source* = **GitHub Actions**. Kalau masih "Deploy from a branch", Pages
> menyajikan `index.html` di root repo — itu file sumber Vite yang menunjuk ke
> `/src/main.jsx`, sehingga halaman tampil **putih kosong**. Gejalanya: di tab
> Actions ada workflow bernama `pages build and deployment` yang jalan.

Build-nya pakai `base: './'` (path relatif), jadi bundle yang sama jalan di
sub-folder GitHub Pages maupun di root domain kalau nanti pindah ke Vercel atau
Netlify — tidak perlu diubah apa-apa.

Kameranya jalan di URL itu karena `github.io` sudah HTTPS. Kalau kamu tes lewat
IP LAN (`http://192.168.x.x`), browser tidak akan memberikan kamera — pakai
`localhost` atau HTTPS.

## Struktur

```
src/
  screens/     satu komponen per layar
  components/  ikon dan bottom tab bar
  state/       AppContext — seluruh alur dalam satu reducer
  lib/         detector, perbandingan, storage, QR, helper trip
  data/        teks (ID/EN), katalog produk, data awal
  styles/      base.css (token, font, keyframes) + app.css (komponen)
design/        prototipe asli dari Claude Design, sebagai acuan visual
```

**Alur.** splash → beranda → pendakian baru → kamera sebelum naik → hitung →
simpan baseline → *(mendaki)* → kamera setelah turun → hitung → perbandingan →
lengkap atau foto ulang → verifikasi petugas (QR) → selesai. Riwayat dan
Pengaturan ada di tab bar.

**Kamera asli.** Layar kamera memakai `getUserMedia` (kamera belakang), menyimpan
foto sebagai JPEG di perangkat, punya garis bantu dan senter (kalau kameranya
mendukung), dan bisa menghapus foto terakhir. Kalau izin ditolak atau browser
tidak memberi kamera, layarnya menjelaskan kenapa dan menyediakan tombol coba
lagi. `getUserMedia` butuh **https:// atau localhost** — di http biasa browser
tidak akan memberikan kamera sama sekali.

**Hitungnya manual, dan itu disengaja.** Aplikasi tidak menebak. Pendaki
menambahkan tiap bungkus lewat katalog, jumlahnya bisa dinaik-turunkan, dan
aplikasi yang mengerjakan bagian yang memang mesin lebih jago: membandingkan
sebelum vs sesudah, per produk, lalu menghitung persentase kembali.

**Mode demo.** Pengaturan → Mode demo mengganti detector ke skenario dari desain
(overlay kotak deteksi, 39 bungkus, 85% lalu 100% setelah foto ulang). Berguna
untuk presentasi tanpa perlu menata sampah sungguhan.

### Menyambungkan model AI nanti

Semua deteksi lewat satu interface di `src/lib/detector.js`:

```js
{
  id: 'model',
  autoCounts: true,
  overlay: (mode) => [],              // kotak untuk overlay kamera, boleh kosong
  async detect({ mode, attempt, frames }) {
    // frames = JPEG hasil jepretan: { id, blob, url, w, h }
    return [{ id: 'indomie', qty: 4, cf: 97 }];   // cf = keyakinan 0–100
  },
}
```

Tambahkan objek itu ke `DETECTORS`, tawarkan di Pengaturan, selesai — tidak ada
komponen layar yang perlu diubah. Hasil di bawah `LOW_CONFIDENCE` (70) otomatis
tampil sebagai "perlu dicek", dan pendaki tetap bisa mengoreksi tiap angka
sebelum disimpan. Rekomendasi: jalankan modelnya di dalam Web Worker
(ONNX Runtime Web / TFLite / MediaPipe) supaya UI tidak tersendat.

Catatan jujur: model umum (COCO dan sejenisnya) cuma kenal kategori seperti
botol dan gelas, bukan merek. Untuk mengenali Indomie atau Kopiko perlu dataset
dan model latihan sendiri.

**Penyimpanan** lokal via IndexedDB (`src/lib/storage.js`): riwayat pendakian,
pengaturan, dan foto sebelum/sesudah. Tidak ada akun, tidak ada server, foto
tidak pernah diunggah. Pengaturan → Data offline menunjukkan pemakaian ruang dan
bisa menghapus semuanya. Pengaturan → Ekspor mengunduh CSV (baris per pendakian
dan per bungkus) langsung dari perangkat.

**Offline.** `public/sw.js` menyimpan app shell — network-first untuk navigasi,
stale-while-revalidate untuk aset build dan font.

## Desain

Warna, tipografi, spasi, radius, bayangan, dan animasi diambil langsung dari
prototipe di `design/`: design system dengan primary digeser ke forest green
(`#14563C`) dan aksen lime (`#D6FD91`) dipertahankan. Plus Jakarta Sans
di-host sendiri dari `public/fonts/`. Lebar konten 430px, target sentuh minimal
36–44px, semua animasi di bawah 250ms.

Yang masih visual saja:

- **Toggle mode gelap** menyala dan tersimpan, tapi belum mengubah tema — palet
  gelap memang belum didesain.
- **Koordinat GPS** di layar hitung masih placeholder (`src/lib/session.js`);
  jamnya asli.
- **Blok QR** adalah pola deterministik dari ID pendakian, belum kode yang bisa
  discan. Tinggal ganti dengan encoder QR saat aplikasi petugas benar-benar
  memindainya.

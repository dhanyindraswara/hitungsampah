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

**Alur.** splash → beranda → pendakian baru → kamera sebelum naik → proses →
review → simpan baseline → *(mendaki)* → kamera setelah turun → proses → review →
perbandingan → lengkap atau foto ulang → verifikasi petugas (QR) → selesai.
Riwayat dan Pengaturan ada di tab bar.

**Deteksi** ada di balik satu interface, `src/lib/detector.js`:

```js
detector.scene(mode, attempt)   // bounding box untuk overlay langsung
detector.detect(mode, attempt)  // hasil hitung yang sudah digabung & dedup
```

Implementasi saat ini masih **scripted** — mengulang skenario dari desain supaya
seluruh alur bisa dicoba tanpa model. Untuk memakai inferensi asli (ONNX Runtime
Web / TFLite / MediaPipe di dalam worker), cukup buat objek lain dengan dua
method itu lalu ekspor sebagai `detector`. Tidak ada komponen layar yang berubah.

**Penyimpanan** lokal via IndexedDB (`src/lib/storage.js`). Kalau IndexedDB
diblokir (mode penyamaran), aplikasi tetap jalan dengan nilai default.

**Offline.** `public/sw.js` menyimpan app shell — network-first untuk navigasi,
stale-while-revalidate untuk aset build dan font.

## Desain

Warna, tipografi, spasi, radius, bayangan, dan animasi diambil langsung dari
prototipe di `design/`: design system dengan primary digeser ke forest green
(`#14563C`) dan aksen lime (`#D6FD91`) dipertahankan. Plus Jakarta Sans
di-host sendiri dari `public/fonts/`. Lebar konten 430px, target sentuh minimal
36–44px, semua animasi di bawah 250ms.

Yang sengaja masih visual saja (sesuai prototipe):

- **Toggle mode gelap** menyala dan tersimpan, tapi belum mengubah tema — palet
  gelap memang belum didesain.
- **Ikon flash dan grid** di kamera hanya hiasan.
- **Baris pengaturan** (data offline, ekspor, tentang, privasi) belum punya
  halaman tujuan. Baris data offline sudah menampilkan jumlah trip asli.
- **Kamera masih simulasi**, belum `getUserMedia` — sepasang dengan detector scripted.
- **Koordinat GPS** di layar review masih placeholder (`src/lib/session.js`);
  jamnya asli.
- **Blok QR** adalah pola deterministik dari ID trip, belum kode yang bisa discan.

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
  lib/         detector + vision (deteksi on-device), perbandingan, storage,
               QR, helper trip
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

**Deteksi otomatis, di perangkat.** Begitu kamu memfoto, bungkusnya langsung
dihitung — tidak ada model yang diunduh, tidak ada foto yang dikirim ke server.
Saat kamera terbuka, kotak deteksi sudah menempel di tiap bungkus di viewfinder;
tiap kali shutter ditekan, fotonya dibaca lagi dengan detail penuh dan hasilnya
menempel di foto itu, jadi layar hasil terbuka dengan daftar yang sudah terisi.

Cara kerjanya (`src/lib/vision.js`) memanfaatkan instruksi yang memang sudah ada
di layar kamera — *letakkan di permukaan datar, jangan menumpuk*:

1. warna alas ditaksir dari pinggir frame, sekalian seberapa ramai alasnya;
2. tiap piksel yang cukup jauh dari warna itu (CIE Lab) jadi objek — ditambah
   tepian hasil Sobel, supaya bungkus putih di atas batu pucat tetap kebaca;
3. mask dirapikan: tutup celah, isi bagian dalam yang dikelilingi tepian, buang
   bintik;
4. tiap region yang menyambung dihitung satu bungkus;
5. namanya ditebak dari warna kemasan — setelah dikoreksi terhadap cahaya yang
   jatuh di sudut frame itu, jadi bayangan tidak mengubah tebakan.

Dua batasnya jelas dan disengaja. **Warna bukan bukti merek**: tebakan yang
jauh tidak dipaksakan, dia jatuh ke kategori "tidak dikenal" dengan keyakinan di
bawah 70 dan tampil sebagai "perlu dicek". **Bungkus yang menempel dihitung
satu**, bukan ditebak jadi tiga — angka yang mengembang lebih berbahaya di
gerbang daripada angka yang kurang, dan yang kurang bisa ditambah pendaki
sebelum disimpan. Setiap angka tetap bisa dikoreksi.

Kalau alasnya ramai atau sampahnya menggunung, matikan di **Pengaturan →
Deteksi otomatis** dan hitung manual lewat katalog. Alur lainnya sama persis.

**Mode demo.** Pengaturan → Mode demo mengganti detector ke skenario dari desain
(overlay kotak deteksi, 39 bungkus, 85% lalu 100% setelah foto ulang). Berguna
untuk presentasi tanpa perlu menata sampah sungguhan.

### Mengganti dengan model terlatih nanti

Semua deteksi lewat satu interface di `src/lib/detector.js`, dan detector bawaan
(`visionDetector`) memakai interface yang sama seperti model mana pun nanti:

```js
{
  id: 'model',
  autoCounts: true,
  overlay: (mode) => [],              // kotak skenario, boleh kosong
  async scan(source, { live }) {
    // live: elemen <video> yang sedang jalan; selain itu { blob } hasil jepretan
    return [{ id: 'indomie', cf: 97, x: .1, y: .2, w: .2, h: .1 }];  // 0–1
  },
  async detect({ mode, attempt, frames }) {
    // frames = { id, blob, url, w, h, detections? } — detections sudah diisi
    // scan() saat shutter ditekan, jadi di sini tinggal digabung
    return [{ id: 'indomie', qty: 4, cf: 97 }];   // cf = keyakinan 0–100
  },
}
```

Tambahkan objek itu ke `DETECTORS`, tawarkan di Pengaturan, selesai — tidak ada
komponen layar yang perlu diubah. Hasil di bawah `LOW_CONFIDENCE` (70) otomatis
tampil sebagai "perlu dicek". Rekomendasi: jalankan modelnya di dalam Web Worker
(ONNX Runtime Web / TFLite / MediaPipe) supaya UI tidak tersendat — pipeline
bawaan cukup ringan untuk jalan di main thread (~6 ms per frame live 224px,
~14 ms per foto 320px), model beneran biasanya tidak.

Catatan jujur: model umum (COCO dan sejenisnya) cuma kenal kategori seperti
botol dan gelas, bukan merek. Untuk mengenali Indomie atau Kopiko perlu dataset
dan model latihan sendiri — dan itulah yang akan menaikkan akurasi nama produk
di atas tebakan warna yang dipakai sekarang.

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

# Tutorial: Membina PWA Tabungku dari Awal

**Untuk siapa:** Pembangun yang biasa dengan PHP, tetapi baru pertama kali belajar PWA dan JavaScript moden.

**Yang akan dibina:** Aplikasi tabungan ringkas yang boleh dipasang di telefon, berfungsi luar talian, dan menghantar pemberitahuan — tanpa framework, tanpa pelayan backend.

---

## Senarai Kandungan

1. [Apa itu PWA?](#1-apa-itu-pwa)
2. [Struktur Fail Projek](#2-struktur-fail-projek)
3. [Langkah 1: Fail HTML Utama](#langkah-1-fail-html-utama-indexhtml)
4. [Langkah 2: Manifest PWA](#langkah-2-manifest-pwa-manifestjson)
5. [Langkah 3: Ikon Aplikasi](#langkah-3-ikon-aplikasi-iconsiconsvg)
6. [Langkah 4: CSS Tampilan](#langkah-4-css-tampilan-stylecss)
7. [Langkah 5: Service Worker](#langkah-5-service-worker-swjs)
8. [Langkah 6: Logik Aplikasi](#langkah-6-logik-aplikasi-appjs)
9. [Langkah 7: Cara Menjalankan](#langkah-7-cara-menjalankan)
10. [Ciri-ciri PWA yang Dilaksanakan](#ciri-ciri-pwa)
11. [Soalan Lazim](#soalan-lazim)

---

## 1. Apa itu PWA?

PWA (**Progressive Web App**) adalah laman web biasa yang dipertingkatkan supaya terasa seperti aplikasi native (seperti app dari Play Store/App Store).

### Perbandingan dengan Laman Web PHP

| | Laman Web PHP Biasa | PWA |
|---|---|---|
| Perlukan pelayan | ✅ Ya | ❌ Tidak (boleh luar talian) |
| Boleh dipasang di telefon | ❌ Tidak | ✅ Ya |
| Ada ikon di skrin utama | ❌ Tidak | ✅ Ya |
| Pemberitahuan tolak | ❌ Perlu backend | ✅ Ya (dengan SW) |
| Buka tanpa internet | ❌ Tidak | ✅ Ya |
| Dibina dengan | PHP + HTML | HTML + JS sahaja |

### 3 Syarat Utama PWA

Untuk menjadikan laman web biasa sebagai PWA, perlu **3 perkara**:

```
1. manifest.json  → identiti & konfigurasi aplikasi
2. sw.js          → Service Worker (otak luar talian & pemberitahuan)
3. HTTPS          → sambungan selamat (localhost OK untuk ujian)
```

---

## 2. Struktur Fail Projek

```
tabungan-pwa/
│
├── index.html        ← Halaman utama (struktur HTML)
├── style.css         ← Paparan (warna, tataletak, animasi)
├── app.js            ← Logik aplikasi (simpan/keluarkan baki, dll)
├── sw.js             ← Service Worker (luar talian + pemberitahuan)
├── manifest.json     ← Konfigurasi PWA (nama, ikon, warna)
│
└── icons/
    └── icon.svg      ← Ikon aplikasi (digunakan di skrin utama)
```

**Analogi PHP:**
- `index.html` ≈ templat utama (`layout.php`)
- `app.js` ≈ logik perniagaan (`controller.php`)
- `sw.js` ≈ middleware / cron job
- `manifest.json` ≈ konfigurasi (`config.php`)
- `localStorage` ≈ fail JSON di pelayan (tanpa MySQL)

---

## Langkah 1: Fail HTML Utama (`index.html`)

Buat fail `index.html`. Ini adalah tulang belakang halaman.

### Bahagian `<head>` — Meta dan Pautan Penting

```html
<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">

  <!-- WAJIB: Supaya paparan sesuai di telefon, tidak dizum -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Warna bar header pelayar di Android Chrome -->
  <meta name="theme-color" content="#4CAF50">

  <!-- WAJIB PWA: Pautan ke fail manifest -->
  <link rel="manifest" href="manifest.json">

  <!-- Ikon untuk iOS (Safari tidak membaca manifest) -->
  <link rel="apple-touch-icon" href="icons/icon.svg">

  <!-- Ikon tab pelayar -->
  <link rel="icon" href="icons/icon.svg" type="image/svg+xml">

  <title>Tabungku</title>
  <link rel="stylesheet" href="style.css">
</head>
```

> **Kenapa `<meta name="viewport">` penting?**
> Tanpa ini, telefon akan memaparkan versi "zum keluar" seperti desktop.
> Dengan ini, lebar halaman = lebar skrin telefon.

### Struktur `<body>` — Komponen Utama

Ada 4 komponen utama dalam body:

```
1. Banner Pemasangan  → muncul automatik apabila PWA boleh dipasang
2. Pengepala (Header) → tajuk + butang tetapan
3. <main>             → kad baki, borang transaksi, rekod
4. Modal Tetapan      → overlay baki awal + pemberitahuan + tetapkan semula
```

```html
<body>
  <!-- 1. BANNER PEMASANGAN (disembunyikan dulu melalui CSS) -->
  <div id="install-banner">
    <span class="banner-text">📲 Pasang Tabungku pada peranti anda!</span>
    <button id="btn-install">Pasang</button>
    <button id="btn-dismiss-install">✕</button>
  </div>

  <!-- 2. PENGEPALA -->
  <header>
    <h1>🐷 Tabungku</h1>
    <button id="btn-settings">⚙️</button>
  </header>

  <!-- 3. KANDUNGAN UTAMA -->
  <main>
    <!-- Kad baki besar -->
    <div class="balance-card">
      <p class="label">Baki Semasa</p>
      <p class="amount" id="balance-amount">RM 0.00</p>
    </div>

    <!-- Butang pilih mod: Simpan atau Keluarkan -->
    <div class="mode-buttons">
      <button class="btn-mode add-mode active" id="btn-mode-add">➕ Simpan</button>
      <button class="btn-mode minus-mode" id="btn-mode-minus">➖ Keluarkan</button>
    </div>

    <!-- Borang input transaksi -->
    <div class="card">
      <h3 id="form-title">Tambah Simpanan</h3>
      <input type="number" id="amount-input" placeholder="Masukkan jumlah...">
      <input type="text" id="note-input" placeholder="Nota...">

      <!-- Butang kamera dan lokasi -->
      <button id="btn-camera">📷 Gambar Resit</button>
      <button id="btn-location">📍 Lokasi</button>

      <!-- Input fail TERSEMBUNYI untuk kamera telefon -->
      <!-- capture="environment" = buka kamera belakang -->
      <input type="file" id="camera-input" accept="image/*" capture="environment" style="display:none">

      <img id="photo-preview" style="display:none">
      <p id="location-info"></p>

      <button id="btn-save">💾 Simpan Transaksi</button>
    </div>

    <!-- Rekod transaksi (diisi JS) -->
    <div class="card">
      <h3>📋 Rekod Transaksi</h3>
      <div id="history-list"></div>
    </div>
  </main>

  <!-- 4. MODAL TETAPAN -->
  <div class="modal-overlay" id="settings-modal">
    <div class="modal-sheet">
      <h3>⚙️ Tetapan</h3>
      <input type="number" id="starting-balance-input">
      <button id="btn-save-settings">💾 Simpan Baki Awal</button>
      <button id="btn-request-notif">Hidupkan Pemberitahuan</button>
      <button id="btn-reset">🗑️ Padam Semua Data</button>
      <button id="btn-close-settings">✕ Tutup</button>
    </div>
  </div>

  <!-- JavaScript di paling bawah supaya HTML dimuatkan dahulu -->
  <script src="app.js"></script>
</body>
```

> **Kenapa `<script>` di bawah, bukan di `<head>`?**
> Sama seperti PHP yang dijalankan dari atas ke bawah —
> JavaScript perlu HTML sudah ada di halaman sebelum boleh
> memanipulasinya. Letakkan `<script>` sebelum `</body>`.
> (Alternatif: guna `DOMContentLoaded` event seperti dalam projek ini.)

---

## Langkah 2: Manifest PWA (`manifest.json`)

Fail ini adalah "kad pengenalan" aplikasi. Pelayar membaca fail ini untuk tahu cara memaparkan app apabila dipasang.

```json
{
  "name": "Tabungku",
  "short_name": "Tabungku",
  "description": "Aplikasi tabungan mudah untuk merekod simpanan dan pengeluaran wang",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4CAF50",
  "orientation": "portrait",
  "icons": [
    {
      "src": "icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### Penjelasan Setiap Medan

| Medan | Fungsi | Contoh |
|---|---|---|
| `name` | Nama penuh aplikasi | "Tabungku" |
| `short_name` | Nama di skrin utama (maks 12 aksara) | "Tabungku" |
| `start_url` | URL yang dibuka apabila ikon diklik | `"./"` |
| `scope` | Had URL yang dianggap sebahagian daripada aplikasi | `"./"` |
| `display` | Paparan tetingkap | `"standalone"` = tanpa bar alamat |
| `theme_color` | Warna bar header pelayar | `"#4CAF50"` (hijau) |
| `background_color` | Warna skrin splash | `"#ffffff"` |
| `icons` | Senarai ikon aplikasi | Lihat di bawah |

**Nilai `display` yang tersedia:**
- `"standalone"` → seperti app native, tanpa bar alamat
- `"fullscreen"` → skrin penuh (untuk permainan)
- `"minimal-ui"` → ada sedikit kawalan pelayar
- `"browser"` → paparan pelayar biasa (bukan PWA)

**Tentang `sizes: "any"` untuk SVG:**
SVG adalah format vektor yang boleh dibesarkan/dikecilkan tanpa kabur, jadi satu fail boleh digunakan untuk semua saiz.

---

## Langkah 3: Ikon Aplikasi (`icons/icon.svg`)

Buat folder `icons/` kemudian buat fail SVG di dalamnya.

SVG adalah format gambar berasaskan teks (seperti HTML tetapi untuk gambar). Kita boleh membuat ikon ringkas terus dalam penyunting teks:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <!-- Latar hijau dengan sudut membulat -->
  <rect width="192" height="192" rx="24" fill="#4CAF50"/>

  <!-- Teks "RM" di tengah -->
  <text
    x="96" y="120"
    font-size="80"
    font-family="Arial, sans-serif"
    font-weight="bold"
    text-anchor="middle"
    fill="white"
  >RM</text>
</svg>
```

> **Tips:** Untuk PWA yang lebih serius, gunakan PNG dengan saiz
> 192×192 dan 512×512. PNG lebih serasi dengan pelayar lama.
> Boleh dibuat secara percuma di: https://favicon.io/favicon-generator/

---

## Langkah 4: CSS Tampilan (`style.css`)

### Konsep CSS yang Perlu Diketahui

**1. CSS Variables (seperti pemalar dalam PHP)**
```css
:root {
  --color-primary: #4CAF50;   /* Sama seperti: define('PRIMARY', '#4CAF50') */
  --radius: 12px;
}

/* Cara guna: */
.button {
  background: var(--color-primary);  /* Sama seperti: PRIMARY */
  border-radius: var(--radius);
}
```

**2. Flexbox (untuk tataletak mendatar)**
```css
.mode-buttons {
  display: flex;    /* Aktifkan flexbox */
  gap: 10px;       /* Jarak antara item */
}
/* Hasilnya: dua butang sejajar mendatar */
```

**3. CSS Grid (untuk tataletak jadual/lajur)**
```css
.mode-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;  /* 2 lajur sama lebar */
  gap: 10px;
}
```

**4. Mobile-first (reka bentuk telefon dahulu)**
```css
/* Lalai: untuk telefon */
.card { padding: 16px; }

/* Ganti semula untuk skrin lebih besar */
@media (min-width: 600px) {
  .card { padding: 24px; }
}
```

### Struktur CSS Projek Ini

```css
/* 1. Pemboleh ubah warna dan saiz */
:root { ... }

/* 2. Reset (buang gaya lalai pelayar) */
*, body { ... }

/* 3. Banner pemasangan */
#install-banner { ... }

/* 4. Pengepala */
header { ... }

/* 5. Kad baki besar */
.balance-card { ... }

/* 6. Kad kandungan (boleh digunakan semula) */
.card { ... }

/* 7. Butang mod (Simpan/Keluarkan) */
.btn-mode { ... }
.btn-mode.active { ... }  /* Keadaan aktif */

/* 8. Borang input */
.form-group input { ... }
.btn-save { ... }

/* 9. Modal overlay */
.modal-overlay { display: none; }       /* Tersembunyi secara lalai */
.modal-overlay.show { display: flex; }  /* Papar apabila JS tambah kelas "show" */

/* 10. Rekod transaksi */
.transaction-item { ... }
.transaction-item.add { ... }    /* Warna hijau */
.transaction-item.minus { ... }  /* Warna merah */
```

---

## Langkah 5: Service Worker (`sw.js`)

Ini adalah fail **terpenting** untuk luar talian dan pemberitahuan. Service Worker berjalan di latar, berasingan dari halaman web.

### Cara Kerja Service Worker

```
Pelayar                    Service Worker
   |                            |
   |-- Minta fail CSS --------> |
   |                            |-- Semak cache
   |                            |-- Ada? Hantar dari cache
   |                            |-- Tiada? Ambil dari internet
   |<-- Terima fail CSS --------|
```

### 3 Event Utama Service Worker

**Event 1: `install` — Simpan fail ke dalam cache**

```javascript
// Nama cache – tukar versi jika ada kemaskini fail
const CACHE_NAME = 'tabungku-v1';

// Fail yang disimpan untuk luar talian
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    // Buka (atau cipta) storan bernama 'tabungku-v1'
    caches.open(CACHE_NAME).then((cache) => {
      // Simpan semua fail ke dalam cache
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // Aktifkan terus tanpa tutup tab dulu
});
```

**Event 2: `activate` — Bersihkan cache lama**

```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          // Padam cache dengan nama berbeza (versi lama)
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim(); // Ambil kawalan semua tab
});
```

**Event 3: `fetch` — Layan fail dari cache (keajaiban luar talian!)**

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Semak cache dahulu
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Ada dalam cache → hantar terus!
      }
      // Tiada dalam cache → ambil dari internet
      return fetch(event.request);
    })
  );
});
```

**Event 4: `push` — Paparkan pemberitahuan dari pelayan**

```javascript
// Ini digunakan jika ada pelayan yang menghantar tolak (push)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Tabungku', {
      body: data.body,
      icon: './icons/icon.svg'
    })
  );
});
```

**Event 5: `notificationclick` — Kendalikan klik pemberitahuan**

```javascript
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./') // Buka app apabila pemberitahuan diklik
  );
});
```

### Cara Mendaftarkan Service Worker (dalam `app.js`)

```javascript
function registerServiceWorker() {
  // Semak sokongan pelayar
  if (!('serviceWorker' in navigator)) return;

  // Daftar SW — fail sw.js mesti ada di folder root
  navigator.serviceWorker.register('sw.js')
    .then((registration) => {
      console.log('SW berdaftar:', registration.scope);
    })
    .catch((error) => {
      console.error('SW gagal:', error);
    });
}

// Panggil apabila app dimuatkan
registerServiceWorker();
```

> **PENTING — Skop Service Worker:**
> Service Worker hanya berfungsi untuk fail-fail dalam folder yang sama
> atau di bawahnya. Jika `sw.js` berada di `/tabungan-pwa/sw.js`,
> maka SW hanya mengawal URL yang bermula dengan `/tabungan-pwa/`.
> Itulah sebabnya `sw.js` mesti ada di folder root projek, bukan subfolder.

---

## Langkah 6: Logik Aplikasi (`app.js`)

### localStorage sebagai "Pangkalan Data"

Tiada MySQL, tiada pelayan. Data disimpan dalam pelayar pengguna.

```javascript
const STORAGE_KEY = 'tabungku_data';

// Sama seperti: SELECT * FROM tabungan (json_decode)
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { startingBalance: 0, transactions: [] };
  return JSON.parse(raw); // JSON.parse = json_decode() dalam PHP
}

// Sama seperti: UPDATE tabungan SET data = ... (json_encode)
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); // = json_encode()
}
```

**Struktur data yang disimpan:**
```json
{
  "startingBalance": 5000.00,
  "transactions": [
    {
      "id": "1705123456789",
      "type": "add",
      "amount": 1500.50,
      "note": "Gaji bulan ini",
      "photo": "data:image/jpeg;base64,...",
      "location": { "lat": 3.1390, "lng": 101.6869, "name": "3.13900, 101.68690" },
      "timestamp": "2024-01-13T10:30:00.000Z"
    }
  ]
}
```

### Format Ringgit Malaysia

```javascript
function formatRM(amount) {
  // Intl.NumberFormat adalah API terbina dalam JavaScript
  // 'ms-MY' = locale Malaysia (koma sebagai pemisah ribuan)
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
// formatRM(1500.50) → "RM 1,500.50"
```

### Memaparkan HTML dari JavaScript (Render)

Dalam PHP kita `echo` HTML. Dalam JS kita tetapkan `innerHTML`:

```php
// PHP: gelung dan echo HTML
foreach ($transactions as $t) {
  echo "<div class='item'>{$t['amount']}</div>";
}
```

```javascript
// JavaScript: sama, tetapi guna innerHTML dan .map().join('')
container.innerHTML = transactions.map(function(t) {
  return `<div class="item">${t.amount}</div>`;
}).join('');
```

### Kamera (Gambar Resit)

```javascript
// Klik input[type=file] yang tersembunyi
function openCamera() {
  document.getElementById('camera-input').click();
}

// Proses gambar selepas dipilih
function handlePhotoSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    // e.target.result = data:image/jpeg;base64,/9j/4AAQ...
    currentPhoto = e.target.result;

    // Paparkan pratonton
    document.getElementById('photo-preview').src = currentPhoto;
    document.getElementById('photo-preview').style.display = 'block';
  };
  reader.readAsDataURL(file); // Baca fail sebagai base64
}
```

> **Tips Mampat Gambar:**
> Gambar dari kamera telefon boleh 5–10 MB. Sebelum disimpan ke localStorage
> (yang terhad ~5MB), mampatkan dahulu dengan Canvas:
> ```javascript
> const canvas = document.createElement('canvas');
> canvas.width = 600; canvas.height = 450; // Saiz semula
> canvas.getContext('2d').drawImage(img, 0, 0, 600, 450);
> const compressed = canvas.toDataURL('image/jpeg', 0.7); // Kualiti 70%
> ```

### GPS / Lokasi

```javascript
function getLocation() {
  // Semak sokongan
  if (!navigator.geolocation) {
    alert('GPS tidak disokong');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    // Berjaya → dapat koordinat
    function(position) {
      currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        name: `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
      };
    },
    // Ralat → paparkan mesej
    function(error) {
      console.error('Ralat GPS:', error.code);
    },
    { timeout: 10000 }
  );
}
```

---

## Ciri-ciri PWA

### Ciri 1: Banner Pemasangan (Ajakan Pasang)

Pelayar secara automatik mengesan apabila PWA memenuhi syarat dan mencetuskan event `beforeinstallprompt`. Kita **tangkap event itu** dan paparkan banner kustom.

```javascript
let deferredInstallPrompt = null;

// Pelayar bersedia → tangkap event, paparkan banner kita
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();             // Halang banner automatik pelayar
  deferredInstallPrompt = event;      // Simpan untuk digunakan nanti
  showInstallBanner();                // Paparkan banner kita sendiri
});

// Pengguna klik butang Pasang di banner kita
function installPWA() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();     // Paparkan dialog pasang pelayar
  deferredInstallPrompt.userChoice.then((result) => {
    deferredInstallPrompt = null;     // Tetapkan semula selepas digunakan
    hideInstallBanner();
  });
}
```

**Syarat agar banner pemasangan muncul:**
- ✅ Ada `manifest.json` yang sah
- ✅ Ada Service Worker berdaftar
- ✅ Diakses melalui HTTPS (atau `localhost`)
- ✅ Belum pernah dipasang sebelum ini
- ✅ Pengguna sudah berinteraksi dengan halaman

> **Nota:** Di iOS Safari, tiada `beforeinstallprompt`.
> Pengguna perlu pasang secara manual melalui: Kongsi → Tambah ke Skrin Utama.

### Ciri 2: Pemberitahuan Tolak (Push Notification)

Ada dua jenis pemberitahuan di web:

**A. Pemberitahuan Tempatan** (yang digunakan dalam projek ini)
- Dicetuskan oleh JavaScript di halaman
- Muncul selagi app terbuka atau di latar (SW)
- Tidak perlukan pelayan langsung

```javascript
function showLocalNotification(title, body) {
  if (Notification.permission !== 'granted') return;

  // Cara terbaik: melalui Service Worker
  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, {
      body: body,
      icon: 'icons/icon.svg',
      vibrate: [200, 100, 200] // Corak getar telefon
    });
  });
}

// Minta kebenaran dahulu (mesti selepas klik pengguna)
function requestNotificationPermission() {
  Notification.requestPermission().then((permission) => {
    console.log('Kebenaran:', permission); // 'granted', 'denied', atau 'default'
  });
}
```

**B. Pemberitahuan Tolak dari Pelayan** (untuk masa hadapan)
- Pelayan boleh menghantar pemberitahuan walaupun app ditutup
- Perlukan: kunci VAPID, langganan tolak, URL endpoint
- Pustaka yang boleh digunakan: `web-push` (Node.js) atau `minishlink/web-push` (PHP)

```php
// Contoh hantar push dengan PHP (perlukan pustaka web-push)
// composer require minishlink/web-push

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

$auth = ['VAPID' => [
    'subject'    => 'mailto:anda@email.com',
    'publicKey'  => 'KUNCI_AWAM_ANDA',
    'privateKey' => 'KUNCI_PERIBADI_ANDA',
]];

$webPush      = new WebPush($auth);
$subscription = Subscription::create($userSubscription); // Dari localStorage
$webPush->sendOneNotification($subscription, json_encode([
    'title' => 'Tabungku',
    'body'  => 'Jangan lupa menyimpan hari ini!'
]));
```

### Ciri 3: Luar Talian (Offline — Cache-First Strategy)

Service Worker menyimpan semua fail ke dalam cache apabila app dibuka buat pertama kali. Semasa luar talian, fail diambil dari cache:

```
Dalam talian pertama kali:
  Pelayar → [SW Pasang] → Cache semua fail

Semasa luar talian:
  Pelayar → Minta index.html
           → SW semak cache → Ada! → Hantar dari cache
```

Strategi yang digunakan dalam projek ini: **Cache First**
1. Semak cache dahulu
2. Jika ada → hantar dari cache
3. Jika tiada → ambil dari internet dan simpan ke cache

### Ciri 4: Kemaskini Aplikasi

Apabila ada fail yang diubah, tukar nama cache dalam `sw.js`:

```javascript
// sw.js — tukar v1 kepada v2
const CACHE_NAME = 'tabungku-v2'; // ← Tukar ini
```

SW baru akan dikesan secara automatik. Pelayar memaparkan banner kemaskini, dan pengguna boleh klik untuk muat semula ke versi terbaharu.

---

## Langkah 7: Cara Menjalankan

### Pilihan A: Python (cara termudah, ada di Mac/Linux/Windows)

```bash
# Masuk ke folder induk tabungan-pwa
cd /laluan/ke/folder/induk

# Python 3
python3 -m http.server 8080

# Buka pelayar ke:
# http://localhost:8080/tabungan-pwa/
```

### Pilihan B: Node.js (jika Python tiada)

```bash
# Pasang http-server sekali
npm install -g http-server

# Jalankan dari folder induk
http-server -p 8080

# Buka: http://localhost:8080/tabungan-pwa/
```

### Pilihan C: VS Code Live Server Extension

1. Pasang extension "Live Server" di VS Code
2. Klik kanan `index.html` → "Open with Live Server"
3. Secara automatik terbuka dalam pelayar

### Mengapa Tidak Boleh Klik Dua Kali Fail HTML?

Service Worker **hanya boleh** didaftarkan melalui HTTP/HTTPS, bukan melalui `file://`. Jika buka terus (dua kali klik), URL-nya `file:///C:/...` dan SW tidak boleh berfungsi.

---

## Soalan Lazim

**S: Kenapa pemberitahuan tidak muncul?**
J: Pastikan:
1. Sudah klik "Hidupkan Pemberitahuan" dalam Tetapan
2. Pelayar tidak dibisukan pemberitahuannya (semak tetapan OS)
3. Di desktop: semak kebenaran pemberitahuan di bar alamat (ikon kunci)
4. Di Firefox: mungkin perlu `about:config` → tetapkan `dom.webnotifications.enabled` = true

**S: Banner pemasangan tidak muncul?**
J: Pelayar ada "engagement heuristics" — perlu beberapa kali lawatan atau interaksi sebelum banner muncul. Untuk ujian:
- Chrome: DevTools → Application → Manifest → "Add to homescreen"
- Atau cuba di telefon terus melalui USB debugging

**S: Kenapa fail perlu di-cache semula selepas diedit?**
J: SW menyimpan versi lama dalam cache. Penyelesaiannya:
1. Tukar `CACHE_NAME` dalam `sw.js` (contoh `v1` → `v2`)
2. Atau: DevTools → Application → Service Workers → "Update on reload"

**S: Berapakah kapasiti localStorage?**
J: ~5MB setiap domain. Cukup untuk ratusan transaksi + beberapa gambar termampat. Untuk data lebih banyak, gunakan IndexedDB (seperti SQLite-nya pelayar).

**S: Boleh digunakan di iOS (iPhone)?**
J: Ya, tetapi dengan batasan:
- Pasang: mesti manual melalui Safari → Kongsi → Tambah ke Skrin Utama
- Pemberitahuan tolak: disokong di iOS 16.4+ (perlukan app sudah dipasang)
- Kamera & GPS: berfungsi seperti biasa

**S: Bagaimana cara menerbitkan ke internet?**
J: Muat naik semua fail ke hosting yang menyokong HTTPS. Percuma boleh guna:
- **Netlify** (seret dan lepas folder)
- **GitHub Pages** (push ke GitHub)
- **Vercel** (sambungkan repo GitHub)

PWA ini tidak memerlukan pelayan PHP — semuanya statik, jadi boleh dihost di mana-mana sahaja!

---

## Ringkasan: Urutan Membina PWA

```
1. Buat index.html dengan <link rel="manifest">
2. Buat manifest.json dengan name, icons, display, start_url
3. Buat ikon (SVG atau PNG 192×192 dan 512×512)
4. Buat sw.js dengan event install, activate, fetch
5. Dalam app.js, daftarkan SW: navigator.serviceWorker.register('sw.js')
6. Tambah listener beforeinstallprompt untuk banner pemasangan
7. Minta kebenaran pemberitahuan selepas pengguna berinteraksi
8. Jalankan melalui pelayan HTTP (bukan file://)
9. Uji dalam Chrome DevTools → Application → Manifest
```

**Tahniah! Anda telah berjaya membina PWA pertama anda.** 🎉

---

*Tutorial ini dibina untuk projek Tabungku — PWA ringkas tanpa framework.*
*Semua kod boleh dilihat terus dalam fail-fail projek ini.*

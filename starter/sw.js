/**
 * sw.js - Service Worker untuk Tabungku
 *
 * Service Worker adalah fail JavaScript yang berjalan di latar pelayar,
 * berasingan dari halaman web. Tugasnya seperti "orang tengah" antara
 * aplikasi dan internet. Dengan Service Worker, aplikasi boleh:
 * 1. Berfungsi luar talian / offline (dengan cache)
 * 2. Menerima pemberitahuan tolak (push notification)
 * 3. Menyegerakkan data di latar
 *
 * Analogi PHP: seperti cron job yang berjalan terus di pelayan,
 * tetapi ini berjalan di pelayar pengguna.
 */

// Nama cache – tukar versinya setiap kali ada kemaskini fail
// Sama seperti versi API dalam PHP
const CACHE_NAME = 'tabungku-v1';

// Senarai fail yang akan disimpan dalam cache untuk luar talian
// Seperti senarai fail statik yang ingin kita "simpan secara tempatan"
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon.svg'
];

// ============================================================
// EVENT: INSTALL
// Dipanggil sekali apabila Service Worker pertama kali dipasang
// Sama seperti fungsi setup/install dalam PHP framework
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Memasang Service Worker...');

  // event.waitUntil() memberitahu pelayar untuk menunggu
  // sehingga proses caching selesai sebelum dianggap "installed"
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mencache semua fail untuk luar talian...');
      // Simpan semua fail ke dalam cache
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  // Terus aktifkan SW baharu tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

// ============================================================
// EVENT: ACTIVATE
// Dipanggil apabila SW mula aktif (selepas install)
// Gunakan ini untuk membersihkan cache lama
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Mengaktifkan Service Worker...');

  event.waitUntil(
    // Dapatkan semua nama cache yang ada
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Padam cache dengan nama berbeza (versi lama)
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Membuang cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Ambil kawalan semua tab yang sudah terbuka
  self.clients.claim();
});

// ============================================================
// EVENT: FETCH
// Dipanggil setiap kali aplikasi membuat permintaan (ambil fail/data)
// Inilah yang membolehkan aplikasi berfungsi luar talian!
// Strategi: Cache First (semak cache dahulu, baru ke internet)
// ============================================================
self.addEventListener('fetch', (event) => {
  // Hanya kendalikan permintaan HTTP/HTTPS (abaikan chrome-extension dll)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    // Semak sama ada fail ada dalam cache
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fail ada dalam cache – kembalikan dari cache (luar talian OK!)
        return cachedResponse;
      }

      // Fail tidak ada dalam cache – ambil dari internet
      return fetch(event.request).then((networkResponse) => {
        // Jika berjaya dapatkan dari internet, simpan juga ke cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Gagal dari cache DAN internet
        console.log('[SW] Luar talian dan tidak ada dalam cache:', event.request.url);
      });
    })
  );
});

// ============================================================
// EVENT: PUSH
// Dipanggil apabila ada pemberitahuan tolak dari pelayan
// Untuk menggunakan ini perlu pelayan + kunci VAPID
// (Lihat tutorial untuk penjelasan lengkap)
// ============================================================
self.addEventListener('push', (event) => {
  console.log('[SW] Pemberitahuan tolak diterima');

  // Ambil data dari mesej tolak
  // Jika tiada data, gunakan lalai
  let notifData = {
    title: 'Tabungku',
    body: 'Ada kemaskini untuk simpanan anda!'
  };

  if (event.data) {
    try {
      // Cuba hurai data sebagai JSON
      notifData = event.data.json();
    } catch (e) {
      // Jika bukan JSON, gunakan sebagai teks biasa
      notifData.body = event.data.text();
    }
  }

  // Pilihan paparan pemberitahuan
  const options = {
    body: notifData.body,
    icon: './icons/icon.svg',       // Ikon pemberitahuan
    badge: './icons/icon.svg',      // Ikon kecil di bar status Android
    vibrate: [200, 100, 200],       // Corak getar: hidup-mati-hidup (ms)
    data: { url: './' },            // Data tambahan (URL untuk dibuka)
    actions: [                      // Butang tindakan pada pemberitahuan
      { action: 'open', title: 'Buka Aplikasi' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notifData.title, options)
  );
});

// ============================================================
// EVENT: NOTIFICATIONCLICK
// Dipanggil apabila pengguna klik pemberitahuan
// ============================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Pemberitahuan diklik:', event.action);

  // Tutup pemberitahuan
  event.notification.close();

  if (event.action === 'close') {
    return; // Pengguna pilih tutup, tidak perlu buka app
  }

  // Buka atau fokus ke tab aplikasi
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Semak sama ada ada tab aplikasi yang sudah terbuka
        for (const client of windowClients) {
          if (client.url.includes('tabungan-pwa') && 'focus' in client) {
            return client.focus(); // Fokus ke tab yang ada
          }
        }
        // Tiada tab terbuka – buka tab baharu
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});

// ============================================================
// EVENT: MESSAGE
// Untuk komunikasi dari halaman ke Service Worker
// ============================================================
self.addEventListener('message', (event) => {
  // Arahan skip waiting (untuk kemaskini SW terus)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

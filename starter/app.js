/**
 * app.js - Starter Tabungku
 *
 * Tugas anda: implementasi setiap fungsi di bawah mengikut
 * panduan yang diberikan dalam komen.
 *
 * Glosari ringkas:
 * - localStorage   ≈ fail JSON di pelayan (simpan/baca data)
 * - JSON.stringify ≈ json_encode() dalam PHP
 * - JSON.parse     ≈ json_decode() dalam PHP
 * - addEventListener ≈ fungsi yang dipanggil apabila sesuatu berlaku
 * - document.getElementById ≈ mencari elemen HTML berdasarkan id
 */

'use strict';

// ============================================================
// PEMBOLEH UBAH GLOBAL
// ============================================================

const STORAGE_KEY = 'tabungku_data';
let deferredInstallPrompt = null;
let currentPhoto    = null;
let currentLocation = null;
let currentMode     = 'add';
let newWorker       = null;

// ============================================================
// BAHAGIAN 1: BACA DAN SIMPAN DATA
// ============================================================

/**
 * Membaca semua data dari localStorage.
 *
 * Panduan:
 * - Guna localStorage.getItem(STORAGE_KEY) untuk ambil data
 * - Jika tiada data (null), kembalikan objek lalai:
 *     { startingBalance: 0, transactions: [] }
 * - Jika ada data, hurai dari JSON dengan JSON.parse()
 *
 * @returns {Object} { startingBalance: number, transactions: Array }
 */
function loadData() {
  // TODO: Implementasi di sini
}

/**
 * Menyimpan data ke localStorage.
 *
 * Panduan:
 * - Tukar objek data kepada JSON dengan JSON.stringify()
 * - Simpan dengan localStorage.setItem(STORAGE_KEY, ...)
 *
 * @param {Object} data - Data yang akan disimpan
 */
function saveData(data) {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 2: PENGIRAAN
// ============================================================

/**
 * Mengira baki semasa berdasarkan semua transaksi.
 *
 * Panduan:
 * - Mulakan dengan data.startingBalance
 * - Gelung (forEach) semua data.transactions
 * - Jika t.type === 'add', tambah t.amount ke baki
 * - Jika tidak, tolak t.amount dari baki
 * - Kembalikan baki akhir
 *
 * @param {Object} data
 * @returns {number}
 */
function calculateBalance(data) {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 3: FORMAT PAPARAN
// ============================================================

/**
 * Memformat nombor kepada format Ringgit Malaysia.
 * Contoh: 1500.5 → "RM 1,500.50"
 *
 * Panduan:
 * - Guna Intl.NumberFormat dengan locale 'ms-MY'
 * - options: { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 }
 *
 * @param {number} amount
 * @returns {string}
 */
function formatRM(amount) {
  // TODO: Implementasi di sini
}

/**
 * Memformat cap masa ISO kepada teks yang mudah dibaca.
 * Contoh: "2024-01-15T10:30:00.000Z" → "15 Jan 2024, 10:30"
 *
 * Panduan:
 * - Cipta objek Date dari isoString: new Date(isoString)
 * - Guna Intl.DateTimeFormat dengan locale 'ms-MY'
 * - options: { day: 'numeric', month: 'short', year: 'numeric',
 *              hour: '2-digit', minute: '2-digit' }
 *
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 4: RENDER (PAPAR KE SKRIN)
// ============================================================

/**
 * Memaparkan baki pada elemen #balance-amount.
 *
 * Panduan:
 * - Cari elemen: document.getElementById('balance-amount')
 * - Set teks: el.textContent = formatRM(balance)
 * - Jika balance < 0: tambah kelas 'negative' (el.classList.add)
 * - Jika tidak: buang kelas 'negative' (el.classList.remove)
 *
 * @param {number} balance
 */
function renderBalance(balance) {
  // TODO: Implementasi di sini
}

/**
 * Memaparkan senarai transaksi dalam #history-list.
 *
 * Panduan:
 * - Cari elemen: document.getElementById('history-list')
 * - Jika transactions.length === 0, paparkan mesej kosong:
 *     '<div class="history-empty"><div class="empty-icon">👶</div>
 *      <p>Tiada rekod lagi</p><p>Jom mula menyimpan!</p></div>'
 * - Jika ada transaksi:
 *   a. Balikkan urutan: [...transactions].reverse()
 *   b. Guna .map() untuk tukar setiap transaksi kepada HTML
 *   c. Set container.innerHTML dengan .join('')
 *
 * Struktur HTML satu transaksi:
 * <div class="transaction-item {t.type}" data-id="{t.id}">
 *   <div class="transaction-indicator"></div>
 *   <div class="transaction-body">
 *     <span class="transaction-amount">{+/-} {formatRM}</span>
 *     <span class="transaction-note">{nota atau '<em>Tiada nota</em>'}</span>
 *     <div class="transaction-meta">
 *       <span>🕐 {formatDate}</span>
 *       {jika ada lokasi: <span>📍 {nama}</span>}
 *     </div>
 *   </div>
 *   {jika ada gambar: <img class="transaction-thumb" src="{photo}">}
 * </div>
 *
 * @param {Array} transactions
 */
function renderHistory(transactions) {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 5: SIMPAN TRANSAKSI
// ============================================================

/**
 * Menyimpan transaksi baru berdasarkan input pengguna.
 * Dipanggil apabila butang "Simpan Transaksi" diklik.
 *
 * Panduan:
 * 1. Ambil nilai dari #amount-input (guna parseFloat)
 * 2. Semak: jika tiada nilai atau <= 0, alert amaran dan return
 * 3. Panggil requestNotificationPermission()
 * 4. Baca data: loadData()
 * 5. Cipta objek transaksi:
 *    { id: Date.now().toString(), type: currentMode,
 *      amount, note: noteInput.value.trim(),
 *      photo: currentPhoto, location: currentLocation,
 *      timestamp: new Date().toISOString() }
 * 6. Tambah ke data.transactions dengan .push()
 * 7. Simpan: saveData(data)
 * 8. Kira baki: calculateBalance(data)
 * 9. Render: renderBalance() dan renderHistory()
 * 10. Bersihkan borang: resetForm()
 * 11. Papar pemberitahuan: showLocalNotification(...)
 */
function saveTransaction() {
  // TODO: Implementasi di sini
}

/**
 * Membersihkan borang selepas transaksi disimpan.
 *
 * Panduan:
 * - Kosongkan #amount-input dan #note-input (value = '')
 * - Sembunyikan #photo-preview (src='', style.display='none')
 * - Kosongkan teks #location-info
 * - Buang kelas 'active' dari #btn-camera dan #btn-location
 * - Tetapkan semula: currentPhoto = null, currentLocation = null
 * - Kosongkan #camera-input (value = '')
 */
function resetForm() {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 6: MOD TRANSAKSI
// ============================================================

/**
 * Menetapkan mod transaksi: 'add' atau 'minus'.
 *
 * Panduan apabila mode === 'add':
 * - #btn-mode-add: tambah kelas 'active'
 * - #btn-mode-minus: buang kelas 'active'
 * - #form-title: teks '➕ Tambah Simpanan', warna '#388E3C'
 * - #btn-save: buang kelas 'danger', teks '💾 Simpan Wang'
 *
 * Panduan apabila mode === 'minus':
 * - #btn-mode-add: buang kelas 'active'
 * - #btn-mode-minus: tambah kelas 'active'
 * - #form-title: teks '➖ Keluarkan Wang', warna '#c62828'
 * - #btn-save: tambah kelas 'danger', teks '💾 Keluarkan Wang'
 *
 * @param {string} mode - 'add' atau 'minus'
 */
function setMode(mode) {
  currentMode = mode;
  // TODO: Implementasi paparan di sini
}

// ============================================================
// BAHAGIAN 7: KAMERA
// ============================================================

/**
 * Membuka dialog kamera / pilih fail.
 *
 * Panduan:
 * - Cari elemen #camera-input
 * - Panggil .click() untuk buka dialog fail
 */
function openCamera() {
  // TODO: Implementasi di sini
}

/**
 * Memproses gambar yang dipilih pengguna.
 *
 * Panduan:
 * - Ambil fail dari event.target.files[0]
 * - Jika tiada fail, return
 * - Panggil compressAndSavePhoto(file)
 *
 * @param {Event} event
 */
function handlePhotoSelected(event) {
  // TODO: Implementasi di sini
}

/**
 * Memampatkan gambar dan menyimpannya sebagai base64 dalam currentPhoto.
 *
 * Panduan:
 * 1. Cipta FileReader dan panggil reader.readAsDataURL(file)
 * 2. Dalam reader.onload:
 *    a. Cipta new Image() dan set img.src = e.target.result
 *    b. Dalam img.onload:
 *       - Cipta canvas dan kira saiz baharu (maks 600px)
 *       - Lukis gambar: ctx.drawImage(img, 0, 0, width, height)
 *       - Simpan: currentPhoto = canvas.toDataURL('image/jpeg', 0.7)
 *       - Paparkan pratonton: #photo-preview (src + display='block')
 *       - Tambah kelas 'active' pada #btn-camera
 *
 * @param {File} file
 */
function compressAndSavePhoto(file) {
  // TODO: Implementasi di sini
}

/**
 * Memaparkan gambar transaksi dalam saiz penuh (tab baru).
 *
 * Panduan:
 * - Cari transaksi dalam loadData().transactions menggunakan .find()
 * - Jika tiada atau tiada gambar, return
 * - Buka tab baru: window.open()
 * - Tulis HTML dengan img ke dalam tab baru
 *
 * @param {string} transactionId
 */
function showPhotoFull(transactionId) {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 8: LOKASI GPS
// ============================================================

/**
 * Meminta lokasi GPS semasa dari pelayar.
 *
 * Panduan:
 * 1. Semak: jika !navigator.geolocation, papar mesej ralat
 * 2. Paparkan '⏳ Mendapatkan lokasi...' dalam #location-info
 * 3. Panggil navigator.geolocation.getCurrentPosition(berjaya, gagal, pilihan)
 *    - Callback berjaya (position):
 *      · Ambil lat = position.coords.latitude.toFixed(5)
 *      · Ambil lng = position.coords.longitude.toFixed(5)
 *      · Simpan currentLocation = { lat, lng, name: `${lat}, ${lng}` }
 *      · Kemas kini #location-info dengan nama lokasi
 *      · Tambah kelas 'active' pada #btn-location
 *    - Callback gagal (error):
 *      · Paparkan mesej ralat berdasarkan error.code (1, 2, atau 3)
 *    - Pilihan: { timeout: 10000, enableHighAccuracy: true }
 */
function getLocation() {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 9: TETAPAN (SETTINGS)
// ============================================================

/**
 * Membuka modal tetapan.
 *
 * Panduan:
 * - Tambah kelas 'show' pada #settings-modal
 * - Isi #starting-balance-input dengan data.startingBalance dari loadData()
 * - Panggil updateNotifStatus()
 */
function openSettings() {
  // TODO: Implementasi di sini
}

/**
 * Menutup modal tetapan.
 *
 * Panduan:
 * - Buang kelas 'show' dari #settings-modal
 */
function closeSettings() {
  // TODO: Implementasi di sini
}

/**
 * Menyimpan baki awal dari input tetapan.
 *
 * Panduan:
 * 1. Ambil nilai dari #starting-balance-input (guna parseFloat)
 * 2. Semak: jika isNaN atau < 0, alert dan return
 * 3. Baca data: loadData()
 * 4. Set data.startingBalance = amount
 * 5. Simpan: saveData(data)
 * 6. Kira dan render baki baru
 * 7. Tutup modal: closeSettings()
 * 8. Alert kejayaan
 */
function saveStartingBalance() {
  // TODO: Implementasi di sini
}

/**
 * Memadamkan semua data (tetapkan semula ke asal).
 *
 * Panduan:
 * 1. Guna confirm() untuk meminta pengesahan (dua kali)
 * 2. Jika disahkan: localStorage.removeItem(STORAGE_KEY)
 * 3. Render baki 0 dan senarai kosong
 * 4. Tutup modal dan alert kejayaan
 */
function resetAllData() {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 10: PEMBERITAHUAN
// ============================================================

/**
 * Meminta kebenaran pemberitahuan.
 * PENTING: Mesti dipanggil selepas tindakan pengguna (bukan semasa muatkan halaman).
 *
 * Panduan:
 * - Semak: jika !('Notification' in window), return
 * - Hanya minta jika Notification.permission === 'default'
 * - Panggil Notification.requestPermission() → .then(updateNotifStatus)
 */
function requestNotificationPermission() {
  // TODO: Implementasi di sini
}

/**
 * Mengemas kini teks status pemberitahuan dalam halaman tetapan.
 *
 * Panduan:
 * - Elemen: #notif-status dan #btn-request-notif
 * - Jika pelayar tidak sokong: papar mesej dan disable butang
 * - Tukar teks berdasarkan Notification.permission:
 *   · 'default' → '⏳ Kebenaran belum diberikan. Klik butang untuk mengaktifkan.'
 *   · 'granted' → '✅ Pemberitahuan aktif!'
 *   · 'denied'  → '❌ Pemberitahuan disekat. Ubah dalam tetapan pelayar anda.'
 * - Sembunyikan butang jika permission === 'granted'
 */
function updateNotifStatus() {
  // TODO: Implementasi di sini
}

/**
 * Memaparkan pemberitahuan tempatan.
 *
 * Panduan:
 * - Semak: jika kebenaran bukan 'granted', return
 * - Pilihan: { body, icon:'icons/icon.svg', badge:'icons/icon.svg',
 *              vibrate:[200,100,200], tag:'tabungku-tx' }
 * - Jika serviceWorker tersedia dan ada controller:
 *     navigator.serviceWorker.ready → registration.showNotification(title, options)
 * - Jika tidak: new Notification(title, options)
 *
 * @param {string} title
 * @param {string} body
 */
function showLocalNotification(title, body) {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 11: PEMASANGAN PWA
// ============================================================

/**
 * Memaparkan banner ajakan pasang (#install-banner).
 *
 * Panduan:
 * - Set style.display = 'flex' pada #install-banner
 */
function showInstallBanner() {
  // TODO: Implementasi di sini
}

/**
 * Menyembunyikan banner pemasangan.
 *
 * Panduan:
 * - Set style.display = 'none' pada #install-banner
 */
function hideInstallBanner() {
  // TODO: Implementasi di sini
}

/**
 * Mencetuskan dialog pasang PWA milik pelayar.
 *
 * Panduan:
 * - Jika deferredInstallPrompt tiada: alert arahan manual dan return
 * - Panggil deferredInstallPrompt.prompt()
 * - Tunggu deferredInstallPrompt.userChoice → .then(result => { ... })
 * - Dalam then: set deferredInstallPrompt = null, panggil hideInstallBanner()
 */
function installPWA() {
  // TODO: Implementasi di sini
}

// ============================================================
// BAHAGIAN 12: SERVICE WORKER
// ============================================================

/**
 * Mendaftarkan Service Worker (sw.js).
 *
 * Panduan:
 * - Semak: jika !('serviceWorker' in navigator), return
 * - Panggil navigator.serviceWorker.register('sw.js')
 * - Dalam .then(registration):
 *   · Dengar event 'updatefound'
 *   · Dalam updatefound: simpan newWorker = registration.installing
 *   · Dengar statechange pada newWorker
 *   · Jika state === 'installed' dan ada controller: papar #update-banner
 * - Dengar 'controllerchange' pada navigator.serviceWorker
 *   · Muat semula halaman: window.location.reload()
 */
function registerServiceWorker() {
  // TODO: Implementasi di sini
}

/**
 * Mengaktifkan Service Worker baharu (kemaskini aplikasi).
 *
 * Panduan:
 * - Jika newWorker ada: hantar mesej { type: 'SKIP_WAITING' }
 *   dengan newWorker.postMessage(...)
 * - Buang kelas 'show' dari #update-banner
 */
function activateUpdate() {
  // TODO: Implementasi di sini
}

// ============================================================
// EVENT LISTENERS GLOBAL
// (Sudah siap – tidak perlu diubah)
// ============================================================

window.addEventListener('beforeinstallprompt', function(event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallBanner();
});

window.addEventListener('appinstalled', function() {
  hideInstallBanner();
  deferredInstallPrompt = null;
});

// ============================================================
// FUNGSI UTAMA: INIT
// (Sudah siap – tidak perlu diubah)
// ============================================================

function init() {
  console.log('🚀 Tabungku dimuatkan...');

  registerServiceWorker();

  const data    = loadData();
  const balance = calculateBalance(data);
  renderBalance(balance);
  renderHistory(data.transactions);
  setMode('add');

  // Butang mod transaksi
  document.getElementById('btn-mode-add').addEventListener('click', function() {
    setMode('add');
  });
  document.getElementById('btn-mode-minus').addEventListener('click', function() {
    setMode('minus');
  });

  // Butang simpan transaksi
  document.getElementById('btn-save').addEventListener('click', saveTransaction);

  // Butang kamera
  document.getElementById('btn-camera').addEventListener('click', openCamera);
  document.getElementById('camera-input').addEventListener('change', handlePhotoSelected);

  // Butang lokasi
  document.getElementById('btn-location').addEventListener('click', getLocation);

  // Butang tetapan
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-close-settings').addEventListener('click', closeSettings);
  document.getElementById('btn-save-settings').addEventListener('click', saveStartingBalance);
  document.getElementById('btn-reset').addEventListener('click', resetAllData);

  // Butang pemberitahuan dalam tetapan
  document.getElementById('btn-request-notif').addEventListener('click', function() {
    Notification.requestPermission().then(function() {
      updateNotifStatus();
    });
  });

  // Butang pasang PWA
  document.getElementById('btn-install').addEventListener('click', installPWA);
  document.getElementById('btn-dismiss-install').addEventListener('click', hideInstallBanner);

  // Butang kemaskini app
  document.getElementById('btn-update').addEventListener('click', activateUpdate);

  // Tutup modal jika klik di luar kandungan
  document.getElementById('settings-modal').addEventListener('click', function(event) {
    if (event.target === this) {
      closeSettings();
    }
  });

  // Hantar borang dengan tekan Enter
  document.getElementById('amount-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      saveTransaction();
    }
  });

  console.log('✅ Tabungku bersedia!');
}

document.addEventListener('DOMContentLoaded', init);

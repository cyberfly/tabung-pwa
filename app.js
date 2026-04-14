/**
 * app.js - Logik Utama Aplikasi Tabungku
 *
 * Panduan untuk pembangun PHP:
 * - localStorage   ≈ fail JSON di pelayan (simpan/baca data)
 * - JSON.stringify ≈ json_encode() dalam PHP
 * - JSON.parse     ≈ json_decode() dalam PHP
 * - addEventListener ≈ kaedah yang dipanggil apabila sesuatu berlaku
 * - document.getElementById ≈ mencari elemen HTML berdasarkan id
 *
 * Aliran aplikasi:
 * 1. Halaman dimuatkan → init() dipanggil
 * 2. init() membaca data dari localStorage
 * 3. init() memaparkan baki dan rekod
 * 4. Pengguna berinteraksi → event listener memanggil fungsi berkaitan
 */

'use strict'; // Mod ketat: mengelakkan ralat JavaScript yang biasa

// ============================================================
// PEMBOLEH UBAH GLOBAL
// Pemboleh ubah yang digunakan dalam banyak fungsi
// ============================================================

/** Kunci localStorage – seperti nama jadual dalam pangkalan data */
const STORAGE_KEY = 'tabungku_data';

/** Menyimpan event pemasangan PWA, digunakan apabila pengguna klik butang pasang */
let deferredInstallPrompt = null;

/** Gambar yang sedang dipilih pengguna (rentetan base64 atau null) */
let currentPhoto = null;

/** Lokasi yang sedang direkod ({lat, lng, name} atau null) */
let currentLocation = null;

/** Mod transaksi semasa: 'add' = menyimpan, 'minus' = mengeluarkan */
let currentMode = 'add';

/** Rujukan kepada Service Worker terbaharu (untuk butang kemaskini) */
let newWorker = null;

// ============================================================
// FUNGSI: MEMBACA DAN MENYIMPAN DATA
// Ini adalah "lapisan pangkalan data" aplikasi kita.
// localStorage seperti jadual dalam MySQL, tetapi lebih ringkas.
// ============================================================

/**
 * Membaca semua data dari localStorage.
 *
 * Seperti: SELECT * FROM tabungan WHERE user = 'lokal'
 *
 * @returns {Object} { startingBalance: number, transactions: Array }
 */
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);

  // Jika belum ada data, kembalikan data lalai
  if (!raw) {
    return {
      startingBalance: 0,
      transactions: []
    };
  }

  // JSON.parse: tukar rentetan JSON → objek JavaScript
  // Sama seperti json_decode($raw, true) dalam PHP
  return JSON.parse(raw);
}

/**
 * Menyimpan data ke localStorage.
 *
 * Seperti: UPDATE tabungan SET data = '$json' WHERE user = 'lokal'
 *
 * @param {Object} data - Data yang akan disimpan
 */
function saveData(data) {
  // JSON.stringify: tukar objek JavaScript → rentetan JSON
  // Sama seperti json_encode($data) dalam PHP
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ============================================================
// FUNGSI: PENGIRAAN
// ============================================================

/**
 * Mengira baki semasa berdasarkan semua transaksi.
 *
 * Seperti: SELECT (startingBalance + SUM(masuk) - SUM(keluar))
 *
 * @param {Object} data - Data dari loadData()
 * @returns {number} Baki dalam Ringgit Malaysia
 */
function calculateBalance(data) {
  let balance = data.startingBalance;

  // Gelung semua transaksi
  // forEach dalam JS sama seperti foreach($transactions as $t) dalam PHP
  data.transactions.forEach(function(t) {
    if (t.type === 'add') {
      balance += t.amount;
    } else {
      balance -= t.amount;
    }
  });

  return balance;
}

// ============================================================
// FUNGSI: FORMAT PAPARAN
// ============================================================

/**
 * Memformat nombor kepada format mata wang Ringgit Malaysia.
 *
 * Contoh: 1500.50 → "RM 1,500.50"
 *
 * @param {number} amount - Jumlah dalam nombor
 * @returns {string} Teks berformat RM
 */
function formatRM(amount) {
  // Intl.NumberFormat adalah API piawai JavaScript untuk format nombor
  // 'ms-MY' = locale Malaysia (koma sebagai pemisah ribuan, titik sebagai perpuluhan)
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Memformat cap masa ISO kepada teks tarikh yang mudah dibaca.
 *
 * Contoh: "2024-01-15T10:30:00.000Z" → "15 Jan 2024, 10:30"
 *
 * @param {string} isoString - Cap masa ISO 8601
 * @returns {string} Tarikh yang telah diformat
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('ms-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// ============================================================
// FUNGSI: RENDER (MEMAPARKAN DI SKRIN)
// "Render" bermaksud menukar data kepada paparan HTML
// ============================================================

/**
 * Memaparkan baki semasa pada kad baki.
 *
 * @param {number} balance - Baki yang akan dipaparkan
 */
function renderBalance(balance) {
  const el = document.getElementById('balance-amount');
  el.textContent = formatRM(balance);

  // Tambah kelas 'negative' jika baki negatif (warna merah)
  if (balance < 0) {
    el.classList.add('negative');
  } else {
    el.classList.remove('negative');
  }
}

/**
 * Memaparkan senarai rekod transaksi di skrin.
 * Dibuat menggunakan innerHTML (seperti echo HTML dalam PHP).
 *
 * @param {Array} transactions - Array berisi semua transaksi
 */
function renderHistory(transactions) {
  const container = document.getElementById('history-list');

  // Jika belum ada transaksi, paparkan mesej kosong
  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">🐷</div>
        <p>Tiada rekod lagi</p>
        <p>Jom mula menyimpan!</p>
      </div>
    `;
    return;
  }

  // Paparkan transaksi terbaharu di atas
  // [...transactions] membuat salinan supaya array asal tidak berubah
  const sorted = [...transactions].reverse();

  // .map() menukar setiap item array kepada rentetan HTML
  // Sama seperti foreach + echo dalam PHP, tetapi lebih ringkas
  container.innerHTML = sorted.map(function(t) {
    const sign   = t.type === 'add' ? '+' : '-';
    const amount = formatRM(t.amount);
    const date   = formatDate(t.timestamp);
    const note   = t.note || '<em>Tiada nota</em>';

    // Gambar (jika ada)
    const photoHTML = t.photo
      ? `<img class="transaction-thumb" src="${t.photo}" alt="Gambar resit" onclick="showPhotoFull('${t.id}')">`
      : '';

    // Lokasi (jika ada)
    const locationHTML = t.location
      ? `<span>📍 ${t.location.name}</span>`
      : '';

    // Templat HTML untuk satu baris transaksi
    return `
      <div class="transaction-item ${t.type}" data-id="${t.id}">
        <div class="transaction-indicator"></div>
        <div class="transaction-body">
          <span class="transaction-amount">${sign} ${amount}</span>
          <span class="transaction-note">${note}</span>
          <div class="transaction-meta">
            <span>🕐 ${date}</span>
            ${locationHTML}
          </div>
        </div>
        ${photoHTML}
      </div>
    `;
  }).join(''); // .join('') menggabungkan semua rentetan HTML menjadi satu
}

// ============================================================
// FUNGSI: TRANSAKSI
// ============================================================

/**
 * Menyimpan transaksi baru berdasarkan input pengguna.
 * Dipanggil apabila butang "Simpan Transaksi" diklik.
 */
function saveTransaction() {
  const amountInput = document.getElementById('amount-input');
  const noteInput   = document.getElementById('note-input');

  // Ambil nilai dan tukar kepada nombor
  // parseFloat() sama seperti (float) casting dalam PHP
  const amount = parseFloat(amountInput.value);

  // Pengesahan: jumlah mesti ada dan lebih dari 0
  if (!amount || amount <= 0) {
    alert('⚠️ Sila masukkan jumlah yang sah (lebih dari 0)!');
    amountInput.focus();
    return;
  }

  // Minta kebenaran pemberitahuan kali pertama pengguna berinteraksi
  // (Pelayar hanya benarkan meminta pemberitahuan selepas tindakan pengguna)
  requestNotificationPermission();

  // Baca data yang sudah ada
  const data = loadData();

  // Cipta objek transaksi baru
  // Date.now() menghasilkan nombor milisaat sejak 1970 (unik setiap milisaat)
  const transaction = {
    id: Date.now().toString(),    // ID unik (seperti AUTO_INCREMENT dalam MySQL)
    type: currentMode,            // 'add' atau 'minus'
    amount: amount,
    note: noteInput.value.trim(), // .trim() buang ruang di awal/akhir
    photo: currentPhoto,          // null jika tiada gambar
    location: currentLocation,    // null jika tiada lokasi
    timestamp: new Date().toISOString() // Masa semasa format ISO
  };

  // Tambah ke array transaksi (sama seperti array_push dalam PHP)
  data.transactions.push(transaction);

  // Simpan kembali ke localStorage
  saveData(data);

  // Kira baki baru dan kemas kini paparan
  const balance = calculateBalance(data);
  renderBalance(balance);
  renderHistory(data.transactions);

  // Bersihkan borang
  resetForm();

  // Paparkan pemberitahuan kejayaan
  const msg = currentMode === 'add'
    ? `Berjaya menyimpan ${formatRM(amount)} 🎉`
    : `Berjaya mengeluarkan ${formatRM(amount)}`;
  showLocalNotification('Tabungku', msg);
}

/**
 * Membersihkan borang selepas transaksi berjaya disimpan.
 */
function resetForm() {
  document.getElementById('amount-input').value = '';
  document.getElementById('note-input').value   = '';

  // Sembunyikan pratonton gambar
  const preview = document.getElementById('photo-preview');
  preview.src           = '';
  preview.style.display = 'none';

  // Kosongkan maklumat lokasi
  document.getElementById('location-info').textContent = '';

  // Tetapkan semula butang kamera dan lokasi
  document.getElementById('btn-camera').classList.remove('active');
  document.getElementById('btn-location').classList.remove('active');

  // Tetapkan semula pemboleh ubah global
  currentPhoto    = null;
  currentLocation = null;

  // Tetapkan semula input fail supaya boleh pilih gambar yang sama semula
  document.getElementById('camera-input').value = '';
}

// ============================================================
// FUNGSI: MOD TRANSAKSI
// ============================================================

/**
 * Menetapkan mod transaksi: menyimpan (add) atau mengeluarkan (minus).
 * Mengemas kini paparan butang dan warna borang.
 *
 * @param {string} mode - 'add' atau 'minus'
 */
function setMode(mode) {
  currentMode = mode;

  const btnAdd   = document.getElementById('btn-mode-add');
  const btnMinus = document.getElementById('btn-mode-minus');
  const title    = document.getElementById('form-title');
  const saveBtn  = document.getElementById('btn-save');

  if (mode === 'add') {
    btnAdd.classList.add('active');
    btnMinus.classList.remove('active');
    title.textContent = '➕ Tambah Simpanan';
    title.style.color = '#388E3C';
    saveBtn.classList.remove('danger');
    saveBtn.textContent = '💾 Simpan Wang';
  } else {
    btnAdd.classList.remove('active');
    btnMinus.classList.add('active');
    title.textContent = '➖ Keluarkan Wang';
    title.style.color = '#c62828';
    saveBtn.classList.add('danger');
    saveBtn.textContent = '💾 Keluarkan Wang';
  }
}

// ============================================================
// FUNGSI: KAMERA
// Mengambil gambar resit menggunakan kamera telefon atau pilih dari galeri
// ============================================================

/**
 * Membuka dialog kamera / pilih fail.
 * Caranya: klik input[type=file] yang tersembunyi secara programatik.
 */
function openCamera() {
  document.getElementById('camera-input').click();
}

/**
 * Memproses gambar yang dipilih pengguna.
 * Menukar fail gambar kepada rentetan base64 untuk disimpan dalam localStorage.
 *
 * @param {Event} event - Event 'change' dari input[type=file]
 */
function handlePhotoSelected(event) {
  const file = event.target.files[0];

  // Keluar jika tiada fail dipilih
  if (!file) return;

  // Mampat gambar sebelum disimpan supaya tidak terlalu besar
  compressAndSavePhoto(file);
}

/**
 * Memampatkan gambar dan menyimpannya sebagai base64.
 * Gambar asal boleh sangat besar (beberapa MB), kita mampatkan ke max 300KB.
 *
 * @param {File} file - Fail gambar dari input
 */
function compressAndSavePhoto(file) {
  const reader = new FileReader();

  // Callback dipanggil selepas fail selesai dibaca
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Cipta canvas untuk memampatkan gambar
      const canvas = document.createElement('canvas');

      // Saiz semula ke maksimum 600px (lebar atau tinggi)
      const MAX_SIZE = 600;
      let width  = img.width;
      let height = img.height;

      if (width > height && width > MAX_SIZE) {
        height = (height * MAX_SIZE) / width;
        width  = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width  = (width * MAX_SIZE) / height;
        height = MAX_SIZE;
      }

      canvas.width  = width;
      canvas.height = height;

      // Lukis semula gambar dalam canvas dengan saiz lebih kecil
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Eksport canvas sebagai JPEG dengan kualiti 0.7 (70%)
      currentPhoto = canvas.toDataURL('image/jpeg', 0.7);

      // Paparkan pratonton gambar
      const preview        = document.getElementById('photo-preview');
      preview.src          = currentPhoto;
      preview.style.display = 'block';

      // Tandakan butang kamera sebagai aktif
      document.getElementById('btn-camera').classList.add('active');
    };
    img.src = e.target.result;
  };

  // Mula baca fail sebagai Data URL (base64)
  reader.readAsDataURL(file);
}

/**
 * Memaparkan gambar transaksi dalam saiz penuh.
 * Dipanggil apabila pengguna klik lakaran kecil gambar dalam rekod.
 *
 * @param {string} transactionId - ID transaksi
 */
function showPhotoFull(transactionId) {
  const data = loadData();
  const t    = data.transactions.find(function(item) {
    return item.id === transactionId;
  });

  if (!t || !t.photo) return;

  // Buka gambar dalam tab/tetingkap baru
  const newTab = window.open();
  newTab.document.write(`
    <html><body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh">
    <img src="${t.photo}" style="max-width:100%;max-height:100vh;object-fit:contain">
    </body></html>
  `);
}

// ============================================================
// FUNGSI: LOKASI GPS
// Mendapatkan koordinat GPS pengguna semasa
// ============================================================

/**
 * Meminta lokasi GPS semasa dari pelayar.
 * Pelayar akan meminta kebenaran lokasi dari pengguna.
 */
function getLocation() {
  const locationInfo = document.getElementById('location-info');

  // Semak sokongan pelayar
  if (!navigator.geolocation) {
    locationInfo.textContent = '❌ Pelayar tidak menyokong GPS';
    return;
  }

  locationInfo.textContent = '⏳ Mendapatkan lokasi...';

  // getCurrentPosition: minta koordinat GPS
  // Ini async: pelayar mencari GPS, kemudian panggil callback
  navigator.geolocation.getCurrentPosition(
    // Callback berjaya – dipanggil jika berjaya mendapat lokasi
    function(position) {
      const lat = position.coords.latitude.toFixed(5);
      const lng = position.coords.longitude.toFixed(5);

      currentLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        name: `${lat}, ${lng}`
      };

      locationInfo.textContent = `📍 ${currentLocation.name}`;

      // Tandakan butang lokasi sebagai aktif
      document.getElementById('btn-location').classList.add('active');
    },

    // Callback ralat – dipanggil jika gagal
    function(error) {
      const messages = {
        1: '❌ Kebenaran lokasi ditolak',     // PERMISSION_DENIED
        2: '❌ Kedudukan tidak tersedia',      // POSITION_UNAVAILABLE
        3: '❌ Masa tamat (timeout)'           // TIMEOUT
      };
      locationInfo.textContent = messages[error.code] || '❌ Gagal mendapatkan lokasi';
    },

    // Pilihan: masa maksimum 10 saat
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// ============================================================
// FUNGSI: TETAPAN
// ============================================================

/**
 * Membuka modal tetapan.
 */
function openSettings() {
  const modal = document.getElementById('settings-modal');
  modal.classList.add('show');

  // Isi borang dengan baki awal yang telah disimpan
  const data = loadData();
  document.getElementById('starting-balance-input').value = data.startingBalance || 0;

  // Kemas kini status pemberitahuan
  updateNotifStatus();
}

/**
 * Menutup modal tetapan.
 */
function closeSettings() {
  document.getElementById('settings-modal').classList.remove('show');
}

/**
 * Menyimpan baki awal yang dimasukkan pengguna.
 * Baki awal adalah nilai simpanan sebelum mula guna aplikasi.
 */
function saveStartingBalance() {
  const input  = document.getElementById('starting-balance-input');
  const amount = parseFloat(input.value);

  // Pengesahan
  if (isNaN(amount) || amount < 0) {
    alert('⚠️ Sila masukkan nombor yang sah (minimum 0)!');
    return;
  }

  const data = loadData();
  data.startingBalance = amount;
  saveData(data);

  // Kemas kini paparan baki
  const balance = calculateBalance(data);
  renderBalance(balance);

  closeSettings();
  alert('✅ Baki awal berjaya disimpan!');
}

/**
 * Memadamkan semua data (tetapkan semula ke asal).
 * Meminta pengesahan dua kali supaya data tidak terpadam secara tidak sengaja.
 */
function resetAllData() {
  const confirmed = confirm(
    '⚠️ AMARAN!\n\nSemua data simpanan akan dipadam secara kekal.\nTidak boleh dipulihkan!\n\nTeruskan?'
  );

  if (!confirmed) return;

  const doubleConfirm = confirm('Anda pasti hendak memadam semua data?');

  if (!doubleConfirm) return;

  // Padam dari localStorage
  localStorage.removeItem(STORAGE_KEY);

  // Kemas kini paparan ke keadaan awal
  renderBalance(0);
  renderHistory([]);

  closeSettings();
  alert('✅ Semua data telah dipadam.');
}

// ============================================================
// FUNGSI: PEMBERITAHUAN
// Ada dua jenis pemberitahuan di web:
// 1. Notifications API (terus dari JS, perlukan kebenaran pengguna)
// 2. Service Worker showNotification (lebih kukuh, masih muncul di latar)
// ============================================================

/**
 * Meminta kebenaran pemberitahuan dari pengguna.
 * PENTING: Mesti dipanggil selepas tindakan pengguna (klik butang),
 * bukan semasa halaman pertama dimuatkan. Ini peraturan pelayar moden.
 */
function requestNotificationPermission() {
  // Semak sama ada pelayar menyokong Notification API
  if (!('Notification' in window)) {
    console.log('Pelayar tidak menyokong pemberitahuan');
    return;
  }

  // Hanya minta jika belum pernah ditanya
  if (Notification.permission === 'default') {
    // Minta kebenaran – pelayar akan paparkan popup pengesahan kepada pengguna
    Notification.requestPermission().then(function(permission) {
      console.log('Status kebenaran pemberitahuan:', permission);
      updateNotifStatus();
    });
  }
}

/**
 * Mengemas kini teks status pemberitahuan di halaman tetapan.
 */
function updateNotifStatus() {
  const statusEl = document.getElementById('notif-status');
  const btnNotif = document.getElementById('btn-request-notif');

  if (!('Notification' in window)) {
    statusEl.textContent = '❌ Pelayar tidak menyokong pemberitahuan';
    btnNotif.disabled    = true;
    return;
  }

  const status = {
    default: '⏳ Kebenaran belum diberikan. Klik butang untuk mengaktifkan.',
    granted: '✅ Pemberitahuan aktif!',
    denied:  '❌ Pemberitahuan disekat. Ubah dalam tetapan pelayar anda.'
  };

  statusEl.textContent = status[Notification.permission] || '';

  // Sembunyikan butang jika sudah diberi kebenaran
  btnNotif.style.display = Notification.permission === 'granted' ? 'none' : 'block';
}

/**
 * Memaparkan pemberitahuan kepada pengguna.
 * Menggunakan Service Worker untuk pemberitahuan yang lebih kukuh.
 * Jika SW tidak tersedia, gunakan Notification API biasa.
 *
 * @param {string} title - Tajuk pemberitahuan
 * @param {string} body  - Isi mesej pemberitahuan
 */
function showLocalNotification(title, body) {
  // Semak kebenaran – jangan papar jika belum dibenarkan
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Pilihan paparan pemberitahuan
  const options = {
    body: body,
    icon: 'icons/icon.svg',
    badge: 'icons/icon.svg',
    vibrate: [200, 100, 200], // Corak getar telefon: hidup 200ms, mati 100ms, hidup 200ms
    tag: 'tabungku-tx'        // Tag unik supaya pemberitahuan lama digantikan bukan ditindih
  };

  // Gunakan Service Worker jika tersedia (cara terbaik untuk PWA)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(function(registration) {
      // showNotification() melalui SW boleh muncul walaupun app diminimumkan
      registration.showNotification(title, options);
    });
  } else {
    // Sandaran: Notification API terus (hanya muncul jika app terbuka)
    new Notification(title, options);
  }
}

// ============================================================
// FUNGSI: BANNER PEMASANGAN PWA
// ============================================================

/**
 * Memaparkan banner ajakan pasang PWA.
 */
function showInstallBanner() {
  document.getElementById('install-banner').style.display = 'flex';
}

/**
 * Menyembunyikan banner pemasangan.
 */
function hideInstallBanner() {
  document.getElementById('install-banner').style.display = 'none';
}

/**
 * Mencetuskan dialog pasang PWA milik pelayar.
 * Hanya boleh dipanggil selepas event 'beforeinstallprompt' ditangkap.
 */
function installPWA() {
  if (!deferredInstallPrompt) {
    alert('Untuk memasang: di Chrome, klik ikon ⋮ → "Tambah ke skrin utama"');
    return;
  }

  // Paparkan dialog pasang milik pelayar
  deferredInstallPrompt.prompt();

  // Tunggu pengguna membuat pilihan
  deferredInstallPrompt.userChoice.then(function(result) {
    console.log('Pilihan pemasangan:', result.outcome); // 'accepted' atau 'dismissed'

    // Event ini hanya boleh digunakan sekali, mesti ditetapkan semula
    deferredInstallPrompt = null;
    hideInstallBanner();
  });
}

// ============================================================
// FUNGSI: SERVICE WORKER
// ============================================================

/**
 * Mendaftarkan Service Worker.
 * Mesti dipanggil sekali apabila aplikasi dimuatkan.
 *
 * Service Worker akan:
 * - Cache fail untuk luar talian (offline)
 * - Mengendalikan pemberitahuan tolak (push notification)
 * - Memintas permintaan rangkaian
 */
function registerServiceWorker() {
  // Semak sokongan pelayar
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker tidak disokong oleh pelayar ini');
    return;
  }

  navigator.serviceWorker.register('sw.js')
    .then(function(registration) {
      console.log('✅ Service Worker berdaftar. Skop:', registration.scope);

      // Kesan jika ada Service Worker baharu yang menunggu
      registration.addEventListener('updatefound', function() {
        newWorker = registration.installing;

        newWorker.addEventListener('statechange', function() {
          // SW baharu sudah dipasang tetapi belum aktif (menunggu tab lama ditutup)
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Paparkan banner kemaskini
            document.getElementById('update-banner').classList.add('show');
          }
        });
      });
    })
    .catch(function(error) {
      console.error('❌ Service Worker gagal didaftarkan:', error);
    });

  // Muat semula halaman selepas SW baharu diaktifkan
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

/**
 * Mengaktifkan Service Worker baharu (kemaskini aplikasi).
 * Dipanggil apabila pengguna klik butang "Kemaskini" di banner.
 */
function activateUpdate() {
  if (newWorker) {
    // Hantar mesej kepada SW baharu untuk terus aktif
    newWorker.postMessage({ type: 'SKIP_WAITING' });
  }
  document.getElementById('update-banner').classList.remove('show');
}

// ============================================================
// EVENT LISTENERS GLOBAL
// Diletakkan di luar init() kerana diperlukan seawal mungkin
// ============================================================

/**
 * Event: beforeinstallprompt
 * Pelayar mencetuskan event ini apabila PWA memenuhi syarat untuk dipasang.
 * Secara lalai pelayar memaparkan banner automatik,
 * kita halang dulu (preventDefault) dan simpan eventnya.
 * Kemudian kita paparkan banner kustom kita sendiri.
 */
window.addEventListener('beforeinstallprompt', function(event) {
  console.log('💡 PWA boleh dipasang!');

  // Halang banner automatik pelayar (supaya kita boleh papar sendiri)
  event.preventDefault();

  // Simpan event untuk digunakan apabila pengguna klik butang pasang
  deferredInstallPrompt = event;

  // Paparkan banner pemasangan kita sendiri
  showInstallBanner();
});

/**
 * Event: appinstalled
 * Dipanggil selepas PWA berjaya dipasang.
 */
window.addEventListener('appinstalled', function() {
  console.log('🎉 PWA berjaya dipasang!');
  hideInstallBanner();
  deferredInstallPrompt = null;
});

// ============================================================
// FUNGSI UTAMA: INIT
// Dijalankan pertama kali apabila halaman dimuatkan.
// Sama seperti constructor atau index.php dalam PHP.
// ============================================================

/**
 * Memulakan semua komponen aplikasi.
 * Urutan penting: daftar SW → baca data → render → pasang event
 */
function init() {
  console.log('🚀 Tabungku dimuatkan...');

  // 1. Daftarkan Service Worker (untuk luar talian + pemberitahuan)
  registerServiceWorker();

  // 2. Baca data dari localStorage
  const data = loadData();

  // 3. Paparkan baki dan rekod
  const balance = calculateBalance(data);
  renderBalance(balance);
  renderHistory(data.transactions);

  // 4. Tetapkan mod lalai = menyimpan
  setMode('add');

  // 5. Pasang event listener untuk butang-butang

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

  // Tutup modal jika klik di luar kandungan (pada overlay)
  document.getElementById('settings-modal').addEventListener('click', function(event) {
    // Hanya tutup jika klik tepat pada overlay (bukan pada kandungan modal)
    if (event.target === this) {
      closeSettings();
    }
  });

  // Hantar borang dengan tekan Enter pada input jumlah
  document.getElementById('amount-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      saveTransaction();
    }
  });

  console.log('✅ Tabungku bersedia!');
}

// ============================================================
// TITIK MASUK APLIKASI
// DOMContentLoaded: event yang dipanggil apabila HTML selesai dimuatkan
// Sama seperti "apabila halaman pertama diakses" dalam PHP
// ============================================================
document.addEventListener('DOMContentLoaded', init);

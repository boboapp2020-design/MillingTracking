/* Service Worker — ระบบติดตามงานซ่อมลูกหีบ (PWA) */
/* กลยุทธ์: network-first สำหรับไฟล์ในเว็บ (ได้ของสดเสมอเมื่อออนไลน์) · ออฟไลน์ค่อยใช้ cache
   ไม่ยุ่งกับ cross-origin (Google Sheet sync / Google Fonts) ปล่อยให้ผ่าน network ปกติ */
const VER = 'v36';
const CACHE = 'milling-' + VER;
const SHELL = [
  './', 'index.html', 'dashboard.html',
  'shared.css?v=36', 'shared.js?v=36', 'input.js?v=36', 'dashboard.js?v=36',
  'logo.png', 'milling.png', 'truck.png',
  'icon-192.png?v=36', 'icon-512.png?v=36', 'manifest.webmanifest?v=36'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // เก็บทีละไฟล์ กัน 1 ไฟล์พังแล้วล้มทั้งชุด
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // ปล่อย sync/ฟอนต์ผ่าน network เอง

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) {
        return r || caches.match('index.html');
      });
    })
  );
});

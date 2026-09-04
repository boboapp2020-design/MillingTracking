/* Service Worker — ระบบติดตามงานซ่อมลูกหีบ (PWA) */
/* กลยุทธ์:
   - HTML / JS / CSS / manifest / json  → network-first + revalidate (cache:'no-cache') → ได้ไฟล์ใหม่ทันทีหลัง deploy, ออฟไลน์ค่อยใช้ cache
   - รูปภาพ (png/jpg) ไม่เคยเปลี่ยน       → cache-first (ไม่ยิงเน็ตซ้ำทุกครั้งที่เปิด — รูปรวม ~5 MB)
   - version.json และ URL ที่มี ?t= / ?u=  → ไม่เก็บ cache (กันสะสม entry ไม่รู้จบ)
   - cross-origin (Google Sheet sync / Google Fonts) → ปล่อยผ่าน network ปกติ
   - เทียบ cache แบบ ignoreSearch → ?v=N / ?u=ts ไม่ทำให้พลาด cache ตอนออฟไลน์ */
const VER = 'v58';
const CACHE = 'milling-' + VER;
const SHELL = [
  './', 'index.html', 'dashboard.html',
  'shared.css', 'shared.js', 'input.js', 'dashboard.js',
  'logo.png', 'milling.png', 'truck.png', 'Background.jpg',
  'icon-192.png', 'icon-512.png', 'manifest.webmanifest'
];
const IMG_RE = /\.(png|jpe?g|gif|webp|svg|ico)$/i;

function isVolatile(url) {           // ไม่เก็บลง cache
  return /version\.json$/.test(url.pathname) || url.searchParams.has('t') || url.searchParams.has('u');
}
function pageFallback(url) {         // ออฟไลน์: คืนหน้าเดิมที่ขอ ไม่ใช่ index เสมอ
  return caches.match(url.pathname, { ignoreSearch: true })
    .then(function (r) { return r || caches.match('index.html', { ignoreSearch: true }); });
}

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); })); // ทีละไฟล์ กัน 1 ไฟล์พังแล้วล้มทั้งชุด
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    // เวอร์ชันใหม่ activate ครั้งเดียว → รีโหลดทุกแท็บที่เปิดค้างอยู่ให้มาใช้โค้ดใหม่ (ครอบคลุมเครื่องที่ยังรันโค้ดเก่า ไม่ต้องให้ใครกด F5)
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
      return Promise.all(cs.map(function (c) {
        return ('navigate' in c) ? c.navigate(c.url).catch(function () {}) : Promise.resolve();
      }));
    });
  }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;           // ปล่อย sync/ฟอนต์ผ่าน network เอง

  var isNav = req.mode === 'navigate';
  var isImg = IMG_RE.test(url.pathname);

  // รูป: cache-first
  if (isImg) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (r) {
      return r || fetch(req).then(function (res) {
        if (res && res.status === 200) { var c1 = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, c1); }).catch(function () {}); }
        return res;
      });
    }));
    return;
  }

  // HTML/JS/CSS/json: network-first + revalidate.
  // navigation: ใช้ URL string (Request mode:navigate + init ทำบางเบราว์เซอร์เก่า throw) และ redirect:'manual'
  //   → โฮสต์ที่ redirect /index.html→/ (เช่น Cloudflare 307) จะได้ opaqueredirect ส่งต่อให้เบราว์เซอร์ตามเอง
  //   (ถ้าใช้ follow แล้ว respondWith response ที่ redirected=true ให้ navigation เบราว์เซอร์จะ NetworkError หน้าไม่โหลด)
  var net = isNav
    ? fetch(url.href, { cache: 'no-cache', credentials: 'same-origin', redirect: 'manual' })
    : fetch(req, { cache: 'no-cache' });

  e.respondWith(net.then(function (res) {
    if (res && res.type === 'opaqueredirect') return res;            // ปล่อย redirect ผ่าน ไม่ cache
    if (res && res.status === 200 && !isVolatile(url)) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(isNav ? url.pathname : req, copy); }).catch(function () {}); // เก็บ HTML ด้วย pathname (ไม่ติด ?u=)
    }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (r) {
      return r || (isNav ? pageFallback(url) : Response.error());
    });
  }));
});

/*  ระบบติดตามงานซ่อมลูกหีบ — Google Apps Script Backend
    ใช้คู่กับไฟล์ index.html (ปุ่ม "☁️ เชื่อม Sheet")
    ---------------------------------------------------------------
    วิธีติดตั้ง (ทำครั้งเดียว ~5 นาที):
    1) เปิด Google Sheet "ลูกหีบ Maintenance"
    2) เมนู  ส่วนขยาย (Extensions) →  Apps Script
    3) ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดนี้ลงไป → กด บันทึก (ไอคอนแผ่นดิสก์)
    4) กด  ทำให้ใช้งานได้ (Deploy) →  การทำให้ใช้งานได้ครั้งใหม่ (New deployment)
    5) ไอคอนเฟือง → เลือกประเภท  เว็บแอป (Web app)
    6) ตั้งค่า:
         - Execute as (ดำเนินการในฐานะ):  ฉัน (Me)
         - Who has access (ผู้ที่มีสิทธิ์เข้าถึง):  ทุกคน (Anyone)
       *ถ้าต้องการจำกัดเฉพาะในองค์กร เลือก "ทุกคนภายใน <องค์กร>" ได้ แต่ผู้ใช้ต้องล็อกอินบัญชีองค์กร
    7) กด ทำให้ใช้งานได้ → อนุญาตสิทธิ์ (Authorize) ตามขั้นตอน
    8) คัดลอก  URL เว็บแอป  (ลงท้ายด้วย /exec)
    9) กลับไปที่เว็บ index.html → กดปุ่ม "☁️ เชื่อม Sheet" → วาง URL → เสร็จ!

    หมายเหตุ: เมื่อแก้โค้ดภายหลัง ต้อง Deploy → "จัดการการทำให้ใช้งานได้" → แก้ไข → เวอร์ชันใหม่
    ข้อมูลหลักเก็บเป็น JSON ในชีทซ่อน "_state" ส่วนชีท "ชีต1" คือตารางอ่านง่ายสำหรับคน
*/

var STATE_SHEET = '_state';
var TABLE_SHEET = 'ชีต1';
var LOG_SHEET   = 'LogBook';   // ประวัติการบันทึกรายวัน (ทุก entry = 1 แถว)

/* กุญแจลับ — ต้องตรงกับ SYNC_KEY ใน shared.js ทุกคำขอที่ไม่มี key ที่ถูกต้องจะถูกปฏิเสธ
   เปลี่ยนได้: ตั้งค่าใหม่ตรงนี้ แล้วแก้ SYNC_KEY ใน shared.js ให้ตรงกัน */
var SECRET = 'mlk_7Qx2F9pR4vT8nZ6bW3sK';

function authorized_(e, body) {
  var k = (body && body.key) || (e && e.parameter && e.parameter.key) || '';
  return k === SECRET;
}

function doGet(e) {
  if (!authorized_(e, null)) return json_({ ok: false, error: 'unauthorized' });
  if (e && e.parameter && e.parameter.snap) return json_({ ok: true, snapshots: readSnapshots_() });
  return json_({ ok: true, data: getState_() });
}

function readSnapshots_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Snapshot');
  if (!sh || sh.getLastRow() < 2) return [];
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();
  return vals.map(function (r) { return { date: String(r[0]), overall: (r[2] || 0) * 100, plan: (r[3] || 0) * 100 }; });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!authorized_(e, body)) return json_({ ok: false, error: 'unauthorized' });
    if (body && body.action === 'snapshot' && body.snapshot) {
      appendSnapshot_(body.snapshot);
      return json_({ ok: true, savedAt: new Date().toISOString() });
    }
    if (body && body.data && body.data.groups) {
      // ===== เส้นทางหลัก (เร็ว): lock เฉพาะ merge+เซฟ _state → POST ไม่ค้างคิวกัน =====
      var lock = LockService.getScriptLock();
      try { lock.waitLock(20000); } catch (le) {}
      var merged;
      try {
        merged = mergeState_(getState_(), body.data);
        setState_(merged);                       // เขียน JSON อย่างเดียว เร็ว (~1-2 วิ)
      } finally { try { lock.releaseLock(); } catch (le2) {} }
      maybeWriteTables_(merged);                  // เขียนตารางอ่านง่าย (ช้า) นอก lock + จำกัดความถี่ ไม่ให้ POST หน่วง
      // ยืนยันว่า "เก็บจริง": อ่านกลับมานับ log แล้วตอบพร้อม id ที่เก็บได้ — แอปใช้เช็คว่ารายการของตัวเองอยู่ในชีทจริง ไม่ใช่แค่ตอบ ok
      var back = getState_(), ids = [];
      if (back && back.logs) for (var q = 0; q < back.logs.length; q++) ids.push(back.logs[q].id);
      return json_({ ok: true, savedAt: new Date().toISOString(), merged: true, stored: ids.length, ids: ids });
    }
    return json_({ ok: false, error: 'invalid payload' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* เขียนตารางอ่านง่าย (ชีต1 + LogBook) แบบจำกัดความถี่ — ลดภาระ POST ให้เร็ว ไม่ชนคิวกัน
   _state (ข้อมูลจริงที่แอปใช้) อัปเดตทุก POST อยู่แล้ว · ตารางคน-อ่านช้ากว่าได้ ≤30 วิ */
function maybeWriteTables_(data) {
  try {
    var props = PropertiesService.getScriptProperties();
    var now = Date.now(), last = +(props.getProperty('tablesAt') || 0);
    if (now - last < 30000) return;              // เพิ่งเขียนไม่ถึง 30 วิ → ข้าม
    props.setProperty('tablesAt', String(now));
    writeTable_(data);
    writeLogBook_(data);
  } catch (e) {}
}

function appendSnapshot_(s) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Snapshot');
  var jobs = s.jobs || [];
  var header = ['วันที่', 'เวลา', '% รวม (จริง)', '% ตามแผน'].concat(jobs.map(function (j) { return j.name; }));
  if (!sh) {
    sh = ss.insertSheet('Snapshot');
    sh.getRange(1, 1, 1, header.length).setValues([header])
      .setFontWeight('bold').setBackground('#12a150').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  var row = [s.date, s.time, s.overall / 100, s.plan / 100]
    .concat(jobs.map(function (j) { return j.pct / 100; }));
  var last = sh.getLastRow();
  var target = last + 1;                       // upsert: same date → overwrite, else append
  if (last >= 2) {
    var dates = sh.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < dates.length; i++) {
      if (String(dates[i][0]) === String(s.date)) { target = i + 2; break; }
    }
  }
  sh.getRange(target, 1, 1, row.length).setValues([row]);
  if (sh.getLastRow() >= 2) {
    sh.getRange(2, 3, sh.getLastRow() - 1, 2 + jobs.length).setNumberFormat('0.00%');
  }
}

/* เก็บ state เป็น "หลายช่อง" (A1, A2, A3 …) ชิ้นละ ≤ 40,000 ตัวอักษร
   เหตุผล: Google Sheets รับได้ ≤ 50,000 ตัวอักษรต่อ 1 ช่อง — ของเดิมเก็บช่องเดียว ข้อมูลโตจน 49,990 ชน
   เพดาน แล้ว "รายการใหม่ไม่ถูกเก็บ" ทั้งที่ตอบ ok (บันทึกหายเงียบๆ ตั้งแต่ 25/09) */
var STATE_CHUNK = 40000;
function getState_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(STATE_SHEET);
  if (!sh) return null;
  var last = sh.getLastRow();
  if (last < 1) return null;
  var cells = sh.getRange(1, 1, last, 1).getValues();
  var s = '';
  for (var i = 0; i < cells.length; i++) s += (cells[i][0] || '');
  if (!s) return null;
  try { return JSON.parse(s); } catch (e) { return null; }
}

function setState_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(STATE_SHEET);
  if (!sh) { sh = ss.insertSheet(STATE_SHEET); sh.hideSheet(); }
  var json = JSON.stringify(data);
  var parts = [];
  for (var i = 0; i < json.length; i += STATE_CHUNK) parts.push([json.substring(i, i + STATE_CHUNK)]);
  if (!parts.length) parts.push(['']);
  var prevLast = sh.getLastRow();
  sh.getRange(1, 1, parts.length, 1).setValues(parts);
  if (prevLast > parts.length) sh.getRange(parts.length + 1, 1, prevLast - parts.length, 1).clearContent();  // ล้างช่องเก่าที่เกิน
  SpreadsheetApp.flush();
}

/* ===== merge state ฝั่งเซิร์ฟเวอร์ (แหล่งความจริงเดียว) =====
   รวม log แบบไม่ทับกัน + ความคืบหน้าไม่ถอยหลัง → เครื่องที่ส่งของเก่ามาก็ทำให้ข้อมูลหายไม่ได้ */
function logRev_(L) { return Math.max(+L.reviewTs || 0, +L.ts || 0, +L.edited || 0); }
function mergeLogs_(aLogs, bLogs) {
  var byId = {}, order = [];
  function put(L) {
    if (!L || !L.id) return;
    var cur = byId[L.id];
    if (!cur) { byId[L.id] = L; order.push(L.id); return; }
    if (cur.status === 'deleted') return;                 // tombstone ชนะและไม่ฟื้น
    if (L.status === 'deleted') { byId[L.id] = L; return; }
    var approvedWins = (L.status === 'approved' && cur.status !== 'approved');
    var staleApproved = (cur.status === 'approved' && L.status !== 'approved');
    if (staleApproved) return;                             // ของเดิมอนุมัติแล้ว ของใหม่เก่ากว่า → ไม่ถอย
    if (approvedWins || logRev_(L) > logRev_(cur)) {
      var keepProg = Math.max(+cur.prog || 0, +L.prog || 0);
      if (L.status === 'approved') L.prog = keepProg;
      byId[L.id] = L;
    }
  }
  (aLogs || []).forEach(put);
  (bLogs || []).forEach(put);
  return order.map(function (id) { return byId[id]; });
}
function applyApprovedToBase_(d) {
  var agg = {};
  (d.logs || []).forEach(function (L) {
    if (!L || L.status !== 'approved' || !L.mid) return;
    var k = L.mid + '|' + L.ti, p = Math.max(0, Math.min(100, +L.prog || 0));
    if (!(k in agg) || p > agg[k]) agg[k] = p;
  });
  (d.groups || []).forEach(function (g) {
    (g.machines || []).forEach(function (m) {
      (m.tasks || []).forEach(function (t, i) {
        var k = m.id + '|' + i;
        if (k in agg) { var np = Math.max(+t.prog || 0, agg[k]); if (np !== (+t.prog || 0)) t.prog = np; }
      });
    });
  });
}
function mergeState_(stored, incoming) {
  if (!stored || !stored.groups) return incoming;
  if (!incoming || !incoming.groups) return stored;
  var base = incoming;                                     // โครงสร้าง/ชื่อผู้บันทึกล่าสุดจากเครื่องที่ส่งมา
  var sMap = {};
  (stored.groups || []).forEach(function (g) { (g.machines || []).forEach(function (m) { sMap[m.id] = m; }); });
  (base.groups || []).forEach(function (g) {
    (g.machines || []).forEach(function (m) {
      var sm = sMap[m.id]; if (!sm) return;
      if ((!m.owner || !('' + m.owner).trim()) && sm.owner) m.owner = sm.owner;
      (m.tasks || []).forEach(function (t, i) {
        var st = (sm.tasks || [])[i]; if (!st) return;
        var mp = Math.max(+t.prog || 0, +st.prog || 0);    // ความคืบหน้าไม่ถอยหลัง
        if (mp !== (+t.prog || 0)) t.prog = mp;
        if ((t.days == null || !(t.days > 0)) && st.days > 0) t.days = st.days;  // อย่าให้ "จำนวนวัน" หาย (เครื่องเก่าที่ยังไม่ migrate ส่งวันว่างมา)
        if ((t.labor == null || t.labor === '') && st.labor != null) t.labor = st.labor;
        if ((!t.note || t.note === '') && st.note) t.note = st.note;
      });
    });
  });
  base.logs = mergeLogs_(stored.logs, incoming.logs);       // รวม log ทั้งสองฝั่ง ไม่ทับกัน
  applyApprovedToBase_(base);                               // % งาน = สูงสุดจาก log ที่ตรวจแล้ว (ทั้งสองฝั่ง)
  base.mig = Math.max(+base.mig || 0, +stored.mig || 0);
  base.updated = Math.max(+base.updated || 0, +stored.updated || 0, Date.now());
  if (!base.pins && stored.pins) base.pins = stored.pins;
  return base;
}

function serial_(s) {
  if (s === null || s === '' || s === undefined) return '';
  var base = new Date(2026, 8, 11);            // 46276 = 11/09/2026
  var d = new Date(base.getTime() + (s - 46276) * 86400000);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function writeTable_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TABLE_SHEET);
  if (!sh) { sh = ss.insertSheet(TABLE_SHEET); }
  sh.clear();
  // คอลัมน์ L–N เป็น "สูตรในชีท" (ไม่ใช่ค่าที่เว็บส่งมา) → ชีทคำนวณ % รวมสะสมเองอิสระจากเว็บ เอาไว้ชนกัน
  var head = ['กลุ่ม', 'เครื่องจักร', 'ผู้รับผิดชอบ', 'งาน (Task)', 'จำนวนวัน', 'แรงงาน(คน)',
              'เริ่ม', 'แล้วเสร็จ', 'น้ำหนัก(man-day)', '% คืบหน้า', 'หมายเหตุ',
              'man-hour (คน×วัน×8)', 'ทำแล้ว (man-hr)', 'นับรวม (1=ใช่)'];
  var rows = [head];
  (data.groups || []).forEach(function (g) {
    (g.machines || []).forEach(function (m) {
      (m.tasks || []).forEach(function (t) {
        var md = (t.days > 0 && t.labor > 0) ? t.days * t.labor : '';
        var r = rows.length + 1;                                   // แถวจริงในชีท
        rows.push([g.name, m.name, m.owner || '', t.name, t.days == null ? '' : t.days,
                   t.labor == null ? '' : t.labor, serial_(t.start), serial_(t.finish),
                   md, (t.prog || 0) / 100, t.note || '',
                   '=IF(AND(E' + r + '>0,F' + r + '>0),E' + r + '*F' + r + '*8,"")',   // man-hour
                   '=IF(L' + r + '="","",L' + r + '*J' + r + ')',                       // ทำแล้ว
                   (m.id === 'pdump' ? 0 : 1)]);                                        // drump+ตะกาว ไม่นับใน 100%
      });
    });
  });
  sh.getRange(1, 1, rows.length, head.length).setValues(rows);
  sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#2b7fff').setFontColor('#ffffff');
  sh.getRange(2, 10, rows.length - 1, 1).setNumberFormat('0%');   // % คืบหน้า
  sh.setFrozenRows(1);
  try { sh.autoResizeColumns(1, head.length); } catch (e) {}
  var stamp = ss.getSheetByName(TABLE_SHEET);
  stamp.getRange(rows.length + 2, 1).setValue('อัปเดตล่าสุด: ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'));
  writeSummary_(data, rows.length);
}

/* ชีท "Summary": % รวมสะสม ที่ "ชีทคำนวณเอง" จากคอลัมน์สูตรใน ชีต1 + ค่าที่เว็บส่งมา → ดูเทียบกันได้ทันที */
function writeSummary_(data, lastRow) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Summary');
  if (!sh) { sh = ss.insertSheet('Summary'); }
  sh.clear();
  var T = "'" + TABLE_SHEET + "'!";
  var s = (data && data.summary) || {};
  var rows = [
    ['รายการ', 'ค่า', 'ที่มา'],
    ['Σ man-hour ทั้งโปรเจกต์ (10 งาน)', '=SUMIF(' + T + 'N2:N' + lastRow + ',1,' + T + 'L2:L' + lastRow + ')', 'สูตรในชีท: Σ คน×วัน×8 (ไม่รวม drump+ตะกาว)'],
    ['Σ man-hour ที่ทำแล้ว',          '=SUMIF(' + T + 'N2:N' + lastRow + ',1,' + T + 'M2:M' + lastRow + ')', 'สูตรในชีท: Σ man-hour × % คืบหน้า'],
    ['% รวมสะสม (ชีทคำนวณเอง)',       '=IF(B2>0,B3/B2,0)', 'B3 ÷ B2'],
    ['% รวมสะสม (เว็บส่งมา)',          (s.overall == null ? '' : s.overall / 100), 'จากแอป ' + (s.ver ? 'v' + s.ver : '') + ' ณ ' + (s.asOf || '')],
    ['ผลต่าง (ชีท − เว็บ)',            '=IF(B5="","",B4-B5)', 'ควรเป็น 0.00%'],
    ['อัปเดตล่าสุด', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'), 'เวลาชีท (' + Session.getScriptTimeZone() + ')']
  ];
  sh.getRange(1, 1, rows.length, 3).setValues(rows);
  sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#12a150').setFontColor('#ffffff');
  sh.getRange(4, 2, 3, 1).setNumberFormat('0.000%');
  sh.getRange(2, 2, 2, 1).setNumberFormat('#,##0.0');
  sh.getRange(4, 1, 1, 3).setFontWeight('bold').setBackground('#e8f5ee');
  try { sh.autoResizeColumns(1, 3); } catch (e) {}
}

/* ประวัติการบันทึกรายวัน — เขียน log ทั้งหมดเป็นแถว (เก็บได้เรื่อยๆ ทุกวัน) */
function writeLogBook_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LOG_SHEET);
  if (!sh) { sh = ss.insertSheet(LOG_SHEET); }
  sh.clear();
  var head = ['วันที่', 'เครื่องจักร', 'งาน (Task)', 'ผู้บันทึก', 'จำนวนคน', '% คืบหน้า', 'หมายเหตุ', 'สถานะ', 'เวลาบันทึก'];
  var logs = (data.logs || []).slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  var rows = [head];
  logs.forEach(function (L) {
    if (L.status === 'deleted') return; // log ที่ยกเลิกแล้ว (tombstone) ไม่แสดงใน LogBook
    rows.push([
      L.date || '', L.machineName || '', L.taskName || '', L.by || '',
      (L.labor == null ? '' : L.labor), (L.prog || 0) / 100, L.note || '',
      (L.status === 'approved' ? 'ตรวจแล้ว' : (L.status === 'rejected' ? 'งานไม่ผ่าน (% ไม่นับ)' : 'รอตรวจสอบ')),
      L.ts ? Utilities.formatDate(new Date(L.ts), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : ''
    ]);
  });
  if (rows.length < 2) rows.push(['— ยังไม่มีการบันทึก —', '', '', '', '', '', '', '', '']);
  sh.getRange(1, 1, rows.length, head.length).setValues(rows);
  sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#e0453b').setFontColor('#ffffff');
  if (rows.length > 1) sh.getRange(2, 6, rows.length - 1, 1).setNumberFormat('0%');
  sh.setFrozenRows(1);
  try { sh.autoResizeColumns(1, head.length); } catch (e) {}
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

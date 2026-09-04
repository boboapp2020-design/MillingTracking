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
      setState_(body.data);
      writeTable_(body.data);
      writeLogBook_(body.data);
      return json_({ ok: true, savedAt: new Date().toISOString() });
    }
    return json_({ ok: false, error: 'invalid payload' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
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

function getState_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(STATE_SHEET);
  if (!sh) return null;
  var v = sh.getRange('A1').getValue();
  if (!v) return null;
  try { return JSON.parse(v); } catch (e) { return null; }
}

function setState_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(STATE_SHEET);
  if (!sh) { sh = ss.insertSheet(STATE_SHEET); sh.hideSheet(); }
  sh.getRange('A1').setValue(JSON.stringify(data));
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
    rows.push([
      L.date || '', L.machineName || '', L.taskName || '', L.by || '',
      (L.labor == null ? '' : L.labor), (L.prog || 0) / 100, L.note || '',
      (L.status === 'approved' ? 'ตรวจแล้ว' : 'รอตรวจสอบ'),
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

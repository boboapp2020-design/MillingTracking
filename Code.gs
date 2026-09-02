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

function doGet(e) {
  return json_({ ok: true, data: getState_() });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body && body.data && body.data.groups) {
      setState_(body.data);
      writeTable_(body.data);
      return json_({ ok: true, savedAt: new Date().toISOString() });
    }
    return json_({ ok: false, error: 'invalid payload' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
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
  var head = ['กลุ่ม', 'เครื่องจักร', 'ผู้รับผิดชอบ', 'งาน (Task)', 'จำนวนวัน', 'แรงงาน(คน)',
              'เริ่ม', 'แล้วเสร็จ', 'น้ำหนัก(man-day)', '% คืบหน้า', 'หมายเหตุ'];
  var rows = [head];
  (data.groups || []).forEach(function (g) {
    (g.machines || []).forEach(function (m) {
      (m.tasks || []).forEach(function (t) {
        var md = (t.days > 0 && t.labor > 0) ? t.days * t.labor : '';
        rows.push([g.name, m.name, m.owner || '', t.name, t.days == null ? '' : t.days,
                   t.labor == null ? '' : t.labor, serial_(t.start), serial_(t.finish),
                   md, (t.prog || 0) / 100, t.note || '']);
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
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

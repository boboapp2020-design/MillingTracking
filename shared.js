"use strict";
/* ============ ระบบติดตามงานซ่อมลูกหีบ — core ใช้ร่วมทั้ง 2 หน้า (index + dashboard) ============ */
const ANCHOR_SERIAL=46276, ANCHOR=new Date(2026,8,11);
function sd(s){const d=new Date(ANCHOR);d.setDate(d.getDate()+(s-ANCHOR_SERIAL));return d;}
function dToSerial(d){return ANCHOR_SERIAL+Math.round((d-ANCHOR)/86400000);}
function isoOf(s){if(s==null||s==="")return"";const d=sd(s);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function serialOfIso(iso){if(!iso)return null;const p=iso.split("-");return dToSerial(new Date(+p[0],+p[1]-1,+p[2]));}
function fmtTH(s){if(s==null||s==="")return"—";const d=sd(s);return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+(d.getFullYear()+543).toString().slice(2);}
const APP_VER=46; // ต้องตรงกับ version.json — bump ทุก deploy (แอปจะอัปเดตตัวเองทุกเครื่องเมื่อเลขนี้เปลี่ยน)
/* กติกาวันทำงาน (ตั้งต้นใหม่ 03/09/2026): ทำงานทุกวัน หยุดเฉพาะ "วันอาทิตย์" + วันหยุดพิเศษ 11/09/2026 และ 26/10/2026 · วันละ 8 ชม. */
const HOLIDAYS=new Set([46276,46321]); // 11/09/2026, 26/10/2026
function isHoliday(d){return d.getDay()===0||HOLIDAYS.has(dToSerial(d));}
function workingSerials(s,f){if(s==null||f==null)return[];if(f<s)[s,f]=[f,s];const out=[];for(let x=s;x<=f;x++)if(!isHoliday(sd(x)))out.push(x);return out.length?out:[s];}

const SEED={groups:[
  {id:"mill",name:"กลุ่มลูกหีบ",machines:[
    {id:"m1",name:"ลูกหีบ ชุดที่ 1",tasks:[["Setting ลูกหีบ ตั้ง A2,A3",1,4,46266,46266],["ลงหวีซอง",4,4,46267,46270],["ประกอบเฟืองลูกหีบ+ขัดเพลาลูกหีบ",1,4,46272,46272],["ลงลูกป้อนบน (PF)+ประกอบแบริ่ง",3,4,46273,46275],["Setting ลูกหีบ ตั้ง A1",2,4,46277,46279],["ลงหวีกลาง+Setting ตั้ง C1,C2,C3",3,4,46280,46282],["ลง UF",1,4,46283,46283],["Setting ลูกหีบ B1",1,4,46284,46284],["ยกลูก top",1,4,46286,46286],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,4,46287,46287],["ประกอบ Tailbar + box couping ลูก top",1,4,46288,46288],["ประกอบ Tailbar + box couping ป้อนล่าง 1",1,4,46289,46289],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,2,46290,46291],["เข้างานติดตั้งสายน้ำ Cooling",2,2,46293,46294],["ประกอบถาดน้ำมันลูกหีบ",1,2,46290,46290],["ประกอบโซ่+Spocket+Cover",1,4,46295,46295],["ประกอบชู๊ท+ตั้งระยะเปิด",3,4,46296,46298]]},
    {id:"m2",name:"ลูกหีบ ชุดที่ 2",tasks:[["ลูกหีบชุด 2 Plan เข้า",1,4,46284,46285],["ประกอบบังไบ",1,4,46288,46288],["ประกอบ Shap",1,4,46289,46289],["ประกอบเฟืองลูกหน้า",1,4,46290,46290],["ยกลูกหีบลงแท่น",1,4,46291,46291],["ลงลูกป้อนบน (PF)+ประกอบแบริ่ง",1,4,46293,46293],["Setting A2,A3",1,4,46294,46294],["ประกอบหวีกลาง",3,4,46295,46297],["Setting C1,C2,C3",3,4,46298,46301],["ประกอบหวีซอง",4,4,46302,46305],["ยกลูกป้อนบน",3,4,46307,46309],["Setting A1",2,4,46310,46311],["ลง UF",1,4,46312,46312],["Setting B1",1,4,46314,46314],["ยกลูก top",1,4,46314,46314],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,4,46315,46315],["ประกอบ Tailbar + box couping ลูก top",1,4,46316,46316],["ประกอบ Tailbar + box couping ป้อนล่าง 1",1,4,46317,46317],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,4,46318,46319],["เข้างานติดตั้งสายน้ำ Cooling",2,4,46322,46323],["ประกอบถาดน้ำมันลูกหีบ",1,4,46324,46324],["ประกอบโซ่+Spocket+Cover",1,4,46325,46326],["ประกอบชู๊ท+ตั้งระยะเปิด",3,4,46328,46330]]},
    {id:"m3",name:"ลูกหีบ ชุดที่ 3",tasks:[["ประกอบเฟือง+แบริ่ง UF",2,3,46266,46267],["ยก F3 ลงแท่น",1,3,46268,46268],["ประกอบแท่นลูกป้อน",1,3,46269,46269],["ยกหวีซอง",4,3,46270,46274],["Seting ลูกป้อนเข้ากับหวีซอง",2,3,46275,46276],["ยกลูกป้อนบน",2,3,46277,46279],["Seting A1",2,3,46280,46281],["Seting B1",1,3,46282,46282],["ยก UF",1,3,46283,46283],["ยกลูก top",1,3,46284,46284],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,3,46286,46286],["ประกอบโซ่ขับลูกหีบ",1,3,46287,46287],["ประกอบโซ่ขับลูกป้อน",1,3,46288,46288],["ประกอบ Tailbar + box couping ลูก top",2,3,46289,46290],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,3,46291,46293],["เข้างานติดตั้งสายน้ำ Cooling",1,3,46294,46294],["ประกอบถาดน้ำมันลูกหีบ",1,3,46295,46295],["ประกอบชู๊ท+ตั้งระยะเปิด",3,3,46296,46298]]},
    {id:"m4",name:"ลูกหีบ ชุดที่ 4",tasks:[["ประกอบแท่นลูกป้อน",1,4,46266,46266,"",100],["ยกลูกป้อนล่าง",1,4,46266,46266,"",100],["ยกหวีซอง",4,4,46266,46269],["Seting ลูกป้อนเข้ากับหวีซอง",2,4,46270,46272],["ยกลูกป้อนบน",2,4,46273,46274],["Seting A1",2,4,46275,46276],["Seting B1",1,4,46277,46277],["ยก UF",1,4,46279,46279],["ยกลูก top",1,4,46280,46280],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,4,46281,46281],["ประกอบโซ่ขับลูกหีบ",1,4,46282,46282],["ประกอบโซ่ขับลูกป้อน",1,4,46283,46283],["ประกอบ Tailbar + box couping ลูก top",2,4,46284,46286],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,4,46287,46288],["เข้างานติดตั้งสายน้ำ Cooling",1,4,46289,46289],["ประกอบถาดน้ำมันลูกหีบ",1,4,46290,46290],["ประกอบชู๊ท+ตั้งระยะเปิด",3,4,46291,46294]]},
    {id:"m5",name:"ลูกหีบ ชุดที่ 5",tasks:[["ประกอบคานหวีกลาง+แท่นหวี",3,4,46295,46297],["หวีกลาง+เชื่อม",7,4,46270,46276],["ประกอบหวีซอง",4,4,46298,46302],["ประกอบเฟือง+แบริ่ง ลูกหลัง",1,4,46303,46303],["ยกลูกหลังลงแท่น",1,4,46304,46304],["ยกลูกป้อนบนลงแท่น",1,4,46305,46305],["ประกอบหวีกลาง",3,4,46307,46309],["Set A2,A3",1,4,46310,46310],["Setting C1,C2,C3",1,4,46311,46311],["ยก UF",1,4,46312,46312],["Seting B1",1,4,46314,46314],["ยกลูก top",1,4,46315,46315],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,4,46316,46316],["ประกอบ Tailbar + box couping ลูก top",1,4,46317,46317],["ประกอบ Tailbar + box couping ป้อนล่าง",1,4,46318,46318],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,4,46319,46322],["เข้างานติดตั้งสายน้ำ Cooling",2,4,46323,46324],["ประกอบถาดน้ำมันลูกหีบ",1,4,46325,46325],["ประกอบโซ่+Spocket+Cover",1,4,46326,46326],["ประกอบชู๊ท+ตั้งระยะเปิด",3,4,46328,46330]]},
    {id:"mr",name:"ตะแกรง Rotary Screen",tasks:[["ประกอบติดตั้งตะแกรง No.1",10,3,46300,46310],["ประกอบติดตั้งตะแกรง No.2",10,3,46311,46318]]}
  ]},
  {id:"prep",name:"กลุ่มเตรียมอ้อย",machines:[
    {id:"pdump",name:"drump+ตะกาว",tasks:[["งาน drump + ตะกาว (เสร็จแล้ว)",3,4,46259,46263,"",100]]},
    {id:"pside",name:"สะพาน Side",tasks:[["ประกอบ Kicker",1,5,46297,46297],["ประกอบฝา Cover",1,5,46298,46298],["หา Alighment Kicker",1,5,46299,46299],["หา Alighment Equlizer",1,5,46300,46300],["อัดจาระบี Tail Shap",1,2,46272,46272]]},
    {id:"pmain",name:"สะพาน Main",tasks:[["เปลี่ยนน้อต+ซ่อมใบสะพาน+ติดตั้งใบสะพาน (รับเหมา)",15,3,46266,46281],["เช็คลูกปืนพร้อมเปลี่ยนลูกปืน ลูก roller",null,5,46266,46281],["เพลา Head Shap ถึงมิตรลาว",null,null,46277,46277,"วัสดุเข้า"],["ประกอบเพลา Head Shap+พีเนียส",4,5,46282,46286],["ประกอบเฟือง Head Shap พร้อมติดตั้ง",1,5,46287,46287],["เปลี่ยนใบมีด 1,2,3 (ผู้รับเหมา)",20,null,null,null],["ประกอบ leverer 1 (ยังรอเกียร์)",4,5,46288,46291],["ประกอบ leverer 2 + Aligment",4,5,46293,46296],["ประกอบมีด 3 + Aligment มีด 1,2,3",6,3,46315,46322],["แก้ไข Cover Kicker",4,3,46323,46326],["gearbox ถึงมิตรลาว",null,null,null,null,"รอวัสดุ"],["ประกอบ gearbox leverer 1 + Aligment",null,null,null,null],["ประกอบฝาข้างสะพาน",null,null,null,null,"หลัง Test Run"],["ประกอบแปรงปัดใบสะพาน",null,null,null,null,"หลัง Test Run"]]},
    {id:"psand",name:"สะพานแยกทราย",tasks:[["เช็คลูก Roller + เปลี่ยนลูก Roller + อัดจาระบีชุดขับ+ชุดตาม",5,2,46266,46270]]},
    {id:"pshred",name:"Shredder",tasks:[["Disch Sherder ถึงมิตรลาว",null,null,46300,46300,"วัสดุเข้า"],["ประกอบเพลา Sherdder ลงแท่น",1,5,46301,46301],["ประกอบ Case Sherdder+เชื่อม",2,5,46302,46303],["ประกอบชู๊ท Sherdder",5,5,46304,46309],["เชื่อม Case Sherdder",4,2,46310,46314],["ประกอบตะแกรง gidbar เข้า Sherdder",2,3,46310,46311],["ประกอบฆ้อน+หัวทิป",7,3,46312,46319],["ประกอบแม่เหล็กไฟฟ้า",2,3,46322,46323],["ตั้ง Aligment Sherdder",2,3,46324,46325]]}
  ]}
]};
const DEFAULT_PINS={pdump:{x:10,y:64},pside:{x:29,y:41},psand:{x:16.5,y:53},pmain:{x:22.5,y:61},pshred:{x:33,y:56},
  m1:{x:46.5,y:44},m2:{x:56,y:44},m3:{x:65,y:44},m4:{x:74,y:44},m5:{x:83,y:44},mr:{x:91,y:60}};

const LS_KEY="milling_repair_v4";
function freshFromSeed(){let tid=0;const g=SEED.groups.map(gr=>({id:gr.id,name:gr.name,machines:gr.machines.map(m=>({id:m.id,name:m.name,owner:"",tasks:m.tasks.map(t=>({id:m.id+"-"+(++tid),name:t[0],days:t[1],labor:t[2],start:t[3]??null,finish:t[4]??null,note:t[5]||"",prog:t[6]||0}))}))}));return {groups:g,pins:JSON.parse(JSON.stringify(DEFAULT_PINS)),updated:Date.now()};}
let WAS_SEED=false;
function load(){try{const r=localStorage.getItem(LS_KEY);if(r){const p=JSON.parse(r);if(p&&p.groups){if(!p.pins)p.pins=JSON.parse(JSON.stringify(DEFAULT_PINS));return p;}}}catch(e){}WAS_SEED=true;return freshFromSeed();}
/* รวมงานซ้ำ: สะพานแยกทราย = task เดียว (แก้ข้อมูลที่บันทึก/ซิงค์มาแล้วด้วย) */
function normalizeData(d){try{if(!d||!d.groups)return d;
  if(!Array.isArray(d.logs))d.logs=[]; // สมุดบันทึก (log book) รายการรอตรวจสอบ/ตรวจแล้ว
  d.groups.forEach(g=>(g.machines||[]).forEach(m=>{
    if(m.id==="psand"&&Array.isArray(m.tasks)&&m.tasks.length>1){const t0=m.tasks[0];t0.name="เช็คลูก Roller + เปลี่ยนลูก Roller + อัดจาระบีชุดขับ+ชุดตาม";m.tasks=[t0];}
  }));
  if((d.mig||0)<2){ // ครั้งเดียว: ลูกหีบ4 สองงานนี้เสร็จแล้ว (ให้มี man-hour เพื่อคิดน้ำหนัก)
    d.groups.forEach(g=>(g.machines||[]).forEach(m=>{ if(m.id==="m4")(m.tasks||[]).forEach(t=>{
      if(t.name==="ประกอบแท่นลูกป้อน"||t.name==="ยกลูกป้อนล่าง"){t.prog=100;if(t.days==null)t.days=1;if(t.labor==null)t.labor=4;}
    });}));
    d.mig=2;
  }
  if((d.mig||0)<3){ // ครั้งเดียว: สลับตำแหน่งหมุด สะพานแยกทราย ↔ สะพาน Side
    if(d.pins&&d.pins.pside&&d.pins.psand){var _t=d.pins.pside;d.pins.pside=d.pins.psand;d.pins.psand=_t;}
    d.mig=3;
  }
  if((d.mig||0)<4){ // ครั้งเดียว: สลับตำแหน่งหมุด สะพาน Main ↔ สะพานแยกทราย
    if(d.pins&&d.pins.pmain&&d.pins.psand){var _u=d.pins.pmain;d.pins.pmain=d.pins.psand;d.pins.psand=_u;}
    d.mig=4;
  }
  if((d.mig||0)<5){ // ครั้งเดียว: แก้วันที่งานลูกหีบ4 (ประกอบแท่น/ยกลูกป้อนล่าง) 30-31/08 → 01/09 (ให้ช่วงงานเริ่ม 01/09)
    d.groups.forEach(g=>(g.machines||[]).forEach(m=>{ if(m.id==="m4")(m.tasks||[]).forEach(t=>{
      if((t.name==="ประกอบแท่นลูกป้อน"||t.name==="ยกลูกป้อนล่าง")&&(t.start===46264||t.start===46265)){t.start=46266;t.finish=46266;}
    });}));
    d.mig=5;
  }
  if((d.mig||0)<6){ // ครั้งเดียว (ตั้งต้นกติกาวัน 03/09/2026): งานที่ช่วงวันคาบวันหยุดใหม่ (11/09, 26/10) จะมีวันทำงานน้อยกว่า days → ขยับวันเสร็จให้ครบ
    d.groups.forEach(g=>g.machines.forEach(m=>m.tasks.forEach(t=>{if(t.start==null||t.finish==null||!(t.days>0))return;let f=t.finish,guard=0;while(workingSerials(t.start,f).length<t.days&&guard<400){f++;guard++;}if(f!==t.finish)t.finish=f;})));
    d.mig=6;
  }
}catch(e){}return d;}
/* ---- รวม log แบบ convergent: ไม่ทับกัน · อัปเดตสถานะข้ามเครื่องได้ · ทุกเครื่องลู่เข้าค่าเดียวกัน ---- */
function logRev(L){return Math.max(+L.reviewTs||0,+L.ts||0,+L.edited||0);}
function mergeLogs(remoteLogs){
  if(!Array.isArray(remoteLogs))return 0;
  if(!Array.isArray(DATA.logs))DATA.logs=[];
  const byId={};DATA.logs.forEach(function(L){if(L&&L.id)byId[L.id]=L;});
  var changed=0;
  remoteLogs.forEach(function(R){
    if(!R||!R.id)return;
    const L=byId[R.id];
    if(!L){DATA.logs.push(R);byId[R.id]=R;changed++;return;}   // log ใหม่จากเครื่องอื่น
    // มีอยู่แล้ว → เอาเวอร์ชันใหม่กว่า · "ตรวจแล้ว" ชนะ "รอตรวจสอบ" เสมอ
    const approvedWins=(R.status==="approved"&&L.status!=="approved");
    const staleApproved=(L.status==="approved"&&R.status!=="approved");
    if(staleApproved)return;                                   // ของเราอนุมัติแล้ว ของเขาเก่ากว่า → ไม่ถอย
    if(approvedWins||logRev(R)>logRev(L)){
      const keepProg=Math.max(+L.prog||0,+R.prog||0);           // % ที่อนุมัติแล้วไม่ลดลง
      Object.keys(R).forEach(function(k){L[k]=R[k];});
      if(L.status==="approved")L.prog=keepProg;
      changed++;
    }
  });
  return changed;
}
/* ---- แหล่งความจริงของ % งาน = log ที่ "ตรวจแล้ว" ---- นำค่าที่อนุมัติแล้วไปเขียนลง task เสมอ (กัน % หายเวลา sync/merge) */
function applyApprovedLogs(){if(!DATA||!Array.isArray(DATA.logs))return 0;const agg={};
  DATA.logs.forEach(function(L){if(!L||L.status!=="approved"||!L.mid)return;const k=L.mid+"|"+L.ti;if(!agg[k])agg[k]={prog:0,ts:-1,labor:null,note:null};const a=agg[k];if((+L.prog||0)>a.prog)a.prog=+L.prog||0;if((L.ts||0)>a.ts){a.ts=L.ts||0;if(L.labor!=null&&L.labor!=="")a.labor=+L.labor;if(L.note!=null)a.note=L.note;}});
  var changed=0;Object.keys(agg).forEach(function(k){const p=k.split("|"),m=machineById(p[0]),ti=+p[1];if(!m||!m.tasks||!m.tasks[ti])return;const t=m.tasks[ti],a=agg[k];const np=Math.max(+t.prog||0,a.prog);if(np!==(+t.prog||0)){t.prog=np;changed++;}if(a.labor!=null&&t.labor!==a.labor){t.labor=a.labor;changed++;}if(a.note!=null&&a.note!==""&&t.note!==a.note){t.note=a.note;changed++;}});
  return changed;}
let DATA=normalizeData(load());applyApprovedLogs();
let saveTimer=null;
function save(){DATA.updated=Date.now();try{localStorage.setItem(LS_KEY,JSON.stringify(DATA));}catch(e){}const st=$("saveTxt");if(st)st.textContent="บันทึกแล้ว "+new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(save,400);if(typeof schedulePush==="function")schedulePush();}

/* ---- น้ำหนักงาน = man-hour = คน × วัน × 8 ชม. (วันหยุดไม่นับ) — สูตรเดียว ตรวจด้วยมือได้ ---- */
const HOURS_PER_DAY=8;
function manday(t){return (t.days>0&&t.labor>0)?t.days*t.labor:0;}   // คน × วัน
function manhour(t){return manday(t)*HOURS_PER_DAY;}                 // คน × วัน × 8 ชม. (สูตรเดียวทั้งระบบ)
const isExcluded=m=>m.id==='pdump';
function machineRawMH(m){let s=0;m.tasks.forEach(t=>s+=manhour(t));return s;}
function totalMandays(){let s=0;DATA.groups.forEach(g=>g.machines.forEach(m=>{if(isExcluded(m))return;s+=machineRawMH(m);}));return s||1;}
function taskWeight(t,total){return manhour(t)/total*100;}
function taskWeightInJob(t,m){const raw=machineRawMH(m);return raw>0?manhour(t)/raw*100:0;}
function machineMandays(m){return machineRawMH(m);}
function machineActual(m){const total=totalMandays();let rw=0,ra=0;m.tasks.forEach(t=>{const mh=manhour(t);rw+=mh;ra+=mh*(t.prog||0)/100;});const localPct=rw>0?ra/rw*100:0;return {weight:isExcluded(m)?0:rw/total*100,actual:isExcluded(m)?0:ra/total*100,localPct,rawMH:rw};}
/* man-hour ที่ใช้ไปจริง = ผลรวมของ log ที่อนุมัติแล้ว (คน × ชม.ทำงานของวันนั้น) */
function consumedMH(mid,ti){let sum=0;(DATA.logs||[]).forEach(L=>{if(L.status==="approved"&&L.mid===mid&&L.ti===ti)sum+=(+L.labor||0)*HOURS_PER_DAY;});return sum;} // คน × 8 ชม. ต่อวันที่บันทึก
function machineConsumedMH(m){let s=0;m.tasks.forEach((t,i)=>{s+=consumedMH(m.id,i);});return s;}
/* จำนวนวันที่ใช้ไป = จำนวนวัน (distinct) ที่บันทึกและอนุมัติแล้วของ task นั้น */
function consumedDays(mid,ti){var s={};var c=0;(DATA.logs||[]).forEach(function(L){if(L.status==="approved"&&L.mid===mid&&L.ti===ti&&L.date&&!s[L.date]){s[L.date]=1;c++;}});return c;}
function machinePlanPct(m){const raw=machineRawMH(m);if(raw<=0)return 0;let acc=0;m.tasks.forEach(t=>{const mh=manhour(t);const ws=workingSerials(t.start,t.finish);if(mh<=0||!ws.length)return;acc+=(mh/raw)*ws.filter(x=>x<=TODAY_SERIAL).length/ws.length;});return acc*100;}
function machineStatus(m){const a=machineActual(m);if(a.localPct>=99.9)return"done";if(a.localPct>0)return"prog";return"todo";}
const STCOL={done:"var(--green)",prog:"var(--amber)",todo:"var(--grey)"};
function planPctUpTo(serial){const total=totalMandays();let acc=0;DATA.groups.forEach(g=>g.machines.forEach(m=>{if(isExcluded(m))return;m.tasks.forEach(t=>{const mh=manhour(t);if(mh<=0)return;const ws=workingSerials(t.start,t.finish);if(!ws.length)return;acc+=mh/total*100*ws.filter(x=>x<=serial).length/ws.length;})}));return acc;}
function actualPct(){const total=totalMandays();let acc=0;DATA.groups.forEach(g=>g.machines.forEach(m=>{if(isExcluded(m))return;m.tasks.forEach(t=>{acc+=manhour(t)/total*(t.prog||0);})}));return acc;}
function projectRange(){let mn=null,mx=null;DATA.groups.forEach(g=>g.machines.forEach(m=>m.tasks.forEach(t=>{if(t.start!=null)mn=mn==null?t.start:Math.min(mn,t.start);if(t.finish!=null)mx=mx==null?t.finish:Math.max(mx,t.finish);})));return {min:mn??46266,max:mx??46330};}
/* ---- "วันนี้" ยึดเวลาไทย (Asia/Bangkok) เสมอ ไม่ว่าเครื่องตั้ง timezone อะไร ---- */
function thaiDMY(d){try{const p=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Bangkok",day:"2-digit",month:"2-digit",year:"numeric"}).formatToParts(d||new Date());const g=t=>p.find(x=>x.type===t).value;return g("day")+"/"+g("month")+"/"+g("year");}
  catch(e){const x=d||new Date();return String(x.getDate()).padStart(2,"0")+"/"+String(x.getMonth()+1).padStart(2,"0")+"/"+x.getFullYear();}}
function dmyToSerial(s){if(!s)return null;const p=String(s).split("/");if(p.length<3)return null;const d=+p[0],m=+p[1],y=+p[2];if(!(d>0&&m>0&&y>2000))return null;return dToSerial(new Date(y,m-1,d));}
const TODAY_DMY=thaiDMY();
const TODAY_SERIAL=dmyToSerial(TODAY_DMY);
/* ---- ล็อก logic "เกิดจริงวันนี้" (ผู้ใช้กำหนด 04/09/2026) ----
   ยึด "วันที่บันทึก" (L.date) ของ log ที่ "ตรวจแล้ว" เท่านั้น · 1 วันที่ = 1 วัน · ไม่พึ่ง Snapshot
   %ที่เกิดในวัน D ของงานหนึ่ง = max(%log วันที่ D) − max(%log ที่วันที่ < D)  (ไม่ติดลบ)
   เกิดจริงวันนี้ (ภาพรวม) = Σ น้ำหนักงาน × %ที่เกิดในวันนั้น */
function actualDeltaOnDate(dmy){const ser=dmyToSerial(dmy);if(ser==null)return 0;const total=totalMandays();let acc=0;
  DATA.groups.forEach(g=>g.machines.forEach(m=>{if(isExcluded(m))return;m.tasks.forEach((t,i)=>{
    let before=0,onDay=null;
    (DATA.logs||[]).forEach(L=>{if(!L||L.status!=="approved"||L.mid!==m.id||L.ti!==i)return;const ls=dmyToSerial(L.date);if(ls==null)return;const p=+L.prog||0;
      if(ls<ser){if(p>before)before=p;}else if(ls===ser){if(onDay==null||p>onDay)onDay=p;}});
    if(onDay!=null&&onDay>before)acc+=manhour(t)/total*(onDay-before);
  });}));
  return acc;}
function planDeltaOnSerial(ser){return Math.max(0,planPctUpTo(ser)-planPctUpTo(ser-1));} // เป้าเฉพาะวันนั้น
function machineById(id){for(const g of DATA.groups)for(const m of g.machines)if(m.id===id)return m;return null;}
function groupOf(m){return DATA.groups.find(gr=>gr.machines.includes(m));}
function jobs(){return DATA.groups.flatMap(g=>g.machines).filter(m=>!isExcluded(m));}
const $=id=>document.getElementById(id);
function escapeHtml(s){return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

/* ---- theme ---- */
(function(){var t="light";try{t=localStorage.getItem("mr_theme")||"light";}catch(e){}document.documentElement.setAttribute("data-theme",t);})();
function wireCommon(){
  const bt=$("btnTheme");if(bt)bt.addEventListener("click",()=>{const r=document.documentElement;const cur=r.getAttribute("data-theme");const next=cur==="dark"?"light":(cur==="light"?"dark":(matchMedia("(prefers-color-scheme:dark)").matches?"light":"dark"));r.setAttribute("data-theme",next);try{localStorage.setItem("mr_theme",next);}catch(e){}if(typeof onThemeChange==="function")onThemeChange();});
  const be=$("btnExport");if(be)be.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(DATA,null,2)],{type:"application/json"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download="milling_repair_"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(u);});
  const bi=$("btnImport");if(bi)bi.addEventListener("click",()=>$("fileIn").click());
  const fi=$("fileIn");if(fi)fi.addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result);if(p&&p.groups){if(!p.pins)p.pins=JSON.parse(JSON.stringify(DEFAULT_PINS));DATA=normalizeData(p);applyApprovedLogs();save();render();alert("นำเข้าข้อมูลสำเร็จ");}else alert("ไฟล์ไม่ถูกต้อง");}catch(err){alert("อ่านไฟล์ไม่ได้");}};r.readAsText(f);e.target.value="";});
}

/* ---- Google Sheet sync (Apps Script backend) — URL ฝังไว้ถาวร ผู้ใช้แก้ไม่ได้ ---- */
const SYNC_URL="https://script.google.com/macros/s/AKfycbwz5JC3AsGW4SRS-suhTRwFi4Z1jQDV5VT1t7laGr08aoj8EFrXDmLxVr4dXxbcBnHU/exec";
const SYNC_KEY="mlk_7Qx2F9pR4vT8nZ6bW3sK";   // ต้องตรงกับ SECRET ใน Code.gs
let syncUrl=SYNC_URL;let pushTimer=null;let lastSync=null;let syncReady=false;let lastPullAt=0;
function syncGet(extra){return syncUrl+"?key="+encodeURIComponent(SYNC_KEY)+(extra?"&"+extra:"")+"&t="+Date.now();}
function setSyncBtn(state,msg){const b=$("btnSync");if(b){const map={off:"เชื่อมชีท",ok:"ซิงค์แล้ว",busy:"กำลังซิงค์…",err:"ซิงค์ไม่สำเร็จ",offline:"ออฟไลน์"};b.textContent=map[state]||map.off;b.classList.remove("pri");b.title=msg||"";}
  const v=$("verTag");if(v){const t=lastSync?lastSync.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Bangkok"}):null;v.textContent="v"+APP_VER+(t?" · ซิงค์ "+t:(state==="offline"?" · ออฟไลน์":" · ยังไม่ซิงค์"));v.style.color=(state==="err"||state==="offline")?"var(--red)":"";}} // ป้ายเวอร์ชัน+เวลาซิงค์ ให้เห็นทันทีว่าเครื่องนี้ตรงกับเครื่องอื่นไหม
function persistLocal(){try{localStorage.setItem(LS_KEY,JSON.stringify(DATA));}catch(e){}}
function schedulePush(){if(!syncUrl||!syncReady)return;clearTimeout(pushTimer);pushTimer=setTimeout(pushRemote,1200);}
/* push แบบ read-modify-write: ดึงของล่าสุดมารวมก่อนส่ง → ไม่ทับงานเครื่องอื่น (กันข้อมูลเปลี่ยนไปเปลี่ยนมา) */
let pushing=false,pushAgain=false;
async function pushRemote(){if(!syncUrl)return;
  if(pushing){pushAgain=true;return;}                          // กันยิงซ้อน
  pushing=true;setSyncBtn("busy");
  try{
    if(Date.now()-lastPullAt>4000){                             // เพิ่งดึงมาไม่ถึง 4 วิ ก็ไม่ต้องดึงซ้ำ (ประหยัดโควตา)
      try{const r0=await fetch(syncGet());const j0=await r0.json();
        if(j0&&j0.ok&&j0.data&&j0.data.groups){mergeLogs(j0.data.logs);applyApprovedLogs();}
      }catch(e){}                                               // ดึงมารวมก่อน (ถ้าดึงไม่ได้ก็ยังส่งของเราไป)
    }
    DATA.updated=Date.now();
    // ส่ง % รวมสะสมที่เว็บคำนวณไปด้วย → ชีท "Summary" เอาไปเทียบกับค่าที่ชีทคำนวณเองด้วยสูตรในชีท
    try{DATA.summary={overall:+actualPct().toFixed(3),ver:APP_VER,asOf:thaiDMY()+" "+new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Bangkok"})};}catch(e){}
    const res=await fetch(syncUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({data:DATA,key:SYNC_KEY})});
    const j=await res.json();
    if(j&&j.ok){lastSync=new Date();persistLocal();if(!isEditing()&&typeof render==="function")render();setSyncBtn("ok","อัปเดตชีทล่าสุด "+lastSync.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}));}
    else setSyncBtn("err",(j&&j.error)||"ไม่ทราบสาเหตุ");
  }catch(e){setSyncBtn("offline","เชื่อมต่ออินเทอร์เน็ตไม่ได้ · ข้อมูลถูกเก็บในเครื่องแล้ว");}
  finally{pushing=false;if(pushAgain){pushAgain=false;setTimeout(pushRemote,400);}}
}
/* ---- popup แจ้งเตือนกลางจอ (แทน alert) ---- */
function notify(title,sub,type){type=type||"ok";
  let sc=$("noteScrim"),md=$("noteModal");
  if(!md){sc=document.createElement("div");sc.id="noteScrim";sc.className="scrim note-scrim";document.body.appendChild(sc);
    md=document.createElement("div");md.id="noteModal";md.className="notemodal";
    md.innerHTML='<div class="note-ic" id="noteIc"></div><div class="note-title" id="noteTitle"></div><div class="note-sub" id="noteSub"></div><button class="tbtn pri" id="noteOk">ตกลง</button>';
    document.body.appendChild(md);
    $("noteOk").addEventListener("click",hideNote);sc.addEventListener("click",hideNote);}
  const ok='<svg viewBox="0 0 52 52" width="76" height="76" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#eafaf0" stroke="#1f8a4c" stroke-width="2" opacity=".55"/><circle class="nck-c" cx="26" cy="26" r="24" fill="none" stroke="#1f8a4c" stroke-width="3.2" stroke-linecap="round" transform="rotate(-90 26 26)"/><path class="nck-p" d="M15.5 27 l7 7 l14.5 -15.5" fill="none" stroke="#1f8a4c" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const err='<svg viewBox="0 0 52 52" width="76" height="76" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#fdeceb" stroke="#c33d33" stroke-width="3"/><path d="M18 18 l16 16 M34 18 l-16 16" stroke="#c33d33" stroke-width="4" stroke-linecap="round"/></svg>';
  $("noteIc").innerHTML=type==="err"?err:ok;
  $("noteTitle").textContent=title||"สำเร็จ";
  const s=$("noteSub");s.textContent=sub||"";s.style.display=sub?"block":"none";
  md.classList.toggle("err",type==="err");
  sc.classList.add("on");md.classList.add("on");
  clearTimeout(window._noteT);if(type!=="err")window._noteT=setTimeout(hideNote,2400);}
function hideNote(){const sc=$("noteScrim"),md=$("noteModal");if(sc)sc.classList.remove("on");if(md)md.classList.remove("on");clearTimeout(window._noteT);}
async function saveSnapshot(){
  if(!syncUrl){alert("กรุณาเชื่อม Google Sheet ก่อน (กดปุ่ม ☁️ เชื่อม Sheet)");return;}
  const js=jobs().map(m=>({name:m.name,pct:+machineActual(m).localPct.toFixed(1)}));
  const sel=$("snapDate");let dt=new Date();
  if(sel&&sel.value){const q=sel.value.split("-").map(Number);dt=new Date(q[0],q[1]-1,q[2]);}
  if(dToSerial(dt)<46266){notify("วันที่ไม่ถูกต้อง","บันทึกย้อนหลังได้ไม่เกิน 01/09/2026","err");return;}
  const P=n=>String(n).padStart(2,"0");const ds=P(dt.getDate())+"/"+P(dt.getMonth()+1)+"/"+dt.getFullYear();const ser=dToSerial(dt);const now=new Date();
  const snap={date:ds,time:now.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}),overall:+actualPct().toFixed(2),plan:+planPctUpTo(ser).toFixed(2),jobs:js,formula:2}; // formula:2 = สูตร คน×วัน×8 (ตั้งต้น 03/09/2026)
  const btn=$("btnSnap");const old=btn?btn.textContent:"";if(btn)btn.textContent="⏳ กำลังบันทึก…";
  try{const res=await fetch(syncUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"snapshot",snapshot:snap,key:SYNC_KEY})});
    const j=await res.json();
    if(j&&j.ok){if(btn){btn.textContent="✅ บันทึกแล้ว";setTimeout(()=>btn.textContent=old,2500);}notify("บันทึกสำเร็จ","Snapshot วันที่ "+ds+" · %รวม "+snap.overall+"% · ตามแผน "+snap.plan+"%");}
    else{if(btn)btn.textContent=old;notify("บันทึกไม่สำเร็จ",((j&&j.error)||"ไม่ทราบสาเหตุ"),"err");}
  }catch(e){if(btn)btn.textContent=old;notify("เชื่อมต่อไม่ได้","ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่","err");}
}
async function fetchSnapshots(){if(!syncUrl)return null;try{const res=await fetch(syncGet("snap=1"));const j=await res.json();return (j&&j.ok&&j.snapshots)?j.snapshots:null;}catch(e){return null;}}
/* กำลังกรอกข้อมูลอยู่ไหม — ห้าม re-render ทับสิ่งที่ผู้ใช้พิมพ์ค้างไว้ */
function isEditing(){return !!document.querySelector(".drawer.on,.modal.on,.pinmodal.on");} // ทุกหน้าต่างที่เปิดอยู่ (ฟอร์ม/ตรวจ/PIN/drill-down/day view) ทั้ง 2 หน้า
/* pull = รวมข้อมูลเสมอ ไม่เขียนทับของเครื่องตัวเอง (เดิม force ทับทิ้ง → งานหาย/เด้งกลับ) */
let pulling=false;
async function pullRemote(silent){if(!syncUrl)return false;
  if(pulling)return false;pulling=true;lastPullAt=Date.now();
  if(!silent)setSyncBtn("busy");
  try{const res=await fetch(syncGet());const j=await res.json();
    if(j&&j.ok&&j.data&&j.data.groups){const remote=j.data;
      var changed=0;
      if(WAS_SEED){ // เครื่องนี้ยังไม่มีข้อมูลของตัวเอง → รับของชีทมาทั้งชุดได้อย่างปลอดภัย
        if(!remote.pins)remote.pins=JSON.parse(JSON.stringify(DEFAULT_PINS));
        DATA=normalizeData(remote);WAS_SEED=false;changed=1;
      }else{
        changed=mergeLogs(remote.logs); // รวม log แบบไม่ทับกัน (ของเราไม่หาย ของเขาเข้ามา)
      }
      changed+=applyApprovedLogs();      // % งาน = ผลลัพธ์จาก log ที่ตรวจแล้วเสมอ → ลู่เข้าค่าเดียวกันทุกเครื่อง
      if(changed){persistLocal();if(!isEditing()&&typeof render==="function")render();}
      lastSync=new Date();setSyncBtn("ok","ซิงค์ล่าสุด "+lastSync.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}));return true;}
    setSyncBtn("err","ชีทยังไม่มีข้อมูล");return false;
  }catch(e){setSyncBtn("offline","เชื่อมต่ออินเทอร์เน็ตไม่ได้");return false;}
  finally{pulling=false;}
}
/* ---- ซิงค์สองทางแบบเรียลไทม์: ดึงมารวม แล้วส่งของเราขึ้นไป ---- */
async function syncNow(silent){const ok=await pullRemote(silent);if(ok)await pushRemote();return ok;}
let pollTimer=null;
function startPolling(){
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=setInterval(function(){
    if(document.visibilityState!=="visible")return;   // แท็บซ่อนอยู่ ไม่ต้องยิง
    if(navigator.onLine===false||pushing||isEditing())return;
    pullRemote(true);
  },15000);                                            // ดึงทุก 15 วิ = ใกล้เคียงเรียลไทม์ (สมดุลกับโควตา Apps Script)
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")pullRemote(true);});
  window.addEventListener("online",function(){pullRemote(true);});
  window.addEventListener("focus",function(){if(!isEditing())pullRemote(true);});
}
/* ---- อัปเดตตัวเองอัตโนมัติ: เช็ค version.json — ถ้าเวอร์ชันบนเว็บใหม่กว่า โหลดหน้าใหม่เอง (ไม่ต้องให้ใครกด F5) ---- */
let updating=false;
function startUpdateCheck(){
  async function check(){
    if(updating||isEditing()||pushing||pushTimer||saveTimer)return;   // ห้ามรีโหลดตอนกรอก/กำลัง push/มีงานค้างส่ง
    try{const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});const j=await r.json();
      const v=+j.v;if(!(v>APP_VER))return;
      let tried=0;try{tried=+sessionStorage.getItem("mr_updTo")||0;}catch(e){}
      if(tried>=v)return;                                           // เคยรีโหลดเพื่อเวอร์ชันนี้แล้วแต่ยังได้ไฟล์เก่า (CDN ยังไม่ทัน) → รอ ไม่วนซ้ำ
      updating=true;try{sessionStorage.setItem("mr_updTo",String(v));}catch(e){}
      notify("มีเวอร์ชันใหม่","กำลังอัปเดตแอปอัตโนมัติ…");
      setTimeout(function(){location.replace(location.pathname+"?u="+v+location.hash);},900); // ?u= ข้าม cache ของ HTML · คง #hash ไว้
    }catch(e){}
  }
  setInterval(function(){if(document.visibilityState==="visible")check();},60000);
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")check();});
  // ไม่เช็คทันทีตอน boot: หน้าที่เพิ่งโหลดใหม่ย่อมได้ไฟล์ล่าสุดแล้ว (กันรีโหลดซ้ำ + ไม่แย่ง connection ตอนเปิดหน้า)
}
function wireSync(){
  const bSnap=$("btnSnap");if(bSnap)bSnap.addEventListener("click",saveSnapshot);
  const sDate=$("snapDate");if(sDate){const t=new Date();const q=n=>String(n).padStart(2,"0");const iso=t.getFullYear()+"-"+q(t.getMonth()+1)+"-"+q(t.getDate());sDate.value=iso;sDate.max=iso;sDate.min="2026-09-01";}
  const bSync=$("btnSync");if(bSync)bSync.addEventListener("click",async()=>{ setSyncBtn("busy"); const ok=await syncNow(false); if(ok&&typeof notify==="function")notify("ซิงค์สำเร็จ","รวมข้อมูลกับชีทเรียบร้อย ทุกเครื่องตรงกันแล้ว"); });  // คลิก = ซิงค์สองทาง (รวม ไม่ทับ)
}
/* ---- cane-truck race: วิ่งตาม % งานซ่อมรวมทั้งแผนก เข้าเส้นชัยที่ 100% ---- */
function renderRace(){const t=$("truck");if(!t)return;
  const p=Math.max(0,Math.min(100,actualPct())),f=p/100;
  const cx=(6+86*f).toFixed(2)+"%";              /* center วิ่ง 6% → 92% เข้าเส้นชัย */
  t.style.left=cx;
  const pc=$("tkPct");if(pc)pc.style.left=cx;    /* ป้าย % เคลื่อนตามรถ */
  const fl=$("raceFill");if(fl)fl.style.width=(4+87*f).toFixed(2)+"%"; /* ไฟเรืองแสงบอกระยะที่วิ่งไปแล้ว */
  const target=Math.max(0,Math.min(100,planPctUpTo(TODAY_SERIAL))); // เป้าหมายภาพรวม ณ วันนี้
  const onTrack=p>=target-0.05;                                     // ได้ตามเป้า/เกิน = เขียว · ต่ำกว่า = แดง
  const pct=$("tkPct");if(pct){pct.textContent=p.toFixed(1)+"%";pct.classList.toggle("ok",onTrack);pct.classList.toggle("behind",!onTrack);}
  const done=p>=99.95;t.classList.toggle("done",done);
  const h=$("raceHint");if(h)h.textContent=done?"เข้าเส้นชัยแล้ว!":(onTrack?"ตามเป้า ✓ (เป้า ณ วันนี้ "+target.toFixed(1)+"%)":"ต่ำกว่าเป้า (เป้า ณ วันนี้ "+target.toFixed(1)+"%)");}

/* ---- lock ratio: ย่อทั้งหน้าให้พอดีจอ คงสัดส่วนเดสก์ท็อปทุกอุปกรณ์ ---- */
const DESIGN_W=1340, MAX_SCALE=1.7;
/* 2 เวอร์ชันในลิงก์เดียว: จอ ≤768px = เวอร์ชันมือถือ (layout เรียงลง ไม่ย่อทั้งหน้า) · จอใหญ่ = เวอร์ชันคอม (ย่อ/ขยายทั้งหน้าให้พอดี 1340px) */
const MOBILE_BP=768, HERO_W=1300;
function isMobile(){return document.documentElement.clientWidth<=MOBILE_BP;}
function fitPage(){const app=$("app");if(!app)return;const vw=document.documentElement.clientWidth;const mob=isMobile();
  document.documentElement.classList.toggle("mobile",mob);
  app.style.transform="none";app.style.marginLeft="";
  const hf=$("heroFrame");
  if(mob){
    app.style.zoom="1";                                             // มือถือ: ไม่ย่อทั้งหน้า ให้ CSS จัดเรียงเอง
    if(hf){const avail=Math.max(760,vw-24);hf.style.width=HERO_W+"px";hf.style.zoom=(avail/HERO_W).toFixed(4);} // แผนผัง+หมุด ย่อเป็นภาพเดียว เลื่อนซ้าย-ขวาได้
  }else{
    app.style.zoom=Math.min(MAX_SCALE, vw/DESIGN_W).toFixed(4);     // คอม: fit ตามความกว้าง (zoom = สเกล layout จริง)
    if(hf){hf.style.width="";hf.style.zoom="";}
  }
  const w=$("appWrap");if(w)w.style.height="";}
function setupFit(){fitPage();window.addEventListener("resize",()=>{clearTimeout(window._fit);window._fit=setTimeout(fitPage,60);});window.addEventListener("load",fitPage);
  try{new ResizeObserver(()=>fitPage()).observe($("app"));}catch(e){}}
/* boot — call after the page defines render() */
function boot(){try{const q=new URLSearchParams(location.search);if(q.has("u")){q.delete("u");const s=q.toString();history.replaceState(null,"",location.pathname+(s?"?"+s:"")+location.hash);}}catch(e){} // ล้างเฉพาะ ?u= หลังอัปเดตอัตโนมัติ (คง param อื่น/#hash)
  wireCommon();wireSync();render();save();setupFit();setSyncBtn("busy");
  pullRemote(true).finally(()=>{syncReady=true;startPolling();startUpdateCheck();});}

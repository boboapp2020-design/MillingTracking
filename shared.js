"use strict";
/* ============ ระบบติดตามงานซ่อมลูกหีบ — core ใช้ร่วมทั้ง 2 หน้า (index + dashboard) ============ */
const ANCHOR_SERIAL=46276, ANCHOR=new Date(2026,8,11);
function sd(s){const d=new Date(ANCHOR);d.setDate(d.getDate()+(s-ANCHOR_SERIAL));return d;}
function dToSerial(d){return ANCHOR_SERIAL+Math.round((d-ANCHOR)/86400000);}
function isoOf(s){if(s==null||s==="")return"";const d=sd(s);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function serialOfIso(iso){if(!iso)return null;const p=iso.split("-");return dToSerial(new Date(+p[0],+p[1]-1,+p[2]));}
function fmtTH(s){if(s==null||s==="")return"—";const d=sd(s);return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+(d.getFullYear()+543).toString().slice(2);}
const SAT_ANCHOR=new Date(2026,8,5);
function isOffSaturday(d){if(d.getDay()!==6)return false;const w=Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-SAT_ANCHOR)/86400000/7);return ((w%2)+2)%2===0;}
function isHoliday(d){return d.getDay()===0||isOffSaturday(d);}
function weekSatOff(d){const day=d.getDay();const mon=new Date(d.getFullYear(),d.getMonth(),d.getDate()+(day===0?-6:1-day));const sat=new Date(mon);sat.setDate(mon.getDate()+5);return isOffSaturday(sat);}
function workingSerials(s,f){if(s==null||f==null)return[];if(f<s)[s,f]=[f,s];const out=[];for(let x=s;x<=f;x++)if(!isHoliday(sd(x)))out.push(x);return out.length?out:[s];}

const SEED={groups:[
  {id:"mill",name:"กลุ่มลูกหีบ",machines:[
    {id:"m1",name:"ลูกหีบ ชุดที่ 1",tasks:[["Setting ลูกหีบ ตั้ง A2,A3",1,4,46266,46266],["ลงหวีซอง",4,4,46267,46270],["ประกอบเฟืองลูกหีบ+ขัดเพลาลูกหีบ",1,4,46272,46272],["ลงลูกป้อนบน (PF)+ประกอบแบริ่ง",3,4,46273,46275],["Setting ลูกหีบ ตั้ง A1",2,4,46277,46279],["ลงหวีกลาง+Setting ตั้ง C1,C2,C3",3,4,46280,46282],["ลง UF",1,4,46283,46283],["Setting ลูกหีบ B1",1,4,46284,46284],["ยกลูก top",1,4,46286,46286],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,4,46287,46287],["ประกอบ Tailbar + box couping ลูก top",1,4,46288,46288],["ประกอบ Tailbar + box couping ป้อนล่าง 1",1,4,46289,46289],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,2,46290,46291],["เข้างานติดตั้งสายน้ำ Cooling",2,2,46293,46294],["ประกอบถาดน้ำมันลูกหีบ",1,2,46290,46290],["ประกอบโซ่+Spocket+Cover",1,4,46295,46295],["ประกอบชู๊ท+ตั้งระยะเปิด",3,4,46296,46298]]},
    {id:"m2",name:"ลูกหีบ ชุดที่ 2",tasks:[["ลูกหีบชุด 2 Plan เข้า",1,4,46284,46285],["ประกอบบังไบ",1,4,46288,46288],["ประกอบ Shap",1,4,46289,46289],["ประกอบเฟืองลูกหน้า",1,4,46290,46290],["ยกลูกหีบลงแท่น",1,4,46291,46291],["ลงลูกป้อนบน (PF)+ประกอบแบริ่ง",1,4,46293,46293],["Setting A2,A3",1,4,46294,46294],["ประกอบหวีกลาง",3,4,46295,46297],["Setting C1,C2,C3",3,4,46298,46301],["ประกอบหวีซอง",4,4,46302,46305],["ยกลูกป้อนบน",3,4,46307,46309],["Setting A1",2,4,46310,46311],["ลง UF",1,4,46312,46312],["Setting B1",1,4,46314,46314],["ยกลูก top",1,4,46314,46314],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,4,46315,46315],["ประกอบ Tailbar + box couping ลูก top",1,4,46316,46316],["ประกอบ Tailbar + box couping ป้อนล่าง 1",1,4,46317,46317],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,4,46318,46319],["เข้างานติดตั้งสายน้ำ Cooling",2,4,46322,46323],["ประกอบถาดน้ำมันลูกหีบ",1,4,46324,46324],["ประกอบโซ่+Spocket+Cover",1,4,46325,46326],["ประกอบชู๊ท+ตั้งระยะเปิด",3,4,46328,46330]]},
    {id:"m3",name:"ลูกหีบ ชุดที่ 3",tasks:[["ประกอบเฟือง+แบริ่ง UF",2,3,46266,46267],["ยก F3 ลงแท่น",1,3,46268,46268],["ประกอบแท่นลูกป้อน",1,3,46269,46269],["ยกหวีซอง",4,3,46270,46274],["Seting ลูกป้อนเข้ากับหวีซอง",2,3,46275,46276],["ยกลูกป้อนบน",2,3,46277,46279],["Seting A1",2,3,46280,46281],["Seting B1",1,3,46282,46282],["ยก UF",1,3,46283,46283],["ยกลูก top",1,3,46284,46284],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,3,46286,46286],["ประกอบโซ่ขับลูกหีบ",1,3,46287,46287],["ประกอบโซ่ขับลูกป้อน",1,3,46288,46288],["ประกอบ Tailbar + box couping ลูก top",2,3,46289,46290],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,3,46291,46293],["เข้างานติดตั้งสายน้ำ Cooling",1,3,46294,46294],["ประกอบถาดน้ำมันลูกหีบ",1,3,46295,46295],["ประกอบชู๊ท+ตั้งระยะเปิด",3,3,46296,46298]]},
    {id:"m4",name:"ลูกหีบ ชุดที่ 4",tasks:[["ประกอบแท่นลูกป้อน",null,null,null,null],["ยกลูกป้อนล่าง",null,null,null,null],["ยกหวีซอง",4,4,46266,46269],["Seting ลูกป้อนเข้ากับหวีซอง",2,4,46270,46272],["ยกลูกป้อนบน",2,4,46273,46274],["Seting A1",2,4,46275,46276],["Seting B1",1,4,46277,46277],["ยก UF",1,4,46279,46279],["ยกลูก top",1,4,46280,46280],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,4,46281,46281],["ประกอบโซ่ขับลูกหีบ",1,4,46282,46282],["ประกอบโซ่ขับลูกป้อน",1,4,46283,46283],["ประกอบ Tailbar + box couping ลูก top",2,4,46284,46286],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,4,46287,46288],["เข้างานติดตั้งสายน้ำ Cooling",1,4,46289,46289],["ประกอบถาดน้ำมันลูกหีบ",1,4,46290,46290],["ประกอบชู๊ท+ตั้งระยะเปิด",3,4,46291,46294]]},
    {id:"m5",name:"ลูกหีบ ชุดที่ 5",tasks:[["ประกอบคานหวีกลาง+แท่นหวี",3,4,46295,46297],["หวีกลาง+เชื่อม",7,4,46270,46276],["ประกอบหวีซอง",4,4,46298,46302],["ประกอบเฟือง+แบริ่ง ลูกหลัง",1,4,46303,46303],["ยกลูกหลังลงแท่น",1,4,46304,46304],["ยกลูกป้อนบนลงแท่น",1,4,46305,46305],["ประกอบหวีกลาง",3,4,46307,46309],["Set A2,A3",1,4,46310,46310],["Setting C1,C2,C3",1,4,46311,46311],["ยก UF",1,4,46312,46312],["Seting B1",1,4,46314,46314],["ยกลูก top",1,4,46315,46315],["ประกอบไฮดรอลิคกดหัวลูกหีบ",1,4,46316,46316],["ประกอบ Tailbar + box couping ลูก top",1,4,46317,46317],["ประกอบ Tailbar + box couping ป้อนล่าง",1,4,46318,46318],["เข้างานติดตั้งสายจาระบีลูกหีบ",2,4,46319,46322],["เข้างานติดตั้งสายน้ำ Cooling",2,4,46323,46324],["ประกอบถาดน้ำมันลูกหีบ",1,4,46325,46325],["ประกอบโซ่+Spocket+Cover",1,4,46326,46326],["ประกอบชู๊ท+ตั้งระยะเปิด",3,4,46328,46330]]},
    {id:"mr",name:"ตะแกรง Rotary Screen",tasks:[["ประกอบติดตั้งตะแกรง No.1",10,3,46300,46310],["ประกอบติดตั้งตะแกรง No.2",10,3,46311,46318]]}
  ]},
  {id:"prep",name:"กลุ่มเตรียมอ้อย",machines:[
    {id:"pdump",name:"drump+ตะกาว",tasks:[["งาน drump + ตะกาว (เสร็จแล้ว)",3,4,46259,46263,"",100]]},
    {id:"pside",name:"สะพาน Side",tasks:[["ประกอบ Kicker",1,5,46297,46297],["ประกอบฝา Cover",1,5,46298,46298],["หา Alighment Kicker",1,5,46299,46299],["หา Alighment Equlizer",1,5,46300,46300],["อัดจาระบี Tail Shap",1,2,46272,46272]]},
    {id:"pmain",name:"สะพาน Main",tasks:[["เปลี่ยนน้อต+ซ่อมใบสะพาน+ติดตั้งใบสะพาน (รับเหมา)",15,3,46266,46281],["เช็คลูกปืนพร้อมเปลี่ยนลูกปืน ลูก roller",null,5,46266,46281],["เพลา Head Shap ถึงมิตรลาว",null,null,46277,46277,"วัสดุเข้า"],["ประกอบเพลา Head Shap+พีเนียส",4,5,46282,46286],["ประกอบเฟือง Head Shap พร้อมติดตั้ง",1,5,46287,46287],["เปลี่ยนใบมีด 1,2,3 (ผู้รับเหมา)",20,null,null,null],["ประกอบ leverer 1 (ยังรอเกียร์)",4,5,46288,46291],["ประกอบ leverer 2 + Aligment",4,5,46293,46296],["ประกอบมีด 3 + Aligment มีด 1,2,3",6,3,46315,46322],["แก้ไข Cover Kicker",4,3,46323,46326],["gearbox ถึงมิตรลาว",null,null,null,null,"รอวัสดุ"],["ประกอบ gearbox leverer 1 + Aligment",null,null,null,null],["ประกอบฝาข้างสะพาน",null,null,null,null,"หลัง Test Run"],["ประกอบแปรงปัดใบสะพาน",null,null,null,null,"หลัง Test Run"]]},
    {id:"psand",name:"สะพานแยกทราย",tasks:[["เช็คลูก Roller + พร้อมเปลี่ยนลูก Roller",5,2,46266,46270],["อัดจาระบีชุดขับ+ชุดตาม",null,null,null,null]]},
    {id:"pshred",name:"Shredder",tasks:[["Disch Sherder ถึงมิตรลาว",null,null,46300,46300,"วัสดุเข้า"],["ประกอบเพลา Sherdder ลงแท่น",1,5,46301,46301],["ประกอบ Case Sherdder+เชื่อม",2,5,46302,46303],["ประกอบชู๊ท Sherdder",5,5,46304,46309],["เชื่อม Case Sherdder",4,2,46310,46314],["ประกอบตะแกรง gidbar เข้า Sherdder",2,3,46310,46311],["ประกอบฆ้อน+หัวทิป",7,3,46312,46319],["ประกอบแม่เหล็กไฟฟ้า",2,3,46322,46323],["ตั้ง Aligment Sherdder",2,3,46324,46325]]}
  ]}
]};
const DEFAULT_PINS={pdump:{x:10,y:64},pside:{x:29,y:41},psand:{x:16.5,y:53},pmain:{x:22.5,y:61},pshred:{x:33,y:56},
  m1:{x:46.5,y:44},m2:{x:56,y:44},m3:{x:65,y:44},m4:{x:74,y:44},m5:{x:83,y:44},mr:{x:91,y:60}};

const LS_KEY="milling_repair_v4";
function freshFromSeed(){let tid=0;const g=SEED.groups.map(gr=>({id:gr.id,name:gr.name,machines:gr.machines.map(m=>({id:m.id,name:m.name,owner:"",tasks:m.tasks.map(t=>({id:m.id+"-"+(++tid),name:t[0],days:t[1],labor:t[2],start:t[3]??null,finish:t[4]??null,note:t[5]||"",prog:t[6]||0}))}))}));return {groups:g,pins:JSON.parse(JSON.stringify(DEFAULT_PINS)),updated:Date.now()};}
let WAS_SEED=false;
function load(){try{const r=localStorage.getItem(LS_KEY);if(r){const p=JSON.parse(r);if(p&&p.groups){if(!p.pins)p.pins=JSON.parse(JSON.stringify(DEFAULT_PINS));return p;}}}catch(e){}WAS_SEED=true;return freshFromSeed();}
let DATA=load();
let saveTimer=null;
function save(){DATA.updated=Date.now();try{localStorage.setItem(LS_KEY,JSON.stringify(DATA));}catch(e){}const st=$("saveTxt");if(st)st.textContent="บันทึกแล้ว "+new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(save,400);if(typeof schedulePush==="function")schedulePush();}

/* ---- weight = man-hour (9h Mon-Fri in Saturday-off weeks, else 8h; holidays excluded) ---- */
function hoursForDay(d){if(isHoliday(d))return 0;return (d.getDay()>=1&&d.getDay()<=5&&weekSatOff(d))?9:8;}
function manday(t){return (t.days>0&&t.labor>0)?t.days*t.labor:0;}
function manhour(t){if(!(t.labor>0)||!(t.days>0))return 0;if(t.start==null)return t.labor*t.days*8;let c=0,sum=0,x=t.start,g=0;while(c<t.days&&g<600){const h=hoursForDay(sd(x));if(h>0){sum+=h;c++;}x++;g++;}return t.labor*sum;}
const isExcluded=m=>m.id==='pdump';
function machineRawMH(m){let s=0;m.tasks.forEach(t=>s+=manhour(t));return s;}
function totalMandays(){let s=0;DATA.groups.forEach(g=>g.machines.forEach(m=>{if(isExcluded(m))return;s+=machineRawMH(m);}));return s||1;}
function taskWeight(t,total){return manhour(t)/total*100;}
function taskWeightInJob(t,m){const raw=machineRawMH(m);return raw>0?manhour(t)/raw*100:0;}
function machineMandays(m){return machineRawMH(m);}
function machineActual(m){const total=totalMandays();let rw=0,ra=0;m.tasks.forEach(t=>{const mh=manhour(t);rw+=mh;ra+=mh*(t.prog||0)/100;});const localPct=rw>0?ra/rw*100:0;return {weight:isExcluded(m)?0:rw/total*100,actual:isExcluded(m)?0:ra/total*100,localPct,rawMH:rw};}
function machinePlanPct(m){const raw=machineRawMH(m);if(raw<=0)return 0;let acc=0;m.tasks.forEach(t=>{const mh=manhour(t);const ws=workingSerials(t.start,t.finish);if(mh<=0||!ws.length)return;acc+=(mh/raw)*ws.filter(x=>x<=TODAY_SERIAL).length/ws.length;});return acc*100;}
function machineStatus(m){const a=machineActual(m);if(a.localPct>=99.9)return"done";if(a.localPct>0)return"prog";return"todo";}
const STCOL={done:"var(--green)",prog:"var(--amber)",todo:"var(--grey)"};
function planPctUpTo(serial){const total=totalMandays();let acc=0;DATA.groups.forEach(g=>g.machines.forEach(m=>{if(isExcluded(m))return;m.tasks.forEach(t=>{const mh=manhour(t);if(mh<=0)return;const ws=workingSerials(t.start,t.finish);if(!ws.length)return;acc+=mh/total*100*ws.filter(x=>x<=serial).length/ws.length;})}));return acc;}
function actualPct(){const total=totalMandays();let acc=0;DATA.groups.forEach(g=>g.machines.forEach(m=>{if(isExcluded(m))return;m.tasks.forEach(t=>{acc+=manhour(t)/total*(t.prog||0);})}));return acc;}
function projectRange(){let mn=null,mx=null;DATA.groups.forEach(g=>g.machines.forEach(m=>m.tasks.forEach(t=>{if(t.start!=null)mn=mn==null?t.start:Math.min(mn,t.start);if(t.finish!=null)mx=mx==null?t.finish:Math.max(mx,t.finish);})));return {min:mn??46266,max:mx??46330};}
const TODAY_SERIAL=(()=>{const n=new Date();n.setHours(0,0,0,0);return dToSerial(n);})();
function machineById(id){for(const g of DATA.groups)for(const m of g.machines)if(m.id===id)return m;return null;}
function groupOf(m){return DATA.groups.find(gr=>gr.machines.includes(m));}
function jobs(){return DATA.groups.flatMap(g=>g.machines).filter(m=>!isExcluded(m));}
const $=id=>document.getElementById(id);
function escapeHtml(s){return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}

/* ---- theme ---- */
(function(){var t="dark";try{t=localStorage.getItem("mr_theme")||"dark";}catch(e){}document.documentElement.setAttribute("data-theme",t);})();
function wireCommon(){
  const bt=$("btnTheme");if(bt)bt.addEventListener("click",()=>{const r=document.documentElement;const cur=r.getAttribute("data-theme");const next=cur==="dark"?"light":(cur==="light"?"dark":(matchMedia("(prefers-color-scheme:dark)").matches?"light":"dark"));r.setAttribute("data-theme",next);try{localStorage.setItem("mr_theme",next);}catch(e){}if(typeof onThemeChange==="function")onThemeChange();});
  const be=$("btnExport");if(be)be.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(DATA,null,2)],{type:"application/json"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download="milling_repair_"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(u);});
  const bi=$("btnImport");if(bi)bi.addEventListener("click",()=>$("fileIn").click());
  const fi=$("fileIn");if(fi)fi.addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result);if(p&&p.groups){if(!p.pins)p.pins=JSON.parse(JSON.stringify(DEFAULT_PINS));DATA=p;save();render();alert("นำเข้าข้อมูลสำเร็จ");}else alert("ไฟล์ไม่ถูกต้อง");}catch(err){alert("อ่านไฟล์ไม่ได้");}};r.readAsText(f);e.target.value="";});
}

/* ---- Google Sheet sync (Apps Script backend) — URL ฝังไว้ถาวร ผู้ใช้แก้ไม่ได้ ---- */
const SYNC_URL="https://script.google.com/macros/s/AKfycbwz5JC3AsGW4SRS-suhTRwFi4Z1jQDV5VT1t7laGr08aoj8EFrXDmLxVr4dXxbcBnHU/exec";
const SYNC_KEY="mlk_7Qx2F9pR4vT8nZ6bW3sK";   // ต้องตรงกับ SECRET ใน Code.gs
let syncUrl=SYNC_URL;let pushTimer=null;let lastSync=null;let syncReady=false;
function syncGet(extra){return syncUrl+"?key="+encodeURIComponent(SYNC_KEY)+(extra?"&"+extra:"")+"&t="+Date.now();}
function setSyncBtn(state,msg){const b=$("btnSync");if(!b)return;const map={off:"เชื่อมชีท",ok:"ซิงค์แล้ว",busy:"กำลังซิงค์…",err:"ซิงค์ไม่สำเร็จ",offline:"ออฟไลน์"};b.textContent=map[state]||map.off;b.classList.remove("pri");b.title=msg||"";}
function schedulePush(){if(!syncUrl||!syncReady)return;clearTimeout(pushTimer);pushTimer=setTimeout(pushRemote,1500);}
async function pushRemote(){if(!syncUrl)return;setSyncBtn("busy");
  try{const res=await fetch(syncUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({data:DATA,key:SYNC_KEY})});
    const j=await res.json();if(j&&j.ok){lastSync=new Date();setSyncBtn("ok","อัปเดตชีทล่าสุด "+lastSync.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}));}else setSyncBtn("err",(j&&j.error)||"ไม่ทราบสาเหตุ");
  }catch(e){setSyncBtn("offline","เชื่อมต่ออินเทอร์เน็ตไม่ได้ · ข้อมูลถูกเก็บในเครื่องแล้ว");}
}
async function saveSnapshot(){
  if(!syncUrl){alert("กรุณาเชื่อม Google Sheet ก่อน (กดปุ่ม ☁️ เชื่อม Sheet)");return;}
  const js=jobs().map(m=>({name:m.name,pct:+machineActual(m).localPct.toFixed(1)}));
  const now=new Date();const ds=String(now.getDate()).padStart(2,"0")+"/"+String(now.getMonth()+1).padStart(2,"0")+"/"+now.getFullYear();
  const snap={date:ds,time:now.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}),overall:+actualPct().toFixed(2),plan:+planPctUpTo(TODAY_SERIAL).toFixed(2),jobs:js};
  const btn=$("btnSnap");const old=btn?btn.textContent:"";if(btn)btn.textContent="⏳ กำลังบันทึก…";
  try{const res=await fetch(syncUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"snapshot",snapshot:snap,key:SYNC_KEY})});
    const j=await res.json();
    if(j&&j.ok){if(btn){btn.textContent="✅ บันทึกแล้ว";setTimeout(()=>btn.textContent=old,2500);}alert("บันทึก Snapshot วันที่ "+ds+" ลงชีทแล้ว\n%รวม = "+snap.overall+"% · ตามแผน = "+snap.plan+"%");}
    else{if(btn)btn.textContent=old;alert("บันทึกไม่สำเร็จ: "+((j&&j.error)||"ไม่ทราบสาเหตุ"));}
  }catch(e){if(btn)btn.textContent=old;alert("เชื่อมต่ออินเทอร์เน็ตไม่ได้");}
}
async function fetchSnapshots(){if(!syncUrl)return null;try{const res=await fetch(syncGet("snap=1"));const j=await res.json();return (j&&j.ok&&j.snapshots)?j.snapshots:null;}catch(e){return null;}}
async function pullRemote(silent){if(!syncUrl)return false;if(!silent)setSyncBtn("busy");
  try{const res=await fetch(syncGet());const j=await res.json();
    if(j&&j.ok&&j.data&&j.data.groups){const remote=j.data;const localT=DATA.updated||0,remoteT=remote.updated||0;const localFresh=WAS_SEED;
      if(remoteT>localT||localFresh){if(!remote.pins)remote.pins=JSON.parse(JSON.stringify(DEFAULT_PINS));DATA=remote;save();render();}
      lastSync=new Date();setSyncBtn("ok","ดึงข้อมูลจากชีทแล้ว "+lastSync.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"}));return true;}
    setSyncBtn("err","ชีทยังไม่มีข้อมูล");return false;
  }catch(e){setSyncBtn("offline","เชื่อมต่ออินเทอร์เน็ตไม่ได้");return false;}
}
function wireSync(){
  const bSnap=$("btnSnap");if(bSnap)bSnap.addEventListener("click",saveSnapshot);
  const bSync=$("btnSync");if(bSync)bSync.addEventListener("click",async()=>{ setSyncBtn("busy"); await pullRemote(); });  // คลิก = ดึงข้อมูลล่าสุดจากชีท (ไม่มี prompt แก้ URL)
}
/* ---- cane-truck race: วิ่งตาม % งานซ่อมรวมทั้งแผนก เข้าเส้นชัยที่ 100% ---- */
function renderRace(){const t=$("truck");if(!t)return;
  const p=Math.max(0,Math.min(100,actualPct())),f=p/100;
  t.style.left=(6+86*f).toFixed(2)+"%";          /* center วิ่ง 6% → 92% เข้าเส้นชัย */
  const pct=$("tkPct");if(pct)pct.textContent=p.toFixed(1)+"%";
  const done=p>=99.95;t.classList.toggle("done",done);
  const h=$("raceHint");if(h)h.textContent=done?"เข้าเส้นชัยแล้ว!":"วิ่งไปแล้ว "+p.toFixed(0)+"% ของเส้นชัย";}

/* ---- lock ratio: ย่อทั้งหน้าให้พอดีจอ คงสัดส่วนเดสก์ท็อปทุกอุปกรณ์ ---- */
const DESIGN_W=1340, MAX_SCALE=1.7;
function fitPage(){const app=$("app");if(!app)return;const vw=document.documentElement.clientWidth;
  let s=Math.min(MAX_SCALE, vw/DESIGN_W);
  if($("heroFrame")){ // หน้าแรก: fit ให้พอดีจอทั้งกว้างและสูง (เห็นทั้งหน้าในจอเดียว)
    app.style.transform="none";const naturalH=app.scrollHeight||820;
    const availH=(window.innerHeight||800)-6;
    s=Math.min(vw/DESIGN_W, availH/naturalH, MAX_SCALE);
  }
  app.style.transform="scale("+s.toFixed(4)+")";
  app.style.marginLeft=Math.max(0,(vw-DESIGN_W*s)/2)+"px";
  const w=$("appWrap");if(w)w.style.height=app.getBoundingClientRect().height+"px";}
function setupFit(){fitPage();window.addEventListener("resize",()=>{clearTimeout(window._fit);window._fit=setTimeout(fitPage,60);});window.addEventListener("load",fitPage);
  try{new ResizeObserver(()=>fitPage()).observe($("app"));}catch(e){}}
/* boot — call after the page defines render() */
function boot(){wireCommon();wireSync();render();save();setupFit();setSyncBtn("busy");pullRemote(true).finally(()=>{syncReady=true;});}

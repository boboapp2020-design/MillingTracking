"use strict";
/* ============ หน้ากรอกข้อมูล (index.html) — ไดอะแกรม + ฟอร์ม ============ */
let editPins=false;
function renderDiagram(){
  const html=Object.keys(DATA.pins).map(id=>{const m=machineById(id);if(!m)return"";const a=machineActual(m);const st=machineStatus(m);const col=STCOL[st];const pos=DATA.pins[id];
    const num=/^m[1-5]$/.test(id)?id.replace("m",""):(id==="mr"?"R":"·");
    const label=m.name.replace("ลูกหีบ ชุดที่","ลูกหีบ").replace("ตะแกรง ","");
    return `<div class="pin st-${st} ${st==='prog'?'prog':''}" data-mid="${id}" style="left:${pos.x}%;top:${pos.y}%;--pc:${st==='done'?'var(--green)':'#8b929d'}">
      <div class="dot"><i>${num}</i></div>
      <div class="plabel">${label}</div>
      <div class="ppct s-${st}">${st==='done'?'✓ 100%':a.localPct.toFixed(0)+'%'}</div></div>`;}).join("");
  const STATIC=[{t:"Mixed Juice Tank",x:48,y:72},{t:"หม้อไอน้ำ (Boiler)",x:96,y:44}];
  const shtml=STATIC.map(s=>`<div class="staticlbl" style="left:${s.x}%;top:${s.y}%">${s.t}</div>`).join("");
  $("pinLayer").innerHTML=html+shtml;
  $("pinLayer").querySelectorAll(".pin").forEach(p=>{
    if(editPins){p.classList.add("editing");makeDraggable(p);}
    else p.addEventListener("click",()=>openDrawer(p.dataset.mid));
  });
}
function makeDraggable(pin){
  pin.addEventListener("pointerdown",e=>{e.preventDefault();const layer=$("pinLayer").getBoundingClientRect();const id=pin.dataset.mid;pin.setPointerCapture(e.pointerId);
    const move=ev=>{let x=(ev.clientX-layer.left)/layer.width*100;let y=(ev.clientY-layer.top)/layer.height*100;x=Math.max(0,Math.min(100,x));y=Math.max(0,Math.min(100,y));pin.style.left=x+"%";pin.style.top=y+"%";DATA.pins[id]={x:+x.toFixed(1),y:+y.toFixed(1)};};
    const up=()=>{pin.removeEventListener("pointermove",move);pin.removeEventListener("pointerup",up);scheduleSave();};
    pin.addEventListener("pointermove",move);pin.addEventListener("pointerup",up);});
}
{const _bep=$("btnEditPins");if(_bep)_bep.addEventListener("click",()=>{editPins=!editPins;_bep.classList.toggle("pri",editPins);_bep.innerHTML=editPins?"✔ เสร็จ":"🎯 จัดตำแหน่งหมุด";const en=$("editNote");if(en)en.style.display=editPins?"block":"none";renderDiagram();});}
$("resetPins").addEventListener("click",e=>{e.preventDefault();if(!confirm("รีเซ็ตตำแหน่งหมุดทั้งหมดกลับเป็นค่ามาตรฐาน?"))return;DATA.pins=JSON.parse(JSON.stringify(DEFAULT_PINS));renderDiagram();scheduleSave();});

/* drawer / form */
let curMid=null;
function openDrawer(mid){if(editPins)return;curMid=mid;const m=machineById(mid);if(!m)return;const g=groupOf(m);
  $("dTitle").innerHTML=escapeHtml(m.name)+(machineStatus(m)==='done'?' <span class="succ-badge">✓ Success 100%</span>':'');$("dSub").textContent=g.name+" · "+m.tasks.length+" งาน";
  const ow=$("dOwner");ow.value=m.owner||"";ow.oninput=()=>{m.owner=ow.value;scheduleSave();};
  renderTasks();$("scrim").classList.add("on");$("drawer").classList.add("on");$("drawer").setAttribute("aria-hidden","false");}
function closeDrawer(){$("scrim").classList.remove("on");$("drawer").classList.remove("on");$("drawer").setAttribute("aria-hidden","true");curMid=null;renderDiagram();}
function dmy(serial){const s=isoOf(serial);if(!s)return "—";const p=s.split("-");return p[2]+"/"+p[1]+"/"+p[0];}
function wtCell(t,m,total){if(manhour(t)===0)return '<span style="color:var(--amber)">—</span><br><span style="opacity:.55;font-size:10px">ยังไม่ระบุ</span>';
  return `<b>${taskWeightInJob(t,m).toFixed(1)}%</b><br><span style="opacity:.6;font-size:10px">รวม ${taskWeight(t,total).toFixed(2)}% · ${manhour(t)}h</span>`;}
function miniHTML(m){const a=machineActual(m),mh=machineMandays(m);
  return `<div class="m"><div class="l">ความคืบหน้าเครื่องนี้</div><div class="v" style="color:${STCOL[machineStatus(m)]}">${a.localPct.toFixed(1)}%</div></div><div class="m"><div class="l">น้ำหนัก (ทั้งโปรเจกต์)</div><div class="v">${isExcluded(m)?'แยก':a.weight.toFixed(2)+'%'}</div></div><div class="m"><div class="l">งานรวม</div><div class="v">${mh.toFixed(0)} <span style="font-size:11px;color:var(--ink2)">man-hr</span></div></div>`;}
const STLABEL={done:"เสร็จแล้ว",prog:"กำลังทำ",todo:"ยังไม่เริ่ม"};
function renderTasks(){const m=machineById(curMid);
  $("dMini").innerHTML=miniHTML(m);
  $("taskBody").innerHTML=m.tasks.map((t,i)=>{const p=+t.prog||0;const st=p>=100?"done":(p>0?"prog":"todo");
    const wj=manhour(t)===0?"—":taskWeightInJob(t,m).toFixed(1)+"%";
    const meta=`<div class="tc-meta">⏱ ${t.days??"—"} วัน · ${dmy(t.start)} → ${dmy(t.finish)} · น้ำหนักใน Job <b class="tcw">${wj}</b></div>`;
    if(st==="done"){ // เสร็จแล้ว → ดูอย่างเดียว
      return `<div class="tcard done locked" data-i="${i}">
        <div class="tc-top"><div class="tc-name">${escapeHtml(t.name)}</div><span class="tc-badge s-done">✓ เสร็จแล้ว · 100%</span></div>
        ${meta}
        <div class="tc-ro"><span>👥 จำนวนคน: <b>${t.labor??"—"}</b></span><span>📝 หมายเหตุ: ${t.note?escapeHtml(t.note):"—"}</span><span class="ro-tag">🔒 ดูอย่างเดียว</span></div>
      </div>`;}
    return `<div class="tcard ${st}" data-i="${i}">
      <div class="tc-top"><div class="tc-name">${escapeHtml(t.name)}</div><span class="tc-badge s-${st}">${STLABEL[st]} · ${p}%</span></div>
      ${meta}
      <div class="tc-grid">
        <div class="tc-fld">
          <label>จำนวนคน</label>
          <div class="stepper"><button type="button" class="stp" data-stp="-1" aria-label="ลด">−</button><input class="num edit" type="number" min="0" step="1" value="${t.labor??""}" data-f="labor" inputmode="numeric"><button type="button" class="stp" data-stp="1" aria-label="เพิ่ม">＋</button></div>
        </div>
        <div class="tc-fld grow">
          <label>ความคืบหน้า <b class="pv" style="color:${STCOL[st]}">${p}%</b></label>
          <input class="prg edit" type="range" min="0" max="100" step="5" value="${p}" data-f="prog">
        </div>
      </div>
      <div class="tc-note"><label>หมายเหตุ</label><input class="edit" value="${escapeHtml(t.note||"")}" data-f="note" placeholder="เพิ่มหมายเหตุ เช่น รอวัสดุ / ปัญหาที่พบ…"></div>
    </div>`;}).join("");
  $("taskBody").querySelectorAll(".tcard:not(.locked)").forEach(card=>{const i=+card.dataset.i;const T=()=>machineById(curMid).tasks[i];
    const li=card.querySelector('input[data-f=labor]'),rg=card.querySelector('.prg'),pv=card.querySelector('.pv'),badge=card.querySelector('.tc-badge');
    const setProg=v=>{v=Math.max(0,Math.min(100,+v));const t=T();t.prog=v;rg.value=v;
      const st=v>=100?"done":(v>0?"prog":"todo");pv.textContent=v+"%";pv.style.color=STCOL[st];
      card.className="tcard "+st;badge.textContent=STLABEL[st]+" · "+v+"%";badge.className="tc-badge s-"+st;
      refreshMini();scheduleSave();};
    rg.addEventListener('input',e=>setProg(e.target.value));
    rg.addEventListener('change',()=>{if((+T().prog||0)>=100)renderTasks();}); // ครบ 100% แล้วล็อกเป็นดูอย่างเดียว
    card.querySelectorAll('.stp').forEach(b=>b.addEventListener('click',()=>{let v=(+li.value||0)+(+b.dataset.stp);if(v<0)v=0;li.value=v;li.dispatchEvent(new Event('input'));}));
    li.addEventListener('input',()=>{const t=T();t.labor=li.value===""?null:Math.max(0,+li.value);refreshWeights();scheduleSave();});
    const ni=card.querySelector('input[data-f=note]');ni.addEventListener('input',()=>{T().note=ni.value;scheduleSave();});
  });}
function refreshWeights(){const m=machineById(curMid);if(!m)return;
  $("taskBody").querySelectorAll(".tcard").forEach(card=>{const i=+card.dataset.i;const t=m.tasks[i];if(t){const w=card.querySelector('.tcw');if(w)w.textContent=manhour(t)===0?"—":taskWeightInJob(t,m).toFixed(1)+"%";}});refreshMini();}
function refreshMini(){const m=machineById(curMid);if(!m)return;$("dMini").innerHTML=miniHTML(m);
  $("dTitle").innerHTML=escapeHtml(m.name)+(machineStatus(m)==='done'?' <span class="succ-badge">✓ Success 100%</span>':'');}
$("dClose").addEventListener("click",closeDrawer);$("scrim").addEventListener("click",closeDrawer);$("dDone").addEventListener("click",closeDrawer);
$("dReset").addEventListener("click",()=>{if(!confirm("คืนค่าเครื่องนี้กลับเป็นข้อมูลตั้งต้นจาก Excel?"))return;const fresh=freshFromSeed();const fm=fresh.groups.flatMap(g=>g.machines).find(x=>x.id===curMid);const m=machineById(curMid);if(fm){m.tasks=fm.tasks;renderTasks();scheduleSave();}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("drawer").classList.contains("on"))closeDrawer();});

function render(){renderRace();renderDiagram();}
function onThemeChange(){renderDiagram();}
function onSyncConnected(){renderDiagram();}
boot();

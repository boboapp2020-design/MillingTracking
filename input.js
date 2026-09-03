"use strict";
/* ============ หน้ากรอกข้อมูล (index.html) — ไดอะแกรม + ฟอร์ม ============ */
let editPins=false;
function renderDiagram(){
  const html=Object.keys(DATA.pins).map(id=>{const m=machineById(id);if(!m)return"";const a=machineActual(m);const st=machineStatus(m);const col=STCOL[st];const pos=DATA.pins[id];
    const num=/^m[1-5]$/.test(id)?id.replace("m",""):(id==="mr"?"R":"·");
    const label=m.name.replace("ลูกหีบ ชุดที่","ลูกหีบ").replace("ตะแกรง ","");
    return `<div class="pin st-${st} ${st==='prog'?'prog':''}" data-mid="${id}" style="left:${pos.x}%;top:${pos.y}%;--p:${a.localPct.toFixed(1)}">
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
function miniHTML(m){const a=machineActual(m);const plan=(typeof machinePlanPct==="function")?machinePlanPct(m):0;
  return `<div class="m"><div class="l">ความคืบหน้าเครื่องนี้</div><div class="v" style="color:${STCOL[machineStatus(m)]}">${a.localPct.toFixed(1)}%</div></div><div class="m"><div class="l">เป้าหมาย ณ วันนี้</div><div class="v" style="color:var(--brand2)">${plan.toFixed(1)}%</div></div>`;}
function miniHTML_old(m){const a=machineActual(m),mh=machineMandays(m);
  return `<div class="m"><div class="l">ความคืบหน้าเครื่องนี้</div><div class="v" style="color:${STCOL[machineStatus(m)]}">${a.localPct.toFixed(1)}%</div></div><div class="m"><div class="l">น้ำหนัก (ทั้งโปรเจกต์)</div><div class="v">${isExcluded(m)?'แยก':a.weight.toFixed(2)+'%'}</div></div><div class="m"><div class="l">งานรวม</div><div class="v">${mh.toFixed(0)} <span style="font-size:11px;color:var(--ink2)">man-hr</span></div></div>`;}
const STLABEL={done:"เสร็จแล้ว",prog:"กำลังทำ",todo:"ยังไม่เริ่ม"};
function pendingFor(mid,ti){return (DATA.logs||[]).find(L=>L.mid===mid&&L.ti===ti&&L.status==='pending');}
function daysLine(t,i){const tgt=t.days;const used=consumedDays(curMid,i);
  if(tgt==null)return `<div class="tc-dates">🗓️ ไม่ได้ระบุจำนวนวัน</div>`;
  const rem=tgt-used;const col=rem<0?"var(--red)":(rem===0?"var(--amber)":"var(--brand2)");
  return `<div class="tc-dates">🗓️ ต้องใช้ <b>${tgt}</b> วัน · เหลือ <b style="color:${col}">${rem}</b> วัน${used>0?` <span style="opacity:.6">(ใช้ไป ${used})</span>`:''}</div>`;}
function snapDateStr(){const s=$("snapDate");if(s&&s.value){const q=s.value.split("-");return q[2]+"/"+q[1]+"/"+q[0];}const t=new Date();const P=n=>String(n).padStart(2,"0");return P(t.getDate())+"/"+P(t.getMonth()+1)+"/"+t.getFullYear();}
function renderTasks(){const m=machineById(curMid);
  $("dMini").innerHTML=miniHTML(m);
  $("taskBody").innerHTML=m.tasks.map((t,i)=>{const ap=+t.prog||0;const ast=ap>=100?"done":(ap>0?"prog":"todo");
    if(ast==="done"){ // อนุมัติแล้วครบ 100% → ดูอย่างเดียว
      return `<div class="tcard done locked" data-i="${i}">
        <div class="tc-top"><div class="tc-name">${escapeHtml(t.name)}</div><span class="tc-badge s-done">✓ เสร็จแล้ว · 100%</span></div>
        ${daysLine(t,i)}
        <div class="tc-ro"><span>👥 จำนวนคน: <b>${t.labor??"—"}</b></span><span>📝 หมายเหตุ: ${t.note?escapeHtml(t.note):"—"}</span><span class="ro-tag">🔒 ดูอย่างเดียว</span></div>
      </div>`;}
    const pend=pendingFor(curMid,i);const dp=pend?(+pend.prog||0):ap;const dl=pend?pend.labor:t.labor;const dn=pend?pend.note:t.note;const dst=dp>=100?"done":(dp>0?"prog":"todo");
    return `<div class="tcard ${dst}" data-i="${i}">
      <div class="tc-top"><div class="tc-name">${escapeHtml(t.name)}</div><span class="tc-badge s-${dst}">${STLABEL[dst]} · ${dp}%</span>${pend?'<span class="pendtag">⏳ รอตรวจสอบ</span>':''}</div>
      ${daysLine(t,i)}
      <div class="tc-grid">
        <div class="tc-fld"><label>จำนวนคน</label>
          <div class="stepper"><button type="button" class="stp" data-stp="-1" aria-label="ลด">−</button><input class="num edit" type="number" min="0" step="1" value="${dl??""}" data-f="labor" inputmode="numeric"><button type="button" class="stp" data-stp="1" aria-label="เพิ่ม">＋</button></div>
        </div>
        <div class="tc-fld grow"><label>ความคืบหน้า <b class="pv" style="color:${STCOL[dst]}">${Math.max(dp,ap)}%</b>${ap>0?`<span class="floorhint">🔒 ตรวจแล้ว ${ap}% · ลดต่ำกว่านี้ไม่ได้</span>`:''}</label>
          <div class="prgrow"><button type="button" class="stpbtn pstp" data-pstp="-1" aria-label="ลด 1%">−</button><input class="prg edit" type="range" min="${ap}" max="100" step="1" value="${Math.max(dp,ap)}"><button type="button" class="stpbtn pstp" data-pstp="1" aria-label="เพิ่ม 1%">＋</button></div>
        </div>
      </div>
      <div class="tc-note"><label>หมายเหตุ</label><input class="edit" value="${escapeHtml(dn||"")}" data-f="note" placeholder="เพิ่มหมายเหตุ เช่น รอวัสดุ / ปัญหาที่พบ…"></div>
    </div>`;}).join("");
  $("taskBody").querySelectorAll(".tcard:not(.locked)").forEach(card=>{ // แก้เฉพาะการแสดงผล (ร่าง) ยังไม่เขียนค่าจริง
    const i=+card.dataset.i;const floor=+machineById(curMid).tasks[i].prog||0; // ตรวจแล้วลดต่ำกว่านี้ไม่ได้
    const li=card.querySelector('input[data-f=labor]'),rg=card.querySelector('.prg'),pv=card.querySelector('.pv'),badge=card.querySelector('.tc-badge');
    const setP=v=>{v=Math.max(floor,Math.max(0,Math.min(100,Math.round(+v||0))));if(+rg.value!==v)rg.value=v;const st=v>=100?"done":(v>0?"prog":"todo");pv.textContent=v+"%";pv.style.color=STCOL[st];badge.textContent=STLABEL[st]+" · "+v+"%";badge.className="tc-badge s-"+st;};
    rg.addEventListener('input',e=>setP(e.target.value));
    card.querySelectorAll('.pstp').forEach(b=>b.addEventListener('click',()=>setP((+rg.value||0)+(+b.dataset.pstp))));
    card.querySelectorAll('[data-stp]').forEach(b=>b.addEventListener('click',()=>{let v=(+li.value||0)+(+b.dataset.stp);if(v<0)v=0;li.value=v;}));
  });}
function submitDrafts(){const m=machineById(curMid);if(!m){closeDrawer();return;}let n=0;
  $("taskBody").querySelectorAll(".tcard:not(.locked)").forEach(card=>{const i=+card.dataset.i;const t=m.tasks[i];
    const prog=Math.max(+t.prog||0,Math.max(0,Math.min(100,Math.round(+card.querySelector('.prg').value||0)))); // ไม่ต่ำกว่าที่ตรวจแล้ว
    const lv=card.querySelector('input[data-f=labor]').value;const labor=lv===""?null:Math.max(0,+lv);
    const note=card.querySelector('input[data-f=note]').value;
    const changed=prog!==(+t.prog||0)||labor!==(t.labor??null)||(note||"")!==(t.note||"");
    let pend=pendingFor(curMid,i);
    if(changed){if(pend){pend.prog=prog;pend.labor=labor;pend.note=note;pend.by=m.owner||"ไม่ระบุ";pend.date=snapDateStr();pend.ts=Date.now();}
      else{DATA.logs.push({id:"L"+Date.now()+"_"+i,mid:curMid,ti:i,taskName:t.name,machineName:m.name,by:m.owner||"ไม่ระบุ",prog,labor,note,date:snapDateStr(),ts:Date.now(),status:"pending"});}n++;}
    else if(pend){DATA.logs=DATA.logs.filter(L=>L!==pend);} // กลับเท่าเดิม → ถอนรายการ
  });
  scheduleSave();renderLog();closeDrawer();
  if(n)setTimeout(()=>notify("บันทึกสำเร็จ","ส่งเข้ารอตรวจสอบแล้ว "+n+" รายการ · % จะแสดงบนหมุด/Dashboard หลังผ่านการตรวจสอบ"),150);
}
function refreshWeights(){const m=machineById(curMid);if(!m)return;
  $("taskBody").querySelectorAll(".tcard").forEach(card=>{const i=+card.dataset.i;const t=m.tasks[i];if(t){const w=card.querySelector('.tcw');if(w)w.textContent=manhour(t)===0?"—":taskWeightInJob(t,m).toFixed(1)+"%";}});refreshMini();}
function refreshMini(){const m=machineById(curMid);if(!m)return;$("dMini").innerHTML=miniHTML(m);
  $("dTitle").innerHTML=escapeHtml(m.name)+(machineStatus(m)==='done'?' <span class="succ-badge">✓ Success 100%</span>':'');}
$("dClose").addEventListener("click",closeDrawer);$("scrim").addEventListener("click",closeDrawer);$("dDone").addEventListener("click",submitDrafts);
$("dReset").addEventListener("click",closeDrawer); // ปุ่มยกเลิก = ปิดหน้าต่าง (ทิ้งร่าง)
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("drawer").classList.contains("on"))closeDrawer();});

/* ===== Log Book ===== */
function renderLog(){const el=$("logList");if(!el)return;let logs=(DATA.logs||[]).slice().sort((a,b)=>(b.ts||0)-(a.ts||0));
  const pc=logs.filter(L=>L.status==='pending').length;const pcEl=$("logPend");if(pcEl)pcEl.textContent=pc?("· รอตรวจสอบ "+pc+" รายการ"):"";
  const fv=($("logFilter")||{}).value||"all";const q=(($("logSearch")||{}).value||"").trim().toLowerCase();
  if(fv!=="all")logs=logs.filter(L=>L.status===fv);
  if(q)logs=logs.filter(L=>((L.machineName||"")+" "+(L.taskName||"")+" "+(L.by||"")).toLowerCase().includes(q));
  if(!logs.length){el.innerHTML='<div class="logempty">'+(DATA.logs&&DATA.logs.length?'ไม่พบรายการที่ค้นหา':'ยังไม่มีรายการบันทึก — กรอกความคืบหน้าที่เครื่องจักรแล้วกด “บันทึก”')+'</div>';return;}
  el.innerHTML=`<div class="logrow lhead"><div class="lg-date">วันที่</div><div class="lg-main">เครื่องจักร / งาน · ผู้บันทึก</div><div class="lg-num">คน</div><div class="lg-num">%</div><div class="lg-st">สถานะ</div></div>`+
    logs.map(L=>{const pend=L.status==='pending';const dt=fmtTaskDate(L);
    return `<div class="logrow ${pend?'pend':'appr'}" data-id="${L.id}">
      <div class="lg-date">${escapeHtml(L.date||"—")}</div>
      <div class="lg-main"><div class="lg-task">${escapeHtml(L.machineName||"")} — ${escapeHtml(L.taskName||"")}</div>
        <div class="lg-meta">👤 ${escapeHtml(L.by||"—")}${L.note?" · 📝 "+escapeHtml(L.note):""}${L.reviewBy?" · ✔ ตรวจโดย "+escapeHtml(L.reviewBy):""}</div></div>
      <div class="lg-num">${L.labor??"—"}</div><div class="lg-num"><b>${(+L.prog||0)}%</b></div>
      <div class="lg-st">${pend?`<button class="lg-btn pend" data-review="${L.id}">⏳ รอตรวจสอบ</button>`:`<span class="lg-btn appr">✓ ตรวจแล้ว</span>`}</div>
    </div>`;}).join("");
  el.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>askPin(b.dataset.review)));
}
function fmtTaskDate(L){return L.date||"—";}
/* ===== PIN 4 หลัก ===== */
const REVIEW_PIN="5555";let pinTarget=null;
function askPin(id){pinTarget=id;const bx=$("pinBox");if(bx)bx.value="";const er=$("pinErr");if(er)er.textContent="";$("pinScrim").classList.add("on");$("pinModal").classList.add("on");setTimeout(()=>bx&&bx.focus(),60);}
function closePin(){$("pinScrim").classList.remove("on");$("pinModal").classList.remove("on");pinTarget=null;}
function submitPin(){const v=($("pinBox").value||"").trim();if(v===REVIEW_PIN){const id=pinTarget;closePin();openReview(id);}else{$("pinErr").textContent="PIN ไม่ถูกต้อง ลองใหม่";$("pinBox").value="";$("pinBox").focus();}}
/* ===== Review / อนุมัติ ===== */
let reviewId=null;
function openReview(id){const L=(DATA.logs||[]).find(x=>x.id===id);if(!L)return;reviewId=id;
  $("rvTitle").textContent=(L.machineName||"")+" — "+(L.taskName||"");
  $("rvInfo").innerHTML=`👤 ผู้บันทึก <b>${escapeHtml(L.by||"—")}</b> · 📅 ${escapeHtml(L.date||"—")}`;
  const rp=$("rvProg");rp.value=+L.prog||0;$("rvProgV").textContent=(+L.prog||0)+"%";
  $("rvLabor").value=L.labor??"";$("rvNote").value=L.note||"";
  $("rvScrim").classList.add("on");$("rvModal").classList.add("on");}
function closeReview(){$("rvScrim").classList.remove("on");$("rvModal").classList.remove("on");reviewId=null;}
function approveReview(){const L=(DATA.logs||[]).find(x=>x.id===reviewId);if(!L)return;
  const prog=Math.max(0,Math.min(100,Math.round(+$("rvProg").value||0)));const lv=$("rvLabor").value;const labor=lv===""?null:Math.max(0,+lv);const note=$("rvNote").value;
  const m=machineById(L.mid);if(m&&m.tasks[L.ti]){const t=m.tasks[L.ti];t.prog=prog;t.labor=labor;t.note=note;}
  L.prog=prog;L.labor=labor;L.note=note;L.status="approved";L.reviewTs=Date.now();L.reviewBy="ผู้ตรวจ";
  scheduleSave();closeReview();renderLog();renderDiagram();
  setTimeout(()=>notify("ตรวจสอบสำเร็จ","อัปเดตความคืบหน้าบนหมุด/Dashboard เรียบร้อย"),120);}
function wireReview(){
  const bind=(id,fn)=>{const e=$(id);if(e)e.addEventListener("click",fn);};
  bind("pinOk",submitPin);bind("pinCancel",closePin);const pb=$("pinScrim");if(pb)pb.addEventListener("click",closePin);
  const bx=$("pinBox");if(bx)bx.addEventListener("keydown",e=>{if(e.key==="Enter")submitPin();});
  bind("rvClose",closeReview);bind("rvCancel",closeReview);const rs=$("rvScrim");if(rs)rs.addEventListener("click",closeReview);
  bind("rvApprove",approveReview);
  const rp=$("rvProg");if(rp)rp.addEventListener("input",()=>$("rvProgV").textContent=(Math.round(+rp.value||0))+"%");
  bind("rvPminus",()=>{rp.value=Math.max(0,(+rp.value||0)-1);rp.dispatchEvent(new Event('input'));});
  bind("rvPplus",()=>{rp.value=Math.min(100,(+rp.value||0)+1);rp.dispatchEvent(new Event('input'));});
  const rl=$("rvLabor");bind("rvLminus",()=>{rl.value=Math.max(0,(+rl.value||0)-1);});bind("rvLplus",()=>{rl.value=(+rl.value||0)+1;});
  const lf=$("logFilter");if(lf)lf.addEventListener("change",renderLog);const lsr=$("logSearch");if(lsr)lsr.addEventListener("input",renderLog);
}
wireReview();

function render(){renderRace();renderDiagram();renderLog();}
function onThemeChange(){renderDiagram();}
function onSyncConnected(){renderDiagram();renderLog();}
boot();

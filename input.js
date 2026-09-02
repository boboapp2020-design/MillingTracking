"use strict";
/* ============ หน้ากรอกข้อมูล (index.html) — ไดอะแกรม + ฟอร์ม ============ */
let editPins=false;
function renderDiagram(){
  const html=Object.keys(DATA.pins).map(id=>{const m=machineById(id);if(!m)return"";const a=machineActual(m);const st=machineStatus(m);const col=STCOL[st];const pos=DATA.pins[id];
    const num=/^m[1-5]$/.test(id)?id.replace("m",""):(id==="mr"?"R":"·");
    const label=m.name.replace("ลูกหีบ ชุดที่","ลูกหีบ").replace("ตะแกรง ","");
    return `<div class="pin ${st==='prog'?'prog':''}" data-mid="${id}" style="left:${pos.x}%;top:${pos.y}%;--pc:${col}">
      <div class="dot" style="--p:${a.localPct.toFixed(0)}"><i>${num}</i></div>
      <div class="plabel">${label} ${st==='done'?'<b class="succ">✓ Success 100%</b>':`<small>${a.localPct.toFixed(0)}%</small>`}</div></div>`;}).join("");
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
$("btnEditPins").addEventListener("click",()=>{editPins=!editPins;$("btnEditPins").classList.toggle("pri",editPins);$("btnEditPins").innerHTML=editPins?"✔ เสร็จ":"🎯 จัดตำแหน่งหมุด";$("editNote").style.display=editPins?"block":"none";renderDiagram();});
$("resetPins").addEventListener("click",e=>{e.preventDefault();if(!confirm("รีเซ็ตตำแหน่งหมุดทั้งหมดกลับเป็นค่ามาตรฐาน?"))return;DATA.pins=JSON.parse(JSON.stringify(DEFAULT_PINS));renderDiagram();scheduleSave();});

/* drawer / form */
let curMid=null;
function openDrawer(mid){if(editPins)return;curMid=mid;const m=machineById(mid);if(!m)return;const g=groupOf(m);
  $("dTitle").innerHTML=escapeHtml(m.name)+(machineStatus(m)==='done'?' <span class="succ-badge">✓ Success 100%</span>':'');$("dSub").textContent=g.name+" · "+m.tasks.length+" งาน";
  const ow=$("dOwner");ow.value=m.owner||"";ow.oninput=()=>{m.owner=ow.value;scheduleSave();};
  renderTasks();$("scrim").classList.add("on");$("drawer").classList.add("on");$("drawer").setAttribute("aria-hidden","false");}
function closeDrawer(){$("scrim").classList.remove("on");$("drawer").classList.remove("on");$("drawer").setAttribute("aria-hidden","true");curMid=null;renderDiagram();}
function wtCell(t,m,total){if(manhour(t)===0)return '<span style="color:var(--amber)">—</span><br><span style="opacity:.55;font-size:10px">ยังไม่ระบุ</span>';
  return `<b>${taskWeightInJob(t,m).toFixed(1)}%</b><br><span style="opacity:.6;font-size:10px">รวม ${taskWeight(t,total).toFixed(2)}% · ${manhour(t)}h</span>`;}
function miniHTML(m){const a=machineActual(m),mh=machineMandays(m);
  return `<div class="m"><div class="l">ความคืบหน้าเครื่องนี้</div><div class="v" style="color:${STCOL[machineStatus(m)]}">${a.localPct.toFixed(1)}%</div></div><div class="m"><div class="l">น้ำหนัก (ทั้งโปรเจกต์)</div><div class="v">${isExcluded(m)?'แยก':a.weight.toFixed(2)+'%'}</div></div><div class="m"><div class="l">งานรวม</div><div class="v">${mh.toFixed(0)} <span style="font-size:11px;color:var(--ink2)">man-hr</span></div></div>`;}
function renderTasks(){const m=machineById(curMid);const total=totalMandays();
  $("dMini").innerHTML=miniHTML(m);
  $("taskBody").innerHTML=m.tasks.map((t,i)=>{const st=t.prog>=100?"done":(t.prog>0?"prog":"todo");
    return `<tr data-i="${i}"><td class="tn"><input value="${escapeHtml(t.name)}" data-f="name">${t.note?`<div class="note-flag">⚑ ${escapeHtml(t.note)}</div>`:""}</td>
      <td><input class="num" type="number" min="0" step="1" value="${t.days??""}" data-f="days"></td>
      <td><input class="num" type="number" min="0" step="1" value="${t.labor??""}" data-f="labor"></td>
      <td><input type="date" value="${isoOf(t.start)}" data-f="start"></td><td><input type="date" value="${isoOf(t.finish)}" data-f="finish"></td>
      <td><div class="prog"><input type="range" min="0" max="100" step="5" value="${t.prog||0}" data-f="prog"><span class="pv" style="color:${STCOL[st]}">${t.prog||0}%</span></div></td>
      <td class="wt-cell">${wtCell(t,m,total)}</td>
      <td><button class="rm" data-rm="${i}" title="ลบงาน">🗑</button></td></tr>`;}).join("");
  $("taskBody").querySelectorAll("tr").forEach(tr=>{const i=+tr.dataset.i;
    tr.querySelectorAll("[data-f]").forEach(inp=>{const f=inp.dataset.f;inp.addEventListener("input",()=>{const t=machineById(curMid).tasks[i];
      if(f==="name")t.name=inp.value;else if(f==="days"||f==="labor")t[f]=inp.value===""?null:Math.max(0,+inp.value);
      else if(f==="start"||f==="finish")t[f]=serialOfIso(inp.value);
      else if(f==="prog"){t.prog=+inp.value;const pv=tr.querySelector(".pv");pv.textContent=inp.value+"%";pv.style.color=(+inp.value>=100?"var(--green)":(+inp.value>0?"var(--amber)":"var(--grey)"));}
      if(f==="prog"){refreshMini();}else{refreshWeights();}
      scheduleSave();});});
    tr.querySelector("[data-rm]").addEventListener("click",()=>{machineById(curMid).tasks.splice(i,1);renderTasks();scheduleSave();});});}
function refreshWeights(){const m=machineById(curMid);if(!m)return;const total=totalMandays();
  $("taskBody").querySelectorAll("tr").forEach(tr=>{const i=+tr.dataset.i;const t=m.tasks[i];if(t)tr.querySelector(".wt-cell").innerHTML=wtCell(t,m,total);});refreshMini();}
function refreshMini(){const m=machineById(curMid);if(!m)return;$("dMini").innerHTML=miniHTML(m);
  $("dTitle").innerHTML=escapeHtml(m.name)+(machineStatus(m)==='done'?' <span class="succ-badge">✓ Success 100%</span>':'');}
$("addTask").addEventListener("click",()=>{const m=machineById(curMid);m.tasks.push({id:m.id+"-n"+Date.now(),name:"งานใหม่",days:1,labor:1,start:TODAY_SERIAL,finish:TODAY_SERIAL,note:"",prog:0});renderTasks();scheduleSave();});
$("dClose").addEventListener("click",closeDrawer);$("scrim").addEventListener("click",closeDrawer);$("dDone").addEventListener("click",closeDrawer);
$("dReset").addEventListener("click",()=>{if(!confirm("คืนค่าเครื่องนี้กลับเป็นข้อมูลตั้งต้นจาก Excel?"))return;const fresh=freshFromSeed();const fm=fresh.groups.flatMap(g=>g.machines).find(x=>x.id===curMid);const m=machineById(curMid);if(fm){m.tasks=fm.tasks;renderTasks();scheduleSave();}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("drawer").classList.contains("on"))closeDrawer();});

function render(){renderDiagram();}
function onThemeChange(){renderDiagram();}
function onSyncConnected(){renderDiagram();}
boot();

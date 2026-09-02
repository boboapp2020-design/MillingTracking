"use strict";
/* ============ หน้า Dashboard (dashboard.html) — Executive + Engineering drill-down ============ */
let SNAPS=null;

function fmtG(s){if(s==null)return"—";const d=sd(s);return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();}

function renderPeriodBar(){const rng=projectRange();const asof=new Date().toLocaleString("th-TH",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  $("periodBar").innerHTML=`<span class="chip">ช่วงแผนงาน <b>${fmtTH(46276)} – ${fmtTH(46321)}</b></span><span class="chip">ขอบเขตงานจริง <b>${fmtTH(rng.min)} – ${fmtTH(rng.max)}</b></span><span class="chip">ข้อมูล ณ <b>${asof} น.</b></span><span class="grow"></span><span class="chip">น้ำหนัก man-hour (คน×ชม.จริง 8/9) · 10 Jobs = 100%</span>`;}

function renderKPI(){const act=actualPct(),plan=planPctUpTo(TODAY_SERIAL),diff=act-plan;const rng=projectRange();const daysLeft=rng.max-TODAY_SERIAL;const total=totalMandays();const spi=plan>0?act/plan:1;
  let done=0,prog=0,todo=0;jobs().forEach(m=>{const s=machineStatus(m);if(s==="done")done++;else if(s==="prog")prog++;else todo++;});
  const diffTag=diff>=0?`<span class="tag up">▲ +${diff.toFixed(1)}%</span>`:`<span class="tag down">▼ ${diff.toFixed(1)}%</span>`;
  $("kpis").innerHTML=`
   <div class="card kpi g"><div class="ringwrap"><div class="ring" style="--p:${act.toFixed(1)}"><span>${act.toFixed(0)}%</span></div></div>
     <div class="body"><div class="lab">ความคืบหน้าจริง (สะสม)</div><div class="val">${act.toFixed(1)}<small>%</small></div><div class="meta">งานรวม ${Math.round(total).toLocaleString()} man-hour</div></div></div>
   <div class="card kpi b"><div class="ic">🎯</div><div class="body"><div class="lab">ตามแผน ณ วันนี้</div><div class="val">${plan.toFixed(1)}<small>%</small></div><div class="meta">${fmtTH(TODAY_SERIAL)} (วันนี้)</div></div></div>
   <div class="card kpi ${diff>=0?'g':'o'}"><div class="ic">${diff>=0?'🚀':'🐢'}</div><div class="body"><div class="lab">ผลต่างจากแผน · SPI ${spi.toFixed(2)}</div><div class="val" style="font-size:26px">${diffTag}</div><div class="meta">${diff>=0?'เร็วกว่าแผน':'ช้ากว่าแผน'}</div></div></div>
   <div class="card kpi a"><div class="ic">🛠️</div><div class="body"><div class="lab">สถานะ 10 Jobs</div><div class="val" style="font-size:20px"><span style="color:var(--green)">${done}</span> <small>เสร็จ</small> · <span style="color:var(--amber)">${prog}</span> <small>ทำ</small> · <span style="color:var(--grey)">${todo}</span> <small>รอ</small></div><div class="meta">เสร็จ ${fmtTH(rng.max)} · เหลือ ${daysLeft} วัน</div></div></div>`;}

function renderJobsTable(){const total=totalMandays();
  const rows=jobs().map(m=>{const a=machineActual(m);return {m,name:m.name,weight:a.weight,plan:machinePlanPct(m),act:a.localPct,mh:a.rawMH,st:machineStatus(m),owner:m.owner};});
  rows.sort((x,y)=>y.weight-x.weight);
  const body=rows.map(r=>{const lag=r.plan-r.act;const sev=lag>15?"var(--red)":(lag>6?"var(--amber)":(r.act>=r.plan?"var(--green)":"var(--ink2)"));const stTxt={done:"เสร็จ",prog:"กำลังทำ",todo:"ยังไม่เริ่ม"}[r.st];
    return `<tr data-mid="${r.m.id}">
      <td class="jn"><span class="dotm" style="background:${STCOL[r.st]}"></span>${r.name}${r.owner?`<div class="jo">👤 ${escapeHtml(r.owner)}</div>`:""}</td>
      <td class="rt"><b>${r.weight.toFixed(2)}%</b><div class="jsub">${Math.round(r.mh)} mh</div></td>
      <td class="jbar"><div class="bar"><i style="width:${r.act.toFixed(1)}%;background:${STCOL[r.st]}"></i><o style="left:${Math.min(r.plan,100).toFixed(1)}%"></o></div></td>
      <td class="rt">${r.plan.toFixed(0)}%</td>
      <td class="rt"><b style="color:${STCOL[r.st]}">${r.act.toFixed(0)}%</b></td>
      <td class="rt" style="color:${sev};font-weight:700">${lag>0.5?"−"+lag.toFixed(0):(lag<-0.5?"+"+(-lag).toFixed(0):"0")}%</td>
      <td><span class="chipst" style="color:${STCOL[r.st]};background:color-mix(in srgb,${STCOL[r.st]} 14%,transparent)">${stTxt}</span></td>
      <td class="rt"><button class="drill" data-mid="${r.m.id}">รายละเอียด ›</button></td></tr>`;}).join("");
  $("jobsTable").innerHTML=`<table class="jtbl"><thead><tr>
      <th>Job / เครื่องจักร</th><th class="rt">น้ำหนัก</th><th style="width:150px">ความคืบหน้า (ขีด=แผน)</th><th class="rt">แผน</th><th class="rt">จริง</th><th class="rt">ต่าง</th><th>สถานะ</th><th></th>
    </tr></thead><tbody>${body}</tbody></table>`;
  $("jobsTable").querySelectorAll("tr[data-mid]").forEach(tr=>tr.addEventListener("click",()=>openDetail(tr.dataset.mid)));}

function renderGroups(){const total=totalMandays();
  $("groups").innerHTML=DATA.groups.map(g=>{let gw=0,gact=0;g.machines.forEach(m=>{const a=machineActual(m);gw+=a.weight;gact+=a.actual;});const gp=gw>0?gact/gw*100:0;
    const rows=g.machines.map(m=>{const a=machineActual(m);const planM=machinePlanPct(m);const st=machineStatus(m);
      return `<div class="mrow" data-mid="${m.id}"><div class="mname"><span class="dotm" style="background:${STCOL[st]}"></span>${m.name}</div>
        <div class="bar"><i style="width:${a.localPct.toFixed(1)}%;background:${STCOL[st]}"></i><o style="left:${Math.min(planM,100).toFixed(1)}%"></o></div>
        <div class="pct" style="color:${STCOL[st]}">${a.localPct.toFixed(0)}%</div><div class="cnt">${isExcluded(m)?'แยก':a.weight.toFixed(1)+'%'}</div></div>`;}).join("");
    return `<div class="card grp ${g.id}"><div class="ghead"><div class="gic">${g.id==='mill'?'⚙️':'🎋'}</div><h3>${g.name}</h3><span class="gw">น้ำหนัก ${gw.toFixed(1)}% · คืบหน้า <b>${gp.toFixed(1)}%</b></span></div>
      <div class="gbar"><i style="width:${gp.toFixed(1)}%"></i></div>${rows}
      <div class="hint" style="padding:6px 8px 0">ขวา = น้ำหนัก % ของทั้งโปรเจกต์ · ขีดบนแถบ = ตำแหน่งตามแผนวันนี้</div></div>`;}).join("");
  $("groups").querySelectorAll(".mrow").forEach(r=>r.addEventListener("click",()=>openDetail(r.dataset.mid)));}

function renderAlerts(){const rows=[];jobs().forEach(m=>{const a=machineActual(m);const plan=machinePlanPct(m);rows.push({m,g:groupOf(m),lag:plan-a.localPct,act:a.localPct,plan,noSched:m.tasks.filter(t=>t.start==null||t.finish==null).length,noWt:m.tasks.filter(t=>manday(t)===0).length});});
  const behind=rows.filter(r=>r.lag>1).sort((x,y)=>y.lag-x.lag);let html="";
  if(behind.length){html+=behind.map(r=>{const sev=r.lag>=15?"var(--red)":(r.lag>=6?"var(--amber)":"var(--grey)");
    return `<div class="alert" data-mid="${r.m.id}"><div class="sev" style="background:${sev}"></div><div class="an"><div class="t">${r.m.name}</div><div class="s">${r.g.name} · แผน ${r.plan.toFixed(0)}% / จริง ${r.act.toFixed(0)}%${r.m.owner?` · ${escapeHtml(r.m.owner)}`:""}</div></div><div class="lag" style="color:${sev}">ช้า ${r.lag.toFixed(0)}%</div></div>`;}).join("");
  }else html+=`<div class="alert-ok">✓ ไม่มีเครื่องจักรที่ช้ากว่าแผน</div>`;
  const tNoS=rows.reduce((s,r)=>s+r.noSched,0),tNoW=rows.reduce((s,r)=>s+r.noWt,0);
  if(tNoS||tNoW)html+=`<div style="font-size:11px;color:var(--ink2);margin-top:8px;border-top:1px dashed var(--line);padding-top:9px">ต้องเติมข้อมูล: ${tNoW?`<b style="color:var(--amber)">${tNoW}</b> งานยังไม่ระบุ คน/วัน `:""}${tNoS?`· <b style="color:var(--amber)">${tNoS}</b> งานยังไม่ระบุวันที่`:""}</div>`;
  $("alerts").innerHTML=html;$("alerts").querySelectorAll(".alert[data-mid]").forEach(el=>el.addEventListener("click",()=>openDetail(el.dataset.mid)));}

function drawCurve(){const cv=$("scurve");if(!cv)return;const dpr=window.devicePixelRatio||1;const W=cv.clientWidth||900,H=270;cv.width=W*dpr;cv.height=H*dpr;const c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  const rng=projectRange();const s0=rng.min,s1=rng.max;const span=Math.max(1,s1-s0);const padL=38,padR=14,padT=14,padB=26;const pw=W-padL-padR,ph=H-padT-padB;
  const css=getComputedStyle(document.documentElement);const cInk2=css.getPropertyValue("--ink2"),cLine=css.getPropertyValue("--line"),cBrand=css.getPropertyValue("--brand"),cGreen=css.getPropertyValue("--green");
  const X=s=>padL+(s-s0)/span*pw,Y=v=>padT+(1-v/100)*ph;
  c.strokeStyle=cLine;c.lineWidth=1;c.fillStyle=cInk2;c.font="10px Sarabun,sans-serif";
  for(let v=0;v<=100;v+=25){const y=Y(v);c.beginPath();c.moveTo(padL,y);c.lineTo(W-padR,y);c.stroke();c.fillText(v+"%",6,y+3);}
  for(let s=s0;s<=s1;s++){const d=sd(s);if(d.getDate()===1||s===s0){const x=X(s);c.strokeStyle=cLine;c.beginPath();c.moveTo(x,padT);c.lineTo(x,padT+ph);c.stroke();c.fillText((d.getMonth()+1)+"/"+(d.getFullYear()+543).toString().slice(2),x+2,padT+ph+16);}}
  c.beginPath();c.moveTo(X(s0),Y(0));for(let s=s0;s<=s1;s++)c.lineTo(X(s),Y(planPctUpTo(s)));c.lineTo(X(s1),Y(0));c.closePath();c.save();c.globalAlpha=.16;c.fillStyle=cBrand;c.fill();c.restore();
  c.lineWidth=2.4;c.strokeStyle=cBrand;c.beginPath();let f=true;for(let s=s0;s<=s1;s++){const x=X(s),y=Y(planPctUpTo(s));f?(c.moveTo(x,y),f=false):c.lineTo(x,y);}c.stroke();
  const actNow=actualPct();
  // actual line from snapshots if available, else single ramp to today
  c.lineWidth=2.8;c.strokeStyle=cGreen;c.beginPath();
  const pts=[];if(SNAPS&&SNAPS.length){SNAPS.forEach(sp=>{if(sp.serial!=null&&sp.overall!=null)pts.push([sp.serial,sp.overall]);});pts.sort((a,b)=>a[0]-b[0]);}
  if(pts.length){c.moveTo(X(s0),Y(0));pts.forEach(p=>c.lineTo(X(Math.max(s0,Math.min(s1,p[0]))),Y(p[1])));c.stroke();
    c.fillStyle=cGreen;pts.forEach(p=>{c.beginPath();c.arc(X(Math.max(s0,Math.min(s1,p[0]))),Y(p[1]),3.5,0,7);c.fill();});}
  else{c.moveTo(X(s0),Y(0));c.lineTo(X(Math.min(TODAY_SERIAL,s1)),Y(actNow));c.stroke();c.fillStyle=cGreen;c.beginPath();c.arc(X(Math.min(TODAY_SERIAL,s1)),Y(actNow),4.5,0,7);c.fill();}
  if(TODAY_SERIAL>=s0&&TODAY_SERIAL<=s1){const x=X(TODAY_SERIAL);c.setLineDash([4,4]);c.strokeStyle=cInk2;c.lineWidth=1.4;c.beginPath();c.moveTo(x,padT);c.lineTo(x,padT+ph);c.stroke();c.setLineDash([]);}
  const ch=$("curveHint");if(ch)ch.textContent="แผน "+planPctUpTo(TODAY_SERIAL).toFixed(1)+"% · จริง "+actNow.toFixed(1)+"%"+(pts.length?` · ${pts.length} snapshot`:"");}

/* ---- drill-down detail (read-only) ---- */
function openDetail(mid){const m=machineById(mid);if(!m)return;const g=groupOf(m);const a=machineActual(m);const total=totalMandays();
  $("dtTitle").innerHTML=escapeHtml(m.name)+(machineStatus(m)==='done'?' <span class="succ-badge">✓ Success 100%</span>':'');
  $("dtSub").textContent=g.name+" · "+m.tasks.length+" งาน"+(m.owner?" · "+m.owner:"");
  $("dtMini").innerHTML=`<div class="m"><div class="l">ความคืบหน้า</div><div class="v" style="color:${STCOL[machineStatus(m)]}">${a.localPct.toFixed(1)}%</div></div><div class="m"><div class="l">ตามแผนวันนี้</div><div class="v">${machinePlanPct(m).toFixed(1)}%</div></div><div class="m"><div class="l">น้ำหนัก (โปรเจกต์)</div><div class="v">${isExcluded(m)?'แยก':a.weight.toFixed(2)+'%'}</div></div><div class="m"><div class="l">งานรวม</div><div class="v">${Math.round(a.rawMH)} <span style="font-size:11px;color:var(--ink2)">man-hr</span></div></div>`;
  $("dtBody").innerHTML=`<table class="dttbl"><thead><tr><th>งาน (Task)</th><th class="rt">คน</th><th class="rt">วัน</th><th class="rt">man-hr</th><th class="rt">%ใน Job</th><th>เริ่ม–เสร็จ</th><th class="rt">%</th></tr></thead><tbody>`+
    m.tasks.map(t=>{const st=t.prog>=100?"done":(t.prog>0?"prog":"todo");const nw=manhour(t)===0;
      return `<tr><td>${escapeHtml(t.name)}${t.note?`<div class="note-flag">⚑ ${escapeHtml(t.note)}</div>`:""}</td><td class="rt">${t.labor??"—"}</td><td class="rt">${t.days??"—"}</td><td class="rt">${nw?"—":manhour(t)}</td><td class="rt">${nw?"—":taskWeightInJob(t,m).toFixed(1)+"%"}</td><td style="font-size:11px;color:var(--ink2);white-space:nowrap">${fmtG(t.start)}${t.finish!=null?" – "+fmtG(t.finish):""}</td><td class="rt"><b style="color:${STCOL[st]}">${t.prog||0}%</b></td></tr>`;}).join("")+
    `</tbody></table>`;
  $("dtScrim").classList.add("on");$("detail").classList.add("on");}
function closeDetail(){$("dtScrim").classList.remove("on");$("detail").classList.remove("on");}

function renderCalendar(){const months=[[2026,8],[2026,9],[2026,10]];const MS=new Set([46276,46321]);const thMon=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];const dh=["จ","อ","พ","พฤ","ศ","ส","อา"];
  $("calMonths").innerHTML=months.map(([yy,mm])=>{const first=new Date(yy,mm,1);const start=(first.getDay()+6)%7;const dim=new Date(yy,mm+1,0).getDate();let cells="";for(let i=0;i<start;i++)cells+=`<div class="cald dim"></div>`;
    for(let d=1;d<=dim;d++){const dt=new Date(yy,mm,d);const ser=dToSerial(dt);const off=isHoliday(dt);const nine=!off&&dt.getDay()>=1&&dt.getDay()<=5&&weekSatOff(dt);const cls=["cald"];if(off)cls.push("off");else if(nine)cls.push("h9");if(MS.has(ser))cls.push("ms");const mk=off?(dt.getDay()===0?"หยุด":"หยุด ส."):(nine?"9 ชม.":"");cells+=`<div class="${cls.join(" ")}"><div class="dn">${d}</div><div class="mk">${mk}</div></div>`;}
    return `<div><div style="font-weight:700;margin-bottom:6px">${thMon[mm]} ${yy+543}</div><div class="calhead">${dh.map(x=>`<div>${x}</div>`).join("")}</div><div class="calgrid">${cells}</div></div>`;}).join("");}

function render(){renderPeriodBar();renderKPI();renderJobsTable();renderAlerts();renderGroups();drawCurve();}
function onThemeChange(){drawCurve();renderKPI();renderJobsTable();renderGroups();renderAlerts();}
async function onSyncConnected(){SNAPS=await loadSnaps();drawCurve();}
async function loadSnaps(){const raw=await fetchSnapshots();if(!raw)return null;return raw.map(s=>({serial:serialOfDMY(s.date),overall:s.overall,plan:s.plan}));}
function serialOfDMY(str){if(!str)return null;const s=String(str);const p=s.split("/");if(p.length>=3&&p[2].length<=4)return dToSerial(new Date(+p[2],+p[1]-1,+p[0]));const d=new Date(s);return isNaN(d)?null:dToSerial(new Date(d.getFullYear(),d.getMonth(),d.getDate()));}

$("btnCal").addEventListener("click",()=>{const c=$("calCard");const show=c.style.display==="none";c.style.display=show?"block":"none";if(show){renderCalendar();c.scrollIntoView({behavior:"smooth"});}});
$("dtClose").addEventListener("click",closeDetail);$("dtScrim").addEventListener("click",closeDetail);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("detail").classList.contains("on"))closeDetail();});
window.addEventListener("resize",()=>{clearTimeout(window._rz);window._rz=setTimeout(drawCurve,150);});
boot();
loadSnaps().then(s=>{SNAPS=s;drawCurve();});

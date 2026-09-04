"use strict";
/* ============ หน้า Dashboard (dashboard.html) — Executive + Engineering drill-down ============ */
let SNAPS=null;

function fmtG(s){if(s==null)return"—";const d=sd(s);return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();}

function renderPeriodBar(){const asof=new Date().toLocaleString("th-TH",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  let mn=null,mx=null;DATA.groups.forEach(g=>g.machines.forEach(m=>{if(isExcluded(m))return;m.tasks.forEach(t=>{if(t.start!=null)mn=mn==null?t.start:Math.min(mn,t.start);if(t.finish!=null)mx=mx==null?t.finish:Math.max(mx,t.finish);});})); // ไม่รวม drump+ตะกาว
  if(mn==null)mn=46266;if(mx==null)mx=46330;
  $("periodBar").innerHTML=`<span class="chip">ช่วงแผนงาน <b>${fmtTH(mn)} – ${fmtTH(mx)}</b></span><span class="chip">ข้อมูล ณ <b>${asof} น.</b></span><span class="grow"></span><span class="chip">น้ำหนัก man-hour (คน × วัน × 8 ชม.) · 10 Jobs = 100%</span>`;}

function renderKPI(){const act=actualPct(),plan=planPctUpTo(TODAY_SERIAL),diff=act-plan;const rng=projectRange();const spi=plan>0?act/plan:1;
  // ค่าวันนี้ = เทียบกับ snapshot ล่าสุดก่อนวันนี้ (ถ้ามี) มิฉะนั้นเทียบจากต้นโครงการ
  let baseAct=0,basePlan=0;
  if(SNAPS&&SNAPS.length){const prev=SNAPS.filter(s=>s.serial!=null&&s.serial<TODAY_SERIAL).sort((a,b)=>b.serial-a.serial)[0];
    if(prev){baseAct=+prev.overall||0;basePlan=planPctUpTo(prev.serial);}}
  const actToday=Math.max(0,act-baseAct),planToday=Math.max(0,plan-basePlan),diffToday=actToday-planToday;
  const nJobs=jobs().length;let done=0,prog=0,todo=0;jobs().forEach(m=>{const s=machineStatus(m);if(s==="done")done++;else if(s==="prog")prog++;else todo++;});
  const tag=d=>d>=-0.05?`<span class="tag up">▲ +${Math.abs(d).toFixed(1)}%</span>`:`<span class="tag down">▼ ${d.toFixed(1)}%</span>`;
  $("kpis").innerHTML=`
   <div class="card kpi ${diffToday>=-0.05?'g':'o'}"><div class="ic">📆</div><div class="body"><div class="lab">เกิดจริงวันนี้ · เทียบเป้าวันนี้</div><div class="val">${actToday.toFixed(1)}<small>%</small></div><div class="meta">เป้าวันนี้ <b style="font-size:19px;color:var(--brand2)">${planToday.toFixed(1)}%</b> · ${tag(diffToday)}</div></div></div>
   <div class="card kpi ${diff>=-0.05?'g':'o'}"><div class="ringwrap"><div class="ring" style="--p:${act.toFixed(1)}"><span>${act.toFixed(0)}%</span></div></div><div class="body"><div class="lab">เกิดจริงสะสม · เทียบเป้าสะสม</div><div class="val">${act.toFixed(1)}<small>%</small></div><div class="meta">เป้าสะสม <b style="font-size:19px;color:var(--brand2)">${plan.toFixed(1)}%</b> · ${tag(diff)}</div></div></div>
   <div class="card kpi ${spi>=1?'g':'o'}"><div class="ic">${spi>=1?'🚀':'🐢'}</div><div class="body"><div class="lab">ดัชนีตามแผน (SPI)</div><div class="val">${spi.toFixed(2)}</div><div class="meta">${spi>=1?'เร็ว / ตามแผน':'ช้ากว่าแผน'}</div></div></div>
   <div class="card kpi b"><div class="ic">🛠️</div><div class="body"><div class="lab">จำนวนงานทั้งหมด</div><div class="val">${nJobs} <small>งาน</small></div><div class="meta"><span style="color:var(--green)">${done} เสร็จ</span> · <span style="color:var(--amber)">${prog} ทำ</span> · <span style="color:var(--grey)">${todo} รอ</span></div></div></div>`;}

function renderJobsTable(){const total=totalMandays();
  const rows=jobs().map(m=>{const a=machineActual(m);return {m,name:m.name,weight:a.weight,plan:machinePlanPct(m),act:a.localPct,mh:a.rawMH,used:machineConsumedMH(m),st:machineStatus(m),owner:m.owner};});
  rows.sort((x,y)=>y.weight-x.weight);
  const body=rows.map(r=>{const lag=r.plan-r.act;const sev=lag>15?"var(--red)":(lag>6?"var(--amber)":(r.act>=r.plan?"var(--green)":"var(--ink2)"));const stTxt={done:"เสร็จ",prog:"กำลังทำ",todo:"ยังไม่เริ่ม"}[r.st];
    return `<tr data-mid="${r.m.id}">
      <td class="jn"><span class="dotm" style="background:${STCOL[r.st]}"></span>${r.name}${r.owner?`<div class="jo">👤 ${escapeHtml(r.owner)}</div>`:""}</td>
      <td class="rt">${r.plan.toFixed(0)}%</td>
      <td class="rt"><b style="color:${STCOL[r.st]}">${r.act.toFixed(0)}%</b></td>
      <td class="rt" style="color:${sev};font-weight:700">${lag>0.5?"−"+lag.toFixed(0):(lag<-0.5?"+"+(-lag).toFixed(0):"0")}%</td>
      <td><span class="chipst" style="color:${STCOL[r.st]};background:color-mix(in srgb,${STCOL[r.st]} 14%,transparent)">${stTxt}</span></td>
      <td class="rt"><button class="drill" data-mid="${r.m.id}">รายละเอียด ›</button></td></tr>`;}).join("");
  $("jobsTable").innerHTML=`<table class="jtbl"><thead><tr>
      <th>Job / เครื่องจักร</th><th class="rt">แผน</th><th class="rt">จริง</th><th class="rt">ต่าง</th><th>สถานะ</th><th></th>
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

function actualAtSerial(ser){const s0=projectRange().min;const actNow=actualPct();
  const pts=(SNAPS||[]).filter(s=>s.serial!=null&&s.overall!=null&&s.serial<TODAY_SERIAL).map(s=>[s.serial,s.overall]).sort((a,b)=>a[0]-b[0]);
  pts.push([TODAY_SERIAL,actNow]); // ยึดค่าจริงสด ณ วันนี้เป็นจุดปลาย
  if(ser<=s0)return 0;if(ser<=pts[0][0])return pts[0][1]*(ser-s0)/Math.max(1,pts[0][0]-s0);
  for(let i=1;i<pts.length;i++){if(ser<=pts[i][0]){const a=pts[i-1],b=pts[i];return a[1]+(b[1]-a[1])*(ser-a[0])/Math.max(1,b[0]-a[0]);}}
  return pts[pts.length-1][1];}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function drawCurve(hoverX){const cv=$("scurve");if(!cv)return;const dpr=window.devicePixelRatio||1;const W=cv.clientWidth||900,H=270;cv.width=W*dpr;cv.height=H*dpr;const c=cv.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
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
  const pts=[];if(SNAPS&&SNAPS.length){SNAPS.forEach(sp=>{if(sp.serial!=null&&sp.overall!=null&&sp.serial<TODAY_SERIAL)pts.push([sp.serial,sp.overall]);});pts.sort((a,b)=>a[0]-b[0]);}
  pts.push([Math.min(TODAY_SERIAL,s1),actNow]); // ปลายเส้นจบที่ค่าจริงสด ณ วันนี้เสมอ (ไม่ค้างที่ snapshot เก่า)
  c.moveTo(X(s0),Y(0));pts.forEach(p=>c.lineTo(X(Math.max(s0,Math.min(s1,p[0]))),Y(p[1])));c.stroke();
  c.fillStyle=cGreen;pts.forEach((p,i)=>{c.beginPath();c.arc(X(Math.max(s0,Math.min(s1,p[0]))),Y(p[1]),i===pts.length-1?4.5:3.5,0,7);c.fill();});
  if(TODAY_SERIAL>=s0&&TODAY_SERIAL<=s1){const x=X(TODAY_SERIAL);c.setLineDash([4,4]);c.strokeStyle=cInk2;c.lineWidth=1.4;c.beginPath();c.moveTo(x,padT);c.lineTo(x,padT+ph);c.stroke();c.setLineDash([]);}
  if(hoverX!=null&&hoverX>=padL&&hoverX<=W-padR){const sr=Math.max(s0,Math.min(s1,Math.round(s0+(hoverX-padL)/pw*span)));const x=X(sr);
    const planV=planPctUpTo(sr),actV=actualAtSerial(sr);
    c.setLineDash([3,3]);c.strokeStyle=cInk2;c.lineWidth=1;c.beginPath();c.moveTo(x,padT);c.lineTo(x,padT+ph);c.stroke();c.setLineDash([]);
    c.fillStyle=cBrand;c.beginPath();c.arc(x,Y(planV),4.5,0,7);c.fill();c.fillStyle=cGreen;c.beginPath();c.arc(x,Y(actV),4.5,0,7);c.fill();
    const d=sd(sr);const lines=[d.getDate()+"/"+(d.getMonth()+1)+"/"+(d.getFullYear()+543).toString().slice(2),"แผน "+planV.toFixed(1)+"%","จริง "+actV.toFixed(1)+"%"];
    c.font="600 11px Sarabun,sans-serif";let tw=0;lines.forEach(L=>tw=Math.max(tw,c.measureText(L).width));
    const bw=tw+18,bh=lines.length*16+10;let bx=x+12;if(bx+bw>W-padR)bx=x-bw-12;const by=padT+4;
    c.fillStyle="rgba(18,26,38,.94)";roundRect(c,bx,by,bw,bh,7);c.fill();
    c.textAlign="left";c.fillStyle="#fff";c.fillText(lines[0],bx+9,by+17);c.fillStyle=cBrand;c.fillText(lines[1],bx+9,by+33);c.fillStyle=cGreen;c.fillText(lines[2],bx+9,by+49);c.textAlign="start";}
  const nsnap=(SNAPS||[]).filter(s=>s.serial!=null&&s.overall!=null).length;
  const ch=$("curveHint");if(ch)ch.textContent="แผน "+planPctUpTo(TODAY_SERIAL).toFixed(1)+"% · จริง "+actNow.toFixed(1)+"%"+(nsnap?` · ${nsnap} snapshot`:"");}

/* ---- drill-down detail (read-only) ---- */
function openDetail(mid){const m=machineById(mid);if(!m)return;const g=groupOf(m);const a=machineActual(m);const total=totalMandays();
  $("dtTitle").innerHTML=escapeHtml(m.name)+(machineStatus(m)==='done'?' <span class="succ-badge">✓ Success 100%</span>':'');
  $("dtSub").textContent=g.name+" · "+m.tasks.length+" งาน"+(m.owner?" · "+m.owner:"");
  const _used=machineConsumedMH(m),_tgt=a.rawMH,_rem=_tgt-_used;
  $("dtMini").innerHTML=`<div class="m"><div class="l">Man-hour รวม (เป้า)</div><div class="v">${Math.round(_tgt)} <span style="font-size:11px;color:var(--ink2)">man-hr</span></div></div><div class="m"><div class="l">ใช้ไปแล้ว</div><div class="v" style="color:var(--amber)">${Math.round(_used)}</div></div><div class="m"><div class="l">คงเหลือ</div><div class="v" style="color:${_rem<0?'var(--red)':'var(--green)'}">${Math.round(_rem)}</div></div>`;
  $("dtBody").innerHTML=`<table class="dttbl"><thead><tr><th>งาน (Task)</th><th class="rt">คน</th><th class="rt">วัน</th><th class="rt">man-hr</th><th class="rt">%ใน Job</th><th>เริ่ม–เสร็จ</th><th class="rt">%</th></tr></thead><tbody>`+
    m.tasks.map(t=>{const st=t.prog>=100?"done":(t.prog>0?"prog":"todo");const nw=manhour(t)===0;
      return `<tr><td>${escapeHtml(t.name)}${t.note?`<div class="note-flag">⚑ ${escapeHtml(t.note)}</div>`:""}</td><td class="rt">${t.labor??"—"}</td><td class="rt">${t.days??"—"}</td><td class="rt">${nw?"—":manhour(t)}</td><td class="rt">${nw?"—":taskWeightInJob(t,m).toFixed(1)+"%"}</td><td style="font-size:11px;color:var(--ink2);white-space:nowrap">${fmtG(t.start)}${t.finish!=null?" – "+fmtG(t.finish):""}</td><td class="rt"><b style="color:${STCOL[st]}">${t.prog||0}%</b></td></tr>`;}).join("")+
    `</tbody></table>`;
  $("dtScrim").classList.add("on");$("detail").classList.add("on");}
function closeDetail(){$("dtScrim").classList.remove("on");$("detail").classList.remove("on");}

function renderCalendar(){const months=[[2026,8],[2026,9],[2026,10]];const MS=HOLIDAYS; // แหล่งเดียวกับสูตรคำนวณ (shared.js)
  const holTxt=[...HOLIDAYS].sort((a,b)=>a-b).map(s=>fmtTH(s).slice(0,5)).join(" และ ");const ls=$("legSpecial");if(ls)ls.textContent="หยุดพิเศษ "+holTxt;const fh=$("footHol");if(fh)fh.textContent=holTxt.replace(" และ ",", ");
  const thMon=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];const dh=["จ","อ","พ","พฤ","ศ","ส","อา"];
  const P=n=>String(n).padStart(2,"0");const recByDate={};(DATA.logs||[]).forEach(L=>{if(L.date)recByDate[L.date]=(recByDate[L.date]||0)+1;});
  $("calMonths").innerHTML=months.map(([yy,mm])=>{const first=new Date(yy,mm,1);const start=(first.getDay()+6)%7;const dim=new Date(yy,mm+1,0).getDate();let cells="";for(let i=0;i<start;i++)cells+=`<div class="cald dim"></div>`;
    for(let d=1;d<=dim;d++){const dt=new Date(yy,mm,d);const ser=dToSerial(dt);const off=isHoliday(dt);const special=MS.has(ser);const cls=["cald","clk"];if(off)cls.push("off");if(special)cls.push("ms");const dstr=P(d)+"/"+P(mm+1)+"/"+yy;const rec=recByDate[dstr]||0;if(rec)cls.push("hasrec");const mk=off?(special?"หยุดพิเศษ":"หยุด"):"";cells+=`<div class="${cls.join(" ")}" data-date="${dstr}"><div class="dn">${d}</div><div class="mk">${mk}</div>${rec?`<div class="calrec">${rec}</div>`:""}</div>`;}
    return `<div><div style="font-weight:700;margin-bottom:6px">${thMon[mm]} ${yy+543}</div><div class="calhead">${dh.map(x=>`<div>${x}</div>`).join("")}</div><div class="calgrid">${cells}</div></div>`;}).join("");
  $("calMonths").querySelectorAll("[data-date]").forEach(el=>el.addEventListener("click",()=>openDayView(el.dataset.date)));}
/* คลิกวันในปฏิทิน → ดูงานที่บันทึกวันนั้น */
function openDayView(dstr){const logs=(DATA.logs||[]).filter(L=>L.date===dstr).sort((a,b)=>(b.ts||0)-(a.ts||0));
  $("dvTitle").textContent="งานที่บันทึก · "+dstr;
  $("dvBody").innerHTML=logs.length?logs.map(L=>{const ap=L.status==='approved';return `<div class="dvrow"><div class="dvmain"><div class="dvtask">${escapeHtml(L.machineName||"")} — ${escapeHtml(L.taskName||"")}</div><div class="dvmeta">👤 ${escapeHtml(L.by||"—")} · 👥 ${L.labor??"—"} คน${L.note?" · 📝 "+escapeHtml(L.note):""}</div></div><div class="dvpct"><b style="color:${ap?'var(--green)':'var(--amber)'}">${(+L.prog||0)}%</b></div><div class="dvst"><span class="lg-btn ${ap?'appr':'pend'}" style="cursor:default">${ap?'✓ ตรวจแล้ว':'⏳ รอตรวจสอบ'}</span></div></div>`;}).join(""):'<div class="logempty">ไม่มีงานที่บันทึกในวันนี้</div>';
  $("dvScrim").classList.add("on");$("dvModal").classList.add("on");}
function closeDayView(){$("dvScrim").classList.remove("on");$("dvModal").classList.remove("on");}

function addWork(start,n){let s=start,cnt=0,guard=0;const need=Math.ceil(n);if(need<=0)return start;while(cnt<need&&guard<3000){s++;guard++;if(!isHoliday(sd(s)))cnt++;}return s;}
function renderForecast(){const el=$("forecast");if(!el)return;const rng=projectRange(),s0=rng.min,s1=rng.max;
  const act=actualPct(),plan=planPctUpTo(TODAY_SERIAL),spi=plan>0?act/plan:1;
  const base=Math.min(Math.max(TODAY_SERIAL,s0),s1);const elapsed=workingSerials(s0,base).length;
  const totalWork=Math.max(1,workingSerials(s0,s1).length);
  const remainPlanWork=Math.max(1,workingSerials(base,s1).length);
  const minElapsed=Math.max(5,Math.round(totalWork*0.2)); // ต้องมีข้อมูลพอก่อนจึงคาดวันได้แม่น
  const reqRate=(100-act)/remainPlanWork; // ต้องทำ %/วันทำงาน ที่เหลือ เพื่อทันแผน
  let cls,icon,verdict,sub,projDate;
  if(act>=99.95){cls="ok";icon="🎉";verdict="งานซ่อมเสร็จครบ 100% แล้ว";sub="ปิดงานเรียบร้อยตามเป้าหมาย";projDate=fmtTH(base);}
  else if(act<=0.1||elapsed<=0){cls="wait";icon="⏳";verdict="ยังไม่เริ่มงาน / ยังไม่มีข้อมูล";sub="เริ่มบันทึก % ความคืบหน้าเพื่อคาดการณ์วันเสร็จ";projDate="—";}
  else if(elapsed<minElapsed||act<10){ // ช่วงเริ่มต้น/ข้อมูลน้อย: ประเมินจาก SPI ยังไม่ฟันธงวันเสร็จ
    const onpace=spi>=0.95;cls=onpace?"ok":(spi>=0.8?"warn":"late");icon=onpace?"🟢":(spi>=0.8?"🟡":"🔴");
    verdict=onpace?"เริ่มต้นได้ตามแผน":(spi>=0.8?"เริ่มต้นช้ากว่าแผนเล็กน้อย":"ตอนนี้ช้ากว่าแผน");
    sub=`ผ่านไป ${elapsed}/${totalWork} วันทำงาน · ทำได้ ${act.toFixed(1)}% (แผน ${plan.toFixed(1)}%) · SPI ${spi.toFixed(2)} — ต้องทำเฉลี่ย ${reqRate.toFixed(2)}%/วันจึงจะทันกำหนด`;projDate="—";}
  else{const rate=act/elapsed,remain=100-act,need=remain/rate,projSerial=addWork(base,need);
    const capW=totalWork*2; const capped=(workingSerials(base,projSerial).length>capW);
    projDate=capped?("หลัง "+fmtTH(s1)):fmtTH(projSerial);
    if(projSerial<=s1){cls="ok";icon="🟢";const ahead=Math.max(0,workingSerials(projSerial,s1).length-1);
      verdict="คาดว่าเสร็จทันกำหนด";sub=(ahead>0?`เร็วกว่ากำหนด ~${ahead} วันทำงาน · `:`พอดีกำหนด · `)+`ความเร็วเฉลี่ย ${rate.toFixed(2)}%/วันทำงาน`;}
    else{const lateW=Math.max(1,workingSerials(s1,projSerial).length-1);
      if(lateW<=3){cls="warn";icon="🟡";verdict=`เสี่ยงเลยกำหนด ~${lateW} วันทำงาน — ต้องเร่ง`;}
      else{cls="late";icon="🔴";verdict=capped?"คาดว่าล่าช้ากว่าแผนมาก หากคงอัตราปัจจุบัน":`คาดว่าล่าช้ากว่าแผน ~${lateW} วันทำงาน`;}
      sub=`ต้องเร่งความเร็วเป็น ${reqRate.toFixed(2)}%/วัน (ปัจจุบัน ${rate.toFixed(2)}%/วัน)`;}}
  el.innerHTML=`<div class="fc ${cls}"><div class="fc-ic">${icon}</div>
    <div class="fc-main"><div class="fc-lab">ประเมินกำหนดเสร็จ · Completion Forecast</div><div class="fc-verdict">${verdict}</div><div class="fc-sub">${sub}</div></div>
    <div class="fc-stats">
      <div><span>คาดว่าเสร็จ</span><b class="${cls==='late'?'r':(cls==='warn'?'a':'g')}">${projDate}</b></div>
      <div><span>กำหนดตามแผน</span><b>${fmtTH(s1)}</b></div>
      <div><span>จริง / แผน</span><b>${act.toFixed(1)}% / ${plan.toFixed(1)}%</b></div>
      <div><span>SPI</span><b class="${spi>=1?'g':(spi>=.9?'a':'r')}">${spi.toFixed(2)}</b></div>
    </div></div>`;}
function render(){renderPeriodBar();renderForecast();renderKPI();renderJobsTable();renderAlerts();drawCurve();renderCalendar();}
function onThemeChange(){drawCurve();renderKPI();renderJobsTable();renderAlerts();}
async function onSyncConnected(){SNAPS=await loadSnaps();drawCurve();renderKPI();}
async function loadSnaps(){const raw=await fetchSnapshots();if(!raw)return null;return raw.map(s=>({serial:serialOfDMY(s.date),overall:s.overall,plan:s.plan}));}
function serialOfDMY(str){if(!str)return null;const s=String(str);const p=s.split("/");if(p.length>=3&&p[2].length<=4)return dToSerial(new Date(+p[2],+p[1]-1,+p[0]));const d=new Date(s);return isNaN(d)?null:dToSerial(new Date(d.getFullYear(),d.getMonth(),d.getDate()));}

// ปฏิทินแสดงเป็นค่าเริ่มต้นเสมอ (เอาปุ่มออกแล้ว) — วาดใน render()
$("dtClose").addEventListener("click",closeDetail);$("dtScrim").addEventListener("click",closeDetail);
{const c=$("dvClose");if(c)c.addEventListener("click",closeDayView);const s=$("dvScrim");if(s)s.addEventListener("click",closeDayView);}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("detail").classList.contains("on"))closeDetail();});
window.addEventListener("resize",()=>{clearTimeout(window._rz);window._rz=setTimeout(drawCurve,150);});
(function(){const cv=$("scurve");if(!cv)return;cv.style.cursor="crosshair";
  cv.addEventListener("mousemove",e=>{const r=cv.getBoundingClientRect();drawCurve(e.clientX-r.left);});
  cv.addEventListener("mouseleave",()=>drawCurve());})();
boot();
loadSnaps().then(s=>{SNAPS=s;drawCurve();renderKPI();});

function digestHtml(){
  const d=weeklyDigest();if(!d)return'';
  const arrow=d.dir==='up'?'<span class="arrow-up">&#9650;</span>':d.dir==='down'?'<span class="arrow-down">&#9660;</span>':'';
  return `<div class="panel sec" style="background:var(--accent-soft);border-color:transparent"><h3>Weekly digest</h3><p class="sub" style="color:var(--ink)">${d.text}</p>
  ${d.curScore&&d.prevScore?`<p class="small">Gut score: <b>${d.prevScore.v}</b> &rarr; <b>${d.curScore.v}</b> ${arrow}</p>`:''}
  <div class="row"><button class="btn ghost small" data-act="go" data-v="trends">See full trends</button></div></div>`;
}

/* ---------- Home ---------- */
const CATH={P:12,G:38,V:140,F:335,D:205,N:28,S:265,X:180};
function ringSvg(v){
  const r=62,c=2*Math.PI*r,off=c*(1-(v==null?0:v/100));
  return `<svg width="170" height="170" viewBox="0 0 170 170" role="img" aria-label="Gut score ${v==null?'not yet available':v+' out of 100'}">
  <circle cx="85" cy="85" r="${r}" fill="none" stroke="var(--surface2)" stroke-width="14"/>
  <circle cx="85" cy="85" r="${r}" fill="none" stroke="${v==null?'var(--accent)':TC[tone(v)]}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 85 85)"/>
  <text class="num" x="85" y="92" text-anchor="middle" font-size="46">${v==null?'–':v}</text>
  <text x="85" y="116" text-anchor="middle" font-size="12" fill="var(--muted)">out of 100</text></svg>`;
}
function trendSvg(days){
  const W=340,H=130,pl=28,pr=10,pt=10,pb=24,dx=(W-pl-pr)/(days.length-1);
  const X=i=>pl+i*dx,Yy=v=>pt+(1-v/100)*(H-pt-pb);
  let g='';
  [[100,70,'green'],[70,45,'amber'],[45,0,'red']].forEach(([a,b,c])=>g+=`<rect x="${pl}" y="${Yy(a)}" width="${W-pl-pr}" height="${Yy(b)-Yy(a)}" fill="var(--${c}-dot)" opacity=".13"/>`);
  [0,50,100].forEach(v=>g+=`<text x="${pl-6}" y="${Yy(v)+4}" text-anchor="end" font-size="10" fill="var(--muted)">${v}</text>`);
  let segs=[],cur=[];
  days.forEach((d,i)=>{if(d.s){cur.push([X(i),Yy(d.s.v)])}else if(cur.length){segs.push(cur);cur=[]}});
  if(cur.length)segs.push(cur);
  let m='';
  segs.forEach(s=>{if(s.length>1)m+=`<path d="${s.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')}" fill="none" stroke="var(--ink)" stroke-opacity=".55" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`});
  const last=days.map((d,i)=>d.s?i:-1).filter(i=>i>=0).pop();
  days.forEach((d,i)=>{
    if(d.s)m+=`<circle cx="${X(i)}" cy="${Yy(d.s.v)}" r="${i===last?6:4.5}" fill="${TC[tone(d.s.v)]}" stroke="var(--surface)" stroke-width="2"/>`;
    if(i===last)m+=`<text x="${X(i)}" y="${Yy(d.s.v)-11}" text-anchor="${i>days.length-2?'end':'middle'}" font-size="11" font-weight="600" fill="var(--ink)">${d.s.v}</text>`;
    m+=`<text x="${X(i)}" y="${H-6}" text-anchor="middle" font-size="10" fill="var(--muted)">${d.l}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gut score for the last 7 days">${g}${m}</svg>`;
}
function home(){
  const now=Date.now(),keys=[...Array(7)].map((_,i)=>dkey(now-(6-i)*DAY)),set=new Set(keys);
  const sc=score(keys),tn=sc?tone(sc.v):null;
  const days=keys.map((k,i)=>({s:score([k]),l:new Date(now-(6-i)*DAY).toLocaleDateString([],{weekday:'narrow'})}));
  const tk=dkey(now),tm=S.meals.filter(m=>dkey(m.ts)===tk).sort((a,b)=>a.ts-b.ts),ts=S.sym.filter(x=>dkey(x.ts)===tk);
  const w7s=S.sym.filter(x=>set.has(dkey(x.ts))),w7m=S.meals.filter(m=>m.level&&set.has(dkey(m.ts)));
  const avgSev=w7s.length?(w7s.reduce((a,x)=>a+x.sev,0)/w7s.length):null,lowPct=w7m.length?Math.round(100*w7m.filter(m=>m.level==='g').length/w7m.length):null;
  const nb=S.breath.filter(b=>set.has(dkey(b.ts))).length;
  const trg=triggers();
  return `<section class="sec">
   ${S.demo?`<div class="banner"><span>You're looking at example data so you can see how Gutlight works.</span><button class="btn small ghost" data-act="clearDemo">Clear and start fresh</button></div>`:''}
   ${digestHtml()}
   <div class="panel lift ${tn?'toned tone-'+tn:''}"><div class="gauge">${ringSvg(sc&&sc.v)}
    <div class="sec" style="gap:10px"><header><div><span class="pill ${tn?'tone-'+tn:''}" style="${tn?'':'background:var(--accent-soft);color:var(--accent)'}">${tn?TW[tn]+' gut health':'Gut score'}</span></div><h1 style="margin-top:6px">${sc?band(sc.v):'Start tracking'}</h1><p class="sub">${sc?'Your 7-day score, built from symptoms, stool type and how many meals were low FODMAP.':'Log a meal or how you feel to build your score.'}</p></header>
    ${sc?sc.comps.map(c=>`<div class="comp"><span>${c.k}</span><div class="bar"><i class="${tone(c.v*100)}" style="width:${Math.round(c.v*100)}%"></i></div><span>${Math.round(c.v*100)}</span></div>`).join(''):''}</div></div></div>
   <div class="stats">
    <div class="stat" style="--h:${avgSev==null?235:avgSev>=6?5:avgSev>=3?40:145}"><b>${avgSev==null?'–':avgSev.toFixed(1)}</b><span>Average symptom severity (0–10)</span></div>
    <div class="stat" style="--h:145"><b>${lowPct==null?'–':lowPct+'%'}</b><span>Meals fully low FODMAP</span></div>
    <div class="stat" style="--h:265"><b>${nb}</b><span>Breathing sessions this week</span></div></div>
   <div class="panel"><h3 style="margin-bottom:6px">Gut score, last 7 days</h3>${trendSvg(days)}<p class="small muted">Green is good (70+), amber medium (45–69), red poor (under 45).</p></div>
   <div class="grid2">
    <div class="panel sec"><h3>Today</h3>
     ${tm.length?`<div class="list">${tm.map(m=>`<div class="item"><span class="dot ${m.level||'g'}" style="${m.level?'':'opacity:.25'}"></span><div><div class="nm">${m.type}</div><div class="meta">${esc(m.text)}</div></div><span>${m.level?light(m.level):''}</span></div>`).join('')}</div>`:'<p class="muted">No meals logged yet today.</p>'}
     ${ts.length?`<p class="small">Symptoms today: <b>${ts.map(x=>x.s.length?x.s.join(', '):'none').join(' · ')}</b></p>`:''}
     <div class="row"><button class="btn" data-act="go" data-v="log">Log a meal</button><button class="btn ghost" data-act="go" data-v="symptoms">How do you feel?</button></div></div>
    <div class="panel sec" style="background:var(--accent-soft);border-color:transparent"><h3>Feeling stressed?</h3><p class="sub" style="color:var(--ink)">Stress and the gut are tightly linked. A few minutes of paced breathing can settle both.</p>
     <div class="row"><button class="btn" data-act="go" data-v="breathe">Start breathing</button><button class="btn ghost" data-act="go" data-v="trends">See my trends</button></div>
     ${trg&&trg.groups[0]?`<p class="small"><b>Possible pattern:</b> ${TYPES[trg.groups[0][0]].n} showed up before ${trg.groups[0][1]} of your ${trg.n} flares.</p>`:''}</div>
   </div>
   ${learnHtml()}</section>`;
}

/* ---------- Food check / diary ---------- */
let L={text:'',type:'Breakfast',img:null};

/* ---------- Barcode scanning (real camera + Open Food Facts) ---------- */
const Scan={active:false};
let scanReader=null,scanControls=null;
function stopScan(){
  Scan.active=false;
  try{scanControls&&scanControls.stop()}catch(e){}
  try{scanReader&&scanReader.reset()}catch(e){}
  scanControls=null;
}
function scanHtml(){
  return `<div class="panel sec" style="background:var(--surface2)">
   <h3>Scan a packaged food</h3>
   <div class="scanbox" id="scanbox" hidden>
    <video id="scanVideo" playsinline muted></video>
    <div class="scanline" aria-hidden="true"></div>
    <button class="btn ghost small stopbtn" type="button" data-act="stopScanAct">Stop</button>
   </div>
   <div class="row"><button class="btn ghost small" type="button" data-act="startScan" id="scanStartBtn">Start camera scan</button></div>
   <details class="manual"><summary>Type a barcode instead</summary>
    <form class="row" id="manualBarcodeForm">
     <label class="f" for="manualBarcodeInput" style="flex:1;min-width:160px">Barcode number<input id="manualBarcodeInput" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="e.g. 5000159484695" autocomplete="off"></label>
     <button class="btn ghost" type="submit">Look up</button>
    </form>
   </details>
   <span class="small muted">Looks the product up on Open Food Facts and adds its ingredients below for checking. Your camera video never leaves your device — only the barcode number is sent. Coverage varies, so a “not found” result doesn’t mean a product is safe or unsafe.</span>
  </div>`;
}
async function lookupBarcode(code){
  toast('Looking up '+code+'…');
  try{
    const res=await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_en,brands,ingredients_text,ingredients_text_en`);
    if(!res.ok)throw new Error('bad status');
    const data=await res.json();
    if(data.status!==1||!data.product){toast('No product found for barcode '+code+'. Check the pack directly, or type the ingredients in below.');return;}
    const prod=data.product,name=prod.product_name_en||prod.product_name||'Unnamed product',brand=prod.brands?prod.brands.split(',')[0].trim():'';
    const hasEnglish=!!(prod.ingredients_text_en&&prod.ingredients_text_en.trim());
    const ing=prod.ingredients_text_en||prod.ingredients_text||'';
    if(!ing.trim()){toast(name+' was found, but has no ingredients list on Open Food Facts yet. Check the pack directly.');return;}
    if(!hasEnglish){toast(name+'’s ingredients on Open Food Facts don’t seem to be in English, so they couldn’t be added automatically. Check the pack directly.');return;}
    L.text=(L.text.trim()?L.text.trim()+'. ':'')+ing;
    toast('Found '+name+(brand?' ('+brand+')':'')+' — ingredients added below.');
    render();
  }catch(e){
    toast('Couldn’t reach Open Food Facts. Check your connection and try again.');
  }
}
document.addEventListener('submit',e=>{
  if(e.target&&e.target.id==='manualBarcodeForm'){
    e.preventDefault();
    const inp=$('#manualBarcodeInput'),code=(inp&&inp.value||'').replace(/\D/g,'');
    if(code)lookupBarcode(code);
  }
});

const termOf=f=>f.terms.find(t=>!/[&(]/.test(t))||f.terms[0];
function resultHtml(text){
  if(!text.trim())return `<p class="muted">Type a meal, snack or list of ingredients. Gutlight checks each one against its FODMAP list and shows red, amber or green.</p>`;
  const a=analyze(text);
  if(!a.items.length)return `<p class="muted">No foods recognised yet.${a.unknown.length?' Couldn’t match: '+a.unknown.map(esc).join(', ')+'.':''} Try single ingredients such as “chicken, rice, garlic”.</p>`;
  const reds=a.items.filter(f=>f.l==='r'),ambs=a.items.filter(f=>f.l==='a');
  const vd={g:['Looks low FODMAP','Every ingredient recognised is low FODMAP in normal serves.'],
    a:['Fine in the right portions','Keep to the serve sizes shown for the amber foods: '+ambs.map(f=>f.n).join(', ')+'.'],
    r:['Contains high FODMAP foods','Avoid or swap: '+reds.map(f=>f.n).join(', ')+'.']}[a.level];
  return `<div class="verdict ${a.level}"><span class="dot ${a.level}" style="width:18px;height:18px;margin-top:3px"></span><div><b>${vd[0]}</b><span>${vd[1]}</span></div></div>
  <div class="list">${a.items.map(f=>`<div class="item"><span class="dot ${f.l}"></span><div><div class="nm">${esc(f.n)}</div><div class="meta">${tagsOf(f)}<span>${esc(f.note)}</span></div>${f.l!=='g'&&f.swap?`<div class="meta" style="grid-column:auto;margin-top:4px"><b style="color:var(--ink)">Try instead:</b> ${esc(f.swap)}</div>`:''}${FAM[f.id]?`<div class="meta" style="grid-column:auto;margin-top:6px"><b style="color:var(--ink)">Which kind?</b>${FAM[f.id].map(s=>`<button class="chip" style="padding:2px 10px;font-size:.8rem" data-act="specify" data-v="${esc(termOf(s))}">${esc(s.n)}</button>`).join('')}</div>`:''}</div>${light(f.l)}</div>`).join('')}</div>
  ${a.unknown.length?`<p class="small muted">Not matched: ${a.unknown.map(esc).join(', ')}. Packaged foods can hide onion, garlic, honey or inulin, so check the label or the Monash app.</p>`:''}`;
}
function log(){
  const byDay={};S.meals.slice().sort((a,b)=>b.ts-a.ts).slice(0,40).forEach(m=>(byDay[fmtD(m.ts)]=byDay[fmtD(m.ts)]||[]).push(m));
  return `<section class="sec"><header><h1>Food check</h1><p class="sub">Describe what you ate, add a photo if you like, and Gutlight checks the ingredients. Save it to your diary to feed your gut score.</p></header>
  <div class="panel sec">
   <label class="f" for="mtext">What’s in this meal? Add notes<textarea id="mtext" data-in="mtext" placeholder="e.g. chicken sandwich on sourdough spelt bread with lettuce, mayo and tomato">${esc(L.text)}</textarea></label>
   <div class="row" style="align-items:flex-start">
    <div class="sec" style="gap:8px">${L.img?`<img class="photo-prev" src="${L.img}" alt="Photo of your meal"><div class="row"><button class="btn ghost small" data-act="rmPhoto">Remove photo</button></div>`:''}
     <label class="btn ghost small" for="mphoto" style="cursor:pointer;display:inline-block">${L.img?'Change photo':'Take or upload a photo'}</label>
     <input id="mphoto" type="file" accept="image/*" capture="environment" data-in="mphoto" style="position:absolute;opacity:0;width:1px;height:1px">
     <span class="small muted">Photos aren’t analysed. Your notes above are what gets checked, so list the ingredients.</span></div></div>
   ${scanHtml()}
   <div class="row"><label class="f" for="mtype" style="min-width:150px">Meal<select id="mtype" data-in="mtype">${['Breakfast','Lunch','Dinner','Snack'].map(t=>`<option${L.type===t?' selected':''}>${t}</option>`).join('')}</select></label>
   <button class="btn ghost small" data-act="example" style="align-self:flex-end">Try an example</button></div>
   <div id="mres" class="sec">${resultHtml(L.text)}</div>
   <div class="row"><button class="btn" data-act="saveMeal">Save to food diary</button></div></div>
  <header><h2>Food diary</h2></header>
  ${Object.keys(byDay).length?Object.entries(byDay).map(([d,ms])=>`<div class="sec"><h3 class="muted small" style="text-transform:uppercase;letter-spacing:.06em">${d}</h3><div class="list">${ms.map(m=>`<div class="item"><span class="dot ${m.level||'g'}" style="${m.level?'':'opacity:.25'}"></span><div><div class="nm">${m.type} <span class="muted small" style="font-weight:400">${fmtT(m.ts)}</span></div><div class="meta">${esc(m.text)}</div>${m.img?`<button class="x" style="padding:0;margin-top:6px" data-act="viewImg" data-id="${m.id}" aria-label="View meal photo"><img class="thumb" src="${m.img}" alt="Meal photo"></button>`:''}</div><span class="row" style="flex-wrap:nowrap;gap:2px">${m.level?light(m.level):''}<button class="x" data-act="delMeal" data-id="${m.id}" aria-label="Delete meal">×</button></span></div>`).join('')}</div></div>`).join(''):'<p class="muted">Nothing saved yet.</p>'}
  </section>`;
}

/* ---------- Bristol chart ---------- */
const BR=[null,
 {n:'Separate hard lumps',d:'Like nuts, hard to pass',k:'Constipation',t:'r'},
 {n:'Lumpy sausage',d:'Sausage-shaped but lumpy',k:'Mild constipation',t:'a'},
 {n:'Cracked sausage',d:'Like a sausage with cracks on the surface',k:'Normal',t:'g'},
 {n:'Smooth sausage',d:'Smooth and soft, like a snake',k:'Normal, ideal',t:'g'},
 {n:'Soft blobs',d:'Soft blobs with clear-cut edges',k:'Leaning loose',t:'a'},
 {n:'Mushy',d:'Fluffy pieces with ragged edges',k:'Mild diarrhoea',t:'a'},
 {n:'Watery',d:'No solid pieces, entirely liquid',k:'Diarrhoea',t:'r'}];
function bristolSvg(n){
  const f='fill="var(--sf)" stroke="var(--ss)" stroke-width="1.4"';let s='';
  if(n===1)[[10,14],[24,24],[38,12],[50,25],[58,13]].forEach(p=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="5.5" ${f}/>`);
  if(n===2){s=`<rect x="6" y="11" width="52" height="15" rx="7.5" ${f}/>`;[[16,10],[28,27],[40,10],[50,27]].forEach(p=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="4.5" ${f}/>`)}
  if(n===3){s=`<rect x="5" y="11" width="54" height="14" rx="7" ${f}/>`;[20,32,44].forEach(x=>s+=`<path d="M${x} 11v6M${x+3} 25v-5" stroke="var(--ss)" stroke-width="1.3" stroke-linecap="round"/>`)}
  if(n===4)s=`<rect x="4" y="12" width="56" height="12" rx="6" ${f}/>`;
  if(n===5)[[14,20,9,7],[31,13,8,6],[46,22,9,7],[57,11,5,4]].forEach(p=>s+=`<ellipse cx="${p[0]}" cy="${p[1]}" rx="${p[2]}" ry="${p[3]}" ${f}/>`);
  if(n===6)[[10,22],[18,14],[26,23],[34,15],[42,24],[50,15],[57,22],[30,29],[14,29],[46,30]].forEach(p=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="var(--sf)" stroke="var(--ss)" stroke-width="1" stroke-dasharray="2 2"/>`);
  if(n===7){s=`<path d="M3 24Q15 18 27 24T51 24T63 22V32H3Z" ${f} fill-opacity=".75"/>`;[[12,12],[30,8],[48,13]].forEach(p=>s+=`<path d="M${p[0]} ${p[1]}q-3 5 0 6q3-1 0-6z" ${f}/>`)}
  return `<svg viewBox="0 0 64 36" class="stool" aria-hidden="true">${s}</svg>`;
}
const bcards=sel=>`<div class="bcards" role="group" aria-label="Bristol stool types">${[1,2,3,4,5,6,7].map(n=>`<button class="bcard" aria-pressed="${sel===n}" data-act="bristol" data-v="${n}">${bristolSvg(n)}<div><b>Type ${n}</b><span>${BR[n].d}</span><span class="pill tone-${BR[n].t}" style="margin-top:3px">${BR[n].k}</span></div></button>`).join('')}</div>`;

/* ---------- Symptoms ---------- */
const SYMS=['Bloating','Abdominal pain','Gas','Diarrhoea','Constipation','Nausea','Urgency','Reflux','Fatigue'];
const STRESS=['Calm','Relaxed-ish','Some stress','Stressed','Very stressed'];
const SLEEPQ=['Poor','Fair','OK','Good','Great'];
const FIBRE=['Not set','Low','Medium','High'];
let Yf={s:[],sev:3,bristol:0,stress:0,sleep:0,water:0,fibre:0,caffeine:0,alcohol:0,note:'',when:inputTs()};
const stepper=(id,label,val,unit)=>`<div class="stepper"><span>${label}</span><div class="row" style="gap:8px;flex-wrap:nowrap"><button type="button" class="btn ghost small" data-act="step" data-id="${id}" data-d="-1" aria-label="Fewer ${label.toLowerCase()}">−</button><b>${val}${unit}</b><button type="button" class="btn ghost small" data-act="step" data-id="${id}" data-d="1" aria-label="More ${label.toLowerCase()}">+</button></div></div>`;
let Md={name:'',dose:'',note:'',when:inputTs()};
const MEDS_COMMON=['Peppermint oil','Buscopan (hyoscine)','Mebeverine','Loperamide','Laxative','Probiotic','Fibre supplement'];
function symptoms(){
  const trg=triggers(),recent=S.sym.slice().sort((a,b)=>b.ts-a.ts).slice(0,14);
  const medHistory=S.meds.slice().sort((a,b)=>b.ts-a.ts).slice(0,10);
  return `<section class="sec"><header><h1>Symptom tracker</h1><p class="sub">A quick check-in each day, or whenever something flares, helps spot patterns.</p></header>
  <div class="panel sec">
   <div class="sec" style="gap:8px"><h3>What are you feeling?</h3><div class="row">${SYMS.map(s=>`<button class="chip" aria-pressed="${Yf.s.includes(s)}" data-act="togSym" data-v="${s}">${s}</button>`).join('')}</div>
   <button class="btn ghost small" style="align-self:flex-start" data-act="allClear">I feel fine today</button></div>
   <label class="f" for="sev">Overall severity: <span id="sevv">${Yf.sev} / 10</span><input id="sev" type="range" min="0" max="10" value="${Yf.sev}" data-in="sev"></label>
   <div class="sec" style="gap:8px"><h3>Bristol stool chart <small class="muted" style="font-family:var(--body);font-weight:400">(optional, tap the closest match)</small></h3>
    <p class="small muted">Types 3 and 4 are ideal. Types 1 and 2 point to constipation, and types 5 to 7 to loose stools or diarrhoea.</p>${bcards(Yf.bristol)}</div>
   <div class="sec" style="gap:8px"><h3>Stress level</h3><div class="row">${STRESS.map((s,i)=>`<button class="chip" aria-pressed="${Yf.stress===i+1}" data-act="stress" data-v="${i+1}">${s}</button>`).join('')}</div></div>
   <div class="sec" style="gap:8px"><h3>Sleep last night <small class="muted" style="font-family:var(--body);font-weight:400">(optional)</small></h3><div class="row">${SLEEPQ.map((s,i)=>`<button class="chip" aria-pressed="${Yf.sleep===i+1}" data-act="sleepQ" data-v="${i+1}">${s}</button>`).join('')}</div></div>
   <div class="sec" style="gap:8px"><h3>Lifestyle today <small class="muted" style="font-family:var(--body);font-weight:400">(optional, common IBS levers)</small></h3>
    <div class="steppers">
     ${stepper('water','Water',Yf.water,' cups')}
     ${stepper('caffeine','Caffeine',Yf.caffeine,' cups')}
     ${stepper('alcohol','Alcohol',Yf.alcohol,' units')}
     <div class="stepper"><span>Fibre</span><div class="row" style="gap:5px">${FIBRE.map((f,i)=>i?`<button class="chip" style="padding:4px 9px;font-size:.8rem" aria-pressed="${Yf.fibre===i}" data-act="fibreQ" data-v="${i}">${f}</button>`:'').join('')}</div></div>
    </div></div>
   <div class="grid2"><label class="f" for="when">When<input id="when" type="datetime-local" value="${Yf.when}" data-in="when"></label>
   <label class="f" for="snote">Notes<input id="snote" type="text" value="${esc(Yf.note)}" placeholder="Anything unusual?" data-in="snote"></label></div>
   <div class="row"><button class="btn" data-act="saveSym">Save check-in</button></div></div>
  <div class="panel sec"><h2>Possible triggers</h2>
   ${trg?`<p class="sub">Across your ${trg.n} flares (severity 4+), these FODMAP groups appeared in meals from the previous 24 hours:</p>
    <div class="sec" style="gap:8px">${trg.groups.map(([t,n])=>`<div class="comp" style="grid-template-columns:130px 1fr 44px"><span>${TYPES[t].n}</span><div class="bar"><i class="${n/trg.n>=.75?'r':n/trg.n>=.5?'a':'g'}" style="width:${Math.round(n/trg.n*100)}%"></i></div><span>${n}/${trg.n}</span></div>`).join('')}</div>
    ${trg.foods.length?`<p class="small">High FODMAP foods most often eaten beforehand: <b>${trg.foods.map(f=>esc(f[0])+' ('+f[1]+')').join(', ')}</b></p>`:''}
    <p class="small muted">This is a pattern in your own log, not proof of cause. Use it to guide structured reintroduction with a dietitian.</p>`
   :`<p class="muted">Log a few meals and at least two flares (severity 4 or more) and Gutlight will look for FODMAP groups that keep turning up beforehand.</p>`}</div>
  <div class="panel sec"><h2>Medication &amp; supplements</h2><p class="sub">Log what you take so it shows up alongside your symptoms for your doctor.</p>
   <div class="row">${MEDS_COMMON.map(m=>`<button class="chip" aria-pressed="${Md.name===m}" data-act="medPick" data-v="${esc(m)}">${m}</button>`).join('')}</div>
   <div class="grid2"><label class="f" for="medname">Name<input id="medname" type="text" value="${esc(Md.name)}" placeholder="e.g. Peppermint oil" data-in="medname"></label>
   <label class="f" for="meddose">Dose <small class="muted" style="font-family:var(--body);font-weight:400">(optional)</small><input id="meddose" type="text" value="${esc(Md.dose)}" placeholder="e.g. 1 capsule" data-in="meddose"></label></div>
   <div class="grid2"><label class="f" for="medwhen">When<input id="medwhen" type="datetime-local" value="${Md.when}" data-in="medwhen"></label>
   <label class="f" for="mednote">Notes<input id="mednote" type="text" value="${esc(Md.note)}" placeholder="Anything to add?" data-in="mednote"></label></div>
   <div class="row"><button class="btn" data-act="saveMed">Log dose</button></div>
   ${medHistory.length?`<div class="list">${medHistory.map(m=>`<div class="item"><span class="dot g" style="opacity:.4"></span><div><div class="nm">${esc(m.name)}${m.dose?` <span class="muted small" style="font-weight:400">${esc(m.dose)}</span>`:''}</div><div class="meta"><span>${fmtD(m.ts)}, ${fmtT(m.ts)}</span>${m.note?`<span>${esc(m.note)}</span>`:''}</div></div><button class="x" data-act="delMed" data-id="${m.id}" aria-label="Delete entry">×</button></div>`).join('')}</div>`:'<p class="muted">Nothing logged yet.</p>'}</div>
  <header><h2>History</h2></header>
  ${recent.length?`<div class="list">${recent.map(x=>`<div class="item"><span class="light ${x.sev>=7?'r':x.sev>=4?'a':'g'}" style="grid-column:1" title="Severity">${x.sev}/10</span><div><div class="nm">${x.s.length?x.s.join(', '):'No symptoms'}</div><div class="meta"><span>${fmtD(x.ts)}, ${fmtT(x.ts)}</span>${x.bristol?`<span class="tag">Stool type ${x.bristol}</span>`:''}${x.stress?`<span class="tag">${STRESS[x.stress-1]}</span>`:''}${x.sleep?`<span class="tag">Sleep ${SLEEPQ[x.sleep-1]}</span>`:''}${x.water?`<span class="tag">Water ${x.water}</span>`:''}${x.fibre?`<span class="tag">Fibre ${FIBRE[x.fibre]}</span>`:''}${x.caffeine?`<span class="tag">Caffeine ${x.caffeine}</span>`:''}${x.alcohol?`<span class="tag">Alcohol ${x.alcohol}</span>`:''}${x.note?`<span>${esc(x.note)}</span>`:''}</div></div><button class="x" data-act="delSym" data-id="${x.id}" aria-label="Delete entry">×</button></div>`).join('')}</div>`:'<p class="muted">No check-ins yet.</p>'}
  </section>`;
}
/* ---------- Foods ---------- */
let Fq={q:'',lv:'all',cat:'all',ty:'all'};
function foodRows(){
  const q=Fq.q.trim().toLowerCase();
  const list=FOODS.filter(f=>(Fq.lv==='all'||f.l===Fq.lv)&&(Fq.cat==='all'||f.c===Fq.cat)&&(Fq.ty==='all'||f.t.includes(Fq.ty))&&(!q||f.terms.some(t=>t.includes(q))||f.n.toLowerCase().includes(q)));
  if(!list.length)return '<p class="muted">No foods match. Try a different search or clear the filters.</p>';
  return `<p class="small muted">${list.length} food${list.length===1?'':'s'}</p>`+Object.keys(CATS).map(c=>{
    const fs=list.filter(f=>f.c===c).sort((a,b)=>'gar'.indexOf(a.l)-'gar'.indexOf(b.l)||a.n.localeCompare(b.n));
    if(!fs.length)return '';
    return `<div class="cat sec" style="--h:${CATH[c]}"><h3>${CATS[c]}</h3><div class="list">${fs.map(f=>`<div class="item"><span class="dot ${f.l}"></span><div><div class="nm">${esc(f.n)}</div><div class="meta">${tagsOf(f)}<span>${esc(f.note)}</span></div></div>${light(f.l)}</div>`).join('')}</div></div>`;
  }).join('');
}
function foodGuide(){
  const cnt=l=>FOODS.filter(f=>f.l===l).length;
  return `<section class="sec"><header><h1>FODMAP food guide</h1><p class="sub">The traffic-light system: green foods are safe in normal serves, amber foods depend on portion size, red foods are high in FODMAPs.</p></header>
  <div class="legend"><div class="g"><b>Green · ${cnt('g')} foods</b>Low FODMAP. Eat freely in normal serves.</div><div class="a"><b>Amber · ${cnt('a')} foods</b>Low in small serves only. Watch the portion and don’t stack several.</div><div class="r"><b>Red · ${cnt('r')} foods</b>High FODMAP. Avoid during the elimination phase.</div></div>
  <div class="grid2" style="gap:10px"><label class="f" for="fq">Search<input id="fq" type="search" value="${esc(Fq.q)}" placeholder="Search foods, e.g. garlic" data-in="fq"></label>
   <div class="grid2" style="gap:10px"><label class="f" for="fcat">Category<select id="fcat" data-in="fcat"><option value="all">All</option>${Object.entries(CATS).map(([k,v])=>`<option value="${k}"${Fq.cat===k?' selected':''}>${v}</option>`).join('')}</select></label>
   <label class="f" for="fty">FODMAP type<select id="fty" data-in="fty"><option value="all">All</option>${Object.entries(TYPES).map(([k,v])=>`<option value="${k}"${Fq.ty===k?' selected':''}>${v.n}</option>`).join('')}</select></label></div></div>
  <div class="row">${[['all','All'],['g','Green'],['a','Amber'],['r','Red']].map(([k,v])=>`<button class="chip" aria-pressed="${Fq.lv===k}" data-act="setLv" data-v="${k}">${k==='all'?'':`<span class="dot ${k}"></span>`}${v}</button>`).join('')}</div>
  <div class="sec" id="fres" style="gap:18px">${foodRows()}</div>
  <p class="foot">This guide is a curated list cross-checked against published Monash University FODMAP guidance and the Gloucestershire Hospitals NHS FODMAP diet sheet. The official Monash database is licensed to the Monash FODMAP Diet app and is retested regularly, so use that app as the source of truth for exact serve sizes.</p></section>`;
}

/* ---------- Meal builder ---------- */
const FID=n=>FOODS.find(f=>f.n===n).id;
const B={ids:new Set(),name:'',amber:false,type:'Dinner'};
const SLOTS=[['P','Protein','Pick one'],['G','Grains & starches','Pick one'],['V','Vegetables','Pick two or three'],['S','Flavour, oils & herbs','Pick a few'],['F','Fruit','Optional'],['D','Dairy & alternatives','Optional'],['N','Nuts & seeds','Optional']];
const PRESETS=[['Chicken rice bowl',['Chicken','White rice','Carrot','Leafy greens','Garlic-infused oil','Fresh herbs']],['Salmon & potatoes',['Fish','Potato','Green beans','Lemon & lime','Cooking oils']],['Cheddar omelette',['Eggs','Cheese (hard & aged)','Leafy greens','Tomato','Sourdough spelt bread']],['Overnight oats',['Oats','Blueberries','Almond milk','Seeds']]];
let FoodsTab='guide';
function foods(){
  return `<section class="sec"><div class="seg" role="tablist" aria-label="Foods section"><button type="button" role="tab" aria-selected="${FoodsTab==='guide'}" data-act="foodsTab" data-v="guide">Food guide</button><button type="button" role="tab" aria-selected="${FoodsTab==='builder'}" data-act="foodsTab" data-v="builder">Meal builder</button></div></section>`+(FoodsTab==='builder'?builder():foodGuide());
}
function builder(){
  const sel=[...B.ids].map(i=>FOODS[i]),amb=sel.filter(f=>f.l==='a'),has=c=>sel.some(f=>f.c===c);
  const hints=[];if(sel.length){if(!has('P'))hints.push('Add a protein');if(!has('G'))hints.push('Add a grain or starch for energy');if(!has('V'))hints.push('Add some vegetables')}
  return `<section class="sec"><header><h1>Meal builder</h1><p class="sub">Pick from low FODMAP foods to put together your own meal. Everything here is safe in normal serves.</p></header>
  <div class="row"><span class="small muted">Start from an idea:</span>${PRESETS.map((p,i)=>`<button class="chip" data-act="bPreset" data-v="${i}">${p[0]}</button>`).join('')}<button class="chip" data-act="bSurprise">Surprise me</button></div>
  ${S.recipes.length?`<div class="row"><span class="small muted">Your recipes:</span>${S.recipes.map((r,i)=>`<span class="recipe-row"><button class="chip" data-act="bLoadRecipe" data-v="${i}">${esc(r.name)}</button><button class="x" data-act="bDelRecipe" data-v="${i}" aria-label="Delete recipe ${esc(r.name)}">×</button></span>`).join('')}</div>`:''}
  <div class="grid2" style="align-items:start">
   <div class="panel"><label class="chip" style="margin-bottom:6px"><input type="checkbox" id="bamb" data-in="bamb"${B.amber?' checked':''}> Also show amber foods (small serves)</label>
    ${SLOTS.map(([c,t,h])=>`<div class="slot" style="--h:${CATH[c]}"><h3>${t}<small>${h}</small></h3><div class="row" style="gap:7px">${FOODS.filter(f=>f.c===c&&(f.l==='g'||(B.amber&&f.l==='a'))).map(f=>`<button class="chip" aria-pressed="${B.ids.has(f.id)}" data-act="bTog" data-v="${f.id}">${f.l==='a'?'<span class="dot a" style="width:9px;height:9px"></span>':''}${esc(f.n)}</button>`).join('')}</div></div>`).join('')}</div>
   <div class="panel lift sec" style="position:sticky;top:70px"><h2>Your plate</h2>
    ${sel.length?`<div class="verdict ${amb.length?'a':'g'}"><span class="dot ${amb.length?'a':'g'}" style="width:18px;height:18px;margin-top:3px"></span><div><b>${amb.length?'Low FODMAP with portion limits':'All green'}</b><span>${amb.length?'Keep to the serve size for: '+amb.map(f=>f.n).join(', ')+'.'+(amb.length>2?' Several amber foods in one meal can add up, so trim each serve.':''):'Every ingredient is low FODMAP in a normal serve.'}</span></div></div>
     <div class="list">${sel.map(f=>`<div class="item"><span class="dot ${f.l}"></span><div><div class="nm">${esc(f.n)}</div><div class="meta">${esc(f.note)}</div></div><button class="x" data-act="bTog" data-v="${f.id}" aria-label="Remove ${esc(f.n)}">×</button></div>`).join('')}</div>
     ${hints.length?`<p class="small muted">${hints.join(' · ')}</p>`:''}
     <label class="f" for="bname">Name your meal<input id="bname" type="text" value="${esc(B.name)}" placeholder="e.g. Friday stir fry" data-in="bname"></label>
     <label class="f" for="btype">Meal<select id="btype" data-in="btype">${['Breakfast','Lunch','Dinner','Snack'].map(t=>`<option${B.type===t?' selected':''}>${t}</option>`).join('')}</select></label>
     <div class="row"><button class="btn" data-act="bSave">Save to food diary</button><button class="btn ghost" data-act="bSaveRecipe">Save as recipe</button><button class="btn ghost" data-act="bClear">Clear</button></div>`
    :`<p class="muted">Choose foods on the left, or try “Surprise me”. Your plate and its FODMAP rating will appear here.</p>`}</div>
  </div></section>`;
}

/* ---------- Ambient sounds (generated with Web Audio, no files) ---------- */
const SOUNDS=[['off','Off'],['rain','Rain'],['ocean','Ocean waves'],['forest','Forest'],['stream','Stream'],['night','Night crickets'],['bowls','Singing bowls']];
const Snd={ctx:null,master:null,live:[],timers:[],cur:'off',on:false,buf:{}};
const SND_GAIN=2.4;
function unlockAudio(){
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  try{
    if(!Snd.el){
      const n=800,b=new Uint8Array(44+n*2),dv=new DataView(b.buffer),w=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i))};
      w(0,'RIFF');dv.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,8000,true);dv.setUint32(28,16000,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);w(36,'data');dv.setUint32(40,n*2,true);
      for(let i=0;i<n;i++)dv.setInt16(44+i*2,i%2?1:-1,true);
      let s='';b.forEach(x=>s+=String.fromCharCode(x));
      const a=new Audio('data:audio/wav;base64,'+btoa(s));a.loop=true;a.setAttribute('playsinline','');a.volume=.02;Snd.el=a;
    }
    if(Snd.el.paused)Snd.el.play().catch(()=>{});
  }catch(e){}
}
function sndCtx(){
  unlockAudio();
  if(!Snd.ctx){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    Snd.ctx=new C();Snd.master=Snd.ctx.createGain();Snd.master.gain.value=0;
    const comp=Snd.ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=12;comp.ratio.value=6;comp.attack.value=.02;comp.release.value=.3;
    Snd.master.connect(comp);comp.connect(Snd.ctx.destination);
  }
  if(Snd.ctx.state!=='running')Snd.ctx.resume().catch(()=>{});
  return Snd.ctx;
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Snd.on&&Snd.ctx&&Snd.ctx.state!=='running')Snd.ctx.resume().catch(()=>{})});
function nbuf(kind){
  if(Snd.buf[kind])return Snd.buf[kind];
  const c=Snd.ctx,len=c.sampleRate*5,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);
  let l=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for(let i=0;i<len;i++){
    const w=Math.random()*2-1;
    if(kind==='white')d[i]=w*.5;
    else if(kind==='brown'){l=(l+.02*w)/1.02;d[i]=l*3.5}
    else{b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926}
  }
  const f=2000;for(let i=0;i<f;i++){const k=i/f;d[len-f+i]=d[len-f+i]*(1-k)+d[i]*k}
  return Snd.buf[kind]=b;
}
function sndStop(now){
  Snd.timers.forEach(clearTimeout);Snd.timers=[];Snd.cur='off';Snd.on=false;
  const c=Snd.ctx;if(!c)return;
  const live=Snd.live;Snd.live=[];
  const kill=()=>live.forEach(n=>{try{n.stop()}catch(e){}});
  if(now){kill();return}
  Snd.master.gain.setTargetAtTime(0,c.currentTime,.4);setTimeout(()=>{kill();if(!Snd.on&&Snd.el)Snd.el.pause()},1800);
}
function sndStart(name){
  sndStop(true);
  if(name==='off')return;
  const c=sndCtx();if(!c)return toast('Sound is not supported in this browser');
  const bus=c.createGain();bus.connect(Snd.master);
  const add=n=>{Snd.live.push(n);return n};
  const noise=k=>{const s=c.createBufferSource();s.buffer=nbuf(k);s.loop=true;s.start(0,Math.random()*3);return add(s)};
  const filt=(t,f,q)=>{const n=c.createBiquadFilter();n.type=t;n.frequency.value=f;if(q)n.Q.value=q;return n};
  const gain=v=>{const g=c.createGain();g.gain.value=v;return g};
  const lfo=(hz,depth,param)=>{const o=c.createOscillator();o.frequency.value=hz;o.connect(gain(depth)).connect(param);o.start();add(o)};
  const later=(fn,lo,hi)=>{const go=()=>{if(Snd.cur!==name)return;fn();Snd.timers.push(setTimeout(go,lo+Math.random()*(hi-lo)))};Snd.timers.push(setTimeout(go,lo/2+Math.random()*lo))};
  const note=(f,t,dur,peak,type='sine')=>{const o=c.createOscillator(),g=gain(0);o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(bus);o.start(t);o.stop(t+dur+.1)};
  Snd.cur=name;
  if(name==='rain'){
    noise('pink').connect(filt('highpass',400)).connect(filt('lowpass',8000)).connect(gain(.55)).connect(bus);
    noise('white').connect(filt('highpass',4500)).connect(gain(.1)).connect(bus);
  }
  if(name==='ocean'){
    const g=gain(.35),lp=filt('lowpass',1100);noise('pink').connect(lp).connect(g).connect(bus);
    lfo(.11,.3,g.gain);lfo(.08,500,lp.frequency);
    const f=gain(.05);noise('pink').connect(filt('highpass',1800)).connect(f).connect(bus);lfo(.11,.04,f.gain);
  }
  if(name==='forest'){
    const w=gain(.3);noise('pink').connect(filt('bandpass',700,.6)).connect(w).connect(bus);lfo(.07,.15,w.gain);
    noise('pink').connect(filt('lowpass',1500)).connect(gain(.12)).connect(bus);
    later(()=>{const t=c.currentTime,n=2+Math.floor(Math.random()*3),f0=2200+Math.random()*2000,up=Math.random()<.5;
      for(let k=0;k<n;k++){const o=c.createOscillator(),g=gain(0),t0=t+k*.14;o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(f0*(up?1.35:.75),t0+.09);
        g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.05,t0+.015);g.gain.linearRampToValueAtTime(0,t0+.11);o.connect(g).connect(bus);o.start(t0);o.stop(t0+.13)}},2500,7000);
  }
  if(name==='stream'){
    const bp=filt('bandpass',1400,.9);noise('pink').connect(bp).connect(gain(.45)).connect(bus);
    lfo(.31,350,bp.frequency);lfo(.83,250,bp.frequency);lfo(1.7,150,bp.frequency);
    const h=gain(.07);noise('white').connect(filt('highpass',3000)).connect(h).connect(bus);lfo(.5,.03,h.gain);
  }
  if(name==='night'){
    noise('pink').connect(filt('lowpass',1200)).connect(gain(.1)).connect(bus);
    [[4400,6.5,.6],[4750,7.3,.45]].forEach(([f,r,gt])=>{
      const o=c.createOscillator();o.frequency.value=f;o.start();add(o);
      const g1=gain(.5),g2=gain(.5),out=gain(.05);lfo(r,.5,g1.gain);lfo(gt,.5,g2.gain);
      o.connect(g1).connect(g2).connect(out).connect(bus);
    });
  }
  if(name==='bowls'){
    [220,329.63,440,659.25].forEach((f,i)=>{const o=c.createOscillator(),g=gain(.07);o.frequency.value=f;o.connect(g).connect(bus);o.start();add(o);lfo(.04+i*.017,.05,g.gain)});
    const P=[523.25,587.33,659.25,783.99,880,1046.5];
    later(()=>{const f=P[Math.floor(Math.random()*P.length)],t=c.currentTime;note(f,t,6,.09);note(f*2.76,t,3,.02)},6000,11000);
  }
  Snd.on=true;
  Snd.master.gain.cancelScheduledValues(c.currentTime);
  Snd.master.gain.setTargetAtTime(Br.vol*SND_GAIN,c.currentTime,1.2);
  setTimeout(()=>{if(Snd.on&&Snd.ctx.state!=='running')toast('Sound is blocked. Turn up your volume, switch off silent mode, then tap the sound again.')},700);
}
function sndPanel(compact){
  return `<div class="sec" style="gap:8px"><h3>Calming sound${compact?'':' <small class="muted" style="font-family:var(--body);font-weight:400">(made in your browser, headphones recommended)</small>'}</h3>
   <div class="row" style="gap:7px">${SOUNDS.map(([k,l])=>`<button class="chip" aria-pressed="${Br.snd===k}" data-act="bSnd" data-v="${k}">${l}</button>`).join('')}</div>
   <div class="row"><label class="f" for="${compact?'bvol2':'bvol'}" style="flex:1;min-width:160px;flex-direction:row;align-items:center;gap:10px">Volume<input id="${compact?'bvol2':'bvol'}" type="range" min="0" max="1" step="0.05" value="${Br.vol}" data-in="bvol"></label>
   ${compact?'':`<button class="btn ghost small" data-act="sndPrev" id="sprev">${Snd.on?'Stop preview':'Listen'}</button>`}</div></div>`;
}


/* ---------- Breathe ---------- */
const PATS=[
 {n:'Calm exhale',d:'In for 4, out for 6. A longer exhale nudges your body into its rest response.',ph:[['Breathe in',4,1],['Breathe out',6,.6]]},
 {n:'Box',d:'In, hold, out, hold, 4 seconds each. Steadies racing thoughts.',ph:[['Breathe in',4,1],['Hold',4,1],['Breathe out',4,.6],['Hold',4,.6]]},
 {n:'4-7-8',d:'In for 4, hold for 7, out for 8. A slow rhythm for winding down.',ph:[['Breathe in',4,1],['Hold',7,1],['Breathe out',8,.6]]},
 {n:'Belly breathing',d:'Hand on your belly. In through the nose for 5 so your belly rises, out for 5.',ph:[['Breathe in',5,1],['Breathe out',5,.6]]}];
const Br={snd:'rain',vol:.6,pat:0,mins:3,pre:5,post:5,thought:'',reframe:'',mode:'setup',end:0,startedAt:0};
let bTimer=null,bTick=null;
function stopBreath(){clearTimeout(bTimer);clearInterval(bTick);bTimer=bTick=null}
function runPhase(i){
  const p=PATS[Br.pat].ph[i%PATS[Br.pat].ph.length],orb=$('#orb');
  if(!orb||Br.mode!=='run')return;
  $('#bph').textContent=p[0];orb.style.transitionDuration=p[1]+'s';orb.style.transform='scale('+p[2]+')';
  Br.pEnd=Date.now()+p[1]*1000;
  bTimer=setTimeout(()=>Date.now()>=Br.end-400?finishBreath():runPhase(i+1),p[1]*1000);
}
function finishBreath(){stopBreath();sndStop();Br.secs=Math.round((Date.now()-Br.startedAt)/1000);Br.mode=Br.secs>=20?'done':'setup';render()}
function startBreath(){
  if(Br.snd!=='off')sndStart(Br.snd);
  Br.mode='run';Br.startedAt=Date.now();Br.end=Date.now()+Br.mins*60000;render();
  const orb=$('#orb');orb.style.transform='scale(.6)';
  requestAnimationFrame(()=>requestAnimationFrame(()=>runPhase(0)));
  bTick=setInterval(()=>{const c=$('#bct'),r=$('#brem');if(!c)return;c.textContent=Math.max(1,Math.ceil((Br.pEnd-Date.now())/1000));const s=Math.max(0,Math.ceil((Br.end-Date.now())/1000));r.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')+' left'},250);
}
function breathe(){
  const P=PATS[Br.pat],sess=S.breath.slice().sort((a,b)=>b.ts-a.ts),wk=sess.filter(s=>Date.now()-s.ts<7*DAY),drops=wk.filter(s=>s.pre!=null&&s.post!=null).map(s=>s.pre-s.post),avg=drops.length?drops.reduce((a,b)=>a+b,0)/drops.length:null;
  let main='';
  if(Br.mode==='run')main=`<div class="panel lift orb-wrap" style="text-align:center"><div class="ring"><div class="orb" id="orb"><div><div class="ph" id="bph">Get ready</div><div class="ct" id="bct">–</div></div></div></div><p class="muted" id="brem" aria-live="off" style="margin-top:12px">${Br.mins}:00 left</p><button class="btn ghost" data-act="bStop" style="margin-top:8px">Stop</button></div><div class="panel">${sndPanel(true)}</div>`;
  else if(Br.mode==='done')main=`<div class="panel lift sec"><h2>Well done. ${Math.max(1,Math.round(Br.secs/60))} min of ${P.n.toLowerCase()} breathing.</h2>
   <label class="f" for="bpost">How stressed do you feel now? <span id="bpostv">${Br.post} / 10</span><input id="bpost" type="range" min="0" max="10" value="${Br.post}" data-in="bpost"></label>
   <p class="sub">Optional thought check (CBT): write down the worry, then a fairer way of looking at it.</p>
   <label class="f" for="bth">What was on your mind?<input id="bth" type="text" value="${esc(Br.thought)}" data-in="bth" placeholder="e.g. What if I get a flare-up at dinner?"></label>
   <label class="f" for="brf">A more balanced view<input id="brf" type="text" value="${esc(Br.reframe)}" data-in="brf" placeholder="e.g. I have safe foods and a plan if I do"></label>
   <div class="row"><button class="btn" data-act="bSaveSess">Save session</button><button class="btn ghost" data-act="bSkip">Discard</button></div></div>`;
  else main=`<div class="panel lift sec"><h2>Choose a rhythm</h2><div class="row">${PATS.map((p,i)=>`<button class="chip" aria-pressed="${Br.pat===i}" data-act="bPat" data-v="${i}">${p.n}</button>`).join('')}</div>
   <p class="sub">${P.d}</p>
   <div class="row">${[1,3,5].map(m=>`<button class="chip" aria-pressed="${Br.mins===m}" data-act="bMins" data-v="${m}">${m} min</button>`).join('')}</div>
   <label class="f" for="bpre">How stressed do you feel right now? <span id="bprev">${Br.pre} / 10</span><input id="bpre" type="range" min="0" max="10" value="${Br.pre}" data-in="bpre"></label>
   ${sndPanel(false)}
   <div class="row"><button class="btn" data-act="bStart">Start breathing</button></div>
   <p class="small muted">Sit comfortably, breathe through your nose if you can, and let your belly move. If you feel dizzy, return to normal breathing.</p></div>`;
  return `<section class="sec"><button type="button" class="btn ghost small" data-act="go" data-v="home" style="align-self:flex-start">← Home</button><header><h1>Breathe</h1><p class="sub">Slow, paced breathing calms the gut-brain axis. Use it when stress or a flare-up makes your gut tense up.</p></header>${main}
  <div class="grid2"><div class="panel sec"><h3>A quick thought check</h3><ol class="small" style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px"><li><b>Notice</b> the worry. Name it: “I’m worried about…”</li><li><b>Check</b> the evidence. How likely is it really? What has happened before?</li><li><b>Reframe</b> it into something fair and useful. What would you tell a friend?</li></ol></div>
  <div class="panel sec"><h3>Your sessions</h3><p class="small">${wk.length?`${wk.length} session${wk.length>1?'s':''} this week${avg!=null?`. Average stress drop: <b>${avg.toFixed(1)} points</b>.`:'.'}`:'No sessions this week yet.'}</p>
   ${sess.slice(0,4).map(s=>`<p class="small muted">${fmtD(s.ts)} · ${s.pat} · ${Math.round(s.secs/60)||1} min${s.pre!=null?` · stress ${s.pre} → ${s.post}`:''}</p>`).join('')}</div></div></section>`;
}

/* ---------- Learn ---------- */
const DOC_RECS=[
 [145,'Low FODMAP diet','Food triggers','Usually tried with a specialist dietitian if general diet advice hasn\u2019t been enough, especially when food seems to set off symptoms. It\u2019s meant to be a time-limited trial, then foods are reintroduced to find what you tolerate. Staying restricted long term can narrow your nutrients and change your gut bacteria.'],
 [40,'Laxatives','Constipation','A bulk-forming laxative is the usual first choice, with the dose adjusted until stools are soft, regular and comfortable. It\u2019s reviewed after about 3 months and stopped if it isn\u2019t helping. Other types can be tried, but lactulose isn\u2019t recommended for IBS. If severe constipation lasts 12 months or more despite several laxatives, a specialist may consider linaclotide.'],
 [5,'Anti-diarrhoeals','Diarrhoea','Loperamide, which slows the gut down, may be offered when diarrhoea keeps coming back. The dose is adjusted to give comfortable, regular, soft, well-formed stools, and it\u2019s reviewed at about 3 months.'],
 [205,'Antispasmodics','Pain and cramps','Mebeverine, alverine, peppermint oil or hyoscine butylbromide (Buscopan), taken when you need them for pain or spasm. They\u2019re reviewed after about 3 months to see whether they\u2019re worth continuing.'],
 [265,'Low-dose TCA','Persistent pain','If an antispasmodic doesn\u2019t help, a low dose of a tricyclic antidepressant such as amitriptyline may be tried. Here it\u2019s used to calm gut pain signals, not for depression, and it\u2019s an off-label use. Doctors start low, review after 4 weeks, raise the dose slowly if needed, and continue for at least 6 months if it works. Side effects are explained first. If a TCA doesn\u2019t suit you, an SSRI such as citalopram or fluoxetine may be an option.']
];
const LIFESTYLE=[
 [235,'Relax and move',['Make time to relax, since stress can set symptoms off.','If you\u2019re not very active, build in more movement. A small trial found that physio-guided exercise improved IBS symptoms.']],
 [145,'Eat regularly',['Eat meals at regular times and take your time over them.','Avoid skipping meals and long gaps between them.']],
 [205,'Drinks',['Aim for at least 8 cups of fluid a day, mostly water or non-caffeinated drinks.','Keep tea and coffee to about 3 cups a day.','Cut back on alcohol and fizzy drinks.']],
 [40,'Fibre',['It can help to limit high-fibre foods and keep fresh fruit to about 3 portions a day.','Avoid insoluble fibre such as bran, corn and wheat.','If you need more fibre, choose soluble types: oats, nuts and seeds, or ispaghula.']],
 [335,'Bloating, wind and diarrhoea',['For bloating and wind, oats and up to 1 tablespoon of linseeds a day may help.','If diarrhoea is a problem, avoid the sweetener sorbitol.','Reduce resistant starch, which is often found in processed or recooked foods.']],
 [265,'Probiotics and other things to know',['If you want to try a probiotic, use the manufacturer\u2019s dose for at least 4 weeks. The British Society of Gastroenterology suggests a 12-week trial, and stopping if you\u2019re no better.','Aloe vera is discouraged, and a gluten-free diet, acupuncture and reflexology are not recommended for IBS.','Kiwifruit may help constipation-type IBS: small studies show faster gut transit and more frequent bowel movements, but the effect on pain is less clear.']]
];
function lifestyleHtml(){
  return `<section class="sec" id="lifestyle"><header><h3>Everyday diet and lifestyle advice</h3><p class="sub">Doctors usually start here, before any medicine.</p></header>
  <div class="lgrid">${LIFESTYLE.map(([h,t,pts])=>`<div class="lcard" style="--h:${h}"><b>${t}</b><ul>${pts.map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('')}</div>
  <p class="small muted">Summarised from Red Whale GP guidance. General information, not advice for you.</p></section>`;
}
function docRecsHtml(){
  return lifestyleHtml()+`<section class="sec" id="doctor"><header><h3>What a doctor might recommend</h3><p class="sub">If diet and lifestyle changes aren\u2019t enough, a doctor may suggest these, matched to your main symptoms.</p></header>
  <div class="lgrid">${DOC_RECS.map(([h,t,tag,txt])=>`<div class="lcard" style="--h:${h}"><b>${t}</b><span class="tag" style="align-self:flex-start">${tag}</span><span>${txt}</span></div>`).join('')}</div>
  <p class="small muted">If symptoms continue despite treatment, a doctor should reconsider the diagnosis and may refer you to a gastroenterologist, or suggest psychological therapies, especially after about 12 months. Your medication log and PDF report (Symptoms and Trends tabs) can help that conversation.</p>
  <p class="small muted">A summary of UK NICE guidance (<a href="https://cks.nice.org.uk/topics/irritable-bowel-syndrome/" target="_blank" rel="noopener">NICE CKS: Irritable bowel syndrome</a>). It\u2019s general information, not advice for you. Don\u2019t start, change or stop any medicine without talking to your doctor or pharmacist, and guidance can differ outside the UK.</p></section>`;
}
function learnHtml(){
  const ex=t=>FOODS.filter(f=>f.l==='r'&&f.t.includes(t)).slice(0,6).map(f=>f.n).join(', ');
  const det=(t,b,o)=>`<details${o?' open':''}><summary>${t}</summary><div class="body">${b}</div></details>`;
  return `<section class="sec" id="learn"><header><h2>Learn about FODMAPs</h2><p class="sub">The basics at a glance, with more detail underneath.</p></header>
  <div class="lgrid">
   <div class="lcard" style="--h:235"><b>What they are</b><span>Short-chain carbohydrates (Fermentable Oligosaccharides, Disaccharides, Monosaccharides And Polyols) that are poorly absorbed in the small intestine.</span></div>
   <div class="lcard" style="--h:335"><b>Why they upset the gut</b><span>They draw extra water into the bowel and gut bacteria ferment them into gas. In a sensitive gut that means bloating, pain, wind and changes in bowel habit.</span></div>
   <div class="lcard" style="--h:145"><b>The traffic light</b><span><span class="dot g"></span> Green: low FODMAP. <span class="dot a"></span> Amber: small serves only. <span class="dot r"></span> Red: high FODMAP. See the Foods tab, or log a meal to rate it.</span></div>
   <div class="lcard" style="--h:40"><b>Three phases</b><span>Eliminate for 4 to 6 weeks, reintroduce one group at a time over 6 to 8 weeks, then personalise. Best done with a dietitian.</span></div>
  </div>
  ${docRecsHtml()}
  <div><h3 style="padding-top:6px">Go deeper</h3>
  ${det('What are FODMAPs?',`<p>FODMAP stands for <b>F</b>ermentable <b>O</b>ligosaccharides, <b>D</b>isaccharides, <b>M</b>onosaccharides <b>A</b>nd <b>P</b>olyols. They are short-chain carbohydrates that are poorly absorbed in the small intestine.</p><p>They cause trouble in two ways: they draw extra water into the bowel, and gut bacteria ferment them to make gas. In a sensitive gut that stretching leads to bloating, pain, wind and changes in bowel habit, which are the classic symptoms of IBS.</p><p>The low FODMAP diet was developed by researchers at Monash University in Australia and has good evidence for easing IBS symptoms in many people.</p>`)}
  ${det('The six FODMAP types',`<div class="tbl"><table><thead><tr><th>Type</th><th>Group</th><th>Why it matters</th><th>High FODMAP examples</th></tr></thead><tbody>${['Fr','G','L','F','S','M'].map(t=>`<tr><td><b>${TYPES[t].n}</b></td><td>${TYPES[t].grp}</td><td>${TYPES[t].why}</td><td>${ex(t)}</td></tr>`).join('')}</tbody></table></div>`)}
  ${det('The traffic light system',`<div class="legend"><div class="g"><b>Green</b>Low FODMAP at the tested serve size. Safe to eat during elimination.</div><div class="a"><b>Amber</b>Low at a small serve but high at larger ones. Measure your portions and avoid stacking amber foods.</div><div class="r"><b>Red</b>High FODMAP even in modest serves. Avoid while you eliminate.</div></div><p>FODMAPs are dose dependent. A food can change colour with the serving size, which is why the same food may have a green serve and a red serve. Everything adds up across a meal and a day.</p>`)}
  ${det('The three phases of the diet',`<ol><li><b>Elimination (4 to 6 weeks).</b> Swap high FODMAP foods for low FODMAP ones and track your symptoms. This is a short test, not a life sentence.</li><li><b>Reintroduction (6 to 8 weeks).</b> Test one FODMAP group at a time in gradually bigger serves to find which ones you tolerate and how much.</li><li><b>Personalisation.</b> Build a long-term diet that is as varied as possible, only limiting your true triggers.</li></ol><p>It’s best done with a registered dietitian. Restricting for longer than needed can reduce gut-friendly bacteria and nutrient variety.</p>`)}
  ${det('Where FODMAPs hide',`<ul><li><b>Onion and garlic</b> sit in stock cubes, sauces, seasoning blends, sausages, soups and ready meals. Look for “natural flavours” too.</li><li><b>Honey, agave and high fructose corn syrup</b> in cereal bars, dressings and drinks.</li><li><b>Inulin and chicory root</b> added to “high fibre” or “gut friendly” products.</li><li><b>Sugar-free sweeteners</b> ending in “-ol” (sorbitol, mannitol, xylitol) in gum, mints and diabetic sweets.</li><li><b>Portion stacking:</b> two amber foods in one meal can add up to a red load.</li></ul><p>Tip: garlic-infused oil and the green tops of spring onions give you the flavour without the fructans.</p>`)}
  ${det('Eating well without FODMAPs',`<ul><li>Choose plain meat, fish and eggs, which contain no FODMAPs.</li><li>Rice, potato, oats, quinoa and gluten-free breads and pastas keep your carbs sorted.</li><li>Swap lactose-containing milk for lactose-free milk and hard cheeses.</li><li>Eat regular meals, chew slowly and drink enough water.</li><li>Manage stress. The gut and brain talk constantly, so use the breathing exercise on the Home page often.</li></ul>`)}
  ${det('When to see a doctor',`<p>IBS is diagnosed after other conditions are ruled out. See a doctor promptly if you have:</p><ul><li>Blood in your stool or black stools</li><li>Unexplained weight loss</li><li>Persistent vomiting, or pain that wakes you at night</li><li>Anaemia, or a family history of bowel cancer or coeliac disease</li><li>New symptoms after age 50</li></ul><p>Don’t start a restrictive diet before coeliac disease has been excluded, as the test needs you to be eating gluten.</p>`)}
  ${det('About the food ratings',`<p>The FODMAP content of foods is measured by Monash University, and the results are published in the Monash University FODMAP Diet app, which is updated as new foods are tested. Gutlight is an independent tool. Its ratings come from a curated list checked against published Monash guidance and an NHS FODMAP diet sheet, and the checker also reads ingredient lists, ignoring foods you say are left out (like “no onion”). It doesn’t replace the official database, and it can’t see serve sizes or stacking across a day. Check the Monash app for exact serve sizes and new foods.</p><p>Gutlight is for tracking and education and isn’t medical advice. Talk to your doctor or dietitian about your diet.</p>`)}
  </div></section>`;
}

/* ---------- Trends ---------- */
let Tr={days:14};
let Ex={days:30,food:true,sym:true,tr:true,photos:true,meds:true};
function dayData(n){
  const now=Date.now(),out=[];
  for(let i=n-1;i>=0;i--){
    const ts=now-i*DAY,k=dkey(ts),ss=S.sym.filter(x=>dkey(x.ts)===k),ms=S.meals.filter(m=>dkey(m.ts)===k),st=ss.filter(x=>x.stress),sl=ss.filter(x=>x.sleep);
    const typeLoad={};['Fr','G','L','F','S','M'].forEach(t=>typeLoad[t]=0);
    ms.forEach(m=>{if(!m.level||m.level==='g')return;const w=m.level==='r'?1:.5;(m.ids||[]).forEach(id=>{const f=FOODS[id];if(!f)return;f.t.forEach(t=>{if(t in typeLoad)typeLoad[t]+=w})})});
    out.push({k,ts,l:new Date(ts).toLocaleDateString([],{day:'numeric',month:'short'}),
      sev:ss.length?ss.reduce((a,x)=>a+x.sev,0)/ss.length:null,
      stress:st.length?Math.max(...st.map(x=>x.stress)):null,
      sleep:sl.length?sl.reduce((a,x)=>a+x.sleep,0)/sl.length:null,
      red:ms.filter(m=>m.level==='r').length,amb:ms.filter(m=>m.level==='a').length,grn:ms.filter(m=>m.level==='g').length,meals:ms.length,
      bristol:ss.filter(x=>x.bristol).map(x=>x.bristol),typeLoad});
  }
  return out;
}
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const sevTone=v=>v>=6?'r':v>=3?'a':'g';
function miniChart(days,kind){
  const W=340,H=112,pl=30,pr=8,pt=8,pb=22,n=days.length,step=(W-pl-pr)/n,bw=Math.max(3,step*.62);
  const cx=i=>pl+step*i+step/2;
  const mx=kind==='sev'?10:kind==='stress'?5:Math.max(3,...days.map(d=>d.red+d.amb));
  const Y=v=>pt+(1-v/mx)*(H-pt-pb);
  const ticks=kind==='sev'?[0,5,10]:kind==='stress'?[1,3,5]:[0,Math.round(mx/2),mx];
  let s='';
  ticks.forEach(t=>s+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="${pl-6}" y="${Y(t)+4}" text-anchor="end" font-size="10" fill="var(--muted)">${t}</text>`);
  const every=n<=8?1:n<=16?2:5;
  days.forEach((d,i)=>{
    if(i%every===0||i===n-1)s+=`<text x="${cx(i)}" y="${H-6}" text-anchor="middle" font-size="9" fill="var(--muted)">${d.l}</text>`;
    if(kind==='sev'&&d.sev!=null){const h=Math.max(2,Y(0)-Y(d.sev));s+=`<rect x="${cx(i)-bw/2}" y="${Y(d.sev)}" width="${bw}" height="${h}" rx="2" fill="${TC[sevTone(d.sev)]}"><title>${d.l}: ${d.sev.toFixed(1)}</title></rect>`}
    if(kind==='fod'){const hr=Y(0)-Y(d.red),ha=Y(0)-Y(d.amb);
      if(d.red)s+=`<rect x="${cx(i)-bw/2}" y="${Y(d.red)}" width="${bw}" height="${hr}" rx="2" fill="var(--red-dot)"><title>${d.l}: ${d.red} high FODMAP</title></rect>`;
      if(d.amb)s+=`<rect x="${cx(i)-bw/2}" y="${Y(d.red)-ha}" width="${bw}" height="${ha}" rx="2" fill="var(--amber-dot)"><title>${d.l}: ${d.amb} moderate</title></rect>`}
  });
  if(kind==='stress'){
    let pts=[],segs=[];days.forEach((d,i)=>{if(d.stress!=null)pts.push([cx(i),Y(d.stress)]);else if(pts.length){segs.push(pts);pts=[]}});if(pts.length)segs.push(pts);
    segs.forEach(p=>{if(p.length>1)s+=`<path d="${p.map((q,i)=>(i?'L':'M')+q[0]+' '+q[1]).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`});
    days.forEach((d,i)=>{if(d.stress!=null)s+=`<circle cx="${cx(i)}" cy="${Y(d.stress)}" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="1.5"><title>${d.l}: stress ${d.stress}/5</title></circle>`});
  }
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${kind} chart">${s}</svg></div>`;
}
function insights(days){
  const w=days.filter(d=>d.sev!=null),rows=[];
  const hi=w.filter(d=>d.stress!=null&&d.stress>=4),lo=w.filter(d=>d.stress!=null&&d.stress<=2);
  const rd=w.filter(d=>d.red>0),nr=w.filter(d=>d.red===0&&d.meals>0);
  const line=(label,a)=>a.length?{label,v:avg(a.map(d=>d.sev)),n:a.length}:null;
  const stressRows=[line('High-stress days',hi),line('Calmer days',lo)].filter(Boolean),fodRows=[line('Days with a red meal',rd),line('Days with no red meals',nr)].filter(Boolean);
  const say=(rowsA,a,b)=>rowsA.length===2?(Math.abs(rowsA[0].v-rowsA[1].v)<1?'No clear difference in your symptoms between these days yet.':rowsA[0].v>rowsA[1].v?`Symptoms averaged ${(rowsA[0].v-rowsA[1].v).toFixed(1)} points higher on ${a.toLowerCase()} than on ${b.toLowerCase()}.`:`Symptoms averaged ${(rowsA[1].v-rowsA[0].v).toFixed(1)} points lower on ${a.toLowerCase()} than on ${b.toLowerCase()}.`):'Log more days of both kinds to see a comparison.';
  return {stressRows,fodRows,stressSay:say(stressRows,'high-stress days','calmer days'),fodSay:say(fodRows,'days with a red meal','days without red meals')};
}
function cmpBlock(rows,sayText){
  return `<div class="cmp">${rows.map(r=>`<div class="comp"><span>${r.label}</span><div class="bar"><i class="${sevTone(r.v)}" style="width:${r.v*10}%"></i></div><span>${r.v.toFixed(1)} <span class="muted">(${r.n}d)</span></span></div>`).join('')}</div><p class="small">${sayText}</p>`;
}
function trends(){
  const days=dayData(Tr.days),ins=insights(days);
  const counts=[0,0,0,0,0,0,0,0];days.forEach(d=>d.bristol.forEach(b=>counts[b]++));const tot=counts.reduce((a,b)=>a+b,0);
  const flares=days.filter(d=>d.sev!=null&&d.sev>=4).length;
  return `<section class="sec"><header><h1>Trends</h1><p class="sub">See how your symptoms line up with stress and the FODMAPs you ate.</p></header>
  <div class="row">${[7,14,30].map(n=>`<button class="chip" aria-pressed="${Tr.days===n}" data-act="trDays" data-v="${n}">Last ${n} days</button>`).join('')}</div>
  <div class="panel sec"><h3>Stress, FODMAPs and symptoms together</h3>${lineLegend()}${lineChart(days)}${lineNotes(days)}</div>
  <div class="panel sec"><div class="row" style="justify-content:space-between"><h3>Symptom severity</h3><span class="small muted">Daily average, 0–10</span></div>${miniChart(days,'sev')}
   <div class="row" style="justify-content:space-between"><h3>Stress</h3><span class="small muted">Highest level each day, 1–5</span></div>${miniChart(days,'stress')}
   <div class="row" style="justify-content:space-between"><h3>FODMAP intake</h3><span class="small muted"><span class="dot r" style="width:9px;height:9px"></span> high meals <span class="dot a" style="width:9px;height:9px;margin-left:6px"></span> moderate meals</span></div>${miniChart(days,'fod')}
   <p class="small muted">Read down the charts: do tall symptom bars line up with stress spikes or red-meal days?</p></div>
  <div class="grid2"><div class="panel sec" style="--h:265"><h3>Symptoms and stress</h3>${cmpBlock(ins.stressRows,ins.stressSay)}</div>
   <div class="panel sec"><h3>Symptoms and FODMAP intake</h3>${cmpBlock(ins.fodRows,ins.fodSay)}</div></div>
  <div class="panel sec"><h3>Correlation by FODMAP type</h3>${corrPanel(days)}</div>
  <div class="panel sec"><h3>Stool types</h3>${tot?`<div class="sec" style="gap:7px">${[1,2,3,4,5,6,7].map(n=>`<div class="comp" style="grid-template-columns:130px 1fr 28px"><span>Type ${n} · ${BR[n].k}</span><div class="bar"><i class="${BR[n].t}" style="width:${Math.round(counts[n]/tot*100)}%"></i></div><span>${counts[n]}</span></div>`).join('')}</div>`:'<p class="muted">Log stool types in the Symptoms tab to see the spread.</p>'}
   <p class="small muted">${flares} day${flares===1?'':'s'} with average severity of 4 or more in this period.</p></div>
  <div class="panel sec toned tone-g" style="border-color:var(--line)"><h2>Report for your doctor</h2><p class="sub" style="color:var(--ink)">Create a PDF of your food diary, symptoms and trends to share at an appointment.</p>
   <div class="row">${[14,30,90].map(n=>`<button class="chip" aria-pressed="${Ex.days===n}" data-act="exDays" data-v="${n}">Last ${n} days</button>`).join('')}</div>
   <div class="row">${[['food','Food diary'],['sym','Symptoms & stool'],['meds','Medication & supplements'],['tr','Trends summary'],['photos','Meal photos']].map(([k,l])=>`<button class="chip" aria-pressed="${Ex[k]}" data-act="exTog" data-v="${k}">${l}</button>`).join('')}</div>
   <div class="row"><button class="btn" data-act="exportPdf">Download PDF report</button></div></div>
  <div class="panel sec"><h3>Your data</h3><p class="sub">Everything is stored only in this browser. Export a backup, or move it to another browser or device.</p>
   <div class="row"><button class="btn ghost small" data-act="exportData">Export as JSON</button><label class="btn ghost small" for="importFile" style="cursor:pointer">Import JSON</label>
    <input id="importFile" type="file" accept="application/json" data-in="importFile" style="position:absolute;opacity:0;width:1px;height:1px"></div></div>
  </section>`;
}

/* ---------- Combined lines ---------- */
const SER=[
  {n:'Symptom severity',c:'var(--l-sev)',rgb:[194,37,92],get:d=>d.sev},
  {n:'Stress',c:'var(--l-stress)',rgb:[68,83,166],get:d=>d.stress==null?null:d.stress*2},
  {n:'FODMAP load',c:'var(--l-fod)',rgb:[14,138,138],get:d=>d.meals?Math.min(10,d.red*3.5+d.amb*1.5):null},
  {n:'Sleep quality',c:'var(--l-sleep)',rgb:[132,82,166],get:d=>d.sleep==null?null:d.sleep*2}];
function crossings(days){
  const out=[];
  for(let a=0;a<SER.length;a++)for(let b=a+1;b<SER.length;b++)for(let i=0;i<days.length-1;i++){
    const a0=SER[a].get(days[i]),a1=SER[a].get(days[i+1]),b0=SER[b].get(days[i]),b1=SER[b].get(days[i+1]);
    if([a0,a1,b0,b1].some(v=>v==null))continue;
    const d0=a0-b0,d1=a1-b1;
    if(d0*d1<0||(d1===0&&d0!==0)||(i===0&&d0===0)){const t=d0===d1?0:d0/(d0-d1);out.push({i:i+t,v:a0+t*(a1-a0)})}
  }
  return out;
}
function allHigh(days){return days.filter(d=>d.sev!=null&&d.sev>=4&&d.stress!=null&&d.stress>=4&&d.red>=1)}
function lineChart(days){
  const W=340,H=210,pl=28,pr=12,pt=10,pb=24,n=days.length,X=i=>pl+(n===1?(W-pl-pr)/2:i*(W-pl-pr)/(n-1)),Y=v=>pt+(1-v/10)*(H-pt-pb);
  let s='';
  [0,2,4,6,8,10].forEach(v=>s+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-dasharray="${v?'3 4':''}"/><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end" font-size="10" fill="var(--muted)">${v}</text>`);
  const every=Math.ceil(n/7);
  days.forEach((d,i)=>{if(i%every===0||i===n-1)s+=`<text x="${X(i)}" y="${H-7}" text-anchor="middle" font-size="9" fill="var(--muted)">${d.l}</text>`});
  SER.forEach(sr=>{
    let seg=[];const flush=()=>{if(seg.length>1)s+=`<path d="${seg.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')}" fill="none" stroke="${sr.c}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;seg=[]};
    days.forEach((d,i)=>{const v=sr.get(d);if(v==null)flush();else seg.push([X(i),Y(v)])});flush();
    if(n<=31)days.forEach((d,i)=>{const v=sr.get(d);if(v!=null)s+=`<circle cx="${X(i)}" cy="${Y(v)}" r="3.2" fill="${sr.c}" stroke="var(--surface)" stroke-width="1.2"><title>${d.l}: ${sr.n} ${v.toFixed(1)}/10</title></circle>`});
  });
  crossings(days).forEach(c=>s+=`<circle cx="${X(c.i)}" cy="${Y(c.v)}" r="7" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Stress, FODMAP load and symptom severity plotted together">${s}</svg></div>`;
}
function lineLegend(){return `<div class="row" style="gap:14px">${SER.map(r=>`<span class="small" style="display:inline-flex;align-items:center;gap:6px"><i style="display:inline-block;width:18px;height:4px;border-radius:2px;background:${r.c}"></i>${r.n}</span>`).join('')}<span class="small" style="display:inline-flex;align-items:center;gap:6px"><i style="display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid var(--ink)"></i>Lines cross</span></div>`}
function lineNotes(days){
  const cr=crossings(days).length,hi=allHigh(days);
  return `<p class="small muted">All four share one 0–10 scale. Stress and sleep quality (1–5) are doubled; higher sleep quality means better sleep. FODMAP load counts each high meal as 3.5 points and each moderate meal as 1.5, up to 10. Where lines meet, those measures were at the same level on the same day.</p>
  <p class="small">${cr?`The lines crossed <b>${cr}</b> time${cr===1?'':'s'} in this period.`:'No crossings yet in this period.'} ${hi.length?`Days when symptoms, stress and a high FODMAP meal all came together: <b>${hi.map(d=>d.l).join(', ')}</b>.`:'No day in this period had high symptoms, high stress and a high FODMAP meal together.'}</p>`;
}
function pdfLines(doc,x,y,w,h,days){
  const pl=24,pr=8,pt=6,pb=16,n=days.length,pw=w-pl-pr,ph=h-pt-pb,px=x+pl,py=y+pt;
  const X=i=>px+(n===1?pw/2:i*pw/(n-1)),Y=v=>py+ph*(1-v/10);
  doc.setFont('helvetica','normal').setFontSize(7.5).setTextColor(110,120,118);
  [0,2,4,6,8,10].forEach(v=>{doc.setDrawColor(222,227,223).setLineWidth(.5).line(px,Y(v),px+pw,Y(v));doc.text(String(v),px-4,Y(v)+2.5,{align:'right'})});
  const every=Math.ceil(n/8);days.forEach((d,i)=>{if(i%every===0||i===n-1)doc.text(d.l,X(i),y+h-4,{align:'center'})});
  SER.forEach(sr=>{
    doc.setDrawColor(...sr.rgb).setFillColor(...sr.rgb).setLineWidth(1.6);
    days.forEach((d,i)=>{const v=sr.get(d);if(v==null)return;
      if(i<n-1){const v2=sr.get(days[i+1]);if(v2!=null)doc.line(X(i),Y(v),X(i+1),Y(v2))}
      if(n<=31)doc.circle(X(i),Y(v),1.9,'F')});
  });
  crossings(days).forEach(c=>{doc.setDrawColor(30,40,38).setLineWidth(1);doc.circle(X(c.i),Y(c.v),4.5,'S')});
  let lx=px;const ly=y+h+10;
  SER.forEach(sr=>{doc.setDrawColor(...sr.rgb).setLineWidth(2.4).line(lx,ly-2.5,lx+16,ly-2.5);doc.setTextColor(60,70,68).text(sr.n,lx+20,ly);lx+=26+doc.getTextWidth(sr.n)+12});
  doc.setDrawColor(30,40,38).setLineWidth(1).circle(lx+4,ly-2.5,3.5,'S');doc.text('Lines cross',lx+11,ly);
}


/* ---------- Correlation by FODMAP type ---------- */
function pearson(xs,ys){
  const n=xs.length;if(n<3)return null;
  const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;
  let sxy=0,sxx=0,syy=0;
  for(let i=0;i<n;i++){const dx=xs[i]-mx,dy=ys[i]-my;sxy+=dx*dy;sxx+=dx*dx;syy+=dy*dy}
  if(sxx===0||syy===0)return null;
  return sxy/Math.sqrt(sxx*syy);
}
const corrLabel=r=>{const a=Math.abs(r);return a>=.6?'Strong':a>=.4?'Moderate':a>=.2?'Weak':'Very weak'};
function correlateFodmap(days){
  const paired=days.filter(d=>d.sev!=null&&d.typeLoad);
  if(paired.length<5)return null;
  return ['Fr','G','L','F','S','M'].map(t=>({t,r:pearson(paired.map(d=>d.typeLoad[t]||0),paired.map(d=>d.sev)),n:paired.length}))
    .filter(o=>o.r!=null).sort((a,b)=>Math.abs(b.r)-Math.abs(a.r));
}
function corrPanel(days){
  const rows=correlateFodmap(days);
  if(!rows||!rows.length)return `<p class="muted">Log at least 5 days that each have both a meal and a symptom check-in to see correlation strength per FODMAP type.</p>`;
  return `<div class="sec" style="gap:7px">${rows.map(o=>{
    const pct=Math.round(Math.abs(o.r)*100),tn=Math.abs(o.r)>=.4?(o.r>0?'r':'g'):'a';
    return `<div class="comp" style="grid-template-columns:130px 1fr 100px"><span>${TYPES[o.t].n}</span><div class="bar"><i class="${tn}" style="width:${pct}%"></i></div><span>${corrLabel(o.r)}${o.r>.05?' \u2191':o.r<-.05?' \u2193':''}</span></div>`;
  }).join('')}</div>
  <p class="small muted">Pearson correlation (r) between how much of each FODMAP type you ate that day and that day\u2019s average symptom severity, over ${rows[0].n} paired days. A stronger upward link (\u2191) suggests that type may be worth testing carefully in reintroduction. This is a pattern in your own log, not proof of cause.</p>`;
}

/* ---------- PDF export ---------- */
const ps=s=>String(s==null?'':s).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^\x20-\x7E\xA0-\xFF\n]/g,'');
async function exportPdf(){
  const J=window.jspdf;if(!J||!J.jsPDF)return toast('PDF tools did not load. Check your connection.');
  const doc=new J.jsPDF({unit:'pt',format:'a4'}),PW=doc.internal.pageSize.getWidth(),PH=doc.internal.pageSize.getHeight(),M=40,n=Ex.days,since=Date.now()-n*DAY;
  let y=54;
  const room=h=>{if(y+h>PH-50){doc.addPage();y=50}};
  const H=t=>{room(60);doc.setFont('helvetica','bold').setFontSize(13).setTextColor(30,40,38);doc.text(ps(t),M,y);y+=8;doc.setDrawColor(68,83,166).setLineWidth(1.2).line(M,y,PW-M,y);y+=16};
  const P=(t,size=10,col=[60,70,68])=>{doc.setFont('helvetica','normal').setFontSize(size).setTextColor(...col);const ls=doc.splitTextToSize(ps(t),PW-2*M);room(ls.length*(size+3));doc.text(ls,M,y);y+=ls.length*(size+3)+4};
  const T=(head,body,opts={})=>{doc.autoTable(Object.assign({startY:y,head:[head],body,margin:{left:M,right:M,top:50},styles:{fontSize:8.5,cellPadding:4,textColor:[30,40,38]},headStyles:{fillColor:[68,83,166],textColor:255},alternateRowStyles:{fillColor:[246,248,246]}},opts));y=doc.lastAutoTable.finalY+20};
  const rateCell=col=>d=>{if(d.section==='body'&&d.column.index===col){const v=d.cell.raw;const c=v==='Red'?[248,219,216]:v==='Amber'?[251,235,198]:v==='Green'?[220,240,226]:null;if(c)d.cell.styles.fillColor=c}};
  doc.setFont('helvetica','bold').setFontSize(22).setTextColor(68,83,166);doc.text('Gutlight gut health report',M,y);y+=20;
  P(`Generated ${new Date().toLocaleDateString([],{day:'numeric',month:'long',year:'numeric'})}. Covers the last ${n} days.`);
  P('Self-reported data recorded in the Gutlight app, for discussion with a healthcare professional. Food ratings follow the Monash University traffic-light approach using a curated list, not the licensed Monash database. This report is not a diagnosis.',9,[100,110,108]);y+=4;
  const days=dayData(n),sy=S.sym.filter(x=>x.ts>=since).sort((a,b)=>a.ts-b.ts),ml=S.meals.filter(m=>m.ts>=since).sort((a,b)=>a.ts-b.ts);
  const keys=days.map(d=>d.k),sc=score(keys),sevAvg=avg(sy.map(x=>x.sev)),stAvg=avg(sy.filter(x=>x.stress).map(x=>x.stress));
  const rated=ml.filter(m=>m.level);
  H('Summary');
  T(['Measure','Value'],[
    ['Gut score (period average)',sc?`${sc.v} / 100 (${TW[tone(sc.v)]})`:'Not enough data'],
    ['Symptom check-ins',String(sy.length)],
    ['Average symptom severity',sevAvg==null?'-':sevAvg.toFixed(1)+' / 10'],
    ['Check-ins with severity 4 or more',String(sy.filter(x=>x.sev>=4).length)],
    ['Average stress level',stAvg==null?'-':stAvg.toFixed(1)+' / 5'],
    ['Meals logged',`${ml.length} (${rated.filter(m=>m.level==='r').length} high, ${rated.filter(m=>m.level==='a').length} moderate, ${rated.filter(m=>m.level==='g').length} low FODMAP)`]
  ],{columnStyles:{0:{cellWidth:200,fontStyle:'bold'}}});
  if(Ex.tr){
    H('Trends');
    const ins=insights(days);
    P('Symptoms and stress: '+ins.stressSay+(ins.stressRows.length?' ('+ins.stressRows.map(r=>`${r.label}: ${r.v.toFixed(1)} avg over ${r.n} days`).join('; ')+')':''));
    P('Symptoms and FODMAP intake: '+ins.fodSay+(ins.fodRows.length?' ('+ins.fodRows.map(r=>`${r.label}: ${r.v.toFixed(1)} avg over ${r.n} days`).join('; ')+')':''));
    const trg=triggers();if(trg&&trg.groups.length)P('Possible triggers: across '+trg.n+' flares, the FODMAP groups most often eaten in the prior 24 hours were '+trg.groups.map(g=>`${TYPES[g[0]].n} (${g[1]}/${trg.n})`).join(', ')+'. This is a pattern in self-reported data, not proof of cause.');
    const corr=correlateFodmap(days);
    if(corr&&corr.length)P('Correlation by FODMAP type (same-day Pearson r, '+corr[0].n+' paired days): '+corr.map(o=>`${TYPES[o.t].n} r=${o.r.toFixed(2)} (${corrLabel(o.r)})`).join('; ')+'.');
    y+=4;
    room(250);P('Stress, FODMAP load and symptom severity on one 0-10 scale. Stress (1-5) is doubled. FODMAP load = 3.5 points per high meal and 1.5 per moderate meal, up to 10. Circles mark where two lines cross.',8.5,[100,110,108]);
    pdfLines(doc,M,y,PW-2*M,190,days);y+=190+26;
    const hi=allHigh(days);P(hi.length?'Days when symptoms, stress and a high FODMAP meal all came together: '+hi.map(d=>d.l).join(', ')+'.':'No day in this period had high symptoms, high stress and a high FODMAP meal together.');y+=4;
    T(['Date','Avg severity','Stress (1-5)','High FODMAP meals','Moderate meals','Low FODMAP meals','Stool types'],days.filter(d=>d.sev!=null||d.meals).map(d=>[d.l,d.sev==null?'-':d.sev.toFixed(1),d.stress==null?'-':d.stress,d.red,d.amb,d.grn,d.bristol.join(', ')||'-']));
  }
  if(Ex.sym){
    H('Symptom log');
    const lifeStr=x=>{const parts=[];if(x.sleep)parts.push('Sleep '+SLEEPQ[x.sleep-1]);if(x.water)parts.push('Water '+x.water);if(x.fibre)parts.push('Fibre '+FIBRE[x.fibre]);if(x.caffeine)parts.push('Caffeine '+x.caffeine);if(x.alcohol)parts.push('Alcohol '+x.alcohol);return parts.join(', ')||'-'};
    if(sy.length)T(['Date and time','Symptoms','Severity','Stool (Bristol)','Stress','Lifestyle','Notes'],sy.map(x=>[new Date(x.ts).toLocaleString([],{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}),x.s.length?x.s.join(', '):'None',x.sev+'/10',x.bristol?`Type ${x.bristol}: ${BR[x.bristol].k}`:'-',x.stress?STRESS[x.stress-1]:'-',lifeStr(x),x.note||'']),{columnStyles:{1:{cellWidth:85},5:{cellWidth:95},6:{cellWidth:70}}});
    else P('No symptom check-ins in this period.');
    P('Bristol stool scale: types 1-2 suggest constipation, 3-4 are normal, 5-7 suggest loose stools or diarrhoea.',8.5,[100,110,108]);y+=6;
  }
  if(Ex.meds){
    H('Medication & supplements');
    const md=S.meds.filter(m=>m.ts>=since).sort((a,b)=>a.ts-b.ts);
    if(md.length)T(['Date and time','Name','Dose','Notes'],md.map(m=>[new Date(m.ts).toLocaleString([],{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}),m.name,m.dose||'-',m.note||'']),{columnStyles:{1:{cellWidth:150}}});
    else P('No medications or supplements logged in this period.');
  }
  if(Ex.food){
    H('Food diary');
    if(ml.length)T(['Date and time','Meal','What was eaten','FODMAP','High FODMAP items'],ml.map(m=>[new Date(m.ts).toLocaleString([],{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}),m.type,m.text,m.level?LVS[m.level]:'Unrated',m.ids.map(i=>FOODS[i]).filter(f=>f&&f.l==='r').map(f=>f.n).join(', ')||'None']),{columnStyles:{2:{cellWidth:170}},didParseCell:rateCell(3)});
    else P('No meals logged in this period.');
  }
  if(Ex.photos){
    const ph=ml.filter(m=>m.img).slice(-24);
    if(ph.length){
      doc.addPage();y=50;H('Meal photos');
      const cw=(PW-2*M-20)/3,ih=cw*.75;let col=0;
      ph.forEach(m=>{
        if(col===0)room(ih+44);
        const x=M+col*(cw+10);
        try{const pr=doc.getImageProperties(m.img),r=Math.min(cw/pr.width,ih/pr.height);doc.addImage(m.img,'JPEG',x,y,pr.width*r,pr.height*r)}catch(e){}
        doc.setFont('helvetica','normal').setFontSize(8).setTextColor(60,70,68);
        doc.text(doc.splitTextToSize(ps(new Date(m.ts).toLocaleDateString([],{day:'numeric',month:'short'})+' '+m.type+': '+m.text),cw).slice(0,2),x,y+ih+10);
        if(++col===3){col=0;y+=ih+38}
      });
    }
  }
  const pages=doc.getNumberOfPages();
  for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFont('helvetica','normal').setFontSize(8).setTextColor(130,140,138);doc.text(`Gutlight report - page ${i} of ${pages}`,PW/2,PH-24,{align:'center'})}
  const fname='gutlight-report-'+dkey(Date.now())+'.pdf';
  try{doc.save(fname);toast('Report downloaded')}catch(e){toast('Could not save the PDF')}
}
function importDataFile(file){
  const r=new FileReader();
  r.onload=()=>{
    let incoming;
    try{incoming=JSON.parse(r.result)}catch(e){toast('That file could not be read as Gutlight data.');return}
    let added=0;
    ['meals','sym','breath','meds','recipes'].forEach(k=>{
      if(!Array.isArray(incoming[k]))return;
      const have=new Set(S[k].map(x=>x.id));
      incoming[k].forEach(item=>{if(item&&item.id&&!have.has(item.id)){S[k].push(item);added++}});
    });
    if(added&&S.demo)S.demo=false;
    save();render();toast(added?`Imported ${added} item${added===1?'':'s'}`:'Nothing new to import \u2014 it may already be here');
  };
  r.onerror=()=>toast('Could not read that file');
  r.readAsText(file);
}

/* ---------- Router & events ---------- */
const V={home,log,symptoms,foods,breathe,trends};
const NAV=[['home','Home','<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],['log','Log','<path d="M9 4h6v3H9z"/><path d="M7 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1"/><path d="M8 12h8M8 16h5"/>'],['symptoms','Symptoms','<path d="M3 12h4l2-6 4 12 2-6h6"/>'],['foods','Foods','<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" stroke-width="3"/>'],['trends','Trends','<path d="M3 20h18M6 20v-7M11 20V6M16 20v-10"/>']];
let cur='home';
function render(){
  if(Scan.active)stopScan();
  $('#view').innerHTML=V[cur]();
  const navKey=cur==='breathe'?'home':cur;
  document.querySelectorAll('#nav button').forEach(b=>b.getAttribute('data-v')===navKey?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'));
}
function go(v,noScroll){
  if(v==='builder'){FoodsTab='builder';v='foods'}
  if(v==='learn')v='home';
  if(cur==='breathe'&&v!=='breathe'){stopBreath();sndStop();if(Br.mode==='run')Br.mode='setup'}
  if(cur==='log'&&v!=='log'&&Scan.active)stopScan();
  cur=V[v]?v:'home';render();if(!noScroll)window.scrollTo(0,0);
  try{history.replaceState(null,'','#'+cur)}catch(e){}
}
function toast(m){
  const t=document.createElement('div');t.textContent=m;t.setAttribute('role','status');
  t.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(88px + env(safe-area-inset-bottom,0px));background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:10px;z-index:50;font-weight:600;font-size:.9rem';
  document.body.appendChild(t);setTimeout(()=>t.remove(),2200);
}
const ACT={
  go:el=>go(el.dataset.v),
  startScan(){
    const video=$('#scanVideo'),box=$('#scanbox'),startBtn=$('#scanStartBtn');
    if(!video||!box)return;
    if(typeof ZXing==='undefined'){toast('The scanning library didn\u2019t load. Check your connection, or type a barcode instead.');return}
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('This browser can\u2019t access the camera. Type a barcode instead.');return}
    box.hidden=false;startBtn.hidden=true;
    scanReader=scanReader||new ZXing.BrowserMultiFormatReader();
    Scan.active=true;
    scanReader.decodeFromConstraints({video:{facingMode:{ideal:'environment'}}},video,(result)=>{
      if(result&&Scan.active){
        const code=result.getText();
        stopScan();box.hidden=true;startBtn.hidden=false;
        lookupBarcode(code);
      }
    }).then(c=>{scanControls=c}).catch(e=>{
      Scan.active=false;box.hidden=true;startBtn.hidden=false;
      const blocked=e&&(e.name==='NotAllowedError'||e.name==='PermissionDeniedError');
      toast(blocked?'Camera access was blocked. Allow it in your browser\u2019s site settings, or type a barcode instead.':e&&e.name==='NotFoundError'?'No camera was found on this device. Type a barcode instead.':'Couldn\u2019t start the camera. Type a barcode instead.');
    });
  },
  foodsTab(el){FoodsTab=el.dataset.v;render()},
  stopScanAct(){stopScan();const box=$('#scanbox'),startBtn=$('#scanStartBtn');if(box)box.hidden=true;if(startBtn)startBtn.hidden=false},
  exportData(){
    const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='gutlight-data-'+dkey(Date.now())+'.json';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Data exported');
  },

  specify(el){L.text=L.text.trim()+(L.text.trim()?', ':'')+el.dataset.v;render()},
  rmPhoto(){L.img=null;render()},
  viewImg(el){const m=S.meals.find(x=>x.id===el.dataset.id);if(!m)return;const o=document.createElement('div');o.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:60;display:grid;place-items:center;padding:16px';o.innerHTML='<img alt="Meal photo" style="max-width:100%;max-height:88vh;border-radius:12px">';o.firstChild.src=m.img;o.onclick=()=>o.remove();document.body.appendChild(o)},
  trDays(el){Tr.days=+el.dataset.v;render()},
  exDays(el){Ex.days=+el.dataset.v;render()},
  exTog(el){Ex[el.dataset.v]=!Ex[el.dataset.v];render()},
  exportPdf,
  clearDemo(){S={meals:[],sym:[],breath:[],meds:[],recipes:[],demo:false,seeded:true};save();render();toast('Example data cleared')},
  example(){L.text='Chicken stir fry with garlic, onion, broccoli, soy sauce and rice';render()},
  saveMeal(){
    if(!L.text.trim()&&!L.img)return toast('Add a description or photo first');
    const a=analyze(L.text),m={id:uid(),ts:Date.now(),type:L.type,text:L.text.trim()||'Photo meal',ids:a.items.map(f=>f.id),level:a.level};
    if(L.img)m.img=L.img;
    S.meals.push(m);
    if(!save()){delete m.img;if(!save()){S.meals.pop();return toast('Storage is full. Delete some old meals.')}toast('Saved, but the photo was too big to keep')}else toast('Saved to your food diary');
    L.text='';L.img=null;render();
  },
  delMeal(el){S.meals=S.meals.filter(m=>m.id!==el.dataset.id);save();render()},
  togSym(el){const s=el.dataset.v,i=Yf.s.indexOf(s);i<0?Yf.s.push(s):Yf.s.splice(i,1);if(Yf.s.length&&Yf.sev===0)Yf.sev=3;render()},
  allClear(){Yf.s=[];Yf.sev=0;render()},
  bristol(el){const n=+el.dataset.v;Yf.bristol=Yf.bristol===n?0:n;render()},
  stress(el){const n=+el.dataset.v;Yf.stress=Yf.stress===n?0:n;render()},
  sleepQ(el){const n=+el.dataset.v;Yf.sleep=Yf.sleep===n?0:n;render()},
  fibreQ(el){const n=+el.dataset.v;Yf.fibre=Yf.fibre===n?0:n;render()},
  step(el){const id=el.dataset.id,d=+el.dataset.d;if(!(id in Yf))return;Yf[id]=Math.max(0,Math.min(20,(Yf[id]||0)+d));render()},
  medPick(el){Md.name=Md.name===el.dataset.v?'':el.dataset.v;render()},
  saveMed(){
    if(!Md.name.trim())return toast('Enter a medication or supplement name');
    const t=new Date(Md.when).getTime();
    S.meds.push({id:uid(),ts:isNaN(t)?Date.now():t,name:Md.name.trim(),dose:Md.dose.trim(),note:Md.note.trim()});
    save();Md={name:'',dose:'',note:'',when:inputTs()};render();toast('Logged');
  },
  delMed(el){S.meds=S.meds.filter(m=>m.id!==el.dataset.id);save();render()},
  bSaveRecipe(){
    const sel=[...B.ids];if(!sel.length)return toast('Add some foods to your plate first');
    const name=(B.name||'').trim()||('Recipe '+(S.recipes.length+1));
    S.recipes.push({id:uid(),name,type:B.type,ids:sel});save();render();toast('Saved as a recipe you can reuse');
  },
  bLoadRecipe(el){const r=S.recipes[+el.dataset.v];if(!r)return;B.ids=new Set(r.ids.filter(id=>FOODS[id]));B.name=r.name;if(r.type)B.type=r.type;render()},
  bDelRecipe(el){S.recipes.splice(+el.dataset.v,1);save();render()},
  saveSym(){
    const t=new Date(Yf.when).getTime();
    S.sym.push({id:uid(),ts:isNaN(t)?Date.now():t,s:Yf.s.slice(),sev:Yf.sev,bristol:Yf.bristol,stress:Yf.stress,sleep:Yf.sleep,water:Yf.water,fibre:Yf.fibre,caffeine:Yf.caffeine,alcohol:Yf.alcohol,note:Yf.note.trim()});
    save();Yf={s:[],sev:3,bristol:0,stress:0,sleep:0,water:0,fibre:0,caffeine:0,alcohol:0,note:'',when:inputTs()};render();toast('Check-in saved');
  },
  delSym(el){S.sym=S.sym.filter(x=>x.id!==el.dataset.id);save();render()},
  setLv(el){Fq.lv=el.dataset.v;render()},
  bTog(el){const i=+el.dataset.v;B.ids.has(i)?B.ids.delete(i):B.ids.add(i);render()},
  bPreset(el){B.ids=new Set(PRESETS[+el.dataset.v][1].map(FID));B.name=PRESETS[+el.dataset.v][0];render()},
  bSurprise(){
    const pick=(c,n)=>{const p=FOODS.filter(f=>f.c===c&&f.l==='g').sort(()=>Math.random()-.5);return p.slice(0,n).map(f=>f.id)};
    B.ids=new Set([...pick('P',1),...pick('G',1),...pick('V',2),...pick('S',2)]);B.name='';render();
  },
  bClear(){B.ids=new Set();B.name='';render()},
  bSave(){
    const sel=[...B.ids].map(i=>FOODS[i]);if(!sel.length)return;
    const lvl=sel.some(f=>f.l==='r')?'r':sel.some(f=>f.l==='a')?'a':'g';
    S.meals.push({id:uid(),ts:Date.now(),type:B.type,text:(B.name?B.name+': ':'')+sel.map(f=>f.n).join(', '),ids:sel.map(f=>f.id),level:lvl});
    save();B.ids=new Set();B.name='';render();toast('Meal saved to your food diary');
  },
  bPat(el){Br.pat=+el.dataset.v;render()},
  bMins(el){Br.mins=+el.dataset.v;render()},
  bSnd(el){Br.snd=el.dataset.v;document.querySelectorAll('[data-act="bSnd"]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===Br.snd));if(Snd.on||Br.mode==='run'){Br.snd==='off'?sndStop():sndStart(Br.snd)};const sp=$('#sprev');if(sp)sp.textContent=Snd.on?'Stop preview':'Listen'},
  sndPrev(el){if(Snd.on){sndStop();el.textContent='Listen'}else if(Br.snd==='off')toast('Pick a sound first');else{sndStart(Br.snd);el.textContent='Stop preview'}},
  bStart:startBreath,
  bStop:finishBreath,
  bSaveSess(){S.breath.push({id:uid(),ts:Date.now(),pat:PATS[Br.pat].n,secs:Br.secs,pre:Br.pre,post:Br.post,thought:Br.thought,reframe:Br.reframe});save();Br.mode='setup';Br.thought=Br.reframe='';render();toast('Session saved')},
  bSkip(){Br.mode='setup';render()}
};
const IN={
  mtext(el){L.text=el.value;$('#mres').innerHTML=resultHtml(L.text)},
  mtype(el){L.type=el.value},
  mphoto(el){const f=el.files&&el.files[0];if(!f)return;shrink(f).then(u=>{L.img=u;render()}).catch(()=>toast('Could not read that photo'))},
  sev(el){Yf.sev=+el.value;$('#sevv').textContent=el.value+' / 10'},
  when(el){Yf.when=el.value},
  snote(el){Yf.note=el.value},
  fq(el){Fq.q=el.value;$('#fres').innerHTML=foodRows()},
  fcat(el){Fq.cat=el.value;$('#fres').innerHTML=foodRows()},
  fty(el){Fq.ty=el.value;$('#fres').innerHTML=foodRows()},
  bamb(el){B.amber=el.checked;render()},
  bname(el){B.name=el.value},
  btype(el){B.type=el.value},
  bvol(el){Br.vol=+el.value;document.querySelectorAll('[data-in="bvol"]').forEach(x=>x.value=el.value);if(Snd.master)Snd.master.gain.setTargetAtTime(Br.vol*SND_GAIN,Snd.ctx.currentTime,.05)},
  bpre(el){Br.pre=+el.value;$('#bprev').textContent=el.value+' / 10'},
  bpost(el){Br.post=+el.value;$('#bpostv').textContent=el.value+' / 10'},
  bth(el){Br.thought=el.value},
  brf(el){Br.reframe=el.value},
  medname(el){Md.name=el.value},
  meddose(el){Md.dose=el.value},
  medwhen(el){Md.when=el.value},
  mednote(el){Md.note=el.value},
  importFile(el){const f=el.files&&el.files[0];if(f)importDataFile(f);el.value=''}
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el&&ACT[el.dataset.act]){if(el.tagName==='A')e.preventDefault();ACT[el.dataset.act](el,e)}});
function inEv(e){const el=e.target.closest('[data-in]');if(!el||!IN[el.dataset.in])return;if((el.type==='file')!==(e.type==='change'))return;IN[el.dataset.in](el)}
document.addEventListener('input',inEv);document.addEventListener('change',inEv);
function shrink(file,max=900,q=.72){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',q))};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
$('#nav').innerHTML=NAV.map(([k,l,p])=>`<button data-act="go" data-v="${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>${l}</button>`).join('');
$('#today').textContent=new Date().toLocaleDateString([],{weekday:'long',day:'numeric',month:'long'});
go((location.hash||'').slice(1)||'home',true);

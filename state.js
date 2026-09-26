const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='gutwise.v1',DAY=864e5;
let S={meals:[],sym:[],breath:[],meds:[],recipes:[],demo:false,seeded:false};
try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
let _cloudSync=null; // set by auth.js once signed in: a fn that mirrors S to Firestore, debounced
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));if(_cloudSync)_cloudSync();return true}catch(e){return false}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const dkey=ts=>{const d=new Date(ts);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmtT=ts=>new Date(ts).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
const fmtD=ts=>{const k=dkey(ts);if(k===dkey(Date.now()))return 'Today';if(k===dkey(Date.now()-DAY))return 'Yesterday';return new Date(ts).toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})};
const light=l=>`<span class="light ${l}">${LV[l]}</span>`;
const tagsOf=f=>f.t.map(t=>`<span class="tag">${TYPES[t].n}</span>`).join('');
const inputTs=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)};

function seed(){
  const mid=new Date();mid.setHours(0,0,0,0);
  const at=(d,h)=>mid.getTime()-d*DAY+h*36e5;
  const M=(d,h,type,text)=>{const a=analyze(text);S.meals.push({id:uid(),ts:at(d,h),type,text,ids:a.items.map(f=>f.id),level:a.level})};
  const Y=(d,h,s,sev,b,st,note)=>S.sym.push({id:uid(),ts:at(d,h),s,sev,bristol:b,stress:st,note});
  M(6,8,'Breakfast','Porridge oats with blueberries and lactose-free milk');
  M(6,13,'Lunch','Chicken sandwich with wheat bread, lettuce and mayo');
  M(6,19,'Dinner','Pasta with garlic, onion and tomato sauce');
  M(5,8,'Breakfast','Scrambled eggs, sourdough spelt bread, butter');
  M(5,13,'Lunch','Salmon, rice, carrot and spinach');
  M(5,19,'Dinner','Beef stir fry with soy sauce, capsicum, rice noodles and ginger');
  M(4,8,'Breakfast','Yoghurt with honey and banana');
  M(4,19,'Dinner','Chicken, potato, green beans and garlic-infused oil');
  M(3,8,'Breakfast','Oats, strawberries, almond milk');
  M(3,13,'Lunch','Tuna, cucumber, tomato, olives and olive oil');
  M(3,19,'Dinner','Pork chops with mashed potato and carrot');
  M(2,8,'Breakfast','Omelette with spinach and cheddar');
  M(2,13,'Lunch','Quinoa bowl with chicken, zucchini and lettuce');
  M(2,19,'Dinner','Curry with mushrooms, cauliflower and rice');
  M(1,8,'Breakfast','Gluten-free bread, peanut butter, banana');
  M(1,13,'Lunch','Rice, prawns, bok choy, ginger and soy sauce');
  M(1,19,'Dinner','Roast chicken, potatoes, parsnip and carrot');
  M(0,7,'Breakfast','Oats with blueberries and lactose-free milk');
  Y(6,21,['Bloating','Abdominal pain','Gas'],7,6,4,'After the pasta');
  Y(5,9,['Bloating'],3,5,3,'');
  Y(4,11,['Gas','Bloating'],5,6,3,'');
  Y(3,9,[],1,4,2,'Feeling good');
  Y(2,22,['Abdominal pain','Bloating','Diarrhoea'],6,7,4,'Curry night');
  Y(1,9,['Bloating'],2,4,2,'');
  const extra=(idx,vals)=>Object.assign(S.sym[idx],vals);
  extra(0,{sleep:2,water:3,fibre:1,caffeine:3,alcohol:2});
  extra(1,{sleep:3,water:5,fibre:2,caffeine:2,alcohol:0});
  extra(2,{sleep:3,water:4,fibre:2,caffeine:2,alcohol:0});
  extra(3,{sleep:4,water:7,fibre:3,caffeine:1,alcohol:0});
  extra(4,{sleep:2,water:4,fibre:1,caffeine:3,alcohol:1});
  extra(5,{sleep:4,water:6,fibre:3,caffeine:1,alcohol:0});
  S.breath.push({id:uid(),ts:at(2,17),pat:'Calm exhale',secs:180,pre:7,post:4,thought:''},{id:uid(),ts:at(4,20),pat:'Box',secs:120,pre:6,post:4,thought:''});
  S.meds.push({id:uid(),ts:at(6,21),name:'Peppermint oil capsule',dose:'1 capsule',note:'After the pasta flare-up'});
  S.meds.push({id:uid(),ts:at(3,8),name:'Probiotic',dose:'1 capsule',note:''});
  S.meds.push({id:uid(),ts:at(0,8),name:'Probiotic',dose:'1 capsule',note:''});
  S.recipes.push({id:uid(),name:'Chicken rice bowl',type:'Dinner',ids:['Chicken','White rice','Carrot','Leafy greens','Garlic-infused oil','Fresh herbs'].map(n=>FOODS.find(f=>f.n===n).id)});
  S.demo=true;S.seeded=true;save();
}
if(!S.seeded&&!S.meals.length&&!S.sym.length)seed();

function score(keys){
  const set=new Set(keys),ms=S.meals.filter(m=>m.level&&set.has(dkey(m.ts))),ss=S.sym.filter(x=>set.has(dkey(x.ts))),comps=[];
  if(ss.length)comps.push({k:'Symptoms',w:50,v:1-ss.reduce((a,x)=>a+x.sev,0)/ss.length/10});
  const bm=ss.filter(x=>x.bristol);
  if(bm.length){const q=[0,.25,.6,1,1,.6,.25,0];comps.push({k:'Stool type',w:20,v:bm.reduce((a,x)=>a+q[x.bristol],0)/bm.length})}
  if(ms.length){const r=ms.filter(m=>m.level==='r').length,a=ms.filter(m=>m.level==='a').length;comps.push({k:'Low FODMAP meals',w:30,v:Math.max(0,1-(r+a*.35)/ms.length)})}
  if(!comps.length)return null;
  const W=comps.reduce((a,c)=>a+c.w,0);
  return {v:Math.round(100*comps.reduce((a,c)=>a+c.w*c.v,0)/W),comps};
}
const tone=v=>v>=70?'g':v>=45?'a':'r';
const band=v=>({g:'Settled',a:'Unsettled',r:'Flaring'})[tone(v)];
const TW={g:'Good',a:'Medium',r:'Poor'},TC={g:'var(--green-dot)',a:'var(--amber-dot)',r:'var(--red-dot)'};

function triggers(){
  const flares=S.sym.filter(x=>x.sev>=4);
  if(flares.length<2)return null;
  const tally={},foods={};
  flares.forEach(fl=>{
    const gs=new Set(),fs=new Set();
    S.meals.filter(m=>m.ts<fl.ts&&fl.ts-m.ts<=DAY).forEach(m=>m.ids.forEach(id=>{
      const f=FOODS[id];if(!f||f.l==='g')return;
      f.t.forEach(t=>gs.add(t));if(f.l==='r')fs.add(f.n);
    }));
    gs.forEach(t=>tally[t]=(tally[t]||0)+1);fs.forEach(n=>foods[n]=(foods[n]||0)+1);
  });
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4);
  return {n:flares.length,groups:top(tally),foods:top(foods)};
}

function weeklyDigest(){
  const now=Date.now(),avgArr=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  const wkKeys=off=>[...Array(7)].map((_,i)=>dkey(now-(off*7+(6-i))*DAY));
  const curK=wkKeys(0),prevK=wkKeys(1),curSet=new Set(curK),prevSet=new Set(prevK);
  const curSym=S.sym.filter(x=>curSet.has(dkey(x.ts))),prevSym=S.sym.filter(x=>prevSet.has(dkey(x.ts)));
  const curMeals=S.meals.filter(m=>m.level&&curSet.has(dkey(m.ts))),prevMeals=S.meals.filter(m=>m.level&&prevSet.has(dkey(m.ts)));
  if(!curSym.length&&!curMeals.length)return null;
  const curSev=avgArr(curSym.map(x=>x.sev)),prevSev=avgArr(prevSym.map(x=>x.sev));
  const redDays=(meals,keys)=>keys.filter(k=>meals.some(m=>dkey(m.ts)===k&&m.level==='r')).length;
  const curRed=redDays(curMeals,curK),prevRed=redDays(prevMeals,prevK);
  const curScore=score(curK),prevScore=score(prevK);
  const parts=[];
  if(curSev!=null&&prevSev!=null){const d=+(prevSev-curSev).toFixed(1);if(Math.abs(d)>=.2)parts.push(`your average severity was <b>${d>0?'down':'up'} ${Math.abs(d).toFixed(1)} points</b>`)}
  if((prevMeals.length||curMeals.length)&&curRed!==prevRed)parts.push(`red-meal days ${curRed<prevRed?'fell':'rose'} from <b>${prevRed} to ${curRed}</b>`);
  let text;
  if(parts.length)text='This week '+parts.join(', and ')+', compared with last week.';
  else if(prevSym.length||prevMeals.length)text='This week looks about as steady as last week.';
  else text='Keep logging through the week — Gutwise will start comparing week over week once there’s data for both.';
  const tn=curScore&&prevScore?(curScore.v>=prevScore.v?(curScore.v===prevScore.v?null:'up'):'down'):null;
  return {text,curScore,prevScore,dir:tn};
}


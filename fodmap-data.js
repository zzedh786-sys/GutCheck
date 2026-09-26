// GutCheck FODMAP data + analyzer
// Curated traffic-light list based on published Monash University FODMAP
// guidance, and a small local text-matching engine. Not the licensed
// Monash database itself -- see README.md.
const CATS={P:'Protein',G:'Grains & starches',V:'Vegetables',F:'Fruit',D:'Dairy & alternatives',N:'Nuts & seeds',S:'Sauces, oils & herbs',X:'Drinks & extras'};
const LV={g:'Low FODMAP',a:'Moderate',r:'High FODMAP'};
const LVS={g:'Green',a:'Amber',r:'Red'};
const TYPES={
  F:{n:'Excess fructose',grp:'Monosaccharide',why:'Fructose is absorbed less well when there is more fructose than glucose in a food.'},
  L:{n:'Lactose',grp:'Disaccharide',why:'Lactose needs the enzyme lactase to be absorbed; many people make too little.'},
  Fr:{n:'Fructans',grp:'Oligosaccharide',why:'Humans cannot digest fructans, so they reach the large bowel and ferment.'},
  G:{n:'GOS',grp:'Oligosaccharide',why:'Galacto-oligosaccharides also pass undigested into the large bowel and ferment.'},
  S:{n:'Sorbitol',grp:'Polyol',why:'Sugar alcohol that is poorly absorbed and draws water into the bowel.'},
  M:{n:'Mannitol',grp:'Polyol',why:'Sugar alcohol that is poorly absorbed and draws water into the bowel.'}
};
// cat|Display=alias/alias|level|types|serve or note|low-FODMAP swap
const RAW=`P|Chicken=chicken/chicken breast/chicken thigh/chicken wings|g||Plain meat has no FODMAPs. Check marinades and coatings.|
P|Beef=beef/steak/mince/minced beef/ground beef/burger patty|g||Plain meat has no FODMAPs. Check for onion or garlic added.|
P|Pork=pork/bacon/ham/gammon|g||Plain cuts are fine. Check cured meats for garlic or onion.|
P|Lamb=lamb|g||Plain meat has no FODMAPs.|
P|Turkey=turkey|g||Plain meat has no FODMAPs.|
P|Fish=fish/salmon/tuna/cod/haddock/trout/mackerel/sardines/white fish|g||Plain fish has no FODMAPs.|
P|Prawns=prawns/prawn/shrimp|g||Plain shellfish has no FODMAPs.|
P|Eggs=eggs/egg/omelette/omelet/scrambled eggs|g||Eggs have no FODMAPs.|
P|Firm tofu=firm tofu/tofu|g||Firm, drained tofu is low FODMAP.|
P|Tempeh=tempeh|g||Low in normal serves.|
P|Silken tofu=silken tofu/soft tofu|r|G|Silken tofu is high in GOS.|Firm tofu
P|Sausages=sausages/sausage|a|Fr|Often contain onion, garlic or wheat rusk. Choose plain, gluten-free ones.|Plain meat or gluten-free sausages
P|Canned lentils=canned lentils/tinned lentils|a|G|About 1/4 cup (46 g) drained is low FODMAP.|
P|Lentils=lentils/red lentils/green lentils/brown lentils|r|G|Larger serves are high in GOS.|Canned lentils, small serve
P|Canned chickpeas=canned chickpeas/tinned chickpeas|a|G|About 1/4 cup (42 g) drained is low FODMAP.|
P|Chickpeas=chickpeas/chickpea/falafel|r|G|Dried or large serves are high in GOS.|Canned chickpeas, small serve
P|Hummus=hummus|a|G,Fr|Small serve only, around 1 tablespoon.|
P|Kidney beans=kidney beans/black beans/butter beans/haricot beans/borlotti beans/beans|r|G|High in GOS.|Canned lentils, small serve
P|Baked beans=baked beans|r|G,F|High in GOS and often has onion and garlic.|Firm tofu or eggs
G|White rice=rice/white rice/basmati rice/jasmine rice/brown rice/risotto rice/sushi rice|g||Rice is low FODMAP.|
G|Rice noodles=rice noodles/rice noodle/vermicelli|g||Low FODMAP.|
G|Oats=oats/porridge/porridge oats/rolled oats/oatmeal|g||About 1/2 cup (52 g) dry oats is low FODMAP.|
G|Quinoa=quinoa|g||Low FODMAP.|
G|Polenta & corn tortilla=polenta/cornmeal/corn tortilla/corn tortillas/grits|g||Low FODMAP.|
G|Potato=potato/potatoes/chips/fries/mash/mashed potato/roast potatoes/jacket potato|g||Low FODMAP.|
G|Sweet potato=sweet potato/sweet potatoes|a|M|About 1/2 cup (75 g) is low FODMAP.|
G|Sourdough spelt bread=sourdough spelt bread/spelt sourdough/spelt bread|g||Traditional spelt sourdough is low FODMAP in 2 slices.|
G|Gluten-free bread=gluten-free bread/gluten free bread/gf bread|g||Usually low FODMAP. Check for inulin, honey or soy flour.|
G|Sourdough bread=sourdough bread/sourdough|a|Fr|Wheat sourdough is lower than regular bread but check your serve.|Sourdough spelt bread
G|Wheat bread=bread/white bread/toast/sandwich/sandwiches/bagel|a|Fr|About 1 slice is low FODMAP; two or more slices are high in fructans.|Gluten-free bread
G|Wholemeal & rye bread=wholemeal bread/whole wheat bread/rye bread/multigrain bread/brown bread|r|Fr|High in fructans.|Sourdough spelt bread
G|Wheat pasta=pasta/wheat pasta/spaghetti/penne/macaroni/lasagne/fusilli|a|Fr|About 1/2 cup cooked (70 g) is low FODMAP; a full bowl is high.|Gluten-free pasta
G|Gluten-free pasta=gluten-free pasta/gluten free pasta/gf pasta|g||Rice or corn based pasta is low FODMAP.|
G|Couscous=couscous|a|Fr|Small serve only, about 1/4 cup cooked.|Quinoa or rice
G|Wheat flour=flour/wheat flour/plain flour/breadcrumbs|a|Fr|Small amounts in cooking are usually tolerated.|Gluten-free flour
G|Barley & rye=barley/rye/pearl barley|r|Fr|High in fructans.|Oats or quinoa
G|Wheat tortilla=wrap/wraps/tortilla/tortillas/pita/pitta/naan|a|Fr|Wheat wraps are high in larger serves.|Corn tortilla
G|Cornflakes=cornflakes/corn flakes/rice krispies/puffed rice|g||Plain versions are low FODMAP.|
G|Rice cakes & crackers=rice cakes/rice cake/rice crackers/oatcakes|g||Low FODMAP.|
G|Popcorn=popcorn|g||Plain popcorn is low FODMAP in about 7 cups.|
V|Carrot=carrot/carrots|g||Low FODMAP.|
V|Cucumber=cucumber|g||Low FODMAP.|
V|Tomato=tomato/tomatoes/cherry tomatoes|g||Common tomato is low FODMAP in normal serves.|
V|Leafy greens=lettuce/rocket/arugula/spinach/baby spinach/kale/salad leaves/salad|g||Low FODMAP.|
V|Bok choy=bok choy/pak choi|g||Low FODMAP.|
V|Zucchini=zucchini/courgette|g||About 1/2 cup (65 g) is low FODMAP.|
V|Capsicum=capsicum/bell pepper/red pepper/green pepper/peppers|g||Low FODMAP.|
V|Green beans=green beans/french beans/runner beans|g||Low FODMAP.|
V|Aubergine=aubergine/eggplant|g||About 1 cup (75 g) is low FODMAP.|
V|Parsnip, swede & turnip=parsnip/swede/turnip/radish/radishes|g||Low FODMAP.|
V|Ginger=ginger|g||Low FODMAP.|
V|Olives=olives/olive|g||Low FODMAP in normal serves.|
V|Spring onion (green tops)=spring onion/spring onions/scallion/scallions/green onion/chives|g||Use the green tops only. The white bulb is high FODMAP.|
V|Pumpkin=pumpkin|g||Kent/Jap pumpkin is low FODMAP in about 1/2 cup.|
V|Butternut squash=butternut squash/butternut/squash|a|Fr,G|About 1/4 cup (45 g) is low FODMAP.|Pumpkin
V|Celery=celery|a|M|A small piece, under 1/4 stalk, is low FODMAP.|Carrot or cucumber
V|Sweetcorn=sweetcorn/corn/corn on the cob|a|M,S|About 1/2 cob is low FODMAP.|
V|Broccoli=broccoli|a|Fr|About 3/4 cup of heads is low FODMAP. Stalks are higher.|
V|Cabbage=cabbage/coleslaw|a|F,M|About 3/4 cup common cabbage is low FODMAP.|Bok choy
V|Brussels sprouts=brussels sprouts/brussel sprouts|a|Fr,G|About 2 sprouts is low FODMAP.|Green beans
V|Fennel=fennel/fennel bulb|a|F,M|Small serve, about 1/2 cup.|
V|Beetroot=beetroot/beets|a|G|About 2 slices is low FODMAP.|Carrot
V|Snow peas=snow peas/mange tout|a|M,S|About 5 pods is low FODMAP.|Green beans
V|Avocado=avocado|a|S|About 1/8 avocado (30 g) is low FODMAP.|Olives
V|Tomato paste=tomato paste|a|F|About 2 tablespoons is low FODMAP.|
V|Mushrooms=mushrooms/mushroom/button mushrooms|r|M|Button mushrooms are high in mannitol.|Zucchini or capsicum
V|Cauliflower=cauliflower|r|M,F|High in mannitol.|Broccoli heads, small serve
V|Onion=onion/onions/red onion/white onion/brown onion/onion powder|r|Fr|One of the highest fructan foods.|Spring onion green tops or garlic-infused oil
V|Garlic=garlic/garlic powder/garlic salt/garlic clove/garlic cloves/garlic bread|r|Fr|Very high in fructans, even in small amounts.|Garlic-infused oil
V|Shallot & leek=shallot/shallots/leek/leeks|r|Fr|High in fructans.|Spring onion green tops
V|Asparagus & artichoke=asparagus/artichoke/artichokes|r|F,Fr|High in fructose and fructans.|Green beans
V|Peas=peas/green peas|r|G,M|High in GOS and mannitol.|Green beans
F|Strawberries=strawberries/strawberry|g||About 10 medium strawberries is low FODMAP.|
F|Blueberries=blueberries/blueberry|g||About 1/4 cup (40 g) is low FODMAP.|
F|Raspberries=raspberries/raspberry|g||About 1/3 cup is low FODMAP.|
F|Orange=orange/oranges|g||1 medium orange is low FODMAP.|
F|Mandarin=mandarin/mandarins/clementine/clementines|g||Low FODMAP.|
F|Grapes=grapes/grape|g||About 1/2 cup is low FODMAP.|
F|Kiwi=kiwi/kiwifruit/kiwi fruit|g||Low FODMAP.|
F|Pineapple=pineapple|g||About 1 cup is low FODMAP.|
F|Banana=banana/bananas|g||A firm, just-ripe banana is low FODMAP. Very ripe ones are higher.|
F|Melon (cantaloupe)=cantaloupe/rockmelon|g||Low FODMAP.|
F|Lemon & lime=lemon/lime/lemon juice/lime juice|g||Low FODMAP.|
F|Passionfruit & papaya=passionfruit/papaya/pawpaw|g||Low FODMAP.|
F|Rhubarb=rhubarb|g||Low FODMAP.|
F|Dried fruit=raisins/sultanas/dried fruit|a|F|About 1 tablespoon is low FODMAP.|Fresh blueberries
F|Honeydew melon=honeydew|a|F|Small serve only.|Cantaloupe
F|Apple=apple/apples|r|F,S|High in fructose and sorbitol.|Orange or kiwi
F|Pear=pear/pears|r|F,S|High in fructose and sorbitol.|Kiwi or grapes
F|Mango=mango/mangoes|r|F|High in excess fructose in larger serves.|Pineapple
F|Peach & nectarine=peach/peaches/nectarine/nectarines|r|F,S|High in fructose and sorbitol.|Strawberries
F|Plum, apricot & cherry=plum/plums/apricot/apricots/cherries/cherry/prunes|r|S,F|High in sorbitol.|Grapes
F|Watermelon=watermelon|r|F,M,Fr|High in fructose, mannitol and fructans.|Cantaloupe
F|Blackberries=blackberries/blackberry|r|S|High in sorbitol.|Raspberries or blueberries
F|Dates & figs=dates/date/figs/fig|r|F,Fr|High in fructose and fructans.|Raisins, small serve
F|Apple juice=apple juice|r|F,S|High in fructose and sorbitol.|Orange juice, 1/2 cup
F|Orange juice=orange juice|g||About 1/2 cup (125 ml) is low FODMAP.|
D|Lactose-free milk=lactose-free milk/lactose free milk|g||Low FODMAP.|
D|Almond milk=almond milk|g||Low FODMAP.|
D|Rice milk=rice milk|g||Low FODMAP.|
D|Coconut milk=coconut milk/coconut cream|g||Carton or canned in modest serves.|
D|Oat milk=oat milk|a|Fr|Small serve, about 1/8 cup.|Almond milk
D|Soy milk=soy milk|a|G,Fr|Milk made from soy protein is lower. Whole-bean soy milk is high.|Almond milk
D|Milk=milk/cow's milk/whole milk/skimmed milk/semi-skimmed milk|r|L|High in lactose.|Lactose-free milk
D|Cheese (hard & aged)=cheese/cheddar/parmesan/swiss cheese/brie/camembert/feta/mozzarella/halloumi/gouda/edam|g||Hard and aged cheeses are naturally low in lactose.|
D|Cottage cheese=cottage cheese|a|L|About 2 tablespoons is low FODMAP.|
D|Ricotta=ricotta/mascarpone|a|L|About 2 tablespoons is low FODMAP.|
D|Cream cheese=cream cheese|a|L|About 2 tablespoons is low FODMAP.|
D|Cream=cream/double cream/single cream|a|L|Small serve, about 1/4 cup.|Lactose-free cream
D|Sour cream=sour cream|a|L|About 2 tablespoons is low FODMAP.|
D|Yoghurt=yoghurt/yogurt|r|L|High in lactose.|Lactose-free yoghurt
D|Lactose-free yoghurt=lactose-free yoghurt/lactose-free yogurt/lactose free yoghurt|g||Low FODMAP.|
D|Butter & ghee=butter/ghee|g||Very low in lactose.|
D|Margarine=margarine|g||Low FODMAP.|
D|Ice cream & custard=ice cream/custard/milkshake|r|L|High in lactose.|Sorbet or lactose-free ice cream
N|Peanuts=peanuts/peanut/peanut butter|g||About 32 peanuts is low FODMAP.|
N|Walnuts & pecans=walnuts/walnut/pecans/pecan/macadamia/macadamias|g||Low FODMAP in a small handful.|
N|Seeds=pumpkin seeds/sunflower seeds/chia seeds/flaxseed/linseed/sesame seeds/pine nuts/poppy seeds|g||Low FODMAP in normal serves.|
N|Almonds=almonds/almond/almond butter|a|G|About 10 almonds is low FODMAP.|Walnuts
N|Hazelnuts=hazelnuts/hazelnut|a|G,Fr|About 10 nuts is low FODMAP.|Walnuts
N|Cashews & pistachios=cashews/cashew/pistachios/pistachio|r|G,Fr|High in GOS and fructans.|Macadamias or walnuts
S|Cooking oils=olive oil/vegetable oil/canola oil/coconut oil/sunflower oil/sesame oil/oil|g||Oils contain no FODMAPs.|
S|Garlic-infused oil=garlic-infused oil/garlic infused oil/garlic oil|g||FODMAPs are not oil soluble, so infused oil gives flavour without the fructans.|
S|Fresh herbs=basil/parsley/coriander/cilantro/mint/thyme/rosemary/oregano/sage/dill|g||Low FODMAP.|
S|Spices=salt/pepper/paprika/cumin/turmeric/cinnamon/chilli/chili/cayenne|g||Low FODMAP in normal amounts.|
S|Mustard=mustard|g||Low FODMAP.|
S|Mayonnaise=mayonnaise/mayo|g||Low FODMAP. Check for garlic or onion powder.|
S|Soy sauce=soy sauce/tamari/fish sauce/oyster sauce|g||About 2 tablespoons is low FODMAP.|
S|Vinegar=vinegar/white vinegar/rice vinegar/red wine vinegar/apple cider vinegar|g||Low FODMAP.|
S|Maple syrup=maple syrup|g||Low FODMAP.|
S|Sugar=sugar/white sugar/brown sugar|g||Table sugar is low FODMAP.|
S|Jam=jam/strawberry jam/marmalade|g||Strawberry or orange-based jam is low FODMAP.|
S|Curry powder=curry powder/curry paste/curry/garam masala|a|Fr|Often contains garlic or onion. Check the label.|Plain spices with garlic-infused oil
S|Ketchup=ketchup/tomato ketchup|a|F|About 1 sachet (13 g) is low FODMAP.|
S|Balsamic vinegar=balsamic vinegar|a|F|About 2 teaspoons is low FODMAP.|
S|Pasta sauce=pasta sauce/tomato sauce/passata|r|Fr,F|Shop sauces almost always contain onion and garlic.|Passata with garlic-infused oil and herbs
S|Stock=stock/stock cube/stock cubes/broth/bouillon/gravy|r|Fr|Usually contains onion and garlic.|Low FODMAP stock or homemade broth without onion
S|Barbecue sauce=barbecue sauce/bbq sauce/hoisin/sweet chilli sauce/teriyaki sauce|r|Fr,F|Contains onion, garlic and often high-fructose sweeteners.|Mustard, mayonnaise or soy sauce
S|Pesto=pesto|r|Fr|Traditional pesto contains garlic.|Basil with garlic-infused oil
S|White sauce=white sauce/bechamel/cheese sauce|r|L,Fr|Made with milk and wheat flour.|
S|Honey=honey/agave/high fructose corn syrup/fructose|r|F|High in excess fructose.|Maple syrup
X|Coffee=coffee|g||Black coffee is low FODMAP, but caffeine can still irritate the gut.|
X|Tea=tea/black tea/green tea/peppermint tea/white tea|g||Black, green and peppermint tea are low FODMAP.|
X|Herbal tea (chamomile & fennel)=chamomile tea/fennel tea/chamomile/dandelion tea|r|F,Fr|Strong infusions are high in fructans.|Peppermint tea
X|Wine=wine/red wine/white wine|g||One standard glass is low FODMAP. Alcohol can still trigger symptoms.|
X|Dark chocolate=dark chocolate/chocolate/cocoa|a|F,L|About 30 g (a few squares) is low FODMAP.|
X|Milk chocolate=milk chocolate|a|L|A small serve, about 20 g, is low FODMAP.|Dark chocolate
X|Polyol sweeteners=sorbitol/mannitol/xylitol/maltitol/isomalt/sugar free/sugar-free gum/chewing gum|r|S,M|Sugar alcohols are polyols and often laxative.|Table sugar or maple syrup
X|Inulin & chicory root=inulin/chicory root/chicory|r|Fr|Added to many bars, yoghurts and "high fibre" foods.|
X|Crisps=crisps/potato chips/tortilla chips|g||Plain salted chips are low FODMAP.|
X|Coconut water=coconut water|r|S,Fr|Higher in polyols.|Water`;
const FOODS=RAW.split('\n').map((ln,i)=>{
  const [c,nm,l,t,note,swap]=ln.split('|');
  let disp=nm,al=nm;
  if(nm.includes('=')){[disp,al]=nm.split('=');}
  const terms=al.split('/').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const nk=disp.toLowerCase().replace(/\(.*?\)/g,'').trim();
  if(!terms.includes(nk))terms.unshift(nk);
  return {id:i,c,n:disp,l,t:t?t.split(','):[],note,swap:swap||'',terms};
});
const TERMS=[];
FOODS.forEach(f=>f.terms.forEach(t=>TERMS.push({t,f,re:new RegExp("(?<![a-z])"+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'[ -]')+"(?:s|es)?(?![a-z])",'g')})));
TERMS.sort((a,b)=>b.t.length-a.t.length);
const STOP=new Set('with,and,the,for,from,fresh,plain,large,small,medium,cup,cups,tbsp,tsp,gram,grams,sliced,chopped,diced,boiled,fried,grilled,baked,roasted,steamed,served,side,bowl,plate,some,little,lots,handful,piece,pieces,slice,slices,about,into,over,then,mixed,homemade,had,ate,for,one,two,three,half,extra,cooked,raw,dry,dried,pan,stir,fry,soup,salad,sandwich,breakfast,lunch,dinner,snack,meal,made,using,not,but,also,without,free,low,fodmap,style,topped,top,in,on,of,a,an,to,my,i,it,or,at'.split(','));
const FAMS=[['Wheat bread',['Sourdough spelt bread','Gluten-free bread','Sourdough bread','Wholemeal & rye bread']],['Wheat pasta',['Gluten-free pasta']],['Milk',['Lactose-free milk','Almond milk','Rice milk','Oat milk','Soy milk','Coconut milk']],['Yoghurt',['Lactose-free yoghurt']],['Wheat tortilla',['Polenta & corn tortilla']]];
const FAM={};FAMS.forEach(([g,sp])=>{FAM[FOODS.find(f=>f.n===g).id]=sp.map(n=>FOODS.find(f=>f.n===n))});
function analyze(text){
  const src=' '+String(text||'').toLowerCase().replace(/[’‘]/g,"'")+' ';
  const used=new Array(src.length).fill(false),found=new Map();
  for(const {t,f,re} of TERMS){
    re.lastIndex=0;let m;
    while((m=re.exec(src))){
      const a=m.index,b=a+m[0].length;
      let clash=false;for(let i=a;i<b;i++)if(used[i]){clash=true;break}
      if(clash)continue;
      for(let i=a;i<b;i++)used[i]=true;
      if(!found.has(f.id))found.set(f.id,f);
    }
  }
  for(const gid of Object.keys(FAM)){if(found.has(+gid)&&FAM[gid].some(s=>found.has(s.id)))found.delete(+gid)}
  let rest='';for(let i=0;i<src.length;i++)rest+=used[i]?' ':src[i];
  const unknown=[...new Set(rest.split(/[^a-z'-]+/).filter(w=>w.length>2&&!STOP.has(w)))];
  const items=[...found.values()].sort((a,b)=>'rag'.indexOf(a.l)-'rag'.indexOf(b.l));
  const level=items.some(f=>f.l==='r')?'r':items.some(f=>f.l==='a')?'a':items.length?'g':null;
  return {items,unknown,level};
}

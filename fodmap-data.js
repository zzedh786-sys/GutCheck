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
P|Sausages & processed meats=sausages/sausage/salami/chorizo/pepperoni/hot dog/hot dogs/frankfurter/sausage roll|r|Fr|Monash and NHS guidance list sausages and other processed meats as high FODMAP: they usually contain onion, garlic or wheat. Some brands are certified low FODMAP, so check the label.|Plain cooked meat or a certified low FODMAP sausage
P|Canned lentils=canned lentils/tinned lentils|a|G|About 1/2 cup drained is low FODMAP. Draining and rinsing removes some of the GOS.|
P|Lentils=lentils/red lentils/green lentils/brown lentils|r|G|Larger serves are high in GOS.|Canned lentils, small serve
P|Canned chickpeas=canned chickpeas/tinned chickpeas|a|G|About 1/4 cup (42 g) drained is low FODMAP.|
P|Chickpeas=chickpeas/chickpea/falafel|r|G|Dried or large serves are high in GOS.|Canned chickpeas, small serve
P|Hummus=hummus|a|G,Fr|Small serve only, around 1 tablespoon.|
P|Kidney beans=kidney beans/black beans/butter beans/haricot beans/borlotti beans/beans/split peas|r|G|High in GOS.|Canned lentils, small serve
P|Baked beans=baked beans|a|G,F|Only about 1/4 cup (35 g) of canned baked beans is low FODMAP. A normal serve is high in GOS, and many sauces add onion or garlic.|Eggs or firm tofu
G|White rice=rice/white rice/basmati rice/jasmine rice/brown rice/risotto rice/sushi rice|g||Rice is low FODMAP.|
G|Rice noodles=rice noodles/rice noodle/vermicelli|g||Low FODMAP.|
G|Oats=oats/porridge/porridge oats/rolled oats/oatmeal|g||About 1/2 cup (52 g) dry oats is low FODMAP.|
G|Quinoa=quinoa/quinoa flakes/millet|g||Low FODMAP.|
G|Polenta & corn tortilla=polenta/cornmeal/corn tortilla/corn tortillas/grits|g||Low FODMAP.|
G|Potato=potato/potatoes/chips/fries/mash/mashed potato/roast potatoes/jacket potato|g||Low FODMAP.|
G|Sweet potato=sweet potato/sweet potatoes|a|M|About 1/2 cup (75 g) is low FODMAP.|
G|Sourdough spelt bread=sourdough spelt bread/spelt sourdough/spelt bread|g||Traditional spelt sourdough is low FODMAP in 2 slices.|
G|Gluten-free bread=gluten-free bread/gluten free bread/gf bread/gluten-free toast/gluten free toast/gluten-free sandwich/gluten free sandwich|g||Usually low FODMAP. Some contain soy or legume flours, inulin or honey, so check the label.|
G|Sourdough bread=sourdough bread/sourdough|a|Fr|Traditionally fermented sourdough made from spelt or oats is suitable. Wheat or rye sourdough usually stays high, so keep to one slice or choose spelt.|Sourdough spelt bread
G|Wheat bread=bread/white bread/toast/sandwich/sandwiches/bagel|a|Fr|About 1 slice is low FODMAP; two or more slices are high in fructans.|Gluten-free bread
G|Wholemeal & rye bread=wholemeal bread/whole wheat bread/rye bread/multigrain bread/brown bread|r|Fr|High in fructans.|Sourdough spelt bread
G|Wheat pasta=pasta/wheat pasta/spaghetti/penne/macaroni/lasagne/fusilli|a|Fr|About 1/2 cup cooked (70 g) is low FODMAP; a full bowl is high.|Gluten-free pasta
G|Gluten-free pasta=gluten-free pasta/gluten free pasta/gf pasta/rice pasta/corn pasta/quinoa pasta/gluten-free spaghetti/gluten free spaghetti|g||Rice or corn based pasta is low FODMAP.|
G|Couscous=couscous|a|Fr|Small serve only, about 1/4 cup cooked.|Quinoa or rice
G|Wheat flour=flour/wheat flour/plain flour/breadcrumbs/semolina/durum wheat/wheat/self-raising flour/wholemeal flour/bread flour|a|Fr|Small amounts in cooking are usually tolerated.|Gluten-free flour
G|Barley & rye=barley/rye/pearl barley/rye flour/rye crispbread/crispbread|r|Fr|High in fructans.|Oats or quinoa
G|Wheat tortilla=wrap/wraps/tortilla/tortillas/pita/pitta/naan|a|Fr|Wheat wraps are high in larger serves.|Corn tortilla
G|Cornflakes=cornflakes/corn flakes/rice krispies/puffed rice|g||Plain versions are low FODMAP.|
G|Rice cakes & crackers=rice cakes/rice cake/rice crackers/oatcakes|g||Low FODMAP.|
G|Popcorn=popcorn|g||Plain popcorn is low FODMAP in about 7 cups.|
V|Carrot=carrot/carrots|g||Low FODMAP.|
V|Cucumber=cucumber|g||Low FODMAP.|
V|Tomato=tomato/tomatoes/cherry tomatoes/canned tomato/canned tomatoes/tinned tomatoes/chopped tomatoes/plum tomato/plum tomatoes|g||Common tomato is low FODMAP in normal serves.|
V|Leafy greens=lettuce/rocket/arugula/spinach/baby spinach/kale/salad leaves/salad/collard greens|g||Low FODMAP.|
V|Bok choy=bok choy/pak choi|g||Low FODMAP.|
V|Zucchini=zucchini/courgette|g||About 1/2 cup (65 g) is low FODMAP.|
V|Capsicum=capsicum/bell pepper/bell peppers/peppers|a|Fr|Green capsicum is low FODMAP but red is higher in fructans. Say which colour for a more exact rating.|Green capsicum
V|Green beans=green beans/french beans/runner beans|g||Low FODMAP.|
V|Aubergine=aubergine/eggplant|g||About 1 cup (75 g) is low FODMAP.|
V|Parsnip, swede & turnip=parsnip/swede/turnip/radish/radishes/yam|g||Low FODMAP.|
V|Ginger=ginger|g||Low FODMAP.|
V|Olives=olives/olive|g||Low FODMAP in normal serves.|
V|Spring onion (green tops)=spring onion/spring onions/scallion/scallions/green onion/chives|g||Use the green tops only. The white bulb is high FODMAP.|
V|Pumpkin=pumpkin/kabocha/kent pumpkin/jap pumpkin|g||Kent/Jap pumpkin is low FODMAP in about 1/2 cup.|
V|Butternut squash=butternut squash/butternut/squash|a|Fr,G|About 1/4 cup (45 g) is low FODMAP.|Pumpkin
V|Celery=celery|a|M|A small piece, under 1/4 stalk, is low FODMAP.|Carrot or cucumber
V|Sweetcorn=sweetcorn/corn/corn on the cob|a|M,S|About 1/2 cob is low FODMAP.|
V|Broccoli=broccoli|a|Fr|About 3/4 cup of heads is low FODMAP. Stalks are higher.|
V|Cabbage=cabbage/red cabbage/white cabbage|g||Common green, white and red cabbage are low FODMAP in a standard serve (about 75 g). Savoy cabbage and larger serves are higher.|
V|Brussels sprouts=brussels sprouts/brussel sprouts|a|Fr,G|About 2 sprouts is low FODMAP.|Green beans
V|Fennel=fennel/fennel bulb|a|F,M|Small serve, about 1/2 cup.|
V|Beetroot=beetroot/beets|a|G|About 2 slices is low FODMAP.|Carrot
V|Snow peas=snow peas/mange tout|a|M,S|About 5 pods is low FODMAP.|Green beans
V|Avocado=avocado|a|S|About 1/8 avocado (30 g) is low FODMAP.|Olives
V|Tomato paste=tomato paste|a|F|About 2 tablespoons is low FODMAP.|
V|Mushrooms=mushrooms/mushroom/button mushrooms|r|M|Button mushrooms are high in mannitol.|Zucchini or capsicum
V|Cauliflower=cauliflower|r|M,F|High in mannitol.|Broccoli heads, small serve
V|Onion=onion/onions/red onion/white onion/brown onion/onion powder/onion salt/dried onion/onion granules/minced onion|r|Fr|One of the highest fructan foods.|Spring onion green tops or garlic-infused oil
V|Garlic=garlic/garlic powder/garlic salt/garlic clove/garlic cloves/garlic bread/garlic granules/dried garlic/minced garlic/crushed garlic|r|Fr|Very high in fructans, even in small amounts.|Garlic-infused oil
V|Shallot & leek=shallot/shallots/leek/leeks|r|Fr|High in fructans.|Spring onion green tops
V|Asparagus & artichoke=asparagus/artichoke/artichokes|r|F,Fr|High in fructose and fructans.|Green beans
V|Peas=peas/green peas|a|Fr,G|Green peas are high in fructans and GOS. Only limited quantities are low FODMAP; check the Monash app for the serve size.|Green beans
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
F|Passionfruit & papaya=passionfruit/papaya/pawpaw/star fruit/carambola|g||Low FODMAP.|
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
F|Apple juice=apple juice/pear juice/apple juice concentrate|r|F,S|High in fructose and sorbitol.|Orange juice, 1/2 cup
F|Orange juice=orange juice|g||About 1/2 cup (125 ml) is low FODMAP.|
D|Lactose-free milk=lactose-free milk/lactose free milk|g||Low FODMAP.|
D|Almond milk=almond milk|g||Low FODMAP.|
D|Rice milk=rice milk|g||Low FODMAP.|
D|Coconut milk=coconut milk/coconut cream|g||Carton or canned in modest serves.|
D|Oat milk=oat milk|a|Fr|Small serve, about 1/8 cup.|Almond milk
D|Soy milk=soy milk|a|G,Fr|Milk made from soy protein is lower. Whole-bean soy milk is high.|Almond milk
D|Milk=milk/cow's milk/whole milk/skimmed milk/semi-skimmed milk/evaporated milk/condensed milk/sweetened condensed milk/milk powder/skimmed milk powder/milk solids/whey powder/lactose|r|L|High in lactose.|Lactose-free milk
D|Cheese (hard & aged)=cheese/cheddar/parmesan/swiss cheese/brie/camembert/feta/mozzarella/gouda/edam|g||Hard and aged cheeses are naturally low in lactose.|
D|Cottage cheese=cottage cheese|a|L|About 2 tablespoons is low FODMAP.|
D|Ricotta & halloumi=ricotta/mascarpone/halloumi/haloumi|a|L|Ricotta, mascarpone and halloumi contain moderate amounts of lactose. About 2 tablespoons is low FODMAP.|
D|Cream cheese=cream cheese|a|L|About 2 tablespoons is low FODMAP.|
D|Cream=cream/double cream/single cream|a|L|Small serve, about 1/4 cup.|Lactose-free cream
D|Sour cream=sour cream|a|L|About 2 tablespoons is low FODMAP.|
D|Yoghurt=yoghurt/yogurt|r|L|High in lactose.|Lactose-free yoghurt
D|Lactose-free yoghurt=lactose-free yoghurt/lactose-free yogurt/lactose free yoghurt|g||Low FODMAP.|
D|Butter & ghee=butter/ghee|g||Very low in lactose.|
D|Margarine=margarine|g||Low FODMAP.|
D|Ice cream & custard=ice cream/custard/milkshake|r|L|High in lactose.|Sorbet or lactose-free ice cream
N|Peanuts=peanuts/peanut/peanut butter|g||About 32 peanuts is low FODMAP.|
N|Walnuts & pecans=walnuts/walnut/pecans/pecan/macadamia/macadamias/brazil nuts/brazil nut/chestnuts/chestnut|g||Low FODMAP in a small handful.|
N|Seeds=pumpkin seeds/sunflower seeds/chia seeds/flaxseed/linseed/sesame seeds/pine nuts/poppy seeds/hemp seeds|g||Low FODMAP in normal serves.|
N|Almonds=almonds/almond/almond butter|a|G|About 10 almonds is low FODMAP.|Walnuts
N|Hazelnuts=hazelnuts/hazelnut|a|G,Fr|About 10 nuts is low FODMAP.|Walnuts
N|Cashews & pistachios=cashews/cashew/pistachios/pistachio|r|G,Fr|High in GOS and fructans.|Macadamias or walnuts
S|Cooking oils=olive oil/vegetable oil/canola oil/coconut oil/sunflower oil/sesame oil/oil|g||Oils contain no FODMAPs.|
S|Garlic-infused oil=garlic-infused oil/garlic infused oil/garlic oil|g||FODMAPs are not oil soluble, so infused oil gives flavour without the fructans.|
S|Fresh herbs=basil/parsley/coriander/cilantro/mint/thyme/rosemary/oregano/sage/dill/tarragon/bay leaf/bay leaves/lemongrass/thai basil/kaffir lime leaves/curry leaves/pandan/fenugreek|g||Low FODMAP.|
S|Spices=salt/pepper/paprika/cumin/turmeric/cinnamon/chilli/chili/cayenne/cloves/nutmeg/saffron/cardamom/fennel seeds/star anise/galangal/asafoetida/mustard seeds/allspice/tamarind/capers|g||Most herbs and spices are low FODMAP (Monash). Avoid garlic and onion powders. Chilli is low FODMAP but can irritate some people with IBS.|
S|Mustard=mustard|g||Low FODMAP.|
S|Mayonnaise=mayonnaise/mayo|g||Low FODMAP. Check for garlic or onion powder.|
S|Soy sauce=soy sauce/tamari/fish sauce/oyster sauce/satay sauce/mint sauce|g||About 2 tablespoons is low FODMAP.|
S|Vinegar=vinegar/white vinegar/rice vinegar/red wine vinegar/apple cider vinegar|g||Low FODMAP.|
S|Maple syrup=maple syrup|g||Low FODMAP.|
S|Sugar=sugar/white sugar/brown sugar/glucose syrup/glucose/dextrose/rice malt syrup/caster sugar/icing sugar/cane sugar|g||Table sugar is low FODMAP.|
S|Jam=jam/strawberry jam/marmalade|g||Strawberry or orange-based jam is low FODMAP.|
S|Curry paste & garam masala=curry paste/curry sauce/garam masala/curry|a|Fr|Curry pastes and sauces usually contain garlic and onion. Check the label, or use plain curry powder with garlic-infused oil.|Plain curry powder
S|Ketchup=ketchup/tomato ketchup/tomato sauce|a|F|About 1 sachet (13 g) is low FODMAP.|
S|Balsamic vinegar=balsamic vinegar|a|F|About 2 teaspoons is low FODMAP.|
S|Pasta sauce=pasta sauce/bolognese sauce/jarred sauce/pizza sauce/simmer sauce/cooking sauce|r|Fr,F|Shop sauces almost always contain onion and garlic.|Plain passata with garlic-infused oil and herbs
S|Stock=stock/stock cube/stock cubes/broth/bouillon/gravy|r|Fr|Usually contains onion and garlic.|Low FODMAP stock or homemade broth without onion
S|Barbecue sauce=barbecue sauce/bbq sauce/hoisin/sweet chilli sauce/teriyaki sauce|a|Fr,F|Monash lists barbecue sauce and hoisin as low FODMAP, but many brands add onion, garlic or extra sweeteners. Check the label.|Mustard, mayonnaise or soy sauce
S|Pesto=pesto|r|Fr|Traditional pesto contains garlic.|Basil with garlic-infused oil
S|White sauce=white sauce/bechamel/cheese sauce|r|L,Fr|Made with milk and wheat flour.|
S|Honey=honey/agave/high fructose corn syrup/fructose/glucose-fructose syrup/fructose-glucose syrup/isoglucose/corn syrup|r|F|High in excess fructose.|Maple syrup
X|Coffee=coffee|g||Black coffee is low FODMAP, but caffeine can still irritate the gut.|
X|Tea=tea/black tea/green tea/peppermint tea/white tea|g||Black, green and peppermint tea are low FODMAP.|
X|Herbal tea (chamomile & fennel)=chamomile tea/fennel tea/chamomile/dandelion tea|r|F,Fr|Strong infusions are high in fructans.|Peppermint tea
X|Wine=wine/red wine/white wine|g||One standard glass is low FODMAP. Alcohol can still trigger symptoms.|
X|Dark chocolate=dark chocolate/chocolate/cocoa|a|F,L|About 30 g (a few squares) is low FODMAP.|
X|Milk chocolate=milk chocolate|a|L|A small serve, about 20 g, is low FODMAP.|Dark chocolate
X|Polyol sweeteners=sorbitol/mannitol/xylitol/maltitol/isomalt/sugar free/sugar-free gum/chewing gum/e420/e421/e953/e965/e967|r|S,M|Sugar alcohols are polyols and often laxative.|Table sugar or maple syrup
X|Inulin & chicory root=inulin/chicory root/chicory/oligofructose/fructo-oligosaccharides/fructooligosaccharides/chicory root fibre|r|Fr|Added to many bars, yoghurts and "high fibre" foods.|
X|Crisps=crisps/potato chips/tortilla chips|g||Plain salted chips are low FODMAP.|
X|Coconut water=coconut water|r|S,Fr|Higher in polyols.|Water
V|Oyster mushroom=oyster mushroom/oyster mushrooms|g||Oyster mushrooms are low FODMAP, unlike button mushrooms, which are high in mannitol.|
V|Green capsicum=green capsicum/green pepper/green bell pepper|g||Green capsicum is low FODMAP.|
V|Red capsicum=red capsicum/red pepper/red bell pepper|a|Fr|Red capsicum is higher in fructans than green, so keep serves small.|Green capsicum
V|Pickled beetroot=pickled beetroot/pickled beets|g||Pickled beetroot is low FODMAP in a standard serve (about 75 g).|
V|Coleslaw=coleslaw|a|Fr|Shop-bought coleslaw often contains onion. Homemade with cabbage, carrot and mayonnaise is fine.|Homemade coleslaw without onion
P|Canned beans & legumes=canned beans/tinned beans/canned kidney beans/tinned kidney beans/canned black beans/canned cannellini beans/canned mixed beans/canned borlotti beans/canned legumes/tinned legumes|a|G|Draining and rinsing canned legumes lowers the GOS. About 1/4 cup is a low FODMAP serve.|
P|Canned butter beans=canned butter beans/tinned butter beans|a|G|About 1/4 cup (42 g) drained is low FODMAP.|
P|Mung beans=mung beans/mung bean|a|G|About 1/4 cup (53 g) boiled and drained is low FODMAP.|
P|Marinated meat=marinated meat/marinated chicken/marinated fish/marinade|r|Fr|Marinades are usually based on garlic and onion.|Plain meat with garlic-infused oil and herbs
P|Vegetarian mince=vegetarian mince/veggie mince/meat-free mince/vegan mince|r|G,Fr|Vegetarian mince is high FODMAP (soy, onion and garlic).|Firm tofu or tempeh
G|Muesli & granola=muesli/granola|r|Fr|Often contains wheat, dried fruit and honey. Choose gluten-free, oat-based cereals.|Rolled oats or gluten-free cornflakes
G|Rice, corn & other wheat-free flours=rice flour/corn flour/cornflour/potato flour/tapioca flour/maize flour/gluten-free flour/gluten free flour/oat flour/spelt flour/buckwheat flour/quinoa flour|g||Wheat-free flours are low FODMAP. Check gluten-free mixes for soy or legume flours.|
G|Gluten-free couscous=gluten-free couscous|g||Low FODMAP.|
G|Soy flour=soy flour/soya flour/soybean flour|r|G|Soy flour is high in GOS (soy protein is lower).|Rice or corn flour
F|Canned lychee=canned lychee/tinned lychee/canned lychees|g||Canned lychee is low FODMAP.|
F|Cranberry juice=cranberry juice|g||Low FODMAP.|
S|Passata=passata|a|Fr|Plain passata is fine in moderate serves. Jarred sauces often add onion and garlic.|
S|Chutney=chutney|a|Fr,F|Chutneys are often made with onion, garlic and dried fruit. Check the label.|Jam, mustard or mayonnaise
S|Curry powder=curry powder/five spice/chinese five spice|g||Plain curry powder and five spice are low FODMAP. Check blends for added garlic or onion powder.|`;
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
const FAMS=[['Wheat bread',['Sourdough spelt bread','Gluten-free bread','Sourdough bread','Wholemeal & rye bread']],['Wheat pasta',['Gluten-free pasta']],['Milk',['Lactose-free milk','Almond milk','Rice milk','Oat milk','Soy milk','Coconut milk']],['Yoghurt',['Lactose-free yoghurt']],['Wheat tortilla',['Polenta & corn tortilla']],['Capsicum',['Green capsicum','Red capsicum']]];
const FAM={};FAMS.forEach(([g,sp])=>{FAM[FOODS.find(f=>f.n===g).id]=sp.map(n=>FOODS.find(f=>f.n===n))});
// "no onion", "without garlic", "garlic-free": the food is being left out, not eaten.
const NEG_BEFORE=/(?:^|[\s,;.(])(?:no|without|excluding|exclude|omit|omitting|minus|skip|avoid|avoiding|not\s+any)\s+(?:[a-z']+\s+){0,2}$/;
const NEG_AFTER=/^[\s-]*free\b/;
function isNegated(src,a,b){return NEG_BEFORE.test(src.slice(Math.max(0,a-32),a))||NEG_AFTER.test(src.slice(b,b+10))}
function analyze(text){
  // "infused with garlic" is flavour in oil, not garlic itself (FODMAPs don't dissolve in oil)
  const src=' '+String(text||'').toLowerCase().replace(/[’‘]/g,"'").replace(/infused\s+(?:with|in)\s+(?:garlic|onion)/g,'infused')+' ';
  const used=new Array(src.length).fill(false),found=new Map();
  for(const {t,f,re} of TERMS){
    re.lastIndex=0;let m;
    while((m=re.exec(src))){
      const a=m.index,b=a+m[0].length;
      let clash=false;for(let i=a;i<b;i++)if(used[i]){clash=true;break}
      if(clash)continue;
      for(let i=a;i<b;i++)used[i]=true;
      if(isNegated(src,a,b))continue;
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

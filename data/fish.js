// data/fish.js — fish species, locations, weather, mutations, sizes

const LOCATIONS = [
  { id:'pond',     name:'Millhaven Pond',   short:'Pond',     cost:0,     skillReq:{},
    fish:'common–uncommon', desc:'Where everyone starts. Quiet and forgiving.', ambient:'Still and close. The trees hold the mist in.',
    idle:['A frog watches from a lily pad.','Your thermos is still warm.','A duck ignores you completely.','Midges swirl in a quiet column.','The reed beds rustle once, then stop.','A heron lands across the water.','The surface barely moves.'] },
  { id:'river',    name:'Greyvale River',   short:'River',    cost:150,   skillReq:{},
    fish:'common–rare', desc:'Moving water. Better variety, a bit more fight.', ambient:'The river knows where it\'s going. You don\'t have to.',
    idle:['The current nudges your line sideways.','A leaf spins past.','Water over stone. Steady.','The river smells different tonight.'] },
  { id:'lake',     name:'The Grey Mere',    short:'Lake',     cost:600,   skillReq:{endurance:3},
    fish:'uncommon–epic', desc:'Deep and wide. Serious fish live here.', ambient:'Wide and cold and older than the hills around it.',
    idle:['The far bank is barely visible.','A heron stands patient as a secret.','The lake holds the sky in it.','A fish rises, kisses the surface, is gone.','Nothing for a long time. That\'s fine.'] },
  { id:'deepsea',  name:'The Open Water',   short:'Deep Sea', cost:3000,  skillReq:{strength:6,endurance:5},
    fish:'rare–legendary', desc:'No shore. No safety net. Legendary fish.', ambient:'You are very small out here. That\'s fine.',
    idle:['No shore in sight. Just horizon.','The depth below you is not worth thinking about.','Salt on everything.','Something large passed beneath the boat.'] },
  { id:'cave',     name:'The Drowned Cave', short:'Cave',     cost:8000,  skillReq:{intuition:7,perception:6},
    fish:'epic–legendary', desc:'Cold, dark, and wrong. Only the strangest fish.', ambient:'Cold and ancient. The fish here don\'t know the sun.',
    idle:['Dripping somewhere in the dark.','Your lamp flickers once.','The cave doesn\'t echo. It absorbs.','Something breathes. You think it\'s you.'] },
  { id:'moonpool', name:'The Moon Pool',    short:'Moon Pool',cost:20000, skillReq:{intuition:10,perception:8,endurance:6},
    fish:'epic–legendary (exclusive)', desc:'Between a dream and a place. Found only at night.', ambient:'The water glows faintly here. You\'re not sure why.',
    idle:['The pool reflects a moon that isn\'t quite yours.','Silence, except for a distant bell.','Something warm brushes your line.','You feel like you\'ve been here before.'] },
];

const WEATHER = [
  { id:'clear',    name:'Clear Night',        icon:'🌙', rare:false, weight:20, rB:0,   sM:1.0,  vB:0,   cB:0,    fishBonus:{}, specialEffect:'', flavour:['Still and clear.','Stars if you look up.','The kind of night you remember.'] },
  { id:'mist',     name:'Misty',              icon:'🌫', rare:false, weight:18, rB:.06, sM:.92,  vB:0,   cB:.05,  fishBonus:{}, specialEffect:'Uncommon+ more common', flavour:['Mist on the water. Everything hushed.','You can\'t see far. The fish don\'t mind.'] },
  { id:'rain',     name:'Rainy',              icon:'🌧', rare:false, weight:15, rB:.08, sM:1.12, vB:0,   cB:0,    fishBonus:{eel:2,tench:1.5}, specialEffect:'Eels & tench more common', flavour:['Rain on the surface. Fish are restless.','Good weather for eels.'] },
  { id:'overcast', name:'Overcast',           icon:'☁',  rare:false, weight:16, rB:.03, sM:1.04, vB:.05, cB:0,    fishBonus:{}, specialEffect:'+5% value', flavour:['Flat grey light.','Peaceful, in a subdued way.'] },
  { id:'storm',    name:'Stormy',             icon:'⛈',  rare:false, weight:8,  rB:.18, sM:1.22, vB:0,   cB:0,    fishBonus:{}, specialEffect:'Rare fish much more likely', flavour:['The storm keeps everyone else away.','The big ones come up in storms.'] },
  { id:'dawn',     name:'Golden Dawn',        icon:'🌅', rare:false, weight:10, rB:.14, sM:1.18, vB:.10, cB:.08,  fishBonus:{}, specialEffect:'+10% value, +8% charms', flavour:['First light on the water.','The golden hour. Every angler knows it.'] },
  { id:'snow',     name:'Snowfall',           icon:'❄',  rare:false, weight:6,  rB:.05, sM:.88,  vB:.15, cB:0,    fishBonus:{}, specialEffect:'Frost fish exclusive', flavour:['Snow on the water. Everything is soft.','The cold slows everything down. That\'s okay.'] },
  // SPECIAL CUTE WEATHERS
  { id:'sherbert_snow',       name:'Sherbert Snow',       icon:'🍧', rare:true, weight:2,   rB:.25, sM:1.0,  vB:.30, cB:.30, fishBonus:{golden:3,mirror:2}, specialEffect:'Mutations +40%, candy koi exclusive', flavour:['Pink snowflakes drift down. Smells faintly of sugar.','The snow tastes sweet? You\'re not imagining it.'] },
  { id:'bubblegum_fog',       name:'Bubblegum Fog',       icon:'🫧', rare:true, weight:2,   rB:.20, sM:.85,  vB:.40, cB:.20, fishBonus:{}, specialEffect:'Charm find rate ×3', flavour:['The fog smells like something from childhood.','Pink mist. The fish aren\'t afraid today.'] },
  { id:'taco_tuesday',        name:'Taco Tuesday',        icon:'🌮', rare:true, weight:1.5, rB:.10, sM:1.5,  vB:.20, cB:0,   fishBonus:{}, specialEffect:'Speed ×1.5, all value +20%', flavour:['No one can explain it. The fish just love Tuesdays.','Fast, chaotic, delicious.'] },
  { id:'honeydew_haze',       name:'Honeydew Haze',       icon:'🍈', rare:true, weight:2,   rB:.12, sM:1.0,  vB:.50, cB:.15, fishBonus:{}, specialEffect:'All fish value ×1.5', flavour:['The light is green and gentle.','Everything smells faintly of melon.'] },
  { id:'strawberry_dusk',     name:'Strawberry Dusk',     icon:'🍓', rare:true, weight:1.5, rB:.30, sM:1.1,  vB:.25, cB:.25, fishBonus:{golden:4,void_eel:3,abyssal:3,leviathan:2}, specialEffect:'Legendary fish ×4', flavour:['The sky is every shade of red you know.','Something stirs in the deep. Tonight is different.'] },
  { id:'cotton_candy_clouds', name:'Cotton Candy Clouds', icon:'🩷', rare:true, weight:2,   rB:.15, sM:1.0,  vB:.20, cB:.50, fishBonus:{}, specialEffect:'Charm drop ×4', flavour:['The clouds look edible.','Soft. Everything feels soft today.'] },
  { id:'lasagna_rain',        name:'Lasagna Rain',        icon:'🫕', rare:true, weight:1,   rB:.40, sM:1.3,  vB:.60, cB:.40, fishBonus:{}, specialEffect:'Everything is better. Just everything.', flavour:['It is, somehow, raining lasagna.','The fish don\'t question it. Neither do you.'] },
  { id:'midnight_macaron',    name:'Midnight Macaron',    icon:'🎂', rare:true, weight:1.5, rB:.20, sM:.90,  vB:.35, cB:.35, fishBonus:{}, specialEffect:'Rare fish triple at night', flavour:['The air tastes of almond and vanilla.','Only the night knows what you\'ll find.'] },
];

const MUTATIONS = {
  none:      {id:'none',      label:'',           chance:0,     mult:1.0,  rarity:'none',      style:''},
  albino:    {id:'albino',    label:'Albino',      chance:0.028, mult:2.4,  rarity:'uncommon',  style:'color:#e8dfc8'},
  rainbow:   {id:'rainbow',   label:'Rainbow',     chance:0.018, mult:3.2,  rarity:'rare',      style:'background:linear-gradient(90deg,#e87070,#e8c060,#70c870,#6090d8,#a870c0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text'},
  glowing:   {id:'glowing',   label:'Glowing',     chance:0.014, mult:4.0,  rarity:'rare',      style:'color:#70e8c0;text-shadow:0 0 10px rgba(112,232,192,.45)'},
  ancient:   {id:'ancient',   label:'Ancient',     chance:0.009, mult:5.0,  rarity:'epic',      style:'color:#c8a060'},
  twin:      {id:'twin',      label:'Twin-tailed', chance:0.012, mult:2.9,  rarity:'uncommon',  style:'color:#c098e0'},
  giant:     {id:'giant',     label:'Giant',       chance:0.010, mult:3.5,  rarity:'rare',      style:'color:#e8a070;font-weight:600'},
  shadow:    {id:'shadow',    label:'Shadow',      chance:0.012, mult:2.7,  rarity:'uncommon',  style:'color:#7090c0'},
  cursed:    {id:'cursed',    label:'Cursed',      chance:0.006, mult:5.5,  rarity:'epic',      style:'color:#c06060;text-shadow:0 0 8px rgba(192,96,96,.35)'},
  prismatic: {id:'prismatic', label:'Prismatic',   chance:0.003, mult:8.0,  rarity:'legendary', style:'background:linear-gradient(90deg,#f88,#88f,#8f8,#ff8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text'},
  void:      {id:'void',      label:'Void',        chance:0.002, mult:10.0, rarity:'legendary', style:'color:#c0a0ff;text-shadow:0 0 12px #a080f0'},
};

const SIZE_TIERS = [
  {id:'tiny',    label:'Tiny',    wMin:.02, wMax:.2,  lMin:3,   lMax:12,  mult:.4 },
  {id:'small',   label:'Small',   wMin:.2,  wMax:.8,  lMin:12,  lMax:24,  mult:.75},
  {id:'average', label:'',        wMin:.8,  wMax:2.2, lMin:24,  lMax:42,  mult:1.0},
  {id:'large',   label:'Large',   wMin:2.2, wMax:5.0, lMin:42,  lMax:68,  mult:1.5},
  {id:'huge',    label:'Huge',    wMin:5.0, wMax:11,  lMin:68,  lMax:108, mult:2.3},
  {id:'colossal',label:'Colossal',wMin:11,  wMax:26,  lMin:108, lMax:175, mult:3.6},
  {id:'titanic', label:'Titanic', wMin:26,  wMax:80,  lMin:175, lMax:320, mult:6.0},
];

const FISH = [
  // COMMON
  {id:'perch',      name:'Perch',        rarity:'common',   base:3,   locs:['pond','river','lake'],            sw:[26,32,26,12,4,0,0], str:1, xp:{perception:1},            flavour:['A perch drifts up, unimpressed.','Small and striped. Reliable.']},
  {id:'roach',      name:'Roach',        rarity:'common',   base:2,   locs:['pond','river'],                  sw:[32,38,22,7,1,0,0],  str:1, xp:{perception:1},            flavour:['A roach. Quick and silvery.','Common as mud. Still, it counts.']},
  {id:'bream',      name:'Bream',        rarity:'common',   base:4,   locs:['pond','river','lake'],           sw:[16,32,30,16,6,0,0], str:1, xp:{perception:1,endurance:1},flavour:['A bream. Flat and golden.','Slides out without ceremony.']},
  {id:'gudgeon',    name:'Gudgeon',      rarity:'common',   base:2,   locs:['pond','river'],                  sw:[48,34,14,4,0,0,0],  str:1, xp:{perception:1},            flavour:['Tiny. Barely worth noting.','A gudgeon. Bless its heart.']},
  {id:'rudd',       name:'Rudd',         rarity:'common',   base:3,   locs:['pond','lake'],                   sw:[22,34,28,12,4,0,0], str:1, xp:{perception:1},            flavour:['Red-finned, a flash of colour.','Almost decorative.']},
  {id:'frost_perch',name:'Frost Perch',  rarity:'common',   base:8,   locs:['pond','river','lake'],           sw:[20,30,28,16,6,0,0], str:1, xp:{perception:1},            weather:['snow','sherbert_snow'],  flavour:['Pale blue and cold. Lovely.','Barely moves. Like it\'s frozen in thought.']},
  {id:'spicy_roach',name:'Spicy Roach',  rarity:'common',   base:6,   locs:['pond','river'],                  sw:[18,28,30,18,6,0,0], str:1, xp:{perception:1},            weather:['taco_tuesday'],          flavour:['Why is it orange? No one knows.','It smells of cumin. You don\'t ask.']},
  {id:'pasta_perch',name:'Pasta Perch',  rarity:'common',   base:10,  locs:['pond','river','lake','deepsea'], sw:[14,24,30,22,10,0,0],str:1, xp:{perception:1,intuition:1}, weather:['lasagna_rain'],          flavour:['Came up perfectly al dente.','Smells amazing.']},
  // UNCOMMON
  {id:'tench',      name:'Tench',        rarity:'uncommon', base:12,  locs:['pond','lake','river'],           sw:[6,20,32,26,14,2,0], str:2, xp:{perception:1,endurance:1},flavour:['Olive-green and slippery. Takes its time.','A tench surfaces slowly, like a thought.']},
  {id:'carp',       name:'Carp',         rarity:'uncommon', base:16,  locs:['pond','lake'],                   sw:[3,12,26,32,20,7,0], str:3, xp:{endurance:1,strength:1},  flavour:['A carp. Old and knowing.','The line went taut and stayed there a while.']},
  {id:'trout',      name:'Trout',        rarity:'uncommon', base:18,  locs:['river','lake'],                  sw:[4,16,32,30,16,2,0], str:2, xp:{perception:1,intuition:1},flavour:['Speckled and fast. A good catch.','Trout always put up a show.']},
  {id:'chub',       name:'Chub',         rarity:'uncommon', base:10,  locs:['river'],                         sw:[12,24,32,22,9,1,0], str:2, xp:{endurance:1},             flavour:['Silvery with a hint of brass. Stubborn.']},
  {id:'eel',        name:'Eel',          rarity:'uncommon', base:20,  locs:['river','lake','pond'],           sw:[6,16,26,28,18,6,0], str:3, xp:{intuition:1,strength:1},  flavour:['Something long and writhing.','It came up twisting. Everything about it is wrong and perfect.']},
  {id:'jade_tench', name:'Jade Tench',   rarity:'uncommon', base:30,  locs:['pond','lake','river'],           sw:[4,14,28,30,18,6,0], str:2, xp:{endurance:1,intuition:1}, weather:['honeydew_haze'],         flavour:['Green as new leaves. Calm.','It looks like a living jewel.']},
  {id:'dream_bream',name:'Dream Bream',  rarity:'uncommon', base:25,  locs:['pond','lake','river'],           sw:[6,18,30,28,16,2,0], str:2, xp:{intuition:1,perception:1},weather:['bubblegum_fog'],         flavour:['Moves slowly, like it\'s thinking.','Iridescent pink. Unreal.']},
  {id:'candy_koi',  name:'Candy Koi',    rarity:'uncommon', base:40,  locs:['pond','lake'],                   sw:[4,12,26,32,20,6,0], str:2, xp:{intuition:1,perception:1},weather:['sherbert_snow'],         flavour:['Pink and yellow and entirely real.','Moves like a carnival ride.']},
  // RARE
  {id:'pike',       name:'Pike',         rarity:'rare',     base:35,  locs:['lake','river'],                  sw:[1,6,20,34,28,11,0], str:4, xp:{strength:2,endurance:1},  flavour:['Long and pale and full of teeth.','A pike. It looked at you first.']},
  {id:'salmon',     name:'Salmon',       rarity:'rare',     base:44,  locs:['river','lake'],                  sw:[0,4,18,34,30,14,0], str:4, xp:{strength:2,intuition:1},  flavour:['Leapt twice before giving in.','Silver and exhausted. You both are.']},
  {id:'zander',     name:'Zander',       rarity:'rare',     base:30,  locs:['lake','river'],                  sw:[2,8,24,34,24,8,0],  str:3, xp:{perception:2,intuition:1},flavour:['Pale and sharp-eyed. A predator.','Came up quietly. That felt worse.']},
  {id:'catfish',    name:'Catfish',      rarity:'rare',     base:42,  locs:['lake','river'],                  sw:[0,4,14,26,32,22,2], str:5, xp:{strength:2,endurance:2},  flavour:['Enormous. Whiskered.','Pulled you forward a step.']},
  {id:'barbel',     name:'Barbel',       rarity:'rare',     base:30,  locs:['river'],                         sw:[1,8,22,36,26,7,0],  str:4, xp:{endurance:2,strength:1},  flavour:['Streamlined and powerful. Knows the current.']},
  {id:'crimson_pike',name:'Crimson Pike',rarity:'rare',     base:80,  locs:['lake','river','deepsea'],        sw:[0,2,12,28,34,20,4], str:4, xp:{strength:2,intuition:2},  weather:['strawberry_dusk'],       flavour:['Red as the sky that summoned it.','You\'ve never seen one before.']},
  // EPIC
  {id:'sturgeon',   name:'Sturgeon',     rarity:'epic',     base:100, locs:['lake','deepsea'],                sw:[0,0,4,18,40,34,4],  str:6, xp:{strength:3,endurance:3},  flavour:['Armoured, prehistoric. Shouldn\'t still exist.','The rod bent further than you thought safe.']},
  {id:'wels',       name:'Wels Catfish', rarity:'epic',     base:120, locs:['lake','river'],                  sw:[0,0,2,14,40,36,8],  str:7, xp:{strength:3,endurance:3},  flavour:['Massive. Older than your grandfather.','The mud moved. Then it was on the line.']},
  {id:'taimen',     name:'Taimen',       rarity:'epic',     base:110, locs:['river'],                         sw:[0,0,4,20,40,30,6],  str:6, xp:{strength:3,intuition:2},  flavour:['The fish of rivers. Immense, wild.','It ran downstream. You ran with it.']},
  {id:'asp',        name:'Asp',          rarity:'epic',     base:90,  locs:['river','lake'],                  sw:[0,1,8,24,40,24,3],  str:5, xp:{intuition:2,perception:2},flavour:['Fast and silver. Barely touched the surface.']},
  {id:'moonfish',   name:'Moonfish',     rarity:'epic',     base:200, locs:['moonpool'],                      sw:[0,0,2,14,36,36,12], str:5, xp:{intuition:4,perception:3},flavour:['Silvery and round. Feels like holding the moon.','This one glows from inside.']},
  // LEGENDARY
  {id:'golden',     name:'Golden Carp',  rarity:'legendary',base:280, locs:['pond','lake'],                   sw:[0,0,2,14,44,36,4],  str:5, req:{intuition:5},            xp:{intuition:5,perception:4},  flavour:['They say you only see one in a lifetime.','Gleamed like a coin in deep water.']},
  {id:'void_eel',   name:'Void Eel',     rarity:'legendary',base:450, locs:['cave','deepsea'],               sw:[0,0,0,8,36,44,12],  str:8, req:{intuition:7,perception:6},xp:{intuition:6,perception:5}, flavour:['You didn\'t see it. You just felt the line go somewhere else.','No eyes.']},
  {id:'mirror',     name:'Mirror Carp',  rarity:'legendary',base:360, locs:['lake','pond'],                   sw:[0,0,1,12,40,42,5],  str:6, req:{endurance:5},            xp:{endurance:5,strength:3},    flavour:['Scales like scattered mirrors. Magnificent.','It came up calm, as if it chose to.']},
  {id:'abyssal',    name:'Abyssal Pike', rarity:'legendary',base:540, locs:['deepsea','cave'],               sw:[0,0,0,4,30,52,14],  str:9, req:{strength:8,intuition:6}, xp:{strength:6,intuition:5},   flavour:['Long as a man. Teeth like needles.','The water went still. Then the line screamed.']},
  {id:'star_koi',   name:'Star Koi',     rarity:'legendary',base:800, locs:['moonpool'],                      sw:[0,0,0,6,28,46,20],  str:7, req:{intuition:9,perception:7},xp:{intuition:7,perception:6}, flavour:['It looks like the night sky compressed into fish form.','You almost put it back.']},
  {id:'leviathan',  name:'The Leviathan',rarity:'legendary',base:1200,locs:['deepsea'],                      sw:[0,0,0,0,14,52,34],  str:10,req:{strength:12,endurance:10,perception:8},xp:{strength:9,endurance:8,intuition:6},flavour:['The rod nearly left your hands.','Something ancient chose to be caught today.','You\'ll be telling this story forever.']},
];

const FISH_BY_ID = Object.fromEntries(FISH.map(f=>[f.id,f]));
const LOC_BY_ID  = Object.fromEntries(LOCATIONS.map(l=>[l.id,l]));
const WX_BY_ID   = Object.fromEntries(WEATHER.map(w=>[w.id,w]));

function rollMutation(luckBonus=0){
  for(const m of Object.values(MUTATIONS).filter(x=>x.id!=='none'))
    if(Math.random()<m.chance*(1+luckBonus))return m;
  return MUTATIONS.none;
}
function rollSize(sw,strLvl=0){
  const max=Math.min(SIZE_TIERS.length-1,2+Math.floor(strLvl*.55));
  const w=sw.slice(0,max+1);const total=w.reduce((a,b)=>a+b,0);
  if(!total)return SIZE_TIERS[0];let r=Math.random()*total;
  for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return SIZE_TIERS[i];}
  return SIZE_TIERS[0];
}
function rollWeight(st){return+(st.wMin+Math.random()*(st.wMax-st.wMin)).toFixed(2)}
function rollLength(st){return Math.round(st.lMin+Math.random()*(st.lMax-st.lMin))}
function calcFishValue(fd,st,wt,mut,bonusMult=1){
  return Math.round(fd.base*st.mult*(0.65+(wt/st.wMax)*.7)*mut.mult*bonusMult);
}
function rarityColor(r){return{common:'#6a9aaa',uncommon:'#5aaa70',rare:'#6888c8',epic:'#a870d0',legendary:'#d0a840'}[r]||'#6a9aaa'}
function getFishPool(locId,baitBonus,skillLvls,weatherId){
  const wthr=WX_BY_ID[weatherId]||WEATHER[0];
  const avail=FISH.filter(f=>{
    if(!f.locs.includes(locId))return false;
    if(f.weather&&!f.weather.includes(weatherId))return false;
    if(f.req)for(const[sk,lv]of Object.entries(f.req))if((skillLvls[sk]||0)<lv)return false;
    return true;
  });
  // Rarity weights — fresh game should be almost entirely commons.
  // baitBonus (from bait upgrade) is the main way to shift this.
  // At zero upgrades: common≈200, uncommon≈8, rare≈1, epic≈0.1, legendary≈0.01
  // At bait lv10 (~bonus 0.28): uncommon≈14, rare≈3, epic≈0.5, legendary≈0.08
  // At bait lv40 (~bonus 1.12): uncommon≈34, rare≈12, epic≈4, legendary≈1.5
  const rw={
    common:    200,
    uncommon:  Math.max(0.5, 8  + baitBonus * 23),
    rare:      Math.max(0.05,1  + baitBonus * 9.8),
    epic:      Math.max(0.01,0.1+ baitBonus * 3.5),
    legendary: Math.max(0.002,0.01+baitBonus*1.3),
  };
  const pool=[];
  for(const f of avail){
    let w=rw[f.rarity]||8;
    if(wthr.fishBonus&&wthr.fishBonus[f.id])w*=wthr.fishBonus[f.id];
    for(let i=0;i<Math.round(w);i++)pool.push(f);
  }
  return pool;
}
function getIdleFlavour(locId){const loc=LOC_BY_ID[locId];if(!loc)return'';return loc.idle[Math.floor(Math.random()*loc.idle.length)]}
function randWeather(){const total=WEATHER.reduce((s,w)=>s+w.weight,0);let r=Math.random()*total;for(const w of WEATHER){r-=w.weight;if(r<=0)return w;}return WEATHER[0]}

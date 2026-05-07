// data/charms.js — charm effects, rolling, enchantments, temp buffs

// ── CHARM EFFECTS POOL ────────────────────────────────────────
// Each charm rolls 1–3 effects from this pool based on its rarity
const CHARM_EFFECTS = [
  // Size effects
  { id:'size_up',      label:'Big Catch',       desc:'+{v}% size roll bonus',       type:'size',      value:[8,15,25],   icon:'📏' },
  { id:'giant_chance', label:'Giant\'s Touch',   desc:'+{v}% chance of Giant mutation', type:'mutation', value:[15,28,45], icon:'🔮' },
  // Rarity effects
  { id:'rare_up',      label:'Lucky Cast',      desc:'+{v}% rare fish chance',      type:'rarity',    value:[5,10,18],   icon:'⭐' },
  { id:'epic_up',      label:'Deep Calling',    desc:'+{v}% epic fish chance',      type:'rarity',    value:[3,6,12],    icon:'💜' },
  { id:'legend_up',    label:'Fate\'s Hook',    desc:'+{v}% legendary fish chance', type:'rarity',    value:[1,3,6],     icon:'✨' },
  // Mutation effects
  { id:'mut_up',       label:'Strange Waters',  desc:'+{v}% all mutation chance',   type:'mutation',  value:[20,35,55],  icon:'🌀' },
  { id:'rainbow_pull', label:'Rainbow Pull',    desc:'+{v}% rainbow mutation',      type:'mutation',  value:[25,45,70],  icon:'🌈' },
  { id:'glow_pull',    label:'Lantern Bait',    desc:'+{v}% glowing mutation',      type:'mutation',  value:[30,50,80],  icon:'💡' },
  { id:'prism_pull',   label:'Prismatic Lure',  desc:'+{v}% prismatic mutation',    type:'mutation',  value:[10,20,40],  icon:'💎' },
  // Charm effects
  { id:'charm_find',   label:'Charm Magnet',    desc:'+{v}% charm drop rate',       type:'charm',     value:[20,40,65],  icon:'🍀' },
  { id:'charm_slots',  label:'Trinket Belt',    desc:'Charm effects amplified {v}%',type:'charm',     value:[10,20,35],  icon:'🎒' },
  // Value effects
  { id:'value_up',     label:'Gilded Hook',     desc:'+{v}% fish sell value',       type:'value',     value:[8,15,28],   icon:'💰' },
  { id:'rare_value',   label:'Collector\'s Eye',desc:'+{v}% rare+ sell value',      type:'value',     value:[12,22,40],  icon:'🏆' },
  // Speed effects
  { id:'cast_speed',   label:'Quick Hand',      desc:'+{v}% manual cast speed',     type:'speed',     value:[10,18,30],  icon:'⚡' },
  { id:'auto_speed',   label:'Tireless Line',   desc:'+{v}% autofish speed',        type:'speed',     value:[8,15,25],   icon:'🔄' },
  // Special
  { id:'session_luck', label:'Fisher\'s Vigil', desc:'+{v}% luck after 15min play', type:'special',   value:[30,50,80],  icon:'⏳' },
  { id:'weather_boost',label:'Weather Reader',  desc:'+{v}% bonus in special weather',type:'special', value:[20,40,65],  icon:'🌦' },
  { id:'display_bonus',label:'Showpiece',       desc:'Display fish worth +{v}% when viewed',type:'special',value:[15,30,50],icon:'🖼' },
];

// ── CHARM RARITIES ────────────────────────────────────────────
const CHARM_RARITIES = {
  common:    { label:'Common',    color:'#6a9aaa', effectCount:[1,1], effectTier:0, dropWeight:60, enchantCost:50  },
  uncommon:  { label:'Uncommon',  color:'#5aaa70', effectCount:[1,2], effectTier:0, dropWeight:28, enchantCost:150 },
  rare:      { label:'Rare',      color:'#6888c8', effectCount:[2,2], effectTier:1, dropWeight:10, enchantCost:400 },
  epic:      { label:'Epic',      color:'#a870d0', effectCount:[2,3], effectTier:1, dropWeight:2,  enchantCost:1000},
  legendary: { label:'Legendary', color:'#d0a840', effectCount:[3,3], effectTier:2, dropWeight:0.3,enchantCost:3000},
};

// ── CHARM NAMES (random adjective + noun) ─────────────────────
const CHARM_ADJECTIVES = ['Mossy','Gilded','Ancient','Whispering','Pale','Luminous','Tangled','Bright','Quiet','Wandering','Dreaming','Sunken','Hollow','Silver','Coral','Faded','Woven','Misty','Ember','Frosted'];
const CHARM_NOUNS      = ['Hook','Scale','Pearl','Token','Knot','Shard','Bauble','Pendant','Stone','Coin','Loop','Chip','Lure','Bead','Clasp','Trinket','Rune','Wisp','Amulet','Fragment'];
const CHARM_EMOJIS     = ['🐚','🪨','🌿','💠','🪬','🌸','⚗','🎴','🔱','🌙','⭐','🦋','🍀','🪙','🔮','🧿','💫','🌊','🐉','🎐'];

// ── ENCHANTMENT TYPES (20 levels each) ───────────────────────
// Cost formula: baseCost * 1.55^level
// Effect scales from weak (lv1) to massive (lv20)
const ENCHANTMENT_DEFS = [
  { id:'sharpened',   name:'Sharpened',    icon:'⚔',
    baseCost: 800,
    effectFn: l => `Manual value +${Math.round(l*8)}%`,
    applyFn:  l => st => { st.manualValueBonus=(st.manualValueBonus||0)+l*0.08 },
    desc: 'Manual catches are worth more. Scales hard at high levels.',
  },
  { id:'blessed',     name:'Blessed',      icon:'✦',
    baseCost: 1000,
    effectFn: l => `Mutations +${Math.round(l*7)}%`,
    applyFn:  l => st => { st.mutationBonus=(st.mutationBonus||0)+l*0.07 },
    desc: 'All mutation chances increase.',
  },
  { id:'deep_pull',   name:'Deep Pull',    icon:'🎣',
    baseCost: 1200,
    effectFn: l => `Rare+ fish +${Math.round(l*5)}% more likely`,
    applyFn:  l => st => { st.rarityBonus=(st.rarityBonus||0)+l*0.05 },
    desc: 'Draws rarer fish to your line.',
  },
  { id:'swift',       name:'Swift',        icon:'⚡',
    baseCost: 900,
    effectFn: l => `Bar decay -${Math.round(l*3.5)}%`,
    applyFn:  l => st => { st.mashDecayRate=Math.max(0.02,(st.mashDecayRate||0.13)*(1-l*0.035)) },
    desc: 'Slows bar decay — easier mashing.',
  },
  { id:'charmed',     name:'Charmed',      icon:'🍀',
    baseCost: 1800,
    effectFn: l => `Charm drop +${Math.round(l*12)}%`,
    applyFn:  l => st => { st.charmDropBonus=(st.charmDropBonus||0)+l*0.12 },
    desc: 'Charms find you more often.',
  },
  { id:'weighted',    name:'Weighted',     icon:'⚖',
    baseCost: 1100,
    effectFn: l => `Size rolls +${l} tier${l>1?'s':''}`,
    applyFn:  l => st => { st.sizeBonus=(st.sizeBonus||0)+l },
    desc: 'Heavier fish every cast.',
  },
  { id:'gilded',      name:'Gilded',       icon:'💰',
    baseCost: 2200,
    effectFn: l => `All fish +${Math.round(l*9)}% value`,
    applyFn:  l => st => { st.valueBonus=(st.valueBonus||0)+l*0.09 },
    desc: 'Everything is worth more.',
  },
  { id:'storied',     name:'Storied',      icon:'📖',
    baseCost: 3500,
    effectFn: l => `Legendary fish +${Math.round(l*12)}% likely`,
    applyFn:  l => st => { st.legendaryBonus=(st.legendaryBonus||0)+l*0.12 },
    desc: 'The legendary fish hear your name.',
  },
  { id:'luminous',    name:'Luminous',     icon:'💡',
    baseCost: 4500,
    effectFn: l => `Glow/prismatic mutation +${Math.round(l*15)}%`,
    applyFn:  l => st => { st.glowBonus=(st.glowBonus||0)+l*0.15 },
    desc: 'Radiant mutations are drawn to you.',
  },
  { id:'ancient_rite',name:'Ancient Rite', icon:'🌀',
    baseCost: 6000,
    effectFn: l => `Epic+ fish value +${Math.round(l*10)}%`,
    applyFn:  l => st => { st.epicValueBonus=(st.epicValueBonus||0)+l*0.10 },
    desc: 'The old magic makes rare fish priceless.',
  },
];

const ENCHANT_MAX_LEVEL = 20;

function enchantCost(def, level) {
  if (level <= 0) return def.baseCost;
  // lv1 = baseCost, lv10 ~= baseCost*6, lv20 ~= baseCost*40
  return Math.round(def.baseCost * Math.pow(1.20, level));
}

// ── TEMP BUFFS (10 levels each) ───────────────────────────────
const BUFF_MAX_LEVEL = 10;

// Buff cost and effect scale with level (1–10)
// Duration and multiplier both improve
const TEMP_BUFF_DEFS = [
  { id:'double_luck',  name:'Double Luck',       icon:'🍀', baseCost:600,
    durationFn: l => (20+l*10)*60*1000,
    effectFn:   l => `Luck ×${(1.5+l*0.2).toFixed(1)} for ${20+l*10}min`,
    applyFn:    l => ({luckMult: 1.5+l*0.2}),
  },
  { id:'golden_hour',  name:'Golden Hour',       icon:'✨', baseCost:1200,
    durationFn: l => (30+l*15)*60*1000,
    effectFn:   l => `All value +${Math.round(30+l*10)}% for ${30+l*15}min`,
    applyFn:    l => ({valueMult: 1.3+l*0.1}),
  },
  { id:'rare_surge',   name:'Rare Surge',        icon:'⭐', baseCost:1000,
    durationFn: l => (10+l*8)*60*1000,
    effectFn:   l => `Rare+ ×${(1.5+l*0.3).toFixed(1)} for ${10+l*8}min`,
    applyFn:    l => ({rarityMult: 1.5+l*0.3}),
  },
  { id:'speedy_line',  name:'Speedy Line',       icon:'⚡', baseCost:500,
    durationFn: l => (10+l*8)*60*1000,
    effectFn:   l => `Speed ×${(1.2+l*0.15).toFixed(2)} for ${10+l*8}min`,
    applyFn:    l => ({speedMult: 1.2+l*0.15}),
  },
  { id:'charm_surge',  name:'Charm Surge',       icon:'🪬', baseCost:2000,
    durationFn: l => (20+l*10)*60*1000,
    effectFn:   l => `Charm rate ×${2+l} for ${20+l*10}min`,
    applyFn:    l => ({charmMult: 2+l}),
  },
  { id:'giant_tide',   name:'Giant Tide',        icon:'🌊', baseCost:800,
    durationFn: l => (15+l*8)*60*1000,
    effectFn:   l => `Size ×${(1.3+l*0.15).toFixed(2)} for ${15+l*8}min`,
    applyFn:    l => ({sizeMult: 1.3+l*0.15}),
  },
  { id:'full_moon',    name:'Full Moon',         icon:'🌕', baseCost:4000,
    durationFn: l => (60+l*30)*60*1000,
    effectFn:   l => `Everything ×${(1.15+l*0.08).toFixed(2)} for ${60+l*30}min`,
    applyFn:    l => ({luckMult:1.15+l*0.08, valueMult:1.15+l*0.08, speedMult:1.15+l*0.08}),
  },
  { id:'storm_caller', name:'Storm Caller',      icon:'⛈', baseCost:600,
    durationFn: l => (8+l*4)*60*1000,
    effectFn:   l => `Storm weather for ${8+l*4}min`,
    applyFn:    l => ({forceWeather:'storm'}),
  },
  { id:'sweet_weather',name:'Sweet Weather',     icon:'🍭', baseCost:2500,
    durationFn: l => (10+l*5)*60*1000,
    effectFn:   l => `Special weather for ${10+l*5}min`,
    applyFn:    l => ({forceSweetWeather:true}),
  },
];

function buffCost(def, level) {
  return Math.round(def.baseCost * Math.pow(1.35, level - 1));
}

// Legacy TEMP_BUFFS shim so old code still works
const TEMP_BUFFS = TEMP_BUFF_DEFS.map(d => ({
  ...d, cost: d.baseCost,
  duration: d.durationFn(1),
  desc: d.effectFn(1),
  apply: d.applyFn(1),
}));

// ── CHARM ROLLING ─────────────────────────────────────────────
let _charmIdCounter = 1;
function initCharmCounter(charms) { _charmIdCounter = (charms||[]).reduce((m,c)=>Math.max(m,(c.uid||0)+1),1); }

function rollCharm(baseCharmBonus = 0, perceptionLevel = 0) {
  // Perception gates charm rarity — low perception = mostly commons
  // perceptionLevel 0: legendary weight 0.05, epic 0.5
  // perceptionLevel 20: legendary 1.5, epic 4
  // perceptionLevel 40: full weights
  const percFactor = Math.min(1, perceptionLevel / 30);
  const adjustedRarities = {
    common:    { ...CHARM_RARITIES.common,    dropWeight: 60 },
    uncommon:  { ...CHARM_RARITIES.uncommon,  dropWeight: Math.max(2, 28 * percFactor) },
    rare:      { ...CHARM_RARITIES.rare,      dropWeight: Math.max(0.5, 10 * percFactor) },
    epic:      { ...CHARM_RARITIES.epic,      dropWeight: Math.max(0.1, 2  * percFactor) },
    legendary: { ...CHARM_RARITIES.legendary, dropWeight: Math.max(0.02, 0.3 * percFactor) },
  };

  // roll rarity
  const rarities = Object.entries(adjustedRarities);
  const total = rarities.reduce((s,[,r])=>s+r.dropWeight,0);
  let rr = Math.random()*total;
  let rarityId = 'common';
  for(const [id,r] of rarities){rr-=r.dropWeight;if(rr<=0){rarityId=id;break;}}
  const rar = CHARM_RARITIES[rarityId];

  // roll name
  const adj = CHARM_ADJECTIVES[Math.floor(Math.random()*CHARM_ADJECTIVES.length)];
  const noun = CHARM_NOUNS[Math.floor(Math.random()*CHARM_NOUNS.length)];
  const emoji = CHARM_EMOJIS[Math.floor(Math.random()*CHARM_EMOJIS.length)];
  const name = `${adj} ${noun}`;

  // roll effects
  const minE = rar.effectCount[0], maxE = rar.effectCount[1];
  const numEffects = minE + Math.floor(Math.random()*(maxE-minE+1));
  const shuffled = [...CHARM_EFFECTS].sort(()=>Math.random()-.5);
  // Effect tier also scales with perception — low perception = weak effects even on rare charms
  const percTierBonus = perceptionLevel >= 20 ? 1 : perceptionLevel >= 10 ? 0 : -1;
  const effects = shuffled.slice(0,numEffects).map(e=>{
    const tier = Math.max(0, Math.min(e.value.length-1, rar.effectTier + percTierBonus));
    const val = e.value[tier];
    return { id:e.id, label:e.label, desc:e.desc.replace('{v}',val), icon:e.icon, type:e.type, value:val };
  });

  return {
    uid: _charmIdCounter++,
    name, emoji, rarity: rarityId,
    effects,
    discovered: Date.now(),
    equipped: false,
    enchantments: [],
  };
}

function applyCharmEffects(charms, stats) {
  for(const charm of charms.filter(c=>c.equipped)){
    for(const e of charm.effects){
      const amp = 1 + ((stats.charmAmplify||0)/100);
      const v = e.value * amp;
      switch(e.id){
        case 'size_up':      stats.sizeBonus=(stats.sizeBonus||0)+v/100; break;
        case 'giant_chance': stats.giantMutBonus=(stats.giantMutBonus||0)+v/100; break;
        case 'rare_up':      stats.rarityBonus=(stats.rarityBonus||0)+v/100; break;
        case 'epic_up':      stats.epicBonus=(stats.epicBonus||0)+v/100; break;
        case 'legend_up':    stats.legendaryBonus=(stats.legendaryBonus||0)+v/100; break;
        case 'mut_up':       stats.mutationBonus=(stats.mutationBonus||0)+v/100; break;
        case 'rainbow_pull': stats.rainbowBonus=(stats.rainbowBonus||0)+v/100; break;
        case 'glow_pull':    stats.glowBonus=(stats.glowBonus||0)+v/100; break;
        case 'prism_pull':   stats.prismaticBonus=(stats.prismaticBonus||0)+v/100; break;
        case 'charm_find':   stats.charmDropBonus=(stats.charmDropBonus||0)+v/100; break;
        case 'charm_slots':  stats.charmAmplify=(stats.charmAmplify||0)+v; break;
        case 'value_up':     stats.valueBonus=(stats.valueBonus||0)+v/100; break;
        case 'rare_value':   stats.rareValueBonus=(stats.rareValueBonus||0)+v/100; break;
        case 'cast_speed':   stats.manualSpeedBonus=(stats.manualSpeedBonus||0)+v/100; break;
        case 'auto_speed':   stats.autoSpeedBonus=(stats.autoSpeedBonus||0)+v/100; break;
        case 'session_luck': stats.sessionLuckBonus=(stats.sessionLuckBonus||0)+v/100; break;
        case 'weather_boost':stats.weatherBonus=(stats.weatherBonus||0)+v/100; break;
        case 'display_bonus':stats.displayBonus=(stats.displayBonus||0)+v/100; break;
      }
    }
  }
}

function charmRarityColor(rarityId){return CHARM_RARITIES[rarityId]?.color||'#6a9aaa'}

// data/upgrades.js — manual upgrades, autofish upgrades, skills
// Level 40 upgrades. Designed to take weeks of real-time play.

// ── SKILLS (passive XP from every catch) ─────────────────────
const SKILLS = [
  { id:'perception', name:'Perception', icon:'👁', maxLevel:40,
    desc:'Your eye for rare fish and hidden mutations.',
    milestones:{ 3:'Uncommon fish more visible', 6:'Rare fish sense', 10:'Mutation awareness', 15:'Epic fish sense', 20:'Legendary awareness', 30:'Master angler vision', 40:'All secrets revealed' },
    effect: l => `Rare +${Math.round(l*3.5)}% · Mutation +${Math.round(l*4)}%`,
    // XP needed per level — very slow curve, faster early
    xpPerLevel: Array.from({length:41},(_,i)=>i===0?0:Math.round(200*Math.pow(1.22,i-1))),
  },
  { id:'endurance', name:'Endurance', icon:'⚓', maxLevel:40,
    desc:'Patience and stamina. Bigger bucket, better odds on long sessions.',
    milestones:{ 3:'Bucket +8 slots', 6:'Session bonus unlocked', 10:'Bucket +16', 15:'Long session rewards', 20:'Bucket +28', 30:'Epic endurance', 40:'Limitless patience' },
    effect: l => `Bucket +${l*2} · Session bonus +${Math.round(l*2.5)}%`,
    xpPerLevel: Array.from({length:41},(_,i)=>i===0?0:Math.round(240*Math.pow(1.23,i-1))),
  },
  { id:'strength', name:'Strength', icon:'⚒', maxLevel:40,
    desc:'Physical power. Heavier fish, larger size rolls, fewer escapes.',
    milestones:{ 3:'Large fish accessible', 5:'Escape rate reduced', 8:'Huge fish', 12:'Colossal fish', 18:'Titanic fish', 25:'Nothing escapes', 40:'Absolute power' },
    effect: l => `Larger fish · Escape −${Math.round(l*2.2)}%`,
    xpPerLevel: Array.from({length:41},(_,i)=>i===0?0:Math.round(280*Math.pow(1.24,i-1))),
  },
  { id:'intuition', name:'Intuition', icon:'◈', maxLevel:40,
    desc:'Beyond reason. Unlocks legendary fish, senses special weathers.',
    milestones:{ 5:'Legendary fish possible', 8:'Void eel accessible', 10:'Special weathers more frequent', 15:'Moon Pool hint', 20:'All legendaries accessible', 30:'Weather sense mastered', 40:'The water is part of you' },
    effect: l => `Legendary +${Math.round(l*1.8)}% · Special weather sense`,
    xpPerLevel: Array.from({length:41},(_,i)=>i===0?0:Math.round(320*Math.pow(1.25,i-1))),
  },
];

// ── COST FORMULA ──────────────────────────────────────────────
// Properly brutal. Early levels should still cost real money.
// base * mult^level * earlyFactor, earlyFactor bites from level 1.
function upgradeCost(base, mult, level) {
  if (level <= 0) return base;
  // Gentler curve — late levels are expensive but reachable over months of play
  const earlyFactor = level <= 5 ? 1.0 : level <= 12 ? 1.3 : level <= 22 ? 1.7 : 2.5;
  return Math.round(base * Math.pow(mult, level) * earlyFactor);
}

// ── MANUAL UPGRADES (level 1–40) ─────────────────────────────
// Base costs are real money relative to early fish (🪙2–4 each).
// First upgrade of each type should take 5–15 min of play.
const UPGRADES = [
  {
    id:'rod', name:'Rod', icon:'🎣', maxLevel:40, baseCost:180, costMult:1.18, skillReq:{},
    desc:'Better rods mean faster casts, less bar decay, and stronger pulls.',
    levelNames: {1:'Bent Twig',3:'Bamboo',5:'Fibreglass',8:'Carbon Tip',12:'Tournament',16:'Custom Build',20:'Legendary Oak',25:'Dragonbone',30:'Moonweave',35:'Starsplitter',40:'The Unnamed Rod'},
    effect: l => `Bar decay −${Math.round(l*2.5)}% · Manual value ×${(1+l*.022).toFixed(2)}`,
    statFn: l => ({ rodLevel: l, barDecayReduction: l*0.025, manualValueMult: 1+l*0.022 }),
  },
  {
    id:'bait', name:'Bait', icon:'🪱', maxLevel:40, baseCost:150, costMult:1.17, skillReq:{},
    desc:'Better bait attracts rarer fish to both lines.',
    levelNames: {1:'Bread Crumbs',3:'Garden Worms',6:'Maggots',10:'Hand-tied Flies',15:'Scented Lures',20:'Enchanted Paste',25:'Deepwater Mix',30:'Starlight Bait',35:'Void Essence',40:'The Lure of Calling'},
    effect: l => `Rare fish +${Math.round(l*2.8)}%`,
    statFn: l => ({ baitBonus: l*0.028 }),
  },
  {
    id:'bucket', name:'Bucket', icon:'🪣', maxLevel:20, baseCost:220, costMult:1.19, skillReq:{},
    desc:'Holds more fish before you need to sell.',
    levelNames: {1:'Dented Tin',3:'Proper Bucket',5:'Cooler Box',8:'Large Cooler',10:'Market Crate',14:'Industrial Box',18:'The Endless Pail',20:'Bottomless Bucket'},
    effect: l => `Holds ${8 + l*4} fish`,
    statFn: l => ({ bucketBase: 8 + l*4 }),
  },
  {
    id:'line', name:'Line', icon:'〰', maxLevel:30, baseCost:320, costMult:1.19, skillReq:{strength:3},
    desc:'Stronger line means fewer escapes on big fish.',
    levelNames: {1:'Standard Line',5:'Braided',10:'Monofilament',15:'Heavy Duty',20:'Titanium Core',25:'Dragon Silk',30:'The Unbreakable'},
    effect: l => `Escape chance −${Math.round(l*2.8)}%`,
    statFn: l => ({ lineLevel: l, escapeReduction: l*0.028 }),
  },
  {
    id:'lure', name:'Lure', icon:'✦', maxLevel:30, baseCost:550, costMult:1.20, skillReq:{intuition:3},
    desc:'Epic and legendary fish are worth significantly more.',
    levelNames: {1:'Plain Spinner',5:'Painted Wood',10:'Articulated Lure',15:'Deep Dive',20:'Glowing Lure',25:'Dream Lure',30:'The Void Lure'},
    effect: l => `Epic+ value ×${(1+l*.025).toFixed(2)}`,
    statFn: l => ({ lureMult: 1+l*0.025 }),
  },
  {
    id:'display', name:'Display Tank', icon:'🖼', maxLevel:15, baseCost:900, costMult:1.22, skillReq:{},
    desc:'Fish on display earn passive income each minute. Upgrade to increase slots and earnings.',
    levelNames: {1:'Small Bowl',3:'Glass Tank',5:'Grand Aquarium',8:'Dream Display',12:'Living Gallery',15:'The Infinite Pond'},
    effect: l => l===0 ? 'Display holds 3 fish · no passive income yet' : `Display holds ${3 + l*2} fish · +${(2+l*5).toFixed(0)}% value/min per fish`,
    statFn: l => ({ displaySlots: 3+l*2, displayBonus: l*0.05 }),
  },
];

// ── AUTOFISH UPGRADES (level 1–40) ────────────────────────────
// Auto upgrades are deliberately expensive — autofish is passive income,
// it should take significant investment before it's worth running.
const AUTO_UPGRADES = [
  {
    id:'auto_speed', name:'Auto Speed', icon:'⟳', maxLevel:40, baseCost:600, costMult:1.20,
    desc:'How often the autofish casts. Starts very slow — upgrade it.',
    intervalFn: l => Math.round(Math.max(12000, 90000 - l*1950)),
    effect: l => `Casts every ${Math.round(Math.max(12,90-l*1.95))}s`,
    statFn: l => ({ autoIntervalMs: Math.round(Math.max(12000,90000-l*1950)) }),
  },
  {
    id:'auto_strength', name:'Auto Strength', icon:'↑', maxLevel:30, baseCost:700, costMult:1.20,
    desc:'What size fish the autofish can reel in.',
    effect: l => `Max size: ${['tiny','small','average','large','large','huge','huge','colossal','colossal','colossal','titanic'][Math.min(10,Math.floor(l/3))]}`,
    statFn: l => ({ autoStrLevel: Math.floor(l*0.5) }),
  },
  {
    id:'auto_luck', name:'Auto Luck', icon:'◇', maxLevel:30, baseCost:650, costMult:1.19,
    desc:'Mutation chance for auto-caught fish.',
    effect: l => `Auto mutation ×${(1+l*.04).toFixed(2)}`,
    statFn: l => ({ autoLuckMult: 1+l*0.04 }),
  },
  {
    id:'auto_bait', name:'Auto Bait', icon:'◉', maxLevel:30, baseCost:750, costMult:1.20,
    desc:'Rarity of fish the autofish catches.',
    effect: l => `Rarity bias +${Math.round(l*2.5)}%`,
    statFn: l => ({ autoBaitBonus: l*0.025 }),
  },
  {
    id:'auto_net', name:'Net', icon:'⊞', maxLevel:10, baseCost:4000, costMult:1.28,
    desc:'Catch multiple fish per auto cast. Requires Auto Speed 8.',
    requires: { auto_speed: 8 },
    effect: l => `${l+1} fish per auto cast`,
    statFn: l => ({ autoNetCount: l+1 }),
  },
  {
    id:'auto_charm', name:'Auto Charm Sense', icon:'🍀', maxLevel:10, baseCost:2500, costMult:1.25,
    desc:'Autofish can find charms. Requires Auto Speed 5.',
    requires: { auto_speed: 5 },
    effect: l => `Auto charm find rate +${l*8}%`,
    statFn: l => ({ autoCharmBonus: l*0.08 }),
  },
];

// ── COMPUTE ALL STATS ─────────────────────────────────────────
function computeStats(G) {
  const upgLvls  = G.upgLvls  || {};
  const autoLvls = G.autoLvls || {};
  const skillLvls= G.skillLevels || {};
  const charms   = G.charms || [];
  const enchants = G.enchantments || [];
  const activeBuffs = G.activeBuffs || [];

  const st = {
    // manual
    manualCooldownMult: 1, manualValueMult: 1, manualValueBonus: 0,
    manualCooldownMs: 6000,
    baitBonus: 0, bucketBase: 8, lineLevel: 0, escapeReduction: 0,
    lureMult: 1, displaySlots: 3, displayBonus: 0,
    // auto
    autoIntervalMs: 90000, autoStrLevel: 0, autoLuckMult: 1,
    autoBaitBonus: 0, autoNetCount: 1, autoCharmBonus: 0,
    // skills (computed separately)
    perceptionLevel: 0, enduranceLevel: 0, strengthLevel: 0, intuitionLevel: 0,
    // derived
    bucketSize: 8, luckBonus: 0, rarityBonus: 0, mutationBonus: 0,
    valueBonus: 0, sizeBonus: 0, charmDropRate: 0.015,
    charmDropBonus: 0, charmAmplify: 0, sessionLuckBonus: 0,
    rainbowBonus: 0, glowBonus: 0, prismaticBonus: 0, weatherBonus: 0,
    giantMutBonus: 0, epicBonus: 0, legendaryBonus: 0,
    rareValueBonus: 0, epicValueBonus: 0, autoSpeedBonus: 0,
    manualSpeedBonus: 0, luckMult: 1, valueMult: 1, speedMult: 1,
    sizeMult: 1, rarityMult: 1, charmMult: 1, forceWeather: null,
  };

  // apply upgrades
  for (const u of UPGRADES) {
    const l = upgLvls[u.id] || 0;
    if (l > 0) Object.assign(st, u.statFn(l));
  }
  for (const u of AUTO_UPGRADES) {
    const l = autoLvls[u.id] || 0;
    if (l > 0) Object.assign(st, u.statFn(l));
  }

  // apply skills
  for (const sk of SKILLS) {
    const l = skillLvls[sk.id] || 0;
    st[sk.id+'Level'] = l;
  }
  st.luckBonus    += (st.perceptionLevel||0) * 0.04;
  st.rarityBonus  += (st.perceptionLevel||0) * 0.035;
  st.mutationBonus+= (st.perceptionLevel||0) * 0.04;
  st.legendaryBonus+=(st.intuitionLevel||0) * 0.018;
  st.bucketSize    = st.bucketBase + (st.enduranceLevel||0) * 2;
  st.charmDropRate = 0.002 + (st.perceptionLevel||0)*0.0008; // 0.2% base, perception scales it slowly

  // apply charms
  applyCharmEffects(charms.filter(c=>c.equipped), st);

  // apply enchantments (levelled — G.enchantments is now {id: level} object)
  const enchantObj = Array.isArray(enchants)
    ? Object.fromEntries(enchants.map(e=>typeof e==='string'?[e,1]:[e.id,e.level||1]))
    : enchants;
  for (const [eid, lvl] of Object.entries(enchantObj||{})) {
    const def = ENCHANTMENT_DEFS.find(e=>e.id===eid);
    if (def && lvl > 0) def.applyFn(lvl)(st);
  }

  // apply prestige bonuses
  if (G && G.prestige && G.prestige.count > 0) {
    const pb = computePrestigeBonuses(G.prestige.count);
    st.valueMult  *= pb.valueMult;
    st.charmDropBonus += pb.charmBonus;
    st.mutationBonus  += pb.mutBonus;
  }

  // mash bar stats — strength reduces clicks needed, rod reduces decay
  st.mashClicksNeeded = Math.max(3, Math.round(12 - (st.strengthLevel||0) * 0.38));
  st.mashDecayRate    = Math.max(0.03, 0.13 - (st.rodLevel||0) * 0.004);

  // apply temp buffs (levelled)
  const now = Date.now();
  for (const b of activeBuffs) {
    if (b.expiresAt > now) {
      const def = TEMP_BUFF_DEFS.find(tb=>tb.id===b.id);
      if (!def) continue;
      const apply = def.applyFn(b.level||1);
      if (apply.luckMult)         st.luckMult    *= apply.luckMult;
      if (apply.valueMult)        st.valueMult   *= apply.valueMult;
      if (apply.speedMult)        st.speedMult   *= apply.speedMult;
      if (apply.rarityMult)       st.rarityMult  *= apply.rarityMult;
      if (apply.sizeMult)         st.sizeMult    *= apply.sizeMult;
      if (apply.charmMult)        st.charmMult   *= apply.charmMult;
      if (apply.forceWeather)     st.forceWeather = apply.forceWeather;
      if (apply.forceSweetWeather)st.forceSweetWeather = true;
    }
  }

  // final cooldown calc
  st.manualCooldownMs = Math.round(6000 * st.manualCooldownMult * (1/(st.speedMult||1)) * (1/(1+(st.manualSpeedBonus||0))));
  st.manualCooldownMs = Math.max(8000, st.manualCooldownMs); // cap at 8s min

  return st;
}

// ── SKILL XP HELPERS ─────────────────────────────────────────
function totalXPForLevel(skill, lvl) {
  let t = 0;
  for (let i = 1; i <= lvl; i++) t += skill.xpPerLevel[i] || 0;
  return t;
}

function xpProgress(skill, G) {
  const sk = skill.id;
  const lvl = (G.skillLevels||{})[sk] || 0;
  if (lvl >= skill.maxLevel) return { pct:1, cur:0, need:0, lvl };
  const earned = (G.skillXP||{})[sk] || 0;
  const prev = totalXPForLevel(skill, lvl);
  const need = skill.xpPerLevel[lvl+1] || Infinity;
  const cur = Math.max(0, earned - prev);
  return { pct: Math.min(1, cur/need), cur, need, lvl };
}

function skillReqMet(req, skillLvls) {
  if (!req) return true;
  for (const [s,l] of Object.entries(req)) if ((skillLvls[s]||0) < l) return false;
  return true;
}

function upgLevelName(upg, lvl) {
  if (!upg.levelNames) return `${upg.name} Lv${lvl}`;
  const keys = Object.keys(upg.levelNames).map(Number).sort((a,b)=>b-a);
  for (const k of keys) if (lvl >= k) return upg.levelNames[k];
  return upg.name;
}

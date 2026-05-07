// core/state.js — save, load, default state, prestige, offline calc

const SAVE_KEY = 'fwish_v1';
const OFFLINE_MAX_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days cap
const OFFLINE_SPEED_FACTOR = 1/3; // 1/3 speed while offline

// ── PRESTIGE TITLES ───────────────────────────────────────────
const PRESTIGE_TITLES = [
  { n:1,  title:'Muddy Boots',      icon:'🥾', valueMult:0.10 },
  { n:2,  title:'River Regular',    icon:'🌊', valueMult:0.12 },
  { n:3,  title:'Still Water Soul', icon:'🪨', valueMult:0.15 },
  { n:4,  title:'The Patient One',  icon:'⏳', valueMult:0.18 },
  { n:5,  title:'Depths Caller',    icon:'🌀', valueMult:0.22, charmBonus:0.15 },
  { n:6,  title:'Tide Watcher',     icon:'🌕', valueMult:0.26 },
  { n:7,  title:'Moon Fisher',      icon:'✨', valueMult:0.30 },
  { n:8,  title:'The Drowned',      icon:'🕯', valueMult:0.35, mutBonus:0.20 },
  { n:9,  title:'Void-touched',     icon:'🌑', valueMult:0.40 },
  { n:10, title:'Still Waters',     icon:'🐉', valueMult:0.50, charmBonus:0.25, mutBonus:0.30 },
];

function computePrestigeBonuses(count) {
  let valueMult = 1.0, charmBonus = 0, mutBonus = 0;
  for (let i = 1; i <= Math.min(count, PRESTIGE_TITLES.length); i++) {
    const pt = PRESTIGE_TITLES[i-1];
    valueMult  += pt.valueMult  || 0;
    charmBonus += pt.charmBonus || 0;
    mutBonus   += pt.mutBonus   || 0;
  }
  return { valueMult, charmBonus, mutBonus };
}

function defaultPrestige() { return { count:0, title:'', titleIcon:'', history:[] }; }
function defaultRecords() {
  return { biggestFish:null, rarestMutation:null, mostExpensiveFish:null, bestSessionEarned:0, longestSession:0, totalPrestiges:0 };
}

function defaultState() {
  return {
    money: 10, totalEarned: 0, totalCaught: 0,
    bucket: [], displayTank: [], logbook: {},
    charms: [], equippedCharms: [null, null],
    enchantments: [], activeBuffs: [],
    upgLvls:    { rod:0, bait:0, bucket:0, line:0, lure:0, display:0 },
    autoLvls:   { auto_speed:0, auto_strength:0, auto_luck:0, auto_bait:0, auto_net:0, auto_charm:0 },
    skillLevels:{ perception:0, endurance:0, strength:0, intuition:0 },
    skillXP:    { perception:0, endurance:0, strength:0, intuition:0 },
    location: 'pond', unlockedLocs: ['pond'],
    autosellOn: true,   // autosell toggle — on by default
    achievements: [],
    stats: {
      raresCaught:0, epicsCaught:0, legendsCaught:0,
      mutationsCaught:0, rainbowCaught:0, glowingCaught:0,
      prismaticCaught:0, voidCaught:0, colossalCaught:0, titanicCaught:0,
      specialWeathersSeen:0, lasagnaRain:0, sessionMinutes:0,
    },
    records: defaultRecords(),
    prestige: defaultPrestige(),
    // snapshot saved at close for offline calc
    offlineSnapshot: null,
    sessionStart: Date.now(),
    sessionEarned: 0,
    lastSave: Date.now(),
    lastPlayed: Date.now(),
  };
}

// ── OFFLINE SNAPSHOT ─────────────────────────────────────────
// Called on save — captures what we need to calc offline progress
function makeOfflineSnapshot(G, ST) {
  if ((G.autoLvls.auto_speed || 0) < 1) return null; // no autofish unlocked
  return {
    autoIntervalMs: ST.autoIntervalMs || 90000,
    autoNetCount:   ST.autoNetCount   || 1,
    baitBonus:      ST.autoBaitBonus  || 0,
    strLevel:       ST.autoStrLevel   || 0,
    luckMult:       ST.autoLuckMult   || 1,
    location:       G.location,
    skillLevels:    { ...G.skillLevels },
    bucketSize:     ST.bucketSize || 8,
    autosellOn:     G.autosellOn,
    valueMult:      ST.valueMult || 1,
    valueBonus:     ST.valueBonus || 0,
    savedAt:        Date.now(),
  };
}

// ── OFFLINE PROGRESS CALC ────────────────────────────────────
function calcOfflineProgress(G) {
  const snap = G.offlineSnapshot;
  if (!snap) return null;

  const now = Date.now();
  const awayMs = Math.min(now - snap.savedAt, OFFLINE_MAX_MS);
  if (awayMs < 30000) return null; // less than 30s — not worth calculating

  // offline interval = normal interval / (1/3 speed factor)
  const offlineIntervalMs = snap.autoIntervalMs / OFFLINE_SPEED_FACTOR;
  const catchCount = Math.floor(awayMs / offlineIntervalMs) * snap.autoNetCount;
  if (catchCount < 1) return null;

  // simulate catches using snapshot stats
  let moneyEarned = 0;
  let fishCaught  = 0;
  let autoSold    = 0;
  const tempBucket = [...G.bucket];
  const cap = snap.bucketSize;

  for (let i = 0; i < catchCount; i++) {
    // simple value estimate: avg fish value at this bait level
    const avgVal = estimateAvgFishValue(snap);
    const val = Math.round(avgVal * (0.7 + Math.random() * 0.6));

    if (tempBucket.length >= cap) {
      if (snap.autosellOn) {
        // autosell the bucket
        const sellable = tempBucket.filter(f => !f.favourited);
        const sold = sellable.reduce((s,f) => s+f.val, 0);
        moneyEarned += sold;
        autoSold += sellable.length;
        tempBucket.splice(0, tempBucket.length, ...tempBucket.filter(f => f.favourited));
      } else {
        break; // bucket full, stop catching
      }
    }

    // add a simple fish object
    tempBucket.push({ id: Date.now()+i, fishId:'perch', name:'fish', rarity:'common', val, wt:1, len:20, mut:'none', mutLabel:'', sizeId:'average', sizeLabel:'', isAuto:true, weatherId:'clear', caughtAt:Date.now(), favourited:false });
    fishCaught++;
  }

  // final autosell of remainder if on
  if (snap.autosellOn) {
    const sellable = tempBucket.filter(f => !f.favourited);
    const sold = sellable.reduce((s,f) => s+f.val, 0);
    moneyEarned += sold;
    autoSold += sellable.length;
    // only keep favourited in bucket
    G.bucket = [...G.bucket.filter(f => f.favourited)];
  } else {
    // merge temp bucket up to cap
    for (const f of tempBucket) {
      if (G.bucket.length < cap) G.bucket.push(f);
    }
  }

  G.money       += moneyEarned;
  G.totalEarned += moneyEarned;
  G.totalCaught += fishCaught;
  G.sessionEarned = (G.sessionEarned||0) + moneyEarned;

  const hours = (awayMs / 3600000).toFixed(1);
  const days  = awayMs >= 86400000 ? `${(awayMs/86400000).toFixed(1)} days` : `${hours} hours`;

  return { awayMs, fishCaught, moneyEarned, autoSold, days };
}

function estimateAvgFishValue(snap) {
  // base value by location — matches actual fish pools roughly
  const locBase = {
    pond: 4, river: 8, lake: 15, deepsea: 35, cave: 55, moonpool: 90
  };
  const base = locBase[snap.location] || 4;
  const bait = snap.baitBonus || 0;
  // bait shifts the rarity pool so value scales up significantly
  const baitMult = 1 + bait * 3;
  return Math.round(base * baitMult * (snap.valueMult || 1) * (1 + (snap.valueBonus||0)));
}

// ── SAVE / LOAD ───────────────────────────────────────────────
function saveGame(G, ST) {
  try {
    G.lastSave   = Date.now();
    G.lastPlayed = Date.now();
    if (ST) G.offlineSnapshot = makeOfflineSnapshot(G, ST);
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  } catch(e) { console.warn('Save failed:', e); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const def = defaultState();
    const G = { ...def, ...saved };
    G.upgLvls     = { ...def.upgLvls,     ...(saved.upgLvls||{}) };
    G.autoLvls    = { ...def.autoLvls,    ...(saved.autoLvls||{}) };
    G.skillLevels = { ...def.skillLevels, ...(saved.skillLevels||{}) };
    G.skillXP     = { ...def.skillXP,     ...(saved.skillXP||{}) };
    G.stats       = { ...def.stats,       ...(saved.stats||{}) };
    G.records     = { ...def.records,     ...(saved.records||{}) };
    G.prestige    = { ...defaultPrestige(), ...(saved.prestige||{}) };
    if (!Array.isArray(G.bucket))       G.bucket = [];
    if (!Array.isArray(G.displayTank))  G.displayTank = [];
    if (!Array.isArray(G.charms))       G.charms = [];
    if (!Array.isArray(G.activeBuffs))  G.activeBuffs = [];
    if (!Array.isArray(G.achievements)) G.achievements = [];
    if (!Array.isArray(G.unlockedLocs)) G.unlockedLocs = ['pond'];
    if (!G.equippedCharms) G.equippedCharms = [null, null];
    if (G.autosellOn === undefined) G.autosellOn = true;
    if (!G.sessionEarned) G.sessionEarned = 0;
    G.sessionStart = Date.now();
    return G;
  } catch(e) { console.warn('Load failed:', e); return defaultState(); }
}

function exportSave(G) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(G)))); }
  catch(e) { return JSON.stringify(G); }
}

function importSave(str) {
  if (!str || typeof str !== 'string') return null;
  str = str.trim();
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch(e) {}
  try { return JSON.parse(str); } catch(e) {}
  return null;
}

// ── PRESTIGE ─────────────────────────────────────────────────
function prestigeRequirementsMet(G) {
  const minEarned = Math.round(500000 * Math.pow(2.5, G.prestige.count));
  if (G.totalEarned < minEarned)
    return { ok:false, reason:`Need 🪙${minEarned.toLocaleString()} earned this run (have 🪙${G.totalEarned.toLocaleString()})` };
  const minSkill = Math.min(20, 8 + G.prestige.count * 2);
  for (const sk of Object.keys(G.skillLevels))
    if ((G.skillLevels[sk]||0) < minSkill)
      return { ok:false, reason:`All skills must be level ${minSkill}+ (${sk} is ${G.skillLevels[sk]||0})` };
  return { ok:true };
}

function doPrestige(G) {
  const check = prestigeRequirementsMet(G);
  if (!check.ok) return { ok:false, msg:check.reason };
  const newCount = G.prestige.count + 1;
  const ptData = PRESTIGE_TITLES[Math.min(newCount-1, PRESTIGE_TITLES.length-1)];
  const histEntry = { n:newCount, title:ptData.title, icon:ptData.icon, totalEarned:G.totalEarned, totalCaught:G.totalCaught, date:Date.now() };
  const newPrestige = { count:newCount, title:ptData.title, titleIcon:ptData.icon, history:[...(G.prestige.history||[]), histEntry] };
  const records = { ...(G.records||defaultRecords()), totalPrestiges:newCount };
  const fresh = defaultState();
  fresh.prestige    = newPrestige;
  fresh.records     = records;
  fresh.achievements= G.achievements;
  fresh.money = 50 + newCount * 25;
  return { ok:true, fresh, ptData };
}

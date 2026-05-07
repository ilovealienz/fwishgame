// core/game.js — main loop, mash mechanic, prestige, records

const WEATHER_CHANGE_MIN = 12 * 60 * 1000;
const WEATHER_CHANGE_MAX = 22 * 60 * 1000;
const FLAVOR_MIN         = 2  * 60 * 1000;
const FLAVOR_MAX         = 5  * 60 * 1000;
const SAVE_INTERVAL      = 30 * 1000;
const SESSION_TICK       = 60 * 1000;
const ACHIEVEMENT_CHECK  = 15 * 1000;
const SESSION_LUCK_THRESHOLD = 20 * 60 * 1000;

let G, ST;
let weather = null;
let nextWeatherIn = 0;
let nextFlavorIn  = 0;
let autoAccum     = 0;
let saveAccum     = 0;
let sessionAccum  = 0;
let achAccum      = 0;
let lastTs        = null;
let sessionLuckActive = false;

// ── MASH BAR STATE ────────────────────────────────────────────
// Instead of a single click, player mashes to fill a 0–1 bar.
// When it hits 1.0 a fish bites and gets reeled in.
// Bar decays continuously. Strength = fewer clicks needed.
// Rod = slower decay. Between casts there's a cooldown.
let mashBar      = 0;   // 0.0 – 1.0
let mashCooldown = 0;   // ms remaining between casts
let mashFishing  = false; // true while bar is active (casting phase)

const MASH_CLICK_FILL = () => 1 / (ST?.mashClicksNeeded || 8); // per click
const MASH_DECAY      = () => (ST?.mashDecayRate || 0.13);      // per second
const CAST_COOLDOWN   = () => {                                  // ms after landing
  const base = 4000;
  const spd  = (ST?.speedMult||1) * (1 + (ST?.manualSpeedBonus||0));
  return Math.round(Math.max(2500, base / spd));
};

// ── FIGHT-BACK HELPERS ───────────────────────────────────────
let _fightBackTimer = 0;
let _pendingFishRarity = 'common'; // set when cast starts

function _nextFightBack() {
  // rarer fish fight more often
  const base = { common:8000, uncommon:6000, rare:4500, epic:3000, legendary:2000 };
  const t = base[_pendingFishRarity] || 6000;
  return t * (0.5 + Math.random());
}

function _fightYank() {
  // how much the bar drops — rarer = bigger yank
  // common barely fights, legendary can yank 40%+
  const base = { common:0.04, uncommon:0.10, rare:0.18, epic:0.28, legendary:0.40 };
  const b = base[_pendingFishRarity] || 0.08;
  return b * (0.6 + Math.random() * 0.8);
}


// ── AUTOSELL ─────────────────────────────────────────────────
function doAutosell(force=false) {
  if (!G.autosellOn) return 0;
  const max = ST.bucketSize || 8;
  const threshold = Math.floor(max * 0.8);
  if (!force && G.bucket.length < threshold) return 0;
  const sellable = G.bucket.filter(f => !f.favourited);
  if (!sellable.length) return 0;
  const total = sellable.reduce((s,f) => s+f.val, 0);
  G.money       += total;
  G.totalEarned += total;
  G.sessionEarned = (G.sessionEarned||0) + total;
  G.bucket = G.bucket.filter(f => f.favourited);
  if (total > 0) {
    G.sessionEarned = (G.sessionEarned||0) + total;
    if (G.sessionEarned > (G.records.bestSessionEarned||0))
      G.records.bestSessionEarned = G.sessionEarned;
    addLog(`💰 Auto-sold ${sellable.length} fish — 🪙${total.toLocaleString()}`, 'sell');
  }
  updateHeader();
  renderBucketIfActive();
  saveGame(G, ST);
  return total;
}

function toggleAutosell() {
  G.autosellOn = !G.autosellOn;
  updateAutosellBtn();
  addLog(G.autosellOn ? '💰 Autosell on — bucket sells at 80% full.' : '💰 Autosell off.', 'event');
  saveGame(G, ST);
}

// ── INIT ──────────────────────────────────────────────────────
function initGame() {
  G  = loadGame();
  ST = computeStats(G);

  // ── OFFLINE PROGRESS ──────────────────────────────────────
  const offlineResult = calcOfflineProgress(G);
  G.offlineSnapshot = null; // clear after using
  // ─────────────────────────────────────────────────────────

  // restore saved weather if it hasn't expired
  if (G._weather && G._weatherExpiresAt && G._weatherExpiresAt > Date.now()) {
    weather = WX_BY_ID[G._weather] || randWeather();
    nextWeatherIn = G._weatherExpiresAt - Date.now();
  } else {
    weather = randWeather();
    nextWeatherIn = WEATHER_CHANGE_MIN + Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN);
    G._weather = weather?.id;
    G._weatherExpiresAt = Date.now() + nextWeatherIn;
  }
  nextFlavorIn  = FLAVOR_MIN + Math.random() * (FLAVOR_MAX - FLAVOR_MIN);
  const loc = LOC_BY_ID[G.location];
  addLog(`You settle in at ${loc ? loc.name : 'the water\'s edge'}.`, 'event');
  if (loc) addLog(loc.ambient, 'flavor');
  if (G.prestige.count > 0) addLog(`${G.prestige.titleIcon} Welcome back, ${G.prestige.title}.`, 'event');

  // Show offline summary
  if (offlineResult) {
    addLog(`⏱ Away for ${offlineResult.days} — autofish kept going.`, 'event');
    addLog(`  ${offlineResult.fishCaught.toLocaleString()} fish caught · 🪙${offlineResult.moneyEarned.toLocaleString()} earned${offlineResult.autoSold>0?' · '+offlineResult.autoSold+' auto-sold':''}`, 'sell');
    if (typeof showToast === 'function') showToast(`Welcome back! +🪙${offlineResult.moneyEarned.toLocaleString()} while you were away`, 5000);
  }

  G.sessionEarned = 0;
  initCharmCounter(G.charms);
  checkAchievements(G, awardAchievement);
  renderAll();
  updateAutosellBtn();
  if (typeof closePanel === 'function') closePanel();
  // force a clean render into whichever panel element is visible
  requestAnimationFrame(() => {
    if (typeof getPanelEl === 'function' && typeof renderPanel === 'function') {
      const el = getPanelEl();
      if (el) { panelOpen = true; renderPanel(); }
    }
  });
  requestAnimationFrame(gameLoop);
}

// ── MAIN LOOP ─────────────────────────────────────────────────
function gameLoop(ts) {
  if (lastTs === null) lastTs = ts;
  const delta = Math.min(ts - lastTs, 5000);
  lastTs = ts;
  const dt = delta / 1000; // seconds

  // mash bar decay + fish fight-back
  if (mashFishing && mashBar > 0) {
    mashBar = Math.max(0, mashBar - MASH_DECAY() * dt);

    // fight-back: fish yanks the bar down randomly
    // triggered roughly every 3-8s, harder for rarer fish
    if (!_fightBackTimer) _fightBackTimer = _nextFightBack();
    _fightBackTimer -= delta;
    if (_fightBackTimer <= 0) {
      _fightBackTimer = _nextFightBack();
      const yank = _fightYank();
      if (yank > 0) {
        mashBar = Math.max(0, mashBar - yank);
        renderMashBar();
        // flash the bar red briefly
        const fill = document.getElementById('mash-fill');
        if (fill) { fill.style.background='#c06060'; setTimeout(()=>renderMashBar(),180); }
      }
    }

    if (mashBar === 0) {
      addLog('The fish got away...', 'flavor');
      mashFishing = false;
      _fightBackTimer = 0;
      mashCooldown = Math.round(CAST_COOLDOWN() * 0.4);
      updateCastBtn();
    }
    renderMashBar();
  }

  // cast cooldown
  if (mashCooldown > 0) {
    mashCooldown = Math.max(0, mashCooldown - delta);
    if (mashCooldown === 0) updateCastBtn();
    renderMashBar();
  }

  // autofish — always runs if auto_speed is unlocked
  if ((G.autoLvls.auto_speed||0) >= 1) {
    autoAccum += delta;
    const interval = Math.round((ST.autoIntervalMs||90000) / (ST.speedMult||1));
    if (autoAccum >= interval) {
      autoAccum -= interval;
      doAutoFish();
    }
  }

  // weather
  nextWeatherIn -= delta;
  if (nextWeatherIn <= 0) {
    tickWeather();
    nextWeatherIn = WEATHER_CHANGE_MIN + Math.random() * (WEATHER_CHANGE_MAX - WEATHER_CHANGE_MIN);
  }

  // flavor text
  nextFlavorIn -= delta;
  if (nextFlavorIn <= 0) {
    const txt = getIdleFlavour(G.location);
    if (txt) addLog(txt, 'flavor');
    nextFlavorIn = FLAVOR_MIN + Math.random() * (FLAVOR_MAX - FLAVOR_MIN);
  }

  // session tracking + display tank income
  sessionAccum += delta;
  if (sessionAccum >= SESSION_TICK) {
    sessionAccum -= SESSION_TICK;
    G.stats.sessionMinutes = Math.floor((Date.now() - G.sessionStart) / 60000);
    if (G.stats.sessionMinutes > (G.records.longestSession||0))
      G.records.longestSession = G.stats.sessionMinutes;
    if (!sessionLuckActive && Date.now() - G.sessionStart >= SESSION_LUCK_THRESHOLD) {
      sessionLuckActive = true;
      addLog('🍀 You\'ve been here a while. The water feels lucky today.', 'event');
    }
    // display tank passive income — 2% of each fish's value per minute, scaled by displayBonus
    if (G.displayTank.length > 0 && (ST.displayBonus||0) > 0) {
      const rate = 0.02 + (ST.displayBonus||0); // base 2% + upgrade bonus
      const income = Math.floor(G.displayTank.reduce((s,f) => s + f.val * rate, 0));
      if (income > 0) {
        G.money       += income;
        G.totalEarned += income;
        G.sessionEarned = (G.sessionEarned||0) + income;
        if (G.sessionEarned > (G.records.bestSessionEarned||0))
          G.records.bestSessionEarned = G.sessionEarned;
        updateHeader();
        addLog(`🖼 Display tank — 🪙${income}/min`, 'sell');
      }
    }
  }

  // expire buffs
  const prevLen = G.activeBuffs.length;
  G.activeBuffs = G.activeBuffs.filter(b => b.expiresAt > Date.now());
  if (G.activeBuffs.length !== prevLen) { ST = computeStats(G); renderHud(); }

  // autosave
  saveAccum += delta;
  if (saveAccum >= SAVE_INTERVAL) {
    saveAccum = 0;
    G._weather = weather?.id;
    G._weatherExpiresAt = Date.now() + nextWeatherIn;
    saveGame(G, ST);
  }

  // achievements
  achAccum += delta;
  if (achAccum >= ACHIEVEMENT_CHECK) { achAccum = 0; checkAchievements(G, awardAchievement); }

  requestAnimationFrame(gameLoop);
}

// ── WEATHER ───────────────────────────────────────────────────
function tickWeather() {
  let nw;
  if (ST.forceSweetWeather) { const sw=WEATHER.filter(w=>w.rare); nw=sw[Math.floor(Math.random()*sw.length)]; }
  else if (ST.forceWeather) nw = WX_BY_ID[ST.forceWeather]||randWeather();
  else nw = randWeather();
  if (!weather || nw.id !== weather.id) {
    weather = nw;
    const f = weather.flavour[Math.floor(Math.random()*weather.flavour.length)];
    addLog(`${weather.icon} ${weather.name} — ${f}`, weather.rare?'event':'flavor');
    if (weather.rare) {
      G.stats.specialWeathersSeen++;
      if (weather.id==='lasagna_rain') G.stats.lasagnaRain++;
      if (weather.specialEffect) addLog(`✨ ${weather.specialEffect}`, 'event');
    }
    renderScene();
    renderHud();
    checkAchievements(G, awardAchievement);
  }
}

// ── MASH MECHANIC ─────────────────────────────────────────────
function startCast() {
  if (mashCooldown > 0 || mashFishing) return;
  const max = ST.bucketSize || 8;
  if (G.bucket.length >= max) {
    if (G.autosellOn) { doAutosell(true); }
    else { addLog('🪣 Bucket is full — sell some fish first.', 'event'); return; }
    if (G.bucket.length >= max) return; // still full after autosell (all favourited)
  }
  // peek at what fish rarity might be on the line (rough estimate from pool)
  const pool = getFishPool(G.location, ST.baitBonus||0, G.skillLevels, weather?.id||'clear');
  const sample = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
  _pendingFishRarity = sample?.rarity || 'common';
  _fightBackTimer = _nextFightBack();
  mashFishing = true;
  mashBar = 0;
  updateCastBtn();
  renderMashBar();
}

function mashClick() {
  if (mashCooldown > 0) return;
  // spawn ripple for tactile feedback
  const rippleContainer = document.getElementById('ripples');
  if (rippleContainer) {
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = (20+Math.random()*60)+'%';
    r.style.top  = (30+Math.random()*50)+'%';
    rippleContainer.appendChild(r);
    setTimeout(()=>r.remove(), 3600);
  }
  if (!mashFishing) {
    startCast();
    return;
  }
  // fill bar
  mashBar = Math.min(1, mashBar + MASH_CLICK_FILL());
  renderMashBar();

  if (mashBar >= 1) {
    // caught!
    mashBar = 1;
    mashFishing = false;
    mashCooldown = CAST_COOLDOWN();
    landManualFish();
    updateCastBtn();
  }
}

function landManualFish() {
  const fish = buildCatch(G, ST, false, weather.id);
  if (!fish) {
    addLog('It slipped off the hook.', 'flavor');
    return;
  }
  const isNew = landFish(G, ST, fish);
  updateRecords(fish);
  if (typeof triggerCatchAnimation === 'function') triggerCatchAnimation(fish);
  logCatchToUI(fish, isNew, false);
  // check autosell after every manual catch
  if (G.autosellOn) doAutosell();
  const charm = rollCharmDrop(G, ST, false);
  if (charm) addLog(`🍀 A charm — ${charm.emoji} ${charm.name} (${charm.rarity})!`, 'event');
  // warn at 196, block message at 200
  const charmCount = G.charms.length;
  if (charmCount >= 200 && G._charmBagFull) {
    if (typeof showToast === 'function') showToast('🍀 Charm bag full (200/200) — release some charms to find more!', 5000);
    G._charmBagFull = false; // reset so it doesn't spam
  } else if (charmCount >= 196 && charmCount < 200 && !G._charmWarned196) {
    G._charmWarned196 = true;
    if (typeof showToast === 'function') showToast(`🍀 Charm bag almost full (${charmCount}/200) — release some soon!`, 5000);
  } else if (charmCount < 196) {
    G._charmWarned196 = false;
  }
  ST = computeStats(G);
  updateHeader();
  renderBucketIfActive();
  checkAchievements(G, awardAchievement);
}

// ── RECORDS ───────────────────────────────────────────────────
function updateRecords(fish) {
  const r = G.records;
  if (!r.biggestFish || fish.wt > r.biggestFish.wt) r.biggestFish = fish;
  if (!r.mostExpensiveFish || fish.val > r.mostExpensiveFish.val) r.mostExpensiveFish = fish;
  // rarest mutation: void > prismatic > cursed > ancient > glowing > rainbow > twin/shadow/giant > albino > none
  const mutRank = {none:0,albino:1,twin:2,shadow:2,giant:2,rainbow:3,glowing:3,cursed:4,ancient:4,prismatic:5,void:6};
  const curRank  = mutRank[fish.mut] || 0;
  const prevRank = r.rarestMutation ? (mutRank[r.rarestMutation.mut]||0) : -1;
  if (curRank > prevRank) r.rarestMutation = fish;
  // session earnings
  G.sessionEarned = (G.sessionEarned||0);
  if (G.sessionEarned > (r.bestSessionEarned||0)) r.bestSessionEarned = G.sessionEarned;
}

function trackSellForRecords(amount) {
  G.sessionEarned = (G.sessionEarned||0) + amount;
  if (G.sessionEarned > (G.records.bestSessionEarned||0))
    G.records.bestSessionEarned = G.sessionEarned;
}

// ── AUTOFISH ─────────────────────────────────────────────────
function doAutoFish() {
  const max = ST.bucketSize || 8;
  // bucket full — autosell if on, otherwise skip this cycle
  if (G.bucket.length >= max) {
    if (G.autosellOn) doAutosell();
    else return;
  }
  const count = ST.autoNetCount || 1;
  let caught = 0;
  for (let i = 0; i < count; i++) {
    if (G.bucket.length >= max) break;
    const fish = buildCatch(G, ST, true, weather.id);
    if (fish) { const isNew=landFish(G,ST,fish,true); updateRecords(fish); logCatchToUI(fish,isNew,true); caught++; }
  }
  if (caught > 0) {
    const charm = rollCharmDrop(G, ST, true);
    if (charm) addLog(`🍀 Auto charm — ${charm.emoji} ${charm.name} (${charm.rarity})!`, 'event');
    const charmCount = G.charms.length;
    if (charmCount >= 200 && G._charmBagFull) {
      if (typeof showToast === 'function') showToast('🍀 Charm bag full (200/200) — release some charms to find more!', 5000);
      G._charmBagFull = false;
    } else if (charmCount >= 196 && charmCount < 200 && !G._charmWarned196) {
      G._charmWarned196 = true;
      if (typeof showToast === 'function') showToast(`🍀 Charm bag almost full (${charmCount}/200) — release some soon!`, 5000);
    } else if (charmCount < 196) {
      G._charmWarned196 = false;
    }
    ST = computeStats(G);
    updateHeader();
    // check autosell after auto-catches
    doAutosell();
    renderBucketIfActive();
    checkAchievements(G, awardAchievement);
    saveGame(G, ST);
  }
}

// ── ACHIEVEMENT AWARD ─────────────────────────────────────────
function awardAchievement(ach) {
  G.achievements.push(ach.id);
  addLog(`🏆 ${ach.name} — ${ach.desc}`, 'event');
  if (ach.reward) {
    if (ach.reward.money) { G.money += ach.reward.money; G.totalEarned += ach.reward.money; addLog(`  +🪙${ach.reward.money}`, 'sell'); }
    if (ach.reward.charmDrop) { const c=rollCharm(0.5); G.charms.push(c); addLog(`  +Charm: ${c.emoji} ${c.name} (${c.rarity})`, 'event'); }
    updateHeader();
  }
}

// autofish always runs — no toggle needed

// ── UI ACTIONS ────────────────────────────────────────────────
function uiSellAll() {
  const total = sellAll(G);
  if (total > 0) {
    trackSellForRecords(total);
    addLog(`Sold fish for 🪙${total.toLocaleString()}.`, 'sell');
    ST = computeStats(G); updateHeader(); renderBucketIfActive(); saveGame(G, ST);
  } else { addLog('Nothing sellable in the bucket.', 'flavor'); }
}

function uiSellOne(fishId) {
  const val = sellOne(G, fishId);
  if (val > 0) {
    trackSellForRecords(val);
    addLog(`Sold for 🪙${val}.`, 'sell');
    updateHeader(); renderBucketIfActive(); saveGame(G, ST);
  }
}

function uiFavouriteToggle(fishId) { favouriteToggle(G, fishId); renderBucketIfActive(); saveGame(G, ST); }

function uiSendToDisplay(fishId) {
  const ok = sendToDisplay(G, ST, fishId);
  if (ok) { addLog('Fish added to display.', 'event'); renderBucketIfActive(); if(activeTab==='display')renderPanel(); checkAchievements(G,awardAchievement); saveGame(G, ST); }
  else addLog('Display tank is full.', 'flavor');
}

function uiRemoveFromDisplay(fishId) { removeFromDisplay(G, fishId, ST); if(activeTab==='display')renderPanel(); renderBucketIfActive(); updateHeader(); saveGame(G, ST); }

function uiBuyUpgrade(uid) {
  const res = buyUpgrade(G, uid);
  if (res.ok) {
    const upg = UPGRADES.find(u=>u.id===uid);
    addLog(`${upg.icon} ${upg.name} — ${upgLevelName(upg,res.newLevel)} (Lv${res.newLevel})`, 'event');
    ST = computeStats(G); updateHeader(); if(activeTab==='shop')renderPanel(); saveGame(G, ST);
  } else addLog(res.msg, 'flavor');
}

function uiBuyAutoUpgrade(uid) {
  const res = buyAutoUpgrade(G, uid);
  if (res.ok) {
    const upg = AUTO_UPGRADES.find(u=>u.id===uid);
    addLog(`⟳ ${upg.name} level ${res.newLevel}`, 'event');
    ST = computeStats(G); updateHeader(); if(activeTab==='auto')renderPanel(); saveGame(G, ST);
  } else addLog(res.msg, 'flavor');
}

function uiReleaseCharm(uid) {
  const charm = G.charms.find(c => c.uid === uid);
  if (!charm) return;
  if ((G.equippedCharms||[]).includes(uid)) {
    showToast('Unequip this charm first before releasing it.', 3000);
    return;
  }
  if (!confirm(`Release ${charm.emoji} ${charm.name} (${charm.rarity})? This cannot be undone.`)) return;
  G.charms = G.charms.filter(c => c.uid !== uid);
  if (typeof showToast === 'function') showToast(`Released ${charm.emoji} ${charm.name}.`, 2500);
  if (activeTab==='charms') renderPanel();
  saveGame(G, ST);
}

function uiEquipCharm(uid, slot)  { equipCharm(G,uid,slot); ST=computeStats(G); if(activeTab==='charms')renderPanel(); saveGame(G, ST); }
function uiUnequipCharm(slot)     { unequipCharm(G,slot);  ST=computeStats(G); if(activeTab==='charms')renderPanel(); saveGame(G, ST); }

function uiBuyBuff(buffId, level) {
  const res = buyBuff(G, buffId, level||1);
  if (res.ok) {
    const def = TEMP_BUFF_DEFS.find(b=>b.id===buffId);
    addLog(`${def.icon} ${def.name} Lv${res.level} — ${def.effectFn(res.level)}`, 'event');
    ST = computeStats(G); updateHeader(); if(activeTab==='buffs')renderPanel(); saveGame(G, ST);
  } else addLog(res.msg, 'flavor');
}

function uiBuyEnchant(eid) {
  const res = buyEnchant(G, eid);
  if (res.ok) {
    const def = ENCHANTMENT_DEFS.find(e=>e.id===eid);
    addLog(`${def.icon} ${def.name} Lv${res.newLevel} — ${def.effectFn(res.newLevel)}`, 'event');
    ST = computeStats(G); if(activeTab==='buffs')renderPanel(); saveGame(G, ST);
  } else addLog(res.msg, 'flavor');
}

function uiGoLocation(lid) {
  const res = goLocation(G, ST, lid);
  if (res.ok) {
    const loc = LOC_BY_ID[lid];
    addLog(`You move to ${loc.name}. ${loc.ambient}`, 'event');
    if (res.newlyUnlocked) addLog(`✦ ${loc.name} unlocked!`, 'event');
    ST = computeStats(G); renderScene(); updateHeader();
    if(activeTab==='places'&&panelOpen)renderPanel(); saveGame(G, ST); checkAchievements(G,awardAchievement);
  } else addLog(res.msg, 'flavor');
}

// ── PRESTIGE ─────────────────────────────────────────────────
function uiPrestige() {
  const check = prestigeRequirementsMet(G);
  if (!check.ok) { addLog(`Cannot prestige: ${check.reason}`, 'event'); return; }
  const nextN = G.prestige.count + 1;
  const ptData = PRESTIGE_TITLES[Math.min(nextN-1, PRESTIGE_TITLES.length-1)];
  const confirmed = confirm(
    `Prestige ${nextN}: ${ptData.icon} ${ptData.title}\n\n` +
    `This resets your run completely — upgrades, skills, money, fish — but keeps achievements and records.\n\n` +
    `Permanent bonus: ${ptData.valueMult*100}% more fish value forever${ptData.charmBonus?', +charm rate':''}${ptData.mutBonus?', +mutation chance':''}.\n\nContinue?`
  );
  if (!confirmed) return;
  const res = doPrestige(G);
  if (!res.ok) { addLog(res.msg, 'flavor'); return; }
  G = res.fresh;
  ST = computeStats(G);
  weather = randWeather();
  mashBar = 0; mashFishing = false; mashCooldown = 0;
  sessionLuckActive = false;
  addLog(`${res.ptData.icon} Prestige ${G.prestige.count}! You are now: ${res.ptData.title}`, 'event');
  addLog(`The pond looks the same. You are not.`, 'flavor');
  saveGame(G, ST);
  renderAll();
}

// ── SETTINGS ─────────────────────────────────────────────────
function openSettings() {
  const el = document.getElementById('settings-overlay');
  if (el) { el.style.display = 'flex'; el.classList.add('open'); }
}

function closeSettings(e) {
  if (e && e.target !== document.getElementById('settings-overlay')) return;
  const el = document.getElementById('settings-overlay');
  if (el) { el.style.display = 'none'; el.classList.remove('open'); }
}

function uiExportSave() {
  try {
    saveGame(G, ST); // make sure latest state is in the save first
    const data = exportSave(G);
    const blob = new Blob([data], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const date = new Date().toISOString().slice(0,10);
    a.href     = url;
    a.download = `fwish-save-${date}.fwish`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('💾 Save downloaded.', 'event');
  } catch(e) {
    addLog('Save export failed: ' + e.message, 'event');
  }
}

function uiImportSave() {
  document.getElementById('import-file-input')?.click();
}

function uiImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const raw = e.target.result;
      const imported = importSave(raw);
      if (!imported || typeof imported !== 'object') {
        addLog('⚠ Import failed — file is not a valid Fwish save.', 'event');
        return;
      }
      // Validate it has the bare minimum fields
      if (!('money' in imported) || !('totalCaught' in imported)) {
        addLog('⚠ Import failed — save file looks corrupt.', 'event');
        return;
      }
      if (!confirm('Import this save? Your current progress will be replaced.')) return;
      // Deep merge with defaultState for safety — fills in any missing fields
      const def = defaultState();
      G = { ...def, ...imported };
      G.upgLvls     = { ...def.upgLvls,     ...(imported.upgLvls||{}) };
      G.autoLvls    = { ...def.autoLvls,    ...(imported.autoLvls||{}) };
      G.skillLevels = { ...def.skillLevels, ...(imported.skillLevels||{}) };
      G.skillXP     = { ...def.skillXP,     ...(imported.skillXP||{}) };
      G.stats       = { ...def.stats,       ...(imported.stats||{}) };
      G.records     = { ...def.records,     ...(imported.records||{}) };
      G.prestige    = { ...def.prestige,    ...(imported.prestige||{}) };
      // Safety clamps
      if (!Array.isArray(G.bucket))       G.bucket = [];
      if (!Array.isArray(G.displayTank))  G.displayTank = [];
      if (!Array.isArray(G.charms))       G.charms = [];
      if (!Array.isArray(G.enchantments) && typeof G.enchantments !== 'object') G.enchantments = {};
      if (!Array.isArray(G.activeBuffs))  G.activeBuffs = [];
      if (!Array.isArray(G.achievements)) G.achievements = [];
      if (!Array.isArray(G.unlockedLocs)) G.unlockedLocs = ['pond'];
      if (!G.equippedCharms || !Array.isArray(G.equippedCharms)) G.equippedCharms = [null, null];
      G.money    = Math.max(0, Math.floor(G.money || 0));
      G.sessionStart = Date.now();
      G.sessionEarned = 0;
      ST = computeStats(G);
      weather = randWeather();
      mashBar = 0; mashFishing = false; mashCooldown = 0;
      sessionLuckActive = false;
      initCharmCounter(G.charms);
      saveGame(G, ST);
      closeSettings();
      addLog('✓ Save imported successfully.', 'event');
      renderAll();
    } catch(err) {
      addLog('⚠ Import failed — ' + err.message, 'event');
    }
  };
  reader.onerror = () => addLog('⚠ Could not read file.', 'event');
  reader.readAsText(file);
  // Reset input so same file can be imported again if needed
  event.target.value = '';
}

// ── HARD RESET ───────────────────────────────────────────────
function uiReset() {
  if (!confirm('Reset EVERYTHING — including prestige and records? This cannot be undone.')) return;
  localStorage.removeItem(SAVE_KEY);
  G = defaultState(); ST = computeStats(G);
  weather = randWeather(); sessionLuckActive = false;
  mashBar = 0; mashFishing = false; mashCooldown = 0;
  initCharmCounter([]);
  closeSettings();
  addLog('A fresh morning. Your line goes in.', 'event');
  renderAll();
}

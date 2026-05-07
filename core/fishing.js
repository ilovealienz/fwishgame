// core/fishing.js — catch logic, manual click, autofish, charm drops

// ── BUILD A CATCH ─────────────────────────────────────────────
function buildCatch(G, ST, isAuto, weatherId) {
  const baitBonus = isAuto
    ? (ST.autoBaitBonus || 0)
    : (ST.baitBonus || 0);

  const strLvl = isAuto
    ? (ST.autoStrLevel || 0)
    : (ST.strengthLevel || 0);

  // base luck
  const sessionMs = Date.now() - (G.sessionStart || Date.now());
  const sessionBonus = sessionMs > 20*60*1000
    ? (ST.sessionLuckBonus || 0) * Math.min(3, sessionMs/(20*60*1000)-1)
    : 0;

  const luckBonus = (ST.luckBonus||0)
    + (isAuto ? (ST.autoLuckMult||1)-1 : 0)
    + sessionBonus
    + ((ST.luckMult||1)-1);

  // get weather effects
  const wthr = WX_BY_ID[weatherId] || WEATHER[0];
  const wxRarityBonus = wthr.rB || 0;
  const wxValueBonus  = wthr.vB || 0;
  const wxSpeedMult   = wthr.sM || 1;
  const isSpecialWx   = wthr.rare || false;

  // get fish pool
  const pool = getFishPool(G.location, baitBonus + wxRarityBonus * 5, G.skillLevels, weatherId);
  if (!pool.length) return null;
  const fd = pool[Math.floor(Math.random() * pool.length)];

  // strength/escape check
  const strHave = strLvl + 1;
  const escapePct = Math.max(0, (fd.str||1) - strHave) * 0.18 - (ST.escapeReduction||0);
  if (Math.random() < escapePct) return null;

  // roll mutation with bonuses
  const mutLuckBonus = luckBonus
    + (ST.mutationBonus||0)
    + (isSpecialWx ? (ST.weatherBonus||0) * 0.5 : 0);
  const mut = rollMutation(mutLuckBonus);

  // roll size with strength and size bonus
  const sizeUpgrade = Math.floor((ST.sizeBonus||0) + (ST.sizeMult||1) - 1);
  const szTiers = fd.sw.map((w,i)=>{
    const boost = Math.max(0, i - 1) * sizeUpgrade * 5;
    return w + boost;
  });
  const st = rollSize(szTiers, strLvl + sizeUpgrade);
  const wt = rollWeight(st);
  const len = rollLength(st);

  // calc value
  let valueMult = 1
    + (ST.valueBonus||0)
    + wxValueBonus
    + ((ST.valueMult||1)-1);
  if (!isAuto) valueMult += (ST.manualValueMult||1)-1 + (ST.manualValueBonus||0);
  if (fd.rarity==='rare'||fd.rarity==='epic'||fd.rarity==='legendary') {
    valueMult += (ST.rareValueBonus||0);
    if (fd.rarity==='epic'||fd.rarity==='legendary') {
      valueMult += (ST.lureMult||1)-1;
      valueMult += (ST.epicValueBonus||0);
    }
  }
  // honeydew haze special
  if (weatherId==='honeydew_haze') valueMult *= 1.5;

  const val = calcFishValue(fd, st, wt, mut, Math.max(0.1, valueMult));

  return {
    id: Date.now() + Math.random(),
    fishId: fd.id, name: fd.name, rarity: fd.rarity,
    mut: mut.id, mutLabel: mut.label,
    sizeId: st.id, sizeLabel: st.label,
    wt, len, val,
    isAuto,
    weatherId,
    caughtAt: Date.now(),
    favourited: false,
  };
}

// ── LAND A FISH ───────────────────────────────────────────────
function landFish(G, ST, fish, isAuto=false) {
  const max = ST.bucketSize || 8;
  if (G.bucket.length >= max) return false;

  G.bucket.push(fish);
  G.totalCaught++;

  const fd = FISH_BY_ID[fish.fishId];

  // logbook
  const isNew = !G.logbook[fish.fishId];
  if (isNew) {
    G.logbook[fish.fishId] = { count:0, biggest:0, muts:[], firstCaught:Date.now() };
  }
  G.logbook[fish.fishId].count++;
  if (fish.wt > G.logbook[fish.fishId].biggest) G.logbook[fish.fishId].biggest = fish.wt;
  if (fish.mut !== 'none' && !G.logbook[fish.fishId].muts.includes(fish.mut)) {
    G.logbook[fish.fishId].muts.push(fish.mut);
  }

  // stats tracking
  if (fd) {
    if (fd.rarity==='rare')      G.stats.raresCaught++;
    if (fd.rarity==='epic')      G.stats.epicsCaught++;
    if (fd.rarity==='legendary') G.stats.legendsCaught++;
  }
  if (fish.mut !== 'none') G.stats.mutationsCaught++;
  if (fish.mut === 'rainbow')   G.stats.rainbowCaught++;
  if (fish.mut === 'glowing')   G.stats.glowingCaught++;
  if (fish.mut === 'prismatic') G.stats.prismaticCaught++;
  if (fish.mut === 'void')      G.stats.voidCaught++;
  if (fish.sizeId === 'colossal') G.stats.colossalCaught++;
  if (fish.sizeId === 'titanic')  G.stats.titanicCaught++;

  // skill XP — autofish gives half XP to prevent runaway skill levelling
  if (fd?.xp) {
    const xpMap = isAuto ? Object.fromEntries(Object.entries(fd.xp).map(([k,v])=>[k,Math.max(1,Math.floor(v/2))])) : fd.xp;
    gainXP(G, xpMap);
  }

  return isNew;
}

// ── CHARM DROP ────────────────────────────────────────────────
function rollCharmDrop(G, ST, isAuto) {
  const percLvl = ST.perceptionLevel || 0;
  // No charms at all until Perception 2
  if (percLvl < 2 && (G.charms||[]).length === 0 && Math.random() > 0.001) return null;
  const baseRate = ST.charmDropRate || 0.002;
  const bonus = (ST.charmDropBonus||0) + (isAuto ? (ST.autoCharmBonus||0) : 0);
  const luckBonus = (ST.luckBonus||0) * 0.5; // luck helps charm drops too
  const mult = ST.charmMult || 1;
  const rate = baseRate * (1 + bonus + luckBonus) * mult;
  if (Math.random() < rate) {
    // hard cap at 200 — never auto-delete, just block new drops
    if ((G.charms||[]).length >= 200) {
      G._charmBagFull = true; // flag so game loop can warn once
      return null;
    }
    G._charmBagFull = false;
    const charm = rollCharm(bonus, percLvl);
    G.charms.push(charm);
    return charm;
  }
  return null;
}

// ── SKILL XP ─────────────────────────────────────────────────
function gainXP(G, xpMap) {
  const levelled = [];
  for (const [sk, amt] of Object.entries(xpMap)) {
    if (!(sk in G.skillXP)) G.skillXP[sk] = 0;
    G.skillXP[sk] += amt;
    const skill = SKILLS.find(s => s.id === sk);
    if (!skill) continue;
    const cur = G.skillLevels[sk] || 0;
    if (cur >= skill.maxLevel) continue;
    let lvl = cur;
    while (lvl < skill.maxLevel) {
      const need = skill.xpPerLevel[lvl+1] || Infinity;
      const prev = totalXPForLevel(skill, lvl);
      if (G.skillXP[sk] >= prev + need) lvl++;
      else break;
    }
    if (lvl > cur) {
      G.skillLevels[sk] = lvl;
      levelled.push({ skill, lvl });
    }
  }
  return levelled;
}

// ── SELL ─────────────────────────────────────────────────────
function sellAll(G) {
  const sellable = G.bucket.filter(f => !f.favourited);
  if (!sellable.length) return 0;
  const total = sellable.reduce((s,f) => s+f.val, 0);
  G.money += total;
  G.totalEarned += total;
  G.bucket = G.bucket.filter(f => f.favourited);
  return total;
}

function sellOne(G, fishId) {
  const i = G.bucket.findIndex(f => f.id === fishId);
  if (i < 0) return 0;
  const f = G.bucket[i];
  if (f.favourited) return 0;
  G.money += f.val;
  G.totalEarned += f.val;
  G.bucket.splice(i, 1);
  return f.val;
}

function favouriteToggle(G, fishId) {
  const f = G.bucket.find(f => f.id === fishId);
  if (!f) return;
  f.favourited = !f.favourited;
}

function sendToDisplay(G, ST, fishId) {
  const i = G.bucket.findIndex(f => f.id === fishId);
  if (i < 0) return false;
  const maxDisplay = ST.displaySlots || 3;
  if (G.displayTank.length >= maxDisplay) return false;
  const f = G.bucket.splice(i, 1)[0];
  f.displayedAt = Date.now();
  G.displayTank.push(f);
  return true;
}

function removeFromDisplay(G, fishId, ST) {
  const i = G.displayTank.findIndex(f => f.id === fishId);
  if (i < 0) return;
  const f = G.displayTank.splice(i, 1)[0];
  const max = ST?.bucketSize || 8;
  if (G.bucket.length < max) {
    G.bucket.push(f);
  } else {
    // bucket full — sell it instead
    G.money += f.val;
    G.totalEarned += f.val;
  }
}

// ── UPGRADES / CHARMS / BUFFS ─────────────────────────────────
function buyUpgrade(G, uid) {
  const upg = UPGRADES.find(u => u.id === uid);
  if (!upg) return { ok:false, msg:'Unknown upgrade' };
  const lvl = G.upgLvls[uid] || 0;
  if (lvl >= upg.maxLevel) return { ok:false, msg:'Already maxed' };
  if (!skillReqMet(upg.skillReq||{}, G.skillLevels)) return { ok:false, msg:'Skill requirement not met' };
  const cost = upgradeCost(upg.baseCost, upg.costMult, lvl);
  if (G.money < cost) return { ok:false, msg:`Need 🪙${cost}` };
  G.money -= cost;
  G.upgLvls[uid] = lvl + 1;
  return { ok:true, newLevel: lvl+1, cost };
}

function buyAutoUpgrade(G, uid) {
  const upg = AUTO_UPGRADES.find(u => u.id === uid);
  if (!upg) return { ok:false, msg:'Unknown upgrade' };
  const lvl = G.autoLvls[uid] || 0;
  if (lvl >= upg.maxLevel) return { ok:false, msg:'Already maxed' };
  if (upg.requires) {
    for (const [dep, need] of Object.entries(upg.requires)) {
      if ((G.autoLvls[dep]||0) < need) {
        const dep_upg = AUTO_UPGRADES.find(u=>u.id===dep);
        return { ok:false, msg:`Requires ${dep_upg?.name||dep} level ${need}` };
      }
    }
  }
  const cost = upgradeCost(upg.baseCost, upg.costMult, lvl);
  if (G.money < cost) return { ok:false, msg:`Need 🪙${cost}` };
  G.money -= cost;
  G.autoLvls[uid] = lvl + 1;
  return { ok:true, newLevel: lvl+1, cost };
}

function equipCharm(G, charmUid, slot) {
  const charm = G.charms.find(c => c.uid === charmUid);
  if (!charm) return false;
  // unequip existing
  const prev = G.equippedCharms[slot];
  if (prev) {
    const prevCharm = G.charms.find(c => c.uid === prev);
    if (prevCharm) prevCharm.equipped = false;
  }
  G.equippedCharms[slot] = charmUid;
  charm.equipped = true;
  return true;
}

function unequipCharm(G, slot) {
  const uid = G.equippedCharms[slot];
  if (!uid) return;
  const charm = G.charms.find(c => c.uid === uid);
  if (charm) charm.equipped = false;
  G.equippedCharms[slot] = null;
}

function buyBuff(G, buffId, level) {
  const def = TEMP_BUFF_DEFS.find(b => b.id === buffId);
  if (!def) return { ok:false, msg:'Unknown buff' };
  const lvl = level || 1;
  const cost = buffCost(def, lvl);
  if (G.money < cost) return { ok:false, msg:`Need 🪙${cost.toLocaleString()}` };
  const duration = def.durationFn(lvl);
  const existing = G.activeBuffs.find(b => b.id === buffId && b.expiresAt > Date.now());
  if (existing) {
    existing.expiresAt += duration;
    existing.level = Math.max(existing.level||1, lvl);
    G.money -= cost;
    return { ok:true, extended:true, cost, level:lvl };
  }
  G.money -= cost;
  G.activeBuffs.push({ id:buffId, level:lvl, expiresAt:Date.now()+duration });
  return { ok:true, cost, level:lvl };
}

function buyEnchant(G, eid) {
  const def = ENCHANTMENT_DEFS.find(e => e.id === eid);
  if (!def) return { ok:false, msg:'Unknown enchantment' };
  // G.enchantments is now an object {id: level}
  if (Array.isArray(G.enchantments)) {
    // migrate old array format
    const arr = G.enchantments;
    G.enchantments = {};
    for (const e of arr) G.enchantments[typeof e==='string'?e:e.id] = 1;
  }
  const curLevel = G.enchantments[eid] || 0;
  if (curLevel >= ENCHANT_MAX_LEVEL) return { ok:false, msg:'Already at max level' };
  const nextLevel = curLevel + 1;
  const cost = enchantCost(def, nextLevel);
  if (G.money < cost) return { ok:false, msg:`Need 🪙${cost.toLocaleString()}` };
  G.money -= cost;
  G.enchantments[eid] = nextLevel;
  return { ok:true, newLevel:nextLevel, cost };
}

function goLocation(G, ST, lid) {
  const loc = LOCATIONS.find(l => l.id === lid);
  if (!loc) return { ok:false, msg:'Unknown location' };
  if (G.unlockedLocs.includes(lid)) {
    G.location = lid;
    return { ok:true, unlocked:true };
  }
  if (!skillReqMet(loc.skillReq||{}, G.skillLevels)) {
    const reqs = Object.entries(loc.skillReq).map(([s,l])=>`${s} lv${l}`).join(', ');
    return { ok:false, msg:`Requires: ${reqs}` };
  }
  if (G.money < loc.cost) return { ok:false, msg:`Need 🪙${loc.cost}` };
  G.money -= loc.cost;
  G.unlockedLocs.push(lid);
  G.location = lid;
  return { ok:true, newlyUnlocked:true };
}

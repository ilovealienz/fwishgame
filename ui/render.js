// ui/render.js

let activeTab = 'bucket';
let panelOpen = false;
let _toastTimer = null;
const MAX_LOG = 200;

const TAB_LABELS = {
  bucket:'Bucket', display:'Display', shop:'Shop', auto:'Autofish',
  skills:'Skills', charms:'Charms', buffs:'Buffs', places:'Places',
  logbook:'Logbook', achieve:'Achievements', records:'Records', prestige:'Prestige'
};

function isDesktop() { return window.innerWidth >= 768; }

// ── TOAST ──────────────────────────────────────────────────────
function showToast(msg, dur=4000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=>{ el.style.display='none'; }, 360);
  }, dur);
}

// ── LOG ────────────────────────────────────────────────────────
function addLog(txt, cls='') {
  // write to both mobile log and desktop log
  for (const id of ['log', 'desktop-log']) {
    const log = document.getElementById(id);
    if (!log) continue;
    const el = document.createElement('div');
    el.className = 'log-entry' + (cls ? ' '+cls : '');
    el.innerHTML = txt;
    log.appendChild(el);
    while (log.children.length > MAX_LOG) log.removeChild(log.firstChild);
    requestAnimationFrame(()=>{ log.scrollTop = log.scrollHeight; });
  }
}

function logCatchToUI(fish, isNew, isAuto) {
  const rc = rarityColor(fish.rarity);
  const fd = FISH_BY_ID[fish.fishId];
  const fl = fd ? fd.flavour[Math.floor(Math.random()*fd.flavour.length)] : '';
  const mut = MUTATIONS[fish.mut];
  const ms = mut?.style || '';
  const sStr = fish.sizeLabel ? fish.sizeLabel+' ' : '';
  const mStr = fish.mutLabel  ? fish.mutLabel+' '  : '';
  let cls = fish.rarity==='legendary' ? 'legend' : (fish.rarity==='epic'||fish.mut!=='none') ? 'rare' : '';
  if (isNew) addLog(`✦ New species: ${fish.name}!`, 'event');
  if (fish.rarity==='legendary'||fish.mut!=='none') addLog(fl, 'flavor');
  const autoTag = isAuto ? ' <span class="auto-tag">auto</span>' : '';
  addLog(`🎣 <span style="color:${rc};${ms}">${mStr}${sStr}${fish.name}</span>${autoTag} · ${fish.wt}kg · <span class="val-tag">🪙${fish.val}</span>`, cls);
}

// ── NAV / PANEL ────────────────────────────────────────────────
function navTap(btn, tab) {
  const dt = isDesktop();
  if (!dt && activeTab === tab && panelOpen) { closePanel(); return; }
  activeTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b===btn));
  // update whichever title is visible
  const mobileTitle = document.getElementById('panel-title');
  const desktopTitle = document.getElementById('dt-panel-title');
  if (mobileTitle) mobileTitle.textContent = TAB_LABELS[tab]||tab;
  if (desktopTitle) desktopTitle.textContent = TAB_LABELS[tab]||tab;
  if (dt) { panelOpen = true; }
  else    { openPanel(); }
  renderPanel();
}

function openPanel() {
  panelOpen = true;
  document.getElementById('panel')?.classList.add('open');
  document.getElementById('panel-backdrop')?.classList.add('open');
}

function closePanel() {
  panelOpen = false;
  document.getElementById('panel')?.classList.remove('open');
  document.getElementById('panel-backdrop')?.classList.remove('open');
}

// Returns the correct content container for current layout
function getPanelEl() {
  // desktop uses dt-panel-content, mobile uses panel-content
  return document.getElementById(isDesktop() ? 'dt-panel-content' : 'panel-content');
}

// ── HEADER / HUD ───────────────────────────────────────────────
function updateHeader() {
  const m  = document.getElementById('money-val');
  const bv = document.getElementById('bucket-val');
  const te = document.getElementById('earned-val');
  const pt = document.getElementById('prestige-tag');
  if (m)  m.textContent  = '🪙 ' + G.money.toLocaleString();
  if (bv) bv.textContent = '🪣 ' + (G.bucket?.length||0) + '/' + (ST?.bucketSize||8);
  if (te) te.textContent = '📦 ' + G.totalEarned.toLocaleString();
  if (pt) {
    if (G.prestige?.count > 0) { pt.textContent = G.prestige.titleIcon+' '+G.prestige.title; pt.style.display='inline-flex'; }
    else pt.style.display='none';
  }
}

function renderHud() {
  updateHeader();
  const wEl = document.getElementById('weather-display');
  if (wEl && weather) {
    wEl.textContent = weather.icon+' '+weather.name;
    wEl.className = 'weather-chip'+(weather.rare?' weather-special':'');
  }
  const buffsEl = document.getElementById('active-buffs');
  if (buffsEl) {
    const now = Date.now();
    const active = (G.activeBuffs||[]).filter(b=>b.expiresAt>now);
    if (active.length) {
      buffsEl.innerHTML = active.map(b=>{
        const def = TEMP_BUFF_DEFS.find(tb=>tb.id===b.id);
        const mins = Math.ceil((b.expiresAt-now)/60000);
        return `<span class="buff-chip">${def?.icon||'✨'} ${mins}m</span>`;
      }).join('');
      buffsEl.style.display = 'flex';
    } else {
      buffsEl.style.display = 'none';
    }
  }
}

function updateAutofishBtn() { /* autofish always on, no button */ }

function updateAutosellBtn() {
  const btn = document.getElementById('autosell-toggle');
  if (!btn) return;
  btn.textContent = G.autosellOn ? '💰 ON' : '💰 OFF';
  btn.className   = 'autosell-btn' + (G.autosellOn ? ' on' : '');
}

// ── FLOAT / MASH ───────────────────────────────────────────────
function updateCastBtn() {
  const floatEl   = document.getElementById('float');
  const floatWrap = document.getElementById('float-wrap');
  const fishEl    = document.getElementById('fish-silhouette');
  const lineEl    = document.getElementById('float-line');
  const hint      = document.getElementById('water-hint');
  if (floatEl) floatEl.className = 'float '+(mashCooldown>0?'cooling':mashFishing?'biting':'idle');
  if (lineEl)  lineEl.style.height = (mashFishing||mashCooldown>0) ? '60px' : '0px';
  if (floatWrap) floatWrap.style.bottom = mashFishing ? '58px' : mashCooldown>0 ? '72px' : '68px';
  if (fishEl) {
    if (mashFishing && mashBar>0) {
      fishEl.classList.remove('caught');
      fishEl.classList.toggle('rising', mashBar>0.15);
      fishEl.classList.toggle('close',  mashBar>0.55);
    } else { fishEl.className = 'fish-sil'; }
  }
  if (hint) {
    hint.textContent = mashFishing ? 'mash it!' : mashCooldown>0 ? 'cooling down...' : 'tap to cast';
    hint.style.opacity = mashFishing ? '0' : '1';
  }
}

function triggerCatchAnimation(fish) {
  const fishEl = document.getElementById('fish-silhouette');
  if (!fishEl) return;
  fishEl.className = 'fish-sil close ' + (fish?.rarity==='legendary'?'legendary-fish':fish?.rarity==='epic'?'epic-fish':'');
  requestAnimationFrame(()=>{
    fishEl.classList.add('caught');
    setTimeout(()=>{ fishEl.className='fish-sil'; }, 700);
  });
}

function renderMashBar() {
  const fill  = document.getElementById('mash-fill');
  const label = document.getElementById('mash-label');
  if (!fill) return;
  if (mashCooldown > 0) {
    const pct = Math.max(0, Math.min(1, mashCooldown/CAST_COOLDOWN()));
    fill.style.width = (pct*100).toFixed(1)+'%';
    fill.style.background = 'linear-gradient(90deg,#2a3a50,#3a5068)';
    fill.style.opacity = '0.6';
    if (label) label.textContent = 'COOLING DOWN...';
  } else if (mashFishing) {
    fill.style.opacity = '1';
    fill.style.width = (mashBar*100).toFixed(1)+'%';
    const r=Math.round(42+mashBar*10), g=Math.round(188+mashBar*30), b=Math.round(176-mashBar*100);
    fill.style.background = `linear-gradient(90deg,rgb(${r},${g},${b}),rgb(${Math.max(20,r+30)},${Math.min(230,g+20)},${Math.max(30,b)}))`;
    if (label) label.textContent = mashBar>0.85 ? 'NEARLY THERE!' : mashBar>0.5 ? 'REEL IT IN!' : 'KEEP GOING...';
    updateCastBtn();
  } else {
    fill.style.width = '0%'; fill.style.opacity = '1';
    if (label) label.textContent = 'TAP TO CAST';
  }
}

// ── SCENE ──────────────────────────────────────────────────────
function renderScene() {
  const badge = document.getElementById('loc-label');
  const loc = LOC_BY_ID[G.location];
  if (badge && loc) badge.textContent = loc.name;
  const scene = document.querySelector('.scene');
  if (scene && weather) {
    const tints = {sherbert_snow:'rgba(255,200,220,.10)',bubblegum_fog:'rgba(255,150,200,.09)',taco_tuesday:'rgba(255,180,80,.09)',honeydew_haze:'rgba(140,220,140,.08)',strawberry_dusk:'rgba(220,70,70,.12)',cotton_candy_clouds:'rgba(200,150,230,.09)',lasagna_rain:'rgba(210,140,50,.09)',midnight_macaron:'rgba(180,110,230,.10)'};
    scene.style.setProperty('--wx-tint', weather.rare ? (tints[weather.id]||'transparent') : 'transparent');
  }
}

function initStars() {
  const el = document.querySelector('.scene-stars'); if (!el) return;
  for (let i=0; i<55; i++) {
    const s = document.createElement('div'); s.className = 'star';
    const sz = 0.6 + Math.random()*1.8;
    s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*60}%;--a:${(.1+Math.random()*.2).toFixed(2)};--b:${(.5+Math.random()*.5).toFixed(2)};--d:${(2+Math.random()*4).toFixed(1)}s;--x:-${(Math.random()*4).toFixed(1)}s`;
    el.appendChild(s);
  }
}

setInterval(()=>{
  const w = document.getElementById('ripples'); if (!w) return;
  const r = document.createElement('div'); r.className = 'ripple';
  r.style.left = (10+Math.random()*80)+'%'; r.style.top = (15+Math.random()*50)+'%';
  w.appendChild(r); setTimeout(()=>r.remove(), 4000);
}, 2800);

// ── RENDER ALL ─────────────────────────────────────────────────
function renderAll() {
  updateHeader(); renderHud(); renderScene();
  updateCastBtn(); updateAutofishBtn(); renderMashBar();
  updateAutosellBtn();
  if (isDesktop()) panelOpen = true;
  if (panelOpen) renderPanel();
}

function renderBucketIfActive() {
  if (activeTab==='bucket' && panelOpen) renderBucket();
}

function switchTab(tab) { activeTab = tab; renderPanel(); }

// ── PANEL ROUTER ───────────────────────────────────────────────
function renderPanel() {
  const c = getPanelEl();
  if (!c) return;
  switch(activeTab) {
    case 'bucket':   renderBucket();   break;
    case 'display':  renderDisplay();  break;
    case 'shop':     renderShop();     break;
    case 'auto':     renderAuto();     break;
    case 'skills':   renderSkills();   break;
    case 'charms':   renderCharms();   break;
    case 'buffs':    renderBuffs();    break;
    case 'places':   renderPlaces();   break;
    case 'logbook':  renderLogbook();  break;
    case 'achieve':  renderAchieve();  break;
    case 'records':  renderRecords();  break;
    case 'prestige': renderPrestige(); break;
  }
}

// ── BUCKET ─────────────────────────────────────────────────────
function renderBucket() {
  const c = getPanelEl(); if (!c) return;
  if (!G.bucket.length) { c.innerHTML='<div class="empty">Bucket empty. Cast your line!</div>'; return; }
  const max = ST.bucketSize||8;
  const sellable = G.bucket.filter(f=>!f.favourited);
  const totalVal = sellable.reduce((s,f)=>s+f.val, 0);
  let h = `<div class="bucket-bar"><span class="p-label">${G.bucket.length}/${max} fish</span><button class="btn-sell-all" onclick="uiSellAll()">Sell all (${sellable.length}) — 🪙${totalVal.toLocaleString()}</button></div><div class="fish-list">`;
  for (const fish of [...G.bucket].reverse()) {
    const rc = rarityColor(fish.rarity);
    const mut = MUTATIONS[fish.mut];
    const mBadge = fish.mutLabel ? `<span class="badge badge-mut" style="${mut?.style||''}">${fish.mutLabel}</span>` : '';
    const sBadge = fish.sizeLabel ? `<span class="badge badge-sz">${fish.sizeLabel}</span>` : '';
    const aBadge = fish.isAuto ? `<span class="badge badge-auto">auto</span>` : '';
    h += `<div class="fish-card${fish.favourited?' fav':''}">
      <div class="fc-top"><span class="fc-name" style="color:${rc}">${fish.name}</span>${mBadge}${sBadge}${aBadge}</div>
      <div class="fc-meta">${fish.wt}kg · ${fish.len}cm · <span style="color:${rc}">${fish.rarity}</span></div>
      <div class="fc-actions"><span class="fc-val">🪙${fish.val}</span>
        <button class="btn-fav" onclick="uiFavouriteToggle(${fish.id})">${fish.favourited?'💛':'🤍'}</button>
        <button class="btn-display" onclick="uiSendToDisplay(${fish.id})">🖼</button>
        ${!fish.favourited?`<button class="btn-sell-one" onclick="uiSellOne(${fish.id})">sell</button>`:'<span class="kept-label">kept</span>'}
      </div></div>`;
  }
  h += '</div>'; c.innerHTML = h;
}

// ── DISPLAY ────────────────────────────────────────────────────
function renderDisplay() {
  const c = getPanelEl(); if (!c) return;
  const max = ST.displaySlots||3;
  let h = `<div class="p-label mb12">Display Tank — ${G.displayTank.length}/${max}</div>`;
  if (!G.displayTank.length) { h += '<div class="empty">No fish on display.</div>'; }
  else {
    h += '<div class="fish-list">';
    for (const fish of G.displayTank) {
      const rc = rarityColor(fish.rarity); const mut = MUTATIONS[fish.mut];
      const mBadge = fish.mutLabel ? `<span class="badge badge-mut" style="${mut?.style||''}">${fish.mutLabel}</span>` : '';
      const sBadge = fish.sizeLabel ? `<span class="badge badge-sz">${fish.sizeLabel}</span>` : '';
      h += `<div class="fish-card display-fish">
        <div class="fc-top"><span class="fc-name" style="color:${rc}">${fish.name}</span>${mBadge}${sBadge}</div>
        <div class="fc-meta">${fish.wt}kg · ${fish.len}cm · <span style="color:${rc}">${fish.rarity}</span></div>
        <div class="fc-actions"><span class="fc-val">🪙${fish.val}</span><button class="btn-sell-one" onclick="uiRemoveFromDisplay(${fish.id})">return</button></div>
      </div>`;
    }
    h += '</div>';
  }
  c.innerHTML = h;
}

// ── SHOP ───────────────────────────────────────────────────────
function renderShop() {
  const c = getPanelEl(); if (!c) return;
  let h = '<div class="p-label mb8">Manual Upgrades</div><div class="card-list">';
  for (const upg of UPGRADES) {
    const lvl = G.upgLvls[upg.id]||0, maxed = lvl>=upg.maxLevel;
    const cost = maxed ? null : upgradeCost(upg.baseCost, upg.costMult, lvl);
    const canAfford = !maxed && G.money>=cost;
    const reqMet = skillReqMet(upg.skillReq||{}, G.skillLevels);
    const pips = Array.from({length:Math.min(upg.maxLevel,20)},(_,i)=>`<div class="pip${i<lvl?' on':''}"></div>`).join('');
    h += `<div class="upg-card${maxed?' maxed':''}">
      <div class="upg-head"><span class="upg-icon">${upg.icon}</span>
        <div class="upg-info"><div class="upg-name">${upg.name} <span class="lvl-tag">${lvl}/${upg.maxLevel}</span></div>
        <div class="upg-desc">${upg.desc}</div></div>
      </div>
      <div class="pips">${pips}</div>
      <div class="upg-stat">${upg.effect(lvl)}</div>
      ${maxed ? '<div class="upg-maxed">Maxed ✓</div>'
       : !reqMet ? '<button class="upg-btn" disabled>Skill required</button>'
       : `<button class="upg-btn${canAfford?' buyable':''}" ${canAfford?`onclick="uiBuyUpgrade('${upg.id}')"`:'disabled'}>${canAfford?`Upgrade — 🪙${cost.toLocaleString()}`:`Need 🪙${cost.toLocaleString()}`}</button>`}
    </div>`;
  }
  h += '</div>'; c.innerHTML = h;
}

// ── AUTO ───────────────────────────────────────────────────────
function renderAuto() {
  const c = getPanelEl(); if (!c) return;
  const iv = Math.round((ST.autoIntervalMs||90000)/1000), cnt = ST.autoNetCount||1;
  const unlocked = (G.autoLvls.auto_speed||0) >= 1;
  let h = `<div class="auto-hdr"><div><div class="p-label">Autofish</div>
    <div class="auto-info">${unlocked?`Running — every ${iv}s, ${cnt} line${cnt>1?'s':''}`:'Buy Auto Speed to unlock.'}</div></div>
    ${unlocked?'<div class="auto-status-pill">⟳ Always on</div>':''}
  </div><div class="card-list">`;
  for (const upg of AUTO_UPGRADES) {
    const lvl = G.autoLvls[upg.id]||0, maxed = lvl>=upg.maxLevel;
    const cost = maxed ? null : upgradeCost(upg.baseCost, upg.costMult, lvl);
    const canAfford = !maxed && G.money>=cost;
    const locked = upg.requires && Object.entries(upg.requires).some(([d,n])=>(G.autoLvls[d]||0)<n);
    const pips = Array.from({length:Math.min(upg.maxLevel,15)},(_,i)=>`<div class="pip${i<lvl?' on':''}"></div>`).join('');
    h += `<div class="upg-card${maxed?' maxed':''}${locked?' locked':''}">
      <div class="upg-head"><span class="upg-icon">${upg.icon}</span>
        <div class="upg-info"><div class="upg-name">${upg.name} <span class="lvl-tag">${lvl}/${upg.maxLevel}</span></div>
        <div class="upg-desc">${upg.desc}</div>
        ${upg.requires?`<div class="upg-next">Req: ${Object.entries(upg.requires).map(([d,n])=>AUTO_UPGRADES.find(u=>u.id===d)?.name+' '+n).join(', ')}</div>`:''}</div>
      </div>
      ${!locked?`<div class="pips">${pips}</div><div class="upg-stat">${upg.effect(lvl)}</div>`:''}
      ${locked?'<div class="upg-locked-msg">Locked</div>':maxed?'<div class="upg-maxed">Maxed ✓</div>'
      :`<button class="upg-btn${canAfford?' buyable':''}" ${canAfford?`onclick="uiBuyAutoUpgrade('${upg.id}')"`:'disabled'}>${canAfford?`Upgrade — 🪙${cost.toLocaleString()}`:`Need 🪙${cost.toLocaleString()}`}</button>`}
    </div>`;
  }
  h += '</div>'; c.innerHTML = h;
}

// ── SKILLS ─────────────────────────────────────────────────────
function renderSkills() {
  const c = getPanelEl(); if (!c) return;
  const clicks = ST.mashClicksNeeded||8, decay = (ST.mashDecayRate||0.22).toFixed(2);
  let h = `<div class="p-label mb4">Skills</div>
  <div class="skill-note">${clicks} clicks per catch (decay ${decay}/s). Skills unlock locations and upgrades.</div>
  <div class="card-list">`;
  for (const sk of SKILLS) {
    const {pct,cur,need,lvl} = xpProgress(sk, G), maxed = lvl>=sk.maxLevel;
    const next = Object.keys(sk.milestones||{}).map(Number).sort((a,b)=>a-b).find(k=>k>lvl);
    h += `<div class="upg-card">
      <div class="upg-head"><span class="upg-icon">${sk.icon}</span>
        <div class="upg-info"><div class="upg-name">${sk.name} <span class="lvl-tag">Lv${lvl}/${sk.maxLevel}</span></div>
        <div class="upg-desc">${sk.desc}</div>
        ${next?`<div class="upg-next">Lv${next}: ${sk.milestones[next]}</div>`:''}</div>
      </div>
      <div class="xp-wrap"><div class="xp-fill" style="width:${(pct*100).toFixed(1)}%"></div></div>
      <div class="xp-lbl">${maxed?'Mastered':`${cur.toLocaleString()} / ${need.toLocaleString()} xp`}</div>
      <div class="upg-stat">${sk.effect(lvl)}</div>
    </div>`;
  }
  h += '</div>'; c.innerHTML = h;
}

// ── CHARMS ─────────────────────────────────────────────────────
function renderCharms() {
  const c = getPanelEl(); if (!c) return;
  const equipped = G.equippedCharms||[null,null];
  let h = `<div class="p-label mb8">Equipped (${equipped.filter(Boolean).length}/2)</div><div class="charm-slots">`;
  for (let slot=0; slot<2; slot++) {
    const uid = equipped[slot], charm = uid ? G.charms.find(ch=>ch.uid===uid) : null;
    if (charm) {
      const rc = charmRarityColor(charm.rarity);
      h += `<div class="charm-slot filled" style="border-color:${rc}">
        <div class="cs-top"><span class="cs-emoji">${charm.emoji}</span><div>
          <div class="cs-name" style="color:${rc}">${charm.name}</div><div class="cs-rar">${charm.rarity}</div>
        </div></div>
        <div class="cs-effects">${charm.effects.map(e=>`<div>${e.icon} ${e.desc}</div>`).join('')}</div>
        <button class="btn-unequip" onclick="uiUnequipCharm(${slot})">Unequip</button>
      </div>`;
    } else {
      h += `<div class="charm-slot"><div class="cs-empty">Empty slot</div></div>`;
    }
  }
  h += '</div>';
  if (!G.charms.length) {
    h += '<div class="empty" style="margin-top:16px">No charms yet. Catch fish to find them.</div>';
  } else {
    const atCap = G.charms.length>=200, nearCap = G.charms.length>=196;
    h += `<div class="p-label mb8" style="margin-top:16px;display:flex;align-items:center;justify-content:space-between">
      <span>Your Charms</span>
      <span style="font-size:11px;color:${atCap?'var(--red)':nearCap?'var(--amber)':'var(--text3)'}">
        ${G.charms.length}/200${atCap?' — FULL':nearCap?' — almost full':''}
      </span></div><div class="card-list">`;
    for (const charm of G.charms) {
      const rc = charmRarityColor(charm.rarity), isEq = equipped.includes(charm.uid);
      h += `<div class="charm-card${isEq?' equipped-charm':''}" style="${isEq?`border-color:${rc}`:''}">
        <div class="cc-top"><span class="cc-emoji">${charm.emoji}</span>
          <div class="cc-info">
            <div class="cc-name" style="color:${rc}">${charm.name} <span class="cc-rar">${charm.rarity}</span></div>
            <div class="cc-effects">${charm.effects.map(e=>`${e.icon} ${e.desc}`).join(' · ')}</div>
          </div>
        </div>
        <div class="cc-actions">
          ${isEq ? '<span class="equipped-label">Equipped</span>'
          : equipped[0]===null ? `<button class="btn-equip" onclick="uiEquipCharm(${charm.uid},0)">Slot 1</button>`
          : equipped[1]===null ? `<button class="btn-equip" onclick="uiEquipCharm(${charm.uid},1)">Slot 2</button>`
          : `<button class="btn-equip" onclick="uiEquipCharm(${charm.uid},0)">Replace 1</button>
             <button class="btn-equip" onclick="uiEquipCharm(${charm.uid},1)">Replace 2</button>`}
          ${!isEq?`<button class="btn-release" onclick="uiReleaseCharm(${charm.uid})">🗑</button>`:''}
        </div>
      </div>`;
    }
    h += '</div>';
  }
  c.innerHTML = h;
}

// ── BUFFS ──────────────────────────────────────────────────────
function renderBuffs() {
  const c = getPanelEl(); if (!c) return;
  const now = Date.now();
  let h = `<div class="p-label mb4">Temporary Buffs</div>
  <div class="skill-note">Each level improves duration and effect. Costs scale steeply.</div>
  <div class="card-list">`;
  for (const def of TEMP_BUFF_DEFS) {
    const active = G.activeBuffs.find(b=>b.id===def.id&&b.expiresAt>now);
    const activeLvl = active?.level||0, mins = active ? Math.ceil((active.expiresAt-now)/60000) : 0;
    const nextLvl = Math.min(BUFF_MAX_LEVEL, (activeLvl||0)+1);
    const cost = buffCost(def, nextLvl), canAfford = G.money>=cost;
    h += `<div class="upg-card${active?' buff-active':''}">
      <div class="upg-head"><span class="upg-icon">${def.icon}</span>
        <div class="upg-info">
          <div class="upg-name">${def.name}${active?` <span class="active-timer">${mins}m Lv${activeLvl}</span>`:''}</div>
          <div class="upg-desc">${def.effectFn(nextLvl)}</div>
        </div>
      </div>
      <button class="upg-btn${canAfford?' buyable':''}" ${canAfford?`onclick="uiBuyBuff('${def.id}',${nextLvl})"`:' disabled'}>
        ${active?`Upgrade Lv${nextLvl}`:`Buy Lv${nextLvl}`} — 🪙${cost.toLocaleString()}
      </button>
    </div>`;
  }
  const enchObj = Array.isArray(G.enchantments)
    ? Object.fromEntries(G.enchantments.map(e=>typeof e==='string'?[e,1]:[e.id,e.level||1]))
    : G.enchantments||{};
  h += `</div><div class="p-label mb4" style="margin-top:16px">Enchantments</div>
  <div class="skill-note">Permanent upgrades. 20 levels each.</div>
  <div class="card-list">`;
  for (const def of ENCHANTMENT_DEFS) {
    const curLvl = enchObj[def.id]||0, maxed = curLvl>=ENCHANT_MAX_LEVEL, nextLvl = curLvl+1;
    const cost = maxed ? null : enchantCost(def, nextLvl), canAfford = !maxed && G.money>=cost;
    const pips = Array.from({length:20},(_,i)=>`<div class="pip${i<curLvl?' on':''}"></div>`).join('');
    h += `<div class="upg-card${maxed?' maxed':''}">
      <div class="upg-head"><span class="upg-icon">${def.icon}</span>
        <div class="upg-info"><div class="upg-name">${def.name} <span class="lvl-tag">Lv${curLvl}/${ENCHANT_MAX_LEVEL}</span></div>
        <div class="upg-desc">${def.desc}</div></div>
      </div>
      <div class="pips">${pips}</div>
      <div class="upg-stat">${def.effectFn(Math.max(1,curLvl))}</div>
      ${maxed ? '<div class="upg-maxed">Fully enchanted ✓</div>'
      : `<button class="upg-btn${canAfford?' buyable':''}" ${canAfford?`onclick="uiBuyEnchant('${def.id}')"`:'disabled'}>
           ${canAfford?`Lv${nextLvl} — 🪙${cost.toLocaleString()}`:`Need 🪙${cost.toLocaleString()}`}
         </button>`}
    </div>`;
  }
  h += '</div>'; c.innerHTML = h;
}

// ── PLACES ─────────────────────────────────────────────────────
function renderPlaces() {
  const c = getPanelEl(); if (!c) return;
  let h = '<div class="p-label mb12">Locations</div><div class="card-list">';
  for (const loc of LOCATIONS) {
    const unlocked = G.unlockedLocs.includes(loc.id), active = G.location===loc.id;
    const canAfford = G.money>=loc.cost, reqMet = skillReqMet(loc.skillReq||{}, G.skillLevels);
    const reqs = Object.entries(loc.skillReq||{}).map(([s,l])=>`${s} lv${l}`).join(', ');
    h += `<div class="loc-card${active?' here':''}${!unlocked&&!reqMet?' locked':''}">
      <div class="loc-name">${loc.name}${active?'<span class="here-tag">here</span>':''}</div>
      <div class="loc-desc">${loc.desc}</div>
      <div class="loc-fish">${loc.fish}</div>
      ${!unlocked&&reqs?`<div class="loc-req">Requires: ${reqs}</div>`:''}
      ${unlocked ? (active ? '' : `<button class="upg-btn go" onclick="uiGoLocation('${loc.id}')">Go here</button>`)
      : `<button class="upg-btn${canAfford&&reqMet?' buyable':''}" ${canAfford&&reqMet?`onclick="uiGoLocation('${loc.id}')"`:' disabled'}>
           ${!reqMet?'Skill required':canAfford?`Unlock — 🪙${loc.cost.toLocaleString()}`:`Need 🪙${loc.cost.toLocaleString()}`}
         </button>`}
    </div>`;
  }
  h += '</div>'; c.innerHTML = h;
}

// ── LOGBOOK ────────────────────────────────────────────────────
function renderLogbook() {
  const c = getPanelEl(); if (!c) return;
  const disc = Object.keys(G.logbook);
  if (!disc.length) { c.innerHTML='<div class="empty">Logbook empty. Each new species is recorded here.</div>'; return; }
  let h = `<div class="p-label mb12">${disc.length} / ${FISH.length} species</div>`;
  for (const rar of ['common','uncommon','rare','epic','legendary']) {
    const grp = FISH.filter(f=>f.rarity===rar&&G.logbook[f.id]); if (!grp.length) continue;
    h += `<div class="rar-label" style="color:${rarityColor(rar)}">${rar}</div>`;
    for (const fd of grp) {
      const e = G.logbook[fd.id], muts = e.muts.map(m=>MUTATIONS[m]?.label).filter(Boolean);
      h += `<div class="lb-card">
        <div class="lb-name" style="color:${rarityColor(fd.rarity)}">${fd.name}</div>
        <div class="lb-stats">caught ${e.count.toLocaleString()}× · biggest ${e.biggest}kg</div>
        ${muts.length?`<div class="lb-muts">${muts.join(', ')}</div>`:''}
        <div class="lb-quote">${fd.flavour[0]}</div>
      </div>`;
    }
  }
  c.innerHTML = h;
}

// ── ACHIEVEMENTS ───────────────────────────────────────────────
function renderAchieve() {
  const c = getPanelEl(); if (!c) return;
  const earned = G.achievements||[];
  const visible = ACHIEVEMENTS.filter(a=>!a.secret||earned.includes(a.id));
  let h = `<div class="p-label mb12">${earned.length} / ${ACHIEVEMENTS.length} achievements</div><div class="card-list">`;
  for (const ach of visible) {
    const done = earned.includes(ach.id);
    const rew = ach.reward ? [ach.reward.money?`🪙${ach.reward.money}`:'', ach.reward.charmDrop?'charm':''].filter(Boolean).join(' + ') : '';
    h += `<div class="ach-card${done?' done':''}">
      <span class="ach-icon">${ach.icon}</span>
      <div class="ach-info"><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div>
        ${rew?`<div class="ach-reward">Reward: ${rew}</div>`:''}
      </div>${done?'<span class="ach-done">✓</span>':''}
    </div>`;
  }
  h += '</div>'; c.innerHTML = h;
}

// ── RECORDS ────────────────────────────────────────────────────
function renderRecords() {
  const c = getPanelEl(); if (!c) return;
  const r = G.records||{};
  const fCard = (fish, label) => {
    if (!fish) return `<div class="rec-card"><div class="rec-label">${label}</div><div class="rec-empty">None yet</div></div>`;
    const rc = rarityColor(fish.rarity), mut = MUTATIONS[fish.mut], ms = mut?.style||'';
    return `<div class="rec-card"><div class="rec-label">${label}</div>
      <div class="rec-fish" style="color:${rc};${ms}">${fish.mutLabel?fish.mutLabel+' ':''}${fish.sizeLabel?fish.sizeLabel+' ':''}${fish.name}</div>
      <div class="rec-meta">${fish.wt}kg · ${fish.len}cm · 🪙${fish.val} · <span style="color:${rc}">${fish.rarity}</span>${fish.mutLabel?' · '+fish.mutLabel:''}</div>
    </div>`;
  };
  c.innerHTML = `<div class="p-label mb8">Personal Records</div>
  <div class="rec-note">Records survive prestige.</div>
  ${fCard(r.biggestFish,'⚖ Biggest by weight')}
  ${fCard(r.mostExpensiveFish,'💰 Most valuable')}
  ${fCard(r.rarestMutation,'🌀 Rarest mutation')}
  <div class="rec-card"><div class="rec-label">💵 Best session earnings</div><div class="rec-fish">🪙${(r.bestSessionEarned||0).toLocaleString()}</div></div>
  <div class="rec-card"><div class="rec-label">⏱ Longest session</div><div class="rec-fish">${r.longestSession||0} minutes</div></div>
  <div class="rec-card"><div class="rec-label">✨ Total prestiges</div><div class="rec-fish">${r.totalPrestiges||0}</div></div>`;
}

// ── PRESTIGE ───────────────────────────────────────────────────
function renderPrestige() {
  const c = getPanelEl(); if (!c) return;
  const count = G.prestige.count||0, check = prestigeRequirementsMet(G);
  const nextN = count+1, nextPt = PRESTIGE_TITLES[Math.min(nextN-1, PRESTIGE_TITLES.length-1)];
  const pb = count>0 ? computePrestigeBonuses(count) : null;
  const minEarned = Math.round(500000*Math.pow(2.5,count)), minSkill = Math.min(20,8+count*2);
  let h = '<div class="p-label mb8">Prestige</div>';
  if (count>0) {
    h += `<div class="prestige-current"><div class="pres-icon">${G.prestige.titleIcon}</div>
      <div><div class="pres-title">${G.prestige.title}</div>
      <div class="pres-sub">Prestige ${count} · +${Math.round((pb.valueMult-1)*100)}% fish value</div></div></div>`;
  } else {
    h += `<div class="pres-intro">Prestige resets your run but keeps achievements and records. Each prestige gives permanent bonuses.</div>`;
  }
  h += `<div class="pres-next-card">
    <div class="pres-next-title">${nextPt.icon} Next: ${nextPt.title}</div>
    <div class="pres-bonus">+${Math.round(nextPt.valueMult*100)}% fish value permanently</div>
    <div class="pres-reqs">
      <div class="pres-req ${G.totalEarned>=minEarned?'met':''}">${G.totalEarned>=minEarned?'✓':'✗'} Earn 🪙${minEarned.toLocaleString()} (have 🪙${G.totalEarned.toLocaleString()})</div>
      <div class="pres-req ${Object.values(G.skillLevels).every(l=>l>=minSkill)?'met':''}">${Object.values(G.skillLevels).every(l=>l>=minSkill)?'✓':'✗'} All skills lv${minSkill}+</div>
    </div>
    <button class="upg-btn${check.ok?' buyable':''}" ${check.ok?'onclick="uiPrestige()"':'disabled'}>${check.ok?`Prestige now`:'Requirements not met'}</button>
  </div>`;
  if (G.prestige.history?.length) {
    h += `<div class="p-label mb8" style="margin-top:16px">Previous runs</div><div class="card-list">`;
    for (const run of [...G.prestige.history].reverse()) {
      h += `<div class="upg-card"><div class="upg-head"><span class="upg-icon">${run.icon}</span>
        <div class="upg-info"><div class="upg-name">${run.title} <span class="lvl-tag">Prestige ${run.n}</span></div>
        <div class="upg-desc">🪙${run.totalEarned.toLocaleString()} earned · ${run.totalCaught.toLocaleString()} fish</div>
      </div></div></div>`;
    }
    h += '</div>';
  }
  c.innerHTML = h;
}

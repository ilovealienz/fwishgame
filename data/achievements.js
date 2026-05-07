// data/achievements.js — all achievements and rewards

const ACHIEVEMENTS = [
  // Catching milestones
  { id:'first_catch',    name:'First Cast',          icon:'🎣', desc:'Catch your first fish.',                       check:G=>G.totalCaught>=1,             reward:{money:10},                    secret:false },
  { id:'catch_10',       name:'Getting Started',     icon:'🐟', desc:'Catch 10 fish.',                               check:G=>G.totalCaught>=10,            reward:{money:25},                    secret:false },
  { id:'catch_100',      name:'Regular',             icon:'🎏', desc:'Catch 100 fish.',                              check:G=>G.totalCaught>=100,           reward:{money:100,charmDrop:true},    secret:false },
  { id:'catch_1000',     name:'Dedicated',           icon:'🏅', desc:'Catch 1,000 fish.',                            check:G=>G.totalCaught>=1000,          reward:{money:500,charmDrop:true},    secret:false },
  { id:'catch_10000',    name:'The Long Game',       icon:'🏆', desc:'Catch 10,000 fish.',                           check:G=>G.totalCaught>=10000,         reward:{money:2000,enchantSlot:true}, secret:false },
  { id:'catch_50000',    name:'Legendary Angler',    icon:'👑', desc:'Catch 50,000 fish.',                           check:G=>G.totalCaught>=50000,         reward:{money:10000,charmDrop:true},  secret:true  },
  // Money milestones
  { id:'earn_100',       name:'First Payday',        icon:'💰', desc:'Earn 🪙100 total.',                             check:G=>G.totalEarned>=100,           reward:{money:20},                    secret:false },
  { id:'earn_1000',      name:'Small Fortune',       icon:'💵', desc:'Earn 🪙1,000 total.',                           check:G=>G.totalEarned>=1000,          reward:{money:100},                   secret:false },
  { id:'earn_10000',     name:'Big Business',        icon:'💎', desc:'Earn 🪙10,000 total.',                          check:G=>G.totalEarned>=10000,         reward:{money:500,charmDrop:true},    secret:false },
  { id:'earn_100000',    name:'Fish Tycoon',         icon:'🏦', desc:'Earn 🪙100,000 total.',                         check:G=>G.totalEarned>=100000,        reward:{money:5000,charmDrop:true},   secret:false },
  { id:'earn_1000000',   name:'The Million',         icon:'🌟', desc:'Earn 🪙1,000,000 total.',                       check:G=>G.totalEarned>=1000000,       reward:{money:50000,charmDrop:true},  secret:true  },
  // Species discovery
  { id:'species_5',      name:'Naturalist',          icon:'📖', desc:'Discover 5 species.',                          check:G=>Object.keys(G.logbook).length>=5,  reward:{money:30},               secret:false },
  { id:'species_15',     name:'Field Researcher',    icon:'🔬', desc:'Discover 15 species.',                         check:G=>Object.keys(G.logbook).length>=15, reward:{money:150,charmDrop:true},secret:false },
  { id:'species_all',    name:'Complete Catalogue',  icon:'📚', desc:'Discover every species.',                      check:G=>Object.keys(G.logbook).length>=FISH.length,reward:{money:2000,charmDrop:true},secret:false },
  // Rarity achievements
  { id:'first_rare',     name:'Something Different', icon:'⭐', desc:'Catch your first rare fish.',                  check:G=>Object.values(G.logbook).some((_,i)=>FISH[i]?.rarity==='rare')||G.stats?.raresCaught>=1, reward:{money:50},  secret:false },
  { id:'first_epic',     name:'Going Deeper',        icon:'💜', desc:'Catch your first epic fish.',                  check:G=>(G.stats?.epicsCaught||0)>=1,  reward:{money:200,charmDrop:true},   secret:false },
  { id:'first_legendary',name:'Once in a Lifetime',  icon:'✨', desc:'Catch your first legendary fish.',             check:G=>(G.stats?.legendsCaught||0)>=1,reward:{money:1000,charmDrop:true},  secret:false },
  { id:'leviathan_caught',name:'You Caught What?!',  icon:'🐉', desc:'Catch The Leviathan.',                         check:G=>!!(G.logbook?.leviathan),      reward:{money:5000,charmDrop:true},  secret:true  },
  // Mutation achievements
  { id:'first_mutation', name:'Something Strange',   icon:'🌀', desc:'Catch your first mutated fish.',               check:G=>(G.stats?.mutationsCaught||0)>=1,reward:{money:50},                secret:false },
  { id:'rainbow_catch',  name:'Over the Rainbow',    icon:'🌈', desc:'Catch a rainbow fish.',                        check:G=>(G.stats?.rainbowCaught||0)>=1,  reward:{money:200},               secret:false },
  { id:'glowing_catch',  name:'Night Light',         icon:'💡', desc:'Catch a glowing fish.',                        check:G=>(G.stats?.glowingCaught||0)>=1,  reward:{money:200},               secret:false },
  { id:'prismatic_catch',name:'Perfect Prism',       icon:'💎', desc:'Catch a prismatic fish.',                      check:G=>(G.stats?.prismaticCaught||0)>=1,reward:{money:1000,charmDrop:true},secret:true  },
  { id:'void_catch',     name:'The Void Stares Back',icon:'🕳', desc:'Catch a void-mutation fish.',                  check:G=>(G.stats?.voidCaught||0)>=1,     reward:{money:2000,charmDrop:true},secret:true  },
  // Charm achievements
  { id:'first_charm',    name:'Lucky Find',          icon:'🍀', desc:'Find your first charm.',                       check:G=>(G.charms||[]).length>=1,       reward:{money:100},               secret:false },
  { id:'charm_10',       name:'Charm Collector',     icon:'🪬', desc:'Collect 10 charms.',                           check:G=>(G.charms||[]).length>=10,      reward:{money:300},               secret:false },
  { id:'legendary_charm',name:'Perfect Charm',       icon:'🌟', desc:'Find a legendary charm.',                      check:G=>(G.charms||[]).some(c=>c.rarity==='legendary'),reward:{money:2000}, secret:true },
  // Location achievements
  { id:'unlock_river',   name:'On the Move',         icon:'🌊', desc:'Unlock Greyvale River.',                       check:G=>G.unlockedLocs?.includes('river'),   reward:{money:50},             secret:false },
  { id:'unlock_lake',    name:'The Grey Mere',        icon:'🏔', desc:'Unlock The Grey Mere.',                        check:G=>G.unlockedLocs?.includes('lake'),    reward:{money:200,charmDrop:true},secret:false },
  { id:'unlock_deepsea', name:'Open Water',          icon:'🌐', desc:'Unlock The Open Water.',                       check:G=>G.unlockedLocs?.includes('deepsea'), reward:{money:500,charmDrop:true},secret:false },
  { id:'unlock_cave',    name:'The Deep Dark',       icon:'🕯', desc:'Unlock The Drowned Cave.',                     check:G=>G.unlockedLocs?.includes('cave'),    reward:{money:1000,charmDrop:true},secret:false },
  { id:'unlock_moonpool',name:'Under a Different Moon',icon:'🌕',desc:'Unlock The Moon Pool.',                       check:G=>G.unlockedLocs?.includes('moonpool'),reward:{money:5000,charmDrop:true},secret:true },
  // Weather achievements
  { id:'special_weather',name:'Oh My',               icon:'🍭', desc:'Experience a special weather event.',          check:G=>(G.stats?.specialWeathersSeen||0)>=1, reward:{money:50},            secret:false },
  { id:'lasagna_weather',name:'Why Though',           icon:'🫕', desc:'Fish in Lasagna Rain.',                        check:G=>(G.stats?.lasagnaRain||0)>=1,         reward:{money:500},           secret:true  },
  // Session achievements
  { id:'session_20min',  name:'Settled In',          icon:'⏱', desc:'Play for 20 minutes in one session.',          check:G=>(G.stats?.sessionMinutes||0)>=20,     reward:{money:50},            secret:false },
  { id:'session_2hr',    name:'In the Zone',         icon:'🌙', desc:'Play for 2 hours in one session.',             check:G=>(G.stats?.sessionMinutes||0)>=120,    reward:{money:300,charmDrop:true},secret:false },
  // Display tank
  { id:'first_display',  name:'Something to Show',  icon:'🖼', desc:'Add your first fish to the display tank.',     check:G=>(G.displayTank||[]).length>=1,        reward:{money:30},            secret:false },
  { id:'display_full',   name:'Living Gallery',      icon:'🎨', desc:'Fill your display tank.',                      check:G=>(G.displayTank||[]).length>=(G.displaySlots||3), reward:{money:200,charmDrop:true}, secret:false },
  // Skill achievements
  { id:'skill_10',       name:'Learning Fast',       icon:'📈', desc:'Reach level 10 in any skill.',                 check:G=>Object.values(G.skillLevels||{}).some(l=>l>=10), reward:{money:100}, secret:false },
  { id:'skill_25',       name:'Dedicated Student',   icon:'🎓', desc:'Reach level 25 in any skill.',                 check:G=>Object.values(G.skillLevels||{}).some(l=>l>=25), reward:{money:500,charmDrop:true}, secret:false },
  { id:'skill_max',      name:'Master',              icon:'⭐', desc:'Max out any skill to level 40.',               check:G=>Object.values(G.skillLevels||{}).some(l=>l>=40), reward:{money:5000,charmDrop:true}, secret:true },
  // Size achievements
  { id:'first_titanic',  name:'Can\'t Be Real',      icon:'🐳', desc:'Catch a Titanic fish.',                        check:G=>(G.stats?.titanicCaught||0)>=1,       reward:{money:500,charmDrop:true}, secret:true },
  { id:'first_colossal', name:'That\'s a Big Fish',  icon:'🦈', desc:'Catch a Colossal fish.',                       check:G=>(G.stats?.colossalCaught||0)>=1,      reward:{money:100},           secret:false },
];

function checkAchievements(G, awardFn) {
  const earned = G.achievements || [];
  for (const ach of ACHIEVEMENTS) {
    if (!earned.includes(ach.id)) {
      try {
        if (ach.check(G)) awardFn(ach);
      } catch(e) {}
    }
  }
}

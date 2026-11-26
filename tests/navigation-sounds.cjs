const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

(async () => {
 const browser = await chromium.launch({channel: process.env.BROWSER_CHANNEL || 'msedge'});
 try {
  const page = await browser.newPage({viewport:{width:1097,height:592}});
  await page.addInitScript(() => {
   window.heard = [];
   const games = Array.from({length:120}, (_,i) => ({
    id:'g'+i, title:'Game '+i, genre:'Arcade', image:'', kind:'app', favorite:true, lastPlayed:i
   }));
   window.Portal = {view:()=>'{}', library:()=>JSON.stringify(games), saveView(){},
    appsPreferences:()=>'[]', setThemeColor(){}, sound:name=>heard.push(name)};
  });
  await page.goto(pathToFileURL(path.resolve(__dirname,'../app/src/main/assets/www/index.html')).href);
  await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
  const layouts = await page.locator('#presentation option').evaluateAll(options=>options.map(o=>o.value));
  for (const layout of layouts) {
   const moves = await page.evaluate(mode => {
    document.activeElement.blur();
    genre=''; query=''; favoritesOnly=false;
    const preset=builtinAppearancePresets.find(p=>p.values.presentation===mode);
    if(preset) applyAppearanceValues(preset.values);
    setPresentation(mode);
    if(mode==='portland')portlandOpen(null);
    if(mode==='taipei')taipeiOpen('all');
    if(mode==='cambridge') cambridgeOpen('all','games');
    if(mode==='prague') pragueOpen('genre:Arcade',true);
    if(mode==='vienna') viennaOpen('genre:Arcade',true);
    if(mode==='ulm') ulmOpen('all');
    if(mode==='ithaca') ithacaOpen('all');
    if(mode==='tacoma'){tacomaPageTo(2);tacomaOpenCategory('Arcade');}
    if(mode==='seattle') seattleBrowse=true;
    update();
    controllerFocus($('#grid .presentation-selected')||$('#grid .game'),true);
    const horizontal=['library','kyoto','cupertino','venice','vienna','seattle','florence','rochester','cannes'].includes(mode);
    const id=()=>document.activeElement.closest('.game')?.dataset.id||presentationId;
    const step=action=>{
     const before=id(); heard.length=0; lastSoundAt=-Infinity;
     controller(action);
     return {changed:before!==id(),sounds:[...heard]};
    };
    const steps=[step(horizontal?'right':'down')];
    if(!steps[0].changed) steps.push(step(horizontal?'left':'up'));
    soundEnabled=false;
    const muted=step(horizontal?'left':'up');
    soundEnabled=true;
    return {steps,muted};
   },layout);
   assert.ok(moves.steps.some(s=>s.changed),layout+' must navigate between games');
   for(const move of moves.steps) assert.deepEqual(move.sounds,move.changed?['move']:[],layout);
   assert.deepEqual(moves.muted.sounds,[],layout+' muted');
  }
  console.log('PASS controller movement sounds across '+layouts.length+' layouts');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

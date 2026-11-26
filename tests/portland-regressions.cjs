const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/portland-audit');fs.mkdirSync(out,{recursive:true});
const categories=['Action & adventure','Action RPGs','Arcade & reflex','Local multiplayer','A very long custom category name that needs to remain readable'];
const art='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#438b81"/><circle cx="200" cy="220" r="130" fill="#efbc63"/></svg>');
const fixture=Array.from({length:1200},(_,i)=>({id:'p'+i,title:'Game '+String(i).padStart(4,'0')+(i===0?' with a very long title that should stay within its cover':''),genre:categories[i%categories.length],image:art,package:'test.game',favorite:false}));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--disable-gpu','--no-zygote']}),errors=[];
 try{
 const page=await browser.newPage({viewport:{width:1097,height:592},hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{if(!localStorage.getItem('auditGames'))localStorage.setItem('auditGames',JSON.stringify(g));window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>localStorage.getItem('auditGames'),sound:()=>{},hideKeyboard:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{let d=JSON.parse(localStorage.getItem('auditGames'));d.find(g=>g.id===id).favorite=on;localStorage.setItem('auditGames',JSON.stringify(d));return '{"ok":true}'}};},fixture);
 await page.goto(require('node:url').pathToFileURL(path.join(root,'index.html')).href);
 await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Fresh Ink').values);update();});
 assert.equal(await page.evaluate(()=>document.body.dataset.presentation),'portland');
 assert.equal(await page.evaluate(()=>portlandScenes.length),47);
 assert.equal(await page.evaluate(()=>new Set(portlandScenes.map(s=>portlandMatch(s[1]))).size),47,'unique exact category matches');
 assert.equal(await page.locator('.portland-postcard').count(),6);
 await page.evaluate(()=>portlandOpen(null));
 for(const [name,w,h] of [['portal',1097,592],['4x3',789,568],['3x2',888,592],['16x10',947,592],['21x9',1381,568],['compact',640,360],['keyboard',640,220]]){
  await page.setViewportSize({width:w,height:h});
  for(const index of [0,17,1199]){
   await page.evaluate(i=>portlandSelect(i,true),index);
   const a=await page.evaluate(()=>{let b=$('#grid .presentation-selected'),g=$('#grid').getBoundingClientRect(),r=b.getBoundingClientRect(),c=b.querySelector('.cover').getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,grid:{left:g.left,right:g.right,top:g.top,bottom:g.bottom},ratio:c.width/c.height,limit:(Math.ceil(g.height/portlandGridMetrics().rowHeight)+3)*portlandGridMetrics().columns,count:$('#grid .portland-track').children.length,focus:document.activeElement===b};});
   assert.ok(a.left>=a.grid.left-1&&a.right<=a.grid.right+1, name+' horizontal '+JSON.stringify(a));
   assert.ok(a.top>=a.grid.top-1&&a.bottom<=a.grid.bottom+1,name+' vertical '+JSON.stringify(a));
   assert.ok(Math.abs(a.ratio-2/3)<.01,name+' 2:3');assert.ok(a.count<=a.limit,name+' virtualization');assert.ok(a.focus,name+' focus');
  }
 }
 await page.setViewportSize({width:1097,height:592});await page.evaluate(()=>portlandSelect(0,true));
 await page.evaluate(()=>portlandSelect(987,true));await page.setViewportSize({width:640,height:360});
 await page.waitForFunction(()=>{const selected=$('#grid .presentation-selected');if(!selected)return false;const r=selected.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1});
 assert.equal(await page.evaluate(()=>presentationId),'p987','resize preserves selected game');
 await page.setViewportSize({width:1097,height:592});await page.evaluate(()=>portlandSelect(0,true));
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>presentationId),'p1');
 await page.evaluate(()=>controller('back'));assert.equal(await page.evaluate(()=>portlandShelf),false);
 await page.evaluate(()=>portlandChoose('Local multiplayer',true));await page.evaluate(()=>controller('activate'));
 assert.equal(await page.evaluate(()=>genre),'Local multiplayer');
 await page.evaluate(()=>{portlandSelect(12,true);persist()});let id=await page.evaluate(()=>presentationId);
 await page.reload();await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 assert.equal(await page.evaluate(()=>portlandCategory),'Local multiplayer');assert.equal(await page.evaluate(()=>presentationId),id);
 await page.evaluate(()=>portlandPick());assert.ok(await page.locator('#portland-picker').evaluate(e=>e.open));
 assert.equal(await page.locator('#portland-options button').count(),47);
 assert.equal(await page.evaluate(async()=>{const imgs=[...$('#portland-options').querySelectorAll('img')];for(const img of imgs)img.loading='eager';return (await Promise.all(imgs.map(img=>img.decode().then(()=>true,()=>false)))).every(Boolean)}),true,'all 47 bundled illustrations decode');
 await page.locator('#portland-options button').first().click();assert.equal(await page.locator('#portland-picker').evaluate(e=>e.open),false);
 await page.evaluate(()=>{query='no game can possibly have this title';$('#search').value=query;update()});assert.ok(await page.locator('.search-empty').count());
 assert.ok(await page.locator('.search-empty').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'empty search message is visible');
 await page.evaluate(()=>{query='Game 0000';$('#search').value=query;update()});assert.ok(await page.locator('.show-all-matches').isVisible());await page.locator('.show-all-matches').click();assert.equal(await page.evaluate(()=>filtered.length),1);
 await page.evaluate(()=>{query='';$('#search').value='';portlandOpen(null);portlandSelect(5,true)});
 await page.evaluate(()=>controller('favorite'));assert.equal(await page.evaluate(()=>presentationId),'p5','favorite preserves position');
 await page.evaluate(()=>portlandSelect(0,true));const second=await page.locator('#grid [data-id="p1"]').boundingBox();
 await page.touchscreen.tap(second.x+second.width/2,second.y+second.height/2);
 assert.equal(await page.evaluate(()=>presentationId),'p1','first touch selects');assert.ok(await page.evaluate(()=>!window.launched),'first touch does not launch');
 await page.touchscreen.tap(second.x+second.width/2,second.y+second.height/2);assert.ok(await page.evaluate(()=>!!window.launched),'second touch launches');
 await page.screenshot({path:path.join(out,'games.png')});
 await page.evaluate(()=>{portlandBack();portlandChoose('Local multiplayer',true)});
 await page.screenshot({path:path.join(out,'categories.png')});
 await page.evaluate(()=>{portlandOpen('Local multiplayer');portlandSelect(9,true);showDialog('#settings-dialog');$('#appearance-presets').value='Now Playing';auditionAppearancePreset();finishAppearanceAudition(false);hideDialog('#settings-dialog')});
 assert.equal(await page.evaluate(()=>portlandCategory),'Local multiplayer','preview Revert restores category');assert.equal(await page.evaluate(()=>portlandShelf),true);
 await page.evaluate(()=>{portlandBack();portlandChoose('Action RPGs');query='Game 0003';$('#search').value=query;update()});
 assert.equal(await page.evaluate(()=>filtered.length),1,'category-browser search spans all categories');
 assert.equal(await page.evaluate(()=>portlandCategory),null);
 await page.evaluate(()=>{query='';games=[];genres=[];portlandShelf=false;update()});assert.equal(await page.locator('.portland-postcard').count(),1,'empty library');
 assert.deepEqual(errors,[]);console.log('PASS Chicago: 1,200 games; seven sizes; boundary geometry, 2:3 covers, virtualization, controller, category restoration, picker, empty search.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/hongkong-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:60},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<60,lastPlayed:Date.now()-i*1000}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
 if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}
 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);


 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Extra! Extra!').values);genre='Puzzles';favoritesOnly=false;query='';update();manhattanSelect(4);});
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(250);
 await page.screenshot({path:'output/manhattan-first.png'});
 assert.equal(await page.locator('#manhattan-title,.manhattan-kicker').count(),0,'no repeated selected-game headline');
 assert.equal(await page.locator('#manhattan-type').innerText(),'Android game\ntest.app');
 assert.ok(await page.locator('#manhattan-recent button:visible').count()>3,'shortlist uses spare height');
 const elsewhere=await page.evaluate(()=>{
  const items=[{id:'self',title:'Selected',lastPlayed:999},{id:'r',title:'Recent',lastPlayed:10},{id:'f',title:'Favorite',favorite:true},{id:'u',title:'Unplayed'}];
  return {rank:manhattanElsewhere(items,'self').map(g=>g.id),stable:JSON.stringify(manhattanElsewhere(items,'self'))===JSON.stringify(manhattanElsewhere([...items].reverse(),'self')),empty:manhattanElsewhere(items.slice(0,1),'self').length,local:JSON.parse($('#manhattan-recent').dataset.key).every(([id])=>filtered.some(g=>g.id===id)&&id!==presentationId)};
 });
 assert.deepEqual(elsewhere,{rank:['r','f','u'],stable:true,empty:0,local:true});
 const headingNames=await page.evaluate(()=>{const game=filtered.find(g=>g.id===presentationId);const old={title:game.title,genre:game.genre,id:game.id};game.title='An extraordinarily long newspaper game headline that must scroll';game.genre='A very long category heading for the newspaper';genre=game.genre;rebuildGenres();update();return old;});
 await page.waitForTimeout(150);
 for(const selector of ['#manhattan-category']){
  const metric=await page.locator(selector).evaluate(e=>({height:e.clientHeight,line:parseFloat(getComputedStyle(e).lineHeight),overflow:e.scrollWidth-e.clientWidth,animations:e.getAnimations().length}));
  assert.ok(metric.height>metric.line*1.5,'headline wraps: '+selector);
  assert.ok(metric.overflow<=1,'headline stays within column: '+selector);
  assert.equal(metric.animations,0,'headline stays static');
 }
 assert.ok(await page.evaluate(()=>$('#manhattan-heading').getBoundingClientRect().bottom<=$('#grid').getBoundingClientRect().top+1),'category heading does not overlap list');
 await page.evaluate(old=>{Object.assign(games.find(g=>g.id===old.id),old);genre=old.genre;rebuildGenres();update();},headingNames);
 assert.equal(await page.evaluate(()=>presentation),'manhattan');
 assert.equal(await page.evaluate(()=>typography),'caslon');
 assert.equal(await page.locator('.topbar').getAttribute('data-edition'),await page.evaluate(()=>new Date().toLocaleDateString('en-US',{weekday:'long'})+' Edition'));
 await page.evaluate(()=>{$('.topbar').dataset.edition='Stale Edition';window.onNativeResume()});
 assert.equal(await page.locator('.topbar').getAttribute('data-edition'),await page.evaluate(()=>new Date().toLocaleDateString('en-US',{weekday:'long'})+' Edition'),'resume refreshes the edition');
 assert.equal(await page.locator('#manhattan-cover').evaluate(e=>getComputedStyle(e).objectFit),'cover');
 assert.ok(await page.evaluate(()=>document.fonts.check('20px LibreCaslon')&&document.fonts.check('40px NewspaperMasthead')),'bundled fonts load');
 const layoutNames=await page.locator('#presentation option').allTextContents();assert.deepEqual(layoutNames,[...layoutNames].sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase())),'layouts stay alphabetical');
 await page.locator('#manhattan-edit').click();assert.equal(await page.evaluate(()=>topDialog()?.id),'editor');await page.evaluate(()=>hideDialog('#editor'));
 await page.locator('#manhattan-favorite').click();assert.equal(await page.locator('#grid .presentation-selected').count(),1);
 await page.evaluate(()=>{window.played=null;window.originalPlay=play;play=id=>window.played=id;});
 await page.locator('#manhattan-play').click();assert.equal(await page.evaluate(()=>played),await page.evaluate(()=>presentationId));
 await page.locator('#manhattan-footer .manhattan-hint').first().click();assert.equal(await page.evaluate(()=>played),await page.evaluate(()=>presentationId));
 await page.evaluate(()=>{play=window.originalPlay;});
 for(const [width,height] of [[1097,592],[800,600],[960,600],[900,600],[1260,540],[640,360]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  const bounds=await page.evaluate(()=>{const r=s=>$(s).getBoundingClientRect().toJSON();return {grid:r('#grid'),art:r('#manhattan-cover'),footer:r('#manhattan-footer'),tabs:r('#manhattan-tabs'),height:innerHeight}});
  assert.ok(bounds.art.bottom<=bounds.footer.top+1,JSON.stringify(bounds));
  assert.ok(bounds.grid.bottom<=bounds.footer.top+1,JSON.stringify(bounds));
  assert.ok(bounds.footer.bottom<=height+1,JSON.stringify(bounds));
  const details=await page.locator('#manhattan-details').evaluate(e=>({overflow:e.scrollHeight-e.clientHeight,rows:[...e.querySelectorAll('#manhattan-recent button:not([hidden])')].map(b=>b.getBoundingClientRect().height)}));
  await page.locator('#manhattan-details').evaluate(e=>e.scrollTop=e.scrollHeight);
  assert.ok(await page.locator('#manhattan-details').evaluate(e=>{const last=[...e.querySelectorAll('#manhattan-recent button:not([hidden])')].at(-1);return !last||last.getBoundingClientRect().bottom<=e.getBoundingClientRect().bottom-8}),'last recent item has a clean endpoint');
  assert.ok(details.rows.every(h=>h>=18),'recent titles remain readable at '+width+'x'+height);
 }
 await page.setViewportSize({width:1097,height:592});await page.waitForTimeout(100);
 await page.evaluate(()=>{manhattanSelect(7);controller('down')});assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),8);
 await page.evaluate(()=>controller('up'));assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),7);
 await page.evaluate(()=>{manhattanSelect(0);controller('up')});assert.equal(await page.evaluate(()=>manhattanPane),'tabs');
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>manhattanPane),'tabs','category navigation keeps category focus');
 await page.evaluate(()=>controller('left'));assert.equal(await page.evaluate(()=>manhattanPane),'tabs');
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>manhattanPane),'games');
 await page.evaluate(()=>controller('favorite'));assert.equal(await page.locator('#grid .presentation-selected').count(),1);
 await page.evaluate(()=>controller('search'));assert.equal(await page.evaluate(()=>document.activeElement.id),'search');
 await page.setViewportSize({width:1097,height:280});await page.locator('#search').fill('not a match');await page.waitForTimeout(200);
 await page.screenshot({path:'output/manhattan-keyboard.png'});
 assert.equal(await page.locator('#grid .show-all-matches').count(),0);
 assert.equal(await page.evaluate(()=>filtered.length),0);
 await page.locator('#search').fill('');await page.evaluate(()=>controller('back'));await page.setViewportSize({width:1097,height:592});
 await page.evaluate(()=>{query='Title 0001';$('#search').value=query;genre='Puzzles';update()});
 assert.equal(await page.locator('#grid .show-all-matches').count(),1,'other-category matches stay discoverable');
 await page.evaluate(()=>{controllerFocus($('#grid .show-all-matches'));controller('activate')});assert.equal(await page.evaluate(()=>filtered.length),1);
 await page.evaluate(()=>{query='';$('#search').value='';genre='';update();showDialog('#settings-dialog');updateAppearancePreview()});
 await page.waitForTimeout(150);
 assert.equal(await page.locator('.appearance-sample img').evaluate(e=>getComputedStyle(e).objectFit),'cover','settings preview matches cover scaling');
 await page.evaluate(()=>{hideDialog('#settings-dialog');setPresentation('tacoma')});
 assert.equal(await page.locator('#manhattan-footer').isVisible(),false,'newspaper UI does not leak into other layouts');
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Extra! Extra!').values);persist()});
 await page.reload();await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);assert.equal(await page.evaluate(()=>presentation),'manhattan','saved layout restores');
 const findings=[];
 for(const [width,height] of [[1097,592],[800,600],[960,600],[900,600],[1260,540],[640,360]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>{genre=genres.find(g=>g.startsWith('A very long'));query='';$('#search').value='';update()});await page.waitForTimeout(120);
  const state=await page.evaluate(()=>{
   const h=$('#manhattan-heading').getBoundingClientRect(),grid=$('#grid').getBoundingClientRect();
   return {overlap:h.bottom>grid.top+1,rows:[...$('#grid').children].filter(e=>e.matches('.game')).map(e=>({h:e.clientHeight,text:e.querySelector('.game-title').scrollHeight})),horizontal:document.documentElement.scrollWidth>innerWidth};
  });
  if(state.overlap||state.rows.some(r=>r.text>r.h)||state.horizontal)findings.push({size:[width,height],state});
  for(const index of [7,0,14]){
   await page.evaluate(i=>manhattanSelect(i),index);
   assert.ok(await page.evaluate(()=>{const a=$('#grid').getBoundingClientRect(),b=$('#grid .presentation-selected').getBoundingClientRect();return b.top>=a.top-1&&b.bottom<=a.bottom+1}),'selected row visible at '+width+'x'+height);
  }
  await page.evaluate(()=>{query='no-such-game';$('#search').value=query;update()});
  if(await page.locator('#manhattan-cover').isVisible())findings.push({size:[width,height],emptyCover:true});
 }
 await page.setViewportSize({width:1097,height:592});
 await page.evaluate(()=>{query='';$('#search').value='';genre='Puzzles';update();});
 for(const artFit of ['contain','cover'])for(const coverBorder of ['none','hairline','matte']){
  await page.evaluate(v=>{applyAppearanceValues({...appearanceSnapshot(),...v,coverCorners:'soft'});showDialog('#settings-dialog');updateAppearancePreview()}, {artFit,coverBorder});
  await page.waitForTimeout(60);
  const styles=await page.evaluate(()=>{const pick=e=>{const s=getComputedStyle(e);return [s.objectFit,s.borderWidth,s.borderRadius]};return [pick($('#manhattan-cover')),pick($('.appearance-sample img'))]});
  assert.deepEqual(styles[0],styles[1],'preview matches '+artFit+'/'+coverBorder);
  await page.evaluate(()=>hideDialog('#settings-dialog'));
 }
 for(const [width,height] of [[1097,592],[800,600],[960,600],[900,600],[1260,540],[640,360]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(50);
  await page.evaluate(()=>{query='';$('#search').value='';genre='Puzzles';update();controller('search')});
  await page.setViewportSize({width,height:Math.max(180,Math.floor(height*.5))});await page.waitForTimeout(100);
  for(const q of ['Title','not-a-match']){
   await page.locator('#search').fill(q);await page.waitForTimeout(40);
   assert.ok(await page.locator('#search').isVisible(),'search remains visible with keyboard');
   assert.ok(await page.evaluate(()=>{const r=$('#grid').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.height>30}),'results stay above keyboard');
  }
  await page.locator('#search').fill('');await page.evaluate(()=>controller('back'));
 }
 await page.setViewportSize({width:1097,height:592});
 await page.evaluate(()=>{query='';genre='Puzzles';update();openApps()});
 assert.equal(await page.evaluate(()=>topDialog()?.id),'apps-drawer');
 assert.ok(await page.locator('#apps-drawer').evaluate(e=>!getComputedStyle(e).fontFamily.includes('LibreCaslon')),'Apps typography stays independent');
 await page.evaluate(()=>{hideDialog('#apps-drawer');genre='Puzzles';query='Monument Valley';$('#search').value=query;update()});
 assert.equal(await page.locator('#manhattan-elsewhere-heading').isVisible(),false,'single result hides shortlist');
 await page.evaluate(()=>{query='';$('#search').value='';update();});
 await page.evaluate(()=>{genre='Puzzles';query='';update();manhattanSelect(4);window.auditSelection=presentationId;games.push({id:'added-audit',title:'A freshly added game',genre:'Puzzles',kind:'app',package:'test.new',image:'audit.svg'});rebuildGenres();update()});
 assert.ok(await page.evaluate(()=>filtered.some(g=>g.id==='added-audit')),'new game appears immediately');
 assert.equal(await page.evaluate(()=>presentationId),await page.evaluate(()=>auditSelection),'library addition preserves selection');
 const originalLibrary=await page.evaluate(()=>games);
 await page.evaluate(()=>{games=[];rebuildGenres();genre='';query='';update()});
 assert.equal(await page.locator('#manhattan-cover').isVisible(),false,'empty library has no broken image');
 assert.equal(await page.locator('#manhattan-play').isEnabled(),false,'empty library disables launch');
 assert.equal(await page.locator('#manhattan-elsewhere-heading').isVisible(),false,'empty library hides suggestions');
 await page.evaluate(g=>{games=g;rebuildGenres();genre='Puzzles';update();const game=filtered[0];game.kind='shortcut';game.intentUri='intent://very-long-shortcut/'+('destination'.repeat(40));manhattanSelect(0);},originalLibrary);
 assert.ok((await page.locator('#manhattan-type').innerText()).startsWith('Shortcut'),'shortcut is identified correctly');
 assert.ok(await page.locator('#manhattan-details').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'long launch target does not widen column');
 await page.evaluate(()=>{applyAppearanceValues({...appearanceSnapshot(),palette:'graphite'});});
 assert.notEqual(await page.locator('#manhattan-elsewhere-heading').evaluate(e=>getComputedStyle(e).color),'rgb(71, 102, 116)','newsprint ink does not leak into other palettes');
 await page.evaluate(()=>applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Extra! Extra!').values));
 await page.screenshot({path:'output/manhattan-audited.png'});
 console.log('EXPANDED FINDINGS',JSON.stringify(findings));
 assert.deepEqual(findings,[],'long categories and empty views remain clean');
 assert.deepEqual(errors,[]);console.log('PASS Manhattan navigation, search, fonts, artwork, and six viewport shapes');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

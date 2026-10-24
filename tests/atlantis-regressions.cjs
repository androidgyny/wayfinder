const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/atlantis-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:1200},(_,i)=>({id:'g'+i,title:i===0?'Tengami':'Title '+String(i).padStart(4,'0'),genre:['Story adventures','Puzzles','Racing','User named folder','Arcade','Strategy','Custom 7','Custom 8'][i%8],image:'audit.svg',package:'test.app',kind:'app',favorite:i<3}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
  if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="70">TENGAMI</text></svg>');}
  if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture));}
  try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Droplet').values);atlantisBrowser.state.pane='games';atlantisFocus()});
 assert.equal(await page.evaluate(()=>presentation),'atlantis');
 await page.evaluate(async()=>{for(const weight of [400,500,600,700])await document.fonts.load(weight+' 16px WayfinderGo');await document.fonts.ready});
 assert.deepEqual(await page.evaluate(()=>[...document.fonts].filter(f=>f.family==='WayfinderGo').map(f=>f.status)),['loaded','loaded','loaded']);
 assert.match(await page.locator('#grid .game-title').first().evaluate(n=>getComputedStyle(n).fontFamily),/WayfinderGo/);

 assert.equal(await page.evaluate(()=>typography),'go');await page.waitForFunction(()=>document.querySelector('#custom-backdrop').complete&&document.querySelector('#custom-backdrop').naturalWidth>0);assert.equal(await page.evaluate(()=>backdrop),'tidal');
 await page.evaluate(()=>setTypography('outfit'));assert.equal(await page.evaluate(()=>presentation),'atlantis');
 assert.match(await page.locator('#grid .game-title').first().evaluate(n=>getComputedStyle(n).fontFamily),/Outfit/);
 await page.evaluate(()=>setTypography('go'));
 assert.equal(await page.locator('#grid .game').count(),1200);assert.equal(await page.locator('#grid img').count(),0);
 assert.equal(await page.locator('#atlantis-categories .folder').count(),8);
 const folderColors=await page.locator('#atlantis-categories .folder').evaluateAll(nodes=>nodes.map(n=>n.style.getPropertyValue('--folder-color')));assert.equal(new Set(folderColors).size,6);assert.equal(folderColors[0],folderColors[6]);
 const selectedStyles=[];for(const index of [0,1]){await page.evaluate(i=>atlantisSelect(filtered[i].id),index);selectedStyles.push(await page.locator('#grid .presentation-selected').evaluate(n=>{const s=getComputedStyle(n);return [s.backgroundColor,s.backgroundImage,s.color]}));}assert.deepEqual(selectedStyles[0],selectedStyles[1],'selection must override both alternating backgrounds');assert.equal(selectedStyles[0][0],'rgb(8, 96, 189)');assert.equal(selectedStyles[0][2],'rgb(255, 255, 255)');await page.evaluate(()=>atlantisSelect(filtered[0].id));
 assert.equal(await page.locator('#settings-button').evaluate(n=>getComputedStyle(n).borderTopStyle),'solid');
 assert.equal(await page.locator('#atlantis-favorite .star').count(),1);
 assert.equal(await page.locator('#atlantis-favorite').getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{filtered.find(g=>g.id===presentationId).lastPlayed=Date.now();renderAtlantis()});
 assert.equal(await page.locator('#grid .presentation-selected .atlantis-date').textContent(),'Today');
 for(const [width,height] of [[1097,592],[1920,1080],[640,592],[960,400]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(120);
  const boxes=await page.evaluate(()=>['atlantis-sidebar','grid','atlantis-preview','atlantis-actions','atlantis-footer','atlantis-cover'].map(id=>{const n=document.getElementById(id),r=n.getBoundingClientRect();return {id,w:r.width,h:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}}));
  assert.ok(boxes.every(b=>b.inside&&b.w>0&&b.h>0),JSON.stringify(boxes));await page.screenshot({path:path.join(out,'layout-'+width+'x'+height+'.png')});
 }
 await page.setViewportSize({width:1097,height:592});
 await page.evaluate(()=>{atlantisBrowser.state.pane='games';atlantisSelect(filtered[0].id,true);controller('down')});assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),1);
 await page.evaluate(()=>controller('pageDown'));assert.ok(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)>1));
 await page.evaluate(()=>controller('left'));assert.equal(await page.evaluate(()=>document.activeElement.closest('#atlantis-categories')!==null),true);
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>favoritesOnly),true);
 for(const action of ['down','down','up','down']){const before=await page.evaluate(()=>sectionIndex());await page.evaluate(a=>controller(a),action);assert.equal(await page.evaluate(()=>sectionIndex()),before+(action==='up'?-1:1));assert.equal(await page.evaluate(()=>atlantisBrowser.state.pane),'categories');assert.equal(await page.evaluate(()=>document.activeElement.closest('#atlantis-categories')!==null),true);}
 await page.evaluate(()=>atlantisOpen(1,'categories'));
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>document.activeElement.closest('#grid')!==null),true);
 await page.evaluate(()=>controller('favorite'));assert.equal(await page.evaluate(()=>filtered.length),2);
 await page.evaluate(()=>controller('right'));
 assert.equal(await page.locator('#atlantis-edit').evaluate(n=>getComputedStyle(n).webkitTapHighlightColor),'rgba(0, 0, 0, 0)');
 await page.locator('#atlantis-edit').click();assert.equal(await page.locator('#editor').isVisible(),true);await page.evaluate(()=>nativeBack());
 await page.evaluate(()=>{atlantisBrowser.state.pane='games';atlantisFocus();controller('activate')});assert.equal(await page.evaluate(()=>window.launched),await page.evaluate(()=>presentationId));
 await page.evaluate(()=>{atlantisOpen(sections().findIndex(s=>s.genre==='Puzzles'),'games');query='Tengami';$('#search').value=query;update();atlantisFocus();controller('down')});assert.equal(await page.locator('#grid .show-all-matches').count(),1);await page.evaluate(()=>controller('activate'));assert.equal(await page.locator('#grid .game').count(),1);
 await page.evaluate(()=>{query='';$('#search').value='';update();atlantisOpen(0,'games');atlantisSelect(filtered[33].id);persist()});const id=await page.evaluate(()=>presentationId);await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),'atlantis');assert.equal(await page.evaluate(()=>presentationId),id);assert.equal(await page.evaluate(()=>typography),'go');
 await page.evaluate(()=>{showDialog('#settings-dialog');selectSettingsSection('appearance');updateAppearancePreview()});await page.waitForTimeout(100);
 for(const id of ['settings-button','close-settings']){const delta=await page.locator('#'+id).evaluate(b=>{const a=b.getBoundingClientRect(),s=b.querySelector('svg').getBoundingClientRect();return Math.abs(a.x+a.width/2-s.x-s.width/2)+Math.abs(a.y+a.height/2-s.y-s.height/2)});assert.ok(delta<1,id+' centered');}
 const treatment=await page.locator('.appearance-sample').evaluate(n=>{const s=getComputedStyle(n);return [s.borderTopWidth,s.outlineStyle,s.boxShadow]});assert.deepEqual(treatment,['0px','none','none']);

 await page.evaluate(()=>nativeBack());
 // Controls retain their own action instead of launching the selected game.
 await page.evaluate(()=>{$('#settings-button').focus();controller('activate')});assert.equal(await page.locator('#settings-dialog').isVisible(),true);await page.evaluate(()=>nativeBack());
 await page.evaluate(()=>{atlantisOpen(0,'games');controller('left')});assert.match(await page.locator('#atlantis-hint-activate').innerText(),/Open/);
 await page.locator('#atlantis-hint-activate').click();assert.equal(await page.evaluate(()=>atlantisBrowser.state.pane),'games');
 await page.evaluate(()=>controller('left'));await page.evaluate(()=>controller('edit'));assert.equal(await page.locator('#editor').isVisible(),true);await page.evaluate(()=>nativeBack());
 // Remember the actual reading position, not just the selected title.
 await page.evaluate(()=>{atlantisOpen(0,'games');atlantisSelect(filtered[60].id,true);$('#grid').scrollTop=2200;persist()});const scroll=await page.locator('#grid').evaluate(n=>n.scrollTop);
 await page.evaluate(()=>{atlantisOpen(2,'categories');atlantisOpen(0,'categories')});assert.ok(Math.abs(await page.locator('#grid').evaluate(n=>n.scrollTop)-scroll)<2);
 // A launch moves the title to the top of Recent and updates its date.
 await page.evaluate(()=>{sort='recent';update();nativeEvent('launched',{id:'g1199'})});assert.equal(await page.locator('#grid .game').first().getAttribute('data-id'),'g1199');assert.equal(await page.locator('#grid .game').first().locator('.atlantis-date').textContent(),'Today');
 await page.evaluate(()=>{setAtmosphere('fireflies',selectionStyle)});assert.match(await page.locator('#custom-backdrop').getAttribute('src'),/fireflies/);
 await page.evaluate(()=>setPresentation('kyoto'));assert.match(await page.locator('#custom-backdrop').getAttribute('src'),/fireflies/);await page.evaluate(()=>setPresentation('atlantis'));
 // Shared browser instances must rebuild the shared grid and retain independent pane state.
 for(const layout of ['redmond','atlantis','redmond','atlantis']){
  const result=await page.evaluate(layout=>{
   setPresentation(layout);const current=layout==='redmond'?redmondBrowser:atlantisBrowser,other=layout==='redmond'?atlantisBrowser:redmondBrowser;
   const otherPane=other.state.pane;current.open(0,'games');current.select(filtered[5].id,true);controller('down');
   const selected=filtered[6],row=$('#grid .presentation-selected');
   const result={row:row.classList.contains(layout+'-row'),selected:row.dataset.id===selected.id,cover:$('#'+layout+'-cover').alt===selected.title+' cover',isolated:other.state.pane===otherPane};
   controller('left');result.categoryFocus=!!document.activeElement.closest('#'+layout+'-categories');return result;
  },layout);
  assert.ok(Object.values(result).every(Boolean),'shared browser switching: '+layout+' '+JSON.stringify(result));
 }
 // Cancelling a preset preview must restore both instances, including category focus.
 for(const [layout,preset]of [['redmond','Droplet'],['atlantis','Experience']]){
  const restored=await page.evaluate(({layout,preset})=>{
   setPresentation(layout);const current=layout==='redmond'?redmondBrowser:atlantisBrowser;
   current.open(2,'categories');const before={id:presentationId,genre,redmond:redmondBrowser.state.pane,atlantis:atlantisBrowser.state.pane};
   showDialog('#settings-dialog');$('#appearance-presets').value=preset;auditionAppearancePreset();
   const changed=presentation!==layout;redmondBrowser.state.pane='games';atlantisBrowser.state.pane='games';finishAppearanceAudition(false);
   const restored=changed&&presentation===layout&&presentationId===before.id&&genre===before.genre&&redmondBrowser.state.pane===before.redmond&&atlantisBrowser.state.pane===before.atlantis;
   hideDialog('#settings-dialog');current.focus();return restored&&!!document.activeElement.closest('#'+layout+'-categories');
  },{layout,preset});assert.ok(restored,'preset preview restores '+layout);
 }
 await page.evaluate(()=>{setPresentation('atlantis');atlantisOpen(0,'games')});
 // Droplet's blue desktop surround must not become a content surface in other layouts.
 for(const layout of ['library','redmond','sanfrancisco','atlantis']){
  await page.evaluate(layout=>{setPalette('pearl');setPresentation(layout)},layout);
  assert.equal(await page.locator('body').evaluate(n=>getComputedStyle(n).getPropertyValue('--bg').trim()),'#edf3fa');
  assert.equal(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor),layout==='atlantis'?'rgb(57, 137, 199)':'rgb(237, 243, 250)');
 }
 // Last favorite and completely empty libraries must leave no stale cover or live Play button.
 await page.evaluate(()=>{for(const g of games)g.favorite=false;games[0].favorite=true;update();atlantisOpen(1,'games');toggleFavorite(games[0].id)});assert.equal(await page.locator('#atlantis-play').isEnabled(),false);assert.equal(await page.locator('#atlantis-cover').getAttribute('src'),null);
 await page.evaluate(()=>{games=[];update();atlantisOpen(0,'games')});assert.equal(await page.locator('#atlantis-play').isEnabled(),false);assert.match(await page.locator('.atlantis-empty').innerText(),/library is empty/);
 await page.evaluate(()=>{games=JSON.parse(JSON.stringify(auditGames));sort='az';update();atlantisOpen(0,'games');wayfinderKeyboardChanged(true)});await page.setViewportSize({width:1097,height:300});await page.waitForTimeout(100);assert.equal(await page.locator('#atlantis-preview').isVisible(),false);assert.ok(await page.locator('#grid').evaluate(n=>n.clientHeight>40));
 assert.deepEqual(errors,[]);console.log('PASS Atlantis: 1200 titles, folder cycle, 4 viewports, controller navigation, favorite removal, details, launch, search recovery, persistence, settings and keyboard');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

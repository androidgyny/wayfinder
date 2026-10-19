const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/paloalto-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:1200},(_,i)=>({id:'g'+i,title:i===0?'Tengami':'Title '+String(i).padStart(4,'0'),genre:i<600?'Story adventures':'Puzzles',image:'audit.svg',package:'test.app',kind:'app',favorite:i<3}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
  if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="70">TENGAMI</text></svg>');}
  if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture));}
  try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 assert.deepEqual(await page.evaluate(()=>({presentation,palette,typography,artFit})),{presentation:'paloalto',palette:'platinum',typography:'ibmvga',artFit:'cover'},'fresh installation starts with Hyperstack');
 assert.equal(await page.evaluate(()=>builtinAppearancePresets.some(p=>p.name==='Default')),false);
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Playbyte').values);persist()});
 await page.reload();await page.waitForFunction(()=>!restoring);
 assert.equal(await page.evaluate(()=>presentation),'library','saved Playbyte selection survives restart');
 const presets=await page.evaluate(()=>builtinAppearancePresets.map(p=>p.name));
 for(const name of presets){
  const result=await page.evaluate(name=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Hyperstack').values);const p=builtinAppearancePresets.find(p=>p.name===name);applyAppearanceValues(p.values);const actual=appearanceSnapshot();return Object.fromEntries(['presentation','palette','typography','coverBorder','coverCorners','backdrop','artFit'].filter(k=>p.values[k]!==undefined).map(k=>[k,[actual[k],p.values[k]]]))},name);
  for(const [key,[actual,expected]] of Object.entries(result))assert.equal(actual,expected,name+' restores '+key);
 }
 const empty=await browser.newPage({viewport:{width:1097,height:592}});empty.on('pageerror',e=>errors.push(e.message));
 await empty.route('**/games.js',route=>route.fulfill({contentType:'application/javascript',body:'window.GAMES=[]'}));
 await empty.addInitScript(()=>{window.Portal={library:()=>'[]',view:()=>'{}',saveView:()=>{},sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]'}});
 await empty.goto('http://127.0.0.1:'+server.address().port);await empty.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 assert.equal(await empty.evaluate(()=>presentation),'paloalto');assert.equal(await empty.locator('#paloalto-play').isDisabled(),true);
 for(const action of ['up','down','right','pageDown','activate','back'])await empty.evaluate(a=>controller(a),action);
 assert.equal(await empty.locator('#paloalto-cover').getAttribute('src'),null);
 assert.equal(await empty.locator('#add-game').isVisible(),true);
 await empty.screenshot({path:path.join(out,'fresh-empty.png')});await empty.close();
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Hyperstack').values);paloaltoOpen(sections().findIndex(s=>s.genre==='Story adventures'));paloaltoPane='index';paloaltoFocus()});await page.waitForTimeout(150);
 assert.equal(await page.locator('#grid .game').count(),8);assert.equal(await page.locator('#grid img').count(),0);
 assert.equal(await page.evaluate(()=>presentation),'paloalto');
 assert.equal(await page.evaluate(()=>window.themeColor),'#fafafa','system bar matches stack header');
 await page.evaluate(()=>{openApps();nativeBack()});assert.equal(await page.evaluate(()=>window.themeColor),'#fafafa','return from Apps restores header color');
 for(const width of [640,1097,1920]){await page.setViewportSize({width,height:width===1920?1080:592});
  const geometry=await page.evaluate(()=>{const ids=['paloalto-cover','paloalto-tabs','grid','paloalto-actions','paloalto-footer','paloalto-hints'];return ids.map(id=>{const n=document.getElementById(id),r=n.getBoundingClientRect();return {id,w:r.width,h:r.height,inside:r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}})});
  assert.ok(geometry.every(g=>g.inside&&g.w>0&&g.h>0),JSON.stringify(geometry));await page.screenshot({path:path.join(out,'stack-'+width+'.png')});
 }
 await page.setViewportSize({width:1097,height:592});
 for(const index of [4,8,16]){
  await page.evaluate(i=>{paloaltoPane='index';paloaltoSelect(i);controller('up')},index);
  assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),index-1,'Up crosses column and page boundaries');
  assert.equal(await page.evaluate(()=>paloaltoPane),'index');
  await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),index,'Down reverses Up');
 }
 await page.evaluate(()=>{paloaltoSelect(0);controller('up')});assert.equal(await page.evaluate(()=>paloaltoPane),'tabs','Up at first game reaches categories');
 await page.evaluate(()=>controller('down'));
 for(const color of ['platinum','graphite']){
  await page.evaluate(color=>{setPalette(color);paloaltoPane='index';controller('back')},color);
  const focused=await page.evaluate(()=>{const tab=$('#paloalto-tabs .current'),s=getComputedStyle(tab),probe=document.createElement('span');probe.style.color='var(--accent-ink)';probe.style.background='var(--accent)';document.body.append(probe);const p=getComputedStyle(probe),result={outline:s.outlineStyle,bg:s.backgroundColor,ink:s.color,expectedBg:p.backgroundColor,expectedInk:p.color};probe.remove();return result});
  assert.equal(focused.outline,'none');assert.equal(focused.bg,focused.expectedBg);assert.equal(focused.ink,focused.expectedInk);
  await page.evaluate(()=>controller('down'));
  assert.notEqual(await page.locator('#paloalto-tabs .current').evaluate(n=>getComputedStyle(n).boxShadow),'none','current category marker returns after focus leaves');
 }
 await page.evaluate(()=>setPalette('platinum'));
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),4);
 await page.evaluate(()=>controller('pageDown'));assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),12);assert.equal(await page.locator('#grid .game').count(),8);
 const selected=await page.evaluate(()=>presentationId);await page.evaluate(()=>{persist()});await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentationId),selected,'selection survives restart');
 await page.evaluate(()=>{paloaltoPane='index';controller('edit')});assert.equal(await page.locator('#detail').isVisible(),true);await page.evaluate(()=>nativeBack());
 await page.evaluate(()=>{paloaltoPane='index';controller('activate')});assert.equal(await page.evaluate(()=>window.launched),selected);
 await page.evaluate(()=>{paloaltoOpen(sections().findIndex(s=>s.genre==='Puzzles'));query='Tengami';$('#search').value=query;update()});assert.equal(await page.locator('#grid .show-all-matches').count(),1);
 await page.evaluate(()=>{paloaltoPane='index';paloaltoFocus();controller('down');controller('right');controller('pageDown')});
 assert.equal(await page.locator('#grid .show-all-matches').count(),1,'navigation preserves empty-search recovery');
 await page.evaluate(()=>controller('activate'));assert.equal(await page.locator('#grid .game').count(),1);
 await page.evaluate(()=>{query='';$('#search').value='';update();paloaltoOpen(1);paloaltoPane='index';paloaltoSelect(0);controller('favorite')});assert.equal(await page.evaluate(()=>filtered.length),2);
 await page.evaluate(()=>{query='no such title';$('#search').value=query;update()});assert.equal(await page.locator('#paloalto-play').isDisabled(),true);assert.equal(await page.locator('#paloalto-cover').getAttribute('src'),null);
 await page.evaluate(()=>{nativeBack();paloaltoOpen(sections().findIndex(s=>s.genre==='Story adventures'));paloaltoPane='index';paloaltoSelect(5);controller('back')});assert.equal(await page.evaluate(()=>document.activeElement.closest('#paloalto-tabs')!==null),true);await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>document.activeElement.closest('#grid')!==null),true);
 await page.evaluate(()=>{setPresentation('kyoto')});assert.equal(await page.locator('#paloalto-art').isVisible(),false);assert.equal(await page.locator('#paloalto-cover').getAttribute('src'),null);
 await page.evaluate(()=>{setPresentation('paloalto');showDialog('#settings-dialog');selectSettingsSection('appearance')});assert.equal(await page.locator('#typography').isVisible(),true);assert.equal(await page.locator('#selection-style').isVisible(),false);
 for(const [corners,radius] of [['square','0px'],['soft','7px'],['rounded','16px']])for(const [border,width] of [['none','0px'],['hairline','1px'],['matte','6px']]){
  await page.evaluate(({corners,border})=>{setCoverOptions(corners,coverBrightness,menuButtons);setLightAppearance(border,interfaceContrast,titleWeight);updateAppearancePreview()},{corners,border});
  await page.waitForFunction(()=>$('.appearance-sample img').complete);
  await page.evaluate(()=>updateAppearancePreview());
  const styles=await page.evaluate(()=>{const actual=getComputedStyle($('#paloalto-cover')),preview=getComputedStyle($('.appearance-sample img')),frame=getComputedStyle($('.appearance-sample'));return {radius:actual.borderRadius,width:actual.borderTopWidth,previewRadius:preview.borderRadius,previewWidth:preview.borderTopWidth,frameBorder:frame.borderTopWidth,frameOutline:frame.outlineStyle,card:getComputedStyle($('.appearance-sample-space'),'::before').backgroundColor,panel:getComputedStyle($('#main')).backgroundColor}});
  assert.equal(styles.radius,radius);assert.equal(styles.width,width);assert.equal(styles.previewRadius,radius);assert.equal(styles.previewWidth,width);assert.equal(styles.frameBorder,'0px');assert.equal(styles.frameOutline,'none');assert.equal(styles.card,styles.panel);
 }
 await page.screenshot({path:path.join(out,'appearance-preview.png')});
 await page.evaluate(()=>{nativeBack();wayfinderKeyboardChanged(true)});await page.setViewportSize({width:1097,height:300});await page.waitForTimeout(100);assert.equal(await page.locator('#paloalto-art').isVisible(),false);assert.ok(await page.locator('#grid').evaluate(n=>n.clientHeight>35));
 assert.deepEqual(errors,[]);console.log('PASS Palo Alto: paged 1,200-game collection, controller, persistence, details, launch, favorites, search recovery, settings, keyboard and 3 widths');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

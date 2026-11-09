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



 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Be Kind, Rewind').values);genre='';favoritesOnly=false;query='';update();bendSelect(1);});
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(250);
 await page.screenshot({path:'output/bend-first.png'});
 for(const shelves of [1,2])for(const [w,h] of [[1097,592],[800,600],[960,600],[900,600],[1260,540],[640,360]]){
  await page.evaluate(n=>setBendShelves(n),shelves);await page.setViewportSize({width:w,height:h});await page.waitForTimeout(150);
  assert.ok(await page.locator('.topbar .search').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=document.documentElement.clientWidth+1}),'hidden search stays within the viewport');
  await page.evaluate(()=>document.body.classList.add('search-active'));
  assert.ok(await page.locator('.topbar .search').evaluate(e=>e.getBoundingClientRect().right+4<=$('.app-actions').getBoundingClientRect().left),'search leaves header buttons clear');
  await page.evaluate(()=>document.body.classList.remove('search-active'));
  const geometry=await page.evaluate(()=>[...$('#grid').querySelectorAll('.game img')].map(img=>{const r=img.getBoundingClientRect(),g=$('#grid').getBoundingClientRect();return {ratio:r.width/r.height,inside:r.left>=g.left&&r.right<=g.right&&r.top>=g.top&&r.bottom<=g.bottom}}));
  assert.ok(geometry.length>0);for(const g of geometry){assert.ok(Math.abs(g.ratio-2/3)<.001,JSON.stringify(g));assert.ok(g.inside,'cover inside shelf '+w+' '+h);}
  await page.evaluate(()=>{bendPane='games';bendSelect(0);controller('right')});assert.equal(await page.evaluate(()=>presentationId),'g1');
  await page.evaluate(()=>controller('pageDown'));assert.ok(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)>1));
  await page.evaluate(()=>bendSelect(filtered.length-1));assert.equal(await page.locator('#grid .presentation-selected').count(),1);
 }
 await page.setViewportSize({width:1097,height:592});
 await page.evaluate(()=>{query='zzzznomatches';update()});assert.ok(await page.locator('#grid').innerText());
 await page.evaluate(()=>{query='';update();bendSelect(0);controller('favorite')});assert.equal(await page.locator('#grid .presentation-selected').count(),1);
 await page.evaluate(()=>{controller('search');wayfinderKeyboardChanged(true)});await page.setViewportSize({width:1097,height:300});await page.waitForTimeout(200);await page.screenshot({path:'output/bend-keyboard.png'});
 await page.evaluate(()=>{query='zzzznomatches';update()});await page.screenshot({path:'output/bend-empty.png'});
 await page.evaluate(()=>{wayfinderKeyboardChanged(false);query='';$('#search').value='';$('#search').blur();update()});await page.setViewportSize({width:1097,height:592});await page.waitForTimeout(100);
 await page.evaluate(()=>{bendPane='games';bendSelect(0)});await page.locator('#bend-next').click();assert.ok(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)>=bendColumns*bendRows),'touch page button');
 await page.evaluate(()=>{bendSelect(0);sort='za';update();bendSelect(0);const b=$('#grid .game:nth-child(2)');b.focus()});assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),await page.evaluate(()=>presentationId),'recycled card focus follows its identity after sorting');
 await page.evaluate(()=>{setArtFit('contain');updateAppearancePreview()});assert.equal(await page.locator('#grid .presentation-selected img').evaluate(e=>getComputedStyle(e).objectFit),'contain');
 await page.evaluate(()=>{genre='';query='';favoritesOnly=false;setArtFit('cover');sort='az';update();bendSelect(1);persist()});await page.reload();await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);assert.equal(await page.evaluate(()=>presentation),'bend','preset survives restart');
 await page.evaluate(()=>{controller('menu');$('#settings-nav-appearance').click();$('#bend-shelves').focus({preventScroll:true});openControllerChoice($('#bend-shelves'));controller('up');controller('activate');hideDialog('#settings-dialog');});await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>bendShelfCount),1);
 assert.ok(await page.evaluate(()=>Math.abs($('.topbar').getBoundingClientRect().left)<1&&Math.abs($('#main').getBoundingClientRect().left)<1&&scrollX===0),'switching through Settings leaves the page aligned');
 await page.evaluate(()=>{const spacer=document.createElement('div');spacer.id='audit-overflow';spacer.style.cssText='position:absolute;left:0;top:0;width:200vw;height:1px';document.body.append(spacer);window.scrollTo(180,0);setBendShelves(2);spacer.remove()});await page.waitForTimeout(80);
 assert.equal(await page.evaluate(()=>scrollX),0,'shelf changes clear stale document scroll');
 assert.deepEqual(errors,[]);console.log('PASS Bend geometry, paging, favorites, search and keyboard');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

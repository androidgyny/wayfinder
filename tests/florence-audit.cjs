const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/hongkong-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:60},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':i===1?'Arkanoid vs Space Invaders':i===2?'Masks of Glory (Atomic Pinball)':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<60,lastPlayed:Date.now()-i*1000}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
 if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}
 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);



 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Private Collection').values);genre='';favoritesOnly=false;query='';update();florenceSelect(1)});
 await page.evaluate(()=>document.fonts.ready);
 for(const [w,h] of [[1097,592],[800,600],[960,600],[900,600],[1260,540],[640,360]]){
  await page.setViewportSize({width:w,height:h});await page.waitForTimeout(200);
  const geometry=await page.evaluate(()=>[...$('#grid').querySelectorAll('.game')].map(b=>{const r=b.querySelector('img').getBoundingClientRect(),f=b.querySelector('.cover').getBoundingClientRect(),l=b.querySelector('.florence-label').getBoundingClientRect(),g=$('#grid').getBoundingClientRect();return {ratio:r.width/r.height,inside:f.left>=g.left&&f.right<=g.right&&f.top>=g.top&&l.bottom<=g.bottom,frame:{x:f.x,y:f.y,w:f.width,h:f.height},labelBottom:l.bottom,gridBottom:g.bottom}}));
  const labels=await page.locator('.gallery-title').evaluateAll(nodes=>nodes.map(e=>({text:e.textContent,w:e.clientWidth,scroll:e.scrollWidth,space:getComputedStyle(e).whiteSpace,display:getComputedStyle(e).display,parent:e.parentElement.getBoundingClientRect().width})));assert.ok(labels.every(e=>e.scroll<=e.w+1),JSON.stringify({w,h,labels}));assert.ok(geometry.length);for(const r of geometry){assert.ok(Math.abs(r.ratio-2/3)<.002,JSON.stringify(r));assert.ok(r.inside,JSON.stringify({w,h,r}));}
  await page.evaluate(()=>{florencePane='games';florenceSelect(0);controller('right')});assert.ok(await page.evaluate(()=>presentationId===filtered[1].id));
  await page.evaluate(()=>controller('pageDown'));assert.ok(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)>1));
  await page.evaluate(()=>florenceSelect(filtered.length-1));assert.equal(await page.locator('#florence-next').isDisabled(),true);
  await page.evaluate(()=>{query='unfindable';$('#search').value=query;update()});assert.ok(await page.locator('.search-empty').isVisible());
  await page.evaluate(()=>{query='';$('#search').value='';update();florenceSelect(1)});
  await page.evaluate(()=>document.body.classList.add('search-active'));
  assert.ok(await page.locator('.topbar .search').evaluate(e=>e.getBoundingClientRect().right+1<=$('.app-actions').getBoundingClientRect().left),'search does not overlap actions');
  await page.evaluate(()=>document.body.classList.remove('search-active'));
 }
 await page.setViewportSize({width:1097,height:592});await page.waitForTimeout(200);await page.screenshot({path:'output/florence-browser.png'});
 await page.evaluate(()=>{florencePane='tabs';florenceFocus();controller('right')});assert.equal(await page.evaluate(()=>florencePane),'tabs');
 await page.evaluate(()=>{controller('down');controller('favorite');controller('edit')});assert.ok(await page.locator('#editor').evaluate(d=>d.open));await page.evaluate(()=>cancelEditor());
 await page.evaluate(()=>setPresentation('bend'));assert.equal(await page.locator('#florence-tabs').isVisible(),false);
 await page.evaluate(()=>setPresentation('florence'));assert.equal(await page.locator('#florence-tabs').isVisible(),true);
 await page.setViewportSize({width:1097,height:270});await page.evaluate(()=>{document.body.classList.add('input-compact','search-active');query='unfindable';$('#search').value=query;update();sizePresentation()});await page.waitForTimeout(150);
 assert.ok(await page.locator('.search-empty').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),'empty search stays in keyboard viewport');
 await page.evaluate(()=>{query='';$('#search').value='';document.body.classList.remove('input-compact','search-active');update()});await page.setViewportSize({width:1097,height:592});await page.waitForTimeout(200);
 await page.evaluate(()=>{showDialog('#settings-dialog');updateAppearancePreview()});
 const preview=await page.locator('.appearance-sample').evaluate(e=>({image:getComputedStyle(e).borderImageSource,shadow:getComputedStyle(e).boxShadow}));assert.ok(preview.image.includes('gallery-frame.svg'));assert.notEqual(preview.shadow,'none');
 await page.evaluate(()=>hideDialog('#settings-dialog'));
 assert.equal(await page.locator('.gallery-kind').count(),0);
 assert.deepEqual(errors,[]);console.log('Florence: six aspect ratios, frames/labels, 2:3 art, paging, empty search, header overlap, gamepad, favorites, editor and layout switching passed.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});

const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/hongkong-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:1200},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<3}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
 if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}
 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);

 await page.evaluate(()=>applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Scroll Wheel').values));
 assert.equal(await page.evaluate(()=>presentation),'ithaca');
 assert.equal(await page.locator('#grid .ithaca-row').count(),5);
 await page.locator('#ithaca-play').click();
 assert.equal(await page.evaluate(()=>ithacaLevel),'games');
 assert.equal(await page.locator('#grid .ithaca-row').count(),5);
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>ithacaIndex),1);
 const r=await page.locator('.ithaca-ring').boundingBox();const cx=r.x+r.width/2,cy=r.y+r.height/2,rr=r.width*.4;
 await page.mouse.move(cx+rr*Math.cos(.7),cy+rr*Math.sin(.7));const before=await page.evaluate(()=>ithacaIndex);await page.mouse.down();assert.equal(await page.evaluate(()=>ithacaIndex),before);
 for(let i=1;i<35;i++)await page.mouse.move(cx+rr*Math.cos(.7+i*.08),cy+rr*Math.sin(.7+i*.08));await page.mouse.up();
 const after=await page.evaluate(()=>ithacaIndex);assert.ok(after>before);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>ithacaIndex),after);
 // Cancellation must discard queued wheel steps, including on dialog/resize interruption.
 await page.evaluate(()=>{ithacaGesture={id:9};ithacaPending=5;ithacaFrame=requestAnimationFrame(()=>ithacaMove(5));window.dispatchEvent(new Event('blur'));});
 const cancelled=await page.evaluate(()=>ithacaIndex);await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>ithacaIndex),cancelled);assert.equal(await page.evaluate(()=>ithacaGesture),null);
 await page.evaluate(()=>{ithacaSelect(0,true);window.edgeRow=$('#grid .presentation-selected');ithacaMove(-1);});
 assert.ok(await page.evaluate(()=>edgeRow===$('#grid .presentation-selected')),'Holding at list boundary should not rebuild rows');
 await page.evaluate(()=>ithacaDrawRows());assert.ok(await page.evaluate(()=>document.activeElement===$('#grid .presentation-selected')),'Redraw must preserve keyboard focus');
 await page.evaluate(()=>{ithacaOpen('favorites');controller('genrePrev')});assert.equal(await page.evaluate(()=>ithacaScope),'genre:Story adventures');
 await page.evaluate(()=>ithacaOpen('all'));
 await page.evaluate(()=>{controller('edit')});assert.ok(await page.locator('#editor').isVisible());await page.evaluate(()=>nativeBack());
 const holdBounds=await page.locator('#ithaca-play').boundingBox();await page.mouse.move(holdBounds.x+2,holdBounds.y+holdBounds.height/2);await page.mouse.down();await page.waitForTimeout(120);const pressedBounds=await page.locator('#ithaca-play').boundingBox();assert.ok(Math.abs(pressedBounds.x-holdBounds.x)<.1&&Math.abs(pressedBounds.width-holdBounds.width)<.1,'Pressed button retains its hit area');await page.waitForTimeout(720);assert.ok(await page.locator('#editor').isVisible());await page.mouse.up();assert.equal(await page.evaluate(()=>window.launched),undefined,'Hold-to-edit must not launch');await page.evaluate(()=>nativeBack());
 await page.evaluate(()=>ithacaOpen('recent'));assert.equal(await page.evaluate(()=>filtered.length),0);
 await page.evaluate(()=>{ithacaOpen('favorites')});assert.equal(await page.evaluate(()=>filtered.length),3);
 await page.evaluate(()=>{ithacaOpen('genre:Puzzles');controller('search')});await page.locator('#search').fill('zzzz-no-match');assert.ok(await page.locator('.search-empty').isVisible());await page.setViewportSize({width:1097,height:320});await page.waitForTimeout(100);assert.ok(await page.locator('.search-empty').isVisible());await page.setViewportSize({width:1097,height:592});await page.evaluate(()=>controller('back'));
 await page.evaluate(()=>{showDialog('#settings-dialog');updateAppearancePreview()});assert.ok(await page.locator('.appearance-sample img').isVisible());await page.evaluate(()=>hideDialog('#settings-dialog'));
 await page.evaluate(()=>{setPresentation('tacoma');setPresentation('ithaca');ithacaOpen('genre:Puzzles');ithacaSelect(2);persist()});
 await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),'ithaca');assert.equal(await page.evaluate(()=>ithacaScope),'genre:Puzzles');
 for(const [w,h] of [[1097,592],[800,600],[960,600],[900,600],[1260,540],[1097,320],[800,220]]){
  await page.setViewportSize({width:w,height:h});await page.waitForTimeout(100);
  const info=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,rows:[...document.querySelectorAll('#grid .ithaca-row')].map(n=>n.getBoundingClientRect().height),art:$('#ithaca-cover').getBoundingClientRect().toJSON()}));
  assert.ok(info.scroll<=w);assert.ok(info.rows.every(n=>n>=20),JSON.stringify(info));assert.ok(info.art.right<=w&&info.art.bottom<=h+1,JSON.stringify(info));
 }
 await page.setViewportSize({width:1097,height:592});await page.screenshot({path:'output/ithaca-browser.png'});
 await page.evaluate(()=>{ithacaPress('next');ithacaPress('next')});
 assert.equal(await page.locator('#ithaca-next').evaluate(n=>n.getAnimations().filter(a=>a.id==='ithaca-press').length),1);
 await page.waitForTimeout(180);assert.equal(await page.locator('#ithaca-next').evaluate(n=>n.getAnimations().length),0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>ithacaPress('play'));assert.equal(await page.locator('#ithaca-play').evaluate(n=>n.getAnimations().length),0);
 assert.deepEqual(errors,[]);console.log('PASS wheel drag/release, controller, edit, recent/favorites/search, preview, reload and seven viewports');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

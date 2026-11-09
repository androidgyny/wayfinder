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




 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Graphic Content').values);genre='';favoritesOnly=false;query='';update();brusselsSelect(0)});
 for(const [w,h] of [[1097,592],[800,600],[960,600],[900,600],[1260,540],[640,360]]){
 await page.setViewportSize({width:w,height:h});await page.waitForTimeout(200);
 const g=await page.evaluate(()=>{const r=$('#brussels-cover').getBoundingClientRect(),a=$('#brussels-art').getBoundingClientRect(),f=$('#brussels-footer').getBoundingClientRect();return {ratio:r.width/r.height,inside:r.left>=a.left&&r.right<=a.right&&r.top>=a.top&&r.bottom<=a.bottom,footer:f.bottom<=innerHeight+1}});
 assert.ok(Math.abs(g.ratio-2/3)<.002,JSON.stringify(g));assert.ok(g.inside&&g.footer,JSON.stringify({w,h,g}));
 await page.evaluate(()=>{brusselsPane='games';brusselsSelect(0);controller('down')});assert.ok(await page.evaluate(()=>presentationId===filtered[1].id));
 const before=await page.evaluate(()=>brusselsScene);await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>brusselsScene),before);
 await page.evaluate(()=>controller('genreNext'));assert.notEqual(await page.evaluate(()=>brusselsScene),before);
 }
 await page.evaluate(()=>{brusselsOpen(sections().findIndex(s=>s.label.includes('very long')));syncBrusselsMarquee()});
 assert.equal(await page.locator('#brussels-tabs .marquee').count(),1);assert.ok(await page.locator('#brussels-tabs .current').evaluate(e=>e.classList.contains('marquee')));
 await page.evaluate(()=>{brusselsOpen(0);syncBrusselsMarquee()});assert.equal(await page.locator('#brussels-tabs .marquee').count(),0);
 await page.setViewportSize({width:1097,height:592});await page.screenshot({path:'output/brussels-browser.png'});
 for(const density of [5,6,8]){
 await page.evaluate(d=>{brusselsSelect(2);setBrusselsOptions({...brusselsOptions,density:d,background:'3',sceneryColor:'grayscale',coverColor:'sepia',strength:35})},density);
 assert.equal(await page.locator('#grid .game').count(),density);assert.ok(await page.evaluate(()=>presentationId===filtered[2].id));
 assert.equal(await page.locator('#brussels-cover').evaluate(e=>getComputedStyle(e).filter),'sepia(0.85)');
 const scene=await page.locator('#brussels-art').evaluate(e=>e.style.getPropertyValue('--comic-scene'));
 await page.evaluate(()=>controller('genreNext'));assert.equal(await page.locator('#brussels-art').evaluate(e=>e.style.getPropertyValue('--comic-scene')),scene);
 }
 const snapshot=await page.evaluate(()=>appearanceSnapshot());await page.evaluate(()=>setBrusselsOptions({background:'halftone',strength:0}));await page.evaluate(v=>applyAppearanceValues(v),snapshot);assert.deepEqual(await page.evaluate(()=>brusselsOptions),snapshot.brusselsOptions);
 await page.evaluate(()=>applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Graphic Content').values));assert.deepEqual(await page.evaluate(()=>brusselsOptions),{strength:75,background:'rotate',density:8,sceneryColor:'muted',coverColor:'original'});
 await page.evaluate(()=>{query='zzzznoresults';$('#search').value=query;update()});assert.equal(await page.locator('#grid .game').count(),0);assert.ok(await page.locator('#grid').innerText());
 await page.evaluate(()=>{query='';$('#search').value='';update();setPresentation('kyoto');setPresentation('brussels');brusselsSelect(0)});assert.ok(await page.locator('#brussels-cover').isVisible());
 await page.evaluate(()=>{controller('search')});assert.equal(await page.evaluate(()=>document.activeElement.id),'search');await page.evaluate(()=>controller('back'));
 await page.evaluate(()=>{games=[];rebuildGenres();update();focusStartupGame()});assert.equal(await page.locator('#grid .game').count(),0);assert.equal(await page.locator('#brussels-print').isVisible(),false);

 const decoded=await page.evaluate(async()=>{for(let i=1;i<=15;i++){const im=new Image();im.src='comic-scenes/'+String(i).padStart(2,'0')+'.webp';await im.decode();if(!im.naturalWidth)return false;}return true});assert.ok(decoded);assert.deepEqual(errors,[]);console.log('Brussels: six sizes, exact portrait geometry, controller navigation, category-only scene rotation passed');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

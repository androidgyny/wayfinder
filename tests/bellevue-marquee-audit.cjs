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






 const long='A very long user category name that must remain usable';
 await page.evaluate(long=>{setPresentation('bellevue');genre=long;update()},long);
 for(const [width,height] of [[1920,1080],[1097,592],[1024,768],[1280,800],[1200,800],[1680,720]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(200);
 const state=await page.evaluate(()=>{const tab=$('#showcase-tabs .current'),clip=tab.querySelector('.showcase-tab-label'),s=clip.firstElementChild;return {active:tab.classList.contains('bellevue-marquee'),overflow:s.scrollWidth-clip.clientWidth,animation:getComputedStyle(s).animationName}});
 assert.equal(state.active,state.overflow>1);if(state.active)assert.equal(state.animation,'bellevue-category-scroll');
 assert.equal(await page.locator('.showcase-tab:not(.current) .bellevue-category-text').count(),0);
 }
 await page.setViewportSize({width:1097,height:592});await page.waitForTimeout(100);
 assert.equal(await page.locator('.current').filter({has:page.locator('.bellevue-category-text')}).evaluate(n=>n.classList.contains('bellevue-marquee')),true);
 await page.evaluate(()=>showDialog('#settings-dialog'));await page.waitForTimeout(60);assert.equal(await page.locator('.bellevue-category-text').evaluate(n=>getComputedStyle(n).animationPlayState),'paused');await page.evaluate(()=>nativeBack());
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.bellevue-category-text').evaluate(n=>getComputedStyle(n).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{genre='Puzzles';update()});await page.waitForTimeout(100);assert.equal(await page.locator('.bellevue-marquee').count(),0);
 await page.evaluate(()=>{setPresentation('milan');update()});await page.waitForTimeout(100);assert.equal(await page.locator('.bellevue-category-text').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS Bellevue six sizes, overflow only, inactive blades, dialog pause, reduced motion, layout switching');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

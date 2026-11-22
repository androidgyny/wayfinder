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
 await page.evaluate(long=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Homage').values);genre=long;update()},long);
 for(const [width,height] of [[1920,1080],[1097,592],[1024,768],[1280,800],[1200,800],[1680,720]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(180);
 const state=await page.evaluate(()=>{const h=$('#showcase-category'),s=h.firstElementChild;return {active:h.classList.contains('milan-marquee'),distance:s.scrollWidth-h.clientWidth,animation:getComputedStyle(s).animationName,count:$('#showcase-count').getBoundingClientRect().right,heading:h.getBoundingClientRect().right}});
 assert.ok(state.active&&state.distance>1,JSON.stringify(state));assert.equal(state.animation,'milan-category-scroll');assert.ok(state.count>state.heading);
 }
 await page.evaluate(()=>showDialog('#settings-dialog'));await page.waitForTimeout(60);assert.equal(await page.locator('.milan-category-text').evaluate(n=>getComputedStyle(n).animationPlayState),'paused');await page.evaluate(()=>nativeBack());
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.milan-category-text').evaluate(n=>getComputedStyle(n).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{genre='Puzzles';update()});await page.waitForTimeout(100);assert.equal(await page.locator('#showcase-category').evaluate(n=>n.classList.contains('milan-marquee')),false);
 await page.evaluate(()=>{genre='A very long user category name that must remain usable';update()});await page.waitForTimeout(100);
 await page.screenshot({path:path.join(out,'milan-category-marquee.png')});
 console.log('PASS Milan overflow, six sizes, short heading, dialog pause, reduced motion');
 const report=[];await page.setViewportSize({width:1097,height:592});
 for(const mode of await page.evaluate(()=>[...$('#presentation').options].map(o=>o.value))){
 await page.evaluate(({mode,long})=>{setPresentation(mode);genre=long;favoritesOnly=false;update()},{mode,long});await page.waitForTimeout(240);
 const found=await page.evaluate(long=>[...document.querySelectorAll('h1,h2,button,span')].filter(n=>n.getBoundingClientRect().width>0&&n.getBoundingClientRect().height>0&&n.textContent.includes(long)&&n.scrollWidth>n.clientWidth+2&&getComputedStyle(n).overflowX==='hidden'&&getComputedStyle(n).textOverflow==='ellipsis').map(n=>({id:n.id,cls:n.className,text:n.textContent.slice(0,95)})),long);
 if(found.length)report.push({mode,found});
 }
 fs.writeFileSync(path.join(out,'category-overflow-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await page.evaluate(long=>{setPresentation('milan');genre=long;update()},long);await page.waitForTimeout(250);assert.equal(await page.locator('#showcase-category').evaluate(n=>n.classList.contains('milan-marquee')),true,'return to Milan');assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

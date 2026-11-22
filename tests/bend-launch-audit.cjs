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





 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.values.presentation==='bend').values);genre='';favoritesOnly=false;query='';update()});
 for(const [w,h] of [[1097,592],[800,600],[960,600],[900,600],[1260,540],[640,360]]){
 await page.setViewportSize({width:w,height:h});
 for(const rows of [1,2]){
 await page.evaluate(rows=>setBendShelves(rows),rows);await page.waitForTimeout(280);
 for(const index of [0, await page.evaluate(()=>bendColumns-1),await page.evaluate(()=>bendColumns*bendRows-1)]){
 await page.evaluate(i=>bendSelect(i),index);await page.waitForTimeout(280);
 const result=await page.evaluate(()=>{window.launched=null;const card=document.querySelector('#grid .presentation-selected'),before=getComputedStyle(card).transform;play(presentationId);return {launched:window.launched,id:presentationId,before,after:getComputedStyle(card).transform,animations:card.getAnimations().filter(a=>a.id==='recent-layout-polish').length}});
 assert.equal(result.launched,result.id,'Bend launches synchronously');assert.equal(result.before,result.after);assert.equal(result.animations,0);
 await page.evaluate(()=>cancelButtonPresses());
 }
 }
 }
 console.log('PASS Bend immediate launch, unchanged browsing transform: six viewports, both shelf counts, edge cases');
 assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

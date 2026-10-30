const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/sedona-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:1200},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<3}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
 if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}
 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592},hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Hyperstack').values);genre='';query='';update();paloaltoSelect(0)});
 assert.equal(await page.locator('#paloalto-page-flash').evaluate(n=>n.getAnimations().length),0,'no entrance flash');
 await page.evaluate(()=>paloaltoSelect(1));assert.equal(await page.locator('#paloalto-page-flash').evaluate(n=>n.getAnimations().length),0,'no effect per row');
 await page.evaluate(()=>paloaltoSelect(8));assert.equal(await page.locator('#paloalto-page-flash').evaluate(n=>n.getAnimations().length),1,'page turn animates');
 await page.evaluate(()=>{paloaltoSelect(16);paloaltoSelect(24)});assert.equal(await page.locator('#paloalto-page-flash').evaluate(n=>n.getAnimations().length),1,'rapid turns do not stack');
 assert.equal(await page.locator('#paloalto-page-flash').evaluate(n=>getComputedStyle(n).pointerEvents),'none');
 await page.evaluate(()=>showDialog('#settings-dialog'));assert.equal(await page.locator('#paloalto-page-flash').evaluate(n=>n.getAnimations().length),0,'dialog cancels turn');await page.evaluate(()=>hideDialog('#settings-dialog'));
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>paloaltoSelect(32));assert.equal(await page.locator('#paloalto-page-flash').evaluate(n=>n.getAnimations().length),0);await page.emulateMedia({reducedMotion:'no-preference'});
 for(const [width,height]of [[1097,592],[1024,768],[800,450],[1280,550]]){await page.setViewportSize({width,height});await page.evaluate(()=>{paloaltoSelect(0);paloaltoSelect(8)});const bounds=await page.locator('#paloalto-page-flash').boundingBox(),main=await page.locator('#main').boundingBox();assert.ok(bounds.x>=main.x&&bounds.y>=main.y&&bounds.x+bounds.width<=main.x+main.width+1&&bounds.y+bounds.height<=main.y+main.height+1);}
 await page.setViewportSize({width:1097,height:592});const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
 const read=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));const results=[];
 for(const enabled of [false,true,true,false]){
  await page.evaluate(enabled=>{window.savedTurn=window.savedTurn||paloaltoTurn;paloaltoTurn=enabled?savedTurn:()=>{};cancelPaloaltoTurn()},enabled);await page.waitForTimeout(200);const before=await read();
  const timing=await page.evaluate(async()=>{const calls=[],frames=[];let last=performance.now();for(let i=0;i<180;i++){await new Promise(requestAnimationFrame);const now=performance.now();if(i>1)frames.push(now-last);last=now;if(i%10===0){const t=performance.now();paloaltoSelect((i/10%2)*8);document.body.offsetHeight;calls.push(performance.now()-t)}}frames.sort((a,b)=>a-b);calls.sort((a,b)=>a-b);return {callMedian:calls[Math.floor(calls.length/2)],frameP95:frames[Math.floor(frames.length*.95)],slowFrames:frames.filter(n=>n>34).length}});const after=await read();results.push({enabled,...timing,taskMs:(after.TaskDuration-before.TaskDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000});
 }
 fs.writeFileSync(path.resolve(__dirname,'../output/hyperstack-performance.json'),JSON.stringify(results,null,2));console.log(results);assert.deepEqual(errors,[]);console.log('PASS Hyperstack: paging, rapid turns, dialogs, reduced motion, geometry and performance comparison');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
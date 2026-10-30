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
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
 const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 if(process.env.NO_GLINT)await page.evaluate(()=>{const original=Element.prototype.animate;Element.prototype.animate=function(frames,options){return original.call(this,frames,this.id==='blade-glint'?{duration:0}:options)}});
 const results={};
 for(const layout of ['bellevue','copenhagen','sedona','abbotsford','kyoto','bath','redmond','atlantis']){
  await page.evaluate(l=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.values.presentation===l).values);query='';genre='';update()},layout);await page.waitForTimeout(250);
  const before=await metrics();
  const frames=await page.evaluate(async()=>{const times=[];let last=performance.now();for(let i=0;i<90;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-last);last=now;if(i%6===0)controller(presentation==='bellevue'?'genreNext':presentation==='kyoto'||presentation==='copenhagen'?'right':'down');}return times.slice(2).sort((a,b)=>a-b)});
  const after=await metrics();results[layout]={frameMedian:frames[Math.floor(frames.length/2)],frameP95:frames[Math.floor(frames.length*.95)],over34ms:frames.filter(n=>n>34).length,taskMs:(after.TaskDuration-before.TaskDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000};
 }
 await page.evaluate(()=>{setPresentation('sedona');games[0].title='Very long radio display title '.repeat(8);update();sedonaSelect(0)});await page.waitForTimeout(250);
 const before=await metrics();await page.waitForTimeout(2000);const after=await metrics();results.marqueeIdle={taskMs:(after.TaskDuration-before.TaskDuration)*1000,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000};
 fs.writeFileSync(path.resolve(__dirname,'../output/effects-performance'+(process.env.NO_GLINT?'-no-glint':'')+'.json'),JSON.stringify(results,null,2));console.log(results);assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
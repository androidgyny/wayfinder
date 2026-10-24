/* Deterministic mixed-interaction audit; synthetic data only, no device/network API calls. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
const fixture=Array.from({length:1200},(_,i)=>({id:'mix_'+i,title:(i%7?'Game ':'Retro ')+String(i).padStart(4,'0')+(i%11?'':' — 漢字 & "quoted"'),genre:['Action','Puzzles','RPGs','Kids\' games','A & B','日本語'][i%6],image:'icon/test.fixture',package:'test.fixture',kind:'app',favorite:i%13===0,lastPlayed:i%5?0:i+1}));
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120"><rect width="80" height="120" fill="#386a59"/></svg>';
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname;
 if(u==='/games.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.GAMES='+JSON.stringify(fixture));}
 if(u.startsWith('/icon/')){res.setHeader('Content-Type','image/svg+xml');return res.end(svg);}
 try{const file=path.join(root,u==='/'?'index.html':u);res.setHeader('Content-Type',u.endsWith('.js')?'text/javascript':u.endsWith('.css')?'text/css':u.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1097,height:592}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(data=>{window.fixtureDb=data;window.Portal={library:()=>JSON.stringify(fixtureDb),view:()=>localStorage.view||'{}',saveView:v=>localStorage.view=v,sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]'};},fixture);

  await page.addInitScript(()=>{if(!localStorage.view)localStorage.view=JSON.stringify({presentation:'atlantis',palette:'pearl',typography:'clean',backdrop:'flat',artFit:'cover'})});
  let release;const delayed=new Promise(r=>release=r);await page.route('**/app.js',async route=>{await delayed;await route.continue()});
  const navigation=page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>!!document.body);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).visibility),'hidden','default library must not paint before restoration');
  release();await navigation;await page.waitForFunction(()=>!restoring&&!document.documentElement.classList.contains('restoring-appearance'));
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).visibility),'visible');assert.equal(await page.evaluate(()=>presentation),'atlantis');assert.equal(await page.evaluate(()=>palette),'pearl');
  await page.evaluate(()=>window.onNativeResume());assert.equal(await page.evaluate(()=>getComputedStyle(document.body).visibility),'visible','warm resume remains visible');
  await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),'atlantis');assert.equal(await page.evaluate(()=>getComputedStyle(document.body).visibility),'visible');assert.deepEqual(errors,[]);
  console.log('PASS delayed startup hides default layout, reveals saved Atlantis appearance, warm resume and reload preserve appearance');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

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

 for(const [preset,layout,forward,backward] of [['Folio Nova','vienna','right','left'],['Cross Reference','prague','down','up']]){
  await page.evaluate(({preset,layout})=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name===preset).values);query='';genre='';update();if(layout==='vienna')viennaOpen('genre:Puzzles',true);else pragueOpen('genre:Puzzles',true)}, {preset,layout});
  const result=await page.evaluate(async({layout,forward,backward})=>{
   const node=document.querySelector(layout==='vienna'?'.vienna-row':'.prague-column.expanded .prague-list'),prop=layout==='vienna'?'scrollLeft':'scrollTop';let saves=0;const original=native.saveView;native.saveView=()=>saves++;
   const samples=[];let sampling=true;const frame=()=>{samples.push(node[prop]);if(sampling)requestAnimationFrame(frame)};requestAnimationFrame(frame);
   for(let i=0;i<25;i++){controller(forward);await new Promise(r=>setTimeout(r,65))}
   await new Promise(r=>setTimeout(r,400));sampling=false;const end=node[prop],id=presentationId;
   for(let i=0;i<25;i++){controller(backward);await new Promise(r=>setTimeout(r,65))}
   await new Promise(r=>setTimeout(r,400));native.saveView=original;
   return {samples,end,id,start:node[prop],saves};
  },{layout,forward,backward});
  assert.ok(result.end>100);assert.ok(result.start<2,layout+' returns to beginning');
  assert.ok(result.samples.every((x,i,a)=>i===0||x>=a[i-1]-1),layout+' monotonic movement');assert.ok(result.saves<8,layout+' saves coalesced');
  console.log(layout,JSON.stringify({frames:result.samples.length,saves:result.saves,distance:result.end}));
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(forward=>controller(forward),forward);assert.equal(await page.evaluate(layout=>categoryTrackMotion.has(document.querySelector(layout==='vienna'?'.vienna-row':'.prague-column.expanded .prague-list')),layout),false);await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(forward=>controller(forward),forward);await page.evaluate(layout=>document.querySelector(layout==='vienna'?'.vienna-row':'.prague-column.expanded .prague-list').dispatchEvent(new Event('pointerdown')),layout);assert.equal(await page.evaluate(layout=>categoryTrackMotion.has(document.querySelector(layout==='vienna'?'.vienna-row':'.prague-column.expanded .prague-list')),layout),false);
 }
 assert.deepEqual(errors,[]);console.log('PASS held navigation, monotonic scroll, save coalescing, reduced motion, and touch cancellation');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

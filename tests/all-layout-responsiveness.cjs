/* Run with Node and Playwright installed; BROWSER_CHANNEL defaults to msedge.
   Uses a synthetic library and images. No device or personal files are required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
// Optional committed baseline, served without modifying the working tree.
const baseline=process.env.AUDIT_BASELINE,assetCache=new Map();
function asset(file){if(!baseline)return fs.readFileSync(file);const name=path.relative(root,file).split(path.sep).join('/');if(!assetCache.has(name))assetCache.set(name,require('node:child_process').execFileSync('git',['show',baseline+':app/src/main/assets/www/'+name],{cwd:path.resolve(__dirname,'..'),maxBuffer:30*1024*1024}));return assetCache.get(name);}
const fixture={id:'audit',title:'Audit & Cover',genre:'Alpha',kind:'app',package:'test.audit',image:'audit-image.svg',lastPlayed:0};
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#357a62"/></svg>';
(async()=>{
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.includes('audit-image')||pathname.startsWith('/icon/')||pathname.startsWith('/art-icon/')){res.setHeader('Content-Type','image/svg+xml');res.end(svg);return;}
 if(pathname==='/games.js'){res.setHeader('Content-Type','application/javascript');res.end('window.GAMES='+JSON.stringify([fixture]));return;}
 const file=path.join(root,pathname==='/'?'index.html':pathname);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(asset(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});

 const page=await browser.newPage({viewport:{width:1097,height:592},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto('http://127.0.0.1:'+server.address().port);


 await page.waitForTimeout(250);
 await page.evaluate(()=>{games=Array.from({length:1200},(_,i)=>({id:String(i),title:['Écho','Adventure','Puzzle','Retro'][i%4]+' '+((i*7919)%1200),genre:'Category '+i%24,image:'audit-image.svg',favorite:i%7===0,lastPlayed:i%3?Date.now()-i*86400000:0}));rebuildGenres();drawerCatalog=Array.from({length:500},(_,i)=>({package:'test.app'+i,title:'Utility '+((i*197)%500)}));drawerPreferences=drawerCatalog.map((a,i)=>({package:a.package,title:a.title,pinned:i<8,order:i}));});
 const metrics={};
 assert.equal(await page.evaluate(()=>{
  const now=new Date(),dates=[0,NaN,Infinity,now.getTime(),new Date(now.getFullYear(),now.getMonth(),now.getDate()-1).getTime(),new Date(now.getFullYear(),0,1).getTime(),new Date(2001,1,3).getTime()];
  return dates.every(value=>{const d=new Date(Number(value));let expected='Never';if(Number(value)&&Number.isFinite(d.getTime())){const yesterday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-1);expected=d.toDateString()===now.toDateString()?'Today':d.toDateString()===yesterday.toDateString()?'Yesterday':d.toLocaleDateString(undefined,{month:'short',day:'numeric',...(d.getFullYear()!==now.getFullYear()?{year:'numeric'}:{})});}return desktopDateLabel(value)===expected});
 }),true,'reused date formatters preserve relative dates, invalid dates and year labels');
 const layouts=process.env.AUDIT_LAYOUTS?.split(',')||await page.evaluate(()=>[...$('#presentation').options].map(o=>o.value));
 for(const mode of layouts){
  await page.evaluate(mode=>{document.activeElement.blur();query='';genre='';favoritesOnly=false;const p=builtinAppearancePresets.find(p=>p.values.presentation===mode);if(p)applyAppearanceValues(p.values);setPresentation(mode);if(mode==='cambridge')cambridgeOpen('all','games');if(mode==='prague')pragueOpen('genre:Category 0',true);if(mode==='vienna')viennaOpen('genre:Category 0',true);if(mode==='ulm')ulmOpen('all');if(mode==='seattle')seattleBrowse=true;update();controllerFocus(document.querySelector("#grid .presentation-selected")||document.querySelector("#grid .game"),true);},mode);
  await page.waitForTimeout(100);
  metrics[mode]=await page.evaluate(async()=>{
   const sample=async(fn,n)=>{const times=[];for(let i=0;i<n;i++){await new Promise(requestAnimationFrame);const t=performance.now();fn(i);document.body.offsetHeight;times.push(performance.now()-t)}times.sort((a,b)=>a-b);return {median:times[Math.floor(times.length/2)],p95:times[Math.floor(times.length*.95)],max:times.at(-1)}};
   const updateTimes=await sample(()=>update(),5);
   const visited=new Set();
   const navigation=await sample(i=>{controller(['kyoto','cupertino','venice','vienna','seattle'].includes(presentation)?'right':'down');visited.add(document.activeElement?.closest('.game')?.dataset.id||presentationId)},32);
   const category=await sample(()=>controller('genreNext'),8);
   const search=await sample(i=>{query=['retro','retro 1','puzzle',''][i%4];update()},8);
   query='';update();
   return {update:updateTimes,navigation,visited:visited.size,category,search,nodes:document.querySelectorAll('*').length};
  });
  assert.ok(metrics[mode].visited>1,mode+' navigation actually changes game selection');
  console.log(mode,JSON.stringify(metrics[mode]));
 }
 const output=path.resolve(__dirname,'../output/responsiveness-'+(process.env.AUDIT_TAG||'latest')+'.json');fs.writeFileSync(output,JSON.stringify(metrics,null,2));
 assert.equal(await page.evaluate(()=>{const titles=['Écho 2','echo 10','Alpha','alpha','Zebra','日本語','Özil',''];return titles.every(a=>titles.every(b=>Math.sign(compareTitles(a,b))===Math.sign(a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}))))}),true,'same locale ordering');
 assert.deepEqual(await page.evaluate(()=>{const g={title:'Café Retro'};const first=searchableTitle(g);g.title='Renamed';return [first,searchableTitle(g),searchableTitle({title:'Replacement'})]}),['cafe retro','renamed','replacement'],'search cache follows edits and replacements');
 assert.equal(await page.evaluate(()=>{openApps();return drawerRenderPreferences===null&&drawerRenderGames===null}),true,'render lookups released');
 assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

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
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
  const report=await page.evaluate(async()=>{
   let seed=17391;const pick=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
   const layouts=[...$('#presentation').options].map(o=>o.value),before=JSON.stringify(games),results=[];
   for(let i=0;i<360;i++){
    const action=pick(9);
    if(action===0)setPresentation(layouts[pick(layouts.length)]);
    else if(action===1){query=['','retro','漢字','nothing-matches'][pick(4)];$('#search').value=query;$('#search').dispatchEvent(new Event('input',{bubbles:true}));}
    else if(action===2)stepSection(pick(2)?1:-1);
    else if(action===3)controller(['left','right','up','down','pageUp','pageDown'][pick(6)]);
    else if(action===4){$('#sort').value=['az','za','recent','favorites'][pick(4)];$('#sort').dispatchEvent(new Event('change',{bubbles:true}));}
    else if(action===5){editGame(games[pick(games.length)]);$('#edit-title').value='Canceled edit';$('#reset-cover').click();cancelEditor();}
    else if(action===6){showDialog('#settings-dialog');const p=builtinAppearancePresets[pick(builtinAppearancePresets.length)];$('#appearance-presets').value=p.name;auditionAppearancePreset();finishAppearanceAudition(false);hideDialog('#settings-dialog');}
    else if(action===7){showDialog('#settings-dialog');hideDialog('#settings-dialog');}
    else{persist();update();}
    if(JSON.stringify(games)!==before)throw Error('Unexpected library mutation at '+i+' action '+action);
    if(filtered.some(g=>!games.some(original=>original.id===g.id)))throw Error('Stale filtered record at '+i);
    if($('#grid .game')&&![...document.querySelectorAll('#grid .game')].every(g=>games.some(original=>original.id===g.dataset.id)))throw Error('Unknown rendered ID at '+i);
    if(topDialog())throw Error('Orphan dialog at '+i+' '+topDialog().id);
    if(i%30===0){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));results.push({step:i,presentation,visible:filtered.length});}
   }
   persist();return results;
  });
  await page.reload();await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
  assert.deepEqual(await page.evaluate(()=>games),fixture);assert.deepEqual(errors,[]);
  console.log('PASS 360 deterministic mixed interactions and reload with 1,200 games: '+JSON.stringify(report));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

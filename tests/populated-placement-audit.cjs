const width=Number(process.env.AUDIT_WIDTH)||1097,normalHeight=Number(process.env.AUDIT_HEIGHT)||592;
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/placement-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:1200},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<3}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
 if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}
 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{const page=await browser.newPage({viewport:{width,height:normalHeight}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);


 const layouts=await page.locator('#presentation option').evaluateAll(ns=>ns.map(n=>n.value)),issues=[];
 const output=path.resolve('output/placement-populated'+(process.env.AUDIT_PROFILE?'-'+process.env.AUDIT_PROFILE:''));fs.mkdirSync(output,{recursive:true});
 for(const layout of layouts)for(const height of (process.env.AUDIT_HEIGHTS?process.env.AUDIT_HEIGHTS.split(',').map(Number):[320,220])){
  await page.setViewportSize({width,height:normalHeight});
  await page.evaluate(layout=>{while(topDialog())nativeBack();document.activeElement.blur();wayfinderKeyboardChanged(false);query='';const p=builtinAppearancePresets.find(p=>p.values.presentation===layout);if(p)applyAppearanceValues(p.values);setPresentation(layout);genre='Puzzles';favoritesOnly=false;if(layout==='ulm')ulmOpen('genre:Puzzles');if(layout==='cambridge')cambridgeOpen('genre:Puzzles');if(layout==='vienna')viennaOpen('genre:Puzzles');if(layout==='prague')pragueOpen('genre:Puzzles');if(layout==='seattle')seattleBrowse=true;query='Title';$('#search').value=query;update();const f=layout==='ulm'?$('#ulm-search'):$('#search');f.hidden=false;f.focus();wayfinderKeyboardChanged(true)},layout);
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  if(layout==='bellevue'&&height===220)assert.equal(await page.locator('.showcase-tab.current .showcase-tab-count').isVisible(),false,'Short blade header omits duplicate count');
  const rows=await page.evaluate(()=>[...document.querySelectorAll('#grid .game')].slice(0,8).flatMap(e=>{const r=e.getBoundingClientRect(),t=e.querySelector('.game-title'),s=t&&getComputedStyle(t);return t&&s.position==='static'&&r.height>0&&r.height<parseFloat(s.fontSize)?[{height:r.height,font:s.fontSize,text:t.textContent}]:[]}));
  if(rows.length)issues.push({layout,height,rows});
  await page.screenshot({path:path.join(output,layout+'-'+height+'.png')});
  if(['sedona','bath','milan','bellevue','paloalto','copenhagen'].includes(layout)){
   await page.evaluate(()=>{controller('down');for(let i=0;i<7;i++)controller('down')});
   const focus=await page.evaluate(()=>{const a=$('#grid .presentation-selected').getBoundingClientRect(),b=$('#grid').getBoundingClientRect();return {visible:a.top>=b.top-1&&a.bottom<=b.bottom+1,top:a.top,bottom:a.bottom,gridBottom:b.bottom}});
   if(!focus.visible)issues.push({layout,height,focus});
  }

 }
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(issues,null,2));assert.deepEqual(issues,[]);console.log('PASS all 22 populated layouts at requested IME heights; readable rows and focused-row visibility');assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});





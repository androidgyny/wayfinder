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
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);

 const layouts=await page.locator('#presentation option').evaluateAll(ns=>ns.map(n=>n.value));
 const sizes=[['dmg',551,456],['4-3',800,576],['3-2',900,576],['16-10',960,576],['21-9',980,396],['4-3-small',640,456],['16-10-small',720,426],['21-9-small',840,336]];
 const output=path.resolve('output/aspect-audit');fs.mkdirSync(output,{recursive:true});const issues=[],metrics=[];
 for(const [name,width,height] of sizes) for(const layout of layouts){
  await page.setViewportSize({width,height});
  await page.evaluate(layout=>{while(topDialog())nativeBack();document.activeElement.blur();wayfinderKeyboardChanged(false);query='';$('#search').value='';const p=builtinAppearancePresets.find(p=>p.values.presentation===layout);if(p)applyAppearanceValues(p.values);setPresentation(layout);genre='Puzzles';favoritesOnly=false;if(layout==='ulm')ulmOpen('genre:Puzzles');if(layout==='cambridge')cambridgeOpen('genre:Puzzles');if(layout==='vienna')viennaOpen('genre:Puzzles');if(layout==='prague')pragueOpen('genre:Puzzles');if(layout==='seattle')seattleBrowse=true;presentationId=games[0].id;update();window.scrollTo(0,0)},layout);
  await page.waitForTimeout(130);
  const m=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,r:r.right}},info=$('#presentation-info');return {overflow:document.documentElement.scrollWidth-innerWidth,body:rect(document.body),main:rect($('#main')),info:info&&getComputedStyle(info).display!=='none'&&getComputedStyle(info).visibility!=='hidden'?rect(info):null,offenders:[...document.querySelectorAll('.topbar button,.topbar .search')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().right>innerWidth+2).map(e=>({id:e.id,...rect(e)}))}});
  metrics.push({name,layout,...m});if(m.overflow>2||m.offenders.length)issues.push({name,layout,...m});
  await page.screenshot({path:path.join(output,name+'-'+layout+'.png')});
 }
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({issues,metrics,errors},null,2));console.log(JSON.stringify({issues:issues.map(({name,layout,overflow,offenders})=>({name,layout,overflow,offenders})),errors}));
 assert.deepEqual(issues,[]);assert.deepEqual(errors,[]);console.log('PASS all layouts at eight landscape viewport profiles');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});



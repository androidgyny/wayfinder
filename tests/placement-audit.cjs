const width=Number(process.env.AUDIT_WIDTH)||1097,normalHeight=Number(process.env.AUDIT_HEIGHT)||592,keyboardHeight=Number(process.env.AUDIT_IME_HEIGHT)||320;
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

 const layouts=await page.locator('#presentation option').evaluateAll(ns=>ns.map(n=>n.value)),issues=[],records=[];
 const output=path.resolve('output/placement-audit'+(process.env.AUDIT_PROFILE?'-'+process.env.AUDIT_PROFILE:''));fs.mkdirSync(output,{recursive:true});
 for(const layout of layouts){
  await page.setViewportSize({width,height:normalHeight});
  await page.evaluate(layout=>{document.activeElement.blur();wayfinderKeyboardChanged(false);query='';const preset=builtinAppearancePresets.find(p=>p.values.presentation===layout);if(preset)applyAppearanceValues(preset.values);setPresentation(layout);favoritesOnly=false;genre='Puzzles';if(layout==='ulm')ulmOpen('genre:Puzzles');if(layout==='cambridge')cambridgeOpen('genre:Puzzles');if(layout==='vienna')viennaOpen('genre:Puzzles');if(layout==='prague')pragueOpen('genre:Puzzles');if(layout==='seattle')seattleBrowse=true;query='Title 0001';$('#search').value=query;update()},layout);
  for(const keyboard of [false,true]){
   await page.evaluate(k=>{wayfinderKeyboardChanged(k);if(k){const f=presentation==='ulm'?$('#ulm-search'):$('#search');f.hidden=false;f.focus()}else document.activeElement.blur()},keyboard);
   await page.setViewportSize({width,height:keyboard?keyboardHeight:normalHeight});await page.waitForTimeout(120);
   const state=await page.evaluate(()=>{const panel=$('.search-empty'),r=panel?.getBoundingClientRect(),b=panel?.querySelector('button')?.getBoundingClientRect(),f=(presentation==='ulm'?$('#ulm-search'):$('#search')).getBoundingClientRect();return {panel:r&&{x:r.x,y:r.y,w:r.width,h:r.height},button:b&&{x:b.x,y:b.y,w:b.width,h:b.height},field:{x:f.x,y:f.y,w:f.width,h:f.height},horizontal:document.documentElement.scrollWidth>innerWidth+2,buttonBelow:b&&b.bottom>innerHeight+1,buttonAbove:b&&b.top<f.bottom-1}});
   records.push({layout,keyboard,...state});if(state.horizontal)issues.push({layout,keyboard,problem:'document horizontal overflow'});
   await page.screenshot({path:path.join(output,layout+(keyboard?'-keyboard':'-normal')+'.png')});
  }

  if(['bath','milan','bellevue'].includes(layout)){
   await page.evaluate(()=>{wayfinderKeyboardChanged(false);$('#search').focus()});await page.setViewportSize({width,height:normalHeight});await page.waitForTimeout(150);
   const noOverlap=await page.evaluate(()=>{const r=$('.search').getBoundingClientRect(),m=$('#main').getBoundingClientRect();return r.bottom<=m.top+1});assert.ok(noOverlap,layout+' hardware-keyboard search does not cover heading');
   await page.screenshot({path:path.join(output,layout+'-hardware-keyboard.png')});
   await page.evaluate(()=>wayfinderKeyboardChanged(true));await page.setViewportSize({width,height:keyboardHeight});await page.waitForTimeout(80);
  }
  // Keyboard remains open as the user moves into settings or edit dialogs.
  for(const dialog of ['settings','edit','apps']){
   await page.evaluate(dialog=>{while(topDialog())nativeBack();if(dialog==='settings')showDialog('#settings-dialog');else if(dialog==='edit')editGame(games[0]);else {drawerCatalog=Array.from({length:65},(_,i)=>({package:'audit.app'+i,title:'Long utility application '+i}));drawerPreferences=drawerCatalog.slice(0,8).map((a,i)=>({...a,pinned:true,order:i}));openApps()}},dialog);
   await page.waitForTimeout(80);
   const bounds=await page.evaluate(()=>{const d=topDialog();if(!d)return {missing:true};const r=d.getBoundingClientRect();return {id:d.id,x:r.x,y:r.y,w:r.width,h:r.height,overflow:d.scrollWidth-d.clientWidth,outside:r.left< -1||r.right>innerWidth+1||r.top< -1||r.bottom>innerHeight+1}});
   if(bounds.missing||bounds.outside||bounds.overflow>2)issues.push({layout,dialog,...bounds});
   if(['bath','sedona','bellevue','atlantis'].includes(layout))await page.screenshot({path:path.join(output,layout+'-'+dialog+'.png')});
   await page.evaluate(()=>{while(topDialog())nativeBack()});
  }
 }
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({issues,records},null,2));assert.deepEqual(issues,[]);console.log('PASS 44 preset/search states and 66 keyboard-open dialogs');assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});


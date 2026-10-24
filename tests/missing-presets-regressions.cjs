const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/bath-audit');fs.mkdirSync(out,{recursive:true});
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

 const expectations={ 'Cross Reference':{presentation:'prague',palette:'seaglass',typography:'spacegrotesk',titleWeight:'medium',backdrop:'flat',coverCorners:'soft',coverBorder:'none',coverShadow:'soft',coverGlow:false,interfaceContrast:'soft',artFit:'cover',sort:'az'},Raincheck:{presentation:'seattle',palette:'slateblue',typography:'outfit',titleWeight:'medium',backdrop:'flat',coverCorners:'soft',coverBorder:'none',coverShadow:'soft',coverGlow:false,interfaceContrast:'soft',artFit:'cover',sort:'az'}};
 const presets=await page.evaluate(()=>builtinAppearancePresets.map(p=>p.name));
 for(const [name,expected] of Object.entries(expectations)){
  for(const from of presets){
   const actual=await page.evaluate(({name,from,keys})=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name===from).values);sort='recent';applyAppearanceValues(builtinAppearancePresets.find(p=>p.name===name).values);const snapshot={...appearanceSnapshot(),sort};return Object.fromEntries(keys.map(k=>[k,snapshot[k]]))},{name,from,keys:Object.keys(expected)});assert.deepEqual(actual,expected,'Preset applies completely from '+from);
  }
  await page.evaluate(()=>{showDialog('#settings-dialog');selectSettingsSection('appearance')});assert.equal(await page.locator('#settings-current-look').textContent(),'Current look · '+name);
  await page.evaluate(()=>hideDialog('#settings-dialog'));
  for(const [width,height] of [[1097,592],[960,400],[390,700]]){await page.setViewportSize({width,height});await page.waitForTimeout(80);assert.ok(await page.locator('#grid .game').count()>0);assert.equal(await page.locator('#bath-tabs').isVisible(),false);await page.screenshot({path:path.join(out,name.replaceAll(' ','-')+'-'+width+'.png')});}
  await page.setViewportSize({width:1097,height:592});await page.evaluate(()=>persist());await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),expected.presentation);assert.equal(await page.evaluate(()=>sort),'az');
  await page.evaluate(()=>{sort='recent';$('#sort').value=sort;update();showDialog('#settings-dialog');$('#appearance-presets').value='Raincheck';auditionAppearancePreset();finishAppearanceAudition(false)});assert.equal(await page.evaluate(()=>sort),'recent','Cancel restores previous sorting');assert.equal(await page.evaluate(()=>presentation),expected.presentation);await page.evaluate(()=>hideDialog('#settings-dialog'));
 }
 const missing=await page.evaluate(()=>[...$('#presentation').options].filter(o=>!builtinAppearancePresets.some(p=>p.values.presentation===o.value)).map(o=>o.textContent));assert.deepEqual(missing,[],'Every layout has a preset');
 assert.equal(await page.evaluate(()=>games.length),1200);assert.deepEqual(errors,[]);console.log('PASS Cross Reference and Raincheck: settings from every preset, A-Z sorting, current-look label, preview cancellation, reload, three sizes, full layout coverage.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

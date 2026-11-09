/* Run with Node and Playwright installed; BROWSER_CHANNEL defaults to msedge.
   Uses a synthetic library and images. No device or personal files are required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
const fixture={id:'audit',title:'Audit & Cover',genre:'Puzzles',kind:'app',package:'test.audit',image:'audit-image.svg',favorite:true,lastPlayed:123};
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#357a62"/></svg>';
(async()=>{
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.includes('audit-image')||pathname.startsWith('/icon/')||pathname.startsWith('/art-icon/')){res.setHeader('Content-Type','image/svg+xml');res.end(svg);return;}
 if(pathname==='/games.js'){res.setHeader('Content-Type','application/javascript');res.end('window.GAMES='+JSON.stringify([fixture]));return;}
 const file=path.join(root,pathname==='/'?'index.html':pathname);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1097,height:700}}),errors=[],passed=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.addInitScript(fixture=>{window.auditDb=[fixture];window.calls={search:[],download:[],save:[],browser:[],files:[]};window.Portal={view:()=>'{}',saveView:()=>{},library:()=>JSON.stringify(auditDb),sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]',showKeyboard:()=>{},artworkSearch:(...a)=>calls.search.push(a),artworkDownload:(...a)=>calls.download.push(a),artworkSave:(...a)=>calls.save.push(a),openArtworkBrowser:(...a)=>calls.browser.push(a),chooseCover:(...a)=>calls.files.push(a)};},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof editGame==='function');


 await page.waitForTimeout(250);
 await page.evaluate(()=>{games=Array.from({length:20},(_,i)=>({...games[0],id:String(i),title:'Beautiful game '+i}));rebuildGenres();applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Smitchish').values);});
 for(const preset of ['Smitchish','Smitchish Dark'])for(const [width,height] of [[1097,592],[800,600],[960,600],[1260,540],[640,360]]){
 await page.setViewportSize({width,height});await page.evaluate(name=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name===name).values);document.body.dataset.input='controller';controllerFocus($('#category-current'),true)},preset);await page.waitForTimeout(200);
 const bounds=await page.evaluate(()=>{const b=$('#category-current'),r=b.getBoundingClientRect(),s=getComputedStyle(b),out=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset),strip=$('#category-strip').getBoundingClientRect(),c=$('#grid .presentation-selected .cover'),cr=c.getBoundingClientRect(),cs=getComputedStyle(c),co=Math.max(0,parseFloat(cs.outlineWidth)+parseFloat(cs.outlineOffset));return {top:r.top-out,bottom:r.bottom+out,stripTop:strip.top,stripBottom:strip.bottom,coverTop:cr.top-co}});
 assert.ok(bounds.top>=bounds.stripTop&&bounds.bottom<=bounds.stripBottom,JSON.stringify({preset,width,height,bounds}));assert.ok(bounds.coverTop-bounds.bottom>=8,JSON.stringify({preset,width,height,bounds}));
 }
 assert.deepEqual(errors,[]);console.log('Kyoto category focus: complete rings and cover clearance passed in both presets across five sizes.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});

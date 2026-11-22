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


 const names=await page.evaluate(()=>builtinAppearancePresets.map(p=>p.name));const results=[];
 for(const name of names){await page.evaluate(name=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name===name).values);showDialog('#settings-dialog');updateAppearancePreview()},name);await page.waitForTimeout(30);
 results.push(await page.evaluate(name=>{const label=$('#appearance-preview>p'),preview=$('#appearance-preview'),l=getComputedStyle(label),p=getComputedStyle(preview);return {name,layout:presentation,color:l.color,labelBg:l.backgroundColor,bg:p.backgroundColor,image:p.backgroundImage,text:getComputedStyle(document.body).getPropertyValue('--text').trim()}},name));await page.evaluate(()=>hideDialog('#settings-dialog'));}
 fs.writeFileSync(path.resolve(__dirname,'../output/preview-contrast.json'),JSON.stringify(results,null,2));
 const rgb=s=>s.match(/[\d.]+/g).map(Number),lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 for(const r of results){const backgrounds=[r.labelBg,...(r.labelBg.startsWith('rgba')?[r.bg,...(r.image.match(/rgba?\([^)]+\)/g)||[])]:[])].map(rgb).filter(c=>c.length===3||c[3]===1);assert.ok(backgrounds.length,r.name+' has a measurable background');for(const bg of backgrounds){const a=lum(rgb(r.color)),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=4.5,r.name+' contrast '+ratio.toFixed(2));}}
 console.log('PASS preview labels meet 4.5:1 against solid surfaces and opaque gradient stops in '+results.length+' presets');assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

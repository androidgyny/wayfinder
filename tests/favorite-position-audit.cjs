const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/hongkong-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:60},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<60,lastPlayed:Date.now()-i*1000}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
 if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}
 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);


 const findings=[];
 const modes=await page.evaluate(()=>[...$('#presentation').options].map(o=>o.value).concat('hongkong-grid','hongkong-carousel','tacoma-recent','tacoma-titles'));
 for(const mode of modes){
  await page.reload();await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
  await page.evaluate(variant=>{
   const mode=variant.split('-')[0];document.activeElement?.blur();query='';genre='';favoritesOnly=false;sort='az';
   const preset=builtinAppearancePresets.find(p=>p.values.presentation===mode);if(preset)applyAppearanceValues(preset.values);setPresentation(mode);sort='az';
   if(variant.startsWith('hongkong-'))setHongKongOptions(variant.slice(9),'dark');
   if(variant==='tacoma-recent')tacomaPageTo(1);
   if(variant==='tacoma-titles'){tacomaPageTo(2);tacomaOpenCategory('');}
   if(mode==='ithaca')ithacaOpen('all');if(mode==='cambridge')cambridgeOpen('all','games');
   if(mode==='prague')pragueOpen('genre:Puzzles',true);if(mode==='vienna')viennaOpen('genre:Puzzles',true);
   if(mode==='ulm')ulmOpen('all');if(mode==='seattle')seattleBrowse=true;update();document.body.dataset.input='controller';
   const horizontal=['kyoto','cupertino','venice','vienna','seattle'].includes(mode)||(mode==='tacoma'&&tacomaPage<2)||(mode==='hongkong'&&hongkongView==='carousel');
   for(let i=0;i<20;i++)controller(horizontal?'right':'down');
   for(let i=0;i<2;i++)controller(horizontal?'left':'up');
  },mode);
  await page.waitForTimeout(300);
  const inspect=()=>page.evaluate(()=>{
   const row=document.activeElement?.closest('#grid .game')||$('#grid .presentation-selected')||$('#grid .controller-selected');
   if(!row)return null;const r=row.getBoundingClientRect();return {id:row.dataset.id,x:r.x,y:r.y,order:filtered.map(g=>g.id)};
  });
  for(let toggle=0;toggle<2;toggle++){
   const before=await inspect();if(!before){findings.push({mode,error:'No selected game'});break;}
   await page.evaluate(id=>toggleFavorite(id),before.id);await page.waitForTimeout(300);
   const after=await inspect();
   const sameOrder=after&&JSON.stringify(before.order)===JSON.stringify(after.order);
   if(sameOrder&&(!after||after.id!==before.id||Math.abs(after.x-before.x)>1||Math.abs(after.y-before.y)>1))findings.push({mode,toggle,before,after});
   if(after?.order.includes(before.id)&&after.id!==before.id)findings.push({mode,error:'Selection changed despite game remaining',before,after});
  }
  console.log('checked',mode);
 }
 console.log(JSON.stringify(findings,null,2));assert.deepEqual(findings,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

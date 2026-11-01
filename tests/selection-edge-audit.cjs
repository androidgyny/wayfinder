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
 const modes=await page.evaluate(()=>[...$('#presentation').options].map(o=>o.value).concat('hongkong-grid','hongkong-carousel','tacoma-recent'));
 for(const [width,height] of [[1097,592],[800,600],[960,600],[900,600],[1260,540]]){
 await page.setViewportSize({width,height});
 for(const mode of modes){
 await page.evaluate(variant=>{const mode=variant.split('-')[0];document.activeElement?.blur();query='';genre='';favoritesOnly=false;const p=builtinAppearancePresets.find(p=>p.values.presentation===mode);if(p)applyAppearanceValues(p.values);setPresentation(mode);if(variant.startsWith('hongkong-'))setHongKongOptions(variant.slice(9),'dark');if(variant==='tacoma-recent')tacomaPageTo(1);if(mode==='ithaca')ithacaOpen('all');if(mode==='cambridge')cambridgeOpen('all','games');if(mode==='prague')pragueOpen('genre:Puzzles',true);if(mode==='vienna')viennaOpen('genre:Puzzles',true);if(mode==='ulm')ulmOpen('all');if(mode==='seattle')seattleBrowse=true;update();document.body.dataset.input='controller';},mode);
 for(const phase of ['forward','back']){
 await page.evaluate(phase=>{for(let i=0;i<80;i++)controller(['tacoma','kyoto','cupertino','venice','vienna','seattle'].includes(presentation)?(phase==='forward'?'right':'left'):(phase==='forward'?'down':'up'));},phase);
 await page.waitForTimeout(350);
 const clipped=await page.evaluate(()=>{const rows=[...document.querySelectorAll('#grid .presentation-selected,#grid .controller-selected,#grid .game:focus')];return rows.flatMap(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect(),extent=s.outlineStyle==='none'?0:Math.max(0,parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset));if(!extent||!r.width)return [];let a=n.parentElement;const problems=[];while(a&&a!==document.body){const c=getComputedStyle(a),b=a.getBoundingClientRect();if(['auto','scroll','hidden','clip'].includes(c.overflowX)&&(r.left-extent<b.left-.6||r.right+extent>b.right+.6))problems.push({axis:'x',ancestor:a.id||a.className,delta:[r.left-extent-b.left,r.right+extent-b.right]});if(['auto','scroll','hidden','clip'].includes(c.overflowY)&&(r.top-extent<b.top-.6||r.bottom+extent>b.bottom+.6))problems.push({axis:'y',ancestor:a.id||a.className,delta:[r.top-extent-b.top,r.bottom+extent-b.bottom]});a=a.parentElement;}return problems;});});
 if(clipped.length)findings.push({width,height,mode,phase,clipped});
 }
 }
 }
 console.log(JSON.stringify(findings,null,2));assert.deepEqual(findings,[],'Selected outer outlines must remain inside clipping ancestors');assert.deepEqual(errors,[]);console.log('PASS selection boundaries in all 25 layouts plus carousel, grid, and recent shelf');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});


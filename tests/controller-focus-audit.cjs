const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');

const {chromium}=require('playwright');

const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/hongkong-audit');fs.mkdirSync(out,{recursive:true});

const fixture=Array.from({length:60},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<60,lastPlayed:Date.now()-i*1000}));

(async()=>{

 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;

 if(url==='/audit.svg'||url.startsWith('/icon/')||url.startsWith('/art-icon/')){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}

 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}

 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});

 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];

 try{const page=await browser.newPage({viewport:{width:Number(process.env.AUDIT_WIDTH)||1097,height:Number(process.env.AUDIT_HEIGHT)||592}});page.on('pageerror',e=>errors.push(e.message));

 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',installed:()=>{},launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);

 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);







 const modes=await page.evaluate(()=>[...$('#presentation').options].map(o=>o.value));const findings=[];
 for(const mode of modes){
  await page.reload();await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
  await page.evaluate(mode=>{setPresentation(mode);genre='';query='';update();focusStartupGame();controller('controls')},mode);
  const count=await page.evaluate(()=>controllerControlList().length);
  for(let i=0;i<count;i++){
   const state=await page.evaluate(()=>{
    const e=document.activeElement,r=e.getBoundingClientRect(),s=getComputedStyle(e);let clip={left:0,top:0,right:innerWidth,bottom:innerHeight};
    for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const c=getComputedStyle(p),b=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(c.overflowX)){clip.left=Math.max(clip.left,b.left);clip.right=Math.min(clip.right,b.right)}if(/auto|scroll|hidden|clip/.test(c.overflowY)){clip.top=Math.max(clip.top,b.top);clip.bottom=Math.min(clip.bottom,b.bottom)}}
    const edge=Math.max(0,parseFloat(s.outlineOffset)+parseFloat(s.outlineWidth));
    const cut=r.left-edge<clip.left-1||r.right+edge>clip.right+1||r.top-edge<clip.top-1||r.bottom+edge>clip.bottom+1;
    return {id:e.id||e.className,label:e.textContent.slice(0,35),cut,outline:s.outlineStyle,shaped:e.matches('.rochester-tab')&&getComputedStyle(e,'::before').backgroundImage.includes('lighttable-tab-focus.svg'),rect:r.toJSON(),clip};
   });
   if(state.cut||(state.outline==='none'&&!state.shaped))findings.push({mode,...state});
   await page.evaluate(()=>controller('down'));
  }
 }
 fs.writeFileSync('output/controller-focus-audit-'+(process.env.AUDIT_WIDTH||1097)+'.json',JSON.stringify(findings,null,2));console.log(JSON.stringify(findings.map(x=>({mode:x.mode,id:x.id,label:x.label,cut:x.cut})),null,2));
 assert.deepEqual(errors,[]);assert.equal(findings.length,0,'focused controls stay visible');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

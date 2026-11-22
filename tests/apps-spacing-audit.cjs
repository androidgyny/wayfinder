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
 if(pathname.includes('audit-image')||pathname.startsWith('/icon/')||pathname.startsWith('/app-icon/')||pathname.startsWith('/art-icon/')){res.setHeader('Content-Type','image/svg+xml');res.end(svg);return;}
 if(pathname==='/games.js'){res.setHeader('Content-Type','application/javascript');res.end('window.GAMES='+JSON.stringify([fixture]));return;}
 const file=path.join(root,pathname==='/'?'index.html':pathname);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1097,height:700}}),errors=[],passed=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.addInitScript(fixture=>{window.auditDb=[fixture];window.calls={search:[],download:[],save:[],browser:[],files:[]};window.Portal={view:()=>'{}',saveView:()=>{},library:()=>JSON.stringify(auditDb),sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]',showKeyboard:()=>{},artworkSearch:(...a)=>calls.search.push(a),artworkDownload:(...a)=>calls.download.push(a),artworkSave:(...a)=>calls.save.push(a),openArtworkBrowser:(...a)=>calls.browser.push(a),chooseCover:(...a)=>calls.files.push(a)};},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof editGame==='function');



 await page.evaluate(()=>{drawerCatalog=Array.from({length:80},(_,i)=>({package:'test.app'+i,title:'A long application title '+i}));drawerPreferences=drawerCatalog.slice(0,8).map((a,i)=>({package:a.package,pinned:true,order:i}));native.appsPreferences=()=>JSON.stringify(drawerPreferences);openApps()});

 const sizes=[{width:1097,height:592},{width:640,height:360},{width:800,height:600},{width:960,height:600},{width:900,height:600},{width:1280,height:549},{width:960,height:540},{width:720,height:480},{width:600,height:800},{width:1024,height:438}];
 const checkFocus=async(selector,index=0)=>{
 await page.evaluate(({selector,index})=>controllerFocus([...document.querySelectorAll(selector)].at(index)),{selector,index});
 const result=await page.evaluate(()=>{const b=document.activeElement,r=b.getBoundingClientRect(),s=getComputedStyle(b),ring=parseFloat(s.outlineWidth)+Math.max(0,parseFloat(s.outlineOffset)),ancestors=[];for(let p=b.parentElement;p;p=p.parentElement){const c=getComputedStyle(p);if(/auto|scroll|hidden/.test(c.overflowY)&&p.clientHeight){const g=p.getBoundingClientRect();ancestors.push({tag:p.id||p.className,top:r.top-ring>=g.top+p.clientTop-1,bottom:r.bottom+ring<=g.top+p.clientTop+p.clientHeight+1})}}return {ancestors,screen:r.top-ring>=0&&r.bottom+ring<=innerHeight}});
 assert.ok(result.screen&&result.ancestors.every(a=>a.top&&a.bottom),JSON.stringify({selector,index,result}));
 };
 for(const size of sizes){
 await page.setViewportSize(size);
 await page.evaluate(()=>{customAppSections=Array.from({length:20},(_,i)=>({id:'custom_a'+i,name:'Emulation and a long custom category '+i,note:'Imitation is the sincerest form of flattery',icon:'puzzle-piece'}));appSections=[...builtInAppSections,...customAppSections];drawerView='home';drawerSection='';renderDrawer()});
 for(const selector of ['#manage-app-sections','#android-settings']){await checkFocus(selector);assert.ok(await page.evaluate(()=>{const r=document.activeElement.getBoundingClientRect();return r.bottom+7<=$('#drawer-search').getBoundingClientRect().top}),'header focus clears search field');}
 for(const index of [0,12,-1])await checkFocus('#app-sections button',index);
 for(const index of [0,-1])await checkFocus('#app-dock .drawer-app',index);
 assert.ok(await page.evaluate(()=>$('#app-dock').getBoundingClientRect().bottom<=$('.apps-controller-hints').getBoundingClientRect().top+1),'dock and hints do not overlap');
 for(const section of ['tools','custom_a19']){
 await page.evaluate(section=>{drawerSection=section;renderDrawer()},section);
 await checkFocus('#app-sections button',-1);
 if(section==='tools')for(const index of [0,8,40,-1,0]){await checkFocus('#drawer-grid .drawer-app',index);await checkFocus('#drawer-grid .drawer-edit',index);}
 assert.ok(await page.evaluate(()=>$('#drawer-grid').getBoundingClientRect().bottom<=$('#app-dock').getBoundingClientRect().top+1),'open category stays above dock');
 }
 for(const view of ['all','other','pinned','recent']){
 await page.evaluate(view=>{drawerView=view;drawerSection='';renderDrawer()},view);
 if(await page.locator('#drawer-grid .drawer-app').count())for(const index of [0,-1])await checkFocus('#drawer-grid .drawer-app',index);
 }
 await page.evaluate(()=>{drawerView='home';$('#drawer-search').value='No matching app';renderDrawer()});
 assert.ok(await page.locator('#drawer-status').isVisible());
 await page.evaluate(()=>{$('#drawer-search').value='';renderDrawer();$('#manage-app-sections').click()});
 await checkFocus('#app-section-manager-list button',-1);
 await page.evaluate(()=>$('#add-app-section').click());
 await checkFocus('#app-section-icon-picker button',-1);await checkFocus('#app-section-color-picker button',-1);
 await page.evaluate(()=>{hideDialog('#app-section-editor');hideDialog('#app-section-manager')});
 console.log('PASS Apps spacing: '+size.width+'x'+size.height);
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});

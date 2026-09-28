const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
(async()=>{
 const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://localhost').pathname;try{if(url==='/games.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.GAMES=[]');}if(/^\/(icon|app-icon)\//.test(url)){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="green"/></svg>');}const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',url.endsWith('.js')?'text/javascript':url.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:1097,height:592}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.Portal={view:()=>localStorage.view||'{}',saveView:s=>localStorage.view=s,library:()=>'[]',appsPreferences:()=>localStorage.apps||'[]',sound:()=>{},setThemeColor:()=>{},chooseCover:()=>{},saveApp:s=>{const value=JSON.parse(s),apps=JSON.parse(localStorage.apps||'[]').filter(a=>a.package!==value.package);apps.push(value);localStorage.apps=JSON.stringify(apps);return '{"ok":true}';}};});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof openApps==='function'&&!restoring);
 assert.equal(await page.evaluate(()=>games.length),0);
 await page.evaluate(()=>{showDialog('#help-dialog')});assert.equal(await page.locator('#help-dialog').isVisible(),true);await page.evaluate(()=>hideDialog('#help-dialog'));
 await page.evaluate(()=>{appsEvent('drawerInstalled',{apps:[{package:'test.reddit',title:'Reddit'},{package:'test.news',title:'News reader'},{package:'test.music',title:'Music player'},{package:'test.settings',title:'Settings'},{package:'test.tools',title:'Calculator'}]});openApps()});
 assert.deepEqual(await page.locator('.section-count').allTextContents(),['1','1','1','1','1']);
 await page.evaluate(()=>{editDrawerApp('test.tools');$('#appearance-choose').click()});assert.equal(await page.evaluate(()=>$('#artwork-dialog').open),true,'fresh install without packs opens image chooser');
 await page.evaluate(()=>{hideDialog('#artwork-dialog');hideDialog('#app-appearance');hideDialog('#apps-drawer');drawerCatalog=Array.from({length:8},(_,i)=>({package:'test.pin'+i,title:'Pin '+i}));drawerPreferences=drawerCatalog.map((a,i)=>({...a,pinned:true,order:i,section:'social'}));localStorage.apps=JSON.stringify(drawerPreferences);appIconPack='absent.pack';lastIconPack='absent.pack';setPalette('midnight');persist()});
 await page.reload();await page.waitForFunction(()=>typeof openApps==='function'&&!restoring);
 assert.deepEqual(await page.evaluate(()=>[palette,appIconPack,lastIconPack,drawerPreferences.length]),['midnight','absent.pack','absent.pack',8]);
 assert.ok(await page.locator('#app-icon-pack').textContent().then(s=>s.includes('Unavailable pack')));
 await page.evaluate(()=>{drawerCatalog=drawerPreferences.map(p=>({package:p.package,title:p.title}));openApps()});assert.equal(await page.locator('#app-dock .drawer-app').count(),8);
 await page.evaluate(()=>{editDrawerApp('test.pin0');drawerCatalog=drawerCatalog.filter(a=>a.package!=='test.pin0');$('#app-appearance-form').requestSubmit()});
 assert.ok((await page.locator('#appearance-error').textContent()).includes('no longer available'));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.apps).length),8,'failed save preserves stored preferences');
 assert.deepEqual(errors,[]);console.log('PASS: empty first use, Help, automatic app sections, no-pack chooser, settings/pins after reload, missing pack label, removed-app save safety');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

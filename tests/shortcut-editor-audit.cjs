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



 const shortcut={id:'pin_test',title:'Imported game',genre:'Puzzles',kind:'shortcut',package:'test.emulator',shortcutId:'game:one',image:'audit.svg',lastPlayed:0};
 await page.evaluate(()=>{Portal.cancelShortcut=id=>window.cancelledShortcut=id;Portal.save=raw=>{const g=JSON.parse(raw),i=auditGames.findIndex(x=>x.id===g.id);if(i<0)auditGames.push(g);else auditGames[i]=g;return '{"ok":true}'};genre='Puzzles';favoritesOnly=false;query='';update()});
 await page.evaluate(g=>nativeEvent('newShortcut',{game:g}),shortcut);
 assert.equal(await page.locator('#editor-heading').textContent(),'Add game');
 await page.locator('#edit-image').evaluate(i=>i.decode());
 assert.equal(await page.locator('#edit-title').inputValue(),'Imported game');
 await page.locator('#cancel-editor').click();
 assert.equal(await page.evaluate(()=>cancelledShortcut),'pin_test');
 assert.equal(await page.evaluate(()=>games.some(g=>g.id==='pin_test')),false);
 await page.evaluate(g=>nativeEvent('newShortcut',{game:g}),shortcut);
 await page.locator('#edit-title').fill('My imported game');
 await page.locator('#edit-form').evaluate(f=>f.requestSubmit());
 await page.waitForFunction(()=>games.some(g=>g.id==='pin_test'));
 assert.ok(await page.evaluate(()=>filtered.some(g=>g.id==='pin_test')),'open category refreshes immediately');
 assert.equal(await page.evaluate(()=>games.find(g=>g.id==='pin_test').shortcutId),'game:one');
 await page.evaluate(()=>nativeEvent('newShortcut',{game:games.find(g=>g.id==='pin_test')}));
 assert.equal(await page.locator('#editor-heading').textContent(),'Edit game');
 await page.locator('#edit-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.evaluate(()=>games.filter(g=>g.id==='pin_test').length),1);
 await page.evaluate(()=>{Portal.save=()=>'{"ok":false,"message":"Shortcut request expired"}';nativeEvent('newShortcut',{game:{...games.find(g=>g.id==='pin_test'),id:'pin_expired'}})});
 await page.locator('#edit-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.locator('#edit-error').textContent(),'Shortcut request expired');
 assert.ok(await page.locator('#editor').evaluate(d=>d.open));
 assert.deepEqual(errors,[]);console.log('Shortcut editor: supplied image/title, cancel, save, category refresh, duplicate and expired-request checks passed.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});

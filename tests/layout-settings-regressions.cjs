/* Audit actual visibility and controller reachability, using synthetic data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
const modes=['library','berlin','cambridge','copenhagen','cupertino','kyoto','oxford','prague','seattle','ulm','venice','vienna'];
const fixture=Array.from({length:8},(_,i)=>({id:'audit'+i,title:'Synthetic '+i,genre:'Puzzles',kind:'app',package:'test.audit',image:'audit.svg',favorite:i<2,lastPlayed:i+1}));
(async()=>{
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost').pathname;
  if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="green"/></svg>');}
  if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture));}
  try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),records=[],errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(games=>{window.Portal={view:()=>'{}',saveView:()=>{},library:()=>JSON.stringify(games),appsPreferences:()=>'[]',sound:()=>{},setThemeColor:()=>{}}},fixture);
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof setPresentation==='function'&&!restoring);
  assert.deepEqual(await page.locator('#presentation option').evaluateAll(nodes=>nodes.map(n=>n.value).sort()),[...modes].sort(),'audit covers every offered layout');
  for(const width of [640,1097]){
   await page.setViewportSize({width,height:592});
   for(const mode of modes){
    for(const artwork of ['ulm','cambridge'].includes(mode)?[true,false]:[true]){
     for(const recent of ['ulm','cambridge'].includes(mode)?[false,true]:[false]){
      const result=await page.evaluate(({mode,artwork,recent})=>{
       while(topDialog())nativeBack();setPresentation(mode);setUlmArtwork(artwork,false);setCambridgeArtwork(artwork,false);
       if(mode==='ulm'){ulmLevel='games';ulmSection=recent?'recent':'all';}
       if(mode==='cambridge')cambridgeSection=recent?'recent':'all';
       showDialog('#settings-dialog');refreshCupertinoControls();refreshApplicableAppearanceControls();
       const ids=['cambridge-options','ulm-options','vienna-options','title-placement-options','berlin-options','cupertino-options','presentation-sort','art-fit','cover-border','cover-corners','cover-glow','cover-shadow','typography','cover-brightness','menu-buttons','selection-style','appearance-preview'];
       const controls=dialogControls($('#settings-dialog')).map(e=>e.id);
       const rows=Object.fromEntries(ids.map(id=>{const node=$('#'+id),row=node.closest('.settings-row')||node;return [id,!row.closest('[hidden]')&&getComputedStyle(row).display!=='none'];}));
       return {rows,controls,overflow:$('#settings-dialog').scrollWidth-$('#settings-dialog').clientWidth,brightness:$('#cover-brightness').closest('.settings-row').querySelector('h3').textContent};
      },{mode,artwork,recent});
      const text=['ulm','cambridge'].includes(mode),art=!text||artwork;
      const expected={
       'cambridge-options':mode==='cambridge','ulm-options':mode==='ulm','vienna-options':mode==='vienna',
       'title-placement-options':['kyoto','cupertino'].includes(mode),'berlin-options':mode==='berlin','cupertino-options':mode==='cupertino',
       'presentation-sort':!['oxford','copenhagen'].includes(mode)&&!(text&&recent),
       'art-fit':art,'cover-border':art,'cover-corners':art,'cover-glow':art,'appearance-preview':art,
       'cover-shadow':art&&!['kyoto','cupertino','venice'].includes(mode),'typography':mode!=='cambridge',
       'cover-brightness':!text,'menu-buttons':!['ulm','cambridge','venice'].includes(mode),'selection-style':!text
      };
      assert.deepEqual(result.rows,expected,JSON.stringify({mode,artwork,recent,width}));
      for(const [id,visible] of Object.entries(expected))if(!visible)assert.ok(!result.controls.includes(id),'hidden control reachable: '+mode+' '+id);
      assert.ok(result.overflow<=1,mode+' settings overflow');
      assert.equal(result.brightness,mode==='oxford'?'Unselected titles':'Unselected covers');
      records.push({mode,artwork,recent,width,visible:Object.keys(expected).filter(id=>expected[id])});
     }
    }
   }
  }
  assert.deepEqual(errors,[]);
  if(process.env.SETTINGS_AUDIT_REPORT)fs.writeFileSync(process.env.SETTINGS_AUDIT_REPORT,JSON.stringify(records,null,2));
  console.log('PASS '+records.length+' settings states across all 12 layouts: visible controls, artwork off, Recent sorting, controller reachability, and dialog width');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

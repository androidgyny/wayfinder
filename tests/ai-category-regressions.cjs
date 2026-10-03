/* Synthetic bridge tests. No credentials, network AI calls, or user library. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"><rect width="120" height="160" fill="#315b53"/><text x="60" y="85" fill="white" font-size="20" text-anchor="middle">Game</text></svg>';
(async()=>{
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/games.js'){res.setHeader('Content-Type','application/javascript');res.end('window.GAMES=[]');return;}
 if(pathname.startsWith('/icon/')){res.setHeader('Content-Type','image/svg+xml');res.end(svg);return;}
 try{const file=path.join(root,pathname==='/'?'index.html':pathname);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1097,height:592}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.addInitScript(()=>{
 window.auditDb=Array.from({length:1200},(_,i)=>({id:'g'+i,title:'Game '+String(i).padStart(4,'0'),genre:i%2?'Action':'Puzzle',package:'audit.game'+i,kind:'app',image:'icon/audit.game'+i,favorite:false,lastPlayed:0}));window.auditOrder=['Puzzle','Action'];window.auditSource=null;window.auditRequest='';window.auditSuggestion=null;window.auditCanceled=[];window.auditHasKey=true;
 const ok=()=>'{"ok":true}';
 window.Portal={view:()=>'{}',saveView:()=>{},sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]',library:()=>JSON.stringify(auditDb),categoryOrder:()=>JSON.stringify(auditOrder),geminiHasKey:()=>auditHasKey,geminiSaveKey:key=>{auditHasKey=!!key;return ok();},geminiOpenKeys:()=>{},aiOrganize:request=>{auditRequest=request;auditSource=structuredClone(auditDb);},aiCancel:request=>auditCanceled.push(request),aiSuggest:(request,raw)=>{auditSuggestion={request,...JSON.parse(raw)};},aiApply:raw=>{
 const proposal=JSON.parse(raw);for(const a of proposal.assignments)auditDb.find(g=>g.id===a.id).genre=a.category;auditOrder=proposal.order;return ok();
 },changeCategories:raw=>{const {moves,order}=JSON.parse(raw);if(moves.some(m=>!auditDb.some(g=>g.id===m.id&&g.genre===m.from)))return '{"ok":false,"message":"Conflict"}';for(const m of moves)auditDb.find(g=>g.id===m.id).genre=m.to;auditOrder=order;return ok();}};
 window.auditDeliver=(categories=['Action','Puzzle'],mutate)=>{const proposal={request:auditRequest,source:auditSource,categories,assignments:auditSource.map((g,i)=>({id:g.id,category:categories[i%categories.length]}))};if(mutate)mutate(proposal);nativeEvent('aiProposal',proposal);};
 });
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof aiStart==='function'&&!restoring);await page.evaluate(()=>reloadLibrary());
 const original=await page.evaluate(()=>JSON.stringify(auditDb)),order=await page.evaluate(()=>JSON.stringify(auditOrder));
 assert.match(await page.locator('#gemini-settings').textContent(),/Google AI Studio/);assert.match(await page.locator('#gemini-settings').textContent(),/Gemini API key/);assert.equal(await page.locator('#groq-settings').count(),0);
 assert.match(await page.locator('#ai-sort').textContent(),/existing categories/);assert.match(await page.locator('.ai-actions').textContent(),/Keep your current categories/);assert.match(await page.locator('.ai-actions').textContent(),/new category scheme/);
 await page.evaluate(()=>{showDialog('#settings-dialog');$('#manage-categories').click();aiStart('sort');nativeEvent('aiProgress',{request:aiRequest,message:'Assigning 1,200 games · waiting for Gemini’s response…'});});
 assert.equal(await page.locator('#ai-activity').isVisible(),true);assert.equal(await page.locator('#ai-stages [aria-current="step"]').textContent(),'2 · Check category fit');assert.match(await page.locator('#ai-status').textContent(),/waiting for Gemini/);
 if(process.env.AI_PROGRESS_SCREENSHOT)await page.screenshot({path:process.env.AI_PROGRESS_SCREENSHOT});
 await page.evaluate(()=>auditDeliver());assert.equal(await page.locator('#ai-activity').isVisible(),false);
 assert.equal(await page.locator('#ai-summary').textContent(),'1,200 analyzed · 1,200 moved · 0 unchanged');assert.equal(await page.locator('#ai-grid .ai-game').count(),48);assert.equal(await page.locator('#ai-moved').isChecked(),true);
 await page.evaluate(()=>{controllerFocus($('#ai-grid .ai-game'));controller('activate');});await page.selectOption('#ai-move-to','Puzzle');await page.click('#ai-move-save');assert.match(await page.locator('#ai-summary').textContent(),/1,199 moved · 1 unchanged/);
 assert.equal(await page.evaluate(()=>!!document.activeElement?.matches('#ai-grid .ai-game')),true,'correcting a game retains controller focus in the preview');
 await page.evaluate(()=>{aiApply();});assert.equal(await page.evaluate(()=>categoryUndo.length),1);await page.evaluate(()=>undoCategoryChange());assert.equal(await page.evaluate(()=>JSON.stringify(auditDb)),original);assert.equal(await page.evaluate(()=>JSON.stringify(auditOrder)),order);
 console.log('PASS 1,200-game paged preview, moved default, direct correction, single-step Apply/Undo');
 await page.evaluate(()=>{aiStart('reorganize',3);auditDeliver(['Arcade','Thinking','Adventure']);});
 await page.fill('#ai-rename',' thinking ');await page.click('#ai-rename-save');assert.match(await page.locator('#ai-status').textContent(),/distinct/);
 await page.fill('#ai-rename','Fast action');await page.click('#ai-rename-save');assert.equal(await page.evaluate(()=>aiProposal.assignments[0].category),'Fast action');
 for(const size of [[760,426],[1097,592],[1600,900]]){
 await page.setViewportSize({width:size[0],height:size[1]});await page.evaluate(()=>{for(const button of document.querySelectorAll('#ai-review button:not([hidden]):not(:disabled)')){button.scrollIntoView({block:'nearest'});const b=button.getBoundingClientRect(),r=$('#ai-review').getBoundingClientRect();if(b.left<r.left-1||b.right>r.right+1)throw Error('Control outside dialog: '+button.id);}});
 }
 for(const width of [640,1097]){
  await page.setViewportSize({width,height:592});
  const report=await page.evaluate(()=>{const root=$('#ai-review'),select=$('#ai-category'),change=select.onchange,value=select.value;select.onchange=null;const all=dialogControls(root),queue=[all[0]],seen=new Set(queue);while(queue.length){const from=queue.shift();for(const action of ['up','down','left','right']){controllerFocus(from,true);controller(action);const next=document.activeElement;if(root.contains(next)&&!seen.has(next)){seen.add(next);queue.push(next);}}}select.onchange=change;select.value=value;return {missing:all.filter(n=>!seen.has(n)).map(n=>n.id||n.textContent),overflow:root.scrollWidth-root.clientWidth};});
  assert.deepEqual(report,{missing:[],overflow:0},'AI preview controller reachability at '+width);
 }
 await page.setViewportSize({width:1097,height:592});await page.evaluate(()=>{$('#ai-review').scrollTop=0;});
 if(process.env.AI_SCREENSHOT)await page.screenshot({path:process.env.AI_SCREENSHOT});
 await page.evaluate(()=>aiApply());assert.equal(await page.evaluate(()=>categoryUndo.length),0);assert.match(await page.locator('#ai-confirm-text').textContent(),/Replace your current game categories/);await page.click('#ai-confirm');assert.equal(await page.evaluate(()=>categoryUndo.length),1);
 await page.evaluate(()=>{categoryApply([{id:'g0',from:'Fast action',to:'Adventure'}],categoryOrder,'move');undoCategoryChange();undoCategoryChange();});assert.equal(await page.evaluate(()=>JSON.stringify(auditDb)),original);assert.equal(await page.evaluate(()=>JSON.stringify(auditOrder)),order);
 console.log('PASS rename validation, replacement confirmation, manual edit + both Undo steps, control reachability at three widths');
 for(const kind of ['duplicate','missing','unknown','category']){
 await page.evaluate(kind=>{aiStart('sort');auditDeliver(undefined,p=>{if(kind==='duplicate')p.assignments[1]=p.assignments[0];if(kind==='missing')p.assignments.pop();if(kind==='unknown')p.assignments[0].id='missing';if(kind==='category')p.assignments[0].category='Missing';});},kind);
 assert.equal(await page.evaluate(()=>aiProposal===null),true);assert.equal(await page.evaluate(()=>JSON.stringify(auditDb)),original);await page.click('#ai-cancel');
 }
 await page.evaluate(()=>{aiStart('sort');auditDb[0].title='Changed while waiting';auditDeliver();});assert.equal(await page.evaluate(()=>aiProposal===null),true);assert.match(await page.locator('#ai-status').textContent(),/changed/);await page.click('#ai-cancel');await page.evaluate(()=>auditDb[0].title='Game 0000');
 await page.evaluate(()=>{aiStart('sort');auditDeliver();auditDb[0].genre='Manual';aiApply();});assert.match(await page.locator('#ai-status').textContent(),/changed/);assert.equal(await page.evaluate(()=>categoryUndo.length),0);await page.click('#ai-cancel');await page.evaluate(()=>{auditDb[0].genre='Puzzle';reloadLibrary();});
 await page.evaluate(()=>{aiStart('sort');const canceled=aiRequest;hideDialog('#ai-review');nativeEvent('aiProposal',{request:canceled});});assert.equal(await page.evaluate(()=>aiProposal===null),true);
 await page.evaluate(()=>{aiStart('sort');nativeEvent('aiError',{request:aiRequest,message:'Gemini usage limit reached'});});assert.match(await page.locator('#ai-status').textContent(),/usage limit/);await page.click('#ai-cancel');
 console.log('PASS malformed response rejection, stale request/preview rejection, cancellation, API failure preservation');
 await page.evaluate(()=>{editGame(games[0]);aiSuggest(false);nativeEvent('aiSuggestion',{request:auditSuggestion.request,category:'Action'});});assert.equal(await page.inputValue('#edit-genre'),'Action');assert.equal(await page.evaluate(()=>auditDb[0].genre),'Puzzle');
 await page.evaluate(()=>{aiSuggest(false);$('#edit-title').value='Changed';nativeEvent('aiSuggestion',{request:auditSuggestion.request,category:'Puzzle'});});assert.equal(await page.inputValue('#edit-genre'),'Action');assert.match(await page.locator('#edit-error').textContent(),/changed/);await page.evaluate(()=>cancelEditor());
 await page.evaluate(()=>{drawerCatalog=[{package:'audit.app',title:'Reader'}];showDialog('#apps-drawer');editDrawerApp('audit.app');aiSuggest(true);nativeEvent('aiSuggestion',{request:auditSuggestion.request,category:'news'});});assert.equal(await page.inputValue('#appearance-section'),'news');assert.equal(await page.evaluate(()=>drawerPreferences.length),0);
 await page.evaluate(()=>{aiSuggest(true);const request=auditSuggestion.request;hideDialog('#app-appearance');nativeEvent('aiSuggestion',{request,category:'social'});});assert.equal(await page.evaluate(()=>aiSuggestion===null),true);
 console.log('PASS game/app suggestions stay in editor until Save, stale results ignored');
 await page.evaluate(async()=>{
  // A queued close event must not cancel a new request in a reopened dialog.
  aiStart('sort');const previous=aiRequest;hideDialog('#ai-review');aiStart('sort');
  const request=aiRequest;await new Promise(r=>setTimeout(r,60));
  if(aiRequest!==request||auditCanceled.includes(request))throw Error('Reopened review lost its new request');
  if(!auditCanceled.includes(previous))throw Error('Reopened review left its previous request running');
  auditDeliver();
 });
 assert.equal(await page.evaluate(()=>!!aiProposal),true);
 await page.click('#ai-cancel');
 await page.evaluate(async()=>{
  editGame({...games[0],id:'new-audit',package:'audit.new'},true);aiSuggest(false);
  cancelEditor();editGame({...games[0],id:'new-second',package:'audit.second'},true);aiSuggest(false);
  const request=aiSuggestion.request;await new Promise(r=>setTimeout(r,60));
  if(aiSuggestion?.request!==request||auditCanceled.includes(request))throw Error('Reopened game editor lost its new suggestion');
  nativeEvent('aiSuggestion',{request,category:'Action'});
 });
 assert.equal(await page.inputValue('#edit-genre'),'Action');
 await page.evaluate(()=>cancelEditor());
 console.log('PASS rapid close/reopen preserves the new review and add-game suggestion');
 await page.evaluate(()=>{
  window.auditPrefs=[];native.appsPreferences=()=>JSON.stringify(auditPrefs);
  native.saveApp=raw=>{const value=JSON.parse(raw),index=auditPrefs.findIndex(p=>p.package===value.package);if(index<0)auditPrefs.push(value);else auditPrefs[index]=value;return '{"ok":true}';};
  native.save=raw=>{const value=JSON.parse(raw),index=auditDb.findIndex(g=>g.id===value.id);if(index<0)auditDb.push(value);else auditDb[index]=value;return '{"ok":true}';};
  drawerCatalog=[{package:'audit.newapp',title:'New app'}];loadDrawerPreferences();
  editDrawerApp('audit.newapp');$('#appearance-name').value='My edited game name';
  appearanceDraft.image='icon/custom-cover';$('#appearance-pinned').checked=true;$('#appearance-section-hidden').checked=true;
  aiSuggest(true);window.oldAppRequest=aiSuggestion.request;
  editDrawerGame();aiSuggest(false);
 });
 assert.deepEqual(await page.evaluate(()=>({app:auditSuggestion.app,title:auditSuggestion.title,package:auditSuggestion.package})),{app:false,title:'My edited game name',package:'audit.newapp'});
 await page.evaluate(()=>{
  nativeEvent('aiSuggestion',{request:oldAppRequest,category:'social'});
  nativeEvent('aiSuggestion',{request:auditSuggestion.request,category:'Action'});
 });
 assert.equal(await page.inputValue('#appearance-section'),'auto','late app suggestion cannot overwrite parent editor');
 assert.equal(await page.evaluate(()=>auditDb.some(g=>g.package==='audit.newapp')),false,'suggestion alone cannot add a game');
 await page.evaluate(()=>$('#edit-form').requestSubmit());
 assert.deepEqual(await page.evaluate(()=>{const g=auditDb.find(g=>g.package==='audit.newapp');return {title:g.title,genre:g.genre,image:g.image};}),{title:'My edited game name',genre:'Action',image:'icon/custom-cover'});
 await page.evaluate(()=>aiSuggest(true));
 await page.evaluate(()=>nativeEvent('aiSuggestion',{request:auditSuggestion.request,category:'social'}));
 assert.equal(await page.inputValue('#appearance-section'),'social');
 assert.equal(await page.evaluate(()=>auditPrefs.length),0,'game save cannot save app preferences');
 await page.evaluate(()=>$('#app-appearance-form').requestSubmit());
 assert.deepEqual(await page.evaluate(()=>({section:auditPrefs[0].section,pinned:auditPrefs[0].pinned,hidden:auditPrefs[0].hideFromSections,image:auditPrefs[0].image,genre:auditDb.find(g=>g.package==='audit.newapp').genre})),{section:'social',pinned:true,hidden:true,image:'icon/custom-cover',genre:'Action'});
 console.log('PASS Add to game library suggestions, edited titles and covers, nested app/game saves, independent sections, pin and visibility preferences');
 for(const app of [false,true]){
  await page.evaluate(app=>{if(app)editDrawerApp('audit.newapp');else editGame(games.find(g=>g.package==='audit.newapp'));aiSuggest(app);},app);
  const field=app?'#appearance-section':'#edit-genre',error=app?'#appearance-error':'#edit-error';
  await page.evaluate(app=>{$(app?'#appearance-section':'#edit-genre').value=app?'tools':'Puzzle';nativeEvent('aiSuggestion',{request:auditSuggestion.request,category:app?'news':'Action'});},app);
  assert.equal(await page.inputValue(field),app?'tools':'Puzzle');assert.match(await page.locator(error).textContent(),/changed/);
  await page.evaluate(app=>{aiSuggest(app);nativeEvent('aiSuggestion',{request:auditSuggestion.request,category:'not-allowed'});},app);
  assert.equal(await page.inputValue(field),app?'tools':'Puzzle');assert.match(await page.locator(error).textContent(),/no longer available/);
  await page.evaluate(app=>{aiSuggest(app);nativeEvent('aiError',{request:auditSuggestion.request,message:'Synthetic network failure'});},app);
  assert.match(await page.locator(error).textContent(),/Synthetic network failure/);
  assert.equal(await page.locator(app?'#ai-suggest-app':'#ai-suggest-game').isDisabled(),false);
  await page.evaluate(app=>{aiSuggest(app);window.canceledSuggestion=aiSuggestion.request;if(app)hideDialog('#app-appearance');else cancelEditor();},app);
  await page.evaluate(()=>nativeEvent('aiSuggestion',{request:canceledSuggestion,category:'Action'}));
 }
 assert.equal(await page.evaluate(()=>auditDb.find(g=>g.package==='audit.newapp').genre),'Action');
 assert.equal(await page.evaluate(()=>auditPrefs[0].section),'social');
 console.log('PASS manual changes beat pending suggestions, invalid categories and network errors stay editable, cancellation preserves saved data');
 await page.evaluate(()=>{editGame(games[0]);aiSuggest(false);window.staleCategoryRequest=aiSuggestion.request;categoryApply([{id:'g0',from:auditDb[0].genre,to:'New genre'}],categoryOrder,'concurrent category edit');nativeEvent('aiSuggestion',{request:staleCategoryRequest,category:'Action'});});
 assert.match(await page.locator('#edit-error').textContent(),/changed/,'category scheme changes invalidate a pending game suggestion');
 await page.evaluate(()=>{cancelEditor();undoCategoryChange();editGame(games[0]);auditHasKey=false;window.previousSuggestionRequest=auditSuggestion.request;aiSuggest(false);});
 assert.match(await page.locator('#edit-error').textContent(),/API key/);assert.equal(await page.evaluate(()=>auditSuggestion.request===previousSuggestionRequest),true,'missing key does not send a request');
 await page.evaluate(()=>{auditHasKey=true;cancelEditor();aiStart('sort');auditDeliver();window.saveAi=native.aiApply;native.aiApply=()=>'{"ok":false,"message":"Synthetic disk failure"}';window.beforeFailure=JSON.stringify(auditDb);window.undoBeforeFailure=categoryUndo.length;aiApply();});
 assert.equal(await page.evaluate(()=>JSON.stringify(auditDb)===beforeFailure&&categoryUndo.length===undoBeforeFailure&&$('#ai-review').open),true,'failed native save keeps review and library intact');
 await page.evaluate(()=>{native.aiApply=saveAi;hideDialog('#ai-review');});
 console.log('PASS category changes invalidate suggestions, missing key sends no request, failed Apply keeps preview and Undo intact');
 await page.evaluate(()=>{window.savedTitle=auditDb[0].title;auditDb[0].title='<img src=x onerror="window.auditInjected=true"> & quoted game';reloadLibrary();aiStart('reorganize',2);auditDeliver(['<b>Action</b>','Puzzle & strategy']);});
 assert.equal(await page.locator('#ai-grid b').count(),0);
 assert.equal(await page.evaluate(()=>!!window.auditInjected),false);
 assert.equal(await page.locator('#ai-category option').first().textContent(),'<b>Action</b> · 601 games total');
 await page.evaluate(()=>{hideDialog('#ai-review');auditDb[0].title=savedTitle;reloadLibrary();});
 console.log('PASS unusual titles and AI category names render as text, never executable markup');
 assert.deepEqual(errors,[]);console.log('PASS no JavaScript errors');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

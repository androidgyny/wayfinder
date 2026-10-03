'use strict';
// AI operates on a detached proposal. Existing categoryApply owns save refresh and Undo.
let aiProposal=null,aiRequest='',aiMode='sort',aiMaximum=0,aiCategory=0,aiPage=0,aiMoveId='',aiSuggestion=null;
const aiPageSize=48;
function aiStopProgress(){$('#ai-activity').hidden=true;review.removeAttribute('aria-busy');}
function aiStartProgress(){$('#ai-activity').hidden=false;review.setAttribute('aria-busy','true');aiUpdateProgress('Preparing proposal…');}
function aiUpdateProgress(message){
 const stages=aiMode==='sort'?['Prepare','Check category fit','Review mismatches','Validate']:['Design categories','Assign','Check'];
 const stage=/checking final/i.test(message)?stages.length-1:/reconsidering/i.test(message)?2:/assign|recover|omitted|category fit/i.test(message)?1:0;
 $('#ai-stages').replaceChildren(...stages.map((label,index)=>{const step=el('span','ai-stage'+(index===stage?' active':index<stage?' complete':''),(index<stage?'✓ ':index+1+' · ')+label);if(index===stage)step.setAttribute('aria-current','step');return step;}));
}
function aiNode(tag,id,text,classes){const node=el(tag,classes||'',text||'');if(id)node.id=id;return node;}
function aiButton(id,text,action){const b=aiNode('button',id,text,'secondary');b.type='button';b.onclick=action;return b;}
function aiParagraph(text){return el('p','muted',text);}
function aiId(){return 'ai_'+Date.now()+'_'+Math.random().toString(36).slice(2);}
function aiNameKey(name){return normalize(name).replace(/\s+/g,' ').trim();}
function aiFingerprint(records,order){return JSON.stringify([...records].sort((a,b)=>String(a.id).localeCompare(String(b.id))).map(g=>[String(g.id),g.title,g.package,g.genre]))+JSON.stringify(order);}
function aiValidate(proposal){
 if(!Array.isArray(proposal.categories)||!Array.isArray(proposal.assignments)||!Array.isArray(proposal.source))throw Error('Invalid proposal.');
 const keys=new Set(),allowed=new Set(proposal.categories),ids=new Set(proposal.source.map(g=>String(g.id)));
 if(!allowed.size||allowed.size>aiMaximum||allowed.size!==proposal.categories.length)throw Error('Invalid number of categories.');
 for(const name of proposal.categories){if(typeof name!=='string'||!name.trim()||name!==name.trim()||name.length>100||(aiMode==='reorganize'&&keys.has(aiNameKey(name))))throw Error('Category names must be distinct and nonempty.');keys.add(aiNameKey(name));}
 if(proposal.assignments.length!==proposal.source.length)throw Error('Every game must be assigned exactly once.');
 for(const a of proposal.assignments)if(!ids.delete(String(a.id))||!allowed.has(a.category))throw Error('Invalid or duplicate assignment.');
 if(ids.size)throw Error('Some games are missing.');
 if(aiMode==='sort'&&(allowed.size!==genres.length||genres.some(n=>!allowed.has(n))))throw Error('Existing categories changed. Generate a fresh proposal.');
}
const aiSettings=aiNode('section','gemini-settings');
aiSettings.append(el('h3','','AI category organization'),aiParagraph('Open Google AI Studio, sign in with Google, and choose Create API key. Copy the key and paste it here; you can start with the free tier.'),aiButton('gemini-open-keys','Open Google AI Studio',()=>native?.geminiOpenKeys?.()));
const keyLabel=el('label','','Gemini API key'),keyInput=aiNode('input','gemini-key');keyInput.type='password';keyInput.autocomplete='off';keyInput.maxLength=500;keyInput.placeholder='Paste your API key';keyLabel.append(keyInput);aiSettings.append(keyLabel);
const keyTools=el('div','category-tools');keyTools.append(aiButton('gemini-save','Save key',()=>aiSaveKey(false)),aiButton('gemini-remove','Remove key',()=>aiSaveKey(true)));keyTools.append(aiButton('gemini-check','Check connection',()=>{if(!native?.geminiCheckKey)return;$('#gemini-check').disabled=true;$('#gemini-status').textContent='Checking Gemini connection…';native.geminiCheckKey();}));aiSettings.append(keyTools,aiNode('p','gemini-status','','muted'),aiParagraph('Titles and package names are sent to Gemini when you request organization or a suggestion. Your API key stays on this device and is excluded from library backups.'));$('#settings-library').append(aiSettings);
function aiKeyStatus(){const has=!!native?.geminiHasKey?.();$('#gemini-status').textContent=has?'API key saved.':'No API key saved.';$('#gemini-remove').disabled=!has;}
function aiSaveKey(remove){if(!native?.geminiSaveKey){$('#gemini-status').textContent='Available in the updated Android app.';return;}const result=JSON.parse(native.geminiSaveKey(remove?'':keyInput.value));if(result.ok){keyInput.value='';aiKeyStatus();}else $('#gemini-status').textContent=result.message;}
aiKeyStatus();
const aiTools=el('div','ai-actions'),sortAction=el('section'),reorganizeAction=el('section');
sortAction.append(aiButton('ai-sort','AI Sort into existing categories',()=>aiStart('sort')),aiParagraph('Keep your current categories. Check for clear category mismatches. Keep reasonable existing assignments; review each proposed correction before showing it.'));
reorganizeAction.append(aiButton('ai-reorganize','AI Reorganize categories',()=>{if(!games.length){categoryMessage('Add games before organizing.');return;}$('#ai-setup-error').textContent='';showDialog('#ai-setup');}),aiParagraph('Propose a new category scheme and assign every game to it. You choose a maximum category count.'));
aiTools.append(sortAction,reorganizeAction,aiParagraph('Both actions let you review and correct the proposal before Apply. You can undo the applied change until Wayfinder closes.'));$('#category-manager').insertBefore(aiTools,$('#category-list'));
const setup=aiNode('dialog','ai-setup');setup.setAttribute('aria-labelledby','ai-setup-title');setup.append(aiButton('ai-setup-close','Cancel',()=>hideDialog('#ai-setup')),aiNode('h2','ai-setup-title','AI Reorganize'),aiParagraph('Generate a new game category scheme. Review and correct it before replacing your current categories.'));
const maxLabel=el('label','','Maximum number of categories'),maxInput=aiNode('input','ai-maximum');maxInput.type='number';maxInput.min=1;maxInput.max=100;maxInput.value=15;maxLabel.append(maxInput);setup.append(maxLabel,aiNode('p','ai-setup-error','','muted'),aiButton('ai-generate','Generate proposal',()=>{const maximum=Number(maxInput.value);if(!Number.isInteger(maximum)||maximum<1||maximum>100){$('#ai-setup-error').textContent='Choose a whole number between 1 and 100.';return;}hideDialog('#ai-setup');aiStart('reorganize',maximum);}));document.body.append(setup);
const review=aiNode('dialog','ai-review');review.setAttribute('aria-labelledby','ai-review-title');review.append(aiButton('ai-cancel','Cancel',()=>hideDialog('#ai-review')),aiNode('h2','ai-review-title','AI organization'),aiNode('p','ai-summary'),aiNode('p','ai-status','','muted'));
const movedLabel=aiNode('label','ai-moved-label'),moved=aiNode('input','ai-moved');moved.type='checkbox';moved.onchange=()=>{aiPage=0;aiRender();};movedLabel.append(moved,document.createTextNode(' Show only moved games'));review.append(movedLabel);
const activity=aiNode('div','ai-activity');activity.hidden=true;activity.append(aiNode('div','ai-stages'),aiNode('div','ai-activity-track'));activity.querySelector('#ai-activity-track').setAttribute('aria-hidden','true');review.insertBefore(activity,review.querySelector('#ai-status'));
const nav=el('div','category-tools');nav.append(aiButton('ai-prev-category','Previous category',()=>{aiCategory--;aiPage=0;aiRender();}),aiNode('select','ai-category'),aiNode('span','ai-category-position'),aiButton('ai-next-category','Next category',()=>{aiCategory++;aiPage=0;aiRender();}));$('#ai-category',nav);review.append(nav);
const renameLabel=aiNode('label','ai-rename-label','Category name'),rename=aiNode('input','ai-rename');rename.maxLength=100;renameLabel.append(rename);review.append(renameLabel,aiButton('ai-rename-save','Rename category',()=>aiRename()),aiNode('div','ai-grid'));
const pages=el('div','category-tools');pages.append(aiButton('ai-prev-page','Previous page',()=>{aiPage--;aiRender();}),aiNode('span','ai-page'),aiButton('ai-next-page','Next page',()=>{aiPage++;aiRender();}));review.insertBefore(pages,renameLabel);review.append(aiParagraph('Select a game to change its category. You can undo an applied change in Manage categories until Wayfinder closes (last 20 category changes).'),aiNode('p','ai-confirm-text','','muted'),aiButton('ai-apply','Apply',()=>aiApply()),aiButton('ai-confirm','Replace categories and apply',()=>aiApply(true)));document.body.append(review);
const move=aiNode('dialog','ai-move');move.setAttribute('aria-labelledby','ai-move-title');move.append(aiNode('h2','ai-move-title','Move game'),aiNode('p','ai-move-origin'),aiNode('select','ai-move-to'),aiButton('ai-move-save','Move game',()=>{if(!aiProposal)return;aiProposal.assignments.find(a=>String(a.id)===aiMoveId).category=$('#ai-move-to').value;hideDialog('#ai-move');aiRender();}),aiButton('ai-move-cancel','Cancel',()=>hideDialog('#ai-move')));document.body.append(move);
for(const dialog of [setup,review,move])dialog.addEventListener('cancel',e=>{e.preventDefault();hideDialog('#'+dialog.id);});
review.addEventListener('close',()=>{if(review.open)return;aiStopProgress();if(move.open)hideDialog('#ai-move');if(aiRequest)native?.aiCancel?.(aiRequest);aiRequest='';aiProposal=null;});
$('#ai-category').onchange=()=>{aiCategory=Number($('#ai-category').value);aiPage=0;aiRender();};
function aiStart(mode,maximum){
 if(!games.length){categoryMessage('Add games before organizing.');return;}
 if(!native?.aiOrganize){categoryMessage('AI organization is available in the updated Android app.');return;}
 if(!native.geminiHasKey()){categoryMessage('Add your Gemini API key in Settings → Library first.');return;}
 if(aiRequest)native.aiCancel?.(aiRequest);
 aiMode=mode;aiMaximum=mode==='sort'?genres.length:maximum;aiProposal=null;aiRequest=aiId();aiCategory=aiPage=0;
 loadCategoryOrder();if(native)games=JSON.parse(native.library());review._sourceFingerprint=aiFingerprint(games,categoryOrder);
 $('#ai-review-title').textContent=mode==='sort'?'AI Sort preview':'AI Reorganize preview';$('#ai-status').textContent='Preparing proposal…';$('#ai-summary').textContent='';$('#ai-moved').checked=mode==='sort';aiRender();showDialog('#ai-review');aiStartProgress();native.aiOrganize(aiRequest,mode==='reorganize',aiMaximum);
}
function aiCurrentMatches(){loadCategoryOrder();const current=native?JSON.parse(native.library()):games;return aiFingerprint(current,categoryOrder)===review._sourceFingerprint;}
function aiRender(){
 const focusedGame=document.activeElement?.closest('#ai-grid .ai-game'),focusedIndex=focusedGame?[...$('#ai-grid').children].indexOf(focusedGame):-1;
 const ready=!!aiProposal;for(const id of ['ai-moved-label','ai-category','ai-category-position','ai-prev-category','ai-next-category','ai-grid','ai-prev-page','ai-next-page','ai-page','ai-apply'])$('#'+id).hidden=!ready;
 $('#ai-rename-label').hidden=$('#ai-rename-save').hidden=!ready||aiMode!=='reorganize';$('#ai-moved-label').hidden=!ready||aiMode!=='sort';$('#ai-confirm').hidden=true;$('#ai-confirm-text').textContent='';
 $('#ai-grid').replaceChildren();if(!ready)return;
 const source=new Map(aiProposal.source.map(g=>[String(g.id),g]));const assignments=aiProposal.assignments;
 const changed=assignments.filter(a=>source.get(String(a.id)).genre!==a.category).length;
 const used=aiProposal.categories.filter(name=>assignments.some(a=>a.category===name));
 $('#ai-summary').textContent=aiMode==='sort'?`${assignments.length.toLocaleString()} analyzed · ${changed.toLocaleString()} moved · ${(assignments.length-changed).toLocaleString()} unchanged`:`${assignments.length.toLocaleString()} analyzed · ${used.length} categories`;
 aiCategory=Math.max(0,Math.min(aiCategory,aiProposal.categories.length-1));const category=aiProposal.categories[aiCategory];
 $('#ai-category-position').textContent=`Category ${aiCategory+1} of ${aiProposal.categories.length}`;
 $('#ai-category').replaceChildren(...aiProposal.categories.map((name,index)=>{const option=el('option','',name+' · '+assignments.filter(a=>a.category===name).length.toLocaleString()+' games total');option.value=index;return option;}));$('#ai-category').value=aiCategory;
 $('#ai-prev-category').disabled=aiCategory===0;$('#ai-next-category').disabled=aiCategory===aiProposal.categories.length-1;rename.value=category;
 const shown=assignments.filter(a=>a.category===category&&(aiMode!=='sort'||!moved.checked||source.get(String(a.id)).genre!==a.category)).sort((a,b)=>compareTitles(source.get(String(a.id)).title,source.get(String(b.id)).title));
 const pageCount=Math.max(1,Math.ceil(shown.length/aiPageSize));aiPage=Math.max(0,Math.min(aiPage,pageCount-1));
 for(const a of shown.slice(aiPage*aiPageSize,(aiPage+1)*aiPageSize)){
  const g=source.get(String(a.id)),b=el('button','ai-game'),image=el('img');image.src=g.image;image.alt='';image.loading='lazy';b.append(image,el('span','',g.title));if(aiMode==='sort')b.append(el('span','muted',g.genre===a.category?'Unchanged':'From '+(g.genre||'Uncategorized')));b.setAttribute('aria-label',g.title+' — '+(g.genre===a.category?'unchanged in '+a.category:'from '+(g.genre||'Uncategorized')+' to '+a.category));b.onclick=()=>{aiMoveId=String(a.id);$('#ai-move-title').textContent=g.title;$('#ai-move-origin').textContent='Previous category: '+(g.genre||'Uncategorized');$('#ai-move-to').replaceChildren(...aiProposal.categories.map(name=>{const option=el('option','',name);option.value=name;return option;}));$('#ai-move-to').value=a.category;showDialog('#ai-move');};$('#ai-grid').append(b);
  b.dataset.gameId=String(a.id);
 }
 if(!shown.length)$('#ai-grid').append(aiParagraph(moved.checked&&aiMode==='sort'?'No moved games in this category.':'No games in this category.'));
 if(focusedGame){const cards=[...document.querySelectorAll('#ai-grid .ai-game')];const next=cards.find(b=>b.dataset.gameId===focusedGame.dataset.gameId)||cards[Math.min(focusedIndex,cards.length-1)]||$('#ai-category');next.focus({preventScroll:true});}
 $('#ai-prev-page').disabled=aiPage===0;$('#ai-next-page').disabled=aiPage===pageCount-1;$('#ai-page').textContent=`Page ${aiPage+1} of ${pageCount} · ${shown.length?`${aiPage*aiPageSize+1}–${Math.min((aiPage+1)*aiPageSize,shown.length)} of ${shown.length.toLocaleString()} ${aiMode==='sort'&&moved.checked?'moved games':'games'}`:'0 games'}`;
}
function aiRename(){if(!aiProposal)return;const name=rename.value.trim(),old=aiProposal.categories[aiCategory];if(!name||aiProposal.categories.some((n,i)=>i!==aiCategory&&aiNameKey(n)===aiNameKey(name))){$('#ai-status').textContent='Choose a distinct, nonempty name. Merge categories later in Manage categories.';return;}aiProposal.categories[aiCategory]=name;for(const a of aiProposal.assignments)if(a.category===old)a.category=name;$('#ai-status').textContent='';aiRender();}
function aiApply(confirmed=false){
 if(!aiProposal)return;
 try{
  aiValidate(aiProposal);if(!aiCurrentMatches())throw Error('Your library or categories changed. Cancel and generate a fresh proposal.');
  if(aiMode==='reorganize'&&!confirmed){const used=new Set(aiProposal.assignments.map(a=>a.category));$('#ai-confirm-text').textContent=`Replace your current game categories with these ${used.size} categories and organize all ${aiProposal.source.length.toLocaleString()} games?`;$('#ai-confirm').hidden=false;return;}
  const before=new Map(aiProposal.source.map(g=>[String(g.id),g]));const moves=aiProposal.assignments.filter(a=>before.get(String(a.id)).genre!==a.category).map(a=>({id:String(a.id),from:before.get(String(a.id)).genre,to:a.category}));
  const order=aiMode==='sort'?[...categoryOrder]:aiProposal.categories.filter(n=>aiProposal.assignments.some(a=>a.category===n));
  const payload={request:aiRequest,categories:aiProposal.categories,assignments:aiProposal.assignments,maximum:aiMaximum,order};
  const selectedCategory=genre;
  if(!categoryApply(moves,order,aiMode==='sort'?'AI sort':'AI reorganization',false,undefined,payload))throw Error('Could not apply the proposal. See the category manager for details.');
  if(selectedCategory&&!genres.includes(selectedCategory))setGenre('');
  hideDialog('#ai-review');toast('Organization saved. Undo is available in Manage categories.');
 }catch(e){$('#ai-status').textContent=e.message;}
}
const suggestGame=aiButton('ai-suggest-game','Suggest Category',()=>aiSuggest(false));$('#edit-genre').closest('label').after(suggestGame);
const suggestApp=aiButton('ai-suggest-app','Suggest Category',()=>aiSuggest(true));$('#appearance-section').closest('label').after(suggestApp);
function aiStopSuggestion(){if(aiSuggestion)native?.aiCancel?.(aiSuggestion.request);aiSuggestion=null;suggestGame.disabled=suggestApp.disabled=false;suggestGame.textContent=suggestApp.textContent='Suggest Category';}
for(const [id,app] of [['editor',false],['app-appearance',true]])$('#'+id).addEventListener('close',()=>{if(!$('#'+id).open&&aiSuggestion?.app===app)aiStopSuggestion();});
function aiSuggest(app){
 const owner=app?appearanceDraft:draft;if(!owner)return;const title=$(app?'#appearance-name':'#edit-title').value.trim(),error=$(app?'#appearance-error':'#edit-error');
 if(!native?.aiSuggest){error.textContent='Available in the updated Android app.';return;}if(!native.geminiHasKey()){error.textContent='Add your Gemini API key in Settings → Library first.';return;}
 aiStopSuggestion();error.textContent='';const request=aiId(),button=app?suggestApp:suggestGame;aiSuggestion={request,app,owner,title,package:owner.package,value:$(app?'#appearance-section':'#edit-genre').value,categories:JSON.stringify(genres)};button.disabled=true;button.textContent='Suggesting…';native.aiSuggest(request,JSON.stringify({app,title,package:owner.package}));
}
const aiPreviousEvent=window.nativeEvent;window.nativeEvent=(event,data)=>{
 if(event==='aiKeyCheck'||event==='aiKeyCheckDone'){$('#gemini-status').textContent=data.message;if(event==='aiKeyCheckDone')$('#gemini-check').disabled=false;return;}
 if(event==='aiProgress'&&data.request===aiRequest){$('#ai-status').textContent=data.message;aiUpdateProgress(data.message);return;}
 if(event==='aiProposal'&&data.request===aiRequest){aiStopProgress();try{aiValidate(data);if(!aiCurrentMatches()||aiFingerprint(data.source,categoryOrder)!==review._sourceFingerprint)throw Error('Your library changed. Cancel and generate a fresh proposal.');aiProposal=data;$('#ai-status').textContent='Review the proposal and correct any assignments before Apply.';aiRender();}catch(e){$('#ai-status').textContent=e.message;}return;}
 if(event==='aiError'){
  if(data.request===aiRequest){aiStopProgress();$('#ai-status').textContent=data.message;return;}
  if(data.request===aiSuggestion?.request){const app=aiSuggestion.app;aiStopSuggestion();$(app?'#appearance-error':'#edit-error').textContent=data.message;return;}
 }
 if(event==='aiSuggestion'&&data.request===aiSuggestion?.request){
  const pending=aiSuggestion,app=pending.app,owner=app?appearanceDraft:draft,field=$(app?'#appearance-section':'#edit-genre'),title=$(app?'#appearance-name':'#edit-title').value.trim();aiStopSuggestion();
  if(owner!==pending.owner||owner?.package!==pending.package||title!==pending.title||field.value!==pending.value||(!app&&JSON.stringify(genres)!==pending.categories)){$(app?'#appearance-error':'#edit-error').textContent='Details changed while suggesting. Request a fresh suggestion.';return;}
  const allowed=app?appSections.map(s=>s.id):genres;if(!allowed.includes(data.category)){$(app?'#appearance-error':'#edit-error').textContent='The suggested category is no longer available.';return;}
  field.value=data.category;if(!app)$('#category-options').value=data.category;$(app?'#appearance-error':'#edit-error').textContent='Category suggested. Save to keep it.';return;
 }
 aiPreviousEvent(event,data);
};

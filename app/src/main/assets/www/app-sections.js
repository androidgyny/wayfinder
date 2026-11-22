// Category artwork: Phosphor Icons, MIT; see LICENSE-Phosphor.txt.
const builtInAppSections=[{id:'news',name:'News',note:'Stay informed',icon:'newspaper'},{id:'media',name:'Media',note:'Watch, listen, explore',icon:'film-reel'},{id:'social',name:'Social',note:'Keep in touch',icon:'chats'},{id:'tools',name:'Tools',note:'Get things done',icon:'wrench'},{id:'system',name:'System',note:'Configure and customize',icon:'gear'}];
const appSectionIconChoices=['newspaper','film-reel','chats','wrench','gear','game-controller','joystick','desktop-tower','monitor-play','puzzle-piece','cloud-arrow-down','book-open','briefcase','shopping-cart','airplane','palette'];
const appSectionColors=[['Sky','#74b6ed'],['Azure','#729ddd'],['Periwinkle','#949ee8'],['Lavender','#b29aed'],['Lilac','#c49cdd'],['Orchid','#d18bc1'],['Rose','#df92ab'],['Coral','#e7978c'],['Peach','#e8aa87'],['Apricot','#dfb375'],['Honey','#d2ba70'],['Sand','#c8b68f'],['Lime','#b8c57b'],['Sage','#a2bd91'],['Leaf','#83b28b'],['Mint','#7cbfa3'],['Seafoam','#79bdb4'],['Teal','#6fadb0'],['Glacier','#88b6c9'],['Slate','#adb8ca'],['Silver','#b4babe'],['Mauve','#b9a1b5'],['Clay','#bd9e91'],['Olive','#aaa879']];
function appSectionColor(section){return appSectionColors.some(c=>c[1]===section?.color)?section.color:(appSectionDefaultColors[section?.id]||'#74b6ed')}
function appSectionTone(color){return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',')}
const appSectionDefaultColors={news:'#74b6ed',media:'#b29aed',social:'#e7978c',tools:'#7cbfa3',system:'#adb8ca'};
let appSectionOrder=[],builtInSectionColors=[],customAppSections=[],appSections=[];
function loadAppSections(){
 try{customAppSections=native?.appSections?JSON.parse(native.appSections()):customAppSections}catch{customAppSections=[]}
 if(!Array.isArray(customAppSections))customAppSections=[];
 appSectionOrder=customAppSections.filter(s=>s&&Number.isInteger(s.order)&&s.order>=0).sort((a,b)=>a.order-b.order).map(s=>s.id);
 builtInSectionColors=customAppSections.filter(s=>s&&Object.prototype.hasOwnProperty.call(appSectionDefaultColors,s.id)&&appSectionColors.some(c=>c[1]===s.color)).map(s=>({id:s.id,color:s.color}));
 customAppSections=customAppSections.filter(s=>s&&/^custom_[a-zA-Z0-9_-]{1,80}$/.test(s.id)&&typeof s.name==='string'&&s.name.trim()).map(s=>({id:s.id,name:s.name.trim().slice(0,40),note:String(s.note||'').trim().slice(0,80),icon:appSectionIconChoices.includes(s.icon)?s.icon:'wrench',color:appSectionColor(s)}));
 appSections=[...builtInAppSections.map(s=>({...s,color:builtInSectionColors.find(c=>c.id===s.id)?.color||appSectionDefaultColors[s.id]})),...customAppSections];
 if(appSectionOrder.length)appSections.sort((a,b)=>{const rank=s=>appSectionOrder.includes(s.id)?appSectionOrder.indexOf(s.id):appSectionOrder.length;return rank(a)-rank(b)});
}
loadAppSections();
let drawerSection='',lastAppSection='news';
function appSection(a){
 const assigned=appPreference(a.package).section;
 if(appSections.some(s=>s.id===assigned))return assigned;
 if(drawerIsGame(a))return '';
 const text=(a.title+' '+a.package).toLowerCase();
 if(/beeper|reddit|telegram|whatsapp|signal|discord|aliucord|facebook|instagram|messenger|mastodon|bluesky|snapchat|tiktok/.test(text))return 'social';
 if(/news|reader|feedly|newspaper|pocket|nytimes|new yorker|washington post|substack|\bwsj\b/.test(text))return 'news';
 if(/music|video|player|spotify|youtube|gallery|photo|netflix|podcast|vlc|plex|kodi|cloudstream|stremio|iptv|pluto tv|aniyomi|sound recorder/.test(text))return 'media';
 if(/settings|system|permission|updater|store|vending|security|magisk|shizuku|adaway|backup|ccleaner|app inspector|devinfo|obtainium|button mapper|font|gboard|pimax ime|konabess|zygisk|\bfkm\b/.test(text))return 'system';
 return 'tools';
}
function closeAppSection(){
 if(drawerView!=='home'||!drawerSection||$('#drawer-search').value.trim())return false;
 lastAppSection=drawerSection;drawerSection='';drawerPage=0;renderDrawer();controllerFocus(document.querySelector(`[data-section="${lastAppSection}"]`));return true;
}
function renderAppSections(home){
 const root=$('#app-sections'),dock=$('#app-dock');
 const sectionFocus=document.activeElement?.dataset.section,dockFocus=document.activeElement?.closest('#app-dock .drawer-app')?.dataset.package;
 root.hidden=!home;root.replaceChildren();
 const grouped=new Map(appSections.map(s=>[s.id,[]]));
 if(home)for(const a of drawerCatalog){if(!appPreference(a.package).hideFromSections)grouped.get(appSection(a))?.push(a);}
 if(home)for(const section of appSections){
  const apps=grouped.get(section.id).sort((a,b)=>drawerName(a).localeCompare(drawerName(b)));
  const b=el('button','app-section');b.dataset.section=section.id;b.style.setProperty('--section-tone',appSectionTone(appSectionColor(section)));b.setAttribute('aria-expanded',String(drawerSection===section.id));b.setAttribute('aria-controls','drawer-grid');
  const art=el('span','section-art');art.innerHTML=appSectionIcons[section.icon];
  b.append(art,el('strong','',section.name),el('span','section-note',section.note));
  const row=el('span','section-icons');for(const a of apps.slice(0,4)){const im=el('img');im.src=drawerImage(a);im.alt='';row.append(im)}
  row.append(el('span','section-count',String(apps.length)));b.append(row);
  b.onclick=()=>{drawerSection=drawerSection===section.id?'':section.id;lastAppSection=section.id;drawerPage=0;renderDrawer();controllerFocus(drawerSection?$('#drawer-grid .drawer-app')||document.querySelector(`[data-section="${section.id}"]`):document.querySelector(`[data-section="${section.id}"]`))};root.append(b);
 }
 dock.replaceChildren();const pins=(home?drawerCatalog.filter(a=>appPreference(a.package).pinned):[]).sort((a,b)=>(appPreference(a.package).order||0)-(appPreference(b.package).order||0)||drawerName(a).localeCompare(drawerName(b)));
 dock.hidden=!home||!pins.length;
 if(home)for(const a of pins.slice(0,8)){const tile=drawerTile(a);tile.querySelector('.drawer-edit').remove();dock.append(tile)}
 if(sectionFocus)root.querySelector(`[data-section="${sectionFocus}"]`)?.focus({preventScroll:true});
 if(dockFocus)[...dock.querySelectorAll('.drawer-app')].find(b=>b.dataset.package===dockFocus)?.focus({preventScroll:true});
 $('#apps-drawer').classList.toggle('sections-home',home);
 $('#apps-drawer').classList.toggle('section-expanded',home&&!!drawerSection);
 $('#app-dock').classList.toggle('pins-draggable',canDragPins());
}

let editingAppSection='';
function refreshAppSectionOptions(selected){
 const select=$('#appearance-section');if(!select)return;
 const value=selected===undefined?select.value:selected;
 select.replaceChildren(...[{id:'auto',name:'Automatic'},...appSections].map(s=>{const option=el('option','',s.name);option.value=s.id;return option;}));
 select.value=[...select.options].some(o=>o.value===value)?value:'auto';
}
function saveAppSections(){
 const records=[...builtInSectionColors,...customAppSections].map(s=>({...s}));
 if(appSectionOrder.length){for(const section of builtInAppSections)if(!records.some(s=>s.id===section.id))records.push({id:section.id,color:appSectionDefaultColors[section.id]});for(const [i,section] of records.entries())section.order=appSectionOrder.includes(section.id)?appSectionOrder.indexOf(section.id):appSectionOrder.length+i;}

 try{const result=native?.saveAppSections?JSON.parse(native.saveAppSections(JSON.stringify(records))):{ok:true};if(!result.ok)throw Error(result.message);loadAppSections();loadDrawerPreferences();refreshAppSectionOptions();renderAppSectionManager();if($('#apps-drawer').open)renderDrawer();return true}
 catch(e){loadAppSections();renderAppSectionManager();const message=e.message||'Could not save sections.';$('#app-section-error').textContent=message;if(!$('#app-section-editor').open)toast(message);return false}
}
function appSectionIcon(name){return appSectionIcons[name]||appSectionIcons.wrench}
function renderAppSectionManager(){
 const list=$('#app-section-manager-list');if(!list)return;const focused=document.activeElement,focusSection=focused?.closest('[data-manager-section]')?.dataset.managerSection,focusAction=focused?.dataset.sectionAction;list.replaceChildren();
 for(const section of appSections){
  const row=el('div','app-section-manager-row'),art=el('span','app-section-manager-icon');row.dataset.managerSection=section.id;art.innerHTML=appSectionIcon(section.icon);art.style.color=appSectionColor(section);row.append(art,el('span','app-section-manager-copy'));row.querySelector('.app-section-manager-copy').append(el('strong','',section.name),el('small','',section.note||'No subtitle'));
  const actions=el('div','app-section-manager-actions');
  const index=appSections.findIndex(s=>s.id===section.id),up=el('button','secondary','↑'),down=el('button','secondary','↓'),edit=el('button','secondary',section.id.startsWith('custom_')?'Edit':'Color');
  up.dataset.sectionAction='up';down.dataset.sectionAction='down';edit.dataset.sectionAction='edit';up.type=down.type=edit.type='button';up.setAttribute('aria-label','Move '+section.name+' up');down.setAttribute('aria-label','Move '+section.name+' down');up.disabled=index===0;down.disabled=index===appSections.length-1;
  const move=delta=>{appSectionOrder=appSections.map(s=>s.id);[appSectionOrder[index],appSectionOrder[index+delta]]=[appSectionOrder[index+delta],appSectionOrder[index]];saveAppSections()};up.onclick=()=>move(-1);down.onclick=()=>move(1);edit.onclick=()=>openAppSectionEditor(section);actions.append(up,down,edit);
  if(section.id.startsWith('custom_')){const remove=el('button','text-button','Delete');remove.type='button';remove.dataset.sectionAction='delete';remove.onclick=()=>{if(confirm('Delete “'+section.name+'”? Its apps will return to automatic sections.')){customAppSections=customAppSections.filter(s=>s.id!==section.id);appSectionOrder=appSectionOrder.filter(id=>id!==section.id);saveAppSections()}};actions.append(remove);}
  row.append(actions);list.append(row);
 }
 if(focusSection){const row=[...list.children].find(r=>r.dataset.managerSection===focusSection),target=row?.querySelector('[data-section-action="'+focusAction+'"]');controllerFocus(target&&!target.disabled?target:row?.querySelector('[data-section-action=edit]')||$('#add-app-section'));}
}
function openAppSectionEditor(section){
 editingAppSection=section?.id||'';const builtIn=Object.prototype.hasOwnProperty.call(appSectionDefaultColors,editingAppSection);for(const id of ['app-section-name','app-section-note','app-section-icon'])$('#'+id).closest('label').hidden=builtIn;$('#app-section-reset-color').hidden=!builtIn;$('#app-section-editor-title').textContent=section?'Edit section':'New section';$('#app-section-name').value=section?.name||'';$('#app-section-note').value=section?.note||'';$('#app-section-icon').value=section?.icon||'wrench';$('#app-section-color').value=appSectionColor(section);$('#app-section-error').textContent='';renderAppSectionIconPicker();renderAppSectionColorPicker();showDialog('#app-section-editor');if(builtIn)controllerFocus($('#app-section-color-picker [aria-pressed=true]'));else $('#app-section-name').focus();
}
function renderAppSectionIconPicker(){
 const selected=$('#app-section-icon').value,root=$('#app-section-icon-picker');root.replaceChildren(...appSectionIconChoices.map(name=>{const b=el('button','app-section-icon-choice');b.type='button';b.dataset.icon=name;b.innerHTML=appSectionIcon(name);b.setAttribute('aria-label',name.replaceAll('-',' '));b.setAttribute('aria-pressed',String(name===selected));b.onclick=()=>{$('#app-section-icon').value=name;for(const choice of root.children)choice.setAttribute('aria-pressed',String(choice.dataset.icon===name));updateAppSectionPreview()};return b;}));
}
function updateAppSectionPreview(){
 const root=$('#app-section-preview'),color=$('#app-section-color').value;
 root.style.setProperty('--section-tone',appSectionTone(color));root.querySelector('.section-art').innerHTML=appSectionIcon($('#app-section-icon').value);root.querySelector('strong').textContent=$('#app-section-name').value.trim()||'Your section';root.querySelector('.section-note').textContent=$('#app-section-note').value.trim()||'Category preview';
}
function renderAppSectionColorPicker(){
 const root=$('#app-section-color-picker');root.replaceChildren(...appSectionColors.map(([name,color])=>{const b=el('button','app-section-color-choice');b.type='button';b.dataset.color=color;b.style.setProperty('--swatch',color);b.setAttribute('aria-label',name);b.title=name;b.setAttribute('aria-pressed',String(color===$('#app-section-color').value));b.onclick=()=>{$('#app-section-color').value=color;for(const choice of root.children)choice.setAttribute('aria-pressed',String(choice.dataset.color===color));updateAppSectionPreview()};return b}));updateAppSectionPreview();
}
function initAppSectionManager(){
 loadAppSections();
 const manage=el('button','text-button','Manage sections');manage.id='manage-app-sections';manage.type='button';manage.onclick=()=>{loadAppSections();renderAppSectionManager();showDialog('#app-section-manager')};$('#android-settings').before(manage);
 const dialog=el('dialog');dialog.id='app-section-manager';dialog.setAttribute('aria-labelledby','app-section-manager-title');dialog.className='apps-ui app-section-dialog';dialog.innerHTML='<header class="app-section-dialog-header"><button class="close icon" id="close-app-section-manager" aria-label="Close section manager">×</button><h2 id="app-section-manager-title">Manage app sections</h2></header><div class="app-section-dialog-body"><p class="muted">Create sections for the way you use your device. Built-in automatic sorting remains available.</p><div id="app-section-manager-list"></div></div><footer class="app-section-dialog-footer"><button id="add-app-section" class="primary" type="button">Add section</button></footer>';document.body.append(dialog);
 const editor=el('dialog');editor.id='app-section-editor';editor.setAttribute('aria-labelledby','app-section-editor-title');editor.className='apps-ui app-section-dialog';editor.innerHTML='<header class="app-section-dialog-header"><button class="close icon" id="close-app-section-editor" aria-label="Close section editor">×</button><h2 id="app-section-editor-title">New section</h2></header><form id="app-section-editor-form"><div class="app-section-dialog-body"><label>Section name<input id="app-section-name" maxlength="40" required></label><label>Subtitle<input id="app-section-note" maxlength="80" placeholder="What belongs here?"></label><label>Phosphor icon<input id="app-section-icon" type="hidden"><span id="app-section-icon-picker" role="group" aria-label="Phosphor icon"></span></label><label>Section color<input id="app-section-color" type="hidden"><span id="app-section-color-picker" role="group" aria-label="Section color"></span></label><button type="button" id="app-section-reset-color" class="secondary">Reset to default color</button><div id="app-section-preview"><span class="section-art"></span><strong></strong><span class="section-note"></span></div><p id="app-section-error" role="alert"></p></div><footer class="app-section-dialog-footer"><button class="primary" type="submit">Save section</button></footer></form>';document.body.append(editor);
 $('#close-app-section-manager').onclick=()=>hideDialog('#app-section-manager');$('#add-app-section').onclick=()=>openAppSectionEditor();$('#close-app-section-editor').onclick=()=>hideDialog('#app-section-editor');
 $('#app-section-reset-color').onclick=()=>{$('#app-section-color').value=appSectionDefaultColors[editingAppSection];renderAppSectionColorPicker()};
 for(const id of ['app-section-name','app-section-note'])$('#'+id).addEventListener('input',updateAppSectionPreview);
 $('#app-section-editor-form').onsubmit=e=>{e.preventDefault();const name=$('#app-section-name').value.trim(),note=$('#app-section-note').value.trim(),icon=$('#app-section-icon').value,color=$('#app-section-color').value;if(!name){$('#app-section-error').textContent='Enter a section name.';return}if(appSections.some(s=>s.id!==editingAppSection&&normalize(s.name)===normalize(name))){$('#app-section-error').textContent='Choose a distinct section name.';return}if(!editingAppSection&&customAppSections.length>=20){$('#app-section-error').textContent='Wayfinder supports up to 20 custom sections.';return}if(Object.prototype.hasOwnProperty.call(appSectionDefaultColors,editingAppSection)){builtInSectionColors=builtInSectionColors.filter(s=>s.id!==editingAppSection);if(color!==appSectionDefaultColors[editingAppSection])builtInSectionColors.push({id:editingAppSection,color});}else if(editingAppSection){const section=customAppSections.find(s=>s.id===editingAppSection);if(!section)return;Object.assign(section,{name,note,icon,color});}else customAppSections.push({id:'custom_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),name,note,icon,color});if(saveAppSections()){hideDialog('#app-section-editor');toast('App section saved')}};
 for(const d of [dialog,editor])d.addEventListener('cancel',e=>{e.preventDefault();hideDialog('#'+d.id)});
 refreshAppSectionOptions();
}
window.addEventListener('DOMContentLoaded',initAppSectionManager,{once:true});
function sectionController(action){
 if(action==='back')return closeAppSection();
 const active=document.activeElement,category=active?.closest('.app-section'),dock=active?.closest('#app-dock .drawer-app');
 if(!['left','right','up','down','pageUp','pageDown'].includes(action))return false;
 const categories=[...$('#app-sections').children],pins=[...$('#app-dock').querySelectorAll('.drawer-app')];
 const topActions=[$('#manage-app-sections'),$('#android-settings')].filter(Boolean);
 if(active?.matches('#drawer-search')&&action==='up'){controllerFocus(topActions[0]);return true}
 if(topActions.includes(active)){
  const i=topActions.indexOf(active);
  if(action==='left'||action==='right')controllerFocus(topActions[Math.max(0,Math.min(topActions.length-1,i+(action==='right'?1:-1)))]);
  else if(action==='down')controllerFocus($('#drawer-search'));
  return true;
 }
 if(drawerView!=='home'||$('#drawer-search').value.trim()||$('#drawer-letter').value)return false;
 if(category){const i=categories.indexOf(category);lastAppSection=category.dataset.section;
  if(action==='left'||action==='right')controllerFocus(categories[Math.max(0,Math.min(categories.length-1,i+(action==='right'?1:-1)))]);
  else if(action==='down'||action==='up'){const rect=category.getBoundingClientRect(),cx=rect.left+rect.width/2;const next=categories.filter(c=>{const r=c.getBoundingClientRect();return action==='down'?r.top>rect.top+2:r.top<rect.top-2}).sort((a,b)=>{const score=c=>{const r=c.getBoundingClientRect();return Math.abs(r.top-rect.top)*100+Math.abs(r.left+r.width/2-cx)};return score(a)-score(b)})[0];controllerFocus(next||(action==='up'?$('#drawer-search'):drawerSection?$('#drawer-grid .drawer-app')||category:pins[0]||category));}
  return true;
 }
 if(dock){const i=pins.indexOf(dock);if(action==='up')controllerFocus(document.querySelector(`[data-section="${lastAppSection}"]`)||categories[0]);else if(action==='left'||action==='right')controllerFocus(pins[Math.max(0,Math.min(pins.length-1,i+(action==='right'?1:-1)))]);return true;}
 if(drawerSection&&active?.matches('#drawer-grid .drawer-app')){
  const cards=[...$('#drawer-grid').querySelectorAll('.drawer-app')],i=cards.indexOf(active),top=cards[0].getBoundingClientRect().top,cols=cards.filter(c=>Math.abs(c.getBoundingClientRect().top-top)<2).length;
  const step={left:-1,right:1,up:-cols,down:cols,pageUp:-cols*3,pageDown:cols*3}[action];controllerFocus(cards[Math.max(0,Math.min(cards.length-1,i+step))]);return true;
 }
 if(action==='pageUp'||action==='pageDown')return true;
 return false;
}

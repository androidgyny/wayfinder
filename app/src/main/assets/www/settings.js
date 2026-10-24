'use strict';
// Reuse the existing controls and handlers; organization never changes saved values.
let settingsSection='appearance';
const settingsFocus=new Map();
const settingsScroll=new Map();
const settingsPanels=new Map();
function settingsButton(id,text,action){const b=el('button','secondary',text);b.id=id;b.type='button';b.onclick=action;return b;}
function settingsSubmenu(id,title){
 const d=el('dialog','settings-submenu');d.id=id;d.setAttribute('aria-labelledby',id+'-title');
 const close=settingsButton('close-'+id,'×',()=>hideDialog('#'+id));close.className='close icon';close.setAttribute('aria-label','Close '+title);
 const h=el('h2','',title);h.id=id+'-title';d.append(close,h);document.body.append(d);
 d.addEventListener('cancel',e=>{e.preventDefault();hideDialog('#'+id)});return d;
}
function settingsRow(title,description,button){const row=el('div','settings-row'),copy=el('div');copy.append(el('h3','',title),el('p','',description));row.append(copy,button);return row;}
function settingsPanel(key,title){const p=el('section','settings-group');p.id='settings-'+key;p.setAttribute('aria-labelledby',p.id+'-heading');const h=el('h2','',title);h.id=p.id+'-heading';p.append(h);return p;}
function settingsActivePanel(){return settingsPanels.get(settingsSection)}
function selectSettingsSection(key,focus=false){
 if(!settingsPanels.has(key))return;
 const content=$('#settings-content'),changed=key!==settingsSection;
 if(changed&&content)settingsScroll.set(settingsSection,content.scrollTop);
 settingsSection=key;
 for(const [name,panel] of settingsPanels){panel.hidden=name!==key;const b=$('#settings-nav-'+name);b.setAttribute('aria-current',String(name===key));}
 if(focus)controllerFocus($('#settings-nav-'+key),true);
 refreshSettingsSummaries();refreshCupertinoControls();updateAppearancePreview();
 if(changed&&content)content.scrollTop=settingsScroll.get(key)||0;
}
function enterSettingsSection(){const p=settingsActivePanel(),remembered=settingsFocus.get(settingsSection);controllerFocus(focusableControl(remembered)?remembered:dialogControls(p)[0],true)}
function settingsOpened(){selectSettingsSection(settingsSection);controllerFocus($('#settings-nav-'+settingsSection),true)}
function settingsBack(){
 if(topDialog()?.id!=='settings-dialog')return false;
 if(!document.activeElement?.closest('#settings-navigation')){controllerFocus($('#settings-nav-'+settingsSection),true);return true;}
 return false;
}
function settingsController(action){
 if(topDialog()?.id!=='settings-dialog')return false;
 const nav=document.activeElement?.closest('#settings-navigation');
 if(nav){
  const buttons=[...nav.children],i=buttons.indexOf(document.activeElement);
  if(action==='up'||action==='down'){const b=buttons[Math.max(0,Math.min(buttons.length-1,i+(action==='down'?1:-1)))];selectSettingsSection(b.dataset.section,true);return true;}
  if(action==='activate'||action==='right'){enterSettingsSection();return true;}
  if(action==='left')return true;
 }
 if(action==='pageUp'||action==='pageDown'){
  const panel=settingsActivePanel(),controls=dialogControls(panel),i=controls.indexOf(document.activeElement);
  controllerFocus(controls[Math.max(0,Math.min(controls.length-1,i+(action==='pageDown'?5:-5)))],true);return true;
 }
 // Keep vertical navigation within the current section, never jumping into the rail.
 if(!nav&&(action==='up'||action==='down')){
  const controls=dialogControls(settingsActivePanel()),i=controls.indexOf(document.activeElement);
  controllerFocus(controls[Math.max(0,Math.min(controls.length-1,i+(action==='down'?1:-1)))],true);return true;
 }
 return false;
}
function refreshSettingsSummaries(){
 if(!$('#settings-current-look'))return;
 const snapshot=appearanceSnapshot(),matches=availableAppearancePresets().filter(p=>Object.entries(p.values).every(([k,v])=>k==='preserveOtherSettings'||(k==='sort'?sort:snapshot[k])===v));
 const chosen=matches.find(p=>p.name===$('#appearance-presets').value)||matches[matches.length-1];
 $('#settings-current-look').textContent=chosen?'Current look · '+chosen.name:'Current look · Custom';
 $('#settings-ai-summary').textContent=!$('#gemini-remove').disabled?'API key saved on this device':'Optional · No API key saved';
 $('#settings-startup-summary').textContent=($('#startup-enabled').checked?'On · ':'Off · ')+$('#startup-name').textContent;
}
function setupSettings(){
 const dialog=$('#settings-dialog'),appearance=$('#settings-appearance'),library=$('#settings-library'),sound=$('#settings-sound'),home=$('#settings-home'),help=$('#settings-help-heading').parentElement;
 const apps=settingsPanel('apps','Apps'),system=settingsPanel('system','System & help');
 apps.append($('#app-icon-pack').closest('.settings-row'),$('#refresh-icon-packs').closest('.settings-row'));
 system.append($('#set-default-launcher').closest('.settings-row'));
 const ai=settingsSubmenu('settings-ai-dialog','AI assistance');ai.append($('#gemini-settings'));
 const aiRow=settingsRow('AI assistance','',settingsButton('settings-open-ai','Configure…',()=>{aiKeyStatus();showDialog('#settings-ai-dialog')}));aiRow.querySelector('p').id='settings-ai-summary';system.append(aiRow);
 while(help.children.length>1)system.append(help.children[1]);help.remove();
 const startup=settingsSubmenu('settings-startup-dialog','Startup');
 while(home.children.length>1)startup.append(home.children[1]);home.remove();
 const startupRow=settingsRow('Startup','',settingsButton('settings-open-startup','Configure…',()=>showDialog('#settings-startup-dialog')));startupRow.querySelector('p').id='settings-startup-summary';sound.append(startupRow);$('#settings-sound-heading').textContent='Sound & startup';
 library.insertBefore($('#presentation-sort').closest('.settings-row'),library.children[1]);
 $('#presentation').closest('.settings-row').querySelector('h3').textContent='Layout';$('#presentation').setAttribute('aria-label','Layout');
 const preset=$('#preset-options'),manage=settingsSubmenu('settings-presets-dialog','Manage presets');
 const savedLabel=el('label','','Saved preset'),saved=el('select');saved.id='settings-saved-presets';saved.setAttribute('aria-label','Saved preset');savedLabel.append(saved);manage.append(savedLabel,$('#preset-delete'));
 saved.onchange=()=>{$('#appearance-presets').value=saved.value;$('#appearance-presets').dispatchEvent(new Event('change'));};
 manage.append(preset.querySelector('label[for=preset-name]'),$('#preset-name').parentElement);
 const note=[...preset.querySelectorAll('p')].find(p=>p.textContent.startsWith('Use an existing'));if(note)manage.append(note);
 const status=el('p','muted');status.id='settings-preset-feedback';status.setAttribute('role','status');manage.append(status);
 function openPresets(save){saved.replaceChildren(new Option('Choose a saved preset…',''),...appearancePresets.map(p=>new Option(p.name,p.name)));saved.value=appearancePresets.some(p=>p.name===$('#appearance-presets').value)?$('#appearance-presets').value:'';$('#preset-delete').disabled=!saved.value;status.textContent='';if(save)$('#preset-name').value='';showDialog('#settings-presets-dialog');if(save)controllerFocus($('#preset-name'),true);}
 const actions=el('div','preset-actions');actions.append(settingsButton('settings-save-look','Save as preset…',()=>openPresets(true)),settingsButton('settings-manage-presets','Manage presets…',()=>openPresets(false)));preset.append(actions);
 const current=el('p','muted');current.id='settings-current-look';preset.prepend(current);preset.querySelector('.settings-row p').textContent='Choose a look, then preview or apply it.';
 new MutationObserver(()=>{status.textContent=$('#preset-status').textContent;if(manage.open){const selected=$('#appearance-presets').value;saved.replaceChildren(new Option('Choose a saved preset…',''),...appearancePresets.map(p=>new Option(p.name,p.name)));saved.value=selected;}}).observe($('#preset-status'),{childList:true});
 const preview=$('#appearance-preview'),controls=el('div','settings-appearance-controls');preview.remove();while(appearance.children.length>1)controls.append(appearance.children[1]);
 const canvas=el('div','settings-appearance-body');canvas.append(controls,preview);appearance.append(canvas);
 for(const [id,text] of Object.entries({'art-fit':'Fit keeps the whole image; Fill crops to fill the tile.','palette':'Colors for your library.','typography':'Font for titles and headings.','cover-shadow':'Depth beneath covers.','cover-border':'An edge around covers.','cover-corners':'Artwork shape.','interface-contrast':'Definition of labels and separators.','title-weight':'Emphasis of game titles.'})){const p=$('#'+id).closest('.settings-row').querySelector('p');if(p)p.textContent=text;}
 const nav=el('nav');nav.id='settings-navigation';nav.setAttribute('aria-label','Settings sections');const body=el('div');body.id='settings-content';
 for(const [key,title,panel] of [['appearance','Appearance',appearance],['library','Library',library],['apps','Apps',apps],['sound','Sound & startup',sound],['system','System & help',system]]){
  settingsPanels.set(key,panel);const b=settingsButton('settings-nav-'+key,title,()=>{selectSettingsSection(key);enterSettingsSection()});b.dataset.section=key;b.setAttribute('aria-controls',panel.id);nav.append(b);body.append(panel);
 }
 const shell=el('div');shell.id='settings-shell';shell.append(nav,body);dialog.append(shell);dialog.setAttribute('aria-label','Settings');
 nav.addEventListener('focusin',e=>{const key=e.target.dataset.section;if(key&&key!==settingsSection)selectSettingsSection(key)});
 const hint=el('p','muted','A · Open    B · Back');hint.id='settings-navigation-hint';dialog.append(hint);
 body.addEventListener('focusin',e=>{if(settingsActivePanel()?.contains(e.target))settingsFocus.set(settingsSection,e.target)});
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(!settingsBack())hideDialog('#settings-dialog')});
 dialog.addEventListener('change',refreshSettingsSummaries);dialog.addEventListener('input',refreshSettingsSummaries);dialog.addEventListener('click',refreshSettingsSummaries);for(const d of [manage,ai,startup])d.addEventListener('close',refreshSettingsSummaries);
 selectSettingsSection('appearance');
}
setupSettings();

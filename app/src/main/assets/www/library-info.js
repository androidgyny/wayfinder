'use strict';
let libraryInfoRequest=0,libraryInfoData=null,libraryInfoView=null,libraryInfoHomePlace=null,libraryInfoPendingRender=false;
const infoRoot=()=>$('#library-info-content');
const infoTitleOrder=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
let libraryInfoListSignature=null;
const infoShortcut=g=>g.kind==='shortcut'||!!g.intentUri;
function infoButton(label,value,action,key=label){const b=el('button','secondary library-info-row');b.dataset.infoKey=key;b.append(el('span','',label),el('span','',Number(value).toLocaleString()));b.onclick=action;return b;}
function infoBytes(n){if(!Number.isFinite(n))return 'Unavailable';return n<1048576?(n/1024).toFixed(0)+' KB':(n/1048576).toFixed(1)+' MB';}
function infoPlace(){
 const dialog=$('#library-info'),focus=document.activeElement,row=focus?.closest('.library-info-game');
 return {scroll:dialog.scrollTop,key:dialog.contains(focus)?focus.dataset.infoKey||focus.id:null,row:row?[...infoRoot().querySelectorAll('.library-info-game')].indexOf(row):-1,action:focus?.dataset.infoAction};
}
function restoreInfoPlace(place,fallback){
 const dialog=$('#library-info');dialog.scrollTop=place?.scroll||0;
 if(topDialog()!==dialog)return;
 let target=place?.key?[...dialog.querySelectorAll('[data-info-key],[id]')].find(b=>(b.dataset.infoKey||b.id)===place.key):null;
 if(!target&&place?.row>=0){const rows=[...infoRoot().querySelectorAll('.library-info-game')],row=rows[Math.min(place.row,rows.length-1)];target=[...row?.querySelectorAll('button')||[]].find(b=>b.dataset.infoAction===place.action);}
 if(!target&&place?.key)target=fallback;
 if(target)target.focus({preventScroll:true});
}
function infoList(label,predicate,artwork=false){libraryInfoHomePlace=infoPlace();libraryInfoView={label,predicate,artwork};renderInfoList(false);}
function infoHome(){libraryInfoView=null;renderLibraryInfo(libraryInfoHomePlace);}
function renderInfoList(preserve=true){
 const root=infoRoot(),view=libraryInfoView;
 const unavailable=view.artwork&&!Array.isArray(libraryInfoData?.missing);
 const list=unavailable?[]:games.filter(view.predicate).sort((a,b)=>infoTitleOrder.compare(a.title,b.title));
 const signature=JSON.stringify([view.label,unavailable?!!libraryInfoData:null,list.map(g=>[g.id,g.title,g.genre,g.image])]);
 if(preserve&&signature===libraryInfoListSignature)return;
 libraryInfoListSignature=signature;const place=preserve?infoPlace():null;root.replaceChildren();const back=el('button','secondary','← Library info');back.dataset.infoKey='home';back.onclick=infoHome;root.append(back);
 root.append(el('h3','',view.label+(unavailable?'':' · '+list.length.toLocaleString())));
 if(unavailable){root.append(el('p','muted',libraryInfoData?'Artwork check unavailable. Please try again.':'Checking artwork…'));if(libraryInfoData){const retry=el('button','secondary','Retry artwork check');retry.dataset.infoKey='retry';retry.onclick=refreshLibraryInfo;root.append(retry);}}
 else if(!list.length)root.append(el('p','muted','No games in this group.'));
 for(const g of list){const row=el('div','library-info-game'),img=el('img');row.dataset.gameId=String(g.id);img.src=g.image;img.alt='';img.loading='lazy';img.onerror=()=>{img.hidden=true;};const title=el('div','',g.title);title.append(el('small','',g.genre));const playButton=el('button','secondary','Play'),edit=el('button','secondary','Edit');for(const [b,action] of [[playButton,'play'],[edit,'edit']]){b.dataset.infoKey=action+':'+g.id;b.dataset.infoAction=action;}playButton.setAttribute('aria-label','Play '+g.title);edit.setAttribute('aria-label','Edit '+g.title);playButton.onclick=()=>play(g.id,playButton);edit.onclick=()=>editGame(g);row.append(img,title,playButton,edit);root.append(row);}
 if(preserve)restoreInfoPlace(place,back);else{$('#library-info').scrollTop=0;if(topDialog()?.id==='library-info')back.focus({preventScroll:true});}
}
function renderLibraryInfo(place=infoPlace()){
 libraryInfoListSignature=null;const root=infoRoot();root.replaceChildren();const stats=el('div','library-info-stats');
 const stat=(label,count,action)=>{const b=el('button','secondary');b.dataset.infoKey='stat:'+label;b.append(el('strong','',count.toLocaleString()),el('span','',label));b.onclick=action;stats.append(b);};
 stat('Games',games.length,()=>infoList('All games',()=>true));stat('Categories',genres.length,()=>{const heading=$('#info-categories');heading.scrollIntoView({block:'start'});root.querySelector('#info-category-list button')?.focus({preventScroll:true});});stat('Favorites',games.filter(g=>g.favorite).length,()=>infoList('Favorites',g=>g.favorite===true));root.append(stats);
 root.append(el('h3','','Collection'));
 for(const [label,predicate] of [['Android games',g=>!infoShortcut(g)],['Shortcuts',infoShortcut]])root.append(infoButton(label,games.filter(predicate).length,()=>infoList(label,predicate)));
 root.append(el('h3','','Artwork'));const data=libraryInfoData;
 if(data?.missing){for(const [label,predicate] of [['Cover artwork',g=>!libraryInfoData?.missing?.includes(String(g.id))&&!libraryInfoData?.icons?.includes(String(g.id))],['App icons',g=>libraryInfoData?.icons?.includes(String(g.id))],['Missing images',g=>libraryInfoData?.missing?.includes(String(g.id))]])root.append(infoButton(label,games.filter(predicate).length,()=>infoList(label,predicate,true)));}
 else root.append(el('p','muted',data?'Artwork check unavailable. Reopen Library info to retry.':native?.libraryInfo?'Checking artwork…':'Artwork and storage checks are available in the Android app.'));
 root.append(el('h3','','Storage'));const storage=el('dl');for(const [label,value] of [['Saved artwork',data?.coverBytes],['Library data & settings',data?.dataBytes]]){const row=el('div','library-info-storage');row.append(el('dt','',label),el('dd','',infoBytes(value)));storage.append(row);}root.append(storage,el('p','muted','Excludes installed games and media included with Wayfinder. Your custom backgrounds, music, fonts, and startup videos are also excluded.'));
 root.append(el('h3','','Backup'),el('p','muted',data?.lastBackup?'Last successful export: '+new Date(data.lastBackup).toLocaleString():'No successful export recorded. Older exports were not tracked.'));
 const backup=el('button','secondary','Back up library');backup.dataset.infoKey='backup';backup.disabled=!native?.backup;backup.onclick=()=>native.backup();root.append(backup);
 const heading=el('h3','','Categories');heading.id='info-categories';const categories=el('div');categories.id='info-category-list';for(const name of genres)categories.append(infoButton(name,counts[name],()=>infoList(name,g=>g.genre===name),'category:'+name));root.append(heading,categories);
 restoreInfoPlace(place,stats.querySelector('button'));
}
// List navigation only needs the neighboring row, even in a very large library.
function libraryInfoController(action){
 const button=document.activeElement,row=button?.closest('.library-info-game');
 if(!row||!['up','down','left','right'].includes(action))return false;
 document.body.dataset.input='controller';let target;
 if(action==='left'||action==='right')target=row.querySelector('[data-info-action="'+(action==='left'?'play':'edit')+'"]');
 else{const next=action==='up'?row.previousElementSibling:row.nextElementSibling;
  if(next?.matches('.library-info-game'))target=next.querySelector('[data-info-action="'+button.dataset.infoAction+'"]');
  else if(action==='up')target=infoRoot().querySelector('[data-info-key="home"]');
 }
 if(target)controllerFocus(target);return true;
}
function paintLibraryInfo(){if(!$('#library-info').open)return;if(topDialog()?.id!=='library-info'){libraryInfoPendingRender=true;return;}libraryInfoPendingRender=false;if(libraryInfoView)renderInfoList();else renderLibraryInfo();}
function requestLibraryInfo(){if(native?.libraryInfo)native.libraryInfo(String(++libraryInfoRequest));}
function refreshLibraryInfo(){libraryInfoData=null;paintLibraryInfo();requestLibraryInfo();}
$('#open-library-info').onclick=()=>{libraryInfoView=null;libraryInfoHomePlace=null;libraryInfoPendingRender=false;showDialog('#library-info');$('#library-info').scrollTop=0;refreshLibraryInfo();};
$('#close-library-info').onclick=()=>hideDialog('#library-info');
$('#library-info').addEventListener('cancel',e=>{e.preventDefault();hideDialog('#library-info');});
const previousInfoEvent=window.nativeEvent;
window.nativeEvent=(event,data)=>{if(event==='libraryInfo'){if(data.request!==String(libraryInfoRequest))return;libraryInfoData=data;paintLibraryInfo();return;}if(event==='backupCompleted'&&$('#library-info').open){requestLibraryInfo();return;}previousInfoEvent(event,data);};
// Preserve the selected row and scroll position as nested editors and async checks finish.
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{if(!$('#library-info').open)return;setTimeout(()=>{if(!$('#library-info').open)return;if(libraryInfoPendingRender)paintLibraryInfo();},0);});
window.addEventListener('librarychange',()=>{if($('#library-info').open){paintLibraryInfo();requestLibraryInfo();}});
const infoPreviousBack=window.nativeBack;
window.nativeBack=()=>{if(topDialog()?.id==='library-info'&&libraryInfoView){infoHome();return true;}return infoPreviousBack();};

let packPickerIcons=[],packPickerPage=0,packPickerToken=0,packPickerLoading=false;
function initManualPackPicker(){
 $('#appearance-choose').onclick=()=>{if(!appearanceDraft)return;const options=availableIconPacks;if(!options.length){window.chooseAppImage?.();return;}$('#pack-picker-source').replaceChildren(...options.map(p=>{const o=el('option','',p.title);o.value=p.package;return o}));const preferred=options.some(p=>p.package===lastIconPack)?lastIconPack:appearanceDraft?.packIcon?.pack||appIconPack;if(options.some(p=>p.package===preferred))$('#pack-picker-source').value=preferred;$('#pack-picker-search').value='';showDialog('#pack-icon-picker');loadPackCatalog()};
 $('#pack-picker-file').onclick=()=>{if(!appearanceDraft)return;hideDialog('#pack-icon-picker');window.chooseAppImage?.();};
 $('#pack-picker-close').onclick=()=>hideDialog('#pack-icon-picker');
 $('#pack-icon-picker').addEventListener('close',()=>{if($('#pack-icon-picker').open)return;packPickerToken++;packPickerIcons=[]});
 $('#pack-picker-source').onchange=()=>{lastIconPack=$('#pack-picker-source').value;persist();loadPackCatalog();};
 $('#pack-picker-search').oninput=()=>{packPickerPage=0;renderPackCatalog()};
 $('#pack-picker-prev').onclick=()=>{packPickerPage--;renderPackCatalog()};$('#pack-picker-next').onclick=()=>{packPickerPage++;renderPackCatalog()};
}
function loadPackCatalog(){packPickerIcons=[];packPickerPage=0;packPickerLoading=!!$('#pack-picker-source').value;const token=String(++packPickerToken);renderPackCatalog();if(packPickerLoading){if(native?.iconPackCatalog)native.iconPackCatalog($('#pack-picker-source').value,token);else receivePackCatalog({token,error:'Icon packs are available on the Android device.'})}}
function receivePackCatalog(data){if(data.token!==String(packPickerToken)||!$('#pack-icon-picker').open)return;packPickerLoading=false;packPickerIcons=data.icons||[];renderPackCatalog();if(data.error)$('#pack-picker-status').textContent=data.error;}
function renderPackCatalog(){
 const q=$('#pack-picker-search').value.toLowerCase().trim(),icons=packPickerIcons.filter(n=>n.replaceAll('_',' ').toLowerCase().includes(q)),pack=$('#pack-picker-source').value;
 const pages=Math.ceil(icons.length/48);packPickerPage=Math.max(0,Math.min(packPickerPage,pages-1));
 $('#pack-picker-grid').replaceChildren(...icons.slice(packPickerPage*48,(packPickerPage+1)*48).map(name=>{const b=el('button','pack-icon-choice'),im=el('img');im.src='app-icon/'+appearanceDraft.package+'?pack='+encodeURIComponent(pack)+'&drawable='+encodeURIComponent(name)+'&preview=1';im.onerror=()=>{b.disabled=true;b.title=name+' — unavailable in this pack';b.setAttribute('aria-label',name.replaceAll('_',' ')+' — unavailable');im.hidden=true;if(!b.querySelector('.pack-icon-unavailable')){const placeholder=el('span','pack-icon-unavailable','Unavailable');b.prepend(placeholder);}};im.alt='';im.loading='lazy';b.append(im,el('span','',name.replaceAll('_',' ')));b.title=name;b.onclick=()=>{if(!appearanceDraft)return;delete appearanceDraft.image;appearanceDraft.packIcon={pack,name};lastIconPack=pack;persist();$('#appearance-image').src=appImagePreference(appearanceDraft,appearanceDraft.package);hideDialog('#pack-icon-picker')};return b}));
 $('#pack-picker-status').textContent=packPickerLoading?'Loading icons…':!pack?'Install a pack, then use Settings → Appearance → Refresh packs.':icons.length?icons.length.toLocaleString()+' icons':'No matching icons.';
 $('#pack-picker-page').textContent=pages?(packPickerPage+1)+' / '+pages:'';$('#pack-picker-prev').disabled=packPickerLoading||packPickerPage===0;$('#pack-picker-next').disabled=packPickerLoading||packPickerPage+1>=pages;
}

function packPickerController(action){
 if(action==='search'){controllerFocus($('#pack-picker-search'));native?.showKeyboard?.();return true;}
 if(action==='pageUp'||action==='pageDown'){const button=$(action==='pageDown'?'#pack-picker-next':'#pack-picker-prev');if(!button.disabled){button.click();controllerFocus($('#pack-picker-grid button:not(:disabled)')||$('#pack-picker-search'));}return true;}
 return false;
}

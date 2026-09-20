const builtinAppearancePresets=[{"name":"Default","values":{"presentation":"library","palette":"portal","typography":"clean","coverGlow":false,"backdrop":"flat","selectionStyle":"outline","artFit":"cover","size":"comfortable","cupertinoReflections":"subtle","cupertinoSpacing":"airy","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"above","viennaSeparators":"lines","coverCorners":"soft","coverBrightness":"even","menuButtons":"all","coverBorder":"none","interfaceContrast":"soft","titleWeight":"medium"}},{"name":"Fan Favorite","values":{"presentation":"venice","palette":"terracotta","typography":"outfit","coverGlow":false,"backdrop":"flat","selectionStyle":"underline","artFit":"cover","size":"comfortable","cupertinoReflections":"subtle","cupertinoSpacing":"airy","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"above","viennaSeparators":"lines","coverCorners":"soft","coverBrightness":"even","menuButtons":"selected","coverBorder":"hairline","interfaceContrast":"soft","titleWeight":"medium","backgroundColor":"original","backgroundDim":60}},{"name":"Folio Nova","values":{"presentation":"vienna","palette":"parchment","typography":"clean","coverGlow":false,"backdrop":"flat","selectionStyle":"underline","artFit":"cover","size":"comfortable","cupertinoReflections":"subtle","cupertinoSpacing":"airy","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"above","viennaSeparators":"space","coverCorners":"square","coverBrightness":"even","menuButtons":"selected","coverBorder":"none","interfaceContrast":"soft","titleWeight":"bold","backgroundColor":"original","backgroundDim":60}},{"name":"iTomes","values":{"presentation":"cupertino","palette":"graphite","typography":"clean","coverGlow":false,"backdrop":"flat","selectionStyle":"underline","artFit":"cover","size":"comfortable","cupertinoReflections":"classic","cupertinoSpacing":"compact","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"below","viennaSeparators":"space","coverCorners":"square","coverBrightness":"even","menuButtons":"selected","coverBorder":"hairline","interfaceContrast":"soft","titleWeight":"medium"}},{"name":"Launchbiz","values":{"presentation":"library","palette":"graphite","typography":"clean","coverGlow":false,"backdrop":"flat","selectionStyle":"outline","artFit":"cover","size":"compact","cupertinoReflections":"classic","cupertinoSpacing":"compact","berlinCoverSize":94.12526293442204,"kyotoTitlePlacement":"below","cupertinoTitlePlacement":"below","viennaSeparators":"space","coverCorners":"square","coverBrightness":"dimmed","menuButtons":"selected","coverBorder":"hairline","interfaceContrast":"crisp","titleWeight":"medium"}},{"name":"Minuet","values":{"presentation":"ulm","palette":"graphite","typography":"nunito","coverGlow":false,"backdrop":"flat","selectionStyle":"outline","artFit":"contain","size":"comfortable","cupertinoReflections":"subtle","cupertinoSpacing":"airy","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"above","viennaSeparators":"lines","coverCorners":"square","coverBrightness":"even","menuButtons":"selected","coverBorder":"none","interfaceContrast":"crisp","titleWeight":"medium","ulmArtwork":false,"backgroundColor":"original","backgroundDim":60}},{"name":"Niagaramond","values":{"presentation":"oxford","palette":"parchment","typography":"editorial","coverGlow":false,"backdrop":"flat","selectionStyle":"underline","artFit":"cover","size":"comfortable","cupertinoReflections":"subtle","cupertinoSpacing":"airy","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"above","viennaSeparators":"space","coverCorners":"soft","coverBrightness":"even","menuButtons":"selected","coverBorder":"none","interfaceContrast":"soft","titleWeight":"regular"}},{"name":"Playrite","values":{"presentation":"berlin","palette":"midnight","typography":"clean","coverGlow":false,"backdrop":"flat","selectionStyle":"outline","artFit":"cover","size":"compact","cupertinoReflections":"subtle","cupertinoSpacing":"airy","berlinCoverSize":144,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"above","viennaSeparators":"lines","coverCorners":"square","coverBrightness":"even","menuButtons":"selected","coverBorder":"none","interfaceContrast":"crisp","titleWeight":"bold"}},{"name":"Title Commander","values":{"preserveOtherSettings":true,"presentation":"cambridge","palette":"amber","titleWeight":"regular","interfaceContrast":"crisp","cambridgeArtwork":true,"artFit":"cover","coverCorners":"square","coverBorder":"hairline","coverGlow":false,"backdrop":"flat"}}];
let coverBorder='none',interfaceContrast='soft',titleWeight='medium';
let coverCorners='soft',coverBrightness='dimmed',menuButtons='all',menuTouchId=null,appearancePresets=[];
// Appearance stays independent of palette and layout. Only the selected image is sampled.
let viennaSeparators='lines';
let backdrop='flat',selectionStyle='outline';
let typography='computer',coverGlow=true,cupertinoReflections='subtle',cupertinoSpacing='airy',berlinCoverSize=120,kyotoTitlePlacement='above',cupertinoTitlePlacement='above';
const glowColors=new Map();let glowTimer=0,glowCard=null,hoverGlowCard=null;
let customFontInfo={},customFontFace=null,customFontRequest=0;
function refreshCustomFont(){try{customFontInfo=native?.customFontSettings?JSON.parse(native.customFontSettings()):{}}catch{customFontInfo={}}$('#custom-font-name').textContent=customFontInfo.name||'No font selected';}
function chooseCustomFont(){if(native?.chooseCustomFont)native.chooseCustomFont();else toast('Choose a font in the Android app');}
async function loadCustomFont(info,candidate=false){
 const request=++customFontRequest;
 try{
  if(!/^font\/[a-f0-9-]{36}\.(ttf|otf)$/.test(info.url||''))throw Error('Choose a custom font first');
  const face=new FontFace('WayfinderCustom'+request,'url("'+info.url+'")');await face.load();
  if(request!==customFontRequest){if(candidate)native?.discardCustomFont?.(info.file);return;}
  if(candidate&&!native.acceptCustomFont(info.file))throw Error('Could not save the font');
  document.fonts.add(face);if(customFontFace)document.fonts.delete(customFontFace);customFontFace=face;customFontInfo=info;
  document.body.style.setProperty('--custom-font-family','"'+face.family+'",sans-serif');
  typography='custom';document.body.dataset.typography=typography;$('#typography').value=typography;$('#custom-font-controls').hidden=presentation==='cambridge';$('#custom-font-name').textContent=info.name||'Custom font';
  sizePresentation();persist();if(candidate)toast('Custom font applied');
 }catch(e){if(candidate)native?.discardCustomFont?.(info.file);if(request===customFontRequest){$('#typography').value=typography;toast(e.message==='Choose a custom font first'?e.message:'Could not load this font. Try another TTF or OTF file.');}}
}
function setTypography(value){
 if(value==='exo2')value='clean';
 if(value==='custom'){refreshCustomFont();if(customFontInfo.url){loadCustomFont(customFontInfo);return;}value='clean';toast('Choose a custom font to use this preset');}
 customFontRequest++;typography=['computer','editorial','clean','spacegrotesk','outfit','oxanium','spacemono','ibmplexsans','nunito'].includes(value)?value:'computer';document.body.dataset.typography=typography;$('#typography').value=typography;$('#custom-font-controls').hidden=true;persist();
}

function setCoverGlow(value){coverGlow=value!==false;document.body.dataset.coverGlow=String(coverGlow);$('#cover-glow').value=coverGlow?'subtle':'off';queueCoverGlow();persist();}
function queueCoverGlow(){clearTimeout(glowTimer);glowTimer=setTimeout(()=>{updateCoverGlow();updateAppearancePreview();syncCupertinoPreviewAppearance()},100);}
function coverColor(img){
 const key=img.currentSrc||img.src;if(glowColors.has(key))return glowColors.get(key);
 if(!img.complete||!img.naturalWidth)return null;
 try{
  const canvas=document.createElement('canvas');canvas.width=12;canvas.height=18;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,12,18);
  const pixels=ctx.getImageData(0,0,12,18).data,buckets=new Map();
  for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2],hi=Math.max(r,g,b),lo=Math.min(r,g,b);if(pixels[i+3]<128||hi<45||lo>225)continue;
   const weight=.15+(hi-lo)/255,key=[r>>5,g>>5,b>>5].join(',');const item=buckets.get(key)||{weight:0,r:0,g:0,b:0};item.weight+=weight;item.r+=r*weight;item.g+=g*weight;item.b+=b*weight;buckets.set(key,item);
  }
  const best=[...buckets.values()].sort((a,b)=>b.weight-a.weight)[0];if(!best)return null;
  const rgb=[best.r,best.g,best.b].map(v=>Math.round(v/best.weight));const boost=Math.max(1,200/Math.max(...rgb));const color=rgb.map(v=>Math.min(255,Math.round(v*boost))).join(',');
  if(glowColors.size>=128)glowColors.delete(glowColors.keys().next().value);glowColors.set(key,color);return color;
 }catch{return null;}
}
function updateCoverGlow(){
 if(presentation==='cambridge'){syncCambridgeCover();return;}if(presentation==='ulm'){syncUlmCoverAppearance();return;}
 const grid=$('#grid');if(grid.classList.contains('fluid-motion'))return;
 const carousel=['kyoto','cupertino','tokyo','vienna','prague','copenhagen','oxford','berlin','venice'].includes(presentation);
 const selected=carousel?grid.querySelector('.presentation-selected'):(document.body.dataset.input!=='controller'&&hoverGlowCard?.isConnected?hoverGlowCard:document.activeElement?.closest('#grid .game')||grid.querySelector('.controller-selected')||grid.querySelector('.game'));
 if(glowCard!==selected){glowCard?.classList.remove('glow-selected');glowCard=selected;if(selected)selected.classList.add('glow-selected');}
 const preview=$('#tokyo-art');const img=presentation==='oxford'?preview:selected?.querySelector('.cover img');
 const color=img?coverColor(img):null;
 if(backdrop==='gradient'){const layer=$('#soft-gradient'),rgb=color||'128,128,128';if(layer.style.getPropertyValue('--backdrop-rgb')!==rgb)layer.style.setProperty('--backdrop-rgb',rgb);if($('#settings-dialog').open)$('#appearance-preview').style.setProperty('--backdrop-rgb',rgb);}
 if(selected){if(color)selected.style.setProperty('--cover-glow-rgb',color);else selected.style.removeProperty('--cover-glow-rgb');}
 preview.classList.toggle('glow-selected',(presentation==='tokyo'||presentation==='oxford')&&!!selected);
 if(color)preview.style.setProperty('--cover-glow-rgb',color);else preview.style.removeProperty('--cover-glow-rgb');
}
function setAtmosphere(background,selection){
 // Retire the experimental layered renderer; preserve the same scene and controls.
 if(background==='fortlayers')background='fort';
 backdrop=['gradient','custom','mountain','magical','urban','alien','another','fort','forest','underwater','digital','fireflies','contours'].includes(background)?background:'flat';selectionStyle=['outline','underline','glow'].includes(selection)?selection:'outline';
 document.body.dataset.backdrop=backdrop;document.body.dataset.selectionStyle=selectionStyle;
 $('#backdrop').value=backdrop;$('#selection-style').value=selectionStyle;syncCustomBackground();queueCoverGlow();persist();
}
function setViennaSeparators(value){viennaSeparators=value==='space'?'space':'lines';document.body.dataset.viennaSeparators=viennaSeparators;$('#vienna-separators').value=viennaSeparators;persist();}
function initAppearance(value){
 setCambridgeArtwork(value.cambridgeArtwork,false);setUlmArtwork(value.ulmArtwork,false);
 setLightAppearance(value.coverBorder,value.interfaceContrast,value.titleWeight);
 for(const id of ['cover-border','interface-contrast','title-weight'])$('#'+id).onchange=()=>{setLightAppearance($('#cover-border').value,$('#interface-contrast').value,$('#title-weight').value);effect('select');};
 initCustomBackground(value);
 appearancePresets=Array.isArray(value.appearancePresets)?value.appearancePresets.filter(p=>p&&typeof p.name==='string'&&p.values&&typeof p.values==='object').slice(0,10):[];
 setCoverOptions(value.coverCorners,value.coverBrightness,value.menuButtons);refreshPresets();
 $('#cover-corners').onchange=$('#cover-brightness').onchange=$('#menu-buttons').onchange=()=>{setCoverOptions($('#cover-corners').value,$('#cover-brightness').value,$('#menu-buttons').value);effect('select')};
 $('#preset-save').onclick=saveAppearancePreset;$('#preset-apply').onclick=applyAppearancePreset;$('#preset-preview').onclick=auditionAppearancePreset;$('#audition-keep').onclick=()=>finishAppearanceAudition(true);$('#audition-revert').onclick=()=>finishAppearanceAudition(false);$('#preset-audition').addEventListener('cancel',e=>{e.preventDefault();finishAppearanceAudition(false)});$('#preset-delete').onclick=deleteAppearancePreset;
 $('#appearance-presets').onchange=()=>{$('#preset-name').value=$('#appearance-presets').value;refreshPresetButtons()};

 setViennaSeparators(value.viennaSeparators);$('#vienna-separators').onchange=e=>{setViennaSeparators(e.target.value);effect('select')};
 setAtmosphere(value.backdrop,value.selectionStyle);
 $('#backdrop').onchange=$('#selection-style').onchange=()=>{setAtmosphere($('#backdrop').value,$('#selection-style').value);if(backdrop==='custom'&&!backgroundInfo.url)$('#background-choose').click();effect('select')};
 berlinCoverSize=Math.max(64,Math.min(200,Number(value.berlinCoverSize)||120));kyotoTitlePlacement=value.kyotoTitlePlacement==='below'?'below':'above';cupertinoTitlePlacement=value.cupertinoTitlePlacement==='below'?'below':'above';
 refreshLayoutControls();
 $('#berlin-cover-size').oninput=e=>setBerlinCoverSize(e.target.value);
 $('#title-placement').onchange=e=>{if(presentation==='kyoto')kyotoTitlePlacement=e.target.value;else cupertinoTitlePlacement=e.target.value;refreshLayoutControls();sizePresentation();persist();effect('select')};
 setTypography(value.typography);setCoverGlow(value.coverGlow);setCupertinoOptions(value.cupertinoReflections,value.cupertinoSpacing);
 $('#cupertino-reflections').onchange=$('#cupertino-spacing').onchange=()=>{setCupertinoOptions($('#cupertino-reflections').value,$('#cupertino-spacing').value);effect('select')};
 const sample=$('.appearance-sample img');sample.hidden=true;sample.addEventListener('load',()=>{sample.hidden=false;updateAppearancePreview();$('#appearance-preview').style.setProperty('--cover-glow-rgb',coverColor(sample)||'150,160,150')});sample.addEventListener('error',()=>{sample.hidden=true});
 new MutationObserver(()=>{updateAppearancePreview();syncCupertinoPreviewAppearance()}).observe(document.body,{attributes:true,attributeFilter:['data-cover-border','data-cover-corners','data-cover-glow','data-art-fit','data-palette','data-presentation','data-backdrop','data-background-color','data-selection-style','data-cover-brightness','data-title-weight','style']});
 window.addEventListener('resize',updateAppearancePreview);
 new MutationObserver(()=>{refreshCupertinoControls();refreshApplicableAppearanceControls();updateAppearancePreview();if(!$('#settings-dialog').open)document.querySelectorAll('.preview-backdrop').forEach(image=>image.removeAttribute('src'))}).observe($('#settings-dialog'),{attributes:true,attributeFilter:['open']});
 refreshCustomFont();$('#custom-font-choose').onclick=chooseCustomFont;$('#typography').onchange=e=>{if(e.target.value==='custom'){refreshCustomFont();if(customFontInfo.url)setTypography('custom');else{$('#typography').value=typography;chooseCustomFont();}}else setTypography(e.target.value);effect('select')};$('#cover-glow').onchange=e=>setCoverGlow(e.target.value==='subtle');
 const grid=$('#grid');new MutationObserver(queueCoverGlow).observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['class','src']});
 $('#tokyo-art').addEventListener('load',queueCoverGlow);grid.addEventListener('load',queueCoverGlow,true);grid.addEventListener('focusin',queueCoverGlow);
 grid.addEventListener('pointerover',e=>{if(e.pointerType==='mouse'&&document.body.dataset.input!=='controller'){hoverGlowCard=e.target.closest('.game');queueCoverGlow();}});
 grid.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&(e.movementX||e.movementY)){document.body.dataset.input='pointer';const card=e.target.closest('.game');if(hoverGlowCard!==card){hoverGlowCard=card;queueCoverGlow();}}});
 grid.addEventListener('pointerleave',()=>{hoverGlowCard=null;queueCoverGlow();});
}

function cupertinoPitch(){return cupertinoSpacing==='airy'?.82:.63;}
function cupertinoGap(){return cupertinoSpacing==='airy'?64:42;}
function setCupertinoOptions(reflections,spacing){
 stopCarouselMotion();cupertinoReflections=['off','subtle','classic'].includes(reflections)?reflections:'subtle';cupertinoSpacing=spacing==='compact'?'compact':'airy';
 document.body.dataset.cupertinoReflections=cupertinoReflections;document.body.dataset.cupertinoSpacing=cupertinoSpacing;
 document.body.style.setProperty('--cupertino-pitch',cupertinoPitch());document.body.style.setProperty('--cupertino-gap',cupertinoGap()+'px');
 $('#cupertino-reflections').value=cupertinoReflections;$('#cupertino-spacing').value=cupertinoSpacing;refreshCupertinoControls();persist();
}
function refreshCupertinoControls(){
 refreshLayoutControls();
 const section=$('#cupertino-options');section.hidden=presentation!=='cupertino';if(section.hidden||!$('#settings-dialog').open)return;
 const preview=$('#cupertino-preview'),index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 preview.replaceChildren();
 for(let offset=-2;offset<=2;offset++){
  const g=filtered[index+offset];const tile=el('div','cupertino-preview-tile');tile.style.setProperty('--preview-offset',offset);tile.style.setProperty('--preview-side',Math.sign(offset));tile.style.setProperty('--preview-distance',Math.abs(offset));tile.style.zIndex=3-Math.abs(offset);
  if(g){const img=el('img');img.src=g.image;img.alt='';tile.append(img);}else tile.classList.add('preview-placeholder');
  if(!offset)tile.classList.add('preview-selected');preview.append(tile);
 }
 $('#cupertino-preview-caption').textContent=filtered[index]?.title||'Preview · add games to see your covers here';syncCupertinoPreviewAppearance();syncPreviewBackdrop();
}

function refreshLayoutControls(){
 $('#cambridge-options').hidden=presentation!=='cambridge';$('#ulm-options').hidden=presentation!=='ulm';
 $('#vienna-options').hidden=presentation!=='vienna';
 const carousel=presentation==='kyoto'||presentation==='cupertino';
 $('#title-placement-options').hidden=!carousel;$('#berlin-options').hidden=presentation!=='berlin';
 const placement=presentation==='kyoto'?kyotoTitlePlacement:cupertinoTitlePlacement;
 document.body.dataset.titlePlacement=carousel?placement:'above';$('#title-placement').value=placement;
 $('#berlin-cover-size').value=berlinCoverSize;
 refreshApplicableAppearanceControls();
}
function setBerlinCoverSize(value,save=true){
 berlinCoverSize=Math.max(64,Math.min(200,Number(value)||120));$('#berlin-cover-size').value=berlinCoverSize;
 if(presentation==='berlin')renderBerlin();if(save)persist();
}

function setCoverOptions(corners,brightness,menus){
 coverCorners=['square','soft','rounded'].includes(corners)?corners:'soft';coverBrightness=brightness==='even'?'even':'dimmed';menuButtons=menus==='selected'?'selected':'all';
 document.body.dataset.coverCorners=coverCorners;document.body.dataset.coverBrightness=coverBrightness;document.body.dataset.menuButtons=menuButtons;
 $('#cover-corners').value=coverCorners;$('#cover-brightness').value=coverBrightness;$('#menu-buttons').value=menuButtons;persist();
}
function appearanceSnapshot(){return {cambridgeArtwork,ulmArtwork,coverBorder,interfaceContrast,titleWeight,presentation,palette,typography,coverGlow,backdrop,backgroundDim,backgroundColor,selectionStyle,artFit,size,cupertinoReflections,cupertinoSpacing,berlinCoverSize,kyotoTitlePlacement,cupertinoTitlePlacement,viennaSeparators,coverCorners,coverBrightness,menuButtons}}
function availableAppearancePresets(){return [...builtinAppearancePresets.filter(b=>!appearancePresets.some(p=>p.name.toLowerCase()===b.name.toLowerCase())),...appearancePresets].sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base',numeric:true}))}
function refreshPresetButtons(){const name=$('#appearance-presets').value;$('#preset-apply').disabled=!availableAppearancePresets().some(p=>p.name===name);$('#preset-preview').disabled=$('#preset-apply').disabled;$('#preset-delete').disabled=!appearancePresets.some(p=>p.name===name);const preset=availableAppearancePresets().find(p=>p.name===name);$('#preset-origin').textContent=preset?(builtinAppearancePresets.includes(preset)?'Built-in preset':'Your saved preset'):'';}
function refreshPresets(selected=''){
 const select=$('#appearance-presets');select.replaceChildren(new Option('Choose a preset…',''));for(const p of availableAppearancePresets())select.add(new Option(p.name,p.name));select.value=selected;refreshPresetButtons();
}
function saveAppearancePreset(){
 const name=$('#preset-name').value.trim().slice(0,40);if(!name){$('#preset-status').textContent='Enter a name for these appearance settings.';return;}
 const found=appearancePresets.find(p=>p.name.toLowerCase()===name.toLowerCase());if(!found&&appearancePresets.length>=10){$('#preset-status').textContent='You can save up to 10 presets. Delete one or reuse its name.';return;}
 if(found){found.name=name;found.values=appearanceSnapshot()}else appearancePresets.push({name,values:appearanceSnapshot()});refreshPresets(name);persist();$('#preset-status').textContent='Saved “'+name+'”.';
}
function deleteAppearancePreset(){const name=$('#appearance-presets').value;appearancePresets=appearancePresets.filter(p=>p.name!==name);refreshPresets();$('#preset-name').value='';persist();$('#preset-status').textContent='Preset removed. Your current appearance is unchanged.';}
function applyAppearancePreset(){
 const preset=availableAppearancePresets().find(p=>p.name===$('#appearance-presets').value);if(!preset)return;applyAppearanceValues(preset.values);$('#preset-status').textContent='Applied “'+preset.name+'”.';
}
function applyAppearanceValues(v){if(v.preserveOtherSettings)v={...appearanceSnapshot(),...v};const wasRestoring=restoring;restoring=true;
 try{setCambridgeArtwork(v.cambridgeArtwork,false);setUlmArtwork(v.ulmArtwork,false);setLightAppearance(v.coverBorder,v.interfaceContrast,v.titleWeight);setBackgroundColor(v.backgroundColor);setBackgroundDim(v.backgroundDim??60);setPalette(v.palette);setTypography(v.typography);setCoverGlow(v.coverGlow);setAtmosphere(v.backdrop,v.selectionStyle);setArtFit(v.artFit);setCoverOptions(v.coverCorners,v.coverBrightness,v.menuButtons);setCupertinoOptions(v.cupertinoReflections,v.cupertinoSpacing);setBerlinCoverSize(v.berlinCoverSize);setViennaSeparators(v.viennaSeparators);kyotoTitlePlacement=v.kyotoTitlePlacement==='below'?'below':'above';cupertinoTitlePlacement=v.cupertinoTitlePlacement==='below'?'below':'above';setSize(['compact','comfortable','large'].includes(v.size)?v.size:'comfortable');setPresentation(v.presentation);refreshLayoutControls();sizePresentation();}
 finally{restoring=wasRestoring;persist()}
}


function updateInterfaceContrast(){
 const body=document.body;body.style.removeProperty('--line');body.style.removeProperty('--muted');
 if(interfaceContrast!=='crisp')return;
 const style=getComputedStyle(body),rgb=name=>{const hex=style.getPropertyValue(name).trim().replace('#','');return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));},bg=rgb('--bg'),text=rgb('--text');
 const mix=ratio=>'rgb('+text.map((v,i)=>Math.round(v*ratio+bg[i]*(1-ratio))).join(',')+')';
 body.style.setProperty('--line',mix(.60));body.style.setProperty('--muted',mix(.90));
}
function setLightAppearance(border,contrast,weight){
 coverBorder=['hairline','matte'].includes(border)?border:'none';interfaceContrast=contrast==='crisp'?'crisp':'soft';titleWeight=['regular','bold'].includes(weight)?weight:'medium';
 document.body.dataset.coverBorder=coverBorder;document.body.dataset.interfaceContrast=interfaceContrast;document.body.dataset.titleWeight=titleWeight;
 $('#cover-border').value=coverBorder;$('#interface-contrast').value=interfaceContrast;$('#title-weight').value=titleWeight;updateInterfaceContrast();persist();
}

// Settings previews use library records, independent of rendered cover tiles.
// Load only while Settings is open, including when Ulm artwork is disabled.
function updateAppearancePreview(){
 if(!$('#settings-dialog').open)return;
 if(backdrop==='gradient')$('#appearance-preview').style.setProperty('--backdrop-rgb',$('#soft-gradient').style.getPropertyValue('--backdrop-rgb')||'128,128,128');
 const sample=$('.appearance-sample img');
 const selectedId=presentation==='ulm'?presentationId:$('#grid .presentation-selected')?.dataset.id||$('#grid .controller-selected')?.dataset.id||glowCard?.dataset.id||presentationId;
 const game=filtered.find(g=>g.id===selectedId)||filtered[0];
 if(!game?.image){sample.hidden=true;sample.removeAttribute('src');return;}
 if(sample.getAttribute('src')!==game.image){sample.hidden=true;sample.src=game.image;}
 else sample.hidden=!(sample.complete&&sample.naturalWidth>0);
 if(!sample.hidden)$('#appearance-preview').style.setProperty('--cover-glow-rgb',coverColor(sample)||'150,160,150');
 syncUlmSettingsSample(sample);syncPreviewBackdrop();
}

function syncUlmSettingsSample(sample){
 const frame=sample.closest('.appearance-sample');
 if(!['ulm','cambridge'].includes(presentation)){
  const selected=$('#grid .presentation-selected')||$('#grid .controller-selected')||$('#grid .game');
  const actual=['tokyo','oxford'].includes(presentation)?$('#tokyo-art'):selected?.querySelector('.cover');
  sample.removeAttribute('style');frame.removeAttribute('style');frame.dataset.previewUnderline=String(!!actual&&!actual.matches('img')&&getComputedStyle(actual,'::before').content!=='none');
  if(actual){const style=getComputedStyle(actual),width=actual.offsetWidth||180,height=actual.offsetHeight||width*1.5,scale=Math.min(68/width,102/height);Object.assign(frame.style,{width:width+'px',height:height+'px',transform:`scale(${scale})`,transformOrigin:'top left',border:style.border,borderRadius:style.borderRadius,background:style.backgroundColor,overflow:style.overflow,boxShadow:style.boxShadow,outline:style.outline,outlineOffset:style.outlineOffset});}
  return;
 }
 frame.removeAttribute('style');frame.dataset.previewUnderline='false';sample.removeAttribute('style');
 if(!sample.naturalWidth)return;
 const actual=$(presentation==='cambridge'?'#cambridge-cover':'#ulm-cover'),style=getComputedStyle(actual),rect=actual.getBoundingClientRect();
 const width=rect.width||Math.min(innerWidth*.25,sample.naturalWidth);
 const height=rect.height||width*1.5;
 const scale=Math.min(68/width,102/height);
 frame.style.transform='none';frame.style.width=width*scale+'px';frame.style.height=height*scale+'px';
 // Scale a full-size artwork treatment, including its border, corners and halo.
 Object.assign(sample.style,{width:width+'px',height:height+'px',maxWidth:'none',maxHeight:'none',objectFit:artFit,background:style.backgroundColor,boxSizing:'border-box',border:style.border,borderRadius:style.borderRadius,transform:`scale(${scale})`,transformOrigin:'top left'});
 const color=coverColor(sample)||'150,160,150';
 sample.style.boxShadow=coverGlow?`0 0 22px 7px rgba(${color},.48),0 0 44px 12px rgba(${color},.24)`:'none';
}

// Visibility describes actual layout behavior; hidden values remain saved.
function refreshApplicableAppearanceControls(){
 const ulm=['ulm','cambridge'].includes(presentation),artwork=presentation==='cambridge'?cambridgeArtwork:!ulm||ulmArtwork;
 $('#custom-font-controls').hidden=presentation==='cambridge'||typography!=='custom';
 const rows={
  'presentation-sort':!['oxford','copenhagen'].includes(presentation)&&!(presentation==='cambridge'&&cambridgeSection==='recent')&&!(presentation==='ulm'&&ulmLevel==='games'&&ulmSection==='recent'),
  'art-fit':artwork,'cover-border':artwork,'cover-corners':artwork,'cover-glow':artwork,
  'typography':presentation!=='cambridge','cover-brightness':!ulm,'menu-buttons':!['ulm','cambridge','venice'].includes(presentation),
  'selection-style':!ulm
 };
 for(const [id,visible] of Object.entries(rows))$('#'+id).closest('.settings-row').hidden=!visible;
 $('#appearance-preview').hidden=!artwork;
 // Oxford dims neighboring text rows rather than separate cover tiles.
 const brightness=$('#cover-brightness').closest('.settings-row');
 brightness.querySelector('h3').textContent=presentation==='oxford'?'Unselected titles':'Unselected covers';
 brightness.querySelector('p').textContent=presentation==='oxford'?'Keep neighboring titles equally bright or dim them to emphasize your selection.':'Keep neighboring artwork equally bright or dim it to emphasize your selection.';
 for(const heading of document.querySelectorAll('#settings-appearance>.settings-subheading')){
  let node=heading.nextElementSibling,visible=false;
  while(node&&!node.classList.contains('settings-subheading')){if(!node.hidden)visible=true;node=node.nextElementSibling;}
  heading.hidden=!visible;
 }
}

// Keep previews transactional: even delayed navigation saves must not store them.
function auditionAppearancePreset(){
 if(window.appearanceAudition)return;
 const preset=availableAppearancePresets().find(p=>p.name===$('#appearance-presets').value);if(!preset)return;
 rememberCategoryPlace();
 const navigation=JSON.parse(JSON.stringify({ownSearchMode,ownSearchQuery,categoryPlaces,genre,query,favoritesOnly,sort,visible,presentationId,seattleBrowse,cambridgeSection,cambridgePane,cambridgePositions,ulmLevel,ulmSection,ulmPositions,ulmCategoryKey,pragueKey,praguePositions,viennaKey,viennaPositions,copenhagenIds,copenhagenKept,copenhagenFilter,controllerGameId,menuTouchId,ulmSearchOpen}));
 window.appearanceAudition={name:preset.name,values:appearanceSnapshot(),navigation,scrollX:scrollX,scrollY:scrollY,settingsScroll:$('#settings-dialog').scrollTop,scrolls:[...document.querySelectorAll('[id]')].filter(n=>n.scrollTop||n.scrollLeft).map(n=>({id:n.id,top:n.scrollTop,left:n.scrollLeft}))};
 hideDialog('#settings-dialog');
 try{applyAppearanceValues(preset.values);$('#audition-name').textContent=preset.name;showDialog('#preset-audition');$('#audition-keep').focus({preventScroll:true});}
 catch(error){finishAppearanceAudition(false);throw error;}
}
function finishAppearanceAudition(keep){
 const audition=window.appearanceAudition;if(!audition)return;
 hideDialog('#preset-audition');
 if(!keep){
  applyAppearanceValues(audition.values);
  ({ownSearchMode,ownSearchQuery,categoryPlaces,genre,query,favoritesOnly,sort,visible,presentationId,seattleBrowse,cambridgeSection,cambridgePane,cambridgePositions,ulmLevel,ulmSection,ulmPositions,ulmCategoryKey,pragueKey,praguePositions,viennaKey,viennaPositions,copenhagenIds,copenhagenKept,copenhagenFilter,controllerGameId,menuTouchId,ulmSearchOpen}=audition.navigation);
  renderedCategoryKey=null;$('#search').value=query;$('#sort').value=sort;update();
  for(const saved of audition.scrolls){const node=document.getElementById(saved.id);if(node){node.scrollTop=saved.top;node.scrollLeft=saved.left;}}
  window.scrollTo(audition.scrollX,audition.scrollY);
 }
 window.appearanceAudition=null;persist();
 showDialog('#settings-dialog');$('#settings-dialog').scrollTop=audition.settingsScroll;
 $('#preset-status').textContent=keep?'Kept “'+audition.name+'”.':'Previous appearance restored.';
 $('#preset-preview').focus({preventScroll:true});updateAppearancePreview();
}

function syncPreviewBackdrop(){
 if(!$('#settings-dialog').open)return;
 const actual=$('#custom-backdrop'),src=actual.getAttribute('src'),style=getComputedStyle(actual);
 for(const [target,id] of [['appearance-preview','appearance-backdrop'],['cupertino-preview','cupertino-backdrop']]){
  const preview=$('#'+target);let image=$('#'+id);if(!image){image=el('img');image.id=id;image.className='preview-backdrop';image.alt='';image.setAttribute('aria-hidden','true');preview.append(image);}
  preview.style.setProperty('--backdrop-rgb',$('#soft-gradient').style.getPropertyValue('--backdrop-rgb')||'128,128,128');
  image.hidden=actual.hidden||!src||(target==='cupertino-preview'&&presentation!=='cupertino');
  if(image.hidden){image.removeAttribute('src');continue;}
  if(image.getAttribute('src')!==src)image.src=src;
  image.style.opacity=style.opacity;image.style.filter=style.filter;
 }
}

function syncCupertinoPreviewAppearance(){
 if(presentation!=='cupertino'||!$('#settings-dialog').open)return;
 const source=$('#grid .presentation-selected .cover')||$('#grid .cover');if(!source)return;
 const actual=getComputedStyle(source),ratio=80/(source.offsetWidth||240);
 for(const tile of $('#cupertino-preview').querySelectorAll('.cupertino-preview-tile')){
  const selected=tile.classList.contains('preview-selected');
  tile.style.borderWidth=(parseFloat(actual.borderTopWidth)*ratio)+'px';tile.style.borderRadius=(parseFloat(actual.borderTopLeftRadius)*ratio)+'px';
  tile.style.outline=selected?actual.outline:'none';tile.style.outlineWidth=selected?(parseFloat(actual.outlineWidth)*ratio)+'px':'0';tile.style.outlineOffset=(parseFloat(actual.outlineOffset)*ratio)+'px';
  const scaleShadow=value=>value.replace(/(-?[\d.]+)px/g,(_,n)=>(Number(n)*ratio)+'px');
  tile.style.boxShadow=selected?scaleShadow(actual.boxShadow):'none';
  tile.style.setProperty('--preview-marker-size',Math.max(1,3*ratio)+'px');
 }
 $('#cupertino-preview-caption').style.fontWeight=getComputedStyle($('#presentation-title')).fontWeight;
}

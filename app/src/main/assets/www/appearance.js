const builtinAppearancePresets=[{"name":"Default","values":{"presentation":"library","palette":"portal","typography":"computer","coverGlow":true,"backdrop":"flat","selectionStyle":"outline","artFit":"cover","size":"comfortable","cupertinoReflections":"subtle","cupertinoSpacing":"airy","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"above","viennaSeparators":"lines","coverCorners":"soft","coverBrightness":"dimmed","menuButtons":"all"}},{"name":"Launchbiz","values":{"presentation":"library","palette":"graphite","typography":"clean","coverGlow":false,"backdrop":"flat","selectionStyle":"outline","artFit":"cover","size":"compact","cupertinoReflections":"classic","cupertinoSpacing":"compact","berlinCoverSize":94.12526293442204,"kyotoTitlePlacement":"below","cupertinoTitlePlacement":"below","viennaSeparators":"space","coverCorners":"square","coverBrightness":"dimmed","menuButtons":"selected"}},{"name":"Niagaramond","values":{"presentation":"oxford","palette":"parchment","typography":"editorial","coverGlow":false,"backdrop":"flat","selectionStyle":"underline","artFit":"cover","size":"comfortable","cupertinoReflections":"subtle","cupertinoSpacing":"airy","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"above","viennaSeparators":"space","coverCorners":"soft","coverBrightness":"even","menuButtons":"selected"}},{"name":"iTomes","values":{"presentation":"cupertino","palette":"graphite","typography":"clean","coverGlow":false,"backdrop":"flat","selectionStyle":"underline","artFit":"cover","size":"comfortable","cupertinoReflections":"classic","cupertinoSpacing":"compact","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"below","viennaSeparators":"space","coverCorners":"square","coverBrightness":"even","menuButtons":"selected"}},{"name":"Playrite","values":{"presentation":"berlin","palette":"midnight","typography":"clean","coverGlow":false,"backdrop":"flat","selectionStyle":"outline","artFit":"cover","size":"compact","cupertinoReflections":"subtle","cupertinoSpacing":"airy","berlinCoverSize":120,"kyotoTitlePlacement":"above","cupertinoTitlePlacement":"above","viennaSeparators":"lines","coverCorners":"square","coverBrightness":"even","menuButtons":"selected"}}];
let coverCorners='soft',coverBrightness='dimmed',menuButtons='all',menuTouchId=null,appearancePresets=[];
// Appearance stays independent of palette and layout. Only the selected image is sampled.
let viennaSeparators='lines';
let backdrop='flat',selectionStyle='outline';
let typography='computer',coverGlow=true,cupertinoReflections='subtle',cupertinoSpacing='airy',berlinCoverSize=120,kyotoTitlePlacement='above',cupertinoTitlePlacement='above';
const glowColors=new Map();let glowTimer=0,glowCard=null,hoverGlowCard=null;
function setTypography(value){typography=['computer','editorial','clean','spacegrotesk','outfit','oxanium','spacemono','ibmplexsans'].includes(value)?value:'computer';document.body.dataset.typography=typography;$('#typography').value=typography;persist();}
function setCoverGlow(value){coverGlow=value!==false;document.body.dataset.coverGlow=String(coverGlow);$('#cover-glow').value=coverGlow?'subtle':'off';queueCoverGlow();persist();}
function queueCoverGlow(){clearTimeout(glowTimer);glowTimer=setTimeout(updateCoverGlow,100);}
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
 const grid=$('#grid');if(grid.classList.contains('fluid-motion'))return;
 const carousel=['kyoto','cupertino','tokyo','vienna','oxford','berlin'].includes(presentation);
 const selected=carousel?grid.querySelector('.presentation-selected'):(hoverGlowCard?.isConnected?hoverGlowCard:document.activeElement?.closest('#grid .game')||grid.querySelector('.controller-selected')||grid.querySelector('.game'));
 if(glowCard!==selected){glowCard?.classList.remove('glow-selected');glowCard=selected;if(selected)selected.classList.add('glow-selected');}
 const preview=$('#tokyo-art');const img=presentation==='oxford'?preview:selected?.querySelector('.cover img');
 const color=img?coverColor(img):null;
 document.body.style.setProperty('--backdrop-rgb',color||'128,128,128');
 const sample=$('#appearance-preview img');if(img&&sample.getAttribute('src')!==img.getAttribute('src'))sample.src=img.src;sample.hidden=!img;
 $('#appearance-preview').style.setProperty('--cover-glow-rgb',color||'150,160,150');
 if(selected){if(color)selected.style.setProperty('--cover-glow-rgb',color);else selected.style.removeProperty('--cover-glow-rgb');}
 preview.classList.toggle('glow-selected',(presentation==='tokyo'||presentation==='oxford')&&!!selected);
 if(color)preview.style.setProperty('--cover-glow-rgb',color);else preview.style.removeProperty('--cover-glow-rgb');
}
function setAtmosphere(background,selection){
 backdrop=['gradient','custom','mountain'].includes(background)?background:'flat';selectionStyle=['outline','underline','glow'].includes(selection)?selection:'outline';
 document.body.dataset.backdrop=backdrop;document.body.dataset.selectionStyle=selectionStyle;
 $('#backdrop').value=backdrop;$('#selection-style').value=selectionStyle;syncCustomBackground();queueCoverGlow();persist();
}
function setViennaSeparators(value){viennaSeparators=value==='space'?'space':'lines';document.body.dataset.viennaSeparators=viennaSeparators;$('#vienna-separators').value=viennaSeparators;persist();}
function initAppearance(value){
 initCustomBackground(value);
 appearancePresets=Array.isArray(value.appearancePresets)?value.appearancePresets.filter(p=>p&&typeof p.name==='string'&&p.values&&typeof p.values==='object').slice(0,10):[];
 setCoverOptions(value.coverCorners,value.coverBrightness,value.menuButtons);refreshPresets();
 $('#cover-corners').onchange=$('#cover-brightness').onchange=$('#menu-buttons').onchange=()=>{setCoverOptions($('#cover-corners').value,$('#cover-brightness').value,$('#menu-buttons').value);effect('select')};
 $('#preset-save').onclick=saveAppearancePreset;$('#preset-apply').onclick=applyAppearancePreset;$('#preset-delete').onclick=deleteAppearancePreset;
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
 new MutationObserver(refreshCupertinoControls).observe($('#settings-dialog'),{attributes:true,attributeFilter:['open']});
 $('#typography').onchange=e=>{setTypography(e.target.value);effect('select')};$('#cover-glow').onchange=e=>setCoverGlow(e.target.value==='subtle');
 const grid=$('#grid');new MutationObserver(queueCoverGlow).observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['class','src']});
 $('#tokyo-art').addEventListener('load',queueCoverGlow);grid.addEventListener('load',queueCoverGlow,true);grid.addEventListener('focusin',queueCoverGlow);
 grid.addEventListener('pointerover',e=>{if(e.pointerType==='mouse'){hoverGlowCard=e.target.closest('.game');queueCoverGlow();}});
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
 $('#cupertino-preview-caption').textContent=filtered[index]?.title||'Preview · add games to see your covers here';
}

function refreshLayoutControls(){
 $('#vienna-options').hidden=presentation!=='vienna';
 const carousel=presentation==='kyoto'||presentation==='cupertino';
 $('#title-placement-options').hidden=!carousel;$('#berlin-options').hidden=presentation!=='berlin';
 const placement=presentation==='kyoto'?kyotoTitlePlacement:cupertinoTitlePlacement;
 document.body.dataset.titlePlacement=carousel?placement:'above';$('#title-placement').value=placement;
 $('#berlin-cover-size').value=berlinCoverSize;
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
function appearanceSnapshot(){return {presentation,palette,typography,coverGlow,backdrop,backgroundDim,backgroundColor,selectionStyle,artFit,size,cupertinoReflections,cupertinoSpacing,berlinCoverSize,kyotoTitlePlacement,cupertinoTitlePlacement,viennaSeparators,coverCorners,coverBrightness,menuButtons}}
function availableAppearancePresets(){return [...builtinAppearancePresets.filter(b=>!appearancePresets.some(p=>p.name.toLowerCase()===b.name.toLowerCase())),...appearancePresets]}
function refreshPresetButtons(){const name=$('#appearance-presets').value;$('#preset-apply').disabled=!availableAppearancePresets().some(p=>p.name===name);$('#preset-delete').disabled=!appearancePresets.some(p=>p.name===name);}
function refreshPresets(selected=''){
 const select=$('#appearance-presets');select.replaceChildren(new Option('Choose a preset…',''));for(const p of availableAppearancePresets())select.add(new Option(p.name+(builtinAppearancePresets.includes(p)?' · Built-in':''),p.name));select.value=selected;refreshPresetButtons();
}
function saveAppearancePreset(){
 const name=$('#preset-name').value.trim().slice(0,40);if(!name){$('#preset-status').textContent='Enter a name for these appearance settings.';return;}
 const found=appearancePresets.find(p=>p.name.toLowerCase()===name.toLowerCase());if(!found&&appearancePresets.length>=10){$('#preset-status').textContent='You can save up to 10 presets. Delete one or reuse its name.';return;}
 if(found){found.name=name;found.values=appearanceSnapshot()}else appearancePresets.push({name,values:appearanceSnapshot()});refreshPresets(name);persist();$('#preset-status').textContent='Saved “'+name+'”.';
}
function deleteAppearancePreset(){const name=$('#appearance-presets').value;appearancePresets=appearancePresets.filter(p=>p.name!==name);refreshPresets();$('#preset-name').value='';persist();$('#preset-status').textContent='Preset removed. Your current appearance is unchanged.';}
function applyAppearancePreset(){
 const preset=availableAppearancePresets().find(p=>p.name===$('#appearance-presets').value);if(!preset)return;const v=preset.values,wasRestoring=restoring;restoring=true;
 try{setBackgroundColor(v.backgroundColor);setBackgroundDim(v.backgroundDim??60);setPalette(v.palette);setTypography(v.typography);setCoverGlow(v.coverGlow);setAtmosphere(v.backdrop,v.selectionStyle);setArtFit(v.artFit);setCoverOptions(v.coverCorners,v.coverBrightness,v.menuButtons);setCupertinoOptions(v.cupertinoReflections,v.cupertinoSpacing);setBerlinCoverSize(v.berlinCoverSize);setViennaSeparators(v.viennaSeparators);kyotoTitlePlacement=v.kyotoTitlePlacement==='below'?'below':'above';cupertinoTitlePlacement=v.cupertinoTitlePlacement==='below'?'below':'above';setSize(['compact','comfortable','large'].includes(v.size)?v.size:'comfortable');setPresentation(v.presentation);refreshLayoutControls();sizePresentation();}
 finally{restoring=wasRestoring;persist()}
 $('#preset-status').textContent='Applied “'+preset.name+'”.';
}

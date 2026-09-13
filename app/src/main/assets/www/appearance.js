// Appearance stays independent of palette and layout. Only the selected image is sampled.
let typography='computer',coverGlow=true;
const glowColors=new Map();let glowTimer=0,glowCard=null,hoverGlowCard=null;
function setTypography(value){typography=['computer','editorial','clean'].includes(value)?value:'computer';document.body.dataset.typography=typography;$('#typography').value=typography;persist();}
function setCoverGlow(value){coverGlow=value!==false;document.body.dataset.coverGlow=String(coverGlow);$('#cover-glow').checked=coverGlow;queueCoverGlow();persist();}
function queueCoverGlow(){clearTimeout(glowTimer);if(coverGlow)glowTimer=setTimeout(updateCoverGlow,100);}
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
  const rgb=[best.r,best.g,best.b].map(v=>Math.round(v/best.weight));const boost=Math.max(1,160/Math.max(...rgb));const color=rgb.map(v=>Math.min(255,Math.round(v*boost))).join(',');
  if(glowColors.size>=128)glowColors.delete(glowColors.keys().next().value);glowColors.set(key,color);return color;
 }catch{return null;}
}
function updateCoverGlow(){
 if(!coverGlow)return;
 const grid=$('#grid');if(grid.classList.contains('fluid-motion'))return;
 const carousel=['kyoto','cupertino','tokyo'].includes(presentation);
 const selected=carousel?grid.querySelector('.presentation-selected'):(hoverGlowCard?.isConnected?hoverGlowCard:document.activeElement?.closest('#grid .game')||grid.querySelector('.controller-selected')||grid.querySelector('.game'));
 if(glowCard!==selected){glowCard?.classList.remove('glow-selected');glowCard=selected;if(selected)selected.classList.add('glow-selected');}
 const preview=$('#tokyo-art');const img=selected?.querySelector('.cover img');
 const color=img?coverColor(img):null;
 if(selected){if(color)selected.style.setProperty('--cover-glow-rgb',color);else selected.style.removeProperty('--cover-glow-rgb');}
 preview.classList.toggle('glow-selected',presentation==='tokyo'&&!!selected);
 if(color)preview.style.setProperty('--cover-glow-rgb',color);else preview.style.removeProperty('--cover-glow-rgb');
}
function initAppearance(value){
 setTypography(value.typography);setCoverGlow(value.coverGlow);
 $('#typography').onchange=e=>{setTypography(e.target.value);effect('select')};$('#cover-glow').onchange=e=>setCoverGlow(e.target.checked);
 const grid=$('#grid');new MutationObserver(queueCoverGlow).observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['class','src']});
 grid.addEventListener('load',queueCoverGlow,true);grid.addEventListener('focusin',queueCoverGlow);
 grid.addEventListener('pointerover',e=>{if(e.pointerType==='mouse'){hoverGlowCard=e.target.closest('.game');queueCoverGlow();}});
 grid.addEventListener('pointerleave',()=>{hoverGlowCard=null;queueCoverGlow();});
}

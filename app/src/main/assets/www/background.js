const builtinBackgrounds={fireflies:{file:'fireflies.webp',credit:'Fireflies · Original procedural artwork for Wayfinder. A seamless 16-second loop.'},contours:{file:'contour-lines.webp',credit:'Contour Lines · Original procedural artwork for Wayfinder. A seamless 16-second loop.'},digital:{file:'digital-rain.webp',credit:'Digital Rain · Original procedural artwork for Wayfinder. A seamless 16-second loop; glyphs rendered with Space Mono (SIL Open Font License).'},forest:{file:'forest-of-illusion.webp',credit:'Forest of Illusion by Luis Zuno (ansimuz) · CC0. Adapted as a 48-second parallax loop.'},underwater:{file:'underwater-diving.webp',credit:'Underwater Diving by Luis Zuno (ansimuz) · CC0 artwork. Adapted as a 48-second parallax loop; no music included.'},fort:{file:'fort-of-illusion.webp',credit:'Fort of Illusion by Luis Zuno (ansimuz). Used under the included permissive license; adapted as a 60-second parallax loop.'},alien:{file:'alien-environment.webp',credit:'Alien Environment by Luis Zuno (ansimuz) · CC0. Adapted as a 60-second parallax loop.'},another:{file:'another-world.webp',credit:'Another World by Luis Zuno (ansimuz) · CC0. Adapted as a 60-second parallax loop.'},mountain:{file:'mountain-dusk.webp',credit:'Mountain at Dusk by Luis Zuno (ansimuz) · CC0. Adapted as a looping parallax background.'},magical:{file:'magical-road.webp',credit:'Magical Road by Luis Zuno (ansimuz) · CC0. Adapted as a framed, 60-second parallax loop.'},urban:{file:'urban-landscape.webp',credit:'Urban Landscape by Luis Zuno (ansimuz) · CC0. Adapted as a skyline-framed, 60-second parallax loop.'}};
// A single color matrix remaps luminance, without blur or extra artwork layers.
function updateBackgroundPalette(){
 const style=getComputedStyle(document.body),parse=name=>{const hex=style.getPropertyValue(name).trim().replace('#','');return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);};
 let low=parse('--bg'),high=parse('--accent');const luma=c=>c[0]*.2126+c[1]*.7152+c[2]*.0722;
 if(luma(low)>luma(high))[low,high]=[high,low];
 const matrix=low.flatMap((v,i)=>{const delta=high[i]-v;return [.2126*delta,.7152*delta,.0722*delta,0,v];});
 matrix.push(0,0,0,1,0);$('#background-palette-matrix').setAttribute('values',matrix.join(' '));
}
function setBackgroundColor(value){backgroundColor=['muted','palette'].includes(value)?value:'original';document.body.dataset.backgroundColor=backgroundColor;$('#background-color').value=backgroundColor;updateBackgroundPalette();persist();}
// One stationary image layer; never rebuild it when the selected game changes.
let backgroundColor='original',backgroundDim=60,backgroundInfo={url:'',name:''},backgroundActive=true;
function setBackgroundDim(value){backgroundDim=Math.max(0,Math.min(100,Number.isFinite(Number(value))?Number(value):60));$('#background-dim').value=backgroundDim;$('#background-dim-value').textContent=backgroundDim+'%';$('#custom-backdrop').style.opacity=String(1-backgroundDim/100);if(typeof syncPreviewBackdrop==='function')syncPreviewBackdrop();persist();}
function syncCustomBackground(){
 const builtIn=builtinBackgrounds[backdrop],image=$('#custom-backdrop'),url=builtIn?'backgrounds/'+builtIn.file:backdrop==='custom'?backgroundInfo.url:'',enabled=!!url&&backgroundActive&&!document.hidden;
 $('#custom-background-controls').hidden=!(builtIn||backdrop==='custom');$('#custom-background-file').hidden=backdrop!=='custom';$('#mountain-credit').hidden=!builtIn;$('#mountain-credit').textContent=builtIn?.credit||'';$('#background-file-name').textContent=backgroundInfo.name||'No image selected';$('#background-remove').disabled=!backgroundInfo.url;
 image.hidden=!enabled;
 if(enabled){if(image.getAttribute('src')!==url)image.src=url;}
 else image.removeAttribute('src');if(typeof syncPreviewBackdrop==='function')syncPreviewBackdrop();
}
function refreshCustomBackground(){try{backgroundInfo=native?.backgroundSettings?JSON.parse(native.backgroundSettings()):{url:'',name:''}}catch{backgroundInfo={url:'',name:''}}syncCustomBackground();}
function initCustomBackground(value){
 setBackgroundColor(value.backgroundColor);setBackgroundDim(value.backgroundDim??60);refreshCustomBackground();
 $('#background-choose').onclick=()=>{if(native?.chooseBackground)native.chooseBackground();else toast('Choose a background in the Android app')};
 $('#background-remove').onclick=()=>native?.clearBackground?.();
 $('#background-color').onchange=e=>{setBackgroundColor(e.target.value);effect('select')};
 $('#background-dim').oninput=e=>setBackgroundDim(e.target.value);
 $('#custom-backdrop').onerror=()=>{$('#custom-backdrop').hidden=true;toast('Could not display this background. Choose a different image.');};
 document.addEventListener('visibilitychange',syncCustomBackground);
}
window.onNativePause=()=>{finishCopenhagenDrag(true);if(pinDrag)finishPinDrag(true);backgroundActive=false;syncCustomBackground();};
function resumeCustomBackground(){backgroundActive=true;syncCustomBackground();}

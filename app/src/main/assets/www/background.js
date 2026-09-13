// One stationary image layer; never rebuild it when the selected game changes.
let backgroundDim=60,backgroundInfo={url:'',name:''},backgroundActive=true;
function setBackgroundDim(value){backgroundDim=Math.max(0,Math.min(100,Number.isFinite(Number(value))?Number(value):60));$('#background-dim').value=backgroundDim;$('#background-dim-value').textContent=backgroundDim+'%';$('#custom-backdrop').style.opacity=String(1-backgroundDim/100);persist();}
function syncCustomBackground(){
 const image=$('#custom-backdrop'),enabled=backdrop==='custom'&&!!backgroundInfo.url&&backgroundActive&&!document.hidden;
 $('#custom-background-controls').hidden=backdrop!=='custom';$('#background-file-name').textContent=backgroundInfo.name||'No image selected';$('#background-remove').disabled=!backgroundInfo.url;
 image.hidden=!enabled;
 if(enabled){if(image.getAttribute('src')!==backgroundInfo.url)image.src=backgroundInfo.url;}
 else image.removeAttribute('src');
}
function refreshCustomBackground(){try{backgroundInfo=native?.backgroundSettings?JSON.parse(native.backgroundSettings()):{url:'',name:''}}catch{backgroundInfo={url:'',name:''}}syncCustomBackground();}
function initCustomBackground(value){
 setBackgroundDim(value.backgroundDim??60);refreshCustomBackground();
 $('#background-choose').onclick=()=>{if(native?.chooseBackground)native.chooseBackground();else toast('Choose a background in the Android app')};
 $('#background-remove').onclick=()=>native?.clearBackground?.();
 $('#background-dim').oninput=e=>setBackgroundDim(e.target.value);
 $('#custom-backdrop').onerror=()=>{$('#custom-backdrop').hidden=true;toast('Could not display this background. Choose a different image.');};
 document.addEventListener('visibilitychange',syncCustomBackground);
}
window.onNativePause=()=>{backgroundActive=false;syncCustomBackground();};
function resumeCustomBackground(){backgroundActive=true;syncCustomBackground();}

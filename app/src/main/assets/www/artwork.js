/* Artwork is staged here; only Use artwork changes the editor draft. */
(()=>{
 let state=null,serial=0,previewFrame=0;
 const dialog=$('#artwork-dialog'),canvas=$('#artwork-canvas'),ctx=canvas.getContext('2d'),preview=$('#artwork-preview-image');
 function message(text){$('#artwork-status').textContent=text}
 function pending(value){if(!state)return;state.busy=value;$('#artwork-use').disabled=value||!state.loaded;$('#artwork-download').disabled=value;$('#artwork-play').disabled=value;$('#artwork-file').disabled=value}
 function open({title,pkg,image,square,apply}){
  state={session:String(Date.now())+'_'+(++serial),title,pkg,square,apply,mode:'fit',x:.5,y:.5,loaded:false,busy:false,load:0};
  $('#artwork-subtitle').textContent=title;$('#artwork-query').value=title+' Android game cover';$('#artwork-url').value='';$('#artwork-search-options').open=false;$('#artwork-title-toggle').checked=true;
  canvas.width=600;canvas.height=square?600:900;preview.style.aspectRatio=square?'1':'2 / 3';
  $('#artwork-gallery').replaceChildren();message('Start with the current image, or choose a source.');pending(false);mode('fit');showDialog('#artwork-dialog');candidate(image,'Current image');candidate('art-icon/'+pkg,'Installed icon');select(image);$('#artwork-installed').focus();
 }
 function candidate(src,label,thumbnail=src){const b=el('button','artwork-candidate'),im=el('img');im.src=thumbnail;im.alt='';im.loading='lazy';b.append(im,el('span','',label));b.title=label;b.onclick=()=>{if(state&&!state.busy)select(src)};im.onerror=()=>{b.disabled=true;b.querySelector('span').textContent=label+' — unavailable'};$('#artwork-gallery').append(b)}
 function select(src){if(!state)return;const current=state,token=++state.load;state.loaded=false;$('#artwork-use').disabled=true;ctx.clearRect(0,0,canvas.width,canvas.height);preview.removeAttribute('src');$('#artwork-dimensions').textContent='Loading preview…';const im=new Image();im.onload=()=>{if(state!==current||token!==state.load)return;state.image=im;state.loaded=true;state.x=state.y=.5;$('#artwork-x').value=$('#artwork-y').value='50';$('#artwork-dimensions').textContent=im.naturalWidth+' × '+im.naturalHeight+' → '+canvas.width+' × '+canvas.height;pending(false);draw()};im.onerror=()=>{if(state!==current||token!==state.load)return;pending(false);$('#artwork-dimensions').textContent='Preview unavailable';message('Could not load this image. Try another result or choose a downloaded file.')};im.src=src}
 function mode(value){if(!state)return;state.mode=value;for(const b of document.querySelectorAll('[data-artwork-mode]'))b.setAttribute('aria-pressed',String(b.dataset.artworkMode===value));$('#artwork-crop').hidden=value!=='fill';$('#artwork-title-option').hidden=value!=='compose';draw()}
 function draw(){if(!state?.loaded)return;const im=state.image,w=canvas.width,h=canvas.height,iw=im.naturalWidth,ih=im.naturalHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle='#181e1c';ctx.fillRect(0,0,w,h);
  if(state.mode==='compose'){
   const sample=document.createElement('canvas');sample.width=sample.height=1;const sc=sample.getContext('2d');sc.drawImage(im,0,0,1,1);let rgb=[50,75,65];try{rgb=[...sc.getImageData(0,0,1,1).data].slice(0,3)}catch{}
   const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,`rgb(${rgb.map(v=>Math.round(v*.65+25)).join(',')})`);gradient.addColorStop(1,'#101619');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
   const withTitle=$('#artwork-title-toggle').checked,areaH=withTitle?h*.60:h*.82,scale=Math.min(w*.80/iw,areaH/ih),dw=iw*scale,dh=ih*scale;ctx.save();ctx.shadowColor='#0008';ctx.shadowBlur=28;ctx.drawImage(im,(w-dw)/2,(withTitle?h*.40:h*.50)-dh/2,dw,dh);ctx.restore();
   if(withTitle){ctx.fillStyle='#fff';ctx.textAlign='center';let lines=[];let font=42;for(;font>=20;font-=2){ctx.font=`600 ${font}px sans-serif`;lines=[];let line='';for(const word of state.title.split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>w*.84){lines.push(line);line=word}else line=next}if(line)lines.push(line);if(lines.length<=3)break}lines=lines.slice(0,3);for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],w/2,h*.78+i*font*1.25,w*.84)}
  }else{const scale=state.mode==='fill'?Math.max(w/iw,h/ih):Math.min(w/iw,h/ih),dw=iw*scale,dh=ih*scale;ctx.drawImage(im,(w-dw)*state.x,(h-dh)*state.y,dw,dh)}
  if(!previewFrame)previewFrame=requestAnimationFrame(()=>{previewFrame=0;if(state?.loaded)preview.src=canvas.toDataURL('image/jpeg',.92)});
 }
 function external(url){if(native?.openArtworkLink)native.openArtworkLink(url);else window.open(url,'_blank','noopener')}
 $('#choose-cover').onclick=()=>open({title:$('#edit-title').value.trim()||draft.title,pkg:draft.package,image:draft.image,square:false,apply:image=>{if(draft){draft.image=image;draft.fallback=false;$('#edit-image').src=image}}});
 $('#appearance-choose').onclick=()=>open({title:$('#appearance-name').value.trim(),pkg:appearanceDraft.package,image:$('#appearance-image').getAttribute('src'),square:true,apply:image=>{if(appearanceDraft){appearanceDraft.image=image;$('#appearance-image').src=image}}});
 $('#artwork-close').onclick=()=>hideDialog('#artwork-dialog');dialog.addEventListener('close',()=>{state=null;$('#artwork-gallery').replaceChildren()});
 $('#artwork-installed').onclick=()=>{if(state&&!state.busy)select('art-icon/'+state.pkg)};
 $('#artwork-play').onclick=()=>{if(!state||state.busy)return;if(!native?.artworkSearch){message('Google Play lookup is available in the Android app.');return}pending(true);message('Looking up this exact Android app on Google Play…');native.artworkSearch(state.session,state.pkg)};
 $('#artwork-google').onclick=()=>external('https://www.google.com/search?tbm=isch&imgar=t%7Cxt&q='+encodeURIComponent($('#artwork-query').value.trim()));
 $('#artwork-steam').onclick=()=>external('https://www.steamgriddb.com/search/grids?term='+encodeURIComponent($('#artwork-query').value.trim().replace(/ Android game cover$/i,'')));
 $('#artwork-store').onclick=()=>external('https://play.google.com/store/apps/details?id='+encodeURIComponent(state.pkg));
 $('#artwork-file').onclick=()=>{if(!state||state.busy)return;if(native){native.chooseCover('artwork_'+state.session);return}const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=()=>{const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>select(reader.result);reader.readAsDataURL(file)};input.click()};
 $('#artwork-url-form').onsubmit=e=>{e.preventDefault();if(!state||state.busy)return;const url=$('#artwork-url').value.trim();try{if(new URL(url).protocol!=='https:')throw Error()}catch{message('Enter a direct HTTPS image link.');return}if(!native?.artworkDownload){message('Image-link importing is available in the Android app.');return}pending(true);message('Downloading image…');native.artworkDownload(state.session,url)};
 for(const b of document.querySelectorAll('[data-artwork-mode]'))b.onclick=()=>mode(b.dataset.artworkMode);
 for(const axis of ['x','y'])$('#artwork-'+axis).oninput=e=>{if(state){state[axis]=Number(e.target.value)/100;draw()}};
 $('#artwork-title-toggle').onchange=draw;
 let drag=null;preview.onpointerdown=e=>{if(!state?.loaded||state.mode!=='fill')return;drag={x:e.clientX,y:e.clientY,px:state.x,py:state.y};preview.setPointerCapture(e.pointerId)};
 preview.onpointermove=e=>{if(!drag||!state)return;const r=preview.getBoundingClientRect(),im=state.image,scale=Math.max(canvas.width/im.naturalWidth,canvas.height/im.naturalHeight),overflowX=(im.naturalWidth*scale-canvas.width)*r.width/canvas.width,overflowY=(im.naturalHeight*scale-canvas.height)*r.height/canvas.height;state.x=overflowX>1?Math.max(0,Math.min(1,drag.px-(e.clientX-drag.x)/overflowX)):.5;state.y=overflowY>1?Math.max(0,Math.min(1,drag.py-(e.clientY-drag.y)/overflowY)):.5;$('#artwork-x').value=state.x*100;$('#artwork-y').value=state.y*100;draw()};preview.onpointerup=preview.onpointercancel=()=>drag=null;
 window.artworkController=action=>{if(document.activeElement!==preview||!state)return false;if(!['left','right'].includes(action))return false;if(state.mode!=='fill')return false;const axis=action==='left'||action==='right'?'x':'y';state[axis]=Math.max(0,Math.min(1,state[axis]+(['right','down'].includes(action)?.05:-.05)));$('#artwork-'+axis).value=state[axis]*100;draw();return true};
 preview.onkeydown=e=>{if(window.artworkController(e.key.replace('Arrow','').toLowerCase()))e.preventDefault()};
 $('#artwork-use').onclick=()=>{if(!state?.loaded||state.busy)return;try{const encoded=canvas.toDataURL('image/jpeg',.94);if(native?.artworkSave){pending(true);message('Saving artwork…');native.artworkSave(state.session,encoded)}else{state.apply(encoded);hideDialog('#artwork-dialog')}}catch{message('Could not prepare this image. Try choosing a downloaded file.');pending(false)}};
 const previous=window.nativeEvent;window.nativeEvent=(event,data)=>{
  if(event.startsWith('artwork')){if(!state||data.session!==state.session)return;pending(false);
   if(event==='artworkResults'){$('#artwork-gallery').replaceChildren();for(const item of data.items)candidate(item.image,item.label,item.thumbnail);message(data.items.length+' images from Google Play. Select one to preview.');}
   if(event==='artworkImage'){candidate(data.image,'Your image');select(data.image);message('Image loaded. Choose how it fits the tile.');}
   if(event==='artworkError')message(data.message);
   if(event==='artworkSaved'){state.apply(data.image);hideDialog('#artwork-dialog');toast('Artwork ready. Save the editor to keep it.');}return;
  }previous(event,data);
 };
})();

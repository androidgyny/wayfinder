const assert=require('node:assert/strict');
const path=require('node:path'),{chromium}=require('playwright');
(async()=>{
const b=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',args:['--allow-file-access-from-files']});
try{
const root=path.resolve(__dirname,'../app/src/main/assets/www');
 const p=await b.newPage({viewport:{width:1097,height:592}}),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{const games=Array.from({length:1200},(_,i)=>({id:'g'+i,title:'A long game title for checking wrapped lines '+i,genre:i%2?'Arena & twin-stick shooters':'Racing',favorite:i===1,image:'',package:'test.game'}));window.Portal={view:()=>localStorage.view||'{}',saveView:v=>localStorage.view=v,library:()=>JSON.stringify(games),appsPreferences:()=>'[]',setThemeColor:c=>window.nativeBar=c,launch:id=>window.launched=id};});
 await p.goto(require('node:url').pathToFileURL(path.resolve(root,'index.html')).href);
 await p.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 await p.evaluate(()=>{setPresentation('taipei');update();});
 await p.locator('.taipei-title').waitFor();
 const result=await p.evaluate(async()=>{
  const css=(selector,prop='backgroundColor')=>getComputedStyle($(selector))[prop];
  const change=(key,value)=>{const e=$('#taipei-'+key);e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));};
  const same=(a,b,m)=>{if(a!==b)throw Error(m+': '+a+' / '+b)};
  const rgb=h=>'rgb('+[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).join(', ')+')';
  same(taipeiOptions.surface,'oled','old default');same(taipeiOptions.accent,'yellow','accent default');
  for(const id of Object.keys(taipeiPalettes)){
   change('palette',id);same(css('#grid'),rgb(taipeiPalettes[id][0]),'cover');
   same(css('.taipei-art'),rgb(taipeiPalettes[id][2]),'art');same(window.nativeBar,taipeiPalettes[id][0],'category status');
  }
  for(const id of Object.keys(taipeiAccents)){
   change('accent',id);same(css('.topbar .mark'),rgb(taipeiAccents[id][0]),'logo');
   same(css('.topbar .mark','color'),rgb(taipeiAccents[id][1]),'glyph');
  }
  taipeiOpen('all');for(const id of ['oled','dark']){
   change('surface',id);const col=rgb(taipeiSurfaces[id]);
   for(const sel of ['#grid','#taipei-hints','#taipei-bar','.topbar','.cover','#taipei-preview-grid'])same(css(sel),col,sel);
   same(window.nativeBar,taipeiSurfaces[id],'native');
  }
  change('gridBackdrop','mountain');same(css('#grid'),'rgba(0, 0, 0, 0)','backdrop');change('gridBackdrop','flat');
  taipeiSelect(10,true);
  const selected=presentationId;
  controllerFocus($('#settings-button'));controller('down');
  same(document.activeElement.closest('.game')?.dataset.id,selected,'header returns to selected game');
  setAtmosphere('mountain',selectionStyle);change('gridBackdrop','custom');
  nativeEvent('backgroundChanged',{});same(backdrop,'mountain','choosing a grid image preserves the category backdrop');
  nativeEvent('backgroundRemoved',{});same(taipeiOptions.gridBackdrop,'flat','removed image resets grid');same(backdrop,'mountain','category backdrop survives removal');
  const columns=taipeiGridMetrics().columns;
  taipeiSelect(columns,true);controllerFocus($('#grid .presentation-selected'),true);
  controller('up');
  same(presentationId,filtered[0].id,'up from the second row');
  same($('#grid .controller-selected'),$('#grid .presentation-selected'),'controller outline moved');
  same(document.activeElement,$('#grid .presentation-selected'),'game focus moved');
  controller('up');same(document.activeElement,$('#taipei-back'),'toolbar focus');
  same(css('#grid .presentation-selected','boxShadow'),'none','only the toolbar has a ring');
  controller('down');same(document.activeElement,$('#grid .presentation-selected'),'return to the first row');
  const gaps={};for(const size of ['compact','comfortable','large']){
   setSize(size);taipeiSelect(0);const {columns} = taipeiGridMetrics(),tiles=[...taipeiTrack.children];
   const box=i=>tiles.find(t=>t.dataset.id===filtered[i].id).getBoundingClientRect();
   const gap=box(columns).top-box(0).bottom;if(gap<2||gap>12)throw Error('row gap '+size+' '+gap);
   taipeiSelect(filtered.length-1,true);const frame=$('#grid .presentation-selected').getBoundingClientRect(),grid=$('#grid').getBoundingClientRect();
   if(frame.bottom>grid.bottom||frame.top<grid.top)throw Error(JSON.stringify({size,frame,grid,scroll:document.querySelector('#grid').scrollTop,track:taipeiTrack.style.height}));gaps[size]=gap;
  }
  taipeiBack();openTaipeiArtPicker();
  const choices=[...document.querySelectorAll('.tp-art-choice')];
  same(choices.length,40,'automatic and selectable scenes');
  for (const button of choices) {
   const name=button===choices[0]?taipeiArtFor('all',true):button.lastElementChild.textContent;
   const mask=button.firstElementChild.style.webkitMaskImage;
   if(!decodeURIComponent(mask).includes('scenes/'+name+'.png'))throw Error('picker scene '+name);
   const image=new Image();image.src=mask.slice(5,-2);await image.decode();
   same(image.naturalWidth,664,'scene width');
  }
  choices.find(b=>b.textContent==='Sports').click();
  same(taipeiArtFor('all'),'Sports','assigned illustration');
  const snap=appearanceSnapshot();same(snap.taipeiOptions.accent,'supergreen','snapshot');
  persist();return gaps;
 });await p.reload();await p.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 assert.deepEqual(await p.evaluate(()=>[taipeiOptions.surface,taipeiOptions.accent,taipeiOptions.palette]),['dark','supergreen','parchment']);
 assert.deepEqual(errors,[]);console.log(root,result);await p.close();
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

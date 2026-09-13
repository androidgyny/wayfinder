// Text-only catalogue rows keep large collections light; artwork loads once.
let oxfordItems=null,oxfordRows=new Map(),oxfordLetters=new Map();
function oxfordLetter(title){const c=normalize(title).trim().charAt(0).toUpperCase();return /^[A-Z]$/.test(c)?c:'#'}
function refreshOxfordControls(){
 const control=$('#presentation-sort');control.disabled=presentation==='oxford';
 control.closest('.settings-row').querySelector('p').textContent=presentation==='oxford'?'Oxford uses Title A–Z for its alphabetical index.':'Applies to all games, categories, and Favorites.';
}
function oxfordJump(letter){const id=oxfordLetters.get(letter);if(id){effect('page');selectPresentation(id)}}
function renderOxford(){
 const grid=$('#grid');
 if(oxfordItems!==filtered||grid.firstElementChild?.dataset.oxford!=='true'){
  oxfordItems=filtered;oxfordRows=new Map();oxfordLetters=new Map();const fragment=document.createDocumentFragment();
  for(const g of filtered){
   const b=el('button','game');b.dataset.id=g.id;b.dataset.oxford='true';b.append(el('span','game-title',g.title));syncFavoriteCard(b,g);
   b.onclick=()=>{if(presentationId!==g.id)selectPresentation(g.id);else play(g.id,b)};
   b.oncontextmenu=e=>{e.preventDefault();openGame(g.id,b)};
   const edit=el('span','card-edit','•••');edit.setAttribute('role','button');edit.setAttribute('aria-label','Details for '+g.title);edit.tabIndex=-1;edit.onclick=e=>{e.stopPropagation();openGame(g.id,b)};b.append(edit);
   fragment.append(b);oxfordRows.set(g.id,b);const letter=oxfordLetter(g.title);if(!oxfordLetters.has(letter))oxfordLetters.set(letter,g.id);
  }
  grid.replaceChildren(fragment);
  $('#oxford-index').replaceChildren(...['#',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter=>{const b=el('button','',letter);b.disabled=!oxfordLetters.has(letter);b.setAttribute('aria-label',letter==='#'?'Jump to numbers and symbols':'Jump to '+letter);b.onclick=()=>oxfordJump(letter);return b}));
 }
 let index=filtered.findIndex(g=>g.id===presentationId);if(index<0)index=0;
 const current=filtered[index];presentationId=current?.id||null;
 const previous=grid.querySelector('.presentation-selected'),target=oxfordRows.get(presentationId);
 if(previous!==target){if(previous){previous.classList.remove('presentation-selected');previous.tabIndex=-1}if(target){target.classList.add('presentation-selected');target.tabIndex=0;target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})}}
 const options=sections(),gi=sectionIndex();$('#category-current').textContent=sectionLabel();$('#category-before').textContent=options[(gi-1+options.length)%options.length].label;$('#category-after').textContent=options[(gi+1)%options.length].label;
 $('#presentation-title').textContent=current?.title||(favoritesOnly?'No favorites yet':'No games found');
 $('#presentation-position').textContent=current?`${index+1} / ${filtered.length.toLocaleString()} · ${current.genre}`:'Try another category or search.';
 setFavoriteButton($('#presentation-favorite'),current);$('#presentation-play').disabled=!current;$('#presentation-edit').disabled=!current;
 const preview=$('#tokyo-art');preview.hidden=!current;if(current&&preview.getAttribute('src')!==current.image)preview.src=current.image;preview.alt=current?current.title+' cover':'';
 const letter=current?oxfordLetter(current.title):null;for(const b of $('#oxford-index').children)b.setAttribute('aria-current',String(b.textContent===letter));
 $('#load').hidden=true;$('#empty').hidden=true;queueCoverGlow();
}

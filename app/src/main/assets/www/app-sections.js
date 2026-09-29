// Category artwork: Phosphor Icons, MIT; see LICENSE-Phosphor.txt.
const appSections=[{id:'news',name:'News',note:'Stay informed',icon:'newspaper'},{id:'media',name:'Media',note:'Watch, listen, explore',icon:'film-reel'},{id:'social',name:'Social',note:'Keep in touch',icon:'chats'},{id:'tools',name:'Tools',note:'Get things done',icon:'wrench'},{id:'system',name:'System',note:'Configure and customize',icon:'gear'}];
let drawerSection='',lastAppSection='news';
function appSection(a){
 const assigned=appPreference(a.package).section;
 if(appSections.some(s=>s.id===assigned))return assigned;
 if(drawerIsGame(a))return '';
 const text=(a.title+' '+a.package).toLowerCase();
 if(/beeper|reddit|telegram|whatsapp|signal|discord|aliucord|facebook|instagram|messenger|mastodon|bluesky|snapchat|tiktok/.test(text))return 'social';
 if(/news|reader|feedly|newspaper|pocket|nytimes|new yorker|washington post|substack|\bwsj\b/.test(text))return 'news';
 if(/music|video|player|spotify|youtube|gallery|photo|netflix|podcast|vlc|plex|kodi|cloudstream|stremio|iptv|pluto tv|aniyomi|sound recorder/.test(text))return 'media';
 if(/settings|system|permission|updater|store|vending|security|magisk|shizuku|adaway|backup|ccleaner|app inspector|devinfo|obtainium|button mapper|font|gboard|pimax ime|konabess|zygisk|\bfkm\b/.test(text))return 'system';
 return 'tools';
}
function closeAppSection(){
 if(drawerView!=='home'||!drawerSection||$('#drawer-search').value.trim())return false;
 lastAppSection=drawerSection;drawerSection='';drawerPage=0;renderDrawer();controllerFocus(document.querySelector(`[data-section="${lastAppSection}"]`));return true;
}
function renderAppSections(home){
 const root=$('#app-sections'),dock=$('#app-dock');
 const sectionFocus=document.activeElement?.dataset.section,dockFocus=document.activeElement?.closest('#app-dock .drawer-app')?.dataset.package;
 root.hidden=!home;root.replaceChildren();
 const grouped=new Map(appSections.map(s=>[s.id,[]]));
 if(home)for(const a of drawerCatalog){if(!appPreference(a.package).hideFromSections)grouped.get(appSection(a))?.push(a);}
 if(home)for(const section of appSections){
  const apps=grouped.get(section.id).sort((a,b)=>drawerName(a).localeCompare(drawerName(b)));
  const b=el('button','app-section');b.dataset.section=section.id;b.setAttribute('aria-expanded',String(drawerSection===section.id));b.setAttribute('aria-controls','drawer-grid');
  const art=el('span','section-art');art.innerHTML=appSectionIcons[section.icon];
  b.append(art,el('strong','',section.name),el('span','section-note',section.note));
  const row=el('span','section-icons');for(const a of apps.slice(0,4)){const im=el('img');im.src=drawerImage(a);im.alt='';row.append(im)}
  row.append(el('span','section-count',String(apps.length)));b.append(row);
  b.onclick=()=>{drawerSection=drawerSection===section.id?'':section.id;lastAppSection=section.id;drawerPage=0;renderDrawer();controllerFocus(drawerSection?$('#drawer-grid .drawer-app')||document.querySelector(`[data-section="${section.id}"]`):document.querySelector(`[data-section="${section.id}"]`))};root.append(b);
 }
 dock.replaceChildren();const pins=(home?drawerCatalog.filter(a=>appPreference(a.package).pinned):[]).sort((a,b)=>(appPreference(a.package).order||0)-(appPreference(b.package).order||0)||drawerName(a).localeCompare(drawerName(b)));
 dock.hidden=!home||!pins.length;
 if(home)for(const a of pins.slice(0,8)){const tile=drawerTile(a);tile.querySelector('.drawer-edit').remove();dock.append(tile)}
 if(sectionFocus)root.querySelector(`[data-section="${sectionFocus}"]`)?.focus({preventScroll:true});
 if(dockFocus)[...dock.querySelectorAll('.drawer-app')].find(b=>b.dataset.package===dockFocus)?.focus({preventScroll:true});
 $('#apps-drawer').classList.toggle('sections-home',home);
 $('#apps-drawer').classList.toggle('section-expanded',home&&!!drawerSection);
 $('#app-dock').classList.toggle('pins-draggable',canDragPins());
}
function sectionController(action){
 if(drawerView!=='home'||$('#drawer-search').value.trim()||$('#drawer-letter').value)return false;
 if(action==='back')return closeAppSection();
 const active=document.activeElement,category=active?.closest('.app-section'),dock=active?.closest('#app-dock .drawer-app');
 if(!['left','right','up','down','pageUp','pageDown'].includes(action))return false;
 const categories=[...$('#app-sections').children],pins=[...$('#app-dock').querySelectorAll('.drawer-app')];
 if(category){const i=categories.indexOf(category);lastAppSection=category.dataset.section;
  if(action==='left'||action==='right')controllerFocus(categories[Math.max(0,Math.min(categories.length-1,i+(action==='right'?1:-1)))]);
  else if(action==='down')controllerFocus(drawerSection?$('#drawer-grid .drawer-app')||category:pins[0]||category);
  else if(action==='up')controllerFocus($('#drawer-search'));
  return true;
 }
 if(dock){const i=pins.indexOf(dock);if(action==='up')controllerFocus(document.querySelector(`[data-section="${lastAppSection}"]`)||categories[0]);else if(action==='left'||action==='right')controllerFocus(pins[Math.max(0,Math.min(pins.length-1,i+(action==='right'?1:-1)))]);return true;}
 if(drawerSection&&active?.matches('#drawer-grid .drawer-app')){
  const cards=[...$('#drawer-grid').querySelectorAll('.drawer-app')],i=cards.indexOf(active),top=cards[0].getBoundingClientRect().top,cols=cards.filter(c=>Math.abs(c.getBoundingClientRect().top-top)<2).length;
  const step={left:-1,right:1,up:-cols,down:cols,pageUp:-cols*3,pageDown:cols*3}[action];controllerFocus(cards[Math.max(0,Math.min(cards.length-1,i+step))]);return true;
 }
 if(action==='pageUp'||action==='pageDown')return true;
 return false;
}

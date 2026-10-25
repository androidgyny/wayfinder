const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const adb=process.env.ADB||'C:/Users/paul_/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const serial=process.argv[2];if(!serial)throw Error('Device serial required');const cmd=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8'});
(async()=>{
 cmd('shell','input','keyevent','224');cmd('shell','wm','dismiss-keyguard');cmd('shell','am','start','-n','com.androidgyny.wayfinder.audit/com.androidgyny.wayfinder.MainActivity');await new Promise(r=>setTimeout(r,1800));
 const pid=cmd('shell','pidof','com.androidgyny.wayfinder.audit').trim(),sockets=cmd('shell','cat','/proc/net/unix'),socket='webview_devtools_remote_'+pid;if(!sockets.includes(socket))throw Error('No Wayfinder test WebView socket');cmd('forward','tcp:9235','localabstract:'+socket);
 const targets=await (await fetch('http://127.0.0.1:9235/json')).json(),target=targets.find(p=>p.type==='page'&&p.url.startsWith('https://appassets.androidplatform.net/'));if(!target)throw Error('No Wayfinder page');const ws=new WebSocket(target.webSocketDebuggerUrl),pending=new Map();let sequence=0;await new Promise(r=>ws.addEventListener('open',r));ws.addEventListener('message',e=>{const msg=JSON.parse(e.data);if(pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id)}});const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method))},15000);pending.set(id,result=>{clearTimeout(timer);resolve(result)});ws.send(JSON.stringify({id,method,params}))});
 const page={evaluate:async (fn,arg)=>{const r=await send('Runtime.evaluate',{expression:'('+fn.toString()+')('+JSON.stringify(arg??null)+')',returnByValue:true,awaitPromise:true});if(r.error||r.result.exceptionDetails)throw Error(JSON.stringify(r));return r.result.result.value},waitForTimeout:ms=>new Promise(r=>setTimeout(r,ms))},browser={close:async()=>ws.close()};
 for(let i=0;i<40;i++){if(await page.evaluate(()=>typeof Portal!=='undefined'&&typeof restoring!=='undefined'&&!restoring))break;await page.waitForTimeout(250)}



await page.waitForTimeout(6500);
const output=path.resolve('output/dmg-device-audit');fs.mkdirSync(output,{recursive:true});const rows=[];
const layouts=await page.evaluate(()=>[...$('#presentation').options].map(o=>o.value));
for(const layout of layouts){
 await page.evaluate(layout=>{while(topDialog())nativeBack();document.activeElement.blur();query='';$('#search').value='';const p=builtinAppearancePresets.find(p=>p.values.presentation===layout);if(p)applyAppearanceValues(p.values);setPresentation(layout);genre='Puzzles';favoritesOnly=false;presentationId=games.find(g=>g.genre==='Puzzles').id;if(layout==='ulm')ulmOpen('genre:Puzzles');if(layout==='cambridge')cambridgeOpen('genre:Puzzles');if(layout==='vienna')viennaOpen('genre:Puzzles');if(layout==='prague')pragueOpen('genre:Puzzles');if(layout==='seattle')seattleBrowse=true;update();window.scrollTo(0,0)},layout);
 await page.waitForTimeout(200);
 rows.push(await page.evaluate(()=>({layout:presentation,width:innerWidth,height:innerHeight,games:games.length,overflow:document.documentElement.scrollWidth-innerWidth})));
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,layout+'.png'),Buffer.from(shot.result.data,'base64'));
}
await page.evaluate(()=>{query='';$('#search').value='';setPresentation('berlin');genre='Puzzles';favoritesOnly=false;update();persist()});
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});



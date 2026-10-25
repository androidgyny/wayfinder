const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();const out=path.resolve('output/opening-aspect-audit');fs.mkdirSync(out,{recursive:true});
 for(const [name,width,height] of [['dmg',551,480],['4-3',800,600],['3-2',900,600],['16-10',960,600],['21-9',980,420],['small-phone',840,360]]){
  await page.setViewportSize({width,height});await page.goto(pathToFileURL(path.resolve('app/src/main/assets/startup/index.html')).href);
  await page.evaluate(()=>{document.querySelector('.console').classList.add('running');for(const a of document.getAnimations()){a.pause();a.currentTime=5000}});
  const r=await page.locator('.console').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height,name+' full console visible');assert.ok(Math.abs(r.x+r.width/2-width/2)<1&&Math.abs(r.y+r.height/2-height/2)<1,name+' console centered');
  await page.screenshot({path:path.join(out,name+'.png')});
 }
 console.log('PASS opening animation fits and centers on all target screen ratios');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});

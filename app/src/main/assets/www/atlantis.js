// Atlantis appearance for the shared desktop browser.
const atlantisBrowser=createDesktopBrowser({id:'atlantis',folderColors:['#70b8f2','#db91a6','#9e91d0','#e4b66a','#67b9b0','#95b975'],
 categoryHeading:true,recentLabel:'Recent',shelf:true,brand:'WAYFINDER'});
const {focus:atlantisFocus,open:atlantisOpen,sizeCover:sizeAtlantisCover,edit:atlantisEdit,
 targetLabel:atlantisTarget,select:atlantisSelect,render:renderAtlantis,back:atlantisBack,
 controller:atlantisController,init:initAtlantis}=atlantisBrowser;

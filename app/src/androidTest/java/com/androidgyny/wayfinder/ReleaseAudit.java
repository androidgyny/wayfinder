package com.androidgyny.wayfinder;

import android.app.Instrumentation;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import org.json.*;
import java.io.*;
import java.lang.reflect.*;
import java.nio.file.Files;
import java.util.*;
import java.util.zip.*;

/** Runs only against the isolated audit application ID. Uses synthetic data. */
public class ReleaseAudit extends Instrumentation {
    private MainActivity activity;
    private Bundle args;
    private final StringBuilder log = new StringBuilder();
    @Override public void onCreate(Bundle args) { this.args=args; start(); }
    private Object call(Object owner,String name,Class<?>[] types,Object... values) throws Exception {
        Method m=owner.getClass().getDeclaredMethod(name,types);m.setAccessible(true);return m.invoke(owner,values);
    }
    private Object field(String name) throws Exception {Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(activity);}
    private byte[] read(InputStream in) throws Exception {try(InputStream source=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=source.read(b))!=-1)out.write(b,0,n);return out.toByteArray();}}
    private String js(String expression) throws Exception {
        java.util.concurrent.CountDownLatch done=new java.util.concurrent.CountDownLatch(1);String[] value={null};android.webkit.WebView web=(android.webkit.WebView)field("web");
        runOnMainSync(()->web.evaluateJavascript(expression,v->{value[0]=v;done.countDown();}));if(!done.await(10,java.util.concurrent.TimeUnit.SECONDS))throw new IOException("WebView did not respond");return value[0];
    }
    private void check(boolean value,String message) {if(!value)throw new AssertionError(message);log.append("PASS ").append(message).append('\n');}
    private JSONArray records() throws Exception {return (JSONArray)call(field("db"),"all",new Class<?>[]{});}
    private void replace(JSONArray games,JSONArray apps,JSONArray order) throws Exception {call(field("db"),"replace",new Class<?>[]{JSONArray.class,JSONArray.class,JSONArray.class},games,apps,order);}
    private void stage(File file) throws Exception {call(activity,"importZip",new Class<?>[]{Uri.class},Uri.fromFile(file));waitForIdleSync();}
    private void cancel() throws Exception {sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);waitForIdleSync();call(activity,"clearStage",new Class<?>[]{});}
    private File zip(String name,JSONObject manifest,byte[] image,String extra) throws Exception {
        File file=new File(activity.getCacheDir(),name);
        try(ZipOutputStream z=new ZipOutputStream(new FileOutputStream(file))){z.putNextEntry(new ZipEntry("library.json"));z.write(manifest.toString().getBytes("UTF-8"));z.closeEntry();if(image!=null){z.putNextEntry(new ZipEntry("user/audit.jpg"));z.write(image);z.closeEntry();}if(extra!=null){z.putNextEntry(new ZipEntry(extra));z.write(1);z.closeEntry();}}return file;
    }
    private void transportAudit() throws Exception {
        final int[] requests={0};final boolean[] malformed={false};
        GeminiCategories client=new GeminiCategories(activity,()->new java.net.HttpURLConnection(new java.net.URL("https://audit.invalid")){
            private final ByteArrayOutputStream payload=new ByteArrayOutputStream();
            public void disconnect(){} public boolean usingProxy(){return false;} public void connect(){}
            public OutputStream getOutputStream(){return payload;}
            public int getResponseCode(){requests[0]++;return requests[0]==1?429:200;}
            public String getHeaderField(String name){return "retry-after".equals(name)?"0":null;}
            public InputStream getInputStream() throws IOException {
                try{JSONObject body=new JSONObject(payload.toString("UTF-8"));JSONObject input=new JSONObject(body.getJSONArray("contents").getJSONObject(0).getJSONArray("parts").getJSONObject(0).getString("text"));
                    if(!body.getJSONObject("generationConfig").getString("responseMimeType").equals("application/json")||body.getJSONObject("generationConfig").getInt("maxOutputTokens")<16000)throw new IOException("Unexpected response configuration");
                    JSONObject output=new JSONObject();JSONArray batch=input.optJSONArray("games");if(batch!=null&&(batch.length()!=1200&&batch.length()!=250))throw new IOException("Expected whole-library request");
                    if(body.getJSONObject("generationConfig").getJSONObject("responseSchema").getJSONObject("properties").has("categories"))output.put("categories",new JSONArray("[\"Generated\"]"));
                    else if(batch!=null){JSONArray assignments=new JSONArray();for(int i=0;i<batch.length();i++)assignments.put(new JSONObject().put("id",batch.getJSONObject(i).getString("id")).put("category_id","c0"));if(malformed[0])assignments.put("c0");output.put("assignments",assignments);}
                    else output.put("category_id","c0");
                    return new ByteArrayInputStream(new JSONObject().put("candidates",new JSONArray().put(new JSONObject().put("finishReason","STOP").put("content",new JSONObject().put("parts",new JSONArray().put(new JSONObject().put("text",output.toString())))))).toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }catch(Exception e){throw new IOException(e);}
            }
        });
        JSONArray many=new JSONArray();for(int i=0;i<1200;i++)many.put(new JSONObject().put("id","batch_"+i).put("title","Synthetic "+i).put("package","audit.batch"+i).put("genre","Existing"));
        final boolean[] waited={false};JSONObject proposal=client.organize(many,true,5,message->{if(message.contains("retrying"))waited[0]=true;});
        check(waited[0]&&requests[0]==3&&proposal.getJSONArray("assignments").length()==1200&&proposal.getJSONArray("assignments").getJSONObject(1199).getString("id").equals("batch_1199"),"native Gemini transport processes whole library, retries 429, maps ordered assignments");
        malformed[0]=true;try{client.organize(many,false,5,message->{});throw new AssertionError("Expected invalid response rejection");}catch(IOException expected){}
        check(true,"native Gemini transport rejects malformed assignment response");
        check(client.suggest("Reader","audit.reader",new JSONArray().put("news")).equals("news"),"native suggestion transport accepts only supplied categories");
        // Exercise the real WebView -> bridge -> worker -> event -> editor path,
        // substituting only HTTPS so the audit cannot contact Gemini.
        Field transport=MainActivity.class.getDeclaredField("gemini");transport.setAccessible(true);Object original=transport.get(activity);
        try{
            transport.set(activity,client);
            int before=records().length();String expected=GeminiCategories.names(records()).getString(0);
            js("reloadLibrary();editGame({...games[0],id:'audit_added',title:'Edited new game',package:'com.android.settings'},true);aiSuggest(false)");
            for(int i=0;i<100&&!"true".equals(js("aiSuggestion===null"));i++)Thread.sleep(50);
            check(JSONObject.quote(expected).equals(js("$('#edit-genre').value"))&&records().length()==before,"Android add-game suggestion returns through bridge without saving prematurely");
            js("$('#edit-form').requestSubmit()");
            check(records().length()==before+1,"Android add-game Save persists the suggested category");
            js("drawerCatalog=[{package:'com.android.settings',title:'Android Settings'}];showDialog('#apps-drawer');editDrawerApp('com.android.settings');$('#appearance-name').value='My utility';aiSuggest(true)");
            for(int i=0;i<100&&!"true".equals(js("aiSuggestion===null"));i++)Thread.sleep(50);
            check("\"news\"".equals(js("$('#appearance-section').value")),"Android app suggestion returns into its separate section field");
            js("$('#app-appearance-form').requestSubmit();hideDialog('#apps-drawer')");
            JSONArray savedApps=new JSONArray(activity.getPreferences(0).getString("apps","[]"));boolean found=false;
            for(int i=0;i<savedApps.length();i++){JSONObject app=savedApps.getJSONObject(i);if(app.optString("package").equals("com.android.settings"))found=app.optString("section").equals("news")&&app.optString("title").equals("My utility");}
            check(found&&records().length()==before+1,"Android app Save preserves edited title and leaves the game library intact");
        }finally{transport.set(activity,original);}
    }
    @SuppressWarnings("unchecked")
    private void aiAudit() throws Exception {
        Object db=field("db");
        // Exercise the actual v2 migration against a separate temporary SQLite database.
        String priorPreference=activity.getPreferences(0).getString("categoryOrder","[]");
        activity.getPreferences(0).edit().putString("categoryOrder","[\"Legacy\"]").commit();
        File file=new File(activity.getCacheDir(),"migration-audit.db");
        android.database.sqlite.SQLiteDatabase migration=android.database.sqlite.SQLiteDatabase.openOrCreateDatabase(file,null);
        try{migration.execSQL("CREATE TABLE games (id TEXT PRIMARY KEY NOT NULL, record TEXT NOT NULL)");
            call(db,"onUpgrade",new Class<?>[]{android.database.sqlite.SQLiteDatabase.class,int.class,int.class},migration,2,3);
            try(android.database.Cursor cursor=migration.rawQuery("SELECT value FROM library_meta WHERE name='categoryOrder'",null)){check(cursor.moveToFirst()&&cursor.getString(0).equals("[\"Legacy\"]"),"v2 category order migrates into SQLite");}
        }finally{migration.close();file.delete();activity.getPreferences(0).edit().putString("categoryOrder",priorPreference).commit();}
        JSONObject one=new JSONObject("{\"id\":\"ai_one\",\"title\":\"First\",\"genre\":\"Alpha\",\"package\":\"audit.shared\",\"image\":\"icon/audit.shared\",\"kind\":\"shortcut\",\"favorite\":true,\"lastPlayed\":123}");
        JSONObject two=new JSONObject(one.toString()).put("id","ai_two").put("title","Second").put("genre","Beta");
        JSONArray source=new JSONArray().put(one).put(two),beforeOrder=new JSONArray("[\"Beta\",\"Alpha\"]");replace(source,null,beforeOrder);
        String before=records().toString();
        JSONArray invalidMoves=new JSONArray().put(new JSONObject().put("id","ai_one").put("from","Alpha").put("to","New")).put(new JSONObject().put("id","ai_two").put("from","Wrong").put("to","New"));
        try{call(db,"categories",new Class<?>[]{JSONObject.class},new JSONObject().put("moves",invalidMoves).put("order",new JSONArray("[\"New\"]")));throw new AssertionError("Expected failure");}catch(InvocationTargetException expected){}
        check(records().toString().equals(before)&&call(db,"order",new Class<?>[]{}).equals(beforeOrder.toString()),"failed category batch rolls back assignments and order");
        Map<String,JSONObject> snapshots=(Map<String,JSONObject>)field("aiSnapshots");
        String fingerprint=(String)call(activity,"aiFingerprint",new Class<?>[]{JSONArray.class,String.class},records(),beforeOrder.toString());
        snapshots.put("audit_request",new JSONObject().put("fingerprint",fingerprint).put("reorganize",true).put("maximum",2));
        JSONArray categories=new JSONArray("[\"New A\",\"New B\"]"),assignments=new JSONArray().put(new JSONObject().put("id","ai_one").put("category","New A")).put(new JSONObject().put("id","ai_two").put("category","New B"));
        JSONObject proposal=new JSONObject().put("request","audit_request").put("categories",categories).put("assignments",assignments).put("order",categories).put("maximum",100);
        JSONObject duplicate=new JSONObject(proposal.toString());duplicate.getJSONArray("assignments").getJSONObject(1).put("id","ai_one");
        try{call(db,"applyAi",new Class<?>[]{JSONObject.class},duplicate);throw new AssertionError("Expected duplicate rejection");}catch(InvocationTargetException expected){}
        check(records().toString().equals(before),"native Apply rejects duplicate IDs without changing records");
        JSONObject tooMany=new JSONObject(proposal.toString()).put("categories",new JSONArray("[\"New A\",\"New B\",\"Extra\"]"));
        try{call(db,"applyAi",new Class<?>[]{JSONObject.class},tooMany);throw new AssertionError("Expected limit rejection");}catch(InvocationTargetException expected){}
        check(records().toString().equals(before),"native Apply enforces original maximum even if client changes it");
        one.put("lastPlayed",456);call(db,"put",new Class<?>[]{JSONObject.class},one);
        call(db,"applyAi",new Class<?>[]{JSONObject.class},proposal);
        JSONArray saved=records();check(saved.getJSONObject(0).getString("genre").equals("New A")&&saved.getJSONObject(1).getString("genre").equals("New B"),"native AI Apply distinguishes shortcuts sharing a package");
        check(saved.getJSONObject(0).getLong("lastPlayed")==456&&saved.getJSONObject(0).getBoolean("favorite"),"AI Apply preserves current play history and favorite");
        check(call(db,"order",new Class<?>[]{}).equals(categories.toString()),"AI assignments and order commit together");
        String sortFingerprint=(String)call(activity,"aiFingerprint",new Class<?>[]{JSONArray.class,String.class},records(),categories.toString());
        snapshots.put("audit_sort",new JSONObject().put("fingerprint",sortFingerprint).put("reorganize",false).put("maximum",2));
        JSONObject sorted=new JSONObject(proposal.toString()).put("request","audit_sort");
        for(JSONObject invalid:new JSONObject[]{new JSONObject(sorted.toString()).put("order",new JSONArray("[\"New B\",\"New A\"]")),new JSONObject(sorted.toString()).put("categories",new JSONArray("[\"Other\",\"New B\"]")),new JSONObject(sorted.toString()).put("assignments",new JSONArray().put(assignments.getJSONObject(0)))}){
            try{call(db,"applyAi",new Class<?>[]{JSONObject.class},invalid);throw new AssertionError("Expected invalid Sort rejection");}catch(InvocationTargetException expected){}
            check(records().toString().equals(saved.toString())&&call(db,"order",new Class<?>[]{}).equals(categories.toString()),"native Sort rejects changed order, new categories, or partial assignments atomically");
        }
        call(db,"applyAi",new Class<?>[]{JSONObject.class},sorted);
        try{call(db,"applyAi",new Class<?>[]{JSONObject.class},sorted);throw new AssertionError("Expected replay rejection");}catch(InvocationTargetException expected){}
        check(!snapshots.containsKey("audit_sort"),"successful native Apply consumes its request and rejects replay");
        String staleFingerprint=(String)call(activity,"aiFingerprint",new Class<?>[]{JSONArray.class,String.class},records(),categories.toString());snapshots.put("audit_stale",new JSONObject().put("fingerprint",staleFingerprint).put("reorganize",true).put("maximum",2));
        JSONObject edited=saved.getJSONObject(0);edited.put("title","Later title");call(db,"put",new Class<?>[]{JSONObject.class},edited);proposal.put("request","audit_stale");
        try{call(db,"applyAi",new Class<?>[]{JSONObject.class},proposal);throw new AssertionError("Expected stale rejection");}catch(InvocationTargetException expected){}
        check(records().getJSONObject(0).getString("title").equals("Later title"),"native Apply rejects stale title snapshot");
        GeminiCategories credentials=(GeminiCategories)field("gemini");credentials.saveKey("AIza_auditOnlyNotARealKey");check(credentials.hasKey()&&!activity.getSharedPreferences("gemini",0).getString("key","").contains("AIza_"),"API key is encrypted using Android Keystore");transportAudit();credentials.saveKey("");snapshots.clear();replace(new JSONArray(),null,new JSONArray());
    }
    private void waitKeyboard(boolean visible) throws Exception {
        String expression="Portal.keyboardVisible()==="+visible+"&&document.body.classList.contains('input-compact')==="+visible;
        for(int i=0;i<60;i++){if("true".equals(js(expression)))return;Thread.sleep(100);}
        throw new AssertionError("Keyboard state did not settle to "+visible+": "+js("JSON.stringify({native:Portal.keyboardVisible(),compact:document.body.classList.contains('input-compact'),height:innerHeight})"));
    }
    private void keyboardAudit() throws Exception {
        String library=records().toString();
        js("document.activeElement.blur();Portal.hideKeyboard();setPresentation('kyoto');");waitKeyboard(false);
        js("$('#search').focus();Portal.showKeyboard();");waitKeyboard(true);
        check(true,"native IME opening enables compact layout");
        js("$('#category-current').focus();");Thread.sleep(350);
        check("true".equals(js("document.body.classList.contains('input-compact')===Portal.keyboardVisible()")),"focus transfer follows actual IME visibility");
        js("Portal.hideKeyboard();");waitKeyboard(false);
        check("true".equals(js("getComputedStyle($('#kyoto-dock')).display!=='none'")),"keyboard dismissal restores controller dock");
        js("showDialog('#settings-dialog');$('#preset-name').focus();Portal.showKeyboard();");waitKeyboard(true);Thread.sleep(200);
        check("true".equals(js("(()=>{const r=$('#preset-name').getBoundingClientRect(),d=$('#settings-dialog').getBoundingClientRect();return r.top>=d.top&&r.bottom<=d.bottom&&d.top>=0&&d.bottom<=innerHeight})()")),"real keyboard leaves settings field inside visible dialog");
        js("Portal.hideKeyboard();");waitKeyboard(false);
        js("hideDialog('#settings-dialog');");
        check(library.equals(records().toString()),"keyboard transitions do not mutate library");
    }
    private void smokeAudit() throws Exception {
        for(int i=0;i<100&&(Boolean)call(field("startup"),"active",new Class<?>[]{});i++)Thread.sleep(100);
        String before=records().toString();
        js("while(topDialog())nativeBack();query='';genre='';favoritesOnly=false;setPresentation('library');reloadLibrary();controllerFocus(libraryFocusTarget(),true)");
        sendKeyDownUpSync(KeyEvent.KEYCODE_BUTTON_X);Thread.sleep(200);
        check("true".equals(js("$('#editor').open")),"native controller X opens selected game editor");
        sendKeyDownUpSync(KeyEvent.KEYCODE_BUTTON_B);Thread.sleep(200);
        check("false".equals(js("$('#editor').open"))&&before.equals(records().toString()),"native controller B cancels editor without changing library");
        android.webkit.WebView web=(android.webkit.WebView)field("web");
        JSONObject point=new JSONObject(js("(()=>{const r=$('#search').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,width:innerWidth}})()"));
        int[] location=new int[2];runOnMainSync(()->web.getLocationOnScreen(location));
        float scale=(float)web.getWidth()/(float)point.getDouble("width"),x=location[0]+(float)point.getDouble("x")*scale,y=location[1]+(float)point.getDouble("y")*scale;
        long time=android.os.SystemClock.uptimeMillis();
        android.view.MotionEvent down=android.view.MotionEvent.obtain(time,time,android.view.MotionEvent.ACTION_DOWN,x,y,0),up=android.view.MotionEvent.obtain(time,time+50,android.view.MotionEvent.ACTION_UP,x,y,0);
        try{sendPointerSync(down);sendPointerSync(up);}finally{down.recycle();up.recycle();}
        waitKeyboard(true);sendStringSync("Audit");Thread.sleep(200);
        check("true".equals(js("query==='Audit'&&filtered.length===1")),"native touch and keyboard search find synthetic game");
        js("Portal.hideKeyboard();$('#search').value='';query='';update();");waitKeyboard(false);
        check("true".equals(js("JSON.parse(Portal.launchAudit())[0].ok")),"synthetic launch target resolves");
        js("play('audit')");Thread.sleep(650);
        check(records().getJSONObject(0).optLong("lastPlayed")>0,"native launch records play history");
        runOnMainSync(()->activity.startActivity(new Intent().setClassName(getTargetContext().getPackageName(),MainActivity.class.getName()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)));
        Thread.sleep(500);
        check("true".equals(js("backgroundActive&&!topDialog()")),"return from launched app resumes browsing cleanly");
        String[] layouts={"library","berlin","cambridge","copenhagen","cupertino","kyoto","oxford","prague","seattle","ulm","venice","vienna"};
        js("window.auditErrors=[];addEventListener('error',e=>auditErrors.push(e.message))");
        for(int round=0;round<3;round++)for(String layout:layouts)js("setPresentation('"+layout+"');showDialog('#settings-dialog');refreshApplicableAppearanceControls();nativeBack()");
        check("0".equals(js("auditErrors.length")),"36 native layout/settings transitions complete without JavaScript errors");
        check(records().length()==1&&records().getJSONObject(0).getBoolean("favorite"),"native smoke preserves synthetic record and favorite");
    }
    private void artworkAudit() throws Exception {
        android.webkit.WebView web=(android.webkit.WebView)field("web");
        JSONObject game=records().getJSONObject(0);String original=game.getString("image");
        Bitmap bitmap=Bitmap.createBitmap(600,900,Bitmap.Config.ARGB_8888);bitmap.eraseColor(0xff3355dd);
        ByteArrayOutputStream out=new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.JPEG,95,out);bitmap.recycle();
        String image=(String)call(field("artwork"),"save",new Class<?>[]{byte[].class,File.class},out.toByteArray(),field("covers"));
        check(!image.equals(original),"artwork save allocates a fresh URL rather than reusing cached cover");
        game.put("image",image);call(field("db"),"put",new Class<?>[]{JSONObject.class},game);
        js("reloadLibrary();");
        for(int phase=0;phase<2;phase++){
            js("window.auditPixel=null;(()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=1;c.height=1;c.getContext('2d').drawImage(im,0,0,1,1);window.auditPixel=Array.from(c.getContext('2d').getImageData(0,0,1,1).data)};im.onerror=()=>window.auditPixel=[];im.src=games[0].image})()");
            for(int i=0;i<100&&"null".equals(js("window.auditPixel"));i++)Thread.sleep(50);
            JSONArray pixel=new JSONArray(js("window.auditPixel"));
            check(pixel.length()==4&&pixel.getInt(2)>200&&pixel.getInt(0)<70,"new cover renders correct pixels "+(phase==0?"after save":"after WebView reload"));
            if(phase==0){runOnMainSync(web::reload);Thread.sleep(700);}
        }
        check(records().getJSONObject(0).getString("image").equals(image),"new artwork reference persists in SQLite");
    }
    private void performanceAudit() throws Exception {
        JSONArray original=records(),order=new JSONArray((String)call(field("db"),"order",new Class<?>[]{}));
        JSONArray many=new JSONArray();
        for(int i=0;i<1200;i++)many.put(new JSONObject(original.getJSONObject(0).toString()).put("id","stress_"+i).put("title","Synthetic game "+i).put("genre","Category "+(i/40)).put("favorite",i%10==0).put("lastPlayed",i));
        try{
            replace(many,null,new JSONArray());js("reloadLibrary();window.auditErrors=[];addEventListener('error',e=>auditErrors.push(e.message))");
            String[] layouts={"library","berlin","cambridge","copenhagen","cupertino","kyoto","oxford","prague","seattle","ulm","venice","vienna"};
            long before=android.os.Debug.getPss();JSONArray timings=new JSONArray();
            for(int round=0;round<3;round++)for(String layout:layouts){
                String elapsed=js("(()=>{const start=performance.now();setPresentation('"+layout+"');for(const a of ['right','down','left','up'])controller(a);return performance.now()-start})()");
                timings.put(new JSONObject().put("round",round).put("layout",layout).put("updateMs",Double.parseDouble(elapsed)));
            }
            check("0".equals(js("auditErrors.length")),"1,200-game native library survives 36 layout changes and 144 navigation actions");
            check(records().length()==1200,"native performance navigation does not remove records");
            log.append("METRIC native app PSS KB before=").append(before).append(" after=").append(android.os.Debug.getPss()).append('\n');
            log.append("METRIC native synchronous layout/navigation timings ").append(timings).append('\n');
        }finally{replace(original,null,order);js("reloadLibrary()");}
        check(records().toString().equals(original.toString()),"native performance fixture restores original audit records");
    }
    @Override public void onStart() {
        Bundle result=new Bundle();int status=0;
        try {
            check(getTargetContext().getPackageName().equals("com.androidgyny.wayfinder.audit"),"isolated package guard");
            activity=(MainActivity)startActivitySync(new Intent().setClassName(getTargetContext().getPackageName(),MainActivity.class.getName()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));waitForIdleSync();
            for(int i=0;i<100&&!Boolean.TRUE.equals(field("ready"));i++)Thread.sleep(200);
            check(Boolean.TRUE.equals(field("ready")),"native first launch completes");
            for(int i=0;i<100&&!"true".equals(js("typeof restoring !== 'undefined' && !restoring"));i++)Thread.sleep(100);
            check("true".equals(js("!restoring")),"initial settings restoration completes");
            if("keyboard".equals(args.getString("mode"))){keyboardAudit();result.putString("stream",log.toString());finish(0,result);return;}
            if("artwork".equals(args.getString("mode"))){artworkAudit();result.putString("stream",log.toString());finish(0,result);return;}
            if("smoke".equals(args.getString("mode"))){smokeAudit();result.putString("stream",log.toString());finish(0,result);return;}
            if("performance".equals(args.getString("mode"))){performanceAudit();result.putString("stream",log.toString());finish(0,result);return;}
            js("window.auditFallback=null;Promise.all(['icon/com.android.settings','app-icon/com.android.settings?pack=missing.pack&drawable=missing'].map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);resolve(c.toDataURL())};im.onerror=reject;im.src=src}))).then(v=>window.auditFallback=v[0]===v[1]).catch(()=>window.auditFallback=false)");
            for(int i=0;i<100&&"null".equals(js("window.auditFallback"));i++)Thread.sleep(100);
            check("true".equals(js("window.auditFallback")),"missing icon pack renders identical system fallback");
            if("verify".equals(args.getString("mode"))){
                check(records().length()==1,"library survives APK replacement");
                check(new JSONArray(activity.getPreferences(0).getString("apps","[]")).length()==8,"eight pins survive APK replacement");
                check(activity.getPreferences(0).getString("view","").contains("missing.pack"),"appearance and pack settings survive APK replacement");
            } else {
                check(records().length()==0,"fresh native installation has empty library");
                aiAudit();
                Bitmap b=Bitmap.createBitmap(4,4,Bitmap.Config.ARGB_8888);b.eraseColor(0xff448866);ByteArrayOutputStream out=new ByteArrayOutputStream();b.compress(Bitmap.CompressFormat.JPEG,90,out);b.recycle();byte[] image=out.toByteArray();
                JSONObject game=new JSONObject("{\"id\":\"audit\",\"title\":\"Audit game\",\"genre\":\"Puzzles\",\"package\":\"com.android.settings\",\"image\":\"user/audit.jpg\",\"kind\":\"app\",\"favorite\":true}");
                JSONArray games=new JSONArray().put(game),apps=new JSONArray(),order=new JSONArray("[\"Puzzles\",\"Arcade\"]");
                for(int i=0;i<8;i++)apps.put(new JSONObject().put("package","audit.app"+i).put("title","Custom "+i).put("pinned",true).put("order",i).put("section","social").put("hideFromSections",i==7).put("packIcon",new JSONObject().put("pack","missing.pack").put("name","alternate")));
                apps.getJSONObject(0).put("image","user/audit.jpg");
                Files.write(new File((File)field("covers"),"audit.jpg").toPath(),image);
                replace(games,apps,order);
                js("appIconPack='missing.pack';lastIconPack='missing.pack';setPalette('midnight');persist();");
                GeminiCategories auditCredentials=(GeminiCategories)field("gemini");auditCredentials.saveKey("AIza_backupAuditOnlyNotARealKey");String encryptedKey=activity.getSharedPreferences("gemini",0).getString("key","");
                File exported=new File(activity.getCacheDir(),"export.zip");call(activity,"exportZip",new Class<?>[]{Uri.class},Uri.fromFile(exported));
                JSONObject manifest;try(ZipFile z=new ZipFile(exported)){manifest=new JSONObject(new String(read(z.getInputStream(z.getEntry("library.json"))),"UTF-8"));check(z.size()==2,"backup deduplicates shared cover and app icon");}
                check(manifest.getJSONArray("apps").length()==8,"backup includes eight pins and named pack icons");
                check(!manifest.toString().contains("AIza_")&&!manifest.toString().contains(encryptedKey),"library export excludes plaintext and encrypted API credentials");
                String before=records().toString();stage(exported);check(field("pendingImport")!=null,"valid export stages successfully");cancel();check(records().toString().equals(before),"cancel restore preserves library");
                replace(new JSONArray(),new JSONArray(),new JSONArray());stage(exported);check(field("pendingImport")!=null,"backup stages against empty library");call(activity,"completeRestore",new Class<?>[]{});cancel();
                check(records().length()==1&&new JSONArray(activity.getPreferences(0).getString("apps","[]")).toString().equals(apps.toString()),"round trip restores custom titles, eight pins, section settings and pack overrides");
                check(call(field("db"),"order",new Class<?>[]{}).equals(order.toString()),"category order restored");
                check(activity.getSharedPreferences("gemini",0).getString("key","").equals(encryptedKey),"library restore preserves this device's Gemini credential");auditCredentials.saveKey("");
                JSONObject view=new JSONObject(activity.getPreferences(0).getString("view","{}"));
                check(view.optString("palette").equals("midnight")&&view.optString("appIconPack").equals("missing.pack")&&view.optString("lastIconPack").equals("missing.pack"),"library restore preserves existing device appearance");
                check(Arrays.equals(Files.readAllBytes(new File((File)field("covers"),records().getJSONObject(0).getString("image").substring(5)).toPath()),image),"custom artwork bytes survive restore");
                before=records().toString();
                for(File invalid:new File[]{zip("missing.zip",manifest,null,null),zip("traversal.zip",manifest,image,"../escape"),zip("badimage.zip",manifest,new byte[]{1,2,3},null)}){stage(invalid);check(field("pendingImport")==null&&records().toString().equals(before),"rejects "+invalid.getName()+" without changing library");}
                JSONObject malformed=new JSONObject(manifest.toString());malformed.getJSONArray("apps").getJSONObject(0).getJSONObject("packIcon").put("name","../bad");stage(zip("badpack.zip",malformed,image,null));check(field("pendingImport")==null&&records().toString().equals(before),"rejects malformed pack reference atomically");
                JSONObject legacy=new JSONObject().put("format","portal-library").put("version",1).put("games",games);stage(zip("legacy.zip",legacy,image,null));check(field("pendingImport")!=null,"version 1 backup remains accepted");cancel();
                java.util.concurrent.CountDownLatch saved=new java.util.concurrent.CountDownLatch(1);
                android.webkit.WebView web=(android.webkit.WebView)field("web");
                runOnMainSync(()->web.evaluateJavascript("appIconPack='missing.pack';lastIconPack='missing.pack';setPalette('midnight');persist();",value->saved.countDown()));
                check(saved.await(10,java.util.concurrent.TimeUnit.SECONDS),"appearance fixture saved through normal UI path");
                check(activity.getPreferences(0).getString("view","").contains("missing.pack"),"appearance fixture persisted before upgrade");
            }
        } catch(Throwable e) {status=1;log.append(android.util.Log.getStackTraceString(e));}
        result.putString("stream",log.toString());finish(status,result);
    }
}

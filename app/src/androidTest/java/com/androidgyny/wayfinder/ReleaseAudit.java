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
    @Override public void onStart() {
        Bundle result=new Bundle();int status=0;
        try {
            check(getTargetContext().getPackageName().equals("com.androidgyny.wayfinder.audit"),"isolated package guard");
            activity=(MainActivity)startActivitySync(new Intent().setClassName(getTargetContext().getPackageName(),MainActivity.class.getName()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));waitForIdleSync();
            for(int i=0;i<100&&!Boolean.TRUE.equals(field("ready"));i++)Thread.sleep(200);
            check(Boolean.TRUE.equals(field("ready")),"native first launch completes");
            for(int i=0;i<100&&!"true".equals(js("typeof restoring !== 'undefined' && !restoring"));i++)Thread.sleep(100);
            check("true".equals(js("!restoring")),"initial settings restoration completes");
            js("window.auditFallback=null;Promise.all(['icon/com.android.settings','app-icon/com.android.settings?pack=missing.pack&drawable=missing'].map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);resolve(c.toDataURL())};im.onerror=reject;im.src=src}))).then(v=>window.auditFallback=v[0]===v[1]).catch(()=>window.auditFallback=false)");
            for(int i=0;i<100&&"null".equals(js("window.auditFallback"));i++)Thread.sleep(100);
            check("true".equals(js("window.auditFallback")),"missing icon pack renders identical system fallback");
            if("verify".equals(args.getString("mode"))){
                check(records().length()==1,"library survives APK replacement");
                check(new JSONArray(activity.getPreferences(0).getString("apps","[]")).length()==8,"eight pins survive APK replacement");
                check(activity.getPreferences(0).getString("view","").contains("missing.pack"),"appearance and pack settings survive APK replacement");
            } else {
                check(records().length()==0,"fresh native installation has empty library");
                Bitmap b=Bitmap.createBitmap(4,4,Bitmap.Config.ARGB_8888);b.eraseColor(0xff448866);ByteArrayOutputStream out=new ByteArrayOutputStream();b.compress(Bitmap.CompressFormat.JPEG,90,out);b.recycle();byte[] image=out.toByteArray();
                JSONObject game=new JSONObject("{\"id\":\"audit\",\"title\":\"Audit game\",\"genre\":\"Puzzles\",\"package\":\"com.android.settings\",\"image\":\"user/audit.jpg\",\"kind\":\"app\",\"favorite\":true}");
                JSONArray games=new JSONArray().put(game),apps=new JSONArray(),order=new JSONArray("[\"Puzzles\",\"Arcade\"]");
                for(int i=0;i<8;i++)apps.put(new JSONObject().put("package","audit.app"+i).put("title","Custom "+i).put("pinned",true).put("order",i).put("section","social").put("hideFromSections",i==7).put("packIcon",new JSONObject().put("pack","missing.pack").put("name","alternate")));
                apps.getJSONObject(0).put("image","user/audit.jpg");
                Files.write(new File((File)field("covers"),"audit.jpg").toPath(),image);
                replace(games,apps,order);
                js("appIconPack='missing.pack';lastIconPack='missing.pack';setPalette('midnight');persist();");
                File exported=new File(activity.getCacheDir(),"export.zip");call(activity,"exportZip",new Class<?>[]{Uri.class},Uri.fromFile(exported));
                JSONObject manifest;try(ZipFile z=new ZipFile(exported)){manifest=new JSONObject(new String(read(z.getInputStream(z.getEntry("library.json"))),"UTF-8"));check(z.size()==2,"backup deduplicates shared cover and app icon");}
                check(manifest.getJSONArray("apps").length()==8,"backup includes eight pins and named pack icons");
                String before=records().toString();stage(exported);check(field("pendingImport")!=null,"valid export stages successfully");cancel();check(records().toString().equals(before),"cancel restore preserves library");
                replace(new JSONArray(),new JSONArray(),new JSONArray());stage(exported);check(field("pendingImport")!=null,"backup stages against empty library");call(activity,"completeRestore",new Class<?>[]{});cancel();
                check(records().length()==1&&new JSONArray(activity.getPreferences(0).getString("apps","[]")).toString().equals(apps.toString()),"round trip restores custom titles, eight pins, section settings and pack overrides");
                check(activity.getPreferences(0).getString("categoryOrder","").equals(order.toString()),"category order restored");
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

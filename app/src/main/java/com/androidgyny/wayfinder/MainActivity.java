package com.androidgyny.wayfinder;

import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.database.Cursor;
import android.database.sqlite.*;
import android.graphics.*;
import android.hardware.input.InputManager;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.media.AudioAttributes;
import android.media.SoundPool;
import android.content.res.AssetFileDescriptor;
import android.os.*;
import android.util.Log;
import android.view.*;
import android.webkit.*;
import android.widget.Toast;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.concurrent.*;
import java.util.zip.*;

public class MainActivity extends Activity {
    private static final String ORIGIN="https://appassets.androidplatform.net";
    private static final int COVER=10, EXPORT=11, IMPORT=12, SHORTCUT=13, UNINSTALL=19, FONT=20;
    private boolean startupTouch; private StartupVideo startup; private int startupSkipKey=-1; private WebView web; private Library db; private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private CustomFont customFont; private BackdropImage background; private AmbientAudio ambient; private Artwork artwork; private File covers; private String pickingId=""; private boolean ready=false; private long lastAxis=0;
    private final Handler directionHandler=new Handler(Looper.getMainLooper()); private String heldDirection; private int heldKey=-1; private long directionStarted;
    private final Runnable repeatDirection=new Runnable(){public void run(){if(heldDirection==null||!ready)return;key(heldDirection);directionHandler.postDelayed(this,SystemClock.uptimeMillis()-directionStarted>900?65:110);}};
    private void stopDirection(){directionHandler.removeCallbacks(repeatDirection);heldDirection=null;heldKey=-1;}
    private boolean leftTriggerKey,rightTriggerKey,leftTriggerAxis,rightTriggerAxis;
    private InputManager inputManager;
    private void cancelControllerInput(){stopDirection();lastAxis=0;leftTriggerKey=rightTriggerKey=leftTriggerAxis=rightTriggerAxis=false;startupSkipKey=-1;}
    private final InputManager.InputDeviceListener inputDevices=new InputManager.InputDeviceListener(){
        public void onInputDeviceAdded(int id){}
        public void onInputDeviceChanged(int id){}
        public void onInputDeviceRemoved(int id){cancelControllerInput();}
    };
    private SoundPool sounds; private final Map<String,Integer> soundIds=new ConcurrentHashMap<>(); private final Set<Integer> loadedSounds=ConcurrentHashMap.newKeySet();
    private volatile boolean restoreBusy; private JSONArray pendingAppPreferences; private JSONArray pendingImport; private File pendingDir;
    private final Map<String,byte[]> iconCache=new ConcurrentHashMap<>();
    private static JSONObject obj(String raw) throws JSONException { return new JSONObject(raw); }
    private String read(InputStream in,int max) throws IOException { return new String(bytes(in,max),StandardCharsets.UTF_8); }
    private byte[] bytes(InputStream in,int max) throws IOException { try(InputStream input=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[32768];int n,total=0;while((n=input.read(b))!=-1){total+=n;if(total>max)throw new IOException("File is too large");out.write(b,0,n);}return out.toByteArray();} }
    private void emit(String event,JSONObject payload){runOnUiThread(()->{if(web!=null)web.evaluateJavascript("window.nativeEvent&&window.nativeEvent("+JSONObject.quote(event)+","+payload.toString()+")",null);});}
    private JSONObject data(String key,Object value){JSONObject o=new JSONObject();try{o.put(key,value);}catch(Exception ignored){}return o;}
    private void notice(String message){emit("notice",data("message",message));}
    private String result(boolean ok,String message){JSONObject o=data("ok",ok);try{o.put("message",message);}catch(Exception ignored){}return o.toString();}
    @Override public void onCreate(Bundle state){
        super.onCreate(state);inputManager=getSystemService(InputManager.class);if(inputManager!=null)inputManager.registerInputDeviceListener(inputDevices,directionHandler);getWindow().setStatusBarColor(Color.rgb(17,22,21));getWindow().setNavigationBarColor(Color.rgb(17,22,21));
        covers=new File(getFilesDir(),"covers");covers.mkdirs();customFont=new CustomFont(this);artwork=new Artwork(this);background=new BackdropImage(this);db=new Library();db.getWritableDatabase();
        sounds=new SoundPool.Builder().setMaxStreams(3).setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).build();
        sounds.setOnLoadCompleteListener((pool,id,status)->{if(status==0)loadedSounds.add(id);else Log.w("WayfinderSound","Could not load sound "+id);});
        for(String name:new String[]{"move","select","back","page","launch"})try(AssetFileDescriptor fd=getAssets().openFd("sounds/"+name+".ogg")){soundIds.put(name,sounds.load(fd,1));}catch(IOException e){Log.w("WayfinderSound","Could not load "+name,e);}
        web=new WebView(this);web.setSoundEffectsEnabled(false);web.setBackgroundColor(Color.rgb(17,22,21));android.widget.FrameLayout root=new android.widget.FrameLayout(this);root.addView(web,new android.widget.FrameLayout.LayoutParams(-1,-1));setContentView(root);startup=new StartupVideo(this,root);ambient=new AmbientAudio(this,()->startup.active(),this::notice);
        WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setAllowFileAccessFromFileURLs(false);s.setAllowUniversalAccessFromFileURLs(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setSupportMultipleWindows(false);s.setMediaPlaybackRequiresUserGesture(true);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);web.addJavascriptInterface(new Bridge(),"Portal");
        web.setWebChromeClient(new WebChromeClient(){@Override public boolean onConsoleMessage(ConsoleMessage m){Log.d("WayfinderWeb",m.message()+" @"+m.lineNumber());return true;}});
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !local(r.getUrl());}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
                Uri u=r.getUrl();if(!local(u))return response("text/plain",new byte[0],403);
                String path=u.getPath();try{
                    if(path==null||path.contains("..")||path.contains("\\"))return response("text/plain",new byte[0],403);
                    if(path.startsWith("/font/"))return customFont.response(path.substring(6));
                    if(path.startsWith("/background/"))return background.response(path.substring(12));
                    if(path.startsWith("/art-preview/"))return response("image/jpeg",artwork.preview(path.substring(13)),200);
                    if(path.equals("/art-remote/"))return response("image/jpeg",artwork.remote(u.getQueryParameter("url")),200);
                    if(path.startsWith("/user/")){String n=path.substring(6);if(!n.matches("[a-zA-Z0-9-]+\\.jpg"))throw new IOException();return new WebResourceResponse("image/jpeg",null,new FileInputStream(new File(covers,n)));}
                    if(path.startsWith("/art-icon/")){String pkg=path.substring(10);if(!pkg.matches("[a-zA-Z0-9_.]+"))throw new IOException();return response("image/png",icon(pkg,512),200);}
                    if(path.startsWith("/icon/")){String pkg=path.substring(6);if(!pkg.matches("[a-zA-Z0-9_.]+"))throw new IOException();return response("image/png",icon(pkg),200);}
                    String file=path.equals("/")?"www/index.html":"www"+path;
                    String mime=path.endsWith(".ttf")?"font/ttf":path.endsWith(".js")?"application/javascript":path.endsWith(".css")?"text/css":path.endsWith(".jpg")?"image/jpeg":path.endsWith(".webp")?"image/webp":"text/html";
                    WebResourceResponse out=new WebResourceResponse(mime,mime.startsWith("image/")?null:"UTF-8",getAssets().open(file));
                    Map<String,String> headers=new HashMap<>();headers.put("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'");out.setResponseHeaders(headers);return out;
                }catch(Exception e){return response("text/plain",new byte[0],404);}
            }
            @Override public void onPageFinished(WebView v,String url){if(!ready){ready=true;finishUninstall(false);focusStartupGame();}}
        });web.loadUrl(ORIGIN+"/index.html");startup.initial();
    }
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);}
    void focusStartupGame(){if(web!=null)web.post(()->{if(web!=null){web.requestFocus();web.evaluateJavascript("window.focusStartupGame&&window.focusStartupGame()",null);}});}
    private boolean local(Uri u){return "https".equals(u.getScheme())&&"appassets.androidplatform.net".equals(u.getHost())&&(u.getPort()==-1||u.getPort()==443);}
    private WebResourceResponse response(String mime,byte[] b,int status){return new WebResourceResponse(mime,null,status,status==200?"OK":status==404?"Not Found":"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(b));}
    private byte[] icon(String pkg) throws Exception {return icon(pkg,192);}
    private byte[] icon(String pkg,int size) throws Exception {String cacheKey=pkg+"/"+size;byte[] found=iconCache.get(cacheKey);if(found!=null)return found;Drawable d=getPackageManager().getApplicationIcon(pkg);Bitmap b=Bitmap.createBitmap(size,size,Bitmap.Config.ARGB_8888);Canvas c=new Canvas(b);d.setBounds(0,0,size,size);d.draw(c);ByteArrayOutputStream out=new ByteArrayOutputStream();b.compress(Bitmap.CompressFormat.PNG,100,out);b.recycle();byte[] a=out.toByteArray();if(iconCache.size()<300)iconCache.put(cacheKey,a);return a;}
    @Override protected void onResume(){super.onResume();if(ambient!=null)ambient.resume();if(web!=null)web.onResume();if(ready){web.evaluateJavascript("window.onNativeResume&&window.onNativeResume()",null);emit("homeStatus",new JSONObject());}}
    @Override protected void onPause(){if(ambient!=null)ambient.leave();cancelControllerInput();if(startup!=null)startup.dismiss();if(web!=null){web.evaluateJavascript("window.onNativePause&&window.onNativePause();window.persist&&window.persist()",null);web.onPause();}leftTriggerKey=rightTriggerKey=leftTriggerAxis=rightTriggerAxis=false;super.onPause();}
    @Override protected void onDestroy(){cancelControllerInput();if(inputManager!=null)inputManager.unregisterInputDeviceListener(inputDevices);if(ambient!=null)ambient.destroy();if(startup!=null)startup.dismiss();if(web!=null){web.removeJavascriptInterface("Portal");web.destroy();web=null;}if(sounds!=null){sounds.release();sounds=null;}worker.shutdown();db.close();super.onDestroy();}
    @Override public void onBackPressed(){if(startup.active()){startup.finishPlayback();return;}web.evaluateJavascript("window.nativeBack&&window.nativeBack()",value->{if(!"true".equals(value))moveTaskToBack(true);});}
    private void key(String key){web.evaluateJavascript("window.controller&&window.controller("+JSONObject.quote(key)+")",null);}
    @Override public boolean dispatchTouchEvent(MotionEvent e){if(startup!=null&&(startup.active()||startupTouch)){startupTouch=true;if(e.getActionMasked()==MotionEvent.ACTION_UP||e.getActionMasked()==MotionEvent.ACTION_CANCEL){startup.finishPlayback();startupTouch=false;}return true;}return super.dispatchTouchEvent(e);}
    @Override public boolean dispatchKeyEvent(KeyEvent e){int k=e.getKeyCode();String action=null;
        if(k==startupSkipKey){if(e.getAction()==KeyEvent.ACTION_UP)startupSkipKey=-1;return true;}
        if(startup.active()&&k!=KeyEvent.KEYCODE_VOLUME_UP&&k!=KeyEvent.KEYCODE_VOLUME_DOWN&&k!=KeyEvent.KEYCODE_POWER){if(e.getAction()==KeyEvent.ACTION_DOWN){startupSkipKey=k;startup.finishPlayback();}return true;}
        if(ready&&(k==KeyEvent.KEYCODE_BUTTON_L2||k==KeyEvent.KEYCODE_BUTTON_R2)){trigger(k==KeyEvent.KEYCODE_BUTTON_L2,e.getAction()==KeyEvent.ACTION_DOWN,false);return true;}
        if(k==KeyEvent.KEYCODE_BUTTON_THUMBR)return true;
        if(k==KeyEvent.KEYCODE_BUTTON_THUMBL)action="apps";else if(k==KeyEvent.KEYCODE_BUTTON_SELECT)action="favorite";else if(k==KeyEvent.KEYCODE_BUTTON_A||k==KeyEvent.KEYCODE_DPAD_CENTER)action="activate";else if(k==KeyEvent.KEYCODE_BUTTON_B)action="back";else if(k==KeyEvent.KEYCODE_BUTTON_X)action="edit";else if(k==KeyEvent.KEYCODE_BUTTON_Y)action="search";else if(k==KeyEvent.KEYCODE_BUTTON_L1)action="genrePrev";else if(k==KeyEvent.KEYCODE_BUTTON_R1)action="genreNext";else if(k==KeyEvent.KEYCODE_BUTTON_START)action="menu";
        else if(k==KeyEvent.KEYCODE_DPAD_UP)action="up";else if(k==KeyEvent.KEYCODE_DPAD_DOWN)action="down";else if(k==KeyEvent.KEYCODE_DPAD_LEFT)action="left";else if(k==KeyEvent.KEYCODE_DPAD_RIGHT)action="right";
        if(action!=null&&ready&&(k==KeyEvent.KEYCODE_DPAD_UP||k==KeyEvent.KEYCODE_DPAD_DOWN||k==KeyEvent.KEYCODE_DPAD_LEFT||k==KeyEvent.KEYCODE_DPAD_RIGHT)){if(e.getAction()==KeyEvent.ACTION_UP){if(k==heldKey)stopDirection();}else if(e.getRepeatCount()==0){stopDirection();heldKey=k;heldDirection=action;directionStarted=SystemClock.uptimeMillis();key(action);directionHandler.postDelayed(repeatDirection,280);}return true;}
        if(action!=null&&ready){if(e.getAction()==KeyEvent.ACTION_DOWN&&(action.equals("genrePrev")||action.equals("genreNext")||e.getRepeatCount()==0))key(action);return true;}return super.dispatchKeyEvent(e);
    }
    @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);if(!focused)cancelControllerInput();}
    private void trigger(boolean left,boolean down,boolean analog){
        boolean was=left?(leftTriggerKey||leftTriggerAxis):(rightTriggerKey||rightTriggerAxis);
        if(left){if(analog)leftTriggerAxis=down;else leftTriggerKey=down;}
        else{if(analog)rightTriggerAxis=down;else rightTriggerKey=down;}
        boolean pressed=left?(leftTriggerKey||leftTriggerAxis):(rightTriggerKey||rightTriggerAxis);
        if(ready&&pressed&&!was)key(left?"pageUp":"pageDown");
    }
    @Override public boolean onGenericMotionEvent(MotionEvent e){if(startup.active())return true;if((e.getSource()&InputDevice.SOURCE_JOYSTICK)==InputDevice.SOURCE_JOYSTICK&&e.getAction()==MotionEvent.ACTION_MOVE){float lt=Math.max(e.getAxisValue(MotionEvent.AXIS_LTRIGGER),e.getAxisValue(MotionEvent.AXIS_BRAKE)),rt=Math.max(e.getAxisValue(MotionEvent.AXIS_RTRIGGER),e.getAxisValue(MotionEvent.AXIS_GAS));trigger(true,lt>(leftTriggerAxis?.25f:.55f),true);trigger(false,rt>(rightTriggerAxis?.25f:.55f),true);if(heldKey!=-1)return true;float x=e.getAxisValue(MotionEvent.AXIS_HAT_X),y=e.getAxisValue(MotionEvent.AXIS_HAT_Y);if(Math.abs(x)<.4)x=e.getAxisValue(MotionEvent.AXIS_X);if(Math.abs(y)<.4)y=e.getAxisValue(MotionEvent.AXIS_Y);if(Math.max(Math.abs(x),Math.abs(y))<=.6)lastAxis=0;long now=SystemClock.uptimeMillis();if(Math.max(Math.abs(x),Math.abs(y))>.6&&now-lastAxis>90){lastAxis=now;key(Math.abs(x)>Math.abs(y)?(x>0?"right":"left"):(y>0?"down":"up"));}return true;}return super.onGenericMotionEvent(e);}
    private class Library extends SQLiteOpenHelper {
        Library(){super(MainActivity.this,"library.db",null,2);}
        @Override public void onCreate(SQLiteDatabase d){d.execSQL("CREATE TABLE games (id TEXT PRIMARY KEY NOT NULL, record TEXT NOT NULL)");try{JSONArray a=new JSONArray(read(getAssets().open("library.json"),12000000));for(int i=0;i<a.length();i++){JSONObject g=a.getJSONObject(i);ContentValues v=new ContentValues();v.put("id",g.getString("id"));v.put("record",g.toString());d.insertOrThrow("games",null,v);}}catch(Exception e){throw new RuntimeException(e);}}
        @Override public void onUpgrade(SQLiteDatabase d,int a,int b){
            if(a<2){try{JSONArray records=new JSONArray();try(Cursor c=d.rawQuery("SELECT record FROM games",null)){while(c.moveToNext())records.put(new JSONObject(c.getString(0)));}for(int i=0;i<records.length();i++){JSONObject g=records.getJSONObject(i);normalizeRecord(g);ContentValues v=new ContentValues();v.put("record",g.toString());d.update("games",v,"id=?",new String[]{g.getString("id")});}}catch(Exception e){throw new RuntimeException("Could not upgrade library",e);}}
        }
        synchronized JSONArray all(){JSONArray a=new JSONArray();try(Cursor c=getReadableDatabase().rawQuery("SELECT record FROM games ORDER BY id",null)){while(c.moveToNext())try{a.put(new JSONObject(c.getString(0)));}catch(Exception e){throw new RuntimeException(e);}}return a;}
        // Run on the JavaScript bridge thread, before returning the library. Original
        // personal builds kept covers in the APK; updates must not own user artwork.
        synchronized void migrateBundledCovers(){
            JSONArray records=all();Map<String,String> migrated=new HashMap<>();List<JSONObject> updates=new ArrayList<>();
            for(int i=0;i<records.length();i++){
                JSONObject game=records.optJSONObject(i);String image=game.optString("image");
                if(!image.matches("art/[0-9]+\\.jpg"))continue;
                File temporary=null;
                try{
                    String stored=migrated.get(image);
                    if(stored==null){
                        String name=UUID.randomUUID()+".jpg";File target=new File(covers,name);
                        temporary=File.createTempFile("cover-migration-",".tmp",covers);
                        try(InputStream in=getAssets().open("www/"+image);FileOutputStream out=new FileOutputStream(temporary)){
                            byte[] buffer=new byte[32768];int n;while((n=in.read(buffer))!=-1)out.write(buffer,0,n);out.getFD().sync();
                        }
                        BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;
                        BitmapFactory.decodeFile(temporary.getPath(),options);
                        if(options.outWidth<=0||options.outHeight<=0)throw new IOException("Invalid bundled cover");
                        if(!temporary.renameTo(target))throw new IOException("Could not store cover");
                        stored="user/"+name;migrated.put(image,stored);
                    }
                    game.put("image",stored);updates.add(game);
                }catch(Exception e){Log.w("WayfinderCovers","Keeping original cover reference: "+image,e);}
                finally{if(temporary!=null&&temporary.exists())temporary.delete();}
            }
            if(updates.isEmpty())return;
            SQLiteDatabase database=getWritableDatabase();database.beginTransaction();
            try{
                for(JSONObject game:updates){ContentValues values=new ContentValues();values.put("record",game.toString());database.update("games",values,"id=?",new String[]{game.optString("id")});}
                database.setTransactionSuccessful();
                Log.i("WayfinderCovers","Moved "+updates.size()+" cover references into permanent storage");
            }finally{database.endTransaction();}
        }
        synchronized JSONObject get(String id) throws Exception {try(Cursor c=getReadableDatabase().rawQuery("SELECT record FROM games WHERE id=?",new String[]{id})){if(c.moveToFirst())return new JSONObject(c.getString(0));}throw new IOException("This game is no longer in the library");}
        synchronized void put(JSONObject g) throws Exception {validate(g);ContentValues v=new ContentValues();v.put("id",g.getString("id"));v.put("record",g.toString());getWritableDatabase().insertWithOnConflict("games",null,v,SQLiteDatabase.CONFLICT_REPLACE);}
        synchronized void remove(String id){getWritableDatabase().delete("games","id=?",new String[]{id});}
        synchronized void replace(JSONArray a) throws Exception {replace(a,null);}
        synchronized void replace(JSONArray a,JSONArray apps) throws Exception {
            SQLiteDatabase d=getWritableDatabase();String previous=apps==null?null:getPreferences(0).getString("apps","[]");boolean preferencesTouched=false,complete=false;
            try{
                d.beginTransaction();
                try{
                    d.delete("games",null,null);for(int i=0;i<a.length();i++)put(a.getJSONObject(i));
                    if(apps!=null){preferencesTouched=true;if(!getPreferences(0).edit().putString("apps",apps.toString()).commit())throw new IOException("Could not save app preferences");}
                    d.setTransactionSuccessful();
                }finally{d.endTransaction();}
                complete=true;
            }finally{if(!complete&&preferencesTouched)getPreferences(0).edit().putString("apps",previous).commit();}
        }
    }
    private boolean uninstallableRecord(JSONObject g){return "app".equals(g.optString("kind"))&&!g.has("intentUri")&&!getPackageName().equals(g.optString("package"));}
    private boolean packageInstalled(String pkg) throws Exception {
        try{return (getPackageManager().getApplicationInfo(pkg,0).flags&ApplicationInfo.FLAG_INSTALLED)!=0;}
        catch(PackageManager.NameNotFoundException e){return false;}
    }
    private void finishUninstall(boolean returned){
        String pkg=getPreferences(0).getString("pendingUninstall","");if(pkg.isEmpty())return;
        try{
            if(packageInstalled(pkg)){if(returned)getPreferences(0).edit().remove("pendingUninstall").commit();return;}
            JSONArray records=db.all();for(int i=0;i<records.length();i++){JSONObject g=records.getJSONObject(i);if(pkg.equals(g.optString("package"))&&uninstallableRecord(g))db.remove(g.getString("id"));}
            iconCache.keySet().removeIf(key->key.startsWith(pkg+"/"));
            getPreferences(0).edit().remove("pendingUninstall").commit();
            emit("appUninstalled",data("package",pkg));
        }catch(Exception e){notice("Could not refresh the library after uninstalling. Please reopen Wayfinder.");}
    }
    private void normalizeRecord(JSONObject g) throws JSONException {
        g.put("favorite",g.optBoolean("favorite",false));
        g.remove("original");g.remove("original_category");g.remove("classification");g.remove("entryId");
        g.put("kind",g.optString("kind").equals("shortcut")?"shortcut":"app");
    }
    private void validate(JSONObject g) throws Exception {
        normalizeRecord(g);
        String id=g.getString("id"),title=g.getString("title"),genre=g.getString("genre"),pkg=g.getString("package"),image=g.getString("image");
        if(!id.matches("[a-zA-Z0-9_-]{1,100}")||title.trim().isEmpty()||title.length()>250||genre.trim().isEmpty()||genre.length()>100||!pkg.matches("[a-zA-Z0-9_.]+"))throw new IOException("Invalid game details");
        if(!image.matches("art/[0-9]+\\.jpg|user/[a-zA-Z0-9-]+\\.jpg|icon/[a-zA-Z0-9_.]+"))throw new IOException("Invalid cover image");
        if(g.has("component")){ComponentName component=ComponentName.unflattenFromString(g.getString("component"));if(component==null||!pkg.equals(component.getPackageName()))throw new IOException("Invalid game target");}
        if(g.optString("intentUri").length()>16000)throw new IOException("Shortcut is too long");
    }
    private Intent target(JSONObject g) throws Exception {
        String pkg=g.getString("package");Intent intent;
        if(g.has("intentUri")){intent=Intent.parseUri(g.getString("intentUri"),0);if(intent.getComponent()==null||!pkg.equals(intent.getComponent().getPackageName()))throw new IOException("Invalid shortcut target");intent.setSelector(null);intent.setClipData(null);intent.setFlags(0);}
        else if(g.has("component")){intent=new Intent(g.optString("action",Intent.ACTION_MAIN));intent.setComponent(ComponentName.unflattenFromString(g.getString("component")));JSONObject extras=g.optJSONObject("extras");if(extras!=null){Iterator<String> it=extras.keys();while(it.hasNext()){String k=it.next();Object v=extras.get(k);if(v instanceof Integer)intent.putExtra(k,(int)v);else if(v instanceof Long)intent.putExtra(k,(long)v);else if(v instanceof Boolean)intent.putExtra(k,(boolean)v);else intent.putExtra(k,v.toString());}}}
        else{intent=getPackageManager().getLaunchIntentForPackage(pkg);if(intent==null)throw new ActivityNotFoundException("This app is not installed or has no launch screen");}
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);return intent;
    }
    public class Bridge {
        @JavascriptInterface public String appVersion(){return BuildConfig.VERSION_NAME;}
        @JavascriptInterface public void artworkSearch(String session,String pkg){worker.execute(()->{try{JSONObject event=data("session",session);event.put("items",artwork.playImages(pkg));emit("artworkResults",event);}catch(Exception e){JSONObject event=data("session",session);try{event.put("message","No artwork could be retrieved. Try opening the store page or another source.");}catch(Exception ignored){}emit("artworkError",event);}});}
        @JavascriptInterface public void artworkDownload(String session,String url){worker.execute(()->{try{JSONObject event=data("session",session);event.put("image",artwork.importBytes(artwork.download(url,20000000)));emit("artworkImage",event);}catch(Exception e){JSONObject event=data("session",session);try{event.put("message","Could not load that image. Use a direct HTTPS image link, or download it and choose the file.");}catch(Exception ignored){}emit("artworkError",event);}});}
        @JavascriptInterface public void artworkSave(String session,String encoded){worker.execute(()->{try{if(encoded==null||encoded.length()>8000000||!encoded.startsWith("data:image/jpeg;base64,"))throw new IOException();byte[] raw=android.util.Base64.decode(encoded.substring(23),android.util.Base64.DEFAULT);String image=artwork.save(raw,covers);JSONObject event=data("session",session);event.put("image",image);emit("artworkSaved",event);}catch(Exception e){JSONObject event=data("session",session);try{event.put("message","Could not save artwork. Please try again.");}catch(Exception ignored){}emit("artworkError",event);}});}
        @JavascriptInterface public void openArtworkLink(String url){runOnUiThread(()->{try{Uri u=Uri.parse(url);String h=u.getHost();if(!"https".equals(u.getScheme())||!("www.google.com".equals(h)||"play.google.com".equals(h)||"www.steamgriddb.com".equals(h)))return;startActivity(new Intent(Intent.ACTION_VIEW,u).addCategory(Intent.CATEGORY_BROWSABLE));}catch(Exception e){notice("No browser is available to open this search");}});}

        @JavascriptInterface public void setThemeColor(String color){if(color!=null&&color.matches("#[0-9a-fA-F]{6}"))runOnUiThread(()->{int value=Color.parseColor(color);getWindow().setStatusBarColor(value);getWindow().setNavigationBarColor(value);if(startup!=null)startup.matchBackground(value);View decor=getWindow().getDecorView();int flags=decor.getSystemUiVisibility(),light=View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;boolean bright=(Color.red(value)*.2126+Color.green(value)*.7152+Color.blue(value)*.0722)>160;decor.setSystemUiVisibility(bright?flags|light:flags&~light);});}


        @JavascriptInterface public int sound(String name){Integer id=soundIds.get(name);SoundPool pool=sounds;if(pool==null||id==null||!loadedSounds.contains(id))return 0;return pool.play(id,name.equals("move")?.22f:.35f,name.equals("move")?.22f:.35f,1,0,1f);}

        @JavascriptInterface public String appsPreferences(){try{return appPreferences().toString();}catch(Exception e){return "[]";}}
        @JavascriptInterface public String reorderApps(String raw){try{synchronized(MainActivity.this){JSONArray ids=new JSONArray(raw),list=appPreferences();Map<String,JSONObject> pins=new HashMap<>();for(int i=0;i<list.length();i++){JSONObject a=list.getJSONObject(i);if(a.optBoolean("pinned"))pins.put(a.getString("package"),a);}if(ids.length()!=pins.size())throw new IOException("Pinned apps changed; try again");for(int i=0;i<ids.length();i++){JSONObject a=pins.remove(ids.getString(i));if(a==null)throw new IOException("Invalid pinned order");a.put("order",i);}if(!getPreferences(0).edit().putString("apps",list.toString()).commit())throw new IOException("Could not save order");return result(true,"Saved");}}catch(Exception e){return result(false,e.getMessage());}}
        @JavascriptInterface public String saveApp(String raw){try{storeAppPreference(obj(raw));return result(true,"Saved");}catch(Exception e){return result(false,e.getMessage());}}
        @JavascriptInterface public void drawerApps(){worker.execute(()->{try{JSONArray list=new JSONArray();Set<String> seen=new HashSet<>();PackageManager pm=getPackageManager();
            for(ResolveInfo r:pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER),0)){if(r.activityInfo==null||!r.activityInfo.exported)continue;String pkg=r.activityInfo.packageName;if(pkg.equals(getPackageName())||!seen.add(pkg))continue;
                JSONObject a=data("package",pkg);a.put("title",r.loadLabel(pm).toString());a.put("isGame",r.activityInfo.applicationInfo.category==ApplicationInfo.CATEGORY_GAME);list.put(a);}
            emit("drawerInstalled",data("apps",list));}catch(Exception e){notice("Could not load installed apps: "+e.getMessage());}});}
        @JavascriptInterface public void launchApp(String pkg){runOnUiThread(()->{try{if(!pkg.matches("[a-zA-Z0-9_.]+"))throw new IOException("Invalid app");Intent intent=getPackageManager().getLaunchIntentForPackage(pkg);if(intent==null)throw new IOException("App is unavailable");startActivity(intent);
            JSONObject a=data("package",pkg);JSONArray list=appPreferences();for(int i=0;i<list.length();i++)if(list.getJSONObject(i).getString("package").equals(pkg))a=list.getJSONObject(i);a.put("lastUsed",System.currentTimeMillis());storeAppPreference(a);emit("appLaunched",data("package",pkg));
        }catch(Exception e){notice("Could not open app: "+e.getMessage());}});}
        @JavascriptInterface public void appInfo(String pkg){runOnUiThread(()->{try{if(!pkg.matches("[a-zA-Z0-9_.]+"))return;startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+pkg)));}catch(Exception e){notice("App info is unavailable");}});}
        @JavascriptInterface public boolean isDefaultLauncher(){Intent home=new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);ResolveInfo match=getPackageManager().resolveActivity(home,PackageManager.MATCH_DEFAULT_ONLY);return match!=null&&match.activityInfo!=null&&getPackageName().equals(match.activityInfo.packageName);}
        @JavascriptInterface public void chooseDefaultLauncher(){runOnUiThread(()->{
            try{if(Build.VERSION.SDK_INT>=29){android.app.role.RoleManager role=getSystemService(android.app.role.RoleManager.class);if(role!=null&&role.isRoleAvailable(android.app.role.RoleManager.ROLE_HOME)&&!role.isRoleHeld(android.app.role.RoleManager.ROLE_HOME)){startActivityForResult(role.createRequestRoleIntent(android.app.role.RoleManager.ROLE_HOME),15);return;}}startActivity(new Intent(android.provider.Settings.ACTION_HOME_SETTINGS));}
            catch(Exception e){try{startActivity(new Intent(android.provider.Settings.ACTION_HOME_SETTINGS));}catch(Exception ignored){notice("Open Android Settings to choose your default home app");}}
        });}
        @JavascriptInterface public void androidSettings(){runOnUiThread(()->{try{startActivity(new Intent(android.provider.Settings.ACTION_SETTINGS));}catch(Exception e){notice("Android Settings is unavailable");}});}
        @JavascriptInterface public String library(){db.migrateBundledCovers();return db.all().toString();}
        @JavascriptInterface public String view(){return getPreferences(0).getString("view","{}");}
        @JavascriptInterface public void showKeyboard(){runOnUiThread(()->{if(web==null)return;web.requestFocus();web.post(()->{if(web!=null)((android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).showSoftInput(web,android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);});});}
        @JavascriptInterface public void saveView(String value){if(value!=null&&value.length()<=512000)getPreferences(0).edit().putString("view",value).apply();else notice("Could not save settings: navigation history is too large");}
        @JavascriptInterface public String clearRecent(String id){try{JSONObject g=db.get(id);g.put("lastPlayed",0);db.put(g);return result(true,"Saved");}catch(Exception e){return result(false,e.getMessage());}}
        @JavascriptInterface public String favorite(String id,boolean value){try{JSONObject g=db.get(id);g.put("favorite",value);db.put(g);return result(true,"Saved");}catch(Exception e){return result(false,e.getMessage());}}
        @JavascriptInterface public String save(String raw){try{JSONObject g=obj(raw);validate(g);if(g.optString("kind").equals("app")&&g.has("component")){ActivityInfo a=getPackageManager().getActivityInfo(ComponentName.unflattenFromString(g.getString("component")),0);if(!a.exported)throw new IOException("App does not allow launching this screen");}db.put(g);return result(true,"Saved");}catch(Exception e){return result(false,e.getMessage());}}
        @JavascriptInterface public boolean canUninstall(String id){try{JSONObject g=db.get(id);return uninstallableRecord(g)&&packageInstalled(g.getString("package"));}catch(Exception e){return false;}}
        @JavascriptInterface public void uninstallGame(String id){runOnUiThread(()->{
            try{
                JSONObject g=db.get(id);if(!uninstallableRecord(g)||!packageInstalled(g.getString("package")))throw new IOException("This entry is not an installed Android app");
                String pkg=g.getString("package");
                if(!getPreferences(0).getString("pendingUninstall","").isEmpty())throw new IOException("An uninstall request is already pending");
                Intent request=new Intent(Intent.ACTION_UNINSTALL_PACKAGE,Uri.parse("package:"+pkg)).putExtra(Intent.EXTRA_RETURN_RESULT,true);
                if(!getPreferences(0).edit().putString("pendingUninstall",pkg).commit())throw new IOException("Could not save uninstall request");
                try{startActivityForResult(request,UNINSTALL);}catch(Exception e){getPreferences(0).edit().remove("pendingUninstall").commit();throw e;}
            }catch(Exception e){notice("Could not open uninstall: "+e.getMessage());}
        });}
        @JavascriptInterface public String remove(String id){try{db.remove(id);return result(true,"Removed from library");}catch(Exception e){return result(false,"Could not remove this entry. Please try again.");}}
        @JavascriptInterface public void launch(String id){runOnUiThread(()->{
            JSONObject g;
            try{g=db.get(id);}catch(Exception e){notice("This game is no longer in the library");return;}
            try{startActivity(target(g));}
            catch(ActivityNotFoundException e){Log.w("WayfinderLaunch",id,e);emit("launchMissing",data("id",id));return;}
            catch(Exception e){Log.w("WayfinderLaunch",id,e);notice("Could not launch: "+e.getMessage());return;}
            try{g.put("lastPlayed",System.currentTimeMillis());db.put(g);emit("launched",data("id",id));}
            catch(Exception e){Log.w("WayfinderLaunch","Could not record launch",e);}
        });}
        @JavascriptInterface public void installed(){worker.execute(()->{
            JSONArray apps=new JSONArray();
            try{
                PackageManager pm=getPackageManager();Set<String> seen=new HashSet<>();
                List<ResolveInfo> found=pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER),0);
                for(ResolveInfo entry:found){
                    if(entry.activityInfo==null||!entry.activityInfo.exported||entry.activityInfo.packageName.equals(getPackageName()))continue;
                    String component=new ComponentName(entry.activityInfo.packageName,entry.activityInfo.name).flattenToString();
                    // Multiple matching intent filters may return the same launch activity.
                    // Preserve distinct activities, even when they belong to the same package.
                    if(!seen.add(component))continue;
                    JSONObject app=new JSONObject();app.put("title",entry.loadLabel(pm).toString());app.put("package",entry.activityInfo.packageName);
                    app.put("component",component);app.put("isGame",entry.activityInfo.applicationInfo.category==ApplicationInfo.CATEGORY_GAME);apps.put(app);
                }
                emit("installed",data("apps",apps));
            }catch(Exception e){notice("Could not list apps: "+e.getMessage());}
        });}
        @JavascriptInterface public String customFontSettings(){return customFont.settings();}
        @JavascriptInterface public boolean acceptCustomFont(String file){return customFont.accept(file);}
        @JavascriptInterface public void discardCustomFont(String file){customFont.discard(file);}
        @JavascriptInterface public void chooseCustomFont(){runOnUiThread(()->{try{startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE),FONT);}catch(Exception e){notice("No file picker is available");}});}
        @JavascriptInterface public String backgroundSettings(){return background.settings();}
        @JavascriptInterface public void chooseBackground(){runOnUiThread(()->{try{startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE),16);}catch(Exception e){notice("No image picker is available");}});}
        @JavascriptInterface public void clearBackground(){worker.execute(()->{background.clear();emit("backgroundRemoved",new JSONObject());});}
        @JavascriptInterface public String ambientSettings(){return ambient.settings();}
        @JavascriptInterface public void configureAmbient(boolean enabled,int volume){runOnUiThread(()->ambient.configure(enabled,volume));}
        @JavascriptInterface public void selectAmbient(String source){runOnUiThread(()->{ambient.select(source);emit("ambientChanged",new JSONObject());});}
        @JavascriptInterface public void clearAmbient(){runOnUiThread(()->{ambient.clear();emit("ambientChanged",new JSONObject());});}
        @JavascriptInterface public void chooseAmbient(){runOnUiThread(()->{try{startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("audio/*").addCategory(Intent.CATEGORY_OPENABLE),15);}catch(Exception e){notice("No audio file picker is available");}});}
        @JavascriptInterface public String startupSettings(){return startup.settings();}
        @JavascriptInterface public void configureStartup(boolean enabled,boolean sound){startup.configure(enabled,sound);}
        @JavascriptInterface public void previewStartup(){runOnUiThread(()->{ambient.suspend();startup.play();});}
        @JavascriptInterface public void resetStartup(){runOnUiThread(()->{startup.dismiss();startup.reset();emit("startupChanged",new JSONObject());});}
        @JavascriptInterface public void chooseStartup(){runOnUiThread(()->{try{startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("video/*").addCategory(Intent.CATEGORY_OPENABLE),14);}catch(Exception e){notice("No video picker is available");}});}
        @JavascriptInterface public void chooseCover(String id){runOnUiThread(()->{pickingId=id;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,COVER);});}
        @JavascriptInterface public void backup(){runOnUiThread(()->startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/zip").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,"Wayfinder-Backup.zip"),EXPORT));}
        @JavascriptInterface public void restore(){runOnUiThread(()->startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE),IMPORT));}
        @JavascriptInterface public void createShortcut(){runOnUiThread(()->{try{startActivityForResult(Intent.createChooser(new Intent(Intent.ACTION_CREATE_SHORTCUT),"Add a game shortcut"),SHORTCUT);}catch(Exception e){notice("No apps offer shortcut creation on this device");}});}
        @JavascriptInterface public String launchAudit(){JSONArray a=new JSONArray();JSONArray all=db.all();for(int i=0;i<all.length();i++){try{JSONObject g=all.getJSONObject(i);JSONObject r=data("id",g.getString("id"));r.put("title",g.getString("title"));try{Intent intent=target(g);ActivityInfo info=getPackageManager().getActivityInfo(intent.getComponent(),0);r.put("ok",info.exported&&info.enabled);r.put("component",intent.getComponent().flattenToString());}catch(Exception e){r.put("ok",false);r.put("error",e.toString());}a.put(r);}catch(Exception ignored){}}return a.toString();}
    }
    @Override protected void onActivityResult(int request,int result,Intent intent){super.onActivityResult(request,result,intent);if(request==UNINSTALL){finishUninstall(true);return;}if(request==FONT){if(result==RESULT_OK&&intent!=null&&intent.getData()!=null){Uri fontUri=intent.getData();worker.execute(()->{try{emit("customFontCandidate",customFont.stage(fontUri));}catch(Exception e){notice("Could not use font: "+e.getMessage());}});}return;}if(result!=RESULT_OK||intent==null){if(request==COVER)emit("coverCanceled",new JSONObject());return;}if(request==14){Uri uri=intent.getData();if(uri!=null)worker.execute(()->{try{startup.importVideo(uri);emit("startupChanged",new JSONObject());notice("Startup video saved");}catch(Exception e){notice("Could not use video: "+e.getMessage());}});return;}
        if(request==16){Uri uri=intent.getData();if(uri!=null)worker.execute(()->{try{background.importImage(uri);emit("backgroundChanged",new JSONObject());notice("Background saved");}catch(Exception e){notice("Could not use background: "+e.getMessage());}});return;}
        if(request==15){Uri audioUri=intent.getData();if(audioUri!=null){notice("Importing background audio…");worker.execute(()->{try{File staged=ambient.stage(audioUri);String name=ambient.name(audioUri);runOnUiThread(()->{ambient.accept(staged,name);emit("ambientChanged",new JSONObject());notice("Background audio saved");});}catch(Exception e){notice("Could not use audio: "+e.getMessage());}});}return;}
        if(request==SHORTCUT){captureShortcut(intent);return;}Uri uri=intent.getData();if(uri==null)return;
        if(request==COVER){final String id=pickingId;worker.execute(()->{try{byte[] raw=bytes(getContentResolver().openInputStream(uri),32000000);if(id.startsWith("artwork_")){JSONObject event=data("session",id.substring(8));event.put("image",artwork.importBytes(raw));emit("artworkImage",event);return;}BitmapFactory.Options opts=new BitmapFactory.Options();opts.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(raw,0,raw.length,opts);if(opts.outWidth<=0||opts.outHeight<=0)throw new IOException("Choose a supported image");int sample=1;while(Math.max(opts.outWidth,opts.outHeight)/sample>1800)sample*=2;opts.inJustDecodeBounds=false;opts.inSampleSize=sample;Bitmap b=BitmapFactory.decodeByteArray(raw,0,raw.length,opts);if(b==null)throw new IOException("Could not read image");String name=UUID.randomUUID()+".jpg";try(FileOutputStream f=new FileOutputStream(new File(covers,name))){b.compress(Bitmap.CompressFormat.JPEG,93,f);}b.recycle();JSONObject event=data("id",id);event.put("image","user/"+name);emit("cover",event);}catch(Exception e){if(id.startsWith("artwork_")){JSONObject event=data("session",id.substring(8));try{event.put("message","Could not read this image. Choose another file.");}catch(Exception ignored){}emit("artworkError",event);}else notice("Could not select cover: "+e.getMessage());}});}
        else if(request==EXPORT)worker.execute(()->exportZip(uri));else if(request==IMPORT)worker.execute(()->importZip(uri));
    }
    private void exportZip(Uri uri){
        notice("Creating backup…");
        try(ZipOutputStream zip=new ZipOutputStream(getContentResolver().openOutputStream(uri))){
            JSONArray records=db.all(),apps=appPreferences();
            Map<String,String> bundled=new LinkedHashMap<>();Set<String> custom=new LinkedHashSet<>();
            for(int i=0;i<records.length();i++){
                JSONObject game=records.getJSONObject(i);String image=game.getString("image");
                if(image.startsWith("art/")){
                    String portable=bundled.get(image);if(portable==null){portable="user/backup-"+UUID.randomUUID()+".jpg";bundled.put(image,portable);}
                    game.put("image",portable);
                }else if(image.startsWith("user/"))custom.add(image);
            }
            for(int i=0;i<apps.length();i++){String image=apps.getJSONObject(i).optString("image");if(image.startsWith("user/"))custom.add(image);}
            JSONObject backup=data("format","portal-library");backup.put("version",2);backup.put("games",records);backup.put("apps",apps);
            zip.putNextEntry(new ZipEntry("library.json"));zip.write(backup.toString().getBytes(StandardCharsets.UTF_8));zip.closeEntry();
            for(Map.Entry<String,String> image:bundled.entrySet()){
                zip.putNextEntry(new ZipEntry(image.getValue()));try(InputStream in=getAssets().open("www/"+image.getKey())){byte[] buffer=new byte[32768];int n;while((n=in.read(buffer))!=-1)zip.write(buffer,0,n);}zip.closeEntry();
            }
            for(String image:custom){zip.putNextEntry(new ZipEntry(image));Files.copy(new File(covers,image.substring(5)).toPath(),zip);zip.closeEntry();}
            notice("Backup saved, including your edits and cover artwork");
        }catch(Exception e){notice("Backup failed: "+e.getMessage());}
    }
    private void importZip(Uri uri){if(restoreBusy){notice("Finish or cancel the current restore first");return;}restoreBusy=true;notice("Checking backup…");File stage=new File(getCacheDir(),"restore-"+UUID.randomUUID());stage.mkdirs();try(ZipInputStream zip=new ZipInputStream(getContentResolver().openInputStream(uri))){JSONArray records=null,apps=null;ZipEntry entry;int total=0;Set<String> names=new HashSet<>();while((entry=zip.getNextEntry())!=null){String name=entry.getName();if(entry.isDirectory())continue;if(!names.add(name))throw new IOException("Duplicate backup entry");if(!name.equals("library.json")&&!name.matches("user/[a-zA-Z0-9-]+\\.jpg"))throw new IOException("Unexpected backup file");ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buf=new byte[32768];int n,count=0;while((n=zip.read(buf))!=-1){count+=n;total+=n;if(count>16000000||total>512000000)throw new IOException("Backup exceeds size limit");out.write(buf,0,n);}if(name.equals("library.json")){JSONObject backup=obj(out.toString("UTF-8"));if(!backup.optString("format").equals("portal-library")||(backup.optInt("version")!=1&&backup.optInt("version")!=2))throw new IOException("Unsupported backup format");records=backup.getJSONArray("games");apps=backup.optJSONArray("apps");if(backup.optInt("version")==2&&apps==null)throw new IOException("Missing app preferences");}else{try(FileOutputStream f=new FileOutputStream(new File(stage,name.substring(5)))){out.writeTo(f);}}}
        if(records==null||records.length()>20000)throw new IOException("No valid library in backup");Set<String> ids=new HashSet<>();for(int i=0;i<records.length();i++){JSONObject g=records.getJSONObject(i);validate(g);if(!ids.add(g.getString("id")))throw new IOException("Duplicate game ID");String image=g.getString("image");if(image.startsWith("user/")&&!new File(stage,image.substring(5)).isFile())throw new IOException("Missing custom cover");if(image.startsWith("art/"))try(InputStream in=getAssets().open("www/"+image)){} }
        if(apps!=null){validateAppPreferences(apps);for(int i=0;i<apps.length();i++){String image=apps.getJSONObject(i).optString("image");if(!image.isEmpty()&&!new File(stage,image.substring(5)).isFile())throw new IOException("Missing custom app icon");}}
        pendingAppPreferences=apps;pendingImport=records;pendingDir=stage;final int count=records.length();runOnUiThread(()->{if(isFinishing()||isDestroyed()){clearStage();return;}new AlertDialog.Builder(this).setTitle("Restore library?").setMessage("Replace this library with the "+count+" games in the backup? "+(pendingAppPreferences!=null?"App pins, appearance and app history will also be restored. ":"")+"Your installed games and their save data are not changed.").setNegativeButton("Cancel",(d,w)->clearStage()).setOnCancelListener(d->clearStage()).setPositiveButton("Restore",(d,w)->worker.execute(this::completeRestore)).show();});
    }catch(Exception e){File[] fs=stage.listFiles();if(fs!=null)for(File f:fs)f.delete();stage.delete();restoreBusy=false;notice("Could not restore: "+e.getMessage());}}
    private void completeRestore(){
        List<File> created=new ArrayList<>();boolean complete=false;
        try{
            if(pendingImport==null||pendingDir==null)throw new IOException("No backup is waiting to be restored");
            JSONArray records=new JSONArray(pendingImport.toString()),apps=pendingAppPreferences==null?null:new JSONArray(pendingAppPreferences.toString());
            Map<String,String> remapped=new HashMap<>();
            for(JSONArray list:new JSONArray[]{records,apps}){
                if(list==null)continue;
                for(int i=0;i<list.length();i++){
                    JSONObject entry=list.getJSONObject(i);String image=entry.optString("image");if(!image.startsWith("user/"))continue;
                    String next=remapped.get(image);
                    if(next==null){
                        File destination=new File(covers,UUID.randomUUID()+".jpg");created.add(destination);
                        Files.copy(new File(pendingDir,image.substring(5)).toPath(),destination.toPath());
                        next="user/"+destination.getName();remapped.put(image,next);
                    }
                    entry.put("image",next);
                }
            }
            db.replace(records,apps);complete=true;emit("restored",new JSONObject());
        }catch(Exception e){notice("Restore failed: "+e.getMessage());}
        finally{if(!complete)for(File file:created)file.delete();clearStage();}
    }
    private void clearStage(){if(pendingDir!=null){File[] f=pendingDir.listFiles();if(f!=null)for(File x:f)x.delete();pendingDir.delete();}pendingDir=null;pendingImport=null;pendingAppPreferences=null;restoreBusy=false;}
    private synchronized JSONArray appPreferences() throws JSONException {return new JSONArray(getPreferences(0).getString("apps","[]"));}
    private void validateAppPreferences(JSONArray list) throws Exception {
        if(list.length()>20000)throw new IOException("Too many app preferences");Set<String> seen=new HashSet<>();
        for(int i=0;i<list.length();i++){JSONObject a=list.getJSONObject(i);String pkg=a.getString("package"),image=a.optString("image");
            if(!pkg.matches("[a-zA-Z0-9_.]+")||!seen.add(pkg)||a.optString("title").length()>250||(!image.isEmpty()&&!image.matches("user/[a-zA-Z0-9-]+\\.jpg")))throw new IOException("Invalid app appearance");
            if(!Arrays.asList("auto","app","game").contains(a.optString("classification","auto")))throw new IOException("Invalid app classification");
        }
    }
    private synchronized void storeAppPreference(JSONObject value) throws Exception {
        JSONArray old=appPreferences(),next=new JSONArray();boolean found=false;
        for(int i=0;i<old.length();i++){JSONObject a=old.getJSONObject(i);if(a.getString("package").equals(value.getString("package"))){next.put(value);found=true;}else next.put(a);}
        if(!found)next.put(value);validateAppPreferences(next);if(!getPreferences(0).edit().putString("apps",next.toString()).commit())throw new IOException("Could not save app preferences");
    }
    private void captureShortcut(Intent result){try{Intent target=result.getParcelableExtra(Intent.EXTRA_SHORTCUT_INTENT);String name=result.getStringExtra(Intent.EXTRA_SHORTCUT_NAME);if(target==null)throw new IOException("No launch target returned");if(target.getComponent()==null){ResolveInfo r=getPackageManager().resolveActivity(target,0);if(r==null)throw new IOException("Shortcut target unavailable");target.setComponent(new ComponentName(r.activityInfo.packageName,r.activityInfo.name));}JSONObject g=data("id","new_"+UUID.randomUUID());g.put("title",name==null?"New shortcut":name);g.put("genre","Uncategorized");g.put("kind","shortcut");g.put("package",target.getComponent().getPackageName());g.put("intentUri",target.toUri(0));g.put("image","icon/"+g.getString("package"));g.put("lastPlayed",0);validate(g);emit("newShortcut",data("game",g));}catch(Exception e){notice("Could not add shortcut: "+e.getMessage());}}
}

package com.androidgyny.wayfinder;

import android.app.Activity;
import android.content.*;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.JSONObject;
import java.io.*;
import java.nio.file.*;

/** Local-only startup media; independent of library/view preferences. */
final class StartupVideo {
    private final Activity activity; private final FrameLayout root; private final SharedPreferences prefs;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private FrameLayout overlay; private VideoView video; private WebView animation; private Runnable timeout;
    private int openingColor=0xff151719; private android.app.Dialog curtain; private int transition; private static boolean started;
    StartupVideo(Activity a,FrameLayout r){activity=a;root=r;prefs=a.getSharedPreferences("startup",0);}
    String settings(){try{return new JSONObject().put("enabled",prefs.getBoolean("enabled",true)).put("sound",prefs.getBoolean("sound",true)).put("custom",custom().isFile()).toString();}catch(Exception e){return "{}";}}
    void configure(boolean enabled,boolean sound){prefs.edit().putBoolean("enabled",enabled).putBoolean("sound",sound).commit();}
    private File custom(){return new File(activity.getFilesDir(),"startup-custom.video");}
    void reset(){custom().delete();}
    void initial(){if(started)return;started=true;if(prefs.getBoolean("enabled",true))play();}
    boolean active(){return overlay!=null||curtain!=null;}
    void play(){
        dismiss();if(activity.isFinishing()||activity.isDestroyed())return;
        root.getChildAt(0).setVisibility(View.INVISIBLE);overlay=new FrameLayout(activity);overlay.setBackgroundColor(activity.getWindow().getStatusBarColor());overlay.setClickable(true);overlay.setOnTouchListener((v,e)->{if(e.getAction()==android.view.MotionEvent.ACTION_UP)finishPlayback();return true;});
        if(!custom().isFile()){playAnimation();return;}
        video=new VideoView(activity);video.setFocusable(false);video.setOnTouchListener((v,e)->{if(e.getAction()==android.view.MotionEvent.ACTION_UP)finishPlayback();return true;});
        overlay.addView(video,new FrameLayout.LayoutParams(-1,-1,Gravity.CENTER));
        root.addView(overlay,new FrameLayout.LayoutParams(-1,-1));
        final VideoView current=video;
        video.setOnPreparedListener(mp->{if(video!=current)return;handler.removeCallbacks(timeout);mp.setVolume(prefs.getBoolean("sound",true)?1:0,prefs.getBoolean("sound",true)?1:0);current.start();});
        video.setOnCompletionListener(mp->finishPlayback());video.setOnErrorListener((mp,what,extra)->{dismiss();Toast.makeText(activity,"Could not play startup video",Toast.LENGTH_SHORT).show();return true;});
        timeout=()->dismiss();handler.postDelayed(timeout,8000);
        try{video.setVideoURI(Uri.fromFile(custom()));}catch(Exception e){dismiss();}
    }
    private void playAnimation(){
        final WebView current=new WebView(activity);animation=current;
        openingColor=activity.getWindow().getStatusBarColor();current.setBackgroundColor(openingColor);current.setFocusable(false);current.setSoundEffectsEnabled(false);
        WebSettings settings=current.getSettings();settings.setJavaScriptEnabled(true);settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setBlockNetworkLoads(true);
        current.setVerticalScrollBarEnabled(false);current.setHorizontalScrollBarEnabled(false);
        current.addJavascriptInterface(new Object(){@JavascriptInterface public void complete(){activity.runOnUiThread(()->{if(animation==current)finishPlayback();});}},"StartupHost");
        current.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return true;}
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();String path=uri.getPath();
                if("https".equals(uri.getScheme())&&"startup.wayfinder.local".equals(uri.getHost())&&("/index.html".equals(path)||"/jingle.m4a".equals(path))){
                    try{return new WebResourceResponse(path.endsWith(".html")?"text/html":"audio/mp4",path.endsWith(".html")?"UTF-8":null,activity.getAssets().open("startup"+path));}catch(IOException ignored){}
                }
                return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
            }
            @Override public void onPageFinished(WebView view,String url){if(animation==current){matchBackground(activity.getWindow().getStatusBarColor());current.evaluateJavascript("window.startOpening&&window.startOpening("+prefs.getBoolean("sound",true)+")",null);}}
        });
        overlay.addView(current,new FrameLayout.LayoutParams(-1,-1));root.addView(overlay,new FrameLayout.LayoutParams(-1,-1));
        timeout=()->{if(animation==current)dismiss();};handler.postDelayed(timeout,10000);
        current.loadUrl("https://startup.wayfinder.local/index.html");
    }
    void matchBackground(int color){
        if(animation==null)return;openingColor=color;animation.setBackgroundColor(color);if(overlay!=null)overlay.setBackgroundColor(color);
        boolean light=(android.graphics.Color.red(color)*.2126+android.graphics.Color.green(color)*.7152+android.graphics.Color.blue(color)*.0722)>160;
        animation.evaluateJavascript("window.setOpeningBackground&&window.setOpeningBackground('"+String.format(java.util.Locale.US,"#%06X",color&0xffffff)+"',"+light+")",null);
    }
    // A separate window covers the SurfaceView video during the handoff.
    void finishPlayback(){
        if(curtain!=null||overlay==null)return;
        if(timeout!=null)handler.removeCallbacks(timeout);
        final int token=++transition;
        curtain=new android.app.Dialog(activity);View black=new View(activity);black.setBackgroundColor(animation!=null?openingColor:0xff151719);black.setAlpha(0);curtain.setContentView(black);curtain.setCancelable(false);
        Window w=curtain.getWindow();w.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));w.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);w.addFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);w.setWindowAnimations(0);
        curtain.show();w.setLayout(-1,-1);
        black.animate().alpha(1).setDuration(200).withEndAction(()->{
            if(token!=transition)return;
            removeVideo();
            black.animate().alpha(0).setStartDelay(150).setDuration(350).withEndAction(()->{if(token==transition&&curtain!=null){curtain.dismiss();curtain=null;}}).start();
        }).start();
    }
    private void removeVideo(){if(timeout!=null)handler.removeCallbacks(timeout);if(animation!=null){WebView old=animation;animation=null;old.removeJavascriptInterface("StartupHost");old.stopLoading();old.onPause();if(overlay!=null)overlay.removeView(old);old.destroy();}if(video!=null){video.setOnCompletionListener(null);video.setOnErrorListener(null);video.setOnPreparedListener(null);video.stopPlayback();video=null;}if(overlay!=null){root.removeView(overlay);overlay=null;root.getChildAt(0).setVisibility(View.VISIBLE);((MainActivity)activity).focusStartupGame();}}
    void dismiss(){transition++;if(curtain!=null){curtain.dismiss();curtain=null;}removeVideo();}
    void importVideo(Uri uri) throws Exception {
        File temp=File.createTempFile("startup-",".video",activity.getFilesDir());
        try{
            try(InputStream in=activity.getContentResolver().openInputStream(uri);OutputStream out=new FileOutputStream(temp)){if(in==null)throw new IOException("Cannot open video");byte[] b=new byte[32768];int n;long size=0;while((n=in.read(b))!=-1){size+=n;if(size>200L*1024*1024)throw new IOException("Choose a video smaller than 200 MB");out.write(b,0,n);}}
            MediaMetadataRetriever meta=new MediaMetadataRetriever();try{meta.setDataSource(temp.getAbsolutePath());String width=meta.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH),duration=meta.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);if(width==null||duration==null||Long.parseLong(duration)<=0)throw new IOException("Choose a playable video");}finally{meta.release();}
            Files.move(temp.toPath(),custom().toPath(),StandardCopyOption.REPLACE_EXISTING);
        }finally{temp.delete();}
    }
}

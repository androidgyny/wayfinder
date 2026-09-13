package com.portal.library;

import android.app.Activity;
import android.content.*;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.widget.*;
import org.json.JSONObject;
import java.io.*;
import java.nio.file.*;

/** Local-only startup media; independent of library/view preferences. */
final class StartupVideo {
    private final Activity activity; private final FrameLayout root; private final SharedPreferences prefs;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private FrameLayout overlay; private VideoView video; private Runnable timeout;
    private android.app.Dialog curtain; private int transition; private static boolean started;
    StartupVideo(Activity a,FrameLayout r){activity=a;root=r;prefs=a.getSharedPreferences("startup",0);}
    String settings(){try{return new JSONObject().put("enabled",prefs.getBoolean("enabled",true)).put("sound",prefs.getBoolean("sound",true)).put("custom",custom().isFile()).toString();}catch(Exception e){return "{}";}}
    void configure(boolean enabled,boolean sound){prefs.edit().putBoolean("enabled",enabled).putBoolean("sound",sound).commit();}
    private File custom(){return new File(activity.getFilesDir(),"startup-custom.video");}
    void reset(){custom().delete();}
    void initial(){if(started)return;started=true;if(prefs.getBoolean("enabled",true))play();}
    boolean active(){return overlay!=null||curtain!=null;}
    void play(){
        dismiss();if(activity.isFinishing()||activity.isDestroyed())return;
        root.getChildAt(0).setVisibility(View.INVISIBLE);overlay=new FrameLayout(activity);overlay.setBackgroundColor(0xff151719);overlay.setClickable(true);overlay.setOnTouchListener((v,e)->{if(e.getAction()==android.view.MotionEvent.ACTION_UP)finishPlayback();return true;});
        video=new VideoView(activity);video.setFocusable(false);video.setOnTouchListener((v,e)->{if(e.getAction()==android.view.MotionEvent.ACTION_UP)finishPlayback();return true;});
        overlay.addView(video,new FrameLayout.LayoutParams(-1,-1,Gravity.CENTER));
        TextView hint=new TextView(activity);hint.setText("Tap or press a button to skip");hint.setTextColor(0xffb8bcb7);hint.setTextSize(12);hint.setPadding(20,12,20,20);hint.setGravity(Gravity.CENTER);
        overlay.addView(hint,new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM));root.addView(overlay,new FrameLayout.LayoutParams(-1,-1));
        final VideoView current=video;
        video.setOnPreparedListener(mp->{if(video!=current)return;handler.removeCallbacks(timeout);mp.setVolume(prefs.getBoolean("sound",true)?1:0,prefs.getBoolean("sound",true)?1:0);current.start();});
        video.setOnCompletionListener(mp->finishPlayback());video.setOnErrorListener((mp,what,extra)->{dismiss();Toast.makeText(activity,"Could not play startup video",Toast.LENGTH_SHORT).show();return true;});
        timeout=()->dismiss();handler.postDelayed(timeout,8000);
        try{video.setVideoURI(custom().isFile()?Uri.fromFile(custom()):Uri.parse("android.resource://"+activity.getPackageName()+"/"+R.raw.startup));}catch(Exception e){dismiss();}
    }
    // A separate window covers the SurfaceView video during the handoff.
    void finishPlayback(){
        if(curtain!=null||overlay==null)return;
        if(timeout!=null)handler.removeCallbacks(timeout);
        final int token=++transition;
        curtain=new android.app.Dialog(activity);View black=new View(activity);black.setBackgroundColor(0xff151719);black.setAlpha(0);curtain.setContentView(black);curtain.setCancelable(false);
        Window w=curtain.getWindow();w.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));w.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);w.addFlags(WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);w.setWindowAnimations(0);
        curtain.show();w.setLayout(-1,-1);
        black.animate().alpha(1).setDuration(200).withEndAction(()->{
            if(token!=transition)return;
            removeVideo();
            black.animate().alpha(0).setStartDelay(150).setDuration(350).withEndAction(()->{if(token==transition&&curtain!=null){curtain.dismiss();curtain=null;}}).start();
        }).start();
    }
    private void removeVideo(){if(timeout!=null)handler.removeCallbacks(timeout);if(video!=null){video.setOnCompletionListener(null);video.setOnErrorListener(null);video.setOnPreparedListener(null);video.stopPlayback();video=null;}if(overlay!=null){root.removeView(overlay);overlay=null;root.getChildAt(0).setVisibility(View.VISIBLE);((MainActivity)activity).focusStartupGame();}}
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

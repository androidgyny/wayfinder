package com.androidgyny.wayfinder;

import android.content.*;
import android.database.Cursor;
import android.media.*;
import android.net.Uri;
import android.os.*;
import android.provider.OpenableColumns;
import org.json.JSONObject;
import java.io.*;
import java.util.function.BooleanSupplier;
import java.util.function.Consumer;

/** Bundled or user-owned local ambient audio. All playback state is confined to the main thread. */
final class AmbientAudio {
    private final MainActivity activity;
    private final SharedPreferences prefs;
    private final AudioManager audio;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final BooleanSupplier startupActive;
    private final Consumer<String> error;
    private MediaPlayer player;
    private boolean resumed, prepared, focus, blocked, destroyed;
    private float level;
    private final AudioAttributes attributes=new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build();
    private final AudioFocusRequest request;
    private final BroadcastReceiver noisy=new BroadcastReceiver(){public void onReceive(Context c,Intent i){blocked=true;pause();}};
    AmbientAudio(MainActivity a,BooleanSupplier startup,Consumer<String> onError){
        activity=a;startupActive=startup;error=onError;prefs=a.getSharedPreferences("ambient",0);audio=(AudioManager)a.getSystemService(Context.AUDIO_SERVICE);
        request=new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(attributes).setOnAudioFocusChangeListener(change->{
            if(change==AudioManager.AUDIOFOCUS_GAIN){focus=true;blocked=false;}
            else {focus=false;blocked=true;pause();}
        },handler).build();
        IntentFilter filter=new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        if(Build.VERSION.SDK_INT>=33)a.registerReceiver(noisy,filter,Context.RECEIVER_NOT_EXPORTED);else a.registerReceiver(noisy,filter);
    }
    private File file(){return new File(activity.getFilesDir(),prefs.getString("file","ambient-none"));}
    private String source(){return prefs.getString("source",file().isFile()?"custom":"august");}
    private boolean available(){return source().equals("august")||file().isFile();}
    void select(String source){
        if(!source.equals("august")&&!source.equals("custom"))return;
        suspend();release();prefs.edit().putString("source",source).apply();blocked=audio.isMusicActive();
    }
    String settings(){try{return new JSONObject().put("enabled",prefs.getBoolean("enabled",false)).put("volume",prefs.getInt("volume",20)).put("name",prefs.getString("name","")).put("custom",file().isFile()).put("source",source()).put("available",available()).toString();}catch(Exception e){return "{}";}}
    void configure(boolean enabled,int volume){
        boolean was=prefs.getBoolean("enabled",false);
        prefs.edit().putBoolean("enabled",enabled).putInt("volume",Math.max(0,Math.min(100,volume))).apply();
        if(!enabled){pause();abandon();}else if(!was)blocked=audio.isMusicActive();
    }
    void resume(){resumed=true;blocked=audio.isMusicActive();handler.removeCallbacks(tick);handler.post(tick);}
    void suspend(){pause();abandon();}
    void leave(){resumed=false;handler.removeCallbacks(tick);suspend();}
    private void pause(){if(player!=null&&prepared){try{if(player.isPlaying())player.pause();player.setVolume(0,0);}catch(IllegalStateException ignored){}}level=0;}
    private void abandon(){if(focus){focus=false;audio.abandonAudioFocusRequest(request);}}
    private void release(){if(player!=null){player.release();player=null;}prepared=false;level=0;}
    private final Runnable tick=new Runnable(){public void run(){
        if(!resumed||destroyed)return;
        if(!prefs.getBoolean("enabled",false)||startupActive.getAsBoolean()||blocked||!available()){pause();}
        else if(!focus){
            if(audio.isMusicActive())blocked=true;
            else focus=audio.requestAudioFocus(request)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        }else if(player==null){
            MediaPlayer next=new MediaPlayer();player=next;
            try{
                next.setAudioAttributes(attributes);
                if(source().equals("august")){
                    try(android.content.res.AssetFileDescriptor asset=activity.getResources().openRawResourceFd(R.raw.another_august)){
                        next.setDataSource(asset.getFileDescriptor(),asset.getStartOffset(),asset.getLength());
                    }
                }else next.setDataSource(file().getAbsolutePath());
                next.setLooping(true);next.setVolume(0,0);
                next.setOnPreparedListener(mp->{if(player==mp)prepared=true;});
                next.setOnErrorListener((mp,what,extra)->{failed();return true;});next.prepareAsync();
            }catch(Exception e){failed();}
        }else if(prepared){
            try{float target=prefs.getInt("volume",20)/100f;level+=Math.max(-.025f,Math.min(.025f,target-level));player.setVolume(level,level);if(!player.isPlaying())player.start();}catch(Exception e){failed();}
        }
        handler.postDelayed(this,prepared&&focus&&!blocked&&Math.abs(level-prefs.getInt("volume",20)/100f)>.001f?40:250);
    }};
    private void failed(){release();abandon();blocked=true;error.accept("Could not play background audio. Choose another sound file.");}
    void clear(){suspend();release();File old=file();prefs.edit().clear().apply();old.delete();}
    // Validate on the worker before replacing the current selection. Never load a full track into RAM.
    File stage(Uri uri) throws Exception {
        File temp=File.createTempFile("ambient-",".audio",activity.getFilesDir());
        try{
            try(InputStream in=activity.getContentResolver().openInputStream(uri);OutputStream out=new FileOutputStream(temp)){
                if(in==null)throw new IOException("Cannot open this file");byte[] b=new byte[32768];long size=0;int n;
                while((n=in.read(b))!=-1){size+=n;if(size>200L*1024*1024)throw new IOException("Choose a file smaller than 200 MB");out.write(b,0,n);}
            }
            MediaPlayer check=new MediaPlayer();try{check.setDataSource(temp.getAbsolutePath());check.prepare();boolean track=false;for(MediaPlayer.TrackInfo t:check.getTrackInfo())if(t.getTrackType()==MediaPlayer.TrackInfo.MEDIA_TRACK_TYPE_AUDIO)track=true;if(!track||check.getDuration()<=0)throw new IOException("Choose a playable audio file");}finally{check.release();}
            return temp;
        }catch(Exception e){temp.delete();throw e;}
    }
    String name(Uri uri){try(Cursor c=activity.getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){if(c!=null&&c.moveToFirst())return c.getString(0);}catch(Exception ignored){}return "Your audio file";}
    void accept(File next,String name){
        if(destroyed){next.delete();return;}suspend();release();File old=file();
        prefs.edit().putString("file",next.getName()).putString("source","custom").putString("name",name).putBoolean("enabled",true).apply();old.delete();blocked=audio.isMusicActive();
    }
    void destroy(){destroyed=true;leave();release();activity.unregisterReceiver(noisy);}
}

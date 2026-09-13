package com.androidgyny.wayfinder;

import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.webkit.WebResourceResponse;
import org.json.JSONObject;
import java.io.*;
import java.util.UUID;

// Keep animation bytes intact. A bounded first-frame decode validates imports.
final class BackdropImage {
    private final Context context;
    private final File directory;
    private final SharedPreferences prefs;
    BackdropImage(Context context){this.context=context;directory=new File(context.getFilesDir(),"backdrops");directory.mkdirs();prefs=context.getSharedPreferences("backdrop",Context.MODE_PRIVATE);}
    synchronized String settings(){
        JSONObject o=new JSONObject();try{String file=prefs.getString("file","");boolean exists=!file.isEmpty()&&new File(directory,file).isFile();o.put("url",exists?"background/"+file:"");o.put("name",exists?prefs.getString("name","Custom background"):"");}catch(Exception ignored){}return o.toString();
    }
    synchronized WebResourceResponse response(String name) throws IOException {
        if(!name.equals(prefs.getString("file",""))||!name.matches("[a-zA-Z0-9-]+\\.image"))throw new IOException("Unknown background");
        return new WebResourceResponse(prefs.getString("mime","image/webp"),null,new FileInputStream(new File(directory,name)));
    }
    synchronized void importImage(Uri uri) throws Exception {
        File staged=new File(directory,UUID.randomUUID()+".image");boolean accepted=false;
        try{
            try(InputStream in=context.getContentResolver().openInputStream(uri);OutputStream out=new FileOutputStream(staged)){
                if(in==null)throw new IOException("Could not open image");byte[] buffer=new byte[32768];long size=0;int n;
                while((n=in.read(buffer))!=-1){size+=n;if(size>20L*1024*1024)throw new IOException("Choose an image smaller than 20 MB");out.write(buffer,0,n);}
            }
            BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(staged.getPath(),bounds);
            if(bounds.outWidth<=0||bounds.outHeight<=0||bounds.outMimeType==null)throw new IOException("Choose a WebP, PNG, JPEG, or GIF image");
            if(!java.util.Arrays.asList("image/webp","image/png","image/jpeg","image/gif").contains(bounds.outMimeType))throw new IOException("Unsupported image format");
            if(bounds.outWidth>4096||bounds.outHeight>4096||(long)bounds.outWidth*bounds.outHeight>8388608)throw new IOException("Choose an image up to 4096 pixels per side and 8 megapixels");
            BitmapFactory.Options check=new BitmapFactory.Options();check.inSampleSize=Math.max(1,Math.max(bounds.outWidth,bounds.outHeight)/512);Bitmap first=BitmapFactory.decodeFile(staged.getPath(),check);if(first==null)throw new IOException("Could not decode image");first.recycle();
            String name="Custom background";try(Cursor c=context.getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){if(c!=null&&c.moveToFirst())name=c.getString(0);}catch(Exception ignored){}
            String old=prefs.getString("file","");if(!prefs.edit().putString("file",staged.getName()).putString("mime",bounds.outMimeType).putString("name",name).commit())throw new IOException("Could not save image");accepted=true;
            if(!old.isEmpty())new File(directory,old).delete();
        }finally{if(!accepted)staged.delete();}
    }
    synchronized void clear(){String old=prefs.getString("file","");prefs.edit().clear().commit();if(!old.isEmpty())new File(directory,old).delete();}
}

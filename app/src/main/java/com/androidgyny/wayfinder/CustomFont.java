package com.androidgyny.wayfinder;

import android.app.Activity;
import android.database.Cursor;
import android.graphics.Typeface;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.webkit.WebResourceResponse;
import org.json.JSONObject;
import java.io.*;
import java.util.UUID;

final class CustomFont {
    private final Activity activity;
    private final File directory;
    private String pendingFile="",pendingName="";
    CustomFont(Activity activity){this.activity=activity;directory=new File(activity.getFilesDir(),"fonts");directory.mkdirs();}
    private JSONObject describe(String file,String name)throws Exception{
        JSONObject out=new JSONObject();out.put("file",file);out.put("name",name);out.put("url",file.isEmpty()?"":"font/"+file);return out;
    }
    synchronized String settings(){try{String file=activity.getPreferences(0).getString("customFontFile","");if(!new File(directory,file).isFile())file="";return describe(file,activity.getPreferences(0).getString("customFontName","")).toString();}catch(Exception e){return "{}";}}
    synchronized JSONObject stage(Uri uri)throws Exception{
        String name="Custom font";
        try(Cursor c=activity.getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){if(c!=null&&c.moveToFirst()&&!c.isNull(0))name=c.getString(0);}
        String lower=name.toLowerCase(java.util.Locale.ROOT);
        if(!lower.endsWith(".ttf")&&!lower.endsWith(".otf"))throw new IOException("Choose a TTF or OTF font file");
        String file=UUID.randomUUID()+(lower.endsWith(".otf")?".otf":".ttf");File target=new File(directory,file);
        try{
            try(InputStream input=activity.getContentResolver().openInputStream(uri);FileOutputStream out=new FileOutputStream(target)){
                if(input==null)throw new IOException("Could not read this file");byte[] buffer=new byte[32768];int count,total=0;
                while((count=input.read(buffer))!=-1){total+=count;if(total>10000000)throw new IOException("Choose a font smaller than 10 MB");out.write(buffer,0,count);}
            }
            try(DataInputStream in=new DataInputStream(new FileInputStream(target))){int signature=in.readInt();if(signature!=0x00010000&&signature!=0x4f54544f)throw new IOException("This is not a supported TTF or OTF font");}
            Typeface.createFromFile(target);
            if(!pendingFile.isEmpty())new File(directory,pendingFile).delete();pendingFile=file;pendingName=name;
            return describe(file,name);
        }catch(Exception e){target.delete();throw e;}
    }
    synchronized boolean accept(String file){
        if(!file.equals(pendingFile)||file.isEmpty())return false;
        String old=activity.getPreferences(0).getString("customFontFile","");
        if(!activity.getPreferences(0).edit().putString("customFontFile",file).putString("customFontName",pendingName).commit())return false;
        pendingFile="";pendingName="";if(!old.isEmpty()&&!old.equals(file))new File(directory,old).delete();return true;
    }
    synchronized void discard(String file){if(file.equals(pendingFile)){new File(directory,file).delete();pendingFile="";pendingName="";}}
    WebResourceResponse response(String file)throws Exception{
        if(!file.matches("[a-f0-9-]{36}\\.(ttf|otf)"))throw new IOException("Invalid font path");
        return new WebResourceResponse(file.endsWith(".otf")?"font/otf":"font/ttf",null,new FileInputStream(new File(directory,file)));
    }
}

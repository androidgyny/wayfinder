package com.portal.library;

import android.content.Context;
import android.graphics.*;
import android.net.Uri;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.regex.*;

/** Network artwork stays outside the privileged WebView and is decoded before display. */
final class Artwork {
    private final File cache;
    Artwork(Context context){cache=new File(context.getCacheDir(),"artwork");cache.mkdirs();File[] old=cache.listFiles();if(old!=null)for(File f:old)if(f.lastModified()<System.currentTimeMillis()-86400000L)f.delete();}
    byte[] download(String raw,int limit) throws Exception {
        URL url=new URL(raw);
        for(int redirects=0;redirects<5;redirects++){
            if(!"https".equals(url.getProtocol())||url.getUserInfo()!=null||(url.getPort()!=-1&&url.getPort()!=443))throw new IOException("Use a public HTTPS image");
            for(InetAddress ip:InetAddress.getAllByName(url.getHost()))if(ip.isAnyLocalAddress()||ip.isLoopbackAddress()||ip.isLinkLocalAddress()||ip.isSiteLocalAddress()||ip.isMulticastAddress())throw new IOException("Use a public image host");
            HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(12000);c.setReadTimeout(15000);c.setRequestProperty("User-Agent","Mozilla/5.0 (Android) Wayfinder/0.9");
            try{int status=c.getResponseCode();if(status>=300&&status<400){url=new URL(url,c.getHeaderField("Location"));continue;}if(status!=200)throw new IOException("Image unavailable");if(c.getContentLengthLong()>limit)throw new IOException("Image too large");
                try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[16384];int n,total=0;while((n=in.read(buffer))!=-1){total+=n;if(total>limit)throw new IOException("Image too large");out.write(buffer,0,n);}return out.toByteArray();}
            }finally{c.disconnect();}
        }throw new IOException("Too many redirects");
    }
    private byte[] jpeg(byte[] raw) throws Exception {
        BitmapFactory.Options o=new BitmapFactory.Options();o.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(raw,0,raw.length,o);
        if(o.outWidth<1||o.outHeight<1)throw new IOException("Unsupported image");o.inSampleSize=1;while(Math.max(o.outWidth,o.outHeight)/o.inSampleSize>1800)o.inSampleSize*=2;o.inJustDecodeBounds=false;
        Bitmap source=BitmapFactory.decodeByteArray(raw,0,raw.length,o);if(source==null)throw new IOException("Unsupported image");
        Bitmap flat=Bitmap.createBitmap(source.getWidth(),source.getHeight(),Bitmap.Config.RGB_565);Canvas canvas=new Canvas(flat);canvas.drawColor(Color.rgb(24,30,28));canvas.drawBitmap(source,0,0,null);source.recycle();
        try(ByteArrayOutputStream out=new ByteArrayOutputStream()){flat.compress(Bitmap.CompressFormat.JPEG,94,out);return out.toByteArray();}finally{flat.recycle();}
    }
    String importBytes(byte[] raw) throws Exception {String name=UUID.randomUUID()+".jpg";Files.write(new File(cache,name).toPath(),jpeg(raw));return "art-preview/"+name;}
    byte[] preview(String name) throws Exception {if(!name.matches("[a-zA-Z0-9-]+\\.jpg"))throw new IOException();return Files.readAllBytes(new File(cache,name).toPath());}
    String save(byte[] raw,File covers) throws Exception {String name=UUID.randomUUID()+".jpg";Files.write(new File(covers,name).toPath(),jpeg(raw));return "user/"+name;}
    byte[] remote(String url) throws Exception {
        Uri u=Uri.parse(url==null?"":url);if(!"https".equals(u.getScheme())||!"play-lh.googleusercontent.com".equals(u.getHost()))throw new IOException();
        String key=UUID.nameUUIDFromBytes(url.getBytes(StandardCharsets.UTF_8))+".jpg";File file=new File(cache,key);
        if(file.isFile())return Files.readAllBytes(file.toPath());byte[] result=jpeg(download(url,20000000));File temp=new File(cache,UUID.randomUUID()+".tmp");try{Files.write(temp.toPath(),result);Files.move(temp.toPath(),file.toPath(),java.nio.file.StandardCopyOption.REPLACE_EXISTING);}finally{temp.delete();}return result;
    }
    JSONArray playImages(String pkg) throws Exception {
        if(!pkg.matches("[a-zA-Z0-9_.]+"))throw new IOException();
        String html=new String(download("https://play.google.com/store/apps/details?id="+pkg+"&hl=en",5000000),StandardCharsets.UTF_8);
        Matcher tags=Pattern.compile("<img\\b[^>]*>").matcher(html);Set<String> seen=new HashSet<>();JSONArray images=new JSONArray();boolean foundIcon=false;
        while(tags.find()&&images.length()<13){String tag=tags.group();boolean icon=tag.contains("alt=\"Icon image\"")&&tag.contains("itemprop=\"image\"")&&!foundIcon;boolean screenshot=tag.contains("data-screenshot-index=");if(!icon&&!screenshot)continue;
            Matcher src=Pattern.compile("\\bsrc=\"(https://play-lh\\.googleusercontent\\.com/[^\"]+)\"").matcher(tag);if(!src.find())continue;
            String url=src.group(1).replace("&amp;","&").replaceFirst("=[^/]*$","")+"=s1600";if(!seen.add(url))continue;if(icon)foundIcon=true;
            JSONObject entry=new JSONObject();entry.put("image","art-remote/?url="+Uri.encode(url));entry.put("thumbnail","art-remote/?url="+Uri.encode(url.replace("=s1600","=s320")));entry.put("label",icon?"Store icon":"Screenshot "+images.length());images.put(entry);
        }
        if(images.length()==0)throw new IOException("No images found");return images;
    }
}

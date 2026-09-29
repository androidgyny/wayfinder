package com.androidgyny.wayfinder;

import android.content.*;
import android.content.pm.*;
import android.content.res.*;
import android.graphics.*;
import android.graphics.drawable.Drawable;
import android.util.Xml;
import org.xmlpull.v1.XmlPullParser;
import org.json.*;
import java.io.*;
import java.util.*;

/** Reads explicit component mappings from installed launcher icon packs. */
final class AppIconPacks {
    private final Context context;
    private String loaded="";
    private long version=-1;
    private final Map<String,String> mappings=new HashMap<>();
    private final Map<String,byte[]> images=new LinkedHashMap<String,byte[]>(384,0.75f,true){protected boolean removeEldestEntry(Map.Entry<String,byte[]> e){return size()>384;}};
    private final Map<String,Resources> resourceCache=new HashMap<>();
    private final Map<String,Long> versions=new HashMap<>(),checkedAt=new HashMap<>();
    private final Map<String,JSONArray> catalogs=new HashMap<>();
    private static final java.util.regex.Pattern RESOURCE_NAME=java.util.regex.Pattern.compile("[a-zA-Z0-9_]+");
    private synchronized Resources resources(String pack) throws Exception {
        long now=android.os.SystemClock.elapsedRealtime();
        if(!resourceCache.containsKey(pack)||now-checkedAt.getOrDefault(pack,0L)>2000){
            long current=context.getPackageManager().getPackageInfo(pack,0).lastUpdateTime;
            if(!versions.containsKey(pack)||versions.get(pack)!=current){resourceCache.put(pack,context.getPackageManager().getResourcesForApplication(pack));catalogs.remove(pack);versions.put(pack,current);}
            checkedAt.put(pack,now);
        }
        return resourceCache.get(pack);
    }
    AppIconPacks(Context context){this.context=context;}
    private XmlPullParser parser(Resources res,String pkg) throws Exception {
        int id=res.getIdentifier("appfilter","xml",pkg);
        if(id!=0)return res.getXml(id);
        // Asset XML is consumed inside load(), where its stream can be closed.
        return null;
    }
    JSONArray installed() {
        List<JSONObject> packs=new ArrayList<>();PackageManager pm=context.getPackageManager();
        List<ApplicationInfo> apps=pm.getInstalledApplications(0);
        for(ApplicationInfo app:apps)try{
            Resources res=pm.getResourcesForApplication(app);
            boolean found=res.getIdentifier("appfilter","xml",app.packageName)!=0;
            if(!found)try(InputStream in=res.getAssets().open("appfilter.xml")){found=true;}catch(IOException ignored){}
            if(found){JSONObject item=new JSONObject();item.put("package",app.packageName);item.put("title",pm.getApplicationLabel(app).toString());packs.add(item);}
        }catch(Exception ignored){}
        // Only matching packs need labels and sorting, not every installed app.
        packs.sort((a,b)->a.optString("title").compareToIgnoreCase(b.optString("title")));
        return new JSONArray(packs);
    }
    private void read(XmlPullParser xml) throws Exception {
        int count=0;
        for(int event=xml.getEventType();event!=XmlPullParser.END_DOCUMENT;event=xml.next()){
            if(++count>200000)throw new IOException("Icon pack has too many entries");
            if(event!=XmlPullParser.START_TAG||!"item".equals(xml.getName()))continue;
            String component=xml.getAttributeValue(null,"component"),drawable=xml.getAttributeValue(null,"drawable");
            if(component==null||drawable==null||!drawable.matches("[a-zA-Z0-9_]+"))continue;
            if(component.startsWith("ComponentInfo{")&&component.endsWith("}"))component=component.substring(14,component.length()-1);
            ComponentName name=ComponentName.unflattenFromString(component);
            if(name!=null)mappings.put(name.flattenToString(),drawable);
        }
    }
    synchronized byte[] icon(String pack,String pkg) throws Exception {
        if(!pack.matches("[a-zA-Z0-9_.]+")||!pkg.matches("[a-zA-Z0-9_.]+"))return null;
        PackageManager pm=context.getPackageManager();long updated=pm.getPackageInfo(pack,0).lastUpdateTime;
        Resources res=pm.getResourcesForApplication(pack);
        if(!loaded.equals(pack)||version!=updated){
            loaded="";mappings.clear();images.clear();
            XmlPullParser xml=parser(res,pack);
            if(xml!=null){try{read(xml);}finally{((XmlResourceParser)xml).close();}}
            else try(InputStream in=res.getAssets().open("appfilter.xml")){xml=Xml.newPullParser();xml.setInput(in,"UTF-8");read(xml);}
            loaded=pack;version=updated;
        }
        Intent launch=pm.getLaunchIntentForPackage(pkg);ComponentName component=launch==null?null:launch.getComponent();
        if(component==null)return null;
        String name=mappings.get(component.flattenToString());if(name==null)return null;
        return named(pack,name);
    }
    synchronized byte[] named(String pack,String name) throws Exception {
        if(pack==null||name==null||!pack.matches("[a-zA-Z0-9_.]+")||!RESOURCE_NAME.matcher(name).matches())return null;
        Resources res=resources(pack);
        String cacheKey=pack+"/"+versions.get(pack)+"/"+name;
        byte[] cached=images.get(cacheKey);if(cached!=null)return cached;
        int id=res.getIdentifier(name,"drawable",pack);if(id==0)id=res.getIdentifier(name,"mipmap",pack);if(id==0)return null;
        Drawable drawable=res.getDrawable(id,null);Bitmap bitmap=Bitmap.createBitmap(128,128,Bitmap.Config.ARGB_8888);
        try{drawable.setBounds(0,0,128,128);drawable.draw(new Canvas(bitmap));ByteArrayOutputStream out=new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.PNG,100,out);byte[] bytes=out.toByteArray();images.put(cacheKey,bytes);return bytes;}finally{bitmap.recycle();}
    }

    synchronized JSONArray catalog(String pack) throws Exception {
        if(pack==null||!pack.matches("[a-zA-Z0-9_.]+"))throw new IOException("Invalid icon pack");
        Resources res=resources(pack);
        JSONArray cached=catalogs.get(pack);if(cached!=null)return cached;
        TreeSet<String> names=new TreeSet<>();
        for(String file:new String[]{"drawable","appfilter"}){
            int id=res.getIdentifier(file,"xml",pack);
            if(id!=0){XmlResourceParser xml=res.getXml(id);try{collect(xml,names);}finally{xml.close();}}
            try(InputStream in=res.getAssets().open(file+".xml")){XmlPullParser xml=Xml.newPullParser();xml.setInput(in,"UTF-8");collect(xml,names);}catch(FileNotFoundException ignored){}
        }
        // Resolve only the visible thumbnails, not every drawable in a large pack.
        JSONArray result=new JSONArray();for(String name:names)result.put(name);
        catalogs.put(pack,result);
        return result;
    }
    private void collect(XmlPullParser xml,Set<String> names) throws Exception {
        int count=0;for(int event=xml.getEventType();event!=XmlPullParser.END_DOCUMENT;event=xml.next()){
            if(++count>500000)throw new IOException("Icon catalog is too large");
            if(event!=XmlPullParser.START_TAG)continue;
            String name=xml.getAttributeValue(null,"drawable");
            if(name!=null&&RESOURCE_NAME.matcher(name).matches())names.add(name);
        }
    }
}

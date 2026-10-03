package com.androidgyny.wayfinder;

import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Host-side audit of the production transport with synthetic responses. Never calls Google. */
public final class GeminiTransportAudit {
    private static final String KEY="AIza_syntheticTestKeyNotARealCredential";
    private static int count;
    private static String mode="ok";
    private static JSONObject last;
    private static final List<String> progress=new ArrayList<>();
    private static void check(boolean value,String message){if(!value)throw new AssertionError(message);System.out.println("PASS "+message);}
    private static byte[] bytes(String value){return value.getBytes(StandardCharsets.UTF_8);}
    private static GeminiCategories client(){return new GeminiCategories(null,()->new HttpURLConnection(url()){
        final ByteArrayOutputStream payload=new ByteArrayOutputStream();
        public void disconnect(){}public boolean usingProxy(){return false;}public void connect(){}
        public OutputStream getOutputStream(){return payload;}
        public int getResponseCode(){count++;last=new JSONObject(payload.toString(StandardCharsets.UTF_8));
            if(!KEY.equals(getRequestProperty("x-goog-api-key"))||getRequestProperty("Authorization")!=null)throw new AssertionError("Wrong authentication");
            if(!last.getJSONObject("generationConfig").getString("responseMimeType").equals("application/json")||last.getJSONObject("generationConfig").getInt("maxOutputTokens")<16000)throw new AssertionError("Missing schema/output capacity");
            JSONObject config=last.getJSONObject("generationConfig"),schema=config.getJSONObject("responseSchema");
            if(!schema.getString("type").equals("OBJECT")||schema.has("additionalProperties")||config.has("responseJsonSchema")||config.has("thinkingConfig")||config.has("temperature"))throw new AssertionError("Incompatible generateContent arguments");
            return mode.equals("rate")&&count==1?429:mode.equals("error")?400:mode.equals("longRate")?429:200;}
        public String getHeaderField(String name){return mode.equals("longRate")?"121":null;}
        public InputStream getErrorStream(){return new ByteArrayInputStream(bytes(mode.equals("error")?new JSONObject().put("error",new JSONObject().put("message","Invalid key "+KEY)).toString():"{\"error\":{\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"0.1s\"}]}}"));}
        public InputStream getInputStream(){
            JSONObject input=new JSONObject(last.getJSONArray("contents").getJSONObject(0).getJSONArray("parts").getJSONObject(0).getString("text"));
            JSONObject properties=last.getJSONObject("generationConfig").getJSONObject("responseSchema").getJSONObject("properties");
            JSONObject output=new JSONObject();
            if(properties.has("categories"))output.put("categories",new JSONArray().put("Generated"));
            else if(properties.has("audits")){
                JSONArray games=input.getJSONArray("games"),audits=new JSONArray();
                for(int i=0;i<games.length()-(mode.equals("missing")?1:0);i++){JSONObject g=games.getJSONObject(mode.equals("reversed")?games.length()-1-i:i);String current=g.getString("current_category_id"),fit=mode.startsWith("compare")&&!current.equals("c0")?"mismatch":mode.equals("fitAlternative")?"unknown":"fits";
                    if(mode.equals("uncategorized")&&g.getBoolean("is_uncategorized"))fit=g.getString("title").equals("Unknown Game")?"unknown":"unassigned";
                    if(mode.equals("falseUnassigned"))fit="unassigned";
                    audits.put(new JSONObject().put("id",g.getString("id")).put("current_fit",fit).put("category_id",mode.equals("unknown")?"c999":fit.equals("mismatch")||fit.equals("unassigned")||mode.equals("fitAlternative")||mode.equals("fitsAlternative")?"c0":current).put("reason","Synthetic gameplay fit check"));}output.put("audits",audits);
            }
            else if(properties.has("assignments")){
                JSONArray games=input.getJSONArray("games"),assigned=new JSONArray();
                if(!properties.getJSONObject("assignments").getJSONObject("items").getJSONObject("properties").getJSONObject("category_id").getJSONArray("enum").getString(0).equals("c0"))throw new AssertionError("Unknown category scheme");
                for(int i=0;i<games.length()-((mode.equals("missing")||mode.equals("recovery")&&games.length()>250)?1:0);i++){
                    JSONObject g=games.getJSONObject(mode.equals("reversed")?games.length()-1-i:i);String chosen=mode.equals("unknown")?"c999":"c0";
                    if(mode.startsWith("compare")){
                        if(g.has("proposed_category_id")&&!g.has("current_category_id"))throw new AssertionError("Missing current category context");
                        if(!g.has("proposed_category_id")&&g.has("current_category_id"))throw new AssertionError("Initial assignment was biased by current category");
                        String prompt=last.getJSONObject("systemInstruction").getJSONArray("parts").getJSONObject(0).getString("text");
                        if(g.has("proposed_category_id")&&!prompt.contains("clearly better"))throw new AssertionError("Missing conservative instruction");
                        if(g.has("proposed_category_id"))chosen=mode.equals("compareInvalid")?"c2":mode.equals("compareKeep")?g.getString("current_category_id"):g.getString("proposed_category_id");
                    }
                    assigned.put(new JSONObject().put("id",g.getString("id")).put("category_id",chosen));
                }output.put("assignments",assigned);
            }else output.put("category_id","c0");
            String text=mode.equals("jsonRetry")&&count==1?"not JSON":output.toString();
            JSONArray parts=new JSONArray().put(new JSONObject().put("thought",true).put("text","ignored thought")).put(new JSONObject().put("text",text));
            JSONObject candidate=new JSONObject().put("finishReason",mode.equals("incomplete")?"MAX_TOKENS":"STOP").put("content",new JSONObject().put("parts",parts));
            JSONObject response=mode.equals("blocked")?new JSONObject():new JSONObject().put("candidates",new JSONArray().put(candidate));
            return new ByteArrayInputStream(bytes(response.toString()));
        }
    },()->KEY);}
    private static URL url(){try{return new URL("https://audit.invalid");}catch(Exception e){throw new AssertionError(e);}}
    private static void reset(String value){mode=value;count=0;progress.clear();}
    private static void rejects(JSONArray records,String kind,String message)throws Exception{
        reset(kind);try{client().organize(records,false,5,progress::add);throw new AssertionError("Accepted "+kind);}catch(IOException expected){check(expected.getMessage().contains(message),kind+" is rejected before Apply");}
    }
    public static void main(String[] args)throws Exception{
        JSONArray records=new JSONArray();for(int i=0;i<1200;i++)records.put(new JSONObject().put("id","game_"+i).put("title","Synthetic Game "+i).put("package","audit.game"+i).put("genre","Action"));
        reset("ok");JSONObject result=client().organize(records,false,5,progress::add);
        check(count==5&&result.getJSONArray("assignments").length()==1200,"1,200 games audited in bounded groups without unnecessary moves");
        check(result.getJSONArray("assignments").getJSONObject(1199).getString("id").equals("game_1199"),"ordered results map back to original game IDs");
        reset("reversed");result=client().organize(records,false,5,progress::add);check(result.getJSONArray("assignments").getJSONObject(0).getString("id").equals("game_249"),"game IDs preserve mapping when provider reorders rows");
        reset("recovery");result=client().organize(records,true,5,progress::add);check(count==7&&result.getJSONArray("assignments").length()==1200&&result.getJSONArray("assignments").getJSONObject(1199).getString("id").equals("game_1199"),"incomplete full response recovers in bounded groups, covering every original game");
        reset("ok");result=client().organize(records,true,5,progress::add);check(count==2&&result.getJSONArray("categories").getString(0).equals("Generated"),"Reorganize uses whole-library design then assignment");
        reset("ok");check(client().suggest("Reader","audit.reader",new JSONArray().put("news")).equals("news"),"single-item suggestion maps allowed category ID");
        JSONArray comparisons=new JSONArray();for(int i=0;i<3;i++)comparisons.put(new JSONObject().put("id","compare_"+i).put("title","Compare Game "+i).put("package","audit.compare"+i).put("genre",new String[]{"Action","Puzzle","Strategy"}[i]));
        reset("compareKeep");result=client().organize(comparisons,false,5,progress::add);check(count==2&&result.getJSONArray("assignments").getJSONObject(1).getString("category").equals("Puzzle")&&result.getJSONArray("assignments").getJSONObject(2).getString("category").equals("Strategy"),"review compares only proposed moves and can restore previous categories");
        check(new JSONObject(last.getJSONArray("contents").getJSONObject(0).getJSONArray("parts").getJSONObject(0).getString("text")).getJSONArray("games").length()==2,"unchanged game excluded from second review");
        reset("compareConfirm");result=client().organize(comparisons,false,5,progress::add);check(count==2&&result.getJSONArray("assignments").getJSONObject(1).getString("category").equals("Action"),"review can confirm a proposed move");
        rejects(comparisons,"compareInvalid","outside the proposed comparison");
        reset("fitAlternative");result=client().organize(comparisons,false,5,progress::add);check(count==1&&result.getJSONArray("assignments").getJSONObject(1).getString("category").equals("Puzzle"),"unknown game cannot move even when a response supplies an alternative");
        reset("fitsAlternative");result=client().organize(comparisons,false,5,progress::add);check(count==1&&result.getJSONArray("assignments").getJSONObject(1).getString("category").equals("Puzzle"),"defensible existing fit cannot move even when an alternative is returned");
        JSONArray unassigned=new JSONArray();for(int i=0;i<3;i++)unassigned.put(new JSONObject().put("id","unassigned_"+i).put("title",i==2?"Unknown Game":"Known Game").put("package","audit.unassigned"+i).put("genre",i==0?"Action":"Uncategorized"));
        reset("uncategorized");result=client().organize(unassigned,false,5,progress::add);check(count==1&&result.getJSONArray("assignments").getJSONObject(1).getString("category").equals("Action")&&result.getJSONArray("assignments").getJSONObject(2).getString("category").equals("Uncategorized"),"known uncategorized game gets an existing category; unknown stays uncategorized without mismatch review");
        rejects(comparisons,"falseUnassigned","existing category as unassigned");
        reset("uncategorized");unassigned=new JSONArray().put(unassigned.getJSONObject(1));result=client().organize(unassigned,false,5,progress::add);check(result.getJSONArray("assignments").getJSONObject(0).getString("category").equals("Uncategorized"),"no genre categories available leaves the game uncategorized");
        reset("rate");client().organize(records,false,5,progress::add);check(count==6&&progress.stream().anyMatch(s->s.contains("usage limit")),"429 RetryInfo causes bounded wait and successful retry");
        reset("jsonRetry");client().organize(records,false,5,progress::add);check(count==6,"malformed JSON has bounded retry");
        rejects(records,"missing","check every game");rejects(records,"unknown","Invalid category check");rejects(records,"incomplete","incomplete");rejects(records,"blocked","did not return");rejects(records,"longRate","usage limit");
        reset("error");try{client().organize(records,false,5,progress::add);throw new AssertionError("Accepted error");}catch(IOException expected){check(!expected.getMessage().contains(KEY)&&expected.getMessage().contains("[redacted key]"),"provider errors redact credentials");}
        reset("ok");Thread.currentThread().interrupt();try{client().organize(records,false,5,progress::add);throw new AssertionError("Ignored cancellation");}catch(IOException expected){check(count==0,"canceled request sends no data");}finally{Thread.interrupted();}
        final int[] opened={0};
        GeminiCategories canceledDuringKey=new GeminiCategories(null,()->{opened[0]++;throw new IOException("Network opened");},()->{Thread.currentThread().interrupt();return KEY;});
        try{canceledDuringKey.suggest("Chess","audit.chess",new JSONArray().put("Strategy"));throw new AssertionError("Ignored cancellation during key access");}
        catch(IOException expected){check(opened[0]==0,"cancellation during key access prevents opening a connection");}finally{Thread.interrupted();}
        final boolean[] openedStream={false},closedConnection={false};
        GeminiCategories canceledDuringOpen=new GeminiCategories(null,()->{Thread.currentThread().interrupt();return new HttpURLConnection(url()){
            public void connect(){}public boolean usingProxy(){return false;}public void disconnect(){closedConnection[0]=true;}
            public OutputStream getOutputStream(){openedStream[0]=true;return new ByteArrayOutputStream();}
        };},()->KEY);
        try{canceledDuringOpen.suggest("Chess","audit.chess",new JSONArray().put("Strategy"));throw new AssertionError("Ignored cancellation during connection setup");}
        catch(IOException expected){check(!openedStream[0]&&closedConnection[0],"cancellation during connection setup disconnects without sending a request");}finally{Thread.interrupted();}
        java.util.concurrent.CountDownLatch reading=new java.util.concurrent.CountDownLatch(1),disconnected=new java.util.concurrent.CountDownLatch(1);
        GeminiCategories hanging=new GeminiCategories(null,()->new HttpURLConnection(url()){
            public void connect(){}public boolean usingProxy(){return false;}public void disconnect(){disconnected.countDown();}
            public OutputStream getOutputStream(){return new ByteArrayOutputStream();}
            public int getResponseCode(){return 200;}
            public InputStream getInputStream(){return new InputStream(){public int read() throws IOException{
                reading.countDown();while(disconnected.getCount()>0)try{disconnected.await();}catch(InterruptedException ignored){}
                throw new IOException("Disconnected synthetic connection");
            }};}
        },()->KEY);
        Thread pending=new Thread(()->{try{hanging.suggest("Chess","audit.chess",new JSONArray().put("Strategy"));}catch(Exception expected){}});
        pending.start();check(reading.await(3,java.util.concurrent.TimeUnit.SECONDS),"synthetic request reaches active read");
        hanging.cancelAll();pending.join(3000);
        check(!pending.isAlive()&&disconnected.getCount()==0,"closing AI transport disconnects an active request without waiting for its timeout");
    }
}

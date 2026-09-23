package com.androidgyny.wayfinder;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.webkit.*;
import android.widget.*;

/** An isolated browser: remote pages never receive the launcher's JavaScript bridge. */
final class ArtworkBrowser extends Dialog {
    interface Selection { void select(String url); }
    private final String startUrl;
    private final Selection selection;
    private WebView browser;
    private TextView status;
    private Button use;
    private String imageUrl;
    private boolean busy;
    private boolean pageFailed;
    private WebView popup;

    ArtworkBrowser(Activity activity, String url, Selection selection) {
        super(activity, android.R.style.Theme_Material_NoActionBar);
        startUrl=url; this.selection=selection;
    }
    private int dp(int value){return Math.round(value*getContext().getResources().getDisplayMetrics().density);}
    private Button button(LinearLayout row,String label,Runnable action){
        Button b=new Button(getContext());b.setText(label);b.setOnClickListener(v->action.run());row.addView(b);return b;
    }
    @Override protected void onCreate(Bundle state){
        super.onCreate(state);
        LinearLayout root=new LinearLayout(getContext());root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.rgb(17,22,21));
        LinearLayout bar=new LinearLayout(getContext());bar.setPadding(dp(8),0,dp(8),0);
        button(bar,"Back",this::back);button(bar,"Close",this::dismiss);
        status=new TextView(getContext());status.setTextColor(Color.WHITE);status.setPadding(dp(12),dp(8),dp(12),dp(8));
        status.setText("Open an image, or hold an image to use it as artwork.");
        bar.addView(status,new LinearLayout.LayoutParams(0,ViewGroup.LayoutParams.WRAP_CONTENT,1));
        use=button(bar,"Use this image",()->choose(imageUrl));use.setEnabled(false);root.addView(bar);
        browser=new WebView(getContext());
        WebSettings settings=browser.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportMultipleWindows(true);
        browser.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean gesture,android.os.Message result){
                if(!gesture||!isShowing()||browser==null)return false;
                if(popup!=null)popup.destroy();
                popup=new WebView(getContext());
                popup.getSettings().setAllowFileAccess(false);popup.getSettings().setAllowContentAccess(false);
                popup.setWebViewClient(new WebViewClient(){
                    @Override public boolean shouldOverrideUrlLoading(WebView child,WebResourceRequest request){
                        if(!isShowing()||browser==null)return true;
                        String url=request.getUrl().toString();if(https(url)){if(steamImage(url))choose(url);else browser.loadUrl(url);}return true;
                    }
                });
                ((WebView.WebViewTransport)result.obj).setWebView(popup);result.sendToTarget();return true;
            }
        });
        browser.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){String url=request.getUrl().toString();if(request.isForMainFrame()&&steamImage(url)){choose(url);return true;}return !https(url);}
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){
                pageFailed=false;imageUrl=null;use.setEnabled(false);
                if(!busy)status.setText("Loading…");
            }
            @Override public void onPageFinished(WebView view,String url){
                if(!isShowing()||pageFailed)return;
                if(!busy)status.setText("Hold an image to use it as artwork.");
                // Image documents have one image and no surrounding page content.
                view.evaluateJavascript("(()=>{const i=document.images;return i.length===1&&document.body.innerText.trim()===''?i[0].src:null})()",value->{
                    if(!isShowing()||!url.equals(view.getUrl()))return;
                    try{Object parsed=new org.json.JSONTokener(value).nextValue();if(parsed instanceof String&&https((String)parsed)){imageUrl=(String)parsed;use.setEnabled(!busy);if(!busy)status.setText("Image ready to preview.");}}catch(Exception ignored){}
                });
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame())pageError();}
            @Override public void onReceivedHttpError(WebView view,WebResourceRequest request,WebResourceResponse response){if(request.isForMainFrame())pageError();}
        });
        browser.setDownloadListener((url,agent,disposition,mime,length)->{
            if(https(url))choose(url);else status.setText("This download is unavailable. Open the original image instead.");
        });
        browser.setOnLongClickListener(v->{
            WebView.HitTestResult hit=browser.getHitTestResult();
            if(hit.getType()!=WebView.HitTestResult.IMAGE_TYPE&&hit.getType()!=WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE)return false;
            String url=hit.getExtra();if(!https(url)){status.setText("Open the source page to select the original image.");return true;}
            imageUrl=url;use.setEnabled(!busy);
            new android.app.AlertDialog.Builder(getContext()).setItems(new String[]{"Use as artwork"},(d,which)->choose(url)).show();return true;
        });
        root.addView(browser,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);browser.loadUrl(startUrl);
    }
    private static boolean https(String url){return url!=null&&"https".equals(Uri.parse(url).getScheme());}
    private void pageError(){pageFailed=true;imageUrl=null;use.setEnabled(false);status.setText("Page could not load. Go back and try another result.");}
    private static boolean steamImage(String url){Uri u=Uri.parse(url);String host=u.getHost(),path=u.getPath();return https(url)&&host!=null&&host.matches("cdn[0-9]*\\.steamgriddb\\.com")&&path!=null&&path.matches("/(?i:grid|hero|logo|icon)/[^/]+\\.(?i:png|jpg|jpeg|webp)");}
    private void choose(String url){if(busy||!https(url))return;busy=true;use.setEnabled(false);status.setText("Loading artwork…");selection.select(url);}
    void failed(){if(!isShowing())return;busy=false;use.setEnabled(imageUrl!=null);status.setText("Could not load that image. Try the original image or another result.");}
    private void back(){if(browser!=null&&browser.canGoBack())browser.goBack();else dismiss();}
    @Override public void onBackPressed(){back();}
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(event.getKeyCode()==KeyEvent.KEYCODE_BUTTON_B){if(event.getAction()==KeyEvent.ACTION_UP)back();return true;}
        if(event.getKeyCode()==KeyEvent.KEYCODE_BUTTON_A){return super.dispatchKeyEvent(new KeyEvent(event.getDownTime(),event.getEventTime(),event.getAction(),KeyEvent.KEYCODE_DPAD_CENTER,event.getRepeatCount()));}
        return super.dispatchKeyEvent(event);
    }
    @Override public void dismiss(){super.dismiss();if(popup!=null){popup.destroy();popup=null;}if(browser!=null){browser.stopLoading();browser.destroy();browser=null;}}
}

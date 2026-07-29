package com.onrenderg.vrdrive;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private static final String LIVE_URL = "https://onrenderg.github.io/vr1/index.html";
    private static final String LOCAL_URL = "file:///android_asset/index.html";

    private WebView webView;
    private boolean isFallbackTriggered = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize Meta Horizon Platform SDK
        try {
            com.meta.horizon.platform.ovr.Core.asyncInitialize("1342260865627707", this.getApplicationContext());
        } catch (Throwable t) {
            t.printStackTrace();
        }

        // Immersive Fullscreen Mode
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        decorView.setSystemUiVisibility(uiOptions);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Auto-grant WebXR / Camera / Sensor permissions
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        request.grant(request.getResources());
                    }
                });
            }
        });

        // Smart Silent Fallback Client
        webView.setWebViewClient(new WebViewClient() {
            private void triggerSilentFallback(WebView view) {
                if (!isFallbackTriggered) {
                    isFallbackTriggered = true;
                    view.post(new Runnable() {
                        @Override
                        public void run() {
                            view.loadUrl(LOCAL_URL);
                        }
                    });
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    triggerSilentFallback(view);
                }
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                triggerSilentFallback(view);
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                if (request != null && request.isForMainFrame()) {
                    triggerSilentFallback(view);
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
                triggerSilentFallback(view);
            }
        });

        // Smart Hybrid Load:
        // 1. Check network connectivity.
        // 2. If online -> Load live GitHub Pages URL (auto-updates!).
        // 3. If offline or GitHub Pages fails -> Silently load local asset file:///android_asset/index.html
        if (isNetworkAvailable()) {
            webView.loadUrl(LIVE_URL);
        } else {
            isFallbackTriggered = true;
            webView.loadUrl(LOCAL_URL);
        }
    }

    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Network activeNetwork = cm.getActiveNetwork();
                    if (activeNetwork != null) {
                        NetworkCapabilities nc = cm.getNetworkCapabilities(activeNetwork);
                        return nc != null && (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                                              nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                                              nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
                    }
                } else {
                    NetworkInfo activeNetworkInfo = cm.getActiveNetworkInfo();
                    return activeNetworkInfo != null && activeNetworkInfo.isConnected();
                }
            }
        } catch (Exception e) {
            // Ignore exception and return false to trigger local fallback
        }
        return false;
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}

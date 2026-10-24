package id.dialogcoffee.cashier;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        setStatusBarTheme(false); // Default awal: tema putih (light)

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new Object() {
                @android.webkit.JavascriptInterface
                public void setStatusBarTheme(final boolean isDark) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            MainActivity.this.setStatusBarTheme(isDark);
                        }
                    });
                }

                @android.webkit.JavascriptInterface
                public void exitApp() {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            finishAffinity();
                            System.exit(0);
                        }
                    });
                }
            }, "AndroidBridge");
        }
    }

    public void setStatusBarTheme(boolean isDark) {
        Window window = getWindow();
        if (window == null) return;
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        androidx.core.view.WindowInsetsControllerCompat controller = 
            androidx.core.view.WindowCompat.getInsetsController(window, window.getDecorView());

        if (isDark) {
            // UI Hitam: Status bar hitam pekat, ikon statusbar & navigasi PUTIH
            window.setStatusBarColor(Color.parseColor("#09090b"));
            window.setNavigationBarColor(Color.parseColor("#09090b"));
            if (controller != null) {
                controller.setAppearanceLightStatusBars(false); // ikon putih
                controller.setAppearanceLightNavigationBars(false); // ikon putih
            }
        } else {
            // UI Putih: Status bar putih bersih, ikon statusbar & navigasi GELAP / HITAM
            window.setStatusBarColor(Color.parseColor("#ffffff"));
            window.setNavigationBarColor(Color.parseColor("#ffffff"));
            if (controller != null) {
                controller.setAppearanceLightStatusBars(true); // ikon hitam/gelap
                controller.setAppearanceLightNavigationBars(true); // ikon hitam/gelap
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "if (window.App && typeof window.App.handleHardwareBackButton === 'function') { window.App.handleHardwareBackButton(); } else { window.history.back(); }",
                null
            );
            return;
        }
        super.onBackPressed();
    }
}

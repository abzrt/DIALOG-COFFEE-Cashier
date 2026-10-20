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
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#09090b"));
        window.setNavigationBarColor(Color.parseColor("#09090b"));
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

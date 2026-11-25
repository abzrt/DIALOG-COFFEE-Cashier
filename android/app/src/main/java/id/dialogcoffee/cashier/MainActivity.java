package id.dialogcoffee.cashier;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.io.File;

public class MainActivity extends BridgeActivity {
    private long currentDownloadId = -1;
    private String currentApkFileName = null;
    private File pendingInstallFile = null;
    private Handler progressHandler = new Handler(Looper.getMainLooper());
    private Runnable progressRunnable;
    private BroadcastReceiver downloadReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        setStatusBarTheme(false); // Default awal: tema putih (light)

        registerDownloadReceiver();

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
            getBridge().getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void setStatusBarTheme(final boolean isDark) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            MainActivity.this.setStatusBarTheme(isDark);
                        }
                    });
                }

                @JavascriptInterface
                public void exitApp() {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            finishAffinity();
                            System.exit(0);
                        }
                    });
                }

                @JavascriptInterface
                public void downloadApk(final String downloadUrl, final String fileName) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            startApkDownload(downloadUrl, fileName);
                        }
                    });
                }

                @JavascriptInterface
                public void installDownloadedApk(final String fileName) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            File targetFile = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName);
                            installApk(targetFile);
                        }
                    });
                }
            }, "AndroidBridge");
        }
    }

    private void registerDownloadReceiver() {
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (id != -1 && id == currentDownloadId) {
                        stopProgressPolling();
                        boolean downloadSuccess = false;
                        int failReason = -1;
                        try {
                            DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                            if (manager != null) {
                                DownloadManager.Query q = new DownloadManager.Query();
                                q.setFilterById(id);
                                try (Cursor cursor = manager.query(q)) {
                                    if (cursor != null && cursor.moveToFirst()) {
                                        int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                                        int reasonIdx = cursor.getColumnIndex(DownloadManager.COLUMN_REASON);
                                        int status = (statusIdx >= 0) ? cursor.getInt(statusIdx) : 0;
                                        failReason = (reasonIdx >= 0) ? cursor.getInt(reasonIdx) : -1;
                                        downloadSuccess = (status == DownloadManager.STATUS_SUCCESSFUL);
                                    }
                                }
                            }
                        } catch (Exception e) {}

                        if (currentApkFileName != null) {
                            File targetFile = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                                    currentApkFileName);

                            if (downloadSuccess && targetFile.exists() && targetFile.length() > 100000) {
                                // Kirim sinyal ke WebView bahwa unduhan selesai
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    getBridge().getWebView().evaluateJavascript(
                                            "if (window.AppUpdater && AppUpdater.onDownloadCompleted) AppUpdater.onDownloadCompleted('"
                                                    + currentApkFileName + "');",
                                            null);
                                }

                                // Langsung buka Package Installer secara otomatis (Auto-Install)
                                installApk(targetFile);
                            } else {
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    getBridge().getWebView().evaluateJavascript(
                                            "if (window.AppUpdater && AppUpdater.onDownloadFailed) AppUpdater.onDownloadFailed('Kode error: "
                                                    + failReason + "');",
                                            null);
                                }
                            }
                        }
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= 33) {
            ContextCompat.registerReceiver(this, downloadReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
        } else {
            registerReceiver(downloadReceiver, filter);
        }
    }

    private void startApkDownload(final String downloadUrl, final String fileName) {
        try {
            currentApkFileName = fileName;
            File downloadsDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (downloadsDir != null && !downloadsDir.exists()) {
                downloadsDir.mkdirs();
            }
            File targetFile = new File(downloadsDir, fileName);
            if (targetFile.exists()) {
                targetFile.delete();
            }

            Uri uri = Uri.parse(downloadUrl);
            DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle("DIALOG COFFEE Update");
            request.setDescription("Mengunduh " + fileName);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(MainActivity.this, Environment.DIRECTORY_DOWNLOADS, fileName);
            request.setMimeType("application/vnd.android.package-archive");
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);
            request.addRequestHeader("User-Agent", "Mozilla/5.0 (Linux; Android) DialogCoffeeCashier");

            final DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager != null) {
                currentDownloadId = manager.enqueue(request);
                startProgressPolling(manager, currentDownloadId);
                Toast.makeText(MainActivity.this, "Mengunduh pembaruan di latar belakang...", Toast.LENGTH_SHORT)
                        .show();
            }
        } catch (Exception e) {
            Toast.makeText(MainActivity.this, "Gagal mengunduh: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void startProgressPolling(final DownloadManager manager, final long downloadId) {
        stopProgressPolling();
        progressRunnable = new Runnable() {
            @Override
            public void run() {
                if (currentDownloadId == -1 || manager == null)
                    return;
                DownloadManager.Query q = new DownloadManager.Query();
                q.setFilterById(downloadId);
                try (Cursor cursor = manager.query(q)) {
                    if (cursor != null && cursor.moveToFirst()) {
                        int bytesDownloadedIdx = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                        int bytesTotalIdx = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
                        int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);

                        int bytesDownloaded = (bytesDownloadedIdx >= 0) ? cursor.getInt(bytesDownloadedIdx) : 0;
                        int bytesTotal = (bytesTotalIdx >= 0) ? cursor.getInt(bytesTotalIdx) : 0;
                        int status = (statusIdx >= 0) ? cursor.getInt(statusIdx) : 0;

                        int percent = 0;
                        if (bytesTotal > 0) {
                            percent = (int) (((long) bytesDownloaded * 100) / bytesTotal);
                        }

                        final int fBytes = bytesDownloaded;
                        final int fTotal = bytesTotal;
                        final int fPercent = Math.min(100, Math.max(0, percent));

                        if (getBridge() != null && getBridge().getWebView() != null) {
                            getBridge().getWebView().evaluateJavascript(
                                    String.format(
                                            "if (window.AppUpdater && AppUpdater.onDownloadProgress) AppUpdater.onDownloadProgress(%d, %d, %d);",
                                            fBytes, fTotal, fPercent),
                                    null);
                        }

                        if (status == DownloadManager.STATUS_SUCCESSFUL || status == DownloadManager.STATUS_FAILED) {
                            stopProgressPolling();
                            if (status == DownloadManager.STATUS_FAILED && getBridge() != null && getBridge().getWebView() != null) {
                                getBridge().getWebView().evaluateJavascript(
                                        "if (window.AppUpdater && AppUpdater.onDownloadFailed) AppUpdater.onDownloadFailed('Unduhan terhenti');",
                                        null);
                            }
                            return;
                        }
                    }
                } catch (Exception e) {
                }
                progressHandler.postDelayed(this, 500);
            }
        };
        progressHandler.post(progressRunnable);
    }

    private void stopProgressPolling() {
        if (progressRunnable != null) {
            progressHandler.removeCallbacks(progressRunnable);
            progressRunnable = null;
        }
    }

    public void installApk(final File file) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (file == null || !file.exists()) {
                        Toast.makeText(MainActivity.this, "Berkas installer APK tidak ditemukan.", Toast.LENGTH_SHORT)
                                .show();
                        return;
                    }

                    // Android 8.0+ (API 26+) periksa izin penginstalan dari sumber tidak dikenal
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        if (!getPackageManager().canRequestPackageInstalls()) {
                            pendingInstallFile = file;
                            Intent permIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                            permIntent.setData(Uri.parse("package:" + getPackageName()));
                            permIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(permIntent);
                            Toast.makeText(MainActivity.this,
                                    "Harap izinkan penginstalan dari sumber ini untuk melanjutkan pembaruan.",
                                    Toast.LENGTH_LONG).show();
                            return;
                        }
                    }

                    Uri apkUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".fileprovider",
                            file);

                    Intent installIntent = new Intent(Intent.ACTION_VIEW);
                    installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                    installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(installIntent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Gagal membuka installer: " + e.getMessage(), Toast.LENGTH_LONG)
                            .show();
                }
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        if (pendingInstallFile != null && pendingInstallFile.exists()) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getPackageManager().canRequestPackageInstalls()) {
                File f = pendingInstallFile;
                pendingInstallFile = null;
                installApk(f);
            }
        }
    }

    @Override
    public void onDestroy() {
        stopProgressPolling();
        if (downloadReceiver != null) {
            try {
                unregisterReceiver(downloadReceiver);
            } catch (Exception e) {
            }
        }
        super.onDestroy();
    }

    public void setStatusBarTheme(boolean isDark) {
        Window window = getWindow();
        if (window == null)
            return;
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());

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
                    null);
            return;
        }
        super.onBackPressed();
    }
}

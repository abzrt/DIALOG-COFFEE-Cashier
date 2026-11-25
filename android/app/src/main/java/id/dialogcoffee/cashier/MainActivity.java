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
import android.util.Base64;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;

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

                @JavascriptInterface
                public void searchYouTube(final String query) {
                    searchYouTubeNative(query);
                }
            }, "AndroidBridge");
        }
    }

    private void searchYouTubeNative(final String query) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                BufferedReader reader = null;
                try {
                    String encoded = URLEncoder.encode(query == null ? "" : query.trim(), "UTF-8");
                    URL url = new URL("https://www.youtube.com/results?search_query=" + encoded);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(10000);
                    conn.setReadTimeout(12000);
                    conn.setRequestProperty("User-Agent",
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
                    conn.setRequestProperty("Accept-Language", "id-ID,id;q=0.9,en;q=0.8");
                    conn.connect();

                    reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    String html = sb.toString();

                    String marker = "var ytInitialData = ";
                    int startIdx = html.indexOf(marker);
                    if (startIdx < 0) {
                        marker = "window[\"ytInitialData\"] = ";
                        startIdx = html.indexOf(marker);
                    }
                    JSONArray results = new JSONArray();
                    if (startIdx >= 0) {
                        int jsonStart = startIdx + marker.length();
                        int jsonEnd = html.indexOf(";</script>", jsonStart);
                        if (jsonEnd > jsonStart) {
                            String jsonStr = html.substring(jsonStart, jsonEnd).trim();
                            JSONObject root = new JSONObject(jsonStr);
                            collectVideoRenderers(root, results);
                        }
                    }

                    final String b64 = Base64.encodeToString(
                            results.toString().getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (getBridge() != null && getBridge().getWebView() != null) {
                                getBridge().getWebView().evaluateJavascript(
                                        "if (window.MusicModule && MusicModule.onSearchResultsBase64) MusicModule.onSearchResultsBase64('"
                                                + b64 + "');",
                                        null);
                            }
                        }
                    });
                } catch (final Exception e) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            String msg = (e.getMessage() != null ? e.getMessage() : "Gagal mencari di YouTube").replace("'", "");
                            if (getBridge() != null && getBridge().getWebView() != null) {
                                getBridge().getWebView().evaluateJavascript(
                                        "if (window.MusicModule && MusicModule.onSearchError) MusicModule.onSearchError('"
                                                + msg + "');",
                                        null);
                            }
                        }
                    });
                } finally {
                    try { if (reader != null) reader.close(); } catch (Exception ignored) {}
                    if (conn != null) conn.disconnect();
                }
            }
        }).start();
    }

    private void collectVideoRenderers(Object node, JSONArray out) {
        if (node == null || out.length() >= 8) return;
        try {
            if (node instanceof JSONObject) {
                JSONObject obj = (JSONObject) node;
                if (obj.has("videoRenderer")) {
                    JSONObject vr = obj.optJSONObject("videoRenderer");
                    if (vr != null && vr.has("videoId")) {
                        String videoId = vr.optString("videoId", "");
                        if (!videoId.isEmpty()) {
                            String title = "";
                            JSONObject titleObj = vr.optJSONObject("title");
                            if (titleObj != null) {
                                JSONArray runs = titleObj.optJSONArray("runs");
                                if (runs != null && runs.length() > 0 && runs.optJSONObject(0) != null) {
                                    title = runs.optJSONObject(0).optString("text", "");
                                } else {
                                    title = titleObj.optString("simpleText", "");
                                }
                            }
                            String channel = "";
                            JSONObject ownerObj = vr.optJSONObject("ownerText");
                            if (ownerObj == null) ownerObj = vr.optJSONObject("longBylineText");
                            if (ownerObj != null) {
                                JSONArray runs = ownerObj.optJSONArray("runs");
                                if (runs != null && runs.length() > 0 && runs.optJSONObject(0) != null) {
                                    channel = runs.optJSONObject(0).optString("text", "");
                                }
                            }
                            String duration = "";
                            JSONObject lenObj = vr.optJSONObject("lengthText");
                            if (lenObj != null) {
                                duration = lenObj.optString("simpleText", "");
                            }
                            JSONObject item = new JSONObject();
                            item.put("videoId", videoId);
                            item.put("title", title);
                            item.put("channel", channel);
                            item.put("duration", duration);
                            item.put("thumb", "https://i.ytimg.com/vi/" + videoId + "/mqdefault.jpg");
                            out.put(item);
                            return;
                        }
                    }
                }
                java.util.Iterator<String> keys = obj.keys();
                while (keys.hasNext() && out.length() < 8) {
                    collectVideoRenderers(obj.opt(keys.next()), out);
                }
            } else if (node instanceof JSONArray) {
                JSONArray arr = (JSONArray) node;
                for (int i = 0; i < arr.length() && out.length() < 8; i++) {
                    collectVideoRenderers(arr.opt(i), out);
                }
            }
        } catch (Exception ignored) {}
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
        currentApkFileName = fileName;
        Toast.makeText(MainActivity.this, "Mengunduh pembaruan di latar belakang...", Toast.LENGTH_SHORT).show();

        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                InputStream in = null;
                FileOutputStream out = null;
                try {
                    File downloadsDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (downloadsDir != null && !downloadsDir.exists()) {
                        downloadsDir.mkdirs();
                    }
                    final File targetFile = new File(downloadsDir, fileName);
                    if (targetFile.exists()) {
                        targetFile.delete();
                    }

                    // Ikuti redirect HTTP (301/302/307/308) secara manual agar lintas-domain aman
                    String currentUrl = downloadUrl;
                    int redirectCount = 0;
                    int responseCode = 0;
                    while (redirectCount < 6) {
                        URL url = new URL(currentUrl);
                        conn = (HttpURLConnection) url.openConnection();
                        conn.setInstanceFollowRedirects(true);
                        conn.setConnectTimeout(15000);
                        conn.setReadTimeout(30000);
                        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android) DialogCoffeeCashier");
                        conn.connect();

                        responseCode = conn.getResponseCode();
                        if (responseCode == HttpURLConnection.HTTP_MOVED_TEMP
                                || responseCode == HttpURLConnection.HTTP_MOVED_PERM
                                || responseCode == HttpURLConnection.HTTP_SEE_OTHER
                                || responseCode == 307
                                || responseCode == 308) {
                            String location = conn.getHeaderField("Location");
                            conn.disconnect();
                            if (location == null || location.isEmpty()) {
                                break;
                            }
                            currentUrl = location;
                            redirectCount++;
                        } else {
                            break;
                        }
                    }

                    if (responseCode != HttpURLConnection.HTTP_OK) {
                        final int errCode = responseCode;
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    getBridge().getWebView().evaluateJavascript(
                                            "if (window.AppUpdater && AppUpdater.onDownloadFailed) AppUpdater.onDownloadFailed('HTTP "
                                                    + errCode + "');",
                                            null);
                                }
                            }
                        });
                        return;
                    }

                    final long totalBytes = conn.getContentLengthLong();
                    in = conn.getInputStream();
                    out = new FileOutputStream(targetFile);

                    byte[] buffer = new byte[8192];
                    long downloadedBytes = 0;
                    int bytesRead;
                    long lastEmitTime = 0;

                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                        downloadedBytes += bytesRead;

                        long now = System.currentTimeMillis();
                        if (now - lastEmitTime >= 200) {
                            lastEmitTime = now;
                            final long fDownloaded = downloadedBytes;
                            final long fTotal = totalBytes > 0 ? totalBytes : 0;
                            final int fPercent = (fTotal > 0)
                                    ? (int) Math.min(99, (fDownloaded * 100L) / fTotal)
                                    : 0;
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    if (getBridge() != null && getBridge().getWebView() != null) {
                                        getBridge().getWebView().evaluateJavascript(
                                                String.format(
                                                        "if (window.AppUpdater && AppUpdater.onDownloadProgress) AppUpdater.onDownloadProgress(%d, %d, %d);",
                                                        fDownloaded, fTotal, fPercent),
                                                null);
                                    }
                                }
                            });
                        }
                    }

                    out.flush();
                    out.close();
                    out = null;
                    in.close();
                    in = null;

                    if (targetFile.exists() && targetFile.length() > 100000) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    getBridge().getWebView().evaluateJavascript(
                                            "if (window.AppUpdater && AppUpdater.onDownloadCompleted) AppUpdater.onDownloadCompleted('"
                                                    + fileName + "');",
                                            null);
                                }
                                installApk(targetFile);
                            }
                        });
                    } else {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                if (getBridge() != null && getBridge().getWebView() != null) {
                                    getBridge().getWebView().evaluateJavascript(
                                            "if (window.AppUpdater && AppUpdater.onDownloadFailed) AppUpdater.onDownloadFailed('Berkas APK tidak lengkap');",
                                            null);
                                }
                            }
                        });
                    }
                } catch (final Exception e) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            String msg = (e.getMessage() != null ? e.getMessage() : "Error jaringan").replace("'", "");
                            if (getBridge() != null && getBridge().getWebView() != null) {
                                getBridge().getWebView().evaluateJavascript(
                                        "if (window.AppUpdater && AppUpdater.onDownloadFailed) AppUpdater.onDownloadFailed('"
                                                + msg + "');",
                                        null);
                            }
                        }
                    });
                } finally {
                    try { if (out != null) out.close(); } catch (Exception ignored) {}
                    try { if (in != null) in.close(); } catch (Exception ignored) {}
                    if (conn != null) conn.disconnect();
                }
            }
        }).start();
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

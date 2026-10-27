package com.bmoneczek.instalingbot;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.TimePickerDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.Calendar;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private static final String START_URL = "https://instaling.pl/";
    private static final String RELEASES_URL = "https://github.com/bmonekkk/instaling-bot/releases/latest";
    private static final String API_URL = "https://api.github.com/repos/bmonekkk/instaling-bot/releases/latest";
    private static final int NOTIFICATION_PERMISSION = 41;
    private static final int DEFAULT_REMINDER_HOUR = 17;
    private static final int DEFAULT_REMINDER_MINUTE = 0;

    private WebView webView;
    private TextView statusView;
    private TextView countsView;
    private TextView statsView;
    private Button startButton;
    private Button stopButton;
    private Button languageButton;
    private Button reminderButton;
    private Button settingsButton;
    private Button updateButton;
    private SharedPreferences prefs;
    private boolean pendingStart = false;
    private boolean pageReady = false;
    private String language = "pl";
    private volatile String bridgeToken = "";
    private String lastStatus = "idle";
    private int answers = 0;
    private int correct = 0;

    private static final String[][] LABELS = {
            // pl
            {"Start", "Stop", "Gotowy", "Uruchamianie…", "Pracuję…", "Zatrzymywanie…",
                    "Sesja zakończona", "Błąd", "Zatrzymano", "Codzienne przypomnienie",
                    "Włącz przypomnienie", "Wyłącz przypomnienie", "Aktualizacja",
                    "Ustawienia sesji", "Poprawność odpowiedzi (%)", "Limit odpowiedzi (0 = brak limitu)",
                    "Zapisz", "Anuluj", "Godzina przypomnienia", "Zapisano ustawienia"},
            // en
            {"Start", "Stop", "Ready", "Starting…", "Working…", "Stopping…",
                    "Session finished", "Error", "Stopped", "Daily reminder",
                    "Enable reminder", "Disable reminder", "Update",
                    "Session settings", "Answer accuracy (%)", "Answer limit (0 = no limit)",
                    "Save", "Cancel", "Reminder time", "Settings saved"}
    };

    private String label(int index) {
        return LABELS["en".equals(language) ? 1 : 0][index];
    }

    private String statusLabel(String status) {
        switch (status) {
            case "starting": return label(3);
            case "running": return label(4);
            case "stopping": return label(5);
            case "finished": return label(6);
            case "error": return label(7);
            case "stopped": return label(8);
            default: return label(2);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("instaling-bot", MODE_PRIVATE);
        language = "en".equals(prefs.getString("language", "pl")) ? "en" : "pl";
        createNotificationChannel();
        buildUi();
        configureWebView();
        scheduleReminderIfEnabled();
        checkForUpdate();
        handleIntent(getIntent());
    }

    private void buildUi() {
        int dark = Color.parseColor("#111827");
        int bar = Color.parseColor("#1f2937");
        int primary = Color.parseColor("#22c55e");
        int danger = Color.parseColor("#ef4444");
        int muted = Color.parseColor("#93c5fd");

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(dark);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setBackgroundColor(bar);
        toolbar.setPadding(dp(8), dp(6), dp(8), dp(6));

        languageButton = smallButton(language.toUpperCase(), Color.parseColor("#374151"), Color.WHITE);
        languageButton.setOnClickListener(view -> toggleLanguage());
        toolbar.addView(languageButton);

        reminderButton = smallButton("⏰", Color.parseColor("#374151"), Color.WHITE);
        reminderButton.setOnClickListener(view -> toggleReminder());
        toolbar.addView(reminderButton);

        settingsButton = smallButton("⚙", Color.parseColor("#374151"), Color.WHITE);
        settingsButton.setOnClickListener(view -> openSettings());
        toolbar.addView(settingsButton);

        startButton = smallButton(label(0), primary, Color.BLACK);
        startButton.setOnClickListener(view -> requestStart());
        toolbar.addView(startButton);

        stopButton = smallButton(label(1), danger, Color.WHITE);
        stopButton.setEnabled(false);
        stopButton.setOnClickListener(view -> stopBot());
        toolbar.addView(stopButton);

        // The wordmark lives in the status bar, so the five controls can share
        // the full toolbar width evenly on narrow phones.
        for (int index = 0; index < toolbar.getChildCount(); index++) {
            View child = toolbar.getChildAt(index);
            child.setMinimumWidth(0);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            params.setMargins(index == 0 ? 0 : dp(4), 0, 0, 0);
            child.setLayoutParams(params);
        }

        root.addView(toolbar);

        LinearLayout statusBar = new LinearLayout(this);
        statusBar.setOrientation(LinearLayout.VERTICAL);
        statusBar.setPadding(dp(12), dp(6), dp(12), dp(6));
        statusBar.setBackgroundColor(dark);

        LinearLayout statusRow = new LinearLayout(this);
        statusRow.setOrientation(LinearLayout.HORIZONTAL);
        statusRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView title = new TextView(this);
        title.setText("instaling-bot");
        title.setTextColor(Color.parseColor("#6b7280"));
        title.setTextSize(11);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setPadding(0, 0, dp(8), 0);
        statusRow.addView(title);

        statusView = new TextView(this);
        statusView.setText(statusLabel("idle"));
        statusView.setTextColor(muted);
        statusView.setTextSize(14);
        statusView.setTypeface(Typeface.DEFAULT_BOLD);
        statusView.setLayoutParams(new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        statusRow.addView(statusView);

        statusBar.addView(statusRow);

        countsView = new TextView(this);
        countsView.setText("0 / 0");
        countsView.setTextColor(Color.parseColor("#d1d5db"));
        countsView.setTextSize(12);
        statusBar.addView(countsView);

        statsView = new TextView(this);
        statsView.setTextColor(Color.parseColor("#9ca3af"));
        statsView.setTextSize(11);
        statsView.setVisibility(View.GONE);
        statusBar.addView(statsView);

        updateButton = smallButton(label(12), Color.parseColor("#1d4ed8"), Color.WHITE);
        updateButton.setVisibility(View.GONE);
        updateButton.setOnClickListener(view -> openUrl(RELEASES_URL));
        statusBar.addView(updateButton);

        root.addView(statusBar);

        webView = new WebView(this);
        webView.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        webView.setBackgroundColor(dark);
        root.addView(webView);

        setContentView(root);
        applySystemBarInsets(root);
        refreshReminderButton();
    }

    /**
     * Apps targeting SDK 35 are edge to edge on Android 15+, so the toolbar would
     * sit under the clock and battery icons. Inset the root view by the system bars.
     */
    private void applySystemBarInsets(View root) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return;
        root.setOnApplyWindowInsetsListener((view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsets.CONSUMED;
        });
    }

    private Button smallButton(String text, int background, int foreground) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextSize(13);
        button.setTextColor(foreground);
        button.setAllCaps(false);
        button.setBackgroundColor(background);
        button.setMinWidth(dp(48));
        button.setMinHeight(dp(42));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params.setMargins(dp(4), 0, 0, 0);
        button.setLayoutParams(params);
        return button;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        // No custom User-Agent: the shell must look like the stock WebView so
        // the site sees nothing unusual (best-effort, not a guarantee).

        // The shell reads and writes no local files and stores no credentials; only
        // the instaling.pl session in this WebView keeps the user signed in.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSaveFormData(false);
        settings.setGeolocationEnabled(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.addJavascriptInterface(new NativeBridge(), "InstalingBotNative");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) {
                    // Subframes (ads, embedded widgets) stay inside the WebView,
                    // so they can never launch external apps; only top-level
                    // navigation is delegated to the system browser.
                    return false;
                }
                return handleNavigation(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNavigation(Uri.parse(url));
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                pageReady = false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // The bridge and the bot stay on instaling.pl. Any other document
                // (ads, external links) is just rendered, never controlled.
                if (!isBotHost(Uri.parse(url))) {
                    pageReady = false;
                    return;
                }
                pageReady = true;
                injectEngine(view);
            }
        });
        webView.loadUrl(START_URL);
    }

    /**
     * Keeps instaling.pl inside the app and sends every other link to the system
     * browser, so page content can never drive the shell or the JS bridge.
     */
    private boolean handleNavigation(Uri uri) {
        if (uri == null) return true;
        if (isBotHost(uri)) return false;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if ("http".equals(scheme) || "https".equals(scheme)) {
            openExternally(uri);
        }
        return true;
    }

    private static boolean isBotHost(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if (!"https".equals(scheme)) return false;
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        return "instaling.pl".equals(host) || host.endsWith(".instaling.pl");
    }

    private void openExternally(Uri uri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception ignored) {
            // No browser installed: keep the current page.
        }
    }

    private void injectEngine(WebView view) {
        String core = readAsset("core.js");
        if (core == null) {
            showStatus(label(7));
            return;
        }
        // A fresh secret per injection: only the engine created here can drive the
        // bridge, so an ad iframe that reaches postEvent cannot fake UI events.
        bridgeToken = java.util.UUID.randomUUID().toString();
        String boot = "(function(){"
                + "if(!window.InstalingBot){return;}"
                + "var host=location.hostname.toLowerCase();"
                + "if(host!=='instaling.pl'&&host.slice(-13)!=='.instaling.pl'){return;}"
                + "if(window.__instalingBotEngine){window.__instalingBotEngine.resume();return;}"
                + "var token='" + bridgeToken + "';"
                + "window.__instalingBotEngine=InstalingBot.create({"
                + "language:'" + ("en".equals(language) ? "en" : "pl") + "',"
                + "config:{valid_chance:" + prefs.getFloat("valid_chance", 0.8f)
                + ",max_answers:" + prefs.getInt("max_answers", 0) + "},"
                + "onEvent:function(e){try{InstalingBotNative.postEvent(token,JSON.stringify(e));}catch(err){}}"
                + "});"
                + (pendingStart ? "window.__instalingBotEngine.start();" : "window.__instalingBotEngine.resume();")
                + "})();";
        pendingStart = false;
        view.evaluateJavascript(core + "\n" + boot, value -> refreshStats());
    }

    private String readAsset(String name) {
        try (InputStream stream = getAssets().open(name)) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int read;
            while ((read = stream.read(chunk)) != -1) buffer.write(chunk, 0, read);
            return buffer.toString("UTF-8");
        } catch (Exception error) {
            return null;
        }
    }

    private void requestStart() {
        pendingStart = true;
        if (pageReady) {
            webView.evaluateJavascript(
                    "(window.__instalingBotEngine&&window.__instalingBotEngine.start())", null);
            pendingStart = false;
        }
    }

    private void stopBot() {
        pendingStart = false;
        if (pageReady) {
            webView.evaluateJavascript(
                    "window.__instalingBotEngine&&window.__instalingBotEngine.stop()", null);
        }
    }

    private void toggleLanguage() {
        language = "pl".equals(language) ? "en" : "pl";
        prefs.edit().putString("language", language).apply();
        languageButton.setText(language.toUpperCase());
        startButton.setText(label(0));
        stopButton.setText(label(1));
        updateButton.setText(label(12));
        statusView.setText(statusLabel(lastStatus));
        refreshReminderButton();
        if (pageReady) {
            webView.evaluateJavascript(
                    "window.__instalingBotEngine&&window.__instalingBotEngine.setLanguage('" + language + "')", null);
            refreshStats();
        }
    }

    private void showStatus(String status) {
        statusView.setText(status);
    }

    // --- settings --------------------------------------------------------

    private void openSettings() {
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);

        final EditText validity = numberField(Math.round(prefs.getFloat("valid_chance", 0.8f) * 100));
        content.addView(fieldLabel(label(14)));
        content.addView(validity);

        final EditText limit = numberField(prefs.getInt("max_answers", 0));
        content.addView(fieldLabel(label(15)));
        content.addView(limit);

        final int[] time = {reminderHour(), reminderMinute()};
        final Button timeButton = new Button(this);
        timeButton.setAllCaps(false);
        timeButton.setText(label(18) + ": " + formatTime(time[0], time[1]));
        timeButton.setOnClickListener(view -> new TimePickerDialog(this,
                (picker, hour, minute) -> {
                    time[0] = hour;
                    time[1] = minute;
                    timeButton.setText(label(18) + ": " + formatTime(hour, minute));
                }, time[0], time[1], true).show());
        content.addView(timeButton);

        new AlertDialog.Builder(this)
                .setTitle(label(13))
                .setView(content)
                .setPositiveButton(label(16), (dialog, which) -> saveSettings(validity, limit, time))
                .setNegativeButton(label(17), null)
                .show();
    }

    private EditText numberField(int value) {
        EditText field = new EditText(this);
        field.setInputType(InputType.TYPE_CLASS_NUMBER);
        field.setText(String.valueOf(value));
        field.setSelectAllOnFocus(true);
        return field;
    }

    private TextView fieldLabel(String text) {
        TextView labelView = new TextView(this);
        labelView.setText(text);
        labelView.setTextSize(13);
        labelView.setPadding(0, dp(8), 0, 0);
        return labelView;
    }

    private void saveSettings(EditText validity, EditText limit, int[] time) {
        int percent = clamp(parseInt(validity.getText().toString(), 80), 0, 100);
        int maxAnswers = Math.max(0, parseInt(limit.getText().toString(), 0));
        prefs.edit()
                .putFloat("valid_chance", percent / 100f)
                .putInt("max_answers", maxAnswers)
                .putInt("reminder_hour", time[0])
                .putInt("reminder_minute", time[1])
                .apply();
        applyConfigToEngine();
        if (prefs.getBoolean("reminder", false)) scheduleReminder();
        Toast.makeText(this, label(19), Toast.LENGTH_SHORT).show();
    }

    /** Pushes the saved settings into the live engine without a reload. */
    private void applyConfigToEngine() {
        if (webView == null || !pageReady) return;
        String js = "window.__instalingBotEngine&&window.__instalingBotEngine.setConfig({"
                + "valid_chance:" + prefs.getFloat("valid_chance", 0.8f) + ","
                + "max_answers:" + prefs.getInt("max_answers", 0) + "})";
        webView.evaluateJavascript(js, null);
    }

    private static int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException error) {
            return fallback;
        }
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static String formatTime(int hour, int minute) {
        return String.format(java.util.Locale.ROOT, "%02d:%02d", hour, minute);
    }

    private int reminderHour() {
        return prefs.getInt("reminder_hour", DEFAULT_REMINDER_HOUR);
    }

    private int reminderMinute() {
        return prefs.getInt("reminder_minute", DEFAULT_REMINDER_MINUTE);
    }

    /** Shows the persisted statistics line under the live counters. */
    private void refreshStats() {
        if (webView == null) return;
        webView.evaluateJavascript(
                "(function(){try{return window.__instalingBotEngine?"
                        + "window.__instalingBotEngine.getStats():null;}catch(e){return null;}})()",
                value -> {
                    if (value == null || "null".equals(value)) return;
                    try {
                        JSONObject stats = new JSONObject(value);
                        JSONObject today = stats.optJSONObject("today");
                        JSONObject total = stats.optJSONObject("total");
                        int answered = today == null ? 0 : today.optInt("answers", 0);
                        int ok = today == null ? 0 : today.optInt("correct", 0);
                        int percent = total == null ? 0 : total.optInt("accuracy", 0);
                        int streak = stats.optInt("streak", 0);
                        boolean english = "en".equals(language);
                        StringBuilder line = new StringBuilder(english
                                ? "Today: " + answered + " answers, " + ok + " correct · Accuracy: " + percent + "%"
                                : "Dziś: " + answered + " odpowiedzi, " + ok + " poprawnych · Skuteczność: " + percent + "%");
                        if (streak > 1) {
                            line.append(english ? " · Streak: " + streak + " days" : " · Seria: " + streak + " dni");
                        }
                        statsView.setText(line.toString());
                        statsView.setVisibility(View.VISIBLE);
                    } catch (Exception ignored) {
                        // A malformed result must not break the shell.
                    }
                });
    }

    private class NativeBridge {
        @JavascriptInterface
        public void postEvent(String token, String json) {
            if (token == null || !token.equals(bridgeToken)) return;
            runOnUiThread(() -> handleEvent(json));
        }
    }

    private void handleEvent(String json) {
        // Only the instaling.pl main frame may drive the UI: a third-party iframe
        // (ads) can reach the bridge but must not be able to rewrite the status bar.
        if (webView == null || !isBotHost(Uri.parse(webView.getUrl() == null ? "" : webView.getUrl()))) {
            return;
        }
        try {
            JSONObject event = new JSONObject(json);
            String type = event.optString("type");
            JSONObject state = event.optJSONObject("state");
            if (state != null) {
                answers = state.optInt("answers", answers);
                correct = state.optInt("correct", correct);
                countsView.setText(answers + " / " + correct);
                boolean running = state.optBoolean("running", false);
                startButton.setEnabled(!running);
                stopButton.setEnabled(running);
            }
            if ("status".equals(type)) {
                lastStatus = event.optString("status", "idle");
                showStatus(statusLabel(lastStatus));
            } else if ("log".equals(type)) {
                String message = event.optString("message", "");
                if (!message.isEmpty()) countsView.setText(message);
            } else if ("error".equals(type)) {
                showStatus(label(7) + ": " + event.optString("message", ""));
            } else if ("finished".equals(type)) {
                startButton.setEnabled(true);
                stopButton.setEnabled(false);
            }
            if ("answered".equals(type) || "progress".equals(type)
                    || "saved".equals(type) || "finished".equals(type)) {
                refreshStats();
            }
        } catch (Exception ignored) {
            // A malformed event must not break the UI.
        }
    }

    private void openUrl(String url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception ignored) {
            // No browser installed.
        }
    }

    // --- reminders -------------------------------------------------------

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        NotificationChannel channel = new NotificationChannel(
                "reminders", "instaling-bot", NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription("Daily InstaLing reminder");
        manager.createNotificationChannel(channel);
    }

    private void toggleReminder() {
        boolean enabled = !prefs.getBoolean("reminder", false);
        if (enabled && Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION);
        }
        prefs.edit().putBoolean("reminder", enabled).apply();
        if (enabled) scheduleReminder();
        else cancelReminder();
        refreshReminderButton();
        Toast.makeText(this, enabled ? label(10) : label(11), Toast.LENGTH_SHORT).show();
    }

    private void refreshReminderButton() {
        boolean enabled = prefs.getBoolean("reminder", false);
        reminderButton.setBackgroundColor(Color.parseColor(enabled ? "#0f766e" : "#374151"));
        reminderButton.setAlpha(enabled ? 1f : 0.7f);
    }

    private void scheduleReminderIfEnabled() {
        if (prefs.getBoolean("reminder", false)) scheduleReminder();
    }

    private void scheduleReminder() {
        AlarmManager alarms = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(this, ReminderReceiver.class);
        PendingIntent pending = PendingIntent.getBroadcast(this, 7, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Calendar next = Calendar.getInstance();
        next.set(Calendar.HOUR_OF_DAY, reminderHour());
        next.set(Calendar.MINUTE, reminderMinute());
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);
        if (next.getTimeInMillis() <= System.currentTimeMillis()) {
            next.add(Calendar.DAY_OF_YEAR, 1);
        }
        alarms.setInexactRepeating(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(),
                AlarmManager.INTERVAL_DAY, pending);
    }

    private void cancelReminder() {
        AlarmManager alarms = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(this, ReminderReceiver.class);
        PendingIntent pending = PendingIntent.getBroadcast(this, 7, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        alarms.cancel(pending);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == NOTIFICATION_PERMISSION) scheduleReminderIfEnabled();
    }

    // --- updates ---------------------------------------------------------

    private void checkForUpdate() {
        Executors.newSingleThreadExecutor().execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) URI.create(API_URL).toURL().openConnection();
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setRequestProperty("User-Agent", "instaling-bot-mobile");
                connection.setConnectTimeout(8000);
                connection.setReadTimeout(8000);
                if (connection.getResponseCode() != 200) return;

                StringBuilder body = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) body.append(line);
                }
                String tag = new JSONObject(body.toString()).optString("tag_name", "");
                String current = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
                if (isNewer(tag, current)) {
                    runOnUiThread(() -> {
                        updateButton.setText(label(12) + " " + tag);
                        updateButton.setVisibility(View.VISIBLE);
                    });
                }
            } catch (Exception ignored) {
                // Offline or rate-limited: no update prompt.
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    private boolean isNewer(String remoteTag, String current) {
        String[] remote = remoteTag.replaceFirst("^v", "").split("[.-]");
        String[] local = String.valueOf(current).split("[.-]");
        for (int i = 0; i < Math.min(remote.length, local.length); i++) {
            try {
                int a = Integer.parseInt(remote[i]);
                int b = Integer.parseInt(local[i]);
                if (a != b) return a > b;
            } catch (NumberFormatException error) {
                return false;
            }
        }
        return remote.length > local.length;
    }

    // --- navigation ------------------------------------------------------

    private void handleIntent(Intent intent) {
        Uri data = intent == null ? null : intent.getData();
        if (data == null || !"instalingbot".equals(data.getScheme())) return;
        if ("start".equals(data.getHost())) requestStart();
        if ("stop".equals(data.getHost())) stopBot();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onPause() {
        // Persist the website session (cookies) so reopening the app keeps the
        // user signed in. The shell itself never stores the password.
        if (webView != null) CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            CookieManager.getInstance().flush();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}

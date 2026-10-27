package com.bmoneczek.instalingbot;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.util.Calendar;

public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        // The receiver is exported so the system can wake it after a reboot; only
        // accept the documented broadcast from anyone else.
        if (intent == null || !Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;

        SharedPreferences prefs = context.getSharedPreferences("instaling-bot", Context.MODE_PRIVATE);
        if (!prefs.getBoolean("reminder", false)) return;

        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;

        Intent reminder = new Intent(context, ReminderReceiver.class);
        PendingIntent pending = PendingIntent.getBroadcast(context, 7, reminder,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Calendar next = Calendar.getInstance();
        next.set(Calendar.HOUR_OF_DAY, prefs.getInt("reminder_hour", 17));
        next.set(Calendar.MINUTE, prefs.getInt("reminder_minute", 0));
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);
        if (next.getTimeInMillis() <= System.currentTimeMillis()) {
            next.add(Calendar.DAY_OF_YEAR, 1);
        }
        int repeat = Math.max(0, prefs.getInt("reminder_repeat", 0));
        long interval = repeat > 0 ? repeat * 60_000L : AlarmManager.INTERVAL_DAY;
        alarms.setInexactRepeating(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), interval, pending);
    }
}
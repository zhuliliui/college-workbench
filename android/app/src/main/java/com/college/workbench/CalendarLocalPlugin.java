package com.college.workbench;

import android.Manifest;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 本地系统日历写入插件（不依赖 Google 服务，离线可用）。
 * 直接读写 Android 系统级 CalendarContract 数据库，华为/安卓日历 App 共享该数据源，写入后自动显示。
 */
@CapacitorPlugin(name = "CalendarLocal")
public class CalendarLocalPlugin extends Plugin {
    private static final String PERM_READ = Manifest.permission.READ_CALENDAR;
    private static final String PERM_WRITE = Manifest.permission.WRITE_CALENDAR;
    private static final int REQ_CODE = 7321;
    private static final String CAL_NAME = "小朱工作台";
    private static final String MARK = "[小朱工作台]";
    private PluginCall savedCall = null;

    @PluginMethod()
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", hasPerm());
        call.resolve(ret);
    }

    @PluginMethod()
    public void requestPermissions(PluginCall call) {
        if (hasPerm()) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }
        savedCall = call;
        ActivityCompat.requestPermissions(getActivity(), new String[] { PERM_READ, PERM_WRITE }, REQ_CODE);
    }

    @Override
    protected void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_CODE && savedCall != null) {
            boolean ok = grantResults.length >= 2
                && grantResults[0] == PackageManager.PERMISSION_GRANTED
                && grantResults[1] == PackageManager.PERMISSION_GRANTED;
            JSObject ret = new JSObject();
            ret.put("granted", ok);
            savedCall.resolve(ret);
            savedCall = null;
        }
    }

    private boolean hasPerm() {
        return ContextCompat.checkSelfPermission(getContext(), PERM_READ) == PackageManager.PERMISSION_GRANTED
            && ContextCompat.checkSelfPermission(getContext(), PERM_WRITE) == PackageManager.PERMISSION_GRANTED;
    }

    private long findCalendar() {
        String[] proj = { CalendarContract.Calendars._ID };
        try (Cursor c = getContext().getContentResolver().query(
                CalendarContract.Calendars.CONTENT_URI, proj,
                CalendarContract.Calendars.ACCOUNT_NAME + " = ? AND " + CalendarContract.Calendars.ACCOUNT_TYPE + " = ?",
                new String[] { CAL_NAME, CalendarContract.ACCOUNT_TYPE_LOCAL }, null)) {
            if (c != null && c.moveToFirst()) return c.getLong(0);
        } catch (Exception ignore) {
        }
        return -1;
    }

    private long ensureCalendar() {
        long id = findCalendar();
        if (id > 0) return id;
        ContentValues cv = new ContentValues();
        cv.put(CalendarContract.Calendars.ACCOUNT_NAME, CAL_NAME);
        cv.put(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL);
        cv.put(CalendarContract.Calendars.NAME, CAL_NAME);
        cv.put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, CAL_NAME);
        cv.put(CalendarContract.Calendars.CALENDAR_COLOR, 0x5e8268);
        cv.put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, CalendarContract.Calendars.CAL_ACCESS_OWNER);
        cv.put(CalendarContract.Calendars.OWNER_ACCOUNT, CAL_NAME);
        cv.put(CalendarContract.Calendars.VISIBLE, 1);
        cv.put(CalendarContract.Calendars.SYNC_EVENTS, 1);
        Uri calUri = CalendarContract.Calendars.CONTENT_URI.buildUpon()
                .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, CAL_NAME)
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL)
                .build();
        try {
            Uri r = getContext().getContentResolver().insert(calUri, cv);
            if (r != null) return Long.parseLong(r.getLastPathSegment());
        } catch (Exception ignore) {
        }
        return -1;
    }

    @PluginMethod()
    public void sync(PluginCall call) {
        if (!hasPerm()) {
            call.reject("calendar-permission-denied");
            return;
        }
        JSONArray events;
        try {
            events = call.getArray("events");
        } catch (Exception e) {
            call.reject("invalid-events");
            return;
        }
        JSONArray rems = null;
        try {
            rems = call.getArray("reminders");
        } catch (Exception ignore) {
        }
        long calId = ensureCalendar();
        if (calId < 0) {
            call.reject("calendar-create-failed");
            return;
        }
        // 先清除本插件写入的旧事件，保证与当前清单一致
        try {
            getContext().getContentResolver().delete(CalendarContract.Events.CONTENT_URI,
                    CalendarContract.Events.CALENDAR_ID + " = ? AND " + CalendarContract.Events.DESCRIPTION + " LIKE ?",
                    new String[] { String.valueOf(calId), "%" + MARK + "%" });
        } catch (Exception ignore) {
        }
        int count = 0;
        for (int i = 0; i < events.length(); i++) {
            try {
                JSONObject e = events.getJSONObject(i);
                ContentValues cv = new ContentValues();
                cv.put(CalendarContract.Events.CALENDAR_ID, calId);
                cv.put(CalendarContract.Events.TITLE, e.optString("title", "提醒"));
                cv.put(CalendarContract.Events.DESCRIPTION, e.optString("description", "") + "\n" + MARK);
                cv.put(CalendarContract.Events.EVENT_LOCATION, e.optString("location", ""));
                long start = e.optLong("start", System.currentTimeMillis());
                long end = e.optLong("end", start + 3600000);
                cv.put(CalendarContract.Events.DTSTART, start);
                cv.put(CalendarContract.Events.DTEND, end);
                cv.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
                cv.put(CalendarContract.Events.CALENDAR_TIME_ZONE, TimeZone.getDefault().getID());
                cv.put(CalendarContract.Events.HAS_ALARM, 1);
                Uri evUri = getContext().getContentResolver().insert(CalendarContract.Events.CONTENT_URI, cv);
                if (evUri == null) continue;
                long evId = Long.parseLong(evUri.getLastPathSegment());
                if (rems != null && rems.length() > 0) {
                    for (int k = 0; k < rems.length(); k++) {
                        int mins = rems.optInt(k, 60);
                        if (mins <= 0) continue;
                        ContentValues rem = new ContentValues();
                        rem.put(CalendarContract.Reminders.EVENT_ID, evId);
                        rem.put(CalendarContract.Reminders.MINUTES, mins);
                        rem.put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT);
                        getContext().getContentResolver().insert(CalendarContract.Reminders.CONTENT_URI, rem);
                    }
                } else {
                    ContentValues rem = new ContentValues();
                    rem.put(CalendarContract.Reminders.EVENT_ID, evId);
                    rem.put(CalendarContract.Reminders.MINUTES, 60);
                    rem.put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT);
                    getContext().getContentResolver().insert(CalendarContract.Reminders.CONTENT_URI, rem);
                }
                count++;
            } catch (Exception ignore) {
            }
        }
        JSObject ret = new JSObject();
        ret.put("count", count);
        call.resolve(ret);
    }

    @PluginMethod()
    public void clear(PluginCall call) {
        long calId = findCalendar();
        if (calId > 0) {
            try {
                getContext().getContentResolver().delete(CalendarContract.Events.CONTENT_URI,
                        CalendarContract.Events.CALENDAR_ID + " = ? AND " + CalendarContract.Events.DESCRIPTION + " LIKE ?",
                        new String[] { String.valueOf(calId), "%" + MARK + "%" });
            } catch (Exception ignore) {
            }
        }
        call.resolve();
    }
}

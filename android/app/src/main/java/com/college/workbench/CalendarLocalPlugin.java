package com.college.workbench;

import android.Manifest;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
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

@CapacitorPlugin(name = "CalendarLocal", requestCodes = { 7321 })
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
        ret.put("brand", deviceBrand());
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("model", Build.MODEL);
        ret.put("androidSdk", Build.VERSION.SDK_INT);
        call.resolve(ret);
    }

    @PluginMethod()
    public void getDeviceInfo(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("brand", deviceBrand());
        ret.put("manufacturer", Build.MANUFACTURER);
        ret.put("model", Build.MODEL);
        ret.put("androidSdk", Build.VERSION.SDK_INT);
        ret.put("isChinaRom", isChinaRom());
        call.resolve(ret);
    }

    private static String deviceBrand() {
        String b = Build.BRAND;
        return (b == null || b.isEmpty()) ? Build.MANUFACTURER : b;
    }

    // 国产 ROM 检测：vivo/华为/荣耀/小米/红米/OPPO/realme/一加/中兴/魅族/鸿蒙
    private static boolean isChinaRom() {
        String b = (Build.BRAND == null ? "" : Build.BRAND).toLowerCase();
        String m = (Build.MANUFACTURER == null ? "" : Build.MANUFACTURER).toLowerCase();
        String[] marks = { "vivo", "huawei", "honor", "xiaomi", "redmi", "oppo", "realme", "oneplus", "meizu", "zte", "iqoo", "nubia" };
        for (String k : marks) {
            if (b.indexOf(k) >= 0 || m.indexOf(k) >= 0) return true;
        }
        return false;
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
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
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

    private boolean isLocalCalendar(long calId) {
        try (Cursor c = getContext().getContentResolver().query(
                CalendarContract.Calendars.CONTENT_URI,
                new String[] { CalendarContract.Calendars.ACCOUNT_TYPE },
                CalendarContract.Calendars._ID + " = ?",
                new String[] { String.valueOf(calId) }, null)) {
            if (c != null && c.moveToFirst()) {
                return CalendarContract.ACCOUNT_TYPE_LOCAL.equals(c.getString(0));
            }
        } catch (Exception ignore) {
        }
        return false;
    }

    private long findOurCalendar() {
        String[] proj = { CalendarContract.Calendars._ID, CalendarContract.Calendars.VISIBLE };
        try (Cursor c = getContext().getContentResolver().query(
                CalendarContract.Calendars.CONTENT_URI, proj,
                CalendarContract.Calendars.ACCOUNT_NAME + " = ?",
                new String[] { CAL_NAME }, null)) {
            if (c != null && c.moveToFirst()) return c.getLong(0);
        } catch (Exception ignore) {
        }
        return -1;
    }

    private long createOurCalendar() {
        ContentValues cv = new ContentValues();
        cv.put(CalendarContract.Calendars.ACCOUNT_NAME, CAL_NAME);
        cv.put(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL);
        cv.put(CalendarContract.Calendars.NAME, CAL_NAME);
        cv.put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, CAL_NAME);
        cv.put(CalendarContract.Calendars.CALENDAR_COLOR, 0xFF5E8268);
        cv.put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, CalendarContract.Calendars.CAL_ACCESS_OWNER);
        cv.put(CalendarContract.Calendars.OWNER_ACCOUNT, CAL_NAME);
        cv.put(CalendarContract.Calendars.VISIBLE, 1);
        cv.put(CalendarContract.Calendars.SYNC_EVENTS, 1);
        try {
            // 注意：普通 App 不能用 CALLER_IS_SYNCADAPTER=true（仅 sync adapter 进程可调用）
            // 因此直接用普通 insert，系统会按 ACCOUNT_TYPE_LOCAL 创建
            Uri r = getContext().getContentResolver().insert(CalendarContract.Calendars.CONTENT_URI, cv);
            if (r != null) return Long.parseLong(r.getLastPathSegment());
        } catch (Exception ignore) {
        }
        return -1;
    }

    private long findWritableCalendar() {
        String[] proj = { CalendarContract.Calendars._ID, CalendarContract.Calendars.ACCOUNT_TYPE,
                CalendarContract.Calendars.VISIBLE, CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL };
        // 优先级：可见非 LOCAL 账户（Google/Exchange/QQ/网易等）→ 可见 LOCAL 账户 → 任意可写账户
        long nonLocalVisible = -1, localVisible = -1, anyWritable = -1;
        try (Cursor c = getContext().getContentResolver().query(
                CalendarContract.Calendars.CONTENT_URI, proj, null, null, null)) {
            if (c == null) return -1;
            while (c.moveToNext()) {
                long id = c.getLong(0);
                String type = c.getString(1);
                int vis = c.getInt(2);
                int lvl = c.getInt(3);
                if (lvl < CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR) continue;
                boolean isLocal = CalendarContract.ACCOUNT_TYPE_LOCAL.equals(type);
                if (!isLocal && vis == 1 && nonLocalVisible < 0) nonLocalVisible = id;
                if (isLocal && vis == 1 && localVisible < 0) localVisible = id;
                if (anyWritable < 0) anyWritable = id;
            }
        } catch (Exception ignore) {
        }
        if (nonLocalVisible > 0) return nonLocalVisible;
        if (localVisible > 0) return localVisible;
        return anyWritable;
    }

    private long pickCalendar() {
        long id = findOurCalendar();
        if (id > 0) return id;
        id = findWritableCalendar();
        if (id > 0) return id;
        return createOurCalendar();
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
        long calId = pickCalendar();
        if (calId < 0) {
            call.reject("no-writable-calendar");
            return;
        }
        boolean isOur = (findOurCalendar() == calId);
        boolean isLocal = isLocalCalendar(calId);
        String method = isOur ? "ours" : (isLocal ? "local" : ("picked:" + calId));
        try {
            getContext().getContentResolver().delete(CalendarContract.Events.CONTENT_URI,
                    CalendarContract.Events.DESCRIPTION + " LIKE ?",
                    new String[] { "%" + MARK + "%" });
        } catch (Exception ignore) {
        }
        int count = 0;
        String lastError = null;
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
                if (evUri == null) {
                    lastError = "insert-event-returned-null";
                    continue;
                }
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
            } catch (Exception ex) {
                lastError = ex.getClass().getSimpleName() + ":" + ex.getMessage();
            }
        }
        JSObject ret = new JSObject();
        ret.put("count", count);
        ret.put("method", method);
        ret.put("brand", deviceBrand());
        ret.put("isChinaRom", isChinaRom());
        if (lastError != null) ret.put("lastError", lastError);
        call.resolve(ret);
    }

    @PluginMethod()
    public void clear(PluginCall call) {
        try {
            getContext().getContentResolver().delete(CalendarContract.Events.CONTENT_URI,
                    CalendarContract.Events.DESCRIPTION + " LIKE ?",
                    new String[] { "%" + MARK + "%" });
        } catch (Exception ignore) {
        }
        call.resolve();
    }
}

package com.college.workbench;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 桌面小组件：仿系统待办样式 —— 标题 + 未完成计数大数字 + 彩色圆角任务行（点击直接勾选）+ 底部 ＋。
 * 数据由前端 WidgetDataPlugin.save 写入 SharedPreferences 后触发 pushUpdate；
 * 行点击 → ACTION_TOGGLE 广播 → 这里直接改 SharedPreferences 数据并记录 ops 队列，
 * App 下次回前台由 widget-bridge.js consumeOps 同步回 Store（含金币）。
 */
public class CwWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_TOGGLE = "com.college.workbench.widget.TOGGLE";
    private static final int ROWS = 7;
    private static final int COLOR_TITLE = 0xFF232A26;
    private static final int COLOR_TEXT = 0xFF3D463F;
    private static final int COLOR_DONE = 0xFF9AA79E;
    private static final int COLOR_RED = 0xFFD64541;
    private static final int[] PILL_BG = { R.drawable.cw_pill_yellow, R.drawable.cw_pill_green, R.drawable.cw_pill_blue };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        pushUpdate(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (ACTION_TOGGLE.equals(intent.getAction())) {
            try {
                String id = intent.getStringExtra("id");
                toggleLine(context, id);
            } catch (Exception e) { /* 数据异常不让组件崩 */ }
        }
        super.onReceive(context, intent);
    }

    /** 在 SharedPreferences 的数据 JSON 里切换指定行完成态，记录 ops，立即刷新组件 */
    private static void toggleLine(Context ctx, String id) {
        if (id == null || id.isEmpty()) return;
        try {
            android.content.SharedPreferences sp = ctx.getSharedPreferences(WidgetDataPlugin.PREFS, Context.MODE_PRIVATE);
            String json = sp.getString(WidgetDataPlugin.KEY, "");
            if (json == null || json.isEmpty()) return;
            JSONObject o = new JSONObject(json);
            JSONArray arr = o.optJSONArray("lines");
            if (arr == null) return;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject it = arr.optJSONObject(i);
                if (it == null || !id.equals(it.optString("id"))) continue;
                boolean nd = !it.optBoolean("d", false);
                it.put("d", nd);
                String kind = it.optString("kind", "task");
                // 同步行前缀 ✓/○
                String txt = it.optString("t", "");
                if (txt.startsWith("✓ ")) txt = txt.substring(2);
                else if (txt.startsWith("○ ")) txt = txt.substring(2);
                it.put("t", (nd ? "✓ " : "○ ") + txt);
                sp.edit().putString(WidgetDataPlugin.KEY, o.toString()).apply();
                WidgetDataPlugin.appendOp(ctx, id, kind, nd);
                break;
            }
        } catch (Exception e) { /* 忽略 */ }
        pushUpdate(ctx);
    }

    /** 全量刷新所有已添加的组件实例 */
    public static void pushUpdate(Context ctx) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, CwWidgetProvider.class));
            if (ids == null || ids.length == 0) return;
            String json = ctx.getSharedPreferences(WidgetDataPlugin.PREFS, Context.MODE_PRIVATE)
                    .getString(WidgetDataPlugin.KEY, "");
            RemoteViews rv = build(ctx, json);
            if (rv != null) mgr.updateAppWidget(ids, rv);
        } catch (Exception e) { /* 数据损坏时不让组件崩溃 */ }
    }

    private static PendingIntent openAppPI(Context ctx, int requestCode) {
        Intent i = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (i == null) return null;
        i.setData(Uri.parse("cwwidget://open"));
        return PendingIntent.getActivity(ctx, requestCode, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent togglePI(Context ctx, String id, String kind, int requestCode) {
        Intent i = new Intent(ACTION_TOGGLE);
        i.setComponent(new ComponentName(ctx, CwWidgetProvider.class));
        i.putExtra("id", id == null ? "" : id);
        i.putExtra("kind", kind == null ? "" : kind);
        return PendingIntent.getBroadcast(ctx, requestCode, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static RemoteViews build(Context ctx, String json) {
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.cw_widget);

        String piggyText = "";
        int count = 0;
        String[] texts = new String[ROWS];
        boolean[] done = new boolean[ROWS];
        boolean[] red = new boolean[ROWS];
        String[] ids = new String[ROWS];
        String[] kinds = new String[ROWS];
        int n = 0;
        try {
            JSONObject o = new JSONObject(json == null || json.isEmpty() ? "{}" : json);
            piggyText = o.optString("piggy", "");
            count = o.optInt("count", 0);
            JSONArray arr = o.optJSONArray("lines");
            if (arr != null) {
                for (int i = 0; i < arr.length() && n < ROWS; i++) {
                    JSONObject it = arr.optJSONObject(i);
                    if (it == null) continue;
                    texts[n] = it.optString("t", "");
                    done[n] = it.optBoolean("d", false);
                    red[n] = it.optBoolean("w", false);
                    ids[n] = it.optString("id", "");
                    kinds[n] = it.optString("kind", "task");
                    n++;
                }
            }
        } catch (Exception e) { /* JSON 解析失败 → 空状态 */ }

        if (n == 0) { texts[0] = "今天还没有安排，点开看看 ›"; ids[0] = ""; n = 1; }

        // 头部：标题 + 未完成计数
        rv.setTextViewText(R.id.cw_title, "🚜 今日计划");
        rv.setTextColor(R.id.cw_title, COLOR_TITLE);
        rv.setTextViewText(R.id.cw_count, String.valueOf(count));

        int[] rowIds = { R.id.cw_row0, R.id.cw_row1, R.id.cw_row2, R.id.cw_row3, R.id.cw_row4, R.id.cw_row5, R.id.cw_row6 };
        for (int i = 0; i < ROWS; i++) {
            if (i < n && texts[i] != null && !texts[i].isEmpty()) {
                rv.setViewVisibility(rowIds[i], android.view.View.VISIBLE);
                rv.setTextViewText(rowIds[i], texts[i]);
                rv.setTextColor(rowIds[i], done[i] ? COLOR_DONE : (red[i] ? COLOR_RED : COLOR_TEXT));
                try { rv.setInt(rowIds[i], "setBackgroundResource", PILL_BG[i % PILL_BG.length]); } catch (Exception e) {}
                // 可勾选的行（有 id）→ 点击直接切换完成态；无 id 的占位行 → 点击打开 App
                PendingIntent pi = (ids[i] == null || ids[i].isEmpty())
                        ? openAppPI(ctx, 1000 + i)
                        : togglePI(ctx, ids[i], kinds[i], 2000 + i);
                if (pi != null) rv.setOnClickPendingIntent(rowIds[i], pi);
            } else {
                rv.setViewVisibility(rowIds[i], android.view.View.GONE);
            }
        }

        // 底部：存钱罐余额 + ＋（打开 App）
        rv.setTextViewText(R.id.cw_piggy, piggyText == null || piggyText.isEmpty() ? "" : "💰 " + piggyText);
        rv.setTextColor(R.id.cw_piggy, COLOR_TITLE);
        PendingIntent openPi = openAppPI(ctx, 3000);
        if (openPi != null) rv.setOnClickPendingIntent(R.id.cw_add, openPi);
        return rv;
    }
}

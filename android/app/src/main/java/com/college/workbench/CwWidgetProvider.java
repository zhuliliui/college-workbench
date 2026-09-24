package com.college.workbench;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 桌面小组件：今日计划 + 临近 DDL。
 * 数据由前端 WidgetDataPlugin.save 写入 SharedPreferences 后触发 pushUpdate；
 * 系统轮询 onUpdate 时也从 SharedPreferences 读取最近一份数据渲染。
 * 行内容 JS 端已格式化好：{t: 文本, d: 是否已完成, w: 是否紧急}，Java 只做着色。
 */
public class CwWidgetProvider extends AppWidgetProvider {
    private static final int ROWS = 6;
    private static final int COLOR_TITLE = 0xFF3E5C49;
    private static final int COLOR_TEXT = 0xFF46554D;
    private static final int COLOR_DONE = 0xFF9DB4A6;
    private static final int COLOR_WARN = 0xFFC0564F;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        pushUpdate(context);
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

    private static RemoteViews build(Context ctx, String json) {
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.cw_widget);
        // 点击组件任意位置 → 打开工作台
        try {
            Intent i = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
            if (i != null) {
                i.setData(Uri.parse("cwwidget://open"));
                PendingIntent pi = PendingIntent.getActivity(ctx, 1001, i,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                rv.setOnClickPendingIntent(R.id.cw_widget_root, pi);
            }
        } catch (Exception e) { /* 忽略点击异常 */ }

        String piggyText = "";
        String[] lines = new String[ROWS];
        boolean[] done = new boolean[ROWS];
        boolean[] warn = new boolean[ROWS];
        int n = 0;
        try {
            JSONObject o = new JSONObject(json == null || json.isEmpty() ? "{}" : json);
            piggyText = o.optString("piggy", "");
            JSONArray arr = o.optJSONArray("lines");
            if (arr != null) {
                for (int i = 0; i < arr.length() && n < ROWS; i++) {
                    JSONObject it = arr.optJSONObject(i);
                    if (it == null) continue;
                    lines[n] = it.optString("t", "");
                    done[n] = it.optBoolean("d", false);
                    warn[n] = it.optBoolean("w", false);
                    n++;
                }
            }
        } catch (Exception e) { /* JSON 解析失败 → 空状态 */ }

        // 空状态占位
        if (n == 0) { lines[0] = "今天还没有安排，点开看看 ›"; n = 1; }

        int[] rowIds = { R.id.cw_row0, R.id.cw_row1, R.id.cw_row2, R.id.cw_row3, R.id.cw_row4, R.id.cw_row5 };
        for (int i = 0; i < ROWS; i++) {
            if (i < n && lines[i] != null && !lines[i].isEmpty()) {
                rv.setViewVisibility(rowIds[i], android.view.View.VISIBLE);
                rv.setTextViewText(rowIds[i], lines[i]);
                rv.setTextColor(rowIds[i], done[i] ? COLOR_DONE : (warn[i] ? COLOR_WARN : COLOR_TEXT));
            } else {
                rv.setViewVisibility(rowIds[i], android.view.View.GONE);
            }
        }
        rv.setTextColor(R.id.cw_title, COLOR_TITLE);
        rv.setTextColor(R.id.cw_piggy, COLOR_TITLE);
        rv.setTextViewText(R.id.cw_piggy, piggyText == null || piggyText.isEmpty() ? "" : "💰 " + piggyText);
        return rv;
    }
}

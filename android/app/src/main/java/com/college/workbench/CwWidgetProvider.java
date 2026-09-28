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
    static final int COLOR_TITLE = 0xFF232A26;
    static final int COLOR_TEXT = 0xFF3D463F;
    static final int COLOR_DONE = 0xFF9AA79E;
    static final int COLOR_RED = 0xFFD64541;
    static final int[] PILL_BG = { R.drawable.cw_pill_yellow, R.drawable.cw_pill_green, R.drawable.cw_pill_blue };

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
            if (rv != null) {
                mgr.updateAppWidget(ids, rv);
                // 通知列表适配器重新读数据（否则组件上勾选后列表内容不刷新）
                mgr.notifyAppWidgetViewDataChanged(ids, R.id.cw_list);
            }
        } catch (Exception e) { /* 数据损坏时不让组件崩溃 */ }
    }

    private static PendingIntent openAppPI(Context ctx, int requestCode) {
        Intent i = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (i == null) return null;
        i.setData(Uri.parse("cwwidget://open"));
        return PendingIntent.getActivity(ctx, requestCode, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static RemoteViews build(Context ctx, String json) {
        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.cw_widget);

        String piggyText = "";
        int count = 0;
        int ddlCount = 0;
        try {
            JSONObject o = new JSONObject(json == null || json.isEmpty() ? "{}" : json);
            piggyText = o.optString("piggy", "");
            count = o.optInt("count", 0);
            ddlCount = o.optInt("ddlCount", 0);
        } catch (Exception e) { /* JSON 解析失败 → 空状态 */ }

        // 头部：标题 + 右上角「任务 N · DDL M」
        rv.setTextViewText(R.id.cw_title, "今日计划");
        rv.setTextColor(R.id.cw_title, COLOR_TITLE);

        rv.setTextViewText(R.id.cw_task_label, "任务");
        rv.setTextColor(R.id.cw_task_label, COLOR_TEXT);
        rv.setTextViewText(R.id.cw_task_count, String.valueOf(count));
        rv.setTextColor(R.id.cw_task_count, count > 0 ? COLOR_TITLE : COLOR_DONE);

        rv.setTextViewText(R.id.cw_sep, "·");
        rv.setTextColor(R.id.cw_sep, COLOR_DONE);

        rv.setTextViewText(R.id.cw_ddl_label, "DDL");
        rv.setTextColor(R.id.cw_ddl_label, COLOR_TEXT);
        rv.setTextViewText(R.id.cw_ddl_count, String.valueOf(ddlCount));
        // 有未完成 DDL 时标红提醒，没有则淡化
        rv.setTextColor(R.id.cw_ddl_count, ddlCount > 0 ? COLOR_RED : COLOR_DONE);

        // 列表：RemoteViewsService 逐行生成（可滚动，行数不限），数据即时从 SharedPreferences 读
        Intent svc = new Intent(ctx, CwWidgetRemoteViewsService.class);
        rv.setRemoteAdapter(R.id.cw_list, svc);
        // 行点击模板：Service 的 fillInIntent（携带 id/kind）合入此广播 → onReceive 走 toggleLine
        Intent tpl = new Intent(ACTION_TOGGLE);
        tpl.setComponent(new ComponentName(ctx, CwWidgetProvider.class));
        PendingIntent tmpl = PendingIntent.getBroadcast(ctx, 0, tpl,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        rv.setPendingIntentTemplate(R.id.cw_list, tmpl);

        // 整块组件点击 → 打开 App（任务行与 ＋ 各自有更具体的点击，优先级更高）
        PendingIntent rootPi = openAppPI(ctx, 3001);
        if (rootPi != null) rv.setOnClickPendingIntent(R.id.cw_widget_root, rootPi);

        // 底部：存钱罐余额 + ＋（打开 App）
        rv.setTextViewText(R.id.cw_piggy, piggyText == null || piggyText.isEmpty() ? "" : piggyText);
        rv.setTextColor(R.id.cw_piggy, COLOR_TITLE);
        PendingIntent openPi = openAppPI(ctx, 3000);
        if (openPi != null) rv.setOnClickPendingIntent(R.id.cw_add, openPi);
        return rv;
    }
}

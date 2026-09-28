package com.college.workbench;

import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 组件 ListView 数据工厂：从 SharedPreferences 读前端推送的 JSON，
 * 逐行生成 RemoteViews（文本/颜色/彩色pill背景），并用 fillInIntent 携带 id/kind
 * 交给 CwWidgetProvider 的 PendingIntentTemplate 处理点击勾选。
 */
public class CwWidgetRemoteViewsService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Factory(this);
    }

    static class Factory implements RemoteViewsFactory {
        private final Context ctx;
        private JSONArray lines = new JSONArray();

        Factory(Context ctx) { this.ctx = ctx; }

        @Override public void onCreate() { }
        @Override public void onDestroy() { }
        @Override public void onDataSetChanged() {
            // 每次刷新重新读 SharedPreferences 里的最新数据
            try {
                String json = ctx.getSharedPreferences(WidgetDataPlugin.PREFS, Context.MODE_PRIVATE)
                        .getString(WidgetDataPlugin.KEY, "");
                JSONObject o = new JSONObject(json == null || json.isEmpty() ? "{}" : json);
                JSONArray arr = o.optJSONArray("lines");
                lines = arr == null ? new JSONArray() : arr;
            } catch (Exception e) { lines = new JSONArray(); }
        }
        @Override public int getViewTypeCount() { return 1; }
        @Override public long getItemId(int position) { return position; }
        @Override public boolean hasStableIds() { return false; }
        @Override public int getCount() { return lines.length(); }

        @Override
        public RemoteViews getViewAt(int position) {
            RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.cw_widget_row);
            JSONObject it = lines.optJSONObject(position);
            if (it == null) return rv;
            String id = it.optString("id", "");
            String kind = it.optString("kind", "task");
            String text = it.optString("t", "");
            boolean done = it.optBoolean("d", false);
            boolean red = it.optBoolean("w", false);

            rv.setTextViewText(R.id.cw_row_text, text);
            rv.setTextColor(R.id.cw_row_text, done ? CwWidgetProvider.COLOR_DONE : (red ? CwWidgetProvider.COLOR_RED : CwWidgetProvider.COLOR_TEXT));
            try { rv.setInt(R.id.cw_row_text, "setBackgroundResource", CwWidgetProvider.PILL_BG[position % CwWidgetProvider.PILL_BG.length]); } catch (Exception e) { }

            if (!id.isEmpty()) {
                // fillInIntent 会合入 Provider 里 setPendingIntentTemplate 的 ACTION_TOGGLE 广播
                Intent fi = new Intent();
                fi.putExtra("id", id);
                fi.putExtra("kind", kind);
                rv.setOnClickFillInIntent(R.id.cw_row_text, fi);
            }
            return rv;
        }

        @Override
        public RemoteViews getLoadingView() { return null; }
    }
}

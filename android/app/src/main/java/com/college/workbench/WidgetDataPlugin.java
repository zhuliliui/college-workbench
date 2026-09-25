package com.college.workbench;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 桌面小组件数据桥：前端把「今日计划 + 临近 DDL」的渲染行写入 SharedPreferences，
 * 再立即触发 CwWidgetProvider 刷新桌面组件（无需等系统 30 分钟轮询）。
 * 数据格式由 JS 端 widget-bridge.js 生成：{ count, piggy, lines:[{id,kind,t,d,w}] }。
 * 组件上点击行勾选 → CwWidgetProvider 记录 ops 队列 → 前端 consumeOps() 取走并同步回 Store。
 */
@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {
    static final String PREFS = "cw_widget";
    static final String KEY = "cw_widget_data";
    static final String KEY_OPS = "cw_widget_ops";

    @PluginMethod()
    public void save(PluginCall call) {
        String data = call.getString("data", "");
        Context ctx = getContext();
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY, data == null ? "" : data).apply();
        // 立即刷新桌面组件
        try { CwWidgetProvider.pushUpdate(ctx); } catch (Exception e) { /* 组件未添加等情况：忽略 */ }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    /** 前端取走组件上的勾选操作队列（取走即清空），格式 [{id,kind,done}] */
    @PluginMethod()
    public void consumeOps(PluginCall call) {
        Context ctx = getContext();
        android.content.SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String ops = sp.getString(KEY_OPS, "[]");
        sp.edit().putString(KEY_OPS, "[]").apply();
        JSObject ret = new JSObject();
        ret.put("ops", ops == null || ops.isEmpty() ? "[]" : ops);
        call.resolve(ret);
    }

    /** 供 CwWidgetProvider 追加一条勾选操作（组件端调用，线程安全：apply 原子写） */
    static void appendOp(Context ctx, String id, String kind, boolean done) {
        try {
            android.content.SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            JSONArray arr;
            try { arr = new JSONArray(sp.getString(KEY_OPS, "[]")); } catch (Exception e) { arr = new JSONArray(); }
            JSONObject op = new JSONObject();
            op.put("id", id == null ? "" : id);
            op.put("kind", kind == null ? "" : kind);
            op.put("done", done);
            arr.put(op);
            // 只保留最近 50 条，防止无限膨胀
            while (arr.length() > 50) { JSONArray n = new JSONArray(); for (int i = arr.length() - 50; i < arr.length(); i++) n.put(arr.opt(i)); arr = n; }
            sp.edit().putString(KEY_OPS, arr.toString()).apply();
        } catch (Exception e) { /* 忽略 */ }
    }
}

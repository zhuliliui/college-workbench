package com.college.workbench;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 桌面小组件数据桥：前端把「今日计划 + 临近 DDL」的渲染行写入 SharedPreferences，
 * 再立即触发 CwWidgetProvider 刷新桌面组件（无需等系统 30 分钟轮询）。
 * 数据格式由 JS 端 widget-bridge.js 生成：{ piggy, lines:[{t,d,w}] }，Java 只管渲染。
 */
@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {
    static final String PREFS = "cw_widget";
    static final String KEY = "cw_widget_data";

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
}

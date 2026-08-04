package com.college.workbench;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 注册类（Capacitor 6 的 registerPlugin 接收 Class，由 Bridge 实例化并转发权限回调）
        registerPlugin(CalendarLocalPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

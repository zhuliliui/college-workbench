package com.college.workbench;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    private CalendarLocalPlugin calPlugin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        calPlugin = new CalendarLocalPlugin();
        registerPlugin(calPlugin);
        super.onCreate(savedInstanceState);
    }

    // 系统权限回调统一在这里接收，再转发给本地日历插件实例
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (calPlugin != null) {
            calPlugin.onPermResult(requestCode, permissions, grantResults);
        }
    }
}

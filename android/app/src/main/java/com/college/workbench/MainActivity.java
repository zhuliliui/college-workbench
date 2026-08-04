package com.college.workbench;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CalendarLocalPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

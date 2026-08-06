package com.college.workbench;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.LinkedList;
import java.util.Locale;

/**
 * 原生文字转语音（离线）：直接调用 Android 系统 TTS 引擎
 * （华为 HiVoice / 小艺、vivo 自带引擎、讯飞等），无需网络、无需 GMS。
 * 前端优先调用；初始化失败（设备无任何 TTS 引擎）时 reject，前端回退到网络 TTS。
 */
@CapacitorPlugin(name = "TextToSpeech")
public class TextToSpeechPlugin extends Plugin {
    private TextToSpeech tts = null;
    private boolean initialized = false;
    private final LinkedList<PluginCall> pending = new LinkedList<>();

    @PluginMethod()
    public void speak(PluginCall call) {
        String text = call.getString("text");
        if (text == null || text.trim().isEmpty()) {
            call.reject("empty-text");
            return;
        }
        String lang = call.getString("lang");
        if (lang == null || lang.isEmpty()) lang = "en-US";
        double rate = call.getDouble("rate", 1.0);
        if (tts == null) {
            pending.add(call);
            init();
            return;
        }
        if (!initialized) {
            pending.add(call);
            return;
        }
        doSpeak(call, text, lang, rate);
    }

    @PluginMethod()
    public void stop(PluginCall call) {
        if (tts != null) {
            try { tts.stop(); } catch (Exception ignore) {}
        }
        call.resolve();
    }

    @PluginMethod()
    public void isSupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", initialized);
        call.resolve(ret);
    }

    private void init() {
        try {
            tts = new TextToSpeech(getContext(), new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status != TextToSpeech.SUCCESS) {
                        failAll("tts-init-failed");
                        return;
                    }
                    try {
                        tts.setLanguage(pickLocale());
                        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                            @Override public void onStart(String u) {}
                            @Override public void onDone(String u) {}
                            @Override public void onError(String u) {}
                        });
                    } catch (Exception ignore) {}
                    initialized = true;
                    LinkedList<PluginCall> q = new LinkedList<>(pending);
                    pending.clear();
                    for (PluginCall c : q) {
                        doSpeak(c, c.getString("text"), c.getString("lang"), c.getDouble("rate", 1.0));
                    }
                }
            });
        } catch (Exception e) {
            failAll("tts-exception");
        }
    }

    private Locale pickLocale() {
        Locale[] candidates = { Locale.US, Locale.UK, Locale.ENGLISH, Locale.getDefault() };
        for (Locale l : candidates) {
            try {
                int r = tts.setLanguage(l);
                if (r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED) return l;
            } catch (Exception ignore) {}
        }
        return Locale.US;
    }

    private Locale localeFor(String lang) {
        if (lang == null) return null;
        String l = lang.toLowerCase();
        if (l.startsWith("zh")) return Locale.SIMPLIFIED_CHINESE;
        if (l.startsWith("en")) return Locale.US;
        return null;
    }

    private void doSpeak(PluginCall call, String text, String lang, double rate) {
        try {
            Locale loc = localeFor(lang);
            if (loc != null) {
                try { tts.setLanguage(loc); } catch (Exception ignore) {}
            }
            tts.setSpeechRate((float) Math.max(0.3, Math.min(2.0, rate)));
            tts.setPitch(1.0f);
            String uttId = "cw_" + System.currentTimeMillis();
            Bundle params = new Bundle();
            params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, uttId);
            int r = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, uttId);
            if (r == TextToSpeech.ERROR) {
                call.reject("tts-speak-error");
                return;
            }
            JSObject ret = new JSObject();
            ret.put("available", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("tts-exception");
        }
    }

    private void failAll(String reason) {
        if (tts != null) {
            try { tts.shutdown(); } catch (Exception ignore) {}
        }
        tts = null;
        initialized = false;
        LinkedList<PluginCall> q = new LinkedList<>(pending);
        pending.clear();
        for (PluginCall c : q) {
            JSObject data = new JSObject();
            data.put("available", false);
            data.put("error", reason);
            c.reject("tts-unavailable", reason, data);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) {
            try { tts.shutdown(); } catch (Exception ignore) {}
            tts = null;
        }
        super.handleOnDestroy();
    }
}

package com.androidgyny.wayfinder;

import java.util.HashMap;
import java.util.Map;

/** Per-device analog navigation, independent of Android event delivery. */
final class StickNavigation {
    private final Map<Integer, Boolean> blocked = new HashMap<>();
    private final Map<Integer, Boolean> active = new HashMap<>();
    void suppress(int device) { blocked.put(device, true); active.remove(device); }
    void observeNeutral(int device, float x, float y) {
        if (Math.max(Math.abs(x), Math.abs(y)) <= .35f) {
            blocked.remove(device); active.remove(device);
        }
    }
    void clear() { blocked.clear(); active.clear(); }
    String direction(int device, float x, float y) {
        float magnitude = Math.max(Math.abs(x), Math.abs(y));
        if (!Float.isFinite(magnitude)) { suppress(device); return null; }
        if (magnitude <= .35f) { blocked.remove(device); active.remove(device); return null; }
        if (blocked.containsKey(device)) return null;
        if (magnitude <= (active.containsKey(device) ? .4f : .6f)) {
            active.remove(device); return null;
        }
        active.put(device, true);
        return Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : (y > 0 ? "down" : "up");
    }
}

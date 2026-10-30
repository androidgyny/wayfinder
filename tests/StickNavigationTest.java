package com.androidgyny.wayfinder;

public class StickNavigationTest {
    static void expect(String expected, String actual) {
        if (!java.util.Objects.equals(expected, actual)) throw new AssertionError(expected+" != "+actual);
    }
    public static void main(String[] args) {
        StickNavigation s = new StickNavigation();
        expect(null,s.direction(1,0,.59f));
        expect("down",s.direction(1,0,.8f));
        expect("down",s.direction(1,0,.55f));
        expect(null,s.direction(1,0,.39f));
        expect(null,s.direction(1,0,.55f));
        // Digital navigation wins, including after release while the stick is displaced.
        s.suppress(1);
        for(int i=0;i<20;i++) expect(null,s.direction(1,0,-1));
        expect("right",s.direction(2,1,0));
        expect(null,s.direction(1,0,-.4f));
        expect(null,s.direction(1,0,0));
        expect("up",s.direction(1,0,-.8f));
        // Focus-loss suppression and invalid readings cannot initiate a hold.
        s.suppress(1); expect(null,s.direction(1,1,0));
        expect(null,s.direction(1,Float.NaN,0));
        expect(null,s.direction(1,0,0));
        expect("left",s.direction(1,-1,0));
        // Returning the stick to center during a D-pad hold must also rearm it.
        s.suppress(1); s.observeNeutral(1,0,0);
        expect("down",s.direction(1,0,1));
        s.suppress(1); s.observeNeutral(1,0,-1);
        expect(null,s.direction(1,0,-1));
        System.out.println("PASS stick hysteresis, D-pad takeover, neutral rearm, independent devices and invalid input");
    }
}

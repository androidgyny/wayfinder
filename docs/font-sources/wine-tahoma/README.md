# Wine Tahoma source

Unmodified regular and bold FontForge sources and matching bundled TTFs come from Wine commit 7298a818b79446bae153b8d5aa27235ab3703bf9.

Upstream: https://github.com/wine-mirror/wine/tree/7298a818b79446bae153b8d5aa27235ab3703bf9/fonts

License and attribution: [font notices](../../../app/src/main/assets/www/fonts/wine-tahoma-NOTICE.txt), [LGPL 2.1](../../../app/src/main/assets/www/fonts/wine-tahoma-LGPL-2.1.txt), and [Bitstream Vera](../../../app/src/main/assets/www/fonts/wine-tahoma-Bitstream.txt).

To generate a replacement TTF, open either SFD in FontForge and choose File > Generate Fonts > TrueType. Wayfinder's custom font picker can load a modified TTF without rebuilding the app. To replace both bundled weights, put the generated files at app/src/main/assets/www/fonts/tahoma.ttf and tahomabd.ttf, then build the app following the root README. The shipped binaries are upstream's original files, not local conversions.

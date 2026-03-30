# Add project specific ProGuard rules here.

# Keep MainActivity and Capacitor classes
-keep class com.pcpeli.rrhh.MainActivity { *; }
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.BridgeActivity { *; }

# Keep WebView JS interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# 保留 JNI 桥（native 方法名不可混淆，否则 JNI 找不到）
-keep class com.rio.tvboxagg.NodeBridge { *; }
-keepclasseswithmembernames class * {
    native <methods>;
}

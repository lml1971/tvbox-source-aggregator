package com.rio.tvboxagg

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/** 开机自启：设备启动后自动拉起聚合服务（需用户在系统设置授予自启权限）。 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        val svc = Intent(context, NodeService::class.java).apply {
            action = NodeService.ACTION_START
        }
        // Android 12+ 限制从后台广播启动前台服务，部分版本/厂商会抛
        // ForegroundServiceStartNotAllowedException。兜底捕获：自启失败也不崩溃，
        // 退化为用户手动打开 APP 启动。
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(svc)
            } else {
                context.startService(svc)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

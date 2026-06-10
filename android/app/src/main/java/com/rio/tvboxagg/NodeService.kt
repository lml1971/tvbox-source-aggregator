package com.rio.tvboxagg

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.AssetManager
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream

/**
 * 前台 Service：在独立线程内运行嵌入式 node（聚合器），并通过 WakeLock + WifiLock 保活，
 * 让废旧手机息屏后仍能持续对外提供局域网源服务。
 *
 * node 引擎单进程只能启动一次（nodejs-mobile 限制）。"停止" = 结束进程，下次启动重新拉起。
 */
class NodeService : Service() {

    companion object {
        const val ACTION_START = "com.rio.tvboxagg.START"
        const val ACTION_STOP = "com.rio.tvboxagg.STOP"
        const val PORT = 5678
        private const val CHANNEL_ID = "tvboxagg_service"
        private const val NOTIF_ID = 1

        @Volatile var isRunning = false
        @Volatile var currentIp: String? = null

        fun addressText(): String = "http://${currentIp ?: "127.0.0.1"}:$PORT/"
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopEverything()
            return START_NOT_STICKY
        }

        currentIp = NetUtil.getLanIp()
        // Android 14（API 34）起，startForeground 必须显式传入与 Manifest 一致的服务类型，
        // 否则抛 MissingForegroundServiceTypeException。这条路径（手动启动）也会走到，故必须带类型。
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(
                NOTIF_ID,
                buildNotification(),
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIF_ID, buildNotification())
        }
        acquireLocks()
        isRunning = true

        if (!NodeBridge.started) {
            NodeBridge.started = true
            Thread {
                installAssets()
                startNode()
            }.start()
        }
        return START_STICKY
    }

    override fun onDestroy() {
        releaseLocks()
        isRunning = false
        super.onDestroy()
    }

    // ─── node 启动 ───────────────────────────────────────────

    private fun startNode() {
        val nodeDir = "${filesDir.absolutePath}/nodejs-project"
        val dataDir = "${filesDir.absolutePath}/tvbox-data"
        File(dataDir).mkdirs()
        val token = TokenStore.getOrCreate(this)
        val baseUrl = "http://${currentIp ?: "127.0.0.1"}:$PORT"

        val args = mutableListOf(
            "node",
            "$nodeDir/main.js",
            "--port=$PORT",
            "--data-dir=$dataDir",
            "--base-url=$baseUrl",
            "--admin-token=$token"
        )
        // 自动抓取（默认开启，有内置地址）
        val scrapeUrl = TokenStore.getScrapeUrl(this)
        if (scrapeUrl.isNotBlank()) {
            args.add("--scrape-url=$scrapeUrl")
            args.add("--scrape-referer=${TokenStore.getScrapeReferer(this)}")
        }

        NodeBridge.startNodeWithArguments(args.toTypedArray())
    }

    private fun stopEverything() {
        releaseLocks()
        isRunning = false
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        // node 引擎无法优雅停止：结束进程，状态归零，下次启动重新拉起
        android.os.Process.killProcess(android.os.Process.myPid())
    }

    // ─── 保活 ────────────────────────────────────────────────

    private fun acquireLocks() {
        if (wakeLock == null) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "tvboxagg:node")
                .also { it.setReferenceCounted(false) }
        }
        if (wakeLock?.isHeld == false) wakeLock?.acquire()

        if (wifiLock == null) {
            val wm = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                WifiManager.WIFI_MODE_FULL_HIGH_PERF else WifiManager.WIFI_MODE_FULL_HIGH_PERF
            wifiLock = wm.createWifiLock(mode, "tvboxagg:wifi")
                .also { it.setReferenceCounted(false) }
        }
        if (wifiLock?.isHeld == false) wifiLock?.acquire()
    }

    private fun releaseLocks() {
        if (wakeLock?.isHeld == true) wakeLock?.release()
        if (wifiLock?.isHeld == true) wifiLock?.release()
    }

    // ─── 通知 ────────────────────────────────────────────────

    private fun buildNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val mgr = getSystemService(NotificationManager::class.java)
            if (mgr.getNotificationChannel(CHANNEL_ID) == null) {
                mgr.createNotificationChannel(
                    NotificationChannel(CHANNEL_ID, "聚合服务", NotificationManager.IMPORTANCE_LOW)
                )
            }
        }
        val tapIntent = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            Notification.Builder(this, CHANNEL_ID) else
            @Suppress("DEPRECATION") Notification.Builder(this)
        return builder
            .setContentTitle("TVBox 聚合服务运行中")
            .setContentText("源地址 ${addressText()}")
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setOngoing(true)
            .setContentIntent(tapIntent)
            .build()
    }

    // ─── assets → filesDir 拷贝（仅 APK 更新时重拷）──────────────

    private fun installAssets() {
        val nodeDir = "${filesDir.absolutePath}/nodejs-project"
        if (!wasApkUpdated()) return
        File(nodeDir).let { if (it.exists()) it.deleteRecursively() }
        copyAssetFolder(assets, "nodejs-project", nodeDir)
        saveUpdateTime()
    }

    private fun wasApkUpdated(): Boolean {
        val prefs = getSharedPreferences("tvboxagg_prefs", Context.MODE_PRIVATE)
        val prev = prefs.getLong("apk_update_time", 0)
        val now = lastUpdateTime()
        return now != prev
    }

    private fun saveUpdateTime() {
        getSharedPreferences("tvboxagg_prefs", Context.MODE_PRIVATE)
            .edit().putLong("apk_update_time", lastUpdateTime()).apply()
    }

    private fun lastUpdateTime(): Long = try {
        packageManager.getPackageInfo(packageName, 0).lastUpdateTime
    } catch (e: PackageManager.NameNotFoundException) {
        1L
    }

    private fun copyAssetFolder(am: AssetManager, from: String, to: String): Boolean {
        return try {
            val files = am.list(from) ?: return false
            if (files.isEmpty()) {
                copyAssetFile(am, from, to)
            } else {
                File(to).mkdirs()
                var ok = true
                for (f in files) ok = copyAssetFolder(am, "$from/$f", "$to/$f") && ok
                ok
            }
        } catch (e: Exception) {
            false
        }
    }

    private fun copyAssetFile(am: AssetManager, from: String, to: String): Boolean {
        return try {
            val input: InputStream = am.open(from)
            File(to).parentFile?.mkdirs()
            val output: OutputStream = FileOutputStream(to)
            input.copyTo(output)
            input.close()
            output.flush()
            output.close()
            true
        } catch (e: Exception) {
            false
        }
    }
}

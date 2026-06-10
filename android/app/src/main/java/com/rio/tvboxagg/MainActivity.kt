package com.rio.tvboxagg

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter

class MainActivity : AppCompatActivity() {

    private lateinit var tvStatus: TextView
    private lateinit var tvAddress: TextView
    private lateinit var tvToken: TextView
    private lateinit var ivQr: ImageView
    private lateinit var btToggle: Button
    private lateinit var btEditToken: Button
    private lateinit var btAdmin: Button
    private lateinit var btBattery: Button

    private val handler = Handler(Looper.getMainLooper())
    private var lastQrText: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvStatus = findViewById(R.id.tvStatus)
        tvAddress = findViewById(R.id.tvAddress)
        tvToken = findViewById(R.id.tvToken)
        ivQr = findViewById(R.id.ivQr)
        btToggle = findViewById(R.id.btToggle)
        btAdmin = findViewById(R.id.btAdmin)
        btBattery = findViewById(R.id.btBattery)

        btEditToken = findViewById(R.id.btEditToken)
        tvToken.text = TokenStore.getOrCreate(this)

        requestNotificationPermissionIfNeeded()

        btToggle.setOnClickListener {
            if (NodeService.isRunning) stopService() else startService()
        }
        btEditToken.setOnClickListener { showEditTokenDialog() }
        btAdmin.setOnClickListener {
            startActivity(Intent(this, AdminActivity::class.java).apply {
                putExtra("token", TokenStore.getOrCreate(this@MainActivity))
                putExtra("port", NodeService.PORT)
            })
        }
        btBattery.setOnClickListener { requestIgnoreBatteryOptimizations() }

        // 隐藏功能：长按状态文字进入自动抓取源配置
        tvStatus.setOnLongClickListener { showScrapeDialog(); true }
    }

    override fun onResume() {
        super.onResume()
        handler.post(refreshTask)
    }

    override fun onPause() {
        super.onPause()
        handler.removeCallbacks(refreshTask)
    }

    private val refreshTask = object : Runnable {
        override fun run() {
            updateUi()
            handler.postDelayed(this, 1500)
        }
    }

    private fun updateUi() {
        val running = NodeService.isRunning
        tvStatus.text = if (running) "● 运行中" else "● 已停止"
        btToggle.text = if (running) "停止服务" else "启动服务"
        val addr = NodeService.addressText()
        tvAddress.text = if (running) addr else "—"
        if (running) {
            if (lastQrText != addr) {
                renderQr(addr)
                lastQrText = addr
            }
            ivQr.visibility = ImageView.VISIBLE
        } else {
            ivQr.visibility = ImageView.GONE
            lastQrText = null
        }
    }

    private fun startService() {
        val svc = Intent(this, NodeService::class.java).apply { action = NodeService.ACTION_START }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(svc)
        else startService(svc)
    }

    private fun stopService() {
        val svc = Intent(this, NodeService::class.java).apply { action = NodeService.ACTION_STOP }
        startService(svc)
    }

    private fun renderQr(text: String) {
        try {
            val size = 500
            val matrix = QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, size, size)
            val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
            for (x in 0 until size) {
                for (y in 0 until size) {
                    bmp.setPixel(x, y, if (matrix[x, y]) Color.BLACK else Color.WHITE)
                }
            }
            ivQr.setImageBitmap(bmp)
        } catch (e: Exception) {
            ivQr.visibility = ImageView.GONE
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1
                )
            }
        }
    }

    @SuppressLint("BatteryLife")
    private fun requestIgnoreBatteryOptimizations() {
        try {
            val pm = getSystemService(POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                startActivity(Intent(
                    Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:$packageName")
                ))
            }
        } catch (e: Exception) {
            startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        }
    }

    private fun showEditTokenDialog() {
        val input = EditText(this).apply {
            setText(TokenStore.getOrCreate(this@MainActivity))
            hint = "输入新密码（至少 4 位）"
            setPadding(48, 32, 48, 32)
        }
        AlertDialog.Builder(this)
            .setTitle("修改管理密码")
            .setMessage("修改后需重启服务生效")
            .setView(input)
            .setPositiveButton("保存") { _, _ ->
                val newToken = input.text.toString().trim()
                if (newToken.length >= 4) {
                    TokenStore.set(this, newToken)
                    tvToken.text = newToken
                    Toast.makeText(this, "已保存，重启服务后生效", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "密码至少 4 位", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun showScrapeDialog() {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 32, 48, 16)
        }
        val etUrl = EditText(this).apply {
            hint = "抓取源 URL（留空禁用）"
            setText(TokenStore.getScrapeUrl(this@MainActivity))
        }
        val etReferer = EditText(this).apply {
            hint = "Referer（可选）"
            setText(TokenStore.getScrapeReferer(this@MainActivity))
        }
        layout.addView(etUrl)
        layout.addView(etReferer)

        AlertDialog.Builder(this)
            .setTitle("自动抓取源（隐藏功能）")
            .setMessage("配置后重启服务生效。聚合器会定时从该地址抓取源列表。")
            .setView(layout)
            .setPositiveButton("保存") { _, _ ->
                TokenStore.setScrapeUrl(this, etUrl.text.toString().trim())
                TokenStore.setScrapeReferer(this, etReferer.text.toString().trim())
                Toast.makeText(this, "已保存，重启服务后生效", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("取消", null)
            .show()
    }
}

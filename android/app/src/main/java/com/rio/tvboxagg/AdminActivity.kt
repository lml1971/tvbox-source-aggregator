package com.rio.tvboxagg

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

/**
 * 内嵌 WebView 打开本机 /admin，并在页面加载前把 token 注入 sessionStorage，
 * 命中 admin 前端的自动登录逻辑（shared-ui.ts initAuth 读取 sessionStorage('admin_token')），
 * 小白无需手动输入密码即可进入后台。
 */
class AdminActivity : AppCompatActivity() {

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val token = intent.getStringExtra("token") ?: ""
        val port = intent.getIntExtra("port", NodeService.PORT)

        val web = WebView(this)
        setContentView(web)

        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true

        // 注入 token 到 sessionStorage + 手动触发验证（模拟 initAuth 的 saved-token 分支）
        // onPageFinished 时页面 JS 已跑完 initAuth 首次检查（此时 sessionStorage 为空所以没登上），
        // 我们写入 token 后手动 fetch verify → 成功则隐藏登录浮层。
        val safeToken = token.replace("\\", "\\\\").replace("'", "\\'")
        val autoLogin = """
            (function(){
                try {
                    var _tk = '$safeToken';
                    sessionStorage.setItem('admin_token', _tk);
                    fetch('/admin/sources', { headers: { 'Authorization': 'Bearer ' + _tk } })
                        .then(function(r) {
                            if (r.ok) {
                                var ov = document.getElementById('loginOverlay');
                                var ct = document.getElementById('mainContent');
                                if (ov) ov.style.display = 'none';
                                if (ct) ct.style.display = 'block';
                            }
                        });
                } catch(e) {}
            })();
        """.trimIndent()
        web.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                view?.evaluateJavascript(autoLogin, null)
                super.onPageFinished(view, url)
            }
        }

        web.loadUrl("http://127.0.0.1:$port/admin")
    }
}

package com.rio.tvboxagg

import android.content.Context
import java.security.SecureRandom

/**
 * 管理后台 ADMIN_TOKEN 的本地持久化。首次启动随机生成一次后固定。
 * 用普通 SharedPreferences：这是局域网本地服务的访问口令，非云端密钥，无需加密存储。
 */
object TokenStore {
    private const val PREFS = "tvboxagg_prefs"
    private const val KEY_TOKEN = "admin_token"
    // 去掉易混淆字符（0/O/1/l/I）
    private const val ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"

    fun getOrCreate(ctx: Context): String {
        val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        var token = prefs.getString(KEY_TOKEN, null)
        if (token.isNullOrEmpty()) {
            token = generate(20)
            prefs.edit().putString(KEY_TOKEN, token).apply()
        }
        return token
    }

    fun set(ctx: Context, newToken: String) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_TOKEN, newToken).apply()
    }

    // ─── 自动抓取源配置（隐藏功能）───────────────────────────────
    private const val KEY_SCRAPE_URL = "scrape_url"
    private const val KEY_SCRAPE_REFERER = "scrape_referer"

    private const val DEFAULT_SCRAPE_URL = "https://www.juwanhezi.com/jsonlist"
    private const val DEFAULT_SCRAPE_REFERER = "https://www.juwanhezi.com/"

    fun getScrapeUrl(ctx: Context): String =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_SCRAPE_URL, DEFAULT_SCRAPE_URL) ?: DEFAULT_SCRAPE_URL

    fun setScrapeUrl(ctx: Context, url: String) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_SCRAPE_URL, url).apply()
    }

    fun getScrapeReferer(ctx: Context): String =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_SCRAPE_REFERER, DEFAULT_SCRAPE_REFERER) ?: DEFAULT_SCRAPE_REFERER

    fun setScrapeReferer(ctx: Context, referer: String) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_SCRAPE_REFERER, referer).apply()
    }

    private fun generate(len: Int): String {
        val rnd = SecureRandom()
        val sb = StringBuilder(len)
        repeat(len) { sb.append(ALPHABET[rnd.nextInt(ALPHABET.length)]) }
        return sb.toString()
    }
}

package com.rio.tvboxagg

import java.net.Inet4Address
import java.net.NetworkInterface

object NetUtil {

    /** 探测本机局域网 IPv4：优先 wlan*，回退到私网段地址。失败返回 null。 */
    fun getLanIp(): String? {
        try {
            var fallback: String? = null
            val ifaces = NetworkInterface.getNetworkInterfaces() ?: return null
            for (iface in ifaces) {
                if (!iface.isUp || iface.isLoopback) continue
                for (addr in iface.inetAddresses) {
                    if (addr !is Inet4Address || addr.isLoopbackAddress) continue
                    val ip = addr.hostAddress ?: continue
                    if (iface.name.startsWith("wlan")) return ip // WiFi 优先
                    if (isPrivate(ip) && fallback == null) fallback = ip
                }
            }
            return fallback
        } catch (e: Exception) {
            return null
        }
    }

    private fun isPrivate(ip: String): Boolean {
        if (ip.startsWith("192.168.") || ip.startsWith("10.")) return true
        // 172.16.0.0 – 172.31.255.255
        val parts = ip.split(".")
        if (parts.size == 4 && parts[0] == "172") {
            val second = parts[1].toIntOrNull() ?: return false
            return second in 16..31
        }
        return false
    }
}

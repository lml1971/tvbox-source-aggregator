package com.rio.tvboxagg

/**
 * nodejs-mobile JNI 桥。
 *
 * 限制：node::Start 在单个进程生命周期内只能调用一次（nodejs-mobile 库约束），
 * 且调用会阻塞当前线程直到 node 退出。因此必须在独立线程调用，
 * "停止"通过结束进程实现（见 NodeService）。
 */
object NodeBridge {

    @Volatile
    var started = false

    init {
        System.loadLibrary("native-lib")
        System.loadLibrary("node")
    }

    /** 阻塞调用：启动 node 并运行其 event loop。arguments = ["node", "<main.js>", "--key=value", ...] */
    external fun startNodeWithArguments(arguments: Array<String>): Int
}

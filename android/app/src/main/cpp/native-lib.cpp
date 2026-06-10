#include <jni.h>
#include <string>
#include <cstdlib>
#include <cstring>
#include "node.h"
#include <pthread.h>
#include <unistd.h>
#include <android/log.h>

// 将 stdout / stderr 重定向到 logcat（NODEJS-MOBILE 标签）
int pipe_stdout[2];
int pipe_stderr[2];
pthread_t thread_stdout;
pthread_t thread_stderr;
const char *ADBTAG = "NODEJS-MOBILE";

void *thread_stderr_func(void *) {
    ssize_t redirect_size;
    char buf[2048];
    while ((redirect_size = read(pipe_stderr[0], buf, sizeof buf - 1)) > 0) {
        if (buf[redirect_size - 1] == '\n') --redirect_size;
        buf[redirect_size] = 0;
        __android_log_write(ANDROID_LOG_ERROR, ADBTAG, buf);
    }
    return 0;
}

void *thread_stdout_func(void *) {
    ssize_t redirect_size;
    char buf[2048];
    while ((redirect_size = read(pipe_stdout[0], buf, sizeof buf - 1)) > 0) {
        if (buf[redirect_size - 1] == '\n') --redirect_size;
        buf[redirect_size] = 0;
        __android_log_write(ANDROID_LOG_INFO, ADBTAG, buf);
    }
    return 0;
}

int start_redirecting_stdout_stderr() {
    setvbuf(stdout, 0, _IONBF, 0);
    pipe(pipe_stdout);
    dup2(pipe_stdout[1], STDOUT_FILENO);

    setvbuf(stderr, 0, _IONBF, 0);
    pipe(pipe_stderr);
    dup2(pipe_stderr[1], STDERR_FILENO);

    if (pthread_create(&thread_stdout, 0, thread_stdout_func, 0) == -1) return -1;
    pthread_detach(thread_stdout);

    if (pthread_create(&thread_stderr, 0, thread_stderr_func, 0) == -1) return -1;
    pthread_detach(thread_stderr);

    return 0;
}

// JNI 绑定到 com.rio.tvboxagg.NodeBridge.startNodeWithArguments
// libUV 要求 argv 在连续内存中
extern "C" jint JNICALL
Java_com_rio_tvboxagg_NodeBridge_startNodeWithArguments(
        JNIEnv *env,
        jobject /* this */,
        jobjectArray arguments) {

    jsize argument_count = env->GetArrayLength(arguments);

    // 第一遍：计算所有参数所需的连续内存大小（每次取完即释放局部引用）
    int c_arguments_size = 0;
    for (int i = 0; i < argument_count; i++) {
        jstring el = (jstring) env->GetObjectArrayElement(arguments, i);
        const char *s = env->GetStringUTFChars(el, 0);
        c_arguments_size += strlen(s) + 1; // 含 '\0'
        env->ReleaseStringUTFChars(el, s);
        env->DeleteLocalRef(el);
    }

    char *args_buffer = (char *) calloc(c_arguments_size, sizeof(char));
    char *argv[argument_count];
    char *current_args_position = args_buffer;

    // 第二遍：拷贝到连续内存（libUV 要求 argv 连续），同样配对释放引用
    for (int i = 0; i < argument_count; i++) {
        jstring el = (jstring) env->GetObjectArrayElement(arguments, i);
        const char *s = env->GetStringUTFChars(el, 0);
        strcpy(current_args_position, s);
        argv[i] = current_args_position;
        current_args_position += strlen(current_args_position) + 1;
        env->ReleaseStringUTFChars(el, s);
        env->DeleteLocalRef(el);
    }

    if (start_redirecting_stdout_stderr() == -1) {
        __android_log_write(ANDROID_LOG_ERROR, ADBTAG, "Couldn't redirect stdout/stderr to logcat.");
    }

    return jint(node::Start(argument_count, argv));
}

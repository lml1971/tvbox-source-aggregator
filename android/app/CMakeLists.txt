cmake_minimum_required(VERSION 3.4.1)

# JNI 桥（调用 libnode 的 node::Start）
add_library(native-lib
            SHARED
            src/main/cpp/native-lib.cpp)

# node 头文件
include_directories(libnode/include/node/)

# 导入预编译的 libnode.so（按 ABI 选择）
add_library(libnode
            SHARED
            IMPORTED)
set_target_properties(libnode
                      PROPERTIES IMPORTED_LOCATION
                      ${CMAKE_SOURCE_DIR}/libnode/bin/${ANDROID_ABI}/libnode.so)

find_library(log-lib log)

target_link_libraries(native-lib
                      libnode
                      ${log-lib})

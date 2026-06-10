#!/usr/bin/env bash
# 下载 nodejs-mobile 预编译库到 android/app/libnode/（arm64-v8a + armeabi-v7a）。
# libnode.so 体积大（约 116MB），不入 git；clone 后运行本脚本即可补齐。
set -euo pipefail

VERSION="v18.20.4"
ZIP="nodejs-mobile-${VERSION}-android.zip"
URL="https://github.com/nodejs-mobile/nodejs-mobile/releases/download/${VERSION}/${ZIP}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIBNODE="${ROOT}/android/app/libnode"
TMP="$(mktemp -d)"

echo "[fetch-libnode] 下载 ${URL}"
if command -v gh >/dev/null 2>&1; then
  gh release download "${VERSION}" --repo nodejs-mobile/nodejs-mobile --pattern "${ZIP}" --dir "${TMP}" --clobber
else
  curl -L -o "${TMP}/${ZIP}" "${URL}"
fi

mkdir -p "${LIBNODE}/bin/arm64-v8a" "${LIBNODE}/bin/armeabi-v7a"
echo "[fetch-libnode] 解压 arm64-v8a / armeabi-v7a 的 libnode.so + headers"
unzip -o -j "${TMP}/${ZIP}" "bin/arm64-v8a/libnode.so"   -d "${LIBNODE}/bin/arm64-v8a"   >/dev/null
unzip -o -j "${TMP}/${ZIP}" "bin/armeabi-v7a/libnode.so" -d "${LIBNODE}/bin/armeabi-v7a" >/dev/null
unzip -o    "${TMP}/${ZIP}" "include/node/*"             -d "${LIBNODE}"                  >/dev/null

rm -rf "${TMP}"
echo "[fetch-libnode] 完成："
ls -lh "${LIBNODE}/bin/arm64-v8a/libnode.so" "${LIBNODE}/bin/armeabi-v7a/libnode.so"

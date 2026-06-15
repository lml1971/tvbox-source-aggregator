# Changelog

## v2.1.1 (2026-06-10)

### Fixes

- Builder 白屏 + Admin 导航入口 + MacCMS 占位符未替换



## v2.1.0 (2026-06-10)

### Features

- 配置构建器（Builder）+ 版本号管理机制
- live merge mode switch — separated (per-source) vs merged (dedup)
- 新增 Android APK 形态——废旧手机当聚合服务器
- 黑名单变更实时生效（patchMergedConfig）
- 结构化日志 + 正则黑名单 + 智能Base URL + 站点验活 + 本地字体
- 聚合日志 + 分组排序 + 相似去重 + 6主题 + 背景自定义 + JSON 下载端点
- MacCMS 本地模式边缘函数代理回退（/api/:key）
- MacCMS 本地模式 API 代理（/api/:key 路由扩展）
- 直播源频道级合并（方案 D+）+ Native 格式 type 泄漏/CF 子请求修复
- 配置编辑器屏蔽优化（局部更新+批量操作）+ Docker IP 检测
- 网盘扫码登录与 Cookie 统一管理
- MacCMS 萌芽采集自动抓取 + 记忆规则配置 + 聚合超时调整
- 边缘函数代理——本地 Docker 支持 CF/Vercel 代理回退 + 图片 CDN
- 自动抓取 juwanhezi.com 源列表（私有功能）
- JAR 仓库管理体系——DEX 解析 + 精确类匹配 + 图片伪装解码
- TVBox 配置新增 pic 字段支持图片代理前缀
- UA 升级为 TVBox 标准浏览器 UA + 站点测速开关
- 源接口健康监控——累积追踪失败状态，Dashboard/Admin 分级展示
- 全局主题切换（暗色/亮色），三页面统一支持
- 定时任务可配置间隔 + 站点测速增强
- 配置解码器支持图片伪装和加密格式
- JSON 直接导入 + 源名称定制
- 多仓递归展开 + 黑名单修复 + i18n + 多项优化
- 直播源聚合 + JAR代理 + 去重优化 + 可视化配置编辑器
- 补充 CF 边缘代理支持
- MacCMS 源集成 — 验证过滤 + Admin 管理界面

### Fixes

- expose regexBlocked status in /admin/config-data for frontend display
- reapply JAR proxy in patchMergedConfig + live-config realtime parsing
- 配置编辑器 tab 页签多语言支持
- Admin UI 中文化 + 正则黑名单迁移到配置编辑器 + 语法错误修复
- /live-config 端点改为返回 txt 格式（TVBox 直播配置地址兼容）
- MacCMS 聚合验证跳过（有 edge proxy 时信任运行时兜底）
- dashboard 移除刷新按钮 + 复制 clipboard fallback + Node.js 本地 JAR 代理
- 双 UA 回退——okhttp 优先，解析失败自动换浏览器 UA 重试
- DEX 解析器改用 Central Directory 定位——修复 Data Descriptor 模式的 ZIP
- 启用 CF 边缘代理——填入 WORKER_BASE_URL + 清理过时 env 配置
- 亮色主题对比度修复——补全遗漏 #fff 替换 + 加深强调色
- 站点去重统一用 key+api，消除 JAR 差异导致的冗余条目
- correct Docker Hub image name to rio22/tvbox-aggregator
- use --ignore-scripts in Dockerfile for multi-arch ARM compatibility
- 修复聚合后相对路径补全遗漏



## v2.0.0 (2026-04-20)

- Initial release: TVBox 聚合器完整功能
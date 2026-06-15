// 配置常量

// 默认阈值
export const DEFAULT_SPEED_TIMEOUT_MS = 5000; // 配置 URL 超时（fetch 耗时筛选）
export const DEFAULT_SITE_TIMEOUT_MS = 3000;  // 站点 API 超时
export const DEFAULT_FETCH_TIMEOUT_MS = 5000; // fetch 配置 JSON 超时

// KV keys
export const KV_MERGED_CONFIG = 'merged_config';
export const KV_MERGED_CONFIG_FULL = 'merged_config_full'; // 黑名单过滤前的完整配置（供配置编辑器使用）
export const KV_SOURCE_URLS = 'source_urls';
export const KV_LAST_UPDATE = 'last_update';
export const KV_MANUAL_SOURCES = 'manual_sources';
export const KV_MACCMS_SOURCES = 'maccms_sources';
export const KV_LIVE_SOURCES = 'live_sources';
export const KV_LIVE_SCRAPED = 'live_scraped';

// 直播源代理缓存 TTL（秒）
export const LIVE_PROXY_TTL = 7200; // 2 小时

// 图片代理缓存 TTL（秒）
export const IMG_PROXY_TTL = 604800; // 7 天

// 黑名单
export const KV_BLACKLIST = 'blacklist';

// JSON 导入：内联配置前缀
export const KV_INLINE_PREFIX = 'inline_config_';

// 名称定制配置
export const KV_NAME_TRANSFORM = 'name_transform';

// 源健康状态
export const KV_SOURCE_HEALTH = 'source_health';

// 站点测速开关（默认启用）
export const KV_SPEED_TEST_ENABLED = 'speed_test_enabled';

// TVBox 客户端 UA（源服务器按此 UA 返回 JSON 而非 HTML）
export const TVBOX_UA = 'okhttp/3.12.0';
// 浏览器 UA 回退（部分源只接受浏览器 UA）
export const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.54 Safari/537.36';

// 定时任务间隔（分钟）
export const KV_CRON_INTERVAL = 'cron_interval';
export const DEFAULT_CRON_INTERVAL = 1440; // 默认每天一次

// 边缘函数代理
export const KV_EDGE_PROXIES = 'edge_proxies';

// 网盘凭证
export const KV_CLOUD_CREDENTIALS = 'cloud_credentials';
export const KV_CREDENTIAL_POLICY = 'credential_policy';
export const KV_CREDENTIAL_ENCRYPTION_KEY = 'credential_encryption_key';

// 搜索配额
export const KV_SEARCH_QUOTA = 'search_quota';
export const KV_SEARCH_QUOTA_REPORT = 'search_quota_report';

// ═══ 直播频道级测速（方案 D+）══════════════════════════
export const KV_CHANNEL_SPEED_MAP = 'channel_speed_map';
export const KV_CHANNEL_PROBE_ENABLED = 'channel_probe_enabled';
export const KV_CHANNEL_PROBE_STATUS = 'channel_probe_status';
export const KV_CHANNEL_MERGED_TREE = 'channel_merged_tree'; // 最近一次合并的频道树（供 probe 使用）

// 聚合日志
export const KV_AGG_LOGS = 'agg_logs';
export const AGG_LOGS_MAX = 50;
export const KV_SITE_SNAPSHOT = 'site_snapshot';

// 背景设置
export const KV_BG_SETTINGS = 'bg_settings';

// 分组排序
export const KV_GROUP_ORDER = 'group_order';

// 高级去重配置
export const KV_DEDUP_CONFIG = 'dedup_config';

// 直播禁用开关
export const KV_LIVE_DISABLED = 'live_disabled';
// 直播合并模式：'separated'（按源分类）| 'merged'（全部合并）
export const KV_LIVE_MERGE_MODE = 'live_merge_mode';

// 智能 Base URL
export const BASE_URL_PLACEHOLDER = '{{BASE_URL}}';
export const KV_SMART_BASE_URL_ENABLED = 'smart_base_url_enabled';

// 站点验活
export const KV_SITE_HEALTH_MAP = 'site_health_map';
export const KV_SITE_PROBE_DEPTH = 'site_probe_depth'; // 'shallow' | 'deep'
export const KV_SITE_AUTO_CLEAN = 'site_auto_clean';   // 'true' | 'false'

// Builder 源追踪
export const KV_SOURCE_MAP = 'builder_source_map'; // { sites: Record, parses: Record, lives: Record }

// 频道测速 cron：每 12 小时
export const CHANNEL_PROBE_CRON = '0 */12 * * *';
// 并发与超时
export const CHANNEL_PROBE_CONCURRENCY = 50;
export const CHANNEL_PROBE_TIMEOUT_MS = 5000;
// 缓存过期（7 天）
export const CHANNEL_SPEED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

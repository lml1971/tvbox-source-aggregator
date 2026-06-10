---
title: 从 tvbox-auxiliary 移植优秀功能（7 项）
status: implemented
date: 2026-06-07
---

## 问题

tvbox-auxiliary fork 实现了若干实用功能（正则黑名单、结构化日志、智能 Base URL 等），本轮从中提取 7 项移植到主项目，提升运维效率和稳定性。

## 功能清单

| # | 功能 | Phase | 风险 |
|---|------|-------|------|
| 1 | Docker 时区 | 1 | 极低 |
| 2 | 结构化日志（logger.ts） | 1 | 低 |
| 3 | 直播禁用开关 | 2 | 低 |
| 4 | 并发写入保护（isSyncing） | 2 | 低 |
| 5 | 正则黑名单 | 3 | 中 |
| 6 | 智能 Base URL + 占位符改造 | 4 | 中高 |
| 7 | 本地字体内嵌 | 5 | 极低 |

## Phase 1: 基础设施

### 1.1 Docker 时区

**改动文件**：`Dockerfile`

```dockerfile
# 在 runtime stage 加：
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai
```

### 1.2 结构化日志

**新建文件**：`src/core/logger.ts`

```typescript
export type LogFields = Record<string, unknown>;

export const logger = {
  info(scope: string, message: string): void { console.log(`[${scope}] ${message}`); },
  infoFields(scope: string, event: string, fields: LogFields): void { ... },
  debug(scope: string, message: string): void { if (isVerbose()) console.log(...); },
  debugFields(scope: string, event: string, fields: LogFields): void { ... },
  warn(scope: string, message: string): void { console.warn(`[${scope}] ${message}`); },
  error(scope: string, message: string): void { console.error(`[${scope}] ${message}`); },
  security(event: string, fields: LogFields): void { ... },
}

function isVerbose(): boolean {
  return ['1','true','yes','on'].includes((process.env.VERBOSE || '').toLowerCase());
}

function formatFields(fields: LogFields): string {
  // key=value 格式，字符串含空格时 JSON 转义
}
```

**迁移**：本阶段仅改 `aggregator.ts`（~50 处 console.log → logger 调用），后续分批扩展其他模块。

## Phase 2: 快活儿

### 2.1 直播禁用开关

**改动文件**：
- `src/core/config.ts` — 新增 `KV_LIVE_DISABLED = 'live_disabled'`
- `src/aggregator.ts` — Step 6.5 开头加开关检查：

```typescript
const liveDisabledRaw = await storage.get(KV_LIVE_DISABLED);
const liveDisabled = liveDisabledRaw === 'true';
if (liveDisabled) {
  logger.info('aggregation', 'Step 6.5: live disabled, skipping');
  merged.lives = [];
} else {
  // 现有直播合并逻辑
}
```

- `src/routes.ts` — 新增 admin API：
  - `GET /admin/live-disabled` → 返回当前状态
  - `PUT /admin/live-disabled` → `{ enabled: boolean }`
- `src/core/admin.ts` — 设置区增加 toggle

**兼容**：CF Worker 侧同样生效（跳过 lives 合并本身就很轻量）。默认 `false`，不改变现有行为。

### 2.2 并发写入保护

**改动文件**：
- `src/routes.ts` — `AppDeps` 新增：

```typescript
export interface AppDeps {
  // ...existing
  isSyncing?: () => boolean;
}
```

在写 `KV_MERGED_CONFIG` 的管理接口加检查：

```typescript
if (deps.isSyncing?.()) {
  return c.json({ error: 'Aggregation in progress, try later' }, 409);
}
```

- `src/node-entry.ts` — 传入 `isSyncing: () => refreshRunning`
- `src/cf-entry.ts` — 不传（CF Worker 无并发写问题，单次执行）

## Phase 3: 正则黑名单

### 数据结构

**改动文件**：`src/core/types.ts`

```typescript
export interface RegexRule {
  id: string;               // 8 字符随机 hex
  pattern: string;          // 正则字符串
  field: 'name' | 'api' | 'key';
  enabled: boolean;
  createdAt: string;
}
```

**改动文件**：`src/core/blacklist.ts`

```typescript
export interface Blacklist {
  sites: string[];
  parses: string[];
  lives: string[];
  regexRules: RegexRule[];           // 新增
  regexBlockOverrides: string[];     // 新增：正则命中但手动恢复的站点名
}
```

### 安全防护

```typescript
const MAX_PATTERN_LENGTH = 200;
const NESTED_QUANTIFIER_RE = /\([^)]*[+*{][^)]*\)[+*{]/;

export function validateRegexRule(pattern: string): { ok: boolean; error?: string } {
  if (pattern.length > MAX_PATTERN_LENGTH) return { ok: false, error: 'Pattern too long' };
  if (NESTED_QUANTIFIER_RE.test(pattern)) return { ok: false, error: 'Nested quantifier (ReDoS risk)' };
  try { new RegExp(pattern); } catch (e) { return { ok: false, error: 'Invalid regex' }; }
  return { ok: true };
}
```

### 聚合流程

**改动文件**：`src/core/blacklist.ts` `applyBlacklist` 方法

在指纹匹配之后，增加 regex 匹配阶段：

```typescript
// 正则匹配
let removedByRegex = 0;
const overrideSet = new Set(blacklist.regexBlockOverrides);
for (const rule of blacklist.regexRules.filter(r => r.enabled)) {
  try {
    const re = new RegExp(rule.pattern, 'i');
    sites = sites.filter(site => {
      const value = site[rule.field] || '';
      if (re.test(value) && !overrideSet.has(site.name || '')) {
        removedByRegex++;
        return false;
      }
      return true;
    });
  } catch { /* skip broken rule */ }
}
```

### Admin API

**改动文件**：`src/routes.ts`

- `GET /admin/blacklist/regex` — 列出所有规则
- `POST /admin/blacklist/regex` — 新增规则 `{ pattern, field, enabled }`
- `PUT /admin/blacklist/regex/:id` — 更新（启用/禁用/修改 pattern）
- `DELETE /admin/blacklist/regex/:id` — 删除
- `POST /admin/blacklist/regex/test` — 测试：返回当前配置中会被命中的站点预览

### Admin UI

**改动文件**：`src/core/admin.ts`

黑名单区域新增"正则规则"面板：
- 输入框（pattern）+ 下拉（name/api/key）+ 添加按钮
- 规则列表：pattern | field | 启用 toggle | 删除按钮
- "测试"按钮：预览匹配结果

### 存储兼容

`loadBlacklist` 防御性处理：

```typescript
return {
  sites: parsed.sites,
  parses: parsed.parses,
  lives: parsed.lives,
  regexRules: Array.isArray(parsed.regexRules) ? parsed.regexRules : [],
  regexBlockOverrides: Array.isArray(parsed.regexBlockOverrides) ? parsed.regexBlockOverrides : [],
};
```

## Phase 4: 智能 Base URL + 占位符改造

### 4.1 占位符常量

**改动文件**：`src/core/config.ts`

```typescript
export const BASE_URL_PLACEHOLDER = '{{BASE_URL}}';
export const KV_SMART_BASE_URL_ENABLED = 'smart_base_url_enabled';
```

### 4.2 聚合时写占位符

**改动文件**：`src/aggregator.ts`

Step 7 JAR URL 改写：
```typescript
// 之前：merged = await rewriteJarUrls(merged, jarBaseUrl, storage);
// 改为：
merged = await rewriteJarUrls(merged, BASE_URL_PLACEHOLDER, storage);
```

Step 7.5 图片代理：
```typescript
// 统一用占位符
merged.pic = `${BASE_URL_PLACEHOLDER}/img/`;
```

MacCMS 代理 URL 同理：`macCMSToTVBoxSites` 的 baseUrl 参数改为 `BASE_URL_PLACEHOLDER`。

### 4.3 请求时替换

**新建文件**：`src/core/base-url.ts`

```typescript
import type { Context } from 'hono';
import { BASE_URL_PLACEHOLDER } from './config';

export function getRequestBaseUrl(c: Context, fallback: string, dmzEnabled: boolean): string {
  const host = c.req.header('Host');
  if (!host) return fallback;
  const proto = c.req.header('X-Forwarded-Proto')?.split(',')[0].trim() || 'http';
  return `${proto}://${host}`;
}

export function applyBaseUrlPlaceholder(json: string, baseUrl: string): string {
  return json.replaceAll(BASE_URL_PLACEHOLDER, baseUrl);
}

export function isLanHost(host: string): boolean {
  const lower = host.toLowerCase();
  if (lower === 'localhost') return true;
  // IPv4: 127/8, 10/8, 172.16/12, 192.168/16
  const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (a === 127 || a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  }
  // IPv6: ::1, fc00::/7, fe80::/10
  if (lower === '::1') return true;
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
  return false;
}

export function assertHostAllowed(actualBase: string, fallback: string, dmzEnabled: boolean): boolean {
  if (actualBase === fallback) return true;
  if (dmzEnabled) return true;
  try { return isLanHost(new URL(actualBase).hostname); }
  catch { return false; }
}
```

**改动文件**：`src/routes.ts` GET `/`

```typescript
app.get('/', async (c) => {
  let cached = await storage.get(KV_MERGED_CONFIG);
  if (!cached) return c.json({ error: '...' }, 503);

  // 占位符替换
  const smartEnabled = (await storage.get(KV_SMART_BASE_URL_ENABLED)) === 'true';
  const dmzEnabled = process.env.DMZ === '0';
  const fallback = (config.localBaseUrl || '').replace(/\/$/, '');

  let baseUrl: string;
  if (config.workerBaseUrl) {
    baseUrl = config.workerBaseUrl.replace(/\/$/, '');
  } else if (smartEnabled) {
    baseUrl = getRequestBaseUrl(c, fallback, dmzEnabled);
    if (!assertHostAllowed(baseUrl, fallback, dmzEnabled)) {
      logger.security('host-blocked', { host: baseUrl, fallback });
      return c.json({ error: 'Non-LAN access denied. Set DMZ=0 to allow.' }, 403);
    }
  } else {
    baseUrl = fallback;
  }

  cached = applyBaseUrlPlaceholder(cached, baseUrl);
  return c.body(cached, 200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=1800',
    'Access-Control-Allow-Origin': '*',
  });
});
```

同样逻辑需应用到：`/live-config`、`/jar/:key` 等含 URL 的端点。

### 4.4 Admin 开关

- `GET /admin/smart-base-url` — 读取状态
- `PUT /admin/smart-base-url` — `{ enabled: boolean }`
- Admin UI 设置区加 toggle + DMZ 说明文本

## Phase 5: 本地字体内嵌

### 字体文件

**新建目录**：`src/static/fonts/`

放入 4 个 woff2 文件：
- `jetbrains-mono-latin-ext.woff2`
- `jetbrains-mono-latin.woff2`
- `outfit-latin-ext.woff2`
- `outfit-latin.woff2`

### 路由

**改动文件**：`src/routes.ts`

```typescript
// 仅 Node 侧注册
if (!config.workerBaseUrl) {
  const FONTS: Record<string, { file: string; type: string }> = {
    'jetbrains-mono-latin-ext.woff2': { file: 'jetbrains-mono-latin-ext.woff2', type: 'font/woff2' },
    'jetbrains-mono-latin.woff2': { file: 'jetbrains-mono-latin.woff2', type: 'font/woff2' },
    'outfit-latin-ext.woff2': { file: 'outfit-latin-ext.woff2', type: 'font/woff2' },
    'outfit-latin.woff2': { file: 'outfit-latin.woff2', type: 'font/woff2' },
  };

  app.get('/fonts/:name', async (c) => {
    const entry = FONTS[c.req.param('name')];
    if (!entry) return c.text('Not Found', 404);
    const fs = await import('fs');
    const path = await import('path');
    const data = await fs.promises.readFile(path.join(__dirname, 'static/fonts', entry.file));
    return c.body(data, 200, {
      'Content-Type': entry.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  });
}
```

### 构建

**改动文件**：`scripts/build.js`

esbuild 后复制 `src/static/fonts/` → `dist/static/fonts/`。

### CSS 适配

**改动文件**：`src/core/shared-styles.ts`

`@font-face` 的 `src` URL 条件化：
- 接收 `isWorker` 参数
- Worker 模式 → Google Fonts CDN URL
- Node 模式 → `/fonts/xxx.woff2`

## 改动范围总览

| 文件 | Phase | 改动类型 |
|------|-------|---------|
| `Dockerfile` | 1 | 加 2 行 |
| `src/core/logger.ts` | 1 | 新建 |
| `src/aggregator.ts` | 1,2,3,4 | 日志替换 + 直播开关 + regex + 占位符 |
| `src/core/config.ts` | 2,4 | 新增 KV key |
| `src/core/types.ts` | 3 | 新增 RegexRule 类型 |
| `src/core/blacklist.ts` | 3 | 扩展 Blacklist 接口 + regex 逻辑 |
| `src/routes.ts` | 2,3,4,5 | isSyncing + regex API + 占位符替换 + 字体路由 |
| `src/core/base-url.ts` | 4 | 新建 |
| `src/core/admin.ts` | 2,3,4 | UI 新增 toggle + regex 面板 |
| `src/node-entry.ts` | 2 | 传入 isSyncing |
| `src/static/fonts/` | 5 | 新建（字体文件） |
| `src/core/shared-styles.ts` | 5 | font-face 条件化 |
| `scripts/build.js` | 5 | 复制字体到 dist |

## 验证方式

- Phase 1: `docker build` 成功 + 容器内 `date` 显示东八区 + 日志格式正确
- Phase 2: admin 开关切换后重新聚合，lives 为空 + 聚合中 POST 返回 409
- Phase 3: 添加正则规则后聚合，匹配的站点被过滤 + ReDoS pattern 被拒绝
- Phase 4: 不同 Host 访问返回对应 base URL + 非 LAN 被拦截 + JAR 代理正常工作
- Phase 5: Node 模式 admin 页字体从本地加载（DevTools Network 确认）

## 讨论记录

- 频道级测速、分组排序、同步超时——确认已有实现，跳过
- 智能 Base URL 方案 A（请求时全量替换 localBaseUrl）vs 方案 B（占位符）→ 选 B，参考项目已验证可行
- 字体选择：JetBrains Mono + Outfit，与参考项目一致
- 正则黑名单匹配字段：支持 name/api/key 三选一

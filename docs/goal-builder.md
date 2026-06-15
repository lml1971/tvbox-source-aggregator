# Goal: 实现 TVBox 配置构建器（Builder）

## 目标

在 TVBox 聚合器项目中新建 `/builder` 功能模块——一个管理员专用的配置构建器，允许从聚合原料池挑选/手动添加 TVBox 配置条目，深度编辑字段，保存多套方案，并导出完全离线的本地包（config.json + JAR 文件 zip）。

## 背景与约束

- 项目是 TypeScript + Hono 框架，双入口：CF Worker (`src/cf-entry.ts`) + Node.js (`src/node-entry.ts`)
- **Builder 是 Node.js only 功能**，CF Worker 不注册这些路由
- 现有 config-editor (`/config-editor`) 是黑名单管理器（减法模式），Builder 是独立新页面（加法模式），两者不合并
- 管理后台认证使用 Bearer token（现有 admin token 机制）
- 前端页面是内联 HTML（参考 `src/core/admin.ts`、`src/core/config-editor.ts` 的模式），不使用前端构建工具
- 共享样式 `src/core/shared-styles.ts` 和共享 UI `src/core/shared-ui.ts` 可复用
- JAR 代理已有缓存机制：Node.js 环境下 JAR 缓存在 `data/jars/{key}.jar`
- `src/core/jar-proxy.ts` 的 `urlToKey()` 函数可复用于 JAR 文件命名

## 架构决策（已确认，不可更改）

1. **方案存完整数据**——preset 里存条目的完整快照，不是对原料池的引用。原料池只是导入来源之一。
2. **允许手动添加条目**——用户可凭空新增站点/解析/直播，不依赖聚合池。
3. **多套方案并存**——用户可保存多个 preset（"精简版"/"全功能"/"纯电影"等）。
4. **导出路径可选**——默认 `/sdcard/TVBox/`，导出时用户可修改。
5. **源追踪**——聚合流程需为 parses/lives 追加源映射（sites 已有 `siteSourceMap`）。

## 实施阶段

### Phase 1: 后端基础设施

**1.1 源追踪增强**

文件：`src/core/merger.ts`
- 扩展 `MergeResult` 接口，新增 `parseSourceMap: Map<string, string>` 和 `liveSourceMap: Map<string, string>`
- 合并 parses 时记录 `parse.url → sourceName`
- 合并 lives 时记录 `(live.url || live.api) → sourceName`
- **不改变现有合并/去重逻辑**，只在旁边记录来源

文件：`src/aggregator.ts`
- 将 parseSourceMap 和 liveSourceMap 缓存（和 siteSourceMap 一起），供 builder 端点读取

**1.2 方案存储**

新建：`src/core/builder-store.ts`
- 存储路径：`data/presets/*.json`
- 接口：listPresets / getPreset / createPreset / updatePreset / deletePreset
- 数据结构：
  ```typescript
  interface BuilderPreset {
    id: string;                    // nanoid 或 uuid
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    sites: BuilderSite[];          // TVBoxSite + { _source?, _importedAt?, _manual? }
    parses: BuilderParse[];        // TVBoxParse + { _source?, _importedAt?, _manual? }
    lives: BuilderLive[];          // TVBoxLive + { _source?, _importedAt?, _manual? }
    exportSettings: {
      path: string;                // 默认 "/sdcard/TVBox/"
      spiderStrategy: 'global' | 'per-site';
    };
  }
  ```

**1.3 API 路由**

新建：`src/routes/builder.ts`（Hono 子路由，挂载到 `/builder`）

| 端点 | 方法 | 功能 |
|------|------|------|
| `/builder` | GET | 返回 Builder 页面 HTML |
| `/builder/pool` | GET | 返回原料池（含 source 分组信息） |
| `/builder/presets` | GET | 列出所有方案（摘要） |
| `/builder/presets` | POST | 创建方案 |
| `/builder/presets/:id` | GET | 获取单个方案完整数据 |
| `/builder/presets/:id` | PUT | 更新方案 |
| `/builder/presets/:id` | DELETE | 删除方案 |
| `/builder/presets/:id/export` | POST | 导出离线包（返回 zip） |

所有端点需 Bearer token 认证。

文件：`src/node-entry.ts`
- 仅在 Node.js 入口注册 builder 路由

**验证**：`curl -H "Authorization: Bearer TOKEN" http://localhost:5678/builder/pool` 返回按源分组的条目。

### Phase 2: 前端页面

新建：`src/core/builder-ui.ts`

**页面布局**：
```
┌─────────────────────────────────────────────┐
│ Header: TVBox Config Builder                │
│ [方案下拉选择] [新建] [导出zip] [导入JSON]   │
├─────────────┬───────────────────────────────┤
│  原料池      │  当前方案                      │
│  (左侧面板)  │  (右侧面板)                    │
│             │                               │
│ ▼ 源A       │  Sites (12)                   │
│   □ 站点1   │  ┌─────────────────────────┐  │
│   □ 站点2   │  │ 站点X [编辑] [删除]      │  │
│ ▼ 源B       │  │ 站点Y [编辑] [删除]      │  │
│   □ 站点3   │  └─────────────────────────┘  │
│             │                               │
│ [手动添加]   │  Parses (5)  Lives (3)       │
│             │  ...                          │
├─────────────┴───────────────────────────────┤
│ 编辑面板 (点击"编辑"展开)                      │
│ name: [____] api: [____] type: [v]          │
│ ext: [________________] jar: [____]         │
│ playerType: [v] searchable: [x]             │
│ [保存] [取消]                                │
└─────────────────────────────────────────────┘
```

**核心交互**：
- 左侧原料池：按源分组浏览，搜索过滤，checkbox 多选 → "添加到方案"按钮
- 右侧当前方案：tabs 切换 Sites/Parses/Lives，支持编辑/删除/拖拽排序
- 手动添加：表单填写新条目（sites 需 key/name/type/api，parses 需 name/url/type，lives 需 name/url/type）
- 编辑面板：点击条目展开，可修改任意字段，保存后写回 preset
- 方案管理：顶部下拉切换方案、新建方案、重命名
- 导出：弹窗让用户输入目标路径，确认后触发下载

**UI 风格**：复用 `shared-styles.ts` 的暗色主题、`shared-ui.ts` 的认证/主题/语言切换组件。

**验证**：浏览器访问 `/builder`，能浏览原料池、添加到方案、手动新增条目、编辑字段、保存方案。

### Phase 3: 导出引擎

新建：`src/core/builder-export.ts`

**导出流程**：
1. 接收 preset + exportPath 参数
2. 从 preset.sites 收集所有 JAR 依赖：
   - 遍历 type=3 站点的 jar 字段
   - 确定全局 spider（按 spiderStrategy：投票制选最多引用的 / 每站独立）
3. 去重 JAR URL 列表
4. 逐个获取 JAR 二进制：
   - 优先从 `data/jars/{key}.jar` 读取（复用 JAR 代理的缓存）
   - 缓存 miss 则 HTTP 下载，下载后也写入缓存
   - 下载失败的 JAR 记录到 warnings 列表
5. 生成 config.json：
   - 全局 spider → `file://{exportPath}jars/{key}.jar;md5;{hash}`
   - 各站点 jar → `file://{exportPath}jars/{key}.jar;md5;{hash}`
   - 其余字段保持用户编辑后的值
   - 清除 `_source`、`_importedAt`、`_manual` 等内部元数据字段
6. 流式打包 zip（使用 archiver 或类似库，避免全量加载到内存）：
   - `config.json` 放根目录
   - `jars/` 目录放所有 JAR 文件
7. 返回：zip stream + warnings 列表

**JAR 命名**：`{sha256_short_key}.jar`，复用 `jar-proxy.ts` 的 `urlToKey()` 函数。

**验证**：导出 zip，解压后结构为 `config.json + jars/*.jar`，config.json 中路径指向正确，可被 TVBox 加载。

## 技术细节

### TVBox 离线包加载机制

- TVBox 支持 `file:///sdcard/TVBox/config.json` 格式的本地配置
- Spider/JAR 支持绝对路径：`file:///sdcard/TVBox/jars/spider.jar`
- 每个站点可独立指定 `jar` 字段覆盖全局 `spider`
- `;md5;HASH` 后缀用于缓存校验，导出时保留

### 关键复用点

- `src/core/jar-proxy.ts` → `urlToKey()`、`parseSpiderString()`
- `src/core/shared-styles.ts` → 页面样式
- `src/core/shared-ui.ts` → 认证、主题切换、语言切换
- `data/jars/` → 已缓存的 JAR 文件
- `src/aggregator.ts` → 聚合缓存中的 config + sourceMap

### 不要做的事

- 不要修改 CF Worker 入口 (`src/cf-entry.ts`)
- 不要改动现有的聚合/去重/合并核心逻辑
- 不要改动现有的 config-editor 页面
- 不要改动 JAR 代理的透传逻辑
- 不要使用 Storage 抽象层（preset 直接用 JSON 文件）
- 不要引入前端构建工具（保持内联 HTML 模式）

## 风险注意

1. `src/core/merger.ts` 是高风险区——只追加 sourceMap 记录，不改现有合并逻辑
2. ZIP 打包要流式处理，JAR 总量可能 20-50MB
3. JAR 下载可能超时/失败，导出时需优雅降级（标记 warning，不阻断整个导出）
4. TVBox 不同分支对 `file://` 路径处理可能有差异，导出路径不要硬编码

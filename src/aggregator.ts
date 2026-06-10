// 聚合流程编排

import type { Storage } from './storage/interface';
import type { AppConfig, SourceEntry, SourcedConfig, MacCMSSourceEntry, SourceFetchResult, SourceHealthRecord, AggregationLog, AggLogFailedSource, AggLogSiteChange, TVBoxSite } from './core/types';
import { fetchConfigs } from './core/fetcher';
import { mergeConfigs, cleanLocalRefs, cleanEmptyEntries } from './core/merger';
import { batchSiteSpeedTest, appendSpeedToName, filterUnreachableSites, type SiteProbeResult } from './core/speedtest';
import { macCMSToTVBoxSites, processMacCMSForLocal } from './core/maccms';
import { rewriteJarUrls } from './core/jar-proxy';
import { mergeLivesToNative, separatedMergeLives, type LiveSourceInput } from './core/live-merger';
import { loadSpeedMap as loadChannelSpeedMap } from './core/channel-probe';
import { KV_MERGED_CONFIG, KV_MERGED_CONFIG_FULL, KV_SOURCE_URLS, KV_LAST_UPDATE, KV_MANUAL_SOURCES, KV_MACCMS_SOURCES, KV_LIVE_SOURCES, KV_BLACKLIST, KV_INLINE_PREFIX, KV_NAME_TRANSFORM, KV_SOURCE_HEALTH, KV_SPEED_TEST_ENABLED, KV_EDGE_PROXIES, KV_SEARCH_QUOTA_REPORT, KV_CHANNEL_MERGED_TREE, KV_AGG_LOGS, AGG_LOGS_MAX, KV_SITE_SNAPSHOT, KV_DEDUP_CONFIG, KV_LIVE_DISABLED, KV_LIVE_MERGE_MODE, BASE_URL_PLACEHOLDER, KV_SITE_HEALTH_MAP, KV_SITE_PROBE_DEPTH, KV_SITE_AUTO_CLEAN } from './core/config';
import { loadBlacklist, applyBlacklist, pruneBlacklist, saveBlacklist, siteFingerprint } from './core/blacklist';
import { transformSiteNames } from './core/cleaner';
import { parseConfigJson, type FetchProxyConfig } from './core/fetcher';
import { scrapeSourceList, scrapeMacCMSSources, type ScrapeSourceConfig, type ScrapeMacCMSConfig } from './core/source-scraper';
import { loadSearchQuota, applySearchQuota } from './core/search-quota';
import { loadCredentials } from './core/credential-store';
import { loadCredentialPolicy } from './core/credential-store';
import { injectCredentials } from './core/credential-injector';
import { loadGroupOrder, applyGroupOrder } from './core/group-order';
import { deduplicateSimilarNames } from './core/dedup';
import { logger } from './core/logger';
import type { NameTransformConfig, EdgeProxyConfig } from './core/types';

export async function runAggregation(storage: Storage, config: AppConfig): Promise<void> {
  const startTime = Date.now();
  logger.info('aggregation', 'Starting...');

  try {
    await _runAggregation(storage, config, startTime);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    logger.error('aggregation', `FATAL ERROR: ${msg}`);
    logger.error('aggregation', `Stack: ${stack}`);
    // 写入错误信息方便调试
    await storage.put(KV_LAST_UPDATE, `ERROR @ ${new Date().toISOString()}: ${msg}`);

    await appendAggLog(storage, {
      id: new Date(startTime).toISOString(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: msg,
      totalSources: 0,
      okSources: 0,
      failedSources: [],
      addedSites: [],
      removedSites: [],
      finalSiteCount: 0,
      finalParseCount: 0,
      finalLiveCount: 0,
      blacklistRemovedSites: 0,
      blacklistRemovedParses: 0,
      blacklistRemovedLives: 0,
    });
  }
}

async function _runAggregation(storage: Storage, config: AppConfig, startTime: number): Promise<void> {

  // ── 日志收集用局部变量 ──
  let logFetchResults: SourceFetchResult[] = [];
  let logBlacklistRemovedSites = 0;
  let logBlacklistRemovedParses = 0;
  let logBlacklistRemovedLives = 0;

  // 读取上次站点快照（用于计算 diff）
  const snapshotRaw = await storage.get(KV_SITE_SNAPSHOT);
  const prevSiteKeys: Set<string> = snapshotRaw ? new Set(JSON.parse(snapshotRaw)) : new Set();

  // Step 0: 自动抓取源（需配置 SCRAPE_SOURCE_URL 环境变量，referer 可选）
  if (config.scrapeSourceUrl) {
    logger.info('aggregation', 'Step 0: Auto-scraping sources...');
    try {
      const scrapeCfg: ScrapeSourceConfig = { url: config.scrapeSourceUrl, referer: config.scrapeSourceReferer || '' };
      const scraped = await scrapeSourceList(scrapeCfg);
      if (scraped.length > 0) {
        const existingRaw = await storage.get(KV_MANUAL_SOURCES);
        const existingSources: SourceEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
        const existingUrls = new Set(existingSources.map(s => s.url));

        let added = 0;
        for (const source of scraped) {
          if (!existingUrls.has(source.url)) {
            existingSources.push(source);
            existingUrls.add(source.url);
            added++;
          }
        }

        if (added > 0) {
          await storage.put(KV_MANUAL_SOURCES, JSON.stringify(existingSources));
          logger.infoFields('aggregation', 'auto-scrape-added', { added, total: existingSources.length });
        } else {
          logger.infoFields('aggregation', 'auto-scrape-none-new', { scraped: scraped.length });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('aggregation', `Auto-scrape failed (non-blocking): ${msg}`);
    }
  }

  // Step 0.5: MacCMS 资源站自动抓取（需配置 MACCMS_API_URL 环境变量）
  if (config.maccmsApiUrl && config.maccmsAesKey && config.maccmsAesIv) {
    logger.info('aggregation', 'Step 0.5: Auto-scraping MacCMS sources...');
    try {
      const maccmsCfg: ScrapeMacCMSConfig = { apiUrl: config.maccmsApiUrl, aesKey: config.maccmsAesKey, aesIv: config.maccmsAesIv };
      const scraped = await scrapeMacCMSSources(maccmsCfg);
      if (scraped.length > 0) {
        await storage.put(KV_MACCMS_SOURCES, JSON.stringify(scraped));
        logger.infoFields('aggregation', 'maccms-auto-scraped', { count: scraped.length });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('aggregation', `MacCMS auto-scrape failed (non-blocking): ${msg}`);
    }
  }

  // Step 1: 读取手动配置的源（含自动抓取合并后的）
  logger.info('aggregation', 'Step 1: Loading sources...');
  const raw = await storage.get(KV_MANUAL_SOURCES);
  const sources: SourceEntry[] = raw ? JSON.parse(raw) : [];

  // 检查是否有 MacCMS 源（即使没有 config 源也可以继续）
  const macCMSRaw = await storage.get(KV_MACCMS_SOURCES);
  const hasMacCMS = macCMSRaw ? JSON.parse(macCMSRaw).length > 0 : false;

  if (sources.length === 0 && !hasMacCMS) {
    logger.warn('aggregation', 'No sources configured, nothing to do');
    return;
  }

  logger.infoFields('aggregation', 'sources-loaded', { count: sources.length });
  await storage.put(KV_SOURCE_URLS, JSON.stringify(sources));

  // Step 1.5: 处理 MacCMS 源
  logger.info('aggregation', 'Step 1.5: Processing MacCMS sources...');
  const macCMSConfigs = await processMacCMSSources(storage, config);

  // Step 1.6: 直播源频道级合并移至 Step 6.5（方案 D+）

  // Step 1.8: 分离 inline:// 源，从 KV 直接加载
  const remoteSources = sources.filter(s => !s.url.startsWith('inline://'));
  const inlineSources = sources.filter(s => s.url.startsWith('inline://'));
  const inlineConfigs: SourcedConfig[] = [];

  for (const src of inlineSources) {
    const kvKey = src.url.replace('inline://', '');
    const raw = await storage.get(kvKey);
    if (raw) {
      const parsed = parseConfigJson(raw);
      if (parsed) {
        inlineConfigs.push({ sourceUrl: src.url, sourceName: src.name || 'Inline', config: parsed });
        logger.info('aggregation', `Loaded inline config: ${kvKey}`);
      } else {
        logger.warn('aggregation', `Failed to parse inline config: ${kvKey}`);
      }
    } else {
      logger.warn('aggregation', `Inline config not found in KV: ${kvKey}`);
    }
  }

  // Step 2: 批量 fetch 配置 JSON（本地模式可通过边缘代理回退）
  logger.info('aggregation', 'Step 2: Fetching configs...');
  let proxyConfig: FetchProxyConfig | undefined;
  if (!config.workerBaseUrl) {
    // 本地模式：读取边缘代理配置
    const edgeRaw = await storage.get(KV_EDGE_PROXIES);
    if (edgeRaw) {
      const edge: EdgeProxyConfig = JSON.parse(edgeRaw);
      const urls: string[] = [];
      if (edge.cf) urls.push(`${edge.cf}/fetch-proxy`);
      if (edge.vercel) urls.push(`${edge.vercel}/api/proxy`);
      if (urls.length > 0) {
        proxyConfig = { urls, token: config.adminToken };
        logger.info('aggregation', `Edge proxies configured: ${urls.join(', ')}`);
      }
    }
  }
  const { configs: sourcedConfigs, fetchResults } = await fetchConfigs(remoteSources, config.fetchTimeoutMs, proxyConfig);
  logFetchResults = fetchResults;

  // 更新源健康状态
  await updateSourceHealth(storage, fetchResults);

  if (sourcedConfigs.length === 0 && inlineConfigs.length === 0 && macCMSConfigs.length === 0) {
    logger.warn('aggregation', 'No valid configs fetched and no MacCMS/inline sources, keeping previous cache');
    return;
  }

  // Step 3: 用 fetch 耗时筛选配置源
  let filteredConfigs: SourcedConfig[] = sourcedConfigs;

  const configsWithSpeed = sourcedConfigs.filter((c) => c.speedMs != null);
  if (configsWithSpeed.length > 0) {
    logger.info('aggregation', 'Step 3: Filtering configs by fetch speed...');
    filteredConfigs = sourcedConfigs.filter((c) => {
      if (c.speedMs == null) return true; // 没有测速数据的保留
      if (c.speedMs <= config.speedTimeoutMs) return true;
      logger.infoFields('aggregation', 'speed-filter-removed', { url: c.sourceUrl, speedMs: c.speedMs, threshold: config.speedTimeoutMs });
      return false;
    });

    if (filteredConfigs.length === 0) {
      logger.warn('aggregation', 'All configs failed speed filter, using all fetched configs');
      filteredConfigs = sourcedConfigs;
    } else {
      logger.infoFields('aggregation', 'speed-filter-passed', { passed: filteredConfigs.length, total: sourcedConfigs.length });
    }
  } else {
    logger.info('aggregation', 'Step 3: No speed data available, skipping filter');
  }

  // Step 4: 合并（包含 MacCMS 源，投票制 spider 分配）
  logger.info('aggregation', 'Step 4: Merging configs...');
  const allConfigs = [...filteredConfigs, ...inlineConfigs, ...macCMSConfigs];
  const mergeResult = mergeConfigs(allConfigs);
  let merged = mergeResult.config;
  const siteSourceMap = mergeResult.siteSourceMap;

  // Step 4.5: 黑名单过滤
  logger.info('aggregation', 'Step 4.5: Applying blacklist...');
  const blacklist = await loadBlacklist(storage);
  const hasBlacklist = blacklist.sites.length > 0 || blacklist.parses.length > 0 || blacklist.lives.length > 0 || blacklist.regexRules.some(r => r.enabled);

  // 保存过滤前的完整配置（供配置编辑器显示已屏蔽项）
  await storage.put(KV_MERGED_CONFIG_FULL, JSON.stringify(merged));

  if (hasBlacklist) {
    // 自动清理黑名单中已不存在的条目（必须在过滤前比对，否则被屏蔽的条目会被误判为"过时"而清掉）
    const pruned = await pruneBlacklist(blacklist, merged);
    if (JSON.stringify(pruned) !== JSON.stringify(blacklist)) {
      await saveBlacklist(storage, pruned);
    }

    const { config: filtered, removedSites, removedParses, removedLives, removedByRegex } = await applyBlacklist(merged, pruned);
    merged = filtered;
    logBlacklistRemovedSites = removedSites;
    logBlacklistRemovedParses = removedParses;
    logBlacklistRemovedLives = removedLives;
    logger.infoFields('aggregation', 'blacklist-removed', { sites: removedSites, parses: removedParses, lives: removedLives, regex: removedByRegex });
  } else {
    logger.info('aggregation', 'Step 4.5: No blacklist entries, skipping');
  }

  // Step 4.6: 清洗无效数据（空条目 + 本地引用）— 必须在搜索配额前，避免配额分给随后被清理的站点
  logger.info('aggregation', 'Step 4.6: Cleaning invalid entries...');
  merged = cleanEmptyEntries(merged);
  merged = cleanLocalRefs(merged);

  // Step 4.7: 搜索配额（JS 排除 + 置顶排序 + 可选截断）
  const quotaConfig = await loadSearchQuota(storage);
  if (merged.sites) {
    const { sites: quotaSites, quotaReport } = applySearchQuota(merged.sites, quotaConfig, siteSourceMap);
    merged.sites = quotaSites;
    logger.infoFields('aggregation', 'search-quota', {
      total: quotaReport.totalSites, jsExcluded: quotaReport.jsExcluded,
      pinned: quotaReport.pinnedCount, truncated: quotaReport.truncated, searchable: quotaReport.searchable,
    });
    await storage.put(KV_SEARCH_QUOTA_REPORT, JSON.stringify({
      updatedAt: new Date().toISOString(),
      ...quotaReport,
    }));
  }

  // Step 5.5: 名称定制（清洗推广文字 + 前缀后缀）
  const ntRaw = await storage.get(KV_NAME_TRANSFORM);
  const nameTransform: NameTransformConfig = ntRaw ? JSON.parse(ntRaw) : {};
  const hasTransform = nameTransform.prefix || nameTransform.suffix || nameTransform.promoReplacement || nameTransform.extraCleanPatterns?.length;
  if (hasTransform) {
    logger.info('aggregation', 'Step 5.5: Applying name transform...');
    merged = transformSiteNames(merged, nameTransform);
  } else {
    // 即使没有自定义配置，默认清洗推广文字也要执行
    logger.info('aggregation', 'Step 5.5: Cleaning promo text from site names...');
    merged = transformSiteNames(merged, {});
  }

  // Step 5.7: 网盘凭证注入
  const credentials = await loadCredentials(storage);
  if (credentials.size > 0 && merged.sites && merged.sites.length > 0) {
    logger.info('aggregation', 'Step 5.7: Injecting cloud credentials...');
    const credentialPolicy = await loadCredentialPolicy(storage);
    const jarBaseUrl = config.workerBaseUrl || config.localBaseUrl;
    const { sites: injectedSites, report: injReport } = injectCredentials(
      merged.sites, credentials, credentialPolicy, jarBaseUrl,
    );
    merged.sites = injectedSites;
    logger.infoFields('aggregation', 'credentials-injected', {
      injected: injReport.injected, skippedSafe: injReport.skippedSafe,
      highRisk: injReport.skippedHighRisk, unaudited: injReport.skippedUnaudited,
      noRule: injReport.skippedNoRule, noCredential: injReport.skippedNoCredential,
    });
  } else {
    logger.info('aggregation', 'Step 5.7: No cloud credentials configured, skipping');
  }

  // Step 6: 站点验活 + 不可达过滤 + name 标记（CF 和 Node.js 统一）
  const speedTestRaw = await storage.get(KV_SPEED_TEST_ENABLED);
  const speedTestEnabled = speedTestRaw !== 'false';
  const probeDepthRaw = await storage.get(KV_SITE_PROBE_DEPTH);
  const probeDeep = probeDepthRaw !== 'shallow' && !config.workerBaseUrl; // CF Worker 强制 shallow
  let siteProbeMap: Map<string, SiteProbeResult> = new Map();
  let siteSpeedMap: Map<string, number | null> = new Map();

  if (!speedTestEnabled) {
    logger.info('aggregation', 'Step 6: Speed test disabled, skipping');
  } else if (merged.sites && merged.sites.length > 0) {
    logger.infoFields('aggregation', 'Step 6: site probe', { depth: probeDeep ? 'deep' : 'shallow' });
    siteProbeMap = await batchSiteSpeedTest(merged.sites, config.siteTimeoutMs, probeDeep);

    // 提取纯 speedMs map 供后续 dedup 使用
    for (const [key, probe] of siteProbeMap) {
      siteSpeedMap.set(key, probe.speedMs);
    }

    if (siteProbeMap.size > 0) {
      const { sites: filteredSites, filtered } = filterUnreachableSites(merged.sites, siteProbeMap);
      merged.sites = filteredSites;

      if (!config.workerBaseUrl) {
        merged.sites = appendSpeedToName(merged.sites, siteProbeMap);
      }
    }

    // 更新站点健康状态 & 自动标记/屏蔽
    await updateSiteHealth(storage, siteProbeMap, merged);
  } else {
    logger.info('aggregation', 'Step 6: No sites to test');
  }

  // Step 6.2: 相似名称去重（保留响应速度最快的站点）
  const dedupRaw = await storage.get(KV_DEDUP_CONFIG);
  let similarDedupEnabled = true;
  let similarDedupThreshold = 0.85;
  if (dedupRaw) {
    try {
      const dedupCfg = JSON.parse(dedupRaw);
      similarDedupEnabled = dedupCfg.similarDedup !== false;
      similarDedupThreshold = typeof dedupCfg.similarDedupThreshold === 'number'
        ? dedupCfg.similarDedupThreshold
        : 0.85;
    } catch { /* ignore */ }
  }

  if (similarDedupEnabled && merged.sites && merged.sites.length > 0) {
    logger.infoFields('aggregation', 'Step 6.2: similar-name-dedup', { threshold: similarDedupThreshold });
    merged.sites = deduplicateSimilarNames(merged.sites, siteSpeedMap, similarDedupThreshold);
    logger.infoFields('aggregation', 'similar-dedup-done', { sites: merged.sites.length });
  } else {
    logger.info('aggregation', 'Step 6.2: Similar-name dedup disabled, skipping');
  }

  // Step 6.5: 直播源频道级合并（方案 D+）
  // 收集所有 m3u/txt URL（配置源合来的 FongMi 格式 lives + admin 手动源）
  // → 下载 → 解析 → 按频道名合并 urls → 输出 TVBoxLiveGroup[]
  // CF Worker 免费版 50 子请求上限，Step 6.5 要再下载 N 个 m3u 会爆，整段跳过
  // CF 部署保留 FongMi 格式，lives[0] 崩溃风险保留；建议 CF 用户切 Docker
  // 直播禁用开关
  const liveDisabledRaw = await storage.get(KV_LIVE_DISABLED);
  const liveDisabled = liveDisabledRaw === 'true';

  if (liveDisabled) {
    logger.info('aggregation', 'Step 6.5: Live disabled, skipping');
    merged.lives = [];
  } else if (config.workerBaseUrl) {
    logger.info('aggregation', 'Step 6.5: Skipped on CF (subrequest limit, use Docker for channel merging)');
  } else {
  logger.info('aggregation', 'Step 6.5: Channel-level live merging...');
  {
    const liveInputs: LiveSourceInput[] = [];

    // 配置源合并来的 lives（FongMi 格式）
    for (const l of (merged.lives || []) as Array<{ name?: string; url?: string; api?: string; ua?: string; header?: Record<string, string>; group?: string }>) {
      // 跳过已经是 Native 格式的（含 group 字段无 url）
      if (l.group && !l.url && !l.api) continue;
      const u = l.url || l.api;
      if (!u || !/^https?:\/\//i.test(u)) continue;
      if (u.includes('127.0.0.1') || u.includes('localhost')) continue;
      liveInputs.push({
        name: l.name || 'source',
        url: u,
        ua: l.ua,
        header: l.header,
      });
    }

    // admin 手动源
    const liveRaw = await storage.get(KV_LIVE_SOURCES);
    if (liveRaw) {
      try {
        const manual: Array<{ name: string; url: string }> = JSON.parse(liveRaw);
        for (const m of manual) {
          if (!m.url || !/^https?:\/\//i.test(m.url)) continue;
          if (m.url.includes('127.0.0.1') || m.url.includes('localhost')) continue;
          liveInputs.push({ name: m.name || 'manual', url: m.url });
        }
      } catch {
        /* ignore */
      }
    }

    // URL 去重
    const seen = new Set<string>();
    const uniqueInputs = liveInputs.filter((i) => {
      if (seen.has(i.url)) return false;
      seen.add(i.url);
      return true;
    });

    if (uniqueInputs.length === 0) {
      logger.info('aggregation', 'Step 6.5: No live sources to merge');
      merged.lives = [];
    } else {
      const liveMergeMode = (await storage.get(KV_LIVE_MERGE_MODE)) || 'separated';
      logger.infoFields('aggregation', 'Step 6.5: live-sources', { unique: uniqueInputs.length, mode: liveMergeMode });

      let mergeResult;
      if (liveMergeMode === 'separated') {
        mergeResult = await separatedMergeLives(uniqueInputs, config.fetchTimeoutMs);
      } else {
        const channelSpeedMap = await loadChannelSpeedMap(storage);
        mergeResult = await mergeLivesToNative(uniqueInputs, config.fetchTimeoutMs, channelSpeedMap);
      }
      merged.lives = mergeResult.groups;

      // 保存合并树供 channel-probe 使用
      await storage.put(KV_CHANNEL_MERGED_TREE, JSON.stringify(mergeResult.groups));

      logger.infoFields('aggregation', 'live-merge-done', {
        downloaded: mergeResult.sourcesDownloaded, total: uniqueInputs.length,
        groups: mergeResult.groups.length, channels: mergeResult.totalChannels, urls: mergeResult.totalUrls,
      });
    }
  }
  }

  // Step 6.8: 自定义分组排序
  const groupOrderCfg = await loadGroupOrder(storage);
  if (groupOrderCfg.enabled && merged.sites && merged.sites.length > 0) {
    logger.info('aggregation', 'Step 6.8: Applying custom group order...');
    merged.sites = applyGroupOrder(merged.sites, groupOrderCfg);
  } else {
    logger.info('aggregation', 'Step 6.8: Group order disabled or no rules, skipping');
  }

  // Step 7: JAR URL 改写（统一用占位符，请求时替换为实际 base URL）
  logger.infoFields('aggregation', 'Step 7: rewriting JAR URLs', { placeholder: BASE_URL_PLACEHOLDER });
  merged = await rewriteJarUrls(merged, BASE_URL_PLACEHOLDER, storage);

  // Step 7.5: 注入图片代理前缀（统一用占位符或边缘代理）
  const edgeRaw = await storage.get(KV_EDGE_PROXIES);
  if (edgeRaw) {
    const edge: EdgeProxyConfig = JSON.parse(edgeRaw);
    if (edge.cf) {
      merged.pic = `${edge.cf.replace(/\/$/, '')}/img/`;
      logger.infoFields('aggregation', 'pic-proxy-injected-edge', { pic: merged.pic });
    } else {
      merged.pic = `${BASE_URL_PLACEHOLDER}/img/`;
      logger.infoFields('aggregation', 'pic-proxy-placeholder', { pic: merged.pic });
    }
  } else {
    merged.pic = `${BASE_URL_PLACEHOLDER}/img/`;
    logger.infoFields('aggregation', 'pic-proxy-placeholder', { pic: merged.pic });
  }

  // Step 8: 存入存储
  const mergedJson = JSON.stringify(merged);
  await storage.put(KV_MERGED_CONFIG, mergedJson);
  await storage.put(KV_LAST_UPDATE, new Date().toISOString());

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.infoFields('aggregation', 'done', {
    elapsed: `${elapsed}s`, sites: merged.sites?.length, parses: merged.parses?.length, lives: merged.lives?.length,
  });

  // Step 9: 聚合日志
  const nowSiteKeys = new Set((merged.sites || []).map(s => s.key));
  const siteKeyToName = new Map((merged.sites || []).map(s => [s.key, s.name || s.key]));

  const addedSites: AggLogSiteChange[] = [];
  for (const key of nowSiteKeys) {
    if (!prevSiteKeys.has(key)) {
      addedSites.push({ key, name: siteKeyToName.get(key) });
    }
  }

  const removedSites: AggLogSiteChange[] = [];
  for (const key of prevSiteKeys) {
    if (!nowSiteKeys.has(key)) {
      removedSites.push({ key });
    }
  }

  const failedSources: AggLogFailedSource[] = logFetchResults
    .filter(r => r.status !== 'ok')
    .map(r => ({ url: r.url, name: r.name, status: r.status, errorMessage: r.errorMessage }));

  const aggLog: AggregationLog = {
    id: new Date(startTime).toISOString(),
    startTime: new Date(startTime).toISOString(),
    endTime: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    success: true,
    totalSources: logFetchResults.length,
    okSources: logFetchResults.filter(r => r.status === 'ok').length,
    failedSources,
    addedSites,
    removedSites,
    finalSiteCount: merged.sites?.length || 0,
    finalParseCount: merged.parses?.length || 0,
    finalLiveCount: merged.lives?.length || 0,
    blacklistRemovedSites: logBlacklistRemovedSites,
    blacklistRemovedParses: logBlacklistRemovedParses,
    blacklistRemovedLives: logBlacklistRemovedLives,
  };

  await appendAggLog(storage, aggLog);
  await storage.put(KV_SITE_SNAPSHOT, JSON.stringify([...nowSiteKeys]));

  if (addedSites.length > 0 || removedSites.length > 0) {
    logger.infoFields('aggregation', 'site-diff', { added: addedSites.length, removed: removedSites.length });
  }
}

/**
 * 处理 MacCMS 源：
 * - CF 版（有 workerBaseUrl）：直接转换，API 指向代理路由
 * - 本地版（无 workerBaseUrl）：并发验证 + 过滤不可达站点 + 收集延迟
 */
async function processMacCMSSources(
  storage: Storage,
  config: AppConfig,
): Promise<SourcedConfig[]> {
  const raw = await storage.get(KV_MACCMS_SOURCES);
  const entries: MacCMSSourceEntry[] = raw ? JSON.parse(raw) : [];

  if (entries.length === 0) {
    logger.info('aggregation', 'No MacCMS sources configured');
    return [];
  }

  logger.infoFields('aggregation', 'maccms-sources-found', { count: entries.length });

  let validEntries: MacCMSSourceEntry[];
  let speedMap: Map<string, number> | undefined;

  const edgeProxiesRaw = !config.workerBaseUrl ? await storage.get(KV_EDGE_PROXIES) : null;

  if (config.workerBaseUrl || edgeProxiesRaw) {
    // CF 版或本地有 edge proxy：跳过验证，运行时代理兜底
    logger.info('aggregation', `Skipping MacCMS validation (${config.workerBaseUrl ? 'CF proxy' : 'edge proxy configured'})`);
    validEntries = entries;
  } else {
    // 本地版无 edge proxy：并发验证，过滤不可达站点
    logger.info('aggregation', 'Local mode (no edge proxy): validating MacCMS sources...');
    const result = await processMacCMSForLocal(entries, config.siteTimeoutMs);
    validEntries = result.passed;
    speedMap = result.speedMap;
  }

  if (validEntries.length === 0) {
    logger.warn('aggregation', 'No valid MacCMS sources after processing');
    return [];
  }

  const sites = macCMSToTVBoxSites(validEntries, BASE_URL_PLACEHOLDER, speedMap);
  logger.infoFields('aggregation', 'maccms-converted', { sites: sites.length });

  return [{
    sourceUrl: 'maccms://builtin',
    sourceName: 'MacCMS Sources',
    config: { sites },
  }];
}

/**
 * 更新源健康状态：读取历史 → merge 本次 fetch 结果 → 写回
 */
async function updateSourceHealth(storage: Storage, fetchResults: SourceFetchResult[]): Promise<void> {
  if (fetchResults.length === 0) return;

  const now = new Date().toISOString();

  // 读取历史健康记录
  const raw = await storage.get(KV_SOURCE_HEALTH);
  const oldRecords: SourceHealthRecord[] = raw ? JSON.parse(raw) : [];
  const oldMap = new Map(oldRecords.map(r => [r.url, r]));

  // 本次参与 fetch 的 URL 集合
  const fetchedUrls = new Set(fetchResults.map(r => r.url));

  // Merge 逻辑
  const newRecords: SourceHealthRecord[] = [];

  for (const fr of fetchResults) {
    const old = oldMap.get(fr.url);

    if (fr.status === 'ok') {
      newRecords.push({
        url: fr.url,
        name: fr.name,
        latestStatus: 'ok',
        consecutiveFailures: 0,
        lastSuccessTime: now,
        lastFailTime: old?.lastFailTime,
        lastFailReason: old?.lastFailReason,
        lastSpeedMs: fr.speedMs,
      });
    } else {
      newRecords.push({
        url: fr.url,
        name: fr.name,
        latestStatus: fr.status,
        consecutiveFailures: (old?.consecutiveFailures ?? 0) + 1,
        lastSuccessTime: old?.lastSuccessTime,
        lastFailTime: now,
        lastFailReason: fr.errorMessage,
        lastSpeedMs: old?.lastSpeedMs,
      });
    }
  }

  // 保留未参与本次 fetch 的历史记录（源可能被临时排除但还在列表中）
  // 但已被用户删除的源不应保留——这由 fetchResults 只包含当前源列表来保证
  // 如果老记录的 URL 不在本次 fetch 中，丢弃（源已被删除）
  // 注：inline:// 源不经过 fetcher，不会出现在 fetchResults 中，也不需要追踪

  const failCount = newRecords.filter(r => r.consecutiveFailures > 0).length;
  if (failCount > 0) {
    logger.infoFields('aggregation', 'source-health', { ok: newRecords.length - failCount, failing: failCount });
  }

  await storage.put(KV_SOURCE_HEALTH, JSON.stringify(newRecords));
}

async function updateSiteHealth(
  storage: Storage,
  probeMap: Map<string, SiteProbeResult>,
  merged: { sites?: TVBoxSite[] },
): Promise<void> {
  if (probeMap.size === 0) return;

  const raw = await storage.get(KV_SITE_HEALTH_MAP);
  const healthMap: Record<string, { consecutiveFailures: number; lastProbeTime: string; lastProbeResult: string; lastSuccessTime?: string }> = raw ? JSON.parse(raw) : {};
  const now = new Date().toISOString();

  for (const [key, probe] of probeMap) {
    const prev = healthMap[key];
    if (probe.result === 'ok') {
      healthMap[key] = { consecutiveFailures: 0, lastProbeTime: now, lastProbeResult: 'ok', lastSuccessTime: now };
    } else {
      healthMap[key] = {
        consecutiveFailures: (prev?.consecutiveFailures ?? 0) + 1,
        lastProbeTime: now,
        lastProbeResult: probe.result,
        lastSuccessTime: prev?.lastSuccessTime,
      };
    }
  }

  // 标记连续失败 >= 3 的站点
  if (merged.sites) {
    for (let i = 0; i < merged.sites.length; i++) {
      const h = healthMap[merged.sites[i].key];
      if (h && h.consecutiveFailures >= 3) {
        const name = merged.sites[i].name || merged.sites[i].key;
        if (!name.includes('[⚠]')) {
          merged.sites[i] = { ...merged.sites[i], name: `${name} [⚠]` };
        }
      }
    }
  }

  // 自动清理：连续失败 >= 5 时加黑名单（需开关开启）
  const autoCleanRaw = await storage.get(KV_SITE_AUTO_CLEAN);
  if (autoCleanRaw === 'true' && merged.sites) {
    const blacklist = await loadBlacklist(storage);
    let cleaned = 0;
    const MAX_AUTO_CLEAN = 5;

    for (const site of merged.sites) {
      if (cleaned >= MAX_AUTO_CLEAN) break;
      const h = healthMap[site.key];
      if (h && h.consecutiveFailures >= 5) {
        const fp = await siteFingerprint(site);
        if (!blacklist.sites.includes(fp)) {
          blacklist.sites.push(fp);
          cleaned++;
          logger.infoFields('aggregation', 'auto-clean-blacklisted', { key: site.key, name: site.name, failures: h.consecutiveFailures });
        }
      }
    }

    if (cleaned > 0) {
      await saveBlacklist(storage, blacklist);
      logger.infoFields('aggregation', 'auto-clean-done', { cleaned });
    }
  }

  await storage.put(KV_SITE_HEALTH_MAP, JSON.stringify(healthMap));
}

async function appendAggLog(storage: Storage, log: AggregationLog): Promise<void> {
  try {
    const raw = await storage.get(KV_AGG_LOGS);
    const logs: AggregationLog[] = raw ? JSON.parse(raw) : [];
    logs.push(log);
    while (logs.length > AGG_LOGS_MAX) {
      logs.shift();
    }
    await storage.put(KV_AGG_LOGS, JSON.stringify(logs));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('aggregation', `Failed to write agg log: ${msg}`);
  }
}

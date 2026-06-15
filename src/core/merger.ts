// 站点级合并引擎

import type { TVBoxConfig, TVBoxSite, SourcedConfig } from './types';
import { normalizeConfig, extractSpiderJarUrl } from './parser';
import {
  deduplicateSites,
  deduplicateParses,
  deduplicateLives,
  deduplicateDoh,
  mergeRules,
  deduplicateHosts,
  deduplicateStrings,
} from './dedup';

/**
 * 将多个 TVBox 配置合并成一个
 * 核心逻辑：
 * 1. 规范化所有配置（相对路径转绝对、默认值填充）
 * 2. Spider JAR 智能分配（全局 + per-site）
 * 3. 各字段去重合并
 */
export interface MergeResult {
  config: TVBoxConfig;
  siteSourceMap: Map<string, string>;   // site.key → sourceName
  parseSourceMap: Map<string, string>;  // parse.url → sourceName
  liveSourceMap: Map<string, string>;   // (live.url || live.api) → sourceName
}

export function mergeConfigs(sourcedConfigs: SourcedConfig[]): MergeResult {
  // Step 1: 规范化所有配置
  const normalized = sourcedConfigs.map(normalizeConfig);
  const siteSourceMap = new Map<string, string>();
  const parseSourceMap = new Map<string, string>();
  const liveSourceMap = new Map<string, string>();

  // Step 2: 确定全局 spider（投票制：选引用最多 type:3 站点的 JAR）
  const globalSpider = selectGlobalSpider(normalized);
  const globalSpiderFull = globalSpider ? findFullSpiderString(normalized, globalSpider) : null;

  // Step 3: 收集并合并所有字段
  const allSites: TVBoxSite[] = [];
  const allParses: TVBoxConfig['parses'] = [];
  const allLives: TVBoxConfig['lives'] = [];
  const allHosts: string[] = [];
  const allRules: TVBoxConfig['rules'] = [];
  const allDoh: TVBoxConfig['doh'] = [];
  const allAds: string[] = [];
  const allFlags: string[] = [];

  for (const sourced of normalized) {
    const config = sourced.config;

    // Sites: 给 type:3 站点分配 jar 字段
    if (config.sites) {
      for (const site of config.sites) {
        const siteCopy = { ...site };

        if (site.type === 3 && !site.jar) {
          const spiderJar = extractSpiderJarUrl(config.spider);
          if (spiderJar && spiderJar !== globalSpider) {
            siteCopy.jar = config.spider;
          }
        }

        allSites.push(siteCopy);
      }
    }

    if (config.parses) {
      for (const p of config.parses) {
        if (p.url && !parseSourceMap.has(p.url)) {
          parseSourceMap.set(p.url, sourced.sourceName);
        }
      }
      allParses.push(...config.parses);
    }
    if (config.lives) {
      for (const l of config.lives) {
        const liveId = l.url || l.api || '';
        if (liveId && !liveSourceMap.has(liveId)) {
          liveSourceMap.set(liveId, sourced.sourceName);
        }
      }
      allLives.push(...config.lives);
    }
    if (config.hosts) allHosts.push(...config.hosts);
    if (config.rules) allRules.push(...config.rules);
    if (config.doh) allDoh.push(...config.doh);
    if (config.ads) allAds.push(...config.ads);
    if (config.flags) allFlags.push(...config.flags);
  }

  // 用 dedupKey(key|api) 建来源映射（dedup 可能改 key 但不改 api）
  const sourceByDedupKey = new Map<string, string>();
  for (const sourced of normalized) {
    for (const site of sourced.config.sites || []) {
      const dk = `${site.key}|${site.api}`;
      if (!sourceByDedupKey.has(dk)) {
        sourceByDedupKey.set(dk, sourced.sourceName);
      }
    }
  }

  // Step 4: 去重
  const dedupedSites = deduplicateSites(allSites);

  // dedup 后用实际 key 构建 siteSourceMap
  for (const site of dedupedSites) {
    const dk = `${site.key}|${site.api}`;
    const source = sourceByDedupKey.get(dk);
    if (source) {
      siteSourceMap.set(site.key, source);
    } else {
      // key 被改名（加了后缀），用 api 反查
      for (const [mapDk, mapSource] of sourceByDedupKey) {
        if (mapDk.endsWith(`|${site.api}`)) {
          siteSourceMap.set(site.key, mapSource);
          break;
        }
      }
    }
  }

  const merged: TVBoxConfig = {
    sites: dedupedSites,
    parses: deduplicateParses(allParses || []),
    lives: deduplicateLives(allLives || []),
    hosts: deduplicateHosts(allHosts),
    rules: mergeRules(allRules || []),
    doh: deduplicateDoh(allDoh || []),
    ads: deduplicateStrings(allAds),
    flags: deduplicateStrings(allFlags),
  };

  // 设置全局 spider
  if (globalSpider) {
    merged.spider = globalSpiderFull || globalSpider;
  }

  console.log(
    `[merger] Merged: ${merged.sites?.length} sites, ` +
      `${merged.parses?.length} parses, ${merged.lives?.length} lives`,
  );

  return { config: merged, siteSourceMap, parseSourceMap, liveSourceMap };
}

/**
 * 选择全局 spider JAR
 * 统计每个 JAR URL 被多少个 type:3 站点引用，选引用最多的
 */
function selectGlobalSpider(configs: SourcedConfig[]): string | null {
  const jarCounts = new Map<string, number>();

  for (const sourced of configs) {
    const spiderJar = extractSpiderJarUrl(sourced.config.spider);
    if (!spiderJar) continue;

    const type3Count = (sourced.config.sites || []).filter((s) => s.type === 3 && !s.jar).length;
    if (type3Count > 0) {
      jarCounts.set(spiderJar, (jarCounts.get(spiderJar) || 0) + type3Count);
    }
  }

  if (jarCounts.size === 0) return null;

  // 选引用次数最多的
  let maxJar: string | null = null;
  let maxCount = 0;
  for (const [jar, count] of jarCounts) {
    if (count > maxCount) {
      maxCount = count;
      maxJar = jar;
    }
  }

  return maxJar;
}

/**
 * 找到使用指定 JAR URL 的完整 spider 字符串（可能含 md5 等后缀）
 */
function findFullSpiderString(configs: SourcedConfig[], jarUrl: string): string | null {
  for (const sourced of configs) {
    const extracted = extractSpiderJarUrl(sourced.config.spider);
    if (extracted === jarUrl && sourced.config.spider) {
      return sourced.config.spider;
    }
  }
  return null;
}

/**
 * 清洗空数据条目
 * 过滤掉关键字段为空的 sites/parses/lives/doh
 */
export function cleanEmptyEntries(config: TVBoxConfig): TVBoxConfig {
  const before = {
    sites: config.sites?.length || 0,
    parses: config.parses?.length || 0,
    lives: config.lives?.length || 0,
    doh: config.doh?.length || 0,
  };

  const sites = (config.sites || []).filter(s => s.key && s.api);
  const parses = (config.parses || []).filter(p => p.name && p.url);
  const lives = (config.lives || []).filter(l => (l.url || l.api));
  const doh = (config.doh || []).filter(d => d.name && d.url);

  const removed =
    (before.sites - sites.length) +
    (before.parses - parses.length) +
    (before.lives - lives.length) +
    (before.doh - doh.length);

  if (removed > 0) {
    console.log(
      `[cleaner] Removed ${removed} empty entries: ` +
      `${before.sites - sites.length} sites, ${before.parses - parses.length} parses, ` +
      `${before.lives - lives.length} lives, ${before.doh - doh.length} doh`,
    );
  }

  return { ...config, sites, parses, lives, doh };
}

/**
 * 清洗本地引用（127.0.0.1 / localhost）
 * 这些地址依赖用户本地 TVBox 代理服务，聚合后对其他用户是死链
 */
export function cleanLocalRefs(config: TVBoxConfig): TVBoxConfig {
  const isLocal = (url: string) =>
    url.includes('127.0.0.1') || url.includes('localhost');

  const sites = (config.sites || []).filter((site) => {
    // 过滤 api 包含本地地址的站点
    if (site.api && isLocal(site.api)) {
      console.log(`[cleaner] Removed site ${site.key}: local api ${site.api}`);
      return false;
    }
    // 过滤 ext 字符串包含本地地址的站点
    if (typeof site.ext === 'string' && isLocal(site.ext)) {
      console.log(`[cleaner] Removed site ${site.key}: local ext`);
      return false;
    }
    return true;
  });

  const lives = (config.lives || []).filter((live) => {
    if (live.url && isLocal(live.url)) {
      console.log(`[cleaner] Removed live ${live.name || 'unnamed'}: local url ${live.url}`);
      return false;
    }
    return true;
  });

  const removedSites = (config.sites?.length || 0) - sites.length;
  const removedLives = (config.lives?.length || 0) - lives.length;
  if (removedSites > 0 || removedLives > 0) {
    console.log(`[cleaner] Removed ${removedSites} sites, ${removedLives} lives with local refs`);
  }

  return { ...config, sites, lives };
}

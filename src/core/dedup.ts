// 去重逻辑

import type { TVBoxSite, TVBoxParse, TVBoxLive, TVBoxDoh, TVBoxRule } from './types';

/**
 * URL 规范化：用于去重时统一比较
 * - 去除尾部斜杠
 * - 协议、host 转小写
 * - 去除默认端口 (:80 http / :443 https)
 * - 去除 fragment (#...)
 * - 保留 query 参数（顺序敏感）
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  let u = url.trim();
  try {
    const parsed = new URL(u);
    // 协议 + host 小写，去默认端口
    let protocol = parsed.protocol.toLowerCase();
    let host = parsed.hostname.toLowerCase();
    let port = parsed.port;
    if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
      port = '';
    }
    u = `${protocol}//${host}${port ? ':' + port : ''}${parsed.pathname.replace(/\/+$/, '') || '/'}${parsed.search}`;
    // 去 fragment
    u = u.replace(/#.*$/, '');
  } catch {
    // 非 URL 格式（如 csp_xxx 类名），做基本清理
    u = u.replace(/\/+$/, '').replace(/#.*$/, '');
  }
  return u;
}

/**
 * 站点去重
 * 去重键: key + api（所有类型统一，JAR 差异不作为区分维度）
 * 冲突: key 相同但 api 不同 → key 加来源后缀
 * 额外: 按 api URL 去重（不同 key 但同 URL 视为重复，保留第一个）
 */
export function deduplicateSites(sites: TVBoxSite[]): TVBoxSite[] {
  const keyMap = new Map<string, TVBoxSite>(); // key → first site
  const dedupKey = (site: TVBoxSite): string => {
    return `${site.key}|${site.api}`;
  };

  const result: TVBoxSite[] = [];
  const seen = new Set<string>();
  const seenApiUrls = new Set<string>(); // 规范化 api URL 去重
  const usedKeys = new Map<string, number>(); // key → count, for suffix

  for (const site of sites) {
    const dk = dedupKey(site);
    if (seen.has(dk)) continue;
    seen.add(dk);

    // 按网络连接地址去重：不同 key 但同 api URL → 跳过
    if (site.api && /^https?:\/\//i.test(site.api)) {
      const normApi = normalizeUrl(site.api);
      if (seenApiUrls.has(normApi)) {
        console.log(`[dedup] Site "${site.key}" skipped: duplicate API URL "${site.api}"`);
        continue;
      }
      seenApiUrls.add(normApi);
    }

    // 处理 key 冲突：同 key 不同内容
    if (keyMap.has(site.key)) {
      const existing = keyMap.get(site.key)!;
      if (dedupKey(existing) !== dk) {
        // key 冲突，加后缀
        const count = (usedKeys.get(site.key) || 1) + 1;
        usedKeys.set(site.key, count);
        site.key = `${site.key}_${count}`;
        if (site.name) {
          site.name = `${site.name}(${count})`;
        }
      }
    } else {
      keyMap.set(site.key, site);
      usedKeys.set(site.key, 1);
    }

    result.push(site);
  }

  return result;
}

/**
 * 解析器去重 (normalized url + type)
 * 按 url+type 去重而非 name+url，同一 URL 不同 name 视为同一解析
 * 保留 type 维度防止嗅探(0)和 JSON(1)解析被误合并
 * URL 经规范化处理，消除协议大小写、尾部斜杠、默认端口等差异
 */
export function deduplicateParses(parses: TVBoxParse[]): TVBoxParse[] {
  const seen = new Set<string>();
  return parses.filter((parse) => {
    const normUrl = normalizeUrl(parse.url || '');
    const key = `${normUrl}|${parse.type ?? 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 直播源去重 (normalized url)
 * URL 经规范化处理，消除协议大小写、尾部斜杠、默认端口等差异
 */
export function deduplicateLives(lives: TVBoxLive[]): TVBoxLive[] {
  const seen = new Set<string>();
  return lives.filter((live) => {
    const rawUrl = live.url || live.api || '';
    if (!rawUrl) return true; // 无 URL 的保留（Native 格式 group/channels）
    const url = normalizeUrl(rawUrl);
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

/**
 * DOH 去重 (url)
 */
export function deduplicateDoh(dohs: TVBoxDoh[]): TVBoxDoh[] {
  const seen = new Set<string>();
  return dohs.filter((doh) => {
    if (seen.has(doh.url)) return false;
    seen.add(doh.url);
    return true;
  });
}

/**
 * Rules 合并：相同 host/hosts 的规则合并 regex/rule/filter/script
 */
export function mergeRules(rules: TVBoxRule[]): TVBoxRule[] {
  const hostMap = new Map<string, TVBoxRule>();

  for (const rule of rules) {
    const hostKey = rule.host || (rule.hosts || []).sort().join(',');
    if (!hostKey) {
      // 无法归类的规则直接保留
      hostMap.set(`__anon_${hostMap.size}`, rule);
      continue;
    }

    if (hostMap.has(hostKey)) {
      const existing = hostMap.get(hostKey)!;
      if (rule.rule) existing.rule = [...new Set([...(existing.rule || []), ...rule.rule])];
      if (rule.filter) existing.filter = [...new Set([...(existing.filter || []), ...rule.filter])];
      if (rule.regex) existing.regex = [...new Set([...(existing.regex || []), ...rule.regex])];
      if (rule.script) existing.script = [...new Set([...(existing.script || []), ...rule.script])];
    } else {
      hostMap.set(hostKey, { ...rule });
    }
  }

  return [...hostMap.values()];
}

/**
 * Hosts 去重：同 domain 后者覆盖
 */
export function deduplicateHosts(hosts: string[]): string[] {
  const map = new Map<string, string>();
  for (const entry of hosts) {
    const eqIndex = entry.indexOf('=');
    if (eqIndex > 0) {
      const domain = entry.substring(0, eqIndex);
      map.set(domain, entry);
    }
  }
  return [...map.values()];
}

/**
 * 字符串数组去重 (ads, flags)
 */
export function deduplicateStrings(arr: string[]): string[] {
  return [...new Set(arr)];
}

/**
 * 相似名称去重：按名称相似度分组，每组只保留测速最快的站点
 */
export function deduplicateSimilarNames(
  sites: TVBoxSite[],
  speedMap: Map<string, number | null>,
  threshold = 0.85,
): TVBoxSite[] {
  if (sites.length === 0) return sites;

  const parent: number[] = sites.map((_, i) => i);
  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(x: number, y: number) {
    parent[find(x)] = find(y);
  }

  for (let i = 0; i < sites.length; i++) {
    for (let j = i + 1; j < sites.length; j++) {
      const na = sites[i].name || sites[i].key;
      const nb = sites[j].name || sites[j].key;
      if (nameSimilarity(na, nb) >= threshold) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < sites.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  const kept: TVBoxSite[] = [];
  let dedupCount = 0;

  for (const [, indices] of groups) {
    if (indices.length === 1) {
      kept.push(sites[indices[0]]);
      continue;
    }

    let bestIdx = indices[0];
    let bestSpeed = speedMap.get(sites[bestIdx].api) ?? Infinity;

    for (let k = 1; k < indices.length; k++) {
      const idx = indices[k];
      const speed = speedMap.get(sites[idx].api) ?? Infinity;
      if (speed < bestSpeed) {
        bestSpeed = speed;
        bestIdx = idx;
      }
    }

    kept.push(sites[bestIdx]);
    dedupCount += indices.length - 1;

    if (indices.length > 1) {
      const names = indices.map(i => `${sites[i].name || sites[i].key}(${speedMap.get(sites[i].api) ?? '?'}ms)`);
      console.log(`[dedup-similar] Group: ${names.join(' | ')} → kept: ${sites[bestIdx].name || sites[bestIdx].key}`);
    }
  }

  if (dedupCount > 0) {
    console.log(`[dedup-similar] Removed ${dedupCount} similar-name duplicates (threshold: ${threshold})`);
  }

  const keptKeys = new Set(kept.map(s => s.key));
  return sites.filter(s => keptKeys.has(s.key));
}

function nameSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[【】\[\]()（）《》「」『』<>\s\-_·•,.，。]/g, '')
      .replace(/\d+/g, '');

  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (!na || !nb) return 0;

  const [short, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  let matches = 0;
  let longIdx = 0;
  for (const ch of short) {
    const found = long.indexOf(ch, longIdx);
    if (found >= 0) {
      matches++;
      longIdx = found + 1;
    }
  }
  return matches / long.length;
}


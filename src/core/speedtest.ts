import { TVBOX_UA } from './config';
import { logger } from './logger';
import type { TVBoxSite } from './types';

export type ProbeResult = 'ok' | 'empty' | 'error' | 'timeout';

export interface SiteProbeResult {
  key: string;
  speedMs: number | null;
  result: ProbeResult;
}

async function siteProbe(url: string, siteType: number, timeoutMs: number, deep: boolean): Promise<{ speedMs: number | null; result: ProbeResult }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const start = Date.now();
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': TVBOX_UA },
    });
    const speedMs = Date.now() - start;

    if (!resp.ok) return { speedMs: null, result: 'error' };

    const body = await resp.text();

    if (!deep) {
      // 浅模式：基本有效性检测（排除 HTML 错误页和空响应）
      if (!body || body.length === 0) return { speedMs, result: 'empty' };
      // HTML 错误页检测（非 API 响应）
      if ((body.includes('<!DOCTYPE html') || body.includes('<html')) && !body.includes('"list"') && !body.includes('<list>')) {
        return { speedMs, result: 'empty' };
      }
      return { speedMs, result: 'ok' };
    }

    const valid = validateResponseContent(siteType, body);
    return { speedMs, result: valid ? 'ok' : 'empty' };
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { speedMs: null, result: 'timeout' };
    }
    return { speedMs: null, result: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

function validateResponseContent(siteType: number, body: string): boolean {
  if (!body || body.length < 10) return false;

  // 通用：HTML 错误页面检测
  const looksLikeHtmlError =
    (body.includes('<!DOCTYPE html') || body.includes('<html') || body.includes('<head')) &&
    !body.includes('"list"') && !body.includes('<list>') && !body.includes('<video>');
  if (looksLikeHtmlError) return false;

  // 通用：空 JSON 对象或纯错误信息
  if (body.trim() === '{}' || body.trim() === '[]') return false;
  if (body.includes('"code"') && body.includes('"msg"') && body.includes('"error"') && !body.includes('"list"')) return false;

  if (siteType === 1) {
    try {
      const json = JSON.parse(body);
      // 标准 MacCMS/TVBox JSON 响应
      if (Array.isArray(json.list) && json.list.length > 0) return true;
      if (Array.isArray(json.class) && json.class.length > 0) return true;
      // 部分源返回 code+msg 但有 list
      if (json.code !== undefined && Array.isArray(json.list)) return json.list.length > 0;
      // 部分源只返回 class（分类列表）
      if (json.code !== undefined && Array.isArray(json.class)) return json.class.length > 0;
      return false;
    } catch {
      return false;
    }
  }

  if (siteType === 0) {
    // XML 格式
    if (body.includes('<list>') || body.includes('<video>') || body.includes('<class>')) return true;
    if (body.includes('<?xml') && body.includes('<')) return true;
    // 部分 XML 源返回 XML 声明 + 内容
    if (body.includes('<rss') || body.includes('<channels')) return true;
    try {
      const json = JSON.parse(body);
      if (Array.isArray(json.list) && json.list.length > 0) return true;
      if (Array.isArray(json.class) && json.class.length > 0) return true;
      return false;
    } catch {
      // 既不是 XML 也不是 JSON → 无效
      return false;
    }
  }

  // type 3 (JAR): 无法在服务端验证内容，保留
  return body.length > 0;
}

const CONCURRENCY = 30;
const BATCH_BUDGET_MS = 180_000; // 整体测速预算 3 分钟

export async function batchSiteSpeedTest(
  sites: TVBoxSite[],
  timeoutMs: number,
  deep = false,
): Promise<Map<string, SiteProbeResult>> {
  const tasks: Array<{ key: string; url: string; type: number }> = [];

  for (const site of sites) {
    const url = getTestableUrl(site);
    if (url) {
      tasks.push({ key: site.key, url, type: site.type });
    }
  }

  if (tasks.length === 0) return new Map();

  logger.infoFields('speedtest', 'batch-start', { sites: tasks.length, deep, concurrency: CONCURRENCY });

  const probeMap = new Map<string, SiteProbeResult>();
  const deadline = Date.now() + BATCH_BUDGET_MS;
  let cursor = 0;
  let active = 0;
  let budgetExhausted = false;

  await new Promise<void>((resolve) => {
    function scheduleNext() {
      while (active < CONCURRENCY && cursor < tasks.length) {
        if (Date.now() >= deadline) {
          budgetExhausted = true;
          break;
        }
        const task = tasks[cursor++];
        active++;
        siteProbe(task.url, task.type, timeoutMs, deep).then((probe) => {
          probeMap.set(task.key, { key: task.key, ...probe });
          active--;
          scheduleNext();
        });
      }
      if (active === 0) resolve();
    }
    scheduleNext();
  });

  // 超时未测的站点标记为 timeout
  if (budgetExhausted) {
    const skipped = tasks.length - cursor;
    for (let i = cursor; i < tasks.length; i++) {
      probeMap.set(tasks[i].key, { key: tasks[i].key, speedMs: null, result: 'timeout' });
    }
    logger.warnFields('speedtest', 'budget-exhausted', { completed: cursor, skipped });
  }

  const ok = [...probeMap.values()].filter(v => v.result === 'ok').length;
  const empty = [...probeMap.values()].filter(v => v.result === 'empty').length;
  const timedOut = [...probeMap.values()].filter(v => v.result === 'timeout').length;
  logger.infoFields('speedtest', 'batch-done', { ok, empty, timeout: timedOut, error: probeMap.size - ok - empty - timedOut, total: probeMap.size });

  return probeMap;
}

export function appendSpeedToName(sites: TVBoxSite[], speedMap: Map<string, SiteProbeResult>): TVBoxSite[] {
  return sites.map((site) => {
    const probe = speedMap.get(site.key);
    if (!probe || probe.speedMs == null) return site;
    const seconds = (probe.speedMs / 1000).toFixed(1);
    return { ...site, name: `${site.name || site.key} [${seconds}s]` };
  });
}

export function filterUnreachableSites(
  sites: TVBoxSite[],
  speedMap: Map<string, SiteProbeResult>,
): { sites: TVBoxSite[]; filtered: number } {
  const totalTestable = speedMap.size;
  if (totalTestable === 0) return { sites, filtered: 0 };

  const reachable: TVBoxSite[] = [];
  const unreachable: TVBoxSite[] = [];

  for (const site of sites) {
    const probe = speedMap.get(site.key);
    if (!probe) {
      reachable.push(site);
    } else if (probe.result === 'ok') {
      reachable.push(site);
    } else {
      unreachable.push(site);
    }
  }

  const reachableTestable = reachable.filter(s => speedMap.has(s.key)).length;
  if (totalTestable > 0 && reachableTestable / totalTestable < 0.1) {
    logger.warn('speedtest', `Safety valve: only ${reachableTestable}/${totalTestable} sites ok (<10%), keeping all`);
    return { sites, filtered: 0 };
  }

  logger.infoFields('speedtest', 'filter-done', { filtered: unreachable.length, kept: reachable.length });
  return { sites: reachable, filtered: unreachable.length };
}

function getTestableUrl(site: TVBoxSite): string | null {
  const api = site.api || '';

  if (site.type === 1) {
    if (!api.startsWith('http')) return null;
    return api.includes('?') ? `${api}&ac=list` : `${api}?ac=list`;
  }

  if (site.type === 0) {
    if (!api.startsWith('http')) return null;
    return api.includes('?') ? `${api}&ac=list` : `${api}?ac=list`;
  }

  if (site.type === 3) {
    if (api.startsWith('http://') || api.startsWith('https://')) return api;
    return null;
  }

  return null;
}


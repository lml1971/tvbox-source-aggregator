// 自动抓取源列表
// 1. 可配置的 TVBox 配置源抓取
// 2. MacCMS 萌芽采集插件资源站抓取
// 通过环境变量控制：未配置则不启用

import type { SourceEntry, MacCMSSourceEntry } from './types';

const MAX_PAGES = 10;

export interface ScrapeSourceConfig {
  url: string;      // 抓取 API 地址
  referer: string;  // Referer header
}

export interface ScrapeMacCMSConfig {
  apiUrl: string;   // API 地址
  aesKey: string;   // AES-128-CBC 密钥
  aesIv: string;    // AES-128-CBC IV
}

/**
 * 抓取 TVBox 源列表
 */
export async function scrapeSourceList(cfg: ScrapeSourceConfig): Promise<SourceEntry[]> {
  const allSources: SourceEntry[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const html = await fetchPage(cfg, page);
      if (!html || !html.trim()) break;

      const sources = parsePage(html);
      if (sources.length === 0) break;

      allSources.push(...sources);
      console.log(`[source-scraper] Page ${page}: ${sources.length} sources`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[source-scraper] Page ${page} failed: ${msg}`);
      break;
    }
  }

  console.log(`[source-scraper] Total scraped: ${allSources.length} sources`);
  return allSources;
}

async function fetchPage(cfg: ScrapeSourceConfig, page: number): Promise<string> {
  // 先尝试旧版 POST（WordPress AJAX 分页 API）
  const postResp = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'okhttp/3.12.0',
      'Referer': cfg.referer || cfg.url,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: `action=load&page=source&type=one&paged=${page}`,
  });

  if (postResp.ok) return postResp.text();

  // POST 失败（网站改版）：GET 获取完整页面（仅第 1 页，新版不分页）
  if (page > 1) return '';
  const getResp = await fetch(cfg.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Referer': cfg.referer || cfg.url,
    },
  });
  if (!getResp.ok) throw new Error(`HTTP ${getResp.status}`);
  return getResp.text();
}

function parsePage(html: string): SourceEntry[] {
  const sources: SourceEntry[] = [];
  const seen = new Set<string>();

  // 策略 1：旧版结构（col-form-label + value）
  const nameRegex = /col-form-label">([^<]+)</g;
  const urlRegex = /value="([^"]+)"/g;
  const names: string[] = [];
  const urls: string[] = [];
  let m;
  while ((m = nameRegex.exec(html)) !== null) names.push(m[1].trim());
  while ((m = urlRegex.exec(html)) !== null) urls.push(m[1].trim());
  for (let i = 0; i < names.length && i < urls.length; i++) {
    const url = urls[i];
    if (url && (url.startsWith('http://') || url.startsWith('https://')) && !seen.has(url)) {
      seen.add(url);
      sources.push({ name: names[i], url });
    }
  }

  // 策略 2：新版结构——直接提取页面中所有看起来像 TVBox 配置的 URL
  if (sources.length === 0) {
    const urlPattern = /https?:\/\/[^\s"'<>]+?\.(json|txt)(?=[^\w]|$)/g;
    while ((m = urlPattern.exec(html)) !== null) {
      let url = m[0];
      // 排除 xhztv.pro/jsonview 这类预览链接（只要里面的实际源 URL）
      if (url.includes('jsonview?url=')) continue;
      // 排除静态资源
      if (/\.(css|js|png|jpg|gif|svg|ico)/.test(url)) continue;
      if (!seen.has(url)) {
        seen.add(url);
        // 从 URL 尾部提取一个可读名称
        const name = decodeURIComponent(url.split('/').pop()?.replace(/\.(json|txt)$/, '') || url.slice(-20));
        sources.push({ name, url });
      }
    }
    // 也提取多仓/影视仓类地址（无扩展名但路径含 tv/box/api 等）
    const specialPattern = /https?:\/\/[^\s"'<>]+?(?:\/tv|\/api|影视仓)[^\s"'<>]*/g;
    while ((m = specialPattern.exec(html)) !== null) {
      const url = m[0].replace(/["'<>].*$/, '');
      if (!seen.has(url) && !url.includes('jsonview')) {
        seen.add(url);
        const name = decodeURIComponent(url.split('/').pop() || '多仓');
        sources.push({ name, url });
      }
    }
  }

  return sources;
}

// ============================================================
// MacCMS 萌芽采集资源站自动抓取
// ============================================================

interface MycjRow {
  flag?: string;
  name?: string;
  apis?: string;
  xml_api?: string;
  rema?: string;
  mid?: number;
  type?: number;
}

/**
 * 从 MacCMS 采集插件 API 抓取资源站列表
 * AES-128-CBC 解密 → 提取 zanzhu+m3u8 → 按 flag 去重
 */
export async function scrapeMacCMSSources(cfg: ScrapeMacCMSConfig): Promise<MacCMSSourceEntry[]> {
  console.log('[maccms-scraper] Fetching from API...');

  const url = `${cfg.apiUrl}?t=${Math.floor(Date.now() / 1000)}`;
  const resp = await fetch(url);

  if (!resp.ok) {
    throw new Error(`MacCMS API HTTP ${resp.status}`);
  }

  const json = await resp.json() as { code?: number; data?: string };
  if (json.code !== 200 || !json.data) {
    throw new Error(`MacCMS API error: code=${json.code}`);
  }

  const decrypted = await decryptData(json.data, cfg.aesKey, cfg.aesIv);
  const parsed = JSON.parse(decrypted) as {
    list?: Record<string, { rows?: MycjRow[] }>;
  };

  if (!parsed.list) {
    throw new Error('Decrypted data has no list field');
  }

  const sections = ['zanzhu', 'm3u8'] as const;
  const seen = new Map<string, MacCMSSourceEntry>();

  for (const section of sections) {
    const rows = parsed.list[section]?.rows || [];
    for (const row of rows) {
      if (!row.flag || !row.apis || !row.name) continue;
      if (!seen.has(row.flag)) {
        seen.set(row.flag, {
          key: row.flag,
          name: row.name,
          api: row.apis,
        });
      }
    }
  }

  const entries = Array.from(seen.values());
  console.log(`[maccms-scraper] Scraped ${entries.length} unique sources`);
  return entries;
}

async function decryptData(base64Data: string, key: string, iv: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(key);
  const ivBytes = new TextEncoder().encode(iv);

  const binaryStr = atob(base64Data);
  const ciphertext = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    ciphertext[i] = binaryStr.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-CBC' }, false, ['decrypt'],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: ivBytes }, cryptoKey, ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

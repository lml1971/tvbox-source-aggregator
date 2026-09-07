// 站点名称定制：清洗推广文字 + 前缀后缀

import type { TVBoxConfig, NameTransformConfig } from './types';

const DEFAULT_CLEAN_PATTERNS: RegExp[] = [
  /关注.*?公众号[：:\s]*[a-zA-Z0-9\u4e00-\u9fa5_-]*/g,
  /公众号[：:\s]*[a-zA-Z0-9\u4e00-\u9fa5_-]+/g,
  /[Vv][Xx][：:\s]*[a-zA-Z0-9_-]+/g,
  /加群[：:\s]*\d+/g,
  /QQ群?[：:\s]*\d+/g,
  /微信[：:\s]*[a-zA-Z0-9_-]+/g,
  /[Tt]elegram[：:\s]*@?[a-zA-Z0-9_]+/g,
  /[Tt][Gg][：:\s]*@?[a-zA-Z0-9_]+/g,
  /免费.*?观看/g,
  /更新.*?地址[：:\s]*\S+/g,
  /最新.*?地址[：:\s]*\S+/g,
  /备用.*?地址[：:\s]*\S+/g,
];

const SEPARATOR_TRIM = /^[|｜/／\-—·\s]+|[|｜/／\-—·\s]+$/g;
const SEPARATOR_COLLAPSE = /[|｜/／\-—·]{2,}/g;

export function transformSiteNames(config: TVBoxConfig, transform: NameTransformConfig): TVBoxConfig {
  if (!config.sites || config.sites.length === 0) return config;

  const patterns = buildPatterns(transform.extraCleanPatterns);
  const replacement = transform.promoReplacement || '';

  const sites = config.sites.map((site) => {
    let name = site.name || '';

    // Step 1: 清洗推广文字
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      name = name.replace(pattern, replacement);
    }

    // Step 2: 清理残留分隔符
    name = name.replace(SEPARATOR_COLLAPSE, '|');
    name = name.replace(SEPARATOR_TRIM, '');

    // Step 3: 前缀后缀
    if (transform.prefix) name = transform.prefix + name;
    if (transform.suffix) name = name + transform.suffix;

    // Step 4: 空名 fallback
    if (!name.trim()) name = site.key;

    return { ...site, name };
  });

  return { ...config, sites };
}

function buildPatterns(extraPatterns?: string[]): RegExp[] {
  const patterns = [...DEFAULT_CLEAN_PATTERNS];
  if (extraPatterns) {
    for (const p of extraPatterns) {
      try {
        patterns.push(new RegExp(p, 'g'));
      } catch {
        console.warn(`[cleaner] Invalid extra pattern: ${p}`);
      }
    }
  }
  return patterns;
}

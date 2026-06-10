import type { Storage } from '../storage/interface';
import type { TVBoxSite, TVBoxParse, TVBoxLive, TVBoxConfig, RegexRule } from './types';
import { KV_BLACKLIST } from './config';
import { logger } from './logger';

export interface Blacklist {
  sites: string[];   // site fingerprint: sha256(api|ext|jar)[:16]
  parses: string[];  // parse url
  lives: string[];   // live url
  regexRules: RegexRule[];
  regexBlockOverrides: string[];  // 正则命中但手动恢复的站点名
}

const EMPTY_BLACKLIST: Blacklist = { sites: [], parses: [], lives: [], regexRules: [], regexBlockOverrides: [] };

export async function siteFingerprint(site: TVBoxSite): Promise<string> {
  const ext = typeof site.ext === 'string' ? site.ext : JSON.stringify(site.ext || '');
  const raw = `${site.api}|${ext}|${site.jar || ''}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const arr = new Uint8Array(buf);
  return Array.from(arr.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function loadBlacklist(storage: Storage): Promise<Blacklist> {
  try {
    const raw = await storage.get(KV_BLACKLIST);
    if (!raw) return EMPTY_BLACKLIST;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.sites) || !Array.isArray(parsed.parses) || !Array.isArray(parsed.lives)) {
      logger.warn('blacklist', 'Invalid structure, skipping');
      return EMPTY_BLACKLIST;
    }
    return {
      sites: parsed.sites,
      parses: parsed.parses,
      lives: parsed.lives,
      regexRules: Array.isArray(parsed.regexRules) ? parsed.regexRules : [],
      regexBlockOverrides: Array.isArray(parsed.regexBlockOverrides) ? parsed.regexBlockOverrides : [],
    };
  } catch (e) {
    logger.error('blacklist', `Failed to load, skipping filter: ${e instanceof Error ? e.message : String(e)}`);
    return EMPTY_BLACKLIST;
  }
}

export async function saveBlacklist(storage: Storage, blacklist: Blacklist): Promise<void> {
  await storage.put(KV_BLACKLIST, JSON.stringify(blacklist));
}

// ─── 正则规则验证 ────────────────────────────────────────

const MAX_PATTERN_LENGTH = 200;
const NESTED_QUANTIFIER_RE = /\([^)]*[+*{][^)]*\)[+*{]/;

export function validateRegexRule(pattern: string): { ok: boolean; error?: string } {
  if (!pattern) return { ok: false, error: 'Pattern is empty' };
  if (pattern.length > MAX_PATTERN_LENGTH) return { ok: false, error: 'Pattern too long (max 200)' };
  if (NESTED_QUANTIFIER_RE.test(pattern)) return { ok: false, error: 'Nested quantifier detected (ReDoS risk)' };
  try {
    new RegExp(pattern);
  } catch (e) {
    return { ok: false, error: `Invalid regex: ${e instanceof Error ? e.message : String(e)}` };
  }
  return { ok: true };
}

// ─── 正则规则 CRUD ───────────────────────────────────────

export async function saveRegexRule(storage: Storage, blacklist: Blacklist, rule: RegexRule): Promise<Blacklist> {
  const updated = { ...blacklist, regexRules: [...blacklist.regexRules, rule] };
  await saveBlacklist(storage, updated);
  return updated;
}

export async function deleteRegexRule(storage: Storage, blacklist: Blacklist, ruleId: string): Promise<Blacklist> {
  const updated = { ...blacklist, regexRules: blacklist.regexRules.filter(r => r.id !== ruleId) };
  await saveBlacklist(storage, updated);
  return updated;
}

export async function updateRegexRule(storage: Storage, blacklist: Blacklist, ruleId: string, patch: Partial<Pick<RegexRule, 'pattern' | 'field' | 'enabled'>>): Promise<Blacklist> {
  const updated = {
    ...blacklist,
    regexRules: blacklist.regexRules.map(r => r.id === ruleId ? { ...r, ...patch } : r),
  };
  await saveBlacklist(storage, updated);
  return updated;
}

// ─── 黑名单过滤 ─────────────────────────────────────────

export interface ApplyBlacklistResult {
  config: TVBoxConfig;
  removedSites: number;
  removedParses: number;
  removedLives: number;
  removedByRegex: number;
}

export async function applyBlacklist(
  config: TVBoxConfig,
  blacklist: Blacklist,
): Promise<ApplyBlacklistResult> {
  const siteSet = new Set(blacklist.sites);
  const parseSet = new Set(blacklist.parses);
  const liveSet = new Set(blacklist.lives);

  let removedSites = 0;
  let removedParses = 0;
  let removedLives = 0;
  let removedByRegex = 0;

  // 指纹匹配
  let sites = config.sites || [];
  if (siteSet.size > 0) {
    const filtered: TVBoxSite[] = [];
    for (const site of sites) {
      const fp = await siteFingerprint(site);
      if (siteSet.has(fp)) {
        removedSites++;
      } else {
        filtered.push(site);
      }
    }
    sites = filtered;
  }

  // 正则匹配
  const activeRules = blacklist.regexRules.filter(r => r.enabled);
  if (activeRules.length > 0) {
    const overrideSet = new Set(blacklist.regexBlockOverrides);
    for (const rule of activeRules) {
      try {
        const re = new RegExp(rule.pattern, 'i');
        sites = sites.filter(site => {
          const value = String((site as unknown as Record<string, unknown>)[rule.field] || '');
          if (re.test(value) && !overrideSet.has(site.name || '')) {
            removedByRegex++;
            return false;
          }
          return true;
        });
      } catch {
        // skip broken rule at runtime
      }
    }
  }

  // 过滤 parses
  let parses = config.parses || [];
  if (parseSet.size > 0) {
    parses = parses.filter((p) => {
      if (parseSet.has(p.url)) {
        removedParses++;
        return false;
      }
      return true;
    });
  }

  // 过滤 lives
  let lives = config.lives || [];
  if (liveSet.size > 0) {
    lives = lives.filter((l) => {
      const url = l.url || l.api || '';
      if (url && liveSet.has(url)) {
        removedLives++;
        return false;
      }
      return true;
    });
  }

  return {
    config: { ...config, sites, parses, lives },
    removedSites,
    removedParses,
    removedLives,
    removedByRegex,
  };
}

export async function pruneBlacklist(
  blacklist: Blacklist,
  currentConfig: TVBoxConfig,
): Promise<Blacklist> {
  const currentSiteFps = new Set<string>();
  for (const site of currentConfig.sites || []) {
    currentSiteFps.add(await siteFingerprint(site));
  }

  const currentParseUrls = new Set((currentConfig.parses || []).map(p => p.url));
  const currentLiveUrls = new Set(
    (currentConfig.lives || []).map(l => l.url || l.api || '').filter(Boolean),
  );

  const prunedSites = blacklist.sites.filter(fp => currentSiteFps.has(fp));
  const prunedParses = blacklist.parses.filter(url => currentParseUrls.has(url));
  const prunedLives = blacklist.lives.filter(url => currentLiveUrls.has(url));

  const removed =
    (blacklist.sites.length - prunedSites.length) +
    (blacklist.parses.length - prunedParses.length) +
    (blacklist.lives.length - prunedLives.length);

  if (removed > 0) {
    logger.infoFields('blacklist', 'pruned', { removed });
  }

  return { ...blacklist, sites: prunedSites, parses: prunedParses, lives: prunedLives };
}

// ─── 正则测试预览 ────────────────────────────────────────

export interface RegexTestResult {
  matched: Array<{ key: string; name: string; field: string; value: string }>;
}

export function testRegexAgainstSites(sites: TVBoxSite[], pattern: string, field: 'name' | 'api' | 'key'): RegexTestResult {
  const matched: RegexTestResult['matched'] = [];
  try {
    const re = new RegExp(pattern, 'i');
    for (const site of sites) {
      const value = String((site as unknown as Record<string, unknown>)[field] || '');
      if (re.test(value)) {
        matched.push({ key: site.key, name: site.name || site.key, field, value });
      }
    }
  } catch {
    // invalid pattern
  }
  return { matched };
}

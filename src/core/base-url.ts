import type { Context } from 'hono';
import { BASE_URL_PLACEHOLDER } from './config';

export function getRequestBaseUrl(c: Context, fallback: string): string {
  const host = c.req.header('Host');
  if (!host) return fallback;
  const proto = c.req.header('X-Forwarded-Proto')?.split(',')[0].trim() || 'http';
  return `${proto}://${host}`;
}

export function applyBaseUrlPlaceholder(json: string, baseUrl: string): string {
  return json.replaceAll(BASE_URL_PLACEHOLDER, baseUrl);
}

function stripHostPort(host: string): string {
  if (host.startsWith('[')) {
    const closeIdx = host.indexOf(']');
    if (closeIdx === -1) return host;
    return host.substring(1, closeIdx);
  }
  const firstColonIdx = host.indexOf(':');
  if (firstColonIdx === -1) return host;
  if (host.indexOf(':', firstColonIdx + 1) !== -1) return host;
  return host.substring(0, firstColonIdx);
}

export function isLanHost(host: string): boolean {
  const lower = stripHostPort(host).toLowerCase();

  if (lower === 'localhost') return true;

  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const a = Number(ipv4Match[1]);
    const b = Number(ipv4Match[2]);
    if (a > 255 || Number(ipv4Match[3]) > 255 || Number(ipv4Match[4]) > 255) return false;
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  }

  if (lower === '::1') return true;
  if (lower.startsWith('::ffff:')) return false;
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;

  return false;
}

export function assertHostAllowed(actualBase: string, fallback: string, dmzEnabled: boolean): boolean {
  if (actualBase === fallback) return true;
  if (dmzEnabled) return true;
  try {
    return isLanHost(new URL(actualBase).hostname);
  } catch {
    return false;
  }
}

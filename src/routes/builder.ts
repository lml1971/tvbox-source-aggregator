import type { Hono } from 'hono';
import type { Storage } from '../storage/interface';
import type { AppConfig, TVBoxConfig } from '../core/types';
import { KV_MERGED_CONFIG_FULL, KV_SOURCE_MAP } from '../core/config';
import {
  listPresets,
  getPreset,
  createPreset,
  updatePreset,
  deletePreset,
} from '../core/builder-store';
import { exportPresetAsZip } from '../core/builder-export';
import { builderHtml } from '../core/builder-ui';

function verifyAdmin(request: Request, config: AppConfig): boolean {
  const token = config.adminToken;
  if (!token) return false;
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${token}`;
}

export interface BuilderRouteDeps {
  storage: Storage;
  config: AppConfig;
}

function isValidPresetId(id: string): boolean {
  return /^[a-f0-9]{1,32}$/.test(id);
}

export function mountBuilderRoutes(app: Hono, deps: BuilderRouteDeps): void {
  const { storage, config } = deps;

  // GET /builder — 页面
  app.get('/builder', (c) => {
    return c.html(builderHtml);
  });

  // GET /builder/pool — 原料池（含源分组）
  app.get('/builder/pool', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) return c.json({ error: 'Unauthorized' }, 401);

    const configRaw = await storage.get(KV_MERGED_CONFIG_FULL);
    if (!configRaw) return c.json({ error: 'No aggregated config yet' }, 404);

    const tvConfig: TVBoxConfig = JSON.parse(configRaw);
    const sourceMapRaw = await storage.get(KV_SOURCE_MAP);
    const sourceMap = sourceMapRaw
      ? JSON.parse(sourceMapRaw) as { sites: Record<string, string>; parses: Record<string, string>; lives: Record<string, string> }
      : { sites: {}, parses: {}, lives: {} };

    // 按源分组
    const sitesBySource = new Map<string, typeof tvConfig.sites>();
    for (const site of tvConfig.sites || []) {
      const source = sourceMap.sites[site.key] || '_unknown';
      if (!sitesBySource.has(source)) sitesBySource.set(source, []);
      sitesBySource.get(source)!.push(site);
    }

    const parsesBySource = new Map<string, typeof tvConfig.parses>();
    for (const parse of tvConfig.parses || []) {
      const source = sourceMap.parses[parse.url] || '_unknown';
      if (!parsesBySource.has(source)) parsesBySource.set(source, []);
      parsesBySource.get(source)!.push(parse);
    }

    const livesBySource = new Map<string, typeof tvConfig.lives>();
    for (const live of tvConfig.lives || []) {
      const liveId = live.url || live.api || '';
      const source = sourceMap.lives[liveId] || '_unknown';
      if (!livesBySource.has(source)) livesBySource.set(source, []);
      livesBySource.get(source)!.push(live);
    }

    return c.json({
      sites: Object.fromEntries(sitesBySource),
      parses: Object.fromEntries(parsesBySource),
      lives: Object.fromEntries(livesBySource),
      totals: {
        sites: tvConfig.sites?.length || 0,
        parses: tvConfig.parses?.length || 0,
        lives: tvConfig.lives?.length || 0,
      },
    });
  });

  // GET /builder/presets — 列出所有方案
  app.get('/builder/presets', (c) => {
    if (!verifyAdmin(c.req.raw, config)) return c.json({ error: 'Unauthorized' }, 401);
    return c.json(listPresets());
  });

  // POST /builder/presets — 创建方案
  app.post('/builder/presets', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json<{ name: string; description?: string }>();
    if (!body.name) return c.json({ error: 'name is required' }, 400);
    const preset = createPreset(body);
    return c.json(preset, 201);
  });

  // GET /builder/presets/:id — 获取方案
  app.get('/builder/presets/:id', (c) => {
    if (!verifyAdmin(c.req.raw, config)) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    if (!isValidPresetId(id)) return c.json({ error: 'Invalid id' }, 400);
    const preset = getPreset(id);
    if (!preset) return c.json({ error: 'Not found' }, 404);
    return c.json(preset);
  });

  // PUT /builder/presets/:id — 更新方案
  app.put('/builder/presets/:id', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    if (!isValidPresetId(id)) return c.json({ error: 'Invalid id' }, 400);
    const { name, description, sites, parses, lives, exportSettings } = await c.req.json();
    const updated = updatePreset(id, { name, description, sites, parses, lives, exportSettings });
    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json(updated);
  });

  // DELETE /builder/presets/:id — 删除方案
  app.delete('/builder/presets/:id', (c) => {
    if (!verifyAdmin(c.req.raw, config)) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    if (!isValidPresetId(id)) return c.json({ error: 'Invalid id' }, 400);
    const ok = deletePreset(id);
    if (!ok) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true });
  });

  // POST /builder/presets/:id/export — 导出离线包
  app.post('/builder/presets/:id/export', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    if (!isValidPresetId(id)) return c.json({ error: 'Invalid id' }, 400);
    const preset = getPreset(id);
    if (!preset) return c.json({ error: 'Not found' }, 404);

    if (preset.sites.length === 0 && preset.parses.length === 0 && preset.lives.length === 0) {
      return c.json({ error: 'Preset is empty' }, 400);
    }

    const body: { path?: string } = await c.req.json().catch(() => ({}));
    const exportPath = body.path || preset.exportSettings.path || '/sdcard/TVBox/';

    const { buffer, warnings } = await exportPresetAsZip(preset, exportPath);

    c.header('Content-Type', 'application/zip');
    c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(preset.name)}.zip"`);
    if (warnings.length > 0) {
      c.header('X-Export-Warnings', JSON.stringify(warnings));
    }
    return c.body(buffer as unknown as ArrayBuffer);
  });
}

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { TVBoxSite, TVBoxParse, TVBoxLive } from './types';

// ─── Types ───────────────────────────────────────────────────

export interface BuilderSite extends TVBoxSite {
  _source?: string;
  _importedAt?: number;
  _manual?: boolean;
}

export interface BuilderParse extends TVBoxParse {
  _source?: string;
  _importedAt?: number;
  _manual?: boolean;
}

export interface BuilderLive extends TVBoxLive {
  _source?: string;
  _importedAt?: number;
  _manual?: boolean;
}

export interface PresetExportSettings {
  path: string;
  spiderStrategy: 'global' | 'per-site';
}

export interface BuilderPreset {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  sites: BuilderSite[];
  parses: BuilderParse[];
  lives: BuilderLive[];
  exportSettings: PresetExportSettings;
}

export type PresetSummary = Pick<BuilderPreset, 'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'> & {
  siteCount: number;
  parseCount: number;
  liveCount: number;
};

// ─── Store ───────────────────────────────────────────────────

const DATA_DIR = process.env.DATA_DIR || './data';
const PRESETS_DIR = path.join(DATA_DIR, 'presets');

function ensureDir(): void {
  if (!fs.existsSync(PRESETS_DIR)) {
    fs.mkdirSync(PRESETS_DIR, { recursive: true });
  }
}

function isValidId(id: string): boolean {
  return /^[a-f0-9]{1,32}$/.test(id);
}

function presetPath(id: string): string {
  if (!isValidId(id)) throw new Error('Invalid preset id');
  return path.join(PRESETS_DIR, `${id}.json`);
}

function generateId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export function listPresets(): PresetSummary[] {
  ensureDir();
  const files = fs.readdirSync(PRESETS_DIR).filter(f => f.endsWith('.json'));
  const summaries: PresetSummary[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(PRESETS_DIR, file), 'utf-8');
      const preset: BuilderPreset = JSON.parse(raw);
      summaries.push({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt,
        siteCount: preset.sites.length,
        parseCount: preset.parses.length,
        liveCount: preset.lives.length,
      });
    } catch { /* skip corrupted files */ }
  }
  return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPreset(id: string): BuilderPreset | null {
  const fp = presetPath(id);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {
    return null;
  }
}

export function createPreset(data: { name: string; description?: string }): BuilderPreset {
  ensureDir();
  const now = Date.now();
  const preset: BuilderPreset = {
    id: generateId(),
    name: data.name,
    description: data.description,
    createdAt: now,
    updatedAt: now,
    sites: [],
    parses: [],
    lives: [],
    exportSettings: {
      path: '/sdcard/TVBox/',
      spiderStrategy: 'global',
    },
  };
  fs.writeFileSync(presetPath(preset.id), JSON.stringify(preset, null, 2));
  return preset;
}

export function updatePreset(id: string, updates: Partial<Omit<BuilderPreset, 'id' | 'createdAt'>>): BuilderPreset | null {
  const preset = getPreset(id);
  if (!preset) return null;
  const updated: BuilderPreset = {
    ...preset,
    ...updates,
    id: preset.id,
    createdAt: preset.createdAt,
    updatedAt: Date.now(),
  };
  fs.writeFileSync(presetPath(id), JSON.stringify(updated, null, 2));
  return updated;
}

export function deletePreset(id: string): boolean {
  const fp = presetPath(id);
  if (!fs.existsSync(fp)) return false;
  fs.unlinkSync(fp);
  return true;
}

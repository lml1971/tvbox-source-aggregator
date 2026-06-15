import * as fs from 'fs';
import * as path from 'path';
import type { BuilderPreset } from './builder-store';
import type { TVBoxConfig } from './types';
import { urlToKey, parseSpiderString } from './jar-proxy';

// ─── Types ───────────────────────────────────────────────────

export interface ExportResult {
  buffer: Buffer;
  warnings: string[];
}

interface JarEntry {
  url: string;
  key: string;
  filename: string;
}

// ─── Export engine ───────────────────────────────────────────

const DATA_DIR = process.env.DATA_DIR || './data';
const JAR_CACHE_DIR = path.join(DATA_DIR, 'jars');

export async function exportPresetAsZip(
  preset: BuilderPreset,
  exportPath: string,
): Promise<ExportResult> {
  const warnings: string[] = [];

  // 1. Collect JAR dependencies
  const jarUrls = new Map<string, string>(); // url → original full spider string (with ;md5;)
  const spiderVotes = new Map<string, number>(); // jarUrl → count of type:3 sites

  for (const site of preset.sites) {
    if (site.type === 3) {
      const jarField = site.jar || '';
      if (jarField) {
        const parsed = parseSpiderString(jarField);
        if (parsed.url) {
          jarUrls.set(parsed.url, jarField);
          spiderVotes.set(parsed.url, (spiderVotes.get(parsed.url) || 0) + 1);
        }
      }
    }
  }

  // Determine global spider (most referenced JAR)
  let globalSpiderUrl: string | null = null;
  let globalSpiderFull: string | null = null;
  if (preset.exportSettings.spiderStrategy === 'global' && spiderVotes.size > 0) {
    let maxCount = 0;
    for (const [url, count] of spiderVotes) {
      if (count > maxCount) { maxCount = count; globalSpiderUrl = url; }
    }
    if (globalSpiderUrl) {
      globalSpiderFull = jarUrls.get(globalSpiderUrl) || globalSpiderUrl;
    }
  }

  // 2. Resolve JAR keys and filenames
  const jarEntries: JarEntry[] = [];
  for (const [url, fullStr] of jarUrls) {
    const key = await urlToKey(url);
    jarEntries.push({ url, key, filename: `${key}.jar` });
  }

  // 3. Download/fetch JARs
  const jarBuffers = new Map<string, Buffer>();
  for (const entry of jarEntries) {
    const cached = path.join(JAR_CACHE_DIR, `${entry.key}.jar`);
    if (fs.existsSync(cached)) {
      jarBuffers.set(entry.key, fs.readFileSync(cached));
    } else {
      try {
        const res = await fetch(entry.url, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        jarBuffers.set(entry.key, buf);
        // Also cache for future use
        if (!fs.existsSync(JAR_CACHE_DIR)) fs.mkdirSync(JAR_CACHE_DIR, { recursive: true });
        fs.writeFileSync(cached, buf);
      } catch (e: any) {
        warnings.push(`JAR download failed: ${entry.url} — ${e.message}`);
      }
    }
  }

  // 4. Generate config.json
  const normPath = exportPath.endsWith('/') ? exportPath : exportPath + '/';

  const config: TVBoxConfig = {
    sites: preset.sites.map(s => {
      const clean = stripMeta(s);
      if (clean.type === 3 && clean.jar) {
        const parsed = parseSpiderString(clean.jar);
        if (parsed.url) {
          const entry = jarEntries.find(e => e.url === parsed.url);
          if (entry && jarBuffers.has(entry.key)) {
            if (globalSpiderUrl === parsed.url && preset.exportSettings.spiderStrategy === 'global') {
              delete clean.jar;
            } else {
              clean.jar = `file://${normPath}jars/${entry.filename}`;
              if (parsed.md5) clean.jar += `;md5;${parsed.md5}`;
            }
          }
        }
      }
      return clean;
    }),
    parses: preset.parses.map(stripMeta),
    lives: preset.lives.map(stripMeta),
  };

  // Set global spider
  if (globalSpiderUrl && globalSpiderFull) {
    const entry = jarEntries.find(e => e.url === globalSpiderUrl);
    if (entry && jarBuffers.has(entry.key)) {
      const parsed = parseSpiderString(globalSpiderFull);
      config.spider = `file://${normPath}jars/${entry.filename}`;
      if (parsed.md5) config.spider += `;md5;${parsed.md5}`;
    }
  }

  const configJson = JSON.stringify(config, null, 2);

  // 5. Build ZIP
  const zipFiles: Array<{ name: string; data: Buffer }> = [];
  zipFiles.push({ name: 'config.json', data: Buffer.from(configJson, 'utf-8') });

  for (const entry of jarEntries) {
    const buf = jarBuffers.get(entry.key);
    if (buf) {
      zipFiles.push({ name: `jars/${entry.filename}`, data: buf });
    }
  }

  const buffer = buildZip(zipFiles);
  return { buffer, warnings };
}

// ─── Strip internal metadata from exported items ────────────

function stripMeta<T extends Record<string, any>>(item: T): T {
  const copy = { ...item };
  delete copy._source;
  delete copy._importedAt;
  delete copy._manual;
  return copy;
}

// ─── Minimal ZIP builder (STORE method, no compression) ─────

interface ZipFileEntry {
  name: string;
  data: Buffer;
}

function buildZip(files: ZipFileEntry[]): Buffer {
  const parts: Buffer[] = [];
  const centralDir: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf-8');
    const crc = crc32(file.data);
    const size = file.data.length;

    // Local file header (30 bytes + name)
    const local = Buffer.alloc(30 + nameBuffer.length);
    local.writeUInt32LE(0x04034b50, 0);  // signature
    local.writeUInt16LE(20, 4);           // version needed
    local.writeUInt16LE(0, 6);            // flags
    local.writeUInt16LE(0, 8);            // compression: STORE
    local.writeUInt16LE(0, 10);           // mod time
    local.writeUInt16LE(0, 12);           // mod date
    local.writeUInt32LE(crc, 14);         // crc32
    local.writeUInt32LE(size, 18);        // compressed size
    local.writeUInt32LE(size, 22);        // uncompressed size
    local.writeUInt16LE(nameBuffer.length, 26); // filename length
    local.writeUInt16LE(0, 28);           // extra field length
    nameBuffer.copy(local, 30);

    parts.push(local);
    parts.push(file.data);

    // Central directory entry (46 bytes + name)
    const central = Buffer.alloc(46 + nameBuffer.length);
    central.writeUInt32LE(0x02014b50, 0);  // signature
    central.writeUInt16LE(20, 4);           // version made by
    central.writeUInt16LE(20, 6);           // version needed
    central.writeUInt16LE(0, 8);            // flags
    central.writeUInt16LE(0, 10);           // compression: STORE
    central.writeUInt16LE(0, 12);           // mod time
    central.writeUInt16LE(0, 14);           // mod date
    central.writeUInt32LE(crc, 16);         // crc32
    central.writeUInt32LE(size, 20);        // compressed size
    central.writeUInt32LE(size, 24);        // uncompressed size
    central.writeUInt16LE(nameBuffer.length, 28); // filename length
    central.writeUInt16LE(0, 30);           // extra field length
    central.writeUInt16LE(0, 32);           // comment length
    central.writeUInt16LE(0, 34);           // disk start
    central.writeUInt16LE(0, 36);           // internal attrs
    central.writeUInt32LE(0, 38);           // external attrs
    central.writeUInt32LE(offset, 42);      // local header offset
    nameBuffer.copy(central, 46);

    centralDir.push(central);
    offset += local.length + file.data.length;
  }

  const centralDirBuffer = Buffer.concat(centralDir);
  const centralDirOffset = offset;

  // End of central directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);     // signature
  eocd.writeUInt16LE(0, 4);              // disk number
  eocd.writeUInt16LE(0, 6);              // central dir disk
  eocd.writeUInt16LE(files.length, 8);   // entries on disk
  eocd.writeUInt16LE(files.length, 10);  // total entries
  eocd.writeUInt32LE(centralDirBuffer.length, 12); // central dir size
  eocd.writeUInt32LE(centralDirOffset, 16);        // central dir offset
  eocd.writeUInt16LE(0, 20);             // comment length

  parts.push(centralDirBuffer);
  parts.push(eocd);

  return Buffer.concat(parts);
}

// ─── CRC32 ──────────────────────────────────────────────────

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

#!/usr/bin/env node

const { build } = require('esbuild');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const pkg = require(path.join(__dirname, '..', 'package.json'));
let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim(); } catch {}

build({
  entryPoints: [path.join(__dirname, '..', 'src', 'node-entry.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: path.join(__dirname, '..', 'dist', 'server.js'),
  format: 'cjs',
  external: ['better-sqlite3'],
  sourcemap: true,
  define: {
    '__APP_VERSION__': JSON.stringify(pkg.version),
    '__APP_COMMIT__': JSON.stringify(commit),
  },
}).then(() => {
  // Copy static fonts to dist
  const srcFonts = path.join(__dirname, '..', 'src', 'static', 'fonts');
  const dstFonts = path.join(__dirname, '..', 'dist', 'static', 'fonts');
  if (fs.existsSync(srcFonts)) {
    fs.mkdirSync(dstFonts, { recursive: true });
    const fontFiles = fs.readdirSync(srcFonts).filter(f => f.endsWith('.woff2'));
    for (const file of fontFiles) {
      fs.copyFileSync(path.join(srcFonts, file), path.join(dstFonts, file));
    }
    console.log(`Copied ${fontFiles.length} font files to dist/static/fonts/`);
  }
  console.log('Build complete: dist/server.js');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

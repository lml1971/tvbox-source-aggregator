#!/usr/bin/env node

// APK 业务层构建：把 dist/server.js + static + main.js 组装进 android 的 nodejs-project，
// 供 nodejs-mobile 在 APK 内运行。Docker/CF 链不受影响。
//
// 流程：build:node（复用 esbuild）→ 清空 nodejs-project → 拷贝产物 → 断言无原生模块。

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const TEMPLATE = path.join(ROOT, 'android', 'nodejs-project-template');
const TARGET = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'nodejs-project');

function log(msg) {
  console.log(`[build-apk] ${msg}`);
}

// 1. 复用现有 esbuild 构建（产出 dist/server.js + dist/static/fonts）
log('Running build:node (esbuild)...');
execSync('node scripts/build.js', { cwd: ROOT, stdio: 'inherit' });

const serverJs = path.join(DIST, 'server.js');
if (!fs.existsSync(serverJs)) {
  console.error('[build-apk] ERROR: dist/server.js not found after build');
  process.exit(1);
}

// 2. 清空并重建 nodejs-project（完全是构建产物，gitignore）
log(`Resetting ${path.relative(ROOT, TARGET)}`);
fs.rmSync(TARGET, { recursive: true, force: true });
fs.mkdirSync(TARGET, { recursive: true });

// 3. 拷贝 server.js（不拷 sourcemap，避免进 APK 体积）
fs.copyFileSync(serverJs, path.join(TARGET, 'server.js'));
log('Copied server.js');

// 4. 拷贝 static/（字体等，server.js 用 __dirname 解析，必须与 server.js 同级）
const distStatic = path.join(DIST, 'static');
if (fs.existsSync(distStatic)) {
  fs.cpSync(distStatic, path.join(TARGET, 'static'), { recursive: true });
  log('Copied static/');
} else {
  log('WARN: dist/static not found (fonts may 404)');
}

// 5. 拷贝模板（main.js 薄启动器等）
if (!fs.existsSync(path.join(TEMPLATE, 'main.js'))) {
  console.error('[build-apk] ERROR: template main.js not found');
  process.exit(1);
}
fs.cpSync(TEMPLATE, TARGET, { recursive: true });
log('Copied template (main.js)');

// 6. 断言：不得含原生模块或 better-sqlite3（否则 APK 会崩或体积暴涨）
const offenders = [];
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'better-sqlite3') offenders.push(path.relative(TARGET, full));
      scan(full);
    } else if (entry.name.endsWith('.node')) {
      offenders.push(path.relative(TARGET, full));
    }
  }
}
scan(TARGET);
if (offenders.length > 0) {
  console.error('[build-apk] ERROR: native modules / better-sqlite3 leaked into nodejs-project:');
  offenders.forEach((o) => console.error(`  - ${o}`));
  process.exit(1);
}

// 6b. 验证 JSON 降级链完好：esbuild 把 better-sqlite3 设为 external，server.js 必须保留
//     运行时 require('better-sqlite3') 调用 —— APK 内无此模块时才会抛错被 catch → 降级 JSON。
//     若它被误 inline（external 失效），APK 里会缺失原生绑定且降级路径断裂。
const serverSrc = fs.readFileSync(path.join(TARGET, 'server.js'), 'utf8');
// 精确匹配 require("better-sqlite3") 调用点，而非字符串碰巧出现（sourcemap/错误信息等）
if (!/require\(["']better-sqlite3["']\)/.test(serverSrc)) {
  console.error('[build-apk] ERROR: server.js 未保留 require("better-sqlite3") external 调用，JSON 降级链可能已失效');
  process.exit(1);
}

log('Assertion passed: no *.node leaked + better-sqlite3 stays external (JSON 降级链完好)');
log(`Done. nodejs-project ready at ${path.relative(ROOT, TARGET)}`);
log('Next: cd android && ./gradlew assembleRelease');

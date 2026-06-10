// 薄启动器（nodejs-mobile 入口）
//
// Android 壳通过 startNodeWithArguments(["node","main.js","--key=value",...]) 拉起本文件。
// nodejs-mobile 环境没有 .env、cwd 不稳定，所有运行时配置都在这里从启动参数注入 process.env，
// 再加载真正的聚合器 bundle（server.js，由 build:apk 从 dist/server.js 拷入，与本文件同级）。
//
// 注意：server.js 内部用 __dirname 解析 static 资源（字体等），因此 server.js / static 必须与 main.js 同级。

const path = require('path');

// 解析 --key=value 形式的启动参数
for (const arg of process.argv.slice(2)) {
  const m = /^--([^=]+)=(.*)$/.exec(arg);
  if (!m) continue;
  const key = m[1];
  const value = m[2];
  switch (key) {
    case 'port':            process.env.PORT = value; break;
    case 'data-dir':        process.env.DATA_DIR = value; break;
    case 'base-url':        process.env.BASE_URL = value; break;
    case 'admin-token':     process.env.ADMIN_TOKEN = value; break;
    case 'refresh-token':   process.env.REFRESH_TOKEN = value; break;
    case 'scrape-url':      process.env.SCRAPE_SOURCE_URL = value; break;
    case 'scrape-referer':  process.env.SCRAPE_SOURCE_REFERER = value; break;
    default: break;
  }
}

// 加载聚合器主体。better-sqlite3 未打包 → server.js 内部 require 失败 → 自动降级 JSON file 存储。
require(path.join(__dirname, 'server.js'));

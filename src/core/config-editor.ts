import { sharedStyles } from './shared-styles';
import { sharedUi } from './shared-ui';

export const configEditorHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TVBox Aggregator - Config Editor</title>
<style>
${sharedStyles}

/* Config Editor specific */
.container{max-width:960px}

/* Group */
.group{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  margin-bottom:12px;
  overflow:hidden;
}

.group-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:12px 16px;
  cursor:pointer;
  user-select:none;
  transition:background 0.2s;
}

.group-header:hover{background:var(--surface-2)}

.group-title{
  flex:1;
  font-family:var(--mono);
  font-size:0.8rem;
  font-weight:600;
  color:var(--text-bright);
  display:flex;
  align-items:center;
  gap:8px;
}

.group-title .count{
  font-size:0.65rem;
  font-weight:400;
  color:var(--text-dim);
  padding:2px 8px;
  background:var(--surface-2);
  border-radius:10px;
}

.group-arrow{
  font-size:0.7rem;
  color:var(--text-dim);
  transition:transform 0.2s;
}

.group.open .group-arrow{transform:rotate(90deg)}

.group-body{
  display:none;
  border-top:1px solid var(--border);
}

.group.open .group-body{display:block}

/* Item row */
.item{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 16px;
  border-bottom:1px solid var(--border);
  transition:background 0.15s;
  font-family:var(--mono);
  font-size:0.75rem;
}

.item:last-child{border-bottom:none}
.item:hover{background:var(--surface-2)}

.item.blocked{opacity:0.4}

.item-name{
  flex:1;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:var(--text-bright);
  font-weight:500;
}

.item.blocked .item-name{
  text-decoration:line-through;
  color:var(--text-dim);
}

.item-type{
  position:relative;
  font-size:0.6rem;
  padding:2px 8px;
  border-radius:4px;
  font-weight:600;
  letter-spacing:0.05em;
  text-transform:uppercase;
  cursor:help;
  white-space:nowrap;
}

.item-type.t0{background:var(--blue-dim);color:var(--blue)}
.item-type.t1{background:var(--green-dim);color:var(--green)}
.item-type.t3{background:var(--amber-dim);color:var(--amber)}
.item-type.t4{background:var(--red-dim);color:var(--red)}

/* Tooltip */
.tooltip{
  position:absolute;
  bottom:calc(100% + 8px);
  left:50%;
  transform:translateX(-50%);
  background:var(--surface);
  border:1px solid var(--border-glow);
  border-radius:6px;
  padding:8px 12px;
  font-family:var(--sans);
  font-size:0.75rem;
  font-weight:400;
  color:var(--text);
  white-space:nowrap;
  pointer-events:none;
  opacity:0;
  transition:opacity 0.15s;
  z-index:100;
  text-transform:none;
  letter-spacing:0;
  box-shadow:0 4px 12px rgba(0,0,0,0.3);
}

.tooltip::after{
  content:'';
  position:absolute;
  top:100%;
  left:50%;
  transform:translateX(-50%);
  border:5px solid transparent;
  border-top-color:var(--border-glow);
}

.item-type:hover .tooltip{opacity:1}

.item-api{
  max-width:200px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:var(--text-dim);
  font-size:0.65rem;
}

.item-actions{
  display:flex;
  gap:6px;
  flex-shrink:0;
}

/* Flat list (for parses / lives) */
.flat-list{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  overflow:hidden;
}

/* Stats bar */
.stats{
  display:flex;
  gap:16px;
  margin-bottom:20px;
  font-family:var(--mono);
  font-size:0.7rem;
  color:var(--text-dim);
}

.stats .stat{
  display:flex;
  align-items:center;
  gap:4px;
}

.stats .num{
  color:var(--green);
  font-weight:600;
}

.stats .blocked-num{
  color:var(--red);
  font-weight:600;
}

/* Loading */
.loading-msg{
  text-align:center;
  padding:60px 20px;
  font-family:var(--mono);
  font-size:0.8rem;
  color:var(--text-dim);
}

/* Checkbox */
.item-check,.group-check{
  width:14px;
  height:14px;
  accent-color:var(--green);
  cursor:pointer;
  flex-shrink:0;
}
.group-check{margin-right:4px}
.item.blocked .item-check{display:none}

/* Batch bar */
.batch-bar{
  position:fixed;
  bottom:24px;
  left:50%;
  transform:translateX(-50%);
  background:var(--surface);
  border:1px solid var(--green-dim);
  border-radius:8px;
  padding:10px 20px;
  display:flex;
  align-items:center;
  gap:12px;
  font-family:var(--mono);
  font-size:0.75rem;
  color:var(--text);
  box-shadow:0 4px 16px rgba(0,0,0,0.4);
  z-index:50;
}
.batch-count{color:var(--green);font-weight:600}

.footer{margin-top:48px;padding-top:24px}
</style>
<script>(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)})()</script>
</head>
<body style="opacity:0">

<!-- Login -->
<div class="login-overlay" id="loginOverlay">
  <div class="login-box">
    <h2 data-i18n="loginTitle">Config Editor</h2>
    <p data-i18n="loginSubtitle">Enter admin token</p>
    <div class="error-msg" id="loginError" data-i18n="invalidToken">Invalid token</div>
    <input type="password" id="tokenInput" data-i18n-placeholder="tokenPh" placeholder="Admin Token" autofocus>
    <button class="btn" style="width:100%" data-i18n="login" onclick="auth.doLogin()">Login</button>
  </div>
</div>

<!-- Main -->
<div class="container" id="mainContent" style="display:none">
  <header class="header">
    <div class="header-top">
      <div class="header-label" data-i18n="headerLabel">Config Editor</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span id="themeDropdown"></span>
        <button class="lang-toggle" id="langToggle" onclick="doToggleLang()">EN</button>
      </div>
    </div>
    <h1 class="header-title">TVBox <span>Config</span></h1>
    <div class="header-nav">
      <a href="/admin" data-i18n="navAdmin">Admin</a>
      <a href="/builder">Builder</a>
      <a href="/status" data-i18n="navDashboard">Dashboard</a>
    </div>
  </header>

  <!-- Tabs -->
  <div class="tabs">
    <div class="tab active" data-tab="sites" onclick="switchTab('sites')"><span data-i18n="sites">Sites</span> <span class="badge" id="badgeSites">0</span></div>
    <div class="tab" data-tab="parses" onclick="switchTab('parses')"><span data-i18n="parses">Parses</span> <span class="badge" id="badgeParses">0</span></div>
    <div class="tab" data-tab="lives" onclick="switchTab('lives')"><span data-i18n="lives">Lives</span> <span class="badge" id="badgeLives">0</span></div>
    <div class="tab" data-tab="regex" onclick="switchTab('regex')"><span data-i18n="regexTab">Regex Rules</span> <span class="badge" id="badgeRegex">0</span></div>
  </div>

  <!-- Search -->
  <div class="search-bar">
    <input type="text" id="searchInput" data-i18n-placeholder="searchPh" placeholder="搜索名称、API、URL..." oninput="doSearch()">
  </div>

  <!-- Stats -->
  <div class="stats" id="statsBar"></div>

  <!-- Sites panel -->
  <div class="tab-panel active" id="panelSites">
    <div class="loading-msg" id="loadingSites" data-i18n="loading">加载中...</div>
  </div>

  <!-- Parses panel -->
  <div class="tab-panel" id="panelParses">
    <div class="loading-msg" id="loadingParses" data-i18n="loading">加载中...</div>
  </div>

  <!-- Lives panel -->
  <div class="tab-panel" id="panelLives">
    <div class="loading-msg" id="loadingLives" data-i18n="loading">加载中...</div>
  </div>

  <!-- Regex Rules panel -->
  <div class="tab-panel" id="panelRegex">
    <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input type="text" id="regexPattern" class="search-bar-input" placeholder="Regex pattern (e.g. 测试|广告)" style="flex:1;min-width:180px;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-family:var(--mono);font-size:0.85rem">
      <select id="regexField" style="padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:0.85rem">
        <option value="name">name</option>
        <option value="api">api</option>
        <option value="key">key</option>
      </select>
      <button class="btn" onclick="addRegexRule()" style="padding:8px 16px">Add</button>
      <button class="btn secondary" onclick="testRegexRule()" style="padding:8px 16px">Test</button>
    </div>
    <div id="regexTestResult" style="font-size:0.85rem;margin-bottom:12px;color:var(--text-dim);display:none"></div>
    <div id="regexRulesList"></div>
    <div class="loading-msg" id="loadingRegex" style="display:none">No regex rules configured</div>
  </div>

  <div class="footer">
    <span data-i18n="footer">TVBox Config Editor &middot; Blacklisted items are excluded from aggregated output</span>
  </div>
</div>

<div class="batch-bar" id="batchBar" style="display:none">
  <span><span class="batch-count" id="batchCount">0</span> <span data-i18n="batchSelected">selected</span></span>
  <button class="btn sm danger" onclick="batchBlock()" data-i18n="batchBlock">Batch Block</button>
  <button class="btn sm secondary" onclick="clearSelection()" data-i18n="batchCancel">Cancel</button>
</div>

<script>
${sharedUi}

// --- i18n ---
const _translations = {
  en: {
    loginTitle:'Config Editor', loginSubtitle:'Enter admin token',
    invalidToken:'Invalid token', tokenPh:'Admin Token', login:'Login',
    networkError:'Network error',
    headerLabel:'Config Editor', navAdmin:'Admin', navConfigEditor:'Config Editor', navDashboard:'Dashboard',
    searchPh:'Search name, API, URL...', loading:'Loading...',
    available:'Available:', blocked:'Blocked:',
    sites:'sites', parses:'parses', lives:'lives',
    restore:'Restore', block:'Block',
    groupOther:'Other', groupRemotePrefix:'Remote: ', groupRemote:'Remote',
    siteType0:'XML site: fetches video data via XML API',
    siteType1:'JSON site (MacCMS): fetches video data via JSON API',
    siteType3:'JAR plugin: fetches data via Java spider plugin, requires spider package',
    siteType4:'Remote site: uses remotely configured site',
    parseType0:'Sniffer parse: extracts video URL by sniffing web pages',
    parseType1:'JSON parse: returns video URL in JSON format directly',
    parseType2:'JSON extended parse: JSON parse with extra parameters',
    parseType3:'Aggregated parse: combines results from multiple parsers',
    parseType4:'Super parse: advanced composite parse mode',
    liveType0:'Live source: M3U/TXT format channel list file',
    liveType3:'Live plugin: fetches channels via JAR/Python plugin',
    selectAll:'Select all',
    batchBlock:'Batch Block', batchSelected:'selected', batchCancel:'Cancel',
    typePrefix:'Type ',
    regexTab:'Regex Rules',
    regexDelete:'Delete', regexNoRules:'No regex rules. Add a pattern above to auto-block matching sites.',
    regexMatches:' sites would be blocked: ', regexNoMatch:'No matches found', regexError:'Error: ',
    regexTesting:'Testing...',
    footer:'TVBox Config Editor &middot; Blacklisted items are excluded from aggregated output',
  },
  zh: {
    loginTitle:'配置编辑器', loginSubtitle:'请输入管理令牌',
    invalidToken:'无效的令牌', tokenPh:'管理令牌', login:'登录',
    networkError:'网络错误',
    headerLabel:'配置编辑器', navAdmin:'管理', navDashboard:'仪表盘',
    searchPh:'搜索名称、API、URL...', loading:'加载中...',
    available:'可用:', blocked:'已屏蔽:',
    sites:'站点', parses:'解析', lives:'直播',
    restore:'恢复', block:'屏蔽',
    groupOther:'其他', groupRemotePrefix:'远程: ', groupRemote:'远程源',
    siteType0:'XML 站点：通过 XML 接口获取影视数据',
    siteType1:'JSON 站点（MacCMS）：通过 JSON API 获取影视数据',
    siteType3:'JAR 插件：通过 Java 爬虫插件获取数据，需要 spider 包',
    siteType4:'远程站点：使用远程配置的站点',
    parseType0:'嗅探解析：通过网页嗅探提取视频地址',
    parseType1:'JSON 解析：直接返回 JSON 格式的视频地址',
    parseType2:'JSON 扩展解析：带扩展参数的 JSON 解析',
    parseType3:'聚合解析：合并多个解析接口的结果',
    parseType4:'超级解析：高级复合解析模式',
    liveType0:'直播源：M3U/TXT 格式的频道列表文件',
    liveType3:'直播插件：通过 JAR/Python 插件获取频道',
    selectAll:'全选',
    batchBlock:'批量屏蔽', batchSelected:'已选', batchCancel:'取消',
    typePrefix:'类型 ',
    regexTab:'正则规则',
    regexDelete:'删除', regexNoRules:'暂无正则规则，在上方添加规则可批量自动屏蔽匹配的站点',
    regexMatches:'个站点将被屏蔽：', regexNoMatch:'未匹配到任何站点', regexError:'错误：',
    regexTesting:'测试中...',
    footer:'TVBox 配置编辑器 &middot; 被屏蔽的项目不会出现在聚合输出中',
  }
};

function _t(key) { const l = getLang(); return _translations[l]?.[key] || _translations.en[key] || key; }

function doToggleLang() {
  const next = getLang() === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', next);
  applyLang(_translations, next);
  if (DATA) render();
}

let TOKEN = '';
let DATA = null;
let CURRENT_TAB = 'sites';

const auth = initAuth('tokenInput', 'loginError', 'loginOverlay', 'mainContent', '/admin/config-data', function() {
  TOKEN = auth.getToken();
  loadData();
});

const SITE_TYPE_TIPS = {
  0: () => _t('siteType0'),
  1: () => _t('siteType1'),
  3: () => _t('siteType3'),
  4: () => _t('siteType4'),
};

const PARSE_TYPE_TIPS = {
  0: () => _t('parseType0'),
  1: () => _t('parseType1'),
  2: () => _t('parseType2'),
  3: () => _t('parseType3'),
  4: () => _t('parseType4'),
};

const LIVE_TYPE_TIPS = {
  0: () => _t('liveType0'),
  3: () => _t('liveType3'),
};

function groupSites(sites) {
  const groups = new Map();
  for (const s of sites) {
    const api = s.api || '';
    let group = _t('groupOther');
    if (api.startsWith('csp_') || api.startsWith('py_') || api.startsWith('js_')) {
      group = api;
    } else if (api.startsWith('http')) {
      try { group = _t('groupRemotePrefix') + new URL(api).hostname; } catch { group = _t('groupRemote'); }
    }
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(s);
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

async function loadData() {
  try {
    const res = await fetch('/admin/config-data', {
      headers: { 'Authorization': 'Bearer ' + TOKEN }
    });
    if (res.status === 401) {
      $('loginError').style.display = 'block';
      return;
    }
    DATA = await res.json();
    $('loginOverlay').style.display = 'none';
    $('mainContent').style.display = 'block';
    render();
  } catch (e) {
    $('loginError').textContent = _t('networkError');
    $('loginError').style.display = 'block';
  }
}

function switchTab(tab) {
  CURRENT_TAB = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel' + tab.charAt(0).toUpperCase() + tab.slice(1)));
  $('searchInput').value = '';
  doSearch();
  updateBatchBar();
}

function render() {
  if (!DATA) return;
  $('badgeSites').textContent = DATA.sites.length;
  $('badgeParses').textContent = DATA.parses.length;
  $('badgeLives').textContent = DATA.lives.length;
  renderSites();
  renderParses();
  renderLives();
  updateStats();
  updateBatchBar();
}

function updateStats() {
  if (!DATA) return;
  const bs = DATA.sites.filter(s => s.blocked).length;
  const bp = DATA.parses.filter(p => p.blocked).length;
  const bl = DATA.lives.filter(l => l.blocked).length;
  $('statsBar').innerHTML =
    '<div class="stat">' + _t('available') + ' <span class="num">' + (DATA.sites.length - bs) + '</span> ' + _t('sites') + ', '
    + '<span class="num">' + (DATA.parses.length - bp) + '</span> ' + _t('parses') + ', '
    + '<span class="num">' + (DATA.lives.length - bl) + '</span> ' + _t('lives') + '</div>'
    + (bs + bp + bl > 0 ? '<div class="stat">' + _t('blocked') + ' <span class="blocked-num">' + (bs + bp + bl) + '</span></div>' : '');
}

function typeSpan(type, tips) {
  const t = type ?? 0;
  const tipFn = tips[t];
  const tip = tipFn ? tipFn() : _t('typePrefix') + t;
  return '<span class="item-type t' + t + '">T' + t + '<span class="tooltip">' + tip + '</span></span>';
}

function renderSites() {
  const container = $('panelSites');
  const groups = groupSites(DATA.sites);
  let html = '';
  for (const [groupName, sites] of groups) {
    const hasUnblocked = sites.some(s => !s.blocked);
    html += '<div class="group" data-group="' + groupName + '">'
      + '<div class="group-header" onclick="toggleGroup(this)">'
      + (hasUnblocked ? '<input type="checkbox" class="group-check" onclick="event.stopPropagation();toggleGroupSelect(this)" title="' + _t('selectAll') + '">' : '')
      + '<div class="group-title">' + esc(groupName) + ' <span class="count">' + sites.length + '</span></div>'
      + '<span class="group-arrow">&#9654;</span>'
      + '</div>'
      + '<div class="group-body">';
    for (const s of sites) {
      html += siteRow(s);
    }
    html += '</div></div>';
  }
  container.innerHTML = html;
}

function siteRow(s) {
  const cls = s.blocked ? 'item blocked' : 'item';
  const check = s.blocked ? '' : '<input type="checkbox" class="item-check" onchange="updateBatchBar()">';
  const btn = s.blocked
    ? '<button class="btn sm secondary" onclick="unblock(\\'sites\\',\\'' + s.fingerprint + '\\')">' + _t('restore') + '</button>'
    : '<button class="btn sm danger" onclick="block(\\'sites\\',\\'' + s.fingerprint + '\\')">' + _t('block') + '</button>';
  return '<div class="' + cls + '" data-id="' + esc(s.fingerprint) + '" data-type="sites" data-search="' + esc((s.name||'') + ' ' + s.key + ' ' + s.api) + '">'
    + check
    + '<span class="item-name" title="' + esc(s.key) + '">' + esc(s.name || s.key) + '</span>'
    + typeSpan(s.type, SITE_TYPE_TIPS)
    + '<span class="item-api" title="' + esc(s.api) + '">' + esc(s.api) + '</span>'
    + '<span class="item-actions">' + btn + '</span>'
    + '</div>';
}

function renderParses() {
  const container = $('panelParses');
  let html = '<div class="flat-list">';
  for (const p of DATA.parses) {
    html += parseRow(p);
  }
  html += '</div>';
  container.innerHTML = html;
}

function parseRow(p) {
  const cls = p.blocked ? 'item blocked' : 'item';
  const id = p.url;
  const check = p.blocked ? '' : '<input type="checkbox" class="item-check" onchange="updateBatchBar()">';
  const btn = p.blocked
    ? '<button class="btn sm secondary" onclick="unblock(\\'parses\\',\\'' + esc(id) + '\\')">' + _t('restore') + '</button>'
    : '<button class="btn sm danger" onclick="block(\\'parses\\',\\'' + esc(id) + '\\')">' + _t('block') + '</button>';
  return '<div class="' + cls + '" data-id="' + esc(id) + '" data-type="parses" data-search="' + esc((p.name||'') + ' ' + p.url) + '">'
    + check
    + '<span class="item-name">' + esc(p.name) + '</span>'
    + typeSpan(p.type, PARSE_TYPE_TIPS)
    + '<span class="item-api" title="' + esc(p.url) + '">' + esc(p.url) + '</span>'
    + '<span class="item-actions">' + btn + '</span>'
    + '</div>';
}

function renderLives() {
  const container = $('panelLives');
  let html = '<div class="flat-list">';
  for (const l of DATA.lives) {
    html += liveRow(l);
  }
  html += '</div>';
  container.innerHTML = html;
}

function liveRow(l) {
  const url = l.url || l.api || '';
  const cls = l.blocked ? 'item blocked' : 'item';
  const check = (l.blocked || !url) ? '' : '<input type="checkbox" class="item-check" onchange="updateBatchBar()">';
  const btn = url
    ? (l.blocked
      ? '<button class="btn sm secondary" onclick="unblock(\\'lives\\',\\'' + esc(url) + '\\')">' + _t('restore') + '</button>'
      : '<button class="btn sm danger" onclick="block(\\'lives\\',\\'' + esc(url) + '\\')">' + _t('block') + '</button>')
    : '';
  return '<div class="' + cls + '" data-id="' + esc(url) + '" data-type="lives" data-search="' + esc((l.name||'') + ' ' + url) + '">'
    + check
    + '<span class="item-name">' + esc(l.name || '(unnamed)') + '</span>'
    + typeSpan(l.type, LIVE_TYPE_TIPS)
    + '<span class="item-api" title="' + esc(url) + '">' + esc(url) + '</span>'
    + '<span class="item-actions">' + btn + '</span>'
    + '</div>';
}

function toggleGroup(el) {
  el.parentElement.classList.toggle('open');
}

function doSearch() {
  const q = $('searchInput').value.toLowerCase().trim();
  const panel = document.querySelector('.tab-panel.active');
  if (!panel) return;
  panel.querySelectorAll('.item').forEach(item => {
    const text = (item.dataset.search || '').toLowerCase();
    item.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
  panel.querySelectorAll('.group').forEach(g => {
    const visible = g.querySelectorAll('.item:not([style*="display: none"])').length;
    g.style.display = visible > 0 ? '' : 'none';
  });
}

async function block(type, id) {
  try {
    const res = await fetch('/admin/blacklist', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id })
    });
    if (!res.ok) { alert('Failed: ' + (await res.json()).error); return; }
    if (type === 'sites') {
      const s = DATA.sites.find(s => s.fingerprint === id);
      if (s) s.blocked = true;
    } else if (type === 'parses') {
      const p = DATA.parses.find(p => p.url === id);
      if (p) p.blocked = true;
    } else if (type === 'lives') {
      const l = DATA.lives.find(l => (l.url || l.api || '') === id);
      if (l) l.blocked = true;
    }
    updateItemDom(type, id, true);
    updateStats();
    updateBatchBar();
  } catch (e) { alert('Network error'); }
}

async function unblock(type, id) {
  try {
    const res = await fetch('/admin/blacklist', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id })
    });
    if (!res.ok) { alert('Failed: ' + (await res.json()).error); return; }
    if (type === 'sites') {
      const s = DATA.sites.find(s => s.fingerprint === id);
      if (s) s.blocked = false;
    } else if (type === 'parses') {
      const p = DATA.parses.find(p => p.url === id);
      if (p) p.blocked = false;
    } else if (type === 'lives') {
      const l = DATA.lives.find(l => (l.url || l.api || '') === id);
      if (l) l.blocked = false;
    }
    updateItemDom(type, id, false);
    updateStats();
  } catch (e) { alert('Network error'); }
}

function updateItemDom(type, id, blocked) {
  const panel = type === 'sites' ? 'panelSites' : type === 'parses' ? 'panelParses' : 'panelLives';
  const el = $(panel).querySelector('[data-id="' + CSS.escape(id) + '"]');
  if (!el) return;
  if (blocked) {
    el.classList.add('blocked');
    const cb = el.querySelector('.item-check');
    if (cb) cb.remove();
    el.querySelector('.item-actions').innerHTML = '<button class="btn sm secondary" onclick="unblock(\\'' + type + '\\',\\'' + esc(id) + '\\')">' + _t('restore') + '</button>';
  } else {
    el.classList.remove('blocked');
    if (!el.querySelector('.item-check')) {
      el.insertAdjacentHTML('afterbegin', '<input type="checkbox" class="item-check" onchange="updateBatchBar()">');
    }
    el.querySelector('.item-actions').innerHTML = '<button class="btn sm danger" onclick="block(\\'' + type + '\\',\\'' + esc(id) + '\\')">' + _t('block') + '</button>';
  }
}

function toggleGroupSelect(checkbox) {
  const group = checkbox.closest('.group');
  group.querySelectorAll('.item:not(.blocked) .item-check').forEach(cb => { cb.checked = checkbox.checked; });
  updateBatchBar();
}

function updateBatchBar() {
  const checked = document.querySelectorAll('.tab-panel.active .item-check:checked');
  const bar = $('batchBar');
  if (checked.length > 0) {
    $('batchCount').textContent = checked.length;
    bar.style.display = 'flex';
  } else {
    bar.style.display = 'none';
  }
}

function clearSelection() {
  document.querySelectorAll('.item-check:checked, .group-check:checked').forEach(cb => { cb.checked = false; });
  updateBatchBar();
}

async function batchBlock() {
  const checked = document.querySelectorAll('.tab-panel.active .item-check:checked');
  if (checked.length === 0) return;
  const byType = {};
  checked.forEach(cb => {
    const item = cb.closest('.item');
    const type = item.dataset.type;
    const id = item.dataset.id;
    if (!byType[type]) byType[type] = [];
    byType[type].push(id);
  });
  try {
    for (const type of Object.keys(byType)) {
      const ids = byType[type];
      const res = await fetch('/admin/blacklist/batch', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ids })
      });
      if (!res.ok) { alert('Failed: ' + (await res.json()).error); return; }
      ids.forEach(id => {
        if (type === 'sites') { const s = DATA.sites.find(s => s.fingerprint === id); if (s) s.blocked = true; }
        else if (type === 'parses') { const p = DATA.parses.find(p => p.url === id); if (p) p.blocked = true; }
        else if (type === 'lives') { const l = DATA.lives.find(l => (l.url || l.api || '') === id); if (l) l.blocked = true; }
        updateItemDom(type, id, true);
      });
    }
    updateStats();
    updateBatchBar();
    document.querySelectorAll('.group-check:checked').forEach(cb => { cb.checked = false; });
  } catch (e) { alert('Network error'); }
}

// ─── Regex Rules ──────────────
async function loadRegexRules() {
  try {
    const r = await fetch('/admin/blacklist/regex', { headers: { 'Authorization': 'Bearer ' + TOKEN } });
    const d = await r.json();
    const el = document.getElementById('regexRulesList');
    const badge = document.getElementById('badgeRegex');
    if (!d.rules || d.rules.length === 0) {
      el.innerHTML = '<div style="color:var(--text-dim);padding:12px">' + _t('regexNoRules') + '</div>';
      badge.textContent = '0';
      return;
    }
    badge.textContent = String(d.rules.length);
    el.innerHTML = d.rules.map(function(rule) {
      var qid = rule.id.replace(/"/g, '&quot;');
      return '<div style="display:flex;gap:8px;align-items:center;padding:8px 12px;border:1px solid var(--border);border-radius:6px;margin-bottom:6px;background:var(--surface)">' +
        '<code style="flex:1;font-size:0.85rem;color:var(--text)">' + esc(rule.pattern) + '</code>' +
        '<span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;background:var(--surface-2);color:var(--text-dim)">' + rule.field + '</span>' +
        '<label style="display:flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox" ' + (rule.enabled?'checked':'') + ' onchange="toggleRegexRule(&quot;' + qid + '&quot;,this.checked)"></label>' +
        '<button class="btn sm secondary" onclick="deleteRegexRule(&quot;' + qid + '&quot;)" style="padding:4px 8px;font-size:0.75rem">' + _t('regexDelete') + '</button>' +
      '</div>';
    }).join('');
  } catch(e) { console.error('loadRegexRules', e); }
}
async function addRegexRule() {
  var pattern = document.getElementById('regexPattern').value.trim();
  var field = document.getElementById('regexField').value;
  if (!pattern) return;
  var r = await fetch('/admin/blacklist/regex', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN}, body: JSON.stringify({pattern:pattern, field:field, enabled:true}) });
  var d = await r.json();
  if (d.error) { alert(d.error); return; }
  document.getElementById('regexPattern').value = '';
  loadRegexRules();
}
async function deleteRegexRule(id) {
  await fetch('/admin/blacklist/regex/' + id, { method:'DELETE', headers:{'Authorization':'Bearer '+TOKEN} });
  loadRegexRules();
}
async function toggleRegexRule(id, enabled) {
  await fetch('/admin/blacklist/regex/' + id, { method:'PUT', headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN}, body: JSON.stringify({enabled:enabled}) });
  loadRegexRules();
}
async function testRegexRule() {
  var pattern = document.getElementById('regexPattern').value.trim();
  var field = document.getElementById('regexField').value;
  if (!pattern) return;
  var el = document.getElementById('regexTestResult');
  el.style.display = 'block';
  el.textContent = _t('regexTesting');
  var r = await fetch('/admin/blacklist/regex/test', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN}, body: JSON.stringify({pattern:pattern, field:field}) });
  var d = await r.json();
  if (d.error) { el.textContent = _t('regexError') + d.error; el.style.color = 'var(--red)'; return; }
  el.style.color = 'var(--text-dim)';
  if (!d.matched || d.matched.length === 0) { el.textContent = _t('regexNoMatch'); return; }
  el.textContent = d.matched.length + _t('regexMatches') + d.matched.slice(0,8).map(function(m){return m.name}).join(', ') + (d.matched.length > 8 ? ' ...' : '');
}

// Load regex on tab switch
var _origSwitchTab = switchTab;
switchTab = function(tab) {
  _origSwitchTab(tab);
  if (tab === 'regex') loadRegexRules();
};

applyTheme(getTheme());
initThemeDropdown();
loadBgFromServer();
loadVersion();
applyLang(_translations, getLang());
</script>
</body>
</html>`;

import { sharedStyles } from './shared-styles';
import { sharedUi } from './shared-ui';

export const builderHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TVBox Config Builder</title>
<style>
${sharedStyles}

.container{max-width:1200px}

/* Two-panel layout */
.builder-layout{
  display:grid;
  grid-template-columns:360px 1fr;
  gap:16px;
  margin-top:16px;
  min-height:calc(100vh - 200px);
}

@media(max-width:768px){
  .builder-layout{grid-template-columns:1fr;min-height:auto}
}

/* Panels */
.panel{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}

.panel-header{
  padding:12px 16px;
  border-bottom:1px solid var(--border);
  font-family:var(--mono);
  font-size:0.8rem;
  font-weight:600;
  color:var(--text-bright);
  display:flex;
  align-items:center;
  justify-content:space-between;
  flex-shrink:0;
}

.panel-body{
  flex:1;
  overflow-y:auto;
  padding:8px;
}

/* Source group */
.source-group{
  margin-bottom:8px;
}

.source-group-header{
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 10px;
  cursor:pointer;
  border-radius:6px;
  font-family:var(--mono);
  font-size:0.75rem;
  color:var(--text);
  user-select:none;
}

.source-group-header:hover{background:var(--surface-2)}

.source-group-arrow{
  font-size:0.6rem;
  color:var(--text-dim);
  transition:transform 0.2s;
}

.source-group.open .source-group-arrow{transform:rotate(90deg)}

.source-group-items{display:none;padding-left:12px}
.source-group.open .source-group-items{display:block}

.source-group-count{
  font-size:0.65rem;
  color:var(--text-dim);
  padding:1px 6px;
  background:var(--surface-2);
  border-radius:8px;
}

/* Pool item */
.pool-item{
  display:flex;
  align-items:center;
  gap:8px;
  padding:6px 10px;
  border-radius:4px;
  font-family:var(--mono);
  font-size:0.7rem;
  color:var(--text);
  cursor:pointer;
}

.pool-item:hover{background:var(--surface-2)}

.pool-item-name{
  flex:1;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.pool-item-type{
  font-size:0.6rem;
  padding:1px 5px;
  border-radius:3px;
  font-weight:600;
}

.pool-item-type.t0{background:var(--blue-dim);color:var(--blue)}
.pool-item-type.t1{background:var(--green-dim);color:var(--green)}
.pool-item-type.t3{background:var(--amber-dim);color:var(--amber)}
.pool-item-type.t4{background:var(--red-dim);color:var(--red)}

/* Preset item */
.preset-item{
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 12px;
  border-bottom:1px solid var(--border);
  font-family:var(--mono);
  font-size:0.75rem;
}

.preset-item:last-child{border-bottom:none}
.preset-item:hover{background:var(--surface-2)}

.preset-item-name{
  flex:1;
  color:var(--text-bright);
  font-weight:500;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.preset-item-api{
  max-width:180px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:var(--text-dim);
  font-size:0.65rem;
}

.preset-item-actions{display:flex;gap:4px;flex-shrink:0}

/* Tabs */
.preset-tabs{
  display:flex;
  gap:0;
  border-bottom:1px solid var(--border);
  padding:0 12px;
}

.preset-tab{
  padding:8px 14px;
  font-family:var(--mono);
  font-size:0.75rem;
  color:var(--text-dim);
  cursor:pointer;
  border-bottom:2px solid transparent;
  transition:all 0.15s;
}

.preset-tab:hover{color:var(--text)}
.preset-tab.active{color:var(--green);border-bottom-color:var(--green)}

.preset-tab .badge{
  font-size:0.6rem;
  padding:1px 5px;
  background:var(--surface-2);
  border-radius:8px;
  margin-left:4px;
}

/* Edit panel */
.edit-overlay{
  display:none;
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.6);
  z-index:100;
  align-items:center;
  justify-content:center;
}

.edit-overlay.open{display:flex}

.edit-box{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:10px;
  padding:20px;
  width:90%;
  max-width:560px;
  max-height:80vh;
  overflow-y:auto;
}

.edit-box h3{
  font-family:var(--mono);
  font-size:0.85rem;
  color:var(--text-bright);
  margin:0 0 16px;
}

.edit-row{
  display:flex;
  gap:8px;
  margin-bottom:10px;
  align-items:center;
}

.edit-row label{
  width:90px;
  font-family:var(--mono);
  font-size:0.7rem;
  color:var(--text-dim);
  flex-shrink:0;
}

.edit-row input,.edit-row select,.edit-row textarea{
  flex:1;
  padding:6px 10px;
  border:1px solid var(--border);
  border-radius:5px;
  background:var(--surface-2);
  color:var(--text);
  font-family:var(--mono);
  font-size:0.75rem;
}

.edit-row textarea{min-height:60px;resize:vertical}

.edit-actions{
  display:flex;
  gap:8px;
  justify-content:flex-end;
  margin-top:16px;
}

/* Toolbar */
.toolbar{
  display:flex;
  gap:8px;
  align-items:center;
  flex-wrap:wrap;
  margin-bottom:12px;
}

.toolbar select{
  padding:6px 10px;
  border:1px solid var(--border);
  border-radius:6px;
  background:var(--surface);
  color:var(--text);
  font-family:var(--mono);
  font-size:0.75rem;
}

/* Search */
.pool-search{
  width:100%;
  padding:8px 12px;
  border:none;
  border-bottom:1px solid var(--border);
  background:var(--surface);
  color:var(--text);
  font-family:var(--mono);
  font-size:0.75rem;
  outline:none;
}

.pool-search:focus{border-bottom-color:var(--green)}

/* Empty state */
.empty-state{
  text-align:center;
  padding:40px 20px;
  font-family:var(--mono);
  font-size:0.8rem;
  color:var(--text-dim);
}

/* Add-to-preset floating bar */
.add-bar{
  position:sticky;
  bottom:0;
  background:var(--surface);
  border-top:1px solid var(--border);
  padding:8px 12px;
  display:none;
  align-items:center;
  gap:8px;
  font-family:var(--mono);
  font-size:0.75rem;
}

.add-bar.visible{display:flex}
.add-bar .count{color:var(--green);font-weight:600}
</style>
<script>(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)})()</script>
</head>
<body style="opacity:0">

<!-- Login -->
<div class="login-overlay" id="loginOverlay">
  <div class="login-box">
    <h2>Config Builder</h2>
    <p>请输入管理令牌</p>
    <div class="error-msg" id="loginError">无效的令牌</div>
    <input type="password" id="tokenInput" placeholder="Admin Token" autofocus>
    <button class="btn" style="width:100%" onclick="auth.doLogin()">登录</button>
  </div>
</div>

<!-- Main -->
<div class="container" id="mainContent" style="display:none">
  <header class="header">
    <div class="header-top">
      <div class="header-label">Config Builder</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span id="themeDropdown"></span>
      </div>
    </div>
    <h1 class="header-title">TVBox <span>Builder</span></h1>
    <div class="header-nav">
      <a href="/admin">管理</a>
      <a href="/config-editor">编辑器</a>
      <a href="/status">仪表盘</a>
    </div>
  </header>

  <!-- Toolbar -->
  <div class="toolbar">
    <select id="presetSelect" onchange="switchPreset()">
      <option value="">— 选择方案 —</option>
    </select>
    <button class="btn sm" onclick="newPreset()">新建方案</button>
    <button class="btn sm secondary" id="btnExport" onclick="exportPreset()" disabled>导出 ZIP</button>
    <button class="btn sm secondary" id="btnDelete" onclick="delPreset()" disabled>删除</button>
  </div>

  <!-- Builder layout -->
  <div class="builder-layout">
    <!-- Left: Pool -->
    <div class="panel" id="poolPanel">
      <div class="panel-header">
        原料池
        <span id="poolTotal" style="font-weight:400;color:var(--text-dim);font-size:0.7rem"></span>
      </div>
      <input class="pool-search" id="poolSearch" placeholder="搜索站点名称、API..." oninput="filterPool()">
      <!-- Pool tabs -->
      <div class="preset-tabs" id="poolTabs">
        <div class="preset-tab active" data-pool-tab="sites" onclick="switchPoolTab('sites')">站点 <span class="badge" id="poolBadgeSites">0</span></div>
        <div class="preset-tab" data-pool-tab="parses" onclick="switchPoolTab('parses')">解析 <span class="badge" id="poolBadgeParses">0</span></div>
        <div class="preset-tab" data-pool-tab="lives" onclick="switchPoolTab('lives')">直播 <span class="badge" id="poolBadgeLives">0</span></div>
      </div>
      <div class="panel-body" id="poolBody">
        <div class="empty-state">加载中...</div>
      </div>
      <div class="add-bar" id="addBar">
        <span>已选 <span class="count" id="addCount">0</span></span>
        <button class="btn sm" onclick="addSelected()">添加到方案</button>
        <button class="btn sm secondary" onclick="clearPoolSelection()">取消</button>
      </div>
    </div>

    <!-- Right: Current preset -->
    <div class="panel" id="presetPanel">
      <div class="panel-header">
        当前方案
        <span id="presetName" style="font-weight:400;color:var(--text-dim);font-size:0.7rem"></span>
      </div>
      <div class="preset-tabs" id="presetTabs">
        <div class="preset-tab active" data-preset-tab="sites" onclick="switchPresetTab('sites')">站点 <span class="badge" id="presetBadgeSites">0</span></div>
        <div class="preset-tab" data-preset-tab="parses" onclick="switchPresetTab('parses')">解析 <span class="badge" id="presetBadgeParses">0</span></div>
        <div class="preset-tab" data-preset-tab="lives" onclick="switchPresetTab('lives')">直播 <span class="badge" id="presetBadgeLives">0</span></div>
      </div>
      <div class="panel-body" id="presetBody">
        <div class="empty-state">选择或新建一个方案</div>
      </div>
    </div>
  </div>
</div>

<!-- Edit overlay -->
<div class="edit-overlay" id="editOverlay" onclick="if(event.target===this)closeEdit()">
  <div class="edit-box" id="editBox"></div>
</div>

<script>
${sharedUi}

let TOKEN = '';
let POOL = null;       // { sites: {source→items}, parses: {...}, lives: {...}, totals }
let PRESETS = [];      // PresetSummary[]
let CURRENT = null;    // full BuilderPreset
let POOL_TAB = 'sites';
let PRESET_TAB = 'sites';

const auth = initAuth('tokenInput', 'loginError', 'loginOverlay', 'mainContent', '/builder/pool', function() {
  TOKEN = auth.getToken();
  loadAll();
});

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (res.status === 401) { location.reload(); return null; }
  return res;
}

async function loadAll() {
  const [poolRes, presetsRes] = await Promise.all([api('/builder/pool'), api('/builder/presets')]);
  if (poolRes && poolRes.ok) POOL = await poolRes.json();
  if (presetsRes && presetsRes.ok) PRESETS = await presetsRes.json();
  renderPresetSelect();
  renderPool();
}

// ─── Preset select ────────────────────────────────────
function renderPresetSelect() {
  const sel = $('presetSelect');
  sel.innerHTML = '<option value="">— 选择方案 —</option>' +
    PRESETS.map(p => '<option value="' + p.id + '"' + (CURRENT && CURRENT.id === p.id ? ' selected' : '') + '>' + esc(p.name) + ' (' + p.siteCount + '站/' + p.parseCount + '解/' + p.liveCount + '播)</option>').join('');
  $('btnExport').disabled = !CURRENT;
  $('btnDelete').disabled = !CURRENT;
}

async function switchPreset() {
  const id = $('presetSelect').value;
  if (!id) { CURRENT = null; renderPreset(); renderPresetSelect(); return; }
  const res = await api('/builder/presets/' + id);
  if (res && res.ok) { CURRENT = await res.json(); renderPreset(); renderPresetSelect(); }
}

async function newPreset() {
  const name = prompt('方案名称：');
  if (!name) return;
  const res = await api('/builder/presets', { method: 'POST', body: JSON.stringify({ name }) });
  if (res && res.ok) {
    CURRENT = await res.json();
    PRESETS.unshift({ id: CURRENT.id, name: CURRENT.name, createdAt: CURRENT.createdAt, updatedAt: CURRENT.updatedAt, siteCount: 0, parseCount: 0, liveCount: 0 });
    renderPresetSelect();
    renderPreset();
  }
}

async function delPreset() {
  if (!CURRENT) return;
  if (!confirm('确认删除方案 "' + CURRENT.name + '"？')) return;
  await api('/builder/presets/' + CURRENT.id, { method: 'DELETE' });
  PRESETS = PRESETS.filter(p => p.id !== CURRENT.id);
  CURRENT = null;
  renderPresetSelect();
  renderPreset();
}

async function saveCurrentPreset() {
  if (!CURRENT) return;
  await api('/builder/presets/' + CURRENT.id, { method: 'PUT', body: JSON.stringify({
    sites: CURRENT.sites, parses: CURRENT.parses, lives: CURRENT.lives, exportSettings: CURRENT.exportSettings,
  })});
  const idx = PRESETS.findIndex(p => p.id === CURRENT.id);
  if (idx >= 0) { PRESETS[idx].siteCount = CURRENT.sites.length; PRESETS[idx].parseCount = CURRENT.parses.length; PRESETS[idx].liveCount = CURRENT.lives.length; }
  renderPresetSelect();
}

async function exportPreset() {
  if (!CURRENT) return;
  const pathVal = prompt('导出路径（设备上解压位置）：', CURRENT.exportSettings.path || '/sdcard/TVBox/');
  if (!pathVal) return;
  CURRENT.exportSettings.path = pathVal;
  const res = await api('/builder/presets/' + CURRENT.id + '/export', { method: 'POST', body: JSON.stringify({ path: pathVal }) });
  if (!res) return;
  if (res.status === 501) { alert('导出功能尚未实现（Phase 3）'); return; }
  if (!res.ok) { const e = await res.json(); alert(e.error || 'Export failed'); return; }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = CURRENT.name.replace(/[^a-zA-Z0-9\\u4e00-\\u9fff]/g, '_') + '.zip';
  a.click();
}

// ─── Pool rendering ───────────────────────────────────
function switchPoolTab(tab) {
  POOL_TAB = tab;
  document.querySelectorAll('#poolTabs .preset-tab').forEach(t => t.classList.toggle('active', t.dataset.poolTab === tab));
  renderPool();
}

function renderPool() {
  if (!POOL) { $('poolBody').innerHTML = '<div class="empty-state">加载中...</div>'; return; }
  $('poolBadgeSites').textContent = POOL.totals.sites;
  $('poolBadgeParses').textContent = POOL.totals.parses;
  $('poolBadgeLives').textContent = POOL.totals.lives;
  $('poolTotal').textContent = (POOL.totals.sites + POOL.totals.parses + POOL.totals.lives) + ' 条';

  const data = POOL[POOL_TAB]; // { sourceName → items[] }
  if (!data || Object.keys(data).length === 0) {
    $('poolBody').innerHTML = '<div class="empty-state">无数据</div>';
    return;
  }

  let html = '';
  const sources = Object.entries(data).sort((a, b) => b[1].length - a[1].length);
  for (const [source, items] of sources) {
    html += '<div class="source-group" data-source="' + esc(source) + '">';
    html += '<div class="source-group-header" onclick="this.parentElement.classList.toggle(\\'open\\')">';
    html += '<span class="source-group-arrow">&#9654;</span>';
    html += '<span style="flex:1">' + esc(source === '_unknown' ? '未知来源' : source) + '</span>';
    html += '<span class="source-group-count">' + items.length + '</span>';
    html += '</div>';
    html += '<div class="source-group-items">';
    for (const item of items) {
      const name = item.name || item.key || '(unnamed)';
      const typeVal = item.type ?? 0;
      const identifier = POOL_TAB === 'sites' ? item.key : (item.url || item.api || '');
      html += '<div class="pool-item" data-id="' + esc(identifier) + '" data-source="' + esc(source) + '" onclick="togglePoolItem(this)">';
      html += '<input type="checkbox" style="accent-color:var(--green)" onclick="event.stopPropagation();updateAddBar()">';
      html += '<span class="pool-item-name" title="' + esc(identifier) + '">' + esc(name) + '</span>';
      html += '<span class="pool-item-type t' + typeVal + '">T' + typeVal + '</span>';
      html += '</div>';
    }
    html += '</div></div>';
  }
  $('poolBody').innerHTML = html;
  updateAddBar();
}

function togglePoolItem(el) {
  const cb = el.querySelector('input[type=checkbox]');
  cb.checked = !cb.checked;
  updateAddBar();
}

function updateAddBar() {
  const checked = $('poolBody').querySelectorAll('input[type=checkbox]:checked');
  const bar = $('addBar');
  if (checked.length > 0) { $('addCount').textContent = checked.length; bar.classList.add('visible'); }
  else { bar.classList.remove('visible'); }
}

function clearPoolSelection() {
  $('poolBody').querySelectorAll('input[type=checkbox]:checked').forEach(cb => cb.checked = false);
  updateAddBar();
}

function filterPool() {
  const q = $('poolSearch').value.toLowerCase().trim();
  $('poolBody').querySelectorAll('.pool-item').forEach(el => {
    const text = (el.querySelector('.pool-item-name')?.textContent || '').toLowerCase() + ' ' + (el.dataset.id || '').toLowerCase();
    el.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
  $('poolBody').querySelectorAll('.source-group').forEach(g => {
    const visible = g.querySelectorAll('.pool-item:not([style*="display: none"])').length;
    g.style.display = visible > 0 ? '' : 'none';
  });
}

function addSelected() {
  if (!CURRENT) { alert('请先选择或创建一个方案'); return; }
  const checked = $('poolBody').querySelectorAll('input[type=checkbox]:checked');
  if (checked.length === 0) return;

  const now = Date.now();
  const data = POOL[POOL_TAB];

  for (const cb of checked) {
    const el = cb.closest('.pool-item');
    const id = el.dataset.id;
    const source = el.dataset.source;
    // Find item in pool data
    const items = data[source] || [];
    const item = items.find(i => (POOL_TAB === 'sites' ? i.key : (i.url || i.api || '')) === id);
    if (!item) continue;

    const entry = { ...item, _source: source === '_unknown' ? undefined : source, _importedAt: now };

    if (POOL_TAB === 'sites') {
      if (!CURRENT.sites.some(s => s.key === item.key)) CURRENT.sites.push(entry);
    } else if (POOL_TAB === 'parses') {
      if (!CURRENT.parses.some(p => p.url === item.url)) CURRENT.parses.push(entry);
    } else {
      const liveId = item.url || item.api || '';
      if (!CURRENT.lives.some(l => (l.url || l.api || '') === liveId)) CURRENT.lives.push(entry);
    }
  }

  clearPoolSelection();
  saveCurrentPreset();
  renderPreset();
}

// ─── Preset rendering ─────────────────────────────────
function switchPresetTab(tab) {
  PRESET_TAB = tab;
  document.querySelectorAll('#presetTabs .preset-tab').forEach(t => t.classList.toggle('active', t.dataset.presetTab === tab));
  renderPreset();
}

function renderPreset() {
  if (!CURRENT) {
    $('presetBody').innerHTML = '<div class="empty-state">选择或新建一个方案</div>';
    $('presetName').textContent = '';
    $('presetBadgeSites').textContent = '0';
    $('presetBadgeParses').textContent = '0';
    $('presetBadgeLives').textContent = '0';
    return;
  }
  $('presetName').textContent = CURRENT.name;
  $('presetBadgeSites').textContent = CURRENT.sites.length;
  $('presetBadgeParses').textContent = CURRENT.parses.length;
  $('presetBadgeLives').textContent = CURRENT.lives.length;

  const items = CURRENT[PRESET_TAB] || [];
  if (items.length === 0) {
    $('presetBody').innerHTML = '<div class="empty-state">暂无条目，从左侧原料池添加或手动新增</div>';
    renderManualAddBtn();
    return;
  }

  let html = '';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const name = item.name || item.key || '(unnamed)';
    const sub = PRESET_TAB === 'sites' ? (item.api || '') : (item.url || item.api || '');
    const typeVal = item.type ?? 0;
    html += '<div class="preset-item">';
    html += '<span class="pool-item-type t' + typeVal + '">T' + typeVal + '</span>';
    html += '<span class="preset-item-name">' + esc(name) + '</span>';
    html += '<span class="preset-item-api" title="' + esc(sub) + '">' + esc(sub) + '</span>';
    html += '<span class="preset-item-actions">';
    html += '<button class="btn sm secondary" onclick="editItem(' + i + ')">编辑</button>';
    html += '<button class="btn sm danger" onclick="removeItem(' + i + ')">删除</button>';
    html += '</span></div>';
  }
  $('presetBody').innerHTML = html;
  renderManualAddBtn();
}

function renderManualAddBtn() {
  const body = $('presetBody');
  const btn = document.createElement('div');
  btn.style.cssText = 'padding:12px;text-align:center';
  btn.innerHTML = '<button class="btn sm secondary" onclick="manualAdd()">+ 手动添加</button>';
  body.appendChild(btn);
}

function removeItem(idx) {
  if (!CURRENT) return;
  CURRENT[PRESET_TAB].splice(idx, 1);
  saveCurrentPreset();
  renderPreset();
}

// ─── Edit ─────────────────────────────────────────────
function editItem(idx) {
  if (!CURRENT) return;
  const item = CURRENT[PRESET_TAB][idx];
  if (!item) return;
  showEditForm(item, idx);
}

function manualAdd() {
  if (!CURRENT) { alert('请先选择或创建一个方案'); return; }
  let template;
  if (PRESET_TAB === 'sites') template = { key: '', name: '', type: 1, api: '', searchable: 1, _manual: true };
  else if (PRESET_TAB === 'parses') template = { name: '', url: '', type: 0, _manual: true };
  else template = { name: '', url: '', type: 0, _manual: true };
  showEditForm(template, -1);
}

function showEditForm(item, idx) {
  const box = $('editBox');
  let html = '<h3>' + (idx === -1 ? '新增' : '编辑') + (PRESET_TAB === 'sites' ? '站点' : PRESET_TAB === 'parses' ? '解析' : '直播') + '</h3>';

  if (PRESET_TAB === 'sites') {
    html += editRow('key', item.key || '', 'text');
    html += editRow('name', item.name || '', 'text');
    html += editRow('type', item.type ?? 1, 'select', [{v:0,l:'0-XML'},{v:1,l:'1-JSON'},{v:3,l:'3-JAR'},{v:4,l:'4-Remote'}]);
    html += editRow('api', item.api || '', 'text');
    html += editRow('jar', item.jar || '', 'text');
    html += editRow('ext', typeof item.ext === 'object' ? JSON.stringify(item.ext) : (item.ext || ''), 'textarea');
    html += editRow('playerType', item.playerType ?? '', 'select', [{v:'',l:'默认'},{v:0,l:'0-系统'},{v:1,l:'1-IJK'},{v:2,l:'2-EXO'},{v:10,l:'10-MX'}]);
    html += editRow('searchable', item.searchable ?? 1, 'select', [{v:0,l:'否'},{v:1,l:'是'}]);
    html += editRow('filterable', item.filterable ?? 1, 'select', [{v:0,l:'否'},{v:1,l:'是'}]);
    html += editRow('quickSearch', item.quickSearch ?? 0, 'select', [{v:0,l:'否'},{v:1,l:'是'}]);
  } else if (PRESET_TAB === 'parses') {
    html += editRow('name', item.name || '', 'text');
    html += editRow('url', item.url || '', 'text');
    html += editRow('type', item.type ?? 0, 'select', [{v:0,l:'0-嗅探'},{v:1,l:'1-JSON'},{v:2,l:'2-JSON扩展'},{v:3,l:'3-聚合'},{v:4,l:'4-超级'}]);
    html += editRow('ext', typeof item.ext === 'object' ? JSON.stringify(item.ext) : (item.ext || ''), 'textarea');
  } else {
    html += editRow('name', item.name || '', 'text');
    html += editRow('url', item.url || '', 'text');
    html += editRow('api', item.api || '', 'text');
    html += editRow('type', item.type ?? 0, 'select', [{v:0,l:'0-M3U/TXT'},{v:3,l:'3-JAR/Python'}]);
    html += editRow('jar', item.jar || '', 'text');
    html += editRow('playerType', item.playerType ?? '', 'select', [{v:'',l:'默认'},{v:0,l:'0-系统'},{v:1,l:'1-IJK'},{v:2,l:'2-EXO'},{v:10,l:'10-MX'}]);
  }

  html += '<div class="edit-actions">';
  html += '<button class="btn sm secondary" onclick="closeEdit()">取消</button>';
  html += '<button class="btn sm" onclick="saveEdit(' + idx + ')">保存</button>';
  html += '</div>';

  box.innerHTML = html;
  $('editOverlay').classList.add('open');
}

function editRow(field, value, type, options) {
  let input;
  if (type === 'select') {
    input = '<select data-field="' + field + '">' + options.map(o => '<option value="' + o.v + '"' + (String(value) === String(o.v) ? ' selected' : '') + '>' + o.l + '</option>').join('') + '</select>';
  } else if (type === 'textarea') {
    input = '<textarea data-field="' + field + '">' + esc(String(value)) + '</textarea>';
  } else {
    input = '<input type="text" data-field="' + field + '" value="' + esc(String(value)) + '">';
  }
  return '<div class="edit-row"><label>' + field + '</label>' + input + '</div>';
}

function closeEdit() {
  $('editOverlay').classList.remove('open');
}

function saveEdit(idx) {
  if (!CURRENT) return;
  const box = $('editBox');
  const fields = box.querySelectorAll('[data-field]');
  const obj = {};
  for (const f of fields) {
    const key = f.dataset.field;
    let val = f.value;
    // type coercion
    if (['type', 'searchable', 'filterable', 'quickSearch', 'playerType'].includes(key)) {
      val = val === '' ? undefined : Number(val);
    }
    if (key === 'ext' && val) {
      try { val = JSON.parse(val); } catch { /* keep as string */ }
    }
    if (val !== undefined && val !== '') obj[key] = val;
  }

  if (PRESET_TAB === 'sites' && !obj.key) { alert('key 不能为空'); return; }
  if (PRESET_TAB === 'parses' && !obj.url) { alert('url 不能为空'); return; }

  if (idx === -1) {
    // New item
    if (PRESET_TAB === 'sites') obj._manual = true;
    else obj._manual = true;
    obj._importedAt = Date.now();
    CURRENT[PRESET_TAB].push(obj);
  } else {
    // Preserve metadata
    const old = CURRENT[PRESET_TAB][idx];
    CURRENT[PRESET_TAB][idx] = { ...obj, _source: old._source, _importedAt: old._importedAt, _manual: old._manual };
  }

  closeEdit();
  saveCurrentPreset();
  renderPreset();
}

// ─── Init ─────────────────────────────────────────────
applyTheme(getTheme());
initThemeDropdown();
loadBgFromServer();
loadVersion();
document.body.style.opacity = '1';
</script>
</body>
</html>`;

import { sharedStyles } from './shared-styles';
import { sharedUi } from './shared-ui';

export const dashboardHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TVBox Source Aggregator</title>
<style>
${sharedStyles}

/* Dashboard-specific */
.header{margin-bottom:48px}

.stats-grid{
  display:grid;
  grid-template-columns:repeat(2, 1fr);
  gap:16px;
  margin-bottom:32px;
}

@media(max-width:560px){
  .stats-grid{grid-template-columns:1fr}
}

.stat-card{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  padding:24px;
  position:relative;
  overflow:hidden;
  transition:border-color 0.3s, transform 0.2s;
  animation:fadeSlideUp 0.5s ease-out both;
}

.stat-card:nth-child(1){animation-delay:0.1s}
.stat-card:nth-child(2){animation-delay:0.15s}
.stat-card:nth-child(3){animation-delay:0.2s}
.stat-card:nth-child(4){animation-delay:0.25s}

.stat-card:hover{
  border-color:var(--border-glow);
  transform:translateY(-2px);
}

.stat-card::before{
  content:'';
  position:absolute;
  top:0;left:0;right:0;
  height:1px;
  background:linear-gradient(90deg, transparent, var(--green-dim), transparent);
}

.stat-label{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.15em;
  text-transform:uppercase;
  color:var(--text-dim);
  margin-bottom:12px;
  display:flex;
  align-items:center;
  gap:6px;
}

.stat-icon{
  width:14px;height:14px;
  opacity:0.5;
}

.stat-value{
  font-family:var(--mono);
  font-size:2.2rem;
  font-weight:700;
  color:var(--text-bright);
  line-height:1;
  letter-spacing:-0.02em;
}

.stat-value .unit{
  font-size:0.8rem;
  font-weight:400;
  color:var(--text-dim);
  margin-left:4px;
}

.stat-card.highlight .stat-value{
  color:var(--green);
  text-shadow:0 0 20px var(--green-dim);
}

/* Update time section */
.update-section{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  padding:20px 24px;
  margin-bottom:32px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  animation:fadeSlideUp 0.5s ease-out 0.3s both;
}

@media(max-width:560px){
  .update-section{flex-direction:column;align-items:flex-start}
}

.update-info{
  display:flex;flex-direction:column;gap:4px;
}

.update-label{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.15em;
  text-transform:uppercase;
  color:var(--text-dim);
}

.update-time{
  font-family:var(--mono);
  font-size:0.95rem;
  color:var(--text-bright);
  font-weight:500;
}

.update-time.stale{color:var(--amber)}
.update-time.never{color:var(--red)}

/* Refresh button - removed */
}

/* Source Health Section */
.health-section{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  padding:20px 24px;
  margin-bottom:32px;
  animation:fadeSlideUp 0.5s ease-out 0.32s both;
}

.health-summary{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  margin-bottom:8px;
}

.health-label{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.15em;
  text-transform:uppercase;
  color:var(--text-dim);
}

.health-counts{
  display:flex;
  gap:16px;
  font-family:var(--mono);
  font-size:0.75rem;
}

.health-count{
  display:flex;
  align-items:center;
  gap:4px;
}

.health-count.ok{color:var(--green)}
.health-count.warn{color:var(--amber)}
.health-count.error{color:var(--red)}

.health-dot{
  width:6px;height:6px;
  border-radius:50%;
  display:inline-block;
}

.health-dot.ok{background:var(--green);box-shadow:0 0 6px var(--green-glow)}
.health-dot.warn{background:var(--amber);box-shadow:0 0 6px var(--amber-dim)}
.health-dot.error{background:var(--red);box-shadow:0 0 6px var(--red-dim)}

.health-table-wrap{
  overflow-x:auto;
  margin-top:12px;
}

.health-table{
  width:100%;
  border-collapse:collapse;
  font-family:var(--mono);
  font-size:0.7rem;
}

.health-table th{
  text-align:left;
  padding:8px 10px;
  font-size:0.6rem;
  letter-spacing:0.12em;
  text-transform:uppercase;
  color:var(--text-dim);
  border-bottom:1px solid var(--border);
  white-space:nowrap;
}

.health-table td{
  padding:8px 10px;
  border-bottom:1px solid var(--border);
  color:var(--text);
  white-space:nowrap;
}

.health-table tr:last-child td{border-bottom:none}

.health-table .url-cell{
  max-width:200px;
  overflow:hidden;
  text-overflow:ellipsis;
  color:var(--text-dim);
}

.health-table .status-ok{color:var(--green)}
.health-table .status-warn{color:var(--amber)}
.health-table .status-error{color:var(--red)}

.health-table tr.row-error td{background:var(--red-dim)}
.health-table tr.row-warn td{background:var(--amber-dim)}

@media(max-width:560px){
  .health-summary{flex-direction:column;align-items:flex-start}
  .health-table{font-size:0.6rem}
  .health-table .url-cell{max-width:120px}
}

/* Config URL section */
.config-section{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  padding:20px 24px;
  animation:fadeSlideUp 0.5s ease-out 0.35s both;
}

.config-label{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.15em;
  text-transform:uppercase;
  color:var(--text-dim);
  margin-bottom:10px;
}

.config-url-row{
  display:flex;
  align-items:center;
  gap:10px;
}

.config-url{
  flex:1;
  font-family:var(--mono);
  font-size:0.8rem;
  color:var(--green);
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:4px;
  padding:10px 14px;
  overflow-x:auto;
  white-space:nowrap;
  user-select:all;
}

.copy-btn{
  font-family:var(--mono);
  font-size:0.7rem;
  font-weight:500;
  letter-spacing:0.08em;
  text-transform:uppercase;
  padding:10px 16px;
  background:var(--surface-2);
  border:1px solid var(--border);
  color:var(--text-dim);
  border-radius:4px;
  cursor:pointer;
  transition:all 0.2s;
  white-space:nowrap;
}

.copy-btn:hover{
  border-color:var(--text-dim);
  color:var(--text);
}

.copy-btn.copied{
  color:var(--green);
  border-color:var(--green);
}

.warning-banner{
  background:var(--amber-dim);
  border:1px solid var(--amber);
  border-radius:8px;
  padding:12px 16px;
  margin-bottom:20px;
  font-family:var(--mono);
  font-size:0.75rem;
  color:var(--amber);
  line-height:1.6;
}

.footer{margin-top:48px;padding-top:24px}
</style>
<script>(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)})()</script>
</head>
<body style="opacity:0">

<div class="container">
  <header class="header">
    <div class="header-top">
      <div class="header-label" data-i18n="headerLabel">System Monitor</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span id="themeDropdown"></span>
        <button class="lang-toggle" id="langToggle" onclick="doToggleLang()">中文</button>
      </div>
    </div>
    <h1 class="header-title">TVBox <span>Aggregator</span></h1>
    <div class="status-bar">
      <div class="status-indicator">
        <span class="status-dot" id="statusDot"></span>
        <span id="statusText" data-i18n="connecting">Connecting...</span>
      </div>
    </div>
    <nav class="header-nav">
      <a href="/admin" data-i18n="navAdmin">Admin</a>
      <a href="/admin/config-editor" data-i18n="navConfigEditor">Config Editor</a>
      <a href="/builder">Builder</a>
    </nav>
  </header>

  <div id="warningBanner"></div>

  <div class="stats-grid">
    <div class="stat-card highlight">
      <div class="stat-label">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        <span data-i18n="sites">Sites</span>
      </div>
      <div class="stat-value" id="statSites"><span class="skeleton">&nbsp;000&nbsp;</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        <span data-i18n="lives">Lives</span>
      </div>
      <div class="stat-value" id="statLives"><span class="skeleton">&nbsp;00&nbsp;</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span data-i18n="parses">Parses</span>
      </div>
      <div class="stat-value" id="statParses"><span class="skeleton">&nbsp;00&nbsp;</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/></svg>
        <span data-i18n="sources">Sources</span>
      </div>
      <div class="stat-value" id="statSources"><span class="skeleton">&nbsp;00&nbsp;</span></div>
    </div>
  </div>

  <div class="update-section">
    <div class="update-info">
      <div class="update-label" data-i18n="lastAggregation">Last Aggregation</div>
      <div class="update-time" id="updateTime"><span class="skeleton">&nbsp;Loading...&nbsp;</span></div>
    </div>
  </div>

  <div class="health-section">
    <div class="health-summary">
      <div class="health-label" data-i18n="sourceHealth">Source Health</div>
      <div class="health-counts">
        <span class="health-count ok"><span class="health-dot ok"></span> <span id="healthOk">-</span> OK</span>
        <span class="health-count warn"><span class="health-dot warn"></span> <span id="healthWarn">-</span> WARN</span>
        <span class="health-count error"><span class="health-dot error"></span> <span id="healthError">-</span> ERR</span>
      </div>
    </div>
    <div class="collapsible-toggle" id="healthToggle" onclick="toggleCollapsible(this)" data-i18n="healthDetails">Details</div>
    <div class="collapsible-body" id="healthBody">
      <div class="health-table-wrap">
        <table class="health-table">
          <thead>
            <tr>
              <th></th>
              <th data-i18n="healthName">Name</th>
              <th>URL</th>
              <th data-i18n="healthStatus">Status</th>
              <th data-i18n="healthFails">Fails</th>
              <th data-i18n="healthLastOk">Last OK</th>
            </tr>
          </thead>
          <tbody id="healthTableBody">
            <tr><td colspan="6" class="empty">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="health-section" id="searchQuotaSection" style="display:none">
    <div class="health-summary">
      <div class="health-label" data-i18n="searchQuota">Search Quota</div>
      <div class="health-counts">
        <span class="health-count ok"><span class="health-dot ok"></span> <span id="sqActiveCount">-</span> <span data-i18n="sqActive">active</span></span>
        <span class="health-count error"><span class="health-dot error"></span> <span id="sqExcludedCount">-</span> <span data-i18n="sqExcluded">excluded</span></span>
      </div>
    </div>
    <div class="collapsible-toggle" id="sqToggle" onclick="toggleCollapsible(this)" data-i18n="healthDetails">Details</div>
    <div class="collapsible-body" id="sqBody">
      <div class="health-table-wrap">
        <table class="health-table">
          <thead>
            <tr>
              <th>#</th>
              <th data-i18n="sqName">Name</th>
              <th data-i18n="sqSource">Source</th>
              <th data-i18n="sqReason">Reason</th>
            </tr>
          </thead>
          <tbody id="sqTableBody">
            <tr><td colspan="4" class="empty">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="config-section">
    <div class="config-label" data-i18n="configUrlLabel">TVBox Config URL</div>
    <div class="config-url-row">
      <div class="config-url" id="configUrl"></div>
      <button class="copy-btn" id="copyBtn" onclick="copyUrl('configUrl')" data-i18n="copy">Copy</button>
    </div>
    <div style="margin-top:12px">
      <div class="config-label" data-i18n="liveConfigUrlLabel">Live-Only Config URL</div>
      <div class="config-url-row">
        <div class="config-url" id="liveConfigUrl"></div>
        <button class="copy-btn" id="copyLiveBtn" onclick="copyUrl('liveConfigUrl')" data-i18n="copy">Copy</button>
      </div>
    </div>
  </div>

  <div class="footer">
    <span data-i18n="footer">TVBox Source Aggregator &middot; Cron 05:00 UTC Daily</span>
  </div>
</div>

<script>
${sharedUi}

const translations = {
  en: {
    headerLabel:'System Monitor', connecting:'Connecting...', sites:'Sites', lives:'Lives',
    parses:'Parses', sources:'Sources', lastAggregation:'Last Aggregation',
    configUrlLabel:'TVBox Config URL', liveConfigUrlLabel:'Live-Only Config URL',
    copy:'Copy', copied:'Copied!', copyFailed:'Failed', neverRefresh:'Never',
    fetchError:'Failed to fetch status', noData:'No data',
    sourceHealth:'Source Health', healthDetails:'Details', healthName:'Name',
    healthStatus:'Status', healthFails:'Fails', healthLastOk:'Last OK',
    healthNoData:'No health data yet', healthNever:'--',
    searchQuota:'Search Quota', sqActive:'active', sqExcluded:'excluded',
    sqName:'Name', sqSource:'Source', sqReason:'Reason',
    sqPinned:'pinned', sqHttp:'http', sqMainJar:'main jar', sqIndepJar:'indep jar',
    warnDockerNoBaseUrl:'Docker environment detected without BASE_URL configured. JAR proxy addresses may be unreachable from TVBox clients.<br>Set <b>BASE_URL=http://HOST_IP:PORT</b> in docker-compose.yml',
    footer:'TVBox Source Aggregator &middot; Cron 05:00 UTC Daily',
    navAdmin:'Admin', navConfigEditor:'Config Editor',
  },
  zh: {
    headerLabel:'系统监控', connecting:'连接中...', sites:'站点', lives:'直播',
    parses:'解析', sources:'源', lastAggregation:'上次聚合',
    configUrlLabel:'TVBox 配置地址', liveConfigUrlLabel:'直播配置地址',
    copy:'复制', copied:'已复制!', copyFailed:'失败', neverRefresh:'从未更新',
    fetchError:'获取状态失败', noData:'无数据',
    sourceHealth:'源健康状态', healthDetails:'详情', healthName:'名称',
    healthStatus:'状态', healthFails:'失败', healthLastOk:'最后成功',
    healthNoData:'暂无健康数据', healthNever:'--',
    searchQuota:'搜索配额', sqActive:'活跃', sqExcluded:'排除',
    sqName:'名称', sqSource:'来源', sqReason:'原因',
    sqPinned:'置顶', sqHttp:'HTTP', sqMainJar:'主 JAR', sqIndepJar:'独立 JAR',
    warnDockerNoBaseUrl:'检测到 Docker 环境但未配置 BASE_URL，JAR 代理地址可能不可达。<br>请在 docker-compose.yml 中设置 <b>BASE_URL=http://宿主机IP:端口</b>',
    footer:'TVBox 源聚合器 &middot; 每日 UTC 05:00 定时任务',
    navAdmin:'管理', navConfigEditor:'配置编辑',
  }
};

function t(key) { const l = getLang(); return translations[l]?.[key] || translations.en[key] || key; }

function doToggleLang() {
  const next = getLang() === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', next);
  applyLang(translations, next);
  loadStatus();
}

const configUrl = location.origin + '/';
$('configUrl').textContent = configUrl;
$('liveConfigUrl').textContent = location.origin + '/live-config';

async function loadStatus() {
  try {
    const res = await fetch('/status-data');
    const d = await res.json();

    $('statSites').textContent = d.sites ?? '—';
    $('statLives').textContent = d.lives ?? '—';
    $('statParses').textContent = d.parses ?? '—';
    $('statSources').textContent = d.sourceCount ?? '—';

    const dot = $('statusDot');
    const txt = $('statusText');
    const time = $('updateTime');

    if (d.lastUpdate && d.lastUpdate !== 'never') {
      const date = new Date(d.lastUpdate);
      const now = new Date();
      const diffH = (now - date) / 3.6e6;
      const fmt = date.toLocaleString('zh-CN', {
        year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit',
        hour12: false
      });

      time.textContent = fmt;
      time.className = 'update-time' + (diffH > 26 ? ' stale' : '');

      dot.className = 'status-dot';
      txt.textContent = 'Online · ' + d.sites + ' ' + t('sites').toLowerCase();
    } else {
      time.textContent = t('neverRefresh');
      time.className = 'update-time never';
      dot.className = 'status-dot offline';
      txt.textContent = t('noData');
    }

    // Render warnings
    const banner = $('warningBanner');
    const warnings = d.warnings || [];
    if (warnings.length > 0) {
      const WARN_KEYS = { docker_no_base_url: 'warnDockerNoBaseUrl' };
      banner.innerHTML = warnings.map(w => '<div class="warning-banner">⚠ ' + (t(WARN_KEYS[w] || w)) + '</div>').join('');
    } else {
      banner.innerHTML = '';
    }
  } catch (e) {
    $('statusDot').className = 'status-dot offline';
    $('statusText').textContent = t('error');
    $('updateTime').textContent = t('fetchError');
    $('updateTime').className = 'update-time never';
  }
}


function copyUrl(elementId) {
  const text = $(elementId).textContent;
  const btn = $(elementId).parentElement.querySelector('.copy-btn');
  function onOk() {
    btn.textContent = t('copied');
    btn.className = 'copy-btn copied';
    setTimeout(() => { btn.textContent = t('copy'); btn.className = 'copy-btn'; }, 2000);
  }
  function onFail() {
    btn.textContent = t('copyFailed');
    btn.className = 'copy-btn error';
    setTimeout(() => { btn.textContent = t('copy'); btn.className = 'copy-btn'; }, 2000);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onOk).catch(() => {
      fallbackCopy(text) ? onOk() : onFail();
    });
  } else {
    fallbackCopy(text) ? onOk() : onFail();
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
  return ok;
}

const STATUS_LABELS = {
  ok:'OK', http_error:'HTTP ERR', decode_error:'DECODE ERR',
  parse_error:'PARSE ERR', timeout:'TIMEOUT', network_error:'NET ERR'
};

async function loadSearchQuotaSummary() {
  try {
    const res = await fetch('/search-quota/summary');
    if (!res.ok) return;
    const d = await res.json();
    if (!d.enabled) {
      $('searchQuotaSection').style.display = 'none';
      return;
    }
    $('searchQuotaSection').style.display = '';
    $('sqActiveCount').textContent = d.searchable || 0;
    $('sqExcludedCount').textContent = (d.jsExcluded || 0) + (d.truncated || 0);

    const tbody = $('sqTableBody');
    let html = '';
    html += '<tr><td>Total</td><td colspan="3">' + (d.totalSites || '-') + ' sites</td></tr>';
    html += '<tr><td>JS excluded</td><td colspan="3">' + (d.jsExcluded || 0) + '</td></tr>';
    html += '<tr><td>Pinned</td><td colspan="3">' + (d.pinnedCount || 0) + '</td></tr>';
    if (d.truncated > 0) html += '<tr><td>Truncated</td><td colspan="3">' + d.truncated + '</td></tr>';
    html += '<tr style="font-weight:600"><td>Searchable</td><td colspan="3">' + (d.searchable || 0) + '</td></tr>';
    tbody.innerHTML = html;
  } catch {}
}
function escDash(s) { const d = document.createElement('div'); d.textContent = s || '-'; return d.innerHTML; }

async function loadSourceHealth() {
  try {
    const res = await fetch('/source-status');
    const records = await res.json();

    let ok = 0, warn = 0, err = 0;
    records.forEach(r => {
      if (r.consecutiveFailures >= 5) err++;
      else if (r.consecutiveFailures >= 3) warn++;
      else ok++;
    });

    $('healthOk').textContent = ok;
    $('healthWarn').textContent = warn;
    $('healthError').textContent = err;

    records.sort((a, b) => b.consecutiveFailures - a.consecutiveFailures);
    renderHealthTable(records);

    // 智能折叠：有 error 级别时自动展开
    const toggle = $('healthToggle');
    const body = $('healthBody');
    if (err > 0 && !toggle.classList.contains('open')) {
      toggle.classList.add('open');
      body.classList.add('open');
    }
  } catch {
    $('healthTableBody').innerHTML =
      '<tr><td colspan="6" class="empty">' + t('fetchError') + '</td></tr>';
  }
}

function renderHealthTable(records) {
  if (!records.length) {
    $('healthTableBody').innerHTML =
      '<tr><td colspan="6" class="empty">' + t('healthNoData') + '</td></tr>';
    return;
  }

  $('healthTableBody').innerHTML = records.map(r => {
    const level = r.consecutiveFailures >= 5 ? 'error'
               : r.consecutiveFailures >= 3 ? 'warn' : 'ok';
    const statusLabel = STATUS_LABELS[r.latestStatus] || r.latestStatus;

    const lastOk = r.lastSuccessTime
      ? new Date(r.lastSuccessTime).toLocaleString('zh-CN', {
          month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false
        })
      : t('healthNever');

    return '<tr class="row-' + level + '">' +
      '<td><span class="health-dot ' + level + '"></span></td>' +
      '<td>' + esc(r.name || 'Unnamed') + '</td>' +
      '<td class="url-cell" title="' + esc(r.url) + '">' + esc(r.url) + '</td>' +
      '<td class="status-' + level + '">' + statusLabel + '</td>' +
      '<td>' + r.consecutiveFailures + '</td>' +
      '<td>' + lastOk + '</td>' +
    '</tr>';
  }).join('');
}

applyTheme(getTheme());
initThemeDropdown();
loadBgFromServer();
loadVersion();
applyLang(translations, getLang());
loadStatus();
loadSourceHealth();
loadSearchQuotaSummary();
setInterval(loadStatus, 60000);
setInterval(loadSourceHealth, 60000);
</script>
</body>
</html>`;

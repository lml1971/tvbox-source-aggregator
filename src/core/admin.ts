import { sharedStyles } from './shared-styles';
import { sharedUi } from './shared-ui';

export const adminHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TVBox Aggregator - Admin</title>
<style>
${sharedStyles}

/* Admin-specific: action bar in header */
.agg-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-top:16px;
  padding:12px 16px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:6px;
  font-family:var(--mono);
  font-size:0.75rem;
  color:var(--text-dim);
}

.agg-bar .status-text{font-family:var(--mono);font-size:0.75rem;color:var(--text-dim)}
.agg-bar .status-text.success{color:var(--green)}
.agg-bar .status-text.error{color:var(--red)}

/* Inline form label */
.form-label{
  font-family:var(--mono);
  font-size:0.65rem;
  color:var(--text-dim);
  text-transform:uppercase;
  letter-spacing:0.1em;
  display:block;
  margin-bottom:4px;
}

/* Name transform grid */
.nt-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  margin-bottom:10px;
}

.nt-input{
  width:100%;
  font-family:var(--mono);
  font-size:0.8rem;
  padding:8px 12px;
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:4px;
  color:var(--text-bright);
  outline:none;
  transition:border-color 0.2s;
}

.nt-input:focus{border-color:var(--green)}

.nt-textarea{
  width:100%;
  min-height:60px;
  font-family:var(--mono);
  font-size:0.75rem;
  padding:8px 12px;
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:4px;
  color:var(--text-bright);
  resize:vertical;
  outline:none;
}

.nt-textarea:focus{border-color:var(--green)}

/* Cloud login cards */
.cloud-card{
  padding:12px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:6px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.cloud-card-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.cloud-card-name{
  font-weight:600;
  font-size:0.9rem;
  color:var(--text-bright);
}
.cloud-badge{
  font-family:var(--mono);
  font-size:0.65rem;
  padding:2px 8px;
  border-radius:10px;
  text-transform:uppercase;
  letter-spacing:0.05em;
}
.cloud-badge.valid{background:rgba(80,250,123,0.15);color:var(--green)}
.cloud-badge.expired{background:rgba(255,85,85,0.15);color:var(--red)}
.cloud-badge.none{background:rgba(136,136,136,0.15);color:var(--text-dim)}
.cloud-card-actions{display:flex;gap:6px;flex-wrap:wrap}
.cloud-card-time{font-family:var(--mono);font-size:0.7rem;color:var(--text-dim)}

/* Risk badges */
.risk-badge{
  font-family:var(--mono);
  font-size:0.7rem;
  padding:1px 6px;
  border-radius:8px;
}
.risk-badge.safe{background:rgba(80,250,123,0.15);color:var(--green)}
.risk-badge.low{background:rgba(80,250,123,0.1);color:var(--green)}
.risk-badge.high{background:rgba(255,85,85,0.15);color:var(--red)}
.risk-badge.unaudited{background:rgba(241,250,140,0.15);color:var(--yellow)}

/* QR modal */
.qr-modal-overlay{
  position:fixed;top:0;left:0;right:0;bottom:0;
  background:rgba(0,0,0,0.7);
  display:flex;align-items:center;justify-content:center;
  z-index:1000;
}
.qr-modal{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  padding:24px;
  min-width:300px;
  max-width:400px;
  text-align:center;
}
.qr-modal h3{margin:0 0 16px;color:var(--text-bright);font-size:1rem}
.qr-modal img{
  max-width:250px;
  max-height:250px;
  border-radius:4px;
  background:#fff;
  padding:8px;
}
.qr-status{
  margin-top:12px;
  font-family:var(--mono);
  font-size:0.8rem;
  color:var(--text-dim);
}
.qr-status.scanned{color:var(--yellow)}
.qr-status.confirmed{color:var(--green)}
.qr-status.expired{color:var(--red)}

/* Import textarea */
.import-textarea{
  width:100%;
  min-height:100px;
  font-family:var(--mono);
  font-size:0.75rem;
  padding:10px;
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:4px;
  color:var(--text-bright);
  resize:vertical;
  margin-bottom:8px;
}

/* Batch textarea */
.batch-textarea{
  width:100%;
  margin-top:8px;
  min-height:120px;
  font-family:var(--mono);
  font-size:0.75rem;
  padding:10px;
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:4px;
  color:var(--text-bright);
  resize:vertical;
}

/* Source health dot in list items */
.source-health-dot{
  width:8px;height:8px;
  border-radius:50%;
  flex-shrink:0;
  position:relative;
  cursor:default;
}

.source-health-dot.ok{
  background:var(--green);
  box-shadow:0 0 4px var(--green-glow);
}

.source-health-dot.warn{
  background:var(--amber);
  box-shadow:0 0 4px var(--amber-dim);
}

.source-health-dot.error{
  background:var(--red);
  box-shadow:0 0 4px var(--red-dim);
}

.source-health-dot.unknown{
  background:var(--text-dim);
}

.source-health-dot::after{
  content:attr(data-tooltip);
  position:absolute;
  left:50%;
  bottom:calc(100% + 8px);
  transform:translateX(-50%);
  padding:6px 10px;
  background:var(--surface-2);
  border:1px solid var(--border);
  border-radius:4px;
  font-family:var(--mono);
  font-size:0.6rem;
  color:var(--text);
  white-space:nowrap;
  pointer-events:none;
  opacity:0;
  transition:opacity 0.2s;
  z-index:10;
}

.source-health-dot:hover::after{
  opacity:1;
}

@media(max-width:560px){
  .nt-grid{grid-template-columns:1fr}
  .tabs{overflow-x:auto;flex-wrap:nowrap}
  .tab{padding:12px 14px;font-size:0.65rem}
}
</style>
<script>(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t)})()</script>
</head>
<body style="opacity:0">

<!-- Login -->
<div class="login-overlay" id="loginOverlay">
  <div class="login-box">
    <h2 data-i18n="loginTitle">Admin Access</h2>
    <p data-i18n="loginSubtitle">TVBox Aggregator Management</p>
    <div class="error-msg" id="loginError" data-i18n="invalidToken">Invalid token</div>
    <input type="password" id="loginInput" placeholder="Enter admin token" data-i18n-placeholder="enterToken" autocomplete="off">
    <button class="btn" style="width:100%" onclick="auth.doLogin()" data-i18n="login">Login</button>
  </div>
</div>

<!-- Main content -->
<div class="container" id="mainContent" style="display:none">
  <header class="header">
    <div class="header-top">
      <div class="header-label" data-i18n="headerLabel">Admin Console</div>
      <div style="display:flex;gap:8px;align-items:center">
        <span id="themeDropdown"></span>
        <button class="lang-toggle" id="langToggle" onclick="doToggleLang()">中文</button>
      </div>
    </div>
    <h1 class="header-title">Source <span>Manager</span></h1>
    <nav class="header-nav">
      <a href="/admin/config-editor" data-i18n="navConfigEditor">Config Editor</a>
      <a href="/status" data-i18n="navDashboard">Dashboard</a>
    </nav>
    <!-- Aggregation status bar -->
    <div class="agg-bar">
      <span class="status-text" id="aggStatus" data-i18n="loadingStatus">Loading...</span>
      <button class="btn btn-sm" id="refreshBtn" onclick="triggerRefresh()" data-i18n="refresh">Refresh</button>
    </div>
  </header>

  <!-- Tabs -->
  <div class="tabs">
    <div class="tab active" data-tab="sources" onclick="switchTab('sources')"><span data-i18n="tabSources">Sources</span> <span class="badge" id="badgeSources">0</span></div>
    <div class="tab" data-tab="maccms" onclick="switchTab('maccms')"><span data-i18n="tabMacCMS">MacCMS</span> <span class="badge" id="badgeMacCMS">0</span></div>
    <div class="tab" data-tab="live" onclick="switchTab('live')"><span data-i18n="tabLive">Live</span> <span class="badge" id="badgeLive">0</span></div>
    <div class="tab" data-tab="searchQuota" onclick="switchTab('searchQuota')" id="tabSearchQuota" style="display:none"><span data-i18n="tabSearchQuota">Search</span> <span class="badge" id="badgeSearchQuota">0</span></div>
    <div class="tab" data-tab="cloud" onclick="switchTab('cloud')"><span data-i18n="tabCloud">Cloud</span></div>
    <div class="tab" data-tab="settings" onclick="switchTab('settings')"><span data-i18n="tabSettings">Settings</span></div>
    <div class="tab" data-tab="aggLogs" onclick="switchTab('aggLogs')"><span data-i18n="tabAggLogs">Logs</span></div>
  </div>

  <!-- Sources Tab -->
  <div class="tab-panel active" id="panelSources">
    <!-- Add source -->
    <div class="section">
      <div class="section-title" data-i18n="addSource">Add Source</div>
      <div class="add-form">
        <input class="name-input" type="text" id="addName" placeholder="Name (optional)" data-i18n-placeholder="nameOptional">
        <input type="url" id="addUrl" placeholder="TVBox config JSON URL" data-i18n-placeholder="configJsonUrl">
        <input class="name-input" type="text" id="addConfigKey" placeholder="Config Key (optional, for AES ECB)">
        <button class="btn" id="addBtn" onclick="addSource()" data-i18n="add">Add</button>
      </div>
      <!-- Import (collapsible) -->
      <div class="collapsible-toggle" onclick="toggleCollapsible(this)" data-i18n="importConfig">Import Config</div>
      <div class="collapsible-body">
        <textarea id="importInput" class="import-textarea" placeholder="Paste TVBox JSON or URL here..." data-i18n-placeholder="importPlaceholder"></textarea>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-sm" id="importBtn" onclick="importConfig()" data-i18n="import">Import</button>
          <span class="status-text" id="importResult" style="font-family:var(--mono);font-size:0.75rem"></span>
        </div>
      </div>
    </div>

    <!-- Source list -->
    <div class="section">
      <div class="section-title">
        <span data-i18n="sourcesList">Sources</span>
        <span class="count" id="sourceCount">0</span>
      </div>
      <div class="source-list" id="sourceList">
        <div class="empty">Loading sources...</div>
      </div>
    </div>
  </div>

  <!-- MacCMS Tab -->
  <div class="tab-panel" id="panelMaccms">
    <!-- Add MacCMS -->
    <div class="section">
      <div class="section-title" data-i18n="addMacCMS">Add MacCMS Source</div>
      <div class="add-form">
        <input class="name-input" type="text" id="mcKey" placeholder="Key (e.g. hongniuzy)" data-i18n-placeholder="mcKeyPh">
        <input class="name-input" type="text" id="mcName" placeholder="Name" data-i18n-placeholder="mcNamePh">
        <input type="url" id="mcApi" placeholder="MacCMS API URL" data-i18n-placeholder="mcApiPh">
        <button class="btn" id="mcAddBtn" onclick="addMacCMS()" data-i18n="add">Add</button>
      </div>
      <!-- Batch import (collapsible) -->
      <div class="collapsible-toggle" onclick="toggleCollapsible(this)" data-i18n="batchImport">Batch Import</div>
      <div class="collapsible-body">
        <textarea id="mcBatchInput" class="batch-textarea" placeholder='[{"key":"...","name":"...","api":"..."}]'></textarea>
        <button class="btn btn-sm" style="margin-top:8px" id="mcBatchBtn" onclick="batchImportMacCMS()" data-i18n="submitBatch">Submit Batch</button>
      </div>
    </div>

    <!-- MacCMS list -->
    <div class="section">
      <div class="section-title">
        <span data-i18n="macCMSSources">MacCMS Sources</span>
        <span class="count" id="mcCount">0</span>
      </div>
      <div class="source-list" id="mcList">
        <div class="empty">Loading MacCMS sources...</div>
      </div>
    </div>
  </div>

  <!-- Live Tab -->
  <div class="tab-panel" id="panelLive">
    <!-- Add live source -->
    <div class="section">
      <div class="section-title" data-i18n="addLiveSource">Add Live Source</div>
      <div class="add-form">
        <input class="name-input" type="text" id="liveName" placeholder="Name (e.g. iptv365)" data-i18n-placeholder="liveNamePh">
        <input type="url" id="liveUrl" placeholder="m3u/txt URL" data-i18n-placeholder="liveUrlPh">
        <button class="btn" id="liveAddBtn" onclick="addLive()" data-i18n="add">Add</button>
      </div>
    </div>

    <!-- Live list -->
    <div class="section">
      <div class="section-title">
        <span data-i18n="liveSources">Live Sources</span>
        <span class="count" id="liveCount">0</span>
      </div>
      <div class="source-list" id="liveList">
        <div class="empty">Loading live sources...</div>
      </div>
    </div>

    <!-- Channel Probe (Node/Docker only) -->
    <div class="section" id="channelProbeSection">
      <div class="section-title" data-i18n="channelProbeTitle">Channel Speed Probe (Node/Docker)</div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" id="channelProbeCheck" onchange="toggleChannelProbe()">
          <span data-i18n="channelProbeEnable">Enable scheduled channel speed test (every 12h)</span>
        </label>
        <button class="btn btn-sm" id="channelProbeTriggerBtn" onclick="triggerChannelProbe()" data-i18n="channelProbeTrigger">Run Now</button>
        <button class="btn btn-sm" onclick="loadChannelProbe()" data-i18n="refresh">Refresh</button>
      </div>
      <div id="channelProbeStatus" style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6"></div>
    </div>

    <!-- Live Disable Toggle -->
    <div class="section">
      <div class="section-title" data-i18n="liveToggleTitle">Live Feature Toggle</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="liveDisabledCheck" onchange="saveLiveDisabled()">
          <span data-i18n="liveToggleLabel">Disable live aggregation (skip live merge, output empty lives)</span>
        </label>
        <span class="status-text" id="liveDisabledStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
    </div>

    <!-- Live Merge Mode -->
    <div class="section">
      <div class="section-title">直播合并模式</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button id="liveMergeSeparated" class="btn btn-sm active" onclick="setLiveMergeMode('separated')">📂 分离模式（按源分类）</button>
        <button id="liveMergeMerged" class="btn btn-sm" onclick="setLiveMergeMode('merged')">🔀 合并模式（去重混合）</button>
        <span class="status-text" id="liveMergeModeStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
      <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px">
        分离模式：每个直播源独立展示，用「源名」前缀区分。合并模式：所有源的频道按名称去重合并为统一列表。
      </div>
    </div>
  </div>

  <!-- Search Quota Tab -->
  <div class="tab-panel" id="panelSearchQuota">
    <div class="section">
      <div class="section-title" data-i18n="sqSelected">Active Search Sources</div>
      <div id="sqSelectedInfo" style="margin-bottom:8px;font-size:0.8rem;color:var(--text-secondary)"></div>
      <div id="sqSelectedTable" style="max-height:500px;overflow:auto">
        <div style="color:var(--text-secondary);font-size:0.85rem" data-i18n="sqNoData">Run aggregation to see results</div>
      </div>
    </div>
  </div>

  <!-- Cloud Tab -->
  <div class="tab-panel" id="panelCloud">
    <!-- 网盘登录 -->
    <div class="section">
      <div class="section-title" data-i18n="cloudLogin">Cloud Login</div>
      <div id="cloudLoginGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
      </div>
    </div>
    <!-- 手动粘贴凭证 -->
    <div class="section">
      <div class="section-title" data-i18n="cloudManualPaste">Manual Credential Paste</div>
      <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
        <div style="flex:0 0 140px">
          <label class="form-label" data-i18n="cloudPlatform">Platform</label>
          <select id="manualPlatform" class="nt-input" style="width:100%"></select>
        </div>
        <div style="flex:1;min-width:200px">
          <label class="form-label" data-i18n="cloudCredentialValue">Credential (cookie / token / JSON)</label>
          <input id="manualCredValue" class="nt-input" style="width:100%" placeholder="cookie=xxx; token=yyy">
        </div>
        <button class="btn btn-sm" onclick="manualPasteCredential()" data-i18n="save">Save</button>
      </div>
      <div id="manualPasteStatus" class="status-text" style="margin-top:6px"></div>
    </div>
    <!-- 风险管理 -->
    <div class="section">
      <div class="section-title" data-i18n="cloudRiskManagement">Risk Management</div>
      <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-sm" onclick="loadRiskReport()" data-i18n="cloudLoadReport">Load Risk Report</button>
        <span id="riskSummary" style="font-family:var(--mono);font-size:0.75rem;color:var(--text-dim)"></span>
      </div>
      <div id="riskReportContainer" style="display:none">
        <div style="overflow-x:auto">
          <table class="list-table" style="width:100%;font-size:0.8rem">
            <thead>
              <tr>
                <th data-i18n="cloudRiskName">Name</th>
                <th>Spider</th>
                <th data-i18n="cloudRiskLevel">Risk</th>
                <th data-i18n="cloudRiskPlatforms">Platforms</th>
                <th data-i18n="cloudRiskDomains">3rd Party</th>
                <th data-i18n="cloudRiskAction">Action</th>
              </tr>
            </thead>
            <tbody id="riskReportBody"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Settings Tab -->
  <div class="tab-panel" id="panelSettings">
    <!-- Cron Interval -->
    <div class="section">
      <div class="section-title" data-i18n="cronInterval">Aggregation Schedule</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <select id="cronSelect" class="nt-input" style="width:auto;min-width:160px">
          <option value="60" data-i18n-text="cronEvery1h">Every 1 hour</option>
          <option value="180" data-i18n-text="cronEvery3h">Every 3 hours</option>
          <option value="360" data-i18n-text="cronEvery6h">Every 6 hours</option>
          <option value="720" data-i18n-text="cronEvery12h">Every 12 hours</option>
          <option value="1440" data-i18n-text="cronEveryDay">Once a day</option>
        </select>
        <button class="btn btn-sm" id="cronSaveBtn" onclick="saveCronInterval()" data-i18n="save">Save</button>
        <span class="status-text" id="cronStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
    </div>

    <div class="section">
      <div class="section-title" data-i18n="speedTestToggle">Site Speed Test</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="speedTestCheck" onchange="saveSpeedTest()" checked>
          <span data-i18n="speedTestLabel">Enable site speed test and unreachable filtering</span>
        </label>
        <span class="status-text" id="speedTestStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
      <div style="margin-top:6px;font-size:0.8rem;color:var(--text-secondary)" data-i18n="speedTestDesc">When disabled, all sites are kept without testing reachability</div>
    </div>

    <div class="section">
      <div class="section-title" data-i18n="edgeProxies">Edge Function Proxies</div>
      <div style="margin-bottom:6px;font-size:0.8rem;color:var(--text-secondary)" data-i18n="edgeProxiesDesc">Configure edge function URLs for proxy fallback (fetch retry + image CDN). Local Docker mode only.</div>
      <div class="nt-grid">
        <div>
          <label class="form-label">Cloudflare Worker URL</label>
          <input type="text" id="edgeCfUrl" class="nt-input" placeholder="https://tvbox.example.com">
        </div>
        <div>
          <label class="form-label">Vercel Proxy URL</label>
          <input type="text" id="edgeVercelUrl" class="nt-input" placeholder="https://fetch.example.com">
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
        <button class="btn btn-sm" onclick="saveEdgeProxies()" data-i18n="save">Save</button>
        <span class="status-text" id="edgeProxiesStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
    </div>

    <div class="section">
      <div class="section-title" data-i18n="searchQuota">Search Quota</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label class="form-label" style="margin:0" data-i18n="maxSearchable">Max searchable</label>
        <input type="number" id="maxSearchableInput" class="nt-input" style="width:80px" min="0" max="1000" value="0">
        <button class="btn btn-sm" id="searchQuotaSaveBtn" onclick="saveSearchQuota()" data-i18n="save">Save</button>
        <span class="status-text" id="searchQuotaStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
      <div style="margin-top:6px;font-size:0.8rem;color:var(--text-secondary)" data-i18n="searchQuotaDesc">Limit searchable sources to reduce TVBox crashes. 0 = unlimited. JS sources are always excluded. Manage pinned sources in the Search tab.</div>
    </div>

    <div class="section">
      <div class="section-title" data-i18n="nameTransform">Name Transform</div>
      <div class="nt-grid">
        <div>
          <label class="form-label" data-i18n="ntPrefix">Prefix</label>
          <input type="text" id="ntPrefix" class="nt-input" placeholder="e.g. 【RioTV】" data-i18n-placeholder="ntPrefixPh">
        </div>
        <div>
          <label class="form-label" data-i18n="ntSuffix">Suffix</label>
          <input type="text" id="ntSuffix" class="nt-input" placeholder="e.g.  · Curated" data-i18n-placeholder="ntSuffixPh">
        </div>
      </div>
      <div style="margin-bottom:10px">
        <label class="form-label" data-i18n="ntPromoReplace">Promo Replacement (empty = delete)</label>
        <input type="text" id="ntPromoReplace" class="nt-input" placeholder="e.g. Premium" data-i18n-placeholder="ntPromoReplacePh">
      </div>
      <div style="margin-bottom:10px">
        <label class="form-label" data-i18n="ntExtraPatterns">Extra Clean Patterns (one regex per line)</label>
        <textarea id="ntExtraPatterns" class="nt-textarea" placeholder="e.g. sponsor[：:]\\S+" data-i18n-placeholder="ntExtraPatternsPh"></textarea>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn" id="ntSaveBtn" onclick="saveNameTransform()" data-i18n="save">Save</button>
        <span class="status-text" id="ntStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
    </div>

    <!-- 相似去重配置 -->
    <div class="section">
      <div class="section-title" data-i18n="dedupConfigTitle">Similar Name Dedup</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="similarDedupCheck" onchange="saveDedupConfig()" checked>
          <span data-i18n="similarDedupLabel">Enable similar-name dedup (keep fastest)</span>
        </label>
      </div>
      <div style="margin-top:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label class="form-label" style="margin:0" data-i18n="dedupThreshold">Threshold</label>
        <input type="range" id="dedupThreshold" min="50" max="100" value="85" style="width:120px" oninput="$('dedupThresholdVal').textContent=this.value+'%'">
        <span id="dedupThresholdVal" style="font-family:var(--mono);font-size:0.8rem">85%</span>
        <button class="btn btn-sm" onclick="saveDedupConfig()" data-i18n="save">Save</button>
        <span class="status-text" id="dedupStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
    </div>

    <!-- 分组排序 -->
    <div class="section">
      <div class="section-title" data-i18n="groupOrderTitle">Site Group Order</div>
      <div style="margin-bottom:10px;display:flex;gap:10px;align-items:center">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="groupOrderEnabled" onchange="saveGroupOrder()">
          <span data-i18n="groupOrderEnabled">Enable group ordering</span>
        </label>
        <select id="groupOrderUnmatched" class="nt-input" style="width:auto;min-width:120px" onchange="saveGroupOrder()">
          <option value="after">Unmatched → after</option>
          <option value="before">Unmatched → before</option>
        </select>
        <span class="status-text" id="groupOrderStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
      <div id="groupOrderRules"></div>
      <button class="btn btn-sm" onclick="addGroupRule()" style="margin-top:8px" data-i18n="groupOrderAdd">+ Add Rule</button>
    </div>

    <!-- 背景设置 -->
    <div class="section">
      <div class="section-title" data-i18n="bgSettingsTitle">Background Settings</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
        <select id="bgType" class="nt-input" style="width:auto;min-width:120px" onchange="onBgTypeChange()">
          <option value="default">Default</option>
          <option value="image">Image URL</option>
          <option value="solid">Solid Color</option>
          <option value="gradient">Gradient</option>
        </select>
      </div>
      <div id="bgImageGroup" style="display:none;margin-bottom:10px">
        <input type="text" id="bgImageUrl" class="nt-input" placeholder="https://example.com/bg.jpg">
      </div>
      <div id="bgSolidGroup" style="display:none;margin-bottom:10px">
        <input type="color" id="bgSolidColor" value="#0a0e14" style="width:50px;height:30px;border:none;cursor:pointer">
      </div>
      <div id="bgGradientGroup" style="display:none;margin-bottom:10px">
        <input type="text" id="bgGradient" class="nt-input" placeholder="linear-gradient(180deg, #0a0e14, #1a2030)">
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-sm" onclick="saveBgSettings()" data-i18n="save">Save</button>
        <span class="status-text" id="bgStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
    </div>

    <!-- 智能 Base URL -->
    <div class="section">
      <div class="section-title" data-i18n="smartBaseUrlTitle">Smart Base URL</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="smartBaseUrlCheck" onchange="saveSmartBaseUrl()">
          <span data-i18n="smartBaseUrlLabel">Auto-detect client host for JAR/image URLs (LAN only, set DMZ=0 to allow public)</span>
        </label>
        <span class="status-text" id="smartBaseUrlStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
    </div>

    <!-- 站点验活 -->
    <div class="section">
      <div class="section-title" data-i18n="siteProbeTitle">Site Probe &amp; Auto Clean</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
        <label class="form-label" style="margin:0" data-i18n="probeDepthLabel">Probe depth:</label>
        <select id="probeDepthSelect" class="nt-input" style="width:auto;min-width:140px" onchange="saveProbeDepth()">
          <option value="deep" data-i18n-text="probeDeep">Deep (validate content)</option>
          <option value="shallow" data-i18n-text="probeShallow">Shallow (HTTP only)</option>
        </select>
        <span class="status-text" id="probeDepthStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="autoCleanCheck" onchange="saveAutoClean()">
          <span data-i18n="autoCleanLabel">Auto-blacklist after 5 consecutive failures (max 5/run)</span>
        </label>
        <span class="status-text" id="autoCleanStatus" style="font-family:var(--mono);font-size:0.75rem"></span>
      </div>
      <div style="margin-top:6px;font-size:0.8rem;color:var(--text-dim)" data-i18n="siteProbeDesc">Deep mode checks type0/type1 content validity. Failed sites get [⚠] marker after 3 failures.</div>
    </div>
  </div>

  <!-- Agg Logs Tab -->
  <div class="tab-panel" id="panelAggLogs">
    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="section-title" style="margin:0" data-i18n="aggLogsTitle">Aggregation Logs</div>
        <button class="btn btn-sm" onclick="clearAggLogs()" data-i18n="clearLogs">Clear All</button>
      </div>
      <div id="aggLogsList" style="font-size:0.85rem"></div>
    </div>
  </div>

  <div class="footer">
    <span data-i18n="footer">TVBox Source Aggregator &middot; Admin Console</span>
  </div>
</div>

<script>
${sharedUi}

// --- i18n ---
const translations = {
  en: {
    loginTitle:'Admin Access', loginSubtitle:'TVBox Aggregator Management',
    invalidToken:'Invalid token', enterToken:'Enter admin token', login:'Login',
    connectionFailed:'Connection failed',
    headerLabel:'Admin Console', navConfigEditor:'Config Editor', navDashboard:'Dashboard',
    tabSources:'Sources', tabMacCMS:'MacCMS', tabLive:'Live', tabSettings:'Settings', tabAggLogs:'Logs',
    aggLogsTitle:'Aggregation Logs', clearLogs:'Clear All',
    dedupConfigTitle:'Similar Name Dedup', similarDedupLabel:'Enable similar-name dedup (keep fastest)', dedupThreshold:'Threshold',
    groupOrderTitle:'Site Group Order', groupOrderEnabled:'Enable group ordering', groupOrderAdd:'+ Add Rule',
    bgSettingsTitle:'Background Settings',
    addSource:'Add Source', aggregation:'Aggregation', sourcesList:'Sources',
    addMacCMS:'Add MacCMS Source', macCMSSources:'MacCMS Sources',
    addLiveSource:'Add Live Source', liveSources:'Live Sources',
    nameOptional:'Name (optional)', configJsonUrl:'TVBox config JSON URL',
    mcKeyPh:'Key (e.g. hongniuzy)', mcNamePh:'Name', mcApiPh:'MacCMS API URL',
    liveNamePh:'Name (e.g. iptv365)', liveUrlPh:'m3u/txt URL',
    add:'Add', adding:'Adding...', batchImport:'Batch Import',
    submitBatch:'Submit Batch',
    refresh:'Refresh', running:'Running...', remove:'Remove', test:'Test',
    loadingStatus:'Loading...',
    lastUpdate:'Last update: ', neverUpdated:'Never updated — click Refresh',
    failedLoadStatus:'Failed to load status',
    noSources:'No sources configured. Add one above.',
    noMacCMS:'No MacCMS sources. Add one above.',
    noLives:'No live sources. Add one above.',
    failedLoad:'Failed to load sources',
    failedLoadMacCMS:'Failed to load MacCMS sources',
    failedLoadLives:'Failed to load live sources',
    sourceAdded:'Source added', sourceRemoved:'Source removed',
    networkError:'Network error', testing:'Testing...',
    valid:'Valid', invalidUnreachable:'Invalid / Unreachable',
    liveSourceAdded:'Live source added', removed:'Removed',
    invalidJson:'Invalid JSON', mustBeArray:'Must be a JSON array',
    allFieldsRequired:'All fields required', importFailed:'Import failed',
    aggregationStarted:'Aggregation started', refreshFailed:'Refresh failed',
    importConfig:'Import Config', import:'Import', importing:'Importing...',
    importPlaceholder:'Paste TVBox JSON or URL here...',
    importMulti:'Multi-repo detected', importSingle:'Single config detected',
    importAdded:'added', importDuplicates:'duplicates', importParseFailed:'Failed to parse',
    nameTransform:'Name Transform', ntPrefix:'Prefix', ntSuffix:'Suffix',
    ntPromoReplace:'Promo Replacement (empty = delete)', ntExtraPatterns:'Extra Clean Patterns (one regex per line)',
    ntPrefixPh:'e.g. 【RioTV】', ntSuffixPh:'e.g.  · Curated',
    ntPromoReplacePh:'e.g. Premium', ntExtraPatternsPh:'e.g. sponsor[：:]\\\\S+',
    cronInterval:'Aggregation Schedule',
    speedTestToggle:'Site Speed Test', speedTestLabel:'Enable site speed test and unreachable filtering', speedTestDesc:'When disabled, all sites are kept without testing reachability',
    edgeProxies:'Edge Function Proxies', edgeProxiesDesc:'Configure edge function URLs for proxy fallback (fetch retry + image CDN). Local Docker mode only.',
    refreshing:'Refreshing...', loading:'Loading...',
    cronEvery1h:'Every 1 hour', cronEvery3h:'Every 3 hours', cronEvery6h:'Every 6 hours',
    cronEvery12h:'Every 12 hours', cronEveryDay:'Once a day',
    save:'Save', saving:'Saving...', saved:'Saved', saveFailed:'Save failed',
    noHealthData:'No data yet', healthFails:'Fails',
    healthLastOk:'Last OK',
    searchQuota:'Search Quota',
    maxSearchable:'Max searchable', searchQuotaDesc:'Limit searchable sources to reduce TVBox crashes. 0 = unlimited. Manage pinned sources in the Search tab.',
    tabSearchQuota:'Search',
    sqSelected:'Active Search Sources', sqNoData:'Run aggregation to see results',
    sqKey:'Key', sqName:'Name', sqSource:'Source', sqReason:'Reason', sqAction:'Action',
    sqPin:'Pin', sqUnpin:'Unpin',
    sqPinned:'Pinned', sqPinnedDesc:'Drag to reorder. Top sources are searched first in TVBox.', sqOtherSources:'Other Sources',
    sqHttp:'http', sqMainJar:'main jar', sqIndepJar:'indep jar',
    channelProbeTitle:'Channel Speed Probe (Node/Docker)',
    channelProbeEnable:'Enable scheduled channel speed test (every 12h)',
    channelProbeTrigger:'Run Now',
    channelProbeIdle:'Idle', channelProbeRunning:'Running', channelProbeDone:'Completed', channelProbeError:'Error',
    channelProbeState:'State', channelProbeProgress:'Progress', channelProbeCoverage:'Coverage',
    channelProbeChannels:'Channels', channelProbeDuration:'Duration', channelProbeFinished:'Finished at',
    channelProbeStarted:'Probe started', channelProbeDisabledFirst:'Enable probe first', channelProbeAlreadyRunning:'Already running',
    channelProbeCfOnly:'Only Node/Docker supports channel probing',
    liveToggleTitle:'Live Feature Toggle', liveToggleLabel:'Disable live aggregation (skip live merge, output empty lives)',
    smartBaseUrlTitle:'Smart Base URL', smartBaseUrlLabel:'Auto-detect client host for JAR/image URLs (LAN only, set DMZ=0 to allow public)',
    siteProbeTitle:'Site Probe & Auto Clean', probeDepthLabel:'Probe depth:',
    probeDeep:'Deep (validate content)', probeShallow:'Shallow (HTTP only)',
    autoCleanLabel:'Auto-blacklist after 5 consecutive failures (max 5/run)',
    siteProbeDesc:'Deep mode checks type0/type1 content validity. Failed sites get [⚠] marker after 3 failures.',
    footer:'TVBox Source Aggregator &middot; Admin Console',
  },
  zh: {
    loginTitle:'管理登录', loginSubtitle:'TVBox 聚合器管理',
    invalidToken:'无效的令牌', enterToken:'请输入管理令牌', login:'登录',
    connectionFailed:'连接失败',
    headerLabel:'管理控制台', navConfigEditor:'配置编辑', navDashboard:'仪表盘',
    tabSources:'源', tabMacCMS:'MacCMS', tabLive:'直播', tabSettings:'设置', tabAggLogs:'日志',
    aggLogsTitle:'聚合日志', clearLogs:'清空',
    dedupConfigTitle:'相似名称去重', similarDedupLabel:'启用相似名称去重（保留最快）', dedupThreshold:'阈值',
    groupOrderTitle:'站点分组排序', groupOrderEnabled:'启用分组排序', groupOrderAdd:'+ 添加规则',
    bgSettingsTitle:'背景设置',
    addSource:'添加源', aggregation:'聚合', sourcesList:'源列表',
    addMacCMS:'添加 MacCMS 源', macCMSSources:'MacCMS 源列表',
    addLiveSource:'添加直播源', liveSources:'直播源列表',
    nameOptional:'名称（可选）', configJsonUrl:'TVBox 配置 JSON 地址',
    mcKeyPh:'Key（如 hongniuzy）', mcNamePh:'名称', mcApiPh:'MacCMS API 地址',
    liveNamePh:'名称（如 iptv365）', liveUrlPh:'m3u/txt 地址',
    add:'添加', adding:'添加中...', batchImport:'批量导入',
    submitBatch:'提交批量',
    refresh:'刷新', running:'运行中...', remove:'删除', test:'测试',
    loadingStatus:'加载中...',
    lastUpdate:'上次更新: ', neverUpdated:'从未更新 — 点击刷新',
    failedLoadStatus:'获取状态失败',
    noSources:'暂无源。请在上方添加。',
    noMacCMS:'暂无 MacCMS 源。请在上方添加。',
    noLives:'暂无直播源。请在上方添加。',
    failedLoad:'加载源失败',
    failedLoadMacCMS:'加载 MacCMS 源失败',
    failedLoadLives:'加载直播源失败',
    sourceAdded:'源已添加', sourceRemoved:'源已删除',
    networkError:'网络错误', testing:'测试中...',
    valid:'有效', invalidUnreachable:'无效/不可达',
    liveSourceAdded:'直播源已添加', removed:'已删除',
    invalidJson:'无效的 JSON', mustBeArray:'必须是 JSON 数组',
    allFieldsRequired:'所有字段必填', importFailed:'导入失败',
    aggregationStarted:'聚合已开始', refreshFailed:'刷新失败',
    importConfig:'导入配置', import:'导入', importing:'导入中...',
    importPlaceholder:'粘贴 TVBox JSON 内容或 URL...',
    importMulti:'检测到多仓', importSingle:'检测到单仓',
    importAdded:'已添加', importDuplicates:'重复跳过', importParseFailed:'解析失败',
    nameTransform:'名称定制', ntPrefix:'前缀', ntSuffix:'后缀',
    ntPromoReplace:'推广替换文字（留空则删除）', ntExtraPatterns:'额外清洗正则（每行一条）',
    ntPrefixPh:'如 【RioTV】', ntSuffixPh:'如  · 精选',
    ntPromoReplacePh:'如 精选推荐', ntExtraPatternsPh:'如 sponsor[：:]\\\\S+',
    cronInterval:'聚合频率',
    speedTestToggle:'站点测速', speedTestLabel:'启用站点测速与不可达剔除', speedTestDesc:'关闭后保留所有站点，不进行可达性检测',
    edgeProxies:'边缘函数代理', edgeProxiesDesc:'配置边缘函数 URL，用于本地 Docker 模式的请求代理回退和图片 CDN 加速',
    refreshing:'刷新中...', loading:'加载中...',
    cronEvery1h:'每 1 小时', cronEvery3h:'每 3 小时', cronEvery6h:'每 6 小时',
    cronEvery12h:'每 12 小时', cronEveryDay:'每天一次',
    save:'保存', saving:'保存中...', saved:'已保存', saveFailed:'保存失败',
    noHealthData:'暂无数据', healthFails:'失败',
    healthLastOk:'最后成功',
    searchQuota:'搜索配额',
    maxSearchable:'可搜索源上限', searchQuotaDesc:'限制可搜索源数量，减少 TVBox 搜索崩溃。0 = 不限制。置顶源在搜索页签管理。',
    tabSearchQuota:'搜索',
    sqSelected:'活跃搜索源', sqNoData:'执行聚合后查看结果',
    sqKey:'Key', sqName:'名称', sqSource:'来源', sqReason:'原因', sqAction:'操作',
    sqPin:'置顶', sqUnpin:'取消置顶',
    sqPinned:'置顶源', sqPinnedDesc:'上下移动排序，排在前面的源在 TVBox 搜索时优先执行', sqOtherSources:'其他源',
    sqHttp:'HTTP', sqMainJar:'主 JAR', sqIndepJar:'独立 JAR',
    channelProbeTitle:'频道级测速（仅 Node/Docker）',
    channelProbeEnable:'启用定时频道测速（每 12 小时）',
    channelProbeTrigger:'立即执行',
    channelProbeIdle:'空闲', channelProbeRunning:'运行中', channelProbeDone:'已完成', channelProbeError:'失败',
    channelProbeState:'状态', channelProbeProgress:'进度', channelProbeCoverage:'覆盖率',
    channelProbeChannels:'频道数', channelProbeDuration:'耗时', channelProbeFinished:'完成时间',
    channelProbeStarted:'测速已启动', channelProbeDisabledFirst:'请先启用测速', channelProbeAlreadyRunning:'已在运行',
    channelProbeCfOnly:'仅 Node/Docker 支持频道级测速',
    liveToggleTitle:'直播功能', liveToggleLabel:'禁用直播聚合（跳过直播合并，输出空 lives）',
    smartBaseUrlTitle:'智能地址响应', smartBaseUrlLabel:'根据客户端访问地址自动生成资源链接（仅局域网，设置 DMZ=0 允许公网）',
    siteProbeTitle:'站点验活与自动清理', probeDepthLabel:'验活深度：',
    probeDeep:'深度（验证内容有效性）', probeShallow:'浅层（仅 HTTP 可达）',
    autoCleanLabel:'连续失败 5 次自动屏蔽（每次最多 5 个）',
    siteProbeDesc:'深度模式会检查 type0/type1 站点是否返回有效内容。连续失败 3 次的站点会被标记 [⚠]。',
    footer:'TVBox 源聚合器 &middot; 管理控制台',
  }
};

function t(key) { const l = getLang(); return translations[l]?.[key] || translations.en[key] || key; }

function doToggleLang() {
  const next = getLang() === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', next);
  applyLang(translations, next);
  loadAll();
}

// --- Auth ---
const auth = initAuth('loginInput', 'loginError', 'loginOverlay', 'mainContent', '/admin/sources', loadAll);

// --- Tab switching ---
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => {
    const id = 'panel' + tab.charAt(0).toUpperCase() + tab.slice(1);
    p.classList.toggle('active', p.id === id);
  });
}

// --- Source health ---
let healthMap = {};

async function loadSourceHealth() {
  try {
    const res = await fetch('/source-status');
    const records = await res.json();
    healthMap = {};
    records.forEach(r => { healthMap[r.url] = r; });
  } catch {
    healthMap = {};
  }
}

// --- Load data ---
async function loadAll() {
  await loadSourceHealth();
  loadSources();
  loadMacCMS();
  loadLives();
  loadStatus();
  loadNameTransform();
  loadCronInterval();
  loadSpeedTest();
  loadEdgeProxies();
  loadSearchQuota();
  loadCloudCredentials();
  loadChannelProbe();
  loadDedupConfig();
  loadGroupOrder();
  loadBgSettings();
  loadAggLogs();
}

async function loadStatus() {
  try {
    const res = await fetch('/status-data');
    const d = await res.json();
    if (d.lastUpdate && d.lastUpdate !== 'never') {
      const date = new Date(d.lastUpdate);
      const fmt = date.toLocaleString('zh-CN', {
        year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit',
        hour12: false
      });
      $('aggStatus').textContent = t('lastUpdate') + fmt + ' | ' + d.sites + ' sites, ' + d.parses + ' parses, ' + d.lives + ' lives' + (d.liveSourceCount ? ', ' + d.liveSourceCount + ' live sources' : '');
      $('aggStatus').className = 'status-text';
    } else {
      $('aggStatus').textContent = t('neverUpdated');
      $('aggStatus').className = 'status-text error';
    }
  } catch {
    $('aggStatus').textContent = t('failedLoadStatus');
    $('aggStatus').className = 'status-text error';
  }
}

async function loadSources() {
  const list = $('sourceList');
  try {
    const res = await auth.authFetch('/admin/sources');
    const sources = await res.json();
    $('sourceCount').textContent = sources.length;
    $('badgeSources').textContent = sources.length;

    if (sources.length === 0) {
      list.innerHTML = '<div class="empty">' + t('noSources') + '</div>';
      return;
    }

    list.innerHTML = sources.map(s => {
      const h = healthMap[s.url];
      const level = !h ? 'unknown'
        : h.consecutiveFailures >= 5 ? 'error'
        : h.consecutiveFailures >= 3 ? 'warn' : 'ok';
      const tip = !h ? t('noHealthData')
        : h.latestStatus + ' | ' + t('healthFails') + ': ' + h.consecutiveFailures +
          (h.lastSuccessTime ? ' | ' + t('healthLastOk') + ': ' + new Date(h.lastSuccessTime).toLocaleString() : '');

      return \`<div class="source-item">
        <span class="source-health-dot \${level}" data-tooltip="\${esc(tip)}"></span>
        <div class="source-info">
          <div class="source-name">\${esc(s.name || 'Unnamed')}\${s.configKey ? ' 🔑' : ''}</div>
          <div class="source-url">\${esc(s.url)}</div>
        </div>
        <div class="source-actions">
          <button class="btn btn-sm btn-danger" onclick="removeSource('\${esc(s.url)}')">\${t('remove')}</button>
        </div>
      </div>\`;
    }).join('');
  } catch {
    list.innerHTML = '<div class="empty">' + t('failedLoad') + '</div>';
  }
}

// --- Add source ---
async function addSource() {
  const url = $('addUrl').value.trim();
  if (!url) { $('addUrl').focus(); return; }
  const name = $('addName').value.trim() || '';
  const configKey = $('addConfigKey').value.trim() || '';

  const btn = $('addBtn');
  btn.textContent = t('adding');
  btn.className = 'btn loading';

  try {
    const payload = { name, url };
    if (configKey) payload.configKey = configKey;
    const res = await auth.authFetch('/admin/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    if (res.ok) {
      toast(t('sourceAdded'));
      $('addUrl').value = '';
      $('addName').value = '';
      $('addConfigKey').value = '';
      loadSources();
    } else {
      toast(d.error || t('failedLoad'), 'error');
    }
  } catch {
    toast(t('networkError'), 'error');
  }

  btn.textContent = t('add');
  btn.className = 'btn';
}

// --- Remove source ---
async function removeSource(url) {
  try {
    const res = await auth.authFetch('/admin/sources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (res.ok) {
      toast(t('sourceRemoved'));
      loadSources();
    } else {
      const d = await res.json();
      toast(d.error || t('remove'), 'error');
    }
  } catch {
    toast(t('networkError'), 'error');
  }
}

// --- MacCMS ---
async function loadMacCMS() {
  const list = $('mcList');
  try {
    const res = await auth.authFetch('/admin/maccms');
    const sources = await res.json();
    $('mcCount').textContent = sources.length;
    $('badgeMacCMS').textContent = sources.length;

    if (sources.length === 0) {
      list.innerHTML = '<div class="empty">' + t('noMacCMS') + '</div>';
      return;
    }

    list.innerHTML = sources.map(s => \`
      <div class="source-item">
        <span class="source-tag manual">\${esc(s.key)}</span>
        <div class="source-info">
          <div class="source-name">\${esc(s.name)}</div>
          <div class="source-url">\${esc(s.api)}</div>
        </div>
        <div class="source-actions" style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="validateMC('\${esc(s.api)}')">\${t('test')}</button>
          <button class="btn btn-sm btn-danger" onclick="removeMC('\${esc(s.key)}')">\${t('remove')}</button>
        </div>
      </div>
    \`).join('');
  } catch {
    list.innerHTML = '<div class="empty">' + t('failedLoadMacCMS') + '</div>';
  }
}

async function addMacCMS() {
  const key = $('mcKey').value.trim();
  const name = $('mcName').value.trim();
  const api = $('mcApi').value.trim();
  if (!key || !name || !api) { toast(t('allFieldsRequired'), 'error'); return; }

  const btn = $('mcAddBtn');
  btn.textContent = t('adding');
  btn.className = 'btn loading';

  try {
    const res = await auth.authFetch('/admin/maccms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, name, api })
    });
    const d = await res.json();
    if (res.ok) {
      toast('Added ' + (d.added || 1) + ' MacCMS source(s)');
      $('mcKey').value = '';
      $('mcName').value = '';
      $('mcApi').value = '';
      loadMacCMS();
    } else {
      toast(d.error || 'Failed', 'error');
    }
  } catch { toast(t('networkError'), 'error'); }

  btn.textContent = t('add');
  btn.className = 'btn';
}

async function removeMC(key) {
  try {
    const res = await auth.authFetch('/admin/maccms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    if (res.ok) { toast('Removed'); loadMacCMS(); }
    else { const d = await res.json(); toast(d.error || 'Failed', 'error'); }
  } catch { toast(t('networkError'), 'error'); }
}

async function validateMC(api) {
  toast(t('testing'));
  try {
    const res = await auth.authFetch('/admin/maccms/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api })
    });
    const d = await res.json();
    toast(d.valid ? t('valid') : t('invalidUnreachable'), d.valid ? 'success' : 'error');
  } catch { toast(t('networkError'), 'error'); }
}

async function batchImportMacCMS() {
  const raw = $('mcBatchInput').value.trim();
  if (!raw) return;
  let data;
  try { data = JSON.parse(raw); } catch { toast(t('invalidJson'), 'error'); return; }
  if (!Array.isArray(data)) { toast(t('mustBeArray'), 'error'); return; }

  try {
    const res = await auth.authFetch('/admin/maccms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const d = await res.json();
    if (res.ok) {
      toast('Imported ' + (d.added || 0) + ' source(s)');
      $('mcBatchInput').value = '';
      loadMacCMS();
    } else {
      toast(d.error || t('importFailed'), 'error');
    }
  } catch { toast(t('networkError'), 'error'); }
}

// --- Live Sources ---
async function loadLives() {
  const list = $('liveList');
  try {
    const res = await auth.authFetch('/admin/lives');
    const entries = await res.json();
    $('liveCount').textContent = entries.length;
    $('badgeLive').textContent = entries.length;

    if (entries.length === 0) {
      list.innerHTML = '<div class="empty">' + t('noLives') + '</div>';
      return;
    }

    list.innerHTML = entries.map(s => \`
      <div class="source-item">
        <span class="source-tag manual">LIVE</span>
        <div class="source-info">
          <div class="source-name">\${esc(s.name || 'Unnamed')}</div>
          <div class="source-url">\${esc(s.url)}</div>
        </div>
        <div class="source-actions">
          <button class="btn btn-sm btn-danger" onclick="removeLive('\${esc(s.url)}')">\${t('remove')}</button>
        </div>
      </div>
    \`).join('');
  } catch {
    list.innerHTML = '<div class="empty">' + t('failedLoadLives') + '</div>';
  }
}

async function addLive() {
  const url = $('liveUrl').value.trim();
  if (!url) { $('liveUrl').focus(); return; }
  const name = $('liveName').value.trim() || '';

  const btn = $('liveAddBtn');
  btn.textContent = t('adding');
  btn.className = 'btn loading';

  try {
    const res = await auth.authFetch('/admin/lives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url })
    });
    const d = await res.json();
    if (res.ok) {
      toast(t('liveSourceAdded'));
      $('liveUrl').value = '';
      $('liveName').value = '';
      loadLives();
    } else {
      toast(d.error || 'Failed to add', 'error');
    }
  } catch {
    toast(t('networkError'), 'error');
  }

  btn.textContent = t('add');
  btn.className = 'btn';
}

async function removeLive(url) {
  try {
    const res = await auth.authFetch('/admin/lives', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (res.ok) { toast(t('removed')); loadLives(); }
    else { const d = await res.json(); toast(d.error || 'Failed', 'error'); }
  } catch { toast(t('networkError'), 'error'); }
}

// --- Import Config ---
async function importConfig() {
  const input = $('importInput').value.trim();
  if (!input) { $('importInput').focus(); return; }

  const btn = $('importBtn');
  const result = $('importResult');
  btn.textContent = t('importing');
  btn.className = 'btn btn-sm loading';
  result.textContent = '';

  try {
    const res = await auth.authFetch('/admin/sources/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });
    const d = await res.json();
    if (res.ok) {
      const typeLabel = d.type === 'multi' ? t('importMulti') : t('importSingle');
      result.textContent = typeLabel + ': ' + d.added + ' ' + t('importAdded') + (d.duplicates > 0 ? ', ' + d.duplicates + ' ' + t('importDuplicates') : '');
      result.className = 'status-text success';
      if (d.added > 0) {
        $('importInput').value = '';
        loadSources();
      }
    } else {
      result.textContent = d.error || t('importParseFailed');
      result.className = 'status-text error';
    }
  } catch {
    result.textContent = t('networkError');
    result.className = 'status-text error';
  }

  btn.textContent = t('import');
  btn.className = 'btn btn-sm';
}

// --- Name Transform ---
async function loadNameTransform() {
  try {
    const res = await auth.authFetch('/admin/name-transform');
    if (!res.ok) return;
    const d = await res.json();
    $('ntPrefix').value = d.prefix || '';
    $('ntSuffix').value = d.suffix || '';
    $('ntPromoReplace').value = d.promoReplacement || '';
    $('ntExtraPatterns').value = (d.extraCleanPatterns || []).join('\\n');
  } catch {}
}

async function saveNameTransform() {
  const btn = $('ntSaveBtn');
  const status = $('ntStatus');
  btn.textContent = t('saving');
  btn.className = 'btn loading';
  status.textContent = '';

  const extraRaw = $('ntExtraPatterns').value.trim();
  const extraCleanPatterns = extraRaw ? extraRaw.split('\\n').map(s => s.trim()).filter(Boolean) : [];

  try {
    const res = await auth.authFetch('/admin/name-transform', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prefix: $('ntPrefix').value || '',
        suffix: $('ntSuffix').value || '',
        promoReplacement: $('ntPromoReplace').value || '',
        extraCleanPatterns
      })
    });
    const d = await res.json();
    if (res.ok) {
      status.textContent = t('saved');
      status.className = 'status-text success';
    } else {
      status.textContent = d.error || t('saveFailed');
      status.className = 'status-text error';
    }
  } catch {
    status.textContent = t('networkError');
    status.className = 'status-text error';
  }

  btn.textContent = t('save');
  btn.className = 'btn';
  setTimeout(() => { status.textContent = ''; }, 3000);
}

// --- Cron Interval ---
async function loadCronInterval() {
  try {
    const res = await auth.authFetch('/admin/cron-interval');
    if (!res.ok) return;
    const d = await res.json();
    $('cronSelect').value = String(d.interval || 1440);
  } catch {}
}

async function saveCronInterval() {
  const btn = $('cronSaveBtn');
  const status = $('cronStatus');
  btn.textContent = t('saving');
  btn.className = 'btn btn-sm loading';
  status.textContent = '';

  try {
    const res = await auth.authFetch('/admin/cron-interval', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: parseInt($('cronSelect').value) })
    });
    const d = await res.json();
    if (res.ok) {
      status.textContent = t('saved');
      status.className = 'status-text success';
    } else {
      status.textContent = d.error || t('saveFailed');
      status.className = 'status-text error';
    }
  } catch {
    status.textContent = t('networkError');
    status.className = 'status-text error';
  }

  btn.textContent = t('save');
  btn.className = 'btn btn-sm';
  setTimeout(() => { status.textContent = ''; }, 3000);
}

// --- Speed Test Toggle ---
async function loadSpeedTest() {
  try {
    const res = await auth.authFetch('/admin/speed-test');
    if (res.ok) {
      const d = await res.json();
      $('speedTestCheck').checked = d.enabled;
    }
  } catch {}
}

async function saveSpeedTest() {
  const status = $('speedTestStatus');
  const enabled = $('speedTestCheck').checked;
  status.textContent = '';

  try {
    const res = await auth.authFetch('/admin/speed-test', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    if (res.ok) {
      status.textContent = t('saved');
      status.className = 'status-text success';
    } else {
      const d = await res.json();
      status.textContent = d.error || t('saveFailed');
      status.className = 'status-text error';
    }
  } catch {
    status.textContent = t('networkError');
    status.className = 'status-text error';
  }

  setTimeout(() => { status.textContent = ''; }, 3000);
}

// --- Channel Probe (Node/Docker) ---
async function loadChannelProbe() {
  const box = $('channelProbeStatus');
  try {
    const res = await auth.authFetch('/admin/channel-probe/status');
    if (res.status === 404) {
      $('channelProbeSection').style.display = 'none';
      return;
    }
    if (!res.ok) {
      box.textContent = t('channelProbeCfOnly');
      return;
    }
    const d = await res.json();
    $('channelProbeCheck').checked = !!d.enabled;
    const s = d.status || {};
    const stateLabel = { idle: t('channelProbeIdle'), running: t('channelProbeRunning'), done: t('channelProbeDone'), error: t('channelProbeError') }[s.state] || s.state || '-';
    const lines = [];
    lines.push(t('channelProbeState') + ': ' + stateLabel + (d.running ? ' ⏳' : ''));
    if (s.totalUrls) {
      lines.push(t('channelProbeProgress') + ': ' + (s.probed || 0) + ' / ' + s.totalUrls + ' | ' + t('channelProbeCoverage') + ': ' + (s.coverage || 0) + '% | ' + t('channelProbeChannels') + ': ' + (s.totalChannels || 0));
    }
    if (s.durationMs) {
      lines.push(t('channelProbeDuration') + ': ' + (s.durationMs / 1000).toFixed(1) + 's');
    }
    if (s.finishedAt) {
      lines.push(t('channelProbeFinished') + ': ' + new Date(s.finishedAt).toLocaleString());
    }
    if (s.error) {
      lines.push('⚠️ ' + s.error);
    }
    box.innerHTML = lines.map(l => '<div>' + l.replace(/</g,'&lt;') + '</div>').join('');
  } catch {
    box.textContent = t('networkError');
  }
}

async function toggleChannelProbe() {
  const enabled = $('channelProbeCheck').checked;
  try {
    await auth.authFetch('/admin/channel-probe/toggle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    toast(t('saved'));
    loadChannelProbe();
  } catch {
    toast(t('networkError'), 'error');
  }
}

async function triggerChannelProbe() {
  const btn = $('channelProbeTriggerBtn');
  btn.disabled = true;
  try {
    const res = await auth.authFetch('/admin/channel-probe/trigger', { method: 'POST' });
    const d = await res.json();
    if (res.ok) {
      toast(t('channelProbeStarted'));
      setTimeout(loadChannelProbe, 500);
    } else {
      toast(d.error || 'Failed', 'error');
    }
  } catch {
    toast(t('networkError'), 'error');
  } finally {
    btn.disabled = false;
  }
}

// --- Edge Proxies ---
async function loadEdgeProxies() {
  try {
    const res = await auth.authFetch('/admin/edge-proxies');
    if (res.ok) {
      const d = await res.json();
      $('edgeCfUrl').value = d.cf || '';
      $('edgeVercelUrl').value = d.vercel || '';
    }
  } catch {}
}

async function saveEdgeProxies() {
  const status = $('edgeProxiesStatus');
  try {
    const res = await auth.authFetch('/admin/edge-proxies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cf: $('edgeCfUrl').value.trim(), vercel: $('edgeVercelUrl').value.trim() })
    });
    if (res.ok) {
      status.textContent = t('saved');
      status.className = 'status-text success';
    } else {
      status.textContent = t('saveFailed');
      status.className = 'status-text error';
    }
  } catch {
    status.textContent = t('networkError');
    status.className = 'status-text error';
  }
  setTimeout(() => { status.textContent = ''; }, 3000);
}


// --- Search Quota ---
let sqPinnedKeys = new Set();

async function loadSearchQuota() {
  try {
    const res = await auth.authFetch('/admin/search-quota');
    if (!res.ok) return;
    const d = await res.json();
    $('maxSearchableInput').value = d.maxSearchable;
    sqPinnedKeys = new Set(d.pinnedKeys || []);
    loadSearchQuotaReport();
  } catch {}
}

async function saveSearchQuota() {
  const status = $('searchQuotaStatus');
  status.textContent = '';
  const data = {
    maxSearchable: parseInt($('maxSearchableInput').value) || 0,
    pinnedKeys: [...sqPinnedKeys],
  };
  try {
    const res = await auth.authFetch('/admin/search-quota', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      status.textContent = t('saved');
      status.className = 'status-text success';
    } else {
      status.textContent = t('saveFailed');
      status.className = 'status-text error';
    }
  } catch {
    status.textContent = t('networkError');
    status.className = 'status-text error';
  }
  setTimeout(() => { status.textContent = ''; }, 3000);
}

async function loadSearchQuotaReport() {
  try {
    const res = await auth.authFetch('/admin/search-quota/report');
    if (!res.ok) return;
    const d = await res.json();
    if (d.searchable == null) return;

    // 显示 Search 页签
    $('tabSearchQuota').style.display = '';
    $('sqSelectedInfo').textContent = d.totalSites + ' sites → ' + d.jsExcluded + ' JS excluded → ' + d.searchable + ' searchable' + (d.truncated > 0 ? ' (' + d.truncated + ' truncated)' : '') + (d.pinnedCount > 0 ? ', ' + d.pinnedCount + ' pinned' : '');
    $('badgeSearchQuota').textContent = d.searchable;

    // 加载站点列表
    const cfgRes = await fetch('/');
    if (!cfgRes.ok) return;
    const cfg = await cfgRes.json();
    const allSites = (cfg.sites || []).filter(s => s.searchable === 1);
    sqAllSites = allSites;
    renderSearchSources();
  } catch {}
}

let sqAllSites = [];

function renderSearchSources() {
  const pinnedArr = [...sqPinnedKeys];
  const siteMap = new Map(sqAllSites.map(s => [s.key, s]));
  let html = '';

  // 1. Pinned 源（有序，可排序）
  if (pinnedArr.length > 0) {
    html += '<div style="margin-bottom:12px"><strong style="color:var(--primary)">' + t('sqPinned') + ' (' + pinnedArr.length + ')</strong>';
    html += ' <span style="font-size:0.75rem;color:var(--text-secondary)">— ' + t('sqPinnedDesc') + '</span></div>';
    html += '<table style="width:100%;border-collapse:collapse;font-size:0.8rem">';
    pinnedArr.forEach((key, i) => {
      const s = siteMap.get(key);
      const name = s ? (s.name || s.key) : key;
      html += '<tr style="border-bottom:1px solid var(--border);background:var(--bg-hover)">';
      html += '<td style="padding:4px;width:30px;color:var(--text-secondary)">' + (i + 1) + '</td>';
      html += '<td style="padding:4px;font-family:var(--mono);font-size:0.75rem">' + escHtml(key) + '</td>';
      html += '<td style="padding:4px">' + escHtml(name) + '</td>';
      html += '<td style="padding:4px;width:100px;text-align:right;white-space:nowrap">';
      if (i > 0) html += '<button class="btn btn-sm" style="padding:1px 6px;font-size:0.7rem" onclick="movePinned(' + i + ',-1)">▲</button> ';
      if (i < pinnedArr.length - 1) html += '<button class="btn btn-sm" style="padding:1px 6px;font-size:0.7rem" onclick="movePinned(' + i + ',1)">▼</button> ';
      html += '<button class="btn btn-sm" style="padding:1px 6px;font-size:0.7rem;color:var(--red)" onclick="togglePin(&quot;' + escHtml(key) + '&quot;)">' + t('sqUnpin') + '</button>';
      html += '</td></tr>';
    });
    html += '</table>';
  }

  // 2. 其他源（可 pin）
  const unpinned = sqAllSites.filter(s => !sqPinnedKeys.has(s.key));
  html += '<div style="margin-top:16px;margin-bottom:8px"><strong>' + t('sqOtherSources') + ' (' + unpinned.length + ')</strong></div>';
  html += '<table style="width:100%;border-collapse:collapse;font-size:0.8rem">';
  unpinned.slice(0, 200).forEach(s => {
    html += '<tr style="border-bottom:1px solid var(--border)">';
    html += '<td style="padding:4px;font-family:var(--mono);font-size:0.75rem">' + escHtml(s.key) + '</td>';
    html += '<td style="padding:4px">' + escHtml(s.name || s.key) + '</td>';
    html += '<td style="padding:4px;width:50px;text-align:right"><button class="btn btn-sm" style="padding:1px 6px;font-size:0.7rem" onclick="togglePin(&quot;' + escHtml(s.key) + '&quot;)">' + t('sqPin') + '</button></td>';
    html += '</tr>';
  });
  if (unpinned.length > 200) html += '<tr><td colspan="3" style="padding:4px;color:var(--text-secondary)">... +' + (unpinned.length - 200) + ' more</td></tr>';
  html += '</table>';

  $('sqSelectedTable').innerHTML = html;
}

async function movePinned(index, direction) {
  const arr = [...sqPinnedKeys];
  const target = index + direction;
  if (target < 0 || target >= arr.length) return;
  [arr[index], arr[target]] = [arr[target], arr[index]];
  try {
    const res = await auth.authFetch('/admin/search-quota/pinned', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: arr }),
    });
    if (res.ok) {
      const d = await res.json();
      sqPinnedKeys = new Set(d.pinnedKeys);
      renderSearchSources();
    }
  } catch {}
}

function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

async function togglePin(key) {
  const isPinned = sqPinnedKeys.has(key);
  try {
    const res = await auth.authFetch('/admin/search-quota/pinned', {
      method: isPinned ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [key] }),
    });
    if (res.ok) {
      const d = await res.json();
      sqPinnedKeys = new Set(d.pinnedKeys);
      renderSearchSources();
    }
  } catch {}
}

// --- Refresh ---
async function triggerRefresh() {
  const btn = $('refreshBtn');
  btn.textContent = t('running');
  btn.className = 'btn btn-sm loading';

  try {
    const res = await auth.authFetch('/refresh', { method: 'POST' });
    const d = await res.json();
    if (d.success) {
      toast(t('aggregationStarted'));
      setTimeout(loadStatus, 3000);
    } else {
      toast(t('refreshFailed'), 'error');
    }
  } catch {
    toast(t('networkError'), 'error');
  }

  setTimeout(() => {
    btn.textContent = t('refresh');
    btn.className = 'btn btn-sm';
  }, 3000);
}

// --- Cloud Credentials ---
const PLATFORM_NAMES = {
  aliyun:'阿里云盘', bilibili:'Bilibili', quark:'夸克网盘', uc:'UC 网盘',
  pan115:'115 网盘', tianyi:'天翼云盘', baidu:'百度网盘', pan123:'123 网盘',
  thunder:'迅雷', pikpak:'PikPak'
};
const QR_PLATFORMS = ['bilibili','aliyun','quark','uc','pan115','tianyi','baidu','pan123'];
const PW_PLATFORMS = ['thunder','pikpak'];
let cloudCredentials = {};

async function loadCloudCredentials() {
  try {
    const res = await auth.authFetch('/admin/cloud-credentials');
    if (!res.ok) return;
    const data = await res.json();
    cloudCredentials = data.credentials || {};
    renderCloudCards();
    renderPlatformSelect();
  } catch {}
}

function renderCloudCards() {
  const grid = $('cloudLoginGrid');
  grid.innerHTML = '';
  const allPlatforms = [...QR_PLATFORMS, ...PW_PLATFORMS];

  for (const p of allPlatforms) {
    const cred = cloudCredentials[p];
    const isLoggedIn = cred && cred.hasCredential;
    const statusClass = isLoggedIn ? (cred.status === 'expired' ? 'expired' : 'valid') : 'none';
    const statusText = isLoggedIn ? (cred.status === 'expired' ? 'EXPIRED' : 'ACTIVE') : 'NOT SET';
    const isQR = QR_PLATFORMS.includes(p);
    const timeStr = cred?.obtainedAt ? new Date(cred.obtainedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}) : '';

    const card = document.createElement('div');
    card.className = 'cloud-card';
    card.innerHTML =
      '<div class="cloud-card-header">' +
        '<span class="cloud-card-name">' + (PLATFORM_NAMES[p]||p) + '</span>' +
        '<span class="cloud-badge ' + statusClass + '">' + statusText + '</span>' +
      '</div>' +
      (timeStr ? '<div class="cloud-card-time">' + timeStr + '</div>' : '') +
      '<div class="cloud-card-actions">' +
        (isQR ? '<button class="btn btn-sm" onclick="startQRLogin(\\''+p+'\\')">Scan QR</button>' :
                '<button class="btn btn-sm" onclick="showPasswordLogin(\\''+p+'\\')">Login</button>') +
        (isLoggedIn ? '<button class="btn btn-sm btn-danger" onclick="logoutPlatform(\\''+p+'\\')">Logout</button>' : '') +
      '</div>';
    grid.appendChild(card);
  }
}

function renderPlatformSelect() {
  const sel = $('manualPlatform');
  sel.innerHTML = '';
  for (const [k,v] of Object.entries(PLATFORM_NAMES)) {
    const opt = document.createElement('option');
    opt.value = k; opt.textContent = v;
    sel.appendChild(opt);
  }
}

let qrPollTimer = null;

async function startQRLogin(platform) {
  try {
    const res = await auth.authFetch('/admin/cloud-login/' + platform + '/qr', { method: 'POST' });
    if (!res.ok) { const e = await res.json(); toast(e.error || 'QR failed', 'error'); return; }
    const data = await res.json();
    showQRModal(platform, data.qrUrl, data.token);
  } catch (e) {
    toast('QR generate failed: ' + e.message, 'error');
  }
}

function showQRModal(platform, qrUrl, token) {
  closeQRModal();
  const overlay = document.createElement('div');
  overlay.className = 'qr-modal-overlay';
  overlay.id = 'qrModalOverlay';
  overlay.onclick = function(e) { if(e.target===overlay) closeQRModal(); };

  const qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(qrUrl);

  overlay.innerHTML =
    '<div class="qr-modal">' +
    '<h3>' + (PLATFORM_NAMES[platform]||platform) + ' - Scan QR</h3>' +
    '<img src="' + qrImgUrl + '" alt="QR Code" onerror="this.alt=\\'QR: '+qrUrl.substring(0,60)+'...\\'">' +
    '<div class="qr-status" id="qrPollStatus">Waiting for scan...</div>' +
    '<div style="margin-top:14px;display:flex;gap:8px;justify-content:center">' +
    '<button class="btn btn-sm" onclick="closeQRModal()">Cancel</button>' +
    '</div></div>';

  document.body.appendChild(overlay);
  startQRPolling(platform, token);
}

function startQRPolling(platform, token) {
  if (qrPollTimer) clearInterval(qrPollTimer);
  let attempts = 0;
  const maxAttempts = 120; // 4 minutes at 2s intervals

  qrPollTimer = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) { closeQRModal(); toast('QR expired', 'error'); return; }

    try {
      const res = await auth.authFetch('/admin/cloud-login/' + platform + '/poll?token=' + encodeURIComponent(token));
      const data = await res.json();
      const statusEl = $('qrPollStatus');
      if (!statusEl) { clearInterval(qrPollTimer); return; }

      if (data.status === 'confirmed') {
        statusEl.className = 'qr-status confirmed';
        statusEl.textContent = 'Login successful!';
        clearInterval(qrPollTimer);
        setTimeout(() => { closeQRModal(); loadCloudCredentials(); toast(PLATFORM_NAMES[platform] + ' logged in', 'success'); }, 1000);
      } else if (data.status === 'scanned') {
        statusEl.className = 'qr-status scanned';
        statusEl.textContent = 'Scanned, waiting for confirmation...';
      } else if (data.status === 'expired') {
        statusEl.className = 'qr-status expired';
        statusEl.textContent = 'QR expired. Close and try again.';
        clearInterval(qrPollTimer);
      } else if (data.status === 'error') {
        statusEl.className = 'qr-status expired';
        statusEl.textContent = data.message || 'Error';
        clearInterval(qrPollTimer);
      }
    } catch {}
  }, 2000);
}

function closeQRModal() {
  if (qrPollTimer) { clearInterval(qrPollTimer); qrPollTimer = null; }
  const overlay = $('qrModalOverlay');
  if (overlay) overlay.remove();
}

async function showPasswordLogin(platform) {
  const username = prompt(PLATFORM_NAMES[platform] + ' - Username/Email:');
  if (!username) return;
  const password = prompt(PLATFORM_NAMES[platform] + ' - Password:');
  if (!password) return;

  try {
    const res = await auth.authFetch('/admin/cloud-login/' + platform + '/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      toast(PLATFORM_NAMES[platform] + ' saved', 'success');
      loadCloudCredentials();
    } else {
      toast(data.message || 'Login failed', 'error');
    }
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

async function logoutPlatform(platform) {
  if (!confirm('Logout ' + (PLATFORM_NAMES[platform]||platform) + '?')) return;
  try {
    const res = await auth.authFetch('/admin/cloud-credentials/' + platform, { method: 'DELETE' });
    if (res.ok) {
      toast('Logged out', 'success');
      loadCloudCredentials();
    }
  } catch {}
}

async function manualPasteCredential() {
  const platform = $('manualPlatform').value;
  const rawValue = $('manualCredValue').value.trim();
  if (!rawValue) { toast('Please enter credential value', 'error'); return; }

  // 智能解析：尝试 JSON，否则按 cookie string 处理
  let credential;
  try {
    credential = JSON.parse(rawValue);
    if (typeof credential !== 'object') throw 0;
  } catch {
    // 账号密码平台
    if (PW_PLATFORMS.includes(platform) && rawValue.includes(':')) {
      const [u, ...rest] = rawValue.split(':');
      credential = { username: u, password: rest.join(':') };
    } else {
      credential = { cookie: rawValue };
    }
  }

  try {
    const res = await auth.authFetch('/admin/cloud-credentials/' + platform, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    if (res.ok) {
      $('manualCredValue').value = '';
      toast(PLATFORM_NAMES[platform] + ' saved', 'success');
      loadCloudCredentials();
    } else {
      const e = await res.json();
      toast(e.error || 'Save failed', 'error');
    }
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

// --- Risk Report ---
async function loadRiskReport() {
  const container = $('riskReportContainer');
  const summary = $('riskSummary');

  try {
    const res = await auth.authFetch('/admin/credential-risk-report');
    if (!res.ok) { const e = await res.json(); toast(e.error || 'Failed', 'error'); return; }
    const data = await res.json();

    summary.textContent = 'Safe: ' + data.summary.safe + ' | Low: ' + data.summary.low +
      ' | High: ' + data.summary.high + ' | Unaudited: ' + data.summary.unaudited;

    const tbody = $('riskReportBody');
    tbody.innerHTML = '';

    // 只显示需要凭证的源（非 safe-A 类）
    const relevant = data.assessments.filter(a => a.neededPlatforms.length > 0 || a.riskLevel !== 'safe');
    const allowedSet = new Set(data.policy.allowedHighRiskKeys || []);
    const deniedSet = new Set(data.policy.deniedKeys || []);

    for (const a of relevant) {
      const tr = document.createElement('tr');
      const isAllowed = allowedSet.has(a.siteKey);
      const isDenied = deniedSet.has(a.siteKey);
      const needsAction = a.riskLevel === 'high' || a.riskLevel === 'unaudited';

      tr.innerHTML =
        '<td style="font-size:0.75rem">' + a.siteKey + '</td>' +
        '<td style="font-family:var(--mono);font-size:0.7rem">' + a.api + '</td>' +
        '<td><span class="risk-badge ' + a.riskLevel + '">' + a.riskLevel.toUpperCase() + '</span></td>' +
        '<td style="font-size:0.7rem">' + (a.neededPlatforms||[]).join(', ') + '</td>' +
        '<td style="font-size:0.7rem;color:' + (a.thirdPartyDomains.length ? 'var(--red)' : 'var(--text-dim)') + '">' +
          (a.thirdPartyDomains.join(', ') || '-') + '</td>' +
        '<td>' +
          (needsAction && !isAllowed ? '<button class="btn btn-sm" onclick="allowHighRisk(\\''+a.siteKey+'\\')">Allow</button>' : '') +
          (isAllowed ? '<button class="btn btn-sm btn-danger" onclick="revokeHighRisk(\\''+a.siteKey+'\\')">Revoke</button>' : '') +
          (isDenied ? '<span style="color:var(--red);font-size:0.7rem">DENIED</span>' : '') +
        '</td>';
      tbody.appendChild(tr);
    }

    container.style.display = 'block';
  } catch (e) {
    toast('Load failed: ' + e.message, 'error');
  }
}

async function allowHighRisk(siteKey) {
  if (!confirm('Allow credential injection for "' + siteKey + '"? Your cookies may be sent to third-party servers.')) return;
  try {
    const res = await auth.authFetch('/admin/credential-policy');
    const policy = await res.json();
    if (!policy.allowedHighRiskKeys) policy.allowedHighRiskKeys = [];
    if (!policy.allowedHighRiskKeys.includes(siteKey)) policy.allowedHighRiskKeys.push(siteKey);
    await auth.authFetch('/admin/credential-policy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    loadRiskReport();
    toast('Allowed: ' + siteKey, 'success');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

async function revokeHighRisk(siteKey) {
  try {
    const res = await auth.authFetch('/admin/credential-policy');
    const policy = await res.json();
    policy.allowedHighRiskKeys = (policy.allowedHighRiskKeys||[]).filter(k => k !== siteKey);
    await auth.authFetch('/admin/credential-policy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    loadRiskReport();
    toast('Revoked: ' + siteKey, 'success');
  } catch (e) {
    toast('Error: ' + e.message, 'error');
  }
}

// ─── 去重配置 ──────────────────────────────────────────────
async function loadDedupConfig() {
  try {
    const res = await auth.authFetch('/admin/dedup-config');
    const cfg = await res.json();
    $('similarDedupCheck').checked = cfg.similarDedup !== false;
    const pct = Math.round((cfg.similarDedupThreshold || 0.85) * 100);
    $('dedupThreshold').value = pct;
    $('dedupThresholdVal').textContent = pct + '%';
  } catch {}
}
async function saveDedupConfig() {
  try {
    const cfg = {
      similarDedup: $('similarDedupCheck').checked,
      similarDedupThreshold: parseInt($('dedupThreshold').value) / 100,
    };
    const res = await auth.authFetch('/admin/dedup-config', {
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(cfg)
    });
    if (res.ok) { $('dedupStatus').textContent = '✓'; setTimeout(() => $('dedupStatus').textContent = '', 2000); }
  } catch {}
}

// ─── 分组排序 ──────────────────────────────────────────────
let groupRules = [];
async function loadGroupOrder() {
  try {
    const res = await auth.authFetch('/admin/group-order');
    const cfg = await res.json();
    $('groupOrderEnabled').checked = cfg.enabled;
    $('groupOrderUnmatched').value = cfg.unmatchedPosition || 'after';
    groupRules = cfg.rules || [];
    renderGroupRules();
  } catch {}
}
function renderGroupRules() {
  const container = $('groupOrderRules');
  if (groupRules.length === 0) { container.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem">No rules yet</div>'; return; }
  let html = '';
  groupRules.forEach((rule, i) => {
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:6px 8px;background:var(--surface-2);border-radius:4px">';
    html += '<span style="font-family:var(--mono);font-size:0.8rem;min-width:20px;color:var(--text-dim)">#' + (i+1) + '</span>';
    html += '<input type="text" value="' + esc(rule.name) + '" onchange="updateGroupRule(' + i + ',\\'name\\',this.value)" class="nt-input" style="width:80px" placeholder="Name">';
    html += '<input type="text" value="' + esc(rule.keywords.join(',')) + '" onchange="updateGroupRule(' + i + ',\\'keywords\\',this.value)" class="nt-input" style="flex:1" placeholder="Keywords (comma-separated)">';
    if (i > 0) html += '<button class="btn btn-sm" onclick="moveGroupRule(' + i + ',-1)">▲</button>';
    if (i < groupRules.length - 1) html += '<button class="btn btn-sm" onclick="moveGroupRule(' + i + ',1)">▼</button>';
    html += '<button class="btn btn-sm" style="color:var(--red)" onclick="removeGroupRule(' + i + ')">✕</button>';
    html += '</div>';
  });
  container.innerHTML = html;
}
function addGroupRule() {
  groupRules.push({ name: '', keywords: [] });
  renderGroupRules();
}
function removeGroupRule(i) { groupRules.splice(i, 1); renderGroupRules(); saveGroupOrder(); }
function moveGroupRule(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= groupRules.length) return;
  [groupRules[i], groupRules[j]] = [groupRules[j], groupRules[i]];
  renderGroupRules(); saveGroupOrder();
}
function updateGroupRule(i, field, value) {
  if (field === 'name') groupRules[i].name = value;
  else if (field === 'keywords') groupRules[i].keywords = value.split(',').map(s => s.trim()).filter(Boolean);
  saveGroupOrder();
}
async function saveGroupOrder() {
  try {
    const cfg = {
      enabled: $('groupOrderEnabled').checked,
      unmatchedPosition: $('groupOrderUnmatched').value,
      rules: groupRules,
    };
    const res = await auth.authFetch('/admin/group-order', {
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(cfg)
    });
    if (res.ok) { $('groupOrderStatus').textContent = '✓'; setTimeout(() => $('groupOrderStatus').textContent = '', 2000); }
  } catch {}
}

// ─── 背景设置 ──────────────────────────────────────────────
function onBgTypeChange() {
  const t = $('bgType').value;
  $('bgImageGroup').style.display = t === 'image' ? 'block' : 'none';
  $('bgSolidGroup').style.display = t === 'solid' ? 'block' : 'none';
  $('bgGradientGroup').style.display = t === 'gradient' ? 'block' : 'none';
}
async function loadBgSettings() {
  try {
    const res = await auth.authFetch('/admin/bg-settings');
    if (!res.ok) return;
    const cfg = await res.json();
    $('bgType').value = cfg.type || 'default';
    if (cfg.imageUrl) $('bgImageUrl').value = cfg.imageUrl;
    if (cfg.solidColor) $('bgSolidColor').value = cfg.solidColor;
    if (cfg.gradient) $('bgGradient').value = cfg.gradient;
    onBgTypeChange();
  } catch {}
}
async function saveBgSettings() {
  try {
    const cfg = {
      type: $('bgType').value,
      imageUrl: $('bgImageUrl').value,
      solidColor: $('bgSolidColor').value,
      gradient: $('bgGradient').value,
    };
    const res = await auth.authFetch('/admin/bg-settings', {
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(cfg)
    });
    if (res.ok) {
      $('bgStatus').textContent = '✓'; setTimeout(() => $('bgStatus').textContent = '', 2000);
      loadBgFromServer();
    }
  } catch {}
}

// ─── 聚合日志 ──────────────────────────────────────────────
async function loadAggLogs() {
  try {
    const res = await auth.authFetch('/admin/agg-logs?limit=50');
    const data = await res.json();
    const logs = data.logs || [];
    if (logs.length === 0) {
      $('aggLogsList').innerHTML = '<div style="color:var(--text-dim)">No aggregation logs yet.</div>';
      return;
    }
    let html = '';
    logs.forEach(log => {
      const status = log.success ? '<span style="color:var(--green)">✓</span>' : '<span style="color:var(--red)">✕</span>';
      const time = new Date(log.startTime).toLocaleString();
      const dur = (log.durationMs / 1000).toFixed(1) + 's';
      html += '<div style="padding:8px;margin-bottom:6px;background:var(--surface-2);border-radius:4px;border-left:3px solid ' + (log.success ? 'var(--green)' : 'var(--red)') + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<span>' + status + ' ' + time + '</span>';
      html += '<span style="font-family:var(--mono);font-size:0.8rem;color:var(--text-dim)">' + dur + '</span>';
      html += '</div>';
      html += '<div style="font-size:0.8rem;color:var(--text-dim);margin-top:4px">';
      html += 'Sources: ' + log.okSources + '/' + log.totalSources + ' OK';
      html += ' &middot; Sites: ' + log.finalSiteCount + ' &middot; Parses: ' + log.finalParseCount + ' &middot; Lives: ' + log.finalLiveCount;
      html += '</div>';
      if (log.addedSites && log.addedSites.length > 0) {
        html += '<div style="font-size:0.8rem;color:var(--green);margin-top:2px">+ ' + log.addedSites.map(s => s.name || s.key).join(', ') + '</div>';
      }
      if (log.removedSites && log.removedSites.length > 0) {
        html += '<div style="font-size:0.8rem;color:var(--red);margin-top:2px">- ' + log.removedSites.map(s => s.name || s.key).join(', ') + '</div>';
      }
      if (log.failedSources && log.failedSources.length > 0) {
        html += '<div style="font-size:0.75rem;color:var(--amber);margin-top:2px">Failed: ' + log.failedSources.map(s => s.name).join(', ') + '</div>';
      }
      if (log.errorMessage) {
        html += '<div style="font-size:0.75rem;color:var(--red);margin-top:2px">Error: ' + esc(log.errorMessage) + '</div>';
      }
      html += '</div>';
    });
    $('aggLogsList').innerHTML = html;
  } catch {}
}
async function clearAggLogs() {
  if (!confirm('Clear all aggregation logs?')) return;
  await auth.authFetch('/admin/agg-logs', { method: 'DELETE' });
  loadAggLogs();
}

// ─── 直播禁用 ──────────────
async function loadLiveDisabled() {
  try {
    const r = await auth.authFetch('/admin/live-disabled');
    const d = await r.json();
    $('liveDisabledCheck').checked = d.disabled;
  } catch {}
}
async function saveLiveDisabled() {
  const disabled = $('liveDisabledCheck').checked;
  await auth.authFetch('/admin/live-disabled', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({disabled}) });
  $('liveDisabledStatus').textContent = '✓';
  setTimeout(() => $('liveDisabledStatus').textContent = '', 2000);
}

// ─── 直播合并模式 ──────────
async function loadLiveMergeMode() {
  try {
    const r = await auth.authFetch('/admin/live-merge-mode');
    const d = await r.json();
    const mode = d.mode || 'separated';
    $('liveMergeSeparated').classList.toggle('active', mode === 'separated');
    $('liveMergeMerged').classList.toggle('active', mode === 'merged');
  } catch {}
}
async function setLiveMergeMode(mode) {
  $('liveMergeSeparated').classList.toggle('active', mode === 'separated');
  $('liveMergeMerged').classList.toggle('active', mode === 'merged');
  $('liveMergeModeStatus').textContent = '⏳';
  try {
    await auth.authFetch('/admin/live-merge-mode', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({mode}) });
    $('liveMergeModeStatus').textContent = '✓ 已切换并刷新';
    setTimeout(() => $('liveMergeModeStatus').textContent = '', 3000);
  } catch(e) {
    $('liveMergeModeStatus').textContent = '✗ 失败';
  }
}

// ─── 智能 Base URL ──────────
async function loadSmartBaseUrl() {
  try {
    const r = await auth.authFetch('/admin/smart-base-url');
    const d = await r.json();
    $('smartBaseUrlCheck').checked = d.enabled;
  } catch {}
}
async function saveSmartBaseUrl() {
  const enabled = $('smartBaseUrlCheck').checked;
  await auth.authFetch('/admin/smart-base-url', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({enabled}) });
  $('smartBaseUrlStatus').textContent = '✓';
  setTimeout(() => $('smartBaseUrlStatus').textContent = '', 2000);
}

// ─── 验活深度 ────────────────
async function loadProbeDepth() {
  try {
    const r = await auth.authFetch('/admin/site-probe-depth');
    const d = await r.json();
    $('probeDepthSelect').value = d.depth || 'deep';
  } catch {}
}
async function saveProbeDepth() {
  const depth = $('probeDepthSelect').value;
  await auth.authFetch('/admin/site-probe-depth', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({depth}) });
  $('probeDepthStatus').textContent = '✓';
  setTimeout(() => $('probeDepthStatus').textContent = '', 2000);
}

// ─── 自动清理 ────────────────
async function loadAutoClean() {
  try {
    const r = await auth.authFetch('/admin/site-auto-clean');
    const d = await r.json();
    $('autoCleanCheck').checked = d.enabled;
  } catch {}
}
async function saveAutoClean() {
  const enabled = $('autoCleanCheck').checked;
  await auth.authFetch('/admin/site-auto-clean', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({enabled}) });
  $('autoCleanStatus').textContent = '✓';
  setTimeout(() => $('autoCleanStatus').textContent = '', 2000);
}

// ─── Init new settings ───────
loadLiveDisabled();
loadLiveMergeMode();
loadSmartBaseUrl();
loadProbeDepth();
loadAutoClean();

applyTheme(getTheme());
initThemeDropdown();
loadBgFromServer();
applyLang(translations, getLang());
</script>
</body>
</html>`;

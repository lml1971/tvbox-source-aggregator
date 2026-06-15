// Shared JS utilities embedded into page <script> tags
export const sharedUi = `
const $ = id => document.getElementById(id);

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function getLang() {
  const s = localStorage.getItem('lang');
  if (s === 'en' || s === 'zh') return s;
  return navigator.language?.startsWith('zh') ? 'zh' : 'en';
}

function applyLang(translations, lang) {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    const v = translations[lang]?.[k];
    if (v) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.dataset.i18nPlaceholder;
    const v = translations[lang]?.[k];
    if (v) el.placeholder = v;
  });
  document.querySelectorAll('[data-i18n-text]').forEach(el => {
    const k = el.dataset.i18nText;
    const v = translations[lang]?.[k];
    if (v) el.textContent = v;
  });
  const toggle = $('langToggle');
  if (toggle) toggle.textContent = lang === 'zh' ? 'EN' : '中文';
  document.body.style.opacity = '1';
}

function toast(msg, type) {
  type = type || 'success';
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2500);
}

function initAuth(tokenInputId, errorId, overlayId, contentId, verifyUrl, onSuccess) {
  let token = '';
  const tokenInput = $(tokenInputId);
  const overlay = $(overlayId);
  const content = $(contentId);
  const errorEl = $(errorId);

  function getToken() { return token; }

  function authFetch(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({}, opts.headers, { 'Authorization': 'Bearer ' + token });
    return fetch(url, opts);
  }

  function doLogin() {
    token = tokenInput.value.trim();
    if (!token) return;
    fetch(verifyUrl, {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => {
      if (r.ok) {
        overlay.style.display = 'none';
        content.style.display = 'block';
        sessionStorage.setItem('admin_token', token);
        onSuccess();
      } else {
        errorEl.style.display = 'block';
        tokenInput.value = '';
        tokenInput.focus();
      }
    }).catch(() => {
      errorEl.style.display = 'block';
    });
  }

  tokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  // Auto-login from session
  const saved = sessionStorage.getItem('admin_token');
  if (saved) {
    token = saved;
    fetch(verifyUrl, {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => {
      if (r.ok) {
        overlay.style.display = 'none';
        content.style.display = 'block';
        onSuccess();
      }
    });
  }

  return { doLogin, authFetch, getToken };
}

function toggleCollapsible(toggleEl) {
  toggleEl.classList.toggle('open');
  const body = toggleEl.nextElementSibling;
  if (body) body.classList.toggle('open');
}

function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}

var THEMES = [
  { id: 'dark',    icon: '\\u2600\\uFE0F',  label: 'Dark',    dot: '#0a0e14' },
  { id: 'light',   icon: '\\uD83C\\uDF19',  label: 'Light',   dot: '#f4f6f9' },
  { id: 'sunset',  icon: '\\uD83C\\uDF05',  label: 'Sunset',  dot: '#1a1208' },
  { id: 'cyber',   icon: '\\u26A1',         label: 'Cyber',   dot: '#08000f' },
  { id: 'eyecare', icon: '\\uD83C\\uDF3F',  label: 'EyeCare', dot: '#0d1a0d' },
  { id: 'violet',  icon: '\\uD83D\\uDC8E',  label: 'Violet',  dot: '#140a20' }
];

function findTheme(id) {
  for (var i = 0; i < THEMES.length; i++) { if (THEMES[i].id === id) return THEMES[i]; }
  return THEMES[0];
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  var btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = findTheme(theme).icon;
  document.querySelectorAll('.theme-dropdown-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.theme === theme);
  });
}

function toggleTheme() {
  var menu = document.getElementById('themeDropdownMenu');
  if (menu) {
    var isOpen = menu.classList.contains('open');
    document.querySelectorAll('.theme-dropdown-menu').forEach(function(m) { m.classList.remove('open'); });
    if (!isOpen) menu.classList.add('open');
    return;
  }
  var list = THEMES.map(function(t) { return t.id; });
  var idx = list.indexOf(getTheme());
  var next = list[(idx + 1) % list.length];
  localStorage.setItem('theme', next);
  applyTheme(next);
}

function selectTheme(themeId) {
  localStorage.setItem('theme', themeId);
  applyTheme(themeId);
  document.querySelectorAll('.theme-dropdown-menu').forEach(function(m) { m.classList.remove('open'); });
}

function initThemeDropdown() {
  var wrap = document.getElementById('themeDropdown');
  if (!wrap) return;
  var cur = findTheme(getTheme());
  var html = '<div class="theme-dropdown" id="themeDropdownWrap">';
  html += '<button class="theme-toggle" id="themeToggle" onclick="toggleTheme()">' + cur.icon + '</button>';
  html += '<div class="theme-dropdown-menu" id="themeDropdownMenu">';
  for (var i = 0; i < THEMES.length; i++) {
    var t = THEMES[i];
    var active = t.id === cur.id ? ' active' : '';
    html += '<div class="theme-dropdown-item' + active + '" data-theme="' + t.id + '" onclick="selectTheme(\\'' + t.id + '\\')">';
    html += '<span class="theme-dot" style="background:' + t.dot + '"></span>';
    html += '<span>' + t.icon + ' ' + t.label + '</span>';
    html += '</div>';
  }
  html += '</div></div>';
  wrap.innerHTML = html;
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.theme-dropdown')) {
    document.querySelectorAll('.theme-dropdown-menu').forEach(function(m) { m.classList.remove('open'); });
  }
});

function loadBgFromServer() {
  fetch('/api/bg-settings').then(function(r) {
    if (!r.ok) return;
    return r.json();
  }).then(function(cfg) {
    if (!cfg) return;
    if (cfg.type === 'image' && cfg.imageUrl) {
      document.body.style.backgroundImage = 'url(' + cfg.imageUrl + ')';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else if (cfg.type === 'solid' && cfg.solidColor) {
      document.body.style.background = cfg.solidColor;
    } else if (cfg.type === 'gradient' && cfg.gradient) {
      document.body.style.background = cfg.gradient;
    }
  }).catch(function() {});
}

function loadVersion() {
  fetch('/version').then(function(r) {
    if (!r.ok) return;
    return r.json();
  }).then(function(data) {
    if (!data || !data.version) return;
    var el = document.querySelector('.header-top');
    if (!el) return;
    var badge = document.createElement('span');
    badge.style.cssText = 'font-family:var(--mono);font-size:0.65rem;color:var(--text-dim);padding:2px 8px;background:var(--surface-2);border-radius:10px;';
    badge.textContent = 'v' + data.version;
    if (data.commit && data.commit !== 'unknown') badge.title = 'commit: ' + data.commit;
    el.appendChild(badge);
  }).catch(function() {});
}
`;

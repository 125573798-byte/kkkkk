/* ============================================================
   cloud-proxy.js —— Koofr 云同步 · 智能代理（零侵入）
   ============================================================
   解决：托管到 Cloudflare Pages 后，浏览器直连 app.koofr.net 被 CORS 拦截，
   导致“测试连接 Load failed / The string did not match the expected pattern”。

   策略（自动，不改界面、不改操作逻辑）：
   1. 先尝试【同源 Pages Functions 代理】 /dav/... （无跨域，最稳）
      -> https://jianguoyu.pages.dev/dav/Koofr
   2. 失败则回退【独立 Worker 代理】（跨域，带完整 CORS 头）
      -> https://koofr-proxy.125573798.workers.dev/dav/Koofr
   3. 再失败则回退【直连 Koofr】（单机 / file:// 场景，原本可用）

   用户只需点“测试连接”，通过后点“保存”即可。
   ============================================================ */
(function () {
  'use strict';

  var DIRECT = 'https://app.koofr.net/dav/Koofr';
  var FUNC   = '/dav/Koofr';                       // 同源 Pages Functions
  var WORKER = 'https://koofr-proxy.125573798.workers.dev/dav/Koofr';

  var STATE_KEY = 'cloudProxyState_v1';
  var cfg = { strategy: 'auto', custom: '', lastOk: null, tried: [] };
  try { var raw = localStorage.getItem(STATE_KEY); if (raw) cfg = Object.assign(cfg, JSON.parse(raw)); } catch (e) {}

  function save() { try { localStorage.setItem(STATE_KEY, JSON.stringify(cfg)); } catch (e) {} }

  // 归一：返回可用于请求的“服务器根”
  function normalize(server) {
    var s = String(server || '').trim();
    if (!s) s = DIRECT;
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    return s.replace(/\/+$/, '');
  }

  // 候选列表（按优先级）
  function candidates() {
    var list = [];
    if (cfg.strategy === 'custom' && cfg.custom) {
      list.push({ name: 'custom', root: normalize(cfg.custom) });
    } else {
      list.push({ name: 'functions', root: FUNC });   // 同源，最优先
      list.push({ name: 'worker',   root: normalize(WORKER) });
      list.push({ name: 'direct',   root: normalize(DIRECT) });
    }
    return list;
  }

  // 探测一个端点是否可用（用 HEAD + PROPFIND 兜底）
  async function probe(root, username, password) {
    var auth = 'Basic ' + btoa(unescape(encodeURIComponent(String(username || '') + ':' + String(password || ''))));
    var url = root + '/';
    try {
      var resp = await fetch(url, {
        method: 'PROPFIND',
        headers: { 'Authorization': auth, 'Depth': '0', 'Content-Type': 'text/xml; charset=utf-8' },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
      });
      // 207=目录存在；401/403=认证问题（说明网络通）；404=路径需创建（也说明网络通）
      return (resp.status === 207 || resp.status === 401 || resp.status === 403 || resp.status === 404);
    } catch (e) {
      return false;
    }
  }

  // 对外：根据当前配置，返回一个“可用的服务器根”
  // 优先级：上次成功的 > 自动探测 > 直连
  async function resolveServer(cfg_) {
    cfg_ = cfg_ || (typeof getCloudConfig === 'function' ? getCloudConfig() : {});
    var user = cfg_.username, pass = cfg_.password;
    var list = candidates();

    // 若上次成功的策略仍在候选中，优先用它
    var last = cfg.lastOk;
    if (last) {
      var hit = list.filter(function (c) { return c.name === last; });
      if (hit.length && await probe(hit[0].root, user, pass)) return hit[0].root;
    }
    for (var i = 0; i < list.length; i++) {
      if (await probe(list[i].root, user, pass)) {
        cfg.lastOk = list[i].name;
        cfg.tried = list.slice(0, i + 1).map(function (c) { return c.name; });
        save();
        return list[i].root;
      }
    }
    // 全失败：回退直连（单机可用）
    return normalize(DIRECT);
  }

  // 日志（复用程序已有的 _cloudLog，若不可用则 noop）
  function log(msg, cls) {
    if (typeof _cloudLog === 'function') { try { _cloudLog(msg, cls || ''); } catch (e) {} }
  }

  // 注入到云同步请求：替换 cfg.server
  var TARGET_KEY = 'cloudSyncConfig_v1';
  function patchedConfig() {
    var c = (typeof getCloudConfig === 'function') ? getCloudConfig() : {};
    if (cfg.lastOk && cfg.lastOk !== 'direct') {
      var list = candidates();
      var hit = list.filter(function (x) { return x.name === cfg.lastOk; });
      if (hit.length) c.server = hit[0].root;
    }
    return c;
  }

  // 在“测试连接”前自动选择最优通道，并把结果写回输入框（用户无感）
  async function beforeTest() {
    var serverEl = document.getElementById('cloudServer');
    var userEl = document.getElementById('cloudUser');
    var passEl = document.getElementById('cloudPass');
    var u = (userEl && userEl.value) || '';
    var p = (passEl && passEl.value) || '';
    var best = await resolveServer({ username: u, password: p });
    if (serverEl) {
      var prev = (serverEl.value || '').trim();
      serverEl.value = best;
      if (prev && prev !== best) {
        log('已自动切换同步通道 → ' + (best.indexOf(location.hostname) > -1 ? '同源代理' : (best.indexOf('workers.dev') > -1 ? 'Worker 代理' : '直连')), 'ok');
      }
    }
    return best;
  }

  // 暴露
  window.__cloudProxy = {
    resolveServer: resolveServer,
    beforeTest: beforeTest,
    setStrategy: function (s, custom) { cfg.strategy = s; cfg.custom = (custom || '').trim(); cfg.lastOk = null; save(); },
    status: function () { return Object.assign({}, cfg, { candidates: candidates() }); },
    reset: function () { cfg.lastOk = null; cfg.tried = []; save(); },
  };

  // 延迟注入：等 DOM 与程序脚本就绪
  function bootstrap() {
    try {
      // 1) 劫持 saveCloudConfig：保存时记住当前生效通道
      if (typeof window.saveCloudConfig === 'function') {
        var origSave = window.saveCloudConfig;
        window.saveCloudConfig = function () {
          var el = document.getElementById('cloudServer');
          var v = (el && el.value) || '';
          if (v.indexOf(location.hostname) > -1) cfg.lastOk = 'functions';
          else if (v.indexOf('workers.dev') > -1) cfg.lastOk = 'worker';
          else if (v.indexOf('koofr.net') > -1) cfg.lastOk = 'direct';
          save();
          return origSave.apply(this, arguments);
        };
      }
      // 2) 劫持 testCloudConnection：先自动选通道
      if (typeof window.cloudTest === 'function') {
        var origTest = window.cloudTest;
        window.testCloudConnection = async function () {
          await beforeTest();
          return origTest.apply(this, arguments);
        };
      }
      // 3) 让云同步请求始终走已验证通道
      if (typeof window._cloudFetch === 'function') {
        var origFetch = window._cloudFetch;
        window._cloudFetch = async function (method, url, options) {
          var c = patchedConfig();
          return origFetch.call(window, method, url, options);
        };
      }
      // 4) 页面加载时，若已有验证过的通道，静默回填
      if (cfg.lastOk && cfg.lastOk !== 'direct') {
        var el = document.getElementById('cloudServer');
        var list = candidates();
        var hit = list.filter(function (x) { return x.name === cfg.lastOk; });
        if (el && hit.length && (el.value || '').indexOf('koofr.net') > -1) {
          el.value = hit[0].root;
        }
      }
    } catch (e) {
      log('代理初始化跳过（不影响本地功能）', 'warn');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(bootstrap, 0); });
  } else {
    setTimeout(bootstrap, 0);
  }
})();

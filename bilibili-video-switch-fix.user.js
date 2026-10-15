// ==UserScript==
// @name         Bilibili Video Switch Fix v3 (force reload)
// @namespace    workbuddy.cn
// @version      3.0
// @description  Force full reload when Bilibili switches video via SPA (clicking a recommended video leaves the page stuck on the old video). v3 adds a visible top banner so you can confirm the script is running, and @updateURL so "check for updates" works.
// @match        https://bilibili.com/*
// @match        https://*.bilibili.com/*
// @include      https://bilibili.com/*
// @include      https://*.bilibili.com/*
// @include      http://bilibili.com/*
// @include      http://*.bilibili.com/*
// @run-at       document-start
// @grant        none
// @updateURL    http://localhost:8753/bilibili-video-switch-fix.user.js
// @downloadURL  http://localhost:8753/bilibili-video-switch-fix.user.js
// ==/UserScript==

(function () {
  'use strict';
  console.log('[BiliFix3] injected on', location.href);
  window.__biliFix3Injected = true;

  var lastBv = null;
  var ready = false;
  var fired = false;
  var triggerMsg = '';

  function getBv() {
    var m = location.pathname.match(/\/video\/(BV[0-9A-Za-z]+)/);
    return m ? m[1] : null;
  }

  function maybeReload(newBv, why) {
    if (fired) return;
    if (!ready) { lastBv = newBv; return; }
    if (!newBv || newBv === lastBv) { lastBv = newBv; return; }
    fired = true;
    triggerMsg = 'detected BV change ' + (lastBv || '?') + ' -> ' + newBv + ' (' + why + ')';
    console.log('[BiliFix3] ' + triggerMsg + ', reloading');
    setTimeout(function () { location.reload(); }, 800);
  }

  setTimeout(function () { ready = true; lastBv = getBv(); }, 1500);
  lastBv = getBv();

  function wrap(name) {
    try {
      var orig = history[name];
      var w = function () {
        var r = orig.apply(history, arguments);
        try { maybeReload(getBv(), 'history.' + name); } catch (e) {}
        return r;
      };
      history[name] = w;
      if (window.History && History.prototype && History.prototype[name]) {
        try { History.prototype[name] = w; } catch (e) {}
      }
    } catch (e) {}
  }
  wrap('pushState');
  wrap('replaceState');

  setInterval(function () { maybeReload(getBv(), 'poll'); }, 500);

  // ---- visible top banner: confirms the script is running WITHOUT opening Console ----
  var banner = null;
  function ensureBanner() {
    if (banner && banner.parentNode) return;
    if (!document.body) return;
    try {
      banner = document.createElement('div');
      banner.setAttribute('id', 'biliFix3Banner');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;'
        + 'background:#0a7d3b;color:#fff;font:13px/1.5 -apple-system,Segoe UI,Arial,sans-serif;'
        + 'padding:6px 12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.4);'
        + 'letter-spacing:.3px;pointer-events:none;';
      document.body.appendChild(banner);
    } catch (e) {}
  }
  function updateBanner() {
    if (!document.body) return;
    ensureBanner();
    if (!banner) return;
    var bv = getBv() || '-';
    if (fired) {
      banner.style.background = '#d97706';
      banner.textContent = 'B\u7ad9\u5207\u6362\u4fee\u590d v3 \u5df2\u89e6\u53d1\u5237\u65b0\uff1a' + triggerMsg;
      return;
    }
    banner.style.background = ready ? '#0a7d3b' : '#b91c1c';
    banner.textContent = 'B\u7ad9\u5207\u6362\u4fee\u590d v3 \u8fd0\u884c\u4e2d\uff08\u770b\u5230\u6b64\u6761\u5373\u811a\u672c\u5df2\u6ce8\u5165\uff09 BV: ' + bv + ' | '
      + (ready ? '\u5df2\u542f\u7528' : '\u7b49\u5f85\u521d\u59cb\u5316');
  }
  if (document.body) updateBanner();
  else window.addEventListener('DOMContentLoaded', updateBanner);
  setInterval(updateBanner, 500);
})();

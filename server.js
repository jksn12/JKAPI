import http from 'node:http';
import { URL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';

function loadEnvFile(path = '.env') {
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HOST = (process.env.HOST || '127.0.0.1').trim();
const UPSTREAM_BASE_URL = (process.env.UPSTREAM_BASE_URL || '').trim().replace(/\/+$/, '');
const UPSTREAM_API_KEY = (process.env.UPSTREAM_API_KEY || '').trim();
const UPSTREAM_AUTH_HEADER = (process.env.UPSTREAM_AUTH_HEADER || 'authorization').trim().toLowerCase();
const UPSTREAM_AUTH_PREFIX = process.env.UPSTREAM_AUTH_PREFIX ?? 'Bearer ';
const DEFAULT_MODEL = (process.env.DEFAULT_MODEL || '').trim();
const PROXY_API_KEY = (process.env.PROXY_API_KEY || '').trim();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').trim();
const MAX_BODY_BYTES = Number.parseInt(process.env.MAX_BODY_BYTES || `${2 * 1024 * 1024}`, 10);
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.REQUEST_TIMEOUT_MS || '120000', 10);
const MAX_REQUESTS_PER_MINUTE = Number.parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '120', 10);

if (!UPSTREAM_BASE_URL) {
  console.error('Missing UPSTREAM_BASE_URL. Create a .env file or export the variable first.');
  process.exit(1);
}

const requestBuckets = new Map();

function sendJson(res, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

function sendText(res, statusCode, text, headers = {}) {
  res.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    ...headers,
  });
  res.end(text);
}

function safeHash(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function getOrigin(req) {
  return req.headers.origin?.toString() || '';
}

function getCorsHeaders(origin) {
  const headers = {
    'access-control-allow-headers': 'authorization, content-type, x-relay-key, x-request-id',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-expose-headers': 'x-request-id, x-upstream-status, x-cache-status',
  };

  if (ALLOWED_ORIGINS === '*') {
    headers['access-control-allow-origin'] = '*';
    return headers;
  }

  const allowedOrigins = new Set(ALLOWED_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean));
  if (origin && allowedOrigins.has(origin)) {
    headers['access-control-allow-origin'] = origin;
    headers.vary = 'origin';
  }

  return headers;
}

function readBody(req, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limit) {
        reject(new Error(`Request body exceeds ${limit} bytes.`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function getClientKey(req) {
  const relayKey = req.headers['x-relay-key'];
  if (typeof relayKey === 'string' && relayKey) return relayKey;

  const authorization = req.headers.authorization;
  if (typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return '';
}

function isAuthorized(req) {
  if (!PROXY_API_KEY) return true;
  return getClientKey(req) === PROXY_API_KEY;
}

function rateLimit(req) {
  if (MAX_REQUESTS_PER_MINUTE <= 0) return { ok: true };

  const now = Date.now();
  const key = getClientKey(req) || req.socket.remoteAddress || 'anonymous';
  const bucket = requestBuckets.get(key) || { count: 0, resetAt: now + 60_000 };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 60_000;
  }

  bucket.count += 1;
  requestBuckets.set(key, bucket);

  if (bucket.count > MAX_REQUESTS_PER_MINUTE) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { ok: true };
}

function normalizeHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value == null) continue;
    out[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  return out;
}

function buildUpstreamUrl(reqUrl) {
  const url = new URL(reqUrl, `http://${HOST}:${PORT}`);
  const upstream = new URL(UPSTREAM_BASE_URL);
  upstream.pathname = `${upstream.pathname.replace(/\/$/, '')}${url.pathname}`;
  upstream.search = url.search;
  return upstream;
}

function filterRequestHeaders(headers) {
  const forwarded = {};
  for (const [key, value] of Object.entries(normalizeHeaders(headers))) {
    if (
      key === 'host' ||
      key === 'content-length' ||
      key === 'connection' ||
      key === 'accept-encoding' ||
      key === 'origin' ||
      key === 'referer' ||
      key === 'x-relay-key'
    ) {
      continue;
    }
    forwarded[key] = value;
  }

  if (UPSTREAM_API_KEY) {
    forwarded[UPSTREAM_AUTH_HEADER] = `${UPSTREAM_AUTH_PREFIX}${UPSTREAM_API_KEY}`;
  }

  return forwarded;
}

function createJsonRequestBody(payload) {
  return new TextEncoder().encode(JSON.stringify(payload));
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Upstream request timed out.')), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: 'manual',
    });
  } finally {
    clearTimeout(timeout);
  }
}

function transferResponseHeaders(source, res) {
  for (const [key, value] of source.headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === 'content-length' || lower === 'transfer-encoding' || lower === 'connection') continue;
    res.setHeader(key, value);
  }
}

async function pipeWebResponse(webResponse, res) {
  if (!webResponse.body) {
    res.end();
    return;
  }

  const reader = webResponse.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!res.write(Buffer.from(value))) {
      await new Promise((resolve) => res.once('drain', resolve));
    }
  }
  res.end();
}

function buildResponseHeaders(status, requestId) {
  return {
    'x-request-id': requestId,
    'x-upstream-status': String(status),
  };
}

function summarizeOrigin(origin) {
  return origin ? origin.replace(/^https?:\/\//, '') : 'local';
}

function htmlPage() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>JKAPI 控制台</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f5f0;
        --panel: #ffffff;
        --line: #e7e2d8;
        --line-strong: #d6d0c5;
        --text: #1f2937;
        --muted: #6b7280;
        --accent: #597ef7;
        --accent-soft: #e8efff;
        --green: #43a47d;
        --green-soft: #e2f5eb;
        --purple: #8b5cf6;
        --purple-soft: #efe7ff;
        --orange: #f28f43;
        --orange-soft: #fff0df;
        --shadow: 0 12px 30px rgba(17, 24, 39, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(180deg, #faf7f2 0%, #f3efe8 100%);
        color: var(--text);
      }
      .app {
        min-height: 100vh;
        display: grid;
        grid-template-rows: 84px 1fr;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 0 28px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(12px);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .logo {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        border: 2px solid #9b8caa;
        background: #fff;
        display: grid;
        place-items: center;
        font-weight: 800;
        color: #7a6d8d;
        flex: none;
      }
      .brand-name {
        font-size: 30px;
        font-weight: 800;
        letter-spacing: 0;
      }
      .tabs {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-left: 12px;
        flex-wrap: wrap;
      }
      .tab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 46px;
        padding: 0 18px;
        border-radius: 10px;
        font-size: 18px;
        font-weight: 700;
        color: #222;
        text-decoration: none;
      }
      .tab.active {
        background: #eaf2ff;
        box-shadow: inset 0 -4px 0 var(--line-strong);
      }
      .toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 1px solid #dfe5ef;
        background: #fff;
        font-size: 22px;
        color: #707784;
      }
      .user {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px 8px 10px;
        border-radius: 999px;
        border: 1px solid #dfe5ef;
        background: #fff;
        font-weight: 700;
      }
      .avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: #d9dde4;
      }
      .content {
        display: grid;
        grid-template-columns: 260px 1fr;
        min-height: 0;
      }
      .sidebar {
        padding: 18px 0 18px 28px;
        border-right: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.5);
      }
      .side-section {
        padding: 22px 0 10px;
        margin-right: 24px;
      }
      .side-title {
        margin: 0 0 12px;
        font-size: 22px;
        font-weight: 800;
        color: #80848f;
      }
      .side-item {
        display: flex;
        align-items: center;
        gap: 14px;
        height: 78px;
        padding: 0 18px;
        border-radius: 16px;
        color: #5b6270;
        font-size: 20px;
        font-weight: 700;
      }
      .side-item.active {
        background: #eaf2ff;
        color: #1861f0;
      }
      .iconbox {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: #eef2f8;
        display: grid;
        place-items: center;
        color: #666;
        font-size: 20px;
        flex: none;
      }
      .main {
        padding: 36px 28px 40px;
        overflow: auto;
      }
      .hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 26px;
      }
      .hero h2 {
        margin: 0;
        font-size: clamp(28px, 2.3vw, 44px);
        font-weight: 800;
        letter-spacing: 0;
      }
      .hero-actions {
        display: flex;
        gap: 14px;
      }
      .circle {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        border: 1px solid #dfe5ef;
        background: #fff;
        display: grid;
        place-items: center;
        font-size: 28px;
        color: #818896;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
        margin-bottom: 22px;
      }
      .card {
        min-height: 274px;
        border: 1px solid #dfe5ef;
        border-radius: 24px;
        background: var(--panel);
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
      }
      .card-head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px 24px 18px;
        font-size: 26px;
        font-weight: 800;
      }
      .card-body {
        border-top: 1px solid var(--line);
        padding: 24px;
        flex: 1;
      }
      .stat-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 28px;
      }
      .stat-item {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .stat-icon {
        width: 84px;
        height: 84px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        font-size: 30px;
        flex: none;
      }
      .blue { background: #d8e6ff; color: #4f78f5; }
      .green { background: var(--green-soft); color: var(--green); }
      .purple { background: var(--purple-soft); color: var(--purple); }
      .orange { background: var(--orange-soft); color: var(--orange); }
      .stat-label {
        color: #6d7685;
        font-size: 18px;
        font-weight: 700;
      }
      .stat-value {
        font-size: 26px;
        line-height: 1.1;
        font-weight: 800;
        color: #18202f;
      }
      .stat-value.emph.blue-t { color: #2652e4; }
      .stat-value.emph.purple-t { color: #7a2bd8; }
      .stat-value.emph.orange-t { color: #cc5d0b; }
      .small-muted {
        font-size: 14px;
        color: #6e7682;
      }
      .panel-grid {
        display: grid;
        grid-template-columns: 1.8fr 1fr;
        gap: 18px;
      }
      .analysis {
        min-height: 520px;
      }
      .analysis-tabs {
        margin-left: auto;
        display: flex;
        gap: 12px;
        color: #7b8390;
        font-size: 20px;
        font-weight: 700;
      }
      .chart-area {
        position: relative;
        min-height: 430px;
        padding: 28px 22px 22px;
      }
      .chart-title {
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .chart-subtitle {
        font-size: 18px;
        color: #7d8492;
        margin-bottom: 18px;
      }
      .chart {
        position: relative;
        height: 300px;
        border-bottom: 1px solid var(--line);
        background:
          linear-gradient(to bottom, transparent 0, transparent 19%, #e8e3da 19%, #e8e3da 20%, transparent 20%, transparent 39%, #e8e3da 39%, #e8e3da 40%, transparent 40%, transparent 59%, #e8e3da 59%, #e8e3da 60%, transparent 60%, transparent 79%, #e8e3da 79%, #e8e3da 80%, transparent 80%, transparent 99%, #e8e3da 99%, #e8e3da 100%);
      }
      .bar {
        position: absolute;
        bottom: 0;
        width: 180px;
        border-radius: 0;
      }
      .bar.blue-bar {
        left: 62%;
        height: 88%;
        background: rgba(144, 176, 209, 0.92);
      }
      .bar.purple-bar {
        left: 62%;
        height: 14%;
        bottom: 74%;
        background: rgba(121, 110, 133, 0.92);
      }
      .axis {
        display: flex;
        justify-content: space-between;
        padding-top: 14px;
        font-size: 18px;
        color: #646b78;
      }
      .legend {
        display: flex;
        justify-content: center;
        gap: 24px;
        align-items: center;
        margin-top: 16px;
        font-size: 18px;
        color: #5a5f69;
      }
      .legend span { display: inline-flex; align-items: center; gap: 8px; }
      .swatch {
        width: 18px;
        height: 18px;
        display: inline-block;
        background: #8a7b90;
      }
      .swatch.blue { background: #9bb9d8; }
      .token {
        min-height: 520px;
      }
      .token-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .token-item {
        border: 2px solid #3db257;
        border-radius: 18px;
        padding: 16px;
        background: #fff;
      }
      .token-item.alt {
        border-color: #2f5ee8;
      }
      .token-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 14px;
      }
      .token-name { font-size: 18px; color: #555; font-weight: 700; }
      .token-badge {
        border: 1px solid #999;
        border-radius: 8px;
        padding: 3px 8px;
        font-size: 14px;
        color: #555;
      }
      .token-value {
        font-size: 36px;
        font-weight: 800;
        line-height: 1;
        color: #1da14c;
      }
      .token-item.alt .token-value { color: #1e4de8; }
      .token-meta {
        margin-top: 12px;
        color: #666;
        font-size: 16px;
      }
      .token-footer {
        margin-top: 18px;
        color: #717784;
        font-size: 14px;
      }
      .token-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 18px;
        gap: 10px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 120px;
        height: 44px;
        border-radius: 12px;
        border: 1px solid #d2d7df;
        background: #fff;
        color: #475062;
        font-size: 16px;
        font-weight: 700;
      }
      @media (max-width: 1400px) {
        .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .panel-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 960px) {
        .app { grid-template-rows: auto 1fr; }
        .topbar { flex-direction: column; align-items: flex-start; padding: 20px; }
        .content { grid-template-columns: 1fr; }
        .sidebar { border-right: 0; border-bottom: 1px solid var(--line); padding: 14px 18px; }
        .metrics { grid-template-columns: 1fr; }
        .token-list { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <div class="logo">API</div>
          <div class="tabs">
            <span class="brand-name">JKAPI</span>
            <a class="tab" href="/">首页</a>
            <a class="tab active" href="/">控制台</a>
            <a class="tab" href="#">模型广场</a>
            <a class="tab" href="#">教程</a>
          </div>
        </div>
        <div class="toolbar">
          <div class="chip">◔</div>
          <div class="chip">⌁</div>
          <div class="chip">⌖</div>
          <div class="user"><div class="avatar">J</div> <span>${summarizeOrigin(DEFAULT_MODEL || 'relay')}</span> ▾</div>
        </div>
      </header>
      <div class="content">
        <aside class="sidebar">
          <section class="side-section">
            <h3 class="side-title">聊天</h3>
            <div class="side-item">◫ 模型对话</div>
            <div class="side-item">◉ 无限画布</div>
          </section>
          <section class="side-section">
            <h3 class="side-title">控制台</h3>
            <div class="side-item active">▦ 数据看板</div>
            <div class="side-item">⌁ 令牌管理</div>
            <div class="side-item">▤ 使用日志</div>
            <div class="side-item">▥ 分组监控</div>
          </section>
          <section class="side-section">
            <h3 class="side-title">个人中心</h3>
            <div class="side-item">▣ 我的订阅</div>
            <div class="side-item">▤ 充值管理</div>
            <div class="side-item">▥ 个人设置</div>
          </section>
        </aside>
        <main class="main">
          <div class="hero">
            <h2>晚上好，Relay</h2>
            <div class="hero-actions">
              <div class="circle">⌁</div>
              <div class="circle">⌖</div>
            </div>
          </div>

          <section class="metrics">
            <article class="card">
              <div class="card-head"><span style="color:#5a7ef8">▣</span> 账户数据</div>
              <div class="card-body">
                <div class="stat-row">
                  <div class="stat-item">
                    <div class="stat-icon blue">◫</div>
                    <div>
                      <div class="stat-label">当前余额</div>
                      <div class="stat-value emph blue-t">$19.91</div>
                    </div>
                  </div>
                  <div class="btn">充值</div>
                </div>
                <div class="stat-row">
                  <div class="stat-item">
                    <div class="stat-icon blue">▥</div>
                    <div>
                      <div class="stat-label">历史消耗</div>
                      <div class="stat-value emph purple-t">$0.09</div>
                    </div>
                  </div>
                  <div class="stat-item" style="justify-self:end">
                    <div>
                      <div class="stat-label">累计支付</div>
                      <div class="stat-value emph purple-t">$20.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article class="card">
              <div class="card-head"><span style="color:#43a47d">▦</span> 使用统计</div>
              <div class="card-body">
                <div class="stat-row">
                  <div class="stat-item">
                    <div class="stat-icon green">◩</div>
                    <div>
                      <div class="stat-label">请求次数</div>
                      <div class="stat-value emph blue-t">52</div>
                    </div>
                  </div>
                </div>
                <div class="stat-row">
                  <div class="stat-item">
                    <div class="stat-icon green">▤</div>
                    <div>
                      <div class="stat-label">统计次数</div>
                      <div class="stat-value emph blue-t">52</div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article class="card">
              <div class="card-head"><span style="color:#8b5cf6">▤</span> 资源消耗 <span class="small-muted">(每日10点刷新)</span></div>
              <div class="card-body">
                <div class="stat-row" style="display:block; margin-bottom:22px;">
                  <div class="small-muted">统计区间：08-19 10:00 起</div>
                </div>
                <div class="stat-row">
                  <div class="stat-item">
                    <div class="stat-icon purple">▥</div>
                    <div>
                      <div class="stat-label">统计额度</div>
                      <div class="stat-value">$0.09</div>
                    </div>
                  </div>
                </div>
                <div class="stat-row">
                  <div class="stat-item">
                    <div class="stat-icon purple">▤</div>
                    <div>
                      <div class="stat-label">统计Tokens</div>
                      <div class="stat-value">39,517</div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article class="card">
              <div class="card-head"><span style="color:#f28f43">▦</span> 性能指标</div>
              <div class="card-body">
                <div class="stat-row">
                  <div class="stat-item">
                    <div class="stat-icon orange">◴</div>
                    <div>
                      <div class="stat-label">平均RPM</div>
                      <div class="stat-value emph orange-t">0.056</div>
                    </div>
                  </div>
                </div>
                <div class="stat-row">
                  <div class="stat-item">
                    <div class="stat-icon orange">▤</div>
                    <div>
                      <div class="stat-label">平均TPM</div>
                      <div class="stat-value">42.447</div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section class="panel-grid">
            <article class="card analysis">
              <div class="card-head" style="justify-content:space-between;">
                <div>▦ 模型数据分析</div>
                <div class="analysis-tabs">消耗分布 / 调用趋势 / 调用次数分布 / 调用次数排行</div>
              </div>
              <div class="chart-area">
                <div class="chart-title">模型消耗分布</div>
                <div class="chart-subtitle">总计：$0.09</div>
                <div class="chart">
                  <div class="bar blue-bar"></div>
                  <div class="bar purple-bar"></div>
                </div>
                <div class="axis">
                  <span>08-19 18:00</span>
                  <span>08-19 19:00</span>
                  <span>08-19 20:00</span>
                  <span>08-19 21:00</span>
                  <span>08-19 22:00</span>
                  <span>08-19 23:00</span>
                  <span>08-20 00:00</span>
                </div>
                <div class="legend">
                  <span><i class="swatch"></i> gpt-5.5</span>
                  <span><i class="swatch blue"></i> gpt-5.6-sql</span>
                </div>
              </div>
            </article>

            <article class="card token">
              <div class="card-head"><span style="color:#5a677f">▣</span> 令牌管理</div>
              <div class="card-body">
                <div class="token-list">
                  <div class="token-item">
                    <div class="token-top"><div class="token-name">Relay-Primary</div><div class="token-badge">active</div></div>
                    <div class="token-value">103.6</div>
                    <div class="token-meta">近 24 小时 14 次</div>
                  </div>
                  <div class="token-item alt">
                    <div class="token-top"><div class="token-name">Relay-Backup</div><div class="token-badge">max</div></div>
                    <div class="token-value">102.2</div>
                    <div class="token-meta">近 24 小时 23 次</div>
                  </div>
                  <div class="token-item">
                    <div class="token-top"><div class="token-name">Relay-Dev</div><div class="token-badge">xhigh</div></div>
                    <div class="token-value">101.8</div>
                    <div class="token-meta">近 24 小时 10 次</div>
                  </div>
                  <div class="token-item alt">
                    <div class="token-top"><div class="token-name">Relay-Test</div><div class="token-badge">high</div></div>
                    <div class="token-value">92.0</div>
                    <div class="token-meta">近 24 小时 13 次</div>
                  </div>
                </div>
                <div class="token-actions">
                  <div class="btn">新建令牌</div>
                  <div class="btn">复制配置</div>
                </div>
                <div class="token-footer">更新时间：2026-08-20 00:08</div>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  </body>
</html>`;
}

function buildMetadata(requestId) {
  return {
    ok: true,
    requestId,
    proxy: {
      host: HOST,
      port: PORT,
      authEnabled: Boolean(PROXY_API_KEY),
      cors: ALLOWED_ORIGINS,
      rateLimitPerMinute: MAX_REQUESTS_PER_MINUTE,
      maxBodyBytes: MAX_BODY_BYTES,
      timeoutMs: REQUEST_TIMEOUT_MS,
    },
    upstream: {
      baseUrl: UPSTREAM_BASE_URL,
      model: DEFAULT_MODEL || null,
      authHeader: UPSTREAM_AUTH_HEADER,
    },
  };
}

function ensureJsonBody(req) {
  const contentType = req.headers['content-type'] || '';
  return typeof contentType === 'string' && contentType.includes('application/json');
}

async function normalizeJsonRequest(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  return JSON.parse(raw.toString('utf8'));
}

async function proxyOpenAICompatible(req, res, upstreamPath, requestId) {
  const method = req.method || 'POST';
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);
  const upstreamUrl = new URL(upstreamPath, UPSTREAM_BASE_URL);
  const upstreamResponse = await fetchWithTimeout(upstreamUrl, {
    method,
    headers: filterRequestHeaders(req.headers),
    body,
  });

  res.statusCode = upstreamResponse.status;
  transferResponseHeaders(upstreamResponse, res);
  for (const [key, value] of Object.entries(buildResponseHeaders(upstreamResponse.status, requestId))) {
    res.setHeader(key, value);
  }
  await pipeWebResponse(upstreamResponse, res);
}

async function handleResponsesRoute(req, res, requestId) {
  const payload = await normalizeJsonRequest(req);
  const model = payload.model || DEFAULT_MODEL;

  if (!model) {
    sendJson(res, 400, {
      error: { message: 'Missing model. Set DEFAULT_MODEL or include model in request.' },
      requestId,
    }, buildResponseHeaders(400, requestId));
    return;
  }

  if (!payload.model) payload.model = model;

  const upstreamResponse = await fetchWithTimeout(new URL('/v1/responses', UPSTREAM_BASE_URL), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...filterRequestHeaders(req.headers),
    },
    body: createJsonRequestBody(payload),
  });

  res.statusCode = upstreamResponse.status;
  transferResponseHeaders(upstreamResponse, res);
  for (const [key, value] of Object.entries(buildResponseHeaders(upstreamResponse.status, requestId))) {
    res.setHeader(key, value);
  }
  await pipeWebResponse(upstreamResponse, res);
}

async function handle(req, res) {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  const origin = getOrigin(req);

  for (const [key, value] of Object.entries(getCorsHeaders(origin))) {
    res.setHeader(key, value);
  }
  res.setHeader('x-request-id', requestId);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { error: { message: 'Unauthorized.' }, requestId }, buildResponseHeaders(401, requestId));
    return;
  }

  const bucket = rateLimit(req);
  if (!bucket.ok) {
    sendJson(
      res,
      429,
      { error: { message: 'Rate limit exceeded.' }, requestId },
      {
        ...buildResponseHeaders(429, requestId),
        'retry-after': String(bucket.retryAfter),
      },
    );
    return;
  }

  console.log(JSON.stringify({
    at: new Date().toISOString(),
    requestId,
    method: req.method,
    path: url.pathname,
    remote: req.socket.remoteAddress,
    ua: req.headers['user-agent'] || '',
  }));

  if (url.pathname === '/' && req.method === 'GET') {
    sendText(res, 200, htmlPage(), buildResponseHeaders(200, requestId));
    return;
  }

  if (url.pathname === '/health' && req.method === 'GET') {
    sendJson(res, 200, buildMetadata(requestId), buildResponseHeaders(200, requestId));
    return;
  }

  if (url.pathname === '/v1/models' && req.method === 'GET') {
    const data = DEFAULT_MODEL
      ? [{ id: DEFAULT_MODEL, object: 'model', owned_by: 'relay' }]
      : [];
    sendJson(res, 200, { object: 'list', data, requestId }, buildResponseHeaders(200, requestId));
    return;
  }

  if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
    if (!ensureJsonBody(req)) {
      sendJson(res, 400, { error: { message: 'Expected application/json.' }, requestId }, buildResponseHeaders(400, requestId));
      return;
    }

    try {
      const payload = await normalizeJsonRequest(req);
      if (!payload.model && DEFAULT_MODEL) payload.model = DEFAULT_MODEL;
      const upstreamResponse = await fetchWithTimeout(new URL('/v1/chat/completions', UPSTREAM_BASE_URL), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...filterRequestHeaders(req.headers),
        },
        body: createJsonRequestBody(payload),
      });

      res.statusCode = upstreamResponse.status;
      transferResponseHeaders(upstreamResponse, res);
      for (const [key, value] of Object.entries(buildResponseHeaders(upstreamResponse.status, requestId))) {
        res.setHeader(key, value);
      }
      await pipeWebResponse(upstreamResponse, res);
    } catch (error) {
      console.error(error);
      sendJson(
        res,
        502,
        {
          error: { message: 'Upstream request failed.', detail: error instanceof Error ? error.message : String(error) },
          requestId,
        },
        buildResponseHeaders(502, requestId),
      );
    }
    return;
  }

  if (url.pathname === '/v1/responses' && req.method === 'POST') {
    if (!ensureJsonBody(req)) {
      sendJson(res, 400, { error: { message: 'Expected application/json.' }, requestId }, buildResponseHeaders(400, requestId));
      return;
    }

    try {
      await handleResponsesRoute(req, res, requestId);
    } catch (error) {
      console.error(error);
      sendJson(
        res,
        502,
        {
          error: { message: 'Upstream request failed.', detail: error instanceof Error ? error.message : String(error) },
          requestId,
        },
        buildResponseHeaders(502, requestId),
      );
    }
    return;
  }

  if (url.pathname.startsWith('/v1/')) {
    try {
      await proxyOpenAICompatible(req, res, url.pathname + url.search, requestId);
    } catch (error) {
      console.error(error);
      sendJson(
        res,
        502,
        {
          error: { message: 'Upstream request failed.', detail: error instanceof Error ? error.message : String(error) },
          requestId,
        },
        buildResponseHeaders(502, requestId),
      );
    }
    return;
  }

  sendJson(res, 404, { error: { message: 'Not found.' }, requestId }, buildResponseHeaders(404, requestId));
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: { message: 'Internal server error.' } });
      return;
    }
    res.destroy(error);
  });
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`JKAPI listening on http://${HOST}:${PORT}`);
});

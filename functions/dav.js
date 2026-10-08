const KOOF_HOST = 'https://app.koofr.net';

// 允许所有 WebDAV 方法
const ALLOWED_METHODS = 'GET, HEAD, PUT, POST, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK';
const ALLOWED_HEADERS = 'Authorization, Content-Type, Depth, Destination, Overwrite, If-Match, If-None-Match, Lock-Token, Translate, X-Requested-With';

// 1. 优先处理 OPTIONS 预检（解决 405 核心）
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': ALLOWED_METHODS,
      'Access-Control-Allow-Headers': ALLOWED_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}

// 2. 通用处理：强制透传 WebDAV 方法
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const method = request.method;

  // 核心路径修正：
  // 前端填的是 https://jianguoyu.pages.dev/dav/Koofr
  // url.pathname 是 /dav/Koofr
  // Koofr 真实地址也是 /dav/Koofr，所以直接拼接即可
  const target = KOOF_HOST + url.pathname + (url.search || '');

  // 构造透传 Headers（清理浏览器自带的非必要头）
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('cf-request-id'); // 清理 Cloudflare 边缘头

  const init = {
    method: method,
    headers,
    redirect: 'follow',
  };

  // WebDAV 的 PROPFIND/MKCOL 等必须有 body 透传（GET/HEAD/OPTIONS 无 body）
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    init.body = request.body;
  }

  // 发起真实请求
  const resp = await fetch(target, init);

  // 回写跨域头
  const newHeaders = new Headers(resp.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  newHeaders.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  newHeaders.set('Access-Control-Expose-Headers', '*');

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: newHeaders,
  });
}

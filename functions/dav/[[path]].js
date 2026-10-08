const KOOF_HOST = 'https://app.koofr.net';

// 允许所有 WebDAV 方法
const ALLOWED_METHODS = 'GET, HEAD, PUT, POST, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK';
const ALLOWED_HEADERS = 'Authorization, Content-Type, Depth, Destination, Overwrite, If-Match, If-None-Match, Lock-Token, Translate, X-Requested-With';

// 单独导出 OPTIONS，优先拦截预检（解决 405）
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

// 通用透传（匹配 /dav/* 及其子路径）
export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const method = request.method;

  // 拼接真实路径：/dav/ + 捕获的通配路径 (Koofr/家庭管家备份/...)
  // 最终转发到：https://app.koofr.net/dav/Koofr/家庭管家备份/...
  const subPath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const target = `${KOOF_HOST}/dav/${subPath}${url.search || ''}`;

  // 构造透传 Headers
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('cf-request-id');

  const init = {
    method: method,
    headers,
    redirect: 'follow',
  };

  // 透传 Body（PROPFIND/PUT 等需要）
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

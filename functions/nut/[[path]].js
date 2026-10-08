const TARGET_HOST = 'https://dav.jianguoyun.com';

const ALLOWED_METHODS = 'GET, HEAD, PUT, POST, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK';
const ALLOWED_HEADERS = 'Authorization, Content-Type, Depth, Destination, Overwrite, If-Match, If-None-Match, Lock-Token, Translate, X-Requested-With';

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

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const method = request.method;

  // 去掉代理前缀（/dav/ 或 /nut/），原样透传其余路径与中文目录
  const sub = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const target = `${TARGET_HOST}/${sub}${url.search || ''}`;

  const headers = new Headers(request.headers);
  ['host', 'origin', 'referer', 'cf-request-id', 'cf-ray'].forEach(h => headers.delete(h));

  const init = { method, headers, redirect: 'follow' };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) init.body = request.body;

  const resp = await fetch(target, init);

  const out = new Headers(resp.headers);
  out.set('Access-Control-Allow-Origin', '*');
  out.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  out.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  out.set('Access-Control-Expose-Headers', '*');

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: out,
  });
}

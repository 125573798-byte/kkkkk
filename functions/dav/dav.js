// functions/dav/dav.js
const KOOF_HOST = 'https://app.koofr.net';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 目标地址：把 /dav/ 后面的路径拼到 Koofr
  const target = KOOF_HOST + url.pathname + (url.search || '');

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');

  const init = {
    method: request.method,
    headers,
    redirect: 'follow',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  const resp = await fetch(target, init);
  const newHeaders = new Headers(resp.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, PUT, POST, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK');
  newHeaders.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Depth, Destination, Overwrite, If-Match, If-None-Match, Lock-Token, Translate, X-Requested-With');
  newHeaders.set('Access-Control-Expose-Headers', '*');

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: newHeaders,
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, PUT, POST, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Depth, Destination, Overwrite, If-Match, If-None-Match, Lock-Token, Translate, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Cloudflare Pages Functions —— Koofr WebDAV 反向代理（同源，免 CORS）
// 部署后前端访问 https://jianguoyu.pages.dev/dav/Koofr 即等于 https://app.koofr.net/dav/Koofr
export const config = { path: "/dav/*" };

const UPSTREAM = "https://app.koofr.net";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 只允许代理到 Koofr 的 dav 路径
  const target = UPSTREAM + url.pathname + (url.search || "");

  // 透传请求头，去掉会导致错误的 hop-by-hop / 来源头
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("cf-connecting-ip");
  headers.delete("x-forwarded-for");
  headers.delete("x-real-ip");

  const init = {
    method: request.method,
    headers,
    redirect: "follow",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  let resp;
  try {
    resp = await fetch(target, init);
  } catch (e) {
    return new Response("Koofr proxy error: " + e.message, { status: 502 });
  }

  // 清理 upstream 可能带回的、与 CORS 冲突的头
  const out = new Headers(resp.headers);
  out.delete("content-encoding");
  out.delete("transfer-encoding");
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: out,
  });
}

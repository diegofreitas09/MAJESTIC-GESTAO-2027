const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

async function proxyDatabase(request, env) {
  if (!env.MAJESTIC_APPS_SCRIPT_URL || !env.MAJESTIC_SYNC_TOKEN) {
    return json({ ok: false, error: 'database_proxy_not_configured' }, 503);
  }

  const incoming = new URL(request.url);
  const upstream = new URL(env.MAJESTIC_APPS_SCRIPT_URL);

  incoming.searchParams.forEach((value, key) => {
    if (key !== 'token') upstream.searchParams.set(key, value);
  });
  upstream.searchParams.set('token', env.MAJESTIC_SYNC_TOKEN);

  const init = {
    method: request.method,
    redirect: 'follow',
    headers: { 'content-type': 'application/json' },
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}
    body.token = env.MAJESTIC_SYNC_TOKEN;
    init.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(upstream.toString(), init);
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return json({ ok: false, error: 'database_upstream_unavailable' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/db' || url.pathname === '/api/db/') {
      if (!['GET', 'POST'].includes(request.method)) {
        return json({ ok: false, error: 'method_not_allowed' }, 405);
      }
      return proxyDatabase(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

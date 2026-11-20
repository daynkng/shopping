const unavailable = 'Known could not reach its app server. Please try again shortly.';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function requestJson(url, options = {}, { fetchImpl = fetch, wait = delay } = {}) {
  const readOnly = !options.method || options.method === 'GET';
  const attempts = readOnly ? 3 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let response;
    try {
      response = await fetchImpl(url, { ...options, cache: 'no-store', headers: { Accept: 'application/json', ...options.headers }, signal: AbortSignal.timeout(65000) });
    } catch {
      if (attempt + 1 < attempts) { await wait(300 * (attempt + 1)); continue; }
      throw new Error(unavailable);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(contentType)) {
      if (attempt + 1 < attempts) { await wait(300 * (attempt + 1)); continue; }
      throw new Error('Known received a page instead of app data. Please reload Known and try again.');
    }
    let data;
    try { data = await response.json(); }
    catch { throw new Error('Known received an unreadable app response. Please try again.'); }
    if (!response.ok) {
      if ([502, 503, 504].includes(response.status) && attempt + 1 < attempts) { await wait(300 * (attempt + 1)); continue; }
      throw new Error(typeof data?.error === 'string' ? data.error : `App request failed (${response.status}).`);
    }
    return data;
  }
}

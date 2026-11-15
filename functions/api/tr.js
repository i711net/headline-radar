// 头条雷达 · 韩文标题翻译接口（Cloudflare Pages Function + Workers AI）
// GET /api/tr?t=<韩文标题>  ->  { zh: "中文翻译" }
// GET /api/tr              ->  { ai: true/false }  用来检查 Workers AI 绑定是否生效
// 需要在 Pages 项目的 设置 → 绑定 里添加 Workers AI，变量名填 AI。
// 每条标题只翻译一次：结果在边缘缓存 7 天，浏览器也会缓存。

const MODEL = '@cf/meta/m2m100-1.2b';
const json = (obj, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } });

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const t = (url.searchParams.get('t') || '').trim();
  if (!t) return json({ ai: !!env.AI, model: MODEL });
  if (t.length > 160 || !/[가-힣]/.test(t)) return json({ error: '只翻译160字以内的韩文标题' }, 400);
  if (!env.AI) return json({ error: '没有绑定 Workers AI' }, 501);

  const cache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const key = new Request(url.origin + '/api/tr?t=' + encodeURIComponent(t));
  if (cache) { const hit = await cache.match(key); if (hit) return hit; }

  try {
    const out = await env.AI.run(MODEL, { text: t, source_lang: 'ko', target_lang: 'zh' });
    const zh = String(out?.translated_text || '').trim();
    if (!zh) return json({ error: '模型没有返回译文' }, 502);
    const res = json({ zh }, 200, 'public, max-age=604800, s-maxage=604800');
    if (cache) context.waitUntil?.(cache.put(key, res.clone()));
    return res;
  } catch (e) {
    // 最常见的原因：当天的免费额度（10,000 Neurons）用完了
    return json({ error: String(e?.message || e).slice(0, 200) }, 503);
  }
}

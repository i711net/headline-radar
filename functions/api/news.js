// 头条雷达 · 新闻源抓取接口（Cloudflare Pages Function）
// GET /api/news  ->  { generatedAt, sources:[...], items:[...] }
// 并行抓取下方 FEEDS 里的 RSS/Atom，统一成一份 JSON，边缘缓存 5 分钟。
// 想增删媒体，只改 FEEDS 这个数组即可。

const G = (hl, gl, ceid) => `https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`;

// 没有可用 RSS 的媒体，改用 Google 新闻按站点检索最近一天的报道（带发布时间和媒体名）
const S = (site, hl, gl, ceid) => `https://news.google.com/rss/search?q=site:${site}+when:1d&hl=${hl}&gl=${gl}&ceid=${ceid}`;
const CN = ['zh-CN', 'CN', 'CN:zh-Hans'], TW = ['zh-TW', 'TW', 'TW:zh-Hant'], HK = ['zh-HK', 'HK', 'HK:zh-Hant'], KR = ['ko', 'KR', 'KR:ko'];

// lang: zh | ko      region: 媒体所在地区      tz: 源里日期不带时区时的默认时差（小时）
// agg: true 表示聚合源（Google 新闻头条），条目里的 <source> 才是真正的媒体名
export const FEEDS = [
  // ---------- 中文 · 聚合头条（各地区版 Google 新闻头条） ----------
  { id: 'g-cn', name: 'Google新闻·大陆版头条', lang: 'zh', region: '中国大陆', agg: true, url: G('zh-CN', 'CN', 'CN:zh-Hans') },
  { id: 'g-tw', name: 'Google新闻·台湾版头条', lang: 'zh', region: '台湾', agg: true, url: G('zh-TW', 'TW', 'TW:zh-Hant') },
  { id: 'g-hk', name: 'Google新闻·香港版头条', lang: 'zh', region: '香港', agg: true, url: G('zh-HK', 'HK', 'HK:zh-Hant') },

  // ---------- 中文 · 媒体直连 ----------
  { id: 'chinanews', name: '中国新闻网', lang: 'zh', region: '中国大陆', tz: 8, url: 'https://www.chinanews.com.cn/rss/scroll-news.xml' },
  { id: 'bbc-zh', name: 'BBC中文', lang: 'zh', region: '国际', url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml' },
  { id: 'nyt-zh', name: '纽约时报中文网', lang: 'zh', region: '国际', url: 'https://cn.nytimes.com/rss/' },
  { id: 'dw-zh', name: '德国之声中文', lang: 'zh', region: '国际', url: 'https://rss.dw.com/rdf/rss-chi-all' },
  { id: 'rfi-zh', name: '法广中文', lang: 'zh', region: '国际', url: 'https://www.rfi.fr/cn/rss' },
  { id: 'yna-zh', name: '韩联社中文', lang: 'zh', region: '韩国', tz: 9, url: 'https://cn.yna.co.kr/RSS/news.xml' },
  { id: 'cna', name: '中央社', lang: 'zh', region: '台湾', tz: 8, url: 'https://feeds.feedburner.com/rsscna/politics' },
  { id: 'ltn', name: '自由时报', lang: 'zh', region: '台湾', tz: 8, url: 'https://news.ltn.com.tw/rss/all.xml' },
  { id: 'rthk', name: '香港电台', lang: 'zh', region: '香港', tz: 8, url: 'https://rthk.hk/rthk/news/rss/c_expressnews_clocal.xml' },
  { id: 'rthk-intl', name: '香港电台·国际', lang: 'zh', region: '香港', tz: 8, url: 'https://rthk.hk/rthk/news/rss/c_expressnews_cinternational.xml' },

  // ---------- 中文 · 按站点检索 ----------
  { id: 's-people', name: '人民网', lang: 'zh', region: '中国大陆', agg: true, fixed: true, url: S('people.com.cn', ...CN) },
  { id: 's-xinhua', name: '新华网', lang: 'zh', region: '中国大陆', agg: true, fixed: true, url: S('news.cn', ...CN) },
  { id: 's-thepaper', name: '澎湃新闻', lang: 'zh', region: '中国大陆', agg: true, fixed: true, url: S('thepaper.cn', ...CN) },
  { id: 's-caixin', name: '财新', lang: 'zh', region: '中国大陆', agg: true, fixed: true, url: S('caixin.com', ...CN) },
  { id: 's-zaobao', name: '联合早报', lang: 'zh', region: '新加坡', agg: true, fixed: true, url: S('zaobao.com.sg', ...CN) },
  { id: 's-udn', name: '联合新闻网', lang: 'zh', region: '台湾', agg: true, fixed: true, url: S('udn.com', ...TW) },
  { id: 's-mingpao', name: '明报', lang: 'zh', region: '香港', agg: true, fixed: true, url: S('mingpao.com', ...HK) },
  { id: 's-8world', name: '8视界', lang: 'zh', region: '新加坡', agg: true, fixed: true, url: S('8world.com', ...CN) },
  { id: 's-sinchew', name: '星洲日报', lang: 'zh', region: '马来西亚', agg: true, fixed: true, url: S('sinchew.com.my', ...CN) },
  { id: 's-oriental', name: '东方日报', lang: 'zh', region: '马来西亚', agg: true, fixed: true, url: S('orientaldaily.com.my', ...CN) },
  { id: 's-chinapress', name: '中国报', lang: 'zh', region: '马来西亚', agg: true, fixed: true, url: S('chinapress.com.my', ...CN) },
  { id: 's-enanyang', name: '南洋商报', lang: 'zh', region: '马来西亚', agg: true, fixed: true, url: S('enanyang.my', ...CN) },
  { id: 's-worldjournal', name: '世界日报', lang: 'zh', region: '北美', agg: true, fixed: true, url: S('worldjournal.com', ...TW) },
  { id: 's-ftchinese', name: 'FT中文网', lang: 'zh', region: '国际', agg: true, fixed: true, url: S('ftchinese.com', ...CN) },
  { id: 's-hk01', name: '香港01', lang: 'zh', region: '香港', agg: true, fixed: true, url: S('hk01.com', ...HK) },

  // ---------- 韩文 · 聚合头条 ----------
  { id: 'g-kr', name: 'Google 뉴스·한국 헤드라인', lang: 'ko', region: '韩国', agg: true, url: G('ko', 'KR', 'KR:ko') },

  // ---------- 韩文 · 媒体直连 ----------
  { id: 'yna', name: '연합뉴스 韩联社', lang: 'ko', region: '韩国', tz: 9, url: 'https://www.yna.co.kr/rss/news.xml' },
  { id: 'chosun', name: '조선일보 朝鲜日报', lang: 'ko', region: '韩国', tz: 9, url: 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml' },
  { id: 'donga', name: '동아일보 东亚日报', lang: 'ko', region: '韩国', tz: 9, url: 'https://rss.donga.com/total.xml' },
  { id: 'khan', name: '경향신문 京乡新闻', lang: 'ko', region: '韩国', tz: 9, url: 'https://www.khan.co.kr/rss/rssdata/total_news.xml' },
  { id: 'mk', name: '매일경제 每日经济', lang: 'ko', region: '韩国', tz: 9, url: 'https://www.mk.co.kr/rss/30000001/' },
  { id: 'hankyung', name: '한국경제 韩国经济', lang: 'ko', region: '韩国', tz: 9, url: 'https://www.hankyung.com/feed/all-news' },
  { id: 'sbs', name: 'SBS 뉴스', lang: 'ko', region: '韩国', tz: 9, url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER' },
  { id: 'nocut', name: '노컷뉴스 CBS', lang: 'ko', region: '韩国', tz: 9, url: 'https://rss.nocutnews.co.kr/nocutnews.xml' },
  { id: 'seoul', name: '서울신문 首尔新闻', lang: 'ko', region: '韩国', tz: 9, url: 'https://www.seoul.co.kr/xml/rss/google_top.xml' },
  { id: 'segye', name: '세계일보 世界日报', lang: 'ko', region: '韩国', tz: 9, url: 'https://www.segye.com/Articles/RSSList/segye_recent.xml' },
  // ---------- 韩文 · 按站点检索 ----------
  { id: 's-hani', name: '한겨레 韩民族日报', lang: 'ko', region: '韩国', agg: true, fixed: true, url: S('hani.co.kr', ...KR) },
  { id: 's-joongang', name: '중앙일보 中央日报', lang: 'ko', region: '韩国', agg: true, fixed: true, url: S('joongang.co.kr', ...KR) },
  { id: 's-hankook', name: '한국일보 韩国日报', lang: 'ko', region: '韩国', agg: true, fixed: true, url: S('hankookilbo.com', ...KR) },
  { id: 's-kmib', name: '국민일보 国民日报', lang: 'ko', region: '韩国', agg: true, fixed: true, url: S('kmib.co.kr', ...KR) },
  { id: 's-jtbc', name: 'JTBC 뉴스', lang: 'ko', region: '韩国', agg: true, fixed: true, url: S('news.jtbc.co.kr', ...KR) },
];

const CACHE_SECONDS = 300;
const FETCH_TIMEOUT_MS = 7000;
const MAX_PER_FEED = 100;
const MAX_AGE_HOURS = 72;

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', hellip: '…', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–' };
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(code); } catch { return ''; }
    }
    return ENT[e.toLowerCase()] ?? m;
  });
}
function clean(s) {
  if (!s) return '';
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  s = decodeEntities(s).replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s); // 有些源做了两次转义
  return s.replace(/\s+/g, ' ').trim();
}
function tag(block, names) {
  for (const n of names) {
    const m = block.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i'));
    if (m) return m[1];
  }
  return '';
}

export function parseDate(raw, tz) {
  if (!raw) return NaN;
  let s = clean(raw);
  // 2026-11-15 16:00:00 / 2026/11/15 16:00 —— 没有时区，按该媒体所在地补上
  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/);
  if (m) {
    const off = tz ?? 8;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - off, +m[5], +(m[6] || 0));
  }
  s = s.replace(/\bKST\b/, '+0900').replace(/\bCST\b/, '+0800').replace(/\bHKT\b/, '+0800');
  const t = Date.parse(s);
  return t;
}

// 不算头条的条目：图片稿、讣告、栏目页、记者主页、专栏副刊、广告，以及语言不对的标题
const JUNK = /^[\[［【(（]\s*(사진|포토|화보|부고|인사|표|쇼츠|영상|게시판|알림|運勢|星座)[^\]］】)）]*[\]］】)）]|^분야별 뉴스$|^.{2,8}\s(기자|앵커|라이브|특파원)$|다시보기$|作家專欄|副刊|短信推|之家$|头条抢鲜看|^FT ?金融时报$|分類廣告|分类广告|^(Home|首頁|首页)$/i;
export function keep(title, lang) {
  if (JUNK.test(title)) return false;
  const chars = [...title.replace(/[\s\d\p{P}\p{S}]/gu, '')];
  if (chars.length < 5) return false;
  if (chars.filter((c) => /[\u4e00-\u9fff\uac00-\ud7a3]/.test(c)).length < 6) return false;   // 太短，多半是栏目名
  const re = lang === 'ko' ? /[\uac00-\ud7a3]/ : /[\u4e00-\u9fff]/;
  const share = chars.filter((c) => re.test(c)).length / chars.length;
  if (share < (lang === 'ko' ? 0.3 : 0.4)) return false;            // 英文等其他语言的标题
  if (/[\u3040-\u30ff]/.test(title)) return false;                  // 日文
  return true;
}

// 聚合头条里同一家媒体的不同写法，统一成一个名字
const ALIAS = { 'UDN': '联合新闻网', '聯合新聞網': '联合新闻网', '自由時報': '自由时报', '自由時報電子報': '自由时报', '中央社 CNA': '中央社', '中央通訊社': '中央社', '明報新聞網': '明报', '聯合早報': '联合早报', '香港電台': '香港电台', 'ThePaper.cn': '澎湃新闻', '한겨레': '한겨레 韩民族日报', '중앙일보': '중앙일보 中央日报', '한국일보': '한국일보 韩国日报', '국민일보': '국민일보 国民日报', '조선일보': '조선일보 朝鲜日报', '동아일보': '동아일보 东亚日报', '경향신문': '경향신문 京乡新闻', '연합뉴스': '연합뉴스 韩联社', '매일경제': '매일경제 每日经济', '한국경제': '한국경제 韩国经济', 'JTBC': 'JTBC 뉴스', '서울신문': '서울신문 首尔新闻', '세계일보': '세계일보 世界日报' };

export function parseFeed(xml, feed, now = Date.now()) {
  const blocks = xml.match(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi) || [];
  const out = [];
  const why = { found: blocks.length, noDate: 0, old: 0, junk: 0 };
  for (const b of blocks.slice(0, MAX_PER_FEED)) {
    let title = clean(tag(b, ['title']));
    if (!title) continue;
    let link = clean(tag(b, ['link']));
    if (!link) {
      const lm = b.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (lm) link = decodeEntities(lm[1]);
    }
    if (!link) link = clean(tag(b, ['guid', 'id']));
    const ts = parseDate(tag(b, ['pubDate', 'dc:date', 'published', 'updated', 'date']), feed.tz);
    if (!Number.isFinite(ts)) { why.noDate++; continue; }            // 没有发布时间的条目无法按时间排序，丢弃
    if (ts > now + 10 * 60000) continue;           // 时间在未来，源数据有误
    if (now - ts > MAX_AGE_HOURS * 3600000) { why.old++; continue; }
    let src = feed.name, via = null;
    if (feed.agg) {
      const s = clean(tag(b, ['source']));
      if (s) {
        if (feed.fixed) { src = feed.name; via = 'Google新闻'; } else { src = ALIAS[s] || s; via = feed.name; }
        const suffix = ' - ' + s;
        if (title.endsWith(suffix)) title = title.slice(0, -suffix.length).trim();
      }
    }
    const rawTitle = title;
    title = title.replace(/\s+-\s+\d{8}\s+-\s+.*$/, '').trim();   // 明报：标题 - 20261115 - 栏目 - 每日明报
    // “标题 | 國際焦點 | 世界新聞網”“标题 - 国内”这类栏目名、站名尾巴，逐段去掉
    if (feed.agg) for (let k = 0; k < 3; k++) {
      const cut = title.replace(/\s*[|｜]\s*[^|｜]{1,8}$/, '').replace(/\s+-\s+[^\s-]{1,8}$/, '').trim();
      if (cut === title || [...cut].length < 8) break;
      title = cut;
    }
    if (JUNK.test(rawTitle) || !keep(title, feed.lang)) { why.junk++; continue; }
    let desc = feed.agg ? '' : clean(tag(b, ['description', 'summary', 'content:encoded'])).slice(0, 160);
    if (desc === title) desc = '';
    out.push({ title, link, ts, src, via, lang: feed.lang, region: feed.region, feed: feed.id, desc });
  }
  // 所有条目的时间完全一样，说明这个源给的不是真实发布时间
  if (out.length >= 5 && out.every((i) => i.ts === out[0].ts)) { why.sameTime = true; out.length = 0; }
  out.why = why;
  return out;
}

async function loadFeed(feed, now) {
  const started = Date.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feed.url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HeadlineRadar/1.0; +rss-reader)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = await res.arrayBuffer();
    let charset = (res.headers.get('content-type') || '').match(/charset=([\w-]+)/i)?.[1];
    if (!charset) {
      const head = new TextDecoder('utf-8').decode(buf.slice(0, 200));
      charset = head.match(/encoding=["']([\w-]+)["']/i)?.[1];
    }
    let xml;
    try { xml = new TextDecoder((charset || 'utf-8').toLowerCase()).decode(buf); }
    catch { xml = new TextDecoder('utf-8').decode(buf); }
    const items = parseFeed(xml, feed, now);
    const w = items.why;
    const note = items.length ? null : !w.found ? '返回内容里没有新闻条目' : w.sameTime ? '发布时间无效（全部相同）' : w.noDate ? '条目没有发布时间' : w.old ? '条目都超过72小时' : w.junk ? '条目都被过滤（非头条或语言不符）' : '条目为空';
    return { meta: status(feed, true, items, Date.now() - started, note), items };
  } catch (e) {
    const msg = e?.name === 'AbortError' ? '超时' : String(e?.message || e).slice(0, 80);
    return { meta: status(feed, false, [], Date.now() - started, msg), items: [] };
  } finally {
    clearTimeout(timer);
  }
}
function status(feed, ok, items, ms, error) {
  const newest = items.reduce((a, i) => Math.max(a, i.ts), 0) || null;
  return { id: feed.id, name: feed.name, lang: feed.lang, region: feed.region, agg: !!feed.agg, ok, count: items.length, ms, newest, error: error || null };
}

export async function collect(now = Date.now()) {
  const results = await Promise.all(FEEDS.map((f) => loadFeed(f, now)));
  const seen = new Set();
  const items = [];
  for (const r of results) {
    for (const it of r.items) {
      const key = it.lang + '|' + it.title.replace(/[\s\p{P}]/gu, '').toLowerCase();
      if (seen.has(key) || seen.has(it.link)) continue;
      seen.add(key); seen.add(it.link);
      items.push(it);
    }
  }
  items.sort((a, b) => b.ts - a.ts);
  return { generatedAt: now, cacheSeconds: CACHE_SECONDS, sources: results.map((r) => r.meta), items };
}

export async function onRequestGet(context) {
  const cache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const cacheKey = new Request(new URL('/api/news', context.request.url).toString());
  const force = new URL(context.request.url).searchParams.has('fresh');
  if (cache && !force) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }
  const data = await collect();
  const res = new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=60, s-maxage=${CACHE_SECONDS}`,
      'access-control-allow-origin': '*',
    },
  });
  if (cache && data.items.length) context.waitUntil?.(cache.put(cacheKey, res.clone()));
  return res;
}

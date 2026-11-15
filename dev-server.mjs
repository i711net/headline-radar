// 本机预览： node dev-server.mjs   然后打开 http://localhost:8788
// （需要 Node 18 以上。MOCK=1 时用模拟数据，不联网。）
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { onRequestGet } from './functions/api/news.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = process.env.PORT || 8788;

function mock() {
  const now = Date.now(), items = [];
  const zhSrc = [['中国新闻网', '中国大陆'], ['联合早报', '新加坡'], ['BBC中文', '国际'], ['中央社', '台湾'], ['明报', '香港'], ['FT中文网', '国际'], ['自由時報', '台湾'], ['香港电台', '香港']];
  const koSrc = [['연합뉴스', '韩国'], ['조선일보', '韩国'], ['한겨레', '韩国'], ['매일경제', '韩国'], ['SBS 뉴스', '韩国'], ['동아일보', '韩国']];
  const zh = ['中美经贸磋商在吉隆坡举行 双方就关税问题达成初步共识', '美國總統特朗普稱將對半導體加徵關稅 台積電股價下跌', '央行宣布降息25个基点 A股三大指数集体上涨', '日本东北部发生6.8级地震 暂无人员伤亡报告', '俄罗斯对乌克兰发动大规模空袭 基辅多处爆炸',
    '人工智能芯片需求旺盛 英伟达市值再创新高', '韩国总统访问北京 中韩签署多项合作协议', '台风逼近华南沿海 多地发布红色预警', '国足世预赛主场获胜 球迷庆祝', '联合国安理会就加沙停火决议举行投票', '人民币汇率突破7.0关口 创一年来新高', '特斯拉上海工厂扩大产能 新能源车出口增长',
    '中美经贸磋商达成共识 关税有望下调', '关税谈判取得进展 中美双方发表联合声明', '俄军空袭乌克兰首都基辅 造成多人伤亡', '朝鲜试射弹道导弹 韩美日发表联合谴责', '医院流感患者增多 专家提醒接种疫苗', '电影票房破十亿 导演回应争议'];
  const ko = ['트럼프 "반도체 관세 부과" 발언에 삼성전자 주가 급락', '한중 정상회담 베이징서 개최…경제 협력 합의', '북한, 동해상으로 탄도미사일 발사…합참 "도발 규탄"', '코스피 사상 최고 돌파…외국인 순매수 확대', '한은, 기준금리 동결…환율 안정 주시', '[속보] 일본 도호쿠 규모 6.8 지진 발생',
    '러시아, 우크라이나 키이우 대규모 공습', '국회, 내년도 예산안 본회의 통과', '손흥민 멀티골…대표팀 월드컵 예선 승리', '삼성전자, AI 반도체 신제품 공개', '북한 미사일 발사에 한미일 공동 규탄 성명', '트럼프 반도체 관세 예고…삼성전자 SK하이닉스 급락', '전기차 배터리 화재 사고…경찰 조사 착수', '독감 환자 급증…병원 백신 접종 권고'];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 420; k++) {
    const isZh = rnd() < 0.56, pool = isZh ? zh : ko, srcs = isZh ? zhSrc : koSrc, s = srcs[Math.floor(rnd() * srcs.length)];
    const age = Math.pow(rnd(), 1.3) * 50 * 3600000, hour = new Date(now - age).getHours();
    if (hour < 6 && rnd() < 0.7) continue;
    const base = pool[Math.floor(rnd() * pool.length)];
    items.push({ title: base + (rnd() < 0.5 ? '' : (isZh ? '（第' : ' (') + (k % 9 + 1) + (isZh ? '次更新）' : '보)')), link: 'https://example.com/' + k, ts: Math.round(now - age), src: s[0], via: null, lang: isZh ? 'zh' : 'ko', region: s[1], feed: 'mock', desc: '' });
  }
  items.sort((a, b) => b.ts - a.ts);
  const sources = [...zhSrc.map((s) => ({ n: s, l: 'zh' })), ...koSrc.map((s) => ({ n: s, l: 'ko' }))].map(({ n, l }, i) => ({ id: 'm' + i, name: n[0], lang: l, region: n[1], agg: false, ok: i !== 4, count: i === 4 ? 0 : 30, ms: 300 + i * 90, newest: now - i * 600000, error: i === 4 ? '超时' : null }));
  return { generatedAt: now, cacheSeconds: 300, sources, items };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  try {
    if (url.pathname === '/api/news') {
      if (process.env.MOCK) { res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify(mock())); }
      const r = await onRequestGet({ request: new Request(url) });
      res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(await r.text());
    }
    if (url.pathname === '/api/tr') {
      const t = url.searchParams.get('t');
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(t ? { zh: '（模拟译文）' + t.length + '字的韩文标题' } : { ai: false }));
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(await readFile(root + 'index.html'));
    }
    res.writeHead(404); res.end('not found');
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(port, () => console.log(`头条雷达已启动： http://localhost:${port}`));

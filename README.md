# 头条雷达

自动收集全球中文、韩文媒体当日头条，按发布时间排列，并计算发稿速度、热度、情绪、集中度等指标。

## 文件
- `index.html` 页面（时间线 + 全部分析，纯前端计算，不依赖任何外部库）
- `functions/api/news.js` 抓取接口：并行读取各媒体 RSS，合并成 `/api/news`，边缘缓存 5 分钟
- `dev-server.mjs` 本机预览用

## 部署到 Cloudflare Pages（和你其它项目一样走 GitHub）
1. 把整个文件夹推到一个 GitHub 仓库。
2. Cloudflare → Workers & Pages → 创建 → Pages → 连接这个仓库。
3. 构建命令留空，输出目录填 `/`。部署后 `functions/` 会自动变成 `/api/news` 接口。
   注意：必须走 Git 或 `npx wrangler pages deploy .`，网页里直接拖拽上传不会启用 functions。

## 本机预览
`node dev-server.mjs` 然后打开 http://localhost:8788 （Node 18+；`MOCK=1 node dev-server.mjs` 用模拟数据）

## 增删媒体
改 `functions/api/news.js` 顶部的 `FEEDS` 数组，每行一个源：`lang` 填 zh 或 ko，`tz` 是该源日期不带时区时的默认时差。
页面底部“新闻源状态”会显示每个源是否抓取成功。

## 韩国门户新闻导入（portal.html）
首页右上角“韩国门户导入”进入。把 Naver、Daum 国际版块的内容粘贴进来（Ctrl+A 全选复制），或上传 .txt / 另存的 .html 文件，
确认后加入列表，再导出 JSON、CSV 或“给 AI 核对”的文本。全部在浏览器里完成，数据存在本机浏览器（localStorage）。
门户改版导致解析不准时，改 portal.html 里“1. 可调整的解析规则”那一节：忽略词、栏目标记、时间格式、媒体名、HTML 选择器。

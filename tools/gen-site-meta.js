#!/usr/bin/env node
/**
 * CaoxuBlog 站点元信息生成器（可选工具，非站点运行必需）
 *
 * 用途：从 assets/data.js 与 assets/config.js 生成
 *   - sitemap.xml   站点地图（四模块 + 全部文章/教程/题库 URL）
 *   - robots.txt    爬虫协议（含 Sitemap 指向）
 *   - feed.xml      RSS 2.0（聚合博客文章）
 *
 * 用法：node tools/gen-site-meta.js
 * 何时需要重跑：新增/删除文章、教程、题库分类，或修改 config.js 里的 SITE_URL 之后。
 *
 * 说明：本站为 hash 路由（#/blog/xxx）的纯静态 SPA，sitemap 中的 URL 带 hash 片段。
 *       主流搜索引擎对 hash 路由的收录有限，若强依赖搜索收录，建议后续改为路径路由。
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// data.js / config.js 都把配置挂在 window 上，这里模拟浏览器全局对象后加载
global.window = {};
require(path.join(ROOT, "assets", "config.js"));
require(path.join(ROOT, "assets", "data.js"));

const W = global.window;
const D = W.SITE_DATA || {};
const SITE_URL = (W.SITE_URL || "").replace(/\/+$/, "");
const SITE_NAME = W.SITE_NAME || "CaoxuBlog";
const SITE_DESC = W.SITE_DESC || "";
const SITE_AUTHOR = W.SITE_AUTHOR || "Caoxu";

if (!SITE_URL) {
  console.error("错误：请先在 assets/config.js 中设置 window.SITE_URL");
  process.exit(1);
}

// ---------- 收集全部 URL ----------
const urls = [];
const push = (loc, title) => urls.push({ loc, title });

push(SITE_URL + "/#/blog", "博客");
(D.blog || []).forEach((p) => push(`${SITE_URL}/#/blog/${p.id}`, p.title));

(D.tutorials || []).forEach((t) => {
  push(`${SITE_URL}/#/tutorial/${t.id}`, t.title);
  (function walk(nodes) {
    (nodes || []).forEach((n) => {
      if (n.content) push(`${SITE_URL}/#/tutorial/${t.id}/${n.id}`, n.title);
      if (n.children) walk(n.children);
    });
  })(t.tree);
});

(D.bank || []).forEach((c) => push(`${SITE_URL}/#/bank/${c.id}`, c.title));
push(SITE_URL + "/#/about", "关于我");
push(SITE_URL + "/#/archive", "归档");

// ---------- 工具 ----------
function escXml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  }[c]));
}
function rfc822(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toUTCString();
}

// ---------- sitemap.xml ----------
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${escXml(u.loc)}</loc>
  </url>`).join("\n")}
</urlset>
`;

// ---------- robots.txt ----------
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

// ---------- feed.xml（RSS 2.0，聚合博客文章）----------
const posts = (D.blog || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
const items = posts.map((p) => `    <item>
      <title>${escXml(p.title)}</title>
      <link>${escXml(`${SITE_URL}/#/blog/${p.id}`)}</link>
      <guid isPermaLink="false">${escXml(p.id)}</guid>
      <pubDate>${escXml(rfc822(p.date))}</pubDate>
      <description>${escXml(p.excerpt || "")}</description>
    </item>`).join("\n");

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(SITE_NAME)}</title>
    <link>${escXml(SITE_URL)}</link>
    <description>${escXml(SITE_DESC)}</description>
    <language>zh-CN</language>
    <managingEditor>${escXml(SITE_AUTHOR)}</managingEditor>
    <atom:link href="${escXml(SITE_URL)}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

// ---------- 写文件 ----------
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots, "utf8");
fs.writeFileSync(path.join(ROOT, "feed.xml"), feed, "utf8");

console.log(`已生成（站点地址：${SITE_URL}）`);
console.log(`  sitemap.xml  ${urls.length} 条 URL`);
console.log(`  robots.txt   Sitemap -> ${SITE_URL}/sitemap.xml`);
console.log(`  feed.xml     ${posts.length} 篇博客文章`);

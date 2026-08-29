// CaoxuBlog 前端路由与渲染（纯静态，无构建依赖）
(function () {
  const D = window.SITE_DATA || {};
  const app = document.getElementById("app");
  const navLinks = Array.from(document.querySelectorAll(".top-nav a"));

  // ---------- 主题 ----------
  (function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      document.documentElement.setAttribute("data-theme", "dark");
    applyHljsTheme();
  })();
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    applyHljsTheme();
  });

  // 根据明暗主题切换 highlight.js 配色（本地化，不依赖 CDN）
  function applyHljsTheme() {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const url = dark
      ? "assets/vendor/highlight-github-dark.min.css"
      : "assets/vendor/highlight-github.min.css";
    let link = document.getElementById("hljs-theme");
    if (!link) {
      link = document.createElement("link");
      link.id = "hljs-theme";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== url) link.setAttribute("href", url);
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- 工具 ----------
  function esc(s) { return (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
  // Markdown 渲染：内容以 Markdown 编写，由内置零依赖解析器 window.parseMarkdown 处理（见 assets/markdown.js）
  function md(src) {
    try { return window.parseMarkdown(src || ""); } catch (e) { return src || ""; }
  }
  // 阅读量计数：同一标签页会话内只 +1 一次，刷新不重复计数（跨会话仍累计，部署后端后可全局同步）
  function recordView(key) {
    let viewed = [];
    try { viewed = JSON.parse(sessionStorage.getItem("viewed") || "[]"); } catch (e) { viewed = []; }
    const vk = "views:" + key;
    if (viewed.indexOf(key) === -1) {
      const n = (parseInt(localStorage.getItem(vk) || "0", 10) || 0) + 1;
      localStorage.setItem(vk, String(n));
      viewed.push(key);
      try { sessionStorage.setItem("viewed", JSON.stringify(viewed)); } catch (e) {}
      return n;
    }
    return parseInt(localStorage.getItem(vk) || "0", 10) || 0;
  }
  function setActive(route) {
    navLinks.forEach((a) => a.classList.toggle("active", a.dataset.route === route));
  }

  // ---------- 点赞（浏览器本地演示，真实跨用户计数需接 CloudBase） ----------
  function likeBlock(key) {
    const liked = localStorage.getItem("like:" + key) === "1";
    return `<div class="like-row">
      <button class="like-btn ${liked ? "liked" : ""}" data-like="${key}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="${liked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3zM7 22H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3"></path>
        </svg>
        <span class="like-count">${liked ? 1 : 0}</span> 赞
      </button>
      <span class="meta">觉得有用就点个赞（本地演示，部署后端后多端同步）</span>
    </div>`;
  }
  function bindLikes() {
    app.querySelectorAll("[data-like]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.like;
        const on = localStorage.getItem("like:" + key) === "1";
        localStorage.setItem("like:" + key, on ? "0" : "1");
        btn.classList.toggle("liked", !on);
        btn.querySelector(".like-count").textContent = on ? 0 : 1;
        btn.querySelector("svg").setAttribute("fill", on ? "none" : "currentColor");
        // 同步标题下方的点赞数量
        const wrap = btn.closest(".tutorial-content") || btn.closest(".article");
        if (wrap) {
          const ml = wrap.querySelector(".meta-like");
          if (ml) ml.textContent = "点赞：" + (on ? 0 : 1);
        }
      });
    });
  }

  // ---------- Waline 评论挂载 ----------
  function ensureWaline(cb) {
    if (window.Waline) return cb();
    window.addEventListener("load", cb, { once: true });
  }
  function mountWaline(key) {
    const wrap = document.getElementById("waline");
    if (!wrap) return;
    if (window.WALINE_SERVER) {
      ensureWaline(() => {
        window.Waline.init({ el: wrap, serverURL: window.WALINE_SERVER, path: key, locale: window.WALINE_LOCALE });
      });
    } else {
      wrap.innerHTML =
        '<div class="waline-tip">评论区待启用：部署 Waline 到腾讯云 CloudBase 后，在 ' +
        "<code>assets/config.js</code> 填写 <code>WALINE_SERVER</code> 即可显示评论。</div>";
    }
  }

  // ---------- 博客 ----------
  // 置顶仅由作者在 data.js 通过 pinned 字段控制（全局仅 1 篇），访客不可切换
  function renderBlogList(activeTag) {
    setActive("blog");
    const posts = D.blog || [];
    const tags = Array.from(new Set(posts.flatMap((p) => p.tags || []))).sort();
    const pinnedIdx = posts.findIndex((p) => p.pinned);
    const ordered = pinnedIdx >= 0
      ? [posts[pinnedIdx], ...posts.filter((_, i) => i !== pinnedIdx)]
      : posts.slice();
    // 筛选：指定标签时按标签过滤（保留置顶标记），否则用置顶优先顺序
    const shown = activeTag ? posts.filter((p) => (p.tags || []).indexOf(activeTag) !== -1) : ordered;
    const cardHtml = (p) => `
      <a class="card card-link${p.pinned ? " card-pinned" : ""}" href="#/blog/${p.id}">
        <div class="meta">${p.date} · ${p.pinned ? '<span class="tag tag-pinned">置顶</span>' : ""}${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <h2 style="margin:8px 0 0">${esc(p.title)}</h2>
        <p class="excerpt">${esc(p.excerpt)}</p>
      </a>`;
    const cards = shown.map((p) => cardHtml(p)).join("");
    const tagBar = `<div class="tag-bar">` +
      `<a class="tag-chip${!activeTag ? " active" : ""}" href="#/blog">全部</a>` +
      tags.map((t) => `<a class="tag-chip${activeTag === t ? " active" : ""}" href="#/tag/${encodeURIComponent(t)}">${esc(t)}</a>`).join("") +
      `</div>`;
    const sub = activeTag
      ? `标签「${esc(activeTag)}」下的文章（${shown.length}） · <a href="#/blog">清除筛选</a>`
      : `测试理念与实战随笔 · <a href="#/archive">归档</a>`;
    app.innerHTML = `<h1 class="page-title">博客</h1><p class="page-sub">${sub}</p>${tagBar}
      <div class="grid grid-1">${cards}</div>`;
  }

  // 根据正文 h2/h3 生成目录（TOC），点击平滑滚动到对应标题
  function buildToc(bodyClass, tocId) {
    const body = app.querySelector("." + bodyClass);
    const toc = document.getElementById(tocId);
    if (!body || !toc) return;
    const heads = Array.from(body.querySelectorAll("h2, h3"));
    if (!heads.length) { toc.style.display = "none"; return; }
    const items = heads.map((h, i) => {
      const hid = "toc-h-" + i;
      h.id = hid;
      const cls = h.tagName === "H3" ? "toc-link-lv3" : "toc-link-lv2";
      return `<a class="${cls}" href="#" data-toc="${hid}">${esc(h.textContent)}</a>`;
    }).join("");
    toc.innerHTML = `<div class="toc-title">目录</div>${items}`;
    toc.querySelectorAll("[data-toc]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const el = document.getElementById(a.dataset.toc);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
  function renderBlogDetail(id) {
    setActive("blog");
    const posts = D.blog || [];
    const pinnedIdx = posts.findIndex((p) => p.pinned);
    const ordered = pinnedIdx >= 0
      ? [posts[pinnedIdx], ...posts.filter((_, i) => i !== pinnedIdx)]
      : posts.slice();
    const idx = ordered.findIndex((p) => p.id === id);
    const p = ordered[idx];
    if (!p) return renderNotFound("未找到该文章", "文章可能已被移动，或链接有误。", "#/blog", "返回博客");

    const views = recordView(id);
    const prev = idx > 0 ? ordered[idx - 1] : null;
    const next = idx < ordered.length - 1 ? ordered[idx + 1] : null;

    const pager = (prev || next) ? `
      <div class="post-pager">
        ${prev ? `<a class="pager-btn" href="#/blog/${prev.id}">← ${esc(prev.title)}</a>` : `<span></span>`}
        ${next ? `<a class="pager-btn pager-next" href="#/blog/${next.id}">${esc(next.title)} →</a>` : `<span></span>`}
      </div>` : "";

    app.innerHTML = `<div class="post-layout">
      <article class="article prose">
        <a class="back-link" href="#/blog">← 返回博客</a>
        <h1>${esc(p.title)}</h1>
        <div class="post-meta">
          <span>创建：${esc(p.date)}</span>
          ${p.updated ? `<span>更新：${esc(p.updated)}</span>` : ""}
          <span>阅读：${views}</span>
          ${(p.tags || []).map((t) => `<a class="tag" href="#/tag/${encodeURIComponent(t)}">${esc(t)}</a>`).join("")}
        </div>
        <div class="post-body">${md(p.content)}</div>
        ${likeBlock("/blog/" + id)}
        ${pager}
        <div id="waline" class="waline-wrap"></div>
      </article>
      <aside class="post-toc"><nav class="toc-nav" id="toc-nav" aria-label="文章目录"></nav></aside>
    </div>`;
    bindLikes();
    mountWaline("/blog/" + id);
    buildToc("post-body", "toc-nav");
  }

  // ---------- 教程 ----------
  function collectLeaves(t) {
    const out = [];
    (function walk(nodes, trail) {
      (nodes || []).forEach((n) => {
        const tr = trail.concat(n.title);
        if (n.content) out.push({ id: n.id, title: n.title, trail: tr, content: n.content });
        if (n.children) walk(n.children, tr);
      });
    })(t.tree, []);
    return out;
  }
  function tocHtml(nodes, tid) {
    return `<ul class="toc-tree">${nodes.map((n) => {
      if (n.children && n.children.length)
        return `<li><span class="toc-link toc-parent">${esc(n.title)}</span>${tocHtml(n.children, tid)}</li>`;
      return `<li><a class="toc-link" href="#/tutorial/${tid}/${n.id}">${esc(n.title)}</a></li>`;
    }).join("")}</ul>`;
  }
  let curTut = null;
  function buildTutContent(t, leaf, prevLeaf, nextLeaf) {
    const breadcrumb = leaf.trail.map(esc).join(" / ");
    // 阅读量（会话内去重，部署后端后多端同步）
    const views = recordView(t.id + "/" + leaf.id);
    // 点赞数量（与下方点赞按钮共用 localStorage）
    const likeKey = "/tutorial/" + t.id + "/" + leaf.id;
    const likes = localStorage.getItem("like:" + likeKey) === "1" ? 1 : 0;
    const pager = (prevLeaf || nextLeaf) ? `
      <div class="post-pager">
        ${prevLeaf ? `<a class="pager-btn" href="#/tutorial/${t.id}/${prevLeaf.id}">← ${esc(prevLeaf.title)}</a>` : `<span></span>`}
        ${nextLeaf ? `<a class="pager-btn pager-next" href="#/tutorial/${t.id}/${nextLeaf.id}">${esc(nextLeaf.title)} →</a>` : `<span></span>`}
      </div>` : "";
    return `<a class="back-link" href="#/tutorial">← 教程目录</a>
      <div class="meta">${breadcrumb}</div>
      <h1 style="margin-top:6px">${esc(leaf.title)}</h1>
      <div class="post-meta">
        <span>创建：${esc(t.date || "—")}</span>
        ${t.updated ? `<span>更新：${esc(t.updated)}</span>` : ""}
        <span>阅读：${views}</span>
        <span class="meta-like">点赞：${likes}</span>
      </div>
      <nav class="toc-nav" id="toc-nav" aria-label="本页目录"></nav>
      <div class="prose post-body">${md(leaf.content)}</div>
      ${likeBlock(likeKey)}
      ${pager}
      <div id="waline" class="waline-wrap"></div>`;
  }
  function renderTutorial(tid, lid) {
    setActive("tutorial");
    const t = (D.tutorials || []).find((x) => x.id === tid) || (D.tutorials || [])[0];
    if (!t) { app.innerHTML = "<p>暂无教程。</p>"; return; }
    const leaves = collectLeaves(t);
    const idx = Math.max(0, leaves.findIndex((l) => l.id === lid));
    const leaf = leaves[idx];
    const prevLeaf = idx > 0 ? leaves[idx - 1] : null;
    const nextLeaf = idx < leaves.length - 1 ? leaves[idx + 1] : null;
    const layout = app.querySelector(".tutorial-layout");
    if (curTut === t.id && layout) {
      // 同一教程内切换条目：只更新右侧内容，保留左侧目录的折叠状态
      const content = layout.querySelector(".tutorial-content");
      content.innerHTML = buildTutContent(t, leaf, prevLeaf, nextLeaf);
      bindLikes();
      mountWaline("/tutorial/" + t.id + "/" + leaf.id);
      buildToc("post-body", "toc-nav");
      app.querySelectorAll(".toc-link").forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === `#/tutorial/${t.id}/${leaf.id}`);
      });
      return;
    }
    curTut = t.id;
    const side = `<aside class="tutorial-side"><h3>${esc(t.title)}</h3>${tocHtml(t.tree, t.id)}</aside>`;
    const content = `<div class="tutorial-content">${buildTutContent(t, leaf, prevLeaf, nextLeaf)}</div>`;
    app.innerHTML = `<div class="tutorial-layout">${side}${content}</div>`;
    bindLikes();
    mountWaline("/tutorial/" + t.id + "/" + leaf.id);
    buildToc("post-body", "toc-nav");
    // 折叠/展开与高亮
    app.querySelectorAll(".toc-parent").forEach((sp) => {
      sp.addEventListener("click", () => {
        const ul = sp.parentElement.querySelector("ul");
        if (ul) ul.classList.toggle("collapsed");
      });
    });
    app.querySelectorAll(".toc-link").forEach((a) => {
      if (a.getAttribute("href") === `#/tutorial/${t.id}/${leaf.id}`) a.classList.add("active");
    });
  }

  // ---------- 题库（教程式结构：左侧一级目录 + 右侧题目，答案默认折叠）----------
  function buildBankContent(c) {
    const items = c.questions.map((q) => `
      <div class="q-item" id="q-${q.id}">
        <button class="q-head" data-q="${q.id}">
          <span>${esc(q.title)}</span>
          <svg class="q-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>
        </button>
        <div class="q-answer prose">${md(q.answer)}</div>
        ${likeBlock("/bank/" + c.id + "/" + q.id)}
      </div>`).join("");
    return `<a class="back-link" href="#/bank">← 题库目录</a>
      <h1 class="page-title" style="margin-top:6px">${esc(c.title)}</h1>
      <div class="post-meta">
        <span>阅读：${recordView("bank/" + c.id)}</span>
        <span>共 ${c.questions.length} 题</span>
      </div>
      <p class="page-sub">点击题目展开/收起答案</p>${items}
      <div id="waline" class="waline-wrap"></div>`;
  }
  function bindBankToggles() {
    app.querySelectorAll("[data-q]").forEach((btn) => {
      btn.addEventListener("click", () => btn.parentElement.classList.toggle("open"));
    });
  }
  function openAndScroll(qid) {
    const el = document.getElementById("q-" + qid);
    if (el) { el.classList.add("open"); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  let curBank = null;
  function renderBank(catId, qid) {
    setActive("bank");
    const c = (D.bank || []).find((x) => x.id === catId) || (D.bank || [])[0];
    if (!c) { app.innerHTML = "<p>暂无题库。</p>"; return; }
    const layout = app.querySelector(".tutorial-layout");
    if (curBank === c.id && layout) {
      // 同一题库分类内：只更新右侧内容，保留左侧高亮与题目折叠状态
      const content = layout.querySelector(".tutorial-content");
      content.innerHTML = buildBankContent(c);
      bindLikes();
      mountWaline("/bank/" + c.id);
      app.querySelectorAll(".toc-link").forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === `#/bank/${c.id}`);
      });
      bindBankToggles();
      if (qid) openAndScroll(qid);
      return;
    }
    curBank = c.id;
    const catLinks = (D.bank || []).map((x) =>
      `<li><a class="toc-link" href="#/bank/${x.id}">${esc(x.title)}</a></li>`
    ).join("");
    const side = `<aside class="tutorial-side"><h3>题库</h3><ul class="toc-tree">${catLinks}</ul></aside>`;
    const content = `<div class="tutorial-content">${buildBankContent(c)}</div>`;
    app.innerHTML = `<div class="tutorial-layout">${side}${content}</div>`;
    bindLikes();
    mountWaline("/bank/" + c.id);
    app.querySelectorAll(".toc-link").forEach((a) => {
      if (a.getAttribute("href") === `#/bank/${c.id}`) a.classList.add("active");
    });
    bindBankToggles();
    if (qid) openAndScroll(qid);
  }

  // ---------- 关于我 ----------
  function renderAbout() {
    setActive("about");
    const a = D.about || {};
    app.innerHTML = `<div class="about-card card"><h1 class="page-title">${esc(a.title || "关于我")}</h1>
      <div class="post-meta"><span>阅读：${recordView("about")}</span></div>
      <div class="prose">${md(a.content || "")}</div>
      ${likeBlock("/about")}
      <div id="waline" class="waline-wrap"></div>`;
    bindLikes();
    mountWaline("/about");
  }

  // ---------- 兜底页：深链无效 / 路由不存在 ----------
  function renderNotFound(title, msg, linkHref, linkText) {
    setActive("");
    app.innerHTML = `<div class="empty-state">
      <h1 class="page-title">${esc(title)}</h1>
      <p class="page-sub">${esc(msg)}</p>
      <a class="pager-btn" style="max-width:240px;text-align:center" href="${linkHref}">${esc(linkText)}</a>
    </div>`;
  }

  // ---------- 归档：按年月分组 ----------
  function renderArchive() {
    setActive("blog");
    const posts = D.blog || [];
    const groups = {};
    posts.forEach((p) => {
      const ym = (p.date || "").slice(0, 7);
      if (!ym) return;
      (groups[ym] = groups[ym] || []).push(p);
    });
    const months = Object.keys(groups).sort().reverse();
    const body = months.map((ym) => `
      <div class="archive-group">
        <h2 class="archive-month">${esc(ym)}</h2>
        <ul class="archive-list">
          ${groups[ym].map((p) => `<li><span class="archive-date">${esc(p.date)}</span><a href="#/blog/${p.id}">${esc(p.title)}</a></li>`).join("")}
        </ul>
      </div>`).join("");
    app.innerHTML = `<h1 class="page-title">归档</h1>
      <p class="page-sub">共 ${posts.length} 篇 · <a href="#/blog">返回博客</a></p>
      ${body || '<p class="page-sub">暂无文章。</p>'}`;
  }

  // ---------- 代码块增强：语法高亮 + 行号 + 语言标签 + 复制 ----------
  const LANG_LABELS = {
    js: "JavaScript", javascript: "JavaScript", ts: "TypeScript", typescript: "TypeScript",
    py: "Python", python: "Python", bash: "Bash", sh: "Shell", shell: "Shell", zsh: "Shell",
    json: "JSON", yaml: "YAML", yml: "YAML", html: "HTML", xml: "XML", css: "CSS",
    sql: "SQL", java: "Java", c: "C", cpp: "C++", "c++": "C++", go: "Go", golang: "Go",
    md: "Markdown", markdown: "Markdown", text: "TEXT", plaintext: "TEXT", txt: "TEXT",
    dockerfile: "Dockerfile", makefile: "Makefile",
  };
  function fallbackCopy(t) {
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(t).catch(() => fallbackCopy(t));
    }
    fallbackCopy(t);
    return Promise.resolve();
  }
  function enhanceCodeBlocks(root) {
    root.querySelectorAll("pre > code").forEach((code) => {
      const pre = code.parentElement;
      if (pre.dataset.enhanced) return;
      pre.dataset.enhanced = "1";

      // 语法高亮（highlight.js，缺失时自动降级为纯文本）
      let lang = "";
      const m0 = (code.className || "").match(/language-([\w+#-]+)/);
      if (m0) lang = m0[1].toLowerCase();
      if (window.hljs) {
        try { window.hljs.highlightElement(code); } catch (e) {}
        const m1 = (code.className || "").match(/language-([\w+#-]+)/);
        if (m1) lang = m1[1].toLowerCase();
      }

      const text = code.textContent || "";
      const lineCount = text.split("\n").length;

      const gutter = document.createElement("div");
      gutter.className = "code-gutter";
      let gh = "";
      for (let i = 1; i <= lineCount; i++) gh += "<span>" + i + "</span>";
      gutter.innerHTML = gh;

      const label = LANG_LABELS[lang] || (lang ? lang.toUpperCase() : "TEXT");

      const head = document.createElement("div");
      head.className = "code-head";
      const langEl = document.createElement("span");
      langEl.className = "code-lang";
      langEl.textContent = label;
      const copyBtn = document.createElement("button");
      copyBtn.className = "code-copy";
      copyBtn.type = "button";
      copyBtn.textContent = "复制";
      copyBtn.addEventListener("click", () => {
        copyText(text).then(() => {
          copyBtn.textContent = "已复制";
          copyBtn.classList.add("copied");
          setTimeout(() => { copyBtn.textContent = "复制"; copyBtn.classList.remove("copied"); }, 1500);
        });
      });
      head.appendChild(langEl);
      head.appendChild(copyBtn);

      const body = document.createElement("div");
      body.className = "code-body";
      pre.parentNode.insertBefore(body, pre);
      body.appendChild(gutter);
      body.appendChild(pre);

      const wrap = document.createElement("div");
      wrap.className = "code-block";
      body.parentNode.insertBefore(wrap, body);
      wrap.appendChild(head);
      wrap.appendChild(body);
      pre.classList.add("code-pre");
    });
  }

  // ---------- 路由 ----------
  function router() {
    const raw = location.hash.replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    const [a, b, c] = parts;
    if (!a || a === "blog") {
      if (b) renderBlogDetail(b);
      else renderBlogList();
    } else if (a === "tutorial") renderTutorial(b, c);
    else if (a === "bank") renderBank(b, c);
    else if (a === "about") renderAbout();
    else if (a === "tag") renderBlogList(b ? decodeURIComponent(b) : null);
    else if (a === "archive") renderArchive();
    else renderNotFound("页面不存在", "你访问的页面不存在，看看其他内容吧。", "#/blog", "返回博客");
    enhanceCodeBlocks(app);
  }

  // ---------- 返回顶部（滚动超过一屏后显示）----------
  (function initBackToTop() {
    const btn = document.createElement("button");
    btn.id = "back-to-top";
    btn.className = "back-to-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "返回顶部");
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"></path></svg>';
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(btn);
    window.addEventListener("scroll", () => {
      btn.classList.toggle("show", (window.scrollY || window.pageYOffset || 0) > 420);
    }, { passive: true });
  })();

  window.addEventListener("hashchange", router);
  if (!location.hash) location.replace("#/blog");
  router();
})();

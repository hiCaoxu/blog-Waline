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
  })();
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- 工具 ----------
  function esc(s) { return (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
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

  function detailShell(inner, key) {
    app.innerHTML = `<article class="article prose">${inner}</article>
      ${likeBlock(key)}
      <div id="waline" class="waline-wrap"></div>`;
    bindLikes();
    mountWaline(key);
  }

  // ---------- 博客 ----------
  function renderBlogList() {
    setActive("blog");
    const cards = (D.blog || []).map((p) => `
      <a class="card card-link" href="#/blog/${p.id}">
        <div class="meta">${p.date} · ${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <h2 style="margin:8px 0 0">${esc(p.title)}</h2>
        <p class="excerpt">${esc(p.excerpt)}</p>
      </a>`).join("");
    app.innerHTML = `<h1 class="page-title">博客</h1><p class="page-sub">测试理念与实战随笔</p>
      <div class="grid grid-1">${cards}</div>`;
  }

  function renderBlogDetail(id) {
    setActive("blog");
    const p = (D.blog || []).find((x) => x.id === id);
    if (!p) return renderBlogList();
    detailShell(
      `<a class="back-link" href="#/blog">← 返回博客</a>
       <h1>${esc(p.title)}</h1>
       <div class="meta">${p.date} · ${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
       ${p.content}`,
      "/blog/" + id
    );
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
  function buildTutContent(t, leaf) {
    const breadcrumb = leaf.trail.map(esc).join(" / ");
    return `<a class="back-link" href="#/tutorial">← 教程目录</a>
      <div class="meta">${breadcrumb}</div>
      <h1 style="margin-top:6px">${esc(leaf.title)}</h1>
      <div class="prose">${leaf.content}</div>
      ${likeBlock("/tutorial/" + t.id + "/" + leaf.id)}
      <div id="waline" class="waline-wrap"></div>`;
  }
  function renderTutorial(tid, lid) {
    setActive("tutorial");
    const t = (D.tutorials || []).find((x) => x.id === tid) || (D.tutorials || [])[0];
    if (!t) { app.innerHTML = "<p>暂无教程。</p>"; return; }
    const leaves = collectLeaves(t);
    const leaf = leaves.find((l) => l.id === lid) || leaves[0];
    const layout = app.querySelector(".tutorial-layout");
    if (curTut === t.id && layout) {
      // 同一教程内切换条目：只更新右侧内容，保留左侧目录的折叠状态
      const content = layout.querySelector(".tutorial-content");
      content.innerHTML = buildTutContent(t, leaf);
      bindLikes();
      mountWaline("/tutorial/" + t.id + "/" + leaf.id);
      app.querySelectorAll(".toc-link").forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === `#/tutorial/${t.id}/${leaf.id}`);
      });
      return;
    }
    curTut = t.id;
    const side = `<aside class="tutorial-side"><h3>${esc(t.title)}</h3>${tocHtml(t.tree, t.id)}</aside>`;
    const content = `<div class="tutorial-content">${buildTutContent(t, leaf)}</div>`;
    app.innerHTML = `<div class="tutorial-layout">${side}${content}</div>`;
    bindLikes();
    mountWaline("/tutorial/" + t.id + "/" + leaf.id);
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

  // ---------- 题库 ----------
  function renderBankHome() {
    setActive("bank");
    const cards = (D.bank || []).map((c) => `
      <a class="card card-link" href="#/bank/${c.id}">
        <h2 style="margin:0 0 6px">${esc(c.title)}</h2>
        <p class="excerpt">${c.questions.length} 道面试题 · 点击查看</p>
      </a>`).join("");
    app.innerHTML = `<h1 class="page-title">题库</h1><p class="page-sub">面试向题目与解析，答案默认折叠</p>
      <div class="grid grid-1">${cards}</div>`;
  }
  function renderBankCategory(cat, qid) {
    setActive("bank");
    const c = (D.bank || []).find((x) => x.id === cat);
    if (!c) return renderBankHome();
    const items = c.questions.map((q) => {
      const open = q.id === qid ? " open" : "";
      return `<div class="q-item${open}" id="q-${q.id}">
        <button class="q-head" data-q="${q.id}">
          <span>${esc(q.title)}</span>
          <svg class="q-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>
        </button>
        <div class="q-answer prose">${q.answer}</div>
        ${likeBlock("/bank/" + cat + "/" + q.id)}
      </div>`;
    }).join("");
    app.innerHTML = `<a class="back-link" href="#/bank">← 题库分类</a>
      <h1 class="page-title">${esc(c.title)}</h1>
      <p class="page-sub">点击题目展开/收起答案</p>${items}
      <div id="waline" class="waline-wrap"></div>`;
    bindLikes();
    mountWaline("/bank/" + cat);
    app.querySelectorAll("[data-q]").forEach((btn) => {
      btn.addEventListener("click", () => btn.parentElement.classList.toggle("open"));
    });
    if (qid) {
      const el = document.getElementById("q-" + qid);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---------- 关于我 ----------
  function renderAbout() {
    setActive("about");
    const a = D.about || {};
    app.innerHTML = `<div class="about-card card"><h1 class="page-title">${esc(a.title || "关于我")}</h1>
      <div class="prose">${a.content || ""}</div>
      ${likeBlock("/about")}
      <div id="waline" class="waline-wrap"></div>`;
    bindLikes();
    mountWaline("/about");
  }

  // ---------- 路由 ----------
  function router() {
    const raw = location.hash.replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    const [a, b, c] = parts;
    if (!a || a === "blog") {
      if (b) return renderBlogDetail(b);
      return renderBlogList();
    }
    if (a === "tutorial") return renderTutorial(b, c);
    if (a === "bank") {
      if (b) return renderBankCategory(b, c);
      return renderBankHome();
    }
    if (a === "about") return renderAbout();
    return renderBlogList();
  }

  window.addEventListener("hashchange", router);
  if (!location.hash) location.replace("#/blog");
  router();
})();

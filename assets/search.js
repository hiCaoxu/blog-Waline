// 客户端站内搜索：构建期数据 + 浏览器实时过滤，无需后端
(function () {
  const D = window.SITE_DATA || {};
  const index = [];

  function strip(src) {
    let html = src || "";
    if (window.marked && typeof window.marked.parse === "function") {
      try { html = window.marked.parse(html); } catch (e) {}
    }
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || "").replace(/\s+/g, " ").trim();
  }
  function snippet(text, n) { return text.length > n ? text.slice(0, n) + "…" : text; }

  // 博客
  (D.blog || []).forEach((p) => {
    index.push({ cat: "博客", title: p.title, excerpt: p.excerpt || strip(p.content), url: `#/blog/${p.id}` });
  });

  // 教程：递归收集三层树中的叶子（带 content 的节点）
  (D.tutorials || []).forEach((t) => {
    function walk(nodes) {
      (nodes || []).forEach((n) => {
        if (n.content) {
          index.push({ cat: "教程 · " + t.title, title: n.title, excerpt: snippet(strip(n.content), 80), url: `#/tutorial/${t.id}/${n.id}` });
        }
        if (n.children) walk(n.children);
      });
    }
    walk(t.tree);
  });

  // 题库
  (D.bank || []).forEach((c) => {
    (c.questions || []).forEach((q) => {
      index.push({ cat: "题库 · " + c.title, title: q.title, excerpt: snippet(strip(q.answer), 80), url: `#/bank/${c.id}/${q.id}` });
    });
  });

  // ---- UI ----
  const overlay = document.getElementById("search-overlay");
  const input = document.getElementById("search-input");
  const list = document.getElementById("search-results");
  const empty = document.getElementById("search-empty");
  const toggle = document.getElementById("search-toggle");
  const closeBtn = document.getElementById("search-close");

  function open() {
    overlay.classList.remove("hidden");
    input.value = "";
    render("");
    input.focus();
  }
  function close() {
    overlay.classList.add("hidden");
  }
  function render(q) {
    const key = q.trim().toLowerCase();
    list.innerHTML = "";
    if (!key) { empty.classList.add("hidden"); return; }
    const hits = index.filter((it) =>
      it.title.toLowerCase().includes(key) || it.excerpt.toLowerCase().includes(key) || it.cat.toLowerCase().includes(key)
    ).slice(0, 30);
    if (!hits.length) { empty.classList.remove("hidden"); return; }
    empty.classList.add("hidden");
    hits.forEach((it) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = it.url;
      a.innerHTML = `<div class="sr-cat">${it.cat}</div><div class="sr-title">${it.title}</div><div class="sr-excerpt">${it.excerpt}</div>`;
      a.addEventListener("click", close);
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  toggle && toggle.addEventListener("click", open);
  closeBtn && closeBtn.addEventListener("click", close);
  overlay && overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  input && input.addEventListener("input", (e) => render(e.target.value));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) close();
  });

  window.SearchAPI = { open, close, count: index.length };
})();

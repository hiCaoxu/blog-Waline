// CaoxuBlog 内置 Markdown 解析器（零依赖，不依赖任何 CDN）
// 暴露 window.parseMarkdown(src) 给 app.js（渲染）与 search.js（索引清洗）共用。
// 支持：代码围栏(``` 与 ~~~)、标题(#~######)、粗体/斜体、行内代码、有序/无序列表(含嵌套)、
//       引用(>)、分割线(---)、链接、图片、段落。HTML 转义后注入，规避 XSS。
(function () {
  "use strict";

  function esc(s) {
    return (s || "").replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  // 行内格式：先转义，再处理行内代码 → 粗体 → 斜体 → 链接 → 图片
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, function (_, c) { return "<code>" + c + "</code>"; });
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async" />');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  // 渲染一组连续列表行（支持按缩进嵌套）
  function renderList(lines) {
    function walk(arr, idx, indent, ordered) {
      var out = ordered ? "<ol>" : "<ul>";
      while (idx < arr.length && arr[idx].indent === indent && arr[idx].ordered === ordered) {
        var item = arr[idx];
        var content = inline(item.text);
        idx++;
        if (idx < arr.length && arr[idx].indent > indent) {
          var sub = walk(arr, idx, arr[idx].indent, arr[idx].ordered);
          content += sub.html;
          idx = sub.idx;
        }
        out += "<li>" + content + "</li>";
      }
      out += ordered ? "</ol>" : "</ul>";
      return { html: out, idx: idx };
    }
    var res = walk(lines, 0, lines[0].indent, lines[0].ordered);
    return res.html;
  }

  function parseMarkdown(src) {
    if (!src) return "";
    var lines = String(src).replace(/\r\n?/g, "\n").split("\n");
    var html = [];
    var i = 0;
    var n = lines.length;

    while (i < n) {
      var line = lines[i];

      // 跳过空行
      if (/^\s*$/.test(line)) { i++; continue; }

      // 代码围栏：``` 或 ~~~ 开头
      var fence = line.match(/^(\s*)(`{3,}|~{3,})\s*([\w+#.-]*)\s*$/);
      if (fence) {
        var fenceChar = fence[2].charAt(0);
        var lang = fence[3] || "";
        // 规范常见别名：text/txt → plaintext，避免 highlight.js 未知语言告警
        var langAlias = { text: "plaintext", txt: "plaintext" };
        if (langAlias[lang]) lang = langAlias[lang];
        var codeLines = [];
        i++;
        while (i < n) {
          var fl = lines[i];
          if (new RegExp("^\\s*" + (fenceChar === "`" ? "`{3,}" : "~{3,}") + "\\s*$").test(fl)) { i++; break; }
          codeLines.push(fl);
          i++;
        }
        var code = codeLines.join("\n");
        var cls = lang ? ' class="language-' + lang + '"' : "";
        html.push("<pre><code" + cls + ">" + esc(code) + "</code></pre>");
        continue;
      }

      // 标题
      var h = line.match(/^(\s*)(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (h) {
        var level = h[2].length;
        html.push("<h" + level + ">" + inline(h[3]) + "</h" + level + ">");
        i++;
        continue;
      }

      // 分割线
      if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
        html.push("<hr />");
        i++;
        continue;
      }

      // 引用块：连续以 > 开头的行
      if (/^\s*>/.test(line)) {
        var quoteLines = [];
        while (i < n && /^\s*>/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        html.push("<blockquote>" + parseMarkdown(quoteLines.join("\n")) + "</blockquote>");
        continue;
      }

      // 列表：无序(- * +) 或 有序(1.)
      var ulItem = line.match(/^(\s*)[-*+]\s+(.*)$/);
      var olItem = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (ulItem || olItem) {
        var listLines = [];
        while (i < n) {
          var u = lines[i].match(/^(\s*)[-*+]\s+(.*)$/);
          var o = lines[i].match(/^(\s*)\d+\.\s+(.*)$/);
          if (u) { listLines.push({ indent: u[1].length, ordered: false, text: u[2] }); i++; }
          else if (o) { listLines.push({ indent: o[1].length, ordered: true, text: o[2] }); i++; }
          else break;
        }
        html.push(renderList(listLines));
        continue;
      }

      // 段落：连续非空白、非块级起始的行合并为一个段落
      var para = [];
      while (i < n && !/^\s*$/.test(lines[i]) &&
             !/^(\s*)(`{3,}|~{3,})/.test(lines[i]) &&
             !/^(\s*)#{1,6}\s+/.test(lines[i]) &&
             !/^\s*([-*_])\s*(\1\s*){2,}$/.test(lines[i]) &&
             !/^\s*>/.test(lines[i]) &&
             !/^(\s*)[-*+]\s+/.test(lines[i]) &&
             !/^(\s*)\d+\.\s+/.test(lines[i])) {
        para.push(lines[i].trim());
        i++;
      }
      if (para.length) html.push("<p>" + inline(para.join(" ")) + "</p>");
    }

    return html.join("\n");
  }

  window.parseMarkdown = parseMarkdown;
})();

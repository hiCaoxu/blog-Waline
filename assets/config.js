// CaoxuBlog 运行时配置
// 部署 Waline 到腾讯云 CloudBase 后，将下方地址改为你的 Waline 服务端 URL 即可启用评论。
// 例如：window.WALINE_SERVER = "https://waline.your-domain.com";
window.WALINE_SERVER = "";
window.WALINE_LOCALE = { placeholder: "写下你的看法…（部署 Waline 后可见）" };

// 站点正式地址（用于 canonical / Open Graph / JSON-LD / sitemap / RSS 的绝对链接）
// 部署到自定义域名后请改为你的地址，例如 "https://blog.your-domain.com/"
// 修改后需重新执行 `node tools/gen-site-meta.js` 生成 sitemap.xml 与 feed.xml。
window.SITE_URL = "https://hicaoxu.github.io/blog-Waline/";
window.SITE_NAME = "CaoxuBlog";
window.SITE_DESC = "CaoxuBlog — 测试工程师的成长笔记：博客、教程、题库与关于我。";
window.SITE_AUTHOR = "Caoxu";

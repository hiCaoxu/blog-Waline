# CaoxuBlog

一个面向软件测试工程师的**纯静态**个人博客，零构建依赖，可直接托管到腾讯云 COS / GitHub Pages。

- 模块：**博客 · 教程 · 题库 · 关于我**
- 顶部左侧：`CaoxuBlog` + slogan `没有完美的代码，只有未发现的缺陷`
- 功能：客户端**搜索**、标签筛选、归档、**评论/点赞**（Waline + 腾讯云 CloudBase）、常规/暗色主题（记忆访客选择）
- 正文用 **Markdown** 编写（内置零依赖解析器），代码块支持语法高亮 / 行号 / 语言标签 / 一键复制
- 特效：淡绿色半透明光点跟随鼠标（节流、上限 100、支持触屏）
- **无外网依赖**：Markdown 解析与代码高亮均已本地化，断网可正常阅读

## 目录结构

```
.
├── index.html            # 站点外壳（header / 导航 / 内容容器 / 搜索浮层 / Waline 容器）
├── assets/
│   ├── style.css         # 样式与明暗主题（CSS 变量）
│   ├── data.js           # 全站内容数据（window.SITE_DATA）
│   ├── markdown.js       # 内置 Markdown 解析器（零依赖，替代 marked CDN）
│   ├── config.js         # 运行配置（Waline serverURL 占位）
│   ├── app.js            # hash 路由与各模块渲染、主题、点赞、路由兜底
│   ├── search.js         # 客户端搜索（构建索引 + 实时过滤）
│   ├── cursor.js         # 光标特效
│   └── vendor/           # 本地化第三方库（highlight.js 核心 + 明暗配色）
├── deploy/
│   └── deploy-cos.sh     # 部署到腾讯云 COS 的示例脚本
├── PROMPTS.md            # 分阶段大模型优化提示词（阻断修复/渲染依赖/功能补全/性能SEO部署）
└── package.json
```

## 本地预览

直接双击 `index.html` 即可（评论需联网加载 Waline CDN）。若浏览器对本地文件有限制，可用任意静态服务器：

```bash
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

## 内容维护

所有文章写在 `assets/data.js` 的 `window.SITE_DATA` 中，按 `blog / tutorials / bank / about` 四类组织：

- **博客**：`{ id, title, date, tags, excerpt, content }`
- **教程**：`tutorials[].tree` 为三层嵌套（章节 → 小节 → 条目，条目含 `content`）
- **题库**：`bank[].questions` 为 `{ id, title, answer }`

新增内容只需在对应数组里追加对象，搜索索引会自动包含。

## 启用评论 / 点赞（Waline）

1. 按官方文档将 [Waline](https://waline.js.org/) 部署到**腾讯云 CloudBase（云开发）**，获得服务端地址。
2. 编辑 `assets/config.js`，将 `window.WALINE_SERVER` 改为你的地址：

   ```js
   window.WALINE_SERVER = "https://waline.your-domain.com";
   ```

未配置时，详情页会显示提示，不影响其他功能。

## 提交到 GitHub

```bash
git init
git remote add origin git@github.com:hiCaoxu/blog-Waline.git
git add .
git commit -m "feat: 初始化 CaoxuBlog 静态站点"
git push -u origin main
```

## 部署到腾讯云

### 方案 A：COS 静态网站托管 + CDN

1. 在腾讯云创建 COS 存储桶，开启「静态网站托管」。
2. 将本仓库根目录（即静态站点）同步到存储桶：

   ```bash
   bash deploy/deploy-cos.sh
   ```

   脚本依赖 [coscli](https://cloud.tencent.com/document/product/436/71763)，使用前请先 `coscli config` 配置好存储桶与密钥。
3. 绑定已备案域名并接入 CDN，开启 HTTPS。
4. （可选）在 CI 中加入部署步骤，实现推送即发布。

### 方案 B：GitHub Pages / 其他静态托管

由于本站点为纯静态、无构建步骤，任何支持静态文件的托管都可直接使用，无需额外打包。

## 功能清单

| 能力 | 说明 |
|------|------|
| 四模块 | 博客（列表 / 置顶 / 详情 / 上下篇 / 标签筛选 / 归档）、教程（三层目录树 + 本页目录）、题库（一级分类 + 答案折叠）、关于我 |
| 搜索 | 客户端全站搜索（博客 / 教程 / 题库），输入即过滤 |
| 标签筛选 | 博客列表顶部标签栏可点击筛选，支持 `#/tag/标签名` 深链 |
| 归档 | `#/archive` 按年月分组展示全部文章 |
| 目录（TOC） | 博客详情为右侧 sticky 侧栏（窄屏自动堆叠到正文上方）；教程 / 题库为左侧目录树 |
| 返回顶部 | 滚动超过一屏后右下角出现，平滑回顶 |
| 阅读量 | 按文章 / 教程页 / 题库分类 / 关于我分别计数，**同一标签页会话内刷新不重复 +1** |
| 点赞 | 本地演示（localStorage），接入 Waline 后可跨端同步 |
| 评论 | Waline 占位，配置 `WALINE_SERVER` 后启用 |
| 主题 | 常规 / 暗色，记忆访客选择，代码高亮配色同步切换 |
| 路由兜底 | 无效文章 id、未知路由显示友好提示页，不白屏不报错 |

## 已知限制

- **点赞与阅读量为浏览器本地演示**：数据存在 `localStorage` / `sessionStorage`，不同设备与用户之间不互通；接入 Waline / CloudBase 后端后可全局同步。
- **评论区待接入后端**：未配置 `WALINE_SERVER` 时显示占位提示，需先部署 Waline 到腾讯云 CloudBase。
- **Waline 客户端仍走 CDN**：评论依赖后端服务，保留 jsdelivr 引入（未本地化）；Markdown 解析与代码高亮已本地化，离线阅读不受影响。
- **列表未分页**：博客 / 题库当前为单列全量展示，内容量大时可按需加分页或「加载更多」。

## 技术说明

- 纯静态、无框架、无构建步骤，最大程度上兼容「大模型可直接实现、WorkBuddy 可直接部署」。
- 搜索在前端完成，帖子量级下零后端、零成本。
- 评论/点赞经 Serverless 后端（Waline on CloudBase），博客本体仍保持纯静态，部署与扩容互不影响。

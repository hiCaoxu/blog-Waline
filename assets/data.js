// CaoxuBlog 站点内容数据
// 主题：软件测试工程师。所有内容在构建期静态写入，搜索索引由 search.js 读取。
window.SITE_DATA = {
  // ---------------- 博客 ----------------
  blog: [
    {
      id: "quality-not-bugs",
      pinned: true,
      title: "软件测试漫谈：从点点点到质量保障",
      date: "2026-08-20",
      updated: "2026-08-26",
      tags: ["测试理念", "质量保障"],
      excerpt: "测试不是挑刺，而是为质量提供一面镜子。聊聊从手工点到质量内建的认知升级。",
      content: `
        <p>很多刚入行的同学把测试等同于"按用例点点点"，但当项目规模上来后，你会发现问题不在手速，而在<strong>质量意识</strong>。</p>
        <h2>测试的价值在于信息</h2>
        <p>测试最核心的输出不是"通过/失败"，而是<strong>关于质量的可信信息</strong>：当前版本的风险分布、哪些模块最脆弱、发布是否安全。</p>
        <h2>质量内建优于事后把关</h2>
        <p>把质量检查挪到需求与编码阶段，比上线前集中测试成本低一个数量级。这正是测试左移的意义。</p>
        <pre><code class="language-plaintext">需求评审 → 用例设计 → 编码自测 → 持续集成 → 探索性测试</code></pre>
        <p>没有完美的代码，只有未发现的缺陷。我们能做的，是让缺陷尽可能早地被看见。</p>
      `
    },
    {
      id: "api-auto-start",
      title: "接口自动化测试入门：从 Postman 到代码",
      date: "2026-08-22",
      updated: "2026-08-27",
      tags: ["接口测试", "自动化"],
      excerpt: "用最少的概念打通接口自动化：请求、断言、数据驱动，以及何时该写代码而非用工具。",
      content: `
        <p>接口自动化是性价比最高的自动化切入点，稳定、快、易维护。</p>
        <h2>三步建立最小闭环</h2>
        <ol>
          <li><strong>发请求</strong>：明确方法、URL、头、体。</li>
          <li><strong>做断言</strong>：状态码、关键字段、业务状态。</li>
          <li><strong>管数据</strong>：用变量与数据文件驱动多场景。</li>
        </ol>
        <h2>一段最小可用的 Python 示例</h2>
        <pre><code class="language-python">import requests
r = requests.get("https://api.example.com/health")
assert r.status_code == 200
assert r.json()["status"] == "ok"</code></pre>
        <p>当用例超过二三十条、需要 CI 集成时，就该从 Postman 迁移到代码了。</p>
      `
    },
    {
      id: "shift-left",
      title: "测试左移：让缺陷死在摇篮里",
      date: "2026-08-25",
      updated: "2026-08-28",
      tags: ["测试左移", "流程"],
      excerpt: "越晚发现的缺陷，修复成本越高。左移不是多写测试，而是把质量活动前移。",
      content: `
        <p>经典数据：需求阶段引入的缺陷，若在需求阶段发现，修复成本接近 0；若到生产环境才发现，成本放大数十倍。</p>
        <h2>左移能做什么</h2>
        <ul>
          <li>参与需求评审，确认可测性与验收标准。</li>
          <li>推动单元测试与接口契约。</li>
          <li>在 CI 中固化质量门禁（lint、单测覆盖率、接口冒烟）。</li>
        </ul>
        <h2>别走极端</h2>
        <p>左移不是取消系统测试，而是让各阶段各司其职，把"惊喜"挡在门禁之前。</p>
      `
    }
  ],

  // ---------------- 教程（三层目录树） ----------------
  tutorials: [
    {
      id: "func",
      title: "功能测试实战",
      tree: [
        {
          id: "case", title: "用例设计", children: [
            {
              id: "blackbox", title: "黑盒方法", children: [
                { id: "eq", title: "等价类划分",
                  content: `<p>把输入域划分为若干<strong>等价类</strong>：有效等价类与无效等价类，每类取一个代表值即可覆盖。</p><p>例如年龄输入 1~120 为整数，有效类取 30，无效类可取 0、121、-1、abc。</p>` },
                { id: "boundary", title: "边界值分析",
                  content: `<p>缺陷常聚集在边界。对区间 [1,120]，重点测 0、1、2、119、120、121。</p><p>边界值通常与等价类配合使用，可覆盖绝大多数输入类缺陷。</p>` }
              ]
            },
            {
              id: "whitebox", title: "白盒方法", children: [
                { id: "statement", title: "语句覆盖",
                  content: `<p>最弱覆盖：让每条语句至少执行一次。能发现"死代码"，但无法暴露分支错误。</p>` },
                { id: "branch", title: "分支覆盖",
                  content: `<p>每个判定的真假分支都至少走一次，比语句覆盖更强，是大多数单测的目标基线。</p>` }
              ]
            }
          ]
        },
        {
          id: "defect", title: "缺陷管理", children: [
            {
              id: "submit", title: "提交规范", children: [
                { id: "title", title: "标题与复现",
                  content: `<p>好缺陷 = 清晰标题 + 版本环境 + 操作步骤 + 预期/实际 + 附件。缺少任一项都会拉长沟通闭环。</p>` },
                { id: "lifecycle", title: "生命周期",
                  content: `<p>新建 → 打开 → 修复 → 回归 → 关闭。被拒绝/延期也需记录原因，避免信息丢失。</p>` }
              ]
            },
            {
              id: "severity", title: "严重等级", children: [
                { id: "level", title: "等级划分",
                  content: `<p>通常分致命/严重/一般/轻微四级，结合<strong>优先级</strong>排期。致命不一定优先最高，需看发生概率与影响面。</p>` },
                { id: "priority", title: "优先级策略",
                  content: `<p>高严重+高频 → 立即修复；高严重+极低频 → 排期修复；轻微 →  backlog 观察。</p>` }
              ]
            }
          ]
        },
        {
          id: "process", title: "测试流程", children: [
            {
              id: "plan", title: "计划与策略", children: [
                { id: "scope", title: "范围与入口准则",
                  content: `<p>明确测什么、不测什么、何时开始（入口准则）与何时结束（出口准则），避免范围蔓延。</p>` },
                { id: "env", title: "环境与数据",
                  content: `<p>环境一致性是自动化稳定的前提。用容器或脚本统一环境，用脱敏数据替代生产数据。</p>` }
              ]
            },
            {
              id: "exec", title: "执行与报告", children: [
                { id: "run", title: "执行策略",
                  content: `<p>先冒烟保底，再回归，最后探索性测试补盲点。执行中记录阻塞与风险。</p>` },
                { id: "report", title: "质量报告",
                  content: `<p>报告讲三件事：测了什么、质量结论、剩余风险。面向干系人，少堆细节、多给判断。</p>` }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "auto",
      title: "自动化测试进阶",
      tree: [
        {
          id: "ui", title: "UI 自动化", children: [
            {
              id: "locator", title: "元素定位", children: [
                { id: "css", title: "CSS / XPath",
                  content: `<p>优先用稳定的属性（data-testid、id），避免依赖易变的文本与层级路径。</p>` },
                { id: "wait", title: "等待机制",
                  content: `<p>禁用固定 sleep。用显式等待：等到元素可点击/可见再操作，兼顾稳定与速度。</p>` }
              ]
            },
            {
              id: "framework", title: "框架选型", children: [
                { id: "selenium", title: "Selenium / Playwright",
                  content: `<p>Playwright 自带自动等待与多浏览器，新项目更推荐；Selenium 生态成熟，legacy 项目常见。</p>` }
              ]
            }
          ]
        },
        {
          id: "api", title: "接口自动化", children: [
            {
              id: "assert", title: "断言设计", children: [
                { id: "schema", title: "结构断言",
                  content: `<p>用 JSON Schema 校验返回结构，比逐字段硬断言更抗变更，能抓住"字段丢失"类回归。</p>` },
                { id: "datadrive", title: "数据驱动",
                  content: `<p>用例与数据分离：一份逻辑，多组入参/期望，由数据文件驱动，维护成本大幅下降。</p>` }
              ]
            }
          ]
        },
        {
          id: "ci", title: "持续集成", children: [
            {
              id: "pipeline", title: "流水线", children: [
                { id: "stage", title: "阶段划分",
                  content: `<p>典型阶段：拉取 → 构建 → 单测 → 接口冒烟 → 部署预览 → 端到端。任一阶段失败即阻断。</p>` },
                { id: "report", title: "报告与通知",
                  content: `<p>测试报告随构建产出并归档，失败时推送到 IM。让质量结果"看得见"。</p>` }
              ]
            }
          ]
        }
      ]
    }
  ],

  // ---------------- 题库 ----------------
  bank: [
    {
      id: "theory",
      title: "软件测试理论",
      questions: [
        { id: "q1", title: "什么是回归测试？",
          answer: `<p>对修改后的软件重新执行已有测试用例，确认改动没有引入新缺陷、也没有破坏原有功能。通常结合自动化在 CI 中高频执行。</p>` },
        { id: "q2", title: "黑盒测试与白盒测试的区别？",
          answer: `<p>黑盒不关注内部实现，按需求与规格验证输入输出；白盒基于代码结构设计用例，关注逻辑路径覆盖。二者互补。</p>` },
        { id: "q3", title: "测试左移是什么意思？",
          answer: `<p>把测试与质量活动前移到需求、设计、编码阶段，尽早发现并阻断缺陷，降低修复成本。</p>` }
      ]
    },
    {
      id: "db-linux",
      title: "数据库和 Linux",
      questions: [
        { id: "q1", title: "如何查看 Linux 中占用端口的进程？",
          answer: `<p>使用 <code>netstat -tunlp | grep :端口</code> 或 <code>lsof -i :端口</code> 找到 PID，再用 <code>kill -9 PID</code> 结束。</p>` },
        { id: "q2", title: "SQL 中 INNER JOIN 与 LEFT JOIN 的区别？",
          answer: `<p>INNER JOIN 只返回两表匹配的行；LEFT JOIN 返回左表全部行，右表无匹配时以 NULL 填充。</p>` },
        { id: "q3", title: "如何排查数据库慢查询？",
          answer: `<p>开启慢查询日志，用 <code>EXPLAIN</code> 分析执行计划，重点看是否全表扫描、是否命中索引，再针对性建索引或改写 SQL。</p>` }
      ]
    },
    {
      id: "python",
      title: "Python 编程",
      questions: [
        { id: "q1", title: "list 和 tuple 的区别？",
          answer: `<p>list 可变（可增删改），tuple 不可变。tuple 更轻量、可作字典键，适合表示固定结构的数据。</p>` },
        { id: "q2", title: "如何读取大文件而不撑爆内存？",
          answer: `<p>逐行迭代：<code>with open(f) as fh: for line in fh:</code>，或按块读取，避免一次性 read() 到内存。</p>` },
        { id: "q3", title: "什么是装饰器（decorator）？",
          answer: `<p>装饰器是高阶函数，接收一个函数并返回增强后的函数，常用于日志、鉴权、重试等横切逻辑，语法糖为 <code>@wrapper</code>。</p>` }
      ]
    }
  ],

  // ---------------- 关于我 ----------------
  about: {
    title: "关于我",
    content: `
      <p>你好，我是 <strong>Caoxu</strong>，一名面向保险行业的软件测试工程师。</p>
      <p>日常围绕功能测试、接口自动化与质量保障展开工作，也乐于把踩过的坑和学到的方法沉淀成文字。</p>
      <h2>这个站点记录什么</h2>
      <ul>
        <li><strong>博客</strong>：测试理念与实战随笔。</li>
        <li><strong>教程</strong>：系统的测试知识体系，带目录树便于检索。</li>
        <li><strong>题库</strong>：面试向的测试 / 数据库 / Python 题目与解析。</li>
      </ul>
      <h2>一句话共勉</h2>
      <p>没有完美的代码，只有未发现的缺陷——所以我们要做那个"更早看见"的人。</p>
    `
  }
};

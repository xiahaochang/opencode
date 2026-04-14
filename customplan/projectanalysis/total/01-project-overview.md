# OpenCode 项目总览

## 一、项目简介

**OpenCode** 是一个开源的 AI 编码代理工具，类似于 Claude Code，但具有以下特点：
- 100% 开源，不绑定任何特定 AI 提供商
- 支持 Claude、OpenAI、Google、本地模型等 34 个 AI 提供商
- 内置 LSP 支持
- 专注于 TUI（终端用户界面）
- 客户端/服务器架构
- 支持 CLI、TUI、Web、Desktop 多种使用方式

### 技术栈

| 层次 | 技术 |
|------|------|
| 语言 | TypeScript (严格模式) |
| 运行时 | Bun 1.3+ |
| 前端框架 | SolidJS 1.9 |
| 样式 | TailwindCSS 4 |
| UI 组件库 | Kobalte (无头组件) |
| 构建工具 | Vite 7 |
| 后端框架 | Hono (Web) + Effect (效果系统) |
| 桌面打包 | Tauri |
| 数据库 | SQLite (Drizzle ORM) |
| 包管理 | Bun workspaces + Turbo |

---

## 二、Monorepo 架构

项目采用 **monorepo** 结构，使用 Bun workspaces 和 Turbo 管理多个包：

```
opencode/
├── packages/                   # 所有子包（核心）
│   ├── opencode/              # 核心业务逻辑（CLI、TUI、Server）
│   ├── app/                   # Web 应用（SolidJS 前端）
│   ├── ui/                    # 共享 UI 组件库
│   ├── desktop/               # Tauri 桌面应用
│   ├── sdk/                   # JavaScript SDK
│   ├── plugin/                # 插件系统
│   ├── util/                  # 共享工具
│   ├── console/               # 管理控制台
│   └── web/                   # 官方网站
├── infra/                     # 基础设施代码
├── script/                    # 全局脚本
├── .github/                   # GitHub Actions CI/CD
├── .husky/                    # Git hooks 配置
├── .opencode/                 # OpenCode 自身配置
├── .zed/                      # Zed 编辑器配置
├── customplan/                # 自定义计划
├── github/                    # GitHub 相关资源
├── nix/                       # Nix 包管理器配置
├── patches/                   # 依赖补丁
├── sdks/                      # 外部 SDK 集成
├── specs/                     # 规范文档
├── .editorconfig              # 编辑器统一配置
├── .gitignore                 # Git 忽略规则
├── .prettierignore            # Prettier 忽略规则
├── AGENTS.md                  # AI 代理代码规范（强制遵循）
├── bun.lock                   # Bun 锁定文件
├── bunfig.toml                # Bun 运行时配置
├── CONTRIBUTING.md            # 贡献指南
├── flake.lock                 # Nix flake 锁定文件
├── flake.nix                  # Nix flake 配置
├── install                    # 安装脚本
├── LICENSE                    # MIT 许可证
├── package.json               # 根包配置，定义 workspaces 和全局脚本
├── QWEN.md                    # 项目上下文文档
├── README.ar.md               # README（阿拉伯语）
├── README.bn.md               # README（孟加拉语）
├── README.br.md               # README（葡萄牙语-巴西）
├── README.bs.md               # README（波斯尼亚语）
├── README.da.md               # README（丹麦语）
├── README.de.md               # README（德语）
├── README.es.md               # README（西班牙语）
├── README.fr.md               # README（法语）
├── README.gr.md               # README（希腊语）
├── README.it.md               # README（意大利语）
├── README.ja.md               # README（日语）
├── README.ko.md               # README（韩语）
├── README.md                  # README（英语-主）
├── README.no.md               # README（挪威语）
├── README.pl.md               # README（波兰语）
├── README.ru.md               # README（俄语）
├── README.th.md               # README（泰语）
├── README.tr.md               # README（土耳其语）
├── README.uk.md               # README（乌克兰语）
├── README.vi.md               # README（越南语）
├── README.zh.md               # README（简体中文）
├── README.zht.md              # README（繁体中文）
├── SECURITY.md                # 安全策略
├── sst-env.d.ts               # SST 环境类型声明
├── sst.config.ts              # SST (Serverless Stack) 部署配置
├── STATS.md                   # 项目统计
└── tsconfig.json              # TypeScript 根配置
```

### 根目录文件统计

| 类别 | 数量 |
|------|------|
| 目录 | 12 个 (packages, infra, script, .github, .husky, .opencode, .zed, customplan, github, nix, patches, sdks, specs) |
| 配置文件 | 9 个 (.editorconfig, .gitignore, .prettierignore, bun.lock, bunfig.toml, flake.lock, flake.nix, tsconfig.json, turbo.json) |
| 文档文件 | 30 个 (AGENTS.md, CONTRIBUTING.md, QWEN.md, LICENSE, SECURITY.md, STATS.md, package.json, sst.config.ts, sst-env.d.ts, install, + 22 个 README 多语言版本) |
| **总计** | **54 个** |

### 包依赖关系图

```
                    ┌─────────┐
                    │  util   │
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌─────────┐ ┌────────┐ ┌────────┐
        │   sdk   │ │  ui    │ │ plugin │
        └────┬────┘ └───┬────┘ └────┬───┘
             │          │           │
             └──────┬───┘           │
                    ▼               │
              ┌─────────┐           │
              │   app   │◄──────────┘
              └────┬────┘
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
    ┌────────┐ ┌──────┐ ┌──────┐
    │desktop │ │console│ │ web  │
    └────────┘ └──────┘ └──────┘

    ┌─────────────────────────────────┐
    │          opencode (核心)         │
    │  CLI + TUI + Server + Agent     │
    └─────────────────────────────────┘
           ▲              ▲
           │              │
      (API 调用)     (SDK 调用)
           │              │
    ┌──────┴──────────────┴──────┐
    │         app/desktop         │
    └─────────────────────────────┘
```

---

## 三、架构分层

### 三层架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层                              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Desktop  │  │   App    │  │  Console │  │   Web   │ │
│  │ (Tauri)  │  │ (Web)    │  │ (管理)   │  │ (Astro) │ │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └─────────┘ │
│       │              │                                    │
│       └──────────────┼────────────────────────────────────┘
│                      ▼
├─────────────────────────────────────────────────────────┤
│                    共享组件层                              │
│                                                         │
│                   UI Components (185+)                    │
│              (SolidJS + TailwindCSS + Kobalte)            │
│                                                         │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    核心业务层                              │
│                  OpenCode Core                           │
│                                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐ │
│  │Server  │ │ CLI    │ │  TUI   │ │ Agent  │ │Plugin │ │
│  │(Hono)  │ │(Yargs) │ │(OpenTUI)│ │(AI)   │ │System │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └───────┘ │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐ │
│  │Session │ │ Config │ │  MCP   │ │  LSP   │ │ Tool  │ │
│  │Manager │ │ Loader │ │Client  │ │Client  │ │System │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └───────┘ │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    基础设施层                              │
│                                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │  SDK   │ │  Bus   │ │Storage │ │  Util  │           │
│  │(JS API)│ │(PubSub)│ │(SQLite)│ │(Utils) │           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## 四、核心流程

### 4.1 CLI 启动流程

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI 启动流程                            │
└─────────────────────────────────────────────────────────────┘

用户执行命令: opencode [command] [options]
                        │
                        ▼
        ┌───────────────────────────────┐
        │   src/index.ts (入口文件)      │
        │                               │
        │   - 初始化 Yargs CLI 解析器    │
        │   - 注册全局选项              │
        │     (--print-logs, --pure)    │
        │   - 设置中间件                │
        │     - 初始化日志系统          │
        │     - Heap 监控              │
        │     - 环境变量设置            │
        │   - 执行数据库迁移            │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │      命令路由分发              │
        │                               │
        │   根据 command 参数分发到:     │
        └───────────────┬───────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┬───────────────┬───────────────┐
        ▼               ▼               ▼               ▼               ▼               ▼
   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  run    │   │  serve   │   │   tui    │   │  attach  │   │  debug   │   │  models  │
   │ (非交互) │   │ (HTTP)   │   │ (TUI界面) │   │ (远程)   │   │ (调试)   │   │ (模型)   │
   └────┬────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
        │             │              │              │              │              │
        ▼             ▼              ▼              ▼              ▼              ▼
   执行AI对话    启动HTTP服务    启动TUI界面    连接远程服务器    调试模式       模型列表

        ┌───────────────┬───────────────┬───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  stats   │   │   mcp    │   │  github  │   │  export  │
   │ (统计)   │   │ (MCP管理)│   │ (GitHub) │   │ (导出)   │
   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  import  │   │ session  │   │  plugin  │   │    db    │
   │ (导入)   │   │ (会话)   │   │ (插件)   │   │ (数据库) │
   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### 4.2 TUI 交互流程

```
┌─────────────────────────────────────────────────────────────┐
│                      TUI 交互流程                            │
└─────────────────────────────────────────────────────────────┘

用户执行: opencode (默认命令)
        │
        ▼
┌───────────────────────┐
│  cli/cmd/tui/thread.ts │
│                        │
│  - 创建 Worker 进程     │
│  - 启动 TUI 渲染层      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│  cli/cmd/tui/worker.ts │
│                        │
│  - 初始化 Hono 服务器   │
│  - 注册所有 API 路由    │
│  - 监听本地端口         │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│    TUI 主界面渲染       │
│                        │
│  - 首页 (项目选择)      │
│  - 会话页 (AI 对话)     │
│  - 侧边栏 (会话列表)    │
│  - 对话框 (模型选择)    │
│  - 状态面板 (MCP/LSP)   │
│  - 主题切换            │
│  - 快捷键系统          │
└───────────┬───────────┘
            │
            ▼
用户输入消息 → TUI 渲染层
            │
            ▼
┌───────────────────────┐
│   发送到后端 API        │
│   POST /chat           │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Agent 处理请求        │
│                        │
│   - 选择代理 (build)   │
│   - 构建 prompt        │
│   - 调用 AI 模型        │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Tool 调用循环         │
│                        │
│   AI 返回工具调用 →     │
│   执行工具:             │
│   - bash: 执行命令      │
│   - read: 读取文件      │
│   - write: 写入文件     │
│   - edit: 编辑文件      │
│   - multiedit: 多编辑   │
│   - glob: 文件搜索      │
│   - grep: 内容搜索      │
│   - ls: 目录列表        │
│   - webfetch: URL获取   │
│   - websearch: Web搜索  │
│   - codesearch: 代码搜索│
│   - task: 子代理任务    │
│   - skill: 技能调用     │
│   - todo: 待办更新      │
│   - lsp: LSP操作        │
│   - plan: 计划管理      │
│   - question: 提问      │
│   - apply_patch: 应用补丁│
│   返回结果给 AI →       │
│   AI 继续决策...        │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Event Bus 发布事件   │
│                        │
│   - message.updated    │
│   - tool.executed      │
│   - session.updated    │
│   - permission.asked   │
│   - question.asked     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   TUI 订阅并更新 UI     │
│                        │
│   - 显示工具调用状态    │
│   - 显示 AI 回复内容    │
│   - 更新会话列表        │
│   - 显示权限请求        │
│   - 显示问题提示        │
└───────────────────────┘
```

### 4.3 Web 应用流程

```
┌─────────────────────────────────────────────────────────────┐
│                     Web 应用流程                             │
└─────────────────────────────────────────────────────────────┘

浏览器访问: http://localhost:XXXX
        │
        ▼
┌───────────────────────┐
│   app.tsx (根组件)     │
│                        │
│   - 初始化 Provider 树 │
│   - 定义路由结构       │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│      路由匹配           │
│                        │
│   /          → Home    │
│   /:dir      → Layout  │
│   /:dir/session/:id →  │
│              Session   │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Context Provider     │
│                        │
│   - ServerProvider     │
│   - SettingsProvider   │
│   - SDKProvider        │
│   - LayoutProvider     │
│   - SyncProvider       │
│   - GlobalSyncProvider │
│   - PromptProvider     │
│   - FileProvider       │
│   - TerminalProvider   │
│   - CommandProvider    │
│   - ModelsProvider     │
│   - PermissionProvider │
│   - NotificationProvider│
│   - CommentsProvider   │
│   - HighlightsProvider │
│   - LanguageProvider   │
│   - PlatformProvider   │
│   - LocalProvider      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   页面组件渲染           │
│                        │
│   HomeRoute:           │
│   - 项目列表展示        │
│   - 打开项目对话框      │
│   - 服务器选择对话框    │
│                        │
│   SessionRoute:        │
│   - 消息时间线          │
│   - Composer 区域      │
│   - 文件标签页          │
│   - 终端面板            │
│   - Review 标签页      │
│   - 侧边面板            │
│   - 问题 dock          │
│   - 权限 dock          │
│   - Followup dock      │
│   - Revert dock        │
│   - Todo dock          │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   SDK 调用后端 API     │
│                        │
│   - 获取会话列表        │
│   - 发送消息            │
│   - 订阅事件流          │
│   - 获取模型列表        │
│   - 获取工具列表        │
│   - MCP 状态查询        │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   UI 组件库渲染         │
│                        │
│   - Button, Dialog     │
│   - Markdown, List     │
│   - FileIcon, Icon     │
│   - Input, Textarea    │
│   - Checkbox, Switch   │
│   - Select, Tabs       │
│   - Tooltip, Toast     │
│   - ... (185+ 组件)    │
└───────────────────────┘
```

---

## 五、核心模块速查表

### 5.1 opencode 核心包模块

| 模块路径 | 主要函数 | 功能描述 |
|----------|----------|----------|
| `src/index.ts` | `cli.parse()` | CLI 入口，Yargs 命令解析 |
| `src/cli/cmd/run.ts` | `RunCommand.execute()` | 非交互式运行 AI 对话 |
| `src/cli/cmd/serve.ts` | `ServeCommand.handler()` | 启动 HTTP 服务器 |
| `src/cli/cmd/tui/thread.ts` | `ThreadCommand.handler()` | TUI 主线程启动 |
| `src/cli/cmd/tui/worker.ts` | `Worker.start()` | TUI Worker 启动内部服务器 |
| `src/server/server.ts` | `Server.listen()` | HTTP 服务器监听 |
| `src/server/server.ts` | `Server.Default()` | 获取默认服务器实例 |
| `src/server/router.ts` | `Router.create()` | 创建 API 路由 |
| `src/provider/provider.ts` | `Provider.list()` | 列出所有提供商 (34个) |
| `src/provider/provider.ts` | `Provider.getModel()` | 获取指定 AI 模型 |
| `src/provider/provider.ts` | `Provider.defaultModel()` | 获取默认模型 |
| `src/provider/provider.ts` | `Provider.getLanguage()` | 获取语言模型实例 |
| `src/agent/agent.ts` | `Agent.get()` | 获取代理配置 |
| `src/agent/agent.ts` | `Agent.list()` | 列出所有代理 |
| `src/agent/agent.ts` | `Agent.generate()` | AI 生成新代理 |
| `src/session/index.ts` | `Session.create()` | 创建新会话 |
| `src/session/index.ts` | `Session.fork()` | 分叉会话 |
| `src/session/index.ts` | `Session.get()` | 获取会话信息 |
| `src/session/index.ts` | `Session.messages()` | 获取消息列表 |
| `src/session/index.ts` | `Session.list()` | 列出会话 |
| `src/session/index.ts` | `Session.remove()` | 删除会话 |
| `src/session/index.ts` | `Session.getUsage()` | 计算使用成本 |
| `src/session/compaction.ts` | `SessionCompaction.process()` | 执行会话压缩 |
| `src/session/processor.ts` | `SessionProcessor.create()` | 创建会话处理器 |
| `src/session/prompt.ts` | `SessionPrompt.prompt()` | 处理用户提示 |
| `src/session/prompt.ts` | `SessionPrompt.loop()` | 运行对话循环 |
| `src/session/prompt.ts` | `SessionPrompt.shell()` | 执行 shell 命令 |
| `src/session/prompt.ts` | `SessionPrompt.command()` | 执行预定义命令 |
| `src/session/prompt.ts` | `SessionPrompt.cancel()` | 取消操作 |
| `src/session/revert.ts` | `SessionRevert.revert()` | 回退到指定状态 |
| `src/session/revert.ts` | `SessionRevert.unrevert()` | 撤销回退 |
| `src/session/summary.ts` | `SessionSummary.summarize()` | 生成会话摘要 |
| `src/session/summary.ts` | `SessionSummary.diff()` | 获取文件差异 |
| `src/session/todo.ts` | `Todo.update()` | 更新待办事项 |
| `src/session/todo.ts` | `Todo.get()` | 获取待办事项 |
| `src/session/system.ts` | `SystemPrompt.provider()` | 生成系统提示 |
| `src/session/system.ts` | `SystemPrompt.environment()` | 生成环境提示 |
| `src/session/system.ts` | `SystemPrompt.skills()` | 生成技能提示 |
| `src/session/llm.ts` | `LLM.stream()` | 流式调用语言模型 |
| `src/session/message-v2.ts` | `MessageV2.toModelMessages()` | 转换消息格式 |
| `src/session/message-v2.ts` | `MessageV2.page()` | 分页获取消息 |
| `src/session/message-v2.ts` | `MessageV2.stream()` | 流式获取消息 |
| `src/session/retry.ts` | `SessionRetry.policy()` | 创建重试策略 |
| `src/session/run-state.ts` | `SessionRunState.cancel()` | 取消运行任务 |
| `src/session/run-state.ts` | `SessionRunState.ensureRunning()` | 确保任务运行 |
| `src/session/status.ts` | `SessionStatus.get()` | 获取会话状态 |
| `src/session/status.ts` | `SessionStatus.set()` | 设置会话状态 |
| `src/session/instruction.ts` | `Instruction.system()` | 读取系统指令 |
| `src/session/instruction.ts` | `Instruction.resolve()` | 解析指令文件 |
| `src/tool/registry.ts` | `ToolRegistry` | 工具注册表服务 |
| `src/tool/tool.ts` | `Tool.define()` | 定义工具 |
| `src/tool/tool.ts` | `Tool.init()` | 初始化工具 |
| `src/tool/bash.ts` | `BashTool.execute()` | 执行 shell 命令 |
| `src/tool/read.ts` | `ReadTool.execute()` | 读取文件内容 |
| `src/tool/write.ts` | `WriteTool.execute()` | 写入文件 |
| `src/tool/edit.ts` | `EditTool.execute()` | 编辑文件 (diff) |
| `src/tool/multiedit.ts` | `MultiEditTool.execute()` | 多位置编辑 |
| `src/tool/glob.ts` | `GlobTool.execute()` | 文件模式搜索 |
| `src/tool/grep.ts` | `GrepTool.execute()` | 内容搜索 |
| `src/tool/ls.ts` | `ListTool.execute()` | 目录列表 |
| `src/tool/webfetch.ts` | `WebFetchTool.execute()` | URL 获取 |
| `src/tool/websearch.ts` | `WebSearchTool.execute()` | Web 搜索 (Exa) |
| `src/tool/codesearch.ts` | `CodeSearchTool.execute()` | 代码搜索 (Exa) |
| `src/tool/task.ts` | `TaskTool.execute()` | 子代理任务调度 |
| `src/tool/skill.ts` | `SkillTool.execute()` | 技能调用 |
| `src/tool/todo.ts` | `TodoWriteTool.execute()` | 待办事项管理 |
| `src/tool/lsp.ts` | `LspTool.execute()` | LSP 操作 |
| `src/tool/plan.ts` | `PlanExitTool.execute()` | 计划退出 |
| `src/tool/question.ts` | `QuestionTool.execute()` | 向用户提问 |
| `src/tool/apply_patch.ts` | `ApplyPatchTool.execute()` | 应用补丁 |
| `src/tool/invalid.ts` | `InvalidTool.execute()` | 无效工具处理 |
| `src/tool/truncate.ts` | `Truncate` | 输出截断服务 |
| `src/config/config.ts` | `Config.load()` | 加载配置文件 |
| `src/config/config.ts` | `Config.get()` | 获取配置项 |
| `src/plugin/index.ts` | `Plugin.trigger()` | 触发插件钩子 |
| `src/plugin/index.ts` | `Plugin.list()` | 列出已加载钩子 |
| `src/mcp/index.ts` | `MCP.connect()` | 连接 MCP 服务器 |
| `src/mcp/index.ts` | `MCP.tools()` | 获取 MCP 工具 |
| `src/mcp/index.ts` | `MCP.status()` | 获取 MCP 状态 |
| `src/lsp/index.ts` | `LSP.initialize()` | 初始化 LSP |
| `src/lsp/index.ts` | `LSP.symbols()` | 获取代码符号 |
| `src/bus/index.ts` | `Bus.publish()` | 发布事件 |
| `src/bus/index.ts` | `Bus.subscribe()` | 订阅事件 |
| `src/storage/db.ts` | `Database.connect()` | 连接数据库 |
| `src/storage/db.ts` | `Database.migrate()` | 执行数据库迁移 |
| `src/project/instance.ts` | `Instance.provide()` | 在实例上下文中执行 |
| `src/project/instance.ts` | `Instance.current` | 获取当前实例 |

### 5.2 app Web 应用模块

| 模块路径 | 主要组件/函数 | 功能描述 |
|----------|---------------|----------|
| `src/app.tsx` | `App` | 根组件，路由定义 |
| `src/entry.tsx` | `render()` | 应用入口 |
| `src/pages/home.tsx` | `HomeRoute` | 首页（项目选择） |
| `src/pages/layout.tsx` | `DirectoryLayout` | 主布局（侧边栏） |
| `src/pages/session.tsx` | `SessionRoute` | 会话页面 |
| `src/components/prompt-input.tsx` | `PromptInput` | 提示输入框 |
| `src/context/server.tsx` | `ServerProvider` | 服务器连接管理 |
| `src/context/settings.tsx` | `SettingsProvider` | 用户设置 |
| `src/context/sdk.tsx` | `SDKProvider` | SDK 实例提供 |
| `src/utils/persist.ts` | `createPersist()` | localStorage 封装 |
| `src/utils/server-health.ts` | `checkHealth()` | 健康检查 |

### 5.3 ui 组件库模块

| 模块路径 | 主要组件 | 功能描述 |
|----------|----------|----------|
| `src/components/button.tsx` | `Button` | 按钮组件 |
| `src/components/dialog.tsx` | `Dialog` | 对话框 |
| `src/components/markdown.tsx` | `Markdown` | Markdown 渲染 |
| `src/components/icon.tsx` | `Icon` | 图标组件 |
| `src/components/list.tsx` | `List` | 列表组件 |
| `src/components/file.tsx` | `FileIcon` | 文件类型图标 |
| `src/theme/context.tsx` | `ThemeProvider` | 主题上下文 |
| `src/i18n/en.ts` | `enDict` | 英文翻译字典 |
| `src/i18n/zh.ts` | `zhDict` | 中文翻译字典 |

---

## 六、关键设计模式

### 6.1 Effect 效果系统

项目使用 **Effect** 库实现类型安全的效果处理，替代传统 try/catch：

```typescript
// 定义服务接口
interface SessionInterface {
  readonly create: (input?: CreateInput) => Effect.Effect<Session.Info>
  readonly get: (id: SessionID) => Effect.Effect<Session.Info>
  readonly messages: (id: SessionID) => Effect.Effect<Message[]>
}

// 实现服务类
class SessionService extends ServiceMap.Service<SessionService, SessionInterface>()("@opencode/Session") {}

// 创建 Layer（依赖注入）
const layer = Layer.effect(
  SessionService,
  Effect.gen(function* () {
    function* create(input) { ... }
    function* get(id) { ... }
    return SessionService.of({ create, get, messages })
  })
)

// 带追踪的命名函数
const createSession = Effect.fn("Session.create")(function* (input) {
  const session = yield* createSessionImpl(input)
  yield* Bus.publish(Session.Event.Created, { sessionID: session.id })
  return session
})
```

### 6.2 事件总线模式

```typescript
// 定义事件类型
namespace Session.Event {
  export type Created = { sessionID: SessionID }
  export type Updated = { sessionID: SessionID }
  export type Deleted = { sessionID: SessionID }
}

// 发布事件
yield* Bus.publish(Session.Event.Created, { sessionID: newSession.id })

// 订阅事件
Bus.subscribe(Session.Event.Created, (event) => {
  console.log("Session created:", event.sessionID)
})
```

### 6.3 工具定义模式

```typescript
// 定义工具
const BashTool = Tool.define("bash", {
  description: "Execute a bash command",
  parameters: z.object({
    command: z.string().describe("The command to execute"),
  }),
  execute: async ({ command }, ctx) => {
    // 执行逻辑
    return { title: command, output: result }
  }
})

// 使用 Effect 定义
const ReadTool = Tool.defineEffect("read", Effect.gen(function* () {
  // Effect 风格的执行逻辑
}))
```

---

## 七、开发命令

### 全局命令

| 命令 | 说明 |
|------|------|
| `bun install` | 安装所有依赖 |
| `bun dev` | 启动核心 CLI 开发模式 |
| `bun dev:web` | 启动 Web 应用开发 |
| `bun dev:desktop` | 启动 Tauri 桌面应用 |
| `bun typecheck` | 类型检查所有包 |

### 包级别命令（需在包目录下执行）

| 命令 | 说明 |
|------|------|
| `bun test` | 运行单元测试 |
| `bun typecheck` | 类型检查当前包 |

---

## 八、配置说明

### 8.1 opencode.json 配置

项目使用 `opencode.json` 进行配置，支持三个层级：

1. **系统管理配置**: 最高优先级（企业 MDM 部署）
2. **项目配置**: `.opencode/` 目录下
3. **全局配置**: 用户级别

主要配置项：
```json
{
  "provider": {},           // AI 提供商配置
  "agent": {},              // 自定义代理
  "mcp": {},                // MCP 服务器
  "plugin": [],             // 插件列表
  "permission": {},         // 权限规则
  "command": {},            // 自定义命令
  "instructions": [],       // 指令文件
  "default_agent": "build", // 默认代理
  "keybinds": {},           // TUI 快捷键
  "skills": {}              // 技能配置
}
```

### 8.2 环境变量

| 变量 | 说明 |
|------|------|
| `OPENCODE_DB` | 数据库路径 |
| `OPENCODE_SERVER_PASSWORD` | 服务器密码 |
| `OPENCODE_DIR` | 配置目录 |

---

## 九、文件统计概览

| 包 | 主要语言 | 估算文件数 | 核心功能 |
|----|---------|-----------|---------|
| opencode | TypeScript | 200+ | 核心业务逻辑 |
| app | TypeScript/TSX | 100+ | Web 前端 |
| ui | TypeScript/TSX | 250+ | UI 组件库 |
| desktop | TypeScript/Rust | 30+ | 桌面打包 |
| sdk | TypeScript | 50+ | JS SDK |
| plugin | TypeScript | 10+ | 插件 SDK |
| console | TypeScript | 40+ | 管理后台 |
| web | TypeScript/Astro | 20+ | 官网 |

---

## 十、总结

OpenCode 是一个设计良好的 monorepo 项目，采用清晰的 **三层架构**（界面层 → 共享组件层 → 核心业务层 → 基础设施层），支持多种部署方式：

- **CLI**: 命令行工具，直接运行 `opencode`
- **TUI**: 终端用户界面，提供交互式 AI 编程体验
- **Web**: 浏览器访问，适合远程开发
- **Desktop**: Tauri 打包的桌面应用

核心设计亮点：
1. **Effect 效果系统**: 类型安全的错误处理和资源管理
2. **多 AI 提供商**: 统一接口支持 34 个 AI 服务
3. **插件系统**: 通过 Hooks 扩展生命周期
4. **MCP 集成**: 支持本地/远程 MCP 服务器
5. **LSP 支持**: 代码智能功能
6. **事件总线**: 松耦合的模块通信
7. **完整工具系统**: 19 个内置工具，支持自定义扩展

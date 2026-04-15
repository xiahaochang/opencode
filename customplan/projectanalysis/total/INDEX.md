# OpenCode 项目分析文档索引

## 文档目录

本目录包含 OpenCode 项目的完整架构分析文档：

```
customplan/projectanalysis/total/
│
├── 01-project-overview.md     # 项目总览 (757 行)
├── 02-opencode-core.md        # 核心包 (opencode) 详细分析
├── 03-app-web.md              # Web 应用包 (app) 详细分析
├── 04-ui-components.md        # UI 组件库包 (ui) 详细分析
├── 05-desktop.md              # 桌面应用包 (desktop Tauri) 详细分析
├── 06-sdk.md                  # JavaScript SDK 包 (sdk) 详细分析
├── 07-plugin.md               # 插件系统包 (plugin) 详细分析
├── 08-desktop-electron.md     # 桌面应用包 (desktop-electron) 详细分析
├── 09-app-frontend.md         # 前端 UI 详细分析 (SolidJS Web 应用)
└── INDEX.md                   # 本文档 (索引)
```

---

## 文档速查

### 按主题查找

| 主题 | 文档 | 章节 |
|------|------|------|
| 根目录完整结构 | 01-project-overview.md | 二、Monorepo 架构 (54 个文件) |
| 项目整体架构 | 01-project-overview.md | 二、三、四章 |
| CLI 启动流程 | 01-project-overview.md | 四.1 章 (14 个命令) |
| TUI 交互流程 | 01-project-overview.md | 四.2 章 (19 个工具) |
| Web 应用流程 | 01-project-overview.md | 四.3 章 (19 个 Provider) |
| 核心模块速查 | 01-project-overview.md | 五章 (90+ 函数) |
| CLI 命令实现 | 02-opencode-core.md | 三.2 章 (15 个命令) |
| HTTP 服务器 | 02-opencode-core.md | 三.3 章 (113 个端点) |
| AI 提供商管理 | 02-opencode-core.md | 三.4 章 (34 个提供商) |
| Agent 代理系统 | 02-opencode-core.md | 三.5 章 (7 个代理) |
| Session 会话管理 | 02-opencode-core.md | 三.6 章 (18 个子模块) |
| Tool 工具系统 | 02-opencode-core.md | 三.7 章 (44 个文件) |
| Config 配置系统 | 02-opencode-core.md | 三.8 章 |
| Plugin 插件系统 | 02-opencode-core.md | 三.9 章 |
| MCP 客户端 | 02-opencode-core.md | 三.10 章 |
| LSP 集成 | 02-opencode-core.md | 三.11 章 |
| Event Bus 事件总线 | 02-opencode-core.md | 三.12 章 |
| Effect 效果系统 | 02-opencode-core.md | 四章 |
| 路由配置 | 03-app-web.md | 三章 |
| 页面组件 | 03-app-web.md | 四章 |
| Context Provider | 03-app-web.md | 五章 (19 个 Provider) |
| 核心组件 | 03-app-web.md | 六章 |
| UI 组件列表 | 04-ui-components.md | 三章 (188 个组件) |
| 主题系统 | 04-ui-components.md | 四章 (37 个主题) |
| Tauri 架构 | 05-desktop.md | 三章 |
| Rust 后端 | 05-desktop.md | 五章 (13 个文件) |
| Electron 架构 | 08-desktop-electron.md | 三章 |
| 嵌入式服务器 | 08-desktop-electron.md | 四.3 章 |
| IPC 通信 | 08-desktop-electron.md | 四.4 章 (36 个通道) |
| WSL 支持 | 08-desktop-electron.md | 四.9 章 |
| SDK API | 06-sdk.md | 五章 |
| SDK 生成流程 | 06-sdk.md | 三章 |
| 插件开发 | 07-plugin.md | 五、九章 |
| 前端路由配置 | 09-app-frontend.md | 三章 |
| 前端页面组件 | 09-app-frontend.md | 四章 (8 个页面) |
| 前端 Context Provider | 09-app-frontend.md | 五章 (19 个 Provider) |
| 前端业务组件 | 09-app-frontend.md | 六章 (~60 个组件) |
| 前端状态管理 | 09-app-frontend.md | 七章 |
| 前端国际化 | 09-app-frontend.md | 九章 (18 种语言) |
| 前端工具函数 | 09-app-frontend.md | 八章 (34 个工具) |

---

## 各包文件统计

### 根目录 (54 个)

| 类别 | 数量 |
|------|------|
| 目录 | 12 个 (packages, infra, script, .github, .husky, .opencode, .zed, customplan, github, nix, patches, sdks, specs) |
| 配置文件 | 9 个 (.editorconfig, .gitignore, .prettierignore, bun.lock, bunfig.toml, flake.lock, flake.nix, tsconfig.json, turbo.json) |
| 文档文件 | 30 个 (22 个 README 多语言 + 8 个其他文档) |
| 代码文件 | 3 个 (sst.config.ts, sst-env.d.ts, package.json) |

### opencode 核心包 (200+ 个)

| 类别 | 数量 |
|------|------|
| CLI 命令 | 15 个 (run, serve, tui/thread, tui/worker, attach, debug, models, stats, mcp, github, export, import, session, plugin, db) |
| API 端点 | 113 个 (session 27, tui 13, experimental 16, mcp 8, provider 4, permission 2, question 3, pty 6, file 6, project 4, config 3, event 1, global 10, instance 9, UI 1) |
| 工具文件 | 44 个 (25 个 .ts + 19 个 .txt) |
| Session 子模块 | 18 个 |
| AI 提供商 | 34 个 (24 个内置 + 10 个特殊配置) |
| 内置代理 | 7 个 |

### app Web 应用包 (217 个)

| 类别 | 数量 |
|------|------|
| components/ | 43 个 (prompt-input 16, server 1, session 10, 其他 16) |
| context/ | 46 个 (file 8, global-sync 15, 其他 23) |
| pages/ | 31 个 (layout 7, session 24) |
| i18n/ | 18 个 (17 种语言 + 1 个测试) |
| utils/ | 34 个 |
| Provider | 19 个 |

### ui 组件库包 (1530+ 个)

| 类别 | 数量 |
|------|------|
| components/ | 188 个 (表单 14, 布局 14, 弹出 8, 数据展示 20, 消息 16, 文本 7, 其他 5) |
| assets/audio/ | 45 个音频文件 |
| assets/favicon/ | 11 个图标文件 |
| assets/icons/app/ | 16 个应用图标 |
| assets/icons/file-types/ | 1089 个文件类型图标 |
| assets/icons/provider/ | 104 个提供商图标 |
| assets/images/ | 3 张图片 |
| theme/themes/ | 37 个主题文件 |
| i18n/ | 17 个语言文件 |
| context/ | 8 个文件 |
| hooks/ | 3 个文件 |
| pierre/ | 11 个文件 |
| styles/ | 7 个文件 |

### desktop 桌面应用包 (Tauri) (100+ 个)

| 类别 | 数量 |
|------|------|
| src/ | 10 个前端文件 |
| src/i18n/ | 17 种语言 |
| src-tauri/src/ | 13 个 Rust 文件 |
| src-tauri/icons/beta/ | 19 个图标 + Android 5 目录 + iOS 17 图标 |
| src-tauri/icons/dev/ | 同 beta 结构 |
| src-tauri/icons/prod/ | 同 beta 结构 |
| scripts/ | 5 个构建脚本 |
| 配置文件 | 7 个 (tauri.conf, tauri.beta.conf, tauri.prod.conf, capabilities, Cargo.toml, Cargo.lock, entitlements.plist) |

### desktop-electron 桌面应用包 (Electron) (67 个)

| 类别 | 数量 |
|------|------|
| src/main/ | 14 个主进程文件 |
| src/preload/ | 2 个预加载文件 |
| src/renderer/ | 21 个渲染器文件 |
| src/renderer/i18n/ | 16 个语言文件 (15 种语言 + 1 入口) |
| scripts/ | 7 个构建脚本 |
| icons/ | 3 通道目录 (dev/beta/prod) |
| 配置文件 | 4 个 (electron-vite, electron-builder, package.json, tsconfig.json) |
| 文档 | 3 个 (AGENTS.md, README.md, icons/README.md) |

### sdk JavaScript SDK 包 (38 个)

| 类别 | 数量 |
|------|------|
| js/src/ | 5 个源文件 |
| js/src/gen/ | 12 个生成文件 (v1) |
| js/src/v2/ | 5 个源文件 |
| js/src/v2/gen/ | 12 个生成文件 (v2) |
| js/example/ | 1 个示例文件 |
| js/script/ | 2 个脚本 |
| openapi.json | 1 个规范文件 |

### plugin 插件系统包 (11 个)

| 类别 | 数量 |
|------|------|
| src/ | 6 个源文件 (index.ts, tool.ts, tui.ts, shell.ts, example.ts, example-workspace.ts) |
| script/ | 1 个发布脚本 |
| 配置文件 | 4 个 |

---

## 各包核心函数速查

### opencode 核心包

| 模块 | 关键函数 | 作用 |
|------|----------|------|
| CLI 入口 | `cli.parse()` | 命令解析 |
| Run 命令 | `RunCommand.execute()` | 非交互式运行 |
| Serve 命令 | `ServeCommand.handler()` | 启动服务器 |
| TUI 线程 | `ThreadCommand.handler()` | TUI 主入口 |
| Worker | `Worker.start()` | Worker 启动 |
| 服务器 | `Server.listen()` | HTTP 监听 |
| 路由 | `Router.create()` | 创建路由 |
| 提供商 | `Provider.list()` | 列出 34 个提供商 |
| 提供商 | `Provider.getModel()` | 获取模型 |
| 提供商 | `Provider.defaultModel()` | 默认模型 |
| 代理 | `Agent.get()`, `Agent.list()` | 代理管理 (7 个) |
| 会话 | `Session.create()`, `Session.get()` | 会话管理 |
| 会话 | `Session.list()`, `Session.remove()` | 列表/删除 |
| 会话 | `Session.getUsage()` | 使用成本计算 |
| 会话 | `SessionCompaction.process()` | 会话压缩 |
| 会话 | `SessionProcessor.create()` | 会话处理器 |
| 会话 | `SessionPrompt.prompt()`, `loop()` | 提示处理 |
| 会话 | `SessionPrompt.shell()`, `command()` | Shell/命令执行 |
| 会话 | `SessionPrompt.cancel()` | 取消操作 |
| 会话 | `SessionRevert.revert()`, `unrevert()` | 回退/恢复 |
| 会话 | `SessionSummary.summarize()`, `diff()` | 摘要/差异 |
| 会话 | `Todo.update()`, `Todo.get()` | 待办事项 |
| 会话 | `SystemPrompt.provider()`, `environment()`, `skills()` | 系统提示 |
| 会话 | `LLM.stream()` | LLM 流式调用 |
| 会话 | `MessageV2.toModelMessages()`, `page()`, `stream()` | 消息处理 |
| 会话 | `SessionRetry.policy()` | 重试策略 |
| 会话 | `SessionRunState.cancel()`, `ensureRunning()` | 运行状态 |
| 会话 | `SessionStatus.get()`, `set()` | 会话状态 |
| 会话 | `Instruction.system()`, `resolve()` | 指令文件 |
| 工具 | `Tool.define()`, `Tool.init()` | 工具定义 |
| 工具 | `BashTool.execute()` | 执行命令 |
| 工具 | `ReadTool.execute()` | 读取文件 |
| 工具 | `WriteTool.execute()` | 写入文件 |
| 工具 | `EditTool.execute()` | 编辑文件 |
| 工具 | `MultiEditTool.execute()` | 多编辑 |
| 工具 | `GlobTool.execute()` | 文件搜索 |
| 工具 | `GrepTool.execute()` | 内容搜索 |
| 工具 | `ListTool.execute()` | 目录列表 |
| 工具 | `WebFetchTool.execute()` | URL 获取 |
| 工具 | `WebSearchTool.execute()` | Web 搜索 |
| 工具 | `CodeSearchTool.execute()` | 代码搜索 |
| 工具 | `TaskTool.execute()` | 子代理任务 |
| 工具 | `SkillTool.execute()` | 技能调用 |
| 工具 | `TodoWriteTool.execute()` | 待办更新 |
| 工具 | `LspTool.execute()` | LSP 操作 |
| 工具 | `PlanExitTool.execute()` | 计划退出 |
| 工具 | `QuestionTool.execute()` | 提问 |
| 工具 | `ApplyPatchTool.execute()` | 应用补丁 |
| 工具 | `InvalidTool.execute()` | 无效工具 |
| 工具 | `Truncate` | 输出截断 |
| 配置 | `Config.load()`, `Config.get()` | 配置管理 |
| 插件 | `Plugin.trigger()`, `Plugin.list()` | 插件系统 |
| MCP | `MCP.connect()`, `MCP.status()` | MCP 客户端 |
| LSP | `LSP.initialize()`, `LSP.symbols()` | LSP 集成 |
| 事件总线 | `Bus.publish()`, `Bus.subscribe()` | 事件系统 |
| 数据库 | `Database.connect()`, `Database.migrate()` | 数据库管理 |
| 实例 | `Instance.provide()`, `Instance.current` | 项目实例 |

### app Web 应用包

| 模块 | 关键组件/函数 | 作用 |
|------|---------------|------|
| 根组件 | `App` | 路由定义 |
| 首页 | `HomeRoute` | 项目选择 |
| 布局 | `DirectoryLayout` | 主布局 |
| 会话 | `SessionRoute` | 会话页面 |
| 输入框 | `PromptInput` | 提示输入 |
| 服务器 | `ServerProvider` | 连接管理 |
| 设置 | `SettingsProvider` | 用户设置 |
| SDK | `SDKProvider` | SDK 实例 |
| 布局 | `LayoutProvider` | 布局状态 |
| 文件 | `FileProvider` | 文件管理 |
| 全局同步 | `GlobalSyncProvider` | 多项目同步 |
| 持久化 | `createPersist()` | 本地存储 |
| 健康检查 | `checkHealth()` | 健康检查 |

### app 前端详细 (SolidJS)

| 模块 | 关键组件/函数 | 作用 |
|------|---------------|------|
| 路由 | `app.tsx` 路由配置 | `/`, `/:dir`, `/:dir/session/:id?` |
| 首页 | `home.tsx` | 项目选择器 + 服务器选择 |
| 主布局 | `layout.tsx` (~2500 行) | 侧边栏 + 内容区 + 拖放重排序 |
| 目录布局 | `directory-layout.tsx` | 目录级 SDK/Sync 包装器 |
| 会话页面 | `session.tsx` (~2000 行) | 聊天时间线 + 文件标签 + 终端 |
| 消息时间线 | `message-timeline.tsx` (~1100 行) | 消息历史渲染 + 分页加载 |
| 终端面板 | `terminal-panel.tsx` (~324 行) | PTY 终端 + 可排序标签 |
| 文件标签 | `file-tabs.tsx` (~502 行) | 多文件查看 + 评论 + 滚动同步 |
| 提示输入 | `prompt-input/` (12 个组件) | 富文本输入 + 附件 + 斜杠命令 |
| 对话框 | `dialog-*.tsx` (13 个组件) | 目录/文件/模型/服务器选择器 |
| 会话组件 | `session/` (8 个组件) | 上下文使用 + 会话头部 + 新建视图 |
| 文件树 | `file-tree.tsx` | 虚拟化文件树 + 展开/折叠 |
| 终端 | `terminal.tsx` | Ghostty 终端包装器 |
| 持久化 | `persist.ts` | LRU 缓存 + 配额淘汰 + 迁移 |
| 作用域缓存 | `scoped-cache.ts` | 会话级 LRU 缓存 |
| 平台抽象 | `PlatformProvider` | Web vs Desktop 适配 |
| 命令系统 | `CommandProvider` | 命令注册 + 快捷键解析 |
| 通知系统 | `NotificationProvider` | 回合完成/错误通知 |
| 评论系统 | `CommentsProvider` | 行评论 + 选择范围 |
| 国际化 | `LanguageProvider` + `i18n/` | 18 种语言 + 懒加载 |

### ui 组件库包

| 类别 | 组件 | 作用 |
|------|------|------|
| 表单 | `Button`, `Input`, `Checkbox`, `Switch`, `Select`, `RadioGroup`, `InlineInput`, `Tag` | 表单控件 |
| 布局 | `Card`, `Accordion`, `Collapsible`, `Tabs`, `ScrollArea`, `ResizeHandle`, `DockSurface`, `DockPrompt`, `StickyAccordionHeader`, `Progress`, `ProgressCircle`, `Spinner` | 布局组件 |
| 弹出 | `Dialog`, `Popover`, `DropdownMenu`, `ContextMenu`, `HoverCard`, `Tooltip`, `Toast` | 弹出组件 |
| 数据展示 | `List`, `Icon`, `IconButton`, `Avatar`, `Badge`, `Logo`, `Favicon`, `FileIcon`, `File`, `AppIcon`, `ProviderIcon`, `Markdown`, `ImagePreview`, `AnimatedNumber`, `Font`, `Typewriter` | 数据展示 |
| 消息 | `MessageNav`, `MessagePart`, `MessageFile`, `SessionDiff`, `SessionRetry`, `SessionReview`, `SessionTurn`, `ApplyPatchFile`, `DiffChanges`, `BasicTool`, `ToolCountLabel`, `ToolCountSummary`, `ToolErrorCard`, `ToolStatusTitle` | 消息组件 |
| 文本 | `TextReveal`, `TextShimmer`, `TextStrikethrough`, `ThinkingHeading`, `LineComment` | 文本组件 |
| 其他 | `MotionSpring`, `Keybind` | 其他组件 |

### desktop 桌面应用包 (Tauri)

| 模块 | 关键函数 | 作用 |
|------|----------|------|
| Rust 入口 | `main()` | 应用启动 |
| 构建器 | `tauri::Builder::default()` | 创建构建器 |
| 插件 | `.plugin()` | 注册插件 |
| 命令 | `.invoke_handler()` | 注册命令 |
| 运行 | `.run()` | 运行应用 |
| 更新 | `checkForUpdates()` | 检查更新 |

### desktop-electron 桌面应用包 (Electron)

| 模块 | 关键函数 | 作用 |
|------|----------|------|
| 主进程入口 | `setupApp()`, `initialize()` | 应用初始化 |
| 服务器 | `spawnLocalServer()` | 启动嵌入式服务器 |
| 服务器 | `checkHealth()` | 健康检查 |
| 服务器 | `prepareServerEnv()` | 准备服务器环境 |
| 窗口 | `createMainWindow()`, `createLoadingWindow()` | 创建窗口 |
| 窗口 | `setTitlebar()`, `setDockIcon()`, `setBackgroundColor()` | 窗口样式 |
| IPC | `registerIpcHandlers()` | 注册 36 个 IPC 通道 |
| IPC | `sendSqliteMigrationProgress()`, `sendMenuCommand()`, `sendDeepLinks()` | 发送事件 |
| 菜单 | `createMenu()` | 创建 macOS 应用菜单 |
| 存储 | `getStore()`, `store` | electron-store 封装 |
| 日志 | `initLogging()`, `tail()` | 日志系统 |
| 更新 | `checkForUpdates()`, `checkUpdate()`, `installUpdate()` | 自动更新 |
| 常量 | `CHANNEL`, `UPDATER_ENABLED` | 通道配置 |
| WSL | `getWslConfig()`, `setWslConfig()` | WSL 配置 |
| 预加载 | `api` (ElectronAPI) | 暴露 42 个 API 方法 |
| 渲染器 | `createPlatform()` | 平台抽象层 |
| 渲染器 | `runUpdater()` | 渲染器端更新检查 |
| 渲染器 | `webviewZoom` | 页面缩放控制 |

### sdk JavaScript SDK 包

| API | 作用 |
|------|------|
| `SDK` | 客户端类 |
| `sessions.list()` | 获取会话列表 |
| `sessions.create()` | 创建会话 |
| `chat.send()` | 发送消息 |
| `chat.stream()` | 流式消息 |
| `events.subscribe()` | 订阅事件 |

### plugin 插件系统包

| API | 作用 |
|------|------|
| `Tool.define()` | 定义工具 |
| `registerHook()` | 注册钩子 |
| `createComponent()` | 创建 TUI 组件 |

---

## 架构图汇总

### 三层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面层                                  │
│  Desktop (Tauri)  │  Desktop-Electron  │  App (Web)  │  Console  │
└────────────────────────┬────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        共享组件层                                  │
│                       UI Components (188 个)                      │
└────────────────────────┬────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        核心业务层                                  │
│  Server (Hono 113端点) │ CLI (15命令) │ TUI │ Agent (7) │
│  Tool (44文件) │ Session (18子模块) │ Provider (34)              │
└────────────────────────┬────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        基础设施层                                  │
│  SDK (38文件) │ Bus │ Storage (SQLite) │ Util (12)              │
└─────────────────────────────────────────────────────────────────┘
```

### 包依赖关系

```
                    ┌─────────┐
                    │  util   │ (12 文件)
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌─────────┐ ┌────────┐ ┌────────┐
        │   sdk   │ │  ui    │ │ plugin │
        │ (38文件)│ │(1530+) │ │(11文件)│
        └────┬────┘ └───┬────┘ └────┬───┘
             │          │           │
             └─────────┘           │
                    ▼               │
              ┌─────────┐           │
              │   app   │◄──────────┘
              │(217文件)│
              └────┬────┘
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
    ┌────────┐ ┌────── ┌──────┐
    │desktop │ │desktop│ │console│
    │(Tauri) │ │electron│ │     │
    │(100+)  │ │(67)   │ │     │
    └────────┘ └──────┘ └──────┘

    ┌─────────────────────────────────┐
    │          opencode (核心)         │
    │  (200+ 文件, 113 API端点)        │
    └─────────────────────────────────┘
```

---

## 技术栈汇总

| 层次 | 技术 |
|------|------|
| 语言 | TypeScript (严格模式), Rust |
| 运行时 | Bun 1.3+, Node.js (Electron) |
| 前端框架 | SolidJS 1.9 |
| 样式 | TailwindCSS 4 |
| UI 组件 | @kobalte/core (无头组件) |
| 构建 | Vite 7, electron-vite |
| 后端框架 | Hono (Web) + Effect (效果系统) |
| 桌面 (Tauri) | Tauri 2.x + Rust |
| 桌面 (Electron) | Electron 40.4.1 + electron-builder |
| 数据库 | SQLite (Drizzle ORM) |
| 包管理 | Bun workspaces + Turbo |
| AI SDK | @ai-sdk/* (34 个提供商) |

---

## 开发命令汇总

### 全局命令

| 命令 | 说明 |
|------|------|
| `bun install` | 安装依赖 |
| `bun dev` | CLI 开发模式 |
| `bun dev:web` | Web 应用开发 |
| `bun dev:desktop` | Tauri 桌面应用 |
| `bun typecheck` | 类型检查 |

### 包级别命令

| 命令 | 说明 |
|------|------|
| `cd packages/opencode && bun test` | 运行测试 |
| `cd packages/app && bun test` | 运行测试 |
| `cd packages/sdk/js && bun run script/build.ts` | 生成 SDK |
| `cd packages/sdk/js && bun run script/publish.ts` | 发布 SDK |
| `cd packages/plugin && bun run script/publish.ts` | 发布插件 |
| `bun run --cwd packages/desktop tauri dev` | Tauri 桌面开发 |
| `bun run --cwd packages/desktop tauri build` | Tauri 桌面构建 |
| `cd packages/desktop-electron && bun dev` | Electron 桌面开发 |
| `cd packages/desktop-electron && bun build` | Electron 桌面构建 |
| `cd packages/desktop-electron && bun package` | Electron 打包 |
| `cd packages/desktop-electron && bun package:win` | 仅打包 Windows |
| `cd packages/desktop-electron && bun package:mac` | 仅打包 macOS |
| `cd packages/desktop-electron && bun package:linux` | 仅打包 Linux |

---

## 相关文档

| 文档 | 路径 |
|------|------|
| 贡献指南 | `CONTRIBUTING.md` |
| AI 代理规范 | `AGENTS.md` |
| 项目上下文 | `QWEN.md` |
| README | `README.md` |

---

## 文档版本

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-14 | 初始版本，无省略完整列出 |

---

*本文档由 AI 自动生成，基于对 OpenCode 项目源码的完整分析，所有文件均已完整列出，无省略。*

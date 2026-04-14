# OpenCode 项目分析文档索引

## 文档目录

本目录包含 OpenCode 项目的完整架构分析文档：

```
customplan/projectanalysis/total/
│
├── 01-project-overview.md     # 项目总览
├── 02-opencode-core.md        # 核心包 (opencode) 详细分析
├── 03-app-web.md              # Web 应用包 (app) 详细分析
├── 04-ui-components.md        # UI 组件库包 (ui) 详细分析
├── 05-desktop.md              # 桌面应用包 (desktop) 详细分析
├── 06-sdk.md                  # JavaScript SDK 包 (sdk) 详细分析
├── 07-plugin.md               # 插件系统包 (plugin) 详细分析
└── INDEX.md                   # 本文档 (索引)
```

---

## 文档速查

### 按主题查找

| 主题 | 文档 | 章节 |
|------|------|------|
| 项目整体架构 | 01-project-overview.md | 二、三、四章 |
| CLI 启动流程 | 01-project-overview.md | 四.1 章 |
| TUI 交互流程 | 01-project-overview.md | 四.2 章 |
| Web 应用流程 | 01-project-overview.md | 四.3 章 |
| 核心模块速查 | 01-project-overview.md | 五章 |
| CLI 命令实现 | 02-opencode-core.md | 三.2 章 |
| HTTP 服务器 | 02-opencode-core.md | 三.3 章 |
| AI 提供商管理 | 02-opencode-core.md | 三.4 章 |
| Agent 代理系统 | 02-opencode-core.md | 三.5 章 |
| Session 会话管理 | 02-opencode-core.md | 三.6 章 |
| Tool 工具系统 | 02-opencode-core.md | 三.7 章 |
| Config 配置系统 | 02-opencode-core.md | 三.8 章 |
| Plugin 插件系统 | 02-opencode-core.md | 三.9 章 |
| MCP 客户端 | 02-opencode-core.md | 三.10 章 |
| LSP 集成 | 02-opencode-core.md | 三.11 章 |
| Event Bus 事件总线 | 02-opencode-core.md | 三.12 章 |
| Effect 效果系统 | 02-opencode-core.md | 四章 |
| 路由配置 | 03-app-web.md | 三章 |
| 页面组件 | 03-app-web.md | 四章 |
| Context Provider | 03-app-web.md | 五章 |
| 核心组件 | 03-app-web.md | 六章 |
| UI 组件列表 | 04-ui-components.md | 八章 |
| 主题系统 | 04-ui-components.md | 四章 |
| Tauri 架构 | 05-desktop.md | 三章 |
| Rust 后端 | 05-desktop.md | 五章 |
| SDK API | 06-sdk.md | 五章 |
| SDK 生成流程 | 06-sdk.md | 三章 |
| 插件开发 | 07-plugin.md | 五、九章 |

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
| 提供商 | `getModel()` | 获取模型 |
| 代理 | `Agent.get()`, `Agent.list()` | 代理管理 |
| 会话 | `Session.create()`, `Session.get()` | 会话管理 |
| 工具 | `Tool.define()`, `Tool.execute()` | 工具系统 |
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
| 持久化 | `createPersist()` | 本地存储 |

### ui 组件库包

| 组件 | 作用 |
|------|------|
| `Button` | 按钮 |
| `Dialog` | 对话框 |
| `Markdown` | Markdown 渲染 |
| `Icon` | 图标 |
| `List` | 列表 |
| `FileIcon` | 文件类型图标 |
| `ThemeProvider` | 主题上下文 |

### desktop 桌面应用包

| 模块 | 关键函数 | 作用 |
|------|----------|------|
| Rust 入口 | `main()` | 应用启动 |
| 构建器 | `tauri::Builder::default()` | 创建构建器 |
| 插件 | `.plugin()` | 注册插件 |
| 命令 | `.invoke_handler()` | 注册命令 |
| 运行 | `.run()` | 运行应用 |

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
┌─────────────────────────────────────────────────────────┐
│                    用户界面层                              │
│  Desktop (Tauri)  │  App (Web)  │  Console  │  Web (Astro)│
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    共享组件层                              │
│                   UI Components (185+)                    │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    核心业务层                              │
│  Server (Hono)  │  CLI  │  TUI  │  Agent  │  Tool  │ ... │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    基础设施层                              │
│  SDK  │  Bus (PubSub)  │  Storage (SQLite)  │  Util     │
└─────────────────────────────────────────────────────────┘
```

### 包依赖关系

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
    └─────────────────────────────────┘
```

---

## 技术栈汇总

| 层次 | 技术 |
|------|------|
| 语言 | TypeScript (严格模式) |
| 运行时 | Bun 1.3+ |
| 前端框架 | SolidJS 1.9 |
| 样式 | TailwindCSS 4 |
| UI 组件 | @kobalte/core (无头组件) |
| 构建 | Vite 7 |
| 后端框架 | Hono (Web) + Effect (效果系统) |
| 桌面 | Tauri 2.x + Rust |
| 数据库 | SQLite (Drizzle ORM) |
| 包管理 | Bun workspaces + Turbo |
| AI SDK | @ai-sdk/* (20+ 提供商) |

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
| `bun run --cwd packages/desktop tauri dev` | 桌面开发 |
| `bun run --cwd packages/desktop tauri build` | 桌面构建 |

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
| 1.0 | 2026-04-14 | 初始版本 |

---

*本文档由 AI 自动生成，基于对 OpenCode 项目源码的分析。*

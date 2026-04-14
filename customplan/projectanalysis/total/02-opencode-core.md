# OpenCode 核心包 (opencode) 详细分析

## 一、包概览

**包名**: `opencode`  
**路径**: `packages/opencode`  
**版本**: 1.4.3  
**功能**: 核心业务逻辑、CLI 工具、TUI 界面、API 服务器

### 技术栈

| 技术 | 用途 |
|------|------|
| Effect | 类型安全的效果系统 |
| Hono | Web 框架 |
| Yargs | CLI 解析 |
| OpenTUI + SolidJS | TUI 界面 |
| @ai-sdk/* | AI 模型 SDK |
| Drizzle ORM | 数据库 ORM |
| SQLite | 本地存储 |

---

## 二、目录结构

```
packages/opencode/
├── bin/                    # CLI 入口脚本
├── src/                    # 源代码
│   ├── index.ts            # 主入口 (CLI 解析)
│   ├── cli/                # CLI 相关
│   │   ├── cmd/            # 命令实现
│   │   │   ├── run.ts      # 非交互式运行
│   │   │   ├── serve.ts    # 服务器模式
│   │   │   └── tui/        # TUI 相关
│   │   │       ├── thread.ts  # TUI 主线程
│   │   │       ├── worker.ts  # TUI Worker
│   │   │       └── app.tsx    # TUI 应用组件
│   │   └── effect/         # CLI 效果系统
│   ├── server/             # HTTP 服务器
│   │   ├── server.ts       # 服务器实现
│   │   ├── router.ts       # 路由定义
│   │   └── middleware.ts   # 中间件
│   ├── provider/           # AI 模型提供商
│   ├── agent/              # AI 代理
│   ├── session/            # 会话管理
│   ├── tool/               # 工具系统
│   │   ├── bash.ts         # 执行命令
│   │   ├── read.ts         # 读取文件
│   │   ├── write.ts        # 写入文件
│   │   ├── edit.ts         # 编辑文件
│   │   ├── multiedit.ts    # 多位置编辑
│   │   ├── glob.ts         # 文件搜索
│   │   ├── grep.ts         # 内容搜索
│   │   ├── ls.ts           # 目录列表
│   │   ├── webfetch.ts     # URL 获取
│   │   ├── websearch.ts    # Web 搜索
│   │   ├── codesearch.ts   # 代码搜索
│   │   ├── task.ts         # 子代理任务
│   │   ├── skill.ts        # 技能调用
│   │   ├── todo.ts         # 待办事项
│   │   ├── lsp.ts          # LSP 操作
│   │   ├── plan.ts         # 计划管理
│   │   ├── question.ts     # 向用户提问
│   │   └── truncate.ts     # 输出截断
│   ├── config/             # 配置系统
│   ├── plugin/             # 插件系统
│   ├── mcp/                # MCP 客户端
│   ├── lsp/                # LSP 集成
│   ├── bus/                # 事件总线
│   ├── storage/            # 数据库存储
│   ├── permission/         # 权限系统
│   ├── project/            # 项目管理
│   ├── git/                # Git 集成
│   ├── file/               # 文件操作
│   ├── filesystem/         # 文件系统
│   ├── id/                 # ID 生成
│   ├── format/             # 格式化
│   ├── util/               # 工具函数
│   └── ...
├── script/                 # 构建/生成脚本
├── migration/              # 数据库迁移
└── test/                   # 测试
```

---

## 三、核心模块详细分析

### 3.1 主入口 (src/index.ts)

**职责**: CLI 初始化和命令路由

#### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                    CLI 启动流程                          │
└─────────────────────────────────────────────────────────┘

yargs
  │
  ├─ .scriptName("opencode")
  │
  ├─ .options({
  │     "print-logs": { type: "boolean" },
  │     "log-level": { type: "string" },
  │     "pure": { type: "boolean" }
  │   })
  │
  ├─ .middleware([
  │     1. 初始化日志系统
  │     2. Heap 监控
  │     3. 设置环境变量
  │   ])
  │
  ├─ .command(run)         # opencode run <message>
  ├─ .command(serve)       # opencode serve
  ├─ .command(tui/thread)  # opencode $0 (默认)
  ├─ .command(attach)      # opencode attach
  ├─ .command(debug)       # opencode debug
  ├─ .command(models)      # opencode models
  ├─ .command(stats)       # opencode stats
  ├─ .command(mcp)         # opencode mcp
  ├─ .command(github)      # opencode github
  ├─ .command(export)      # opencode export
  ├─ .command(import)      # opencode import
  ├─ .command(session)     # opencode session
  ├─ .command(plugin)      # opencode plugin
  ├─ .command(db)          # opencode db
  │
  └─ .parse()
       │
       ▼
   执行对应命令处理器
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `main()` | 主函数，初始化 CLI |
| `setupLogging()` | 设置日志系统 |
| `runMigration()` | 执行数据库迁移 |

---

### 3.2 CLI 命令模块

#### 3.2.1 run.ts - 非交互式运行

**职责**: 发送消息到 AI 并流式输出结果

##### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                  RunCommand 执行流程                      │
└─────────────────────────────────────────────────────────┘

RunCommand.execute()
  │
  ├─ 1. session()
  │    │
  │    └─ 创建或获取会话
  │
  ├─ 2. execute()
  │    │
  │    ├─ 发送消息到 /chat 端点
  │    │
  │    ├─ 监听 SSE 事件流
  │    │
  │    ├─ 渲染工具调用
  │    │   └─ tool() → 根据工具类型格式化输出
  │    │
  │    └─ 渲染文本输出
  │
  └─ 3. 处理完成/错误事件
```

##### 关键函数

| 函数 | 作用 |
|------|------|
| `RunCommand.execute()` | 主执行函数 |
| `session()` | 创建或继续会话 |
| `execute()` | 主执行循环 |
| `tool()` | 工具调用格式化分发器 |

##### 工具类型处理

```typescript
tool(toolCall) {
  switch (toolCall.type) {
    case "bash":      // 显示执行命令和输出
    case "glob":      // 显示搜索模式和结果
    case "grep":      // 显示搜索内容和匹配
    case "read":      // 显示读取的文件和行数
    case "write":     // 显示写入的文件和字节数
    case "edit":      // 显示编辑的文件和变更数
    case "multiedit": // 显示多编辑结果
    case "ls":        // 显示目录列表
    case "webfetch":  // 显示 URL 和状态码
    case "websearch": // 显示查询和结果数
    case "task":      // 显示子任务状态
    case "skill":     // 显示技能名称
    case "todo":      // 显示待办更新
    case "lsp":       // 显示 LSP 操作
    case "question":  // 显示问题
    default:          // 通用显示
  }
}
```

#### 3.2.2 serve.ts - 服务器模式

**职责**: 启动无头 OpenCode HTTP 服务器

##### 关键函数

| 函数 | 作用 |
|------|------|
| `ServeCommand.handler()` | 启动服务器 |
| `Server.listen()` | 监听端口 |

#### 3.2.3 tui/thread.ts - TUI 主线程

**职责**: 默认命令，启动 TUI 界面

##### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                  TUI 线程启动流程                         │
└─────────────────────────────────────────────────────────┘

ThreadCommand.handler()
  │
  ├─ 1. 创建 Worker 进程
  │    └─ 执行 node worker.js
  │
  ├─ 2. Worker 启动内部服务器
  │    └─ 监听本地随机端口
  │
  ├─ 3. Worker 返回端口信息
  │    └─ 通过 IPC 通道通信
  │
  ├─ 4. TUI 连接到 Worker 服务器
  │    └─ 使用 WebSocket/HTTP
  │
  └─ 5. 渲染 TUI 界面
       └─ app.tsx (SolidJS 组件)
```

##### 关键函数

| 函数 | 作用 |
|------|------|
| `ThreadCommand.handler()` | TUI 主入口 |
| `spawnWorker()` | 创建 Worker 进程 |
| `connectToWorker()` | 连接到 Worker |

#### 3.2.4 tui/worker.ts - TUI Worker

**职责**: 后台工作进程，处理服务器逻辑

##### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                  Worker 启动流程                          │
└─────────────────────────────────────────────────────────┘

Worker.start()
  │
  ├─ 1. 初始化 Hono 应用
  │    └─ Server.Default()
  │
  ├─ 2. 注册所有路由
  │    └─ Router.create()
  │
  ├─ 3. 监听本地端口 (port=0 自动分配)
  │    └─ app.listen({ port: 0 })
  │
  ├─ 4. 获取实际端口
  │    └─ server.address()
  │
  └─ 5. 发送端口信息到父进程
       └─ process.send({ port })
```

##### 关键函数

| 函数 | 作用 |
|------|------|
| `Worker.start()` | Worker 入口 |
| `setupServer()` | 配置服务器 |
| `sendPortToParent()` | 通知端口 |

---

### 3.3 服务器模块 (src/server/)

**职责**: HTTP/WebSocket 服务器实现

#### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Hono 服务器架构                        │
└─────────────────────────────────────────────────────────┘

Hono App
  │
  ├─ 中间件链
  │   │
  │   ├─ cors()              # CORS 处理
  │   │   └─ 允许 localhost, Tauri, opencode.ai
  │   │
  │   ├─ compress()          # 响应压缩
  │   │   └─ 跳过 SSE 端点
  │   │
  │   ├─ basicAuth()         # 基本认证
  │   │   └─ OPENCODE_SERVER_PASSWORD
  │   │
  │   └─ logger()            # 请求日志
  │
  ├─ 路由组
  │   │
  │   ├─ GET  /health        # 健康检查
  │   ├─ GET  /events        # SSE 事件流
  │   ├─ POST /chat          # 聊天请求
  │   ├─ GET  /sessions      # 会话列表
  │   ├─ GET  /sessions/:id  # 会话详情
  │   ├─ POST /sessions      # 创建会话
  │   ├─ DELETE /sessions/:id # 删除会话
  │   ├─ GET  /providers     # 提供商列表
  │   ├─ GET  /models        # 模型列表
  │   ├─ GET  /tools         # 工具列表
  │   ├─ GET  /mcp/status    # MCP 状态
  │   └─ ... (更多 API)
  │
  └─ WebSocket 支持
      └─ @hono/node-ws
```

#### 关键函数

| 函数 | 文件 | 作用 |
|------|------|------|
| `Server.listen(opts)` | server.ts | 启动 HTTP 监听 |
| `Server.Default()` | server.ts | 获取默认服务器实例 |
| `Server.ControlPlaneRoutes()` | router.ts | 注册所有 API 路由 |
| `Router.create()` | router.ts | 创建路由实例 |
| `setupCors()` | middleware.ts | 配置 CORS |
| `setupCompression()` | middleware.ts | 配置压缩 |
| `setupAuth()` | middleware.ts | 配置认证 |

---

### 3.4 Provider 模块 (src/provider/provider.ts)

**职责**: AI 模型提供商管理

#### 支持的提供商 (20+)

```
┌─────────────────────────────────────────────────────────┐
│                  AI 提供商生态                            │
└─────────────────────────────────────────────────────────┘

BUNDLED_PROVIDERS
  │
  ├─ Anthropic (Claude)
  ├─ OpenAI (GPT-4, GPT-3.5)
  ├─ Google (Gemini, Vertex)
  ├─ Azure OpenAI
  ├─ AWS Bedrock
  ├─ OpenRouter
  ├─ XAI (Grok)
  ├─ Mistral
  ├─ Groq
  ├─ Cohere
  ├─ GitHub Copilot
  ├─ GitLab
  ├─ Perplexity
  ├─ TogetherAI
  ├─ Vercel AI Gateway
  ├─ Cerebras
  ├─ Fireworks
  ├─ DeepSeek
  └─ ... (更多)
```

#### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                  模型解析流程                             │
└─────────────────────────────────────────────────────────┘

getModel(providerID, modelID)
  │
  ├─ 1. 查找提供商
  │    └─ BUNDLED_PROVIDERS[providerID]
  │
  ├─ 2. 加载提供商配置
  │    └─ custom() 效果管道
  │       ├─ 解析认证信息
  │       ├─ 解析选项
  │       └─ 模型发现
  │
  ├─ 3. 创建模型实例
  │    └─ provider.languageModel(modelID)
  │
  └─ 4. 返回模型对象
       └─ 可用于 generateText/streamText
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `getModel(providerID, modelID)` | 获取特定模型 |
| `defaultModel()` | 获取默认模型 |
| `getLanguage()` | 获取语言模型实例 |
| `custom()` | 提供商自定义加载器 |
| `listProviders()` | 列出所有提供商 |

#### Amazon Bedrock 特殊处理

```
Amazon Bedrock 模型 ID 解析:
  │
  ├─ 区域前缀自动添加
  │   ├─ us.     (美国)
  │   ├─ eu.     (欧洲)
  │   ├─ jp.     (日本)
  │   ├─ apac.   (亚太)
  │   └─ au.     (澳洲)
  │
  └─ 凭证链支持
      ├─ profile
      ├─ access key
      ├─ bearer token
      └─ 容器凭证
```

---

### 3.5 Agent 模块 (src/agent/agent.ts)

**职责**: AI 代理定义和管理

#### 内置代理

```
┌─────────────────────────────────────────────────────────┐
│                    内置代理列表                           │
└─────────────────────────────────────────────────────────┘

Agent Registry
  │
  ├─ build (primary)
  │   └─ 默认代理，执行工具调用
  │
  ├─ plan (primary)
  │   └─ 计划模式，禁止编辑工具
  │
  ├─ general (subagent)
  │   └─ 通用子代理，并行执行任务
  │
  ├─ explore (subagent)
  │   └─ 代码库探索代理
  │
  ├─ compaction (primary, hidden)
  │   └─ 上下文压缩
  │
  ├─ title (primary, hidden)
  │   └─ 会话标题生成
  │
  └─ summary (primary, hidden)
      └─ 会话摘要生成
```

#### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                  代理获取流程                             │
└─────────────────────────────────────────────────────────┘

Agent.get(name)
  │
  ├─ 1. 检查内置代理
  │    └─ BUILTIN_AGENTS[name]
  │
  ├─ 2. 检查配置代理
  │    └─ Config.get().agent[name]
  │
  ├─ 3. 检查插件代理
  │    └─ Plugin.getAgents()
  │
  └─ 4. 返回代理配置
       └─ { name, mode, tools, description, ... }
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `Agent.get(name)` | 获取代理配置 |
| `Agent.list()` | 列出所有代理 |
| `Agent.defaultAgent()` | 获取默认代理 |
| `Agent.generate()` | AI 辅助生成新代理 |
| `Agent.resolveTools()` | 解析代理可用的工具 |

---

### 3.6 Session 模块 (src/session/index.ts)

**职责**: 会话生命周期管理

#### 数据结构

```typescript
Session.Info = {
  id: SessionID,              // 会话 ID
  slug: string,               // 短链接标识
  projectID: ProjectID,       // 项目 ID
  workspaceID?: WorkspaceID,  // 工作区 ID
  directory: string,          // 工作目录
  parentID?: SessionID,       // 父会话 ID (嵌套会话)
  title: string,              // 会话标题
  version: string,            // 版本号
  summary?: {                 // 变更摘要
    additions: number,
    deletions: number,
    files: number,
    diffs: Diff[]
  },
  share?: {                   // 分享信息
    url: string
  },
  permission?: Permission.Ruleset,  // 权限规则
  revert?: {                  // 回滚信息
    messageID: string,
    partID: string,
    snapshot: string,
    diff: string
  },
  time: {                     // 时间戳
    created: number,
    updated: number,
    compacting?: number,
    archived?: number
  }
}
```

#### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                  会话创建流程                             │
└─────────────────────────────────────────────────────────┘

Session.create(input)
  │
  ├─ 1. 生成会话 ID
  │    └─ ID.generate()
  │
  ├─ 2. 获取项目实例
  │    └─ Instance.current
  │
  ├─ 3. 创建会话记录
  │    └─ DB.insert(sessions, data)
  │
  ├─ 4. 发布创建事件
  │    └─ Bus.publish(Session.Event.Created, { sessionID })
  │
  └─ 5. 返回会话信息
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `Session.create()` | 创建新会话 |
| `Session.fork()` | 分叉会话 |
| `Session.get(id)` | 获取会话信息 |
| `Session.messages()` | 获取消息列表 |
| `Session.setTitle()` | 设置标题 |
| `Session.setPermission()` | 设置权限规则 |
| `Session.remove()` | 删除会话（含子会话） |
| `Session.getUsage()` | 计算使用成本（token/价格） |

---

### 3.7 Tool 模块 (src/tool/)

**职责**: 工具定义和执行

#### 工具注册表架构

```
┌─────────────────────────────────────────────────────────┐
│                    工具注册表                            │
└─────────────────────────────────────────────────────────┘

Tool Registry
  │
  ├─ bash          → 执行 shell 命令
  ├─ read          → 读取文件内容
  ├─ write         → 写入文件
  ├─ edit          → 编辑文件 (diff)
  ├─ multiedit     → 多位置编辑
  ├─ glob          → 文件模式搜索
  ├─ grep          → 内容搜索
  ├─ ls            → 目录列表
  ├─ webfetch      → URL 获取
  ├─ websearch     → Web 搜索 (Exa)
  ├─ codesearch    → 代码搜索 (Exa)
  ├─ task          → 子代理任务调度
  ├─ skill         → 技能调用
  ├─ todo          → 待办事项管理
  ├─ lsp           → LSP 操作
  ├─ plan          → 计划管理
  ├─ question      → 向用户提问
  ├─ truncate      → 输出截断
  └─ ... (更多工具)
```

#### 工具定义接口

```typescript
Tool.Def<Parameters, Metadata> = {
  id: string,                    // 工具 ID
  description: string,           // 工具描述
  parameters: ZodSchema,         // 参数 Schema
  execute(args, ctx): Promise<{  // 执行函数
    title: string,               // 显示标题
    metadata: Metadata,          // 元数据
    output: string,              // 输出内容
    attachments?: Attachment[]   // 附件 (可选)
  }>
}
```

#### 工具定义流程

```
┌─────────────────────────────────────────────────────────┐
│                  工具定义流程                             │
└─────────────────────────────────────────────────────────┘

方式 1: Tool.define(id, def)
  │
  └─ 直接定义
     └─ { id, description, parameters, execute }

方式 2: Tool.defineEffect(id, effect)
  │
  └─ Effect 风格定义
     └─ Effect.gen(function* () { ... })

方式 3: Tool.init(info)
  │
  └─ 初始化工具定义
     └─ 从配置加载
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `Tool.define(id, def)` | 定义工具 |
| `Tool.defineEffect(id, effect)` | 使用 Effect 定义工具 |
| `Tool.init(info)` | 初始化工具定义 |
| `Tool.get(id)` | 获取工具 |
| `Tool.list()` | 列出所有工具 |
| `Tool.execute(id, args)` | 执行工具 |

---

### 3.8 Config 模块 (src/config/config.ts)

**职责**: 配置加载和解析

#### 配置优先级

```
┌─────────────────────────────────────────────────────────┐
│                  配置加载优先级                            │
└─────────────────────────────────────────────────────────┘

优先级 (高 → 低):
  │
  ├─ 1. 系统管理配置
  │    └─ MDM/企业部署
  │
  ├─ 2. 项目配置
  │    └─ .opencode/ 目录
  │       └─ opencode.json
  │       └─ command/**/*.md
  │       └─ agent/**/*.md
  │       └─ modes/*.md
  │       └─ plugins/*.{ts,js}
  │
  └─ 3. 全局配置
       └─ 用户级别
          └─ ~/.config/opencode/opencode.json
```

#### 主要配置项

```typescript
Config.Info = {
  provider?: Record<string, ProviderConfig>,   // AI 提供商
  agent?: Record<string, AgentConfig>,         // 自定义代理
  mcp?: Record<string, McpConfig>,             // MCP 服务器
  plugin?: PluginSpec[],                       // 插件列表
  permission?: Permission,                     // 权限规则
  command?: Record<string, Command>,           // 自定义命令
  instructions?: string[],                     // 指令文件模式
  default_agent?: string,                      // 默认代理
  experimental?: {...},                        // 实验性功能
  keybinds?: Keybinds,                         // TUI 快捷键
  skills?: Skills,                             // 技能配置
}
```

#### 配置加载器

| 函数 | 作用 |
|------|------|
| `Config.load()` | 加载配置 |
| `Config.get()` | 获取配置项 |
| `loadCommand()` | 从 `command/**/*.md` 加载命令 |
| `loadAgent()` | 从 `agent/**/*.md` 加载代理 |
| `loadMode()` | 从 `modes/*.md` 加载模式 |
| `loadPlugin()` | 从 `plugins/*.{ts,js}` 加载插件 |

---

### 3.9 Plugin 模块 (src/plugin/index.ts)

**职责**: 插件系统（扩展点）

#### 内置插件

```
┌─────────────────────────────────────────────────────────┐
│                    内置插件列表                           │
└─────────────────────────────────────────────────────────┘

Plugin Registry
  │
  ├─ CodexAuthPlugin       → Codex 认证
  ├─ CopilotAuthPlugin     → GitHub Copilot 认证
  ├─ GitlabAuthPlugin      → GitLab 认证
  ├─ PoeAuthPlugin         → Poe 认证
  ├─ CloudflareWorkersAuthPlugin    → Cloudflare Workers 认证
  └─ CloudflareAIGatewayAuthPlugin  → Cloudflare AI Gateway 认证
```

#### 插件 Hooks

```typescript
Hooks = {
  "experimental.chat.system.transform": (input, output) => void,
  "experimental.chat.message.transform": (input, output) => void,
  // ... 更多钩子
}
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `Plugin.trigger(name, input, output)` | 触发插件钩子 |
| `Plugin.list()` | 列出已加载钩子 |
| `Plugin.init()` | 初始化插件 |
| `Plugin.load()` | 加载插件文件 |

---

### 3.10 MCP 模块 (src/mcp/index.ts)

**职责**: Model Context Protocol 客户端

#### 支持连接类型

```
┌─────────────────────────────────────────────────────────┐
│                  MCP 连接类型                             │
└─────────────────────────────────────────────────────────┘

MCP Connection
  │
  ├─ local (本地进程)
  │   └─ stdio 传输
  │      └─ 子进程通信
  │
  └─ remote (远程服务器)
      ├─ SSE 传输
      └─ StreamableHTTP 传输
```

#### OAuth 支持

```
┌─────────────────────────────────────────────────────────┐
│                  MCP OAuth 流程                           │
└─────────────────────────────────────────────────────────┘

MCP.startAuth()
  │
  ├─ 1. 动态客户端注册 (RFC 7591)
  │    └─ 向服务器注册客户端
  │
  ├─ 2. 授权请求
  │    └─ 重定向到授权页面
  │
  ├─ 3. 授权码获取
  │    └─ 用户授权后返回授权码
  │
  ├─ 4. 令牌交换
  │    └─ 用授权码交换访问令牌
  │
  └─ 5. OAuth 状态管理
       └─ 存储令牌，自动刷新
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `MCP.status()` | 获取所有 MCP 服务器状态 |
| `MCP.tools()` | 获取所有可用 MCP 工具 |
| `MCP.prompts()` | 获取所有 MCP 提示 |
| `MCP.resources()` | 获取所有 MCP 资源 |
| `MCP.add(name, config)` | 添加 MCP 服务器 |
| `MCP.connect(name)` | 连接 MCP 服务器 |
| `MCP.disconnect(name)` | 断开连接 |
| `MCP.startAuth()` | 启动 OAuth 流程 |

---

### 3.11 LSP 模块 (src/lsp/index.ts)

**职责**: Language Server Protocol 集成

#### 功能

```
┌─────────────────────────────────────────────────────────┐
│                    LSP 功能                               │
└─────────────────────────────────────────────────────────┘

LSP Features
  │
  ├─ 自动检测语言服务器
  │   └─ 根据文件类型匹配
  │
  ├─ 代码符号查找
  │   └─ workspace/symbol
  │
  ├─ 定义跳转
  │   └─ textDocument/definition
  │
  └─ 代码诊断
      └─ textDocument/publishDiagnostics
```

#### 事件

```typescript
LSP.Event.Updated  // LSP 状态更新事件
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `LSP.initialize()` | 初始化 LSP |
| `LSP.symbols()` | 获取代码符号 |
| `LSP.definition()` | 跳转到定义 |
| `LSP.diagnostics()` | 获取诊断信息 |

---

### 3.12 Bus 模块 (src/bus/index.ts)

**职责**: 事件总线（发布/订阅模式）

#### 实现

基于 Effect 的 PubSub

#### 事件类型

```
┌─────────────────────────────────────────────────────────┐
│                    事件类型列表                           │
└─────────────────────────────────────────────────────────┘

Bus Events
  │
  ├─ Session 事件
  │   ├─ session.created
  │   ├─ session.updated
  │   ├─ session.deleted
  │   ├─ session.error
  │   └─ session.diff
  │
  ├─ Message 事件
  │   ├─ message.updated
  │   └─ message.part.updated
  │
  ├─ Permission 事件
  │   └─ permission.asked
  │
  └─ Server 事件
      └─ server.instance.disposed
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `Bus.publish(def, properties)` | 发布事件 |
| `Bus.subscribe(def, callback)` | 订阅特定事件 |
| `Bus.subscribeAll(callback)` | 订阅所有事件 |

---

### 3.13 Storage/DB 模块 (src/storage/db.ts)

**职责**: SQLite 数据库管理

#### 特性

```
┌─────────────────────────────────────────────────────────┐
│                    数据库特性                               │
└─────────────────────────────────────────────────────────┘

Database
  │
  ├─ WAL 模式 (预写日志)
  │   └─ 提高并发性能
  │
  ├─ 自动迁移系统
  │   └─ 启动时检查并执行迁移
  │
  └─ 多通道数据库支持
      └─ 按发布渠道分离 (opencode.db, opencode-beta.db)
```

#### 数据库路径优先级

```
1. OPENCODE_DB 环境变量
2. 按渠道命名 (opencode.db, opencode-beta.db 等)
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `Database.connect()` | 连接数据库 |
| `Database.migrate()` | 执行数据库迁移 |
| `Database.getInstance()` | 获取数据库实例 |

---

### 3.14 Instance 模块 (src/project/instance.ts)

**职责**: 项目实例管理（上下文隔离）

#### 关键概念

```
┌─────────────────────────────────────────────────────────┐
│                  实例上下文                                │
└─────────────────────────────────────────────────────────┘

Instance Context
  │
  ├─ directory    → 工作目录
  ├─ worktree     → Git 工作树根目录
  └─ project      → 项目元数据
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `Instance.provide({ directory, fn })` | 在实例上下文中执行 |
| `Instance.current` | 获取当前实例 |
| `Instance.directory` | 当前工作目录 |
| `Instance.worktree` | 当前工作树 |
| `Instance.reload()` | 重载实例 |
| `Instance.dispose()` | 销毁实例 |
| `Instance.containsPath(filepath)` | 检查路径是否在项目内 |

---

## 四、Effect 效果系统使用

该包大量使用 **Effect** 库进行类型安全的效果管理：

### 服务模式

```typescript
// 1. 定义接口
export interface SessionInterface {
  readonly create: (input?: CreateInput) => Effect.Effect<Info>
  readonly get: (id: SessionID) => Effect.Effect<Info>
  readonly messages: (id: SessionID) => Effect.Effect<Message[]>
}

// 2. 定义服务类
export class SessionService 
  extends ServiceMap.Service<SessionService, SessionInterface>()("@opencode/Session") {}

// 3. 创建 Layer
export const layer = Layer.effect(
  SessionService,
  Effect.gen(function* () {
    function* create(input) { /* 实现 */ }
    function* get(id) { /* 实现 */ }
    function* messages(id) { /* 实现 */ }
    return SessionService.of({ create, get, messages })
  })
)

// 4. 创建运行时
const { runPromise } = makeRuntime(SessionService, defaultLayer)
```

### 关键 Effect 模式

| 模式 | 说明 | 示例 |
|------|------|------|
| `Effect.fn(name)(fn)` | 带追踪的命名函数 | `Effect.fn("Session.create")(fn)` |
| `Effect.gen(fn*)` | 生成器风格效果 | `Effect.gen(function* () { ... })` |
| `Layer.provide()` | 依赖注入 | `pipe(effect, Layer.provide(layer))` |
| `Effect.acquireUseRelease()` | 资源安全管理 | 打开→使用→关闭 |

---

## 五、架构总结

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Entry (yargs)                      │
├─────────────────────────────────────────────────────────┤
│  run.ts  │  serve.ts  │  tui/thread.ts  │  attach.ts     │
├─────────────────────────────────────────────────────────┤
│                    TUI (OpenTUI+SolidJS)                  │
├────────────┬─────────────┬──────────────┬───────────────┤
│  Session   │   Agent     │   Provider   │    Tool       │
│  Manager   │   Manager   │   Registry   │   Registry    │
├────────────┼─────────────┼──────────────┼───────────────┤
│     MCP    │     LSP     │   Config     │   Plugin      │
├────────────┴─────────────┴──────────────┴───────────────┤
│                    Hono HTTP Server                      │
├─────────────────────────────────────────────────────────┤
│                    Event Bus (PubSub)                    │
├─────────────────────────────────────────────────────────┤
│              SQLite (Drizzle ORM) Storage                │
└─────────────────────────────────────────────────────────┘
```

### 设计亮点

1. **客户端/服务器架构**: TUI 通过 Worker 与内部服务器通信，支持远程 `attach`
2. **插件系统**: 通过 Hooks 扩展各种生命周期事件
3. **Effect 效果系统**: 类型安全的错误处理、资源管理、依赖注入
4. **多 AI 提供商**: 统一的 Provider 接口，支持 20+ AI 服务
5. **MCP 集成**: 支持本地/远程 MCP 服务器，含 OAuth 认证
6. **LSP 支持**: 代码智能功能（符号查找、定义跳转）
7. **权限系统**: 细粒度权限控制（文件级别、工具级别）

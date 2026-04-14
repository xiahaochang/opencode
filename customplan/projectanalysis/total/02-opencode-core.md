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
├── bin/                          # CLI 入口脚本
├── src/                          # 源代码
│   ├── index.ts                  # 主入口 (CLI 解析)
│   ├── cli/                      # CLI 相关
│   │   ├── cmd/                  # 命令实现
│   │   │   ├── run.ts            # 非交互式运行
│   │   │   ├── serve.ts          # 服务器模式
│   │   │   ├── attach.ts         # 远程连接
│   │   │   ├── debug.ts          # 调试模式
│   │   │   ├── models.ts         # 模型列表
│   │   │   ├── stats.ts          # 统计信息
│   │   │   ├── mcp.ts            # MCP 管理
│   │   │   ├── github.ts         # GitHub 集成
│   │   │   ├── export.ts         # 导出功能
│   │   │   ├── import.ts         # 导入功能
│   │   │   ├── session.ts        # 会话管理
│   │   │   ├── plugin.ts         # 插件管理
│   │   │   ├── db.ts             # 数据库管理
│   │   │   └── tui/              # TUI 相关
│   │   │       ├── thread.ts     # TUI 主线程
│   │   │       ├── worker.ts     # TUI Worker
│   │   │       └── app.tsx       # TUI 应用组件
│   │   └── effect/               # CLI 效果系统
│   ├── server/                   # HTTP 服务器
│   │   ├── server.ts             # 服务器实现
│   │   ├── router.ts             # 路由定义
│   │   └── middleware.ts         # 中间件
│   ├── provider/                 # AI 模型提供商
│   │   ├── provider.ts           # 提供商管理
│   │   ├── auth.ts               # 提供商认证
│   │   ├── error.ts              # 错误处理
│   │   ├── models.ts             # 模型数据
│   │   ├── transform.ts          # 格式转换
│   │   ├── schema.ts             # 类型定义
│   │   └── sdk/copilot/          # Copilot SDK
│   ├── agent/                    # AI 代理
│   ├── session/                  # 会话管理
│   │   ├── index.ts              # 会话主模块
│   │   ├── compaction.ts         # 会话压缩
│   │   ├── instruction.ts        # 指令文件
│   │   ├── llm.ts                # LLM 流式调用
│   │   ├── message-v2.ts         # 消息 V2
│   │   ├── message.ts            # 消息 V1 (已废弃)
│   │   ├── overflow.ts           # 溢出检测
│   │   ├── processor.ts          # 会话处理器
│   │   ├── prompt.ts             # 提示处理
│   │   ├── retry.ts              # 重试策略
│   │   ├── revert.ts             # 回退
│   │   ├── run-state.ts          # 运行状态
│   │   ├── status.ts             # 会话状态
│   │   ├── summary.ts            # 摘要
│   │   ├── system.ts             # 系统提示
│   │   ├── todo.ts               # 待办事项
│   │   ├── projectors.ts         # 投影器
│   │   ├── schema.ts             # ID 模式
│   │   └── session.sql.ts        # 数据库表
│   ├── tool/                     # 工具系统
│   │   ├── tool.ts               # 核心类型定义
│   │   ├── registry.ts           # 工具注册表
│   │   ├── schema.ts             # 工具 ID Schema
│   │   ├── bash.ts               # 执行命令
│   │   ├── read.ts               # 读取文件
│   │   ├── write.ts              # 写入文件
│   │   ├── edit.ts               # 编辑文件
│   │   ├── multiedit.ts          # 多位置编辑
│   │   ├── glob.ts               # 文件搜索
│   │   ├── grep.ts               # 内容搜索
│   │   ├── ls.ts                 # 目录列表
│   │   ├── webfetch.ts           # URL 获取
│   │   ├── websearch.ts          # Web 搜索
│   │   ├── codesearch.ts         # 代码搜索
│   │   ├── task.ts               # 子代理任务
│   │   ├── skill.ts              # 技能调用
│   │   ├── todo.ts               # 待办更新
│   │   ├── lsp.ts                # LSP 操作
│   │   ├── plan.ts               # 计划管理
│   │   ├── question.ts           # 向用户提问
│   │   ├── apply_patch.ts        # 应用补丁
│   │   ├── invalid.ts            # 无效工具
│   │   ├── truncate.ts           # 输出截断
│   │   ├── truncation-dir.ts     # 截断目录
│   │   ├── external-directory.ts # 外部目录验证
│   │   └── mcp-exa.ts            # Exa MCP 客户端
│   ├── config/                   # 配置系统
│   ├── plugin/                   # 插件系统
│   ├── mcp/                      # MCP 客户端
│   ├── lsp/                      # LSP 集成
│   ├── bus/                      # 事件总线
│   ├── storage/                  # 数据库存储
│   ├── permission/               # 权限系统
│   ├── project/                  # 项目管理
│   ├── git/                      # Git 集成
│   ├── file/                     # 文件操作
│   ├── filesystem/               # 文件系统
│   ├── id/                       # ID 生成
│   ├── format/                   # 格式化
│   ├── flag/                     # 功能标志
│   ├── global/                   # 全局状态
│   ├── shell/                    # Shell 集成
│   ├── util/                     # 工具函数
│   └── ...
├── script/                       # 构建/生成脚本
├── migration/                    # 数据库迁移
└── test/                         # 测试
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
    case "codesearch":// 显示代码搜索结果
    case "task":      // 显示子任务状态
    case "skill":     // 显示技能名称
    case "todo":      // 显示待办更新
    case "lsp":       // 显示 LSP 操作
    case "question":  // 显示问题
    case "apply_patch":// 显示补丁应用结果
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

#### 3.2.5 attach.ts - 远程连接

**职责**: 连接到运行中的 OpenCode 服务器

##### 关键函数

| 函数 | 作用 |
|------|------|
| `AttachCommand.handler()` | 远程连接入口 |

#### 3.2.6 debug.ts - 调试模式

**职责**: 调试模式启动

##### 关键函数

| 函数 | 作用 |
|------|------|
| `DebugCommand.handler()` | 调试模式入口 |

#### 3.2.7 models.ts - 模型列表

**职责**: 列出可用 AI 模型

##### 关键函数

| 函数 | 作用 |
|------|------|
| `ModelsCommand.handler()` | 列出模型 |

#### 3.2.8 stats.ts - 统计信息

**职责**: 显示使用统计信息

##### 关键函数

| 函数 | 作用 |
|------|------|
| `StatsCommand.handler()` | 显示统计 |

#### 3.2.9 mcp.ts - MCP 管理

**职责**: MCP 服务器管理命令

##### 关键函数

| 函数 | 作用 |
|------|------|
| `McpCommand.handler()` | MCP 管理 |

#### 3.2.10 github.ts - GitHub 集成

**职责**: GitHub 集成命令

##### 关键函数

| 函数 | 作用 |
|------|------|
| `GithubCommand.handler()` | GitHub 命令 |

#### 3.2.11 export.ts - 导出功能

**职责**: 导出会话数据

##### 关键函数

| 函数 | 作用 |
|------|------|
| `ExportCommand.handler()` | 导出数据 |

#### 3.2.12 import.ts - 导入功能

**职责**: 导入会话数据

##### 关键函数

| 函数 | 作用 |
|------|------|
| `ImportCommand.handler()` | 导入数据 |

#### 3.2.13 session.ts - 会话管理

**职责**: 会话管理命令

##### 关键函数

| 函数 | 作用 |
|------|------|
| `SessionCommand.handler()` | 会话命令 |

#### 3.2.14 plugin.ts - 插件管理

**职责**: 插件管理命令

##### 关键函数

| 函数 | 作用 |
|------|------|
| `PluginCommand.handler()` | 插件命令 |

#### 3.2.15 db.ts - 数据库管理

**职责**: 数据库管理命令

##### 关键函数

| 函数 | 作用 |
|------|------|
| `DbCommand.handler()` | 数据库命令 |

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
  │   ├─ ErrorMiddleware (onError)     # 全局错误处理
  │   ├─ AuthMiddleware (.use 1)       # 基本认证 (OPENCODE_SERVER_PASSWORD)
  │   ├─ LoggerMiddleware (.use 2)     # 请求日志 (跳过 /log)
  │   ├─ CompressionMiddleware (.use 3)# 响应压缩 (跳过 SSE 端点)
  │   └─ CorsMiddleware (.use 4)       # CORS (localhost, Tauri, opencode.ai)
  │
  ├─ ControlPlaneRoutes() → 挂载在 "/"
  ├─ InstanceRoutes(ws)   → 挂载在 "/" (带 WorkspaceRouterMiddleware)
  └─ UIRoutes()           → 挂载在 "/"
```

#### 完整 API 端点列表 (113 个)

##### 中间件 (6 个)

| 中间件 | 顺序 | 说明 |
|--------|------|------|
| ErrorMiddleware | onError | 全局错误处理，处理 NamedError、NotFoundError、HTTPException |
| AuthMiddleware | 1 | 基本认证中间件，当 Flag.OPENCODE_SERVER_PASSWORD 存在时启用 |
| LoggerMiddleware | 2 | 请求日志记录，跳过 /log 路径 |
| CompressionMiddleware | 3 | 响应压缩，跳过 /event、/global/event、/global/sync-event 以及 POST /session/:id/(message|prompt_async) |
| CorsMiddleware | 4 | CORS 中间件，允许 localhost、tauri://localhost、*.opencode.ai |
| WorkspaceRouterMiddleware | InstanceRoutes 内部 | 工作空间路由中间件，处理 directory/workspace 参数 |

##### Control Plane 路由 (10 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| PUT | `/auth/:providerID` | `auth.set` | 设置认证凭据 |
| DELETE | `/auth/:providerID` | `auth.remove` | 移除认证凭据 |
| GET | `/doc` | - | OpenAPI 文档端点 |
| POST | `/log` | `app.log` | 写入日志 |
| GET | `/global/health` | `global.health` | 健康检查 |
| GET | `/global/event` | `global.event` | 全局事件 SSE 订阅 |
| GET | `/global/config` | `global.config.get` | 获取全局配置 |
| PATCH | `/global/config` | `global.config.update` | 更新全局配置 |
| POST | `/global/dispose` | `global.dispose` | 释放所有实例 |
| POST | `/global/upgrade` | `global.upgrade` | 升级 opencode |

##### Instance 根级端点 (9 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| POST | `/instance/dispose` | `instance.dispose` | 释放当前实例 |
| GET | `/path` | `path.get` | 获取路径信息 |
| GET | `/vcs` | `vcs.get` | 获取 VCS 信息 |
| GET | `/vcs/diff` | `vcs.diff` | 获取 VCS 差异 |
| GET | `/command` | `command.list` | 列出命令 |
| GET | `/agent` | `app.agents` | 列出 Agent |
| GET | `/skill` | `app.skills` | 列出 Skills |
| GET | `/lsp` | `lsp.status` | 获取 LSP 状态 |
| GET | `/formatter` | `formatter.status` | 获取格式化状态 |

##### /project 路由 (4 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/project` | `project.list` | 列出所有项目 |
| GET | `/project/current` | `project.current` | 获取当前项目 |
| POST | `/project/git/init` | `project.initGit` | 初始化 git 仓库 |
| PATCH | `/project/:projectID` | `project.update` | 更新项目 |

##### /config 路由 (3 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/config` | `config.get` | 获取配置 |
| PATCH | `/config` | `config.update` | 更新配置 |
| GET | `/config/providers` | `config.providers` | 列出配置的 Provider |

##### /file 路由 (6 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/find` | `find.text` | 文本搜索 (ripgrep) |
| GET | `/find/file` | `find.files` | 文件搜索 |
| GET | `/find/symbol` | `find.symbols` | 符号搜索 (LSP) |
| GET | `/file` | `file.list` | 列出文件 |
| GET | `/file/content` | `file.read` | 读取文件内容 |
| GET | `/file/status` | `file.status` | 获取文件 git 状态 |

##### /event 路由 (1 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/event` | `event.subscribe` | 订阅实例事件 (SSE) |

##### /pty 路由 (6 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/pty` | `pty.list` | 列出 PTY 会话 |
| POST | `/pty` | `pty.create` | 创建 PTY 会话 |
| GET | `/pty/:ptyID` | `pty.get` | 获取 PTY 会话 |
| PUT | `/pty/:ptyID` | `pty.update` | 更新 PTY 会话 |
| DELETE | `/pty/:ptyID` | `pty.remove` | 删除 PTY 会话 |
| GET | `/pty/:ptyID/connect` | `pty.connect` | WebSocket 连接 PTY |

##### /mcp 路由 (8 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/mcp` | `mcp.status` | 获取 MCP 状态 |
| POST | `/mcp` | `mcp.add` | 添加 MCP 服务器 |
| POST | `/mcp/:name/auth` | `mcp.auth.start` | 启动 MCP OAuth |
| POST | `/mcp/:name/auth/callback` | `mcp.auth.callback` | 完成 MCP OAuth 回调 |
| POST | `/mcp/:name/auth/authenticate` | `mcp.auth.authenticate` | 认证 MCP OAuth (打开浏览器) |
| DELETE | `/mcp/:name/auth` | `mcp.auth.remove` | 移除 MCP OAuth 凭据 |
| POST | `/mcp/:name/connect` | `mcp.connect` | 连接 MCP 服务器 |
| POST | `/mcp/:name/disconnect` | `mcp.disconnect` | 断开 MCP 服务器 |

##### /permission 路由 (2 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| POST | `/permission/:requestID/reply` | `permission.reply` | 回复权限请求 |
| GET | `/permission` | `permission.list` | 列出待处理权限 |

##### /question 路由 (3 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/question` | `question.list` | 列出待处理问题 |
| POST | `/question/:requestID/reply` | `question.reply` | 回复问题 |
| POST | `/question/:requestID/reject` | `question.reject` | 拒绝问题 |

##### /provider 路由 (4 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/provider` | `provider.list` | 列出 Provider |
| GET | `/provider/auth` | `provider.auth` | 获取 Provider 认证方法 |
| POST | `/provider/:providerID/oauth/authorize` | `provider.oauth.authorize` | OAuth 授权 |
| POST | `/provider/:providerID/oauth/callback` | `provider.oauth.callback` | OAuth 回调 |

##### /session 路由 (27 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/session` | `session.list` | 列出会话 |
| GET | `/session/status` | `session.status` | 获取会话状态 |
| GET | `/session/:sessionID` | `session.get` | 获取会话 |
| GET | `/session/:sessionID/children` | `session.children` | 获取子会话 |
| GET | `/session/:sessionID/todo` | `session.todo` | 获取待办 |
| POST | `/session` | `session.create` | 创建会话 |
| DELETE | `/session/:sessionID` | `session.delete` | 删除会话 |
| PATCH | `/session/:sessionID` | `session.update` | 更新会话 |
| POST | `/session/:sessionID/init` | `session.init` | 初始化会话 (已废弃) |
| POST | `/session/:sessionID/fork` | `session.fork` | 分叉会话 |
| POST | `/session/:sessionID/abort` | `session.abort` | 中止会话 |
| POST | `/session/:sessionID/share` | `session.share` | 分享会话 |
| GET | `/session/:sessionID/diff` | `session.diff` | 获取消息差异 |
| DELETE | `/session/:sessionID/share` | `session.unshare` | 取消分享 |
| POST | `/session/:sessionID/summarize` | `session.summarize` | 总结会话 |
| GET | `/session/:sessionID/message` | `session.messages` | 获取消息列表 |
| GET | `/session/:sessionID/message/:messageID` | `session.message` | 获取单条消息 |
| DELETE | `/session/:sessionID/message/:messageID` | `session.deleteMessage` | 删除消息 |
| DELETE | `/session/:sessionID/message/:messageID/part/:partID` | `part.delete` | 删除消息部分 |
| PATCH | `/session/:sessionID/message/:messageID/part/:partID` | `part.update` | 更新消息部分 |
| POST | `/session/:sessionID/message` | `session.prompt` | 发送消息 (流式) |
| POST | `/session/:sessionID/prompt_async` | `session.prompt_async` | 发送异步消息 |
| POST | `/session/:sessionID/command` | `session.command` | 发送命令 |
| POST | `/session/:sessionID/shell` | `session.shell` | 执行 shell 命令 |
| POST | `/session/:sessionID/revert` | `session.revert` | 回退消息 |
| POST | `/session/:sessionID/unrevert` | `session.unrevert` | 恢复回退 |
| POST | `/session/:sessionID/permissions/:permissionID` | `permission.respond` | 响应权限请求 (已废弃) |

##### /tui 路由 (13 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| POST | `/tui/append-prompt` | `tui.appendPrompt` | 追加提示 |
| POST | `/tui/open-help` | `tui.openHelp` | 打开帮助 |
| POST | `/tui/open-sessions` | `tui.openSessions` | 打开会话对话框 |
| POST | `/tui/open-themes` | `tui.openThemes` | 打开主题对话框 |
| POST | `/tui/open-models` | `tui.openModels` | 打开模型对话框 |
| POST | `/tui/submit-prompt` | `tui.submitPrompt` | 提交提示 |
| POST | `/tui/clear-prompt` | `tui.clearPrompt` | 清除提示 |
| POST | `/tui/execute-command` | `tui.executeCommand` | 执行 TUI 命令 |
| POST | `/tui/show-toast` | `tui.showToast` | 显示通知 |
| POST | `/tui/publish` | `tui.publish` | 发布 TUI 事件 |
| POST | `/tui/select-session` | `tui.selectSession` | 选择会话 |
| GET | `/tui/control/next` | `tui.control.next` | 获取下一个 TUI 请求 |
| POST | `/tui/control/response` | `tui.control.response` | 提交 TUI 响应 |

##### /experimental 路由 (11 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/experimental/console` | `experimental.console.get` | 获取 Console 元数据 |
| GET | `/experimental/console/orgs` | `experimental.console.listOrgs` | 列出可切换的 Console 组织 |
| POST | `/experimental/console/switch` | `experimental.console.switchOrg` | 切换 Console 组织 |
| GET | `/experimental/tool/ids` | `tool.ids` | 列出工具 ID |
| GET | `/experimental/tool` | `tool.list` | 列出工具 |
| POST | `/experimental/worktree` | `worktree.create` | 创建工作树 |
| GET | `/experimental/worktree` | `worktree.list` | 列出工作树 |
| DELETE | `/experimental/worktree` | `worktree.remove` | 删除工作树 |
| POST | `/experimental/worktree/reset` | `worktree.reset` | 重置工作树 |
| GET | `/experimental/session` | `experimental.session.list` | 列出所有会话 (全局) |
| GET | `/experimental/resource` | `experimental.resource.list` | 获取 MCP 资源 |

##### /experimental/workspace 子路由 (5 个)

| HTTP 方法 | 完整路径 | Operation ID | 说明 |
|-----------|----------|--------------|------|
| GET | `/experimental/workspace/adaptor` | `experimental.workspace.adaptor.list` | 列出工作区适配器 |
| POST | `/experimental/workspace` | `experimental.workspace.create` | 创建工作区 |
| GET | `/experimental/workspace` | `experimental.workspace.list` | 列出工作区 |
| GET | `/experimental/workspace/status` | `experimental.workspace.status` | 工作区状态 |
| DELETE | `/experimental/workspace/:id` | `experimental.workspace.remove` | 删除工作区 |

##### UI 路由 (1 个)

| HTTP 方法 | 完整路径 | 说明 |
|-----------|----------|------|
| ALL | `/*` | 前端 Web UI (SPA 代理或嵌入式) |

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

#### 内置提供商 (34 个)

| # | NPM 包名 | 创建函数 | 说明 |
|---|----------|----------|------|
| 1 | `@ai-sdk/amazon-bedrock` | `createAmazonBedrock` | AWS Bedrock（Claude、Nova 等） |
| 2 | `@ai-sdk/anthropic` | `createAnthropic` | Anthropic（Claude 系列） |
| 3 | `@ai-sdk/azure` | `createAzure` | Azure OpenAI Service |
| 4 | `@ai-sdk/google` | `createGoogleGenerativeAI` | Google Generative AI（Gemini） |
| 5 | `@ai-sdk/google-vertex` | `createVertex` | Google Vertex AI |
| 6 | `@ai-sdk/google-vertex/anthropic` | `createVertexAnthropic` | Vertex AI 上的 Anthropic |
| 7 | `@ai-sdk/openai` | `createOpenAI` | OpenAI（GPT 系列） |
| 8 | `@ai-sdk/openai-compatible` | `createOpenAICompatible` | OpenAI 兼容 API（通用） |
| 9 | `@openrouter/ai-sdk-provider` | `createOpenRouter` | OpenRouter（多模型聚合） |
| 10 | `@ai-sdk/github-copilot` | `createGitHubCopilotOpenAICompatible` | GitHub Copilot |
| 11 | `@ai-sdk/xai` | `createXai` | xAI（Grok） |
| 12 | `@ai-sdk/mistral` | `createMistral` | Mistral AI |
| 13 | `@ai-sdk/groq` | `createGroq` | Groq（高速推理） |
| 14 | `@ai-sdk/deepinfra` | `createDeepInfra` | DeepInfra |
| 15 | `@ai-sdk/cerebras` | `createCerebras` | Cerebras（Wafer-scale） |
| 16 | `@ai-sdk/cohere` | `createCohere` | Cohere |
| 17 | `@ai-sdk/gateway` | `createGateway` | AI Gateway（多提供商路由） |
| 18 | `@ai-sdk/togetherai` | `createTogetherAI` | Together AI |
| 19 | `@ai-sdk/perplexity` | `createPerplexity` | Perplexity AI |
| 20 | `@ai-sdk/vercel` | `createVercel` | Vercel AI Gateway |
| 21 | `venice-ai-sdk-provider` | `createVenice` | Venice AI |
| 22 | `@ai-sdk/alibaba` | `createAlibaba` | 阿里巴巴（通义千问等） |
| 23 | `gitlab-ai-provider` | `createGitLab` | GitLab Duo AI |
| 24 | `@ai-sdk/github-copilot` | `createGitHubCopilotOpenAICompatible` | GitHub Copilot (responses API) |

##### 特殊加载器配置的提供商 (10 个)

| # | Provider ID | 说明 |
|---|-------------|------|
| 25 | `anthropic` | 添加 beta headers（interleaved-thinking、fine-grained-tool-streaming） |
| 26 | `opencode` | 自身提供商，检查 API key 可用性 |
| 27 | `openai` | 强制使用 responses API |
| 28 | `xai` | 强制使用 responses API |
| 29 | `azure-cognitive-services` | Azure 认知服务（特殊 baseURL） |
| 30 | `sap-ai-core` | SAP AI Core |
| 31 | `zenmux` | Zenmux（类似 OpenRouter 的聚合器） |
| 32 | `cloudflare-workers-ai` | Cloudflare Workers AI |
| 33 | `cloudflare-ai-gateway` | Cloudflare AI Gateway |
| 34 | `kilo` | Kilo Code |

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

#### Provider 命名空间关键函数

| 函数 | 文件 | 作用 |
|------|------|------|
| `Provider.list()` | provider.ts | 列出所有已注册的提供商信息 |
| `Provider.getProvider(providerID)` | provider.ts | 获取指定提供商的详细信息 |
| `Provider.getModel(providerID, modelID)` | provider.ts | 获取指定模型的完整配置 |
| `Provider.getLanguage(model)` | provider.ts | 获取 AI SDK 的 LanguageModelV3 实例 |
| `Provider.closest(providerID, query)` | provider.ts | 模糊匹配最接近的模型 |
| `Provider.getSmallModel(providerID)` | provider.ts | 获取适合快速响应的小型模型 |
| `Provider.defaultModel()` | provider.ts | 获取默认模型（按配置/历史/优先级） |
| `Provider.fromModelsDevProvider(provider)` | provider.ts | 转换 models.dev 格式为内部格式 |
| `Provider.sort(models)` | provider.ts | 按优先级排序模型 |
| `Provider.parseModel(model)` | provider.ts | 解析 "provider/model" 字符串 |

#### ProviderTransform 关键函数

| 函数 | 文件 | 作用 |
|------|------|------|
| `ProviderTransform.message(msgs, model, options)` | transform.ts | 消息格式转换和清洗 |
| `ProviderTransform.temperature(model)` | transform.ts | 推荐 temperature 参数 |
| `ProviderTransform.topP(model)` | transform.ts | 推荐 topP 参数 |
| `ProviderTransform.topK(model)` | transform.ts | 推荐 topK 参数 |
| `ProviderTransform.variants(model)` | transform.ts | 生成推理强度变体配置 |
| `ProviderTransform.options(input)` | transform.ts | 生成提供商特定选项 |
| `ProviderTransform.smallOptions(model)` | transform.ts | 小型模型精简选项 |
| `ProviderTransform.providerOptions(model, options)` | transform.ts | 映射到 AI SDK 命名空间 |
| `ProviderTransform.maxOutputTokens(model)` | transform.ts | 计算最大输出 token 数 |
| `ProviderTransform.schema(model, schema)` | transform.ts | 工具 schema 转换 |

#### ProviderAuth 关键函数

| 函数 | 文件 | 作用 |
|------|------|------|
| `ProviderAuth.methods()` | auth.ts | 获取所有提供商的认证方法 |
| `ProviderAuth.authorize(input)` | auth.ts | 发起认证流程（OAuth） |
| `ProviderAuth.callback(input)` | auth.ts | 处理 OAuth 回调 |

#### ProviderError 关键函数

| 函数 | 文件 | 作用 |
|------|------|------|
| `ProviderError.parseStreamError(input)` | error.ts | 解析流式响应错误 |
| `ProviderError.parseAPICallError(input)` | error.ts | 解析 API 调用错误 |

#### ModelsDev 关键函数

| 函数 | 文件 | 作用 |
|------|------|------|
| `ModelsDev.get()` | models.ts | 获取 models.dev 数据 |
| `ModelsDev.refresh(force)` | models.ts | 刷新 models.dev 缓存 |

---

### 3.5 Agent 模块 (src/agent/agent.ts)

**职责**: AI 代理定义和管理

#### 内置代理 (7 个)

| 代理名 | 模式 | 描述 |
|--------|------|------|
| `build` | primary | 默认代理，执行工具调用 |
| `plan` | primary | 计划模式，禁止编辑工具 |
| `general` | subagent | 通用子代理，并行执行任务 |
| `explore` | subagent | 代码库探索代理 |
| `compaction` | primary | 上下文压缩（隐藏） |
| `title` | primary | 会话标题生成（隐藏） |
| `summary` | primary | 会话摘要生成（隐藏） |

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

### 3.6 Session 模块 (src/session/)

**职责**: 会话生命周期管理

#### Session 主模块 (src/session/index.ts)

##### 关键函数 (23 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `isDefaultTitle` | `(title: string) => boolean` | 判断标题是否为默认格式 |
| `fromRow` | `(row: SessionRow) => Info` | 将数据库行转换为 Session Info |
| `toRow` | `(info: Info) => object` | 将 Session Info 转换为数据库行 |
| `getForkedTitle` | `(title: string) => string` | 生成分叉会话的标题 |
| `plan` | `(input: { slug: string; time: { created: number } }) => string` | 生成计划文件路径 |
| `getUsage` | `(input: { model: Provider.Model; usage: LanguageModelUsage; metadata?: ProviderMetadata }) => { cost: number; tokens: object }` | 计算 token 用量和成本 |
| `create` | `(input?: { parentID?: SessionID; title?: string; permission?: Permission.Ruleset; workspaceID?: WorkspaceID }) => Promise<Info>` | 创建新会话 |
| `fork` | `(input: { sessionID: SessionID; messageID?: MessageID }) => Promise<Info>` | 分叉现有会话 |
| `get` | `(id: SessionID) => Promise<Info>` | 获取会话信息 |
| `setTitle` | `(input: { sessionID: SessionID; title: string }) => Promise<void>` | 设置会话标题 |
| `setArchived` | `(input: { sessionID: SessionID; time?: number }) => Promise<void>` | 设置归档状态 |
| `setPermission` | `(input: { sessionID: SessionID; permission: Permission.Ruleset }) => Promise<void>` | 设置权限规则 |
| `setRevert` | `(input: { sessionID: SessionID; revert: Info["revert"]; summary: Info["summary"] }) => Promise<void>` | 设置回退状态 |
| `messages` | `(input: { sessionID: SessionID; limit?: number }) => Promise<MessageV2.WithParts[]>` | 获取会话消息列表 |
| `children` | `(id: SessionID) => Promise<Info[]>` | 获取子会话列表 |
| `remove` | `(id: SessionID) => Promise<void>` | 删除会话 |
| `updateMessage` | `<T extends MessageV2.Info>(msg: T) => Promise<T>` | 更新消息 |
| `removeMessage` | `(input: { sessionID: SessionID; messageID: MessageID }) => Promise<MessageID>` | 删除消息 |
| `removePart` | `(input: { sessionID: SessionID; messageID: MessageID; partID: PartID }) => Promise<PartID>` | 删除消息部分 |
| `updatePart` | `<T extends MessageV2.Part>(part: T) => Promise<T>` | 更新消息部分 |
| `list` | `(input?: { directory?: string; workspaceID?: WorkspaceID; roots?: boolean; start?: number; search?: string; limit?: number }) => Generator<Info>` | 列出当前项目的会话(生成器) |
| `listGlobal` | `(input?: { directory?: string; roots?: boolean; start?: number; cursor?: number; search?: string; limit?: number; archived?: boolean }) => Generator<GlobalInfo>` | 列出全局会话(生成器) |

##### 内部服务方法

| 方法名 | 签名 | 作用 |
|--------|------|------|
| `touch` | `(sessionID: SessionID) => Effect.Effect<void>` | 更新会话更新时间 |
| `clearRevert` | `(sessionID: SessionID) => Effect.Effect<void>` | 清除回退状态 |
| `setSummary` | `(input: { sessionID: SessionID; summary: Info["summary"] }) => Effect.Effect<void>` | 设置摘要信息 |
| `diff` | `(sessionID: SessionID) => Effect.Effect<Snapshot.FileDiff[]>` | 获取文件差异 |
| `updatePartDelta` | `(input: { sessionID: SessionID; messageID: MessageID; partID: PartID; field: string; delta: string }) => Effect.Effect<void>` | 增量更新部分字段 |
| `getPart` | `(input: { sessionID: SessionID; messageID: MessageID; partID: PartID }) => Effect.Effect<MessageV2.Part \| undefined>` | 获取消息部分 |
| `findMessage` | `(sessionID: SessionID, predicate: (msg: MessageV2.WithParts) => boolean) => Effect.Effect<Option.Option<MessageV2.WithParts>>` | 查找匹配的消息(从新到旧) |

#### SessionCompaction 模块 (src/session/compaction.ts)

##### 关键函数 (4 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `isOverflow` | `(input: { tokens: MessageV2.Assistant["tokens"]; model: Provider.Model }) => Effect.Effect<boolean>` | 判断是否超出上下文限制 |
| `prune` | `(input: { sessionID: SessionID }) => Effect.Effect<void>` | 修剪旧工具调用结果释放空间 |
| `process` | `(input: { parentID: MessageID; messages: MessageV2.WithParts[]; sessionID: SessionID; auto: boolean; overflow?: boolean }) => Effect.Effect<"continue" \| "stop">` | 执行压缩逻辑 |
| `create` | `(input: { sessionID: SessionID; agent: string; model: { providerID: ProviderID; modelID: ModelID }; auto: boolean; overflow?: boolean }) => Effect.Effect<void>` | 创建压缩任务消息 |

#### Instruction 模块 (src/session/instruction.ts)

##### 关键函数 (6 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `clear` | `(messageID: MessageID) => Effect.Effect<void>` | 清除已附加的指令文件记录 |
| `systemPaths` | `() => Effect.Effect<Set<string>, AppFileSystem.Error>` | 获取系统指令文件路径集合 |
| `system` | `() => Effect.Effect<string[], AppFileSystem.Error>` | 读取所有系统指令内容 |
| `find` | `(dir: string) => Effect.Effect<string \| undefined, AppFileSystem.Error>` | 在目录中查找指令文件 |
| `resolve` | `(messages: MessageV2.WithParts[], filepath: string, messageID: MessageID) => Effect.Effect<{ filepath: string; content: string }[], AppFileSystem.Error>` | 解析并读取相关指令文件 |
| `loaded` | `(messages: MessageV2.WithParts[]) => Set<string>` | 提取已加载的指令文件路径 |

#### LLM 模块 (src/session/llm.ts)

##### 关键函数 (2 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `hasToolCalls` | `(messages: ModelMessage[]) => boolean` | 检查消息是否包含工具调用 |
| `stream` | `(input: StreamInput) => Stream.Stream<Event, unknown>` | 流式调用语言模型 |

#### MessageV2 模块 (src/session/message-v2.ts)

##### 关键函数 (11 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `isMedia` | `(mime: string) => boolean` | 判断 MIME 类型是否为媒体文件 |
| `cursor.encode` | `(input: Cursor) => string` | 编码游标为 base64url |
| `cursor.decode` | `(input: string) => Cursor` | 解码 base64url 游标 |
| `toModelMessagesEffect` | `(input: WithParts[], model: Provider.Model, options?: { stripMedia?: boolean }) => Effect.Effect<ModelMessage[]>` | 将消息转换为模型消息(Effect) |
| `toModelMessages` | `(input: WithParts[], model: Provider.Model, options?: { stripMedia?: boolean }) => Promise<ModelMessage[]>` | 将消息转换为模型消息 |
| `page` | `(input: { sessionID: SessionID; limit: number; before?: string }) => { items: WithParts[]; more: boolean; cursor?: string }` | 分页获取消息 |
| `stream` | `(sessionID: SessionID) => Generator<WithParts>` | 流式获取所有消息(生成器) |
| `parts` | `(message_id: MessageID) => MessageV2.Part[]` | 获取消息的所有部分 |
| `get` | `(input: { sessionID: SessionID; messageID: MessageID }) => WithParts` | 获取单条消息 |
| `filterCompacted` | `(msgs: Iterable<WithParts>) => WithParts[]` | 过滤已压缩的消息 |
| `filterCompactedEffect` | `(sessionID: SessionID) => Effect.Effect<WithParts[]>` | 过滤已压缩的消息(Effect) |
| `fromError` | `(e: unknown, ctx: { providerID: ProviderID; aborted?: boolean }) => NonNullable<Assistant["error"]>` | 将错误转换为消息错误格式 |

#### Overflow 模块 (src/session/overflow.ts)

##### 关键函数 (1 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `isOverflow` | `(input: { cfg: Config.Info; tokens: MessageV2.Assistant["tokens"]; model: Provider.Model }) => boolean` | 判断 token 使用是否超出模型上下文限制 |

#### SessionProcessor 模块 (src/session/processor.ts)

##### 关键函数 (1 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `create` | `(input: { assistantMessage: MessageV2.Assistant; sessionID: SessionID; model: Provider.Model }) => Effect.Effect<Handle>` | 创建会话处理器,返回包含 `message`, `updateToolCall`, `completeToolCall`, `process` 的句柄 |

#### SessionPrompt 模块 (src/session/prompt.ts)

##### 关键函数 (8 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `cancel` | `(sessionID: SessionID) => Effect.Effect<void>` | 取消会话正在执行的操作 |
| `prompt` | `(input: PromptInput) => Effect.Effect<MessageV2.WithParts>` | 处理用户提示并启动对话循环 |
| `loop` | `(input: { sessionID: SessionID }) => Effect.Effect<MessageV2.WithParts>` | 运行对话循环 |
| `shell` | `(input: ShellInput) => Effect.Effect<MessageV2.WithParts>` | 执行 shell 命令 |
| `command` | `(input: CommandInput) => Effect.Effect<MessageV2.WithParts>` | 执行预定义命令 |
| `resolvePromptParts` | `(template: string) => Effect.Effect<PromptInput["parts"]>` | 解析提示模板为消息部分 |
| `createStructuredOutputTool` | `(input: { schema: Record<string, any>; onSuccess: (output: unknown) => void }) => AITool` | 创建结构化输出工具 |

##### 导出函数(通过 runPromise 包装)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `prompt` | `(input: PromptInput) => Promise<MessageV2.WithParts>` | 处理用户提示 |
| `resolvePromptParts` | `(template: string) => Promise<PromptInput["parts"]>` | 解析提示模板 |
| `cancel` | `(sessionID: SessionID) => Promise<void>` | 取消操作 |
| `loop` | `(input: { sessionID: SessionID }) => Promise<MessageV2.WithParts>` | 运行循环 |
| `shell` | `(input: ShellInput) => Promise<MessageV2.WithParts>` | 执行 shell 命令 |
| `command` | `(input: CommandInput) => Promise<MessageV2.WithParts>` | 执行命令 |

#### SessionRetry 模块 (src/session/retry.ts)

##### 关键函数 (3 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `delay` | `(attempt: number, error?: MessageV2.APIError) => number` | 计算重试延迟时间(毫秒) |
| `retryable` | `(error: Err) => string \| undefined` | 判断错误是否可重试,返回原因或 undefined |
| `policy` | `(opts: { parse: (error: unknown) => Err; set: (input: { attempt: number; message: string; next: number }) => Effect.Effect<void> }) => Schedule<unknown, unknown>` | 创建重试策略调度器 |

#### SessionRevert 模块 (src/session/revert.ts)

##### 关键函数 (3 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `revert` | `(input: RevertInput) => Effect.Effect<Session.Info>` | 回退到指定消息/部分的状态 |
| `unrevert` | `(input: { sessionID: SessionID }) => Effect.Effect<Session.Info>` | 撤销回退操作 |
| `cleanup` | `(session: Session.Info) => Effect.Effect<void>` | 清理回退相关的消息和部分 |

#### SessionRunState 模块 (src/session/run-state.ts)

##### 关键函数 (4 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `assertNotBusy` | `(sessionID: SessionID) => Effect.Effect<void>` | 断言会话不繁忙,否则抛出 BusyError |
| `cancel` | `(sessionID: SessionID) => Effect.Effect<void>` | 取消会话正在运行的任务 |
| `ensureRunning` | `(sessionID: SessionID, onInterrupt: Effect.Effect<MessageV2.WithParts>, work: Effect.Effect<MessageV2.WithParts>) => Effect.Effect<MessageV2.WithParts>` | 确保任务运行,如已在运行则排队 |
| `startShell` | `(sessionID: SessionID, onInterrupt: Effect.Effect<MessageV2.WithParts>, work: Effect.Effect<MessageV2.WithParts>) => Effect.Effect<MessageV2.WithParts>` | 启动 shell 任务 |

#### SessionStatus 模块 (src/session/status.ts)

##### 关键函数 (3 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `get` | `(sessionID: SessionID) => Effect.Effect<Info>` | 获取会话状态(idle/retry/busy) |
| `list` | `() => Effect.Effect<Map<SessionID, Info>>` | 列出所有会话状态 |
| `set` | `(sessionID: SessionID, status: Info) => Effect.Effect<void>` | 设置会话状态并发布事件 |

#### SessionSummary 模块 (src/session/summary.ts)

##### 关键函数 (4 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `unquoteGitPath` | `(input: string) => string` | 解码 Git 转义的文件路径 |
| `summarize` | `(input: { sessionID: SessionID; messageID: MessageID }) => Effect.Effect<void>` | 生成会话摘要和差异 |
| `diff` | `(input: { sessionID: SessionID; messageID?: MessageID }) => Effect.Effect<Snapshot.FileDiff[]>` | 获取会话文件差异 |
| `computeDiff` | `(input: { messages: MessageV2.WithParts[] }) => Effect.Effect<Snapshot.FileDiff[]>` | 计算消息间的文件差异 |

#### SystemPrompt 模块 (src/session/system.ts)

##### 关键函数 (3 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `provider` | `(model: Provider.Model) => string[]` | 根据模型返回对应的系统提示文本 |
| `environment` | `(model: Provider.Model) => string[]` | 生成环境信息提示 |
| `skills` | `(agent: Agent.Info) => Effect.Effect<string \| undefined>` | 生成技能列表提示 |

#### Todo 模块 (src/session/todo.ts)

##### 关键函数 (2 个)

| 函数名 | 函数签名 | 作用 |
|--------|----------|------|
| `update` | `(input: { sessionID: SessionID; todos: Info[] }) => Effect.Effect<void>` | 更新会话待办事项列表 |
| `get` | `(sessionID: SessionID) => Effect.Effect<Info[]>` | 获取会话待办事项 |

---

### 3.7 Tool 模块 (src/tool/)

**职责**: 工具定义和执行

#### 完整工具列表 (44 个文件: 25 个 .ts + 19 个 .txt)

##### TypeScript 源文件 (25 个)

| 文件 | 工具 ID | 描述 | 主要导出 |
|------|---------|------|----------|
| `apply_patch.ts` | `apply_patch` | 应用补丁/差异文件来修改代码（支持添加、更新、移动、删除文件） | `ApplyPatchTool` |
| `bash.ts` | `bash` | 执行 Bash/PowerShell 命令（支持超时、工作目录、命令解析与权限控制） | `BashTool`, `log` |
| `codesearch.ts` | `codesearch` | 通过 Exa MCP 服务搜索代码上下文（API、库、SDK 示例） | `CodeSearchTool` |
| `edit.ts` | `edit` | 编辑文件中的文本（支持多种替换策略：简单替换、行修剪、块锚点、空白规范化、缩进灵活、转义规范化、多出现替换、修剪边界、上下文感知） | `EditTool`, `trimDiff`, `replace`, `SimpleReplacer`, `LineTrimmedReplacer`, `BlockAnchorReplacer`, `WhitespaceNormalizedReplacer`, `IndentationFlexibleReplacer`, `EscapeNormalizedReplacer`, `MultiOccurrenceReplacer`, `TrimmedBoundaryReplacer`, `ContextAwareReplacer` |
| `external-directory.ts` | 无 | 验证和断言外部目录访问权限的工具函数 | `assertExternalDirectoryEffect`, `assertExternalDirectory` |
| `glob.ts` | `glob` | 使用 glob 模式匹配查找文件 | `GlobTool` |
| `grep.ts` | `grep` | 在文件内容中搜索正则表达式模式 | `GrepTool` |
| `invalid.ts` | `invalid` | 占位工具，用于处理无效的工具调用 | `InvalidTool` |
| `ls.ts` | `list` | 列出目录内容（带忽略模式和树状输出） | `ListTool`, `IGNORE_PATTERNS` |
| `lsp.ts` | `lsp` | 执行 LSP（语言服务器协议）操作（定义跳转、引用查找、悬停信息等） | `LspTool` |
| `mcp-exa.ts` | 无 | 与 Exa MCP 服务通信的辅助函数（用于 websearch 和 codesearch） | `call`, `SearchArgs`, `CodeArgs` |
| `multiedit.ts` | `multiedit` | 对文件执行多次编辑操作（内部调用 edit 工具） | `MultiEditTool` |
| `plan.ts` | `plan_exit` | 退出计划模式，询问用户是否切换到构建代理 | `PlanExitTool` |
| `question.ts` | `question` | 向用户提问以获取澄清或决策 | `QuestionTool` |
| `read.ts` | `read` | 读取文件或目录内容（支持偏移量、限制行数、图片/PDF 读取） | `ReadTool` |
| `registry.ts` | 无 | 工具注册表服务，管理所有内置和自定义工具的注册、初始化和过滤 | `ToolRegistry` (Service, layer, defaultLayer) |
| `schema.ts` | 无 | 工具 ID 的 Schema 定义 | `ToolID` (品牌化的 Schema) |
| `skill.ts` | `skill` | 加载专业技能（提供领域特定指令和工作流） | `SkillTool` |
| `task.ts` | `task` | 调用子代理执行特定任务 | `TaskTool`, `TaskPromptOps` |
| `todo.ts` | `todowrite` | 更新会话中的待办事项列表 | `TodoWriteTool` |
| `tool.ts` | 无 | 工具的核心类型定义和工厂函数（定义、上下文、执行结果等） | `Tool` (define, init, wrap, Context, Def, Info, ExecuteResult) |
| `truncate.ts` | 无 | 工具输出截断服务（当输出过大时写入文件并返回预览） | `Truncate` (Service, layer, defaultLayer, MAX_LINES, MAX_BYTES, DIR, GLOB) |
| `truncation-dir.ts` | 无 | 定义截断输出目录的路径 | `TRUNCATION_DIR` |
| `webfetch.ts` | `webfetch` | 从 URL 获取网页内容（支持 text/markdown/html 格式） | `WebFetchTool` |
| `write.ts` | `write` | 写入文件内容（创建新文件或覆盖现有文件） | `WriteTool` |

##### 文本描述文件 (19 个)

| 文件 | 对应工具 |
|------|---------|
| `apply_patch.txt` | apply_patch |
| `bash.txt` | bash |
| `codesearch.txt` | codesearch |
| `edit.txt` | edit |
| `glob.txt` | glob |
| `grep.txt` | grep |
| `ls.txt` | list |
| `lsp.txt` | lsp |
| `multiedit.txt` | multiedit |
| `plan-enter.txt` | （未在当前代码中使用） |
| `plan-exit.txt` | plan_exit |
| `question.txt` | question |
| `read.txt` | read |
| `task.txt` | task |
| `todowrite.txt` | todowrite |
| `webfetch.txt` | webfetch |
| `websearch.txt` | websearch |
| `write.txt` | write |

#### 内置工具 ID 列表 (19 个)

`apply_patch`, `bash`, `codesearch`, `edit`, `glob`, `grep`, `invalid`, `list`, `lsp`, `multiedit`, `plan_exit`, `question`, `read`, `skill`, `task`, `todowrite`, `webfetch`, `websearch`, `write`

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
│  run  │  serve  │  tui  │  attach  │  debug  │  models   │
│  stats│  mcp    │  github│  export  │  import │  session │
│  plugin│  db    │                                              │
├─────────────────────────────────────────────────────────┤
│                    TUI (OpenTUI+SolidJS)                  │
├────────────┬─────────────┬──────────────┬───────────────┤
│  Session   │   Agent     │   Provider   │    Tool       │
│  Manager   │   Manager   │   Registry   │   Registry    │
├────────────┼─────────────┼──────────────┼───────────────┤
│     MCP    │     LSP     │   Config     │   Plugin      │
├────────────┴─────────────┴──────────────┴───────────────┤
│                    Hono HTTP Server                      │
│  113 API 端点: session(27), tui(13), experimental(16),   │
│  mcp(8), provider(4), permission(2), question(3),        │
│  pty(6), file(6), project(4), config(3), event(1),       │
│  global(10), instance(9), UI(1)                          │
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
4. **多 AI 提供商**: 统一的 Provider 接口，支持 34 个 AI 服务
5. **MCP 集成**: 支持本地/远程 MCP 服务器，含 OAuth 认证
6. **LSP 支持**: 代码智能功能（符号查找、定义跳转）
7. **权限系统**: 细粒度权限控制（文件级别、工具级别）
8. **完整工具系统**: 19 个内置工具，支持自定义扩展
9. **完整 API 端点**: 113 个 REST API 端点，覆盖所有功能

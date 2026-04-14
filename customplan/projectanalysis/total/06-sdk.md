# OpenCode SDK 包 (sdk) 详细分析

## 一、包概览

**包名**: `@opencode-ai/sdk`  
**路径**: `packages/sdk`  
**功能**: 供外部项目使用的 JavaScript SDK，从 OpenAPI 规范自动生成

### 技术栈

| 技术 | 用途 |
|------|------|
| TypeScript | 类型安全 |
| OpenAPI 3.0 | API 规范 |
| 代码生成 | 自动生成客户端 |

---

## 二、完整目录结构

```
packages/sdk/
├── .gitignore
├── openapi.json                                          # OpenAPI 规范
│
└── js/
    ├── package.json
    ├── sst-env.d.ts
    ├── tsconfig.json
    ├── tsconfig.tsbuildinfo
    │
    ├── example/
    │   └── example.ts                                    # 示例代码
    │
    ├── script/
    │   ├── build.ts                                      # 生成脚本
    │   └── publish.ts                                    # 发布脚本
    │
    └── src/
        ├── index.ts                                      # 入口
        ├── client.ts                                     # 客户端
        ├── process.ts                                    # 进程处理
        ├── server.ts                                     # 服务器端
        │
        ├── gen/                                          # v1 生成代码
        │   ├── client.gen.ts
        │   ├── sdk.gen.ts
        │   ├── types.gen.ts
        │   │
        │   ├── client/
        │   │   ├── client.gen.ts
        │   │   ├── index.ts
        │   │   ├── types.gen.ts
        │   │   └── utils.gen.ts
        │   │
        │   └── core/
        │       ├── auth.gen.ts
        │       ├── bodySerializer.gen.ts
        │       ├── params.gen.ts
        │       ├── pathSerializer.gen.ts
        │       ├── queryKeySerializer.gen.ts
        │       ├── serverSentEvents.gen.ts
        │       ├── types.gen.ts
        │       └── utils.gen.ts
        │
        └── v2/                                           # v2 API
            ├── client.ts
            ├── data.ts
            ├── index.ts
            ├── server.ts
            │
            └── gen/                                      # v2 生成代码
                ├── client.gen.ts
                ├── sdk.gen.ts
                ├── types.gen.ts
                │
                ├── client/
                │   ├── client.gen.ts
                │   ├── index.ts
                │   ├── types.gen.ts
                │   └── utils.gen.ts
                │
                └── core/
                    ├── auth.gen.ts
                    ├── bodySerializer.gen.ts
                    ├── params.gen.ts
                    ├── pathSerializer.gen.ts
                    ├── queryKeySerializer.gen.ts
                    ├── serverSentEvents.gen.ts
                    ├── types.gen.ts
                    └── utils.gen.ts
```

### 统计信息

| 类别 | 数量 |
|------|------|
| 根文件 | 2 个 (.gitignore, openapi.json) |
| js/ 配置 | 4 个 (package.json, sst-env.d.ts, tsconfig.json, tsconfig.tsbuildinfo) |
| js/example/ | 1 个示例文件 |
| js/script/ | 2 个脚本 |
| js/src/ | 5 个源文件 (index.ts, client.ts, process.ts, server.ts) |
| js/src/gen/ | 12 个生成文件 (client/, core/) |
| js/src/v2/ | 5 个源文件 (client.ts, data.ts, index.ts, server.ts) |
| js/src/v2/gen/ | 12 个生成文件 |
| **总计** | **38 个文件** |

---

## 三、生成流程

### 3.1 生成流程图

```
┌─────────────────────────────────────────────────────────┐
│                  SDK 生成流程                             │
└─────────────────────────────────────────────────────────┘

1. opencode 核心包定义 API 路由
   └─ src/server/router.ts

2. 生成 OpenAPI 规范
   └─ 运行时自动生成 openapi.json

3. 执行生成脚本
   └─ ./packages/sdk/js/script/build.ts

4. 解析 OpenAPI 规范
   └─ 提取路径、参数、响应类型

5. 生成 TypeScript 代码
   ├─ 客户端类 (SDKClient)
   ├─ 类型定义 (TypeScript interfaces)
   └─ 方法映射 (API 方法)

6. 输出到 gen/client/ 和 gen/core/ 目录
   └─ 生成的代码
```

### 3.2 生成命令

```bash
# 在 packages/sdk/js 目录下
bun run script/build.ts
```

### 3.3 发布命令

```bash
# 发布到 NPM
bun run script/publish.ts
```

---

## 四、核心模块

### 4.1 源文件 (5 个)

| 文件 | 作用 |
|------|------|
| `index.ts` | SDK 入口，导出所有公共 API |
| `client.ts` | HTTP 客户端实现 |
| `process.ts` | 进程处理 |
| `server.ts` | 服务器端工具 |

### 4.2 生成代码结构

#### gen/client/ (4 个文件)

| 文件 | 作用 |
|------|------|
| `client.gen.ts` | 生成的客户端类 |
| `index.ts` | 客户端入口 |
| `types.gen.ts` | 生成的类型定义 |
| `utils.gen.ts` | 生成的工具函数 |

#### gen/core/ (8 个文件)

| 文件 | 作用 |
|------|------|
| `auth.gen.ts` | 认证处理 |
| `bodySerializer.gen.ts` | 请求体序列化 |
| `params.gen.ts` | 参数处理 |
| `pathSerializer.gen.ts` | 路径序列化 |
| `queryKeySerializer.gen.ts` | 查询键序列化 |
| `serverSentEvents.gen.ts` | SSE 流处理 |
| `types.gen.ts` | 核心类型 |
| `utils.gen.ts` | 核心工具 |

---

## 五、SDK 使用

### 5.1 基本使用

```typescript
import { SDK } from "@opencode-ai/sdk"

// 创建 SDK 实例
const sdk = new SDK({
  baseUrl: "http://localhost:3000",
  password: "optional-password"
})

// 调用 API
const sessions = await sdk.sessions.list()
const session = await sdk.sessions.get({ id: "session-id" })
```

### 5.2 事件订阅

```typescript
// 订阅事件
sdk.events.subscribe("session.created", (event) => {
  console.log("Session created:", event)
})

sdk.events.subscribe("message.updated", (event) => {
  console.log("Message updated:", event)
})
```

### 5.3 流式请求

```typescript
// 流式聊天
const stream = sdk.chat.stream({
  message: "Hello",
  sessionID: "session-id"
})

for await (const chunk of stream) {
  console.log(chunk)
}
```

---

## 六、完整 API 列表

### 6.1 API 分类

```
┌─────────────────────────────────────────────────────────┐
│                    SDK API 分类                           │
└─────────────────────────────────────────────────────────┘

SDK
  │
  ├─ sessions        → 会话管理
  │   ├─ list()      → 获取会话列表
  │   ├─ get(id)     → 获取会话详情
  │   ├─ create()    → 创建会话
  │   ├─ update(id)  → 更新会话
  │   └─ delete(id)  → 删除会话
  │
  ├─ messages        → 消息管理
  │   ├─ list(sessionID)  → 获取消息列表
  │   └─ get(id)          → 获取消息详情
  │
  ├─ chat            → 聊天
  │   ├─ send()      → 发送消息
  │   └─ stream()    → 流式发送
  │
  ├─ providers       → 提供商
  │   └─ list()      → 获取提供商列表
  │
  ├─ models          → 模型
  │   └─ list()      → 获取模型列表
  │
  ├─ tools           → 工具
  │   └─ list()      → 获取工具列表
  │
  ├─ mcp             → MCP
  │   ├─ status()    → 获取 MCP 状态
  │   └─ connect()   → 连接 MCP
  │
  └─ events          → 事件
      └─ subscribe() → 订阅事件
```

### 6.2 类型定义

```typescript
// 会话类型
interface Session {
  id: string
  slug: string
  projectID: string
  directory: string
  title: string
  version: string
  time: {
    created: number
    updated: number
  }
}

// 消息类型
interface Message {
  id: string
  sessionID: string
  role: "user" | "assistant" | "system"
  content: string
  parts: MessagePart[]
  time: {
    created: number
  }
}

// 工具调用类型
interface ToolCall {
  id: string
  type: string
  parameters: Record<string, unknown>
  result?: ToolResult
}
```

---

## 七、v2 API

### 7.1 v2 架构

```
┌─────────────────────────────────────────────────────────┐
│                    v2 API 架构                            │
└─────────────────────────────────────────────────────────┘

v2/
  │
  ├─ client.ts         → v2 客户端
  ├─ data.ts           → v2 数据处理
  ├─ server.ts         → v2 服务器端
  ├─ index.ts          → v2 入口
  └─ gen/              → v2 生成代码
      ├─ client/       → v2 客户端生成 (4 个文件)
      └─ core/         → v2 核心生成 (8 个文件)
```

### 7.2 v2 新特性

- 更好的类型推导
- 改进的错误处理
- 支持更多 API 端点
- 优化的流式处理

---

## 八、示例代码

### 8.1 基本示例 (example/example.ts)

```typescript
import { SDK } from "../src"

async function main() {
  const sdk = new SDK({
    baseUrl: "http://localhost:3000"
  })

  // 获取会话列表
  const sessions = await sdk.sessions.list()
  console.log("Sessions:", sessions)

  // 创建新会话
  const session = await sdk.sessions.create({
    directory: "/path/to/project"
  })
  console.log("Created session:", session)

  // 发送消息
  const response = await sdk.chat.send({
    message: "Hello, OpenCode!",
    sessionID: session.id
  })
  console.log("Response:", response)
}

main()
```

### 8.2 流式示例

```typescript
import { SDK } from "../src"

async function main() {
  const sdk = new SDK({
    baseUrl: "http://localhost:3000"
  })

  // 创建会话
  const session = await sdk.sessions.create({
    directory: "/path/to/project"
  })

  // 流式聊天
  const stream = sdk.chat.stream({
    message: "Tell me a story",
    sessionID: session.id
  })

  for await (const chunk of stream) {
    if (chunk.type === "text") {
      process.stdout.write(chunk.content)
    } else if (chunk.type === "tool_call") {
      console.log("\nTool call:", chunk.tool)
    }
  }
}

main()
```

---

## 九、OpenAPI 规范

### 9.1 规范文件

| 文件 | 说明 |
|------|------|
| `openapi.json` | OpenAPI 3.0 规范，定义所有 API 端点 |

### 9.2 规范结构

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "OpenCode API",
    "version": "1.4.3"
  },
  "paths": {
    "/sessions": { "get": {...}, "post": {...} },
    "/sessions/{id}": { "get": {...}, "delete": {...} },
    "/chat": { "post": {...} },
    "/events": { "get": {...} }
  },
  "components": {
    "schemas": {
      "Session": {...},
      "Message": {...},
      "ToolCall": {...}
    }
  }
}
```

---

## 十、架构总结

```
┌─────────────────────────────────────────────────────────┐
│                    SDK 架构                               │
├─────────────────────────────────────────────────────────┤
│                   用户代码                                 │
│              import { SDK } from "@opencode-ai/sdk"       │
├─────────────────────────────────────────────────────────┤
│                   SDK 客户端                              │
│  sessions │ messages │ chat │ providers │ models │ tools │
│  mcp │ events                                              │
├─────────────────────────────────────────────────────────┤
│                   生成代码层                               │
│  gen/ (v1) → 12 个生成文件                                │
│  v2/gen/ (v2) → 12 个生成文件                             │
├─────────────────────────────────────────────────────────┤
│                   核心模块                                 │
│  client.ts │ process.ts │ server.ts │ index.ts           │
├─────────────────────────────────────────────────────────┤
│                   HTTP 层                                 │
│              fetch() → REST API + SSE                     │
├─────────────────────────────────────────────────────────┤
│                   OpenCode Server                         │
│              Hono → 113 个路由端点                         │
└─────────────────────────────────────────────────────────┘
```

### 设计亮点

1. **自动生成**: 从 OpenAPI 规范自动生成，保持同步
2. **类型安全**: 完整的 TypeScript 类型定义
3. **双版本支持**: v1 和 v2 两套 API
4. **流式支持**: 支持 SSE 流式请求
5. **事件订阅**: 实时事件订阅
6. **易于使用**: 简洁的 API 设计
7. **示例代码**: 包含完整使用示例

---

## 十一、开发命令

| 命令 | 说明 |
|------|------|
| `bun run script/build.ts` | 生成 SDK 代码 |
| `bun run script/publish.ts` | 发布到 NPM |
| `bun typecheck` | 类型检查 |

---

## 十二、依赖关系

```
sdk
  │
  └─ (无外部依赖，纯生成代码)
  
app/desktop
  │
  └─ 依赖 sdk → 使用生成的 SDK 客户端
```

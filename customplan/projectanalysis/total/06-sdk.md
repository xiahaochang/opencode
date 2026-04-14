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

## 二、目录结构

```
packages/sdk/
├── js/                          # JavaScript SDK
│   ├── src/
│   │   ├── index.ts             # 入口
│   │   ├── client.ts            # 客户端
│   │   ├── server.ts            # 服务器端
│   │   └── v2/                  # v2 API
│   │       ├── gen/client/      # 生成的客户端代码
│   │       │   ├── index.ts
│   │       │   ├── sdk/
│   │       │   └── types/
│   │       ├── client.ts
│   │       └── server.ts
│   │
│   ├── example/                 # 示例代码
│   │   └── ...
│   │
│   ├── script/                  # 构建脚本
│   │   └── build.ts             # 生成脚本
│   │
│   └── package.json
│
└── openapi.json                 # OpenAPI 规范
```

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

6. 输出到 gen/client/ 目录
   └─ 生成的代码
```

### 3.2 生成命令

```bash
# 在 packages/sdk/js 目录下
bun run script/build.ts
```

---

## 四、SDK 使用

### 4.1 基本使用

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

### 4.2 事件订阅

```typescript
// 订阅事件
sdk.events.subscribe("session.created", (event) => {
  console.log("Session created:", event)
})

sdk.events.subscribe("message.updated", (event) => {
  console.log("Message updated:", event)
})
```

### 4.3 流式请求

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

## 五、核心 API

### 5.1 API 分类

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

### 5.2 类型定义

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

## 六、v2 API

### 6.1 v2 架构

```
┌─────────────────────────────────────────────────────────┐
│                    v2 API 架构                            │
└─────────────────────────────────────────────────────────┘

v2/
  │
  ├─ client.ts         → v2 客户端
  ├─ server.ts         → v2 服务器端
  └─ gen/client/       → 生成的代码
      ├─ index.ts      → 入口
      ├─ sdk/          → SDK 类
      │   └─ ...
      └─ types/        → 类型定义
          └─ ...
```

### 6.2 v2 新特性

- 更好的类型推导
- 改进的错误处理
- 支持更多 API 端点
- 优化的流式处理

---

## 七、示例代码

### 7.1 基本示例

```typescript
// example/basic.ts
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

### 7.2 流式示例

```typescript
// example/stream.ts
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

## 八、OpenAPI 规范

### 8.1 规范结构

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "OpenCode API",
    "version": "1.4.3"
  },
  "paths": {
    "/sessions": {
      "get": { ... },
      "post": { ... }
    },
    "/sessions/{id}": {
      "get": { ... },
      "delete": { ... }
    },
    "/chat": {
      "post": { ... }
    },
    "/events": {
      "get": { ... }
    }
  },
  "components": {
    "schemas": {
      "Session": { ... },
      "Message": { ... },
      "ToolCall": { ... }
    }
  }
}
```

### 8.2 规范生成

规范由 opencode 核心包在运行时生成：

```typescript
// src/server/server.ts
import { generateOpenAPI } from "./openapi"

const openapi = generateOpenAPI({
  title: "OpenCode API",
  version: "1.4.3"
})
```

---

## 九、架构总结

```
┌─────────────────────────────────────────────────────────┐
│                    SDK 架构                               │
├─────────────────────────────────────────────────────────┤
│                   用户代码                                 │
│              import { SDK } from "@opencode-ai/sdk"       │
├─────────────────────────────────────────────────────────┤
│                   SDK 客户端                              │
│  sessions  │  messages  │  chat  │  events  │  ...       │
├─────────────────────────────────────────────────────────┤
│                   HTTP 层                                 │
│              fetch() → REST API                           │
├─────────────────────────────────────────────────────────┤
│                   OpenCode Server                         │
│              Hono → 路由处理                              │
└─────────────────────────────────────────────────────────┘
```

### 设计亮点

1. **自动生成**: 从 OpenAPI 规范自动生成，保持同步
2. **类型安全**: 完整的 TypeScript 类型定义
3. **流式支持**: 支持 SSE 流式请求
4. **事件订阅**: 实时事件订阅
5. **易于使用**: 简洁的 API 设计

---

## 十、开发命令

| 命令 | 说明 |
|------|------|
| `bun run script/build.ts` | 生成 SDK 代码 |
| `bun typecheck` | 类型检查 |

---

## 十一、依赖关系

```
sdk
  │
  └─ (无外部依赖，纯生成代码)
  
app/desktop
  │
  └─ 依赖 sdk → 使用生成的 SDK 客户端
```

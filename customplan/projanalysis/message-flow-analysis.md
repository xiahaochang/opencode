# OpenCode 消息发送与大模型回复流程分析

## 📋 问题描述

用户反馈：输入框发送消息后，大模型显示"思考中"状态但不回复。

---

## 🏗️ 整体架构

OpenCode 采用**客户端/服务器架构**：

| 组件 | 路径 | 说明 |
|------|------|------|
| **前端** | `packages/app` | SolidJS Web 应用，通过 HTTP + SSE 与后端通信 |
| **后端** | `packages/opencode` | 基于 Hono 的 HTTP 服务器 + Effect 函数式编程 |
| **通信** | SSE | Server-Sent Events 实时推送事件流 |

---

## 🔄 消息提交流程（前端 → 后端）

### 关键文件
- `packages/app/src/components/prompt-input/submit.ts` - 消息提交逻辑
- `packages/app/src/context/prompt.tsx` - Prompt 内容管理

### 流程步骤

1. **用户输入消息** → 存储在 `PromptProvider` 上下文
2. **触发提交** → 构建请求 parts（文本、文件、图片等）
3. **乐观更新 UI** → 立即显示用户消息
4. **调用后端 API** → `client.session.promptAsync()`

```typescript
// 核心提交代码
await input.client.session.promptAsync({
  sessionID: input.draft.sessionID,
  agent: input.draft.agent,
  model: input.draft.model,
  messageID,
  parts: requestParts,
  variant: input.draft.variant,
})
```

---

## 🤖 后端处理与 LLM 调用

### 关键文件
- `packages/opencode/src/session/prompt.ts` - 消息处理入口
- `packages/opencode/src/session/processor.ts` - 流式事件处理循环
- `packages/opencode/src/session/llm.ts` - 调用 AI SDK

### 处理流程

1. **SessionProcessor 接收请求**
2. **构建 system prompt** → 合并 agent prompt + system prompt
3. **调用 LLM.stream()** → 使用 Vercel AI SDK 的 `streamText`
4. **流式处理事件** → `Stream.tap((event) => handleEvent(event))`

```typescript
// LLM 流式调用
return streamText({
  temperature: params.temperature,
  tools,
  messages,
  model: wrapLanguageModel({ model: language, middleware: [...] }),
  onError(error) {
    l.error("stream error", { error })
  },
})
```

---

## 📡 SSE 事件流（后端 → 前端）

### 关键文件
- `packages/opencode/src/bus/index.ts` - PubSub 事件系统
- `packages/opencode/src/server/routes/event.ts` - SSE 路由
- `packages/app/src/context/global-sdk.tsx` - 前端 SSE 连接

### 事件流转

```
后端处理事件 → Bus.publish() → GlobalBus.emit() → SSE 路由 → 前端接收
```

### 关键事件类型

| 事件类型 | 说明 |
|---------|------|
| `message.part.updated` | 更新整个 part |
| `message.part.delta` | 流式增量更新（文本追加） |
| `session.status` | 会话状态变更 |
| `reasoning-start` | 开始思考 |
| `reasoning-delta` | 思考内容增量 |

---

## 🎨 前端状态更新与渲染

### 关键文件
- `packages/app/src/context/global-sync/event-reducer.ts` - 事件转状态
- `packages/app/src/pages/session/message-timeline.tsx` - 消息时间线
- `packages/ui/src/components/session-turn.tsx` - 单轮对话渲染
- `packages/ui/src/components/message-part.tsx` - 消息部件渲染

### 状态更新逻辑

```typescript
// 事件处理
case "message.part.delta":
  setStore("part", props.messageID, (parts) =>
    parts.map((p) => {
      if (p.id !== partID) return p
      return { ...p, [field]: (p[field] || "") + delta }
    })
  )
```

---

## 💭 "思考中"状态实现

### 后端 reasoning 事件处理

```typescript
// processor.ts
case "reasoning-start":
  ctx.reasoningMap[value.id] = {
    id: PartID.ascending(),
    type: "reasoning",
    text: "",
    time: { start: Date.now() },
  }
  yield* session.updatePart(ctx.reasoningMap[value.id])

case "reasoning-delta":
  ctx.reasoningMap[value.id].text += value.text
  yield* session.updatePartDelta({...})
```

### 前端显示

```typescript
// i18n/zh.ts
"ui.sessionTurn.status.thinking": "思考中",
"ui.sessionTurn.status.thinkingWithTopic": "思考：{{topic}}",
```

---

## ⚠️ "思考中"不回复的可能原因

### 1️⃣ 模型 API 连接问题（最常见）
- **现象**: 后端发送请求，但模型 API 响应超时或连接中断
- **前端表现**: 收到 `reasoning-start` 显示"思考中"，但未收到后续 delta 事件
- **排查**: 查看后端日志是否有 error 输出

### 2️⃣ SSE 事件流中断
- **现象**: 后端正在处理，但 SSE 连接断开
- **排查**: 浏览器 Network 面板查看 `/event` 连接状态

### 3️⃣ 模型配置问题
- **现象**: API Key 无效/过期，或模型不支持流式输出
- **排查**: 检查 `~/.config/opencode/config.json` 或 `opencode.json`

### 4️⃣ 后端处理卡住
- **现象**: 工具调用死循环、上下文过长、内存不足
- **排查**: `ps aux | grep opencode` 检查进程状态

### 5️⃣ 前端状态更新异常
- **现象**: 事件已接收，但状态更新逻辑有问题
- **排查**: 浏览器 Console 查看是否有 JS 错误

---

## 🛠️ 诊断步骤

### 步骤 1: 检查后端日志
```bash
cd packages/opencode && bun dev 2>&1 | grep -i error
```

### 步骤 2: 检查浏览器控制台
1. F12 打开开发者工具
2. Console 标签查看红色错误
3. Network 标签搜索 `event`，查看 SSE 连接状态

### 步骤 3: 检查模型配置
确认模型 API Key 有效，且模型支持流式输出。

### 步骤 4: 重启服务
```bash
bun dev
```

---

## 📁 关键文件汇总

| 层级 | 文件路径 | 说明 |
|------|---------|------|
| **前端 - 提交** | `packages/app/src/components/prompt-input/submit.ts` | 消息提交逻辑 |
| **前端 - Prompt 状态** | `packages/app/src/context/prompt.tsx` | Prompt 内容管理 |
| **前端 - SSE 连接** | `packages/app/src/context/global-sdk.tsx` | SSE 事件流接收 |
| **前端 - 状态同步** | `packages/app/src/context/global-sync/event-reducer.ts` | 事件转状态 |
| **前端 - 消息渲染** | `packages/app/src/pages/session/message-timeline.tsx` | 消息时间线组件 |
| **前端 - Turn 渲染** | `packages/ui/src/components/session-turn.tsx` | 单轮对话渲染 |
| **前端 - Part 渲染** | `packages/ui/src/components/message-part.tsx` | 消息部件渲染（含 reasoning） |
| **后端 - Session 入口** | `packages/opencode/src/session/prompt.ts` | 消息处理入口 |
| **后端 - 处理器** | `packages/opencode/src/session/processor.ts` | 流式事件处理循环 |
| **后端 - LLM 调用** | `packages/opencode/src/session/llm.ts` | 调用 AI SDK streamText |
| **后端 - SSE 路由** | `packages/opencode/src/server/routes/event.ts` | SSE 事件推送 |
| **后端 - 事件总线** | `packages/opencode/src/bus/index.ts` | PubSub 事件系统 |

---

**分析日期**: 2026-04-13
**分析工具**: Qwen Code Agent
**状态**: ✅ 完成

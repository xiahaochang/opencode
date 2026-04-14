# OpenCode Plugin 插件系统包 (plugin) 详细分析

## 一、包概览

**包名**: `@opencode-ai/plugin`  
**路径**: `packages/plugin`  
**功能**: 插件开发 SDK 和 API

### 技术栈

| 技术 | 用途 |
|------|------|
| TypeScript | 类型安全 |
| Zod | 运行时类型验证 |
| @opencode-ai/sdk | 基础 SDK |
| @opentui/* (可选) | TUI 插件支持 |

---

## 二、完整目录结构

```
packages/plugin/
├── .gitignore
├── package.json
├── sst-env.d.ts
├── tsconfig.json
│
├── script/
│   └── publish.ts                                        # 发布脚本
│
└── src/
    ├── index.ts                                          # 主入口
    ├── example.ts                                        # 示例插件
    ├── example-workspace.ts                              # 工作区示例
    ├── shell.ts                                          # Shell 插件
    ├── tool.ts                                           # 工具定义
    └── tui.ts                                            # TUI 插件
```

### 统计信息

| 类别 | 数量 |
|------|------|
| 根文件 | 4 个 (.gitignore, package.json, sst-env.d.ts, tsconfig.json) |
| script/ | 1 个发布脚本 |
| src/ | 6 个源文件 |
| **总计** | **11 个文件** |

---

## 三、导出入口

### 3.1 主要导出

```
┌─────────────────────────────────────────────────────────┐
│                    Plugin 包导出                          │
└─────────────────────────────────────────────────────────┘

@opencode-ai/plugin
  │
  ├─ 主入口 (.)
  │   └─ src/index.ts
  │      ├─ Plugin 类
  │      ├─ 类型定义
  │      └─ 工具函数
  │
  ├─ 工具入口 (./tool)
  │   └─ src/tool.ts
  │      ├─ Tool.define()
  │      └─ 工具类型
  │
  └─ TUI 入口 (./tui)
      └─ src/tui.ts
         ├─ TUI 组件类型
         └─ TUI 钩子
```

### 3.2 package.json 配置

```json
{
  "name": "@opencode-ai/plugin",
  "exports": {
    ".": "./src/index.ts",
    "./tool": "./src/tool.ts",
    "./tui": "./src/tui.ts"
  }
}
```

---

## 四、源文件分析

### 4.1 src/index.ts - 主入口

**职责**: 插件 SDK 核心导出

**主要导出**:

| 导出 | 类型 | 说明 |
|------|------|------|
| `Plugin` | 类/命名空间 | 插件核心 API |
| `PluginSpec` | 接口 | 插件规范定义 |
| `Hooks` | 类型 | 钩子类型定义 |

### 4.2 src/tool.ts - 工具定义

**职责**: 工具定义 SDK

**主要导出**:

| 导出 | 类型 | 说明 |
|------|------|------|
| `Tool` | 命名空间 | 工具定义工厂 |
| `Tool.define()` | 函数 | 定义新工具 |
| `ToolContext` | 接口 | 工具上下文 |
| `ToolDef` | 接口 | 工具定义 |
| `ToolResult` | 接口 | 工具结果 |

### 4.3 src/tui.ts - TUI 插件

**职责**: TUI 插件 SDK

**主要导出**:

| 导出 | 类型 | 说明 |
|------|------|------|
| `TUI` | 命名空间 | TUI 插件 API |
| `createComponent()` | 函数 | 创建 TUI 组件 |
| `registerHook()` | 函数 | 注册 TUI 钩子 |

### 4.4 src/shell.ts - Shell 插件

**职责**: Shell 相关插件功能

### 4.5 src/example.ts - 示例插件

**职责**: 插件开发示例代码

### 4.6 src/example-workspace.ts - 工作区示例

**职责**: 工作区插件示例

---

## 五、插件架构

### 5.1 插件类型

```
┌─────────────────────────────────────────────────────────┐
│                    插件类型                               │
└─────────────────────────────────────────────────────────┘

Plugin Types
  │
  ├─ 工具插件
  │   └─ 定义新工具 (bash/read/write 等)
  │
  ├─ 提供商插件
  │   └─ 添加新 AI 提供商
  │
  ├─ 代理插件
  │   └─ 定义新 AI 代理
  │
  ├─ MCP 插件
  │   └─ 添加 MCP 服务器
  │
  ├─ 命令插件
  │   └─ 添加自定义命令
  │
  └─ TUI 插件
      └─ 扩展 TUI 界面
```

### 5.2 插件生命周期

```
┌─────────────────────────────────────────────────────────┐
│                  插件生命周期                             │
└─────────────────────────────────────────────────────────┘

1. 加载
   └─ 从 plugins/*.{ts,js} 加载插件文件

2. 初始化
   └─ 调用插件初始化函数
      └─ 注册工具/代理/命令等

3. 运行
   └─ 插件钩子被触发
      ├─ 系统事件
      ├─ 用户操作
      └─ AI 交互

4. 销毁
   └─ 清理资源 (可选)
```

---

## 六、工具插件开发

### 6.1 定义工具

```typescript
import { Tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

// 定义一个自定义工具
export const MyTool = Tool.define("my_tool", {
  description: "我的自定义工具",
  parameters: z.object({
    input: z.string().describe("输入参数")
  }),
  execute: async ({ input }, ctx) => {
    // 执行逻辑
    const result = await doSomething(input)
    
    return {
      title: `执行 my_tool: ${input}`,
      output: result
    }
  }
})
```

### 6.2 工具参数

```typescript
Tool.define(id, {
  description: string,           // 工具描述
  parameters: ZodSchema,         // 参数 Schema
  execute: (args, ctx) => Promise<{
    title: string,               // 显示标题
    output: string,              // 输出内容
    metadata?: object,           // 元数据
    attachments?: Attachment[]   // 附件
  }>
})
```

### 6.3 工具上下文

```typescript
// ctx 参数包含
interface ToolContext {
  sessionID: string              // 当前会话 ID
  messageID: string              // 当前消息 ID
  instance: Instance             // 项目实例
  abortSignal: AbortSignal       // 中止信号
}
```

---

## 七、TUI 插件开发

### 7.1 TUI 组件

```typescript
import { createComponent } from "@opencode-ai/plugin/tui"

// 定义 TUI 组件
export const MyComponent = createComponent(() => {
  // SolidJS 组件逻辑
  return <div>My Plugin UI</div>
})
```

### 7.2 TUI 钩子

```typescript
import { registerHook } from "@opencode-ai/plugin/tui"

// 注册 TUI 钩子
registerHook("tui.sidebar.items", () => {
  return [
    { id: "my_item", label: "My Item", icon: "star" }
  ]
})
```

---

## 八、插件配置

### 8.1 opencode.json 配置

```json
{
  "plugin": [
    "./path/to/plugin.ts",
    "@opencode-ai/some-plugin"
  ]
}
```

### 8.2 插件加载流程

```
┌─────────────────────────────────────────────────────────┐
│                  插件加载流程                             │
└─────────────────────────────────────────────────────────┘

Config.load()
  │
  ├─ 1. 读取 plugin 配置
  │    └─ opencode.json.plugin 数组
  │
  ├─ 2. 加载每个插件文件
  │    ├─ 本地文件: ./path/to/plugin.ts
  │    └─ NPM 包: @opencode-ai/some-plugin
  │
  ├─ 3. 执行插件初始化
  │    └─ 调用插件导出函数
  │
  └─ 4. 注册插件到系统
       └─ 工具/代理/命令等
```

---

## 九、内置插件

### 9.1 认证插件

```
┌─────────────────────────────────────────────────────────┐
│                    内置认证插件                           │
└─────────────────────────────────────────────────────────┘

opencode 核心包内置
  │
  ├─ CodexAuthPlugin       → Codex 认证
  ├─ CopilotAuthPlugin     → GitHub Copilot 认证
  ├─ GitlabAuthPlugin      → GitLab 认证
  ├─ PoeAuthPlugin         → Poe 认证
  └─ CloudflarePlugins     → Cloudflare 认证
```

### 9.2 插件 Hooks

```typescript
// 核心钩子列表
Hooks = {
  // 聊天系统
  "experimental.chat.system.transform": (input, output) => void,
  "experimental.chat.message.transform": (input, output) => void,
  
  // 工具系统
  "tool.before_execute": (tool, args) => void,
  "tool.after_execute": (tool, args, result) => void,
  
  // 会话系统
  "session.created": (session) => void,
  "session.updated": (session) => void,
}
```

---

## 十、插件开发示例

### 10.1 完整示例 (src/example.ts)

```typescript
// my-plugin.ts
import { z } from "zod"
import { Tool } from "@opencode-ai/plugin/tool"

// 1. 定义工具
const WeatherTool = Tool.define("weather", {
  description: "获取天气信息",
  parameters: z.object({
    city: z.string().describe("城市名称")
  }),
  execute: async ({ city }) => {
    const weather = await fetchWeather(city)
    return {
      title: `查询 ${city} 天气`,
      output: `今日 ${city}: ${weather}`
    }
  }
})

// 2. 定义代理
const WeatherAgent = {
  name: "weather_agent",
  description: "天气查询代理",
  tools: [WeatherTool]
}

// 3. 导出插件
export default {
  name: "my-weather-plugin",
  tools: [WeatherTool],
  agents: [WeatherAgent]
}
```

### 10.2 工作区示例 (src/example-workspace.ts)

工作区级别的插件示例。

---

## 十一、类型定义

### 11.1 核心类型

```typescript
// 插件规范
interface PluginSpec {
  name: string                   // 插件名称
  tools?: Tool.Def[]             // 工具列表
  agents?: AgentDef[]            // 代理列表
  commands?: CommandDef[]        // 命令列表
  hooks?: HookDef[]              // 钩子列表
}

// 工具定义
interface ToolDef<Params = any, Meta = any> {
  id: string                     // 工具 ID
  description: string            // 工具描述
  parameters: ZodSchema          // 参数 Schema
  execute: (args: Params, ctx: ToolContext) => Promise<ToolResult<Meta>>
}

// 代理定义
interface AgentDef {
  name: string                   // 代理名称
  description: string            // 代理描述
  mode: "primary" | "subagent"   // 代理模式
  tools?: string[]               // 可用工具
}
```

---

## 十二、脚本文件

### 12.1 publish.ts

**职责**: 发布插件包到 NPM

```bash
bun run script/publish.ts
```

---

## 十三、架构总结

```
┌─────────────────────────────────────────────────────────┐
│                    Plugin 架构                            │
├─────────────────────────────────────────────────────────┤
│                   源文件 (6 个)                            │
│  index.ts │ tool.ts │ tui.ts │ shell.ts                 │
│  example.ts │ example-workspace.ts                       │
├─────────────────────────────────────────────────────────┤
│                   导出入口 (3 个)                          │
│  @opencode-ai/plugin      → index.ts                    │
│  @opencode-ai/plugin/tool → tool.ts                     │
│  @opencode-ai/plugin/tui  → tui.ts                      │
├─────────────────────────────────────────────────────────┤
│                   插件 SDK                                 │
│  Tool.define() │ createComponent() │ registerHook()     │
├─────────────────────────────────────────────────────────┤
│                   插件系统 (opencode 核心)                  │
│  Plugin.load() │ Plugin.trigger() │ Plugin.list()       │
├─────────────────────────────────────────────────────────┤
│                   插件钩子                                 │
│  tool.before_execute │ session.created │ ...            │
├─────────────────────────────────────────────────────────┤
│                   执行环境                                 │
│  工具执行 │ 代理执行 │ 命令执行                            │
└─────────────────────────────────────────────────────────┘
```

### 设计亮点

1. **简洁 API**: 易于开发插件
2. **类型安全**: Zod 运行时验证
3. **热插拔**: 动态加载/卸载
4. **钩子系统**: 扩展生命周期
5. **多类型支持**: 工具/代理/命令/TUI
6. **示例代码**: 包含完整示例

---

## 十四、开发命令

| 命令 | 说明 |
|------|------|
| `bun run script/publish.ts` | 发布到 NPM |
| `bun typecheck` | 类型检查 |

---

## 十五、依赖关系

```
plugin
  │
  ├─ @opencode-ai/sdk    → 基础 SDK
  ├─ zod                 → 类型验证
  └─ @opentui/* (可选)   → TUI 支持
  
opencode (核心)
  │
  └─ 依赖 plugin → 加载和执行插件
```

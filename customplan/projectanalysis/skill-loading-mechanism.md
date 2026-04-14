# OpenCode Skill（技能）加载机制分析

## 📋 功能概述

Skill（技能）是 OpenCode 中一种**专业化的指令和工作流加载机制**，允许用户通过 `SKILL.md` 文件定义特定任务的指令集，系统会自动发现、加载并在 System Prompt 中注入这些技能。

---

## 🏗️ Skill 定义和结构

### 数据结构

**文件**: `packages/opencode/src/skill/index.ts`

```typescript
export const Info = z.object({
  name: z.string(),           // 技能名称
  description: z.string(),    // 技能描述
  location: z.string(),       // SKILL.md 文件的绝对路径
  content: z.string(),        // SKILL.md 的完整内容（不含 frontmatter）
})
```

### Skill 文件格式

每个 skill 是一个包含 `SKILL.md` 的目录，使用 **Markdown + YAML frontmatter** 格式：

```markdown
---
name: module-deploy
description: 模块编译部署任务的专业技能
---

# Module Deploy Skill

## 工作流程

1. 编译模块
2. 运行测试
3. 打包部署
...
```

### 示例文件

**路径**: `packages/opencode/test/fixture/skills/agents-sdk/SKILL.md`

---

## 🔍 Skill 发现和加载机制

### 加载来源（按优先级）

Skill 从以下四个来源扫描加载（`loadSkills` 函数，第 133-188 行）：

#### 1. 全局外部 Skills

```typescript
const EXTERNAL_DIRS = [".claude", ".agents"]
const EXTERNAL_SKILL_PATTERN = "skills/**/SKILL.md"
```

| 来源 | 路径 | 说明 |
|------|------|------|
| **全局 home** | `~/.claude/skills/` | Claude 兼容技能 |
| **全局 home** | `~/.agents/skills/` | Agents 兼容技能 |
| **项目目录** | `<project>/.claude/skills/` | 项目级技能（向上查找到 worktree 边界） |
| **项目目录** | `<project>/.agents/skills/` | 项目级技能 |

> 注：可通过 `Flag.OPENCODE_DISABLE_EXTERNAL_SKILLS` 禁用

#### 2. OpenCode 配置目录

```typescript
const OPENCODE_SKILL_PATTERN = "{skill,skills}/**/SKILL.md"
```

| 来源 | 路径 |
|------|------|
| **项目配置** | `.opencode/skill/` 和 `.opencode/skills/` |
| **额外目录** | 从 `Config.directories()` 获取的自定义目录 |

#### 3. 用户自定义路径

```typescript
// 配置文件中 skills.paths 指定
for (const item of cfg.skills?.paths ?? []) {
  const expanded = item.startsWith("~/") ? path.join(os.homedir(), item.slice(2)) : item
  const dir = path.isAbsolute(expanded) ? expanded : path.join(directory, expanded)
  yield* scan(state, bus, dir, SKILL_PATTERN)
}
```

#### 4. 远程 URL Skills

```typescript
// 配置文件中 skills.urls 指定
for (const url of cfg.skills?.urls ?? []) {
  const pulledDirs = yield* discovery.pull(url)
  for (const dir of pulledDirs) {
    state.dirs.add(dir)
    yield* scan(state, bus, dir, SKILL_PATTERN)
  }
}
```

---

## 🌐 远程 Skill 发现机制 - Discovery 模块

**文件**: `packages/opencode/src/skill/discovery.ts`

### 工作流程

```
用户配置 skills.urls
        │
        ▼
  获取 index.json
  (.well-known/skills/index.json)
        │
        ▼
   解析索引文件
        │
        ▼
   并发下载文件
  (包括必需的 SKILL.md)
        │
        ▼
   缓存到本地
  (Global.Path.cache/skills/{skill_name}/)
```

### 索引文件格式

```typescript
class Index extends Schema.Class<Index>("Index")({
  skills: Schema.Array(IndexSkill),
})

class IndexSkill extends Schema.Class<IndexSkill>("IndexSkill")({
  name: Schema.String,
  files: Schema.Array(Schema.String),  // 该 skill 包含的文件列表
})
```

### 索引 JSON 示例

```json
{
  "skills": [
    {
      "name": "module-deploy",
      "files": ["SKILL.md", "scripts/deploy.sh", "config.yml"]
    },
    {
      "name": "code-review",
      "files": ["SKILL.md", "checklist.md"]
    }
  ]
}
```

### HTTP 客户端重试机制

```typescript
// packages/opencode/src/util/effect-http-client.ts
export const withTransientReadRetry = <E, R>(client) =>
  client.pipe(
    HttpClient.retryTransient({
      retryOn: "errors-and-responses",
      times: 2,
      schedule: Schedule.exponential(200).pipe(Schedule.jittered),
    }),
  )
```

---

## 📝 Skill 注册和调用流程

### 1. Skill 作为 Tool 注册

**文件**: `packages/opencode/src/tool/skill.ts`

```typescript
import { SkillTool } from "./skill"
// SkillTool 在 tool/registry.ts 中注册
```

### 2. Skill 转换为斜杠命令

**文件**: `packages/opencode/src/command/index.ts`

```typescript
for (const item of yield* skill.all()) {
  if (commands[item.name]) continue
  commands[item.name] = {
    name: item.name,
    description: item.description,
    source: "skill",           // 标记来源为 skill
    get template() {
      return item.content      // skill 内容作为模板
    },
    hints: [],
  }
}
```

### 3. Skill 工具执行流程

当 AI 调用 skill 工具时：

```typescript
// SkillTool.execute
async (params, ctx) => {
  // 1. 获取 skill 信息
  const skill = await Skill.get(params.name)
  if (!skill) throw new Error(`Skill not found: ${params.name}`)
  
  // 2. 请求用户权限
  await ctx.ask({ permission: "skill", ... })
  
  // 3. 使用 Ripgrep 扫描 skill 目录下的文件（限制 10 个）
  const files = await rg.scan(skill.location, { limit: 10 })
  
  // 4. 返回 <skill_content> 块
  return {
    title: `Skill: ${skill.name}`,
    metadata: { skill: skill.name },
    output: `<skill_content>
  <name>${skill.name}</name>
  <base_directory>${skill.location}</base_directory>
  <files>
    ${files.map(f => `<file>${f}</file>`).join('\n')}
  </files>
</skill_content>`,
  }
}
```

### 4. System Prompt 中注入 Skills

**文件**: `packages/opencode/src/session/system.ts`

```typescript
export async function skills(agent: Agent.Info) {
  // 检查权限
  if (Permission.disabled(["skill"], agent.permission).has("skill")) return

  // 获取可用 skills
  const list = await Skill.available(agent)
  
  return [
    "Skills provide specialized instructions and workflows for specific tasks.",
    Skill.fmt(list, { verbose: true }),
  ].join("\n")
}
```

---

## 🔗 Skill 与 Agent/Plugin 的关系

### Skill 与 Agent

| 关系 | 说明 |
|------|------|
| **权限控制** | Agent 的 `permission` 字段可以 deny skill |
| **可用过滤** | `Skill.available(agent)` 根据 agent 权限过滤 |
| **配置独立** | Agent schema 不直接包含 skill 配置 |

```typescript
// 权限检查
Permission.evaluate("skill", skill.name, agent_permission)
```

### Skill 与 Plugin

| 特性 | Skill | Plugin |
|------|-------|--------|
| **定义** | `SKILL.md` Markdown 文件 | 独立 JS/TS 模块 |
| **加载** | 文件系统扫描 | Plugin 系统加载 |
| **功能** | 提供指令模板 | 提供自定义 Tool |
| **关系** | Skill 本身也是一种 Tool | Plugin 可以提供 Skill-like 功能 |

---

## ⚠️ 错误处理机制

### Skill 加载失败处理

**文件**: `packages/opencode/src/skill/index.ts` (第 66-78 行)

```typescript
const add = Effect.fnUntraced(function* (state, match, bus) {
  const md = yield* Effect.tryPromise({
    try: () => ConfigMarkdown.parse(match),
    catch: (err) => err,
  }).pipe(
    Effect.catch(
      Effect.fnUntraced(function* (err) {
        const message = ConfigMarkdown.FrontmatterError.isInstance(err)
          ? err.data.message
          : `Failed to parse skill ${match}`
        
        // 发布错误事件
        const { Session } = yield* Effect.promise(() => import("@/session"))
        yield* bus.publish(Session.Event.Error, { 
          error: new NamedError.Unknown({ message }).toObject() 
        })
        
        log.error("failed to load skill", { skill: match, err })
        return undefined  // 跳过该 skill，不阻断其他 skills
      }),
    ),
  )
  // ...
})
```

### 错误处理策略

| 错误类型 | 处理方式 |
|---------|---------|
| **解析失败** | 发布 `Session.Event.Error`，记录日志，跳过该 skill |
| **远程拉取失败** | 记录错误日志，返回空数组，不抛出异常 |
| **路径不存在** | 记录警告日志，继续处理其他路径 |

### Discovery 远程拉取错误

```typescript
// discovery.ts
Effect.catch((err) =>
  Effect.sync(() => {
    log.error("failed to download", { url, err })
    return false  // 不阻断其他 URL 的拉取
  }),
)
```

---

## 🔍 "Skill 失败 - Unable to connect" 错误分析

### 可能原因

| 原因 | 可能性 | 说明 |
|------|-------|------|
| **远程 URL 无法访问** | ⭐⭐⭐⭐⭐ | `skills.urls` 指向的 URL 网络不可达 |
| **index.json 格式错误** | ⭐⭐⭐ | 远程索引文件格式不符合规范 |
| **Skill 文件解析失败** | ⭐⭐ | SKILL.md frontmatter 格式错误 |
| **Skill 路径不存在** | ⭐⭐ | `skills.paths` 指向的目录不存在 |

### 详细分析

#### 1. 远程 URL Skills 拉取失败（最可能）

```typescript
// discovery.ts - pull 方法
const data = yield* HttpClientRequest.get(index).pipe(
  HttpClientRequest.acceptJson,
  http.execute,
  Effect.flatMap(HttpClientResponse.schemaBodyJson(Index)),
  Effect.catch((err) =>
    Effect.sync(() => {
      log.error("failed to fetch index", { url: index, err })
      return null  // 返回 null，不抛出异常
    }),
  ),
)
```

**触发条件**：
- 配置的 URL 服务器不可达
- 网络连接问题
- URL 格式错误
- 防火墙/代理阻止

#### 2. Skill 文件解析失败

```typescript
// SKILL.md 格式必须包含：
---
name: skill-name          # 必填
description: 描述内容     # 必填
---
```

**触发条件**：
- 缺少 `name` 或 `description` 字段
- frontmatter 格式不正确（YAML 语法错误）
- 文件名与 frontmatter 中的 name 不匹配

#### 3. 路径不存在

```typescript
if (!(yield* fsys.isDir(dir))) {
  log.warn("skill path not found", { path: dir })
  continue  // 跳过，不报错
}
```

### 排查步骤

```bash
# 1. 检查配置文件
cat ~/.config/opencode/config.json
# 查找 skills.urls 和 skills.paths

# 2. 测试远程 URL 可访问性
curl -I https://example.com/.well-known/skills/index.json

# 3. 查看后端日志
# 查找 "failed to fetch index" 或 "failed to load skill"

# 4. 检查本地 skill 路径
ls -la ~/.claude/skills/
ls -la .opencode/skills/
```

---

## 📡 Skill API 端点

**文件**: `packages/opencode/src/server/instance.ts`

```typescript
.get(
  "/skill",
  describeRoute({
    summary: "List skills",
    description: "Get a list of all available skills in the OpenCode system.",
    operationId: "app.skills",
    responses: {
      200: { description: "List of skills" },
    },
  }),
  async (c) => {
    const skills = await Skill.all()
    return c.json(skills)
  },
)
```

### SDK 调用

```typescript
// JavaScript SDK
const skills = await sdk.client.app.skills()
// 或
const skills = await sdk.skills()
```

---

## 🎨 前端 Skill 显示

### TUI 前端

**文件**: `cli/cmd/tui/routes/session/index.tsx`

```tsx
function Skill(props: ToolProps<typeof SkillTool>) {
  return (
    <InlineTool icon="→" pending="Loading skill..." complete={props.input.name} part={props.part}>
      Skill "{props.input.name}"
    </InlineTool>
  )
}
```

### Web 前端

**文件**: `app/src/components/prompt-input/slash-popover.tsx`

- Skill 作为**斜杠命令**显示（如 `/module-deploy`）
- 标记 `source: "skill"` 显示"技能"徽章

---

## 📁 关键文件汇总

| 文件路径 | 作用 |
|---------|------|
| `packages/opencode/src/skill/index.ts` | Skill 核心模块：定义、加载、扫描 |
| `packages/opencode/src/skill/discovery.ts` | 远程 URL skill 拉取和缓存 |
| `packages/opencode/src/tool/skill.ts` | SkillTool 定义和执行逻辑 |
| `packages/opencode/src/command/index.ts` | 将 skills 转换为斜杠命令 |
| `packages/opencode/src/session/system.ts` | System prompt 中注入 skills |
| `packages/opencode/src/server/instance.ts` | `/skill` API 端点 |
| `packages/opencode/src/util/effect-http-client.ts` | HTTP 重试机制 |
| `packages/opencode/test/skill/skill.test.ts` | Skill 单元测试 |
| `packages/opencode/test/tool/skill.test.ts` | SkillTool 测试 |
| `packages/sdk/js/src/v2/gen/sdk.gen.ts` | SDK skills() 方法 |

---

## 🔄 Skill 加载流程图

```
应用启动
   │
   ├── 扫描全局技能目录 (~/.claude/skills, ~/.agents/skills)
   ├── 扫描项目技能目录 (.opencode/skills, .claude/skills)
   ├── 加载配置中的 skills.paths
   ├── 拉取配置中的 skills.urls (HTTP)
   │       │
   │       ├── 获取 index.json
   │       ├── 解析索引
   │       ├── 并发下载文件
   │       └── 缓存到本地
   │
   ├── 合并所有技能到 state.dirs
   ├── 扫描每个目录的 SKILL.md
   ├── 解析 frontmatter (name, description)
   ├── 构建 Info 对象
   │
   ├── 注册为 Tool (SkillTool)
   ├── 转换为斜杠命令
   └── 注入 System Prompt
```

---

## 🛠️ 配置示例

### opencode.json 配置

```json
{
  "skills": {
    "paths": [
      "~/my-skills",
      "./custom-skills"
    ],
    "urls": [
      "https://skills.example.com",
      "https://github.com/user/skills"
    ]
  }
}
```

### 目录结构示例

```
.opencode/
└── skills/
    ├── module-deploy/
    │   └── SKILL.md
    ├── code-review/
    │   └── SKILL.md
    └── test-runner/
        ├── SKILL.md
        └── scripts/
            └── run-tests.sh
```

---

**分析日期**: 2026-04-13
**分析工具**: Qwen Code Agent
**状态**: ✅ 完成

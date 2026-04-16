# GRAPH 功能实现 TODO List

> **📚 本文档是 GRAPH 功能系列文档的第 5 部分**
>
> **阅读顺序**：
> 1. ~~01-existing-features.md~~ - 现有功能分析（已完成）
> 2. ~~02-vscode-git-graph-analysis.md~~ - VSCode Git Graph 分析（已完成）
> 3. ~~03-new-feature-requirements.md~~ - 新功能需求（已完成）
> 4. ~~04-graph-page-design.md~~ - 页面设计方案（已完成）
> 5. **05-graph-implementation-todo.md** - 实现 TODO List（**当前执行**）
>
> **当前阶段**：设计方案已完成，准备进入实施阶段
>
> **下一步**：从 Phase 1 开始执行 TODO List

本文档基于现有架构分析，列出 GRAPH 功能的详细实现清单。

---

## 一、架构说明

### 1.1 OpenCode 架构总览

OpenCode 有 **三种运行模式**，但都共用同一套服务器代码：

```
┌─────────────────────────────────────────────────────────────────┐
│                        服务器代码 (opencode)                     │
│  packages/opencode/src/                                         │
│  - Hono HTTP 服务器                                              │
│  - Git 操作封装 (git2)                                          │
│  - VCS 模块                                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   CLI / TUI     │ │   Web App       │ │  Desktop        │
│  直接调用       │ │  HTTP 调用      │ │  HTTP 调用      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 1.2 Desktop-Electron 架构

**desktop-electron** 是 Electron 版本的桌面客户端，架构如下：

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron 主进程                            │
│  packages/desktop-electron/src/main/                        │
│  - server.ts: spawnLocalServer() 启动本地服务器              │
│  - index.ts: 应用生命周期管理                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 内部启动
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              嵌入式服务器 (同 packages/opencode)             │
│  virtual:opencode-server                                     │
│  - 在 Electron 进程内运行                                     │
│  - 监听 localhost:端口                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP 请求
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Electron 渲染进程 (前端)                     │
│  packages/desktop-electron/src/renderer/                    │
│  - 加载 packages/app 构建的 Web UI                           │
│  - 通过 SDK 调用服务器 API                                    │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 关键代码参考

**server.ts** - 启动本地服务器：
```typescript
export async function spawnLocalServer(hostname: string, port: number, password: string) {
  prepareServerEnv(password)
  const { Log, Server } = await import("virtual:opencode-server")
  await Log.init({ level: "WARN" })
  const listener = await Server.listen({
    port,
    hostname,
    username: "opencode",
    password,
  })
  return { listener, health: { wait } }
}
```

**index.ts** - 初始化流程：
```typescript
const port = await getSidecarPort()
const hostname = "127.0.0.1"
const url = `http://${hostname}:${port}`
const password = randomUUID()

// 启动嵌入式服务器
const { listener, health } = await spawnLocalServer(hostname, port, password)
server = listener

// 创建主窗口加载 URL
mainWindow = createMainWindow(globals)
```

### 1.4 架构对比

| 方面 | VSCode | OpenCode CLI | OpenCode Desktop |
|------|--------|--------------|------------------|
| **Git 访问** | 扩展直接调用 git | TS 调用 git2 | 同左（嵌入式） |
| **服务器** | 无 | 独立进程 | Electron 内嵌 |
| **前端** | WebView | 终端 TUI | Chromium |
| **通信** | IPC | 直接调用 | HTTP (localhost) |
| **端口** | N/A | 用户指定 | 动态分配 |

### 1.5 现有 VCS API 参考

**服务器端**: `packages/opencode/src/project/vcs.ts`
```typescript
diff: Effect.fn("Vcs.diff")(function* (mode: Mode) {
  const value = yield* InstanceState.get(state)
  if (Instance.project.vcs !== "git") return []
  if (mode === "git") {
    return yield* track(fs, git, Instance.directory, "HEAD")
  }
  // ...
})
```

**API 路由**: `packages/opencode/src/server/instance/index.ts`
```typescript
{
  operationId: "vcs.diff",
  handler: (c) => yield* vcs.diff(c.req.valid("query").mode)
}
```

**客户端调用**: `packages/app/src/pages/session.tsx`
```typescript
const task = sdk.client.vcs.diff({ mode })
  .then((result) => setVcs("diff", mode, list(result.data)))
```

---

## 二、TODO List

### 数据来源说明

> **重要**：GRAPH 数据与 Git Changes 数据**不是同源**：
> - **Git Changes**：来自 `git status` / `git diff`（未提交的文件变更）
> - **GRAPH**：来自 `git log`（历史提交记录）
>
> 因此需要在后端**新增 Git 命令封装**，不能复用现有的 `diff()` 方法。

---

### Phase 1 - 类型定义与 API 设计

#### 后端类型

- [ ] **T1.1** 在 `packages/opencode/src/project/types.ts` 添加 Git Graph 类型
  ```typescript
  export type GitCommit = {
    hash: string
    short_hash: string
    message: string
    author: string
    author_date: number
    parents: string[]
    refs?: string[]
  }

  export type GitBranch = {
    name: string
    type: "local" | "remote"
    commit_hash: string
  }

  export type GitGraphData = {
    commits: GitCommit[]
    branches: GitBranch[]
    current_branch: string
    lane_map: Record<string, number>
  }
  ```

#### 前端类型

- [ ] **T1.2** 在 `packages/sdk/js/src/v2/gen/types.gen.ts` 添加相同类型
  - 等待运行 `./script/generate.ts` 后自动生成

#### API 设计

- [ ] **T1.3** 设计 API 端点
  ```
  GET /api/v1/git/graph?limit=100&branch=dev
  ```

---

### Phase 2 - 后端实现

> **注意**：需要在现有 `packages/opencode/src/git/index.ts` 中新增方法，不是新建文件。
> 现有 Git 模块已封装了 `git status`、`git diff` 等命令，需要补充 `git log` 相关命令。

#### Git 模块扩展

- [ ] **T2.1** 扩展 `packages/opencode/src/git/index.ts` 的 `Interface` 接口
  - 在 `Interface` 中添加新方法定义
  ```typescript
  export interface Interface {
    // ... 现有方法
    
    // 新增：获取提交历史
    readonly log: (cwd: string, limit: number) => Effect.Effect<Commit[]>
    
    // 新增：获取分支列表
    readonly getBranches: (cwd: string) => Effect.Effect<Branch[]>
    
    // 新增：获取当前分支
    readonly getCurrentBranch: (cwd: string) => Effect.Effect<string>
  }
  ```

- [ ] **T2.2** 实现 `log()` 方法
  ```typescript
  // 使用 git log 命令获取提交历史
  // git log --format={"hash":"%H","shortHash":"%h","message":"%s","author":"%an","authorDate":"%at"} -n <limit>
  export const log = Effect.fn("Git.log")(function* (
    cwd: string,
    limit: number = 100
  ) {
    // 调用 git log 命令，解析 JSON 输出
    // 返回 Commit[]
  })
  ```

- [ ] **T2.3** 实现 `getBranches()` 方法
  ```typescript
  // 使用 git branch -a 命令获取所有分支
  export const getBranches = Effect.fn("Git.getBranches")(function* (
    cwd: string
  ) {
    // 解析 git branch -a 输出
    // 返回 Branch[]（区分本地分支和远程分支）
  })
  ```

- [ ] **T2.4** 实现 `getCurrentBranch()` 方法
  ```typescript
  // 使用 git rev-parse --abbrev-ref HEAD 获取当前分支
  export const getCurrentBranch = Effect.fn("Git.getCurrentBranch")(function* (
    cwd: string
  ) {
    // 返回当前分支名
  })
  ```

- [ ] **T2.5** 实现泳道计算 `computeLanes()`
  ```typescript
  export const computeLanes = (commits: GitCommit[]) => {
    const laneMap = new Map<string, number>()
    const lanePool: number[] = []
    let nextLane = 0
    
    for (const commit of commits) {
      const parentLanes = commit.parents
        .map((p) => laneMap.get(p))
        .filter((l): l is number => l !== undefined)
      
      if (parentLanes.length > 0) {
        laneMap.set(commit.hash, parentLanes[0])
        parentLanes.slice(1).forEach((l) => lanePool.push(l))
      } else {
        const lane = lanePool.pop() ?? nextLane++
        laneMap.set(commit.hash, lane)
      }
    }
    
    return laneMap
  }
  ```

#### VCS 模块扩展

- [ ] **T2.6** 修改 `packages/opencode/src/project/vcs.ts`
  - 添加 `graph()` 方法
  
  ```typescript
  graph: Effect.fn("Vcs.graph")(function* (options?: {
    limit?: number
  }) {
    const dir = Instance.directory
    const commits = yield* git.log(dir, options?.limit ?? 100)
    const branches = yield* git.getBranches(dir)
    const currentBranch = yield* git.getCurrentBranch(dir)
    const laneMap = computeLanes(commits)
    
    return {
      commits,
      branches,
      current_branch: currentBranch,
      lane_map: laneMap,
    }
  })
  ```

#### API 路由注册

- [ ] **T2.7** 修改 `packages/opencode/src/server/instance/index.ts`
  - 添加新路由
  
  ```typescript
  app.get(
    "/api/v1/git/graph",
    zValidator("query", z.object({
      limit: z.coerce.number().optional(),
      branch: z.string().optional(),
    })),
    Effect.fn("http.git.graph", function* (c) {
      const query = c.req.valid("query")
      const data = yield* vcs.graph(query)
      return c.json(data)
    }),
  )
  ```

#### OpenAPI 规范

- [ ] **T2.8** 运行生成脚本自动更新
  ```bash
  bun run ./packages/sdk/script/generate.ts
  ```

---

### Phase 3 - SDK 生成

#### 生成 SDK

- [ ] **T3.1** 运行生成脚本
  ```bash
  bun run ./packages/sdk/script/generate.ts
  ```

- [ ] **T3.2** 验证生成的类型
  - 检查 `packages/sdk/js/src/v2/gen/types.gen.ts`
  - 确认 `GitGraphData`、`GitCommit` 等类型已生成

- [ ] **T3.3** 验证 SDK 客户端方法
  ```typescript
  // 应该可以这样调用
  sdk.client.git.graph({ limit: 100 })
  ```

---

### Phase 4 - 前端组件实现

#### 基础组件

- [ ] **T4.1** 创建 `packages/ui/src/components/git-graph/git-graph.tsx`
  - 主组件入口
  - 负责数据加载和状态管理

- [ ] **T4.2** 创建 `packages/ui/src/components/git-graph/git-graph-header.tsx`
  - 工具栏：刷新、视图切换、更多菜单

- [ ] **T4.3** 创建 `packages/ui/src/components/git-graph/commit-row.tsx`
  - 单个提交行渲染
  - 包含：节点圆点、提交信息、作者、分支标签

- [ ] **T4.4** 创建 `packages/ui/src/components/git-graph/commit-detail.tsx`
  - 点击后显示的详情面板

- [ ] **T4.5** 创建 `packages/ui/src/components/git-graph/hover-preview.tsx`
  - 悬停预览浮层（使用 Portal）

- [ ] **T4.6** 创建 `packages/ui/src/components/git-graph/lane-lines.tsx`
  - SVG 绘制分支连接线

- [ ] **T4.7** 创建 `packages/ui/src/components/git-graph/types.ts`
  - 前端扩展类型定义

#### 样式文件

- [ ] **T4.8** 创建 `packages/ui/src/components/git-graph/git-graph.css`
  - CSS 变量定义（分支颜色、标签颜色等）

#### 核心逻辑

- [ ] **T4.9** 实现泳道颜色分配
  ```typescript
  const BRANCH_COLORS = [
    "#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5",
    "#8E24AA", "#F4511E", "#5E35B1", "#00ACC1", "#7CB342",
  ]
  
  const getLaneColor = (lane: number) => 
    BRANCH_COLORS[lane % BRANCH_COLORS.length]
  ```

- [ ] **T4.10** 实现虚拟滚动（使用 @tanstack/solid-virtual）
  ```typescript
  import { createVirtualizer } from "@tanstack/solid-virtual"
  
  const virtualizer = createVirtualizer(() => ({
    count: data?.commits.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  }))
  ```

- [ ] **T4.11** 实现悬停预览逻辑
  - 鼠标移入显示浮层
  - 浮层位置跟随鼠标

- [ ] **T4.12** 实现点击详情逻辑
  - 点击提交 → 显示详情面板
  - 详情面板可关闭

#### 组件导出

- [ ] **T4.13** 修改 `packages/ui/src/components/index.ts`
  - 导出 `GitGraph` 组件

---

### Phase 5 - 集成到 Session 页面

#### 修改 session.tsx

- [ ] **T5.1** 导入 GitGraph 组件
  ```typescript
  import { GitGraph } from "@opencode/ui"
  ```

- [ ] **T5.2** 修改 `reviewContent()` 函数
  ```typescript
  const reviewContent = (input: {...}) => (
    <Show when={!store.deferRender}>
      <Show when={store.changes !== "graph"}>
        {/* 原有 SessionReviewTab */}
      </Show>
      
      <Show when={store.changes === "graph"}>
        <GitGraph class="h-full" />
      </Show>
    </Show>
  )
  ```

- [ ] **T5.3** 验证类型定义已更新
  - `ChangeMode = "git" | "branch" | "turn" | "graph"`

---

### Phase 6 - 测试与优化

#### 功能测试

- [ ] **T6.1** 测试数据加载
  - 有 Git 仓库时正常显示
  - 无 Git 仓库时显示空状态

- [ ] **T6.2** 测试分支切换
  - 切换不同模式时正确渲染

- [ ] **T6.3** 测试悬停预览
  - 鼠标移入显示预览
  - 预览内容正确

- [ ] **T6.4** 测试点击详情
  - 点击提交显示详情
  - 详情面板可关闭

#### 性能优化

- [ ] **T6.5** 实现数据缓存
  ```typescript
  const [cache, setCache] = makePersisted(
    createStore({ data: undefined, timestamp: 0 }),
    { name: "git-graph-cache" }
  )
  
  const CACHE_TTL = 5 * 60 * 1000  // 5 分钟
  ```

- [ ] **T6.6** 优化虚拟滚动
  - 调整 `overscan` 参数
  - 测试大数据量性能

- [ ] **T6.7** 添加加载状态
  - 加载时显示骨架屏
  - 错误时显示提示

---

### Phase 7 - 文档与清理

#### 文档

- [ ] **T7.1** 更新 `README.md`
  - 添加 GRAPH 功能说明

- [ ] **T7.2** 编写使用文档
  - 如何启用 GRAPH 视图
  - 快捷键说明（如有）

#### 代码清理

- [ ] **T7.3** 运行类型检查
  ```bash
  cd packages/app && bun typecheck
  cd packages/ui && bun typecheck
  cd packages/opencode && bun typecheck
  ```

- [ ] **T7.4** 运行代码格式化
  ```bash
  bun run format
  ```

- [ ] **T7.5** 清理未使用的导入

---

## 三、关键技术点对比

### 3.1 VSCode vs OpenCode 实现对比

| 功能 | VSCode | OpenCode CLI | OpenCode Desktop-Electron |
|------|--------|--------------|---------------------------|
| **Git 访问** | 扩展直接调用 `git` 命令 | TS 调用 git2/git 命令 | 同左（嵌入式服务器） |
| **服务器** | 无 | 独立进程 | Electron 主进程内嵌 |
| **数据传输** | 内存直接访问 | HTTP (localhost) | HTTP (localhost) |
| **类型定义** | 手动 TypeScript 类型 | OpenAPI 自动生成 | 同左 |
| **泳道计算** | JavaScript 前端 | TypeScript 前端 | 同左 |
| **UI 渲染** | WebView (Chromium) | 终端 TUI | Chromium (Electron) |

### 3.2 架构对比

```
VSCode 架构:
┌──────────────┐
│   扩展进程   │ ← 直接调用 git 命令
│  (Extension) │
└──────────────┘
       │
       │ 直接访问
       ▼
┌──────────────┐
│   Git 仓库   │
└──────────────┘

OpenCode Desktop-Electron 架构:
┌──────────────────┐
│  Electron 主进程  │ ← 启动嵌入式服务器
└──────────────────┘
         │
         │ 内部调用
         ▼
┌──────────────────┐
│  嵌入式服务器    │ ← 调用 git2/git 命令
│  (opencode)      │
└──────────────────┘
         │
         │ HTTP
         ▼
┌──────────────────┐
│ Electron 渲染进程 │ ← 前端 UI
│   (SolidJS)      │
└──────────────────┘
```

### 3.3 为什么 OpenCode 有服务器层？

**原因**：
1. **代码复用**：CLI、Web、Desktop 共用同一套服务器逻辑 (`packages/opencode`)
2. **架构统一**：三种模式使用相同的 API 接口
3. **安全性**：服务器层可以添加权限控制和审计
4. **跨平台**：服务器处理平台差异（WSL、shell 环境等）

### 3.4 Desktop-Electron vs Desktop-Tauri

| 方面 | Desktop-Electron | Desktop-Tauri |
|------|------------------|---------------|
| **框架** | Electron | Tauri |
| **渲染引擎** | Chromium (内置) | 系统 WebView |
| **后端** | 嵌入式 TS 服务器 | 外部 Rust 服务器 |
| **包体积** | 较大 (~150MB) | 较小 (~15MB) |
| **内存占用** | 较高 | 较低 |
| **开发体验** | 成熟生态 | 较新但增长快 |

> **注意**：当前项目有两个桌面客户端实现：
> - `packages/desktop` - Tauri 版本（原有）
> - `packages/desktop-electron` - Electron 版本（新增）
> 
> 两者都调用同一套服务器代码 (`packages/opencode`)

---

## 四、文件清单

### 新建文件

```
packages/ui/src/components/git-graph/
├── git-graph.tsx             # 主组件（新建）
├── git-graph-header.tsx      # 头部工具栏（新建）
├── commit-row.tsx            # 提交行组件（新建）
├── commit-detail.tsx         # 详情面板（新建）
├── hover-preview.tsx         # 悬停预览（新建）
├── lane-lines.tsx            # SVG 连线（新建）
├── types.ts                  # 前端类型（新建）
└── git-graph.css             # 样式（新建）

packages/ui/src/components/
└── index.ts                  # 修改：导出 GitGraph
```

### 修改文件

```
packages/opencode/src/git/
├── index.ts                  # 扩展：添加 log()、getBranches()、getCurrentBranch() 方法

packages/opencode/src/project/
├── vcs.ts                    # 扩展：添加 graph() 方法
└── types.ts                  # 新建：添加 GitCommit、GitBranch、GitGraphData 类型

packages/opencode/src/server/instance/
└── index.ts                  # 扩展：添加 /api/v1/git/graph 路由

packages/sdk/js/src/v2/gen/
└── types.gen.ts              # 运行脚本自动生成

packages/app/src/pages/
└── session.tsx               # 集成 GitGraph 组件
```

### 关键说明

> **数据来源差异**：
> - **Git Changes**（现有）：使用 `git.status()` 和 `git.diff()` 获取未提交的文件变更
> - **GRAPH**（新增）：需要 `git.log()`、`git.getBranches()`、`git.getCurrentBranch()` 获取提交历史
>
> **实现位置**：
> - Git 命令封装：`packages/opencode/src/git/index.ts`（扩展现有 Interface）
> - VCS 服务：`packages/opencode/src/project/vcs.ts`（扩展 Service 类）
> - 类型定义：`packages/opencode/src/project/types.ts`（新建）

---

## 五、风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| git2 学习曲线 | 后端实现延迟 | 参考现有 `packages/opencode/src/project/vcs.ts` 实现 |
| SVG 性能问题 | 大量提交时卡顿 | 优先实现 List 模式，Tree 模式后续优化 |
| 泳道算法复杂 | 分支渲染错误 | 先实现基础算法，再处理边界情况 |
| API 类型不同步 | 类型错误 | 严格遵循：修改后端 → 运行生成脚本 → 前端使用 |

---

## 六、MVP 范围（第一版可交付）

如果时间紧张，可以缩减为以下核心功能：

### MVP 功能清单

- [ ] 后端 API：`git.graph()` 返回 commits 列表
- [ ] 前端组件：`GitGraph` 显示提交列表（无连线）
- [ ] 基础交互：点击提交显示详情
- [ ] 集成：Session 页面可切换到 GRAPH 模式

### MVP 不包含

- ❌ SVG 分支连线（Phase 2 再实现）
- ❌ 悬停预览（Phase 2 再实现）
- ❌ 视图切换（List/Tree）
- ❌ 虚拟滚动（数据量小时不需要）

---

## 七、参考实现

### 7.1 现有 VCS 实现参考

**文件**: `packages/opencode/src/project/vcs.ts`
```typescript
diff: Effect.fn("Vcs.diff")(function* (mode: Mode) {
  const value = yield* InstanceState.get(state)
  if (Instance.project.vcs !== "git") return []
  if (mode === "git") {
    return yield* track(fs, git, Instance.directory, "HEAD")
  }
  // ...
})
```

### 7.2 现有 API 路由参考

**文件**: `packages/opencode/src/server/instance/index.ts`
```typescript
app.get(
  "/api/v1/vcs/diff",
  zValidator("query", z.object({
    mode: z.enum(["git", "branch"]),
  })),
  Effect.fn("http.vcs.diff", function* (c) {
    const data = yield* vcs.diff(c.req.valid("query").mode)
    return c.json(data)
  }),
)
```

### 7.3 现有前端调用参考

**文件**: `packages/app/src/pages/session.tsx`
```typescript
const loadVcs = (mode: VcsMode, force = false) => {
  if (sync.project?.vcs !== "git") return
  if (!force && vcs.ready[mode]) return
  
  const task = sdk.client.vcs
    .diff({ mode })
    .then((result) => {
      setVcs("diff", mode, list(result.data))
      setVcs("ready", mode, true)
    })
  
  vcsTask.set(mode, task)
  return task
}
```

---

## 八、总结

GRAPH 功能实现核心要点：

1. **后端**：在 `vcs.ts` 中添加 `graph()` 方法，返回 commits + branches + lane_map
2. **API**：新增 `/api/v1/git/graph` 端点
3. **SDK**：运行生成脚本自动更新类型
4. **前端**：创建 `GitGraph` 组件，复用现有 session 页面架构
5. **泳道计算**：前端 TypeScript 实现（与 VSCode 相同）

**关键区别**：OpenCode 有服务器层（TypeScript + Effect），VSCode 没有。这是架构设计决定的，不是缺点。

**Desktop-Electron**：在 Electron 主进程内嵌入服务器，前端通过 HTTP 调用，与 Web App 架构一致。

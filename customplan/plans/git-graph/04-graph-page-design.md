# GRAPH 页面功能设计方案

本文档描述如何将 VSCode 风格的 Git Graph 功能设计并实现到 OpenCode 的 GRAPH 页面中。

---

## 一、功能定位

GRAPH 页面是 OpenCode Session 页面变更面板中的一个独立视图模式，用于**可视化展示 Git 提交历史**，帮助用户直观理解分支演进和合并关系。

### 使用场景

| 场景 | 用户需求 | GRAPH 提供的价值 |
|------|----------|------------------|
| 查看分支历史 | 了解当前分支从何而来 | 可视化展示父提交和合并点 |
| 追踪代码变更 | 某次提交引入了什么改动 | 点击提交查看详情和 diff |
| 理解合并关系 | 多个分支如何合并 | 拓扑图清晰展示分叉和汇聚 |
| 定位问题提交 | 哪个提交引入了 bug | 时间线快速浏览历史 |

---

## 二、页面布局设计

### 2.1 整体结构

```
┌──────────────────────────────────────────────────────────────────────────┐
│  GRAPH                              🔄 ↕︎ ↧ ↥  ⋯      custom/dev 👤      │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ┌────────┐  ────────────────────────────────────────────────────────┐ │
│  │        │  │                                                        │ │
│  │  Git   │  │  ○ 显示 token 当前使用量  haochangxia                  │ │
│  │  Graph │  │  │                                                      │ │
│  │  View  │  │  ○  Merge branch 'dev' into custom/dev  haochangxia    │ │
│  │        │  │  │  Merge remote-tracking branch 'upstream/dev'...     │ │
│  │        │  │  │                                                      │ │
│  │        │  │  ●  Update VOUCHED list  github-actions[bot]  origin/dev│ │
│  │        │  │  │                                                      │ │
│  │        │  │  ●  fix: update prompt input submit handler  Brendan... │ │
│  │        │  │  │                                                      │ │
│  │        │  │  ●  chore: update nix node_modules hashes  opencode...  │ │
│  │        │  │  │                                                      │ │
│  │        │  │  ●  release: v1.4.5  opencode                           │ │
│  │        │  │  │                                                      │ │
│  └────────  └────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 三栏布局（点击提交后）

```
┌─────────────┬──────────────────────────┬─────────────────────────────┐
│             │                          │  详情面板                    │
│   提交列表   │      （可选）             │                             │
│   (Graph)   │       Diff 预览          │  - 提交信息                  │
│             │                          │  - 作者/时间                 │
│  ○ Commit 1 │  + file1.ts             │  - 变更统计                  │
│  ● Commit 2 │  - file2.ts             │  - Commit Hash               │
│  ● Commit 3 │                          │  - 分支标签                  │
│             │                          │  - Open on GitHub            │
│             │                          │                             │
└─────────────┴──────────────────────────┴─────────────────────────────┘
```

---

## 三、组件架构

### 3.1 组件树结构

```
GitGraphPage
├── GitGraphHeader          # 顶部工具栏
│   ├── Title ("GRAPH")
│   ├── SyncButtons         # 刷新/拉取/推送
│   ├── ViewSwitcher        # List/Tree 切换
│   └── MoreMenu            # 更多选项
│
├── GitGraphBody            # 主体内容
│   ├── GraphCanvas         # 画布容器
│   │   ├── LaneLines       # SVG 分支线条
│   │   └── CommitList      # 提交列表
│   │       └── CommitRow   # 单个提交行（可复用）
│   │           ├── Node    # 彩色圆点
│   │           ├── Message # 提交信息
│   │           ├── Author  # 作者名
│   │           └── Refs    # 分支标签
│   │
│   └── CommitDetailPanel   # 详情面板（点击后显示）
│       ├── CommitInfo      # 提交信息
│       ├── Stats           # 变更统计
│       └── Actions         # 操作按钮
│
└── HoverPreview            # 悬停预览浮层（Portal）
```

### 3.2 文件结构

```
packages/ui/src/components/
├── git-graph/
│   ├── git-graph.tsx           # 主组件入口
│   ├── git-graph-header.tsx    # 顶部工具栏
│   ├── git-graph-body.tsx      # 主体内容
│   ├── git-graph-canvas.tsx    # 画布渲染（SVG + DOM）
│   ├── commit-row.tsx          # 提交行组件
│   ├── commit-detail.tsx       # 详情面板
│   ├── hover-preview.tsx       # 悬停预览
│   ├── lane-lines.tsx          # SVG 分支线条
│   └── types.ts                # 类型定义
│
packages/app/src/pages/
├── session.tsx                 # 修改 reviewContent() 集成 GitGraph
│
packages/opencode/src/
├── git/
│   ├── graph.rs                # Git Graph API 实现
│   └── types.rs                # 后端类型定义
│
packages/sdk/js/src/v2/gen/
├── types.gen.ts                # 添加 GitCommit 等类型
```

---

## 四、数据类型设计

### 4.1 核心类型

**文件**: `packages/sdk/js/src/v2/gen/types.gen.ts`

```typescript
// Git 提交数据
export type GitCommit = {
  hash: string                    // 完整 hash
  short_hash: string              // 短 hash（7 位）
  message: string                 // 提交标题
  full_message?: string           // 完整提交信息
  author: string                  // 作者名
  author_email?: string           // 作者邮箱
  author_date: number             // 时间戳
  committer?: string              // 提交者
  committer_date?: number         // 提交时间戳
  parents: string[]               // 父 commit hash 列表
  refs?: string[]                 // 分支引用（如 "HEAD -> custom/dev"）
  stats?: GitCommitStats          // 变更统计
}

// 提交变更统计
export type GitCommitStats = {
  files_changed: number           // 变更文件数
  insertions: number              // 新增行数
  deletions: number               // 删除行数
  files?: GitFileStat[]           // 文件详情
}

// 文件统计
export type GitFileStat = {
  path: string                    // 文件路径
  additions: number               // 新增行数
  deletions: number               // 删除行数
  status: "added" | "deleted" | "modified" | "renamed"
}

// 分支信息
export type GitBranch = {
  name: string                    // 分支名
  type: "local" | "remote" | "tag"
  commit_hash: string             // 指向的 commit
  upstream?: string               // 上游分支（如 "origin/dev"）
}

// Graph 数据响应
export type GitGraphData = {
  commits: GitCommit[]            // 提交列表
  branches: GitBranch[]           // 分支信息
  current_branch: string          // 当前分支名
  remote?: string                 // 远程仓库名
  lane_map: Record<string, number> // commit hash -> 泳道索引
}
```

### 4.2 前端扩展类型

**文件**: `packages/ui/src/components/git-graph/types.ts`

```typescript
// 泳道配置
export interface LaneConfig {
  index: number
  color: string
  commits: string[]  // commit hash 列表
}

// 视图模式
export type GraphViewMode = "list" | "tree"

// 组件 Props
export interface GitGraphProps {
  projectId?: string
  limit?: number
  viewMode?: GraphViewMode
  onCommitSelect?: (commit: GitCommit) => void
}

// 悬停预览数据
export interface HoverPreviewData {
  commit: GitCommit
  position: { x: number; y: number }
  branches: GitBranch[]
}
```

---

## 五、API 设计

### 5.1 后端端点

**文件**: `packages/opencode/src/app/git.rs`（新建）

```rust
// GET /api/v1/git/graph
// 获取 Git Graph 数据

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct GitGraphRequest {
    limit: Option<usize>,      // 默认 100
    branch: Option<String>,    // 特定分支
    all: Option<bool>,         // 默认 true
    view: Option<String>,      // "list" or "tree"
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct GitGraphResponse {
    commits: Vec<GitCommit>,
    branches: Vec<GitBranch>,
    current_branch: String,
    remote: Option<String>,
    lane_map: HashMap<String, usize>,
}
```

### 5.2 SDK 封装

**文件**: `packages/sdk/js/src/v2/client.ts`

```typescript
// 新增 git 命名空间
export const git = {
  // 获取 Graph 数据
  graph: (params?: {
    limit?: number
    branch?: string
    all?: boolean
    view?: "list" | "tree"
  }) => {
    return client.GET("/api/v1/git/graph", { params: { query: params } })
  },
  
  // 获取提交详情
  commit: (hash: string) => {
    return client.GET("/api/v1/git/commit/{hash}", { params: { path: { hash } } })
  },
  
  // 获取分支列表
  branches: () => {
    return client.GET("/api/v1/git/branches")
  },
}
```

### 5.3 Rust 实现逻辑

**文件**: `packages/opencode/src/git/graph.rs`（新建）

```rust
use git2::{Repository, Commit, Oid};
use std::collections::HashMap;

pub fn compute_lanes(commits: &[GitCommit]) -> HashMap<String, usize> {
    let mut lane_map: HashMap<String, usize> = HashMap::new();
    let mut lane_pool: Vec<usize> = Vec::new();
    let mut next_lane = 0;
    
    for commit in commits {
        let parent_lanes: Vec<usize> = commit.parents.iter()
            .filter_map(|p| lane_map.get(p).copied())
            .collect();
        
        let lane = if let Some(&first) = parent_lanes.first() {
            // 继承第一个父 commit 的泳道
            for lane in parent_lanes.into_iter().skip(1) {
                lane_pool.push(lane);
            }
            first
        } else {
            // 分配新泳道
            lane_pool.pop().unwrap_or_else(|| {
                let lane = next_lane;
                next_lane += 1;
                lane
            })
        };
        
        lane_map.insert(commit.hash.clone(), lane);
    }
    
    lane_map
}

pub async fn get_graph_data(
    repo: &Repository,
    limit: usize,
    all_branches: bool,
) -> Result<GitGraphResponse, Error> {
    // 1. 获取所有 commits
    let commits = fetch_commits(repo, limit, all_branches)?;
    
    // 2. 计算泳道
    let lane_map = compute_lanes(&commits);
    
    // 3. 获取分支信息
    let branches = fetch_branches(repo)?;
    
    // 4. 获取当前分支
    let current_branch = get_current_branch(repo)?;
    
    Ok(GitGraphResponse {
        commits,
        branches,
        current_branch,
        remote: get_remote_name(repo).ok(),
        lane_map,
    })
}
```

---

## 六、核心算法

### 6.1 泳道分配算法

```typescript
function computeLanes(commits: GitCommit[]): Map<string, number> {
  const laneMap = new Map<string, number>()
  const lanePool: number[] = []
  let nextLane = 0
  
  for (const commit of commits) {
    // 找到所有父 commit 已分配的泳道
    const parentLanes = commit.parents
      .map((parentHash) => laneMap.get(parentHash))
      .filter((lane): lane is number => lane !== undefined)
    
    let lane: number
    
    if (parentLanes.length > 0) {
      // 有父 commit：继承第一个父 commit 的泳道
      lane = parentLanes[0]
      
      // 释放其他泳道回池
      for (const l of parentLanes.slice(1)) {
        lanePool.push(l)
      }
    } else {
      // 无父 commit（根节点）：分配新泳道或复用池中泳道
      lane = lanePool.pop() ?? nextLane++
    }
    
    laneMap.set(commit.hash, lane)
  }
  
  return laneMap
}
```

### 6.2 分支颜色分配

```typescript
const BRANCH_COLORS = [
  "#E53935", // 红
  "#FB8C00", // 橙
  "#FDD835", // 黄
  "#43A047", // 绿
  "#1E88E5", // 蓝
  "#8E24AA", // 紫
  "#F4511E", // 深橙
  "#5E35B1", // 深紫
  "#00ACC1", // 青
  "#7CB342", // 浅绿
]

function getLaneColor(lane: number): string {
  return BRANCH_COLORS[lane % BRANCH_COLORS.length]
}
```

### 6.3 SVG 连线绘制

```typescript
interface LinePath {
  from: { x: number; y: number }
  to: { x: number; y: number }
  lane: number
  color: string
}

function computeLinePath(
  fromCommit: GitCommit,
  toCommit: GitCommit,
  laneMap: Map<string, number>,
  rowHeight: number,
  laneWidth: number
): string {
  const fromLane = laneMap.get(fromCommit.hash) ?? 0
  const toLane = laneMap.get(toCommit.hash) ?? 0
  
  const startX = fromLane * laneWidth + NODE_RADIUS
  const startY = 0  // 从上到下
  
  const endX = toLane * laneWidth + NODE_RADIUS
  const endY = rowHeight
  
  // 如果是直线（同泳道）
  if (fromLane === toLane) {
    return `M ${startX} ${startY} L ${endX} ${endY}`
  }
  
  // 如果是斜线或曲线（不同泳道）
  const controlY = (startY + endY) / 2
  return `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`
}
```

---

## 七、组件实现

### 7.1 主组件入口

**文件**: `packages/ui/src/components/git-graph/git-graph.tsx`

```typescript
import { createSignal, createMemo, onMount } from "solid-js"
import { GitGraphHeader } from "./git-graph-header"
import { GitGraphBody } from "./git-graph-body"
import { HoverPreview } from "./hover-preview"
import { CommitDetailPanel } from "./commit-detail"
import { sdk } from "@opencode/sdk"
import type { GitGraphData, GitCommit } from "@opencode/sdk"
import type { GraphViewMode } from "./types"

export interface GitGraphProps {
  class?: string
  projectId?: string
}

export function GitGraph(props: GitGraphProps) {
  const [data, setData] = createSignal<GitGraphData | undefined>()
  const [loading, setLoading] = createSignal(true)
  const [viewMode, setViewMode] = createSignal<GraphViewMode>("tree")
  const [selectedCommit, setSelectedCommit] = createSignal<GitCommit | undefined>()
  const [hoverCommit, setHoverCommit] = createSignal<GitCommit | null>(null)
  const [hoverPosition, setHoverPosition] = createSignal({ x: 0, y: 0 })

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const result = await sdk.client.git.graph({
        limit: 100,
        view: viewMode(),
      })
      setData(result.data)
    } catch (error) {
      console.error("[GitGraph] failed to load", error)
    } finally {
      setLoading(false)
    }
  }

  // 刷新数据
  const refresh = () => {
    void loadData()
  }

  // 视图切换
  const toggleView = () => {
    setViewMode((prev) => (prev === "list" ? "tree" : "list"))
  }

  // 提交选择
  const handleCommitSelect = (commit: GitCommit) => {
    setSelectedCommit(commit)
  }

  // 悬停处理
  const handleCommitHover = (commit: GitCommit | null, event?: MouseEvent) => {
    if (commit && event) {
      setHoverPosition({ x: event.clientX, y: event.clientY })
    }
    setHoverCommit(commit)
  }

  onMount(() => {
    void loadData()
  })

  return (
    <div class="git-graph h-full flex flex-col" class={props.class}>
      <GitGraphHeader
        currentBranch={data()?.current_branch}
        loading={loading()}
        onRefresh={refresh}
        onViewToggle={toggleView}
        viewMode={viewMode()}
      />
      
      <GitGraphBody
        data={data()}
        loading={loading()}
        viewMode={viewMode()}
        selectedCommit={selectedCommit()}
        onCommitSelect={handleCommitSelect}
        onCommitHover={handleCommitHover}
      />
      
      <HoverPreview
        commit={hoverCommit()}
        position={hoverPosition()}
        branches={data()?.branches}
      />
      
      <CommitDetailPanel
        commit={selectedCommit()}
        onClose={() => setSelectedCommit(undefined)}
      />
    </div>
  )
}
```

### 7.2 提交行组件

**文件**: `packages/ui/src/components/git-graph/commit-row.tsx`

```typescript
import { createMemo } from "solid-js"
import { formatDistanceToNow } from "date-fns"
import type { GitCommit, GitBranch } from "@opencode/sdk"

export interface CommitRowProps {
  commit: GitCommit
  lane: number
  branches: GitBranch[]
  isSelected?: boolean
  onSelect?: (commit: GitCommit) => void
  onHover?: (commit: GitCommit | null, event?: MouseEvent) => void
}

const NODE_RADIUS = 6
const ROW_HEIGHT = 48

export function CommitRow(props: CommitRowProps) {
  const nodeColor = createMemo(() => {
    const colors = [
      "#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5",
      "#8E24AA", "#F4511E", "#5E35B1", "#00ACC1", "#7CB342",
    ]
    return colors[props.lane % colors.length]
  })

  const timeAgo = createMemo(() => {
    return formatDistanceToNow(props.commit.author_date, { addSuffix: true })
  })

  const commitRefs = createMemo(() => {
    const refs = props.commit.refs ?? []
    return refs.map((ref) => {
      // 解析引用类型
      if (ref.includes("HEAD ->")) {
        return { name: ref.split(" -> ")[1], type: "current" as const }
      }
      if (ref.includes("/")) {
        return { name: ref, type: "remote" as const }
      }
      return { name: ref, type: "local" as const }
    })
  })

  return (
    <div
      class="commit-row flex items-center gap-3 px-4 py-2 hover:bg-bg-subtle cursor-pointer"
      classList={{ "bg-bg-subtle": props.isSelected }}
      onClick={() => props.onSelect?.(props.commit)}
      onMouseEnter={(e) => props.onHover?.(props.commit, e)}
      onMouseLeave={() => props.onHover?.(null)}
    >
      {/* 节点圆点 */}
      <div class="node-container flex-shrink-0" style={{ width: "24px" }}>
        <svg width="12" height="12">
          <circle
            cx="6"
            cy="6"
            r={NODE_RADIUS}
            fill={nodeColor()}
            stroke={props.isSelected ? "#fff" : "transparent"}
            stroke-width="2"
          />
        </svg>
      </div>

      {/* 提交信息 */}
      <div class="message flex-1 min-w-0">
        <div class="text-14-regular text-text truncate">
          {props.commit.message}
        </div>
        <div class="text-12-regular text-text-weak flex items-center gap-2">
          <span>{props.commit.author}</span>
          <span>·</span>
          <span>{timeAgo()}</span>
        </div>
      </div>

      {/* 分支标签 */}
      <div class="refs flex items-center gap-1 flex-shrink-0">
        {commitRefs().map((ref) => (
          <span
            class="ref-badge px-2 py-0.5 rounded text-12-medium"
            classList={{
              "bg-ref-current text-ref-current-text": ref.type === "current",
              "bg-ref-remote text-ref-remote-text": ref.type === "remote",
              "bg-ref-local text-ref-local-text": ref.type === "local",
            }}
          >
            {ref.name}
          </span>
        ))}
      </div>
    </div>
  )
}
```

### 7.3 详情面板组件

**文件**: `packages/ui/src/components/git-graph/commit-detail.tsx`

```typescript
import { createMemo } from "solid-js"
import type { GitCommit } from "@opencode/sdk"

export interface CommitDetailPanelProps {
  commit: GitCommit | undefined
  onClose: () => void
}

export function CommitDetailPanel(props: CommitDetailPanelProps) {
  const stats = createMemo(() => props.commit?.stats)
  
  return (
    <Show when={props.commit}>
      <div class="commit-detail-panel absolute right-0 top-0 h-full w-80 bg-bg border-l border-border p-4 overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-16-bold">Commit Details</h3>
          <button onClick={props.onClose} class="p-1 hover:bg-bg-subtle rounded">
            ✕
          </button>
        </div>

        {/* 提交信息 */}
        <div class="section mb-4">
          <div class="text-14-bold mb-2">{props.commit!.message}</div>
          <Show when={props.commit!.full_message}>
            <div class="text-12-regular text-text-weak whitespace-pre-wrap">
              {props.commit!.full_message}
            </div>
          </Show>
        </div>

        {/* 作者信息 */}
        <div class="section mb-4">
          <div class="text-12-regular text-text-weak">
            <span class="text-text">{props.commit!.author}</span>
            {" "}committed{" "}
            {new Date(props.commit!.author_date).toLocaleString()}
          </div>
        </div>

        {/* 变更统计 */}
        <Show when={stats()}>
          <div class="section mb-4">
            <div class="text-12-bold text-text-weak mb-2">Changes</div>
            <div class="flex items-center gap-3 text-12-regular">
              <span class="text-insertion">
                +{stats()!.insertions} insertions(+)
              </span>
              <span class="text-deletion">
                -{stats()!.deletions} deletions(-)
              </span>
            </div>
            <div class="text-12-regular text-text-weak mt-1">
              {stats()!.files_changed} files changed
            </div>
          </div>
        </Show>

        {/* Commit Hash */}
        <div class="section mb-4">
          <div class="text-12-bold text-text-weak mb-1">Commit</div>
          <code class="text-12-regular bg-bg-subtle px-2 py-1 rounded">
            {props.commit!.short_hash}
          </code>
        </div>

        {/* 操作按钮 */}
        <div class="section">
          <button class="w-full btn btn-primary mb-2">
            View Changes
          </button>
          <button class="w-full btn btn-secondary">
            Open on GitHub
          </button>
        </div>
      </div>
    </Show>
  )
}
```

---

## 八、集成到 Session 页面

### 8.1 修改 `session.tsx`

**位置**: `reviewContent()` 函数

```typescript
const reviewContent = (input: {
  diffStyle: DiffStyle
  onDiffStyleChange?: (style: DiffStyle) => void
  classes?: SessionReviewTabProps["classes"]
  loadingClass: string
  emptyClass: string
}) => (
  <Show when={!store.deferRender}>
    <Show when={store.changes !== "graph"}>
      {/* 原有变更面板 */}
      <SessionReviewTab
        title={changesTitle()}
        empty={reviewEmpty(input)}
        diffs={reviewDiffs}
        view={view}
        diffStyle={input.diffStyle}
        onDiffStyleChange={input.onDiffStyleChange}
        // ... 其他 props
      />
    </Show>
    
    <Show when={store.changes === "graph"}>
      {/* GRAPH 模式：Git Graph 组件 */}
      <GitGraph class="h-full" />
    </Show>
  </Show>
)
```

### 8.2 导入 GitGraph 组件

```typescript
import { GitGraph } from "@opencode/ui"
```

---

## 九、样式设计

### 9.1 CSS 变量（主题）

**文件**: `packages/ui/src/styles/git-graph.css`

```css
:root {
  /* 分支颜色 */
  --git-graph-lane-0: #E53935;
  --git-graph-lane-1: #FB8C00;
  --git-graph-lane-2: #FDD835;
  --git-graph-lane-3: #43A047;
  --git-graph-lane-4: #1E88E5;
  --git-graph-lane-5: #8E24AA;
  
  /* 引用标签 */
  --ref-current-bg: #3B82F6;
  --ref-current-text: #fff;
  --ref-remote-bg: #F97316;
  --ref-remote-text: #fff;
  --ref-local-bg: #6B7280;
  --ref-local-text: #fff;
  
  /* 变更统计 */
  --insertion-color: #22C55E;
  --deletion-color: #EF4444;
}
```

### 9.2 Tailwind 扩展类

```css
@layer components {
  .git-graph {
    @apply bg-bg text-text;
  }
  
  .commit-row {
    @apply flex items-center gap-3 px-4 py-2;
    @apply hover:bg-bg-subtle cursor-pointer;
  }
  
  .commit-node {
    @apply w-3 h-3 rounded-full;
  }
  
  .ref-badge {
    @apply px-2 py-0.5 rounded text-12-medium;
  }
}
```

---

## 十、性能优化

### 10.1 虚拟滚动

```typescript
import { createVirtualizer } from "@tanstack/solid-virtual"

function GitGraphBody(props: GitGraphBodyProps) {
  const parentRef = createRef<HTMLDivElement>()
  
  const virtualizer = createVirtualizer(() => ({
    count: props.data?.commits.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,  // 每行高度
    overscan: 5,
  }))
  
  const rows = virtualizer().virtualItems
  
  return (
    <div ref={parentRef} class="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer().getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rows.map((virtualRow) => {
          const commit = props.data!.commits[virtualRow.index]
          const lane = props.data!.lane_map[commit.hash] ?? 0
          
          return (
            <CommitRow
              key={commit.hash}
              commit={commit}
              lane={lane}
              branches={props.data!.branches}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
```

### 10.2 数据缓存

```typescript
import { makePersisted } from "@solid-primitives/storage"

const [cache, setCache] = makePersisted(
  createStore<{
    data?: GitGraphData
    timestamp: number
  }>({
    timestamp: 0,
  }),
  { name: "git-graph-cache" }
)

const CACHE_TTL = 5 * 60 * 1000  // 5 分钟

const loadData = async () => {
  // 检查缓存是否有效
  if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
    setData(cache.data)
    return
  }
  
  // 加载新数据
  const result = await sdk.client.git.graph()
  setData(result.data)
  setCache("data", result.data)
  setCache("timestamp", Date.now())
}
```

---

## 十一、实现计划

### Phase 1 - 基础组件（1-2 周）

- [ ] 创建 GitGraph 组件骨架
- [ ] 实现 GitGraphHeader 工具栏
- [ ] 实现 CommitRow 组件
- [ ] 实现基础数据加载（无泳道）
- [ ] 集成到 Session 页面

### Phase 2 - 泳道算法（1 周）

- [ ] Rust 后端实现泳道计算
- [ ] SDK 类型定义
- [ ] 前端渲染泳道颜色
- [ ] 分支标签显示

### Phase 3 - SVG 连线（1-2 周）

- [ ] LaneLines 组件（SVG）
- [ ] 计算连线路径
- [ ] 曲线渲染优化
- [ ] 性能优化（虚拟滚动）

### Phase 4 - 交互功能（1 周）

- [ ] 悬停预览浮层
- [ ] 点击详情面板
- [ ] 视图切换（List/Tree）
- [ ] 刷新/同步功能

### Phase 5 - 增强功能（可选）

- [ ] 搜索/筛选
- [ ] 懒加载历史
- [ ] 右键菜单
- [ ] Open on GitHub

---

## 十二、技术风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| 泳道计算复杂 | 性能问题 | 后端 Rust 实现，前端缓存 |
| SVG 连线性能 | 大量提交时卡顿 | 虚拟滚动 + Canvas 降级方案 |
| 数据量大 | 加载缓慢 | 分页加载 + 增量更新 |
| 主题适配 | 暗色/亮色模式 | CSS 变量统一管理 |

---

## 十三、总结

本设计方案将 VSCode Git Graph 功能完整迁移到 OpenCode GRAPH 页面，核心特点：

1. **复用现有架构**：基于 Session 页面的变更面板框架
2. **分阶段实现**：从基础列表到完整拓扑图
3. **性能优先**：Rust 后端计算 + 前端虚拟滚动
4. **可扩展性**：预留交互接口，便于后续增强

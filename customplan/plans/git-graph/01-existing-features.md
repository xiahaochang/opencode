# Session 变更面板现有功能分析

> **📚 本文档是 GRAPH 功能系列文档的第 1 部分**
>
> **阅读顺序**：
> 1. **01-existing-features.md** - 现有功能分析（本文档）
> 2. **02-vscode-git-graph-analysis.md** - VSCode Git Graph 分析
> 3. **03-new-feature-requirements.md** - 新功能需求
> 4. **04-graph-page-design.md** - 页面设计方案
> 5. **05-graph-implementation-todo.md** - 实现 TODO List（下一步执行）
>
> **当前阶段**：设计方案已完成，准备进入实施阶段

---

本文档详细分析 session 页面变更面板的现有实现，供新对话快速了解代码结构。

---

## 一、类型定义

**文件**: `packages/app/src/pages/session.tsx`
**位置**: 第 72 行

```typescript
type ChangeMode = "git" | "branch" | "turn"
type VcsMode = "git" | "branch"
```

> **关键点**：`VcsMode` 是 `ChangeMode` 的子集，只有 "git" 和 "branch" 需要通过 API 加载数据，"turn" 数据直接从消息中获取。

---

## 二、数据类型定义

### 2.1 SnapshotFileDiff（快照差异）

**文件**: `packages/sdk/js/src/v2/gen/types.gen.ts` 第 141 行

```typescript
export type SnapshotFileDiff = {
  file: string                         // 文件路径
  patch: string                        // Git patch 格式的差异内容
  additions: number                    // 新增行数
  deletions: number                    // 删除行数
  status?: "added" | "deleted" | "modified"  // 文件状态
}
```

**来源**：来自用户消息的 `summary.diffs`，表示 AI 在上一轮对话中对文件的变更。

### 2.2 VcsFileDiff（VCS 差异）

**文件**: `packages/sdk/js/src/v2/gen/types.gen.ts` 第 2103 行

```typescript
export type VcsFileDiff = {
  file: string                         // 文件路径
  patch: string                        // Git patch 格式的差异内容
  additions: number                    // 新增行数
  deletions: number                    // 删除行数
  status?: "added" | "deleted" | "modified"  // 文件状态
}
```

**来源**：通过 `sdk.client.vcs.diff({ mode })` API 获取，表示 Git 或 Branch 的文件变更。

> **注意**：两种类型结构相同，但来源不同。

---

## 三、状态管理

### 3.1 store 状态

**文件**: `packages/app/src/pages/session.tsx` 第 519 行

```typescript
const [store, setStore] = createStore({
  messageId: undefined as string | undefined,
  mobileTab: "session" as "session" | "changes",
  changes: "git" as ChangeMode,        // 当前选中的变更模式
  newSessionWorktree: "main",
  deferRender: false,
})
```

- `store.changes`：当前选中的变更模式（"git" | "branch" | "turn"）

### 3.2 vcs 状态

**文件**: `packages/app/src/pages/session.tsx` 第 523 行

```typescript
const [vcs, setVcs] = createStore<{
  diff: {
    git: VcsFileDiff[]
    branch: VcsFileDiff[]
  }
  ready: {
    git: boolean
    branch: boolean
  }
}>({
  diff: {
    git: [] as VcsFileDiff[],
    branch: [] as VcsFileDiff[],
  },
  ready: {
    git: false,
    branch: false,
  },
})
```

- `vcs.diff.git`：Git 模式的文件变更数据
- `vcs.diff.branch`：Branch 模式的文件变更数据
- `vcs.ready.git`：Git 数据是否已加载完成
- `vcs.ready.branch`：Branch 数据是否已加载完成

### 3.3 VCS 任务管理变量

**文件**: `packages/app/src/pages/session.tsx` 第 549-550 行

```typescript
const vcsTask = new Map<VcsMode, Promise<void>>()  // 正在进行的加载任务
const vcsRun = new Map<VcsMode, number>()          // 任务版本号（用于取消旧任务）
```

---

## 四、核心函数实现

### 4.1 changesOptions() - 下拉选项列表

**位置**: 第 655 行

```typescript
const changesOptions = createMemo<ChangeMode[]>(() => {
  const list: ChangeMode[] = []
  if (sync.project?.vcs === "git") list.push("git")  // 条件1: 项目使用 Git
  
  if (
    sync.project?.vcs === "git" &&
    sync.data.vcs?.branch &&
    sync.data.vcs?.default_branch &&
    sync.data.vcs.branch !== sync.data.vcs.default_branch
  ) {
    list.push("branch")  // 条件2: 不在默认分支上
  }
  
  list.push("turn")  // 始终添加
  return list
})
```

**选项显示条件**：
| 模式 | 显示条件 |
|------|----------|
| `git` | 项目使用 Git (`sync.project?.vcs === "git"`） |
| `branch` | 使用 Git + 有当前分支信息 + 有默认分支 + 当前不是默认分支 |
| `turn` | 始终显示 |

### 4.2 vcsMode() - VCS 模式判断

**位置**: 第 666 行

```typescript
const vcsMode = createMemo<VcsMode | undefined>(() => {
  if (store.changes === "git" || store.changes === "branch") return store.changes
  // "turn" 返回 undefined
})
```

**用途**：判断当前模式是否需要通过 VCS API 加载数据。

### 4.3 turnDiffs() - 上一轮变更数据

**位置**: 第 653 行

```typescript
const turnDiffs = createMemo(() => list(lastUserMessage()?.summary?.diffs))
```

**数据来源**：
- `lastUserMessage()` = `visibleUserMessages().at(-1)`（最后一条可见用户消息）
- 从消息的 `summary.diffs` 字段获取

### 4.4 reviewDiffs() - 变更数据获取

**位置**: 第 670 行

```typescript
const reviewDiffs = createMemo(() => {
  if (store.changes === "git") return list(vcs.diff.git)
  if (store.changes === "branch") return list(vcs.diff.branch)
  return turnDiffs()  // 默认返回 turn 数据
})
```

### 4.5 reviewReady() - 数据就绪判断

**位置**: 第 680 行

```typescript
const reviewReady = createMemo(() => {
  if (store.changes === "git") return vcs.ready.git
  if (store.changes === "branch") return vcs.ready.branch
  return true  // turn 始终就绪
})
```

### 4.6 wantsReview() - 是否需要显示变更面板

**位置**: 第 1058 行

```typescript
const wantsReview = createMemo(() =>
  isDesktop()
    ? desktopFileTreeOpen() || (desktopReviewOpen() && activeTab() === "review")
    : store.mobileTab === "changes",
)
```

**用途**：判断用户是否正在查看变更面板，决定是否需要加载 VCS 数据。

---

## 五、VCS 数据加载逻辑

### 5.1 bumpVcs() - 任务版本号递增

**位置**: 第 581 行

```typescript
const bumpVcs = (mode: VcsMode) => {
  const next = (vcsRun.get(mode) ?? 0) + 1
  vcsRun.set(mode, next)
  return next
}
```

**用途**：用于取消旧的加载任务（版本号不匹配时忽略结果）。

### 5.2 resetVcs() - 重置 VCS 状态

**位置**: 第 585 行

```typescript
const resetVcs = (mode?: VcsMode) => {
  const list = mode ? [mode] : (["git", "branch"] as const)
  list.forEach((item) => {
    bumpVcs(item)              // 递增版本号
    vcsTask.delete(item)       // 删除任务
    setVcs("diff", item, [])   // 清空数据
    setVcs("ready", item, false)  // 设置未就绪
  })
}
```

### 5.3 loadVcs() - 加载 VCS 数据

**位置**: 第 596 行

```typescript
const loadVcs = (mode: VcsMode, force = false) => {
  // 1. 前置检查
  if (sync.project?.vcs !== "git") return Promise.resolve()
  if (!force && vcs.ready[mode]) return Promise.resolve()  // 已加载且不强制刷新
  
  // 2. 强制刷新时重置状态
  if (force) {
    if (vcsTask.has(mode)) bumpVcs(mode)
    vcsTask.delete(mode)
    setVcs("ready", mode, false)
  }
  
  // 3. 检查是否已有任务在进行
  const current = vcsTask.get(mode)
  if (current) return current
  
  // 4. 创建新任务
  const run = bumpVcs(mode)
  
  const task = sdk.client.vcs
    .diff({ mode })  // 调用 API
    .then((result) => {
      if (vcsRun.get(mode) !== run) return  // 版本号不匹配，忽略结果
      setVcs("diff", mode, list(result.data))
      setVcs("ready", mode, true)
    })
    .catch((error) => {
      if (vcsRun.get(mode) !== run) return
      console.debug("[session-review] failed to load vcs diff", { mode, error })
      setVcs("diff", mode, [])
      setVcs("ready", mode, true)  // 失败也设置为就绪
    })
    .finally(() => {
      if (vcsTask.get(mode) === task) vcsTask.delete(mode)
    })
  
  vcsTask.set(mode, task)
  return task
}
```

**API 调用**：
- `sdk.client.vcs.diff({ mode: "git" })` → 获取未提交变更
- `sdk.client.vcs.diff({ mode: "branch" })` → 获取分支差异

### 5.4 refreshVcs() - 刷新 VCS 数据

**位置**: 第 633 行

```typescript
const refreshVcs = () => {
  resetVcs()  // 重置所有
  const mode = untrack(vcsMode)
  if (!mode) return
  if (!untrack(wantsReview)) return
  void loadVcs(mode, true)  // 强制加载
}
```

---

## 六、自动加载触发逻辑

### 6.1 模式切换自动加载

**位置**: 第 1073 行

```typescript
createEffect(() => {
  const mode = vcsMode()
  if (!mode) return        // turn 模式不触发
  if (!wantsReview()) return  // 用户不看变更面板时不触发
  void loadVcs(mode)
})
```

**触发条件**：`store.changes` 变为 "git" 或 "branch" + 用户正在查看变更面板。

### 6.2 选项列表变化自动切换模式

**位置**: 第 1067 行

```typescript
createEffect(() => {
  const list = changesOptions()
  if (list.includes(store.changes)) return  // 当前模式在列表中
  const next = list[0]  // 切换到第一个可用模式
  if (!next) return
  setStore("changes", next)
})
```

**用途**：当选项列表变化时（如切换到没有 Git 的项目），自动切换到第一个可用模式。

### 6.3 会话状态变化时刷新

**位置**: 第 1080 行

```typescript
createEffect(
  on(
    () => sync.data.session_status[params.id ?? ""]?.type,
    (next, prev) => {
      const mode = vcsMode()
      if (!mode) return
      if (!wantsReview()) return
      if (next !== "idle" || prev === undefined || prev === "idle") return
      void loadVcs(mode, true)  // 会话变为 idle 时刷新
    },
    { defer: true },
  ),
)
```

**触发条件**：会话状态从非 idle 变为 idle（AI 完成回复后刷新变更）。

---

## 七、UI 渲染逻辑

### 7.1 changesTitle() - 下拉按钮标题

**位置**: 第 1143 行

```typescript
const changesTitle = () => {
  if (!canReview()) {
    return null
  }

  const label = (option: ChangeMode) => {
    if (option === "git") return language.t("ui.sessionReview.title.git")
    if (option === "branch") return language.t("ui.sessionReview.title.branch")
    return language.t("ui.sessionReview.title.lastTurn")
  }

  return (
    <Select
      options={changesOptions()}
      current={store.changes}
      label={label}
      onSelect={(option) => option && setStore("changes", option)}
      variant="ghost"
      size="small"
      valueClass="text-14-medium"
    />
  )
}
```

### 7.2 reviewEmptyText() - 空状态文本

**位置**: 第 1186 行

```typescript
const reviewEmptyText = createMemo(() => {
  if (store.changes === "git") return language.t("session.review.noUncommittedChanges")
  if (store.changes === "branch") return language.t("session.review.noBranchChanges")
  return language.t("session.review.noChanges")  // turn
})
```

### 7.3 reviewEmpty() - 空状态渲染

**位置**: 第 1193 行

```typescript
const reviewEmpty = (input: { loadingClass: string; emptyClass: string }) => {
  // git/branch 模式
  if (store.changes === "git" || store.changes === "branch") {
    if (!reviewReady()) {
      return <div class={input.loadingClass}>{language.t("session.review.loadingChanges")}</div>
    }
    return empty(reviewEmptyText())
  }

  // turn 模式
  if (store.changes === "turn") {
    if (nogit()) return createGit(input)  // 无 Git 时提示创建仓库
    return empty(reviewEmptyText())
  }

  // 默认
  return (
    <div class={input.emptyClass}>
      <div class="text-14-regular text-text-weak max-w-56">{reviewEmptyText()}</div>
    </div>
  )
}
```

### 7.4 reviewContent() - 变更内容渲染

**位置**: 第 1211 行

```typescript
const reviewContent = (input: {
  diffStyle: DiffStyle
  onDiffStyleChange?: (style: DiffStyle) => void
  classes?: SessionReviewTabProps["classes"]
  loadingClass: string
  emptyClass: string
}) => (
  <Show when={!store.deferRender}>
    <SessionReviewTab
      title={changesTitle()}              // 下拉按钮
      empty={reviewEmpty(input)}          // 空状态
      diffs={reviewDiffs}                 // 变更数据（函数引用）
      view={view}
      diffStyle={input.diffStyle}
      onDiffStyleChange={input.onDiffStyleChange}
      onScrollRef={(el) => setTree("reviewScroll", el)}
      focusedFile={tree.activeDiff}
      onLineComment={(comment) => addCommentToContext({ ...comment, origin: "review" })}
      onLineCommentUpdate={updateCommentInContext}
      onLineCommentDelete={removeCommentFromContext}
      lineCommentActions={reviewCommentActions()}
      commentMentions={{ items: file.searchFilesAndDirectories }}
      comments={comments.all()}
      focusedComment={comments.focus()}
      onFocusedCommentChange={comments.setFocus}
      onViewFile={openReviewFile}
      classes={input.classes}
    />
  </Show>
)
```

---

## 八、组件依赖关系

### 8.1 Select 组件

**文件**: `packages/ui/src/components/select.tsx`

```typescript
export function Select<T>(props: SelectProps<T> & Omit<ButtonProps, "children">) {
  // 使用 Kobalte 的 Select 组件
  // 支持 options, current, label, onSelect 等属性
}
```

**关键属性**：
- `options`: 选项列表
- `current`: 当前选中值
- `label`: 显示文本转换函数
- `onSelect`: 选择回调
- `variant`: 按钮样式（"ghost"）
- `size`: 按钮大小（"small"）

### 8.2 SessionReviewTab 组件

**文件**: `packages/app/src/pages/session/review-tab.tsx`

```typescript
export function SessionReviewTab(props: SessionReviewTabProps) {
  // 处理滚动恢复、文件读取等
  // 最终渲染 SessionReview UI 组件
}
```

**Props 定义**（第 19 行）：
```typescript
export interface SessionReviewTabProps {
  title?: JSX.Element              // 下拉按钮
  empty?: JSX.Element              // 空状态内容
  diffs: () => ReviewDiff[]        // 变更数据（响应式函数）
  view: () => ReturnType<ReturnType<typeof useLayout>["view"]>
  diffStyle: DiffStyle
  onDiffStyleChange?: (style: DiffStyle) => void
  onViewFile?: (file: string) => void
  // ... 其他属性
}
```

### 8.3 SessionReview UI 组件

**文件**: `packages/ui/src/components/session-review.tsx`

渲染实际的文件变更列表，包含：
- 文件列表展示
- Diff 内容渲染
- 行内评论功能
- 统一/拆分视图切换

---

## 九、数据流向图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户交互                                    │
│  点击下拉按钮 → onSelect → setStore("changes", newMode)             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       状态变化                                       │
│  store.changes 变化 → vcsMode() 判断是否为 VCS 模式                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
          ┌───────────────────┴───────────────────┐
          │                                       │
    ┌─────↓─────┐                         ┌───────↓───────┐
    │ VCS 模式  │                         │  Turn 模式    │
    │ git/branch│                         │               │
    └─────┬─────┘                         └───────┬───────┘
          │                                       │
          ↓                                       ↓
┌─────────────────────┐             ┌─────────────────────────────┐
│ createEffect 触发   │             │ turnDiffs()                 │
│ loadVcs(mode)       │             │ lastUserMessage()?.summary  │
└─────────────────────┘             │   ?.diffs                   │
          │                         └─────────────────────────────┘
          ↓                                       │
┌─────────────────────┐                           │
│ API: vcs.diff       │                           │
│ setVcs("diff",...)  │                           │
│ setVcs("ready",true)│                           │
└─────────────────────┘                           │
          │                                       │
          └───────────────────┬───────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       reviewDiffs()                                  │
│  根据 store.changes 返回对应数据                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       reviewReady()                                  │
│  判断数据是否就绪，决定显示加载状态或内容                              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       SessionReviewTab                               │
│  渲染变更列表组件                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 十、国际化键名对照

### 10.1 UI 组件翻译（packages/ui/src/i18n/）

| 键名 | 英文 | 中文 | 状态 |
|------|------|------|------|
| `ui.sessionReview.title.git` | "Git changes" | 缺失 | ❌ |
| `ui.sessionReview.title.branch` | "Branch changes" | 缺失 | ❌ |
| `ui.sessionReview.title.lastTurn` | "Last turn changes" | "上一轮变更" | ✅ |

### 10.2 App 翻译（packages/app/src/i18n/）

| 键名 | 英文 | 中文 | 状态 |
|------|------|------|------|
| `session.review.noUncommittedChanges` | "No uncommitted changes yet" | 缺失 | ❌ |
| `session.review.noBranchChanges` | "No branch changes yet" | 缺失 | ❌ |
| `session.review.noChanges` | "No changes" | "无更改" | ✅ |
| `session.review.loadingChanges` | "Loading changes..." | "正在加载更改..." | ✅ |
| `session.review.empty` | "No changes in this session yet" | "此会话暂无更改" | ✅ |
| `session.review.noVcs` | "No Git VCS detected..." | "未检测到 Git..." | ✅ |
| `session.review.noVcs.createGit.title` | "Create a Git repository" | "创建 Git 仓库" | ✅ |
| `session.review.noVcs.createGit.action` | "Create Git repository" | "创建 Git 仓库" | ✅ |

---

## 十一、关键文件位置汇总

| 文件路径 | 关键内容 |
|----------|----------|
| `packages/app/src/pages/session.tsx` | 主文件，包含所有业务逻辑 |
| `packages/app/src/pages/session/review-tab.tsx` | SessionReviewTab 组件 |
| `packages/ui/src/components/select.tsx` | 下拉选择组件 |
| `packages/ui/src/components/session-review.tsx` | 变更列表渲染组件 |
| `packages/ui/src/i18n/en.ts` | UI 英文翻译 |
| `packages/ui/src/i18n/zh.ts` | UI 中文翻译 |
| `packages/app/src/i18n/en.ts` | App 英文翻译 |
| `packages/app/src/i18n/zh.ts` | App 中文翻译 |
| `packages/sdk/js/src/v2/gen/types.gen.ts` | 类型定义（VcsFileDiff、SnapshotFileDiff） |

### session.tsx 关键行号对照

| 行号范围 | 内容 |
|----------|------|
| 72 | 类型定义 `ChangeMode` / `VcsMode` |
| 519-538 | 状态定义 `store` / `vcs` |
| 549-550 | VCS 任务管理变量 |
| 581-632 | VCS 加载函数 `bumpVcs` / `resetVcs` / `loadVcs` |
| 633-640 | `refreshVcs()` |
| 653 | `turnDiffs()` |
| 655-663 | `changesOptions()` |
| 666-667 | `vcsMode()` |
| 670-674 | `reviewDiffs()` |
| 680-683 | `reviewReady()` |
| 1058-1063 | `wantsReview()` |
| 1067-1071 | 选项变化时自动切换模式 |
| 1073-1078 | VCS 模式自动加载 |
| 1080-1089 | 会话 idle 时刷新 |
| 1143-1162 | `changesTitle()` 下拉按钮 |
| 1186-1191 | `reviewEmptyText()` |
| 1193-1210 | `reviewEmpty()` |
| 1211-1239 | `reviewContent()` |
| 1241-1254 | `reviewPanel()` |
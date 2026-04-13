# OpenCode "所有文件" (All Files) 功能分析

## 📋 功能概述

"所有文件"功能位于客户端右侧面板，提供项目文件树的浏览、展开/折叠、文件点击打开等功能。与"变更"标签页配合使用，用户可以查看项目中的所有文件或仅查看有 Git 变更的文件。

---

## 🏗️ 整体架构

### 组件层级结构

```
session-side-panel.tsx (侧面板容器)
├── Tabs (标签切换)
│   ├── Tabs.Trigger value="changes" (变更)
│   └── Tabs.Trigger value="all" (所有文件)
├── Tabs.Content value="changes"
│   └── FileTree (变更文件树)
└── Tabs.Content value="all"
    └── FileTree (所有文件树)
```

---

## 🎨 UI 组件分析

### 1. 文件树主组件

**文件**: `packages/app/src/components/file-tree.tsx`

#### FileTree 组件 (第194-505行)

核心递归渲染组件，负责文件树的展示。

```tsx
// 主要属性
interface FileTreeProps {
  path: string                          // 当前目录路径
  level?: number                        // 当前层级深度
  active?: string                       // 当前激活的文件路径
  kinds?: ReadonlyMap<string, Kind>     // Git 状态映射 (add/del/mix)
  marks?: Set<string>                   // 标记的文件集合
  modified?: string[]                   // 变更文件列表（用于"所有文件"模式）
  allowed?: string[]                    // 允许显示的文件列表（用于"变更"模式）
  draggable?: boolean                   // 是否支持拖拽
  onFileClick?: (node: FileNode) => void // 文件点击回调
}
```

#### FileTreeNode 组件 (第111-189行)

单个文件/目录节点的渲染。

```tsx
const FileTreeNode = (props) => {
  // 计算 Git 状态标签
  const kind = () => visibleKind(node, kinds, marks)
  
  // 渲染内容
  return (
    <div data-component="filetree-node">
      <FileIcon node={node} />           // 文件图标
      <span>{node.name}</span>           // 文件名称
      <Show when={kind()}>               // Git 状态标签
        <span class="kind-badge">{kindLabel(kind())}</span>
      </Show>
    </div>
  )
}
```

### 2. 侧面板容器

**文件**: `packages/app/src/pages/session/session-side-panel.tsx`

```tsx
// 文件树面板（第345-431行）
<div id="file-tree-panel">
  <Tabs variant="pill" value={fileTreeTab()} data-scope="filetree">
    <Tabs.List>
      <Tabs.Trigger value="changes">{diffFiles().length} 更改</Tabs.Trigger>
      <Tabs.Trigger value="all">所有文件</Tabs.Trigger>
    </Tabs.List>
    
    {/* 变更文件树 */}
    <Tabs.Content value="changes">
      <FileTree
        path=""
        allowed={diffFiles()}          // 只显示变更的文件
        kinds={kinds()}
        onFileClick={(node) => focusReviewDiff(node.path)}
      />
    </Tabs.Content>
    
    {/* 所有文件树 */}
    <Tabs.Content value="all">
      <FileTree
        path=""
        modified={diffFiles()}         // 标记变更的文件
        kinds={kinds()}
        onFileClick={(node) => openTab(file.tab(node.path))}
      />
    </Tabs.Content>
  </Tabs>
</div>
```

---

## 📡 数据获取与更新

### 1. 前端文件树状态存储

**文件**: `packages/app/src/context/file/tree-store.ts`

```typescript
type DirectoryState = {
  expanded: boolean     // 是否展开
  loaded?: boolean      // 是否已加载
  loading?: boolean     // 是否正在加载
  error?: string        // 错误信息
  children?: string[]   // 子节点路径列表
}

export function createFileTreeStore(options) {
  const [tree, setTree] = createStore({
    node: {},                              // 文件节点映射
    dir: { "": { expanded: true } },       // 根目录默认展开
  })

  return {
    listDir,        // 加载目录内容
    expandDir,      // 展开目录
    collapseDir,    // 折叠目录
    dirState,       // 获取目录状态
    children,       // 获取子节点
    node,           // 获取文件节点
    isLoaded,       // 检查是否已加载
    reset,          // 重置状态
  }
}
```

#### 目录加载流程 (第47-100行)

```typescript
const listDir = async (dir: string, options?: { force?: boolean }) => {
  const normalized = normalizeDir(dir)
  
  // 检查缓存
  if (!options?.force && isLoaded(normalized)) return
  
  // 防止重复请求
  if (inflight.has(normalized)) return inflight.get(normalized)
  
  // 设置加载状态
  setTree("dir", normalized, "loading", true)
  
  try {
    // 调用后端 API
    const entries = await options.list(normalized)
    
    // 更新 store
    setTree(produce((draft) => {
      draft.dir[normalized] = {
        expanded: draft.dir[normalized]?.expanded ?? false,
        loaded: true,
        loading: false,
        children: entries.map(e => e.path),
      }
      for (const entry of entries) {
        draft.node[entry.path] = entry
      }
    }))
  } catch (error) {
    setTree("dir", normalized, "loading", false, "error", error.message)
    options.onError?.(error.message)
  }
}
```

### 2. 文件上下文

**文件**: `packages/app/src/context/file.tsx`

```typescript
// 创建文件树 store (第68-89行)
const tree = createFileTreeStore({
  scope,
  normalizeDir: path.normalizeDir,
  list: (dir) => sdk.client.file.list({ path: dir }).then((x) => x.data ?? []),
  onError: (message) => {
    showToast({
      variant: "error",
      title: language.t("toast.file.listFailed.title"),
      description: message,
    })
  },
})

// 文件搜索 (第192-197行)
searchFiles: (query: string) => search(query, "false"),
searchFilesAndDirectories: (query: string) => search(query, "true"),
```

### 3. 后端文件服务

**文件**: `packages/opencode/src/file/index.ts`

#### 文件列表 API (第570-620行)

```typescript
const list = Effect.fn("File.list")(function* (dir?: string) {
  const resolved = yield* resolvePath(dir)
  
  // 解析 .gitignore 和 .ignore 文件
  const ig = ignore()
  
  // 读取目录条目
  const entries = yield* appFs.readDirectoryEntries(resolved)
  
  // 构建节点列表
  const nodes: File.Node[] = entries.map(entry => {
    const file = path.join(dir, entry.name)
    return {
      name: entry.name,
      path: file,
      absolute: yield* toAbsolute(file),
      type: entry.type === "directory" ? "directory" : "file",
      ignored: ig.ignores(file),  // 是否被 gitignore 忽略
    }
  })
  
  // 排序：目录在前，文件在后，按名称字母排序
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1
    return a.name.localeCompare(b.name, "en", { numeric: true })
  })
})
```

#### Git 状态获取 (第422-493行)

```typescript
const status = Effect.fn("File.status")(function* () {
  if (Instance.project.vcs !== "git") return []
  
  const changed: FileStatus[] = []
  
  // 1. 获取已修改文件 (diff HEAD)
  const diffOutput = yield* gitText(["diff", "--numstat", "HEAD"])
  for (const line of diffOutput.trim().split("\n")) {
    const [added, removed, file] = line.split("\t")
    changed.push({ path: file, added, removed, status: "modified" })
  }
  
  // 2. 获取未跟踪文件 (新增)
  const untrackedOutput = yield* gitText(["ls-files", "--others", "--exclude-standard"])
  for (const file of untrackedOutput.trim().split("\n")) {
    if (file) changed.push({ path: file, status: "added" })
  }
  
  // 3. 获取已删除文件
  const deletedOutput = yield* gitText(["diff", "--name-only", "--diff-filter=D", "HEAD"])
  for (const file of deletedOutput.trim().split("\n")) {
    if (file) changed.push({ path: file, status: "deleted" })
  }
  
  return changed
})
```

#### 文件搜索 (第620-660行)

```typescript
const search = Effect.fn("File.search")(function* (input) {
  yield* ensure()
  const { cache } = yield* InstanceState.get(state)
  
  const query = input.query.trim()
  const limit = input.limit ?? 100
  const preferHidden = query.startsWith(".") || query.includes("/.")
  
  if (!query) {
    // 空查询：返回前 N 个结果
    if (input.type === "file") return cache.files.slice(0, limit)
    return sortHiddenLast(cache.dirs.toSorted(), preferHidden).slice(0, limit)
  }
  
  // 使用 fuzzysort 进行模糊匹配
  const items = input.type === "directory" ? cache.dirs :
                input.type === "file" ? cache.files :
                [...cache.files, ...cache.dirs]
  
  const sorted = fuzzysort.go(query, items, { limit }).map(item => item.target)
  return input.type === "directory" 
    ? sortHiddenLast(sorted, preferHidden).slice(0, limit)
    : sorted
})
```

### 4. API 路由

**文件**: `packages/opencode/src/server/routes/file.ts`

```typescript
// 文件列表
.get("/file", {
  operationId: "file.list",
  async (c) => {
    const path = c.req.valid("query").path
    const content = await File.list(path)
    return c.json(content)
  },
})

// Git 状态
.get("/file/status", {
  operationId: "file.status",
  description: "Get the git status of all files in the project.",
  async (c) => c.json(await File.status()),
})

// 文件搜索
.get("/find/files", {
  operationId: "find.files",
  async (c) => {
    const { query, dirs, limit } = c.req.valid("query")
    const results = await File.search({ query, dirs: dirs === "true", limit })
    return c.json(results)
  },
})
```

---

## 🔄 渲染逻辑

### 文件树渲染 (file-tree.tsx 第388-505行)

```tsx
return (
  <div data-component="filetree" class="flex flex-col gap-0.5">
    <For each={nodes()}>
      {(node) => {
        const expanded = () => file.tree.state(node.path)?.expanded ?? false
        
        return (
          <Switch>
            {/* 目录节点 */}
            <Match when={node.type === "directory"}>
              <Collapsible 
                open={expanded()} 
                onOpenChange={(open) => (
                  open ? file.tree.expand(node.path) : file.tree.collapse(node.path)
                )}
              >
                <Collapsible.Trigger>
                  <FileTreeNode 
                    node={node} 
                    level={level} 
                    kinds={props.kinds}
                    marks={props.marks}
                  >
                    <Icon name={expanded() ? "chevron-down" : "chevron-right"} />
                  </FileTreeNode>
                </Collapsible.Trigger>
                <Collapsible.Content>
                  {/* 递归渲染子目录 */}
                  <FileTree 
                    path={node.path} 
                    level={level + 1}
                    {...props}
                  />
                </Collapsible.Content>
              </Collapsible>
            </Match>
            
            {/* 文件节点 */}
            <Match when={node.type === "file"}>
              <FileTreeNode 
                node={node} 
                level={level}
                as="button"
                onClick={() => props.onFileClick?.(node)}
              >
                <FileIcon node={node} />
                <span>{node.name}</span>
              </FileTreeNode>
            </Match>
          </Switch>
        )
      }}
    </For>
  </div>
)
```

### 节点过滤逻辑 (第329-385行)

```typescript
// 计算需要显示的节点
const nodes = createMemo(() => {
  const children = file.tree.children(props.path) ?? []
  
  // "变更"模式：只显示允许的文件
  if (props.allowed) {
    const allowedSet = new Set(props.allowed)
    return children.filter(node => {
      if (node.type === "directory") {
        // 目录：检查是否有子节点在 allowed 中
        return hasAllowedDescendant(node.path, allowedSet)
      }
      return allowedSet.has(node.path)
    })
  }
  
  // "所有文件"模式：显示所有文件，标记变更的
  return children
})
```

---

## 🎯 交互功能

### 1. 展开/折叠

**文件**: `packages/app/src/context/file/tree-store.ts`

```typescript
const expandDir = (input: string) => {
  const dir = options.normalizeDir(input)
  ensureDir(dir)
  setTree("dir", dir, "expanded", true)
  void listDir(dir)  // 懒加载目录内容
}

const collapseDir = (input: string) => {
  const dir = options.normalizeDir(input)
  ensureDir(dir)
  setTree("dir", dir, "expanded", false)
}
```

### 2. 文件点击

```tsx
// "所有文件"模式：打开文件标签页
onFileClick={(node) => openTab(file.tab(node.path))}

// "变更"模式：聚焦 diff 视图
onFileClick={(node) => focusReviewDiff(node.path)}
```

### 3. 自动展开逻辑 (第48-62行)

```typescript
// 判断是否需要加载根目录
export function shouldListRoot(input: { level: number; dir?: { loaded?: boolean; loading?: boolean } }) {
  if (input.level !== 0) return false
  if (input.dir?.loaded) return false
  if (input.dir?.loading) return false
  return true
}

// 计算需要展开的目录（用于自动展开包含变更文件的目录）
export function dirsToExpand(input: { level: number; filter?: { dirs: Set<string> }; expanded: (dir: string) => boolean }) {
  if (input.level !== 0) return []
  if (!input.filter) return []
  return [...input.filter.dirs].filter((dir) => !input.expanded(dir))
}
```

---

## 🏷️ Git 状态显示

### 状态计算 (session-side-panel.tsx 第72-89行)

```typescript
const kinds = createMemo(() => {
  const merge = (a: "add" | "del" | "mix" | undefined, b: "add" | "del" | "mix") => {
    if (!a) return b
    if (a === b) return a
    return "mix" as const  // 混合状态（目录内同时有新增和删除）
  }

  const out = new Map<string, "add" | "del" | "mix">()
  for (const diff of props.diffs()) {
    const file = normalize(diff.file)
    const kind = diff.status === "added" ? "add" 
                 : diff.status === "deleted" ? "del" 
                 : "mix"
    out.set(file, kind)

    // 向上传递状态到父目录
    const parts = file.split("/")
    for (const [idx] of parts.slice(0, -1).entries()) {
      const dir = parts.slice(0, idx + 1).join("/")
      out.set(dir, merge(out.get(dir), kind))
    }
  }
  return out
})
```

### 状态标签渲染 (file-tree.tsx 第65-90行)

```typescript
const kindLabel = (kind: Kind) => {
  if (kind === "add") return "A"   // 新增 - 绿色
  if (kind === "del") return "D"   // 删除 - 红色
  return "M"                        // 修改 - 黄色
}

const kindTextColor = (kind: Kind) => {
  if (kind === "add") return "color: var(--icon-diff-add-base)"
  if (kind === "del") return "color: var(--icon-diff-delete-base)"
  return "color: var(--icon-diff-modified-base)"
}
```

### 状态显示规则

| 状态 | 标签 | 颜色 | 说明 |
|------|------|------|------|
| `add` | A | 绿色 | 新增文件（未跟踪） |
| `del` | D | 红色 | 删除文件 |
| `mix` | M | 黄色 | 修改文件或目录内有多种状态 |

---

## 📐 布局与持久化

**文件**: `packages/app/src/context/layout.tsx`

```typescript
// 文件树布局状态 (第643-681行)
fileTree: {
  opened: createMemo(() => store.fileTree?.opened ?? true),
  width: createMemo(() => store.fileTree?.width ?? DEFAULT_FILE_TREE_WIDTH),  // 默认 200px
  tab: createMemo(() => store.fileTree?.tab ?? "changes"),  // 默认显示"变更"标签
  
  setTab(tab: "changes" | "all") {
    setStore("fileTree", "tab", tab)
  },
  open() {
    setStore("fileTree", "opened", true)
  },
  close() {
    setStore("fileTree", "opened", false)
  },
  toggle() {
    setStore("fileTree", "opened", (v) => !v)
  },
  resize(width: number) {
    setStore("fileTree", "width", width)
  },
}
```

### 持久化存储

使用 `makePersisted` 将 `fileTree` 状态持久化到 `localStorage`：
- `opened`: 面板是否打开
- `width`: 面板宽度
- `tab`: 当前标签页 ("changes" | "all")

---

## 📂 文件变更监听

**文件**: `packages/app/src/context/file/watcher.ts`

```typescript
export function invalidateFromWatcher(event, ops) {
  const path = ops.normalize(rawPath)
  
  // 如果文件已打开或正在编辑，重新加载
  if (ops.hasFile(path) || ops.isOpen?.(path)) {
    ops.loadFile(path)
  }
  
  // 刷新父目录
  const parent = path.split("/").slice(0, -1).join("/")
  if (!ops.isDirLoaded(parent)) return
  ops.refreshDir(parent)
}
```

### 事件监听 (file.tsx 第186-204行)

```typescript
const stop = sdk.event.listen((e) => {
  invalidateFromWatcher(e.details, {
    normalize: path.normalize,
    hasFile: (file) => Boolean(store.file[file]),
    isOpen: (file) => tabs.all().some((tab) => path.pathFromTab(tab) === file),
    loadFile: (file) => void load(file, { force: true }),
    node: tree.node,
    isDirLoaded: tree.isLoaded,
    refreshDir: (dir) => void tree.listDir(dir, { force: true }),
  })
})
```

---

## ⚡ 性能优化

| 优化项 | 实现方式 | 说明 |
|--------|---------|------|
| **懒加载** | 目录仅在展开时加载 | 减少初始加载时间 |
| **请求合并** | `inflight` Map | 防止重复请求同一目录 |
| **增量更新** | `produce` 细粒度更新 | 避免全量替换 |
| **缓存机制** | 已加载目录不重复获取 | 减少网络请求 |
| **递归深度限制** | `MAX_DEPTH = 128` | 防止无限递归 |
| **文件内容 LRU 缓存** | `content-cache.ts` | 管理文件内容缓存 |
| **模糊搜索** | `fuzzysort` 库 | 高效的文件搜索 |

---

## 📁 关键文件汇总

| 文件路径 | 作用 |
|---------|------|
| `packages/app/src/components/file-tree.tsx` | 文件树 UI 组件（递归渲染） |
| `packages/app/src/context/file.tsx` | 文件上下文和状态管理 |
| `packages/app/src/context/file/tree-store.ts` | 文件树状态存储（展开/折叠/加载） |
| `packages/app/src/pages/session/session-side-panel.tsx` | 侧面板容器（包含文件树标签切换） |
| `packages/app/src/context/layout.tsx` | 布局状态（fileTree 宽度、开关、标签） |
| `packages/app/src/context/file/watcher.ts` | 文件变更监听 |
| `packages/opencode/src/file/index.ts` | 后端文件服务（list、status、search） |
| `packages/opencode/src/server/routes/file.ts` | 文件 API 路由 |
| `packages/ui/src/components/file-icon.tsx` | 文件图标组件 |
| `packages/ui/src/components/collapsible.tsx` | 折叠面板组件 |

---

## 🔄 数据流程图

```
用户操作
   │
   ├── 展开目录 ──→ expandDir() ──→ listDir() ──→ SDK API ──→ 后端 file.list ──→ 读取文件系统
   │                                              │
   │                                              └──→ 更新 tree-store ──→ 触发 UI 重渲染
   │
   ├── 点击文件 ──→ onFileClick ──→ openTab() ──→ 加载文件内容 ──→ 显示编辑器
   │
   ├── 切换标签 ──→ setTab("all"/"changes") ──→ 持久化到 localStorage
   │
   └── 文件变更 ──→ SSE 事件 ──→ invalidateFromWatcher ──→ refreshDir() ──→ 重新加载目录
```

---

**分析日期**: 2026-04-13
**分析工具**: Qwen Code Agent
**状态**: ✅ 完成

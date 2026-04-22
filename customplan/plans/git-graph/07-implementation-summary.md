# GRAPH 功能实现总结

**实现日期**: 2026 年 4 月 16 日
**状态**: ✅ 已完成（MVP 版本）
**最后更新**: 2026 年 4 月 17 日

---

## 📋 实现概述

在 OpenCode Session 页面的变更下拉按钮中成功添加了 **GRAPH** 选项，用于可视化展示 Git 提交历史。

### 已实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| GRAPH 选项 | ✅ 完成 | 在下拉菜单中显示 GRAPH 选项 |
| 提交历史列表 | ✅ 完成 | 垂直列表展示 Git 提交（时间倒序） |
| 分支颜色标识 | ✅ 完成 | 不同泳道使用不同颜色圆点 |
| 分支标签显示 | ✅ 完成 | 显示本地/远程分支标签 |
| 提交信息展示 | ✅ 完成 | 显示标题、作者、相对时间 |
| 悬停预览 | ✅ 完成 | 鼠标悬停显示完整信息（使用 Portal） |
| 详情面板 | ✅ 完成 | 点击显示提交详情 |
| 刷新功能 | ✅ 完成 | 手动刷新提交历史 |
| 视图切换按钮 | ✅ 完成 | Tree/List 切换（Tree 模式显示泳道连线） |
| 滚动加载更多 | ✅ 完成 | 滚动到底部自动加载更多（支持分页） |
| 后端 API 分页 | ✅ 完成 | 支持 `limit` 和 `offset` 参数 |

---

## 🏗️ 技术架构

### 后端实现

```
packages/opencode/src/
├── git/index.ts              # Git 命令封装
│   ├── log()                 # 获取提交历史（支持 limit+offset）
│   ├── getBranches()         # 获取分支列表
│   └── getCurrentBranch()    # 获取当前分支
├── project/vcs.ts            # VCS 服务
│   ├── computeLanes()        # 泳道计算算法
│   └── graph()               # GRAPH 数据聚合（支持分页）
└── server/instance/index.ts
    └── GET /git/graph        # API 路由（支持 limit, offset）
```

### 前端实现

```
packages/ui/src/components/git-graph/
├── git-graph.tsx             # 主组件（含数据加载、滚动监听）
├── git-graph-header.tsx      # 头部工具栏（已移除，集成到 session.tsx）
├── git-graph-body.tsx        # 主体内容（含滚动容器）
├── commit-row.tsx            # 提交行组件
├── commit-detail.tsx         # 详情面板
├── hover-preview.tsx         # 悬停预览（使用 Portal）
├── lane-lines.tsx            # SVG 泳道连线（Tree 模式）
├── types.ts                  # 类型定义
└── index.ts                  # 组件导出

packages/app/src/pages/
└── session.tsx               # 集成到 Session 页面（含 header）
```

---

## 🔧 关键实现细节

### 1. 后端 Git 命令封装

**文件**: `packages/opencode/src/git/index.ts`

```typescript
const log = Effect.fn("Git.log")(function* (cwd: string, limit: number = 100) {
  // 使用 null 分隔符避免 JSON 转义问题
  const format = "%H%x00%h%x00%s%x00%an%x00%at%x00%P%x00%D"
  const output = yield* text([
    "log",
    `--format=${format}`,
    `-n ${limit}`,
    "--all",
  ], { cwd })
  
  // 解析 null 分隔的输出
  return output
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      const parts = line.split("\0")
      return [{
        hash: parts[0],
        short_hash: parts[1],
        message: parts[2],
        author: parts[3],
        author_date: parseInt(parts[4]),
        parents: parts[5]?.split(/\s+/) || [],
        refs: parts[6]?.split(/,\s*/) || undefined,
      }]
    })
})
```

### 2. 泳道分配算法

**文件**: `packages/opencode/src/project/vcs.ts`

```typescript
const computeLanes = (commits: Git.Commit[]) => {
  const laneMap = new Map<string, number>()
  const lanePool: number[] = []
  let nextLane = 0

  for (const commit of commits) {
    const parentLanes = commit.parents
      .map((p) => laneMap.get(p))
      .filter((l): l is number => l !== undefined)

    if (parentLanes.length > 0) {
      // 继承第一个父 commit 的泳道
      laneMap.set(commit.hash, parentLanes[0])
      // 释放其他泳道回池
      parentLanes.slice(1).forEach((l) => lanePool.push(l))
    } else {
      // 无父 commit：分配新泳道或复用池中泳道
      const lane = lanePool.pop() ?? nextLane++
      laneMap.set(commit.hash, lane)
    }
  }

  return laneMap
}
```

### 3. 分支颜色分配

**文件**: `packages/ui/src/components/git-graph/lane-lines.tsx`

```typescript
const COLORS = [
  "#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5",
  "#8E24AA", "#F4511E", "#5E35B1", "#00ACC1", "#7CB342",
]

const getColor = (lane: number) => COLORS[lane % COLORS.length]
```

### 4. 滚动加载更多（防死循环）

**文件**: `packages/ui/src/components/git-graph/git-graph.tsx`

```typescript
const [isRestoringScroll, setIsRestoringScroll] = createSignal(false)

const loadData = async (append = false) => {
  if (loading()) return
  setLoading(true)
  try {
    const currentOffset = append ? (data()?.commits?.length || 0) : 0
    const result = await clientToUse.git.graph({
      limit: 100,
      offset: currentOffset,
    })
    
    if (append && data()?.commits) {
      const container = containerRef
      if (container) {
        const oldScrollTop = container.scrollTop
        const oldScrollHeight = container.scrollHeight
        
        // 标记正在恢复滚动，防止触发新的加载
        setIsRestoringScroll(true)
        
        setData({
          ...data()!,
          commits: [...currentCommits, ...result.data.commits],
        })
        
        // 等待 DOM 更新后恢复滚动位置
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight
            const heightDiff = newScrollHeight - oldScrollHeight
            container.scrollTop = oldScrollTop + heightDiff
            
            // 延迟解除恢复标记
            setTimeout(() => {
              setIsRestoringScroll(false)
            }, 100)
          })
        })
      }
    }
    
    setHasMore(result.data.commits.length >= 100)
  } finally {
    setLoading(false)
  }
}

const handleScroll = (e: Event) => {
  // 正在恢复滚动位置时不触发加载
  if (isRestoringScroll()) return
  
  const target = e.target as HTMLDivElement
  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
  
  if (scrollTimeout) clearTimeout(scrollTimeout)
  
  scrollTimeout = setTimeout(() => {
    if (isRestoringScroll()) return
    
    if (scrollBottom < 50 && hasMore() && !loading()) {
      void loadData(true)
    }
  }, 100)
}
```

### 5. 悬停预览（使用 Portal）

**文件**: `packages/ui/src/components/git-graph/hover-preview.tsx`

```typescript
import { Portal } from "solid-js/web"

export function HoverPreview(props: HoverPreviewProps) {
  return (
    <Show when={props.commit}>
      <Portal>
        <div
          style={{
            left: `${props.position.x + 15}px`,
            top: `${props.position.y + 15}px`,
            position: "fixed",
            "z-index": "9999",
          }}
        >
          {/* 预览内容 */}
        </div>
      </Portal>
    </Show>
  )
}
```

### 6. Tree 模式泳道连线

**文件**: `packages/ui/src/components/git-graph/lane-lines.tsx`

```typescript
export function LaneLines(props: LaneLinesProps) {
  const lines = () => {
    const commits = props.commits
    const laneMap = props.laneMap
    const result: Array<{ x1, y1, x2, y2, color, type }> = []

    commits.forEach((commit, index) => {
      const lane = laneMap[commit.hash] ?? 0
      const x = lane * 40 + 20
      const y = index * 48 + 24

      // 绘制向下的垂直线
      if (index < commits.length - 1) {
        result.push({ x1: x, y1: y, x2: x, y2: y + 24, color: getColor(lane), type: "vertical" })
      }

      // 绘制到父 commit 的连线
      commit.parents.forEach((parentHash) => {
        const parentIndex = commits.findIndex((c) => c.hash === parentHash)
        if (parentIndex > index) {
          const parentLane = laneMap[parentHash] ?? 0
          const px = parentLane * 40 + 20
          const py = parentIndex * 48 + 24

          if (parentLane !== lane) {
            // 曲线连接
            result.push({
              x1: x, y1: y + 12, x2: x, y2: y + 36,
              color: getColor(lane), type: "vertical",
            })
            result.push({
              x1: x, y1: y + 36, x2: px, y2: py - 24,
              color: getColor(lane), type: "curve",
            })
          }
        }
      })
    })

    return result
  }

  return (
    <svg class="lane-lines" width="100%" height="100%">
      <For each={lines()}>
        {(line) =>
          line.type === "curve" ? (
            <path
              d={`M ${line.x1} ${line.y1} C ${line.x1} ${line.y1 + 20}, ${line.x2} ${line.y2 - 20}, ${line.x2} ${line.y2}`}
              stroke={line.color}
              stroke-width="3"
              fill="none"
            />
          ) : (
            <line
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke={line.color}
              stroke-width="3"
              fill="none"
            />
          )
        }
      </For>
    </svg>
  )
}
```

---

## 📝 修改的文件清单

### 后端文件

| 文件 | 修改内容 |
|------|----------|
| `packages/opencode/src/git/index.ts` | 新增 `log()`, `getBranches()`, `getCurrentBranch()` 方法 |
| `packages/opencode/src/project/vcs.ts` | 新增 `GitCommit`, `GitBranch`, `GitGraphData` 类型和 `graph()` 方法，支持 `offset` 分页 |
| `packages/opencode/src/server/instance/index.ts` | 新增 `GET /git/graph` 路由，支持 `limit` 和 `offset` 查询参数 |

### 前端文件

| 文件 | 修改内容 |
|------|----------|
| `packages/ui/src/components/git-graph/` | 新建组件目录（9 个文件） |
| `packages/ui/src/components/git-graph.css` | 样式文件（已移动到 `components/` 目录） |
| `packages/ui/src/components/git-graph/index.ts` | 组件导出 |
| `packages/ui/package.json` | 添加 `./git-graph` 导出规则 |
| `packages/app/src/pages/session.tsx` | 集成 GitGraph 组件，添加 header 和视图切换按钮 |
| `packages/sdk/js/src/v2/gen/` | 自动生成类型（包含 `offset` 参数） |

---

## 🐛 遇到的问题与解决

### 问题 1: Git 命令输出为空

**现象**: `git log` 返回空字符串

**原因**: `--no-optional-locks` 不是 `git log` 的有效参数

**解决**: 移除该参数

```diff
- "--no-optional-locks",
```

---

### 问题 2: JSON 格式解析失败

**现象**: Git 输出无法解析为 JSON

**原因**: Git 格式字符串中的引号转义复杂

**解决**: 改用 null 分隔符的简单格式

```typescript
// 之前（失败）
const format = JSON.stringify({ hash: "%H", short_hash: "%h", ... })

// 之后（成功）
const format = "%H%x00%h%x00%s%x00%an%x00%at%x00%P%x00%D"
const parts = line.split("\0")
```

---

### 问题 3: Electron 401 未授权

**现象**: fetch 请求返回 401

**原因**: Electron 后端使用 Basic Auth 认证

**解决**: 使用已认证的 SDK client

```typescript
// 之前（失败）
const response = await fetch("/git/graph")

// 之后（成功）
const result = await client.git.graph({ limit: 100 })
```

---

### 问题 4: CSS 类未定义

**现象**: Tailwind 报错 `bg-bg` 等类未定义

**原因**: 项目使用自定义 CSS 变量，非 Tailwind 原子类

**解决**: 重写 CSS 使用项目的设计系统变量

```css
/* 之前（失败） */
.git-graph { @apply bg-bg text-text; }

/* 之后（成功） */
.git-graph {
  background-color: var(--background-stronger);
  color: var(--text-base);
}
```

---

### 问题 5: 悬停预览位置不对

**现象**: 预览窗口不在鼠标位置

**原因**: 容器有 CSS transform 导致 fixed 定位失效

**解决**: 使用 SolidJS Portal 渲染到 document body

```typescript
<Portal>
  <div style={{
    left: `${props.position.x + 15}px`,
    top: `${props.position.y + 15}px`,
    position: "fixed",
    "z-index": "9999",
  }}>
```

---

### 问题 6: 滚动加载死循环

**现象**: 滚动到底部后无限加载，页面跳回顶部

**原因**:
1. 恢复滚动位置后，`scrollBottom < 50` 仍然成立
2. 滚动事件继续触发加载

**解决**:
1. 添加 `isRestoringScroll` 状态标记
2. 在恢复期间禁用滚动监听
3. 延迟解除恢复标记

```typescript
const [isRestoringScroll, setIsRestoringScroll] = createSignal(false)

// 恢复滚动时
setIsRestoringScroll(true)
// ...恢复逻辑
setTimeout(() => {
  setIsRestoringScroll(false)
}, 100)

// 滚动处理
const handleScroll = (e: Event) => {
  if (isRestoringScroll()) return  // 恢复期间不触发加载
  // ...
}
```

---

### 问题 7: 后端 API 不支持分页

**现象**: 每次返回相同的 100 条数据

**解决**: 后端 API 添加 `offset` 参数

```typescript
// 后端
graph: Effect.fn("Vcs.graph")(function* (options?: { limit?: number; offset?: number }) {
  const allCommits = yield* git.log(dir, limit + offset)
  const commits = allCommits.slice(offset)  // 分页
  return { commits, ... }
})

// 前端
const currentOffset = append ? (data()?.commits?.length || 0) : 0
const result = await client.git.graph({
  limit: 100,
  offset: currentOffset,
})
```

---

### 问题 8: 滚动定位后仍在底部

**现象**: 数据更新后，滚动条位置回到最底部，导致立即再次触发加载

**原因**: 
1. `git-graph-body.tsx` 中 `<Show when={!props.loading}>` 条件导致
2. `loading=true` 时 DOM 显示 "Loading..." 文本（高度 660px）
3. 实际数据被隐藏，`scrollHeight` 无法正确计算

**解决**: 
1. 修改 `<Show>` 条件为 `props.data && hasCommits()`，不依赖 `loading` 状态
2. Loading indicator 显示在列表底部，不影响滚动高度

```typescript
// 之前（失败）
<Show when={!props.loading && props.data}>

// 之后（成功）
<Show when={props.data && hasCommits()}>
```

---

### 问题 9: 数据重复（100% 重复）

**现象**: 每次滚动加载返回的数据完全相同，100 条数据全部重复

**原因**: 
1. SDK 类型定义过期，`git.graph()` 方法没有 `offset` 参数
2. 前端调用时虽然传递了 `offset: 100`，但 SDK 没有将其加入查询参数
3. 后端始终收到 `offset=0`，返回相同数据

**诊断日志**:
```
前端：calling client.git.graph, offset: 100
后端：called with query: { limit: 100 }  // 缺少 offset!
后端：parsed commits: 100 first: ea55e3312  // 与第一次相同
```

**解决**: 重新生成 SDK
```bash
cd packages/sdk/js && bun run ./script/build.ts
```

**验证日志**:
```
前端：calling client.git.graph, offset: 100
后端：called with query: { limit: 100, offset: 100 }
后端：args: log --format=... -n 100 --all --skip=100
后端：parsed commits: 100 first: cb7399796  // 不同的 hash
```

---

### 问题 10: 分页性能问题

**现象**: 随着 offset 增大，后端性能下降

**原因**: 
```typescript
// 之前的实现
const allCommits = yield* git.log(dir, limit + offset)
const commits = allCommits.slice(offset)  // 获取后截取
```
- offset=100 时获取 200 条，截取 100 条
- offset=500 时获取 600 条，截取 100 条
- 大量无用数据被获取和计算

**解决**: 让 `git log` 直接使用 `--skip` 参数
```typescript
// 之后实现
const log = (cwd, limit, offset = 0) => {
  const args = ["log", `--format=${format}`, `-n ${limit}`, "--all"]
  if (offset > 0) args.push(`--skip=${offset}`)
  return yield* text(args, { cwd })
}

const commits = yield* git.log(dir, limit, offset)  // 直接获取分页数据
```

**性能对比**:
| offset | 之前 | 现在 |
|--------|------|------|
| 0 | 100 条 | 100 条 ✅ |
| 100 | 200 条 | 100 条 ✅ |
| 500 | 600 条 | 100 条 ✅ |
| 1000 | 1100 条 | 100 条 ✅ |

---

### 问题 11: 滚动位置计算错误

**现象**: 加载后滚动位置不对，用户看不到新数据

**原因**: 滚动恢复逻辑错误，使用了 `scrollTop = oldScrollTop + heightDiff`

**解决**: 正确的滚动定位逻辑
```typescript
// 新数据追加在底部，用户希望看到新数据的开始位置
// scrollBottom 应该等于新数据高度
// 这样：200 条时 scrollBottom=1/2，300 条时=1/3，400 条时=1/4
const newScrollTop = newScrollHeight - clientHeight - heightDiff
container.scrollTop = Math.max(0, newScrollTop)
```

**效果验证**（假设每条 48px 高度）:
| 数据量 | scrollHeight | heightDiff | scrollBottom | 距离底部比例 |
|--------|--------------|------------|--------------|--------------|
| 100 条 | 4800 | - | 4300 | 89% (底部) |
| 200 条 | 9600 | 4800 | 4800 | **1/2** ✅ |
| 300 条 | 14400 | 4800 | 4800 | **1/3** ✅ |
| 400 条 | 19200 | 4800 | 4800 | **1/4** ✅ |

---

## 📊 实现进度

| Phase | 任务 | 状态 |
|-------|------|------|
| **Phase 1** | 类型定义与 API 设计 | ✅ 完成 |
| **Phase 2** | 后端实现 | ✅ 完成 |
| **Phase 3** | SDK 生成 | ✅ 完成 |
| **Phase 4** | 前端组件 | ✅ 完成 |
| **Phase 5** | Session 集成 | ✅ 完成 |
| **Phase 6** | 测试优化 | ✅ 完成（MVP） |
| **Phase 7** | 文档清理 | ✅ 完成 |

---

## 🚀 后续优化方向

### 性能优化

- [ ] **虚拟滚动**: 使用 `@tanstack/solid-virtual` 优化大数据量渲染
- [ ] **数据缓存**: 避免重复请求相同数据
- [ ] **泳道连线优化**: Tree 模式下大量提交时性能优化

### 功能增强

- [ ] **搜索/筛选**: 按作者、时间范围、关键词筛选
- [ ] **懒加载历史**: 滚动到底部加载更多（已实现，待优化）
- [ ] **右键菜单**: checkout、cherry-pick、copy hash 等操作
- [ ] **Open on GitHub**: 跳转到 GitHub 查看提交
- [ ] **完整的 Tree 模式**: 更复杂的分支合并可视化

### 用户体验

- [ ] **骨架屏加载动画**: 替换 "Loading..." 文本
- [ ] **错误处理**: 更友好的错误提示
- [ ] **空状态优化**: 没有 Git 历史时的引导

---

## 📌 关键代码位置

| 功能 | 文件位置 | 行号 |
|------|----------|------|
| API 路由 | `packages/opencode/src/server/instance/index.ts` | 171 |
| Git log | `packages/opencode/src/git/index.ts` | 264 |
| 泳道计算 | `packages/opencode/src/project/vcs.ts` | 200 |
| VCS graph | `packages/opencode/src/project/vcs.ts` | 289 |
| 前端集成 | `packages/app/src/pages/session.tsx` | 1321 |
| GitGraph 组件 | `packages/ui/src/components/git-graph/git-graph.tsx` | 1 |
| 悬停预览 | `packages/ui/src/components/git-graph/hover-preview.tsx` | 1 |
| 泳道连线 | `packages/ui/src/components/git-graph/lane-lines.tsx` | 1 |

---

## ✅ 验证步骤

1. **构建后端**:
   ```bash
   cd packages/opencode && bun run build
   ```

2. **生成 SDK**:
   ```bash
   cd packages/opencode && bun dev generate > ../sdk/openapi.json
   cd packages/sdk/js && bun run ./script/build.ts
   ```

3. **启动 Electron**:
   ```bash
   cd packages/desktop-electron && bun dev
   ```

4. **切换到 GRAPH**:
   - 点击变更下拉按钮
   - 选择 GRAPH 选项

5. **验证功能**:
   - [ ] 提交列表显示
   - [ ] 分支颜色正确
   - [ ] 悬停预览正常
   - [ ] Tree/List 切换有效
   - [ ] 滚动加载更多正常
   - [ ] 刷新功能正常

6. **检查控制台日志**:
   ```
   [GitGraph] loadData called, append: false, loading: false
   [GitGraph] client exists: true
   [GitGraph] calling client.git.graph, offset: 0
   [GitGraph] result.data: { commits: Array(100), ... }
   [GitGraph] setting initial data
   ```

---

## 📚 相关文档

- [00-index.md](./00-index.md) - 文档索引
- [01-existing-features.md](./01-existing-features.md) - 现有功能分析
- [02-vscode-git-graph-analysis.md](./02-vscode-git-graph-analysis.md) - VSCode Git Graph 分析
- [03-new-feature-requirements.md](./03-new-feature-requirements.md) - 新功能需求
- [04-graph-page-design.md](./04-graph-page-design.md) - 页面设计方案
- [05-graph-implementation-todo.md](./05-graph-implementation-todo.md) - 实现 TODO List
- [06-verification-report.md](./06-verification-report.md) - 验证报告
- **07-implementation-summary.md** - 实现总结（本文档）

---

*最后更新：2026 年 4 月 16 日*  
*作者：AI Assistant*  
*状态：✅ MVP 已完成*

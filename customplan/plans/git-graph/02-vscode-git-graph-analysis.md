# VSCode Git Graph 功能分析

本文档详细分析 VSCode 内置的 Git 提交历史可视化功能（Git Graph），为 OpenCode 实现类似功能提供参考。

---

## 一、功能概述

VSCode 的 Git Graph 是一个**可视化 Git 提交历史**的功能，它以图形化的方式展示分支、合并、标签等 Git 操作的历史记录。

### 核心特点
- **时间线视图**：垂直时间线，从上到下按时间倒序展示提交
- **分支可视化**：用不同颜色的线条表示不同分支
- **合并关系**：清晰展示分支合并的拓扑结构
- **提交信息**：每条提交显示摘要、作者、时间戳

---

## 二、UI 布局分析

### 2.1 整体结构

```
┌─────────────────────────────────────────────────────────────┐
│ GRAPH                                    custom/dev  🔄 ↓ ↑ │
│ ○ 显示 token 当前使用量  haochangxia       @custom/dev 👤     │
│ │                                                              │
│ ○  Merge branch 'dev' into custom/dev  haochangxia            │
│ │ Merge remote-tracking branch 'upstream/dev' into dev         │
│ │                                                              │
│ ●  Update VOUCHED list  github-actions[bot]         origin/dev │
│ │                                                              │
│ ●  fix: update prompt input submit handler  Brendan Allan      │
│ │                                                              │
│ ●  chore: update nix node_modules hashes  opencode-agent[bot]  │
│ │                                                              │
│ ●  release: v1.4.5  opencode                                  │
│ │                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心元素

| 元素 | 说明 |
|------|------|
| **标题栏** | 显示 "GRAPH" + 当前分支 + 同步操作按钮 |
| **提交节点** | 左侧圆点表示提交，颜色代表分支 |
| **连接线** | 垂直/斜线连接提交，展示分支拓扑 |
| **提交行** | 每行包含：节点 + 标题 + 作者 + 分支标签 |
| **分支标签** | 右侧彩色标签显示分支名（如 `origin/dev`） |
| **HEAD 标签** | 显示当前所在分支（如 `@custom/dev`） |

---

## 三、数据结构分析

### 3.1 Git 提交数据

每个提交节点包含以下信息：

```typescript
interface GitCommit {
  hash: string           // 完整 commit hash
  shortHash: string      // 短 hash（前 7 位）
  message: string        // 提交信息（第一行）
  fullMessage?: string   // 完整提交信息（多行）
  author: string         // 作者名称
  authorEmail?: string   // 作者邮箱
  authorDate: number     // 作者时间戳
  committer?: string     // 提交者
  committerDate?: number // 提交时间戳
  parents: string[]      // 父 commit hash 列表
  refs?: string[]        // 分支/标签引用（如 "HEAD -> custom/dev", "origin/dev"）
  graphColor?: string    // 分支线条颜色
  lane?: number          // 所在泳道索引
}
```

### 3.2 分支引用数据

```typescript
interface GitRef {
  name: string           // 分支名（如 "custom/dev"）
  type: "local" | "remote" | "tag"
  color?: string         // 标签背景色
  commitHash: string     // 指向的 commit
}
```

---

## 四、可视化渲染逻辑

### 4.1 泳道（Lane）分配算法

Git Graph 使用**泳道系统**来管理分支线条：

```
泳道 0  泳道 1  泳道 2  泳道 3
  │       │       │       │
  ○───────┘       │       │  ← 分支合并
  │               │       │
  ○       ○───────┘       │  ← 分支合并
  │       │               │
  ○       ○               ○  ← 新分支
```

**算法步骤**：
1. 遍历 commits（按时间倒序）
2. 对于每个 commit：
   - 检查其父 commits 是否已有泳道
   - 如果有，继承父 commit 的泳道
   - 如果没有，分配新的空闲泳道
3. 合并操作：多条泳道汇聚到一点

### 4.2 颜色分配

```typescript
const branchColors = [
  "#E53935", // 红
  "#FB8C00", // 橙
  "#FDD835", // 黄
  "#43A047", // 绿
  "#1E88E5", // 蓝
  "#8E24AA", // 紫
  "#F4511E", // 深橙
  "#5E35B1", // 深紫
]

// 按泳道索引循环使用颜色
const getColor = (lane: number) => branchColors[lane % branchColors.length]
```

### 4.3 连接线绘制

使用 SVG 或 Canvas 绘制：

```typescript
interface GraphLine {
  from: { x: number; y: number }  // 起点坐标
  to: { x: number; y: number }    // 终点坐标
  color: string                    // 线条颜色
  type: "straight" | "curve"       // 直线或曲线
  width: number                    // 线宽
}
```

---

## 五、交互功能

### 5.1 鼠标交互

| 操作 | 效果 |
|------|------|
| **悬停** | 显示完整提交信息 tooltip |
| **点击** | 选中提交，显示详情面板 |
| **双击** | 查看提交变更（diff） |
| **右键** | 上下文菜单（checkout、cherry-pick 等） |

### 5.2 滚动优化

- **虚拟滚动**：只渲染可见区域的 commits
- **懒加载**：滚动到底部自动加载更多历史
- **节流渲染**：滚动时降低渲染频率

### 5.3 筛选功能

```typescript
interface GitGraphFilter {
  search?: string      // 搜索关键词
  author?: string      // 按作者筛选
  branch?: string      // 只显示特定分支
  since?: number       // 起始时间
  until?: number       // 结束时间
}
```

---

## 六、Git 命令映射

### 6.1 获取提交历史

```bash
# 基本命令
git log --graph --oneline --all --decorate

# 获取详细信息（JSON 格式）
git log \
  --format='{
    "hash": "%H",
    "shortHash": "%h",
    "message": "%s",
    "author": "%an",
    "authorEmail": "%ae",
    "authorDate": "%at",
    "parents": [%P],
    "refs": "%D"
  }' \
  --all
```

### 6.2 获取分支信息

```bash
# 本地分支
git branch --list

# 远程分支
git branch -r

# 当前分支
git rev-parse --abbrev-ref HEAD
```

### 6.3 获取远程信息

```bash
# 远程仓库 URL
git remote get-url origin

# 默认分支
git remote show origin | grep "HEAD branch"
```

---

## 七、OpenCode 实现方案

### 7.1 数据类型定义

**建议文件**: `packages/sdk/js/src/v2/gen/types.gen.ts`

```typescript
export type GitCommit = {
  hash: string
  short_hash: string
  message: string
  author: string
  author_email?: string
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
  remote?: string
}
```

### 7.2 API 端点设计

**建议文件**: `packages/opencode/src/app/session.ts`（或新建 `git.ts`）

```typescript
// GET /git/graph
// 响应：GitGraphData

interface GitGraphRequest {
  limit?: number       // 最多返回多少条 commits（默认 100）
  branch?: string      // 特定分支
  all?: boolean        // 是否包含所有分支（默认 true）
}
```

### 7.3 前端组件结构

**建议文件**: `packages/ui/src/components/git-graph.tsx`

```typescript
// 主组件
export function GitGraph(props: GitGraphProps) {
  const [data, setData] = createSignal<GitGraphData>()
  const [loading, setLoading] = createSignal(true)
  
  // 加载数据
  const loadData = async () => {
    const result = await sdk.client.git.graph()
    setData(result.data)
    setLoading(false)
  }
  
  // 泳道计算
  const lanes = createMemo(() => computeLanes(data()?.commits))
  
  // 颜色分配
  const getLaneColor = (lane: number) => COLORS[lane % COLORS.length]
  
  return (
    <div class="git-graph">
      <Show when={!loading()} fallback={<Loading />}>
        <GraphHeader currentBranch={data()?.current_branch} />
        <GraphBody commits={data()?.commits} lanes={lanes()} />
      </Show>
    </div>
  )
}
```

### 7.4 泳道计算算法

```typescript
function computeLanes(commits: GitCommit[]): Map<string, number> {
  const laneMap = new Map<string, number>()
  const lanePool: number[] = []
  let nextLane = 0
  
  for (const commit of commits) {
    // 检查是否有父 commit 已分配泳道
    const parentLanes = commit.parents
      .map((p) => laneMap.get(p))
      .filter((l) => l !== undefined)
    
    if (parentLanes.length > 0) {
      // 继承第一个父 commit 的泳道
      laneMap.set(commit.hash, parentLanes[0])
      // 释放其他泳道
      parentLanes.slice(1).forEach((l) => lanePool.push(l!))
    } else {
      // 分配新泳道
      const lane = lanePool.pop() ?? nextLane++
      laneMap.set(commit.hash, lane)
    }
  }
  
  return laneMap
}
```

### 7.5 简化版实现（MVP）

如果时间有限，可以先实现简化版本：

1. **只显示提交列表**（无连接线）
2. **用颜色圆点标识分支**
3. **显示基本信息**（hash、message、author、time）
4. **后续迭代**再添加完整的拓扑图

---

## 八、技术选型建议

### 8.1 渲染方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **SVG** | 清晰、易交互、CSS 可控 | 大量节点时性能差 | ⭐⭐⭐⭐ |
| **Canvas** | 性能好、适合大数据量 | 交互复杂、需要手动处理 | ⭐⭐⭐ |
| **DOM + CSS** | 简单、响应式好 | 连接线绘制困难 | ⭐⭐ |

**推荐**: 使用 **SVG** 绘制连接线 + **DOM** 渲染提交信息

### 8.2 依赖库

| 库 | 用途 | 是否需要 |
|------|------|----------|
| `d3` | 数据可视化 | 可选（太重） |
| `react-flow` | 流程图 | 不推荐（太复杂） |
| 自研 | 简单 SVG 绘制 | ✅ 推荐 |

---

## 九、实现优先级

### Phase 1: 基础展示
- [ ] 获取 Git 提交历史
- [ ] 显示提交列表（无图形）
- [ ] 分支标签显示
- [ ] 基础样式

### Phase 2: 图形化
- [ ] 泳道计算
- [ ] SVG 连接线绘制
- [ ] 分支颜色分配
- [ ] 虚拟滚动优化

### Phase 3: 交互增强
- [ ] 点击查看详情
- [ ] 右键菜单
- [ ] 搜索/筛选
- [ ] 懒加载历史

---

## 十、参考资源

### 10.1 VSCode 源码
- [VSCode Git 扩展源码](https://github.com/microsoft/vscode/tree/main/extensions/git)
- [GitGraph 开源插件](https://github.com/mhutchie/vscode-git-graph)

### 10.2 类似项目
- [GitKraken](https://www.gitkraken.com/) - 商业 Git GUI
- [Sourcetree](https://www.sourcetreeapp.com/) - Atlassian Git 客户端
- [LazyGit](https://github.com/jesseduffield/lazygit) - 终端 Git UI

### 10.3 技术文章
- [Drawing Git Graphs](https://github.com/atom/atom/issues/1404)
- [Git Visualization Algorithms](https://github.com/microsoft/vscode-pull-request-github/issues/1652)

---

## 十一、OpenCode 适配建议

### 11.1 与现有功能集成

GRAPH 选项选中后，可以：
1. **调用新 API**：`sdk.client.git.graph()`
2. **复用 SessionReviewTab 布局**：只需替换内容区域
3. **保持下拉按钮**：用户可随时切换回其他模式

### 11.2 性能考虑

- **限制初始加载数量**：默认 50-100 条 commits
- **滚动加载更多**：类似现有 session 历史加载
- **缓存数据**：避免重复请求

### 11.3 样式统一

使用现有设计系统：
- **颜色变量**：`var(--color-branch-0)` 等
- **字体**：`text-12-regular`、`text-14-medium`
- **间距**：Tailwind 原子类

---

## 十二、总结

VSCode Git Graph 的核心价值：
1. **直观展示分支关系**：一眼看出合并、分叉历史
2. **快速定位提交**：可视化比命令行更友好
3. **操作便捷**：右键即可完成 checkout、cherry-pick 等操作

OpenCode 实现建议：
1. **先做简化版**：提交列表 + 分支标签
2. **迭代图形化**：后续添加连接线
3. **保持扩展性**：预留交互接口

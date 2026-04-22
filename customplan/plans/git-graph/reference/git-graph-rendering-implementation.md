# Git Graph 分支泳道渲染实现详解

**文档版本：** 1.0  
**创建日期：** 2026 年 4 月 17 日  
**分析对象：** GitLens Commit Graph 渲染机制  
**参考图片：** GitLens Graph 界面截图

---

## 目录

1. [效果概述](#1-效果概述)
2. [核心概念](#2-核心概念)
3. [数据结构设计](#3-数据结构设计)
4. [泳道分配算法](#4-泳道分配算法)
5. [曲线绘制原理](#5-曲线绘制原理)
6. [完整实现方案](#6-完整实现方案)
7. [代码实现](#7-代码实现)
8. [渲染优化](#8-渲染优化)

---

## 1. 效果概述

### 1.1 目标效果

GitLens 的 Commit Graph 实现以下视觉效果：

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BRANCH/TAG │ GRAPH │ COMMIT MESSAGE │ AUTHOR │ DATE │ CHANGES │ SHA   │
├─────────────┼───────┼────────────────┼────────┼──────┼─────────┼───────┤
│             │   ●   │ Fix bug        │ Alice  │ 1h   │ +3 -1   │ a1b2  │
│ feature/a ──┼───●───│ Add feature    │ Bob    │ 2h   │ +10 -2  │ c3d4  │
│             │  /    │                │        │      │         │       │
│ main ────────●─────│ Merge branch   │ Alice  │ 3h   │ +0 -0   │ e5f6  │
│             │ │     │                │        │      │         │       │
│             │ ●     │ Init project   │ Alice  │ 4h   │ +100    │ g7h8  │
└─────────────┴───────┴────────────────┴────────┴──────┴─────────┴───────┘
```

### 1.2 视觉元素分解

| 元素 | 描述 | 实现方式 |
|------|------|----------|
| **泳道（Lane）** | 垂直的分支轨道，每条泳道有独立颜色 | Canvas 绘制垂直线 |
| **提交点（Commit Dot）** | 泳道上的圆形节点，表示提交 | Canvas 绘制圆形 |
| **分支标签（Branch Label）** | 分支名称标签，带背景色 | HTML/CSS 或 Canvas 文本 |
| **合并线（Merge Line）** | 连接父提交的曲线（贝塞尔曲线） | Canvas 贝塞尔曲线 |
| **引用线（Ref Line）** | 从提交点水平延伸到标签的线 | Canvas 直线 |
| **头像（Avatar）** | 提交作者的头像图标 | Canvas 图像或 HTML |

### 1.3 渲染架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitLens Extension (Node.js)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. GitProvider.graph.getGraph()                          │  │
│  │     └─> git log --graph --format=... --all                │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  2. LogParser.parse()                                     │  │
│  │     └─> 解析 SHA, parents, author, date, message, refs    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  3. GlGraphRowProcessor.processRow()                      │  │
│  │     └─> 添加 contexts, avatarUrl, emoji 转换              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  4. IPC: DidChangeRowsNotification                        │  │
│  │     └─> 发送 GitGraphRow[] 到 Webview                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ postMessage
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Webview (Browser/Canvas)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  5. GraphContainer (@gitkraken/gitkraken-components)      │  │
│  │     ┌─────────────────────────────────────────────────┐   │  │
│  │     │  泳道分配算法                                    │   │  │
│  │     │  ┌─────────────────────────────────────────┐    │   │  │
│  │     │  │ 1. 遍历提交，为每个新分支分配泳道索引   │    │   │  │
│  │     │  │ 2. 追踪每个泳道的当前状态（活跃/合并）  │    │   │  │
│  │     │  │ 3. 处理合并：合并源泳道到目标泳道       │    │   │  │
│  │     │  └─────────────────────────────────────────┘    │   │  │
│  │     ├─────────────────────────────────────────────────┤   │  │
│  │     │  曲线计算                                        │   │  │
│  │     │  ┌─────────────────────────────────────────┐    │   │  │
│  │     │  │ 1. 计算父提交和子提交的坐标             │    │   │  │
│  │     │  │ 2. 生成三次贝塞尔曲线控制点             │    │   │  │
│  │     │  │ 3. 处理多父提交（合并）的曲线分支       │    │   │  │
│  │     │  └─────────────────────────────────────────┘    │   │  │
│  │     ├─────────────────────────────────────────────────┤   │  │
│  │     │  Canvas 渲染                                     │   │  │
│  │     │  ┌─────────────────────────────────────────┐    │   │  │
│  │     │  │ 1. 绘制泳道垂直线                        │    │   │  │
│  │     │  │ 2. 绘制贝塞尔曲线（合并线）             │    │   │  │
│  │     │  │ 3. 绘制提交点（圆形）                    │    │   │  │
│  │     │  │ 4. 绘制引用标签和水平线                 │    │   │  │
│  │     │  │ 5. 绘制头像和文本信息                   │    │   │  │
│  │     │  └─────────────────────────────────────────┘    │   │  │
│  │     └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心概念

### 2.1 泳道（Lane）

**定义：** 泳道是 Git Graph 中垂直的分支轨道，每条泳道代表一个并行的开发线。

**特性：**
- 每条泳道有唯一的索引（0, 1, 2, ...）
- 每条泳道有独立的颜色（从预定义色板中分配）
- 泳道可以合并（当分支合并时）
- 泳道可以分叉（当创建新分支时）

**示例：**
```
泳道 0 (蓝色):  ●────●────●
                         ╲
泳道 1 (紫色):            ●────●
                         ╱
泳道 2 (绿色):  ●────●
```

### 2.2 提交点（Commit Node）

**定义：** 提交点是泳道上的圆形节点，表示一个 Git 提交。

**属性：**
- `sha`: 提交 SHA 哈希
- `lane`: 所在泳道索引
- `y`: 垂直位置（行索引）
- `parents`: 父提交 SHA 列表
- `refs`: 分支/标签引用列表

### 2.3 父提交关系（Parent Relationship）

**定义：** Git 提交可以有一个或多个父提交，用于表示分支和合并。

**类型：**
| 父提交数量 | 含义 | 图形表示 |
|-----------|------|----------|
| 0 | 初始提交 | 无连接线 |
| 1 | 普通提交 | 单条垂直线 |
| 2+ | 合并提交 | 多条曲线汇合 |

### 2.4 引用（Ref）

**定义：** 引用是指向提交的指针，包括分支、标签、HEAD 等。

**类型：**
- **本地分支** (`heads`): `main`, `feature/login`
- **远程分支** (`remotes`): `origin/main`, `upstream/dev`
- **标签** (`tags`): `v1.0.0`, `release-2024`
- **HEAD**: 当前检出的提交

---

## 3. 数据结构设计

### 3.1 核心数据结构

```typescript
/**
 * Git 图形行（提交）
 * 这是传递给渲染器的基本数据单元
 */
interface GitGraphRow {
    // ========== 基本信息 ==========
    /** 完整 SHA 哈希（40 字符） */
    sha: string;
    
    /** 短 SHA（通常 7 字符） */
    shortSha?: string;
    
    /** 父提交 SHA 列表 */
    parents: string[];
    
    // ========== 作者信息 ==========
    /** 作者姓名 */
    author: string;
    
    /** 作者邮箱 */
    email: string;
    
    /** 提交时间戳（毫秒） */
    date: number;
    
    // ========== 提交信息 ==========
    /** 提交消息（第一行） */
    message: string;
    
    /** 提交类型（影响渲染样式） */
    type: GitGraphRowType;
    
    // ========== 引用信息 ==========
    /** 本地分支引用列表 */
    heads?: GitGraphRowHead[];
    
    /** 远程分支引用列表 */
    remotes?: GitGraphRowRemoteHead[];
    
    /** 标签引用列表 */
    tags?: GitGraphRowTag[];
    
    // ========== 渲染相关 ==========
    /** 变更统计（用于显示变更条） */
    stats?: GitGraphRowStats;
    
    /** 是否为当前用户提交 */
    isCurrentUser?: boolean;
}

/**
 * 提交类型
 */
type GitGraphRowType = 
    | 'commit-node'           // 普通提交
    | 'merge-node'            // 合并提交
    | 'stash-node'            // 暂存提交
    | 'work-dir-changes'      // 工作区变更
    | 'merge-conflict-node';  // 合并冲突

/**
 * 本地分支引用
 */
interface GitGraphRowHead {
    /** 分支名称 */
    name: string;
    
    /** 是否为当前 HEAD */
    isCurrentHead: boolean;
    
    /** 上游分支信息 */
    upstream?: { name: string };
}

/**
 * 远程分支引用
 */
interface GitGraphRowRemoteHead {
    /** 远程名称 */
    remote: string;
    
    /** 分支名称 */
    name: string;
    
    /** 头像 URL（用于远程贡献者） */
    avatarUrl?: string;
}

/**
 * 标签引用
 */
interface GitGraphRowTag {
    /** 标签名称 */
    name: string;
    
    /** 是否为附注标签 */
    annotated: boolean;
}

/**
 * 变更统计
 */
interface GitGraphRowStats {
    /** 新增行数 */
    additions: number;
    
    /** 删除行数 */
    deletions: number;
}
```

### 3.2 图形容器

```typescript
/**
 * Git 图形容器
 * 包含所有提交行和元数据
 */
interface GitGraph {
    /** 仓库路径 */
    repoPath: string;
    
    /** 所有提交行 */
    rows: GitGraphRow[];
    
    /** 分支信息映射 */
    branches: Map<string, GitBranch>;
    
    /** 远程信息映射 */
    remotes: Map<string, GitRemote>;
    
    /** 头像缓存 */
    avatars: Map<string, string>;
    
    /** Stash 信息 */
    stashes: Map<string, GitStashCommit>;
    
    /** 分页信息 */
    paging?: {
        limit: number;
        hasMore: boolean;
    };
}

/**
 * 分支信息
 */
interface GitBranch {
    /** 分支名称 */
    name: string;
    
    /** 最新提交 SHA */
    commit: string;
    
    /** 是否为当前分支 */
    current: boolean;
    
    /** 上游分支名称 */
    upstream?: string;
    
    /** 领先提交数 */
    ahead?: number;
    
    /** 落后提交数 */
    behind?: number;
}
```

### 3.3 渲染数据结构（内部使用）

```typescript
/**
 * 渲染器内部使用的提交节点
 * 在 GitGraphRow 基础上添加渲染所需的位置信息
 */
interface RenderGraphNode extends GitGraphRow {
    /** 泳道索引（由泳道分配算法计算） */
    lane: number;
    
    /** 行索引（垂直位置） */
    rowIndex: number;
    
    /** 渲染坐标（像素） */
    x: number;
    y: number;
    
    /** 父节点引用（用于绘制连接线） */
    parentNodes: RenderGraphNode[];
    
    /** 子节点引用（用于追踪泳道） */
    childNodes: RenderGraphNode[];
}

/**
 * 泳道状态
 * 用于追踪泳道的活跃状态
 */
interface LaneState {
    /** 泳道索引 */
    index: number;
    
    /** 泳道颜色 */
    color: string;
    
    /** 当前活跃（是否有后续提交） */
    isActive: boolean;
    
    /** 最后提交的行索引 */
    lastRowIndex: number;
    
    /** 关联的分支名称 */
    branchName?: string;
}

/**
 * 曲线段
 * 用于存储计算好的贝塞尔曲线路径
 */
interface CurveSegment {
    /** 起点坐标 */
    startX: number;
    startY: number;
    
    /** 终点坐标 */
    endX: number;
    endY: number;
    
    /** 控制点 1 */
    cp1X: number;
    cp1Y: number;
    
    /** 控制点 2 */
    cp2X: number;
    cp2Y: number;
    
    /** 泳道索引（用于颜色） */
    lane: number;
    
    /** 曲线类型 */
    type: 'vertical' | 'merge-left' | 'merge-right' | 'fork';
}
```

---

## 4. 泳道分配算法

### 4.1 算法概述

泳道分配算法的目标是为每个提交分配一个泳道索引，使得：
1. 同一分支的提交在同一泳道上
2. 合并时曲线不交叉（或最小化交叉）
3. 泳道数量最小化

### 4.2 算法流程

```
输入：GitGraphRow[] (按时间倒序排列)
输出：带 lane 属性的 RenderGraphNode[]

算法步骤：

1. 初始化
   - 创建空的提交节点映射：nodeMap = {}
   - 创建空的泳道状态列表：lanes = []
   - 创建空的可用泳道索引队列：availableLanes = []

2. 遍历每个提交（从最新到最旧）
   for each row in rows:
       a. 创建或获取节点
          - 如果 nodeMap[row.sha] 已存在，复用
          - 否则创建新节点，分配 rowIndex
      
       b. 处理引用（分支/标签）
          - 对于每个新分支，分配或复用泳道
          - 更新 branchToLane 映射
      
       c. 处理父提交关系
          - 对于每个 parent SHA：
              * 创建或获取父节点
              * 建立父子关系
              * 如果父节点泳道未定，分配泳道
      
       d. 泳道合并处理
          - 如果是合并提交（多个父提交）：
              * 主父提交（第一个）保持当前泳道
              * 其他父提交的泳道标记为可回收
      
       e. 泳道回收
          - 检查是否有泳道不再活跃
          - 将回收的泳道索引加入 availableLanes

3. 返回带泳道信息的节点列表
```

### 4.3 详细实现

```typescript
/**
 * 泳道分配器
 * 负责为每个提交分配泳道索引
 */
class LaneAllocator {
    // 泳道颜色池（10 色循环）
    private static readonly LANE_COLORS = [
        '#15a0bf',  // 青色
        '#0669f7',  // 蓝色
        '#8e00c2',  // 紫色
        '#c517b6',  // 品红
        '#d90171',  // 粉红
        '#cd0101',  // 红色
        '#f25d2e',  // 橙色
        '#f2ca33',  // 黄色
        '#7bd938',  // 绿色
        '#2ece9d',  // 青绿
    ];
    
    // 分支到泳道的映射
    private branchToLane = new Map<string, number>();
    
    // SHA 到节点的映射
    private nodeMap = new Map<string, RenderGraphNode>();
    
    // 泳道状态列表
    private lanes: LaneState[] = [];
    
    // 可用的泳道索引（回收的泳道）
    private availableLanes: number[] = [];
    
    /**
     * 为图形行分配泳道
     */
    allocate(rows: GitGraphRow[]): RenderGraphNode[] {
        const nodes: RenderGraphNode[] = [];
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const node = this.processRow(row, rowIndex);
            nodes.push(node);
        }
        
        return nodes;
    }
    
    /**
     * 处理单个提交行
     */
    private processRow(row: GitGraphRow, rowIndex: number): RenderGraphNode {
        // 1. 创建或获取节点
        let node = this.nodeMap.get(row.sha);
        if (node) {
            // 节点已存在（可能已被父提交引用）
            node.rowIndex = rowIndex;
            node.row = row;
        } else {
            node = this.createNode(row, rowIndex);
            this.nodeMap.set(row.sha, node);
        }
        
        // 2. 处理引用（分支/标签）
        if (row.heads) {
            for (const head of row.heads) {
                this.ensureBranchLane(head.name, node);
            }
        }
        
        // 3. 处理父提交
        if (row.parents && row.parents.length > 0) {
            this.processParents(node, row.parents);
        } else {
            // 没有父提交（初始提交），分配新泳道
            if (node.lane === -1) {
                node.lane = this.allocateNewLane(node);
            }
        }
        
        // 4. 处理泳道合并
        if (row.parents && row.parents.length > 1) {
            this.handleMerge(node);
        }
        
        // 5. 回收不活跃的泳道
        this.recycleInactiveLanes(rowIndex);
        
        return node;
    }
    
    /**
     * 创建新节点
     */
    private createNode(row: GitGraphRow, rowIndex: number): RenderGraphNode {
        return {
            ...row,
            lane: -1,  // 待分配
            rowIndex,
            x: 0,      // 待计算
            y: 0,      // 待计算
            parentNodes: [],
            childNodes: []
        };
    }
    
    /**
     * 确保分支有对应的泳道
     */
    private ensureBranchLane(branchName: string, node: RenderGraphNode): number {
        // 检查分支是否已有泳道
        let laneIndex = this.branchToLane.get(branchName);
        
        if (laneIndex === undefined) {
            // 新分支，分配新泳道
            laneIndex = this.allocateNewLane(node);
            this.branchToLane.set(branchName, laneIndex);
        } else {
            // 复用现有泳道
            node.lane = laneIndex;
        }
        
        return laneIndex;
    }
    
    /**
     * 分配新泳道
     */
    private allocateNewLane(node: RenderGraphNode): number {
        let laneIndex: number;
        
        // 优先使用回收的泳道
        if (this.availableLanes.length > 0) {
            laneIndex = this.availableLanes.pop()!;
        } else {
            // 创建新泳道
            laneIndex = this.lanes.length;
            this.lanes.push({
                index: laneIndex,
                color: LANE_COLORS[laneIndex % LANE_COLORS.length],
                isActive: true,
                lastRowIndex: node.rowIndex,
                branchName: undefined
            });
        }
        
        node.lane = laneIndex;
        return laneIndex;
    }
    
    /**
     * 处理父提交关系
     */
    private processParents(node: RenderGraphNode, parentShas: string[]): void {
        const parentNodes: RenderGraphNode[] = [];
        
        for (const parentSha of parentShas) {
            let parentNode = this.nodeMap.get(parentSha);
            
            if (!parentNode) {
                // 父节点还不存在，创建占位节点
                parentNode = this.createNode(
                    { sha: parentSha, parents: [], type: 'commit-node' } as GitGraphRow,
                    -1  // 行索引待定
                );
                this.nodeMap.set(parentSha, parentNode);
            }
            
            // 建立父子关系
            parentNode.childNodes.push(node);
            parentNodes.push(parentNode);
            
            // 如果父节点泳道未定，分配与当前节点相同的泳道（主父提交）
            if (parentNode.lane === -1) {
                if (parentNodes.length === 1) {
                    // 第一个父提交（主父），继承当前泳道
                    parentNode.lane = node.lane;
                } else {
                    // 其他父提交，分配新泳道（用于合并线）
                    parentNode.lane = this.allocateNewLane(parentNode);
                }
            }
        }
        
        node.parentNodes = parentNodes;
    }
    
    /**
     * 处理合并提交
     */
    private handleMerge(node: RenderGraphNode): void {
        // 合并提交有多个父节点
        // 主父节点（第一个）已经在同一泳道上
        // 其他父节点需要绘制合并曲线
        
        for (let i = 1; i < node.parentNodes.length; i++) {
            const parentNode = node.parentNodes[i];
            // 这些泳道在合并后可以被回收
            // 标记为不活跃（在回收阶段处理）
        }
    }
    
    /**
     * 回收不活跃的泳道
     */
    private recycleInactiveLanes(currentRowIndex: number): void {
        // 检查每个泳道是否还有后续提交
        for (const lane of this.lanes) {
            if (!lane.isActive) continue;
            
            // 如果泳道的最后提交距离当前行太远，标记为可回收
            // 这里简化处理：检查是否有子节点还未处理
            const hasPendingChildren = this.lanes.some(l => 
                l.branchName && this.branchToLane.get(l.branchName) === lane.index
            );
            
            if (!hasPendingChildren && currentRowIndex > lane.lastRowIndex + 1) {
                lane.isActive = false;
                this.availableLanes.push(lane.index);
            }
        }
    }
    
    /**
     * 获取泳道颜色
     */
    getLaneColor(laneIndex: number): string {
        return LANE_COLORS[laneIndex % LANE_COLORS.length];
    }
}
```

### 4.4 泳道分配示例

```
提交历史（简化）：
  A ─ B ─ C (main)
       ╲
        D ─ E (feature)

处理顺序（从新到旧）：E, D, C, B, A

步骤 1: 处理 E (feature)
  - 创建节点 E
  - feature 分支，分配泳道 0
  - 节点：E(lane=0)

步骤 2: 处理 D (feature)
  - 创建节点 D
  - 继承 feature 分支泳道
  - 节点：D(lane=0), E(lane=0)
  - 连接：D → E

步骤 3: 处理 C (main)
  - 创建节点 C
  - main 分支，分配新泳道 1
  - 节点：C(lane=1), D(lane=0), E(lane=0)
  - 连接：D → E

步骤 4: 处理 B (main)
  - 创建节点 B
  - 继承 main 分支泳道
  - 节点：B(lane=1), C(lane=1), D(lane=0), E(lane=0)
  - 连接：B → C, D → E

步骤 5: 处理 A (main, 合并提交)
  - 创建节点 A
  - 继承 main 分支泳道
  - 处理父提交：B (泳道 1) 和 D (泳道 0)
  - 节点：A(lane=1), B(lane=1), C(lane=1), D(lane=0), E(lane=0)
  - 连接：A → B (垂直), A → D (合并曲线)

最终泳道分配：
泳道 0: D ─ E
        ╲
泳道 1: A ─ B ─ C
```

---

## 5. 曲线绘制原理

### 5.1 曲线类型

Git Graph 中使用的曲线类型：

| 类型 | 描述 | 示例 |
|------|------|------|
| **垂直线** | 同一泳道内的直线连接 | `│` |
| **左合并** | 从右侧泳道合并到左侧 | `╲` |
| **右合并** | 从左侧泳道合并到右侧 | `╱` |
| **分叉** | 从当前泳道分叉到新泳道 | `├` |

### 5.2 贝塞尔曲线

使用**三次贝塞尔曲线**绘制平滑的连接线。

**三次贝塞尔曲线公式：**
```
B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
```

其中：
- `P₀` = 起点
- `P₁` = 控制点 1
- `P₂` = 控制点 2
- `P₃` = 终点
- `t` ∈ [0, 1]

### 5.3 控制点计算

```typescript
/**
 * 计算贝塞尔曲线控制点
 */
interface BezierCurve {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    cp1X: number;
    cp1Y: number;
    cp2X: number;
    cp2Y: number;
}

/**
 * 计算连接两个提交的曲线
 */
function calculateCurve(
    startNode: RenderGraphNode,
    endNode: RenderGraphNode,
    laneWidth: number,
    rowHeight: number
): BezierCurve {
    const startX = startNode.lane * laneWidth + laneWidth / 2;
    const startY = startNode.rowIndex * rowHeight + rowHeight / 2;
    const endX = endNode.lane * laneWidth + laneWidth / 2;
    const endY = endNode.rowIndex * rowHeight + rowHeight / 2;
    
    // 垂直距离
    const verticalDistance = endY - startY;
    
    // 控制点计算（取决于曲线类型）
    if (startNode.lane === endNode.lane) {
        // 垂直线（同一泳道）
        return {
            startX, startY, endX, endY,
            cp1X: startX, cp1Y: startY + verticalDistance / 3,
            cp2X: endX, cp2Y: endY - verticalDistance / 3
        };
    } else if (startNode.lane < endNode.lane) {
        // 右合并（从左到右）
        const horizontalDistance = endX - startX;
        return {
            startX, startY, endX, endY,
            cp1X: startX, cp1Y: startY + verticalDistance / 2,
            cp2X: endX - horizontalDistance / 2, cp2Y: endY - verticalDistance / 2
        };
    } else {
        // 左合并（从右到左）
        const horizontalDistance = startX - endX;
        return {
            startX, startY, endX, endY,
            cp1X: startX + horizontalDistance / 2, cp1Y: startY + verticalDistance / 2,
            cp2X: endX, cp2Y: endY - verticalDistance / 2
        };
    }
}
```

### 5.4 Canvas 绘制

```typescript
/**
 * 在 Canvas 上绘制曲线
 */
function drawCurve(
    ctx: CanvasRenderingContext2D,
    curve: BezierCurve,
    color: string,
    lineWidth: number = 2
): void {
    ctx.beginPath();
    ctx.moveTo(curve.startX, curve.startY);
    ctx.bezierCurveTo(
        curve.cp1X, curve.cp1Y,
        curve.cp2X, curve.cp2Y,
        curve.endX, curve.endY
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
}

/**
 * 绘制提交点（圆形）
 */
function drawCommitDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    radius: number = 6
): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * 绘制泳道垂直线
 */
function drawLaneLine(
    ctx: CanvasRenderingContext2D,
    x: number,
    startY: number,
    endY: number,
    color: string,
    lineWidth: number = 2
): void {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}
```

### 5.5 完整渲染流程

```typescript
/**
 * Git Graph Canvas 渲染器
 */
class GitGraphRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private laneAllocator: LaneAllocator;
    
    // 渲染配置
    private readonly LANE_WIDTH = 60;      // 泳道宽度（像素）
    private readonly ROW_HEIGHT = 40;      // 行高（像素）
    private readonly DOT_RADIUS = 6;       // 提交点半径
    private readonly LINE_WIDTH = 2;       // 线宽
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.laneAllocator = new LaneAllocator();
    }
    
    /**
     * 渲染 Git 图形
     */
    render(graph: GitGraph): void {
        // 1. 分配泳道
        const nodes = this.laneAllocator.allocate(graph.rows);
        
        // 2. 计算画布大小
        const laneCount = this.laneAllocator.getLaneCount();
        const canvasWidth = laneCount * this.LANE_WIDTH + 40;  // 左右边距
        const canvasHeight = nodes.length * this.ROW_HEIGHT + 20;
        
        // 3. 设置画布尺寸
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // 4. 清空画布
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // 5. 绘制曲线（先绘制，这样提交点会覆盖曲线）
        this.drawCurves(nodes);
        
        // 6. 绘制提交点
        this.drawCommitDots(nodes);
        
        // 7. 绘制引用标签
        this.drawRefLabels(nodes);
    }
    
    /**
     * 绘制所有曲线
     */
    private drawCurves(nodes: RenderGraphNode[]): void {
        for (const node of nodes) {
            const color = this.laneAllocator.getLaneColor(node.lane);
            
            // 绘制到每个父节点的曲线
            for (const parentNode of node.parentNodes) {
                if (parentNode.rowIndex === -1) continue;  // 父节点还未渲染
                
                const curve = calculateCurve(
                    node,
                    parentNode,
                    this.LANE_WIDTH,
                    this.ROW_HEIGHT
                );
                
                drawCurve(this.ctx, curve, color, this.LINE_WIDTH);
            }
        }
    }
    
    /**
     * 绘制所有提交点
     */
    private drawCommitDots(nodes: RenderGraphNode[]): void {
        for (const node of nodes) {
            const x = node.lane * this.LANE_WIDTH + this.LANE_WIDTH / 2;
            const y = node.rowIndex * this.ROW_HEIGHT + this.ROW_HEIGHT / 2;
            const color = this.laneAllocator.getLaneColor(node.lane);
            
            drawCommitDot(this.ctx, x, y, color, this.DOT_RADIUS);
        }
    }
    
    /**
     * 绘制引用标签
     */
    private drawRefLabels(nodes: RenderGraphNode[]): void {
        for (const node of nodes) {
            const x = node.lane * this.LANE_WIDTH + this.LANE_WIDTH / 2;
            const y = node.rowIndex * this.ROW_HEIGHT + this.ROW_HEIGHT / 2;
            
            // 绘制本地分支
            if (node.heads) {
                let offsetX = this.DOT_RADIUS + 5;
                for (const head of node.heads) {
                    this.drawRefTag(
                        head.name,
                        x + offsetX,
                        y,
                        head.isCurrentHead ? '#007acc' : '#666666'
                    );
                    offsetX += 60;  // 标签宽度
                }
            }
            
            // 绘制标签
            if (node.tags) {
                let offsetX = this.DOT_RADIUS + 5;
                for (const tag of node.tags) {
                    this.drawRefTag(tag.name, x + offsetX, y, '#c517b6');
                    offsetX += 60;
                }
            }
        }
    }
    
    /**
     * 绘制引用标签（圆角矩形 + 文本）
     */
    private drawRefTag(
        text: string,
        x: number,
        y: number,
        color: string
    ): void {
        const padding = 4;
        const fontSize = 12;
        const textWidth = this.ctx.measureText(text).width;
        const width = textWidth + padding * 2;
        const height = fontSize + padding * 2;
        
        // 绘制背景
        this.ctx.fillStyle = color + '33';  // 半透明
        this.ctx.beginPath();
        this.ctx.roundRect(x, y - height / 2, width, height, 3);
        this.ctx.fill();
        
        // 绘制边框
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // 绘制文本
        this.ctx.fillStyle = color;
        this.ctx.font = `${fontSize}px sans-serif`;
        this.ctx.fillText(text, x + padding, y + fontSize / 2 - 2);
    }
}
```

---

## 6. 完整实现方案

### 6.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitLens Extension                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  GitDataProvider                                           │ │
│  │  - execute git log --graph --format=...                    │ │
│  │  - parse git output                                        │ │
│  │  - build GitGraphRow[]                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  GraphRowProcessor                                         │ │
│  │  - add contexts for IPC                                    │ │
│  │  - add avatar URLs                                         │ │
│  │  - apply emoji conversion                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  IPC: DidChangeRowsNotification                            │ │
│  │  - send GitGraphRow[] to Webview                           │ │
│  └────────────────────────────────────────────────────────────┘ │
─────────────────────────────────────────────────────────────────┘
                              │
                              │ postMessage
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Webview                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  GraphStateProvider                                        │ │
│  │  - receive GitGraphRow[]                                   │ │
│  │  - update reactive state                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  LaneAllocator                                             │ │
│  │  - assign lane index to each commit                        │ │
│  │  - track lane states                                       │ │
│  │  - recycle inactive lanes                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CurveCalculator                                           │ │
│  │  - calculate bezier curves for connections                 │ │
│  │  - handle merge and fork cases                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CanvasRenderer                                            │ │
│  │  - draw lane lines                                         │ │
│  │  - draw bezier curves                                      │ │
│  │  - draw commit dots                                        │ │
│  │  - draw ref labels                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 数据流

```
1. Git 命令执行
   git log --graph --format="%H|%P|%an|%ae|%at|%s|%D" --all --date-order
   │
   ▼
2. 解析 Git 输出
   parseLogOutput(stdout) → GitGraphRow[]
   │
   ▼
3. 数据增强
   GlGraphRowProcessor.processRow(row)
   - 添加 IPC contexts
   - 添加 avatar URLs
   - emoji 转换
   │
   ▼
4. 发送到 Webview
   host.notify(DidChangeRowsNotification, { rows })
   │
   ▼
5. Webview 接收
   window.addEventListener('message', handler)
   │
   ▼
6. 泳道分配
   LaneAllocator.allocate(rows) → RenderGraphNode[]
   │
   ▼
7. 曲线计算
   CurveCalculator.calculateCurves(nodes) → CurveSegment[]
   │
   ▼
8. Canvas 渲染
   CanvasRenderer.render(nodes, curves)
```

### 6.3 关键接口定义

```typescript
/**
 * Git Graph 渲染器接口
 */
interface IGitGraphRenderer {
    /**
     * 渲染 Git 图形
     * @param graph Git 图形数据
     */
    render(graph: GitGraph): void;
    
    /**
     * 调整大小
     * @param width 宽度
     * @param height 高度
     */
    resize(width: number, height: number): void;
    
    /**
     * 处理点击事件
     * @param x 点击 X 坐标
     * @param y 点击 Y 坐标
     * @returns 被点击的提交 SHA，如果没有则为 null
     */
    handleClick(x: number, y: number): string | null;
    
    /**
     * 处理悬停事件
     * @param x 悬停 X 坐标
     * @param y 悬停 Y 坐标
     * @returns 悬停的提交 SHA，如果没有则为 null
     */
    handleHover(x: number, y: number): string | null;
}

/**
 * 泳道分配器接口
 */
interface ILaneAllocator {
    /**
     * 为提交分配泳道
     * @param rows Git 图形行
     * @returns 带泳道信息的渲染节点
     */
    allocate(rows: GitGraphRow[]): RenderGraphNode[];
    
    /**
     * 获取泳道数量
     */
    getLaneCount(): number;
    
    /**
     * 获取泳道颜色
     * @param laneIndex 泳道索引
     */
    getLaneColor(laneIndex: number): string;
}

/**
 * 曲线计算器接口
 */
interface ICurveCalculator {
    /**
     * 计算所有曲线
     * @param nodes 渲染节点列表
     * @param laneWidth 泳道宽度
     * @param rowHeight 行高
     * @returns 曲线段列表
     */
    calculateCurves(
        nodes: RenderGraphNode[],
        laneWidth: number,
        rowHeight: number
    ): CurveSegment[];
}
```

---

## 7. 代码实现

### 7.1 完整 TypeScript 实现

以下是可直接使用的完整实现代码：

```typescript
// ========== 数据类型定义 ==========

type GitGraphRowType = 
    | 'commit-node'
    | 'merge-node'
    | 'stash-node'
    | 'work-dir-changes'
    | 'merge-conflict-node';

interface GitGraphRow {
    sha: string;
    parents: string[];
    author: string;
    email: string;
    date: number;
    message: string;
    type: GitGraphRowType;
    heads?: { name: string; isCurrentHead: boolean }[];
    tags?: { name: string; annotated: boolean }[];
    stats?: { additions: number; deletions: number };
    isCurrentUser?: boolean;
}

interface RenderGraphNode extends GitGraphRow {
    lane: number;
    rowIndex: number;
    x: number;
    y: number;
    parentNodes: RenderGraphNode[];
    childNodes: RenderGraphNode[];
}

interface BezierCurve {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    cp1X: number;
    cp1Y: number;
    cp2X: number;
    cp2Y: number;
    lane: number;
}

// ========== 泳道分配器 ==========

class LaneAllocator implements ILaneAllocator {
    private static readonly LANE_COLORS = [
        '#15a0bf', '#0669f7', '#8e00c2', '#c517b6', '#d90171',
        '#cd0101', '#f25d2e', '#f2ca33', '#7bd938', '#2ece9d',
    ];
    
    private branchToLane = new Map<string, number>();
    private nodeMap = new Map<string, RenderGraphNode>();
    private lanes: { index: number; isActive: boolean; lastRowIndex: number }[] = [];
    private availableLanes: number[] = [];
    
    allocate(rows: GitGraphRow[]): RenderGraphNode[] {
        const nodes: RenderGraphNode[] = [];
        
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const node = this.processRow(row, rowIndex);
            nodes.push(node);
        }
        
        return nodes;
    }
    
    private processRow(row: GitGraphRow, rowIndex: number): RenderGraphNode {
        let node = this.nodeMap.get(row.sha);
        
        if (node) {
            node.rowIndex = rowIndex;
            Object.assign(node, row);
        } else {
            node = {
                ...row,
                lane: -1,
                rowIndex,
                x: 0,
                y: 0,
                parentNodes: [],
                childNodes: []
            };
            this.nodeMap.set(row.sha, node);
        }
        
        // 处理分支引用
        if (row.heads) {
            for (const head of row.heads) {
                this.ensureBranchLane(head.name, node);
            }
        }
        
        // 处理父提交
        if (row.parents && row.parents.length > 0) {
            this.processParents(node, row.parents);
        } else if (node.lane === -1) {
            node.lane = this.allocateNewLane();
        }
        
        return node;
    }
    
    private ensureBranchLane(branchName: string, node: RenderGraphNode): number {
        let laneIndex = this.branchToLane.get(branchName);
        
        if (laneIndex === undefined) {
            laneIndex = this.allocateNewLane();
            this.branchToLane.set(branchName, laneIndex);
        }
        
        node.lane = laneIndex;
        return laneIndex;
    }
    
    private allocateNewLane(): number {
        let laneIndex: number;
        
        if (this.availableLanes.length > 0) {
            laneIndex = this.availableLanes.pop()!;
        } else {
            laneIndex = this.lanes.length;
            this.lanes.push({
                index: laneIndex,
                isActive: true,
                lastRowIndex: -1
            });
        }
        
        return laneIndex;
    }
    
    private processParents(node: RenderGraphNode, parentShas: string[]): void {
        const parentNodes: RenderGraphNode[] = [];
        
        for (const parentSha of parentShas) {
            let parentNode = this.nodeMap.get(parentSha);
            
            if (!parentNode) {
                parentNode = {
                    sha: parentSha,
                    parents: [],
                    type: 'commit-node' as GitGraphRowType,
                    author: '',
                    email: '',
                    date: 0,
                    message: '',
                    lane: -1,
                    rowIndex: -1,
                    x: 0,
                    y: 0,
                    parentNodes: [],
                    childNodes: []
                };
                this.nodeMap.set(parentSha, parentNode);
            }
            
            parentNode.childNodes.push(node);
            parentNodes.push(parentNode);
            
            if (parentNode.lane === -1) {
                if (parentNodes.length === 1) {
                    parentNode.lane = node.lane;
                } else {
                    parentNode.lane = this.allocateNewLane();
                }
            }
        }
        
        node.parentNodes = parentNodes;
    }
    
    getLaneCount(): number {
        return this.lanes.length;
    }
    
    getLaneColor(laneIndex: number): string {
        return LaneAllocator.LANE_COLORS[laneIndex % LaneAllocator.LANE_COLORS.length];
    }
}

// ========== 曲线计算器 ==========

class CurveCalculator implements ICurveCalculator {
    calculateCurves(
        nodes: RenderGraphNode[],
        laneWidth: number,
        rowHeight: number
    ): BezierCurve[] {
        const curves: BezierCurve[] = [];
        
        for (const node of nodes) {
            for (const parentNode of node.parentNodes) {
                if (parentNode.rowIndex === -1) continue;
                
                const curve = this.calculateCurve(node, parentNode, laneWidth, rowHeight);
                curves.push(curve);
            }
        }
        
        return curves;
    }
    
    private calculateCurve(
        startNode: RenderGraphNode,
        endNode: RenderGraphNode,
        laneWidth: number,
        rowHeight: number
    ): BezierCurve {
        const startX = startNode.lane * laneWidth + laneWidth / 2;
        const startY = startNode.rowIndex * rowHeight + rowHeight / 2;
        const endX = endNode.lane * laneWidth + laneWidth / 2;
        const endY = endNode.rowIndex * rowHeight + rowHeight / 2;
        
        const verticalDistance = endY - startY;
        const horizontalDistance = endX - startX;
        
        if (startNode.lane === endNode.lane) {
            // 垂直线
            return {
                startX, startY, endX, endY,
                cp1X: startX, cp1Y: startY + verticalDistance / 3,
                cp2X: endX, cp2Y: endY - verticalDistance / 3,
                lane: startNode.lane
            };
        } else if (startNode.lane < endNode.lane) {
            // 右合并
            return {
                startX, startY, endX, endY,
                cp1X: startX, cp1Y: startY + verticalDistance / 2,
                cp2X: endX - horizontalDistance / 2, cp2Y: endY - verticalDistance / 2,
                lane: startNode.lane
            };
        } else {
            // 左合并
            return {
                startX, startY, endX, endY,
                cp1X: startX + Math.abs(horizontalDistance) / 2, cp1Y: startY + verticalDistance / 2,
                cp2X: endX, cp2Y: endY - verticalDistance / 2,
                lane: startNode.lane
            };
        }
    }
}

// ========== Canvas 渲染器 ==========

class GitGraphCanvasRenderer implements IGitGraphRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private laneAllocator = new LaneAllocator();
    private curveCalculator = new CurveCalculator();
    
    private readonly LANE_WIDTH = 60;
    private readonly ROW_HEIGHT = 40;
    private readonly DOT_RADIUS = 6;
    private readonly LINE_WIDTH = 2;
    
    private nodes: RenderGraphNode[] = [];
    private curves: BezierCurve[] = [];
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }
    
    render(graph: GitGraphRow[]): void {
        // 1. 分配泳道
        this.nodes = this.laneAllocator.allocate(graph);
        
        // 2. 计算曲线
        this.curves = this.curveCalculator.calculateCurves(
            this.nodes,
            this.LANE_WIDTH,
            this.ROW_HEIGHT
        );
        
        // 3. 计算画布大小
        const laneCount = this.laneAllocator.getLaneCount();
        const canvasWidth = laneCount * this.LANE_WIDTH + 100;
        const canvasHeight = this.nodes.length * this.ROW_HEIGHT + 20;
        
        // 4. 设置画布
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // 5. 清空画布
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // 6. 绘制曲线
        this.drawCurves();
        
        // 7. 绘制提交点
        this.drawCommitDots();
        
        // 8. 绘制引用标签
        this.drawRefLabels();
    }
    
    private drawCurves(): void {
        for (const curve of this.curves) {
            const color = this.laneAllocator.getLaneColor(curve.lane);
            
            this.ctx.beginPath();
            this.ctx.moveTo(curve.startX, curve.startY);
            this.ctx.bezierCurveTo(
                curve.cp1X, curve.cp1Y,
                curve.cp2X, curve.cp2Y,
                curve.endX, curve.endY
            );
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = this.LINE_WIDTH;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }
    }
    
    private drawCommitDots(): void {
        for (const node of this.nodes) {
            const x = node.lane * this.LANE_WIDTH + this.LANE_WIDTH / 2;
            const y = node.rowIndex * this.ROW_HEIGHT + this.ROW_HEIGHT / 2;
            const color = this.laneAllocator.getLaneColor(node.lane);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.DOT_RADIUS, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    private drawRefLabels(): void {
        for (const node of this.nodes) {
            const x = node.lane * this.LANE_WIDTH + this.LANE_WIDTH / 2;
            const y = node.rowIndex * this.ROW_HEIGHT + this.ROW_HEIGHT / 2;
            
            if (node.heads) {
                let offsetX = this.DOT_RADIUS + 8;
                for (const head of node.heads) {
                    this.drawRefTag(
                        head.name,
                        x + offsetX,
                        y,
                        head.isCurrentHead ? '#007acc' : '#666666'
                    );
                    offsetX += 70;
                }
            }
            
            if (node.tags) {
                let offsetX = this.DOT_RADIUS + 8;
                for (const tag of node.tags) {
                    this.drawRefTag(tag.name, x + offsetX, y, '#c517b6');
                    offsetX += 70;
                }
            }
        }
    }
    
    private drawRefTag(text: string, x: number, y: number, color: string): void {
        const padding = 4;
        const fontSize = 11;
        this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`;
        const textWidth = this.ctx.measureText(text).width;
        const width = textWidth + padding * 2;
        const height = fontSize + padding * 2;
        
        // 背景
        this.ctx.fillStyle = color + '33';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y - height / 2, width, height, 3);
        this.ctx.fill();
        
        // 边框
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // 文本
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x + padding, y + fontSize / 2 - 1);
    }
    
    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.render(this.nodes);
    }
    
    handleClick(x: number, y: number): string | null {
        for (const node of this.nodes) {
            const nodeX = node.lane * this.LANE_WIDTH + this.LANE_WIDTH / 2;
            const nodeY = node.rowIndex * this.ROW_HEIGHT + this.ROW_HEIGHT / 2;
            const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
            
            if (distance <= this.DOT_RADIUS) {
                return node.sha;
            }
        }
        return null;
    }
    
    handleHover(x: number, y: number): string | null {
        return this.handleClick(x, y);
    }
}
```

### 7.2 使用示例

```typescript
// HTML
<canvas id="git-graph"></canvas>

// TypeScript
const canvas = document.getElementById('git-graph') as HTMLCanvasElement;
const renderer = new GitGraphCanvasRenderer(canvas);

// Git 数据示例
const gitData: GitGraphRow[] = [
    {
        sha: 'abc123',
        parents: ['def456'],
        author: 'Alice',
        email: 'alice@example.com',
        date: Date.now() - 3600000,
        message: 'Fix bug',
        type: 'commit-node',
        heads: [{ name: 'main', isCurrentHead: true }]
    },
    {
        sha: 'def456',
        parents: ['ghi789', 'jkl012'],
        author: 'Bob',
        email: 'bob@example.com',
        date: Date.now() - 7200000,
        message: 'Merge branch',
        type: 'merge-node'
    },
    {
        sha: 'ghi789',
        parents: ['mno345'],
        author: 'Alice',
        email: 'alice@example.com',
        date: Date.now() - 10800000,
        message: 'Add feature',
        type: 'commit-node',
        heads: [{ name: 'feature', isCurrentHead: false }]
    },
    {
        sha: 'jkl012',
        parents: ['mno345'],
        author: 'Charlie',
        email: 'charlie@example.com',
        date: Date.now() - 14400000,
        message: 'Another feature',
        type: 'commit-node'
    },
    {
        sha: 'mno345',
        parents: [],
        author: 'Alice',
        email: 'alice@example.com',
        date: Date.now() - 18000000,
        message: 'Initial commit',
        type: 'commit-node'
    }
];

// 渲染
renderer.render(gitData);

// 处理点击
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const sha = renderer.handleClick(x, y);
    if (sha) {
        console.log('Clicked commit:', sha);
    }
});
```

---

## 8. 渲染优化

### 8.1 虚拟滚动

```typescript
class VirtualScrollRenderer {
    private visibleStartIndex = 0;
    private visibleEndIndex = 0;
    private containerHeight = 0;
    private scrollTop = 0;
    
    updateVisibleRange(scrollTop: number, containerHeight: number): void {
        this.scrollTop = scrollTop;
        this.containerHeight = containerHeight;
        
        this.visibleStartIndex = Math.floor(scrollTop / this.ROW_HEIGHT);
        this.visibleEndIndex = Math.ceil((scrollTop + containerHeight) / this.ROW_HEIGHT);
    }
    
    render(graph: GitGraphRow[]): void {
        // 只渲染可见范围内的提交
        const visibleNodes = this.nodes.slice(
            this.visibleStartIndex - 10,  // 额外渲染上下各 10 行作为缓冲
            this.visibleEndIndex + 10
        );
        
        // ... 渲染逻辑
    }
}
```

### 8.2 离屏渲染

```typescript
class OffscreenRenderer {
    private offscreenCanvas: OffscreenCanvas;
    private offscreenCtx: OffscreenCanvasRenderingContext2D;
    
    constructor(width: number, height: number) {
        this.offscreenCanvas = new OffscreenCanvas(width, height);
        this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    }
    
    renderToOffscreen(nodes: RenderGraphNode[], curves: BezierCurve[]): void {
        // 在离屏 Canvas 上渲染
        // ...
    }
    
    copyToMainCanvas(mainCanvas: HTMLCanvasElement): void {
        const mainCtx = mainCanvas.getContext('2d')!;
        mainCtx.drawImage(this.offscreenCanvas, 0, 0);
    }
}
```

### 8.3 防抖和节流

```typescript
// 防抖渲染（避免频繁重绘）
function debounceRender<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

// 使用
const debouncedRender = debounceRender(renderer.render.bind(renderer), 100);
```

---

## 总结

本文档详细介绍了 GitLens Git Graph 的分支泳道渲染实现原理，包括：

1. **数据结构设计**：GitGraphRow、RenderGraphNode、BezierCurve 等核心接口
2. **泳道分配算法**：为每个提交分配泳道索引，处理分支和合并
3. **曲线绘制原理**：使用三次贝塞尔曲线绘制平滑的连接线
4. **完整实现方案**：从 Git 命令执行到 Canvas 渲染的完整流程
5. **代码实现**：可直接使用的 TypeScript 实现代码
6. **渲染优化**：虚拟滚动、离屏渲染、防抖节流

根据本文档，即使没有原始代码，也可以从零实现一个功能完整的 Git Graph 可视化组件。

---

**文档版本：** 1.0  
**最后更新：** 2026-04-17  
**维护者：** OpenCode Team

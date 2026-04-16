# Graph 功能需求与实现方案

## 需求描述

### Phase 1 - 基础框架（已完成）

1. **添加 GRAPH 选项**
   - 在 session 页面变更下拉按钮中，于【Git changes】和【上一轮变更】选项后面补充【GRAPH】选项
   - 选项文本固定为 "GRAPH"，不需要国际化翻译
   - 位置：`packages/app/src/pages/session.tsx` 的 `changesOptions()` 函数

2. **点击后显示空白页**
   - 选中 GRAPH 选项后，变更面板显示空白内容
   - 不显示任何提示文本（如 "无变更" 等）
   - 仅保留下拉按钮，内容区域为空白

### Phase 2 - Git Graph 可视化（待实现）

3. **提交历史时间线**
   - 垂直列表展示 Git 提交历史（按时间倒序）
   - 每行显示：提交节点 + 标题 + 作者 + 时间
   - 左侧用彩色圆点和线条表示分支关系

4. **分支可视化**
   - 不同分支用不同颜色标识
   - 显示分支标签（如 `custom/dev`、`origin/dev`）
   - 显示当前 HEAD 位置

5. **悬停预览**
   - 鼠标悬停在提交上时显示浮层预览
   - 预览内容：完整提交信息、变更统计（文件数、新增、删除）
   - 预览中显示该提交相关的分支标签

6. **点击查看详情**
   - 点击提交后在右侧显示详情面板
   - 详情包含：
     - 提交信息（完整 message）
     - 作者和时间
     - 变更统计（246 files changed, 13871 insertions(+), 11480 deletions(-)）
     - 分支标签
     - Commit Hash（如 `dad1785`）
     - 操作按钮（Open on GitHub）

7. **视图切换**
   - 提供 "View as List" / "View as Tree" 切换
   - List 模式：仅显示提交列表（简化版）
   - Tree 模式：显示完整的分支拓扑图（带连接线）

8. **工具栏功能**
   - 刷新按钮：手动刷新提交历史
   - 下载/上传按钮：同步远程仓库
   - 更多菜单（...）：包含视图切换等选项

---

## 实现方案

### 1. 扩展类型定义

**文件**: `packages/app/src/pages/session.tsx`
**位置**: 第 72 行

```typescript
// 当前定义
type ChangeMode = "git" | "branch" | "turn"

// 修改为
type ChangeMode = "git" | "branch" | "turn" | "graph"
```

---

### 2. 添加选项到下拉列表

**文件**: `packages/app/src/pages/session.tsx`
**位置**: `changesOptions` 函数（约第 655 行）

```typescript
const changesOptions = createMemo<ChangeMode[]>(() => {
  const list: ChangeMode[] = []
  if (sync.project?.vcs === "git") list.push("git")
  if (
    sync.project?.vcs === "git" &&
    sync.data.vcs?.branch &&
    sync.data.vcs?.default_branch &&
    sync.data.vcs.branch !== sync.data.vcs.default_branch
  ) {
    list.push("branch")
  }
  list.push("turn")
  list.push("graph")  // 新增：始终添加 GRAPH 选项
  return list
})
```

**显示顺序**：
1. Git changes（条件显示）
2. Branch changes（条件显示）
3. 上一轮变更（始终显示）
4. **GRAPH（始终显示）** ← 新增

---

### 3. 定义显示文本（无需翻译）

**文件**: `packages/app/src/pages/session.tsx`
**位置**: `changesTitle` 函数中的 `label`（约第 1146 行）

```typescript
const label = (option: ChangeMode) => {
  if (option === "git") return language.t("ui.sessionReview.title.git")
  if (option === "branch") return language.t("ui.sessionReview.title.branch")
  if (option === "graph") return "GRAPH"  // 固定文本，无需翻译
  return language.t("ui.sessionReview.title.lastTurn")
}
```

---

### 4. 处理业务逻辑分支

#### 4.1 `reviewDiffs` 函数（约第 670 行）

返回空数组，使变更列表为空。

```typescript
const reviewDiffs = createMemo(() => {
  if (store.changes === "git") return list(vcs.diff.git)
  if (store.changes === "branch") return list(vcs.diff.branch)
  if (store.changes === "graph") return []  // 新增：返回空数组
  return turnDiffs()
})
```

#### 4.2 `reviewReady` 函数（约第 680 行）

GRAPH 模式始终就绪。

```typescript
const reviewReady = createMemo(() => {
  if (store.changes === "git") return vcs.ready.git
  if (store.changes === "branch") return vcs.ready.branch
  if (store.changes === "graph") return true  // 新增：始终就绪
  return true
})
```

#### 4.3 `reviewEmptyText` 函数（约第 1186 行）

GRAPH 模式返回空字符串，不显示任何提示。

```typescript
const reviewEmptyText = createMemo(() => {
  if (store.changes === "git") return language.t("session.review.noUncommittedChanges")
  if (store.changes === "branch") return language.t("session.review.noBranchChanges")
  if (store.changes === "graph") return ""  // 新增：空文本
  return language.t("session.review.noChanges")
})
```

#### 4.4 `reviewEmpty` 函数（约第 1193 行）

GRAPH 模式显示空白，不显示加载状态或提示文本。

```typescript
const reviewEmpty = (input: { loadingClass: string; emptyClass: string }) => {
  if (store.changes === "git" || store.changes === "branch") {
    if (!reviewReady()) return <div class={input.loadingClass}>{language.t("session.review.loadingChanges")}</div>
    return empty(reviewEmptyText())
  }

  if (store.changes === "turn") {
    if (nogit()) return createGit(input)
    return empty(reviewEmptyText())
  }

  // GRAPH 模式：显示空白
  if (store.changes === "graph") {
    return null  // 不显示任何内容
  }

  return (
    <div class={input.emptyClass}>
      <div class="text-14-regular text-text-weak max-w-56">{reviewEmptyText()}</div>
    </div>
  )
}
```

---

### 5. 无需修改的文件

以下文件**不需要**修改：

| 文件 | 原因 |
|------|------|
| `packages/ui/src/i18n/en.ts` | GRAPH 不需要翻译 |
| `packages/ui/src/i18n/zh.ts` | GRAPH 不需要翻译 |
| `packages/app/src/i18n/en.ts` | 不需要添加翻译键 |
| `packages/app/src/i18n/zh.ts` | 不需要添加翻译键 |

---

## 待确认事项（后续扩展）

1. **GRAPH 模式显示内容**：具体要展示什么图形化内容？
2. **数据来源**：graph 数据从哪里获取？
3. **渲染方式**：是否需要引入图形库（如 D3.js、React Flow 等）？
4. **交互功能**：graph 是否支持交互（点击、缩放、拖拽等）？

---

## 相关文件清单

| 文件 | 修改内容 |
|------|----------|
| `packages/app/src/pages/session.tsx` | 类型定义、选项列表、label、业务逻辑 |
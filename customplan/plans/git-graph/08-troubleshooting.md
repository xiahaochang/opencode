# GRAPH 功能问题总结

**创建日期**: 2026 年 4 月 17 日
**状态**: ✅ 全部解决

---

## 问题列表

| 编号 | 问题 | 状态 | 关键原因 |
|------|------|------|----------|
| 1 | Git 命令输出为空 | ✅ | `--no-optional-locks` 参数无效 |
| 2 | JSON 格式解析失败 | ✅ | Git 格式字符串转义复杂 |
| 3 | Electron 401 未授权 | ✅ | 未使用认证的 SDK client |
| 4 | CSS 类未定义 | ✅ | 使用 Tailwind 原子类但项目用 CSS 变量 |
| 5 | 悬停预览位置不对 | ✅ | CSS transform 导致 fixed 定位失效 |
| 6 | 滚动加载死循环 | ✅ | 恢复期间未禁用滚动监听 |
| 7 | 后端 API 不支持分页 | ✅ | 使用 `slice()` 而非 `--skip` |
| 8 | 滚动定位后仍在底部 | ✅ | `<Show>` 条件隐藏了数据 DOM |
| 9 | 数据重复（100% 重复） | ✅ | SDK 类型过期，缺少 `offset` 参数 |
| 10 | 分页性能问题 | ✅ | 获取 `limit+offset` 条后截取 |
| 11 | 滚动位置计算错误 | ✅ | 公式错误，未考虑用户期望位置 |

---

## 详细问题分析

### 问题 1: Git 命令输出为空

**现象**: `git log` 返回空字符串

**原因**: `--no-optional-locks` 不是 `git log` 的有效参数

**解决**: 移除该参数

```diff
const output = yield* text([
  "log",
  `--format=${format}`,
  `-n ${limit}`,
-  "--no-optional-locks",  // ❌ 无效参数
  "--all",
], { cwd })
```

---

### 问题 2: JSON 格式解析失败

**现象**: Git 输出无法解析为 JSON

**原因**: Git 格式字符串中的引号转义复杂

**解决**: 改用 null 分隔符的简单格式

```typescript
// ❌ 之前（失败）
const format = JSON.stringify({ hash: "%H", short_hash: "%h", ... })

// ✅ 之后（成功）
const format = "%H%x00%h%x00%s%x00%an%x00%at%x00%P%x00%D"
const parts = line.split("\0")
```

---

### 问题 3: Electron 401 未授权

**现象**: fetch 请求返回 401

**原因**: Electron 后端使用 Basic Auth 认证

**解决**: 使用已认证的 SDK client

```typescript
// ❌ 之前（失败）
const response = await fetch("/git/graph")

// ✅ 之后（成功）
const result = await client.git.graph({ limit: 100 })
```

---

### 问题 4: CSS 类未定义

**现象**: Tailwind 报错 `bg-bg` 等类未定义

**原因**: 项目使用自定义 CSS 变量，非 Tailwind 原子类

**解决**: 重写 CSS 使用项目的设计系统变量

```css
/* ❌ 之前（失败） */
.git-graph { @apply bg-bg text-text; }

/* ✅ 之后（成功） */
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
// ✅ 使用 Portal
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

// ✅ 恢复滚动时
setIsRestoringScroll(true)
setTimeout(() => {
  setIsRestoringScroll(false)
}, 100)

// ✅ 滚动处理
const handleScroll = (e: Event) => {
  if (isRestoringScroll()) return  // 恢复期间不触发加载
  // ...
}
```

---

### 问题 7: 后端 API 不支持分页

**现象**: 每次返回相同的 100 条数据

**原因**: 后端使用 `slice()` 截取，但 `git log` 没有 `--skip` 参数

**解决**: 后端 API 添加 `offset` 参数，使用 `git log --skip`

```typescript
// ✅ 后端
const log = (cwd, limit, offset = 0) => {
  const args = ["log", `--format=${format}`, `-n ${limit}`, "--all"]
  if (offset > 0) args.push(`--skip=${offset}`)
  return yield* text(args, { cwd })
}

// ✅ 前端
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
// ❌ 之前（失败）
<Show when={!props.loading && props.data}>

// ✅ 之后（成功）
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
❌ 前端：calling client.git.graph, offset: 100
❌ 后端：called with query: { limit: 100 }  // 缺少 offset!
❌ 后端：parsed commits: 100 first: ea55e3312  // 与第一次相同
```

**解决**: 重新生成 SDK
```bash
cd packages/sdk/js && bun run ./script/build.ts
```

**验证日志**:
```
✅ 前端：calling client.git.graph, offset: 100
✅ 后端：called with query: { limit: 100, offset: 100 }
✅ 后端：args: log --format=... -n 100 --all --skip=100
✅ 后端：parsed commits: 100 first: cb7399796  // 不同的 hash
```

---

### 问题 10: 分页性能问题

**现象**: 随着 offset 增大，后端性能下降

**原因**: 
```typescript
// ❌ 之前的实现
const allCommits = yield* git.log(dir, limit + offset)
const commits = allCommits.slice(offset)  // 获取后截取
```
- offset=100 时获取 200 条，截取 100 条
- offset=500 时获取 600 条，截取 100 条
- 大量无用数据被获取和计算

**解决**: 让 `git log` 直接使用 `--skip` 参数
```typescript
// ✅ 之后实现
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
// ✅ 新数据追加在底部，用户希望看到新数据的开始位置
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

## 关键教训

### 1. SDK 同步问题
- **教训**: 修改后端 API 后必须重新生成 SDK
- **方法**: `cd packages/sdk/js && bun run ./script/build.ts`
- **验证**: 检查生成的类型文件是否包含新参数

### 2. 滚动位置管理
- **教训**: 数据更新和 DOM 渲染是异步的
- **方法**: 使用 `setTimeout` 确保 DOM 更新后再设置滚动位置
- **验证**: 检查 `scrollHeight` 是否正确变化

### 3. 分页性能
- **教训**: 不要在应用层截取大数据集
- **方法**: 使用底层命令的原生分页参数（如 `git log --skip`）
- **验证**: 监控不同 offset 下的执行时间

### 4. 调试日志
- **教训**: 问题定位需要完整的日志链
- **方法**: 在前端、SDK、后端同时添加日志
- **验证**: 对比各层传递的参数是否一致

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `packages/opencode/src/git/index.ts` | Git 命令封装（log 方法） |
| `packages/opencode/src/project/vcs.ts` | VCS 服务（graph 方法） |
| `packages/opencode/src/server/instance/index.ts` | API 路由（/git/graph） |
| `packages/ui/src/components/git-graph/git-graph.tsx` | 前端主组件 |
| `packages/ui/src/components/git-graph/git-graph-body.tsx` | 主体渲染组件 |
| `packages/sdk/js/src/v2/gen/sdk.gen.ts` | SDK 生成文件 |

---

*最后更新：2026 年 4 月 17 日*
*作者：AI Assistant*

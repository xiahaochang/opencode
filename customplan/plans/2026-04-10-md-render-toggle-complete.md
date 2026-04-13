# Markdown Render Toggle - 完整实现方案

## 📋 需求概览

**目标**：在桌面应用中为 Markdown 文件（.md/.markdown）添加一个切换开关，让用户可以在**原始文本视图**和**渲染后的 HTML 视图**之间自由切换。

**用户故事**：
- 作为开发者，我想查看 Markdown 文件的原始语法，以便了解文档结构
- 作为文档编写者，我想预览渲染后的效果，以便确认格式是否正确
- 作为用户，我希望快速切换两种视图，而不需要打开不同的工具

---

## 🐛 已知问题

### 问题 1: 按钮默认 icon 未显示

**现象**: 打开 Markdown 文件时，悬浮按钮的默认图标不显示

**根因分析**: 
- 代码中使用了 `icon="file-text"` 作为默认图标
- 但 `icon.tsx` 中**不存在 `file-text` 图标定义**
- `eye` 图标存在，可以正常使用

**解决方案**:
- 将默认图标改为 `code` 或 `edit-small-2`（已存在于 `icon.tsx` 中）
- 推荐使用 `code` 图标表示源码视图，语义更清晰

**可用图标备选**:
| 图标名 | 语义 | 推荐度 | 说明 |
|-------|------|-------|------|
| `code` | 源码视图 | ⭐⭐⭐⭐⭐ | 语义清晰，表示查看源代码 |
| `edit-small-2` | 编辑 | ⭐⭐⭐ | 表示编辑原始内容 |
| `pencil-line` | 编写 | ⭐⭐⭐ | 表示文档编写 |
| `eye` | 预览视图 | ⭐⭐⭐⭐⭐ | 语义清晰，表示预览渲染效果 |

**最终方案**:
- **关闭状态**（原始文本）: `icon="code"` 
- **开启状态**（已渲染）: `icon="eye"`

---

## 🎨 UI/UX 设计细节

### 1. 开关位置与布局

#### 设计原则
- **悬浮定位**：按钮悬浮在内容区右上角，不占用文档流空间
- **不遮挡文字**：通过合理的边距和透明度确保内容可读性
- **视觉清晰**：使用图标而非文字，提升直观理解

#### 布局示意

```
┌─────────────────────────────────────────────────┐
│  FileTabContent                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ [Content Area]                            │  │
│  │                                           │  │
│  │                    ┌──────────────────┐   │  │
│  │                    │  [📝] [👁️]      │   │  │ ← 悬浮按钮组（靠右）
│  │                    └──────────────────┘   │  │
│  │                                           │  │
│  │  • 关闭状态: 显示原始文本 (TextViewer)    │  │
│  │  • 开启状态: 显示渲染后的 HTML (Markdown) │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

#### 悬浮按钮设计

**位置**：固定在视口右上角（不跟随滚动）
- `position: fixed`（相对于视口，不随内容滚动）
- `top: 12px`
- `right: 12px`
- `z-index: 100`（确保在所有内容和滚动条之上）

**按钮样式**：
- 背景色：`bg-bg-surface`（半透明背景）
- 边框：`border border-border-base`
- 圆角：`rounded-lg`
- 内边距：`p-2`
- 阴影：`shadow-md`
- 布局：`flex items-center gap-1`

**图标按钮**（两种状态）：

| 状态 | 图标 | 含义 | 工具提示 |
|------|------|------|---------|
| **关闭**（原始文本） | `code` 图标 | 点击后渲染 | "Render Markdown" |
| **开启**（已渲染） | `eye` 图标 | 点击后显示源码 | "Show Source" |

### 2. 视觉样式

**悬浮按钮容器**:
- 定位: `fixed top-3 right-3 z-100`（固定定位，不随内容滚动）
- 背景色: `bg-bg-surface/90`（90% 不透明度）
- 边框: `border border-border-base`
- 圆角: `rounded-lg`
- 内边距: `p-2`
- 阴影: `shadow-md`
- 布局: `flex items-center gap-1`
- 过渡动画: `transition-all duration-200`

**图标按钮**:
- 使用 `IconButton` 组件（来自 `@opencode-ai/ui`）
- 尺寸: `size="small"`
- 样式: `variant="ghost"`
- 图标: 根据状态动态切换
  - 未渲染: `icon="markdown"` 或 `icon="file-text"`
  - 已渲染: `icon="eye"` 或 `icon="code"`
- 工具提示: 使用 `title` 属性或 `data-tooltip`

**内容区域边距**（可选，防止按钮遮挡）:
- 文本视图: 保持原有边距
- 渲染视图: 添加顶部边距 `pt-12` 确保内容不被按钮遮挡

### 3. 交互行为

| 操作 | 反馈 |
|------|------|
| 点击图标按钮 | 立即切换视图（无动画延迟） |
| 切换到渲染视图 | Markdown 转换为 HTML 并渲染，图标变为 `eye` |
| 切换回原始视图 | 恢复原始 Markdown 文本，图标变为 `markdown` |
| 切换文件 | 从本地存储读取上次状态（持久化） |
| 打开非 .md 文件 | 悬浮按钮不显示 |
| 鼠标悬停 | 显示工具提示（"Render Markdown" 或 "Show Source"） |

### 4. 响应式设计

- 在不同窗口尺寸下保持悬浮按钮固定在右上角
- 按钮在小屏幕下保持固定大小（不缩放）
- 渲染内容区域自适应剩余空间
- 移动端考虑：按钮可能需要调整为底部固定或菜单形式

---

## 🔧 代码实现细节

### 1. 文件修改清单

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `packages/app/src/pages/session/file-tabs.tsx` | **修改** | 主要实现逻辑 |
| `packages/ui/src/i18n/en.ts` | **新增** | 添加国际化键值 |
| `packages/ui/src/i18n/zh.ts` (如有) | **新增** | 中文翻译 |

### 2. 核心实现步骤

#### Step 1: 添加导入语句

**位置**: `file-tabs.tsx` 顶部导入区

```typescript
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Markdown } from "@opencode-ai/ui/markdown"
import { makePersisted } from "@solid-primitives/storage"
```

**现有导入**（无需修改）:
```typescript
import { createMemo, createSignal, Match, Switch as SolidSwitch } from "solid-js"
// 注意：SolidJS 的 Switch 组件已导入，需区分 UI Switch 和流程控制 Switch
```

---

#### Step 2: Markdown 检测逻辑与持久化状态

**位置**: `FileTabContent` 函数内部，在 `const contents` 定义之后

```typescript
// 检测是否为 Markdown 文件
const isMarkdown = createMemo(() => {
  const p = path()
  if (!p) return false
  return p.endsWith(".md") || p.endsWith(".markdown")
})

// 渲染切换状态 (全局持久化，所有 Markdown 文件共享)
const [renderMarkdown, setRenderMarkdown] = makePersisted(
  createSignal(false),
  { name: "md-render-global", storage: localStorage }
)
```

**关键点**:
- 使用 `createMemo` 实现响应式检测
- 支持 `.md` 和 `.markdown` 两种扩展名
- 使用 `makePersisted` 实现**全局**状态持久化（来自 `@solid-primitives/storage`）
- 存储键为固定的 `md-render-global`，**不按文件路径区分**
- 所有 Markdown 文件共享同一个渲染开关状态
- 打开任意 .md 文件时读取全局状态

---

#### Step 3: 创建悬浮切换按钮

**位置**: 在 `renderFile` 函数定义之前

```typescript
const MarkdownToggleButton = () => (
  <Show when={isMarkdown()}>
    <div class="fixed top-3 right-3 z-100 flex items-center gap-1 bg-bg-surface/90 border border-border-base rounded-lg p-2 shadow-md transition-all duration-200">
      <IconButton
        icon={renderMarkdown() ? "eye" : "code"}
        variant="ghost"
        size="small"
        onClick={() => setRenderMarkdown(!renderMarkdown())}
        title={renderMarkdown() ? language.t("ui.common.showSource") : language.t("ui.common.renderMarkdown")}
        aria-label={renderMarkdown() ? "Show Source" : "Render Markdown"}
      />
    </div>
  </Show>
)
```

**技术说明**:
- 使用 `Show` 条件渲染，仅 `.md` 文件显示
- 使用 `fixed` 定位，按钮固定在视口右上角，**不随内容滚动**
- `z-index: 100` 确保按钮在所有内容和滚动条之上
- `IconButton` 来自 `@opencode-ai/ui/icon-button`
- 图标根据状态动态切换:
  - **未渲染**（原始文本）: `icon="code"`（表示源码视图）
  - **已渲染**（HTML 视图）: `icon="eye"`（表示预览视图）
- 国际化键值: `ui.common.renderMarkdown` 和 `ui.common.showSource`
- **修复**: 原使用 `file-text` 图标不存在，改为 `code` 图标

---

#### Step 4: 修改 renderFile 函数

**原始代码**:
```typescript
const renderFile = (source: string) => (
  <div class="relative overflow-hidden pb-40">
    <Dynamic component={fileComponent} ... />
  </div>
)
```

**修改后代码**:
```typescript
const renderFile = (source: string) => (
  <div class="relative overflow-hidden pb-40">
    {/* Markdown 渲染切换按钮 (悬浮) */}
    <MarkdownToggleButton />
    
    {/* 内容渲染 */}
    <SolidSwitch>
      <Match when={renderMarkdown()}>
        {/* 渲染后的 HTML 视图 */}
        <div class="px-6 py-4 pt-12">
          <Markdown text={source} />
        </div>
      </Match>
      <Match when={!renderMarkdown()}>
        {/* 原始文本视图 */}
        <Dynamic
          component={fileComponent}
          mode="text"
          file={{
            name: path() ?? "",
            contents: source,
            cacheKey: cacheKey(),
          }}
          enableLineSelection
          enableHoverUtility
          selectedLines={activeSelection()}
          commentedLines={commentedLines()}
          onRendered={() => {
            scrollSync.queueRestore()
          }}
          annotations={commentsUi.annotations()}
          renderAnnotation={commentsUi.renderAnnotation}
          renderHoverUtility={commentsUi.renderHoverUtility}
          onLineSelected={(range: SelectedLineRange | null) => {
            commentsUi.onLineSelected(range)
          }}
          onLineNumberSelectionEnd={commentsUi.onLineNumberSelectionEnd}
          onLineSelectionEnd={(range: SelectedLineRange | null) => {
            commentsUi.onLineSelectionEnd(range)
          }}
          search={search}
          class="select-text"
          media={{
            mode: "auto",
            path: path(),
            current: state()?.content,
            onLoad: scrollSync.queueRestore,
            onError: (args: { kind: "image" | "audio" | "svg" }) => {
              if (args.kind !== "svg") return
              showToast({
                variant: "error",
                title: language.t("toast.file.loadFailed.title"),
              })
            },
          }}
        />
      </Match>
    </SolidSwitch>
  </div>
)
```

**关键变化**:
1. 添加 `<MarkdownToggleButton />` 悬浮在内容区右上角
2. 使用 `SolidSwitch` 包裹两种视图模式
3. 原始 `Dynamic` 组件放入 `Match when={!renderMarkdown()}` 分支
4. 新增 `Match when={renderMarkdown()}` 分支用于渲染 Markdown
5. 渲染视图添加 `pt-12` 顶部边距，防止按钮遮挡内容

---

#### Step 5: 添加国际化键值

**文件**: `packages/ui/src/i18n/en.ts`

**位置**: 在 `ui.common.*` 区域添加

```typescript
"ui.common.renderMarkdown": "Render Markdown",
"ui.common.showSource": "Show Source",
```

**文件**: `packages/ui/src/i18n/zh.ts` (如存在中文翻译文件)

```typescript
"ui.common.renderMarkdown": "渲染 Markdown",
"ui.common.showSource": "显示源码",
```

---

### 3. 组件层级结构

```
FileTabContent
├── ScrollView
│   └── Tabs.Content
│       └── Switch (流程控制)
│           ├── Match: state()?.loaded
│           │   └── renderFile(contents())
│           │       ├── MarkdownToggleButton (条件显示，fixed 定位)
│           │       │   └── Show: isMarkdown()
│           │       │       └── div.floating-button (fixed top-3 right-3 z-100)
│           │       │           └── IconButton (icon: "code" | "eye")
│           │       └── Switch (流程控制)
│           │           ├── Match: renderMarkdown() === true
│           │           │   └── div.markdown-viewer (pt-12)
│           │           │       └── Markdown component
│           │           └── Match: renderMarkdown() === false
│           │               └── Dynamic (fileComponent)
│           ├── Match: state()?.loading
│           └── Match: state()?.error
```

---

### 4. 状态管理

| 状态 | 类型 | 默认值 | 持久化 | 重置时机 |
|-----|------|--------|--------|---------|
| `isMarkdown` | `Accessor<boolean>` | - | N/A | 文件路径变化 |
| `renderMarkdown` | `Signal<boolean>` | `false` | ✅ (localStorage) | 永不重置（全局持久化） |

**存储策略**:
- 存储位置: `localStorage`
- 存储键: `md-render-global`（**全局唯一键，不按文件区分**）
- 存储值: `true` 或 `false`
- 作用域: **所有 Markdown 文件共享同一状态**

**状态流**:
```
打开任意 .md 文件 → 检测扩展名 → isMarkdown = true
                                      ↓
                        从 localStorage 读取全局状态
                                      ↓
                   renderMarkdown = 读取的值 (true/false)
                                      ↓
                        所有 .md 文件显示相同视图模式
                                      ↓
                        用户点击按钮
                                      ↓
                   renderMarkdown = !renderMarkdown
                                      ↓
                   自动保存到 localStorage (全局生效)
                                      ↓
                   所有打开的 .md 文件同步更新状态
```

---

## 🧪 测试用例

### 1. 功能测试

| 测试场景 | 前置条件 | 操作步骤 | 预期结果 |
|---------|---------|---------|---------|
| **TC-01**: 打开 .md 文件 | 无 | 打开 `README.md` | 显示原始文本，悬浮按钮可见，显示 `code` 图标 |
| **TC-02**: 切换到渲染视图 | TC-01 完成 | 点击悬浮按钮 | 内容切换为渲染后的 HTML，图标变为 `eye` |
| **TC-03**: 切换回原始视图 | TC-02 完成 | 再次点击悬浮按钮 | 内容恢复原始 Markdown 文本，图标变为 `code` |
| **TC-04**: 状态持久化 | TC-02 完成 | 关闭应用重新打开 | 保持上次的渲染状态（渲染视图） |
| **TC-05**: 切换不同文件 | TC-02 完成 | 打开另一个 `.md` 文件 | 保持相同的渲染状态（全局共享） |
| **TC-06**: 打开非 .md 文件 | 无 | 打开 `index.ts` | 悬浮按钮不显示，正常显示代码 |
| **TC-07**: 打开 .markdown 文件 | 无 | 打开 `GUIDE.markdown` | 与 `.md` 文件行为一致 |

### 2. 边界条件测试

| 测试场景 | 前置条件 | 操作步骤 | 预期结果 |
|---------|---------|---------|---------|
| **TC-08**: 空 .md 文件 | 存在空的 `empty.md` | 打开文件 | 悬浮按钮显示，渲染视图为空 |
| **TC-09**: 包含代码块的 .md | 存在含代码的文件 | 切换到渲染视图 | 代码块正确渲染，带复制按钮 |
| **TC-10**: 包含图片的 .md | 存在含图片链接的文件 | 切换到渲染视图 | 图片链接正确渲染或显示占位符 |
| **TC-11**: 快速切换 | 打开 .md 文件 | 快速多次点击按钮 | 无闪烁或状态异常 |
| **TC-12**: 大文件渲染 | 打开大型 .md 文件 (>100KB) | 切换到渲染视图 | 性能可接受，无明显卡顿 |
| **TC-13**: 按钮不遮挡内容 | TC-02 完成 | 检查渲染视图顶部内容 | 内容不被悬浮按钮遮挡（pt-12 边距） |
| **TC-14**: 按钮固定定位 | TC-02 完成 | 滚动文档内容 | 按钮保持在视口右上角，不跟随滚动 |

### 3. UI/UX 测试

| 测试场景 | 检查项 | 预期结果 |
|---------|--------|---------|
| **TC-14**: 悬浮按钮样式 | 视觉检查 | 背景、边框、阴影、圆角符合设计 |
| **TC-15**: 主题切换 | 切换浅色/深色主题 | 按钮样式跟随主题 |
| **TC-16**: 响应式布局 | 调整窗口大小 | 按钮始终固定在右上角 |
| **TC-17**: 工具提示 | 鼠标悬停在按钮上 | 显示正确的提示文本 |
| **TC-18**: 国际化 | 切换语言 | 提示文本正确翻译 |
| **TC-19**: 图标可理解性 | 用户首次使用 | 能直观理解按钮功能 |

### 4. 回归测试

| 测试场景 | 检查项 | 预期结果 |
|---------|--------|---------|
| **TC-16**: 代码高亮 | 打开代码文件 | 不受影响，正常显示 |
| **TC-17**: 行注释功能 | 在 .md 文件添加行注释 | 功能正常（如有） |
| **TC-18**: 文件搜索 | 使用文件内搜索 | 在两种视图下均正常工作 |
| **TC-19**: 滚动同步 | 滚动内容 | 滚动同步不受影响 |

---

## ⚠️ 注意事项与限制

### 1. 明确包含

✅ 支持 `.md` 和 `.markdown` 扩展名
✅ 使用现有 `Markdown` 组件渲染
✅ 使用现有 `IconButton` UI 组件
✅ 状态持久化（全局记忆，使用 localStorage）
✅ 默认显示原始文本（首次打开时）
✅ 悬浮按钮固定在视口右上角，不跟随滚动
✅ 使用图标提升可理解性 (`code` / `eye`)
✅ 修复 `file-text` 图标不存在问题，改用 `code` 图标

### 2. 明确排除

❌ 不支持部分渲染或流式渲染  
❌ 不修改 `desktop-electron` 包  
❌ 不支持自定义 Markdown 扩展语法  
❌ 不添加渲染预览的其他模式（如分屏）  
❌ 不使用文字标签 Switch（改用图标）  

### 3. 性能考虑

- **缓存机制**: `Markdown` 组件已内置缓存（使用 `checksum`），相同内容不会重复渲染
- **虚拟 DOM**: 使用 `morphdom` 进行高效 DOM 更新
- **大文件**: 对于超大文件（>1MB），建议添加加载指示器（可选优化）

---

## 🚀 部署验证

### 构建检查

```bash
# 类型检查
cd packages/app && bun typecheck
cd packages/ui && bun typecheck

# 构建检查（如需要）
cd packages/app && bun run build
```

### 手动测试清单

- [ ] 打开 `.md` 文件，悬浮按钮可见
- [ ] 点击按钮，内容正确渲染为 HTML
- [ ] 再次点击，恢复原始 Markdown 文本
- [ ] 关闭并重新打开文件，状态保持
- [ ] 打开不同的 `.md` 文件，状态独立记忆
- [ ] 打开 `.ts` 文件，悬浮按钮不显示
- [ ] 主题切换后按钮样式正确
- [ ] 鼠标悬停显示工具提示
- [ ] 无控制台错误或警告

---

## 📝 技术债务与未来优化

### 待优化项（高优先级）

| 功能 | 描述 | 状态 | 优先级 |
|-----|------|------|-------|
| **固定悬浮按钮** | 按钮固定在视口右上角，不跟随文档滚动条移动 | ⏳ 待实现 | 高 |
| **全局状态记忆** | 按钮状态全局统一，所有 .md 文件共享同一开关状态 | ⏳ 待实现 | 高 |

### 可选增强功能（不在当前需求范围）

| 功能 | 描述 | 优先级 |
|-----|------|-------|
| **分屏模式** | 同时显示原始和渲染视图 | 低 |
| **导出 HTML** | 将渲染后的 Markdown 导出为 HTML 文件 | 低 |
| **自定义样式** | 允许用户自定义 Markdown 渲染样式 | 低 |
| **性能优化** | 对大文件添加加载指示器或虚拟滚动 | 中 |
| **快捷键** | 添加键盘快捷键切换视图（如 `Ctrl+Shift+M`） | 低 |
| **全局设置** | 提供全局默认渲染设置（全部默认渲染/不渲染） | 低 |

---

## 📚 参考资料

### 相关组件文档

- **Switch 组件**: `packages/ui/src/components/switch.tsx`
- **Markdown 组件**: `packages/ui/src/components/markdown.tsx`
- **ScrollView 组件**: `packages/ui/src/components/scroll-view.tsx`

### 相关代码文件

- **主修改文件**: `packages/app/src/pages/session/file-tabs.tsx`
- **国际化文件**: `packages/ui/src/i18n/en.ts`

### 技术栈

- **UI 框架**: SolidJS
- **状态管理**: SolidJS Signals & Memos
- **Markdown 解析**: Marked (通过 `useMarked`)
- **DOM 更新**: morphdom
- **安全清理**: DOMPurify

---

## ✅ 验收标准

- [ ] 所有功能测试用例通过
- [ ] 类型检查无错误
- [ ] 代码符合项目风格规范
- [ ] UI 组件样式与现有设计一致
- [ ] 国际化键值正确添加
- [ ] 无回归问题
- [ ] 代码已审查并提交

---

**文档版本**: v3.0
**创建日期**: 2026-04-10
**最后更新**: 2026-04-13
**状态**: 🔄 优化中（固定按钮 + 全局状态 + 修复图标）

**版本历史**:
- v2.0: 按钮状态持久化 + 悬浮图标按钮
- v3.0: 
  - ✅ 悬浮按钮改为 `fixed` 定位，不跟随文档滚动
  - ✅ 按钮状态改为全局记忆，所有 .md 文件共享
  - ✅ 修复 `file-text` 图标不存在问题，改用 `code` 图标

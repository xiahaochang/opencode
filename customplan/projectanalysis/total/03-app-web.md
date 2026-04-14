# OpenCode Web 应用包 (app) 详细分析

## 一、包概览

**包名**: `@opencode-ai/app`  
**路径**: `packages/app`  
**功能**: SolidJS 前端应用，Tauri 桌面应用的基础 UI

### 技术栈

| 技术 | 用途 |
|------|------|
| SolidJS 1.9 | 响应式 UI 框架 |
| Vite 7 | 构建工具 |
| TailwindCSS 4 | 原子化 CSS |
| @solidjs/router | 路由管理 |
| @tanstack/solid-query | 数据获取和缓存 |
| marked + shiki | Markdown 渲染和代码高亮 |
| @kobalte/core | 无头 UI 组件库 |

---

## 二、完整目录结构

```
packages/app/src/
├── addons/
│   ├── serialize.test.ts
│   └── serialize.ts
│
├── components/
│   ├── prompt-input/
│   │   ├── attachments.test.ts
│   │   ├── attachments.ts
│   │   ├── build-request-parts.test.ts
│   │   ├── build-request-parts.ts
│   │   ├── context-items.tsx
│   │   ├── drag-overlay.tsx
│   │   ├── editor-dom.test.ts
│   │   ├── editor-dom.ts
│   │   ├── files.ts
│   │   ├── history.test.ts
│   │   ├── history.ts
│   │   ├── image-attachments.tsx
│   │   ├── paste.ts
│   │   ├── placeholder.test.ts
│   │   ├── placeholder.ts
│   │   ├── slash-popover.tsx
│   │   ├── submit.test.ts
│   │   └── submit.ts
│   ├── server/
│   │   └── server-row.tsx
│   ├── session/
│   │   ├── index.ts
│   │   ├── session-context-breakdown.test.ts
│   │   ├── session-context-breakdown.ts
│   │   ├── session-context-format.ts
│   │   ├── session-context-metrics.test.ts
│   │   ├── session-context-metrics.ts
│   │   ├── session-context-tab.tsx
│   │   ├── session-header.tsx
│   │   ├── session-new-view.tsx
│   │   ├── session-sortable-tab.tsx
│   │   └── session-sortable-terminal-tab.tsx
│   ├── debug-bar.tsx
│   ├── dialog-connect-provider.tsx
│   ├── dialog-custom-provider-form.ts
│   ├── dialog-custom-provider.test.ts
│   ├── dialog-custom-provider.tsx
│   ├── dialog-edit-project.tsx
│   ├── dialog-fork.tsx
│   ├── dialog-manage-models.tsx
│   ├── dialog-release-notes.tsx
│   ├── dialog-select-directory.tsx
│   ├── dialog-select-file.tsx
│   ├── dialog-select-mcp.tsx
│   ├── dialog-select-model-unpaid.tsx
│   ├── dialog-select-model.tsx
│   ├── dialog-select-provider.tsx
│   ├── dialog-select-server.tsx
│   ├── dialog-settings.tsx
│   ├── file-tree.test.ts
│   ├── file-tree.tsx
│   ├── link.tsx
│   ├── model-tooltip.tsx
│   ├── prompt-input.tsx
│   ├── session-context-usage.tsx
│   ├── settings-general.tsx
│   ├── settings-keybinds.tsx
│   ├── settings-list.tsx
│   ├── settings-models.tsx
│   ├── settings-providers.tsx
│   ├── status-popover-body.tsx
│   ├── status-popover.tsx
│   ├── terminal.tsx
│   ├── titlebar-history.test.ts
│   ├── titlebar-history.ts
│   └── titlebar.tsx
│
├── constants/
│   └── file-picker.ts
│
├── context/
│   ├── file/
│   │   ├── content-cache.ts
│   │   ├── path.test.ts
│   │   ├── path.ts
│   │   ├── tree-store.ts
│   │   ├── types.ts
│   │   ├── view-cache.ts
│   │   ├── watcher.test.ts
│   │   └── watcher.ts
│   ├── global-sync/
│   │   ├── bootstrap.ts
│   │   ├── child-store.test.ts
│   │   ├── child-store.ts
│   │   ├── event-reducer.test.ts
│   │   ├── event-reducer.ts
│   │   ├── eviction.ts
│   │   ├── queue.ts
│   │   ├── session-cache.test.ts
│   │   ├── session-cache.ts
│   │   ├── session-load.ts
│   │   ├── session-prefetch.test.ts
│   │   ├── session-prefetch.ts
│   │   ├── session-trim.test.ts
│   │   ├── session-trim.ts
│   │   ├── types.ts
│   │   ├── utils.test.ts
│   │   └── utils.ts
│   ├── command-keybind.test.ts
│   ├── command.test.ts
│   ├── command.tsx
│   ├── comments.test.ts
│   ├── comments.tsx
│   ├── file-content-eviction-accounting.test.ts
│   ├── file.tsx
│   ├── global-sdk.tsx
│   ├── global-sync.test.ts
│   ├── global-sync.tsx
│   ├── highlights.tsx
│   ├── language.tsx
│   ├── layout-scroll.test.ts
│   ├── layout-scroll.ts
│   ├── layout.test.ts
│   ├── layout.tsx
│   ├── local.tsx
│   ├── model-variant.test.ts
│   ├── model-variant.ts
│   ├── models.tsx
│   ├── notification.tsx
│   ├── permission-auto-respond.test.ts
│   ├── permission-auto-respond.ts
│   ├── permission.tsx
│   ├── platform.tsx
│   ├── prompt.tsx
│   ├── sdk.tsx
│   ├── server.tsx
│   ├── settings.tsx
│   ├── sync-optimistic.test.ts
│   ├── sync.tsx
│   ├── terminal-title.ts
│   ├── terminal.test.ts
│   └── terminal.tsx
│
├── hooks/
│   └── use-providers.ts
│
├── i18n/
│   ├── ar.ts
│   ├── br.ts
│   ├── bs.ts
│   ├── da.ts
│   ├── de.ts
│   ├── en.ts
│   ├── es.ts
│   ├── fr.ts
│   ├── ja.ts
│   ├── ko.ts
│   ├── no.ts
│   ├── parity.test.ts
│   ├── pl.ts
│   ├── ru.ts
│   ├── th.ts
│   ├── tr.ts
│   ├── zh.ts
│   └── zht.ts
│
├── pages/
│   ├── layout/
│   │   ├── deep-links.ts
│   │   ├── helpers.test.ts
│   │   ├── helpers.ts
│   │   ├── inline-editor.tsx
│   │   ├── sidebar-items.tsx
│   │   ├── sidebar-project.tsx
│   │   ├── sidebar-shell.tsx
│   │   └── sidebar-workspace.tsx
│   ├── session/
│   │   ├── composer/
│   │   │   ├── index.ts
│   │   │   ├── session-composer-region.tsx
│   │   │   ├── session-composer-state.test.ts
│   │   │   ├── session-composer-state.ts
│   │   │   ├── session-followup-dock.tsx
│   │   │   ├── session-permission-dock.tsx
│   │   │   ├── session-question-dock.tsx
│   │   │   ├── session-request-tree.ts
│   │   │   ├── session-revert-dock.tsx
│   │   │   └── session-todo-dock.tsx
│   │   ├── file-tab-scroll.test.ts
│   │   ├── file-tab-scroll.ts
│   │   ├── file-tabs.tsx
│   │   ├── handoff.ts
│   │   ├── helpers.test.ts
│   │   ├── helpers.ts
│   │   ├── message-gesture.test.ts
│   │   ├── message-gesture.ts
│   │   ├── message-id-from-hash.ts
│   │   ├── message-timeline.tsx
│   │   ├── review-tab.tsx
│   │   ├── session-layout.ts
│   │   ├── session-model-helpers.test.ts
│   │   ├── session-model-helpers.ts
│   │   ├── session-side-panel.tsx
│   │   ├── terminal-label.ts
│   │   ├── terminal-panel.test.ts
│   │   ├── terminal-panel.tsx
│   │   ├── use-session-commands.tsx
│   │   ├── use-session-hash-scroll.test.ts
│   │   └── use-session-hash-scroll.ts
│   ├── directory-layout.tsx
│   ├── error.tsx
│   ├── home.tsx
│   ├── layout.tsx
│   └── session.tsx
│
├── testing/
│   ├── model-selection.ts
│   ├── prompt.ts
│   ├── session-composer.ts
│   └── terminal.ts
│
├── utils/
│   ├── agent.ts
│   ├── aim.ts
│   ├── base64.ts
│   ├── comment-note.ts
│   ├── diffs.test.ts
│   ├── diffs.ts
│   ├── id.ts
│   ├── notification-click.test.ts
│   ├── notification-click.ts
│   ├── persist.test.ts
│   ├── persist.ts
│   ├── prompt.test.ts
│   ├── prompt.ts
│   ├── runtime-adapters.test.ts
│   ├── runtime-adapters.ts
│   ├── same.ts
│   ├── scoped-cache.test.ts
│   ├── scoped-cache.ts
│   ├── server-errors.test.ts
│   ├── server-errors.ts
│   ├── server-health.test.ts
│   ├── server-health.ts
│   ├── server.ts
│   ├── session-title.ts
│   ├── solid-dnd.tsx
│   ├── sound.ts
│   ├── terminal-writer.test.ts
│   ├── terminal-writer.ts
│   ├── time.ts
│   ├── uuid.test.ts
│   ├── uuid.ts
│   ├── worktree.test.ts
│   └── worktree.ts
│
├── app.tsx
├── custom-elements.d.ts
├── entry.tsx
├── env.d.ts
├── index.css
├── index.ts
└── sst-env.d.ts
```

### 统计信息

| 类别 | 数量 |
|------|------|
| 顶级目录 | 8 个 (addons, components, constants, context, hooks, i18n, pages, testing, utils) |
| 根文件 | 9 个 (app.tsx, custom-elements.d.ts, entry.tsx, env.d.ts, index.css, index.ts, sst-env.d.ts 等) |
| components/ 文件 | 43 个 (含 prompt-input/ 子目录 16 个, server/ 子目录 1 个, session/ 子目录 10 个) |
| context/ 文件 | 46 个 (含 file/ 子目录 8 个, global-sync/ 子目录 15 个) |
| pages/ 文件 | 31 个 (含 layout/ 子目录 7 个, session/ 子目录 24 个) |
| i18n/ 文件 | 18 个 (17 种语言 + 1 个测试) |
| utils/ 文件 | 34 个 |
| **总计** | **217 个文件** |

---

## 三、路由配置

### 路由结构图

```
┌─────────────────────────────────────────────────────────┐
│                    路由树结构                             │
└─────────────────────────────────────────────────────────┘

/
│
├─ / (HomeRoute)
│   │
│   └─ 首页：项目选择页面
│      ├─ 最近项目列表
│      ├─ 打开项目按钮
│      └─ 服务器状态显示
│
└─ /:dir (DirectoryLayout)
    │
    └─ 目录布局包装器
       │  (dir 是 base64 编码的项目目录路径)
       │
       ├─ /:dir/ (SessionIndexRoute)
       │   │
       │   └─ 重定向到 session
       │
       └─ /:dir/session/:id? (SessionRoute)
           │
           └─ 会话页面（id 可选）
              ├─ 消息时间线
              ├─ Composer 区域
              ├─ 文件标签页
              ├─ 终端面板
              └─ 侧边面板
```

### 路由说明

| 路由 | 组件 | 文件 | 说明 |
|------|------|------|------|
| `/` | `HomeRoute` | `pages/home.tsx` | 首页，项目选择 |
| `/:dir` | `DirectoryLayout` | `pages/directory-layout.tsx` | 目录包装器，初始化 SDK 和 Sync |
| `/:dir/` | `SessionIndexRoute` | `pages/session.tsx` | 重定向到 session |
| `/:dir/session/:id?` | `SessionRoute` | `pages/session.tsx` | 会话页面，核心交互 |
| `*` | `ErrorRoute` | `pages/error.tsx` | 错误页面 |

---

## 四、核心页面组件分析

### 4.1 首页 (src/pages/home.tsx)

**职责**: 展示项目选择界面

#### 组件结构

```
┌─────────────────────────────────────────────────────────┐
│                    HomeRoute 组件                         │
└─────────────────────────────────────────────────────────┘

HomeRoute
  │
  ├─ Header
  │   ├─ OpenCode Logo
  │   └─ 服务器连接状态
  │
  ├─ 项目列表区域
  │   │
  │   ├─ 有最近项目状态
  │   │   └─ 最近 5 个项目列表（按更新时间倒序）
  │   │
  │   ├─ 加载中状态
  │   │   └─ 加载指示器
  │   │
  │   └─ 空状态
  │       └─ 提示打开项目
  │
  └─ 操作按钮
      ├─ 打开项目按钮（支持多选目录）
      └─ 服务器选择按钮
```

#### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                  首页加载流程                             │
└─────────────────────────────────────────────────────────┘

HomeRoute 渲染
  │
  ├─ 1. 获取最近项目列表
  │    └─ useGlobalSync().projects
  │
  ├─ 2. 检查服务器连接状态
  │    └─ useServer().health
  │
  ├─ 3. 根据状态渲染
  │    │
  │    ├─ 有项目 → 显示项目列表
  │    ├─ 加载中 → 显示加载指示器
  │    └─ 无项目 → 显示空状态提示
  │
  └─ 4. 绑定操作按钮
       │
       ├─ 打开项目 → DialogSelectDirectory
       └─ 切换服务器 → DialogSelectServer
```

#### 关键依赖

| 依赖 | 作用 |
|------|------|
| `useGlobalSync` | 获取项目列表 |
| `useLayout` | 打开项目操作 |
| `useServer` | 服务器健康状态 |
| `DialogSelectDirectory` | 目录选择对话框 |
| `DialogSelectServer` | 服务器选择对话框 |

#### 关键函数/组件

| 名称 | 作用 |
|------|------|
| `HomeRoute` | 首页组件 |
| `fetchRecentProjects()` | 获取最近项目 |
| `handleOpenProject()` | 处理打开项目 |

---

### 4.2 主布局 (src/pages/layout.tsx)

**职责**: 管理侧边栏、项目/工作区切换、主题/语言切换

#### 组件结构（2500+ 行大型组件）

```
┌─────────────────────────────────────────────────────────┐
│                  DirectoryLayout 组件                     │
└─────────────────────────────────────────────────────────┘

DirectoryLayout
  │
  ├─ 初始化逻辑
  │   ├─ 自动打开最近项目
  │   └─ 数据预取优化
  │
  ├─ 侧边栏管理
  │   ├─ 项目列表
  │   ├─ 工作区展开/折叠
  │   └─ 拖拽排序
  │
  ├─ 主题/语言切换
  │   ├─ cycleTheme()     → 循环切换主题
  │   ├─ cycleColorScheme() → 循环切换明暗模式
  │   └─ cycleLanguage()    → 循环切换语言
  │
  ├─ 通知系统
  │   └─ 监听 SDK 事件 → 显示 toast
  │
  ├─ 更新检查
  │   └─ 定时轮询应用更新
  │
  ├─ Deep Links
  │   └─ 处理深度链接（打开项目/新建会话）
  │
  └─ 预取优化
      ├─ prefetchChunk = 200
      └─ prefetchConcurrency = 2
```

#### 子组件目录 (src/pages/layout/)

| 文件 | 作用 |
|------|------|
| `sidebar-shell.tsx` | 侧边栏外壳 |
| `sidebar-project.tsx` | 项目级别侧边栏项（含拖拽） |
| `sidebar-workspace.tsx` | 工作区级别侧边栏项（含拖拽） |
| `sidebar-items.tsx` | 侧边栏会话列表项 |
| `inline-editor.tsx` | 内联编辑器控制器 |
| `deep-links.ts` | 深度链接处理 |
| `helpers.ts` | 辅助函数 |
| `helpers.test.ts` | 辅助函数测试 |

#### 关键函数

| 函数 | 作用 |
|------|------|
| `cycleTheme()` | 循环切换主题 |
| `cycleColorScheme()` | 循环切换明暗模式 |
| `cycleLanguage()` | 循环切换语言 |
| `prefetchSessions()` | 预取会话数据 |
| `handleOpenProject()` | 处理打开项目 |

---

### 4.3 会话页面 (src/pages/session.tsx)

**职责**: AI 对话交互的核心页面

#### 组件结构（2000+ 行核心组件）

```
┌─────────────────────────────────────────────────────────┐
│                   SessionRoute 组件                       │
└─────────────────────────────────────────────────────────┘

SessionRoute
  │
  ├─ 消息时间线 (MessageTimeline)
  │   └─ 渲染对话历史
  │
  ├─ 历史窗口管理
  │   └─ createSessionHistoryWindow()
  │      ├─ 初始加载 10 轮
  │      └─ 向上滚动每次加载 8 轮
  │
  ├─ Composer 区域 (SessionComposerRegion)
  │   └─ 底部 Prompt 输入区域
  │
  ├─ 标签页管理
  │   ├─ 文件标签
  │   ├─ Review 标签
  │   └─ 终端标签
  │
  ├─ 代码审查 (ReviewTab)
  │   ├─ git diff 模式
  │   ├─ branch diff 模式
  │   └─ turn diff 模式
  │
  ├─ VCS 集成
  │   └─ 加载 git diff 数据
  │
  ├─ Followup 编辑
  │   └─ 编辑/重新发送之前的 prompt
  │
  ├─ 自动滚动
  │   └─ 新消息自动滚动到底部
  │
  └─ 文件选择
      └─ 点击消息中的文件在标签页中打开
```

#### 子组件目录 (src/pages/session/)

| 文件 | 作用 |
|------|------|
| `message-timeline.tsx` | 消息时间线 |
| `review-tab.tsx` | 代码审查标签页 |
| `terminal-panel.tsx` | 终端面板 |
| `session-side-panel.tsx` | 会话侧面板 |
| `file-tabs.tsx` | 文件标签页 |
| `session-layout.ts` | 会话布局辅助 |
| `handoff.ts` | 交接处理 |
| `helpers.ts` | 辅助函数 |
| `message-gesture.ts` | 消息手势交互 |
| `message-id-from-hash.ts` | 从哈希获取消息ID |
| `terminal-label.ts` | 终端标签 |
| `use-session-commands.tsx` | 会话命令钩子 |
| `use-session-hash-scroll.ts` | 会话滚动哈希 |
| `file-tab-scroll.ts` | 文件标签滚动 |
| `session-model-helpers.ts` | 模型辅助函数 |

#### Composer 子目录 (src/pages/session/composer/)

| 文件 | 作用 |
|------|------|
| `session-composer-region.tsx` | 主 composer 区域 |
| `session-composer-state.ts` | Composer 状态管理 |
| `session-question-dock.tsx` | 问题 dock |
| `session-permission-dock.tsx` | 权限请求 dock |
| `session-followup-dock.tsx` | 后续对话 dock |
| `session-revert-dock.tsx` | 撤销 dock |
| `session-todo-dock.tsx` | Todo 列表 dock |
| `session-request-tree.ts` | 请求树 |
| `index.ts` | 入口 |

#### 关键函数

| 函数 | 作用 |
|------|------|
| `createSessionHistoryWindow()` | 创建会话历史窗口（渐进式加载） |
| `sendMessage(message)` | 发送消息到 AI |
| `scrollToBottom()` | 滚动到底部 |
| `loadGitDiff()` | 加载 git diff 数据 |
| `openFileInTab(filepath)` | 在标签页中打开文件 |

---

## 五、Context Provider 分析

### 5.1 Provider 树

```
┌─────────────────────────────────────────────────────────┐
│                    Provider 层次结构                       │
└─────────────────────────────────────────────────────────┘

App
  │
  ├─ GlobalSDKProvider          # 全局 SDK 实例
  │   │
  │   └─ SDKProvider            # 项目级 SDK
  │       │
  │       ├─ ServerProvider     # 服务器连接
  │       ├─ SettingsProvider   # 用户设置
  │       ├─ LayoutProvider     # 布局状态
  │       ├─ SyncProvider       # 数据同步
  │       ├─ GlobalSyncProvider # 全局同步
  │       ├─ PromptProvider     # Prompt 状态
  │       ├─ FileProvider       # 文件管理
  │       ├─ TerminalProvider   # 终端管理
  │       ├─ CommandProvider    # 命令/快捷键
  │       ├─ ModelsProvider     # 模型管理
  │       ├─ PermissionProvider # 权限管理
  │       ├─ NotificationProvider # 通知
  │       ├─ CommentsProvider   # 评论/批注
  │       ├─ HighlightsProvider # 高亮
  │       ├─ LanguageProvider   # 国际化
  │       ├─ PlatformProvider   # 平台抽象
  │       └─ LocalProvider      # 本地状态
  │
  └─ Router                     # 路由系统
```

### 5.2 各 Provider 详细说明

#### ServerProvider (src/context/server.tsx)

**职责**: 服务器连接管理

```typescript
interface ServerContext {
  url: string                    // 服务器 URL
  password: string               // 服务器密码
  connected: boolean             // 连接状态
  health: HealthStatus           // 健康状态
  setUrl(url: string): void      // 设置 URL
  setPassword(pw: string): void  // 设置密码
}
```

**关键函数**:

| 函数 | 作用 |
|------|------|
| `createServerContext()` | 创建服务器上下文 |
| `connectToServer()` | 连接到服务器 |
| `checkHealth()` | 检查健康状态 |
| `disconnect()` | 断开连接 |

#### SettingsProvider (src/context/settings.tsx)

**职责**: 用户设置持久化

```typescript
interface Settings {
  theme: string                  // 主题
  colorScheme: "light" | "dark"  // 明暗模式
  language: string               // 语言
}
```

**关键函数**:

| 函数 | 作用 |
|------|------|
| `createSettingsContext()` | 创建设置上下文 |
| `updateSettings()` | 更新设置 |
| `persistSettings()` | 持久化设置 |
| `loadSettings()` | 加载设置 |

#### SDKProvider (src/context/sdk.tsx)

**职责**: SDK 实例提供

```typescript
interface SDKContext {
  sdk: SDK                     // SDK 实例
  events: EventStream          // 事件流
  callAPI(path, opts): Promise // API 调用
}
```

**关键函数**:

| 函数 | 作用 |
|------|------|
| `createSDKContext()` | 创建 SDK 上下文 |
| `initSDK()` | 初始化 SDK |
| `subscribeEvents()` | 订阅事件 |

#### LayoutProvider (src/context/layout.tsx)

**职责**: 布局状态管理

```typescript
interface LayoutContext {
  sidebarOpen: boolean           // 侧边栏开关
  activeProject: Project         // 当前项目
  activeSession: Session         // 当前会话
  tabs: Tab[]                    // 标签页
}
```

**关键函数**:

| 函数 | 作用 |
|------|------|
| `createLayoutContext()` | 创建布局上下文 |
| `toggleSidebar()` | 切换侧边栏 |
| `setActiveProject()` | 设置当前项目 |
| `setActiveSession()` | 设置当前会话 |
| `addTab()` | 添加标签页 |
| `removeTab()` | 移除标签页 |

#### FileProvider (src/context/file.tsx)

**职责**: 文件管理

**子目录文件 (src/context/file/):**

| 文件 | 作用 |
|------|------|
| `content-cache.ts` | 内容缓存 |
| `path.ts` | 路径处理 |
| `tree-store.ts` | 文件树存储 |
| `types.ts` | 类型定义 |
| `view-cache.ts` | 视图缓存 |
| `watcher.ts` | 文件监听器 |

**关键函数**:

| 函数 | 作用 |
|------|------|
| `createFileContext()` | 创建文件上下文 |
| `loadFileTree()` | 加载文件树 |
| `readFileContent()` | 读取文件内容 |
| `watchChanges()` | 监听文件变更 |

#### GlobalSyncProvider (src/context/global-sync.tsx)

**职责**: 全局同步（多项目）

**子目录文件 (src/context/global-sync/):**

| 文件 | 作用 |
|------|------|
| `bootstrap.ts` | 引导初始化 |
| `child-store.ts` | 子存储 |
| `event-reducer.ts` | 事件归约器 |
| `eviction.ts` | 驱逐策略 |
| `queue.ts` | 队列管理 |
| `session-cache.ts` | 会话缓存 |
| `session-load.ts` | 会话加载 |
| `session-prefetch.ts` | 会话预取 |
| `session-trim.ts` | 会话裁剪 |
| `types.ts` | 类型定义 |
| `utils.ts` | 工具函数 |

**关键函数**:

| 函数 | 作用 |
|------|------|
| `createGlobalSyncContext()` | 创建全局同步上下文 |
| `syncProjects()` | 同步项目列表 |
| `prefetchSessions()` | 预取会话 |
| `evictCache()` | 清理缓存 |

#### 其他 Provider 速查

| Provider | 文件 | 主要作用 |
|----------|------|----------|
| `SyncProvider` | `sync.tsx` | 数据同步（会话列表等） |
| `PromptProvider` | `prompt.tsx` | Prompt 状态管理 |
| `TerminalProvider` | `terminal.tsx` | 终端管理 |
| `CommandProvider` | `command.tsx` | 命令注册/快捷键 |
| `ModelsProvider` | `models.tsx` | 模型管理 |
| `PermissionProvider` | `permission.tsx` | 权限管理 |
| `NotificationProvider` | `notification.tsx` | 通知系统 |
| `CommentsProvider` | `comments.tsx` | 评论/批注 |
| `HighlightsProvider` | `highlights.tsx` | 高亮 |
| `LanguageProvider` | `language.tsx` | 国际化 |
| `PlatformProvider` | `platform.tsx` | 平台抽象层 |
| `LocalProvider` | `local.tsx` | 本地状态 |
| `GlobalSDKProvider` | `global-sdk.tsx` | 全局 SDK |

---

## 六、核心组件分析

### 6.1 Components 目录完整列表

#### PromptInput 子模块 (src/components/prompt-input/)

| 文件 | 作用 |
|------|------|
| `attachments.ts` | 附件管理 |
| `build-request-parts.ts` | 构建请求部分 |
| `context-items.tsx` | 上下文项 |
| `drag-overlay.tsx` | 拖拽覆盖层 |
| `editor-dom.ts` | 编辑器 DOM 操作 |
| `files.ts` | 文件处理 |
| `history.ts` | 历史记录 |
| `image-attachments.tsx` | 图片附件 |
| `paste.ts` | 粘贴处理 |
| `placeholder.ts` | 占位符 |
| `slash-popover.tsx` | 斜杠命令弹出框 |
| `submit.ts` | 提交处理 |

#### Session 组件子模块 (src/components/session/)

| 文件 | 作用 |
|------|------|
| `session-context-breakdown.ts` | 上下文分解 |
| `session-context-format.ts` | 上下文格式 |
| `session-context-metrics.ts` | 上下文指标 |
| `session-context-tab.tsx` | 上下文标签 |
| `session-header.tsx` | 会话头部 |
| `session-new-view.tsx` | 新会话视图 |
| `session-sortable-tab.tsx` | 可排序标签 |
| `session-sortable-terminal-tab.tsx` | 可排序终端标签 |

#### 对话框组件 (src/components/)

| 文件 | 作用 |
|------|------|
| `dialog-connect-provider.tsx` | 连接提供商对话框 |
| `dialog-custom-provider.tsx` | 自定义提供商对话框 |
| `dialog-edit-project.tsx` | 编辑项目对话框 |
| `dialog-fork.tsx` | 分叉对话框 |
| `dialog-manage-models.tsx` | 管理模型对话框 |
| `dialog-release-notes.tsx` | 发布说明对话框 |
| `dialog-select-directory.tsx` | 选择目录对话框 |
| `dialog-select-file.tsx` | 选择文件对话框 |
| `dialog-select-mcp.tsx` | 选择 MCP 对话框 |
| `dialog-select-model.tsx` | 选择模型对话框 |
| `dialog-select-model-unpaid.tsx` | 选择模型对话框（未付费） |
| `dialog-select-provider.tsx` | 选择提供商对话框 |
| `dialog-select-server.tsx` | 选择服务器对话框 |
| `dialog-settings.tsx` | 设置对话框 |

#### 设置组件 (src/components/)

| 文件 | 作用 |
|------|------|
| `settings-general.tsx` | 通用设置 |
| `settings-keybinds.tsx` | 快捷键设置 |
| `settings-list.tsx` | 设置列表 |
| `settings-models.tsx` | 模型设置 |
| `settings-providers.tsx` | 提供商设置 |

#### 其他组件 (src/components/)

| 文件 | 作用 |
|------|------|
| `debug-bar.tsx` | 调试栏 |
| `file-tree.tsx` | 文件树 |
| `link.tsx` | 链接组件 |
| `model-tooltip.tsx` | 模型工具提示 |
| `prompt-input.tsx` | 提示输入框（核心） |
| `session-context-usage.tsx` | 会话使用情况 |
| `status-popover.tsx` | 状态弹出框 |
| `terminal.tsx` | 终端组件 |
| `titlebar.tsx` | 标题栏 |

---

## 七、工具函数分析

### 7.1 Utils 目录完整列表 (34 个文件)

| 文件 | 作用 |
|------|------|
| `agent.ts` | 代理辅助函数 |
| `aim.ts` | 目标辅助 |
| `base64.ts` | Base64 编解码 |
| `comment-note.ts` | 注释笔记 |
| `diffs.ts` | 差异计算 |
| `id.ts` | ID 生成 |
| `notification-click.ts` | 通知点击处理 |
| `persist.ts` | 持久化存储封装 |
| `prompt.ts` | 提示辅助函数 |
| `runtime-adapters.ts` | 运行时适配器 |
| `same.ts` | 相等比较 |
| `scoped-cache.ts` | 作用域缓存 |
| `server-errors.ts` | 服务器错误解析 |
| `server-health.ts` | 服务器健康检查 |
| `server.ts` | 服务器辅助函数 |
| `session-title.ts` | 会话标题生成 |
| `solid-dnd.tsx` | SolidJS 拖拽适配 |
| `sound.ts` | 声音播放 |
| `terminal-writer.ts` | 终端写入器 |
| `time.ts` | 时间格式化 |
| `uuid.ts` | UUID 生成 |
| `worktree.ts` | Git worktree 管理 |

### 7.2 持久化存储 (src/utils/persist.ts)

**职责**: localStorage 封装

```typescript
// 使用示例
const persist = createPersist("settings")
await persist.set({ theme: "dark" })
const data = await persist.get()
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `createPersist(key)` | 创建持久化实例 |
| `persist.get()` | 获取数据 |
| `persist.set(data)` | 存储数据 |
| `persist.remove()` | 删除数据 |

### 7.3 Base64 编解码 (src/utils/base64.ts)

**职责**: Base64 编解码（用于编码目录路径）

#### 关键函数

| 函数 | 作用 |
|------|------|
| `encodeBase64(str)` | 编码为 Base64 |
| `decodeBase64(str)` | 解码 Base64 |

### 7.4 健康检查 (src/utils/server-health.ts)

**职责**: 服务器健康检查

#### 关键函数

| 函数 | 作用 |
|------|------|
| `checkHealth(url)` | 检查服务器健康状态 |
| `parseHealthStatus(status)` | 解析健康状态 |

### 7.5 Git Worktree 管理 (src/utils/worktree.ts)

**职责**: Git worktree 管理

#### 关键函数

| 函数 | 作用 |
|------|------|
| `getWorktrees()` | 获取 worktree 列表 |
| `createWorktree()` | 创建 worktree |
| `deleteWorktree()` | 删除 worktree |

---

## 八、国际化

### 8.1 字典文件 (18 个语言文件)

| 文件 | 语言 |
|------|------|
| `ar.ts` | 阿拉伯语 |
| `br.ts` | 布列塔尼语 |
| `bs.ts` | 波斯尼亚语 |
| `da.ts` | 丹麦语 |
| `de.ts` | 德语 |
| `en.ts` | 英语 |
| `es.ts` | 西班牙语 |
| `fr.ts` | 法语 |
| `ja.ts` | 日语 |
| `ko.ts` | 韩语 |
| `no.ts` | 挪威语 |
| `pl.ts` | 波兰语 |
| `ru.ts` | 俄语 |
| `th.ts` | 泰语 |
| `tr.ts` | 土耳其语 |
| `zh.ts` | 简体中文 |
| `zht.ts` | 繁体中文 |
| `parity.test.ts` |  parity 测试 |

### 8.2 键名规范

```
ui.common.xxx     # 通用翻译
ui.xxx.yyy        # 特定功能翻译
```

### 8.3 使用方式

```typescript
// 通过 LanguageProvider 获取当前语言
const { t } = useLanguage()

// 使用翻译
t("ui.common.cancel")     // → "Cancel" / "取消"
t("ui.session.send")      // → "Send" / "发送"
```

---

## 九、构建配置

### 9.1 Vite 配置 (vite.config.ts)

```typescript
// 主要配置项
{
  plugins: [solidPlugin()],
  css: {
    postcss: "./postcss.config.cjs"
  },
  build: {
    target: "esnext"
  }
}
```

### 9.2 依赖关系

```
app
  │
  ├─ @solidjs/start        → SSR 框架
  ├─ @solidjs/router       → 路由管理
  ├─ @tanstack/solid-query → 数据获取
  ├─ tailwindcss           → 原子化 CSS
  ├─ marked + shiki        → Markdown 渲染
  ├─ @opencode-ai/ui       → UI 组件库
  └─ @opencode-ai/sdk      → JavaScript SDK
```

---

## 十、测试配置

### 10.1 单元测试

```bash
cd packages/app && bun test
```

### 10.2 E2E 测试 (Playwright)

```bash
cd packages/app && npx playwright test
```

### 10.3 Testing 探针 (src/testing/)

用于 E2E 测试的特殊组件和工具：

| 文件 | 作用 |
|------|------|
| `model-selection.ts` | 模型选择测试探针 |
| `prompt.ts` | Prompt 测试探针 |
| `session-composer.ts` | Session Composer 测试探针 |
| `terminal.ts` | 终端测试探针 |

---

## 十一、Hooks

### src/hooks/ 目录

| 文件 | 作用 |
|------|------|
| `use-providers.ts` | Provider 列表获取钩子 |

---

## 十二、架构总结

```
┌─────────────────────────────────────────────────────────┐
│                    app.tsx (根组件)                       │
├─────────────────────────────────────────────────────────┤
│                   Provider 树 (19个)                      │
├─────────────────────────────────────────────────────────┤
│                     路由系统                              │
│  /  → HomeRoute  │  /:dir  → Layout  │  /:dir/session →  │
├─────────────────────────────────────────────────────────┤
│                    页面组件                               │
│  HomeRoute  │  DirectoryLayout  │  SessionRoute          │
├─────────────────────────────────────────────────────────┤
│                    共享组件 (43个)                        │
│  PromptInput  │  FileTree  │  Terminal  │  Dialogs (14)  │
│  Settings (5) │  StatusPopover  │  SessionContext        │
├─────────────────────────────────────────────────────────┤
│                    Context Provider (46个)                │
│  Server  │  Settings  │  SDK  │  Layout  │  File (8)     │
│  GlobalSync (15) │  Terminal  │  Command  │  Models      │
├─────────────────────────────────────────────────────────┤
│                    工具函数 (34个)                        │
│  persist  │  base64  │  server-health  │  worktree       │
├─────────────────────────────────────────────────────────┤
│                    国际化 (18种语言)                      │
│  ar, br, bs, da, de, en, es, fr, ja, ko, no, pl, ru,    │
│  th, tr, zh, zht                                         │
├─────────────────────────────────────────────────────────┤
│                    SDK 调用层                             │
│  @opencode-ai/sdk → HTTP API → opencode server          │
└─────────────────────────────────────────────────────────┘
```

### 设计亮点

1. **Provider 树架构**: 19 个 Context Provider 管理全局状态
2. **响应式 UI**: SolidJS 信号系统实现高效渲染
3. **渐进式加载**: 会话消息历史窗口化加载
4. **数据预取**: 智能预取会话数据，提升体验
5. **国际化支持**: 18 种语言完整支持
6. **多端适配**: 同时支持 Web 和 Desktop (Tauri)
7. **完整组件库**: 43 个应用组件，14 个对话框，5 个设置面板
8. **测试覆盖**: 大量单元测试文件覆盖核心逻辑

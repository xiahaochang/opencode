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

## 二、目录结构

```
packages/app/
├── src/
│   ├── index.ts                 # 公共导出
│   ├── entry.tsx                # 入口文件（render 挂载点）
│   ├── app.tsx                  # 主应用组件（路由 + Provider 树）
│   ├── index.css                # 全局样式
│   │
│   ├── pages/                   # 页面路由组件
│   │   ├── home.tsx             # 首页（项目选择）
│   │   ├── layout.tsx           # 主布局（侧边栏 + 项目/工作区管理）
│   │   ├── session.tsx          # 会话页面（AI 对话交互）
│   │   ├── directory-layout.tsx # 目录级别布局包装器
│   │   ├── error.tsx            # 错误页面
│   │   ├── layout/              #   布局子组件
│   │   │   ├── sidebar-shell.tsx      # 侧边栏外壳
│   │   │   ├── sidebar-project.tsx    # 项目级别侧边栏项
│   │   │   ├── sidebar-workspace.tsx  # 工作区级别侧边栏项
│   │   │   ├── sidebar-items.tsx      # 侧边栏会话列表项
│   │   │   └── inline-editor.tsx      # 内联编辑器控制器
│   │   └── session/             #   会话子组件
│   │       ├── composer/              # 作曲家区域
│   │       │   ├── session-composer-region.tsx
│   │       │   ├── session-question-dock.tsx
│   │       │   ├── session-permission-dock.tsx
│   │       │   ├── session-followup-dock.tsx
│   │       │   ├── session-revert-dock.tsx
│   │       │   └── session-todo-dock.tsx
│   │       ├── message-timeline.tsx   # 消息时间线
│   │       ├── review-tab.tsx         # 代码审查标签页
│   │       ├── terminal-panel.tsx     # 终端面板
│   │       ├── session-side-panel.tsx # 会话侧面板
│   │       ├── file-tabs.tsx          # 文件标签页
│   │       └── ...
│   │
│   ├── components/              # 共享组件
│   │   ├── prompt-input.tsx     # 提示输入框（核心交互组件）
│   │   ├── file-tree.tsx        # 文件树
│   │   ├── terminal.tsx         # 终端
│   │   ├── titlebar.tsx         # 标题栏
│   │   ├── dialog-*.tsx         # 各类对话框组件
│   │   ├── settings-*.tsx       # 设置面板组件
│   │   └── prompt-input/        #   prompt-input 子模块
│   │
│   ├── context/                 # 全局状态/Provider（19 个）
│   │   ├── server.tsx           # 服务器连接管理
│   │   ├── settings.tsx         # 用户设置
│   │   ├── layout.tsx           # 布局状态（侧边栏、标签等）
│   │   ├── sync.tsx             # 数据同步
│   │   ├── global-sync.tsx      # 全局同步（多项目）
│   │   ├── sdk.tsx              # SDK 实例
│   │   ├── global-sdk.tsx       # 全局 SDK
│   │   ├── prompt.tsx           # Prompt 状态
│   │   ├── file.tsx             # 文件管理
│   │   ├── terminal.tsx         # 终端管理
│   │   ├── command.tsx          # 命令注册/快捷键
│   │   ├── models.tsx           # 模型管理
│   │   ├── permission.tsx       # 权限管理
│   │   ├── notification.tsx     # 通知
│   │   ├── comments.tsx         # 评论/批注
│   │   ├── highlights.tsx       # 高亮
│   │   ├── language.tsx         # 国际化
│   │   ├── platform.tsx         # 平台抽象层
│   │   └── local.tsx            # 本地状态
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   └── use-providers.ts     # Provider 列表获取
│   │
│   ├── utils/                   # 工具函数（33 个文件）
│   │   ├── persist.ts           # 持久化存储
│   │   ├── base64.ts            # Base64 编解码
│   │   ├── server-health.ts     # 健康检查
│   │   ├── worktree.ts          # Git worktree 管理
│   │   └── ...
│   │
│   ├── i18n/                    # 国际化字典
│   │   ├── en.ts                # 英文翻译
│   │   └── zh.ts                # 中文翻译
│   │
│   ├── constants/               # 常量
│   │   └── file-picker.ts       # 文件选择器配置
│   │
│   ├── addons/                  # 插件序列化
│   └── testing/                 # E2E 测试探针
│
├── e2e/                         # E2E 测试
├── test/                        # 单元测试
├── public/                      # 静态资源
├── script/                      # 脚本
├── vite.config.ts               # Vite 配置
├── package.json                 # 包配置
└── playwright.config.ts         # Playwright 配置
```

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

| 路由 | 组件 | 说明 |
|------|------|------|
| `/` | `HomeRoute` | 首页，项目选择 |
| `/:dir` | `DirectoryLayout` | 目录包装器，初始化 SDK 和 Sync |
| `/:dir/` | `SessionIndexRoute` | 重定向到 session |
| `/:dir/session/:id?` | `SessionRoute` | 会话页面，核心交互 |
| `*` | `ErrorRoute` | 错误页面 |

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

#### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                  布局初始化流程                            │
└─────────────────────────────────────────────────────────┘

DirectoryLayout 挂载
  │
  ├─ 1. 初始化 Provider 树
  │    └─ ServerProvider, SettingsProvider, ...
  │
  ├─ 2. 检查是否需要自动打开项目
  │    └─ 如果无当前项目 → 自动打开最近项目
  │
  ├─ 3. 设置事件监听
  │    ├─ 权限通知 → toast
  │    └─ 问题通知 → toast
  │
  ├─ 4. 启动更新检查定时器
  │    └─ 每 N 分钟轮询一次
  │
  └─ 5. 渲染布局
       │
       ├─ 侧边栏外壳 (SidebarShell)
       ├─ 项目列表 (SidebarProject)
       ├─ 工作区列表 (SidebarWorkspace)
       └─ 会话列表 (SidebarItems)
```

#### 子组件

| 组件 | 文件 | 作用 |
|------|------|------|
| `SidebarShell` | `layout/sidebar-shell.tsx` | 侧边栏外壳 |
| `SidebarProject` | `layout/sidebar-project.tsx` | 项目级别侧边栏项（含拖拽） |
| `SidebarWorkspace` | `layout/sidebar-workspace.tsx` | 工作区级别侧边栏项（含拖拽） |
| `SidebarItems` | `layout/sidebar-items.tsx` | 侧边栏会话列表项 |
| `InlineEditor` | `layout/inline-editor.tsx` | 内联编辑器控制器 |

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

#### 流程图

```
┌─────────────────────────────────────────────────────────┐
│                  会话页面流程                             │
└─────────────────────────────────────────────────────────┘

SessionRoute 渲染
  │
  ├─ 1. 加载会话数据
  │    └─ SDK.getMessages(sessionID)
  │
  ├─ 2. 渲染消息时间线
  │    └─ MessageTimeline 组件
  │
  ├─ 3. 监听新消息
  │    └─ SSE 事件流 → 更新消息列表
  │
  ├─ 4. 用户输入消息
  │    └─ Composer 区域 → 发送 prompt
  │
  ├─ 5. AI 处理并返回
  │    ├─ 工具调用 → 显示进度
  │    └─ 文本回复 → 显示内容
  │
  └─ 6. 自动滚动到底部
       └─ scrollToBottom()
```

#### 子组件

| 组件 | 文件 | 作用 |
|------|------|------|
| `MessageTimeline` | `session/message-timeline.tsx` | 消息时间线 |
| `SessionComposerRegion` | `session/composer/session-composer-region.tsx` | 主 composer 区域 |
| `SessionQuestionDock` | `session/composer/session-question-dock.tsx` | 问题 dock |
| `SessionPermissionDock` | `session/composer/session-permission-dock.tsx` | 权限请求 dock |
| `SessionFollowupDock` | `session/composer/session-followup-dock.tsx` | 后续对话 dock |
| `SessionRevertDock` | `session/composer/session-revert-dock.tsx` | 撤销 dock |
| `SessionTodoDock` | `session/composer/session-todo-dock.tsx` | Todo 列表 dock |
| `ReviewTab` | `session/review-tab.tsx` | 代码审查标签页 |
| `TerminalPanel` | `session/terminal-panel.tsx` | 终端面板 |
| `SessionSidePanel` | `session/session-side-panel.tsx` | 会话侧面板 |
| `FileTabs` | `session/file-tabs.tsx` | 文件标签页 |

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
  // ... 更多设置项
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
  // ... 更多布局状态
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

#### 其他 Provider 速查

| Provider | 文件 | 主要作用 |
|----------|------|----------|
| `SyncProvider` | `sync.tsx` | 数据同步（会话列表等） |
| `GlobalSyncProvider` | `global-sync.tsx` | 全局同步（多项目） |
| `PromptProvider` | `prompt.tsx` | Prompt 状态管理 |
| `FileProvider` | `file.tsx` | 文件管理 |
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

---

## 六、核心组件分析

### 6.1 PromptInput (src/components/prompt-input.tsx)

**职责**: 提示输入框（核心交互组件）

#### 组件结构

```
┌─────────────────────────────────────────────────────────┐
│                   PromptInput 组件                        │
└─────────────────────────────────────────────────────────┘

PromptInput
  │
  ├─ 输入区域
  │   └─ textarea (支持多行)
  │
  ├─ 附件区域
  │   └─ 文件/图片预览
  │
  ├─ 工具栏
  │   ├─ 代理选择器
  │   ├─ 模型选择器
  │   └─ 发送按钮
  │
  └─ 自动调整高度
      └─ 根据内容调整 textarea 高度
```

#### 关键函数

| 函数 | 作用 |
|------|------|
| `PromptInput` | 主组件 |
| `handleSubmit()` | 处理提交 |
| `handleKeyDown()` | 处理键盘事件 |
| `autoResize()` | 自动调整高度 |
| `addAttachment()` | 添加附件 |
| `removeAttachment()` | 移除附件 |

### 6.2 FileTree (src/components/file-tree.tsx)

**职责**: 文件树组件

#### 关键函数

| 函数 | 作用 |
|------|------|
| `FileTree` | 主组件 |
| `loadFiles()` | 加载文件列表 |
| `toggleFolder()` | 切换文件夹展开/折叠 |
| `selectFile()` | 选择文件 |

### 6.3 Terminal (src/components/terminal.tsx)

**职责**: 终端组件

#### 关键函数

| 函数 | 作用 |
|------|------|
| `Terminal` | 主组件 |
| `initTerminal()` | 初始化终端 |
| `executeCommand()` | 执行命令 |
| `resizeTerminal()` | 调整终端大小 |

---

## 七、工具函数分析

### 7.1 持久化存储 (src/utils/persist.ts)

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

### 7.2 Base64 编解码 (src/utils/base64.ts)

**职责**: Base64 编解码（用于编码目录路径）

#### 关键函数

| 函数 | 作用 |
|------|------|
| `encodeBase64(str)` | 编码为 Base64 |
| `decodeBase64(str)` | 解码 Base64 |

### 7.3 健康检查 (src/utils/server-health.ts)

**职责**: 服务器健康检查

#### 关键函数

| 函数 | 作用 |
|------|------|
| `checkHealth(url)` | 检查服务器健康状态 |
| `parseHealthStatus(status)` | 解析健康状态 |

### 7.4 Git Worktree 管理 (src/utils/worktree.ts)

**职责**: Git worktree 管理

#### 关键函数

| 函数 | 作用 |
|------|------|
| `getWorktrees()` | 获取 worktree 列表 |
| `createWorktree()` | 创建 worktree |
| `deleteWorktree()` | 删除 worktree |

---

## 八、国际化

### 8.1 字典文件

| 文件 | 作用 |
|------|------|
| `src/i18n/en.ts` | 英文翻译字典 |
| `src/i18n/zh.ts` | 中文翻译字典 |

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

#### 测试探针 (src/testing/)

用于 E2E 测试的特殊组件和工具。

---

## 十一、架构总结

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
│                    共享组件                               │
│  PromptInput  │  FileTree  │  Terminal  │  Dialogs       │
├─────────────────────────────────────────────────────────┤
│                    工具函数                               │
│  persist  │  base64  │  server-health  │  worktree       │
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
5. **国际化支持**: 完整的 i18n 实现
6. **多端适配**: 同时支持 Web 和 Desktop (Tauri)

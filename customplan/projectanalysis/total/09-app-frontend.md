# app 前端包详细分析 (SolidJS Web 应用)

## 一、包概览

| 属性 | 值 |
|------|------|
| **包名** | `@opencode-ai/app` |
| **路径** | `packages/app` |
| **技术栈** | SolidJS 1.9 + TailwindCSS 4 + Vite 7 |
| **用途** | Web 应用前端，同时作为 Desktop (Tauri/Electron) 的基础 UI |
| **文件数** | 233 个（约 180 生产 + 53 测试） |
| **国际化** | 18 种语言 |

### 设计目标

- **多端复用**：同一套 UI 代码同时服务于 Web 浏览器和桌面应用
- **目录级隔离**：每个项目目录拥有独立的 SDK 客户端和同步状态
- **响应式优先**：使用 SolidJS Signals 实现细粒度响应式更新
- **持久化优化**：自定义 LRU 缓存 + 本地存储，支持迁移和配额管理

---

## 二、目录结构

```
packages/app/src/
├── app.tsx                        # 根组件（路由 + 全局 Provider）
├── entry.tsx                      # 入口文件（挂载到 DOM）
├── index.ts                       # 包导出
├── index.css                      # 全局样式（Tailwind）
│
├── pages/                         # 页面级组件 (4 个主文件 + 子目录)
│   ├── home.tsx                   # 首页（项目选择）
│   ├── layout.tsx                 # 主应用布局（侧边栏 + 内容区，~2500 行）
│   ├── directory-layout.tsx       # 目录级布局包装器
│   ├── session.tsx                # 会话页面（~2000 行）
│   ├── error.tsx                  # 错误边界页面
│   ├── layout/                    # 布局子组件
│   │   ├── sidebar.tsx            # 侧边栏（项目列表）
│   │   ├── deep-links.ts          # 深度链接处理
│   │   ├── helpers.ts             # 布局辅助工具
│   │   └── inline-editor.tsx      # 行内编辑器
│   └── session/                   # 会话子组件 (22 个文件)
│       ├── message-timeline.tsx   # 消息时间线（~1100 行）
│       ├── session-side-panel.tsx # 侧边面板（文件标签 + 审查 + 文件树）
│       ├── file-tabs.tsx          # 文件标签页内容（~502 行）
│       ├── terminal-panel.tsx     # 终端面板（~324 行）
│       ├── review-tab.tsx         # 审查标签页（Diff 显示）
│       ├── use-session-commands.tsx # 会话命令注册（20+ 命令）
│       ├── use-session-hash-scroll.tsx # URL 哈希滚动管理
│       ├── session-layout.ts      # 会话布局钩子（sessionKey/tabs/view）
│       ├── handoff.ts             # 会话交接状态（文件选择/终端标题）
│       ├── helpers.ts             # 标签页/尺寸/终端辅助函数
│       ├── file-tab-scroll.ts     # 文件标签列表滚动同步
│       ├── message-gesture.ts     # 滚动手势边界检测
│       ├── message-id-from-hash.ts # URL 哈希解析消息 ID
│       ├── terminal-label.ts      # 终端标签标题格式化
│       ├── session-model-helpers.ts # 会话模型同步辅助
│       ├── composer/              # 会话编辑器子目录
│       ├── file-tab-scroll.test.ts # 文件标签滚动测试
│       ├── helpers.test.ts        # 辅助函数测试
│       ├── message-gesture.test.ts # 滚动手势测试
│       ├── session-model-helpers.test.ts # 模型同步测试
│       ├── terminal-panel.test.ts # 终端面板测试
│       └── use-session-hash-scroll.test.ts # 哈希滚动测试
│
├── components/                    # 业务组件 (~60 个文件)
│   ├── prompt-input/              # 提示输入组件 (16 个文件)
│   │   ├── editor-dom.ts          # ContentEditable DOM 管理
│   │   ├── attachments.ts         # 文件附件管理
│   │   ├── build-request-parts.ts # 构建 API 请求
│   │   ├── context-items.tsx      # 上下文项芯片
│   │   ├── drag-overlay.tsx       # 拖放覆盖层
│   │   ├── files.ts               # 文件验证
│   │   ├── history.ts             # 输入历史（上下箭头）
│   │   ├── image-attachments.tsx  # 图片附件
│   │   ├── paste.ts               # 粘贴处理器
│   │   ├── placeholder.ts         # 占位文本
│   │   ├── slash-popover.tsx      # 斜杠命令自动补全
│   │   └── submit.ts              # 提交逻辑
│   ├── server/                    # 服务器组件
│   │   └── server-row.tsx         # 服务器连接行
│   ├── session/                   # 会话组件 (10 个文件)
│   │   ├── session-context-breakdown.ts  # 上下文窗口使用计算
│   │   ├── session-context-format.ts     # 上下文使用格式化
│   │   ├── session-context-metrics.ts    # Token/字符指标
│   │   ├── session-context-tab.tsx       # 上下文使用指示器
│   │   ├── session-header.tsx            # 会话头部（模型/代理选择）
│   │   ├── session-new-view.tsx          # 新建会话视图
│   │   ├── session-sortable-tab.tsx      # 可排序文件标签
│   │   └── session-sortable-terminal-tab.tsx # 可排序终端标签
│   ├── dialog-*.tsx               # 对话框组件 (13 个文件)
│   │   ├── dialog-select-directory.tsx   # 目录选择
│   │   ├── dialog-select-file.tsx        # 文件选择
│   │   ├── dialog-select-model.tsx       # 模型选择
│   │   ├── dialog-select-model-unpaid.tsx # 未付费模型选择
│   │   ├── dialog-select-provider.tsx    # 提供商选择
│   │   ├── dialog-select-server.tsx      # 服务器选择
│   │   ├── dialog-select-mcp.tsx         # MCP 服务器选择
│   │   ├── dialog-settings.tsx           # 设置容器
│   │   ├── dialog-custom-provider.tsx    # 自定义提供商
│   │   ├── dialog-custom-provider-form.ts # 自定义提供商表单
│   │   ├── dialog-connect-provider.tsx   # OAuth 连接流程
│   │   ├── dialog-edit-project.tsx       # 项目元数据编辑
│   │   ├── dialog-fork.tsx               # 会话分叉
│   │   ├── dialog-manage-models.tsx      # 模型可见性管理
│   │   └── dialog-release-notes.tsx      # 发布说明
│   ├── file-tree.tsx              # 文件树（展开/折叠/虚拟化）
│   ├── terminal.tsx               # Ghostty 终端组件
│   ├── titlebar.tsx               # 标题栏（桌面应用）
│   ├── titlebar-history.ts        # 标题栏会话历史
│   ├── status-popover.tsx         # 连接状态指示器
│   ├── status-popover-body.tsx    # 状态弹出内容
│   ├── model-tooltip.tsx          # 模型信息工具提示
│   ├── link.tsx                   # 外部链接处理器
│   ├── debug-bar.tsx              # 开发调试覆盖层
│   ├── settings-*.tsx             # 设置面板 (5 个文件)
│   │   ├── settings-general.tsx   # 通用设置
│   │   ├── settings-keybinds.tsx  # 快捷键设置
│   │   ├── settings-models.tsx    # 模型设置
│   │   ├── settings-providers.tsx # 提供商设置
│   │   └── settings-list.tsx      # 设置列表
│   └── session-context-usage.tsx  # 上下文使用显示
│
├── context/                       # 状态管理 Provider (46 个文件)
│   ├── server.tsx                 # 服务器连接管理
│   ├── layout.tsx                 # 布局状态（侧边栏/终端/标签）
│   ├── settings.tsx               # 用户设置持久化
│   ├── language.tsx               # 国际化语言管理
│   ├── global-sdk.tsx             # 全局 SDK 客户端 + SSE 事件
│   ├── global-sync.tsx            # 全局数据同步
│   ├── sdk.tsx                    # 目录级 SDK 客户端
│   ├── sync.tsx                   # 目录级数据同步
│   ├── file.tsx                   # 文件内容管理
│   ├── terminal.tsx               # 工作区级终端会话
│   ├── command.tsx                # 命令面板 + 快捷键
│   ├── comments.tsx               # 行评论系统
│   ├── prompt.tsx                 # 提示输入状态
│   ├── permission.tsx             # 权限自动响应
│   ├── notification.tsx           # 通知系统
│   ├── models.tsx                 # 模型可见性和近期
│   ├── highlights.tsx             # 发布说明高亮
│   ├── platform.tsx               # 平台抽象（Web vs Desktop）
│   ├── local.tsx                  # 会话级本地状态
│   ├── data-provider.tsx          # 数据提供者
│   ├── file/                      # 文件上下文子模块 (8 个文件)
│   │   ├── content-cache.ts       # 内容缓存
│   │   ├── path.ts                # 路径处理
│   │   ├── tree-store.ts          # 树存储
│   │   ├── types.ts               # 类型定义
│   │   ├── view-cache.ts          # 视图缓存
│   │   └── watcher.ts             # 文件监视器
│   └── global-sync/               # 全局同步子模块 (15 个文件)
│       ├── bootstrap.ts           # 引导初始化
│       ├── child-store.ts         # 子存储
│       ├── event-reducer.ts       # 事件缩减器
│       ├── queue.ts               # 事件队列
│       └── session-*.ts           # 会话相关同步 (11 个文件)
│
├── utils/                         # 工具函数 (34 个文件)
│   ├── persist.ts                 # 持久化层（LRU + 配额 + 迁移）
│   ├── server.ts                  # SDK 客户端工厂
│   ├── server-health.ts           # 健康检查
│   ├── server-errors.ts           # 服务器错误格式化
│   ├── base64.ts                  # Base64 URL 安全编码
│   ├── diffs.ts                   # Diff 处理和格式化
│   ├── agent.ts                   # 消息代理颜色映射
│   ├── aim.ts                     # 侧边栏悬停激活
│   ├── comment-note.ts            # 评论注释解析
│   ├── id.ts                      # ID 生成
│   ├── notification-click.ts      # 通知点击导航
│   ├── prompt.ts                  # 消息部分提取提示
│   ├── runtime-adapters.ts        # 运行时适配器检测
│   ├── same.ts                    # 深度相等检查
│   ├── scoped-cache.ts            # 作用域 LRU 缓存
│   ├── sound.ts                   # 声音播放
│   ├── session-title.ts           # 会话标题生成
│   ├── terminal-writer.ts         # 终端输出写入
│   ├── time.ts                    # 时间格式化
│   ├── uuid.ts                    # UUID 生成
│   ├── worktree.ts                # Worktree 状态管理
│   ├── solid-dnd.ts               # 拖放工具
│   ├── model-variant.ts           # 模型变体解析（context 目录）
│   └── ... (其他 10 个文件)
│
├── hooks/                         # 自定义钩子 (1 个文件)
│   └── use-providers.ts           # 提供商数据过滤
│
├── i18n/                          # 国际化字典 (18 个文件)
│   ├── en.ts                      # 英文
│   ├── zh.ts                      # 简体中文
│   ├── zht.ts                     # 繁体中文
│   ├── ko.ts                      # 韩文
│   ├── de.ts                      # 德文
│   ├── es.ts                      # 西班牙文
│   ├── fr.ts                      # 法文
│   ├── da.ts                      # 丹麦文
│   ├── ja.ts                      # 日文
│   ├── pl.ts                      # 波兰文
│   ├── ru.ts                      # 俄文
│   ├── ar.ts                      # 阿拉伯文
│   ├── no.ts                      # 挪威文
│   ├── br.ts                      # 葡萄牙文（巴西）
│   ├── th.ts                      # 泰文
│   ├── bs.ts                      # 波斯尼亚文
│   ├── tr.ts                      # 土耳其文
│   └── parity.test.ts             # 翻译完整性测试
│
├── addons/                        # 序列化插件
│   ├── serialize.ts               # 会话数据序列化
│   └── serialize.test.ts          # 序列化测试
│
├── constants/                     # 常量
│   └── file-picker.ts             # 文件选择器配置
│
├── testing/                       # 测试工具
│   ├── terminal.ts                # 终端测试工具
│   ├── session-composer.ts        # 会话编辑器测试
│   ├── prompt.ts                  # 提示输入测试
│   └── model-selection.ts         # 模型选择测试
│
└── vite/                          # Vite 插件
    └── index.ts                   # appPlugin 导出
```

---

## 三、路由配置

### 路由表

定义在 `app.tsx` 中，使用 `@solidjs/router`：

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `HomeRoute` | 首页（项目选择器） |
| `/:dir` | `DirectoryLayout` → 重定向到 `/:dir/session` | 目录入口 |
| `/:dir/session/:id?` | `DirectoryLayout` → `SessionRoute` | 会话页面（可选会话 ID） |

### 路由特点

- **`:dir` 参数**：Base64 编码的目录路径
- **预加载**：URL 匹配 `/session` 模式时预加载会话页面
- **目录级包装器**：`DirectoryLayout` 为每个目录创建独立的 SDK/Sync/Local 上下文
- **RouterRoot**：包裹全局 Provider（设置/权限/布局/通知/模型/命令/高亮）

### 组件层级

```
<AppBaseProviders>              ← Meta/Font/Theme/Language/I18nBridge
  <ServerProvider>              ← 服务器连接管理
    <ConnectionGate>            ← 连接门控
      <ServerKey>               ← 服务器密钥
        <GlobalSDKProvider>     ← 全局 SDK 客户端
          <GlobalSyncProvider>  ← 全局数据同步
            <Router>
              <Route path="/" component={HomeRoute} />
              <Route path="/:dir" component={DirectoryLayout}>
                <SDKProvider>       ← 目录级 SDK
                  <SyncProvider>    ← 目录级同步
                    <DataProvider>  ← 数据提供
                      <LocalProvider> ← 会话级本地状态
                        <SessionProviders> ← 会话 Provider
                          <SessionRoute />
                        </SessionProviders>
                      </LocalProvider>
                    </DataProvider>
                  </SyncProvider>
                </SDKProvider>
              </Route>
            </Router>
```

---

## 四、页面组件详细分析

### 4.1 首页 (home.tsx)

**用途**：无目录选择时显示的落地页

**状态管理**：
- `useGlobalSync()` - 获取项目列表
- `useLayout()` - 项目管理操作

**关键函数**：

| 函数 | 作用 |
|------|------|
| `openProject()` | 打开已有项目目录 |
| `chooseProject()` | 打开原生文件选择器或对话框 |

**UI 元素**：
- OpenCode Logo
- 服务器选择按钮
- 最近项目列表（按更新时间排序，最多 5 个）
- 空状态 + "打开项目" 按钮

---

### 4.2 主布局 (layout.tsx) ~2500 行

**用途**：主应用外壳，包裹所有目录级内容

**状态管理**（使用 `persisted()` 存储）：

| 状态 | 用途 |
|------|------|
| 侧边栏开/关 + 宽度 | 侧边栏可见性和尺寸 |
| 工作区/项目排序 | 拖放重排序（`@thisbeyond/solid-dnd`） |
| 会话标签页状态 | 会话标签可见性 |
| 尺寸配置 | 面板大小 |
| 会话滚动位置 | 滚动持久化 |
| 悬停/窥视项目 | 折叠侧边栏悬停预览 |

**核心功能**：

| 功能 | 说明 |
|------|------|
| `openProject()` / `closeProject()` | 打开/关闭项目 |
| `workspaceName()` / `setWorkspaceName()` | 工作区命名（支持分支） |
| `cycleTheme()` / `cycleColorScheme()` / `cycleLanguage()` | 快捷键快速切换 |
| `scrollToSession()` | 平滑滚动到侧边栏会话 |
| SDK 通知 Toast 系统 | 权限/问题警报 |
| 桌面应用更新轮询 | 自动检查更新 |
| 深度链接处理 | 处理 `window.__OPENCODE__.deepLinks` |
| 行内编辑器 | `createInlineEditorController()` 侧边栏项目名称编辑 |

**会话预取队列**：
- LRU 淘汰策略
- 批量大小：200
- 并发数：2

---

### 4.3 目录布局 (directory-layout.tsx)

**用途**：目录级包装器，为每个目录提供独立的 SDK/Sync/DataProvider/LocalProvider 上下文

**关键行为**：
- 目录路径变化时重定向 URL（如 worktree 根变化）
- 挂载时触发会话同步
- URL 解码失败时显示 Toast 错误并重定向到首页

---

### 4.4 会话页面 (session.tsx) ~2000 行

**用途**：主要会话视图，包含聊天时间线、文件标签、终端面板、审查标签

**使用的关键组件**：
- `MessageTimeline` - 消息时间线
- `SessionComposerRegion` - 会话编辑区
- `TerminalPanel` - 终端面板
- `SessionReviewTab` - 审查标签
- `SessionSidePanel` - 侧边面板
- `SessionHeader` - 会话头部
- `NewSessionView` - 新建会话视图

**状态管理**：

| 状态 | 用途 |
|------|------|
| `createSessionComposerState()` | 提示输入、后续队列、权限/问题停靠 |
| `createSessionHistoryWindow()` | 渲染消息窗口（懒加载 + 预取） |
| `syncSessionModel()` | 会话模型选择同步 |
| `createSessionTabs()` | 文件标签管理 |
| 尺寸状态 | 分割面板尺寸 |

**关键功能**：

| 功能 | 说明 |
|------|------|
| 会话回退/恢复 | Undo/Redo |
| 会话压缩 | 总结上下文 |
| 会话分叉 | 从某点创建分支 |
| 会话分享/取消分享 | 共享会话链接 |
| 文件标签管理 | 开/关标签 + 滚动持久化 |
| 后续消息队列 | 管理排队消息 |
| VCS 模式切换 | Git/分支/回合 |

---

### 4.5 消息时间线 (message-timeline.tsx) ~1100 行

**用途**：渲染消息历史时间线，包含用户/助手回合

**特性**：
- 消息渲染（代码块、工具调用、推理摘要）
- 分叉/回退操作
- 评论元数据解析
- 会话上下文使用显示
- 自动滚动 + 手势检测
- 历史加载更多分页

---

### 4.6 终端面板 (terminal-panel.tsx) ~324 行

**用途**：PTY 终端面板，可排序标签

**特性**：
- 拖放标签重排序
- 首次打开时创建终端
- 高度调整
- 跨会话切换的终端持久化

---

### 4.7 文件标签页 (file-tabs.tsx) ~502 行

**用途**：文件查看器标签，滚动同步、评论注释、行选择

**特性**：
- 多文件标签 + 统一/滚动同步查看
- 每文件评论创建/编辑/删除
- 选择预览
- 内容差异高亮

---

### 4.8 错误页面 (error.tsx)

**用途**：错误边界回退页面

**特性**：
- 显示格式化错误链
- 检测初始化错误类型（MCPFailed、ProviderAuthError、APIError 等）
- 重启按钮
- 更新检查/安装
- Discord 报告链接

---

## 五、Context Provider 详细分析

所有上下文使用 `createSimpleContext` 来自 `@opencode-ai/ui/context`（类似 React `createContext` 但使用 SolidJS 语义）。

### 核心 Provider (19 个)

| Provider | 作用域 | 关键状态 | 用途 |
|----------|--------|---------|------|
| **ServerProvider** | 全局 | 活跃服务器、健康轮询、每服务器项目列表 | 管理服务器连接（HTTP/Sidecar/SSH） |
| **LayoutProvider** | 全局 | 侧边栏开/宽度、终端高度、文件树、会话标签、滚动、审查面板 | 应用布局状态 |
| **SettingsProvider** | 全局 | 通用（自动保存、后续模式、推理摘要）、外观（字体大小、等宽/无衬线字体）、快捷键、权限、通知、声音 | 用户设置持久化 |
| **LanguageProvider** | 全局 | 当前语言（18 种支持）、翻译函数 `t()` | 国际化语言管理 |
| **GlobalSDKProvider** | 全局 | OpencodeClient 实例、SSE 事件发射器（合并/批处理）、心跳监控、自动重连 | 全局 SDK 客户端 + SSE 事件流 |
| **GlobalSyncProvider** | 全局 | 项目、会话、提供商、配置、路径信息；每目录子存储；事件缩减器；会话预取 | 全局数据同步 |
| **SDKProvider** | 每目录 | 目录级 OpencodeClient | 每目录 SDK 客户端 |
| **SyncProvider** | 每目录 | 消息加载（分页）、乐观更新、Diff/Todo 加载、会话缓存淘汰 | 每目录数据同步 |
| **FileProvider** | 每目录 | 文件内容缓存（LRU）、文件树列表、每文件滚动位置、选中行、文件监视器失效 | 文件内容管理 |
| **TerminalProvider** | 工作区级 | PTY 列表（创建/关闭/克隆/移动）、活跃终端、迁移持久化 | 工作区级终端会话 |
| **CommandProvider** | 全局 | 命令注册、快捷键解析/匹配（mod/ctrl/meta/shift/alt）、面板显示、暂停/恢复快捷键 | 命令面板 + 快捷键系统 |
| **CommentsProvider** | 每会话 | 每文件评论（带选择范围）、焦点/活跃状态、每会话持久化 | 行评论系统 |
| **PromptProvider** | 每会话 | 提示内容部件（文本/文件/代理/图片）、上下文项、光标位置、每会话持久化 | 提示输入状态 |
| **PermissionProvider** | 每目录 | 每会话/目录自动接受、版本跟踪、permission.asked 事件自动响应 | 权限自动响应管理 |
| **NotificationProvider** | 全局 | 回合完成和错误通知、会话/项目索引、未看到计数、声音/桌面通知触发 | 通知系统 |
| **ModelsProvider** | 每目录 | 用户可见性覆盖、近期模型（LRU 限制 5）、变体选择、最新模型检测 | 模型可见性和近期 |
| **HighlightsProvider** | 全局 | 变更日志获取、高亮解析、版本跟踪、对话框显示 | 发布说明高亮 |
| **PlatformProvider** | 全局 | 平台鉴别器、OS 信息、文件选择器、存储、通知、更新、WSL、缩放级别 | 平台抽象（Web vs Desktop） |
| **LocalProvider** | 每会话 | 代理选择、模型选择（回退链）、变体选择、会话间交接、近期模型跟踪 | 每会话本地状态 |

### 子模块

#### file/ 子模块 (8 个文件)

| 模块 | 用途 |
|------|------|
| `content-cache.ts` | 内容缓存（LRU 淘汰） |
| `path.ts` | 路径处理和标准化 |
| `tree-store.ts` | 文件树存储 |
| `types.ts` | 类型定义 |
| `view-cache.ts` | 视图缓存 |
| `watcher.ts` | 文件监视器失效 |

#### global-sync/ 子模块 (15 个文件)

| 模块 | 用途 |
|------|------|
| `bootstrap.ts` | 引导初始化 |
| `child-store.ts` | 子存储 |
| `event-reducer.ts` | 事件缩减器 |
| `queue.ts` | 事件队列 |
| `session-*.ts` (11 个文件) | 会话相关同步 |

---

## 六、组件详细分析

### 6.1 对话框组件 (13 个)

| 组件 | 用途 |
|------|------|
| `dialog-select-directory.tsx` | 目录选择器 |
| `dialog-select-file.tsx` | 文件选择器（附加到提示） |
| `dialog-select-model.tsx` | 模型选择（搜索、收藏、可见性切换） |
| `dialog-select-model-unpaid.tsx` | 未付费/限制层级的模型选择 |
| `dialog-select-provider.tsx` | 提供商选择器 |
| `dialog-select-server.tsx` | 服务器选择器 |
| `dialog-select-mcp.tsx` | MCP 服务器选择器 |
| `dialog-settings.tsx` | 设置容器对话框 |
| `dialog-custom-provider.tsx` | 自定义提供商创建/编辑 |
| `dialog-custom-provider-form.ts` | 自定义提供商表单逻辑 |
| `dialog-connect-provider.tsx` | OAuth/连接提供商流程 |
| `dialog-edit-project.tsx` | 项目元数据编辑 |
| `dialog-fork.tsx` | 会话分叉创建对话框 |
| `dialog-manage-models.tsx` | 模型可见性管理 |
| `dialog-release-notes.tsx` | 变更日志/发布高亮显示 |

### 6.2 提示输入组件 (12 个)

| 组件 | 用途 |
|------|------|
| `editor-dom.ts` | ContentEditable DOM 管理（富文本提示输入） |
| `attachments.ts` | 文件附件管理 |
| `build-request-parts.ts` | 从提示构建 API 请求部件 |
| `context-items.tsx` | 渲染上下文项芯片（文件、评论） |
| `drag-overlay.tsx` | 文件拖放覆盖层 |
| `files.ts` | 文件验证和处理 |
| `history.ts` | 提示输入历史（上下箭头导航） |
| `image-attachments.tsx` | 图片附件显示 |
| `paste.ts` | 粘贴处理器（文件、图片、文本） |
| `placeholder.ts` | 占位文本逻辑 |
| `slash-popover.tsx` | 斜杠命令自动补全弹出层 |
| `submit.ts` | 提交逻辑（包含后续草稿） |

### 6.3 会话组件 (8 个)

| 组件 | 用途 |
|------|------|
| `session-context-breakdown.ts` | 计算上下文窗口使用细分 |
| `session-context-format.ts` | 格式化上下文使用显示 |
| `session-context-metrics.ts` | 计算 Token/字符指标 |
| `session-context-tab.tsx` | 上下文使用指示器标签 |
| `session-header.tsx` | 会话头部（模型/代理选择器） |
| `session-new-view.tsx` | 新建会话视图 |
| `session-sortable-tab.tsx` | 可排序文件标签组件 |
| `session-sortable-terminal-tab.tsx` | 可排序终端标签组件 |

### 6.4 其他组件

| 组件 | 用途 |
|------|------|
| `file-tree.tsx` | 目录文件树（展开/折叠/虚拟化） |
| `terminal.tsx` | Ghostty 终端组件包装器 |
| `titlebar.tsx` | 窗口标题栏（桌面应用）+ 会话历史下拉 |
| `titlebar-history.ts` | 标题栏会话历史逻辑 |
| `status-popover.tsx` | 连接状态指示器弹出层 |
| `status-popover-body.tsx` | 状态弹出内容（服务器信息、项目） |
| `model-tooltip.tsx` | 模型信息工具提示 |
| `link.tsx` | 外部链接处理器（使用 `platform.openLink`） |
| `debug-bar.tsx` | 开发调试覆盖层 |
| `session-context-usage.tsx` | 上下文使用显示组件 |

### 6.5 设置面板 (5 个)

| 组件 | 用途 |
|------|------|
| `settings-general.tsx` | 通用设置面板 |
| `settings-keybinds.tsx` | 快捷键设置面板 |
| `settings-models.tsx` | 模型设置面板 |
| `settings-providers.tsx` | 提供商设置面板 |
| `settings-list.tsx` | 设置列表面板 |

---

## 七、状态管理架构

### 三层状态架构

```
┌─────────────────────────────────────────────────────────┐
│                    持久化存储层                            │
│                                                         │
│  persisted() 工具                                         │
│    ├── 内存 LRU 缓存（500 条目，8MB 最大）                  │
│    ├── makePersisted 包装                                 │
│    ├── 配额超出最大项淘汰                                  │
│    ├── 迁移函数支持版本控制                                │
│    └── 遗留键迁移支持                                     │
│                                                         │
│  返回: [store, setStore, init, ready()] 元组              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Context Provider 层                    │
│                                                         │
│  层级嵌套:                                                │
│    AppBaseProviders                                      │
│      → ServerProvider → ConnectionGate → ServerKey       │
│        → GlobalSDKProvider → GlobalSyncProvider          │
│          → Router                                        │
│            → DirectoryLayout                             │
│              → SDKProvider → SyncProvider                │
│                → DataProvider → LocalProvider            │
│                  → SessionProviders                      │
│                    (Terminal, File, Prompt, Comments)     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    会话级缓存层                            │
│                                                         │
│  createScopedCache / Map-based LRU                       │
│    ├── 提示状态每会话（MAX_PROMPT_SESSIONS = 20）          │
│    ├── 评论状态每会话（MAX_COMMENT_SESSIONS = 20）         │
│    ├── 终端会话每工作区（MAX_TERMINAL_SESSIONS = 20）      │
│    ├── 文件视图缓存每目录/会话                             │
│    └── 会话预取元数据                                     │
└─────────────────────────────────────────────────────────┘
```

### 响应式模式

| 模式 | 用途 |
|------|------|
| `createSignal` | 基本响应式状态 |
| `createMemo` | 派生状态计算 |
| `createEffect` | 副作用执行 |
| `createResource` | 异步数据加载 |
| `produce` (solid-js/store) | 不可变草稿突变 |
| `reconcile` | 深度存储替换 |
| `batch` | 批量存储更新分组 |
| `createGlobalEmitter` | SDK 事件发射器 |

---

## 八、文件列表刷新机制

文件列表刷新是整个前端最复杂的数据流之一，涉及 **5 层架构**：

```
┌─────────────────────────────────────────────────────────┐
│  第 1 层: 文件监视器 (Watcher)                             │
│  context/file/watcher.ts                                │
│                                                         │
│  SDK SSE 事件: file.watcher.updated                      │
│    ├── 解析 rawPath + kind (change/add/unlink)            │
│    ├── normalize 路径标准化                                │
│    └── 跳过 .git/ 目录                                    │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  第 2 层: FileProvider 响应                               │
│  context/file.tsx                                       │
│                                                         │
│  stop = sdk.event.listen((e) => {                       │
│    invalidateFromWatcher(e.details, {                   │
│      normalize: path.normalize,                         │
│      hasFile: (file) => Boolean(store.file[file]),      │
│      isOpen: (file) => tabs 中是否打开,                   │
│      loadFile: (file) => load(file, { force: true }),   │
│      node: tree.node,                                   │
│      isDirLoaded: tree.isLoaded,                        │
│      refreshDir: (dir) => tree.listDir(dir, {force:true})│
│    })                                                   │
│  })                                                     │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  第 3 层: 文件内容加载 (load 函数)                          │
│                                                         │
│  load(file, { force? })                                 │
│    ├── ensure(file) ──► 创建 FileState 空壳                │
│    ├── setLoading(file) ──► loading=true                  │
│    ├── sdk.client.file.read({path: file})                │
│    │     └──► setLoaded(file, content)                   │
│    │            ├── loaded=true, loading=false             │
│    │            └── touchFileContent(file, bytes)         │
│    ├── evictContentLru(new Set([file])) ──► 淘汰旧内容     │
│    └── inflight 防重复请求                                  │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  第 4 层: LRU 缓存淘汰 (content-cache.ts)                  │
│                                                         │
│  MAX_FILE_CONTENT_ENTRIES = 40 个文件                      │
│  MAX_FILE_CONTENT_BYTES = 20 MB                           │
│                                                         │
│  lru Map<path, bytes> ──► 最近访问的文件字节数              │
│  total ──► 总缓存字节数                                     │
│                                                         │
│  evictContentLru(keep, evict):                            │
│    while (lru.size > 40 || total > 20MB):                 │
│      path = lru.keys().next().value  (最久未访问)           │
│      if (keep.has(path)): touch(path); continue           │
│      remove(path); evict(path) ──► 清除 store.file[path]   │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  第 5 层: 视图渲染响应 (file-tabs.tsx)                     │
│                                                         │
│  const state = createMemo(() => {                        │
│    const p = path()                                       │
│    if (!p) return                                         │
│    return file.get(p)  ──► 触发 LRU touch                  │
│  })                                                       │
│                                                         │
│  const contents = createMemo(() => state()?.content?.content ?? "") │
│  const cacheKey = createMemo(() => sampledChecksum(contents()))   │
│                                                         │
│  <Switch>                                                 │
│    <Match when={state()?.loaded}>{renderFile(contents())}</Match> │
│    <Match when={state()?.loading}>加载中...</Match>         │
│    <Match when={state()?.error}>{err}</Match>              │
│  </Switch>                                                │
└─────────────────────────────────────────────────────────┘
```

### 刷新触发源 (5 种)

| 触发源 | 事件类型 | 处理逻辑 |
|--------|---------|---------|
| **文件修改** | `kind === "change"` | 如果文件已加载或已打开 → `load(file, {force: true})`；如果是目录 → `refreshDir(dir)` |
| **文件新增** | `kind === "add"` | 获取父目录 → `refreshDir(parent)` |
| **文件删除** | `kind === "unlink"` | 获取父目录 → `refreshDir(parent)` |
| **目录切换** | `scope()` 变化 | `inflight.clear()`, `resetFileContentLru()`, `reconcile({})`, `tree.reset()` |
| **手动刷新** | `file.refresh(dir)` | `tree.listDir(dir, {force: true})` |

### 文件树刷新

文件树通过 `createFileTreeStore` 管理：

```typescript
const tree = createFileTreeStore({
  scope,
  normalizeDir: path.normalizeDir,
  list: (dir) => sdk.client.file.list({ path: dir }).then((x) => x.data ?? []),
  onError: (message) => showToast({ variant: "error", ... }),
})
```

**树节点状态**：
- `loaded` - 目录是否已加载
- `expanded` - 目录是否展开
- `children` - 子节点列表（文件 + 子目录）

**刷新流程**：
1. Watcher 检测到文件变化
2. `invalidateFromWatcher` 判断是否在已打开文件列表中
3. 如果是 → 调用 `loadFile(file)` 强制重新加载内容
4. 如果是目录变化 → 调用 `refreshDir(dir)` 重新获取文件列表
5. 文件树通过 `tree.listDir(dir, {force: true})` 刷新

### 会话交接 (Handoff)

跨会话切换时保留文件选择状态：

```typescript
// handoff.ts - 全局存储（最多 40 个会话）
const MAX = 40
const store = {
  session: new Map<string, HandoffSession>(),
  terminal: new Map<string, string[]>(),
}

export const setSessionHandoff = (key: string, patch: Partial<HandoffSession>) => {
  const prev = store.session.get(key) ?? { prompt: "", files: {} }
  touch(store.session, key, { ...prev, ...patch })
}

export const getSessionHandoff = (key: string) => store.session.get(key)
```

**file-tabs.tsx 中的使用**：
```typescript
const selectedLines = createMemo<SelectedLineRange | null>(() => {
  const p = path()
  if (!p) return null
  if (file.ready()) return file.selectedLines(p) ?? null
  // 文件未就绪时从 handoff 恢复
  return getSessionHandoff(sessionKey())?.files[p] ?? null
})
```

### LRU 缓存策略

**文件内容缓存** (`content-cache.ts`)：

| 限制 | 值 |
|------|------|
| 最大文件数 | 40 个 |
| 最大总字节 | 20 MB |
| 淘汰策略 | 最久未访问 (LRU) |
| 保护机制 | `keep` 集合中的文件不淘汰 |

**视图状态缓存** (`view-cache.ts`)：

| 限制 | 值 |
|------|------|
| 最大会话数 | 20 个 |
| 每会话最大文件数 | 500 个 |
| 持久化 | `persisted()` → localStorage |

**评论状态缓存** (`comments.tsx`)：

| 限制 | 值 |
|------|------|
| 最大会话数 | 20 个 |
| 持久化 | `persisted()` → localStorage |

### 防重复加载机制

```typescript
const inflight = new Map<string, Promise<void>>()

const load = (input: string, options?: { force?: boolean }) => {
  const file = path.normalize(input)
  const directory = scope()
  const key = `${directory}\n${file}`

  // 已加载且非强制 → 跳过
  if (!options?.force && current?.loaded) return Promise.resolve()

  // 正在加载 → 复用 Promise
  const pending = inflight.get(key)
  if (pending) return pending

  // 新请求 → 创建并缓存
  const promise = sdk.client.file.read({ path: file })
    .then(...)
    .finally(() => inflight.delete(key))

  inflight.set(key, promise)
  return promise
}
```

---

## Markdown 文件渲染机制

`file-tabs.tsx` 中对 `.md` / `.markdown` 文件提供了**源代码/渲染预览 切换**功能。

### 检测逻辑

```typescript
const isMarkdown = createMemo(() => {
  const p = path()
  if (!p) return false
  return p.endsWith(".md") || p.endsWith(".markdown")
})
```

### 渲染切换状态

```typescript
// 全局持久化，所有 Markdown 文件共享同一个开关
const [renderMarkdown, setRenderMarkdown] = makePersisted(
  createSignal(false),
  { name: "md-render-global", storage: localStorage }
)
```

**特性**：
- 使用 `makePersisted` 持久化到 `localStorage`
- 键名：`md-render-global`
- **全局共享**：所有 Markdown 文件共用一个开关状态
- 默认值：`false`（显示源代码）

### 切换按钮

```typescript
const MarkdownToggleButton = () => (
  <Show when={isMarkdown()}>
    <div class="absolute top-3 right-3 z-50 flex items-center justify-center bg-bg-surface/90 border border-border-base rounded-lg w-7 h-7 shadow-md">
      <IconButton
        icon={renderMarkdown() ? "eye" : "code"}
        variant="ghost"
        size="small"
        onClick={() => setRenderMarkdown(!renderMarkdown())}
        aria-label={renderMarkdown() ? "显示源代码" : "渲染 Markdown"}
      />
    </div>
  </Show>
)
```

**UI 表现**：
- 位置：固定在视口右上角（`absolute top-3 right-3 z-50`）
- 尺寸：28×28px 小按钮
- 图标切换：`eye`（预览模式）↔ `code`（源代码模式）
- 半透明背景：`bg-bg-surface/90`
- **仅对 Markdown 文件显示**（`<Show when={isMarkdown()}>`）

### 渲染方式切换

```typescript
const renderFile = (source: string) => (
  <div class="relative overflow-hidden pb-40">
    <Switch>
      {/* 渲染模式 - 使用 Markdown 组件解析 */}
      <Match when={renderMarkdown()}>
        <div class="px-6 py-4 pt-12">
          <Markdown text={source} />
        </div>
      </Match>

      {/* 源代码模式 - 使用文件查看器组件 */}
      <Match when={!renderMarkdown()}>
        <Dynamic
          component={fileComponent}
          mode="text"
          file={{
            name: path() ?? "",
            contents: source,
            cacheKey: cacheKey(),
          }}
          enableLineSelection          // 支持行选择（评论用）
          enableHoverUtility            // 悬停工具
          selectedLines={activeSelection()}
          commentedLines={commentedLines()}
          annotations={commentsUi.annotations()}
          renderAnnotation={commentsUi.renderAnnotation}
          renderHoverUtility={commentsUi.renderHoverUtility}
          search={search}
          media={{
            mode: "auto",
            path: path(),
            current: state()?.content,
            onLoad: scrollSync.queueRestore,
            onError: (args) => {
              if (args.kind !== "svg") return
              showToast({ variant: "error", title: "加载失败" })
            },
          }}
        />
      </Match>
    </Switch>
  </div>
)
```

### 两种模式对比

| 特性 | 渲染模式 (`renderMarkdown() === true`) | 源代码模式 (`renderMarkdown() === false`) |
|------|--------------------------------------|----------------------------------------|
| **组件** | `<Markdown text={source} />` | `<Dynamic component={fileComponent} />` |
| **语法高亮** | ✅ Markdown 组件内部使用 Shiki | ✅ 文件组件支持代码高亮 |
| **行选择/评论** | ❌ 不支持 | ✅ 支持（`enableLineSelection`） |
| **评论注释** | ❌ 不显示 | ✅ 显示（`annotations` + `renderAnnotation`） |
| **搜索** | ❌ 不支持 | ✅ 支持（`Cmd/Ctrl + F`） |
| **图片/SVG 媒体** | ✅ Markdown 组件处理 | ✅ 文件组件处理（带错误 Toast） |
| **滚动恢复** | 手动处理 | 通过 `onRendered` 回调恢复 |
| **内边距** | `px-6 py-4 pt-12` | 由文件组件控制 |

### 渲染流程图

```
Markdown 文件打开
       │
       ▼
isMarkdown() === true?
       │
    ┌──┴──┐
    │ Yes │──► 右上角显示切换按钮
    └──┬──┘
       │
       ▼
renderMarkdown() 信号值?
       │
    ┌──┴──┐
    │true │──► <Markdown text={source} />
    │     │     └──► marked + shiki 渲染
    │     │     └──► 标题、列表、代码块、链接等
    │     │     └──► 图片/SVG 自动加载
    │     │
    │false│──► <Dynamic component={fileComponent} />
    │     │     └──► 语法高亮显示
    │     │     └──► 行选择 + 评论注释
    │     │     └──► Ctrl+F 搜索
    │     │     └──► 媒体文件加载（图片/SVG/音频）
    └─────┘
```

### 依赖的 Markdown 组件

`<Markdown>` 组件来自 `@opencode-ai/ui/markdown`，其底层依赖：
- **`marked`** - Markdown 解析器
- **`marked-shiki`** - 代码块语法高亮插件
- **`shiki`** - 语法高亮引擎

### 持久化键名

```
localStorage["md-render-global"]
  ├── 默认值: false
  ├── 切换后: true
  └── 所有 Markdown 文件共享
```

这意味着用户在一个 Markdown 文件中切换到渲染模式后，打开其他 Markdown 文件也会默认显示渲染模式。

---

## 九、工具函数分析

### 核心工具 (34 个文件)

| 工具 | 用途 |
|------|------|
| `persist.ts` | 核心持久化层（LRU 缓存、配额淘汰、迁移支持、桌面异步存储回退） |
| `server.ts` | SDK 客户端工厂（服务器连接） |
| `server-health.ts` | 服务器健康检查工具 |
| `server-errors.ts` | 服务器错误格式化 |
| `base64.ts` | URL 安全 Base64 编码/解码（目录路径） |
| `diffs.ts` | Diff 处理和格式化 |
| `agent.ts` | 消息代理颜色映射 |
| `aim.ts` | 侧边栏项目悬停激活工具 |
| `comment-note.ts` | 评论注释从文本解析 |
| `id.ts` | 标识符生成 |
| `notification-click.ts` | 通知点击导航函数设置 |
| `prompt.ts` | 从消息部件提取提示 |
| `runtime-adapters.ts` | 运行时适配器检测 |
| `same.ts` | 深度相等检查 |
| `scoped-cache.ts` | 带废弃的会话级 LRU 缓存 |
| `sound.ts` | 按 ID 播放声音 |
| `session-title.ts` | 会话标题生成 |
| `terminal-writer.ts` | 终端输出写入工具 |
| `time.ts` | 时间格式化工具 |
| `uuid.ts` | UUID 生成 |
| `worktree.ts` | Worktree 状态管理（ready/failed） |
| `solid-dnd.ts` | 拖放工具（轴约束、可拖动 ID 解析） |
| `model-variant.ts` | 模型变体解析和循环（context 目录） |

---

## 九、国际化 (i18n)

### 框架

- **底层**：`@solid-primitives/i18n` + `i18n.flatten()` + `i18n.translator()`
- **字典合并**：应用级（`@/i18n/`）和 UI 级（`@opencode-ai/ui/i18n/`）字典按语言合并

### 支持语言 (18 种)

| 代码 | 语言 | 代码 | 语言 |
|------|------|------|------|
| `en` | 英文 | `zh` | 简体中文 |
| `zht` | 繁体中文 | `ko` | 韩文 |
| `ja` | 日文 | `de` | 德文 |
| `es` | 西班牙文 | `fr` | 法文 |
| `da` | 丹麦文 | `pl` | 波兰文 |
| `ru` | 俄文 | `ar` | 阿拉伯文 |
| `no` | 挪威文 | `br` | 葡萄牙文（巴西） |
| `th` | 泰文 | `bs` | 波斯尼亚文 |
| `tr` | 土耳其文 | | |

### 加载策略

- **懒加载**：非英文字典按需动态导入
- **自动检测**：`detectLocale()` 匹配 `navigator.languages` 到语言匹配器
- **持久化**：选择语言通过 `Persist.global("language")` 持久化
- **桥接**：`UiI18nBridge` 在 `app.tsx` 中桥接应用语言上下文到 UI 的 `I18nProvider`

---

## 十、API 通信

### 无独立 API 服务文件

所有 API 通信通过 **Opencode SDK** (`@opencode-ai/sdk`)：

| 层 | 用途 |
|------|------|
| **SDK 创建** | `createSdkForServer()` 在 `utils/server.ts` 中创建带 Basic 认证头的 `OpencodeClient` |
| **全局 SDK** | `GlobalSDKProvider` 创建客户端并管理 SSE 事件流（合并、批处理、心跳、自动重连） |
| **每目录 SDK** | `SDKProvider` 通过 `globalSDK.createClient()` 创建目录级客户端 |
| **同步层** | `SyncProvider` 处理消息加载、乐观更新、Diff/Todo 获取、分页和缓存淘汰 |
| **事件系统** | SDK 事件通过 `createGlobalEmitter` 从 `@solid-primitives/event-bus` 流转 |

---

## 十一、钩子分析

### 唯一钩子

| 钩子 | 用途 |
|------|------|
| `use-providers.ts` | 从全局同步返回提供商数据（全部、默认、热门、已连接、付费）。如 params.dir 设置则按目录过滤。**热门提供商**：opencode、opencode-go、anthropic、github-copilot、openai、google、openrouter、vercel |

---

## 十二、关键依赖项

| 包 | 用途 |
|------|------|
| **solid-js** | 核心框架（Signals、Effects、组件） |
| **@solidjs/router** | 客户端路由 |
| **@solidjs/meta** | 文档头管理 |
| **@solid-primitives/*** | 存储、事件监听、事件总线、媒体查询、ResizeObserver、定时器、音频、i18n、WebSocket、滚动、活动元素 |
| **@tanstack/solid-query** | 数据获取/突变（少量使用） |
| **@kobalte/core** | 无头 UI 原语（弹出层、下拉菜单） |
| **@thisbeyond/solid-dnd** | 拖放（侧边栏项目、终端标签） |
| **@opencode-ai/sdk** | 工作区包 - OpenCode 服务器 API 客户端 |
| **@opencode-ai/ui** | 工作区包 - 共享 UI 组件、上下文、主题 |
| **@opencode-ai/util** | 工作区包 - 共享工具（路径、编码、二进制、重试、数组） |
| **effect** | 效果系统（应用中最少使用，更多在核心中） |
| **zod** | 模式验证（服务器连接解析） |
| **luxon** | 日期/时间格式化 |
| **remeda** | 功能工具（pipe、filter、groupBy 等） |
| **shiki** | 语法高亮 |
| **marked / marked-shiki** | Markdown 解析 + Shiki 代码块 |
| **diff** | Diff 计算 |
| **fuzzysort** | 模糊搜索（模型/提供商选择） |
| **ghostty-web** | 终端模拟器组件 |
| **virtua** | 虚拟滚动 |
| **solid-list** | 列表管理 |
| **tailwindcss** | 原子化 CSS（v4） |

---

## 十三、Vite 插件

### appPlugin (`vite/index.ts`)

导出的 Vite 插件供 desktop-electron 和其他宿主使用：

- 处理 SolidJS 编译
- 配置 TailwindCSS
- 处理国际化字典加载
- 配置别名和解析

---

## 十四、测试

### 测试工具 (`testing/`)

| 工具 | 用途 |
|------|------|
| `terminal.ts` | 终端测试工具 |
| `session-composer.ts` | 会话编辑器测试 |
| `prompt.ts` | 提示输入测试 |
| `model-selection.ts` | 模型选择测试 |

### 测试文件

- 233 个文件中约 53 个测试文件（`*.test.ts`）
- 使用 Happy-Dom 作为 DOM 环境
- 通过 `bun test` 运行

---

## 十五、文件统计

| 类别 | 数量 |
|------|------|
| 页面级组件 | 4 个主文件 + 31 个子组件 |
| 业务组件 | ~60 个 |
| Context Provider | 19 个主 Provider + 27 个子模块 |
| 工具函数 | 34 个 |
| 国际化字典 | 18 个语言文件 |
| 自定义钩子 | 1 个 |
| 测试文件 | ~53 个 |
| 配置/入口 | 6 个（app.tsx、entry.tsx、index.ts、index.css、vite/index.ts、constants/） |
| **总计** | **233 个** |

---

*本文档由 AI 自动生成，基于对 OpenCode 项目源码的完整分析。*

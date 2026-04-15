# desktop-electron 包详细分析

## 一、包概览

| 属性 | 值 |
|------|------|
| **包名** | `@opencode-ai/desktop-electron` |
| **版本** | 1.4.3 |
| **路径** | `packages/desktop-electron` |
| **技术栈** | Electron 40.4.1 + electron-vite + electron-builder |
| **架构** | 主进程/预加载/渲染器三进程架构 |
| **依赖** | `@opencode-ai/app`（Web 应用）、`@opencode-ai/ui`（UI 组件库） |

### 设计目标

基于 Electron 构建的跨平台桌面应用，与 Tauri 版本并存，提供以下特性：
- **嵌入式服务器**：将 OpenCode 核心作为 sidecar 进程嵌入
- **WSL 支持**：Windows 下支持 Windows Subsystem for Linux 路径转换
- **多通道**：支持 dev/beta/prod 三个发布通道
- **自动更新**：GitHub Releases 自动更新机制
- **原生集成**：系统通知、文件对话框、剪贴板图片等

---

## 二、目录结构

```
packages/desktop-electron/
├── src/                              # 源代码 (37 个文件)
│   ├── main/                         # 主进程 (14 个文件)
│   │   ├── index.ts                  # 入口文件 (320 行)
│   │   ├── windows.ts                # 窗口管理
│   │   ├── server.ts                 # 嵌入式服务器
│   │   ├── ipc.ts                    # IPC 通信
│   │   ├── menu.ts                   # 应用菜单
│   │   ├── store.ts                  # 持久化存储
│   │   ├── logging.ts                # 日志系统
│   │   ├── constants.ts              # 常量定义
│   │   ├── apps.ts                   # 外部应用检测
│   │   ├── migrate.ts                # 数据库迁移
│   │   ├── markdown.ts               # Markdown 解析
│   │   ├── shell-env.ts              # Shell 环境变量
│   │   ├── shell-env.test.ts         # Shell 环境测试
│   │   └── env.d.ts                  # 类型声明
│   ├── preload/                      # 预加载脚本 (2 个文件)
│   │   ├── index.ts                  # Context Bridge
│   │   └── types.ts                  # 类型定义
│   └── renderer/                     # 渲染器进程 (21 个文件)
│       ├── index.tsx                 # 渲染器入口
│       ├── index.html                # 主页面 HTML
│       ├── loading.html              # 加载页面 HTML
│       ├── loading.tsx               # 加载页面组件
│       ├── cli.ts                    # CLI 安装
│       ├── updater.ts                # 更新检查
│       ├── webview-zoom.ts           # 页面缩放
│       ├── styles.css                # 样式
│       ├── env.d.ts                  # 类型声明
│       ├── html.test.ts              # HTML 测试
│       └── i18n/                     # 国际化 (16 个文件)
│           ├── index.ts              # i18n 入口
│           ├── en.ts                 # 英文
│           ├── zh.ts                 # 简体中文
│           ├── zht.ts                # 繁体中文
│           ├── ja.ts                 # 日文
│           ├── ko.ts                 # 韩文
│           ├── es.ts                 # 西班牙文
│           ├── fr.ts                 # 法文
│           ├── de.ts                 # 德文
│           ├── ru.ts                 # 俄文
│           ├── ar.ts                 # 阿拉伯文
│           ├── br.ts                 # 葡萄牙文 (巴西)
│           ├── bs.ts                 # 波斯尼亚文
│           ├── da.ts                 # 丹麦文
│           ├── no.ts                 # 挪威文
│           └── pl.ts                 # 波兰文
├── icons/                            # 应用图标
│   ├── dev/                          # 开发通道图标
│   ├── beta/                         # 测试通道图标
│   └── prod/                         # 生产通道图标
├── scripts/                          # 构建脚本 (7 个文件)
│   ├── predev.ts                     # 开发前准备
│   ├── prebuild.ts                   # 构建前准备
│   ├── copy-bundles.ts               # 复制 bundle
│   ├── copy-icons.ts                 # 复制图标
│   ├── finalize-latest-yml.ts        # 更新元数据
│   ├── prepare.ts                    # 准备脚本
│   └── utils.ts                      # 工具函数
├── out/                              # 构建输出
├── resources/                        # 资源文件
├── electron.vite.config.ts           # Vite 配置
├── electron-builder.config.ts        # Electron Builder 配置
├── package.json                      # 包清单
├── tsconfig.json                     # TypeScript 配置
├── sst-env.d.ts                      # SST 环境声明
├── AGENTS.md                         # AI 代理规范
├── README.md                         # 说明文档
└── .gitignore                        # Git 忽略配置
```

---

## 三、架构设计

### 三进程架构

```
┌─────────────────────────────────────────────────────────┐
│                   主进程 (Main Process)                   │
│                                                         │
│  index.ts (入口)                                         │
│    ├── server.ts (嵌入式 OpenCode 服务器)                 │
│    ├── windows.ts (BrowserWindow 管理)                   │
│    ├── ipc.ts (IPC 处理器注册)                           │
│    ├── menu.ts (应用菜单)                                │
│    ├── store.ts (electron-store 持久化)                  │
│    └── logging.ts (electron-log 日志)                    │
└──────────────────┬──────────────────────────────────────┘
                   │ contextBridge / ipcRenderer
┌──────────────────▼──────────────────────────────────────┐
│                预加载脚本 (Preload)                       │
│                                                         │
│  index.ts ────► 暴露 window.api (ElectronAPI)            │
│  types.ts  ────► 类型定义                                 │
└──────────────────┬──────────────────────────────────────┘
                   │ contextBridge.exposeInMainWorld
┌──────────────────▼──────────────────────────────────────┐
│                渲染器进程 (Renderer)                      │
│                                                         │
│  index.tsx ────► SolidJS 应用 (@opencode-ai/app)         │
│  loading.tsx ──► 迁移加载页面                            │
│  updater.ts ───► 更新检查                                │
│  webview-zoom.ts ► 页面缩放控制                           │
│  cli.ts ───────► CLI 安装                                │
│  i18n/ ────────► 16 种语言翻译                           │
└─────────────────────────────────────────────────────────┘
```

### 启动流程

```
1. app.whenReady()
   │
2. setupApp()
   ├── 设置协议处理器 (opencode://)
   ├── 设置 Dock 图标 (macOS)
   └── 配置自动更新
   │
3. initialize()
   ├── 检查是否需要 SQLite 迁移
   ├── spawnLocalServer() ───► 启动嵌入式 OpenCode 服务器
   │     ├── 准备环境变量
   │     ├── import("virtual:opencode-server")
   │     └── Server.listen({hostname, port, password})
   │
   ├── 等待健康检查通过
   │
   ├── [需要迁移] 显示加载窗口
   │     └── createLoadingWindow()
   │
   └── 创建主窗口
         └── createMainWindow()
               └── 加载 index.html (SolidJS 应用)
```

---

## 四、核心模块分析

### 4.1 主进程入口 (index.ts)

**职责**：应用生命周期管理、sidecar 服务器管理、IPC 注册

**关键函数**：

| 函数 | 作用 |
|------|------|
| `setupApp()` | 应用初始化：单例锁、深度链接、信号处理 |
| `initialize()` | 启动嵌入式服务器并创建窗口 |
| `spawnLocalServer()` | 通过 `virtual:opencode-server` 导入并启动服务器 |
| `getSidecarPort()` | 获取可用端口（从环境变量或动态分配） |
| `killSidecar()` | 停止嵌入式服务器 |
| `setupAutoUpdater()` | 配置 electron-updater |
| `checkForUpdates()` | 检查并下载更新 |
| `installUpdate()` | 安装更新并重启 |

**深度链接支持**：
- 协议：`opencode://`
- 处理：`second-instance` 事件（Windows/Linux）、`open-url` 事件（macOS）

**单例模式**：
```typescript
if (!app.requestSingleInstanceLock()) {
  app.quit()
  return
}
```

### 4.2 窗口管理 (windows.ts)

**窗口类型**：

| 窗口 | 用途 | 尺寸 | 特性 |
|------|------|------|------|
| `createMainWindow()` | 主界面 | 1280x800 | 状态持久化、自定义标题栏 |
| `createLoadingWindow()` | 迁移加载 | 640x480 | 不可调整大小、居中显示 |

**平台适配**：

| 平台 | 标题栏样式 | 其他特性 |
|------|-----------|---------|
| macOS | `hidden` + 红绿灯位置 | Dock 图标自定义 |
| Windows | `hidden` + `titleBarOverlay` | 无边框窗口 |
| Linux | 默认 | - |

**窗口状态持久化**：使用 `electron-window-state` 保存位置/尺寸

### 4.3 嵌入式服务器 (server.ts)

**核心机制**：通过 Vite 虚拟模块 `virtual:opencode-server` 导入 OpenCode 核心

```typescript
const { Log, Server } = await import("virtual:opencode-server")
await Log.init({ level: "WARN" })
const listener = await Server.listen({
  port,
  hostname,
  username: "opencode",
  password,
})
```

**环境变量准备**：
```typescript
const env = {
  OPENCODE_EXPERIMENTAL_ICON_DISCOVERY: "true",
  OPENCODE_EXPERIMENTAL_FILEWATCHER: "true",
  OPENCODE_CLIENT: "desktop",
  OPENCODE_SERVER_USERNAME: "opencode",
  OPENCODE_SERVER_PASSWORD: password,
  XDG_STATE_HOME: app.getPath("userData"),
}
```

**健康检查**：轮询 `/global/health` 端点，超时 30 秒

### 4.4 IPC 通信 (ipc.ts)

**注册的 IPC 通道**（36 个）：

| IPC 通道 | 方向 | 用途 |
|----------|------|------|
| `kill-sidecar` | Renderer→Main | 停止服务器 |
| `await-initialization` | Renderer→Main | 等待初始化完成 |
| `get-default-server-url` | Renderer→Main | 获取默认服务器 URL |
| `set-default-server-url` | Renderer→Main | 设置默认服务器 URL |
| `get-wsl-config` | Renderer→Main | 获取 WSL 配置 |
| `set-wsl-config` | Renderer→Main | 设置 WSL 配置 |
| `parse-markdown` | Renderer→Main | Markdown 解析 |
| `check-app-exists` | Renderer→Main | 检查应用是否存在 |
| `wsl-path` | Renderer→Main | WSL 路径转换 |
| `resolve-app-path` | Renderer→Main | 解析应用路径 |
| `store-get/set/delete/clear/keys/length` | Renderer→Main | 持久化存储操作 |
| `open-directory-picker` | Renderer→Main | 目录选择对话框 |
| `open-file-picker` | Renderer→Main | 文件选择对话框 |
| `save-file-picker` | Renderer→Main | 文件保存对话框 |
| `open-link` | Renderer→Main | 打开外部链接 |
| `open-path` | Renderer→Main | 打开文件/路径 |
| `read-clipboard-image` | Renderer→Main | 读取剪贴板图片 |
| `show-notification` | Renderer→Main | 显示系统通知 |
| `get-window-focused` | Renderer→Main | 获取窗口焦点状态 |
| `set-window-focus` | Renderer→Main | 设置窗口焦点 |
| `show-window` | Renderer→Main | 显示窗口 |
| `relaunch` | Renderer→Main | 重启应用 |
| `get-zoom-factor` | Renderer→Main | 获取缩放比例 |
| `set-zoom-factor` | Renderer→Main | 设置缩放比例 |
| `set-titlebar` | Renderer→Main | 设置标题栏主题 |
| `run-updater` | Renderer→Main | 运行更新检查 |
| `check-update` | Renderer→Main | 检查更新 |
| `install-update` | Renderer→Main | 安装更新 |
| `set-background-color` | Renderer→Main | 设置背景色 |

**Main→Renderer 事件**（4 个）：

| 事件 | 用途 |
|------|------|
| `init-step` | 初始化步骤更新 |
| `sqlite-migration-progress` | SQLite 迁移进度 |
| `menu-command` | 菜单命令 |
| `deep-link` | 深度链接 |

### 4.5 应用菜单 (menu.ts)

**macOS 专属**（仅在 `process.platform === "darwin"` 时创建）

**菜单结构**：

| 菜单项 | 快捷键 | 动作 |
|--------|--------|------|
| **OpenCode** | | |
| ├ About | | 关于 |
| ├ Check for Updates... | | 检查更新 |
| ├ Reload Webview | | 重载页面 |
| └ Restart | | 重启应用 |
| **File** | | |
| ├ New Session | Shift+Cmd+S | 新建会话 |
| ├ Open Project... | Cmd+O | 打开项目 |
| └ New Window | Cmd+Shift+N | 新建窗口 |
| **View** | | |
| ├ Toggle Sidebar | Cmd+B | 切换侧边栏 |
| ├ Toggle Terminal | Ctrl+` | 切换终端 |
| └ Toggle File Tree | | 切换文件树 |
| **Go** | | |
| ├ Back | Cmd+[ | 后退 |
| ├ Forward | Cmd+] | 前进 |
| ├ Previous Session | Option+Up | 上一个会话 |
| ├ Next Session | Option+Down | 下一个会话 |
| ├ Previous Project | Cmd+Option+Up | 上一个项目 |
| └ Next Project | Cmd+Option+Down | 下一个项目 |
| **Help** | | |
| ├ OpenCode Documentation | | 打开文档 |
| └ Support Forum | | 打开 Discord |

### 4.6 持久化存储 (store.ts)

**技术**：`electron-store`

**默认存储**：`opencode.settings`

**API**：通过 IPC 暴露 6 个方法：
- `storeGet(name, key)` - 获取值
- `storeSet(name, key, value)` - 设置值
- `storeDelete(name, key)` - 删除键
- `storeClear(name)` - 清空存储
- `storeKeys(name)` - 获取所有键
- `storeLength(name)` - 获取键数量

### 4.7 日志系统 (logging.ts)

**技术**：`electron-log/main.js`

**特性**：
- 最大日志文件大小：5 MB
- 自动清理：删除 7 天前的日志
- `tail()` 函数：返回最后 1000 行日志

### 4.8 常量定义 (constants.ts)

| 常量 | 值 | 用途 |
|------|------|------|
| `CHANNEL` | `dev`/`beta`/`prod` | 发布通道（从环境变量读取） |
| `SETTINGS_STORE` | `"opencode.settings"` | 存储名称 |
| `DEFAULT_SERVER_URL_KEY` | `"defaultServerUrl"` | 默认服务器 URL 键 |
| `WSL_ENABLED_KEY` | `"wslEnabled"` | WSL 启用状态键 |
| `UPDATER_ENABLED` | `app.isPackaged && CHANNEL !== "dev"` | 更新器是否启用 |

### 4.9 WSL 支持

**类型定义**：
```typescript
export type WslConfig = { enabled: boolean }
```

**功能**：
- Windows 下检测并转换 Linux/Windows 路径
- 通过 `wslPath(path, mode)` 进行路径转换
- 状态持久化到 `electron-store`

---

## 五、渲染器进程分析

### 5.1 渲染器入口 (index.tsx)

**技术栈**：SolidJS + MemoryRouter

**平台抽象层** (`createPlatform()`)：

| 方法 | 用途 |
|------|------|
| `openDirectoryPickerDialog()` | 目录选择（通过 Electron API） |
| `openFilePickerDialog()` | 文件选择（通过 Electron API） |
| `saveFilePickerDialog()` | 文件保存（通过 Electron API） |
| `openLink()` | 打开外部链接 |
| `openPath()` | 打开本地路径（支持 WSL 路径转换） |
| `storage()` | 持久化存储（通过 electron-store） |
| `checkUpdate()` | 检查更新 |
| `update()` | 安装更新 |
| `restart()` | 重启应用（先杀 sidecar） |
| `notify()` | 系统通知 |
| `getWslEnabled()`/`setWslEnabled()` | WSL 开关 |
| `getDefaultServer()`/`setDefaultServer()` | 默认服务器配置 |
| `parseMarkdown()` | Markdown 解析 |
| `readClipboardImage()` | 剪贴板图片读取 |

### 5.2 国际化 (i18n/)

**支持语言**（16 种）：

| 代码 | 语言 | 代码 | 语言 |
|------|------|------|------|
| `en` | 英文 | `zh` | 简体中文 |
| `zht` | 繁体中文 | `ja` | 日文 |
| `ko` | 韩文 | `es` | 西班牙文 |
| `fr` | 法文 | `de` | 德文 |
| `ru` | 俄文 | `ar` | 阿拉伯文 |
| `br` | 葡萄牙文（巴西） | `bs` | 波斯尼亚文 |
| `da` | 丹麦文 | `no` | 挪威文 |
| `pl` | 波兰文 | | |

### 5.3 页面缩放 (webview-zoom.ts)

**快捷键**：
- macOS: `Cmd + -/=`, `Cmd + 0`
- Windows/Linux: `Ctrl + -/=`, `Ctrl + 0`

**缩放范围**：0.2x - 10x，步长 0.2

### 5.4 更新检查 (updater.ts)

**渲染器端**：
```typescript
export const UPDATER_ENABLED = () => window.__OPENCODE__?.updaterEnabled ?? false

export async function runUpdater({ alertOnFail }: { alertOnFail: boolean }) {
  await window.api.runUpdater(alertOnFail)
}
```

---

## 六、构建配置

### 6.1 Vite 配置 (electron.vite.config.ts)

**三配置块**：

| 配置块 | 入口 | 特性 |
|--------|------|------|
| `main` | `src/main/index.ts` | 虚拟模块解析、WASM 复制、node-pty 外部化 |
| `preload` | `src/preload/index.ts` | - |
| `renderer` | `src/renderer/index.html` | 使用 `@opencode-ai/app/vite` 插件 |

**关键插件**：

| 插件名 | 作用 |
|--------|------|
| `opencode:node-pty-narrower` | 将 `@lydell/node-pty` 重定向到平台特定包 |
| `opencode:virtual-server-module` | 解析 `virtual:opencode-server` 到 `../opencode/dist/node/node.js` |
| `opencode:copy-server-assets` | 复制 `.wasm` 文件到 `out/main/chunks/` |

### 6.2 Electron Builder 配置 (electron-builder.config.ts)

**三通道配置**：

| 通道 | App ID | 产品名称 | 更新源 |
|------|--------|---------|--------|
| `dev` | `ai.opencode.desktop.dev` | OpenCode Dev | 无 |
| `beta` | `ai.opencode.desktop.beta` | OpenCode Beta | GitHub (anomalyco/opencode-beta) |
| `prod` | `ai.opencode.desktop` | OpenCode | GitHub (anomalyco/opencode) |

**构建目标**：

| 平台 | 格式 | 说明 |
|------|------|------|
| macOS | DMG + ZIP | 公证、硬运行时、权限 |
| Windows | NSIS | 代码签名、可选择安装路径 |
| Linux | AppImage + DEB + RPM | 多发行版支持 |

**产物命名**：`opencode-electron-${os}-${arch}.${ext}`

**额外资源**：
```typescript
extraResources: [
  {
    from: "native/",
    to: "native/",
    filter: ["index.js", "index.d.ts", "build/Release/mac_window.node", "swift-build/**"],
  },
]
```

---

## 七、发布通道管理

### 环境变量

| 变量 | 用途 |
|------|------|
| `OPENCODE_CHANNEL` | 设置发布通道（`dev`/`beta`/`prod`） |
| `OPENCODE_PORT` | 指定 sidecar 端口（可选） |

### 通道切换流程

```
1. 设置环境变量 OPENCODE_CHANNEL=beta
2. 运行 prebuild.ts 脚本
   ├── 复制 icons/beta/ 到 resources/icons/
   └── 复制 app/dist 到渲染器输出目录
3. 运行 electron-builder
   ├── 读取 beta 配置（App ID、产品名称、GitHub 仓库）
   └── 构建并发布到 GitHub Releases
```

---

## 八、与 Tauri 版本对比

| 特性 | desktop-electron | desktop (Tauri) |
|------|------------------|-----------------|
| **技术栈** | Electron 40.4.1 | Tauri 2.x + Rust |
| **架构** | 三进程（main/preload/renderer） | 双进程（Rust 后端/Webview） |
| **嵌入式服务器** | ✅ 通过 virtual module 导入 | ❌ 使用独立 sidecar 可执行文件 |
| **打包体积** | 较大（~150MB+） | 较小（~10MB） |
| **WSL 支持** | ✅ 完整支持路径转换 | ❌ 无 |
| **自动更新** | electron-updater + GitHub | Tauri updater + GitHub |
| **构建工具** | electron-vite + electron-builder | tauri-cli + cargo |
| **内存占用** | 较高（Chromium + Node.js） | 较低（系统 Webview） |
| **开发体验** | Vite HMR、DevTools | Rust 编译较慢 |
| **跨平台** | Windows/macOS/Linux | Windows/macOS/Linux |

---

## 九、依赖项

### 核心依赖

| 包 | 版本 | 用途 |
|------|------|------|
| `electron` | 40.4.1 | Electron 运行时 |
| `electron-builder` | ^26 | 打包工具 |
| `electron-vite` | ^5 | Vite 集成 |
| `electron-store` | ^10 | 持久化存储 |
| `electron-log` | ^5 | 日志系统 |
| `electron-updater` | ^6 | 自动更新 |
| `electron-context-menu` | 4.1.2 | 右键菜单 |
| `electron-window-state` | ^5.0.3 | 窗口状态持久化 |
| `marked` | ^15 | Markdown 解析 |

### 工作区依赖

| 包 | 用途 |
|------|------|
| `@opencode-ai/app` | Web 应用（SolidJS） |
| `@opencode-ai/ui` | UI 组件库 |
| `effect` | 效果系统 |
| `@lydell/node-pty` | 终端模拟器 |

### 可选依赖（node-pty 平台包）

| 包 | 平台 |
|------|------|
| `@lydell/node-pty-darwin-arm64` | macOS ARM64 |
| `@lydell/node-pty-darwin-x64` | macOS x64 |
| `@lydell/node-pty-linux-arm64` | Linux ARM64 |
| `@lydell/node-pty-linux-x64` | Linux x64 |
| `@lydell/node-pty-win32-arm64` | Windows ARM64 |
| `@lydell/node-pty-win32-x64` | Windows x64 |

---

## 十、开发命令

| 命令 | 说明 |
|------|------|
| `bun dev` | 启动开发模式（electron-vite dev） |
| `bun build` | 构建生产版本（electron-vite build） |
| `bun preview` | 预览构建结果（electron-vite preview） |
| `bun package` | 打包所有平台（electron-builder） |
| `bun package:mac` | 仅打包 macOS |
| `bun package:win` | 仅打包 Windows |
| `bun package:linux` | 仅打包 Linux |
| `bun native:build` | 构建原生模块 |
| `bun typecheck` | 类型检查（tsgo -B） |

---

## 十一、文件统计

| 类别 | 数量 |
|------|------|
| 主进程源码 | 14 个（.ts） |
| 预加载脚本 | 2 个（.ts） |
| 渲染器进程 | 21 个（.tsx/.ts/.html/.css） |
| 国际化文件 | 16 个（15 种语言 + 1 个入口） |
| 构建脚本 | 7 个（.ts） |
| 配置文件 | 4 个（electron-vite、electron-builder、package.json、tsconfig.json） |
| 文档 | 3 个（AGENTS.md、README.md、icons/README.md） |
| **总计** | **67 个** |

---

*本文档由 AI 自动生成，基于对 OpenCode 项目源码的完整分析。*

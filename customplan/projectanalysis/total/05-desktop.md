# OpenCode 桌面应用包 (desktop) 详细分析

## 一、包概览

**包名**: `@opencode-ai/desktop`  
**路径**: `packages/desktop`  
**功能**: 使用 Tauri 打包为桌面应用

### 技术栈

| 技术 | 用途 |
|------|------|
| Tauri 2.x | 桌面应用框架 |
| Rust | 系统级后端 |
| SolidJS | 前端框架 (继承自 app) |
| Vite 7 | 构建工具 |
| @tauri-apps/api | Tauri JS API |
| @tauri-apps/plugin-* | Tauri 插件 |

---

## 二、完整目录结构

```
packages/desktop/
├── .gitignore
├── AGENTS.md
├── index.html
├── package.json
├── README.md
├── sst-env.d.ts
├── tsconfig.json
├── vite.config.ts
│
├── scripts/                                          # 5 个构建脚本
│   ├── copy-bundles.ts
│   ├── finalize-latest-json.ts
│   ├── predev.ts
│   ├── prepare.ts
│   └── utils.ts
│
├── src/                                              # 前端源码
│   ├── bindings.ts
│   ├── cli.ts
│   ├── entry.tsx
│   ├── index.tsx
│   ├── loading.tsx
│   ├── menu.ts
│   ├── styles.css
│   ├── updater.ts
│   ├── webview-zoom.ts
│   └── i18n/                                         # 17 种语言
│       ├── ar.ts
│       ├── br.ts
│       ├── bs.ts
│       ├── da.ts
│       ├── de.ts
│       ├── en.ts
│       ├── es.ts
│       ├── fr.ts
│       ├── index.ts
│       ├── ja.ts
│       ├── ko.ts
│       ├── no.ts
│       ├── pl.ts
│       ├── ru.ts
│       ├── zh.ts
│       └── zht.ts
│
└── src-tauri/                                        # Tauri/Rust 后端
    ├── .gitignore
    ├── build.rs
    ├── Cargo.lock
    ├── Cargo.toml
    ├── entitlements.plist
    ├── tauri.beta.conf.json
    ├── tauri.conf.json
    ├── tauri.prod.conf.json
    │
    ├── assets/
    │   ├── nsis-header.bmp
    │   └── nsis-sidebar.bmp
    │
    ├── capabilities/
    │   └── default.json
    │
    ├── icons/
    │   ├── README.md
    │   ├── beta/                                     # Beta 版图标
    │   │   ├── 128x128.png
    │   │   ├── 128x128@2x.png
    │   │   ├── 32x32.png
    │   │   ├── 64x64.png
    │   │   ├── icon.icns
    │   │   ├── icon.ico
    │   │   ├── icon.png
    │   │   ├── Square107x107Logo.png
    │   │   ├── Square142x142Logo.png
    │   │   ├── Square150x150Logo.png
    │   │   ├── Square284x284Logo.png
    │   │   ├── Square30x30Logo.png
    │   │   ├── Square310x310Logo.png
    │   │   ├── Square44x44Logo.png
    │   │   ├── Square71x71Logo.png
    │   │   ├── Square89x89Logo.png
    │   │   ├── StoreLogo.png
    │   │   ├── android/
    │   │   │   ├── mipmap-anydpi-v26/ic_launcher.xml
    │   │   │   ├── mipmap-hdpi/ (ic_launcher.png, ic_launcher_foreground.png, ic_launcher_round.png)
    │   │   │   ├── mipmap-mdpi/ (ic_launcher.png, ic_launcher_foreground.png, ic_launcher_round.png)
    │   │   │   ├── mipmap-xhdpi/ (ic_launcher.png, ic_launcher_foreground.png, ic_launcher_round.png)
    │   │   │   ├── mipmap-xxhdpi/ (ic_launcher.png, ic_launcher_foreground.png, ic_launcher_round.png)
    │   │   │   ├── mipmap-xxxhdpi/ (ic_launcher.png, ic_launcher_foreground.png, ic_launcher_round.png)
    │   │   │   └── values/ic_launcher_background.xml
    │   │   └── ios/
    │   │       ├── AppIcon-20x20@1x.png
    │   │       ├── AppIcon-20x20@2x.png
    │   │       ├── AppIcon-20x20@2x-1.png
    │   │       ├── AppIcon-20x20@3x.png
    │   │       ├── AppIcon-29x29@1x.png
    │   │       ├── AppIcon-29x29@2x.png
    │   │       ├── AppIcon-29x29@2x-1.png
    │   │       ├── AppIcon-29x29@3x.png
    │   │       ├── AppIcon-40x40@1x.png
    │   │       ├── AppIcon-40x40@2x.png
    │   │       ├── AppIcon-40x40@2x-1.png
    │   │       ├── AppIcon-40x40@3x.png
    │   │       ├── AppIcon-512@2x.png
    │   │       ├── AppIcon-60x60@2x.png
    │   │       ├── AppIcon-60x60@3x.png
    │   │       ├── AppIcon-76x76@1x.png
    │   │       ├── AppIcon-76x76@2x.png
    │   │       └── AppIcon-83.5x83.5@2x.png
    │   │
    │   ├── dev/                                      # Dev 版图标 (结构与 beta 相同)
    │   │   └── [同 beta 目录结构]
    │   │
    │   └── prod/                                     # Prod 版图标 (结构与 beta 相同)
    │       └── [同 beta 目录结构]
    │
    ├── release/
    │   └── appstream.metainfo.xml
    │
    └── src/                                          # Rust 源码 (13 个文件)
        ├── cli.rs
        ├── constants.rs
        ├── lib.rs
        ├── linux_display.rs
        ├── linux_windowing.rs
        ├── logging.rs
        ├── main.rs
        ├── markdown.rs
        ├── server.rs
        ├── window_customizer.rs
        ├── windows.rs
        └── os/
            ├── mod.rs
            └── windows.rs
```

### 统计信息

| 类别 | 数量 |
|------|------|
| 根文件 | 8 个 (.gitignore, AGENTS.md, index.html, package.json, README.md, sst-env.d.ts, tsconfig.json, vite.config.ts) |
| scripts/ | 5 个构建脚本 |
| src/ | 10 个前端文件 + 17 种语言 i18n |
| src-tauri/ | 7 个配置文件 |
| src-tauri/assets/ | 2 个 NSIS 位图 |
| src-tauri/capabilities/ | 1 个权限配置 |
| src-tauri/icons/beta/ | 19 个图标 + Android 5 目录 + iOS 17 图标 |
| src-tauri/icons/dev/ | 同 beta 结构 |
| src-tauri/icons/prod/ | 同 beta 结构 |
| src-tauri/release/ | 1 个 metainfo |
| src-tauri/src/ | 13 个 Rust 文件 |
| **总计** | **约 100+ 个文件** |

---

## 三、Tauri 架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri 架构                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   前端层 (Webview)                     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         SolidJS 应用 (继承自 app 包)           │   │
│  │                                             │   │
│  │  src/entry.tsx    → 应用入口                  │   │
│  │  src/index.tsx    → 主组件                    │   │
│  │  src/loading.tsx  → 加载界面                  │   │
│  │  src/menu.ts      → 菜单                      │   │
│  │  src/bindings.ts  → 类型绑定                  │   │
│  │  src/cli.ts       → CLI 桥接                  │   │
│  │  src/updater.ts   → 更新器                    │   │
│  │  src/webview-zoom.ts → Webview 缩放           │   │
│  │  src/styles.css   → 样式                      │   │
│  │  src/i18n/        → 17 种语言                 │   │
│  └─────────────────────────────────────────────┘   │
│                       │                             │
│                       │ JS API 调用                  │
│                       ▼                             │
│  ┌─────────────────────────────────────────────┐   │
│  │          @tauri-apps/api (JS 端)              │   │
│  │                                             │   │
│  │  - 文件系统                                  │   │
│  │  - 对话框                                    │   │
│  │  - 通知                                      │   │
│  │  - 剪贴板                                    │   │
│  │  - IPC 通信                                  │   │
│  └─────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │ IPC 通道
                        ▼
┌─────────────────────────────────────────────────────┐
│                   后端层 (Rust)                        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │        Tauri Core (Rust 运行时)               │   │
│  │                                             │   │
│  │  src/main.rs            → Rust 主入口         │   │
│  │  src/lib.rs             → 库文件              │   │
│  │  src/server.rs          → 服务器管理           │   │
│  │  src/cli.rs             → CLI 处理             │   │
│  │  src/windows.rs         → 窗口管理             │   │
│  │  src/window_customizer.rs → 窗口定制           │   │
│  │  src/markdown.rs        → Markdown 处理        │   │
│  │  src/logging.rs         → 日志系统             │   │
│  │  src/constants.rs       → 常量定义             │   │
│  │  src/linux_display.rs   → Linux 显示          │   │
│  │  src/linux_windowing.rs → Linux 窗口          │   │
│  │  src/os/mod.rs          → OS 抽象              │   │
│  │  src/os/windows.rs      → Windows 特定         │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 3.2 通信流程

```
┌─────────────────────────────────────────────────────────┐
│                  IPC 通信流程                             │
└─────────────────────────────────────────────────────────┘

前端 (JS/TS)                      后端 (Rust)
    │                                  │
    │  invoke('command_name', {args})  │
    ├─────────────────────────────────>│
    │                                  │
    │                                  │ main.rs 处理命令
    │                                  │
    │      Promise<T> (返回值)         │
    │<─────────────────────────────────┤
    │                                  │
    │                                  │
    │  emit('event_name', payload)     │
    │  (发送事件到后端)                 │
    ├─────────────────────────────────>│
    │                                  │
    │                                  │
    │  listen('event_name', callback)  │
    │  (监听后端事件)                   │
    │<─────────────────────────────────┤
    │                                  │
```

---

## 四、Tauri 配置

### 4.1 三个配置文件

| 文件 | 用途 |
|------|------|
| `tauri.conf.json` | 基础配置 |
| `tauri.beta.conf.json` | Beta 版配置 (测试通道) |
| `tauri.prod.conf.json` | 生产版配置 |

### 4.2 主要配置项

```json
{
  "productName": "OpenCode",
  "version": "1.4.3",
  "identifier": "ai.opencode.desktop",
  
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:3000"
  },
  
  "app": {
    "windows": [
      {
        "title": "OpenCode",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; ..."
    }
  },
  
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "appimage"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.ico"
    ]
  },
  
  "plugins": {}
}
```

### 4.3 权限配置 (capabilities/default.json)

定义 Tauri 应用可使用的系统权限。

---

## 五、Rust 后端 (src-tauri/src/)

### 5.1 Rust 文件完整列表 (13 个)

| 文件 | 作用 |
|------|------|
| `main.rs` | Rust 主入口，应用启动 |
| `lib.rs` | 库文件，模块导出 |
| `server.rs` | 内部服务器管理 |
| `cli.rs` | CLI 命令处理 |
| `windows.rs` | 窗口管理 |
| `window_customizer.rs` | 窗口定制化 |
| `markdown.rs` | Markdown 渲染处理 |
| `logging.rs` | 日志系统 |
| `constants.rs` | 常量定义 |
| `linux_display.rs` | Linux 显示适配 |
| `linux_windowing.rs` | Linux 窗口适配 |
| `os/mod.rs` | OS 抽象模块 |
| `os/windows.rs` | Windows 特定实现 |

### 5.2 主入口 (main.rs)

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // 初始化逻辑
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 注册自定义命令
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 5.3 关键函数

| 函数 | 文件 | 作用 |
|------|------|------|
| `main()` | main.rs | 应用入口 |
| `tauri::Builder::default()` | main.rs | 创建构建器 |
| `.plugin()` | main.rs | 注册插件 |
| `.setup()` | main.rs | 初始化回调 |
| `.invoke_handler()` | main.rs | 注册自定义命令 |
| `.run()` | main.rs | 运行应用 |

---

## 六、Tauri 插件

### 6.1 使用的插件

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri 插件列表                         │
└─────────────────────────────────────────────────────────┘

@tauri-apps/plugin-*
  │
  ├─ clipboard-manager   → 剪贴板管理
  ├─ dialog              → 文件对话框
  ├─ notification        → 系统通知
  ├─ shell               → Shell 命令执行
  ├─ fs                  → 文件系统
  ├─ os                  → 操作系统信息
  ├─ process             → 进程管理
  ├─ updater             → 应用更新
```

### 6.2 前端调用示例

```typescript
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"

// 调用对话框
const file = await open({
  multiple: false,
  filters: [{ name: "JSON", extensions: ["json"] }]
})

// 写入剪贴板
await writeText("Hello World")

// 调用自定义命令
const result = await invoke("custom_command", { arg1: "hello", arg2: 42 })
```

---

## 七、构建流程

### 7.1 Scripts 构建脚本 (5 个)

| 文件 | 作用 |
|------|------|
| `copy-bundles.ts` | 复制打包产物 |
| `finalize-latest.json.ts` | 生成 latest.json |
| `predev.ts` | 开发前预处理 |
| `prepare.ts` | 准备构建 |
| `utils.ts` | 构建工具函数 |

### 7.2 开发模式

```bash
bun run --cwd packages/desktop tauri dev
```

#### 开发流程

```
1. 启动 Vite 开发服务器 → http://localhost:3000
2. Tauri 加载开发 URL → Webview 指向 localhost:3000
3. 热模块替换 (HMR) → 代码变更自动刷新
4. Rust 代码变更 → 自动重新编译
```

### 7.3 生产构建

```bash
bun run --cwd packages/desktop tauri build
```

#### 构建流程

```
1. 构建前端应用 → Vite 生产构建 → dist/ 目录
2. 编译 Rust 后端 → Cargo 编译 → 可执行文件
3. 打包应用 → 根据 target 打包
   ├─ Windows: .msi / .exe
   ├─ macOS: .dmg / .app
   └─ Linux: .deb / .AppImage
4. 签名 (可选) → 应用签名
```

---

## 八、应用图标

### 8.1 图标规格

```
┌─────────────────────────────────────────────────────────┐
│                    应用图标规格                            │
└─────────────────────────────────────────────────────────┘

src-tauri/icons/
  │
  ├─ beta/     → Beta 版图标
  ├─ dev/      → 开发版图标
  └─ prod/     → 生产版图标
      │
      ├─ 桌面图标
      │   ├─ 32x32.png, 64x64.png
      │   ├─ 128x128.png, 128x128@2x.png
      │   ├─ icon.icns (macOS)
      │   └─ icon.ico (Windows)
      │
      ├─ Windows 商店图标
      │   ├─ Square30x30Logo.png
      │   ├─ Square44x44Logo.png
      │   ├─ Square71x71Logo.png
      │   ├─ Square89x89Logo.png
      │   ├─ Square107x107Logo.png
      │   ├─ Square142x142Logo.png
      │   ├─ Square150x150Logo.png
      │   ├─ Square284x284Logo.png
      │   ├─ Square310x310Logo.png
      │   └─ StoreLogo.png
      │
      ├─ Android 图标
      │   ├─ mipmap-mdpi/ (48x48)
      │   ├─ mipmap-hdpi/ (72x72)
      │   ├─ mipmap-xhdpi/ (96x96)
      │   ├─ mipmap-xxhdpi/ (144x144)
      │   └─ mipmap-xxxhdpi/ (192x192)
      │
      └─ iOS 图标
          ├─ AppIcon-20x20@1x.png ~ @3x.png
          ├─ AppIcon-29x29@1x.png ~ @3x.png
          ├─ AppIcon-40x40@1x.png ~ @3x.png
          ├─ AppIcon-60x60@2x.png, @3x.png
          ├─ AppIcon-76x76@1x.png, @2x.png
          ├─ AppIcon-83.5x83.5@2x.png
          └─ AppIcon-512@2x.png
```

---

## 九、应用更新

### 9.1 更新机制

```
┌─────────────────────────────────────────────────────────┐
│                    应用更新流程                            │
└─────────────────────────────────────────────────────────┘

1. 检查更新 → 定期轮询更新服务器
2. 发现新版本 → 显示更新提示
3. 下载更新 → 下载更新包
4. 安装更新 → 重启应用并应用更新
```

### 9.2 前端实现

```typescript
import { check } from "@tauri-apps/plugin-updater"

async function checkForUpdates() {
  const update = await check()
  if (update) {
    const confirmed = await confirm(
      `新版本 ${update.version} 可用，是否更新？`
    )
    if (confirmed) {
      await update.downloadAndInstall()
    }
  }
}
```

### 9.3 更新模块 (src/updater.ts)

| 函数 | 作用 |
|------|------|
| `checkForUpdates()` | 检查更新 |
| `downloadAndInstall()` | 下载并安装 |

---

## 十、安全配置

### 10.1 CSP (内容安全策略)

```
default-src 'self'
script-src 'self'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
connect-src 'self' http://localhost:* ws://localhost:*
```

---

## 十一、平台适配

### 11.1 Windows

```
┌─────────────────────────────────────────────────────────┐
│                    Windows 适配                           │
└─────────────────────────────────────────────────────────┘

- 安装包格式: .msi / .exe
- NSIS 安装器: nsis-header.bmp, nsis-sidebar.bmp
- 图标: .ico
- 系统通知: Windows Toast
- 特定实现: src/os/windows.rs, src/windows.rs
```

### 11.2 macOS

```
┌─────────────────────────────────────────────────────────┐
│                    macOS 适配                             │
└─────────────────────────────────────────────────────────┘

- 安装包格式: .dmg
- 应用图标: .icns
- 系统通知: NSUserNotification
- 触控栏: 支持 (可选)
- 沙盒: 支持 (可选)
- 权限: entitlements.plist
```

### 11.3 Linux

```
┌─────────────────────────────────────────────────────────┐
│                    Linux 适配                             │
└─────────────────────────────────────────────────────────┘

- 安装包格式: .deb / .AppImage
- 图标: .png
- 系统通知: libnotify
- 桌面集成: 支持
- 显示适配: src/linux_display.rs
- 窗口适配: src/linux_windowing.rs
```

---

## 十二、前端源码 (src/)

### 12.1 文件完整列表 (10 个 + i18n 17 个)

| 文件 | 作用 |
|------|------|
| `entry.tsx` | 应用入口 |
| `index.tsx` | 主组件 |
| `loading.tsx` | 加载界面 |
| `menu.ts` | 菜单定义 |
| `bindings.ts` | 类型绑定 |
| `cli.ts` | CLI 桥接 |
| `updater.ts` | 更新器 |
| `webview-zoom.ts` | Webview 缩放 |
| `styles.css` | 样式 |
| `i18n/index.ts` | i18n 入口 |
| `i18n/ar.ts` ~ `i18n/zht.ts` | 17 种语言翻译 |

---

## 十三、架构总结

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop 架构                            │
├─────────────────────────────────────────────────────────┤
│                   用户界面层                               │
│  entry.tsx │ index.tsx │ loading.tsx │ menu.ts           │
│  bindings.ts │ cli.ts │ updater.ts │ webview-zoom.ts     │
│  i18n/ (17 种语言)                                       │
├─────────────────────────────────────────────────────────┤
│                   Tauri JS API 层                         │
│  clipboard │ dialog │ notification │ shell │ fs │ os     │
├─────────────────────────────────────────────────────────┤
│                   IPC 通信层                               │
│  invoke / emit / listen                                  │
├─────────────────────────────────────────────────────────┤
│                   Tauri Core (Rust)                       │
│  main.rs │ lib.rs │ server.rs │ cli.rs │ windows.rs     │
│  window_customizer.rs │ markdown.rs │ logging.rs         │
│  constants.rs │ linux_display.rs │ linux_windowing.rs   │
│  os/mod.rs │ os/windows.rs                               │
├─────────────────────────────────────────────────────────┤
│                   构建脚本                                 │
│  copy-bundles.ts │ finalize-latest-json.ts               │
│  predev.ts │ prepare.ts │ utils.ts                       │
├─────────────────────────────────────────────────────────┤
│                   配置文件                                 │
│  tauri.conf.json │ tauri.beta.conf.json                  │
│  tauri.prod.conf.json │ capabilities/default.json        │
├─────────────────────────────────────────────────────────┤
│                   应用图标                                 │
│  beta/ (19+5+17) │ dev/ │ prod/                           │
├─────────────────────────────────────────────────────────┤
│                   操作系统层                               │
│  Windows │ macOS │ Linux                                 │
└─────────────────────────────────────────────────────────┘
```

### 设计亮点

1. **Tauri 架构**: 轻量级桌面框架，比 Electron 更小
2. **Rust 后端**: 高性能系统级操作 (13 个 Rust 文件)
3. **前端复用**: 直接继承 app 包，无需重复开发
4. **多平台支持**: Windows/macOS/Linux 统一代码
5. **安全设计**: CSP + 沙盒 + 权限控制
6. **自动更新**: 内置应用更新机制
7. **原生集成**: 系统通知、剪贴板、文件对话框
8. **多版本支持**: beta/dev/prod 三个配置
9. **完整图标集**: 三套图标 (beta/dev/prod) + Android + iOS

---

## 十四、开发命令

| 命令 | 说明 |
|------|------|
| `bun run --cwd packages/desktop tauri dev` | 启动开发模式 |
| `bun run --cwd packages/desktop tauri build` | 生产构建 |
| `bunx tauri icon` | 生成应用图标 |
| `bunx tauri info` | 查看 Tauri 信息 |

---

## 十五、依赖关系

```
desktop
  │
  ├─ @tauri-apps/api        → Tauri JS API
  ├─ @tauri-apps/cli        → Tauri CLI 工具
  ├─ @tauri-apps/plugin-*   → Tauri 插件
  │
  ├─ @opencode-ai/app       → 继承 Web 应用
  │   │
  │   ├─ @opencode-ai/ui    → UI 组件库
  │   └─ @opencode-ai/sdk   → JavaScript SDK
```

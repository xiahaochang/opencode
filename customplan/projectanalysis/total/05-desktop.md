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

## 二、目录结构

```
packages/desktop/
├── src/                         # 前端源码 (继承自 app)
│   └── ...
│
├── src-tauri/                   # Tauri/Rust 后端
│   ├── Cargo.toml               # Rust 依赖
│   ├── Cargo.lock               # 依赖锁定文件
│   ├── build.rs                 # 构建脚本
│   ├── tauri.conf.json          # Tauri 配置
│   ├── icons/                   # 应用图标
│   │   └── ...
│   └── src/                     # Rust 源码
│       ├── main.rs              # 主入口
│       ├── lib.rs               # 库文件
│       └── ...
│
├── scripts/                     # 构建脚本
├── index.html                   # HTML 入口
├── vite.config.ts               # Vite 配置
├── package.json                 # 包配置
└── README.md                    # 文档
```

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
│  │            SolidJS 应用 (app 包)              │   │
│  │                                             │   │
│  │  - 路由系统                                  │   │
│  │  - 组件渲染                                  │   │
│  │  - 状态管理                                  │   │
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
│  │  - Webview 管理                              │   │
│  │  - 事件循环                                  │   │
│  │  - 系统调用                                  │   │
│  └─────────────────────────────────────────────┘   │
│                       │                             │
│                       │ Rust 函数调用                │
│                       ▼                             │
│  ┌─────────────────────────────────────────────┐   │
│  │          自定义 Rust 命令                     │   │
│  │                                             │   │
│  │  - 系统级操作                                │   │
│  │  - 性能敏感操作                              │   │
│  │  - 原生集成                                  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 3.2 通信流程

```
┌─────────────────────────────────────────────────────────┐
│                  IPC 通信流程                             │
└─────────────────────────────────────────────────────────┘

前端 (JS)                          后端 (Rust)
    │                                  │
    │  invoke('command_name', {args})  │
    ├─────────────────────────────────>│
    │                                  │
    │                                  │ 处理命令
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

## 四、Tauri 配置 (src-tauri/tauri.conf.json)

### 4.1 主要配置项

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
  
  "plugins": {
    // 插件配置
  }
}
```

### 4.2 配置说明

| 配置项 | 说明 |
|--------|------|
| `productName` | 应用名称 |
| `identifier` | 应用唯一标识符 |
| `build.frontendDist` | 前端构建产物路径 |
| `build.devUrl` | 开发模式前端 URL |
| `app.windows` | 窗口配置 |
| `app.security.csp` | 内容安全策略 |
| `bundle.targets` | 打包目标格式 |

---

## 五、Rust 后端 (src-tauri/src/)

### 5.1 主入口 (main.rs)

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        // ... 更多插件
        .setup(|app| {
            // 初始化逻辑
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 注册自定义命令
            custom_command_1,
            custom_command_2,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 5.2 自定义命令示例

```rust
#[tauri::command]
fn custom_command_1(arg1: String, arg2: i32) -> Result<String, String> {
    // 处理逻辑
    Ok(format!("Received: {}, {}", arg1, arg2))
}

#[tauri::command]
async fn custom_command_2(app: tauri::AppHandle) -> Result<(), String> {
    // 异步操作
    Ok(())
}
```

### 5.3 关键函数

| 函数 | 作用 |
|------|------|
| `main()` | 应用入口 |
| `tauri::Builder::default()` | 创建构建器 |
| `.plugin()` | 注册插件 |
| `.setup()` | 初始化回调 |
| `.invoke_handler()` | 注册自定义命令 |
| `.run()` | 运行应用 |

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
  └─ ... (更多插件)
```

### 6.2 插件使用示例

#### 前端调用 (JS)

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
const result = await invoke("custom_command_1", { arg1: "hello", arg2: 42 })
```

---

## 七、构建流程

### 7.1 开发模式

```bash
# 在 packages/desktop 目录下
bun run --cwd packages/desktop tauri dev
```

#### 开发流程

```
┌─────────────────────────────────────────────────────────┐
│                  开发模式流程                              │
└─────────────────────────────────────────────────────────┘

1. 启动 Vite 开发服务器
   └─ http://localhost:3000

2. Tauri 加载开发 URL
   └─ Webview 指向 localhost:3000

3. 热模块替换 (HMR)
   └─ 代码变更自动刷新

4. Rust 代码变更
   └─ 自动重新编译
```

### 7.2 生产构建

```bash
# 在 packages/desktop 目录下
bun run --cwd packages/desktop tauri build
```

#### 构建流程

```
┌─────────────────────────────────────────────────────────┐
│                  构建流程                                 │
└─────────────────────────────────────────────────────────┘

1. 构建前端应用
   └─ Vite 生产构建 → dist/ 目录

2. 编译 Rust 后端
   └─ Cargo 编译 → 可执行文件

3. 打包应用
   └─ 根据 target 打包
      ├─ Windows: .msi / .exe
      ├─ macOS: .dmg / .app
      └─ Linux: .deb / .AppImage

4. 签名 (可选)
   └─ 应用签名
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
  ├─ 32x32.png         → Windows 小图标
  ├─ 128x128.png       → macOS 中等图标
  ├─ 128x128@2x.png    → macOS 高分辨率图标
  ├─ icon.icns         → macOS 应用图标
  ├─ icon.ico          → Windows 应用图标
  └─ Square*.png       → Windows 应用商店图标
```

### 8.2 图标生成

```bash
# 使用 Tauri CLI 生成图标
bunx tauri icon path/to/source.png
```

---

## 九、应用更新

### 9.1 更新机制

```
┌─────────────────────────────────────────────────────────┐
│                    应用更新流程                            │
└─────────────────────────────────────────────────────────┘

1. 检查更新
   └─ 定期轮询更新服务器

2. 发现新版本
   └─ 显示更新提示

3. 下载更新
   └─ 下载更新包

4. 安装更新
   └─ 重启应用并应用更新
```

### 9.2 前端实现

```typescript
import { check } from "@tauri-apps/plugin-updater"

async function checkForUpdates() {
  const update = await check()
  if (update) {
    // 显示更新提示
    const confirmed = await confirm(
      `新版本 ${update.version} 可用，是否更新？`
    )
    if (confirmed) {
      await update.downloadAndInstall()
    }
  }
}
```

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

### 10.2 权限控制

```json
{
  "app": {
    "security": {
      "csp": "...",
      "freezePrototype": true,
      "dangerousDisableAssetCSPModification": false
    }
  }
}
```

---

## 十一、平台适配

### 11.1 Windows

```
┌─────────────────────────────────────────────────────────┐
│                    Windows 适配                           │
└─────────────────────────────────────────────────────────┘

- 安装包格式: .msi / .exe
- 图标: .ico
- 系统通知: Windows Toast
- 文件关联: 支持
- 注册表: 支持
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
```

---

## 十二、架构总结

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop 架构                            │
├─────────────────────────────────────────────────────────┤
│                   用户界面层                               │
│              SolidJS 应用 (继承自 app 包)                   │
├─────────────────────────────────────────────────────────┤
│                   Tauri JS API 层                         │
│  clipboard  │  dialog  │  notification  │  shell  │  fs   │
├─────────────────────────────────────────────────────────┤
│                   IPC 通信层                               │
│              invoke / emit / listen                        │
├─────────────────────────────────────────────────────────┤
│                   Tauri Core (Rust)                       │
│  Webview 管理  │  事件循环  │  系统调用                     │
├─────────────────────────────────────────────────────────┤
│                   自定义 Rust 命令                         │
│              系统级操作  │  性能优化                        │
├─────────────────────────────────────────────────────────┤
│                   操作系统层                               │
│  Windows  │  macOS  │  Linux                              │
└─────────────────────────────────────────────────────────┘
```

### 设计亮点

1. **Tauri 架构**: 轻量级桌面框架，比 Electron 更小
2. **Rust 后端**: 高性能系统级操作
3. **前端复用**: 直接继承 app 包，无需重复开发
4. **多平台支持**: Windows/macOS/Linux 统一代码
5. **安全设计**: CSP + 沙盒 + 权限控制
6. **自动更新**: 内置应用更新机制
7. **原生集成**: 系统通知、剪贴板、文件对话框

---

## 十三、开发命令

| 命令 | 说明 |
|------|------|
| `bun run --cwd packages/desktop tauri dev` | 启动开发模式 |
| `bun run --cwd packages/desktop tauri build` | 生产构建 |
| `bunx tauri icon` | 生成应用图标 |
| `bunx tauri info` | 查看 Tauri 信息 |

---

## 十四、依赖关系

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
  │
  └─ 其他依赖...
```

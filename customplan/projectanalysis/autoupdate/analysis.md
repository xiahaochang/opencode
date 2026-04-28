# desktop-electron 自动升级机制全面分析

## 1. 概述

desktop-electron 项目使用 **electron-updater**（基于 electron-builder 的更新方案）实现自动升级功能。整个升级流程涵盖：更新检查 → 下载 → 提示用户 → 安装重启，支持 GitHub Releases 作为更新源。

## 2. 技术栈

| 组件 | 版本 | 作用 |
|------|------|------|
| electron-updater | ^6 | 核心自动升级库 |
| electron-builder | ^26 | 打包 + 生成 latest.yml |
| electron | 40.4.1 | Electron 框架 |

## 3. 核心架构

### 3.1 目录结构（更新相关）

```
packages/desktop-electron/
├── src/
│   ├── main/
│   │   ├── index.ts          # 主进程：升级核心逻辑
│   │   ├── constants.ts      # UPDATER_ENABLED 开关
│   │   ├── ipc.ts            # IPC 通信：暴露升级 API
│   │   └── menu.ts           # 菜单：Check for Updates 入口
│   ├── preload/
│   │   ├── index.ts          # 预加载：暴露 window.api
│   │   └── types.ts          # 类型定义
│   └── renderer/
│       └── updater.ts        # 渲染进程：升级 UI 调用
├── electron-builder.config.ts # 打包配置：publish 配置
├── scripts/
│   └── finalize-latest-yml.ts # CI 脚本：合并多架构 yml
└── package.json              # 依赖声明
```

### 3.2 更新开关控制

**文件**: `src/main/constants.ts:10`

```ts
export const UPDATER_ENABLED = app.isPackaged && CHANNEL !== "dev"
```

- 仅在 **已打包应用** 且 **非 dev 频道** 时启用更新
- dev 环境（本地开发）不会触发更新检查

## 4. 自动升级完整流程

### 4.1 初始化配置

**文件**: `src/main/index.ts:304-318`

```ts
function setupAutoUpdater() {
  if (!UPDATER_ENABLED) return
  autoUpdater.logger = logger
  autoUpdater.channel = "latest"
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = true
  autoUpdater.autoDownload = false        // 不自动下载，需用户确认
  autoUpdater.autoInstallOnAppQuit = true  // 退出时自动安装
}
```

**关键配置说明**:

| 配置项 | 值 | 含义 |
|--------|-----|------|
| channel | "latest" | 使用 latest 频道（对应 GitHub Release） |
| allowPrerelease | false | 不检查预发布版本 |
| allowDowngrade | true | 允许降级安装 |
| autoDownload | false | 检测到更新后不自动下载（需手动触发） |
| autoInstallOnAppQuit | true | 应用退出时自动安装已下载的更新 |

### 4.2 升级检查流程

**入口**: `src/main/index.ts:322-356`

```
用户触发检查
     ↓
checkForUpdates(alertOnFail)
     ↓
checkUpdate()
     ↓
autoUpdater.checkForUpdates()  ← 请求 GitHub Releases
     ↓
比较版本号
     ↓
[有更新] → autoUpdater.downloadUpdate() → 下载完成 → updateReady = true
     ↓
[无更新] → 返回 { updateAvailable: false }
     ↓
[出错]   → 返回 { updateAvailable: false, failed: true }
```

**核心代码**:

```ts
async function checkUpdate() {
  if (!UPDATER_ENABLED) return { updateAvailable: false }
  updateReady = false
  try {
    const result = await autoUpdater.checkForUpdates()
    const version = result?.updateInfo?.version
    if (result?.isUpdateAvailable === false || !version) {
      return { updateAvailable: false }
    }
    await autoUpdater.downloadUpdate()     // 检查到更新后立即下载
    updateReady = true
    return { updateAvailable: true, version }
  } catch (error) {
    return { updateAvailable: false, failed: true }
  }
}
```

### 4.3 安装更新流程

**文件**: `src/main/index.ts:358-362`

```ts
async function installUpdate() {
  if (!updateReady) return
  killSidecar()                  // 先关闭 sidecar 进程
  autoUpdater.quitAndInstall()   // 退出并安装更新
}
```

安装时会弹出对话框让用户选择：

```ts
const response = await dialog.showMessageBox({
  message: `Update ${result.version} downloaded. Restart now?`,
  buttons: ["Restart", "Later"],
  defaultId: 0,
  cancelId: 1,
})
```

- **Restart**: 立即调用 `installUpdate()` 重启安装
- **Later**: 延迟安装（依赖 `autoInstallOnAppQuit = true`，退出时自动安装）

### 4.4 完整调用链路

```
渲染进程                          预加载层                        主进程
─────────                         ───────                        ──────
window.api.runUpdater()
        ↓ (IPC invoke)
                              runUpdater(alertOnFail)
                                        ↓ (IPC handle)
                                        checkForUpdates(alertOnFail)
                                                ↓
                                        checkUpdate()
                                                ↓
                                        autoUpdater.checkForUpdates()
                                                ↓
                                        autoUpdater.downloadUpdate()
                                                ↓
                                        dialog.showMessageBox()
                                                ↓
                                        installUpdate()
                                                ↓
                                        autoUpdater.quitAndInstall()
```

## 5. IPC 通信层

### 5.1 预加载层暴露的 API

**文件**: `src/preload/index.ts:63-65`

```ts
runUpdater: (alertOnFail) => ipcRenderer.invoke("run-updater", alertOnFail),
checkUpdate: () => ipcRenderer.invoke("check-update"),
installUpdate: () => ipcRenderer.invoke("install-update"),
```

### 5.2 主进程 IPC 处理

**文件**: `src/main/ipc.ts:57-59`

```ts
ipcMain.handle("run-updater", (_event, alertOnFail) => deps.runUpdater(alertOnFail))
ipcMain.handle("check-update", () => deps.checkUpdate())
ipcMain.handle("install-update", () => deps.installUpdate())
```

## 6. 打包与发布配置

### 6.1 electron-builder 配置

**文件**: `electron-builder.config.ts`

| 频道 | appId | publish 仓库 | channel |
|------|-------|-------------|---------|
| dev | ai.opencode.desktop.dev | — | — |
| beta | ai.opencode.desktop.beta | anomalyco/opencode-beta | latest |
| prod | ai.opencode.desktop | anomalyco/opencode | latest |

**beta 和 prod 配置**:

```ts
publish: { provider: "github", owner: "anomalyco", repo: "opencode", channel: "latest" }
```

### 6.2 多平台打包目标

| 平台 | 目标格式 |
|------|---------|
| macOS | dmg + zip |
| Windows | nsis（交互式安装） |
| Linux | AppImage + deb + rpm |

### 6.3 latest.yml 合并脚本

**文件**: `scripts/finalize-latest-yml.ts`

CI 构建时为不同架构生成独立的 `latest.yml`，该脚本将其合并：

- **Windows**: 合并 arm64 + x64 到统一的 `latest.yml`
- **macOS**: 合并 arm64 + x64 到 `latest-mac.yml`
- **Linux**: x64 → `latest-linux.yml`，arm64 → `latest-linux-arm64.yml`

合并后上传到 GitHub Release：

```ts
await $`gh release upload ${tag} ${filepath} --clobber --repo ${repo}`
```

## 7. 菜单入口

**文件**: `src/main/menu.ts:22-25`

macOS 应用菜单中的升级入口：

```ts
{
  label: "Check for Updates...",
  enabled: UPDATER_ENABLED,
  click: () => deps.checkForUpdates(),
}
```

## 8. 渲染进程调用

**文件**: `src/renderer/updater.ts`

```ts
export const UPDATER_ENABLED = () => window.__OPENCODE__?.updaterEnabled ?? false

export async function runUpdater({ alertOnFail }: { alertOnFail: boolean }) {
  await initI18n()
  try {
    await window.api.runUpdater(alertOnFail)
  } catch {
    if (alertOnFail) {
      window.alert(t("desktop.updater.checkFailed.message"))
    }
  }
}
```

## 9. 更新源解析流程

```
electron-updater
    ↓
读取 publish 配置 (provider: "github")
    ↓
请求 GitHub Releases API
    ↓
下载 latest.yml / latest-mac.yml / latest-linux.yml
    ↓
解析文件中的版本信息、下载 URL、SHA512 校验和
    ↓
对比当前应用版本 (app.getVersion())
    ↓
决定是否有可用更新
```

## 10. 关键特性总结

| 特性 | 实现方式 |
|------|---------|
| 更新源 | GitHub Releases（electron-builder publish 配置） |
| 版本校验 | SHA512 校验和（latest.yml 中声明） |
| 更新检查 | `autoUpdater.checkForUpdates()` |
| 下载策略 | 手动触发（autoDownload: false），检查后立即下载 |
| 安装策略 | 用户确认重启 或 退出时自动安装 |
| 频道控制 | dev 禁用，beta/prod 启用 |
| 降级支持 | allowDowngrade: true |
| 预发布版本 | 不检查（allowPrerelease: false） |
| 多架构支持 | CI 合并 latest.yml，统一分发 |
| 代码签名 | macOS 公证 + Windows signtool |

## 11. 流程时序图

```
用户点击 "Check for Updates"
         │
         ▼
┌─────────────────────────┐
│  menu.ts: checkForUpdates│
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────┐
│  main/index.ts:           │
│  checkForUpdates()        │◄── alertOnFail 控制错误提示
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  checkUpdate()            │
│  1. autoUpdater.          │
│     checkForUpdates()     │
│  2. 比较版本号             │
│  3. 有更新 → 下载         │
│  4. autoUpdater.          │
│     downloadUpdate()      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  dialog.showMessageBox()  │
│  "Update X downloaded.    │
│   Restart now?"           │
│  [Restart]  [Later]       │
└──────────┬───────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌──────────────┐
│Restart │  │Later (退出时  │
│        │  │ autoInstall  │
└───┬────┘  │    OnAppQuit │
    │       └──────────────┘
    ▼
┌──────────────────────────┐
│  installUpdate()          │
│  1. killSidecar()         │
│  2. autoUpdater.          │
│     quitAndInstall()      │
└───────────────────────────┘
```

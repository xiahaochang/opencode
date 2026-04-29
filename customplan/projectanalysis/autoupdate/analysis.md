# OpenCode 检查更新实现流程分析

## 概述

OpenCode 使用 `electron-updater` 库实现桌面应用的自动更新功能。更新检查流程涉及 UI 层、Preload 桥接层和 Main Process 三层架构。

## 架构层次

### 1. UI 层 (`packages/app/src/components/settings-general.tsx:110-139`)

用户点击"检查更新"按钮后触发 `check()` 函数：

```ts
const check = () => {
  if (!platform.checkUpdate) return
  setStore("checking", true)

  void platform
    .checkUpdate()
    .then((result) => {
      if (!result.updateAvailable) {
        showToast({
          variant: "success",
          icon: "circle-check",
          title: language.t("settings.updates.toast.latest.title"),
          description: language.t("settings.updates.toast.latest.description", { version: platform.version ?? "" }),
        })
        return
      }

      const actions =
        platform.update && platform.restart
          ? [
              {
                label: language.t("toast.update.action.installRestart"),
                onClick: async () => {
                  await platform.update!()
                  await platform.restart!()
                },
              },
              {
                label: language.t("toast.update.action.notYet"),
                onClick: "dismiss" as const,
              },
            ]
          : undefined

      showToast({
        variant: "success",
        icon: "arrow-down-to-line",
        title: language.t("settings.updates.toast.available.title"),
        description: language.t("settings.updates.toast.available.description", { version: result.version ?? "" }),
        actions,
      })
    })
    .finally(() => {
      setStore("checking", false)
    })
}
```

**关键点：**
- 调用前设置 `store.checking = true` 显示加载状态
- 按钮禁用条件：`disabled={store.checking || !platform.checkUpdate}`
- 根据返回结果显示不同的 toast 提示
- 有更新时提供"安装并重启"和"稍后"两个选项

### 2. Preload 桥接层 (`packages/desktop-electron/src/preload/index.ts:64`)

```ts
checkUpdate: () => ipcRenderer.invoke("check-update"),
```

将渲染进程的调用通过 IPC 转发到主进程。

### 3. Main Process IPC 处理 (`packages/desktop-electron/src/main/ipc.ts:58`)

```ts
ipcMain.handle("check-update", () => deps.checkUpdate())
```

注册 IPC 处理函数，调用实际的 `checkUpdate` 函数。

### 4. 核心更新逻辑 (`packages/desktop-electron/src/main/index.ts:322-356`)

```ts
async function checkUpdate() {
  if (!UPDATER_ENABLED) return { updateAvailable: false }
  updateReady = false
  
  logger.log("checking for updates", {
    currentVersion: app.getVersion(),
    channel: autoUpdater.channel,
    allowPrerelease: autoUpdater.allowPrerelease,
    allowDowngrade: autoUpdater.allowDowngrade,
  })
  
  try {
    const result = await autoUpdater.checkForUpdates()
    const updateInfo = result?.updateInfo
    
    logger.log("update metadata fetched", {
      releaseVersion: updateInfo?.version ?? null,
      releaseDate: updateInfo?.releaseDate ?? null,
      releaseName: updateInfo?.releaseName ?? null,
      files: updateInfo?.files?.map((file) => file.url) ?? [],
    })
    
    const version = result?.updateInfo?.version
    if (result?.isUpdateAvailable === false || !version) {
      logger.log("no update available", {
        reason: "provider returned no newer version",
      })
      return { updateAvailable: false }
    }
    
    logger.log("update available", { version })
    await autoUpdater.downloadUpdate()
    logger.log("update download completed", { version })
    updateReady = true
    return { updateAvailable: true, version }
  } catch (error) {
    logger.error("update check failed", error)
    return { updateAvailable: false, failed: true }
  }
}
```

## 更新判断机制

### Auto Updater 配置 (`packages/desktop-electron/src/main/index.ts:304-318`)

```ts
function setupAutoUpdater() {
  if (!UPDATER_ENABLED) return
  autoUpdater.logger = logger
  autoUpdater.channel = "latest"
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = true
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
}
```

**配置说明：**
- `channel = "latest"`：使用最新稳定版渠道
- `allowPrerelease = false`：不更新到预发布版本
- `allowDowngrade = true`：允许降级（特殊情况下有用）
- `autoDownload = false`：不自动下载（但 `checkUpdate()` 函数内部手动调用了 `downloadUpdate()`）
- `autoInstallOnAppQuit = true`：应用退出时自动安装已下载的更新

### 版本比较逻辑

`autoUpdater.checkForUpdates()` 内部流程：

1. **请求 manifest 文件**：根据配置从更新服务器获取 `{url}/latest.yml`（或对应平台的 manifest 文件）
2. **解析版本信息**：manifest 包含最新版本的版本号、文件哈希、下载地址等
3. **版本比较**：`electron-updater` 内部使用 **semver 比较** 将 `app.getVersion()` 与 manifest 中的版本号对比
4. **判断结果**：
   - `result.isUpdateAvailable = true`：服务器版本更新
   - `result.isUpdateAvailable = false`：当前已是最新或服务器版本更旧
   - 由于 `allowDowngrade = true`，即使服务器版本更低也视为可用更新

### 更新服务器配置 (`packages/desktop-electron/electron-builder.config.ts:90-110`)

```ts
switch (channel) {
  case "dev": {
    return {
      ...base,
      publish: { provider: "generic", url: "http://192.168.91.16:8080/dev" },
    }
  }
  case "beta": {
    return {
      ...base,
      publish: { provider: "generic", url: "http://192.168.91.16:8080/beta" },
    }
  }
  case "prod": {
    return {
      ...base,
      publish: { provider: "generic", url: "http://192.168.91.16:8080/prod" },
    }
  }
}
```

**关键点：**
- 使用 `generic` provider：简单的 HTTP 文件服务器
- 三个 channel（dev/beta/prod）对应不同 URL 路径
- 更新服务器地址：`http://192.168.91.16:8080/{channel}`

### 更新启用条件 (`packages/desktop-electron/src/main/constants.ts:10`)

```ts
export const UPDATER_ENABLED = app.isPackaged && CHANNEL !== "dev"
```

**含义：**
- 必须打包后的应用（`app.isPackaged = true`）
- 不能是 dev channel（开发版本不启用更新）

## 完整流程图

```
用户点击"检查更新"按钮
    ↓
check() 函数 [settings-general.tsx:110]
    ↓ 设置 store.checking = true
    ↓
platform.checkUpdate()
    ↓ (Preload 桥接层)
    ↓ ipcRenderer.invoke("check-update")
    ↓
Main Process checkUpdate() [main/index.ts:322]
    ↓
autoUpdater.checkForUpdates()
    ↓ 请求 http://192.168.91.16:8080/{channel}/latest.yml
    ↓ 解析 manifest，获取服务器版本号
    ↓ 比较版本号 (semver 比较)
    ↓ 判断 isUpdateAvailable
    ↓
┌──────────────────────────────────────────┐
│ result.isUpdateAvailable 判断             │
└──────────────┬──────────────────┬────────┘
               │ true             │ false
               ↓                  ↓
    await autoUpdater.downloadUpdate()
               ↓                  返回 { updateAvailable: false }
    下载更新包（根据 manifest 中的文件列表）
               ↓
    updateReady = true
    返回 { updateAvailable: true, version }
               ↓
    UI 层收到结果
               ↓
    ┌──────────────────────────────────────┐
    │ 显示 toast 提示                       │
    ├─────────────────┬────────────────────┤
    │ 有更新          │ 无更新/失败         │
    │ 显示版本号      │ 显示"已是最新"      │
    │ 提供操作按钮    │                    │
    └────────┬────────┘                    │
             │                             │
    ┌────────┴────────┐                    │
    │ 用户选择         │                    │
    ├─────────────────┼────────────────────┤
    │ 安装并重启       │ 稍后               │
    │ platform.update │ dismiss            │
    │ ↓                │                    │
    │ platform.restart │                    │
    │ ↓                │                    │
    │ installUpdate()  │                    │
    │ ↓                │                    │
    │ autoUpdater      │                    │
    │ .quitAndInstall()│                    │
    └─────────────────┘                    │
```

## 更新安装流程

在 `settings-general.tsx:127-139` 中，如果有更新可用：

1. 显示 toast，提供"安装并重启"按钮
2. 点击后先调用 `platform.update()`：
   ```ts
   async function installUpdate() {
     if (!updateReady) return
     killSidecar()
     autoUpdater.quitAndInstall()
   }
   ```
3. 再调用 `platform.restart()` 退出应用
4. `autoInstallOnAppQuit = true` 确保退出时自动安装已下载的更新

## 关键文件路径索引

| 功能 | 文件路径 | 行号 |
|------|----------|------|
| UI 层检查逻辑 | `packages/app/src/components/settings-general.tsx` | 110-139, 520-524 |
| Preload 桥接 | `packages/desktop-electron/src/preload/index.ts` | 64 |
| IPC 注册 | `packages/desktop-electron/src/main/ipc.ts` | 58 |
| 核心更新函数 | `packages/desktop-electron/src/main/index.ts` | 322-356 |
| Auto Updater 配置 | `packages/desktop-electron/src/main/index.ts` | 304-318 |
| 更新启用条件 | `packages/desktop-electron/src/main/constants.ts` | 10 |
| 更新服务器配置 | `packages/desktop-electron/electron-builder.config.ts` | 90-110 |
| 安装更新函数 | `packages/desktop-electron/src/main/index.ts` | 358-362 |

## 注意事项

1. **自动下载**：虽然配置了 `autoDownload = false`，但 `checkUpdate()` 函数内部主动调用了 `downloadUpdate()`，所以实际上是检查到更新就立即下载。

2. **更新服务器**：当前配置的是内部服务器 `http://192.168.91.16:8080`，生产环境需要修改为公开的 CDN 或 GitHub Releases。

3. **Channel 区分**：开发版本（dev channel）不会启用更新功能，避免开发过程中误更新。

4. **错误处理**：更新检查失败时会返回 `{ updateAvailable: false, failed: true }`，UI 层需要据此显示适当的错误提示（当前实现中似乎没有处理 `failed` 情况）。

# OpenCode Electron 打包发布指南

## 生产环境打包流程

### 1. 设置版本号并打包

```bash
cd packages/desktop-electron

# 设置版本号和通道，执行构建和打包
OPENCODE_CHANNEL=prod OPENCODE_VERSION=1.4.6 bun run build && bun run package:linux

# 生成更新元数据文件
OPENCODE_VERSION=1.4.6 bun run generate-update-files
```

**参数说明：**
- `OPENCODE_CHANNEL=prod` - 生产环境通道
- `OPENCODE_VERSION=1.4.5` - 指定版本号（根据实际版本修改）
- `package:linux` - 仅打包 Linux 格式（AppImage + deb）

### 2. 生成更新元数据文件

```bash
bun run generate-update-files
```

此脚本会：
- 计算每个包的 SHA512 哈希值
- 记录文件大小
- 生成 `dist/latest-linux.yml` 文件

### 3. 输出文件

打包完成后，`packages/desktop-electron/dist/` 目录包含：

```
dist/
├── opencode-electron-linux-x86_64.AppImage    # AppImage 包
├── opencode-electron-linux-amd64.deb          # deb 包
├── latest-linux.yml                           # 更新元数据文件
└── linux-unpacked/                            # 解压后的文件（调试用）
```

### 4. 上传到服务器

将以下文件上传到更新服务器（如 `https://updates.example.com/prod/`）：

- `opencode-electron-linux-x86_64.AppImage`
- `opencode-electron-linux-amd64.deb`
- `latest-linux.yml`

**注意：** `latest-linux.yml` 中的 `url` 字段是相对路径，确保上传到同一目录。

### 5. 验证 latest-linux.yml

生成后的文件示例：

```yaml
version: 1.4.5
files:
  - url: opencode-electron-linux-x86_64.AppImage
    sha512: fuTIehHr4W0jgLFxQB1AgzS7C4dt2liiYYfB3HpRMgQ4ytESnAf/hHw/O6G9d879w0ejVKHixCIR4mU0V8ZCFw==
    size: 137188375
  - url: opencode-electron-linux-amd64.deb
    sha512: EHYSWwaB5Gz0VNd6J94Gn1qqml3Sd263ktNbo2FyPMDDfsS+8BMvELHgET1+IS4MoQLbuGgnoreuIgdMakLMLw==
    size: 107902288
releaseDate: "2026-04-28T12:18:22.402Z"
```

客户端会访问 `https://updates.example.com/prod/latest-linux.yml` 检查更新。

---

## Beta 通道打包

```bash
OPENCODE_CHANNEL=beta OPENCODE_VERSION=1.4.5-beta.1 bun run build && bun run package:linux
bun run generate-update-files
```

---

## 开发通道打包

```bash
OPENCODE_CHANNEL=dev bun run build && bun run package:linux
```

**注意：** dev 通道默认不生成更新元数据文件（无 `publish` 配置）。

---

## 完整一键命令

```bash
cd packages/desktop-electron && \
OPENCODE_CHANNEL=prod OPENCODE_VERSION=1.4.6 bun run build && \
bun run package:linux && \
OPENCODE_VERSION=1.4.6 bun run generate-update-files
```

---

## 故障排除

### rpm 构建失败

如果看到 `rpmbuild is required` 错误，配置已默认只打包 AppImage 和 deb，无需 rpm。

### 版本号不正确

确保设置了 `OPENCODE_VERSION` 环境变量，且格式为 `x.y.z`。

### 缺少 electron-builder

运行 `bun install` 安装依赖。

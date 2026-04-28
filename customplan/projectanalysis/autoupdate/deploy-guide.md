# 更新服务器部署指南

## 快速启动

```bash
# 默认端口 3000，更新文件在 packages/desktop-electron/updates/
bun scripts/update-server.ts

# 自定义端口和目录
PORT=8080 UPDATES_DIR=/data/updates bun scripts/update-server.ts
```

## 目录结构

```
packages/desktop-electron/updates/
├── prod/
│   ├── latest.yml
│   ├── opencode-electron-win-x64.exe
│   ├── opencode-electron-mac-arm64.dmg
│   └── ...
└── beta/
    ├── latest.yml
    └── ...
```

## 部署方式

### 方式一：systemd（Linux 生产环境）

```ini
# /etc/systemd/system/opencode-update.service
[Unit]
Description=OpenCode Update Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/opencode/desktop-electron
ExecStart=/usr/bin/bun scripts/update-server.ts
Environment=PORT=3000 UPDATES_DIR=/opt/opencode/updates
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now opencode-update
```

### 方式二：Docker

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY scripts/update-server.ts .
RUN mkdir -p /data/updates
ENV PORT=3000 UPDATES_DIR=/data/updates
EXPOSE 3000
CMD ["bun", "run", "update-server.ts"]
```

```bash
docker build -t opencode-update-server .
docker run -d -p 3000:3000 -v /opt/opencode/updates:/data/updates opencode-update-server
```

### 方式三：PM2

```bash
pm2 start scripts/update-server.ts --name opencode-update \
  -- --env PORT=3000 --env UPDATES_DIR=/data/updates
pm2 save
```

### 方式四：Nginx 反向代理 + 服务

```nginx
server {
    listen 443 ssl;
    server_name updates.example.com;

    ssl_certificate /etc/letsencrypt/live/updates.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/updates.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 发布更新

```bash
# 打包
cd packages/desktop-electron
bun run build
bun run package:win
bun run package:mac
bun run package:linux

# 上传到服务器（方式一：SCP）
scp dist/* user@updates.example.com:/opt/opencode/updates/prod/

# 上传到服务器（方式二：rsync）
rsync -avz dist/ user@updates.example.com:/opt/opencode/updates/prod/

# 上传到服务器（方式三：脚本）
UPDATES_DIR=/opt/opencode/updates bun scripts/upload-updates.ts prod dist/
```

## electron-builder.config.ts 对应修改

```ts
publish: { provider: "generic", url: "https://updates.example.com/prod", channel: "latest" }
```

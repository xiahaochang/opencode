# GitLens 移植到 OpenCode 详细指南

**文档版本：** 2.0（完整详细版）
**创建日期：** 2026 年 4 月 17 日
**目标平台：** OpenCode（VS Code 衍生 IDE）
**参考源码：** GitLens 最新版

---

## 目录

1. [概述](#1-概述)
2. [核心架构分析](#2-核心架构分析)
3. [移植步骤详解](#3-移植步骤详解)
4. [关键代码实现](#4-关键代码实现)
5. [Webview 通信机制](#5-webview-通信机制)
6. [Git 命令执行层](#6-git-命令执行层)
7. [状态管理与缓存](#7-状态管理与缓存)
8. [无障碍功能要求](#8-无障碍功能要求)
9. [常见问题与解决方案](#9-常见问题与解决方案)
10. [附录：核心文件清单](#10-附录核心文件清单)
11. [完整示例项目结构](#11-完整示例项目结构)

---

## 1. 概述

### 1.1 GitLens 核心功能

GitLens 是一个强大的 Git 集成扩展，主要功能包括：

| 功能模块 | 描述 | 移植难度 |
|---------|------|----------|
| **Commit Graph** | 可视化提交历史图，显示分支合并关系 | ⭐⭐⭐⭐ |
| **Blame Annotations** | 行内/状态栏 blame 信息 | ⭐⭐⭐ |
| **CodeLens** | 代码上方的 Git 信息透镜 | ⭐⭐⭐ |
| **Hover** | 鼠标悬停显示提交详情 | ⭐⭐ |
| **Views** | 侧边栏视图（提交、分支、PR 等） | ⭐⭐⭐ |
| **Search** | 自然语言提交搜索 | ⭐⭐⭐⭐ |
| **Worktrees** | Git Worktree 管理 | ⭐⭐ |

### 1.2 OpenCode 平台特性

OpenCode 作为 VS Code 衍生 IDE，支持：
- ✅ VS Code Extension API（兼容大部分 API）
- ✅ Webview 面板和视图
- ✅ 命令注册和执行
- ✅ 树视图提供者
- ✅ 终端集成
- ⚠️ 部分 API 可能需要适配（如 Live Share、GitHub 集成）

### 1.3 移植范围建议

**推荐移植的核心功能（第一阶段）：**
1. Commit Graph 可视化
2. Blame 注解（行内/状态栏）
3. 侧边栏视图（提交历史、分支）
4. Git 命令向导

**可选功能（第二阶段）：**
- GitHub/GitLab 集成
- GitKraken 账户服务
- AI 功能（需要 AI 服务接入）

**不建议移植（依赖专有服务）：**
- GitKraken 集成服务
- 专有 AI 功能
- 付费功能（Plus 功能）

---

## 2. 核心架构分析

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Extension Entry                           │
│                      src/extension.ts                            │
│                    activate(context)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Container                                │
│                    src/container.ts                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Storage   │ │  Telemetry  │ │   Config    │ │  Git API  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  Webviews   │ │    Views    │ │  Commands   │ │  Cache    │ │
│  │ Controller  │ │             │ │             │ │           │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
─────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Webview Panel  │ │   Tree View     │ │  Status Bar     │
│  (Commit Graph) │ │  (Commits)      │ │  (Blame)        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 2.2 数据流链路

```
用户操作 → VS Code 命令 → Container.GitService → GitProvider
    → Git CLI 执行 → 解析输出 → 数据增强 → IPC 通知 → Webview 渲染
```

**详细流程（以 Commit Graph 为例）：**

```
1. 用户点击 "Show Commit Graph" 命令
   ↓
2. commands.executeCommand('gitlens.showGraph')
   ↓
3. GraphWebviewProvider.onShowing() 被调用
   ↓
4. container.git.getRepositoryService(repoPath).graph.getGraph()
   ↓
5. CliGitProvider 执行 git log --graph --format=...
   ↓
6. GitGraphRowProcessor.processRow() 增强每行数据
   ↓
7. WebviewController 通过 IPC 发送 DidChangeRowsNotification
   ↓
8. Lit 组件接收通知，更新 GraphState
   ↓
9. @gitkraken/gitkraken-components GraphContainer 渲染
```

---

## 3. 移植步骤详解

### 3.1 步骤 1：创建扩展骨架

**文件结构：**
```
opencode-gitlens/
├── package.json              # 扩展配置
├── src/
│   ├── extension.ts          # 入口文件
│   ├── container.ts          # 服务容器
│   ├── config.ts             # 配置定义
│   ├── commands/             # 命令实现
│   ├── views/                # 树视图
│   ├── webviews/             # Webview 控制器
│   └── git/                  # Git 服务层
├── webviews/                 # Webview 静态资源
│   └── graph/
│       ├── graph.html
│       └── graph.js
└── resources/                # 图标等资源
```

**package.json 最小配置：**
```json
{
  "name": "opencode-gitlens",
  "displayName": "OpenCode GitLens",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "activationEvents": [
    "onStartupFinished",
    "onWebviewPanel:gitlens.graph"
  ],
  "contributes": {
    "commands": [
      {
        "command": "gitlens.showGraph",
        "title": "Show Commit Graph",
        "icon": "$(gitlens-graph)"
      }
    ],
    "views": {
      "gitlens.views": [
        {
          "id": "gitlens.views.commits",
          "name": "Commits",
          "icon": "$(gitlens-view-icon-commits)"
        }
      ]
    },
    "menus": {
      "scm/title": [
        {
          "command": "gitlens.showGraph",
          "group": "navigation"
        }
      ]
    }
  },
  "main": "./dist/extension.js"
}
```

### 3.2 步骤 2：实现扩展激活

**src/extension.ts：**
```typescript
import * as vscode from 'vscode';
import { Container } from './container';

let container: Container | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('OpenCode GitLens activated');

    // 1. 初始化存储
    const storage = new Map<string, any>();

    // 2. 创建服务容器
    container = Container.create(context, storage);

    // 3. 等待容器准备就绪
    await container.ready();

    // 4. 注册命令
    const disposables = [
        vscode.commands.registerCommand('gitlens.showGraph', () => {
            container!.views.graph.show();
        }),
        vscode.commands.registerCommand('gitlens.showCommitDetails', () => {
            container!.views.commitDetails.show();
        }),
        // ... 更多命令
    ];

    context.subscriptions.push(...disposables);

    return {
        // 可选：导出 API 供其他扩展使用
        getRepository: (repoPath: string) => container!.git.getRepository(repoPath)
    };
}

export function deactivate() {
    container?.dispose();
}
```

### 3.3 步骤 3：实现服务容器

**src/container.ts：**
```typescript
import * as vscode from 'vscode';
import { GitProviderService } from './git/gitProviderService';
import { WebviewsController } from './webviews/webviewsController';
import { Views } from './views/views';

export class Container {
    private _git: GitProviderService | undefined;
    private _webviews: WebviewsController | undefined;
    private _views: Views | undefined;
    private _disposables: vscode.Disposable[] = [];

    static create(context: vscode.ExtensionContext, storage: Map<string, any>): Container {
        return new Container(context, storage);
    }

    private constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly storage: Map<string, any>
    ) {
        // 初始化 Git 服务
        this._git = new GitProviderService(this);

        // 初始化 Webview 控制器
        this._webviews = new WebviewsController(this);

        // 初始化视图
        this._views = new Views(this, this._webviews);
    }

    get git(): GitProviderService { return this._git!; }
    get views(): Views { return this._views!; }

    async ready(): Promise<void> {
        await this._git!.initialize();
    }

    dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }
}
```

### 3.4 步骤 4：实现 Git 服务层

**src/git/gitProviderService.ts：**
```typescript
import { Container } from '../container';
import { CliGitProvider } from './cliGitProvider';

export class GitProviderService {
    private _provider: CliGitProvider | undefined;
    private _repositories = new Map<string, GitRepository>();

    constructor(private readonly container: Container) {}

    async initialize(): Promise<void> {
        this._provider = new CliGitProvider();
        await this._provider.initialize();
    }

    getRepository(repoPath: string): GitRepository {
        let repo = this._repositories.get(repoPath);
        if (!repo) {
            repo = new GitRepository(repoPath, this._provider!);
            this._repositories.set(repoPath, repo);
        }
        return repo;
    }

    async getRepositories(): Promise<GitRepository[]> {
        // 扫描工作区中的 Git 仓库
        const repos: GitRepository[] = [];
        for (const folder of vscode.workspace.workspaceFolders || []) {
            const repo = this.getRepository(folder.uri.fsPath);
            if (await repo.exists()) {
                repos.push(repo);
            }
        }
        return repos;
    }
}
```

**src/git/cliGitProvider.ts：**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class CliGitProvider {
    private gitPath: string = 'git';

    async initialize(): Promise<void> {
        // 验证 Git 是否可用
        try {
            const { stdout } = await this.execute('git --version');
            console.log(`Git found: ${stdout.trim()}`);
        } catch (e) {
            throw new Error('Git not found. Please install Git.');
        }
    }

    async execute(command: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
        return execAsync(command, {
            cwd,
            maxBuffer: 1024 * 1024, // 1MB
            env: process.env
        });
    }

    async getGraph(repoPath: string, options?: GraphOptions): Promise<GitGraph> {
        const args = [
            'log',
            '--graph',
            '--pretty=format:%H|%h|%an|%ae|%at|%s|%P',
            '--decorate=full',
            options?.limit ? `--max-count=${options.limit}` : ''
        ].filter(Boolean).join(' ');

        const result = await this.execute(`git ${args}`, repoPath);
        return this.parseGraphOutput(result.stdout);
    }

    private parseGraphOutput(output: string): GitGraph {
        const commits: GitCommit[] = [];
        const lines = output.split('\n');

        for (const line of lines) {
            if (!line.includes('|')) continue;

            const [sha, shortSha, author, email, timestamp, message, parents] = line.split('|');
            commits.push({
                sha,
                shortSha,
                author,
                email,
                date: parseInt(timestamp) * 1000,
                message,
                parents: parents ? parents.split(' ') : [],
                graphLine: line
            });
        }

        return { commits };
    }
}

interface GraphOptions {
    limit?: number;
    includeStats?: boolean;
}

interface GitGraph {
    commits: GitCommit[];
}

interface GitCommit {
    sha: string;
    shortSha: string;
    author: string;
    email: string;
    date: number;
    message: string;
    parents: string[];
    graphLine: string;
}
```

### 3.5 步骤 5：实现 Webview 系统

**src/webviews/webviewsController.ts：**
```typescript
import * as vscode from 'vscode';
import { Container } from '../container';

export class WebviewsController {
    private _panels = new Map<string, vscode.WebviewPanel>();

    constructor(private readonly container: Container) {}

    registerGraphPanel(): vscode.Disposable {
        const command = vscode.commands.registerCommand(
            'gitlens.showGraph',
            () => this.showGraph()
        );

        return command;
    }

    async showGraph(): Promise<void> {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // 检查是否已有面板
        const existingPanel = this._panels.get('graph');
        if (existingPanel) {
            existingPanel.reveal(column);
            return;
        }

        // 创建新面板
        const panel = vscode.window.createWebviewPanel(
            'gitlens.graph',
            'Commit Graph',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.container.context.extensionUri, 'dist')
                ]
            }
        );

        panel.iconPath = vscode.Uri.joinPath(
            this.container.context.extensionUri,
            'resources',
            'icon.png'
        );

        // 设置 HTML 内容
        panel.webview.html = this.getGraphHtml(panel.webview);

        // 处理消息
        panel.webview.onDidReceiveMessage(message => {
            this.handleMessage(message, panel);
        });

        // 清理
        panel.onDidDispose(() => {
            this._panels.delete('graph');
        });

        this._panels.set('graph', panel);

        // 发送初始数据
        this.sendGraphData(panel);
    }

    private getGraphHtml(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.container.context.extensionUri, 'dist', 'graph.js')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Commit Graph</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 10px; }
        .commit { display: flex; align-items: center; margin: 4px 0; }
        .commit-graph { width: 200px; font-family: monospace; }
        .commit-message { flex: 1; }
        .commit-author { color: var(--vscode-descriptionForeground); }
    </style>
</head>
<body>
    <div id="graph"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private async sendGraphData(panel: vscode.WebviewPanel): Promise<void> {
        const repo = this.container.git.getRepository(
            vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
        );
        const graph = await repo.getGraph({ limit: 100 });

        panel.webview.postMessage({
            type: 'graph-data',
            data: graph
        });
    }

    private handleMessage(message: any, panel: vscode.WebviewPanel): void {
        switch (message.type) {
            case 'ready':
                this.sendGraphData(panel);
                break;
            case 'refresh':
                this.sendGraphData(panel);
                break;
        }
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
```

### 3.6 步骤 6：实现 Webview 前端

**webviews/graph/graph.js：**
```javascript
// 与 VS Code API 通信的桥接
const vscode = acquireVsCodeApi();

// 状态管理
let state = {
    commits: [],
    selectedCommit: null
};

// 监听来自扩展的消息
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
        case 'graph-data':
            renderGraph(message.data);
            break;
    }
});

// 通知扩展已准备就绪
vscode.postMessage({ type: 'ready' });

// 渲染提交图
function renderGraph(graph) {
    state.commits = graph.commits;
    const container = document.getElementById('graph');

    container.innerHTML = graph.commits.map(commit => `
        <div class="commit" data-sha="${commit.sha}">
            <div class="commit-graph">${escapeHtml(commit.graphLine)}</div>
            <div class="commit-message">${escapeHtml(commit.message)}</div>
            <div class="commit-author">${escapeHtml(commit.author)}</div>
        </div>
    `).join('');

    // 添加点击事件
    container.querySelectorAll('.commit').forEach(el => {
        el.addEventListener('click', () => {
            const sha = el.dataset.sha;
            selectCommit(sha);
        });
    });
}

// 选择提交
function selectCommit(sha) {
    state.selectedCommit = sha;
    vscode.postMessage({
        type: 'commit-selected',
        sha: sha
    });
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### 3.7 步骤 7：实现树视图

**src/views/views.ts：**
```typescript
import * as vscode from 'vscode';
import { Container } from '../container';

export class Views {
    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly container: Container,
        private readonly webviews: WebviewsController
    ) {
        this.registerViews();
    }

    private registerViews(): void {
        // 注册 Commits 视图
        const commitsDataProvider = new CommitsDataProvider(this.container);
        this._disposables.push(
            vscode.window.registerTreeDataProvider('gitlens.views.commits', commitsDataProvider)
        );

        // 注册刷新命令
        this._disposables.push(
            vscode.commands.registerCommand('gitlens.refreshCommitsView', () => {
                commitsDataProvider.refresh();
            })
        );
    }

    dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }
}

class CommitsDataProvider implements vscode.TreeDataProvider<CommitItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<CommitItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private readonly container: Container) {}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: CommitItem): vscode.TreeItem {
        return {
            label: element.message,
            description: element.author,
            tooltip: `${element.message}\n\nAuthor: ${element.author}\nDate: ${new Date(element.date).toLocaleString()}`,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command: {
                command: 'gitlens.showCommitDetails',
                title: 'Show Commit Details',
                arguments: [element.sha]
            },
            iconPath: new vscode.ThemeIcon('git-commit')
        };
    }

    async getChildren(element?: CommitItem): Promise<CommitItem[]> {
        if (element) {
            return []; // 叶子节点
        }

        const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!repoPath) {
            return [];
        }

        const repo = this.container.git.getRepository(repoPath);
        const graph = await repo.getGraph({ limit: 50 });

        return graph.commits.map(commit => ({
            sha: commit.sha,
            message: commit.message,
            author: commit.author,
            date: commit.date
        }));
    }
}

interface CommitItem {
    sha: string;
    message: string;
    author: string;
    date: number;
}
```

### 3.8 步骤 8：配置 package.json 视图贡献

**package.json 视图配置：**
```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "gitlens",
          "title": "GitLens",
          "icon": "resources/gitlens-icon.svg"
        }
      ]
    },
    "views": {
      "gitlens": [
        {
          "id": "gitlens.views.commits",
          "name": "Commits",
          "icon": "resources/view-icon-commits.svg",
          "contextualTitle": "GitLens"
        },
        {
          "id": "gitlens.views.branches",
          "name": "Branches",
          "icon": "resources/view-icon-branches.svg"
        }
      ]
    },
    "viewsWelcome": [
      {
        "view": "gitlens.views.commits",
        "contents": "No commits found.\n[Refresh](command:gitlens.refreshCommitsView)",
        "when": "gitlens.views.commits.empty"
      }
    ]
  }
}
```

---

## 4. 关键代码实现

### 4.1 IPC 通信协议实现

**src/webviews/protocol.ts：**
```typescript
// IPC 消息类型定义
export interface IpcMessage {
    method: string;
    params?: any;
    id?: string;
}

// 请求/响应模式
export class IpcRequest<Params, Response> {
    constructor(
        public readonly scope: string,
        public readonly method: string
    ) {}

    is(message: IpcMessage): boolean {
        return message.method === `${this.scope}/${this.method}`;
    }
}

// 命令模式（无响应）
export class IpcCommand<Params> {
    constructor(
        public readonly scope: string,
        public readonly method: string
    ) {}

    is(message: IpcMessage): boolean {
        return message.method === `${this.scope}/${this.method}`;
    }
}

// 通知模式
export class IpcNotification<Params> {
    constructor(
        public readonly scope: string,
        public readonly method: string
    ) {}

    is(message: IpcMessage): boolean {
        return message.method === `${this.scope}/${this.method}`;
    }
}

// 核心协议
export const WebviewReadyRequest = new IpcRequest('core', 'webview/ready');
export const ExecuteCommand = new IpcCommand('core', 'command/execute');
export const DidChangeRowsNotification = new IpcNotification('rows', 'didChange');
```

### 4.2 IPC 装饰器系统

**src/webviews/ipc/decorators.ts：**
```typescript
const ipcHandlers = new Map<Function, Map<string, { type: 'command' | 'request'; propertyKey: string }>>();

// IPC 命令装饰器
export function ipcCommand(commandType: IpcCommand<any>): MethodDecorator {
    return function(target: any, propertyKey: string | symbol) {
        registerHandler(target, propertyKey, commandType, 'command');
    };
}

// IPC 请求装饰器
export function ipcRequest(requestType: IpcRequest<any, any>): MethodDecorator {
    return function(target: any, propertyKey: string | symbol) {
        registerHandler(target, propertyKey, requestType, 'request');
    };
}

function registerHandler(
    target: any,
    propertyKey: string | symbol,
    type: IpcCommand<any> | IpcRequest<any, any>,
    handlerType: 'command' | 'request'
): void {
    const className = target.constructor.name;
    if (!ipcHandlers.has(target.constructor)) {
        ipcHandlers.set(target.constructor, new Map());
    }
    ipcHandlers.get(target.constructor)!.set(type.method, {
        type: handlerType,
        propertyKey: String(propertyKey)
    });
}

// 消息分发
export async function dispatchIpcMessage(
    instance: any,
    message: IpcMessage,
    respond?: (response: any) => void
): Promise<boolean> {
    const handlers = ipcHandlers.get(instance.constructor);
    if (!handlers) return false;

    const entry = handlers.get(message.method);
    if (!entry) return false;

    const handler = instance[entry.propertyKey];
    if (!handler) return false;

    try {
        const result = await handler.call(instance, message.params);
        if (entry.type === 'request' && respond) {
            respond(result);
        }
        return true;
    } catch (error) {
        console.error(`IPC handler error: ${error}`);
        return false;
    }
}
```

### 4.3 使用装饰器的 Webview Provider

```typescript
import { ipcCommand, ipcRequest } from './ipc/decorators';

export class GraphWebviewProvider {
    constructor(
        private readonly container: Container,
        private readonly host: WebviewHost
    ) {}

    @ipcRequest(WebviewReadyRequest)
    async onWebviewReady(params: WebviewReadyParams): Promise<WebviewReadyResponse> {
        const graph = await this.container.git.getGraph();
        return {
            state: {
                commits: graph.commits,
                branches: await this.container.git.getBranches()
            }
        };
    }

    @ipcCommand(ExecuteCommand)
    async onExecuteCommand(params: ExecuteCommandParams): Promise<void> {
        await vscode.commands.executeCommand(params.command, ...params.args);
    }

    @ipcRequest(new IpcRequest('graph', 'getCommit'))
    async onGetCommit(params: { sha: string }): Promise<GitCommit> {
        return this.container.git.getCommit(params.sha);
    }
}
```

### 4.4 缓存系统实现

**src/cache/cacheProvider.ts：**
```typescript
interface CacheEntry<T> {
    value: T;
    cachedAt: number;
    expiresAt?: number;
    etag?: string;
}

export class CacheProvider {
    private _cache = new Map<string, CacheEntry<any>>();

    get<T>(
        key: string,
        fetcher: () => Promise<T>,
        options?: CacheOptions
    ): Promise<T> {
        const entry = this._cache.get(key);
        const now = Date.now();

        // 检查是否过期
        if (entry && (!entry.expiresAt || entry.expiresAt > now)) {
            return Promise.resolve(entry.value);
        }

        // 缓存未命中或已过期，执行 fetch
        return this.set(key, fetcher(), options?.ttl);
    }

    private async set<T>(key: string, valuePromise: Promise<T>, ttl?: number): Promise<T> {
        const value = await valuePromise;
        const entry: CacheEntry<T> = {
            value,
            cachedAt: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : undefined
        };
        this._cache.set(key, entry);
        return value;
    }

    delete(key: string): void {
        this._cache.delete(key);
    }

    clear(): void {
        this._cache.clear();
    }
}

interface CacheOptions {
    ttl?: number; // 毫秒
}
```

### 4.5 装饰器系统实现

**src/system/decorators/gate.ts：**
```typescript
interface GateOptions {
    timeout?: number; // 超时时间（毫秒）
}

const pendingCalls = new Map<string, Promise<any>>();

export function gate(getKey?: (...args: any[]) => string, options?: GateOptions): MethodDecorator {
    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args: any[]) {
            const key = getKey ? getKey.apply(this, args) : `${String(propertyKey)}`;

            // 检查是否有相同的调用正在进行
            const pending = pendingCalls.get(key);
            if (pending) {
                return pending; // 返回相同的 Promise
            }

            const timeout = options?.timeout || 300000; // 默认 5 分钟

            const promise = new Promise<any>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    pendingCalls.delete(key);
                    reject(new Error(`Gate timeout for ${key}`));
                }, timeout);

                originalMethod.apply(this, args)
                    .then(result => {
                        clearTimeout(timeoutId);
                        pendingCalls.delete(key);
                        resolve(result);
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        pendingCalls.delete(key);
                        reject(error);
                    });
            });

            pendingCalls.set(key, promise);
            return promise;
        };

        return descriptor;
    };
}
```

**src/system/decorators/memoize.ts：**
```typescript
const memoized = new WeakMap<object, Map<string, any>>();

export function memoize(): MethodDecorator {
    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.get;

        descriptor.get = function() {
            if (!memoized.has(this)) {
                memoized.set(this, new Map());
            }
            const instanceCache = memoized.get(this)!;

            if (!instanceCache.has(String(propertyKey))) {
                instanceCache.set(String(propertyKey), originalMethod!.call(this));
            }
            return instanceCache.get(String(propertyKey));
        };

        return descriptor;
    };
}

// 清除 memoized 缓存
export function invalidateMemoized(target: any, propertyKey: string): void {
    const cache = memoized.get(target);
    if (cache) {
        cache.delete(propertyKey);
    }
}
```

---

## 5. Webview 通信机制

### 5.1 完整通信流程

```
┌─────────────┐                              ┌─────────────┐
│  Webview UI │                              │  Extension  │
│   (HTML/JS) │                              │    Host     │
└──────┬──────┘                              └──────┬──────┘
       │                                           │
       │  1. acquireVsCodeApi()                    │
       │◄──────────────────────────────────────────│
       │                                           │
       │  2. postMessage({type: 'ready'})          │
       ├──────────────────────────────────────────►│
       │                                           │
       │                                           │ onDidReceiveMessage
       │                                           │     ↓
       │                                           │ dispatchIpcMessage
       │                                           │     ↓
       │                                           │ @ipcRequest 处理器
       │                                           │
       │  3. postMessage({type: 'graph-data', ...})│
       │◄──────────────────────────────────────────│
       │                                           │
       │  4. window.addEventListener('message')    │
       ├──────────────────────────────────────────►│
       │                                           │
```

### 5.2 Webview HTML 模板生成

```typescript
function createWebviewHtml(options: {
    webview: vscode.Webview;
    extensionUri: vscode.Uri;
    title: string;
    initialState?: any;
}): string {
    const { webview, extensionUri, title, initialState } = options;

    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js')
    );

    const styleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css')
    );

    const nonce = getNonce();
    const serializedState = JSON.stringify(initialState || {});

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   style-src ${webview.cspSource} 'unsafe-inline';
                   script-src 'nonce-${nonce}';
                   img-src ${webview.cspSource} https:;">
    <title>${title}</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="app"></div>
    <script nonce="${nonce}">
        // 初始状态注入
        window.__INITIAL_STATE__ = ${serializedState};
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
```

### 5.3 Webview 状态同步

```typescript
// Extension 端状态管理
class WebviewStateSync<T> {
    private _state: T;
    private _pendingNotifications: any[] = [];
    private _ready = false;

    constructor(
        private webview: vscode.Webview,
        initialState: T
    ) {
        this._state = initialState;

        webview.onDidReceiveMessage(message => {
            if (message.type === 'ready') {
                this._ready = true;
                this.sendPendingNotifications();
            }
        });
    }

    updateState(partialState: Partial<T>): void {
        this._state = { ...this._state, ...partialState };

        this.webview.postMessage({
            type: 'state-update',
            state: partialState
        });
    }

    private sendPendingNotifications(): void {
        for (const notification of this._pendingNotifications) {
            this.webview.postMessage(notification);
        }
        this._pendingNotifications = [];
    }

    sendNotification(type: string, params: any): void {
        const notification = { type, params };

        if (this._ready) {
            this.webview.postMessage(notification);
        } else {
            this._pendingNotifications.push(notification);
        }
    }
}
```

---

## 6. Git 命令执行层

### 6.1 Git 命令执行封装

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitExecutionOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeout?: number;
    maxBuffer?: number;
}

interface GitExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export class GitExecutor {
    private gitPath = 'git';

    async execute(
        args: string[],
        options?: GitExecutionOptions
    ): Promise<GitExecutionResult> {
        const command = `${this.gitPath} ${args.join(' ')}`;

        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: options?.cwd,
                env: { ...process.env, ...options?.env },
                timeout: options?.timeout || 60000,
                maxBuffer: options?.maxBuffer || 1024 * 1024
            });

            return { stdout, stderr, exitCode: 0 };
        } catch (error: any) {
            return {
                stdout: error.stdout || '',
                stderr: error.stderr || '',
                exitCode: error.code || 1
            };
        }
    }
}
```

### 6.2 Git 输出解析器

```typescript
// 解析 git log 输出
export function parseGitLog(output: string): GitCommit[] {
    const commits: GitCommit[] = [];
    const lines = output.split('\n').filter(line => line.trim());

    let currentCommit: Partial<GitCommit> = {};

    for (const line of lines) {
        if (line.startsWith('commit ')) {
            if (currentCommit.sha) {
                commits.push(currentCommit as GitCommit);
            }
            currentCommit = { sha: line.slice(7) };
        } else if (line.startsWith('Author: ')) {
            const match = line.match(/Author: (.+) <(.+)>/);
            if (match) {
                currentCommit.author = match[1];
                currentCommit.email = match[2];
            }
        } else if (line.startsWith('Date: ')) {
            currentCommit.date = new Date(line.slice(6).trim()).getTime();
        } else if (line.startsWith('    ')) {
            currentCommit.message = (currentCommit.message || '') + line.slice(4) + '\n';
        }
    }

    if (currentCommit.sha) {
        commits.push(currentCommit as GitCommit);
    }

    return commits;
}

// 解析 git blame 输出
export function parseGitBlame(output: string): BlameEntry[] {
    const entries: BlameEntry[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
        if (!line.trim()) continue;

        const match = line.match(/^(\^?[0-9a-f]+)\s+(\d+)\s+(\d+)(\s+(\d+))?/);
        if (match) {
            entries.push({
                sha: match[1].startsWith('^') ? match[1].slice(1) : match[1],
                line: parseInt(match[2]),
                originLine: parseInt(match[3]),
                group: match[5] ? parseInt(match[5]) : undefined
            });
        }
    }

    return entries;
}

interface GitCommit {
    sha: string;
    author: string;
    email: string;
    date: number;
    message: string;
    parents?: string[];
}

interface BlameEntry {
    sha: string;
    line: number;
    originLine: number;
    group?: number;
}
```

### 6.3 Git Graph 数据获取

```typescript
export async function getGitGraph(
    executor: GitExecutor,
    repoPath: string,
    options?: {
        limit?: number;
        includeStats?: boolean;
        branches?: string[];
    }
): Promise<GitGraph> {
    const args = [
        'log',
        '--graph',
        '--pretty=format:%H|%h|%an|%ae|%at|%s|%P|%D',
        '--decorate=full',
        options?.limit ? `--max-count=${options.limit}` : ''
    ];

    if (options?.branches?.length) {
        args.push(...options.branches);
    } else {
        args.push('--all');
    }

    const result = await executor.execute(args, { cwd: repoPath });
    return parseGitGraphOutput(result.stdout);
}

function parseGitGraphOutput(output: string): GitGraph {
    const commits: GitGraphCommit[] = [];
    const lines = output.split('\n').filter(line => line.includes('|'));

    for (const line of lines) {
        const parts = line.split('|');
        const [sha, shortSha, author, email, timestamp, message, parents, refs] = parts;

        commits.push({
            sha,
            shortSha,
            author,
            email,
            date: parseInt(timestamp) * 1000,
            message,
            parents: parents ? parents.split(' ') : [],
            refs: refs ? parseRefs(refs) : [],
            graphLine: line.split(' ')[0] // 提取图形部分
        });
    }

    return { commits, rawOutput: output };
}

function parseRefs(refsString: string): GitRef[] {
    const refs: GitRef[] = [];
    const parts = refsString.split(', ').map(s => s.trim());

    for (const part of parts) {
        if (part.startsWith('HEAD -> ')) {
            refs.push({ type: 'HEAD', name: part.slice(9) });
        } else if (part.startsWith('tag: ')) {
            refs.push({ type: 'tag', name: part.slice(5) });
        } else if (part.includes('/')) {
            refs.push({ type: 'branch', name: part });
        }
    }

    return refs;
}

interface GitGraph {
    commits: GitGraphCommit[];
    rawOutput: string;
}

interface GitGraphCommit {
    sha: string;
    shortSha: string;
    author: string;
    email: string;
    date: number;
    message: string;
    parents: string[];
    refs: GitRef[];
    graphLine: string;
}

interface GitRef {
    type: 'HEAD' | 'branch' | 'tag' | 'remote';
    name: string;
}
```

---

## 7. 状态管理与缓存

### 7.1 配置系统

```typescript
import * as vscode from 'vscode';

interface GitLensConfig {
    blame: {
        enabled: boolean;
        format: string;
    };
    graph: {
        layout: 'editor' | 'panel';
        limit: number;
    };
    views: {
        commits: {
            enabled: boolean;
        };
    };
}

const defaultConfig: GitLensConfig = {
    blame: {
        enabled: true,
        format: '${author}, ${ago}'
    },
    graph: {
        layout: 'panel',
        limit: 1000
    },
    views: {
        commits: {
            enabled: true
        }
    }
};

export class Configuration {
    private _onDidChange = new vscode.EventEmitter<ConfigurationChangeEvent>();
    readonly onDidChange = this._onDidChange.event;

    constructor() {
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('gitlens')) {
                this._onDidChange.fire({
                    key: e.affectsConfiguration('gitlens') ? 'gitlens' : undefined
                });
            }
        });
    }

    get<K extends keyof GitLensConfig>(section: K): GitLensConfig[K] {
        const config = vscode.workspace.getConfiguration('gitlens');
        return config.get(section, defaultConfig[section]);
    }

    update<K extends keyof GitLensConfig>(
        section: K,
        value: GitLensConfig[K],
        target?: vscode.ConfigurationTarget
    ): Thenable<void> {
        const config = vscode.workspace.getConfiguration('gitlens');
        return config.update(section, value, target);
    }
}

interface ConfigurationChangeEvent {
    key?: string;
}
```

### 7.2 存储系统

```typescript
import * as vscode from 'vscode';

export class Storage {
    constructor(private readonly context: vscode.ExtensionContext) {}

    get<T>(key: string, defaultValue?: T): T {
        return this.context.globalState.get(key, defaultValue!);
    }

    async set<T>(key: string, value: T): Promise<void> {
        await this.context.globalState.update(key, value);
    }

    getWorkspace<T>(key: string, defaultValue?: T): T {
        return this.context.workspaceState.get(key, defaultValue!);
    }

    async setWorkspace<T>(key: string, value: T): Promise<void> {
        await this.context.workspaceState.update(key, value);
    }

    async delete(key: string): Promise<void> {
        await this.context.globalState.update(key, undefined);
    }
}
```

### 7.3 事件总线

```typescript
type EventType =
    | 'repository:opened'
    | 'repository:closed'
    | 'branch:changed'
    | 'commit:selected'
    | 'graph:refreshed';

interface EventMap {
    'repository:opened': { repoPath: string };
    'repository:closed': { repoPath: string };
    'branch:changed': { repoPath: string; branch: string };
    'commit:selected': { sha: string };
    'graph:refreshed': { repoPath: string };
}

export class EventBus {
    private _listeners = new Map<EventType, Set<Function>>();

    on<T extends EventType>(
        type: T,
        listener: (data: EventMap[T]) => void
    ): vscode.Disposable {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, new Set());
        }
        this._listeners.get(type)!.add(listener);

        return {
            dispose: () => {
                this._listeners.get(type)?.delete(listener);
            }
        };
    }

    emit<T extends EventType>(type: T, data: EventMap[T]): void {
        const listeners = this._listeners.get(type);
        if (listeners) {
            listeners.forEach(listener => listener(data));
        }
    }
}
```

---

## 8. 无障碍功能要求

### 8.1 WCAG 2.1 AA 合规性

```html
<!-- 语义化 HTML -->
<main role="main" aria-label="Commit Graph">
    <div role="tree" aria-label="Commit History">
        <div role="treeitem" aria-level="1" aria-expanded="false" tabindex="0">
            <span class="commit-graph">* </span>
            <span class="commit-message">Fix bug</span>
            <span class="commit-author">John Doe</span>
        </div>
    </div>
</main>

<!-- 动态内容更新通知 -->
<div aria-live="polite" aria-atomic="true" id="status">
    Loading commits...
</div>

<!-- 键盘导航 -->
<script>
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowDown':
            focusNextCommit();
            e.preventDefault();
            break;
        case 'ArrowUp':
            focusPreviousCommit();
            e.preventDefault();
            break;
        case 'Enter':
        case ' ':
            activateFocusedCommit();
            e.preventDefault();
            break;
        case 'Escape':
            clearSelection();
            e.preventDefault();
            break;
    }
});
</script>
```

### 8.2 焦点管理

```typescript
// 焦点陷阱实现
class FocusTrap {
    private _focusableElements: HTMLElement[] = [];
    private _firstFocusable: HTMLElement | null = null;
    private _lastFocusable: HTMLElement | null = null;

    constructor(private container: HTMLElement) {}

    activate(): void {
        this._focusableElements = Array.from(
            this.container.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        );
        this._firstFocusable = this._focusableElements[0];
        this._lastFocusable = this._focusableElements[this._focusableElements.length - 1];

        this._firstFocusable?.focus();

        this.container.addEventListener('keydown', this._handleKeydown);
    }

    deactivate(): void {
        this.container.removeEventListener('keydown', this._handleKeydown);
    }

    private _handleKeydown = (e: KeyboardEvent): void => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === this._firstFocusable) {
                this._lastFocusable?.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === this._lastFocusable) {
                this._firstFocusable?.focus();
                e.preventDefault();
            }
        }
    };
}
```

### 8.3 颜色对比度

```css
/* 使用 VS Code 主题颜色变量 */
.commit-message {
    color: var(--vscode-foreground); /* 对比度 ≥ 4.5:1 */
}

.commit-author {
    color: var(--vscode-descriptionForeground);
}

.commit-selected {
    background-color: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
}

/* 焦点指示器 */
.commit:focus {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: -2px;
}
```

---

## 9. 常见问题与解决方案

### 9.1 Webview 不显示

**问题：** Webview 面板创建后显示空白

**解决方案：**
1. 检查 CSP 配置是否正确
2. 确保脚本 URI 使用 `webview.asWebviewUri()`
3. 添加 nonce 到所有 inline script
4. 检查 DevTools 控制台错误

```typescript
// 正确的 CSP 配置
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               style-src ${webview.cspSource} 'unsafe-inline';
               script-src 'nonce-${nonce}';">
```

### 9.2 Git 命令执行失败

**问题：** Git 命令返回 "command not found"

**解决方案：**
1. 使用绝对路径查找 Git
2. 从 VS Code 内置 Git 扩展获取路径
3. 添加 Git 到系统 PATH

```typescript
async function findGit(): Promise<string> {
    // 尝试常见路径
    const commonPaths = [
        'git',
        '/usr/bin/git',
        '/usr/local/bin/git',
        'C:\\Program Files\\Git\\cmd\\git.exe'
    ];

    for (const path of commonPaths) {
        try {
            await execAsync(`${path} --version`);
            return path;
        } catch {}
    }

    // 尝试从 VS Code Git 扩展获取
    const gitExt = vscode.extensions.getExtension('vscode.git');
    if (gitExt) {
        const gitApi = await gitExt.activate();
        return gitApi.git.path;
    }

    throw new Error('Git not found');
}
```

### 9.3 IPC 通信超时

**问题：** Webview 和 Extension 通信超时

**解决方案：**
1. 确保 Webview 发送 'ready' 消息
2. 检查消息格式是否匹配协议
3. 添加超时重试机制

```typescript
// Webview 端
const vscode = acquireVsCodeApi();

// 确保在 DOM 加载后发送 ready
window.addEventListener('load', () => {
    vscode.postMessage({ type: 'ready' });
});

// Extension 端
private _readyPromise: Promise<void>;

constructor() {
    this._readyPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Webview ready timeout'));
        }, 10000);

        this.webview.onDidReceiveMessage(message => {
            if (message.type === 'ready') {
                clearTimeout(timeout);
                resolve();
            }
        });
    });
}

async sendMessage(message: any): Promise<void> {
    await this._readyPromise;
    this.webview.postMessage(message);
}
```

### 9.4 内存泄漏

**问题：** 长时间使用后扩展变慢

**解决方案：**
1. 正确清理 Disposable
2. 限制缓存大小
3. 使用 WeakMap 存储实例相关数据

```typescript
// 正确清理
export class MyService implements vscode.Disposable {
    private _disposables: vscode.Disposable[] = [];

    constructor() {
        this._disposables.push(
            vscode.commands.registerCommand(...),
            vscode.workspace.onDidChangeConfiguration(...)
        );
    }

    dispose(): void {
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}

// 限制缓存
class LimitedCache<K, V> {
    private _cache = new Map<K, V>();
    private _maxSize: number;

    constructor(maxSize: number = 100) {
        this._maxSize = maxSize;
    }

    set(key: K, value: V): void {
        if (this._cache.size >= this._maxSize) {
            const firstKey = this._cache.keys().next().value;
            this._cache.delete(firstKey);
        }
        this._cache.set(key, value);
    }
}
```

---

## 10. 附录：核心文件清单

### 10.1 必需文件列表

| 文件 | 路径 | 说明 |
|------|------|------|
| 扩展入口 | `src/extension.ts` | activate/deactivate 函数 |
| 服务容器 | `src/container.ts` | 管理所有服务 |
| Git 服务 | `src/git/gitProviderService.ts` | Git 操作封装 |
| Git 执行器 | `src/git/cliGitProvider.ts` | Git CLI 执行 |
| Webview 控制器 | `src/webviews/webviewsController.ts` | Webview 管理 |
| 视图管理 | `src/views/views.ts` | 树视图注册 |
| 配置 | `src/config.ts` | 配置类型定义 |
| 缓存 | `src/cache/cacheProvider.ts` | 数据缓存 |
| 协议 | `src/webviews/protocol.ts` | IPC 协议定义 |

### 10.2 Webview 文件

| 文件 | 路径 | 说明 |
|------|------|------|
| Graph HTML | `webviews/graph/graph.html` | Graph 页面模板 |
| Graph JS | `webviews/graph/graph.js` | Graph 前端逻辑 |
| Graph CSS | `webviews/graph/graph.css` | Graph 样式 |

### 10.3 资源配置

| 文件 | 路径 | 说明 |
|------|------|------|
| 扩展图标 | `resources/gitlens-icon.svg` | 活动栏图标 |
| 视图图标 | `resources/view-icon-*.svg` | 视图图标 |
| 主题颜色 | `resources/theme-colors.json` | 自定义主题色 |

### 10.4 构建配置

**tsconfig.json：**
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**webpack.config.js（可选）：**
```javascript
const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: {
    extension: './src/extension.ts',
    webviews/graph: './webviews/graph/graph.js'
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: 'ts-loader'
    }]
  }
};
```

---

## 11. 完整示例项目结构

### 11.1 完整目录结构

```
opencode-gitlens/
├── .vscode/
│   ├── launch.json              # 调试配置
│   ├── settings.json            # 工作区设置
│   └── extensions.json          # 推荐扩展
├── src/
│   ├── extension.ts             # 扩展入口
│   ├── deactivate.ts            # 反激活逻辑
│   │
│   ├── container.ts             # 服务容器
│   ├── config.ts                # 配置定义
│   ├── cache.ts                 # 缓存系统
│   │
│   ├── commands/                # 命令实现
│   │   ├── index.ts             # 命令注册入口
│   │   ├── showGraph.ts         # 显示 Graph 命令
│   │   ├── showCommitDetails.ts # 显示提交详情命令
│   │   ├── copySha.ts           # 复制 SHA 命令
│   │   └── ...
│   │
│   ├── git/                     # Git 服务层
│   │   ├── gitProviderService.ts # Git 服务管理
│   │   ├── cliGitProvider.ts    # Git CLI 执行
│   │   ├── gitRepository.ts     # 仓库模型
│   │   ├── parsers/             # Git 输出解析器
│   │   │   ├── logParser.ts     # git log 解析
│   │   │   ├── blameParser.ts   # git blame 解析
│   │   │   └── graphParser.ts   # git graph 解析
│   │   └── models/              # Git 数据模型
│   │       ├── commit.ts        # GitCommit 模型
│   │       ├── branch.ts        # GitBranch 模型
│   │       └── graph.ts         # GitGraph 模型
│   │
│   ├── views/                   # 树视图
│   │   ├── views.ts             # 视图管理
│   │   ├── commitsView.ts       # 提交视图
│   │   ├── branchesView.ts      # 分支视图
│   │   └── providers/           # 数据提供者
│   │       ├── commitsDataProvider.ts
│   │       └── branchesDataProvider.ts
│   │
│   ├── webviews/                # Webview 系统
│   │   ├── webviewsController.ts # Webview 管理
│   │   ├── protocol.ts          # IPC 协议
│   │   ├── ipc/                 # IPC 工具
│   │   │   ├── decorators.ts    # IPC 装饰器
│   │   │   └── handlerRegistry.ts # 处理器注册
│   │   └── graph/               # Graph Webview
│   │       ├── graphWebview.ts  # Webview Provider
│   │       └── registration.ts  # Webview 注册
│   │
│   ├── annotations/             # 注解系统
│   │   ├── blameAnnotation.ts   # Blame 注解
│   │   └── decorationProvider.ts # 装饰提供者
│   │
│   ├── statusbar/               # 状态栏
│   │   └── statusBarController.ts
│   │
│   └── system/                  # 系统工具
│       ├── decorators/          # 装饰器
│       │   ├── gate.ts          # @gate 去重
│       │   ├── memoize.ts       # @memoize 缓存
│       │   └── log.ts           # @log 日志
│       └── utils/               # 工具函数
│           ├── async.ts         # 异步工具
│           └── collection.ts    # 集合工具
│
├── webviews/                    # Webview 静态资源
│   ├── graph/
│   │   ├── graph.html           # Graph 页面
│   │   ├── graph.ts             # Lit 组件
│   │   └── graph.css            # 样式
│   └── commitDetails/
│       ├── commitDetails.html
│       └── commitDetails.ts
│
├── resources/                   # 资源文件
│   ├── icons/
│   │   ├── gitlens-icon.svg
│   │   ├── view-icon-commits.svg
│   │   └── view-icon-branches.svg
│   └── images/
│       └── logo.png
│
├── package.json                 # 扩展配置
├── tsconfig.json                # TypeScript 配置
├── webpack.config.js            # Webpack 配置
├── .eslintrc.json               # ESLint 配置
├── .prettierrc                  # Prettier 配置
├── .gitignore                   # Git 忽略
└── README.md                    # 说明文档
```

### 11.2 package.json 完整配置

```json
{
  "name": "opencode-gitlens",
  "displayName": "OpenCode GitLens",
  "description": "GitLens for OpenCode - Git integration and visualization",
  "version": "1.0.0",
  "publisher": "your-publisher-id",
  "license": "MIT",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Other",
    "SCM Providers"
  ],
  "keywords": [
    "git",
    "gitlens",
    "graph",
    "blame",
    "history"
  ],
  "icon": "resources/icons/gitlens-icon.png",
  "galleryBanner": {
    "color": "#4444cc",
    "theme": "dark"
  },
  "activationEvents": [
    "onStartupFinished",
    "onFileSystem:git",
    "onWebviewPanel:gitlens.graph"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "configuration": {
      "title": "GitLens",
      "properties": {
        "gitlens.graph.limit": {
          "type": "number",
          "default": 1000,
          "description": "Maximum number of commits to show in the graph"
        },
        "gitlens.blame.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable inline blame annotations"
        },
        "gitlens.views.commits.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable commits view"
        }
      }
    },
    "commands": [
      {
        "command": "gitlens.showGraph",
        "title": "Show Commit Graph",
        "icon": "$(gitlens-graph)",
        "category": "GitLens"
      },
      {
        "command": "gitlens.showCommitDetails",
        "title": "Show Commit Details",
        "category": "GitLens"
      },
      {
        "command": "gitlens.copySha",
        "title": "Copy SHA",
        "category": "GitLens"
      },
      {
        "command": "gitlens.refreshViews",
        "title": "Refresh Views",
        "icon": "$(refresh)",
        "category": "GitLens"
      }
    ],
    "menus": {
      "scm/title": [
        {
          "command": "gitlens.showGraph",
          "group": "navigation",
          "when": "gitlens:enabled"
        }
      ],
      "editor/context": [
        {
          "command": "gitlens.copySha",
          "group": "gitlens",
          "when": "gitlens:hasBlame"
        }
      ],
      "view/title": [
        {
          "command": "gitlens.refreshViews",
          "group": "navigation",
          "when": "view == gitlens.views.commits"
        }
      ]
    },
    "viewsContainers": {
      "activitybar": [
        {
          "id": "gitlens",
          "title": "GitLens",
          "icon": "resources/icons/gitlens-icon.svg"
        }
      ]
    },
    "views": {
      "gitlens": [
        {
          "id": "gitlens.views.commits",
          "name": "Commits",
          "icon": "resources/icons/view-icon-commits.svg",
          "contextualTitle": "GitLens Commits",
          "when": "gitlens.views.commits.enabled"
        },
        {
          "id": "gitlens.views.branches",
          "name": "Branches",
          "icon": "resources/icons/view-icon-branches.svg",
          "contextualTitle": "GitLens Branches"
        }
      ]
    },
    "keybindings": [
      {
        "command": "gitlens.showGraph",
        "key": "ctrl+shift+g",
        "mac": "cmd+shift+g",
        "when": "gitlens:enabled"
      }
    ]
  },
  "scripts": {
    "compile": "webpack --mode development",
    "watch": "webpack --mode development --watch",
    "package": "webpack --mode production",
    "lint": "eslint src --ext ts",
    "test": "vscode-test"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.85.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "ts-loader": "^9.0.0",
    "typescript": "^5.0.0",
    "webpack": "^5.0.0",
    "webpack-cli": "^5.0.0",
    "@vscode/test-cli": "^0.0.4"
  },
  "dependencies": {
    "vscode-uri": "^3.0.0"
  }
}
```

### 11.3 tsconfig.json 完整配置

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedParameters": true,
    "noUnusedLocals": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@commands/*": ["src/commands/*"],
      "@git/*": ["src/git/*"],
      "@views/*": ["src/views/*"],
      "@webviews/*": ["src/webviews/*"],
      "@system/*": ["src/system/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests",
    "webviews"
  ]
}
```

### 11.4 开发路线图

**第一阶段（2-3 周）：核心功能**
- [ ] 项目骨架搭建
- [ ] Git 服务层实现（CLI 执行、解析器）
- [ ] 基本命令实现（showGraph, copySha）
- [ ] 简单 Webview 面板

**第二阶段（2-3 周）：视图系统**
- [ ] 树视图实现（Commits, Branches）
- [ ] 数据提供者实现
- [ ] 刷新机制
- [ ] 上下文菜单

**第三阶段（3-4 周）：Graph 可视化**
- [ ] Webview IPC 通信
- [ ] Graph 数据获取和解析
- [ ] 前端渲染（Canvas 或 SVG）
- [ ] 交互功能（选择、滚动、搜索）

**第四阶段（2-3 周）：注解系统**
- [ ] Blame 注解（行内）
- [ ] CodeLens 实现
- [ ] Hover 提示
- [ ] 状态栏集成

**第五阶段（1-2 周）：优化和测试**
- [ ] 性能优化（缓存、防抖）
- [ ] 错误处理
- [ ] 单元测试
- [ ] 文档完善

---

## 总结

本文档详细介绍了将 GitLens 移植到 OpenCode 平台的完整流程。

### 核心要点回顾

1. **架构理解**：GitLens 采用五层架构（表示层、应用层、领域层、基础设施层、环境层）

2. **关键技术**：
   - 依赖注入（Container 服务容器）
   - IPC 通信（Webview ↔ Extension Host）
   - 子提供者模式（模块化 Git 功能）
   - 装饰器系统（@gate, @memoize, @log）

3. **移植步骤**：
   - 创建扩展骨架
   - 实现 Git 服务层
   - 实现 Webview 系统
   - 实现视图和命令
   - 实现状态管理

4. **注意事项**：
   - 遵循 VS Code Extension API 规范
   - 正确配置 Webview CSP（Content Security Policy）
   - 实现完善的错误处理
   - 满足无障碍功能要求（WCAG 2.1 AA）
   - 正确清理资源避免内存泄漏

### 后续资源

- **GitLens 源码**: https://github.com/eamodio/vscode-gitlens
- **VS Code Extension API**: https://code.visualstudio.com/api
- **Webview 指南**: https://code.visualstudio.com/api/extension-guides/webview

---

**文档版本：** 2.0（完整详细版）
**最后更新：** 2026-04-17
**维护者：** OpenCode Team

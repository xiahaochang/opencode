# OpenCode 项目上下文

## 项目概述

**OpenCode** 是一个开源的 AI 编码代理工具，类似于 Claude Code，但具有以下特点：
- 100% 开源
- 不绑定任何特定 AI 提供商（支持 Claude、OpenAI、Google、本地模型等）
- 内置 LSP 支持
- 专注于 TUI（终端用户界面）
- 客户端/服务器架构

### 项目架构

这是一个 **monorepo** 项目，使用 Bun workspaces 和 Turbo 管理多个包：

| 包名 | 路径 | 说明 |
|------|------|------|
| `@opencode-ai/app` | `packages/app` | Web 应用 - SolidJS 前端（Tauri 桌面应用的基础） |
| `@opencode-ai/ui` | `packages/ui` | 共享 UI 组件库（SolidJS + TailwindCSS） |
| `opencode` | `packages/opencode` | 核心业务逻辑和服务器（CLI、TUI） |
| `@opencode-ai/desktop` | `packages/desktop` | Tauri 桌面应用 |
| `@opencode-ai/plugin` | `packages/plugin` | 插件系统 |
| `@opencode-ai/sdk` | `packages/sdk` | JavaScript SDK |
| `@opencode-ai/util` | `packages/util` | 共享工具 |
| `@opencode-ai/console` | `packages/console` | 管理控制台 |
| `@opencode-ai/web` | `packages/web` | 网站/落地页 |

## 技术栈

### 核心语言
- **TypeScript**（严格模式）
- **SolidJS**（前端框架）
- **Bun**（运行时和包管理器，版本 1.3+）

### 前端
- **SolidJS 1.9** - 响应式 UI 框架
- **TailwindCSS 4** - 原子化 CSS
- **Kobalte** - 无头 UI 组件库
- **Vite 7** - 构建工具
- **Tauri** - 桌面应用打包

### 后端
- **Effect** - 类型安全的效果系统
- **Hono** - Web 框架
- **Zod** - 运行时类型验证

### 测试
- **Happy-Dom** - 轻量级 DOM 环境
- **Playwright** - E2E 测试
- **Bun test** - 单元测试运行器

## 构建与运行

### 安装依赖
```bash
bun install
```

### 开发命令

| 命令 | 说明 |
|------|------|
| `bun dev` | 启动核心 CLI 开发模式 |
| `bun dev:web` | 启动 Web 应用开发服务器 |
| `bun dev:desktop` | 启动 Tauri 桌面应用 |
| `bun dev:console` | 启动管理控制台 |
| `bun dev:storybook` | 启动 Storybook（组件文档） |

### 运行 Web UI 开发
```bash
# 1. 首先启动 OpenCode 服务器
bun dev serve

# 2. 在另一个终端启动 Web 应用
bun run --cwd packages/app dev
```

### 运行桌面应用
```bash
bun run --cwd packages/desktop tauri dev
```

### 类型检查
```bash
# 根目录（所有包）
bun typecheck

# 单独包
cd packages/app && bun typecheck
cd packages/ui && bun typecheck
```

### 测试
```bash
# 在包目录下运行
cd packages/app && bun test
cd packages/opencode && bun test
```

### 构建
```bash
# 构建桌面应用
bun run --cwd packages/desktop tauri build

# 构建本地可执行文件
./packages/opencode/script/build.ts --single
```

## 代码规范

### 命名约定
- **优先单字名称**：`pid`、`cfg`、`err`、`opts`、`dir`
- **仅在必要时使用多字**：避免无意义的复合词
- **避免 camelCase 组合**：如果有更短的替代方案

```typescript
// 好
const foo = 1
function journal(dir: string) {}

// 避免
const fooBar = 1
function prepareJournal(dir: string) {}
```

### 代码风格
- **单函数逻辑**：除非可复用，否则保持逻辑在一个函数内
- **避免 try/catch**：优先使用 `.catch(...)` 
- **避免 `any` 类型**：使用精确类型
- **优先 `const`**：避免 `let`，使用三元或早期返回
- **避免 `else`**：使用早期返回
- **避免不必要的解构**：使用点号访问保持上下文
- **内联单使用值**：减少变量数量

```typescript
// 好
function foo() {
  if (condition) return 1
  return 2
}

// 避免
function foo() {
  if (condition) return 1
  else return 2
}
```

### Schema 定义（Drizzle）
使用 snake_case 字段名，不需要重新定义为字符串：
```typescript
// 好
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
})
```

### 导入规范
- **单引号**：所有字符串使用单引号
- **无分号**：语句末尾不加分号（除必要情况）
- **打印宽度**：120 字符

## UI 组件开发

### 组件位置
所有 UI 组件位于 `packages/ui/src/components/`

### 国际化
- 英文文件：`packages/ui/src/i18n/en.ts`
- 中文文件：`packages/ui/src/i18n/zh.ts`
- 键名格式：`ui.common.xxx`、`ui.xxx.yyy`

### 样式
- 使用 **TailwindCSS 4** 原子类
- 主题通过 CSS 变量和 Tailwind 配置
- 组件使用 `data-component` 属性标识

### 状态管理
- **SolidJS Signals**：`createSignal`、`createMemo`
- **持久化**：`@solid-primitives/storage` 的 `makePersisted`
- **Store**：`solid-js/store` 的 `createStore`（复杂对象）

## 提交规范

### PR 标题格式
遵循 Conventional Commits：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(app): add dark mode` |
| `fix` | 修复 bug | `fix: resolve crash on startup` |
| `docs` | 文档修改 | `docs: update contributing guide` |
| `refactor` | 代码重构 | `refactor(ui): simplify button logic` |
| `chore` | 维护任务 | `chore: bump dependencies` |
| `test` | 测试相关 | `test: add unit tests for auth` |

### PR 要求
- **必须链接 issue**：使用 `Fixes #123` 或 `Closes #123`
- **保持小而专注**：避免大型 PR
- **说明验证方法**：如何测试和验证
- **UI 变化需要截图**：包含前后对比

## 文件结构关键文件

| 文件 | 说明 |
|------|------|
| `AGENTS.md` | AI 代理代码规范 |
| `CONTRIBUTING.md` | 贡献指南（必读） |
| `turbo.json` | Turbo 任务配置 |
| `bunfig.toml` | Bun 配置 |
| `packages/app/src/pages/` | 页面路由 |
| `packages/ui/src/components/` | UI 组件 |
| `packages/ui/src/i18n/` | 国际化文件 |

## 注意事项

1. **不要从根目录运行测试**：`test` 脚本在根目录被禁用
2. **使用 `bun typecheck` 而非 `tsc`**：在包目录内运行
3. **默认分支是 `dev`**：不是 `main`
4. **修改 API/SDK 后运行生成脚本**：`./script/generate.ts`
5. **UI/核心功能需要设计审查**：在实现之前与核心团队确认

## 调试建议

- **首选方法**：`bun run --inspect=<url> dev ...`
- **TUI + 服务端断点**：使用 `bun dev spawn`
- **Bun 调试有局限**：断点映射可能不准确
- **导出 BUN_OPTIONS**：`export BUN_OPTIONS=--inspect=ws://localhost:6499/`

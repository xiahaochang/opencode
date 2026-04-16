# GRAPH 功能开发文档索引

> **当前阶段**：✅ 设计方案已完成 | 🚀 准备进入实施阶段

---

## 📚 文档阅读顺序

| 序号 | 文档 | 状态 | 说明 |
|------|------|------|------|
| 1 | [01-existing-features.md](./01-existing-features.md) | ✅ 已完成 | Session 变更面板现有功能分析 |
| 2 | [02-vscode-git-graph-analysis.md](./02-vscode-git-graph-analysis.md) | ✅ 已完成 | VSCode Git Graph 功能分析 |
| 3 | [03-new-feature-requirements.md](./03-new-feature-requirements.md) | ✅ 已完成 | 新功能需求与实现方案 |
| 4 | [04-graph-page-design.md](./04-graph-page-design.md) | ✅ 已完成 | GRAPH 页面详细设计方案 |
| 5 | [05-graph-implementation-todo.md](./05-graph-implementation-todo.md) | 🚀 **执行中** | 实现 TODO List（下一步执行） |

---

## 📋 快速导航

### 阶段 1：需求分析
- 阅读 [01-existing-features.md](./01-existing-features.md) 了解现有代码结构
- 阅读 [02-vscode-git-graph-analysis.md](./02-vscode-git-graph-analysis.md) 了解参考产品
- 阅读 [03-new-feature-requirements.md](./03-new-feature-requirements.md) 明确功能需求

### 阶段 2：设计方案
- 阅读 [04-graph-page-design.md](./04-graph-page-design.md) 查看完整设计方案

### 阶段 3：实施开发（当前）
- 执行 [05-graph-implementation-todo.md](./05-graph-implementation-todo.md) 中的 TODO List

---

## 🎯 下一步行动

打开 [05-graph-implementation-todo.md](./05-graph-implementation-todo.md) 开始执行 Phase 1：

```
Phase 1 - 类型定义与 API 设计
├── T1.1 后端类型定义
├── T1.2 前端类型定义
└── T1.3 API 端点设计
```

---

## 📁 文件说明

| 文件 | 内容摘要 |
|------|----------|
| **01-existing-features.md** | 分析现有 session 页面变更面板的类型定义、状态管理、核心函数、数据流向 |
| **02-vscode-git-graph-analysis.md** | 分析 VSCode Git Graph 的 UI 布局、数据结构、渲染算法、交互功能 |
| **03-new-feature-requirements.md** | Phase 1 基础框架（已完成）+ Phase 2 可视化功能（待实现）的需求说明 |
| **04-graph-page-design.md** | 完整的页面设计：组件架构、数据类型、API 设计、核心算法、实现计划 |
| **05-graph-implementation-todo.md** | 详细的 TODO List，包含 7 个 Phase、文件清单、MVP 范围、参考实现 |

---

## 🏗️ 架构概览

```
OpenCode 架构:
┌─────────────────────────────────────────────────────────────────┐
│                        服务器代码 (opencode)                     │
│  packages/opencode/src/                                         │
│  - Hono HTTP 服务器                                              │
│  - Git 操作封装 (git2)                                          │
│  - VCS 模块                                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   CLI / TUI     │ │   Web App       │ │  Desktop        │
│  直接调用       │ │  HTTP 调用      │ │  HTTP 调用      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 📌 关键决策

1. **后端技术栈**：TypeScript + Effect（不是 Rust）
2. **Git 访问**：通过 git2 的 TS 绑定或调用 git 命令
3. **泳道计算**：前端 TypeScript 实现（与 VSCode 相同）
4. **渲染方案**：SVG 连线 + DOM 提交信息
5. **虚拟滚动**：使用 @tanstack/solid-virtual

---

## 🔗 相关链接

- 项目根目录：`d:\Git_Repository\github\ai-project\opencode`
- 主要代码位置：
  - 后端：`packages/opencode/src/project/`
  - 前端：`packages/app/src/pages/`
  - UI 组件：`packages/ui/src/components/`

---

*最后更新：2026 年 4 月 16 日*

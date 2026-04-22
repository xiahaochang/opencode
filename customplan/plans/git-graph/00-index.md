# GRAPH 功能开发文档索引

> **当前状态**：✅ 已完成（MVP 版本）|  功能已上线

---

## 📚 文档阅读顺序

| 序号 | 文档 | 状态 | 说明 |
|------|------|------|------|
| 1 | [01-existing-features.md](./01-existing-features.md) | ✅ 已完成 | Session 变更面板现有功能分析 |
| 2 | [02-vscode-git-graph-analysis.md](./02-vscode-git-graph-analysis.md) | ✅ 已完成 | VSCode Git Graph 功能分析 |
| 3 | [03-new-feature-requirements.md](./03-new-feature-requirements.md) | ✅ 已完成 | 新功能需求与实现方案 |
| 4 | [04-graph-page-design.md](./04-graph-page-design.md) | ✅ 已完成 | GRAPH 页面详细设计方案 |
| 5 | [05-graph-implementation-todo.md](./05-graph-implementation-todo.md) | ✅ 已完成 | 实现 TODO List |
| 6 | [06-verification-report.md](./06-verification-report.md) | ✅ 已完成 | 验证报告 |
| 7 | [07-implementation-summary.md](./07-implementation-summary.md) | ✅ 已完成 | 实现总结 |
| 8 | [08-troubleshooting.md](./08-troubleshooting.md) | ✅ 新增 | 问题总结与排查指南 |

---

## 📋 快速导航

### 阶段 1：需求分析 ✅
- 阅读 [01-existing-features.md](./01-existing-features.md) 了解现有代码结构
- 阅读 [02-vscode-git-graph-analysis.md](./02-vscode-git-graph-analysis.md) 了解参考产品
- 阅读 [03-new-feature-requirements.md](./03-new-feature-requirements.md) 明确功能需求

### 阶段 2：设计方案 ✅
- 阅读 [04-graph-page-design.md](./04-graph-page-design.md) 查看完整设计方案

### 阶段 3：实施开发 ✅
- 查看 [05-graph-implementation-todo.md](./05-graph-implementation-todo.md) 了解实现清单
- 查看 [07-implementation-summary.md](./07-implementation-summary.md) 查看实现总结

### 阶段 4：验证测试 ✅
- 阅读 [06-verification-report.md](./06-verification-report.md) 查看验证结果

---

## 🎯 已实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| GRAPH 选项 | ✅ | 下拉菜单显示 GRAPH |
| 提交历史列表 | ✅ | 垂直列表展示（时间倒序） |
| 分支颜色标识 | ✅ | 不同泳道使用不同颜色 |
| 分支标签显示 | ✅ | local/remote 标签 |
| 提交信息展示 | ✅ | 标题、作者、相对时间 |
| 悬停预览 | ✅ | 浮层预览 |
| 详情面板 | ✅ | 点击显示详情 |
| 刷新功能 | ✅ | 刷新按钮 |
| 视图切换按钮 | ✅ | Tree/List 切换（UI 预留） |

---

## ️ 架构概览

```
OpenCode 架构:
┌─────────────────────────────────────────────────────────────────┐
│                        服务器代码 (opencode)                     │
│  packages/opencode/src/                                         │
│  - Hono HTTP 服务器                                              │
│  - Git 操作封装 (git2)                                          │
│  - VCS 模块                                                      │
│  - 新增：GET /git/graph 路由                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   CLI / TUI     │ │   Web App       │ │  Desktop        │
│  直接调用       │ │  HTTP 调用      │ │  HTTP 调用      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GitGraph 组件 (UI)                           │
│  packages/ui/src/components/git-graph/                          │
│  - git-graph.tsx (主组件)                                        │
│  - commit-row.tsx (提交行)                                       │
│  - hover-preview.tsx (悬停预览)                                  │
│  - commit-detail.tsx (详情面板)                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐛 问题总结

| 编号 | 问题 | 状态 | 说明 |
|------|------|------|------|
| 1 | Git 命令输出为空 | ✅ | `--no-optional-locks` 参数无效 |
| 2 | JSON 格式解析失败 | ✅ | 改用 null 分隔符格式 |
| 3 | Electron 401 未授权 | ✅ | 使用 SDK client 认证 |
| 4 | CSS 类未定义 | ✅ | 使用项目 CSS 变量 |
| 5 | 悬停预览位置不对 | ✅ | 使用 Portal 渲染到 body |
| 6 | 滚动加载死循环 | ✅ | `isRestoringScroll` 标记 |
| 7 | 后端 API 不支持分页 | ✅ | 添加 `offset` 参数 |
| 8 | 滚动定位后仍在底部 | ✅ | 修改 `<Show>` 条件 |
| 9 | 数据重复（100% 重复） | ✅ | 重新生成 SDK |
| 10 | 分页性能问题 | ✅ | 使用 `git log --skip` |
| 11 | 滚动位置计算错误 | ✅ | 正确计算 `scrollBottom` |

详见：[08-troubleshooting.md](./08-troubleshooting.md)

---

## 🔗 相关链接

- 项目根目录：`d:\Git_Repository\github\ai-project\opencode`
- 主要代码位置：
  - 后端：`packages/opencode/src/git/index.ts` (log 方法)
  - 后端：`packages/opencode/src/project/vcs.ts` (graph 方法)
  - 前端：`packages/ui/src/components/git-graph/`
  - 集成：`packages/app/src/pages/session.tsx`

---

## 📊 实现总结

**开发时间**: 2026 年 4 月 16 日  
**代码行数**: ~1500 行（新增）  
**修改文件**: 12 个  
**新建文件**: 11 个  

**核心技术**:
- 后端：Effect + git2
- 前端：SolidJS + CSS 变量
- 通信：OpenAPI + SDK 自动生成

**遇到问题**:
1. Git 命令参数错误（`--no-optional-locks`）
2. JSON 格式转义问题
3. Electron Basic Auth 认证
4. CSS 设计系统不匹配

**全部已解决** ✅

---

*最后更新：2026 年 4 月 16 日*

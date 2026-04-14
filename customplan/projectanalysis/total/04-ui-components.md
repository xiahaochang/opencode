# OpenCode UI 组件库包 (ui) 详细分析

## 一、包概览

**包名**: `@opencode-ai/ui`  
**路径**: `packages/ui`  
**功能**: 共享 SolidJS UI 组件库，供 app 和 desktop 使用

### 技术栈

| 技术 | 用途 |
|------|------|
| SolidJS 1.9 | 响应式 UI 框架 |
| TailwindCSS 4 | 原子化 CSS |
| @kobalte/core | 无头 UI 组件库 |
| motion | 动画库 |
| marked + shiki | Markdown 渲染和代码高亮 |
| dompurify | XSS 防护 |
| fuzzysort | 模糊搜索 |

---

## 二、完整目录结构

```
packages/ui/src/
├── custom-elements.d.ts
│
├── assets/
│   ├── audio/                                      # 45 个音频文件
│   │   ├── alert-01.aac  ~  alert-10.aac          # 10 个提醒音效
│   │   ├── bip-bop-01.aac  ~  bip-bop-10.aac      # 10 个 bip-bop 音效
│   │   ├── nope-01.aac  ~  nope-12.aac            # 12 个 nope 音效
│   │   ├── staplebops-01.aac  ~  staplebops-07.aac # 7 个 staplebops 音效
│   │   ├── yup-01.aac  ~  yup-06.aac              # 6 个 yup 音效
│   │
│   ├── favicon/                                    # 11 个 favicon 文件
│   │   ├── apple-touch-icon-v3.png
│   │   ├── apple-touch-icon.png
│   │   ├── favicon-96x96-v3.png
│   │   ├── favicon-96x96.png
│   │   ├── favicon-v3.ico
│   │   ├── favicon-v3.svg
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   ├── site.webmanifest
│   │   ├── web-app-manifest-192x192.png
│   │   └── web-app-manifest-512x512.png
│   │
│   ├── icons/
│   │   ├── app/                                    # 16 个应用图标
│   │   │   ├── android-studio.svg
│   │   │   ├── antigravity.svg
│   │   │   ├── cursor.svg
│   │   │   ├── file-explorer.svg
│   │   │   ├── finder.png
│   │   │   ├── ghostty.svg
│   │   │   ├── iterm2.svg
│   │   │   ├── powershell.svg
│   │   │   ├── sublimetext.svg
│   │   │   ├── terminal.png
│   │   │   ├── textmate.png
│   │   │   ├── vscode.svg
│   │   │   ├── warp.png
│   │   │   ├── xcode.png
│   │   │   ├── zed-dark.svg
│   │   │   └── zed.svg
│   │   │
│   │   ├── file-types/                             # 1089 个文件类型图标
│   │   │   ├── 3d.svg
│   │   │   ├── abap.svg
│   │   │   ├── abc.svg
│   │   │   ├── actionscript.svg
│   │   │   ├── ada.svg
│   │   │   ├── adobe-illustrator.svg
│   │   │   ├── adobe-illustrator_light.svg
│   │   │   ├── adobe-photoshop.svg
│   │   │   ├── adobe-photoshop_light.svg
│   │   │   ├── adobe-swc.svg
│   │   │   ├── adonis.svg
│   │   │   ├── advpl.svg
│   │   │   ├── amplify.svg
│   │   │   ├── android.svg
│   │   │   ├── angular.svg
│   │   │   ├── antlr.svg
│   │   │   ├── apiblueprint.svg
│   │   │   ├── apollo.svg
│   │   │   ├── applescript.svg
│   │   │   ├── apps-script.svg
│   │   │   ├── appveyor.svg
│   │   │   ├── architecture.svg
│   │   │   ├── arduino.svg
│   │   │   ├── asciidoc.svg
│   │   │   ├── assembly.svg
│   │   │   ├── astro-config.svg
│   │   │   ├── astro.svg
│   │   │   ├── astyle.svg
│   │   │   ├── audio.svg
│   │   │   ├── aurelia.svg
│   │   │   ├── authors.svg
│   │   │   ├── auto.svg
│   │   │   ├── autohotkey.svg
│   │   │   ├── autoit.svg
│   │   │   ├── auto_light.svg
│   │   │   ├── azure-pipelines.svg
│   │   │   ├── azure.svg
│   │   │   ├── babel.svg
│   │   │   ├── ballerina.svg
│   │   │   ├── bazel.svg
│   │   │   ├── bbx.svg
│   │   │   ├── beancount.svg
│   │   │   ├── bench-js.svg
│   │   │   ├── bench-jsx.svg
│   │   │   ├── bench-ts.svg
│   │   │   ├── bibliography.svg
│   │   │   ├── bibtex-style.svg
│   │   │   ├── bicep.svg
│   │   │   ├── biome.svg
│   │   │   ├── bitbucket.svg
│   │   │   ├── bithound.svg
│   │   │   ├── blender.svg
│   │   │   ├── blink.svg
│   │   │   ├── blink_light.svg
│   │   │   ├── blitz.svg
│   │   │   ├── bower.svg
│   │   │   ├── brainfuck.svg
│   │   │   ├── browserlist.svg
│   │   │   ├── browserlist_light.svg
│   │   │   ├── bruno.svg
│   │   │   ├── buck.svg
│   │   │   ├── bucklescript.svg
│   │   │   ├── buildkite.svg
│   │   │   ├── bun.svg
│   │   │   ├── bun_light.svg
│   │   │   ├── c.svg
│   │   │   ├── c3.svg
│   │   │   ├── cabal.svg
│   │   │   ├── caddy.svg
│   │   │   ├── cadence.svg
│   │   │   ├── cairo.svg
│   │   │   ├── cake.svg
│   │   │   ├── capacitor.svg
│   │   │   ├── capnp.svg
│   │   │   ├── cbx.svg
│   │   │   ├── cds.svg
│   │   │   ├── certificate.svg
│   │   │   ├── changelog.svg
│   │   │   ├── chess.svg
│   │   │   ├── chess_light.svg
│   │   │   ├── chrome.svg
│   │   │   ├── circleci.svg
│   │   │   ├── circleci_light.svg
│   │   │   ├── citation.svg
│   │   │   ├── clangd.svg
│   │   │   ├── claude.svg
│   │   │   ├── cline.svg
│   │   │   ├── clojure.svg
│   │   │   ├── cloudfoundry.svg
│   │   │   ├── cmake.svg
│   │   │   ├── coala.svg
│   │   │   ├── cobol.svg
│   │   │   ├── coconut.svg
│   │   │   ├── code-climate.svg
│   │   │   ├── code-climate_light.svg
│   │   │   ├── codecov.svg
│   │   │   ├── codeowners.svg
│   │   │   ├── coderabbit-ai.svg
│   │   │   ├── coffee.svg
│   │   │   ├── coldfusion.svg
│   │   │   └── ... (共 1089 个文件，包含所有编程语言、框架、工具图标)
│   │   │
│   │   └── provider/                               # 104 个提供商图标
│   │       ├── 302ai.svg
│   │       ├── abacus.svg
│   │       ├── aihubmix.svg
│   │       ├── alibaba-cn.svg
│   │       ├── alibaba-coding-plan-cn.svg
│   │       ├── alibaba-coding-plan.svg
│   │       ├── alibaba.svg
│   │       ├── amazon-bedrock.svg
│   │       ├── anthropic.svg
│   │       ├── azure-cognitive-services.svg
│   │       ├── azure.svg
│   │       ├── bailing.svg
│   │       ├── baseten.svg
│   │       ├── berget.svg
│   │       ├── cerebras.svg
│   │       ├── chutes.svg
│   │       ├── clarifai.svg
│   │       ├── cloudferro-sherlock.svg
│   │       ├── cloudflare-ai-gateway.svg
│   │       ├── cloudflare-workers-ai.svg
│   │       ├── cohere.svg
│   │       ├── cortecs.svg
│   │       ├── deepinfra.svg
│   │       ├── deepseek.svg
│   │       ├── dinference.svg
│   │       ├── drun.svg
│   │       ├── evroc.svg
│   │       ├── fastrouter.svg
│   │       ├── fireworks-ai.svg
│   │       ├── firmware.svg
│   │       ├── friendli.svg
│   │       ├── github-copilot.svg
│   │       ├── github-models.svg
│   │       ├── gitlab.svg
│   │       ├── google-vertex-anthropic.svg
│   │       ├── google-vertex.svg
│   │       ├── google.svg
│   │       ├── groq.svg
│   │       ├── helicone.svg
│   │       ├── huggingface.svg
│   │       ├── iflowcn.svg
│   │       ├── inception.svg
│   │       ├── inference.svg
│   │       ├── io-net.svg
│   │       ├── jiekou.svg
│   │       ├── kilo.svg
│   │       ├── kimi-for-coding.svg
│   │       ├── kuae-cloud-coding-plan.svg
│   │       ├── llama.svg
│   │       ├── lmstudio.svg
│   │       ├── lucidquery.svg
│   │       ├── meganova.svg
│   │       ├── minimax-cn-coding-plan.svg
│   │       ├── minimax-cn.svg
│   │       ├── minimax-coding-plan.svg
│   │       ├── minimax.svg
│   │       ├── mistral.svg
│   │       ├── moark.svg
│   │       ├── modelscope.svg
│   │       ├── moonshotai-cn.svg
│   │       ├── moonshotai.svg
│   │       ├── morph.svg
│   │       ├── nano-gpt.svg
│   │       ├── nebius.svg
│   │       ├── nova.svg
│   │       ├── novita-ai.svg
│   │       ├── nvidia.svg
│   │       ├── ollama-cloud.svg
│   │       ├── openai.svg
│   │       ├── opencode-go.svg
│   │       ├── opencode.svg
│   │       ├── openrouter.svg
│   │       ├── ovhcloud.svg
│   │       ├── perplexity-agent.svg
│   │       ├── perplexity.svg
│   │       ├── poe.svg
│   │       ├── privatemode-ai.svg
│   │       ├── qihang-ai.svg
│   │       ├── qiniu-ai.svg
│   │       ├── requesty.svg
│   │       ├── sap-ai-core.svg
│   │       ├── scaleway.svg
│   │       ├── siliconflow-cn.svg
│   │       ├── siliconflow.svg
│   │       ├── stackit.svg
│   │       ├── stepfun.svg
│   │       ├── submodel.svg
│   │       ├── synthetic.svg
│   │       ├── tencent-coding-plan.svg
│   │       ├── togetherai.svg
│   │       ├── upstage.svg
│   │       ├── v0.svg
│   │       ├── venice.svg
│   │       ├── vercel.svg
│   │       ├── vivgrid.svg
│   │       ├── vultr.svg
│   │       ├── wandb.svg
│   │       ├── xai.svg
│   │       ├── xiaomi.svg
│   │       ├── zai-coding-plan.svg
│   │       ├── zai.svg
│   │       ├── zenmux.svg
│   │       ├── zhipuai-coding-plan.svg
│   │       └── zhipuai.svg
│   │
│   └── images/                                     # 3 张图片
│       ├── social-share-black.png
│       ├── social-share-zen.png
│       └── social-share.png
│
├── components/                                     # 188 个组件文件
│   ├── app-icons/
│   │   ├── sprite.svg
│   │   └── types.ts
│   ├── file-icons/
│   │   ├── sprite.svg
│   │   └── types.ts
│   ├── provider-icons/
│   │   ├── sprite.svg
│   │   └── types.ts
│   │
│   ├── accordion.css
│   ├── accordion.stories.tsx
│   ├── accordion.tsx
│   ├── animated-number.css
│   ├── animated-number.tsx
│   ├── app-icon.css
│   ├── app-icon.stories.tsx
│   ├── app-icon.tsx
│   ├── apply-patch-file.test.ts
│   ├── apply-patch-file.ts
│   ├── avatar.css
│   ├── avatar.stories.tsx
│   ├── avatar.tsx
│   ├── basic-tool.css
│   ├── basic-tool.stories.tsx
│   ├── basic-tool.tsx
│   ├── button.css
│   ├── button.stories.tsx
│   ├── button.tsx
│   ├── card.css
│   ├── card.stories.tsx
│   ├── card.tsx
│   ├── checkbox.css
│   ├── checkbox.stories.tsx
│   ├── checkbox.tsx
│   ├── collapsible.css
│   ├── collapsible.stories.tsx
│   ├── collapsible.tsx
│   ├── context-menu.css
│   ├── context-menu.stories.tsx
│   ├── context-menu.tsx
│   ├── dialog.css
│   ├── dialog.stories.tsx
│   ├── dialog.tsx
│   ├── diff-changes.css
│   ├── diff-changes.stories.tsx
│   ├── diff-changes.tsx
│   ├── dock-prompt.stories.tsx
│   ├── dock-prompt.tsx
│   ├── dock-surface.css
│   ├── dock-surface.tsx
│   ├── dropdown-menu.css
│   ├── dropdown-menu.stories.tsx
│   ├── dropdown-menu.tsx
│   ├── favicon.stories.tsx
│   ├── favicon.tsx
│   ├── file-icon.css
│   ├── file-icon.stories.tsx
│   ├── file-icon.tsx
│   ├── file-media.tsx
│   ├── file-search.tsx
│   ├── file-ssr.tsx
│   ├── file.css
│   ├── file.tsx
│   ├── font.stories.tsx
│   ├── font.tsx
│   ├── hover-card.css
│   ├── hover-card.stories.tsx
│   ├── hover-card.tsx
│   ├── icon-button.css
│   ├── icon-button.stories.tsx
│   ├── icon-button.tsx
│   ├── icon.css
│   ├── icon.stories.tsx
│   ├── icon.tsx
│   ├── image-preview.css
│   ├── image-preview.stories.tsx
│   ├── image-preview.tsx
│   ├── inline-input.css
│   ├── inline-input.stories.tsx
│   ├── inline-input.tsx
│   ├── keybind.css
│   ├── keybind.stories.tsx
│   ├── keybind.tsx
│   ├── line-comment-annotations.tsx
│   ├── line-comment-styles.ts
│   ├── line-comment.stories.tsx
│   ├── line-comment.tsx
│   ├── list.css
│   ├── list.stories.tsx
│   ├── list.tsx
│   ├── logo.css
│   ├── logo.stories.tsx
│   ├── logo.tsx
│   ├── markdown-stream.test.ts
│   ├── markdown-stream.ts
│   ├── markdown.css
│   ├── markdown.stories.tsx
│   ├── markdown.tsx
│   ├── message-file.test.ts
│   ├── message-file.ts
│   ├── message-nav.css
│   ├── message-nav.stories.tsx
│   ├── message-nav.tsx
│   ├── message-part.css
│   ├── message-part.stories.tsx
│   ├── message-part.tsx
│   ├── motion-spring.tsx
│   ├── popover.css
│   ├── popover.stories.tsx
│   ├── popover.tsx
│   ├── progress-circle.css
│   ├── progress-circle.stories.tsx
│   ├── progress-circle.tsx
│   ├── progress.css
│   ├── progress.stories.tsx
│   ├── progress.tsx
│   ├── provider-icon.css
│   ├── provider-icon.stories.tsx
│   ├── provider-icon.tsx
│   ├── radio-group.css
│   ├── radio-group.stories.tsx
│   ├── radio-group.tsx
│   ├── resize-handle.css
│   ├── resize-handle.stories.tsx
│   ├── resize-handle.tsx
│   ├── scroll-view.css
│   ├── scroll-view.test.ts
│   ├── scroll-view.tsx
│   ├── select.css
│   ├── select.stories.tsx
│   ├── select.tsx
│   ├── session-diff.test.ts
│   ├── session-diff.ts
│   ├── session-retry.tsx
│   ├── session-review.css
│   ├── session-review.stories.tsx
│   ├── session-review.tsx
│   ├── session-turn.css
│   ├── session-turn.stories.tsx
│   ├── session-turn.tsx
│   ├── shell-submessage-motion.stories.tsx
│   ├── shell-submessage.css
│   ├── spinner.css
│   ├── spinner.stories.tsx
│   ├── spinner.tsx
│   ├── sticky-accordion-header.css
│   ├── sticky-accordion-header.stories.tsx
│   ├── sticky-accordion-header.tsx
│   ├── switch.css
│   ├── switch.stories.tsx
│   ├── switch.tsx
│   ├── tabs.css
│   ├── tabs.stories.tsx
│   ├── tabs.tsx
│   ├── tag.css
│   ├── tag.stories.tsx
│   ├── tag.tsx
│   ├── text-field.css
│   ├── text-field.stories.tsx
│   ├── text-field.tsx
│   ├── text-reveal.css
│   ├── text-reveal.stories.tsx
│   ├── text-reveal.tsx
│   ├── text-shimmer.css
│   ├── text-shimmer.stories.tsx
│   ├── text-shimmer.tsx
│   ├── text-strikethrough.css
│   ├── text-strikethrough.stories.tsx
│   ├── text-strikethrough.tsx
│   ├── thinking-heading.stories.tsx
│   ├── timeline-playground.stories.tsx
│   ├── toast.css
│   ├── toast.stories.tsx
│   ├── toast.tsx
│   ├── todo-panel-motion.stories.tsx
│   ├── tool-count-label.css
│   ├── tool-count-label.tsx
│   ├── tool-count-summary.css
│   ├── tool-count-summary.stories.tsx
│   ├── tool-count-summary.tsx
│   ├── tool-error-card.css
│   ├── tool-error-card.stories.tsx
│   ├── tool-error-card.tsx
│   ├── tool-status-title.css
│   ├── tool-status-title.tsx
│   ├── tooltip.css
│   ├── tooltip.stories.tsx
│   ├── tooltip.tsx
│   ├── typewriter.css
│   ├── typewriter.stories.tsx
│   └── typewriter.tsx
│
├── context/                                        # 8 个文件
│   ├── data.tsx
│   ├── dialog.tsx
│   ├── file.tsx
│   ├── helper.tsx
│   ├── i18n.tsx
│   ├── index.ts
│   ├── marked.tsx
│   └── worker-pool.tsx
│
├── hooks/                                          # 3 个文件
│   ├── create-auto-scroll.tsx
│   ├── index.ts
│   └── use-filtered-list.tsx
│
├── i18n/                                           # 17 个语言文件
│   ├── ar.ts
│   ├── br.ts
│   ├── bs.ts
│   ├── da.ts
│   ├── de.ts
│   ├── en.ts
│   ├── es.ts
│   ├── fr.ts
│   ├── ja.ts
│   ├── ko.ts
│   ├── no.ts
│   ├── pl.ts
│   ├── ru.ts
│   ├── th.ts
│   ├── tr.ts
│   ├── zh.ts
│   └── zht.ts
│
├── pierre/                                         # 11 个文件
│   ├── comment-hover.ts
│   ├── commented-lines.ts
│   ├── diff-selection.ts
│   ├── file-find.ts
│   ├── file-runtime.ts
│   ├── file-selection.ts
│   ├── index.ts
│   ├── media.ts
│   ├── selection-bridge.ts
│   ├── virtualizer.ts
│   └── worker.ts
│
├── storybook/                                      # 2 个文件
│   ├── fixtures.ts
│   └── scaffold.tsx
│
├── styles/
│   ├── tailwind/
│   │   ├── colors.css
│   │   ├── index.css
│   │   └── utilities.css
│   ├── animations.css
│   ├── base.css
│   ├── colors.css
│   ├── index.css
│   ├── theme.css
│   └── utilities.css
│
└── theme/
    ├── themes/                                     # 37 个主题文件
    │   ├── amoled.json
    │   ├── aura.json
    │   ├── ayu.json
    │   ├── carbonfox.json
    │   ├── catppuccin-frappe.json
    │   ├── catppuccin-macchiato.json
    │   ├── catppuccin.json
    │   ├── cobalt2.json
    │   ├── cursor.json
    │   ├── dracula.json
    │   ├── everforest.json
    │   ├── flexoki.json
    │   ├── github.json
    │   ├── gruvbox.json
    │   ├── kanagawa.json
    │   ├── lucent-orng.json
    │   ├── material.json
    │   ├── matrix.json
    │   ├── mercury.json
    │   ├── monokai.json
    │   ├── nightowl.json
    │   ├── nord.json
    │   ├── oc-2.json
    │   ├── one-dark.json
    │   ├── onedarkpro.json
    │   ├── opencode.json
    │   ├── orng.json
    │   ├── osaka-jade.json
    │   ├── palenight.json
    │   ├── rosepine.json
    │   ├── shadesofpurple.json
    │   ├── solarized.json
    │   ├── synthwave84.json
    │   ├── tokyonight.json
    │   ├── vercel.json
    │   ├── vesper.json
    │   └── zenburn.json
    │
    ├── color.ts
    ├── context.tsx
    ├── default-themes.ts
    ├── desktop-theme.schema.json
    ├── index.ts
    ├── loader.ts
    ├── resolve.ts
    └── types.ts
```

### 统计信息

| 类别 | 数量 |
|------|------|
| assets/audio | 45 个音频文件 |
| assets/favicon | 11 个图标/清单文件 |
| assets/icons/app | 16 个应用图标 |
| assets/icons/file-types | 1089 个文件类型图标 |
| assets/icons/provider | 104 个提供商图标 |
| assets/images | 3 张图片 |
| components | 188 个文件 (含 3 个子目录: app-icons, file-icons, provider-icons) |
| context | 8 个文件 |
| hooks | 3 个文件 |
| i18n | 17 个语言文件 |
| pierre | 11 个文件 |
| storybook | 2 个文件 |
| styles | 7 个文件 (含 tailwind/ 子目录 3 个文件) |
| theme | 9 个文件 (含 themes/ 子目录 37 个主题) |
| **总计** | **约 1530+ 个文件** |

---

## 三、核心组件分析

### 3.1 组件分类速查表

#### 表单组件 (14 个)

| 组件 | 文件 | 作用 |
|------|------|------|
| `Button` | `button.tsx` + `button.css` + `button.stories.tsx` | 按钮 |
| `Input` (TextField) | `text-field.tsx` + `text-field.css` + `text-field.stories.tsx` | 输入框 |
| `Checkbox` | `checkbox.tsx` + `checkbox.css` + `checkbox.stories.tsx` | 复选框 |
| `Switch` | `switch.tsx` + `switch.css` + `switch.stories.tsx` | 开关 |
| `Select` | `select.tsx` + `select.css` + `select.stories.tsx` | 选择器 |
| `RadioGroup` | `radio-group.tsx` + `radio-group.css` + `radio-group.stories.tsx` | 单选组 |
| `InlineInput` | `inline-input.tsx` + `inline-input.css` + `inline-input.stories.tsx` | 行内输入 |
| `Tag` | `tag.tsx` + `tag.css` + `tag.stories.tsx` | 标签 |

#### 布局组件 (14 个)

| 组件 | 文件 | 作用 |
|------|------|------|
| `Card` | `card.tsx` + `card.css` + `card.stories.tsx` | 卡片 |
| `Accordion` | `accordion.tsx` + `accordion.css` + `accordion.stories.tsx` | 手风琴 |
| `Collapsible` | `collapsible.tsx` + `collapsible.css` + `collapsible.stories.tsx` | 可折叠 |
| `Tabs` | `tabs.tsx` + `tabs.css` + `tabs.stories.tsx` | 标签页 |
| `ScrollArea` (ScrollView) | `scroll-view.tsx` + `scroll-view.css` + `scroll-view.test.ts` | 滚动区域 |
| `ResizeHandle` | `resize-handle.tsx` + `resize-handle.css` + `resize-handle.stories.tsx` | 调整大小手柄 |
| `DockSurface` | `dock-surface.tsx` + `dock-surface.css` | Dock 表面 |
| `DockPrompt` | `dock-prompt.tsx` + `dock-prompt.stories.tsx` | Dock 提示 |
| `StickyAccordionHeader` | `sticky-accordion-header.tsx` + `sticky-accordion-header.css` + `sticky-accordion-header.stories.tsx` | 粘性手风琴头 |
| `Separator` | (通过 Tailwind) | 分隔线 |
| `Progress` | `progress.tsx` + `progress.css` + `progress.stories.tsx` | 进度条 |
| `ProgressCircle` | `progress-circle.tsx` + `progress-circle.css` + `progress-circle.stories.tsx` | 圆形进度 |
| `Spinner` | `spinner.tsx` + `spinner.css` + `spinner.stories.tsx` | 加载指示器 |
| `Skeleton` | (通过 Tailwind) | 骨架屏 |

#### 弹出组件 (8 个)

| 组件 | 文件 | 作用 |
|------|------|------|
| `Dialog` | `dialog.tsx` + `dialog.css` + `dialog.stories.tsx` | 对话框 |
| `Popover` | `popover.tsx` + `popover.css` + `popover.stories.tsx` | 弹出框 |
| `DropdownMenu` | `dropdown-menu.tsx` + `dropdown-menu.css` + `dropdown-menu.stories.tsx` | 下拉菜单 |
| `ContextMenu` | `context-menu.tsx` + `context-menu.css` + `context-menu.stories.tsx` | 右键菜单 |
| `HoverCard` | `hover-card.tsx` + `hover-card.css` + `hover-card.stories.tsx` | 悬停卡片 |
| `Tooltip` | `tooltip.tsx` + `tooltip.css` + `tooltip.stories.tsx` | 工具提示 |
| `Toast` | `toast.tsx` + `toast.css` + `toast.stories.tsx` | Toast 通知 |
| `Modal` | (通过 Dialog) | 模态框 |

#### 数据展示组件 (20 个)

| 组件 | 文件 | 作用 |
|------|------|------|
| `List` | `list.tsx` + `list.css` + `list.stories.tsx` | 列表 |
| `Icon` | `icon.tsx` + `icon.css` + `icon.stories.tsx` | 图标 |
| `IconButton` | `icon-button.tsx` + `icon-button.css` + `icon-button.stories.tsx` | 图标按钮 |
| `Avatar` | `avatar.tsx` + `avatar.css` + `avatar.stories.tsx` | 头像 |
| `Badge` (Tag) | `tag.tsx` + `tag.css` + `tag.stories.tsx` | 徽章 |
| `Logo` | `logo.tsx` + `logo.css` + `logo.stories.tsx` | Logo |
| `Favicon` | `favicon.tsx` + `favicon.stories.tsx` | Favicon |
| `FileIcon` | `file-icon.tsx` + `file-icon.css` + `file-icon.stories.tsx` | 文件图标 |
| `File` | `file.tsx` + `file.css` | 文件组件 |
| `FileMedia` | `file-media.tsx` | 文件媒体 |
| `FileSearch` | `file-search.tsx` | 文件搜索 |
| `FileSSR` | `file-ssr.tsx` | 文件 SSR |
| `AppIcon` | `app-icon.tsx` + `app-icon.css` + `app-icon.stories.tsx` | 应用图标 |
| `ProviderIcon` | `provider-icon.tsx` + `provider-icon.css` + `provider-icon.stories.tsx` | 提供商图标 |
| `Markdown` | `markdown.tsx` + `markdown.css` + `markdown.stories.tsx` | Markdown 渲染 |
| `MarkdownStream` | `markdown-stream.ts` + `markdown-stream.test.ts` | Markdown 流式渲染 |
| `ImagePreview` | `image-preview.tsx` + `image-preview.css` + `image-preview.stories.tsx` | 图片预览 |
| `AnimatedNumber` | `animated-number.tsx` + `animated-number.css` | 动画数字 |
| `Font` | `font.tsx` + `font.stories.tsx` | 字体 |
| `Typewriter` | `typewriter.tsx` + `typewriter.css` + `typewriter.stories.tsx` | 打字机效果 |

#### 消息/会话组件 (14 个)

| 组件 | 文件 | 作用 |
|------|------|------|
| `MessageNav` | `message-nav.tsx` + `message-nav.css` + `message-nav.stories.tsx` | 消息导航 |
| `MessagePart` | `message-part.tsx` + `message-part.css` + `message-part.stories.tsx` | 消息部分 |
| `MessageFile` | `message-file.ts` + `message-file.test.ts` | 消息文件 |
| `SessionDiff` | `session-diff.ts` + `session-diff.test.ts` | 会话差异 |
| `SessionRetry` | `session-retry.tsx` | 会话重试 |
| `SessionReview` | `session-review.tsx` + `session-review.css` + `session-review.stories.tsx` | 会话审查 |
| `SessionTurn` | `session-turn.tsx` + `session-turn.css` + `session-turn.stories.tsx` | 会话轮次 |
| `ShellSubmessage` | `shell-submessage.css` | Shell 子消息 |
| `ShellSubmessageMotion` | `shell-submessage-motion.stories.tsx` | Shell 子消息动画 |
| `ApplyPatchFile` | `apply-patch-file.ts` + `apply-patch-file.test.ts` | 应用补丁文件 |
| `DiffChanges` | `diff-changes.tsx` + `diff-changes.css` + `diff-changes.stories.tsx` | 差异变更 |
| `BasicTool` | `basic-tool.tsx` + `basic-tool.css` + `basic-tool.stories.tsx` | 基础工具 |
| `ToolCountLabel` | `tool-count-label.tsx` + `tool-count-label.css` | 工具计数标签 |
| `ToolCountSummary` | `tool-count-summary.tsx` + `tool-count-summary.css` + `tool-count-summary.stories.tsx` | 工具计数摘要 |
| `ToolErrorCard` | `tool-error-card.tsx` + `tool-error-card.css` + `tool-error-card.stories.tsx` | 工具错误卡片 |
| `ToolStatusTitle` | `tool-status-title.tsx` + `tool-status-title.css` | 工具状态标题 |

#### 文本组件 (7 个)

| 组件 | 文件 | 作用 |
|------|------|------|
| `TextReveal` | `text-reveal.tsx` + `text-reveal.css` + `text-reveal.stories.tsx` | 文本揭示 |
| `TextShimmer` | `text-shimmer.tsx` + `text-shimmer.css` + `text-shimmer.stories.tsx` | 文本闪烁 |
| `TextStrikethrough` | `text-strikethrough.tsx` + `text-strikethrough.css` + `text-strikethrough.stories.tsx` | 文本删除线 |
| `ThinkingHeading` | `thinking-heading.stories.tsx` | 思考标题 |
| `LineComment` | `line-comment.tsx` + `line-comment.stories.tsx` | 行注释 |
| `LineCommentAnnotations` | `line-comment-annotations.tsx` | 行注释标注 |
| `LineCommentStyles` | `line-comment-styles.ts` | 行注释样式 |

#### 其他组件 (5 个)

| 组件 | 文件 | 作用 |
|------|------|------|
| `MotionSpring` | `motion-spring.tsx` | 弹簧动画 |
| `TimelinePlayground` | `timeline-playground.stories.tsx` | 时间线演示 |
| `TodoPanelMotion` | `todo-panel-motion.stories.tsx` | Todo 面板动画 |
| `Keybind` | `keybind.tsx` + `keybind.css` + `keybind.stories.tsx` | 快捷键显示 |

---

## 四、主题系统

### 4.1 完整主题列表 (37 个)

| 主题 | 文件 |
|------|------|
| AMOLED | `amoled.json` |
| Aura | `aura.json` |
| Ayu | `ayu.json` |
| Carbonfox | `carbonfox.json` |
| Catppuccin Frappe | `catppuccin-frappe.json` |
| Catppuccin Macchiato | `catppuccin-macchiato.json` |
| Catppuccin | `catppuccin.json` |
| Cobalt2 | `cobalt2.json` |
| Cursor | `cursor.json` |
| Dracula | `dracula.json` |
| Everforest | `everforest.json` |
| Flexoki | `flexoki.json` |
| GitHub | `github.json` |
| Gruvbox | `gruvbox.json` |
| Kanagawa | `kanagawa.json` |
| Lucent Orange | `lucent-orng.json` |
| Material | `material.json` |
| Matrix | `matrix.json` |
| Mercury | `mercury.json` |
| Monokai | `monokai.json` |
| Night Owl | `nightowl.json` |
| Nord | `nord.json` |
| OC-2 | `oc-2.json` |
| One Dark | `one-dark.json` |
| One Dark Pro | `onedarkpro.json` |
| OpenCode | `opencode.json` |
| Orange | `orng.json` |
| Osaka Jade | `osaka-jade.json` |
| Palenight | `palenight.json` |
| Rose Pine | `rosepine.json` |
| Shades of Purple | `shadesofpurple.json` |
| Solarized | `solarized.json` |
| Synthwave '84 | `synthwave84.json` |
| Tokyo Night | `tokyonight.json` |
| Vercel | `vercel.json` |
| Vesper | `vesper.json` |
| Zenburn | `zenburn.json` |

### 4.2 主题模块

| 文件 | 作用 |
|------|------|
| `color.ts` | 颜色处理 |
| `context.tsx` | 主题上下文 Provider |
| `default-themes.ts` | 默认主题定义 |
| `desktop-theme.schema.json` | 桌面主题 Schema |
| `index.ts` | 入口 |
| `loader.ts` | 主题加载器 |
| `resolve.ts` | 主题解析 |
| `types.ts` | 类型定义 |

---

## 五、国际化

### 5.1 语言文件 (17 种)

| 文件 | 语言 |
|------|------|
| `ar.ts` | 阿拉伯语 |
| `br.ts` | 布列塔尼语 |
| `bs.ts` | 波斯尼亚语 |
| `da.ts` | 丹麦语 |
| `de.ts` | 德语 |
| `en.ts` | 英语 |
| `es.ts` | 西班牙语 |
| `fr.ts` | 法语 |
| `ja.ts` | 日语 |
| `ko.ts` | 韩语 |
| `no.ts` | 挪威语 |
| `pl.ts` | 波兰语 |
| `ru.ts` | 俄语 |
| `th.ts` | 泰语 |
| `tr.ts` | 土耳其语 |
| `zh.ts` | 简体中文 |
| `zht.ts` | 繁体中文 |

---

## 六、Pierre 模块 (11 个文件)

| 文件 | 作用 |
|------|------|
| `comment-hover.ts` | 注释悬停 |
| `commented-lines.ts` | 已注释行 |
| `diff-selection.ts` | 差异选择 |
| `file-find.ts` | 文件查找 |
| `file-runtime.ts` | 文件运行时 |
| `file-selection.ts` | 文件选择 |
| `index.ts` | 入口 |
| `media.ts` | 媒体处理 |
| `selection-bridge.ts` | 选择桥接 |
| `virtualizer.ts` | 虚拟化器 |
| `worker.ts` | Worker |

---

## 七、样式系统

### 7.1 完整样式文件列表

| 文件 | 作用 |
|------|------|
| `styles/index.css` | 样式入口 |
| `styles/base.css` | 基础样式 |
| `styles/colors.css` | 颜色变量 |
| `styles/theme.css` | 主题样式 |
| `styles/animations.css` | 动画样式 |
| `styles/utilities.css` | 工具样式 |
| `styles/tailwind/index.css` | Tailwind 入口 |
| `styles/tailwind/colors.css` | Tailwind 颜色 |
| `styles/tailwind/utilities.css` | Tailwind 工具 |

---

## 八、Context 模块 (8 个文件)

| 文件 | 作用 |
|------|------|
| `data.tsx` | 数据上下文 |
| `dialog.tsx` | 对话框上下文 |
| `file.tsx` | 文件上下文 |
| `helper.tsx` | 辅助上下文 |
| `i18n.tsx` | 国际化上下文 |
| `index.ts` | 入口 |
| `marked.tsx` | Marked 上下文 |
| `worker-pool.tsx` | Worker 池上下文 |

---

## 九、Hooks (3 个文件)

| 文件 | 作用 |
|------|------|
| `create-auto-scroll.tsx` | 自动滚动钩子 |
| `index.ts` | 入口 |
| `use-filtered-list.tsx` | 过滤列表钩子 |

---

## 十、Storybook (2 个文件)

| 文件 | 作用 |
|------|------|
| `fixtures.ts` | 测试夹具 |
| `scaffold.tsx` | 脚手架 |

---

## 十一、架构总结

```
┌─────────────────────────────────────────────────────────┐
│                    UI 组件库架构                          │
├─────────────────────────────────────────────────────────┤
│                   188 个组件文件                           │
│  表单(14) │ 布局(14) │ 弹出(8) │ 数据展示(20) │ 消息(16)  │
│  文本(7) │ 其他(5)                                       │
├─────────────────────────────────────────────────────────┤
│                   资源文件                                │
│  音频(45) │ Favicon(11) │ App图标(16) │ 文件图标(1089)   │
│  提供商图标(104) │ 图片(3)                                │
├─────────────────────────────────────────────────────────┤
│                   主题系统 (37 个主题)                     │
│  amoled, aura, ayu, catppuccin, dracula, github, ...     │
├─────────────────────────────────────────────────────────┤
│                   样式系统                                 │
│  TailwindCSS 4 + CSS 变量 + 9 个样式文件                   │
├─────────────────────────────────────────────────────────┤
│                   国际化 (17 种语言)                       │
│  ar, br, bs, da, de, en, es, fr, ja, ko, no, pl, ru,    │
│  th, tr, zh, zht                                         │
├─────────────────────────────────────────────────────────┤
│                   辅助模块                                 │
│  Context(8) │ Hooks(3) │ Pierre(11) │ Storybook(2)      │
└─────────────────────────────────────────────────────────┘
```

### 设计亮点

1. **无头组件架构**: 逻辑和样式分离，高度可定制
2. **SolidJS 响应式**: 高效渲染，细粒度更新
3. **TailwindCSS 原子化**: 灵活的样式系统
4. **完整主题支持**: 37 个预设主题 + 明暗模式
5. **国际化内置**: 17 种语言支持
6. **Storybook 文档**: 每个组件都有 stories 演示
7. **TypeScript 类型安全**: 完整的类型定义
8. **丰富资源**: 1089 个文件类型图标 + 104 个提供商图标 + 45 个音效

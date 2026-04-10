# Markdown Render Switch Design

## Overview

Add a toggle switch on markdown files (.md) in the desktop-electron app that allows users to switch between viewing raw markdown text and rendered HTML. Click the switch to render, click again to restore raw text view.

## Requirements

- **Location**: Toggle switch placed at the top of file content area
- **Rendering**: Pure HTML rendering using existing `Markdown` component
- **State**: Do not persist state - each file opens in raw text mode by default
- **Scope**: Only affects markdown files (.md, .markdown extensions)

## Architecture

### Data Flow

```
FileTabContent
  ├── path() → detect .md extension
  ├── renderMarkdown signal → toggle state (default: false)
  ├── Switch component (only visible for .md files)
  └── Conditional rendering
        ├── false → Dynamic + TextViewer (raw text)
        └── true → Markdown component (rendered HTML)
```

### Components Involved

| Component        | Role                              |
| ---------------- | --------------------------------- |
| `FileTabContent` | Main implementation location      |
| `Switch`         | UI toggle component               |
| `Markdown`       | HTML rendering component          |
| `parseMarkdown`  | Platform API for markdown parsing |

## Implementation Details

### 1. Extension Detection

```typescript
const isMarkdown = createMemo(() => {
  const p = path()
  if (!p) return false
  return p.endsWith(".md") || p.endsWith(".markdown")
})
```

### 2. Toggle State

```typescript
const [renderMarkdown, setRenderMarkdown] = createSignal(false)
```

### 3. Toggle Component Placement

Place switch component inside `ScrollView`, at the top of file content:

```tsx
<ScrollView ...>
  <Show when={isMarkdown()}>
    {/* Toggle switch at top */}
  </Show>
  <Switch>
    <Match when={!renderMarkdown()}>
      {/* Raw text viewer */}
    </Match>
    <Match when={renderMarkdown()}>
      {/* Markdown rendered HTML */}
    </Match>
  </Switch>
</ScrollView>
```

### 4. Markdown Rendering

Use existing `Markdown` component with content:

```tsx
<Markdown text={contents()} />
```

For desktop platform, can optionally use `parseMarkdown` API from platform context for native parsing.

## Files to Modify

| File                                           | Changes                                            |
| ---------------------------------------------- | -------------------------------------------------- |
| `packages/app/src/pages/session/file-tabs.tsx` | Add toggle logic, state, and conditional rendering |

## Notes

- Use existing UI components (`Switch` or `IconButton`) from `@opencode-ai/ui`
- Keep raw text viewer as default view
- Toggle state resets when switching files (no persistence)
- No changes needed to desktop-electron package - uses existing `parseMarkdown` API

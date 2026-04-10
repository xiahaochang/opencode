# Markdown Render Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a toggle switch on markdown files to switch between raw text and rendered HTML view.

**Architecture:** Modify FileTabContent component to detect .md files, add a toggle switch at the top of content area, and conditionally render either raw text viewer or Markdown component.

**Tech Stack:** SolidJS, TypeScript, existing Markdown component from @opencode-ai/ui

---

## Task 1: Add Markdown Detection and Toggle State

**Files:**

- Modify: `packages/app/src/pages/session/file-tabs.tsx:174-462`

**Step 1: Add imports**

Add necessary imports at the top of the file:

```typescript
import { Switch } from "@opencode-ai/ui/switch"
import { Markdown } from "@opencode-ai/ui/markdown"
```

**Step 2: Add extension detection and state**

In `FileTabContent` function, after existing state declarations (around line 280), add:

```typescript
const isMarkdown = createMemo(() => {
  const p = path()
  if (!p) return false
  return p.endsWith(".md") || p.endsWith(".markdown")
})

const [renderMarkdown, setRenderMarkdown] = createSignal(false)
```

**Step 3: Verify syntax**

Run: `cd packages/app && bun typecheck`
Expected: No type errors

---

## Task 2: Add Toggle Switch UI

**Files:**

- Modify: `packages/app/src/pages/session/file-tabs.tsx:403-461`

**Step 1: Create toggle wrapper component**

Add a toggle wrapper before `renderFile` function:

```typescript
const ToggleWrapper = () => (
  <Show when={isMarkdown()}>
    <div class="flex items-center gap-2 px-6 py-2 border-b border-border-base">
      <span class="text-sm text-text-weak">{language.t("common.renderMarkdown")}</span>
      <Switch
        checked={renderMarkdown()}
        onChange={(checked) => setRenderMarkdown(checked)}
      />
    </div>
  </Show>
)
```

Note: If `language.t("common.renderMarkdown")` doesn't exist, use a hardcoded string like "Render Markdown" or check existing i18n keys.

**Step 2: Integrate into renderFile**

Modify `renderFile` to wrap content with toggle:

```typescript
const renderFile = (source: string) => (
  <div class="relative overflow-hidden pb-40">
    <ToggleWrapper />
    <Switch>
      <Match when={!renderMarkdown()}>
        <Dynamic
          component={fileComponent}
          mode="text"
          file={{
            name: path() ?? "",
            contents: source,
            cacheKey: cacheKey(),
          }}
          enableLineSelection
          enableHoverUtility
          selectedLines={activeSelection()}
          commentedLines={commentedLines()}
          onRendered={() => {
            scrollSync.queueRestore()
          }}
          annotations={commentsUi.annotations()}
          renderAnnotation={commentsUi.renderAnnotation}
          renderHoverUtility={commentsUi.renderHoverUtility}
          onLineSelected={(range: SelectedLineRange | null) => {
            commentsUi.onLineSelected(range)
          }}
          onLineNumberSelectionEnd={commentsUi.onLineNumberSelectionEnd}
          onLineSelectionEnd={(range: SelectedLineRange | null) => {
            commentsUi.onLineSelectionEnd(range)
          }}
          search={search}
          class="select-text"
          media={{
            mode: "auto",
            path: path(),
            current: state()?.content,
            onLoad: scrollSync.queueRestore,
            onError: (args: { kind: "image" | "audio" | "svg" }) => {
              if (args.kind !== "svg") return
              showToast({
                variant: "error",
                title: language.t("toast.file.loadFailed.title"),
              })
            },
          }}
        />
      </Match>
      <Match when={renderMarkdown()}>
        <div class="px-6 py-4">
          <Markdown text={source} />
        </div>
      </Match>
    </Switch>
  </div>
)
```

**Step 3: Verify syntax**

Run: `cd packages/app && bun typecheck`
Expected: No type errors

---

## Task 3: Add i18n Key (if needed)

**Files:**

- Check existing: `packages/ui/src/i18n/en.ts`

**Step 1: Check if key exists**

Search for "renderMarkdown" or similar key in i18n files. If not found, add to `packages/ui/src/i18n/en.ts`:

```typescript
common: {
  // ... existing keys
  renderMarkdown: "Render Markdown",
}
```

And add corresponding translations to other language files if desired (optional).

**Step 2: Verify i18n**

Run: `cd packages/ui && bun typecheck`
Expected: No type errors

---

## Task 4: Test Implementation

**Step 1: Start dev server**

Run: `cd packages/app && bun dev`
Expected: Dev server starts

**Step 2: Test manually**

1. Open a markdown file (.md) in the app
2. Verify toggle switch appears at top of content
3. Click toggle to switch to rendered view
4. Verify markdown renders as HTML
5. Click toggle again to switch back to raw text
6. Verify raw text displays correctly
7. Open a non-md file (e.g., .ts)
8. Verify toggle does not appear

---

## Notes

- Toggle state resets when switching files (no persistence per requirements)
- Uses existing `Switch` component from UI package
- Uses existing `Markdown` component for rendering
- No changes needed to desktop-electron package - uses existing platform APIs

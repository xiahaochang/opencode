import { Show, For, createMemo, onMount } from "solid-js"
import { CommitRow } from "./commit-row"
import { LaneLines } from "./lane-lines"
import type { GitGraphBodyProps } from "./types"
import type { GitCommit } from "@opencode-ai/sdk/v2"

export interface GitGraphBodyExpose {
  container: HTMLDivElement | null
}

export function GitGraphBody(
  props: GitGraphBodyProps & { ref?: (api: GitGraphBodyExpose) => void; onScroll?: (e: Event) => void },
) {
  // 检查是否有数据
  const hasCommits = createMemo(() => props.data?.commits && props.data.commits.length > 0)

  // 暴露 container ref
  let containerRef: HTMLDivElement | null = null
  const setContainerRef = (el: HTMLDivElement) => {
    containerRef = el
    onMount(() => {
      props.ref?.({ container: containerRef })
    })
  }

  return (
    <div ref={setContainerRef} class="flex-1 overflow-auto" onScroll={props.onScroll}>
      {/* 有数据时显示列表，即使 loading=true（append 模式下需要保持 DOM） */}
      <Show when={props.data && hasCommits()} fallback={<div class="p-4 text-text-weak">{props.loading ? "Loading..." : "No data"}</div>}>
        <div class="flex">
          {/* Tree 模式下的 SVG 连线层 */}
          <Show when={props.viewMode === "tree"}>
            <div class="w-16 relative flex-shrink-0">
              <LaneLines
                commits={props.data?.commits || []}
                laneMap={props.data?.lane_map || {}}
                branches={props.data?.branches ?? []}
                rowHeight={76}
                laneWidth={24}
              />
            </div>
          </Show>

          {/* 提交列表 */}
          <div class="flex-1">
            <For each={props.data?.commits}>
              {(commit) => (
                <CommitRow
                  commit={commit}
                  lane={(props.data?.lane_map || {})[commit.hash] ?? 0}
                  branches={props.data?.branches ?? []}
                  showNode={props.viewMode !== "tree"}
                  isSelected={props.selectedCommit?.hash === commit.hash}
                  onSelect={props.onCommitSelect}
                  onHover={props.onCommitHover}
                />
              )}
            </For>

            {/* 加载指示器 - 显示在列表底部 */}
            <Show when={props.loading}>
              <div class="p-4 text-center text-text-weak">加载中...</div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  )
}

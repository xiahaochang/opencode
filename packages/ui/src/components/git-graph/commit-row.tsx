import { createMemo, For, Show } from "solid-js"
import { DateTime } from "luxon"
import type { CommitRowProps } from "./types"
import type { GitCommit } from "@opencode-ai/sdk/v2"

const NODE_RADIUS = 6

export function CommitRow(props: CommitRowProps) {
  // 泳道颜色
  const nodeColor = createMemo(() => {
    const colors = [
      "#E53935",
      "#FB8C00",
      "#FDD835",
      "#43A047",
      "#1E88E5",
      "#8E24AA",
      "#F4511E",
      "#5E35B1",
      "#00ACC1",
      "#7CB342",
    ]
    return colors[props.lane % colors.length]
  })

  // 时间显示
  const timeAgo = createMemo(() => {
    try {
      const dt = DateTime.fromMillis(props.commit.author_date * 1000)
      return dt.toRelative()?.toString() ?? ""
    } catch {
      return ""
    }
  })

  // 解析分支引用
  const commitRefs = createMemo(() => {
    const refs = props.commit.refs ?? []
    return refs.map((ref) => {
      // 解析引用类型
      if (ref.includes("HEAD ->")) {
        const name = ref.split(" -> ")[1]?.trim() ?? ref
        return { name, type: "current" as const }
      }
      if (ref.includes("/") && !ref.startsWith("tags/")) {
        return { name: ref, type: "remote" as const }
      }
      return { name: ref, type: "local" as const }
    })
  })

  return (
    <div
      class="commit-row"
      data-selected={props.isSelected}
      onClick={() => props.onSelect?.(props.commit)}
      onMouseEnter={(e) => props.onHover?.(props.commit, e)}
      onMouseLeave={() => props.onHover?.(null)}
    >
      {/* 节点圆点 - 只在 List 模式或没有传入 lane 时显示 */}
      <Show when={props.showNode !== false}>
        <div class="commit-node" style={{ background: nodeColor() }} />
      </Show>

      {/* 提交信息 */}
      <div class="commit-message">
        <div class="commit-message-title">{props.commit.message}</div>
        <div class="commit-message-meta">
          <span>{props.commit.author}</span>
          <span>·</span>
          <span>{timeAgo()}</span>
        </div>
      </div>

      {/* 分支标签 */}
      <div class="commit-refs">
        <For each={commitRefs()}>
          {(ref) => (
            <span
              class="ref-badge"
              classList={{
                "ref-badge-current": ref.type === "current",
                "ref-badge-remote": ref.type === "remote",
                "ref-badge-local": ref.type === "local",
              }}
            >
              {ref.name}
            </span>
          )}
        </For>
      </div>
    </div>
  )
}

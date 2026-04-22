import type { GitGraphHeaderProps } from "./types"

export function GitGraphHeader(props: GitGraphHeaderProps) {
  return (
    <div class="git-graph-header">
      <div class="flex items-center gap-3">
        <span class="git-graph-title">GRAPH</span>
        {props.currentBranch && <span class="text-14-regular text-text-weak">@{props.currentBranch}</span>}
      </div>

      <div class="git-graph-tools">
        {/* 视图切换 */}
        <button
          onClick={props.onViewToggle}
          class="px-2 py-1 text-12-regular hover:bg-bg-subtle rounded"
          title={props.viewMode === "list" ? "Switch to Tree View" : "Switch to List View"}
        >
          {props.viewMode === "list" ? "🌳 Tree" : "📋 List"}
        </button>

        {/* 刷新按钮 */}
        <button
          onClick={props.onRefresh}
          disabled={props.loading}
          class="px-2 py-1 text-12-regular hover:bg-bg-subtle rounded disabled:opacity-50"
          title="Refresh"
        >
          🔄
        </button>
      </div>
    </div>
  )
}

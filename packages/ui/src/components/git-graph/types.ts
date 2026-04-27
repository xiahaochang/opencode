import type { GitCommit, GitBranch, GitGraphData } from "@opencode-ai/sdk/v2"
import type { OpencodeClient } from "@opencode-ai/sdk/v2/client"

// 视图模式
export type GraphViewMode = "list" | "tree"

// 组件 Props
export interface GitGraphProps {
  class?: string
  projectId?: string
}

// 暴露给父组件的方法
export interface GitGraphExpose {
  viewMode: () => GraphViewMode
  refresh: () => void
  toggleView: () => void
}

// 组件完整 Props
export interface GitGraphComponentProps extends GitGraphProps {
  ref?: (api: GitGraphExpose) => void
  /** SDK client，用于处理认证 */
  client?: OpencodeClient
}

export interface GitGraphHeaderProps {
  currentBranch?: string
  loading: boolean
  onRefresh: () => void
  onViewToggle: () => void
  viewMode: GraphViewMode
}

export interface GitGraphBodyProps {
  data?: GitGraphData
  loading: boolean
  viewMode: GraphViewMode
  selectedCommit?: GitCommit
  onCommitSelect: (commit: GitCommit) => void
  onCommitHover: (commit: GitCommit | null, event?: MouseEvent) => void
}

export interface CommitRowProps {
  commit: GitCommit
  lane: number
  branches: GitBranch[]
  isSelected?: boolean
  showNode?: boolean
  onSelect?: (commit: GitCommit) => void
  onHover?: (commit: GitCommit | null, event?: MouseEvent) => void
}

export interface CommitDetailPanelProps {
  commit: GitCommit | undefined
  onClose: () => void
}

export interface HoverPreviewProps {
  commit: GitCommit | null
  position: { x: number; y: number }
  branches: GitBranch[]
}

export interface LaneLinesProps {
  commits: GitCommit[]
  laneMap: Record<string, number>
  branches: GitBranch[]
  rowHeight: number
  laneWidth: number
}

// 泳道配置
export interface LaneConfig {
  index: number
  color: string
  commits: string[]
}

// 悬停预览数据
export interface HoverPreviewData {
  commit: GitCommit
  position: { x: number; y: number }
  branches: GitBranch[]
}

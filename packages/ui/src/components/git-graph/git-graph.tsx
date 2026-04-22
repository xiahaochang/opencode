import { createSignal, createMemo, onMount, onCleanup, For } from "solid-js"
import { GitGraphBody } from "./git-graph-body"
import { HoverPreview } from "./hover-preview"
import { CommitDetailPanel } from "./commit-detail"
import type { GitGraphData, GitCommit, GitBranch } from "@opencode-ai/sdk/v2"
import type { GraphViewMode, GitGraphProps } from "./types"
import type { OpencodeClient } from "@opencode-ai/sdk/v2/client"

export interface GitGraphExpose {
  viewMode: () => GraphViewMode
  setViewMode: (mode: GraphViewMode) => void
  refresh: () => void
  toggleView: () => void
}

export interface GitGraphComponentProps extends GitGraphProps {
  ref?: (api: GitGraphExpose) => void
  client?: OpencodeClient
  onViewModeChange?: (mode: GraphViewMode) => void
}

export function GitGraph(props: GitGraphComponentProps) {
  const [data, setData] = createSignal<GitGraphData | undefined>()
  const [loading, setLoading] = createSignal(false)
  const [viewMode, setViewMode] = createSignal<GraphViewMode>("list")
  const [selectedCommit, setSelectedCommit] = createSignal<GitCommit | undefined>()
  const [hoverCommit, setHoverCommit] = createSignal<GitCommit | null>(null)
  const [hoverPosition, setHoverPosition] = createSignal({ x: 0, y: 0 })
  const [hasMore, setHasMore] = createSignal(true)
  const [isRestoringScroll, setIsRestoringScroll] = createSignal(false)
  let containerRef: HTMLDivElement | null = null
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null

  const loadData = async (append = false) => {
    if (loading()) return

    setLoading(true)

    const clientToUse = props.client
    if (!clientToUse) {
      console.error("[GitGraph] no client provided")
      setLoading(false)
      return
    }

    const currentOffset = append ? data()?.commits?.length || 0 : 0

    try {
      const result = await clientToUse.git.graph({
        limit: 100,
        offset: currentOffset,
      })

      if (append && data()?.commits) {
        const currentCommits = data()!.commits
        const newCommits = result.data?.commits || []

        if (newCommits.length === 0) {
          setHasMore(false)
          setLoading(false)
          return
        }

        const container = containerRef
        if (container) {
          // 在数据更新前保存滚动位置信息
          const oldScrollTop = container.scrollTop
          const oldScrollHeight = container.scrollHeight
          const clientHeight = container.clientHeight

          // 标记正在恢复滚动，防止触发新的加载
          setIsRestoringScroll(true)

          // 预先计算新增数据的高度（每条提交约 48px）
          const newRowHeight = 48
          const expectedHeightDiff = newCommits.length * newRowHeight

          // 更新数据 - 新数据追加在底部（更早的历史）
          setData({
            ...data()!,
            commits: [...currentCommits, ...newCommits],
          })

          // 使用 setTimeout 确保 DOM 完全更新后再设置滚动位置
          setTimeout(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight
              const heightDiff = newScrollHeight - oldScrollHeight

              // 如果实际高度差与预期不符，使用实际值
              const actualHeightDiff = heightDiff > 0 ? heightDiff : expectedHeightDiff

              // 滚动位置逻辑：
              // 新数据追加在底部，用户希望看到新数据的开始位置
              // scrollBottom 应该等于新数据高度
              // scrollTop = scrollHeight - clientHeight - heightDiff
              const newScrollTop = newScrollHeight - clientHeight - actualHeightDiff

              container.scrollTop = Math.max(0, newScrollTop)
            }
            // 延迟解除恢复标记
            setTimeout(() => {
              setIsRestoringScroll(false)
              setLoading(false)
            }, 100)
          }, 50) // 50ms 延迟确保 DOM 更新
          return // append 模式下，loading 在 setTimeout 中设置，直接返回
        } else {
          setData({
            ...data()!,
            commits: [...currentCommits, ...newCommits],
          })
          setLoading(false)
          setHasMore(newCommits.length >= 100)
        }
      } else {
        setData(result.data)
        setLoading(false)
        const newCommitsCount = result.data?.commits?.length || 0
        setHasMore(newCommitsCount >= 100)
      }
    } catch (error) {
      console.error("[GitGraph] failed to load", error)
      setHasMore(false)
      setLoading(false)
    }
  }

  const refresh = () => {
    setData(undefined)
    setHasMore(true)
    setLoading(false)
    setTimeout(() => {
      void loadData(false)
    }, 100)
  }

  const toggleView = () => {
    setViewMode((prev) => {
      const newMode = prev === "list" ? "tree" : "list"
      console.log("[GitGraph] toggleView:", prev, "->", newMode)
      // 通知父组件视图模式变化
      props.onViewModeChange?.(newMode)
      return newMode
    })
  }

  const handleScroll = (e: Event) => {
    // 正在恢复滚动位置时不触发加载
    if (isRestoringScroll()) return

    const target = e.target as HTMLDivElement
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight

    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    scrollTimeout = setTimeout(() => {
      // 再次检查是否正在恢复滚动
      if (isRestoringScroll()) return

      if (scrollBottom < 50 && hasMore() && !loading()) {
        void loadData(true)
      }
    }, 100)
  }

  const handleCommitSelect = (commit: GitCommit) => {
    setSelectedCommit(commit)
  }

  const handleCommitHover = (commit: GitCommit | null, event?: MouseEvent) => {
    if (commit && event) {
      setHoverPosition({ x: event.clientX, y: event.clientY })
    }
    setHoverCommit(commit)
  }

  onMount(() => {
    props.ref?.({ viewMode, setViewMode, refresh, toggleView })
    console.log("[GitGraph] onMount called, initial viewMode:", viewMode())
    void loadData(false)
  })

  onCleanup(() => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
  })

  return (
    <div class="git-graph" data-component="git-graph">
      <GitGraphBody
        ref={(ref) => {
          containerRef = ref.container
        }}
        onScroll={handleScroll}
        data={data()}
        loading={loading()}
        viewMode={viewMode()}
        selectedCommit={selectedCommit()}
        onCommitSelect={handleCommitSelect}
        onCommitHover={handleCommitHover}
      />

      <HoverPreview commit={hoverCommit()} position={hoverPosition()} branches={data()?.branches ?? []} />

      <CommitDetailPanel client={props.client!} commit={selectedCommit()} onClose={() => setSelectedCommit(undefined)} />
    </div>
  )
}

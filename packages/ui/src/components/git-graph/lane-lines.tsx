import { For } from "solid-js"
import type { LaneLinesProps } from "./types"

export function LaneLines(props: LaneLinesProps) {
  const BASE_COLORS = [
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

  const lines = () => {
    const commits = props.commits
    const laneMap = props.laneMap
    const branches = props.branches
    const laneWidth = props.laneWidth || 24
    const rowHeight = props.rowHeight || 76

    // 根据分支信息生成泳道颜色
    const laneColors = new Map<number, string>()
    
    // 找出每个分支所在的泳道（根据分支的 commit_hash 找到对应的 lane）
    branches.forEach((branch) => {
      const branchLane = laneMap[branch.commit_hash]
      if (branchLane !== undefined && !laneColors.has(branchLane)) {
        // 分支所在泳道使用固定颜色
        laneColors.set(branchLane, BASE_COLORS[branchLane % BASE_COLORS.length])
      }
    })

    // 为所有使用的泳道分配颜色
    const usedLanes = new Set(Object.values(laneMap))
    usedLanes.forEach((lane) => {
      if (!laneColors.has(lane)) {
        laneColors.set(lane, BASE_COLORS[lane % BASE_COLORS.length])
      }
    })

    const getColor = (lane: number) => laneColors.get(lane) ?? BASE_COLORS[lane % BASE_COLORS.length]

    const result: Array<{
      d: string
      color: string
    }> = []

    // 收集每个泳道的 commit 索引
    const laneCommits = new Map<number, number[]>()
    commits.forEach((commit, index) => {
      const lane = laneMap[commit.hash] ?? 0
      if (!laneCommits.has(lane)) {
        laneCommits.set(lane, [])
      }
      laneCommits.get(lane)!.push(index)
    })

    // 绘制每个泳道的连续垂直线
    laneCommits.forEach((indices, lane) => {
      const x = lane * laneWidth + laneWidth / 2
      const firstIndex = Math.min(...indices)
      const lastIndex = Math.max(...indices)
      const startY = firstIndex * rowHeight + rowHeight / 2
      const endY = lastIndex * rowHeight + rowHeight / 2

      result.push({
        d: `M ${x} ${startY} L ${x} ${endY}`,
        color: getColor(lane),
      })
    })

    // 绘制每个 commit 的圆点
    commits.forEach((commit, index) => {
      const lane = laneMap[commit.hash] ?? 0
      const x = lane * laneWidth + laneWidth / 2
      const y = index * rowHeight + rowHeight / 2

      result.push({
        d: `M ${x} ${y - 5} L ${x} ${y + 5}`,
        color: getColor(lane),
      })
    })

    // 绘制分支和合并的连线
    commits.forEach((commit, index) => {
      const lane = laneMap[commit.hash] ?? 0
      const x = lane * laneWidth + laneWidth / 2
      const y = index * rowHeight + rowHeight / 2

      commit.parents.forEach((parentHash) => {
        const parentIndex = commits.findIndex((c) => c.hash === parentHash)
        if (parentIndex > index) {
          const parentLane = laneMap[parentHash] ?? 0
          const px = parentLane * laneWidth + laneWidth / 2
          const py = parentIndex * rowHeight + rowHeight / 2

          if (parentLane !== lane) {
            result.push({
              d: `M ${x} ${y} L ${px} ${y} L ${px} ${py}`,
              color: getColor(lane),
            })
          }
        }
      })
    })

    return result
  }

  return (
    <svg class="lane-lines" width="100%" height="100%">
      <For each={lines()}>
        {(line) => (
          <path
            d={line.d}
            stroke={line.color}
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        )}
      </For>
    </svg>
  )
}

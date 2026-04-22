import { For } from "solid-js"
import type { LaneLinesProps } from "./types"

export function LaneLines(props: LaneLinesProps) {
  const COLORS = [
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

  const getColor = (lane: number) => COLORS[lane % COLORS.length]

  const lines = () => {
    const commits = props.commits
    const laneMap = props.laneMap
    const laneWidth = props.laneWidth || 24
    const rowHeight = props.rowHeight || 48
    const result: Array<{
      x1: number
      y1: number
      x2: number
      y2: number
      color: string
      type: "vertical" | "curve"
    }> = []

    commits.forEach((commit, index) => {
      const lane = laneMap[commit.hash] ?? 0
      const x = lane * laneWidth + laneWidth / 2
      const y = index * rowHeight + rowHeight / 2

      // 绘制向下的垂直线（连接到下一个提交）
      if (index < commits.length - 1) {
        result.push({
          x1: x,
          y1: y,
          x2: x,
          y2: y + rowHeight / 4,
          color: getColor(lane),
          type: "vertical",
        })
      }

      // 绘制到父 commit 的连线（向上连接）
      commit.parents.forEach((parentHash) => {
        const parentIndex = commits.findIndex((c) => c.hash === parentHash)
        // 父节点应该在当前节点之后（下面）
        if (parentIndex > index) {
          const parentLane = laneMap[parentHash] ?? 0
          const px = parentLane * laneWidth + laneWidth / 2
          const py = parentIndex * rowHeight + rowHeight / 2

          // 如果泳道不同，绘制曲线连接
          if (parentLane !== lane) {
            // 从当前节点向下画一小段
            result.push({
              x1: x,
              y1: y + rowHeight / 8,
              x2: x,
              y2: y + rowHeight / 3,
              color: getColor(lane),
              type: "vertical",
            })
            // 曲线连接到父节点
            result.push({
              x1: x,
              y1: y + rowHeight / 3,
              x2: px,
              y2: py - rowHeight / 4,
              color: getColor(lane),
              type: "curve",
            })
          }
        }
      })
    })

    return result
  }

  return (
    <svg class="lane-lines" width="100%" height="100%">
      {/* 绘制连接线 */}
      <For each={lines()}>
        {(line) =>
          line.type === "curve" ? (
            <path
              d={`M ${line.x1} ${line.y1} C ${line.x1} ${line.y1 + 20}, ${line.x2} ${line.y2 - 20}, ${line.x2} ${line.y2}`}
              stroke={line.color}
              stroke-width="3"
              fill="none"
            />
          ) : (
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.color}
              stroke-width="3"
              fill="none"
            />
          )
        }
      </For>

      {/* 绘制泳道圆点 */}
      <For each={props.commits}>
        {(commit, index) => {
          const lane = props.laneMap[commit.hash] ?? 0
          const x = lane * props.laneWidth + props.laneWidth / 2
          const y = index() * props.rowHeight + props.rowHeight / 2
          return (
            <circle
              cx={x}
              cy={y}
              r="6"
              fill={getColor(lane)}
            />
          )
        }}
      </For>
    </svg>
  )
}

import { Show, For, createSignal, createMemo, createEffect } from "solid-js"
import type { CommitDetailPanelProps } from "./types"
import type { OpencodeClient } from "@opencode-ai/sdk/v2/client"
import { Collapsible } from "@opencode-ai/ui/collapsible"
import { Icon } from "@opencode-ai/ui/icon"
import { FileIcon } from "@opencode-ai/ui/file-icon"
import { DiffChanges } from "@opencode-ai/ui/diff-changes"
import { RadioGroup } from "@opencode-ai/ui/radio-group"
import { parseDiffFromFile } from "@pierre/diffs"
import { getDirectory, getFilename } from "@opencode-ai/util/path"
import { Dynamic } from "solid-js/web"
import { useFileComponent } from "../../context/file"

export interface CommitDetailPanelPropsWithClient extends CommitDetailPanelProps {
  client: OpencodeClient
}

interface FileNode {
  name: string
  path: string
  additions: number
  deletions: number
  children?: FileNode[]
  type: "file" | "directory"
}

function buildFileTree(
  files: Array<{ path: string; additions: number; deletions: number }>,
): FileNode[] {
  if (!files || files.length === 0) {
    return []
  }
  
  const root: FileNode[] = []
  const map = new Map<string, FileNode>()

  // 按路径排序，保证目录顺序一致
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sortedFiles) {
    // 1. 过滤掉空的路径部分
    // 2. 移除 "..." 部分（Git 的省略号表示法）
    const parts = file.path
      .split("/")
      .filter((p) => p.length > 0 && p !== "...")
    
    // 如果所有部分都被过滤掉了，跳过这个文件
    if (parts.length === 0) continue
    
    let currentPath = ""
    let parent: FileNode[] = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      currentPath = currentPath ? `${currentPath}/${part}` : part

      if (!map.has(currentPath)) {
        const node: FileNode = {
          name: part,
          path: currentPath,
          additions: isFile ? file.additions : 0,
          deletions: isFile ? file.deletions : 0,
          type: isFile ? "file" : "directory",
          children: isFile ? undefined : [],
        }
        map.set(currentPath, node)
        parent.push(node)
      } else {
        // 累加目录的统计数据
        const existingNode = map.get(currentPath)!
        if (isFile) {
          existingNode.additions += file.additions
          existingNode.deletions += file.deletions
        }
      }

      if (!isFile) {
        parent = map.get(currentPath)!.children!
      }
    }
  }

  // 优化：只展开根节点层级的单路径，保留后续层级结构
  function flattenRootOnly(nodes: FileNode[]): FileNode[] {
    // 只有当根节点只有一个且是目录时才展开
    if (nodes.length === 1 && nodes[0].type === "directory" && nodes[0].children && nodes[0].children.length > 0) {
      return nodes[0].children!
    }
    return nodes
  }

  return flattenRootOnly(root)
}

function empty(file: string, key: string) {
  return {
    name: file,
    type: "change" as const,
    hunks: [],
    splitLineCount: 0,
    unifiedLineCount: 0,
    isPartial: true,
    deletionLines: [],
    additionLines: [],
    cacheKey: key,
  }
}

function FileTreeNode(props: { 
  node: FileNode
  level: number
  selectedPath: () => string | undefined
  onFileClick?: (path: string) => void 
}) {
  const [expanded, setExpanded] = createSignal(true)
  const isDirectory = props.node.type === "directory"
  const hasChildren = props.node.children && props.node.children.length > 0
  const isSelected = () => props.selectedPath() === props.node.path

  if (isDirectory && hasChildren) {
    return (
      <Collapsible
        variant="ghost"
        class="w-full"
        data-scope="filetree"
        open={expanded()}
        onOpenChange={(open) => setExpanded(open)}
      >
        <Collapsible.Trigger class="w-full">
          <div
            class="file-tree-node"
            classList={{ "file-tree-node-selected": isSelected() }}
            style={{ "padding-left": `${props.level * 12}px` }}
          >
            <Icon name={expanded() ? "chevron-down" : "chevron-right"} size="small" />
            <span class="file-tree-node-name">{props.node.name}</span>
            {props.node.additions > 0 && (
              <span class="file-tree-stat text-insertion">+{props.node.additions}</span>
            )}
            {props.node.deletions > 0 && (
              <span class="file-tree-stat text-deletion">-{props.node.deletions}</span>
            )}
          </div>
        </Collapsible.Trigger>
        <Collapsible.Content class="relative">
          <For each={props.node.children}>
            {(child) => (
              <FileTreeNode 
                node={child} 
                level={props.level + 1} 
                selectedPath={props.selectedPath}
                onFileClick={props.onFileClick}
              />
            )}
          </For>
        </Collapsible.Content>
      </Collapsible>
    )
  }

  // 文件节点
  return (
    <div
      class="file-tree-node"
      classList={{ "file-tree-node-selected": isSelected() }}
      style={{ "padding-left": `${props.level * 12}px` }}
      onClick={() => props.onFileClick?.(props.node.path)}
    >
      <div class="w-4" />
      <span class="file-tree-node-name">{props.node.name}</span>
      {props.node.additions > 0 && (
        <span class="file-tree-stat text-insertion">+{props.node.additions}</span>
      )}
      {props.node.deletions > 0 && (
        <span class="file-tree-stat text-deletion">-{props.node.deletions}</span>
      )}
    </div>
  )
}

export function CommitDetailPanel(props: CommitDetailPanelPropsWithClient) {
  const [files, setFiles] = createSignal<Array<{ path: string; additions: number; deletions: number }>>([])
  const [stats, setStats] = createSignal<{ files_changed: number; insertions: number; deletions: number } | undefined>()
  const [loading, setLoading] = createSignal(false)
  const [selectedPath, setSelectedPath] = createSignal<string | undefined>()
  const [viewingFile, setViewingFile] = createSignal<{ 
    path: string
    diff: string
    fileDiff: ReturnType<typeof parseDiffFromFile>
    before: string
    after: string
  } | undefined>()
  const [diffLoading, setDiffLoading] = createSignal(false)
  const [diffStyle, setDiffStyle] = createSignal<"unified" | "split">("split")
  
  const fileComponent = useFileComponent()

  const fileTree = createMemo(() => buildFileTree(files()))

  const handleFileClick = async (path: string) => {
    setSelectedPath(path)
    
    console.log("[CommitDetail] handleFileClick called with path:", path)
    
    if (!props.commit?.hash || !props.client) {
      console.log("[CommitDetail] missing commit or client:", { hasCommit: !!props.commit, hasClient: !!props.client })
      return
    }
    
    setDiffLoading(true)
    try {
      // 直接使用 SDK client 的 get 方法获取 diff
      const clientAny = props.client as any
      const httpClient = clientAny.client || clientAny
      
      console.log("[CommitDetail] fetching diff:", { hash: props.commit.hash, file: path })
      console.log("[CommitDetail] httpClient:", !!httpClient)
      
      const response = await httpClient.get({
        url: `/git/diff/${props.commit.hash}`,
        query: { file: path },
        parseAs: "text",
      })
      
      console.log("[CommitDetail] raw response:", response)
      
      // 处理响应：可能是 data 直接是文本，或者有 data/response 对象
      let diffText = ""
      if (typeof response === "string") {
        diffText = response
      } else if (response?.data) {
        diffText = response.data
      } else if (response?.response) {
        diffText = await response.response.text()
      }
      
      console.log("[CommitDetail] extracted diff length:", diffText.length)
      console.log("[CommitDetail] diff preview:", diffText.slice(0, 200))
      
      // 检查返回内容是否是有效的 diff
      if (diffText.trim().startsWith("<!DOCTYPE") || diffText.includes("<html") || diffText.includes("You need to enable JavaScript")) {
        throw new Error(
          `Server returned HTML instead of diff.\n\n` +
          `This indicates a backend routing issue.\n` +
          `File: ${path}`
        )
      }
      
      // 检查是否是 tree 对象或错误
      if (diffText.trim().startsWith("tree ") || diffText.includes("fatal:") || diffText.includes("does not exist")) {
        throw new Error(`File not found in this commit: ${path}`)
      }
      
      // 从 git diff 解析 before 和 after 内容
      const beforeLines: string[] = []
      const afterLines: string[] = []
      
      for (const line of diffText.split('\n')) {
        if (line.startsWith('@@')) {
          // New hunk - 跳过
          continue
        } else if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
          // Header lines - 跳过
          continue
        } else if (line.startsWith('-')) {
          // Deletion
          beforeLines.push(line.slice(1))
        } else if (line.startsWith('+')) {
          // Addition
          afterLines.push(line.slice(1))
        } else if (line.startsWith(' ')) {
          // Context line
          const content = line.slice(1)
          beforeLines.push(content)
          afterLines.push(content)
        }
      }
      
      const before = beforeLines.join('\n')
      const after = afterLines.join('\n')
      
      console.log("[CommitDetail] parsed before length:", before.length, "after length:", after.length)
      
      // 使用 Pierre 的 parseDiffFromFile 生成 fileDiff
      const fileDiff = parseDiffFromFile(
        { name: path, contents: before },
        { name: path, contents: after }
      )
      
      console.log("[CommitDetail] parsed fileDiff:", { 
        hunks: fileDiff.hunks.length, 
        unifiedLineCount: fileDiff.unifiedLineCount,
        splitLineCount: fileDiff.splitLineCount 
      })
      console.log("[CommitDetail] success, length:", diffText.length)
      
      setViewingFile({ path, diff: diffText, fileDiff, before, after })
      setDiffLoading(false)
    } catch (error) {
      console.error("[CommitDetail] failed:", error)
      setViewingFile({ 
        path, 
        diff: `Error: ${error instanceof Error ? error.message : String(error)}`,
        fileDiff: empty(path, path),
        before: "",
        after: ""
      })
      setDiffLoading(false)
    }
  }

  // 监听 commit 变化并加载文件变更
  createEffect(async () => {
    const commit = props.commit
    if (!commit?.hash) {
      setFiles([])
      setStats(undefined)
      setSelectedPath(undefined)
      return
    }
    
    setLoading(true)
    
    try {
      // 调用新 API /git/commit/:hash
      const result = await props.client.git.commit({ hash: commit.hash })
      
      if (result.data) {
        setFiles(result.data.files)
        setStats(result.data.stats)
      } else {
        setFiles([])
        setStats(undefined)
      }
      setLoading(false)
    } catch (error) {
      console.error("[CommitDetail] failed to load files:", error)
      setFiles([])
      setStats(undefined)
      setLoading(false)
    }
  })

  return (
    <Show when={props.commit}>
      <div class="commit-detail-panel">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-16-bold">Commit Details</h3>
          <button onClick={props.onClose} class="p-1 hover:bg-bg-subtle rounded">
            ✕
          </button>
        </div>

        {/* 提交信息 */}
        <div class="commit-detail-section">
          <div class="text-14-bold mb-2">{props.commit!.message}</div>
        </div>

        {/* 作者信息 */}
        <div class="commit-detail-section">
          <div class="text-12-regular text-text-weak">
            <span class="text-text">{props.commit!.author}</span>
            {" committed "}
            {new Date(props.commit!.author_date * 1000).toLocaleString()}
          </div>
        </div>

        {/* Commit Hash */}
        <div class="commit-detail-section">
          <div class="text-12-bold text-text-weak mb-1">Commit</div>
          <code class="text-12-regular bg-bg-subtle px-2 py-1 rounded block w-fit">{props.commit!.short_hash}</code>
        </div>

        {/* 分支标签 */}
        <Show when={props.commit!.refs && props.commit!.refs!.length > 0}>
          <div class="commit-detail-section">
            <div class="text-12-bold text-text-weak mb-1">Refs</div>
            <div class="flex flex-wrap gap-1">
              <For each={props.commit!.refs}>{(ref) => <span class="ref-badge ref-badge-local">{ref}</span>}</For>
            </div>
          </div>
        </Show>

        {/* 变更统计 */}
        <Show when={stats()}>
          <div class="commit-detail-section">
            <div class="text-12-bold text-text-weak mb-2">Changes</div>
            <div class="flex items-center gap-3 text-12-regular">
              <span class="text-insertion">+{stats()!.insertions} insertions(+)</span>
              <span class="text-deletion">-{stats()!.deletions} deletions(-)</span>
            </div>
            <div class="text-12-regular text-text-weak mt-1">{stats()!.files_changed} files changed</div>
          </div>
        </Show>

        {/* 变更的文件树 */}
        <Show when={!loading() && files().length > 0}>
          <div class="commit-detail-section changed-files-section">
            <div class="text-12-bold text-text-weak mb-2">Changed Files</div>
            <div class="file-tree-container">
              <For each={fileTree()}>
                {(node) => (
                  <FileTreeNode 
                    node={node} 
                    level={0} 
                    selectedPath={selectedPath}
                    onFileClick={handleFileClick}
                  />
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Diff 弹窗 */}
        <Show when={viewingFile()}>
          <div class="diff-modal-overlay" onClick={() => setViewingFile(undefined)}>
            <div class="diff-modal diff-modal-large" onClick={(e) => e.stopPropagation()}>
              <div class="diff-modal-header">
                <div class="flex items-center gap-2">
                  <FileIcon node={{ path: viewingFile()!.path, type: "file" }} />
                  <span class="text-14-bold">{viewingFile()?.path}</span>
                </div>
                <div class="flex items-center gap-2">
                  <RadioGroup
                    options={["unified", "split"] as const}
                    current={diffStyle()}
                    size="small"
                    value={(style) => style}
                    label={(style) => style === "unified" ? "统一" : "拆分"}
                    onSelect={(style) => style && setDiffStyle(style)}
                  />
                  <button class="diff-modal-close" onClick={() => setViewingFile(undefined)}>✕</button>
                </div>
              </div>
              <div class="diff-modal-body">
                <Show when={diffLoading()}>
                  <div class="text-12-regular text-text-weak">Loading diff...</div>
                </Show>
                <Show when={!diffLoading() && viewingFile()}>
                  <Dynamic
                    component={fileComponent}
                    mode="diff"
                    fileDiff={viewingFile()!.fileDiff}
                    diffStyle={diffStyle()}
                    before={viewingFile()!.before}
                    after={viewingFile()!.after}
                    enableLineSelection={false}
                    enableHoverUtility={false}
                  />
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  )
}

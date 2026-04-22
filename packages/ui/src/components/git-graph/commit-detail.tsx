import { Show, For, createSignal, onMount } from "solid-js"
import type { CommitDetailPanelProps } from "./types"
import type { OpencodeClient } from "@opencode-ai/sdk/v2/client"

export interface CommitDetailPanelPropsWithClient extends CommitDetailPanelProps {
  client: OpencodeClient
}

export function CommitDetailPanel(props: CommitDetailPanelPropsWithClient) {
  const [files, setFiles] = createSignal<Array<{ path: string; additions: number; deletions: number }>>([])
  const [stats, setStats] = createSignal<{ files_changed: number; insertions: number; deletions: number } | undefined>()
  const [loading, setLoading] = createSignal(false)

  // 加载文件变更
  onMount(async () => {
    if (!props.commit?.hash) return
    setLoading(true)
    console.log("[CommitDetail] loading files for hash:", props.commit.hash)
    try {
      // 调用新 API /git/commit/:hash
      const result = await props.client.git.commit({ hash: props.commit.hash })
      console.log("[CommitDetail] API result:", result)
      if (result.data) {
        console.log("[CommitDetail] files:", result.data.files)
        console.log("[CommitDetail] stats:", result.data.stats)
        setFiles(result.data.files)
        setStats(result.data.stats)
      }
      setLoading(false)
    } catch (error) {
      console.error("[CommitDetail] failed to load files:", error)
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

        {/* 变更的文件列表 */}
        <Show when={!loading() && files().length > 0}>
          <div class="commit-detail-section">
            <div class="text-12-bold text-text-weak mb-2">Changed Files</div>
            <div class="flex flex-col gap-1">
              <For each={files()}>
                {(file) => (
                  <div class="text-12-regular flex items-center justify-between py-1">
                    <span class="truncate mr-2">{file.path}</span>
                    <span class="text-text-weak flex-shrink-0">
                      <Show when={file.additions > 0}>
                        <span class="text-insertion mr-2">+{file.additions}</span>
                      </Show>
                      <Show when={file.deletions > 0}>
                        <span class="text-deletion">-{file.deletions}</span>
                      </Show>
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* 加载中 */}
        <Show when={loading()}>
          <div class="commit-detail-section">
            <div class="text-12-bold text-text-weak mb-2">Changed Files</div>
            <div class="text-12-regular text-text-weak">Loading file changes...</div>
          </div>
        </Show>

        {/* 操作按钮 */}
        <div class="commit-detail-section">
          <button class="w-full btn btn-primary mb-2">View Changes</button>
        </div>
      </div>
    </Show>
  )
}

import { Show, For } from "solid-js"
import { Portal } from "solid-js/web"
import type { HoverPreviewProps } from "./types"

export function HoverPreview(props: HoverPreviewProps) {
  return (
    <Show when={props.commit}>
      <Portal>
        <div
          class="hover-preview"
          style={{
            left: `${props.position.x + 15}px`,
            top: `${props.position.y + 15}px`,
            position: "fixed",
            "z-index": "9999",
          }}
        >
          <div class="hover-preview-content">
            <div class="text-14-bold mb-2">{props.commit!.message}</div>
            <div class="text-12-regular text-text-weak mb-1">{props.commit!.author}</div>
            <div class="text-12-regular text-text-weak mb-2">
              {new Date(props.commit!.author_date * 1000).toLocaleString()}
            </div>
            <Show when={props.commit!.refs && props.commit!.refs!.length > 0}>
              <div class="flex flex-wrap gap-1">
                <For each={props.commit!.refs}>{(ref) => <span class="ref-badge ref-badge-local">{ref}</span>}</For>
              </div>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  )
}

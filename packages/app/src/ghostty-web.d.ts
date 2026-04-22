declare module "ghostty-web" {
  // Ghostty 主类
  export interface GhosttyConstructor {
    new (options?: { [key: string]: any }): Ghostty
    load(): Promise<Ghostty>
  }

  export interface Ghostty {
    element: HTMLElement
    open(): void
    close(): void
    onNewWindow(callback: () => void): void
    onOpenConfig(callback: () => void): void
    onRunOnStartup(callback: () => void): void
    onUpdateAvailable(callback: () => void): void
    onUpdate(callback: () => void): void
    onQuit(callback: () => void): void
    onReloadConfig(callback: () => void): void
  }

  // Terminal 接口
  export interface Terminal {
    element: HTMLElement
    rows: number
    cols: number
    textarea: HTMLTextAreaElement
    options: { [key: string]: any }
    
    // 方法
    loadAddon(addon: ITerminalAddon): void
    dispose(): void
    write(data: string | Uint8Array, callback?: () => void): void
    reset(): void
    focus(): void
    paste(data?: string): void
    getSelection(): string | undefined
    getViewportY(): number
    scrollToLine(line: number): void
    open(container: HTMLElement): void
    attachCustomKeyEventHandler(handler: (event: KeyboardEvent) => boolean): void
    onResize(callback: (size: { cols: number; rows: number }) => void): void
    onData(callback: (data: string) => void): void
    onKey(callback: (key: { key: string; domEvent: KeyboardEvent }) => void): void
    
    // Buffer 访问
    buffer: {
      active: IBuffer
      normal: IBuffer
      alternate: IBuffer
    }
  }

  export interface TerminalConstructor {
    new (options?: { [key: string]: any }): Terminal
  }

  // Buffer 相关接口
  export interface IBuffer {
    type: "normal" | "alternate"
    cursorX: number
    cursorY: number
    viewportY: number
    baseY: number
    length: number
    getLine(y: number): IBufferLine | undefined
    getNullCell(): IBufferCell
  }

  export interface IBufferLine {
    length: number
    isWrapped: boolean
    getCell(x: number, cell?: IBufferCell): IBufferCell | undefined
    translateToString(startCol?: number, endCol?: number, includeRightMargin?: boolean): string
    translateToString(includeRightMargin?: boolean): string
  }

  export interface IBufferCell {
    getWidth(): number
    getChars(): string
    getCode(): number
    isCombined(): number
    getFg(): number
    getBg(): number
    getFgColor(): number
    getBgColor(): number
    isInverse(): boolean
    isBold(): boolean
    isUnderline(): boolean
    isBlink(): boolean
    isInvisible(): boolean
    isItalic(): boolean
    isDim(): boolean
    isStrikethrough(): boolean
  }

  export interface IBufferRange {
    start: { x: number; y: number }
    end: { x: number; y: number }
  }

  // Addon 接口
  export interface ITerminalAddon {
    activate(terminal: Terminal): void
    dispose(): void
  }

  export interface ITerminalCore {
    element: HTMLElement
    rows: number
    cols: number
  }

  // FitAddon
  export interface FitAddon extends ITerminalAddon {
    fit(): void
    observeResize(element: HTMLElement, callback: (size: { cols: number; rows: number }) => void): void
    observeResize(callback: (size: { cols: number; rows: number }) => void): void
    observeResize(): void
  }

  export interface FitAddonConstructor {
    new (): FitAddon
  }

  // SerializeAddon
  export interface SerializeAddon extends ITerminalAddon {
    serialize(options?: { [key: string]: any }): string
  }

  export interface SerializeAddonConstructor {
    new (): SerializeAddon
  }

  // 导出构造函数
  export const Ghostty: GhosttyConstructor
  export const Terminal: TerminalConstructor
  export const FitAddon: FitAddonConstructor
  export const SerializeAddon: SerializeAddonConstructor
}

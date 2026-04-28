import * as CrossSpawnSpawner from "@/effect/cross-spawn-spawner"
import { Effect, Layer, Context, Stream } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"

export namespace Git {
  const cfg = [
    "--no-optional-locks",
    "-c",
    "core.autocrlf=false",
    "-c",
    "core.fsmonitor=false",
    "-c",
    "core.longpaths=true",
    "-c",
    "core.symlinks=true",
    "-c",
    "core.quotepath=false",
  ] as const

  const out = (result: { text(): string }) => result.text().trim()
  const nuls = (text: string) => text.split("\0").filter(Boolean)
  const fail = (err: unknown) =>
    ({
      exitCode: 1,
      text: () => "",
      stdout: Buffer.alloc(0),
      stderr: Buffer.from(err instanceof Error ? err.message : String(err)),
    }) satisfies Result

  export type Kind = "added" | "deleted" | "modified"

  export type Base = {
    readonly name: string
    readonly ref: string
  }

  export type Item = {
    readonly file: string
    readonly code: string
    readonly status: Kind
  }

  export type Stat = {
    readonly file: string
    readonly additions: number
    readonly deletions: number
  }

  export type Commit = {
    readonly hash: string
    readonly short_hash: string
    readonly message: string
    readonly author: string
    readonly author_date: number
    readonly parents: string[]
    readonly refs?: string[]
  }

  export type Branch = {
    readonly name: string
    readonly type: "local" | "remote"
    readonly commit_hash: string
  }

  export interface Result {
    readonly exitCode: number
    readonly text: () => string
    readonly stdout: Buffer
    readonly stderr: Buffer
  }

  export interface Options {
    readonly cwd: string
    readonly env?: Record<string, string>
  }

  export interface Interface {
    readonly run: (args: string[], opts: Options) => Effect.Effect<Result>
    readonly branch: (cwd: string) => Effect.Effect<string | undefined>
    readonly prefix: (cwd: string) => Effect.Effect<string>
    readonly defaultBranch: (cwd: string) => Effect.Effect<Base | undefined>
    readonly hasHead: (cwd: string) => Effect.Effect<boolean>
    readonly mergeBase: (cwd: string, base: string, head?: string) => Effect.Effect<string | undefined>
    readonly show: (cwd: string, ref: string, file: string, prefix?: string) => Effect.Effect<string>
    readonly status: (cwd: string) => Effect.Effect<Item[]>
    readonly diff: (cwd: string, ref: string) => Effect.Effect<Item[]>
    readonly diffFile: (cwd: string, ref: string, file: string) => Effect.Effect<string>
    readonly stats: (cwd: string, ref: string) => Effect.Effect<Stat[]>
    readonly log: (cwd: string, limit: number, offset?: number) => Effect.Effect<Commit[]>
    readonly showStat: (cwd: string, hash: string) => Effect.Effect<{ files: Array<{ path: string; additions: number; deletions: number }>; stats: { files_changed: number; insertions: number; deletions: number } }>
    readonly getBranches: (cwd: string) => Effect.Effect<Branch[]>
    readonly getCurrentBranch: (cwd: string) => Effect.Effect<string | undefined>
  }

  const kind = (code: string): Kind => {
    if (code === "??") return "added"
    if (code.includes("U")) return "modified"
    if (code.includes("A") && !code.includes("D")) return "added"
    if (code.includes("D") && !code.includes("A")) return "deleted"
    return "modified"
  }

  export class Service extends Context.Service<Service, Interface>()("@opencode/Git") {}

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner

      const run = Effect.fn("Git.run")(
        function* (args: string[], opts: Options) {
          const proc = ChildProcess.make("git", [...cfg, ...args], {
            cwd: opts.cwd,
            env: opts.env,
            extendEnv: true,
            stdin: "ignore",
            stdout: "pipe",
            stderr: "pipe",
          })
          const handle = yield* spawner.spawn(proc)
          const [stdout, stderr] = yield* Effect.all(
            [Stream.mkString(Stream.decodeText(handle.stdout)), Stream.mkString(Stream.decodeText(handle.stderr))],
            { concurrency: 2 },
          )
          return {
            exitCode: yield* handle.exitCode,
            text: () => stdout,
            stdout: Buffer.from(stdout),
            stderr: Buffer.from(stderr),
          } satisfies Result
        },
        Effect.scoped,
        Effect.catch((err) => Effect.succeed(fail(err))),
      )

      const text = Effect.fn("Git.text")(function* (args: string[], opts: Options) {
        return (yield* run(args, opts)).text()
      })

      const lines = Effect.fn("Git.lines")(function* (args: string[], opts: Options) {
        return (yield* text(args, opts))
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean)
      })

      const refs = Effect.fnUntraced(function* (cwd: string) {
        return yield* lines(["for-each-ref", "--format=%(refname:short)", "refs/heads"], { cwd })
      })

      const configured = Effect.fnUntraced(function* (cwd: string, list: string[]) {
        const result = yield* run(["config", "init.defaultBranch"], { cwd })
        const name = out(result)
        if (!name || !list.includes(name)) return
        return { name, ref: name } satisfies Base
      })

      const primary = Effect.fnUntraced(function* (cwd: string) {
        const list = yield* lines(["remote"], { cwd })
        if (list.includes("origin")) return "origin"
        if (list.length === 1) return list[0]
        if (list.includes("upstream")) return "upstream"
        return list[0]
      })

      const branch = Effect.fn("Git.branch")(function* (cwd: string) {
        const result = yield* run(["symbolic-ref", "--quiet", "--short", "HEAD"], { cwd })
        if (result.exitCode !== 0) return
        const text = out(result)
        return text || undefined
      })

      const prefix = Effect.fn("Git.prefix")(function* (cwd: string) {
        const result = yield* run(["rev-parse", "--show-prefix"], { cwd })
        if (result.exitCode !== 0) return ""
        return out(result)
      })

      const defaultBranch = Effect.fn("Git.defaultBranch")(function* (cwd: string) {
        const remote = yield* primary(cwd)
        if (remote) {
          const head = yield* run(["symbolic-ref", `refs/remotes/${remote}/HEAD`], { cwd })
          if (head.exitCode === 0) {
            const ref = out(head).replace(/^refs\/remotes\//, "")
            const name = ref.startsWith(`${remote}/`) ? ref.slice(`${remote}/`.length) : ""
            if (name) return { name, ref } satisfies Base
          }
        }

        const list = yield* refs(cwd)
        const next = yield* configured(cwd, list)
        if (next) return next
        if (list.includes("main")) return { name: "main", ref: "main" } satisfies Base
        if (list.includes("master")) return { name: "master", ref: "master" } satisfies Base
      })

      const hasHead = Effect.fn("Git.hasHead")(function* (cwd: string) {
        const result = yield* run(["rev-parse", "--verify", "HEAD"], { cwd })
        return result.exitCode === 0
      })

      const mergeBase = Effect.fn("Git.mergeBase")(function* (cwd: string, base: string, head = "HEAD") {
        const result = yield* run(["merge-base", base, head], { cwd })
        if (result.exitCode !== 0) return
        const text = out(result)
        return text || undefined
      })

      const show = Effect.fn("Git.show")(function* (cwd: string, ref: string, file: string, prefix = "") {
        const target = prefix ? `${prefix}${file}` : file
        const result = yield* run(["show", `${ref}:${target}`], { cwd })
        if (result.exitCode !== 0) return ""
        if (result.stdout.includes(0)) return ""
        return result.text()
      })

      const status = Effect.fn("Git.status")(function* (cwd: string) {
        return nuls(
          yield* text(["status", "--porcelain=v1", "--untracked-files=all", "--no-renames", "-z", "--", "."], {
            cwd,
          }),
        ).flatMap((item) => {
          const file = item.slice(3)
          if (!file) return []
          const code = item.slice(0, 2)
          return [{ file, code, status: kind(code) } satisfies Item]
        })
      })

      const diff = Effect.fn("Git.diff")(function* (cwd: string, ref: string) {
        const list = nuls(
          yield* text(["diff", "--no-ext-diff", "--no-renames", "--name-status", "-z", ref, "--", "."], { cwd }),
        )
        return list.flatMap((code, idx) => {
          if (idx % 2 !== 0) return []
          const file = list[idx + 1]
          if (!code || !file) return []
          return [{ file, code, status: kind(code) } satisfies Item]
        })
      })

      const diffFile = Effect.fn("Git.diffFile")(function* (cwd: string, ref: string, file: string) {
        console.log("[Git.diffFile] called:", { cwd, ref, file })
        
        // 首先尝试使用 git diff 获取父 commit 和当前 commit 之间的差异
        const diffArgs = ["diff", "--no-ext-diff", "--no-renames", "-U", `${ref}^..${ref}`, "--", file]
        console.log("[Git.diffFile] trying diff with args:", diffArgs)
        const diffResult = yield* text(diffArgs, { cwd }).pipe(Effect.option)
        
        if (diffResult._tag === "Some" && diffResult.value.trim().length > 0 && !diffResult.value.trim().startsWith("tree ")) {
          console.log("[Git.diffFile] diff succeeded, length:", diffResult.value.length)
          return diffResult.value
        }
        
        console.log("[Git.diffFile] diff failed or returned tree, trying show")
        
        // 根 commit 或失败的情况，使用 git show 获取文件内容
        const showArgs = ["show", "--no-ext-diff", "--format=", `${ref}:${file}`]
        console.log("[Git.diffFile] trying show with args:", showArgs)
        const showResult = yield* text(showArgs, { cwd }).pipe(Effect.option)
        
        if (showResult._tag === "None") {
          console.log("[Git.diffFile] show returned none")
          return ""
        }
        
        const showValue = showResult.value
        console.log("[Git.diffFile] show raw output (first 200 chars):", showValue.slice(0, 200))
        
        // 检查是否是 tree 对象（说明文件不存在于该 commit 中）
        if (showValue.trim().startsWith("tree ")) {
          console.log("[Git.diffFile] detected tree object - file may not exist in this commit")
          return ""
        }
        
        // 检查是否包含错误信息
        if (showValue.includes("fatal:") || showValue.includes("does not exist")) {
          console.log("[Git.diffFile] detected error message")
          return ""
        }
        
        console.log("[Git.diffFile] show succeeded, length:", showValue.length)
        return showValue
      })

      const stats = Effect.fn("Git.stats")(function* (cwd: string, ref: string) {
        return nuls(
          yield* text(["diff", "--no-ext-diff", "--no-renames", "--numstat", "-z", ref, "--", "."], { cwd }),
        ).flatMap((item) => {
          const a = item.indexOf("\t")
          const b = item.indexOf("\t", a + 1)
          if (a === -1 || b === -1) return []
          const file = item.slice(b + 1)
          if (!file) return []
          const adds = item.slice(0, a)
          const dels = item.slice(a + 1, b)
          const additions = adds === "-" ? 0 : Number.parseInt(adds || "0", 10)
          const deletions = dels === "-" ? 0 : Number.parseInt(dels || "0", 10)
          return [
            {
              file,
              additions: Number.isFinite(additions) ? additions : 0,
              deletions: Number.isFinite(deletions) ? deletions : 0,
            } satisfies Stat,
          ]
        })
      })

      const log = Effect.fn("Git.log")(function* (cwd: string, limit: number = 100, offset: number = 0) {
        // 使用更简单的格式，避免 JSON 转义问题
        const format = "%H%x00%h%x00%s%x00%an%x00%at%x00%P%x00%D"
        const args = [
          "log",
          `--format=${format}`,
          `-n ${limit}`,
          "--all",
        ]
        // 使用 --skip 参数跳过前 offset 条提交
        if (offset > 0) {
          args.push(`--skip=${offset}`)
        }
        const output = yield* text(args, { cwd })
        const commits = output
          .split("\n")
          .filter(Boolean)
          .flatMap((line) => {
            try {
              const parts = line.split("\0")
              if (parts.length < 7) return []
              return [
                {
                  hash: parts[0] ?? "",
                  short_hash: parts[1] ?? "",
                  message: parts[2] ?? "",
                  author: parts[3] ?? "",
                  author_date: Number.parseInt(parts[4] ?? "0", 10),
                  parents: parts[5] ? parts[5].split(/\s+/).filter(Boolean) : [],
                  refs: parts[6] ? parts[6].split(/,\s*/).filter(Boolean) : undefined,
                } satisfies Commit,
              ]
            } catch (e) {
              console.error("[Git.log] parse error:", e, "line:", line)
              return []
            }
          })
        return commits
      })

      const showStat = Effect.fn("Git.showStat")(function* (cwd: string, hash: string) {
        // 使用 --numstat 获取完整路径和统计（不会被截断）
        const numstatOutput = yield* text([
          "show",
          "--numstat",
          "--format=",
          hash,
        ], { cwd })
        
        // 解析 numstat 输出
        // 格式：additions\tdeletions\tpath
        const numstatLines = numstatOutput.split("\n").filter(Boolean)
        const files: Array<{ path: string; additions: number; deletions: number }> = []
        
        for (const line of numstatLines) {
          const numstatMatch = line.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/)
          if (numstatMatch) {
            const additions = numstatMatch[1] === "-" ? 0 : parseInt(numstatMatch[1])
            const deletions = numstatMatch[2] === "-" ? 0 : parseInt(numstatMatch[2])
            const path = numstatMatch[3]?.trim() ?? ""
            files.push({ path, additions, deletions })
          }
        }

        // 获取总体统计（使用 --shortstat）
        const statOutput = yield* text([
          "show",
          "--shortstat",
          "--format=",
          hash,
        ], { cwd })
        
        const statsMatch = statOutput.match(/(\d+) files? changed(?:,\s*(\d+) insertions?\(\+\))?(?:,\s*(\d+) deletions?\(-\))?/)
        const stats = {
          files_changed: parseInt(statsMatch?.[1] ?? "0"),
          insertions: parseInt(statsMatch?.[2] ?? "0"),
          deletions: parseInt(statsMatch?.[3] ?? "0"),
        }

        console.log("[Git.showStat] returning files:", files.slice(0, 3), "stats:", stats)

        return {
          files,
          stats,
        }
      })

      const getBranches = Effect.fn("Git.getBranches")(function* (cwd: string) {
        const local = yield* text(["branch", "--format=%(refname:short)", "--no-optional-locks"], { cwd })
        const remote = yield* text(["branch", "-r", "--format=%(refname:short)", "--no-optional-locks"], { cwd })

        const branches: Branch[] = []

        local
          .split("\n")
          .filter(Boolean)
          .forEach((line) => {
            const name = line.trim()
            if (name) branches.push({ name, type: "local" as const, commit_hash: "" })
          })

        remote
          .split("\n")
          .filter(Boolean)
          .forEach((line) => {
            const name = line.trim()
            if (name && !name.includes("HEAD")) branches.push({ name, type: "remote" as const, commit_hash: "" })
          })

        return branches
      })

      const getCurrentBranch = Effect.fn("Git.getCurrentBranch")(function* (cwd: string) {
        const result = yield* run(["rev-parse", "--abbrev-ref", "HEAD"], { cwd })
        if (result.exitCode !== 0) return undefined
        const text = out(result)
        return text || undefined
      })

      return Service.of({
        run,
        branch,
        prefix,
        defaultBranch,
        hasHead,
        mergeBase,
        show,
        status,
        diff,
        diffFile,
        stats,
        log,
        showStat,
        getBranches,
        getCurrentBranch,
      })
    }),
  )

  export const defaultLayer = layer.pipe(Layer.provide(CrossSpawnSpawner.defaultLayer))
}

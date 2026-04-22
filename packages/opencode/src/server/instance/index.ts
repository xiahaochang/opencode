import { describeRoute, resolver, validator } from "hono-openapi"
import { Hono } from "hono"
import type { UpgradeWebSocket } from "hono/ws"
import { Effect } from "effect"
import z from "zod"
import { Format } from "../../format"
import { TuiRoutes } from "./tui"
import { Instance } from "../../project/instance"
import { Vcs } from "../../project/vcs"
import { Agent } from "../../agent/agent"
import { Skill } from "../../skill"
import { Global } from "../../global"
import { LSP } from "../../lsp"
import { Command } from "../../command"
import { QuestionRoutes } from "./question"
import { PermissionRoutes } from "./permission"
import { ProjectRoutes } from "./project"
import { SessionRoutes } from "./session"
import { PtyRoutes } from "./pty"
import { McpRoutes } from "./mcp"
import { FileRoutes } from "./file"
import { ConfigRoutes } from "./config"
import { ExperimentalRoutes } from "./experimental"
import { ProviderRoutes } from "./provider"
import { EventRoutes } from "./event"
import { WorkspaceRouterMiddleware } from "./middleware"
import { AppRuntime } from "@/effect/app-runtime"

export const InstanceRoutes = (upgrade: UpgradeWebSocket): Hono =>
  new Hono()
    .use(WorkspaceRouterMiddleware(upgrade))
    .route("/project", ProjectRoutes())
    .route("/pty", PtyRoutes(upgrade))
    .route("/config", ConfigRoutes())
    .route("/experimental", ExperimentalRoutes())
    .route("/session", SessionRoutes())
    .route("/permission", PermissionRoutes())
    .route("/question", QuestionRoutes())
    .route("/provider", ProviderRoutes())
    .route("/", FileRoutes())
    .route("/", EventRoutes())
    .route("/mcp", McpRoutes())
    .route("/tui", TuiRoutes())
    .post(
      "/instance/dispose",
      describeRoute({
        summary: "Dispose instance",
        description: "Clean up and dispose the current OpenCode instance, releasing all resources.",
        operationId: "instance.dispose",
        responses: {
          200: {
            description: "Instance disposed",
            content: {
              "application/json": {
                schema: resolver(z.boolean()),
              },
            },
          },
        },
      }),
      async (c) => {
        await Instance.dispose()
        return c.json(true)
      },
    )
    .get(
      "/path",
      describeRoute({
        summary: "Get paths",
        description: "Retrieve the current working directory and related path information for the OpenCode instance.",
        operationId: "path.get",
        responses: {
          200: {
            description: "Path",
            content: {
              "application/json": {
                schema: resolver(
                  z
                    .object({
                      home: z.string(),
                      state: z.string(),
                      config: z.string(),
                      worktree: z.string(),
                      directory: z.string(),
                    })
                    .meta({
                      ref: "Path",
                    }),
                ),
              },
            },
          },
        },
      }),
      async (c) => {
        return c.json({
          home: Global.Path.home,
          state: Global.Path.state,
          config: Global.Path.config,
          worktree: Instance.worktree,
          directory: Instance.directory,
        })
      },
    )
    .get(
      "/vcs",
      describeRoute({
        summary: "Get VCS info",
        description: "Retrieve version control system (VCS) information for the current project, such as git branch.",
        operationId: "vcs.get",
        responses: {
          200: {
            description: "VCS info",
            content: {
              "application/json": {
                schema: resolver(Vcs.Info),
              },
            },
          },
        },
      }),
      async (c) => {
        return c.json(
          await AppRuntime.runPromise(
            Effect.gen(function* () {
              const vcs = yield* Vcs.Service
              const [branch, default_branch] = yield* Effect.all([vcs.branch(), vcs.defaultBranch()], {
                concurrency: 2,
              })
              return { branch, default_branch }
            }),
          ),
        )
      },
    )
    .get(
      "/vcs/diff",
      describeRoute({
        summary: "Get VCS diff",
        description: "Retrieve the current git diff for the working tree or against the default branch.",
        operationId: "vcs.diff",
        responses: {
          200: {
            description: "VCS diff",
            content: {
              "application/json": {
                schema: resolver(Vcs.FileDiff.array()),
              },
            },
          },
        },
      }),
      validator(
        "query",
        z.object({
          mode: Vcs.Mode,
        }),
      ),
      async (c) => {
        return c.json(
          await AppRuntime.runPromise(
            Effect.gen(function* () {
              const vcs = yield* Vcs.Service
              return yield* vcs.diff(c.req.valid("query").mode)
            }),
          ),
        )
      },
    )
    .get(
      "/git/graph",
      describeRoute({
        summary: "Get Git Graph data",
        description:
          "Retrieve Git commit history with branch visualization data, including commits, branches, and lane mapping.",
        operationId: "git.graph",
        responses: {
          200: {
            description: "Git Graph data",
            content: {
              "application/json": {
                schema: resolver(Vcs.GitGraphData),
              },
            },
          },
        },
      }),
      validator(
        "query",
        z.object({
          limit: z.coerce.number().default(100),
          offset: z.coerce.number().default(0),
        }),
      ),
      async (c) => {
        const query = c.req.valid("query")
        console.log("[API /git/graph] called with query:", query)
        console.log("[API /git/graph] directory:", Instance.directory)
        
        return c.json(
          await AppRuntime.runPromise(
            Effect.gen(function* () {
              const vcs = yield* Vcs.Service
              const result = yield* vcs.graph({ limit: query.limit, offset: query.offset })
              console.log("[API /git/graph] result commits:", result.commits.length)
              return result
            }),
          ),
        )
      },
    )
    .get(
      "/git/commit/:hash",
      describeRoute({
        summary: "Get commit details",
        description: "Get file changes for a specific Git commit.",
        operationId: "git.commit",
        responses: {
          200: {
            description: "Commit details with file changes",
            content: {
              "application/json": {
                schema: resolver(Vcs.CommitDetail),
              },
            },
          },
        },
      }),
      validator(
        "param",
        z.object({
          hash: z.string(),
        }),
      ),
      async (c) => {
        const hash = c.req.valid("param").hash
        console.log("[API /git/commit/:hash] called with hash:", hash)

        try {
          return c.json(
            await AppRuntime.runPromise(
              Effect.gen(function* () {
                const vcs = yield* Vcs.Service
                const result = yield* vcs.commit(hash)
                console.log("[API /git/commit/:hash] result files:", result.files.length)
                return result
              }),
            ),
          )
        } catch (error) {
          console.error("[API /git/commit/:hash] error:", error)
          return c.json({ error: String(error) }, 500)
        }
      },
    )
    .get(
      "/command",
      describeRoute({
        summary: "List commands",
        description: "Get a list of all available commands in the OpenCode system.",
        operationId: "command.list",
        responses: {
          200: {
            description: "List of commands",
            content: {
              "application/json": {
                schema: resolver(Command.Info.array()),
              },
            },
          },
        },
      }),
      async (c) => {
        const commands = await AppRuntime.runPromise(Command.Service.use((svc) => svc.list()))
        return c.json(commands)
      },
    )
    .get(
      "/agent",
      describeRoute({
        summary: "List agents",
        description: "Get a list of all available AI agents in the OpenCode system.",
        operationId: "app.agents",
        responses: {
          200: {
            description: "List of agents",
            content: {
              "application/json": {
                schema: resolver(Agent.Info.array()),
              },
            },
          },
        },
      }),
      async (c) => {
        const modes = await AppRuntime.runPromise(Agent.Service.use((svc) => svc.list()))
        return c.json(modes)
      },
    )
    .get(
      "/skill",
      describeRoute({
        summary: "List skills",
        description: "Get a list of all available skills in the OpenCode system.",
        operationId: "app.skills",
        responses: {
          200: {
            description: "List of skills",
            content: {
              "application/json": {
                schema: resolver(Skill.Info.array()),
              },
            },
          },
        },
      }),
      async (c) => {
        const skills = await AppRuntime.runPromise(
          Effect.gen(function* () {
            const skill = yield* Skill.Service
            return yield* skill.all()
          }),
        )
        return c.json(skills)
      },
    )
    .get(
      "/lsp",
      describeRoute({
        summary: "Get LSP status",
        description: "Get LSP server status",
        operationId: "lsp.status",
        responses: {
          200: {
            description: "LSP server status",
            content: {
              "application/json": {
                schema: resolver(LSP.Status.array()),
              },
            },
          },
        },
      }),
      async (c) => {
        const items = await AppRuntime.runPromise(LSP.Service.use((lsp) => lsp.status()))
        return c.json(items)
      },
    )
    .get(
      "/formatter",
      describeRoute({
        summary: "Get formatter status",
        description: "Get formatter status",
        operationId: "formatter.status",
        responses: {
          200: {
            description: "Formatter status",
            content: {
              "application/json": {
                schema: resolver(Format.Status.array()),
              },
            },
          },
        },
      }),
      async (c) => {
        return c.json(await AppRuntime.runPromise(Format.Service.use((svc) => svc.status())))
      },
    )

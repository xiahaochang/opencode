#!/usr/bin/env bun
import { $ } from "bun"

import { Script } from "@opencode-ai/script"
import { copyBinaryToSidecarFolder, getCurrentSidecar, resolveChannel, windowsify } from "./utils"

const channel = resolveChannel()
await $`bun ./scripts/copy-icons.ts ${channel}`

const pkg = await Bun.file("./package.json").json()
pkg.version = Script.version
await Bun.write("./package.json", JSON.stringify(pkg, null, 2) + "\n")
console.log(`Updated package.json version to ${Script.version}`)

const sidecarConfig = getCurrentSidecar()
const artifact = process.env.OPENCODE_CLI_ARTIFACT ?? "opencode-cli"

const dir = "resources/opencode-binaries"

await $`mkdir -p ${dir}`

// Download artifact from current workflow run
const runId = process.env.GITHUB_RUN_ID
await $`gh run download ${runId} -n ${artifact}`.cwd(dir)
console.log(`Downloaded artifact ${artifact} from run ${runId}`)

await copyBinaryToSidecarFolder(windowsify(`${dir}/${sidecarConfig.ocBinary}/bin/opencode`))

await $`rm -rf ${dir}`

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

// Try to download from current run first, if not found, get the latest successful run from publish workflow
const runId = process.env.GITHUB_RUN_ID
let downloadSuccess = false

try {
  await $`gh run download ${runId} -n ${artifact}`.cwd(dir)
  downloadSuccess = true
  console.log(`Downloaded artifact ${artifact} from current run ${runId}`)
} catch (error) {
  console.log(`Artifact ${artifact} not found in current run ${runId}, fetching from latest successful publish workflow...`)
  try {
    // Get the latest successful run ID from the publish workflow
    const runOutput = await $`gh run list --workflow publish --status success --limit 1 --json databaseId --jq '.[0].databaseId'`.text()
    const latestRunId = runOutput.trim()
    if (latestRunId) {
      await $`gh run download ${latestRunId} -n ${artifact}`.cwd(dir)
      downloadSuccess = true
      console.log(`Downloaded artifact ${artifact} from publish workflow run ${latestRunId}`)
    }
  } catch (e) {
    console.error(`Failed to download artifact from publish workflow: ${e}`)
  }
}

if (!downloadSuccess) {
  console.error("no valid artifacts found to download")
  process.exit(1)
}

await copyBinaryToSidecarFolder(windowsify(`${dir}/${sidecarConfig.ocBinary}/bin/opencode`))

await $`rm -rf ${dir}`

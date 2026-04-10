#!/usr/bin/env bun
import { Script } from "@opencode-ai/script"

await import("./prebuild")

const pkg = await Bun.file("./package.json").json()
// Replace any '/' characters in version to ensure valid semver format
const safeVersion = Script.version.replace(/\//g, "-")
pkg.version = safeVersion
await Bun.write("./package.json", JSON.stringify(pkg, null, 2) + "\n")
console.log(`Updated package.json version to ${safeVersion}`)

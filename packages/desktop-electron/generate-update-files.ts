#!/usr/bin/env bun

import { readdirSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createHash } from "node:crypto"

const distDir = join(import.meta.dir, "dist")

async function getVersion(): Promise<string> {
  if (Bun.env.OPENCODE_VERSION) return Bun.env.OPENCODE_VERSION
  const pkg = await Bun.file(join(import.meta.dir, "package.json")).json()
  return pkg.version
}

async function getFileHash(filePath: string): Promise<string> {
  const data = Bun.file(filePath)
  const arrayBuffer = await data.arrayBuffer()
  const hash = createHash("sha512")
  hash.update(Buffer.from(arrayBuffer))
  return hash.digest("base64")
}

function getFileSize(filePath: string): number {
  return statSync(filePath).size
}

function getLatestFiles() {
  const files = readdirSync(distDir).filter((file) => {
    return (
      file.endsWith(".AppImage") ||
      file.endsWith(".deb") ||
      file.endsWith(".rpm") ||
      file.endsWith(".dmg") ||
      file.endsWith(".zip") ||
      file.endsWith(".exe")
    )
  })
  return files
}

async function generateLinuxYml() {
  const appImage = join(distDir, "opencode-electron-linux-x86_64.AppImage")
  const deb = join(distDir, "opencode-electron-linux-amd64.deb")
  const version = await getVersion()

  const files = []

  if (Bun.file(appImage).exists()) {
    files.push({
      url: `opencode-electron-linux-x86_64.AppImage`,
      sha512: await getFileHash(appImage),
      size: getFileSize(appImage),
    })
  }

  if (Bun.file(deb).exists()) {
    files.push({
      url: `opencode-electron-linux-amd64.deb`,
      sha512: await getFileHash(deb),
      size: getFileSize(deb),
    })
  }

  const yml = `version: ${version}
files:
${files.map((f) => `  - url: ${f.url}\n    sha512: ${f.sha512}\n    size: ${f.size}`).join("\n")}
releaseDate: "${new Date().toISOString()}"
`

  writeFileSync(join(distDir, "latest-linux.yml"), yml)
  console.log("Generated latest-linux.yml")
}

async function generateYml() {
  await generateLinuxYml()
  console.log("Update files generated in dist/")
}

generateYml()

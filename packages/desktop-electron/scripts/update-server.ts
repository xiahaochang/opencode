#!/usr/bin/env bun

import { serve } from "bun"
import { join, dirname, basename, extname } from "path"
import { stat, readdir } from "fs/promises"
import { mkdirSync } from "fs"

const PORT = Number(process.env.PORT ?? 3000)
const UPDATES_DIR = process.env.UPDATES_DIR ?? join(import.meta.dir, "..", "updates")

mkdirSync(UPDATES_DIR, { recursive: true })

const MIME_TYPES: Record<string, string> = {
  ".yml": "application/octet-stream",
  ".yaml": "application/octet-stream",
  ".exe": "application/octet-stream",
  ".dmg": "application/octet-stream",
  ".AppImage": "application/octet-stream",
  ".deb": "application/octet-stream",
  ".rpm": "application/octet-stream",
  ".blockmap": "application/octet-stream",
  ".zip": "application/octet-stream",
  ".png": "image/png",
  ".json": "application/json",
}

const headers = new Headers({
  "Cache-Control": "no-cache",
  "Content-Type": "application/octet-stream",
  "Access-Control-Allow-Origin": "*",
})

async function serveFile(filePath: string) {
  const file = Bun.file(filePath)
  const exists = await file.exists()
  if (!exists) return new Response("Not Found", { status: 404 })
  return new Response(file, { headers })
}

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const pathParts = url.pathname.split("/").filter(Boolean)

    if (pathParts.length === 0) {
      return new Response(
        `<!DOCTYPE html><html><body>
          <h1>OpenCode Update Server</h1>
          <p>Port: ${PORT}</p>
          <p>Updates dir: ${UPDATES_DIR}</p>
          <p>Usage: https://your-server.com/prod/latest.yml</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    const [channel, ...rest] = pathParts
    const channelDir = join(UPDATES_DIR, channel)

    try {
      await stat(channelDir)
    } catch {
      return new Response(`Channel "${channel}" not found`, { status: 404, headers })
    }

    if (rest.length === 0) {
      const files = await readdir(channelDir)
      return new Response(
        `<html><body><h1>${channel}</h1><ul>${files.map((f) => `<li><a href="/${channel}/${f}">${f}</a></li>`).join("")}</ul></body></html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    const filePath = join(channelDir, ...rest)
    const normalized = new URL(filePath).pathname

    if (!normalized.startsWith(new URL(channelDir).pathname)) {
      return new Response("Forbidden", { status: 403, headers })
    }

    return serveFile(filePath)
  },
})

console.log(`Update server running on http://localhost:${PORT}`)
console.log(`Updates directory: ${UPDATES_DIR}`)

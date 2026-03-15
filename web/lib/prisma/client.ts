import fs from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

function applyPrismaEnvFallback() {
  if ((process.env.DATABASE_URL ?? "").trim() !== "") {
    return
  }

  const envPath = path.join(process.cwd(), "prisma", ".env")
  if (!fs.existsSync(envPath)) {
    return
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (
      trimmedLine === "" ||
      trimmedLine.startsWith("#") ||
      !trimmedLine.includes("=")
    ) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf("=")
    const key = trimmedLine.slice(0, separatorIndex).trim()
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, "")

    if (key === "DATABASE_URL" && value !== "") {
      process.env.DATABASE_URL = value
    }

    if (key === "DIRECT_URL" && (process.env.DIRECT_URL ?? "").trim() === "") {
      process.env.DIRECT_URL = value
    }
  }
}

applyPrismaEnvFallback()

const prisma = globalThis.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma
}

export default prisma

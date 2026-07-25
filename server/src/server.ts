import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env from the server directory regardless of where the process was started
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenvConfig({ path: resolve(__dirname, '../.env') })
import express from 'express'
import http from 'http'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { initSocketIO } from './socketServer.js'
import { errorHandler } from './error.js'
import sessionRoutes from './sessionRoutes.js'
import messageRoutes from './messageRoutes.js'
import systemRoutes from './systemRoutes.js'
import healthRoutes from './healthRoutes.js'
import prisma from './prisma.js'
import { sessionManager } from './baileys/sessionManager.js'
import { requestLogMiddleware } from './middlewares/requestLog.js'

const app = express()
const server = http.createServer(app)

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.SOCKET_IO_CORS_ORIGIN ?? 'http://localhost:8080',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Request logging middleware (logs every API call to DB) ─────────────────
app.use(requestLogMiddleware)

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/sessions', sessionRoutes)
app.use('/api/v1/messages', messageRoutes)
app.use('/api/v1/system', systemRoutes)
app.use('/api/v1/health', healthRoutes)

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler)

// ── Socket.IO ─────────────────────────────────────────────────────────────────
initSocketIO(server)

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000)

async function start(): Promise<void> {
  await prisma.$connect()
  console.log('[DB] Connected')

  await sessionManager.initialize()
  console.log('[SessionManager] Initialized')

  server.listen(PORT, () => {
    console.log(`[Server] Listening on http://localhost:${PORT}`)
  })
}

async function shutdown(signal: string): Promise<void> {
  console.log(`[Server] ${signal} – shutting down`)
  await prisma.$disconnect()
  server.close(() => process.exit(0))
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

start().catch((err) => {
  console.error('[Server] Fatal startup error:', err)
  process.exit(1)
})

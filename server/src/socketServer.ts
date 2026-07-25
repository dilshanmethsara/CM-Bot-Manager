import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'

export let serverIO: SocketIOServer | null = null

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.SOCKET_IO_CORS_ORIGIN ?? 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id)

    socket.on('subscribe:session', (sessionId: string) => {
      socket.join(`session:${sessionId}`)
    })

    socket.on('unsubscribe:session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`)
    })

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id)
    })
  })

  serverIO = io
  return io
}

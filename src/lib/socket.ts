import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket(): void {
  getSocket().connect()
}

export function disconnectSocket(): void {
  socket?.disconnect()
}

// ─── Typed event names ────────────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  SESSION_CREATED:      'sessionCreated',
  SESSION_DELETED:      'sessionDeleted',
  SESSION_CONNECTED:    'sessionConnected',
  SESSION_DISCONNECTED: 'sessionDisconnected',
  SESSION_UPDATED:      'sessionUpdated',
  QR_GENERATED:         'qrGenerated',
  PAIRING_CODE:         'pairingCodeGenerated',
  CONNECTION_ERROR:     'connectionError',
  MESSAGE_SENT:         'messageSent',
} as const

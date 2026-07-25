/**
 * Typed API client for the Cloud Mint backend.
 * All requests go to /api/v1/* — Vite proxies them to localhost:3000 in dev.
 */

const BASE = '/api/v1'

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: Object.keys(headers).length ? headers : undefined,
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  })

  const json = await res.json().catch(() => ({ success: false, error: 'Invalid JSON response' }))

  if (!json.success) {
    throw new Error(json.error ?? `HTTP ${res.status}`)
  }

  return json.data as T
}

const get    = <T>(path: string)                      => request<T>('GET',    path)
const post   = <T>(path: string, body?: unknown)      => request<T>('POST',   path, body)
const patch  = <T>(path: string, body?: unknown)      => request<T>('PATCH',  path, body)
const del    = <T>(path: string)                      => request<T>('DELETE', path)
const postForm = <T>(path: string, form: FormData)    => request<T>('POST',   path, form)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionInfo {
  id: string
  name: string
  phoneNumber: string
  status: 'disconnected' | 'connecting' | 'connected' | 'qr' | 'pairing'
  profileName?: string | null
  avatarUrl?: string | null
  connectedAt?: string | null
  lastActivity?: string | null
  qrCode?: string
  pairingCode?: string
}

export interface StatsData {
  totalSessions: number
  activeSessions: number
  disconnectedSessions: number
  pausedSessions: number
  messagesSentToday: number
  messagesReceived: number
  totalLogs: number
  serverStatus: string
  nodeVersion: string
}

export interface LogEntry {
  id: string
  sessionId?: string | null
  level: string
  message: string
  metadata?: string | null
  createdAt: string
}

export interface MessageRecord {
  id: string
  sessionId: string
  to: string
  type: string
  content: string
  status: string
  error?: string | null
  createdAt: string
  sentAt?: string | null
  session?: { name: string }
}

export interface ApiRequestRecord {
  id: string
  method: string
  path: string
  statusCode: number
  durationMs: number
  ip: string | null
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiKeyRecord {
  id: string
  name: string
  key: string
  sessionId?: string | null
  lastUsed: string | null
  createdAt: string
  session?: { id: string; name: string; phoneNumber: string } | null
}

export interface RateLimitsData {
  requestsPerMin: { used: number; cap: number }
  messagesPerHour: { used: number; cap: number }
  mediaUploadsPerDay: { used: number; cap: number }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  check:          () => get<{ authenticated: boolean }>('/system/auth/check'),
  login:          (email: string, password: string) => post<{ token: string; user: { id: string; email: string; name: string; role: string } }>('/system/auth/login', { email, password }),
  logout:         () => post<{ message: string }>('/system/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    post<{ message: string }>('/system/auth/password', { currentPassword, newPassword }),
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  getAll:     ()                                          => get<SessionInfo[]>('/sessions'),
  create:     (name: string, phoneNumber: string)        => post<SessionInfo>('/sessions', { name, phoneNumber }),
  delete:     (id: string)                               => del<{ id: string }>(`/sessions/${id}`),
  connect:    (id: string, method: 'qr' | 'pairing' = 'qr') =>
                post<{ id: string }>(`/sessions/${id}/connect`, { method }),
  disconnect: (id: string)                               => post<{ id: string }>(`/sessions/${id}/disconnect`),
  restart:    (id: string)                               => post<{ id: string }>(`/sessions/${id}/restart`),
  update:     (id: string, data: Partial<Pick<SessionInfo, 'name' | 'phoneNumber' | 'profileName' | 'avatarUrl'>>) =>
                patch<SessionInfo>(`/sessions/${id}`, data),
  getQR:      (id: string)                               => get<{ qrCode: string }>(`/sessions/${id}/qr`),
  getPairingCode: (id: string)                           => get<{ pairingCode: string }>(`/sessions/${id}/pairing-code`),
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messagesApi = {
  sendText: (sessionId: string, to: string, content: string) =>
    post<{ messageId: string }>('/messages/text', { sessionId, to, content }),

  sendImage: (sessionId: string, to: string, file: File, caption?: string) => {
    const form = new FormData()
    form.append('sessionId', sessionId)
    form.append('to', to)
    form.append('image', file)
    if (caption) form.append('caption', caption)
    return postForm<{ messageId: string }>('/messages/image', form)
  },

  sendDocument: (sessionId: string, to: string, file: File, caption?: string) => {
    const form = new FormData()
    form.append('sessionId', sessionId)
    form.append('to', to)
    form.append('document', file)
    if (caption) form.append('caption', caption)
    return postForm<{ messageId: string }>('/messages/document', form)
  },

  getHistory: (page = 1, limit = 20, sessionId?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (sessionId) params.set('sessionId', sessionId)
    return get<{ messages: MessageRecord[]; pagination: Pagination }>(`/system/messages/history?${params}`)
  },
}

// ─── System ───────────────────────────────────────────────────────────────────

export const systemApi = {
  health: () => get<{ status: string; timestamp: string; database: string }>('/system/health'),
  stats:  () => get<StatsData>('/system/stats'),
  logs:   (params?: { page?: number; limit?: number; level?: string; sessionId?: string; search?: string }) => {
    const p = new URLSearchParams()
    if (params?.page)      p.set('page',      String(params.page))
    if (params?.limit)     p.set('limit',     String(params.limit))
    if (params?.level)     p.set('level',     params.level)
    if (params?.sessionId) p.set('sessionId', params.sessionId)
    if (params?.search)    p.set('search',    params.search)
    return get<{ logs: LogEntry[]; pagination: Pagination }>(`/system/logs?${p}`)
  },
  apiRequests: (page = 1, limit = 50) =>
    get<{ requests: ApiRequestRecord[]; pagination: Pagination }>(`/system/requests?page=${page}&limit=${limit}`),
  rateLimits: () => get<RateLimitsData>('/system/rate-limits'),
  apiKeys: {
    list:   ()                     => get<ApiKeyRecord[]>('/system/api-keys'),
    create: (name: string, sessionId?: string) => post<ApiKeyRecord>('/system/api-keys', { name, sessionId }),
    delete: (id: string)           => del<{ id: string }>(`/system/api-keys/${id}`),
  },
  // ── Dashboard chart data ──────────────────────────────────────────────────────
  messageTrends:   () => get<{ day: string; count: number }[]>('/system/messages/trends'),
  deliveryStats:   () => get<{ success: number; failed: number; total: number; rate: number }>('/system/messages/delivery-stats'),
  apiUsage:        () => get<{ hour: string; calls: number }[]>('/system/api-usage'),
}

// ─── Session Status (real-time) ────────────────────────────────────────────────

export const sessionStatus = {
  get: (id: string) => get<{
    id: string; name: string; phoneNumber: string; status: string;
    connected: boolean; profileName: string | null; lastActivity: string | null;
  }>(`/sessions/${id}/status`),
}

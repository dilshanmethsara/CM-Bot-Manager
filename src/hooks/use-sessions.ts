import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { sessionsApi, type SessionInfo } from '@/lib/api'
import { getSocket, SOCKET_EVENTS } from '@/lib/socket'

export const SESSION_QUERY_KEY = ['sessions'] as const

export function useSessions() {
  const qc = useQueryClient()

  // Live updates via Socket.IO
  useEffect(() => {
    const socket = getSocket()

    const refresh = () => qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY })

    socket.on(SOCKET_EVENTS.SESSION_CREATED,      refresh)
    socket.on(SOCKET_EVENTS.SESSION_DELETED,      refresh)
    socket.on(SOCKET_EVENTS.SESSION_CONNECTED,    refresh)
    socket.on(SOCKET_EVENTS.SESSION_DISCONNECTED, refresh)
    socket.on(SOCKET_EVENTS.SESSION_UPDATED,      refresh)
    socket.on(SOCKET_EVENTS.QR_GENERATED,         refresh)

    return () => {
      socket.off(SOCKET_EVENTS.SESSION_CREATED,      refresh)
      socket.off(SOCKET_EVENTS.SESSION_DELETED,      refresh)
      socket.off(SOCKET_EVENTS.SESSION_CONNECTED,    refresh)
      socket.off(SOCKET_EVENTS.SESSION_DISCONNECTED, refresh)
      socket.off(SOCKET_EVENTS.SESSION_UPDATED,      refresh)
      socket.off(SOCKET_EVENTS.QR_GENERATED,         refresh)
    }
  }, [qc])

  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn:  sessionsApi.getAll,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, phoneNumber }: { name: string; phoneNumber: string }) =>
      sessionsApi.create(name, phoneNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sessionsApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}

export function useConnectSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, method }: { id: string; method?: 'qr' | 'pairing' }) =>
      sessionsApi.connect(id, method ?? 'qr'),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}

export function useDisconnectSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sessionsApi.disconnect(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}

export function useRestartSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sessionsApi.restart(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}

export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Pick<SessionInfo, 'name' | 'phoneNumber'>>) =>
      sessionsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}

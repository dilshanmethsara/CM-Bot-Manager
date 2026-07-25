import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { systemApi } from '@/lib/api'
import { getSocket } from '@/lib/socket'

interface UseLogsParams {
  page?: number
  limit?: number
  level?: string
  sessionId?: string
  search?: string
}

export function useLogs(params?: UseLogsParams) {
  const qc = useQueryClient()

  // Refresh when new logs arrive via socket
  useEffect(() => {
    const socket = getSocket()
    const refresh = () => qc.invalidateQueries({ queryKey: ['logs'] })
    socket.on('sessionConnected',    refresh)
    socket.on('sessionDisconnected', refresh)
    socket.on('messageSent',         refresh)
    return () => {
      socket.off('sessionConnected',    refresh)
      socket.off('sessionDisconnected', refresh)
      socket.off('messageSent',         refresh)
    }
  }, [qc])

  return useQuery({
    queryKey: ['logs', params],
    queryFn:  () => systemApi.logs(params),
    refetchInterval: 10_000,
  })
}

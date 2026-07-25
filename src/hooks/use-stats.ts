import { useQuery } from '@tanstack/react-query'
import { systemApi } from '@/lib/api'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn:  systemApi.stats,
    refetchInterval: 15_000, // auto-refresh every 15 s
  })
}

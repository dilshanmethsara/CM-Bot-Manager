import { useQuery } from '@tanstack/react-query'
import { systemApi, type ApiKeyRecord } from '@/lib/api'

export function useRateLimits() {
  return useQuery({
    queryKey: ['rate-limits'],
    queryFn: systemApi.rateLimits,
    refetchInterval: 30_000,
  })
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: systemApi.apiKeys.list,
  })
}

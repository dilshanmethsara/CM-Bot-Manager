import { useQuery } from '@tanstack/react-query'
import { systemApi, type ApiRequestRecord, type Pagination } from '@/lib/api'

export function useApiRequests(page = 1) {
  return useQuery({
    queryKey: ['api-requests', page],
    queryFn:  () => systemApi.apiRequests(page),
  })
}

export type { ApiRequestRecord, Pagination }

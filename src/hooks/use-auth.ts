import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { connectSocket, disconnectSocket } from '@/lib/socket'

export const AUTH_QUERY_KEY = ['auth'] as const

export function useAuthCheck() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn:  authApi.check,
    retry:    false,
    staleTime: 60_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.token)
      qc.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
      connectSocket()
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      localStorage.removeItem('token')
      disconnectSocket()
      qc.clear()
    },
  })
}

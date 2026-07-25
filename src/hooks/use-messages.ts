import { useQuery, useMutation } from '@tanstack/react-query'
import { messagesApi } from '@/lib/api'

export function useMessageHistory(page = 1, sessionId?: string) {
  return useQuery({
    queryKey: ['messages', 'history', page, sessionId],
    queryFn:  () => messagesApi.getHistory(page, 20, sessionId),
  })
}

export function useSendText() {
  return useMutation({
    mutationFn: ({ sessionId, to, content }: { sessionId: string; to: string; content: string }) =>
      messagesApi.sendText(sessionId, to, content),
  })
}

export function useSendImage() {
  return useMutation({
    mutationFn: ({ sessionId, to, file, caption }: { sessionId: string; to: string; file: File; caption?: string }) =>
      messagesApi.sendImage(sessionId, to, file, caption),
  })
}

export function useSendDocument() {
  return useMutation({
    mutationFn: ({ sessionId, to, file, caption }: { sessionId: string; to: string; file: File; caption?: string }) =>
      messagesApi.sendDocument(sessionId, to, file, caption),
  })
}

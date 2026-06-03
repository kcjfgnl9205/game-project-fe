import { useToastStore } from '@/shared/stores'
import { ApiError } from '@/shared/api'

const messageFrom = (e: unknown, fallback: string): string => {
  if (typeof e === 'string') return e
  if (e instanceof ApiError) {
    const body = e.body as { message?: string | string[] } | undefined
    const msg = body?.message
    if (Array.isArray(msg)) return msg.join(', ')
    return msg ?? e.message ?? fallback
  }
  if (e instanceof Error) return e.message
  return fallback
}

export const useToast = () => {
  const store = useToastStore()

  return {
    success: (message: string) => store.show('success', message),
    error: (e: unknown, fallback = '오류가 발생했어요') => {
      store.show('error', messageFrom(e, fallback))
    },
    info: (message: string) => store.show('info', message),
    warning: (message: string) => store.show('warning', message),
    dismiss: (id: number) => store.dismiss(id),
  }
}

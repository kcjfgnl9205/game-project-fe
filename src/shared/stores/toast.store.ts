import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  variant: ToastVariant
  message: string
}

const MAX_TOASTS = 3 // 동시에 보여줄 최대 개수

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 0

  const dismiss = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }

  const show = (variant: ToastVariant, message: string, duration = 3500) => {
    const id = ++nextId
    toasts.value.push({ id, variant, message })
    // 최대 개수 초과 시 가장 오래된 것부터 제거
    if (toasts.value.length > MAX_TOASTS) {
      toasts.value.splice(0, toasts.value.length - MAX_TOASTS)
    }
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  return { toasts, show, dismiss }
})

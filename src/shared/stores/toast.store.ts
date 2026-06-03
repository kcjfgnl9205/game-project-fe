import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  variant: ToastVariant
  message: string
}

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
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  return { toasts, show, dismiss }
})

import { computed, markRaw, ref, watch, type Component } from 'vue'
import { defineStore } from 'pinia'

export type ModalTransition = 'up' | 'down' | 'left' | 'right' | 'fade'

export interface ModalOptions {
  transition?: ModalTransition
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
}

export interface Modal {
  id: number
  component: Component
  props: Record<string, unknown>
  options: Required<ModalOptions>
  visible: boolean
  resolve?: (value: unknown) => void
}

let nextId = 0

const DEFAULT_OPTIONS: Required<ModalOptions> = {
  transition: 'up',
  closeOnBackdrop: true,
  closeOnEsc: true,
}

export const useModalStore = defineStore('modal', () => {
  const modals = ref<Modal[]>([])
  let restoreFocus: HTMLElement | null = null

  const isOpen = computed(() => modals.value.some((m) => m.visible))
  const topVisible = computed(
    () => [...modals.value].reverse().find((m) => m.visible) ?? null,
  )

  function open<TResult = void>(
    component: Component,
    props: Record<string, unknown> = {},
    options: ModalOptions = {},
  ): Promise<TResult> {
    return new Promise<TResult>((resolve) => {
      modals.value.push({
        id: nextId++,
        component: markRaw(component),
        props,
        options: { ...DEFAULT_OPTIONS, ...options },
        visible: true,
        resolve: resolve as (value: unknown) => void,
      })
    })
  }

  function close(id?: number, result?: unknown) {
    const target =
      id != null
        ? modals.value.find((m) => m.id === id)
        : topVisible.value
    if (!target || !target.visible) return
    target.visible = false
    target.resolve?.(result)
  }

  function closeAll() {
    modals.value.forEach((m) => {
      m.visible = false
      m.resolve?.(undefined)
    })
  }

  function afterLeave(id: number) {
    const index = modals.value.findIndex((m) => m.id === id)
    if (index !== -1) modals.value.splice(index, 1)
  }

  // 백그라운드 inert + 스크롤 잠금 + 포커스 복원
  watch(isOpen, (open) => {
    Array.from(document.body.children).forEach((node) => {
      const el = node as HTMLElement
      if (el.hasAttribute('data-modal-portal')) return
      if (open) el.setAttribute('inert', '')
      else el.removeAttribute('inert')
    })

    document.body.style.overflow = open ? 'hidden' : ''

    if (open) {
      restoreFocus = document.activeElement as HTMLElement | null
    } else {
      restoreFocus?.focus?.()
      restoreFocus = null
    }
  })

  // ESC 키 처리 — 최상단 모달에 closeOnEsc가 켜져 있으면 닫음
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return
      const top = topVisible.value
      if (top?.options.closeOnEsc) close(top.id)
    })
  }

  return {
    modals,
    isOpen,
    topVisible,
    open,
    close,
    closeAll,
    afterLeave,
  }
})

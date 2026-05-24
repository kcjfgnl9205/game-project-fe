import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-mode'
const DARK_CLASS = 'dark'

const mode = ref<ThemeMode>('system')
const resolved = ref<'light' | 'dark'>('light')

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const apply = (next: 'light' | 'dark') => {
  resolved.value = next
  document.documentElement.classList.toggle(DARK_CLASS, next === 'dark')
}

const compute = (current: ThemeMode): 'light' | 'dark' =>
  current === 'system' ? getSystemTheme() : current

let initialized = false

export const useTheme = () => {
  if (!initialized) {
    initialized = true

    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    mode.value = stored ?? 'system'
    apply(compute(mode.value))

    watch(mode, (next) => {
      localStorage.setItem(STORAGE_KEY, next)
      apply(compute(next))
    })

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (mode.value === 'system') apply(getSystemTheme())
      })
  }

  const setMode = (next: ThemeMode) => {
    mode.value = next
  }

  const toggle = () => {
    mode.value = resolved.value === 'dark' ? 'light' : 'dark'
  }

  return { mode, resolved, setMode, toggle }
}

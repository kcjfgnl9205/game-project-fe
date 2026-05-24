<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'
interface Props {
  variant?: Variant
  size?: Size
  glow?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  glow: false,
  type: 'button',
})

const variantClass = computed(() => {
  if (props.variant === 'primary') return 'bg-brand text-on-brand hover:bg-brand-hover'
  if (props.variant === 'secondary')
    return 'bg-bg-card text-text-primary border border-border-strong hover:bg-bg-card-hover'
  return 'bg-transparent text-text-primary hover:bg-bg-card'
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-9 px-4 text-sm'
  if (props.size === 'lg') return 'h-14 px-8 text-base'
  return 'h-11 px-6 text-sm'
})

const glowClass = computed(() =>
  props.glow ? 'shadow-[0_0_40px_-8px_var(--color-brand-glow)]' : '',
)
</script>

<template>
  <button
    :type="type"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      variantClass,
      sizeClass,
      glowClass,
    ]"
  >
    <slot />
  </button>
</template>

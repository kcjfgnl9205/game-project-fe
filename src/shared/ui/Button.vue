<script setup lang="ts">
import { computed } from 'vue'
import { icons, type IconName } from '@/shared/ui/icons'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'
interface Props {
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  icon?: IconName // 텍스트 왼쪽에 표시할 아이콘 이름(레지스트리 등록명)
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const variantClass = computed(() => {
  if (props.variant === 'primary') return 'bg-brand text-on-brand hover:bg-brand-hover'
  if (props.variant === 'secondary')
    return 'bg-bg-card text-text-primary border border-border-strong hover:bg-bg-card-hover'
  if (props.variant === 'outline')
    return 'bg-transparent text-brand border border-brand hover:bg-brand-soft'
  return 'bg-transparent text-text-primary hover:bg-bg-card'
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-9 px-4 text-sm'
  if (props.size === 'lg') return 'h-14 px-8 text-base'
  return 'h-11 px-6 text-sm'
})
</script>

<template>
  <button
    :type="type"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      variantClass,
      sizeClass,
    ]"
  >
    <component :is="icons[icon]" v-if="icon" class="size-[1.15em] shrink-0" aria-hidden="true" />
    <slot />
  </button>
</template>

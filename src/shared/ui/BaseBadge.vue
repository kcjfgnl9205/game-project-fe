<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'brand' | 'warning' | 'neutral'
interface Props {
  tone?: Tone
}
const props = withDefaults(defineProps<Props>(), { tone: 'brand' })

const toneClass = computed(() => {
  if (props.tone === 'brand') return 'bg-brand-soft text-brand'
  if (props.tone === 'warning') return 'bg-warning-soft text-warning'
  return 'bg-bg-card text-text-secondary'
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
      toneClass,
    ]"
  >
    <slot />
  </span>
</template>

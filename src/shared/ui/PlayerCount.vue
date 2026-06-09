<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  max: number
}
const props = defineProps<Props>()

// 정원이 가득 차면 인원 숫자를 warning 색으로 강조
const isFull = computed(() => props.current >= props.max)
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-sm">
    <i-local-people aria-hidden="true" class="text-text-muted" />
    <span :class="isFull ? 'text-warning' : 'text-brand'" class="font-semibold">{{ current }}</span>
    <span class="text-text-muted">/ {{ max }}명</span>
  </span>
</template>

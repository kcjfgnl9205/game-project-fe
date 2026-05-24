<script setup lang="ts">
import { useTheme } from '@/shared/composables'

const { resolved, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    :aria-label="resolved === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
    class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary cursor-pointer"
    @click="toggle"
  >
    <span v-if="resolved === 'dark'" aria-hidden="true">☀️</span>
    <span v-else aria-hidden="true">🌙</span>
  </button>
</template>

<script setup lang="ts">
// 일반 채팅 메시지. mine이면 내 메시지로 강조.
defineProps<{ nickname?: string; text?: string; mine?: boolean }>()
</script>

<template>
  <div class="rounded-xl p-3" :class="mine ? 'bg-brand-soft' : 'bg-bg-elevated'">
    <p class="text-xs font-semibold text-brand">{{ nickname }}</p>
    <p class="mt-0.5 text-sm text-text-primary">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
// 진행 안내(시스템) 메시지: 가운데 구분선 스타일
defineProps<{ text?: string }>()
</script>

<template>
  <div class="flex items-center gap-2 py-1 text-xs font-medium text-text-muted">
    <span class="h-px flex-1 bg-border" />
    <span>{{ text }}</span>
    <span class="h-px flex-1 bg-border" />
  </div>
</template>

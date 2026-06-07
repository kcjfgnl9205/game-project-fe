<script setup lang="ts">
// 게임 공통 참가자 사이드바(셸). 카드 목록은 슬롯으로 받는다.
</script>

<template>
  <aside class="flex w-64 shrink-0 flex-col border-r border-border bg-bg-card">
    <header class="flex h-12 items-center gap-2 border-b border-border px-4">
      <i-local-people aria-hidden="true" />
      <h2 class="text-sm font-bold text-text-primary">참가자</h2>
    </header>

    <ul class="flex-1 space-y-2 overflow-y-auto p-3">
      <slot />
    </ul>
  </aside>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-bg border-t border-border">
    <div
      class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 md:flex-row"
    >
      <div class="flex items-center gap-2 text-sm text-text-primary">
        <span class="text-brand" aria-hidden="true">🎮</span>
        <span class="font-semibold">미니게임 파크</span>
      </div>
      <p class="text-xs text-text-muted">© {{ year }} 미니게임 파크. All rights reserved.</p>
    </div>
  </footer>
</template>

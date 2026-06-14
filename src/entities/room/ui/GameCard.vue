<script setup lang="ts">
import type { GameSummary } from '@/shared/lib/games'

// roomCount: 해당 게임에 개설된 방 수(대기+게임중 합계).
withDefaults(defineProps<{ game: GameSummary; roomCount?: number }>(), {
  roomCount: 0,
})
</script>

<template>
  <article
    class="group flex h-full flex-col rounded-2xl border border-border bg-bg-card p-6 transition-colors hover:bg-bg-card-hover"
  >
    <h3 class="text-lg font-bold text-text-primary">{{ game.name }}</h3>
    <p class="mt-1 text-sm text-text-secondary">{{ game.description }}</p>

    <footer
      class="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-text-muted"
    >
      <span class="inline-flex items-center gap-1">
        <span aria-hidden="true">👥</span>
        {{ game.minPlayers }}-{{ game.maxPlayers }}명
      </span>
      <span class="inline-flex items-center gap-1">
        <span aria-hidden="true">🚪</span>
        방 {{ roomCount }}개
      </span>
    </footer>
  </article>
</template>

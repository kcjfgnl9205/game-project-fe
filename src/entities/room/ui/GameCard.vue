<script setup lang="ts">
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import type { GameSummary } from '@/shared/lib/games'

defineProps<{ game: GameSummary }>()
</script>

<template>
  <article
    class="group flex h-full flex-col rounded-2xl border border-border bg-bg-card p-6 transition-colors hover:bg-bg-card-hover"
  >
    <header class="mb-4 flex items-start justify-between">
      <span class="text-3xl" aria-hidden="true">{{ game.icon }}</span>
      <BaseBadge :tone="game.status === 'available' ? 'brand' : 'warning'">
        {{ game.status === 'available' ? '플레이 가능' : 'Coming Soon' }}
      </BaseBadge>
    </header>

    <h3 class="text-lg font-bold text-text-primary">{{ game.name }}</h3>
    <p class="mt-1 text-sm text-text-secondary">{{ game.description }}</p>

    <footer
      class="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-text-muted"
    >
      <span class="inline-flex items-center gap-1">
        <span aria-hidden="true">👥</span>
        {{ game.minPlayers }}-{{ game.maxPlayers }}명
      </span>
      <span v-if="game.totalPlays" class="inline-flex items-center gap-1">
        <span aria-hidden="true">🏆</span>
        {{ game.totalPlays.toLocaleString() }}
      </span>
    </footer>
  </article>
</template>

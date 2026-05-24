<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import type { RoomItem } from '@/shared/lib/rooms'

const props = defineProps<{ room: RoomItem }>()

const MAX_VISIBLE_AVATARS = 4

const visibleSlots = computed(() =>
  Array.from(
    { length: Math.min(props.room.currentPlayers, MAX_VISIBLE_AVATARS) },
    (_, i) => i + 1,
  ),
)

const overflow = computed(() =>
  Math.max(0, props.room.currentPlayers - MAX_VISIBLE_AVATARS),
)

const isFull = computed(
  () => props.room.currentPlayers >= props.room.maxPlayers,
)
</script>

<template>
  <article
    class="flex h-full flex-col rounded-2xl border border-border bg-bg-card p-6 transition-colors hover:bg-bg-card-hover"
  >
    <header class="mb-4 flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <span
          :class="room.isLocked ? 'text-warning' : 'text-text-muted'"
          aria-hidden="true"
        >
          {{ room.isLocked ? '🔒' : '🔓' }}
        </span>
        <h3 class="truncate text-base font-bold text-text-primary">
          {{ room.name }}
        </h3>
      </div>
      <BaseBadge :tone="room.status === 'waiting' ? 'brand' : 'warning'">
        {{ room.status === 'waiting' ? '대기 중' : '게임 중' }}
      </BaseBadge>
    </header>

    <div class="flex items-center gap-2 text-sm text-text-secondary">
      <span class="text-warning" aria-hidden="true">👑</span>
      {{ room.hostNickname }}
    </div>

    <footer
      class="mt-6 flex items-center justify-between border-t border-border pt-4"
    >
      <span class="inline-flex items-center gap-1.5 text-sm">
        <span aria-hidden="true" class="text-text-muted">👥</span>
        <span
          :class="isFull ? 'text-warning' : 'text-brand'"
          class="font-semibold"
        >
          {{ room.currentPlayers }}
        </span>
        <span class="text-text-muted">/ {{ room.maxPlayers }}명</span>
      </span>

      <div class="flex -space-x-1.5">
        <span
          v-for="n in visibleSlots"
          :key="n"
          class="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-bg-elevated text-[10px] font-semibold text-text-secondary"
        >
          {{ n }}
        </span>
        <span
          v-if="overflow > 0"
          class="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-on-brand"
        >
          +{{ overflow }}
        </span>
      </div>
    </footer>
  </article>
</template>

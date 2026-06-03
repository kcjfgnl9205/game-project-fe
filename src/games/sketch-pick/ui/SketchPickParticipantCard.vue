<script setup lang="ts">
import type { Participant } from '@/games/sketch-pick/model/game.store'

interface Props {
  participant: Participant
}
defineProps<Props>()
</script>

<template>
  <li
    class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
    :class="
      participant.isDrawing
        ? 'border-2 border-brand bg-brand-soft shadow-sm'
        : participant.isMe
          ? 'bg-bg-elevated ring-1 ring-brand/40'
          : 'hover:bg-bg-card-hover'
    "
  >
    <span
      class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
      :class="
        participant.isDrawing ? 'bg-brand text-on-brand' : 'bg-bg-elevated text-text-secondary'
      "
    >
      {{ participant.rank }}
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1">
        <span class="truncate text-sm font-semibold text-text-primary">
          {{ participant.nickname }}
        </span>
        <span v-if="participant.isHost" class="text-xs text-warning" aria-hidden="true">👑</span>
        <span
          v-if="participant.isMe"
          class="shrink-0 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold text-on-brand"
        >
          나
        </span>
      </div>
      <p class="text-xs text-text-secondary">{{ participant.score }}점</p>
    </div>

    <span v-if="participant.isDrawing" class="text-base" aria-hidden="true">🎨</span>
  </li>
</template>

<script setup lang="ts">
import type { Participant } from '@/games/sketch-pick/model/game.store'

defineProps<{ participants: Participant[] }>()
</script>

<template>
  <aside class="flex w-64 shrink-0 flex-col border-r border-border bg-bg-card">
    <header class="flex h-12 items-center gap-2 border-b border-border px-4">
      <span class="text-warning" aria-hidden="true">🏆</span>
      <h2 class="text-sm font-bold text-text-primary">참가자</h2>
    </header>

    <ul class="flex-1 overflow-y-auto p-3">
      <li
        v-for="p in participants"
        :key="p.id"
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
        :class="
          p.isDrawing
            ? 'border-2 border-brand bg-brand-soft shadow-sm'
            : p.isMe
              ? 'bg-bg-elevated ring-1 ring-brand/40'
              : 'hover:bg-bg-card-hover'
        "
      >
        <span
          class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
          :class="p.isDrawing ? 'bg-brand text-on-brand' : 'bg-bg-elevated text-text-secondary'"
        >
          {{ p.rank }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1">
            <span class="truncate text-sm font-semibold text-text-primary">
              {{ p.nickname }}
            </span>
            <span v-if="p.isHost" class="text-xs text-warning" aria-hidden="true">👑</span>
            <span
              v-if="p.isMe"
              class="shrink-0 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold text-on-brand"
            >
              나
            </span>
          </div>
          <p class="text-xs text-text-secondary">{{ p.score }}점</p>
        </div>
        <span v-if="p.isDrawing" class="text-base" aria-hidden="true">🎨</span>
      </li>
    </ul>
  </aside>
</template>

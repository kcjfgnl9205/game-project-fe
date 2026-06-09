<script setup lang="ts">
import { Badge, PlayerCount } from '@/shared/ui'
import type { RoomListItem } from '@/entities/room/model'

interface Props {
  room: RoomListItem
}

defineProps<Props>()
</script>

<template>
  <article
    class="flex h-full flex-col rounded-2xl border border-border bg-bg-card p-6 transition-colors hover:bg-bg-card-hover"
  >
    <header class="mb-4 flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <span :class="room.isPrivate ? 'text-warning' : 'text-text-muted'" aria-hidden="true">
          <i-local-lock v-if="room.isPrivate" />
          <i-local-unLock v-else />
        </span>
        <h3 class="truncate text-base font-bold text-text-primary">
          {{ room.name }}
        </h3>
      </div>
      <Badge :tone="room.status === 'WAITING' ? 'brand' : 'warning'">
        {{ room.status === 'WAITING' ? '대기 중' : '게임 중' }}
      </Badge>
    </header>

    <!-- 게임별 설정 요약 -->
    <div class="flex items-center gap-2 text-sm text-text-secondary">
      <i-local-timer aria-hidden="true" class="text-text-muted" />
      <span v-if="room.gameType === 'WHO_DREW'">
        {{ room.config.rounds }}바퀴 · 한 획 {{ room.config.turnTimeSec }}초
      </span>
      <span v-else>{{ room.config.drawTimeSec }}초</span>
    </div>

    <!-- 참가인원 -->
    <footer class="mt-4 flex items-center justify-between border-t border-border pt-4">
      <PlayerCount :current="room.currentPlayers" :max="room.maxPlayers" />
    </footer>
  </article>
</template>

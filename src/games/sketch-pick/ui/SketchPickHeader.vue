<script setup lang="ts">
import { useNavigation } from '@/shared/composables'
import { Button, PlayerCount } from '@/shared/ui'

interface Props {
  gameName: string
  roomName: string
  currentPlayers: number
  maxPlayers: number
}

defineProps<Props>()

const nav = useNavigation()

// 이전 history가 있으면 back으로 detail entry를 제거 (브라우저 뒤로가기가 자연스러워짐).
// 직접 URL/공유 링크로 진입해 history가 없으면 방 목록으로 fallback.
const onExit = () => nav.backOr(() => nav.toGameRooms('sketch-pick'))
</script>

<template>
  <header
    class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg-card px-4"
  >
    <div class="flex min-w-0 items-center">
      <Button variant="ghost" size="sm" @click="onExit" icon="chevronLeft"> 나가기 </Button>
      <span class="shrink-0 text-text-muted w-0.5 bg-text-muted h-4 rounded-2xl mx-2" />
      <div class="flex items-center gap-2">
        <span class="inline-flex shrink-0 text-sm font-semibold text-text-primary">
          {{ gameName }}
        </span>
        <span class="shrink-0 text-text-muted">·</span>
        <span class="truncate text-sm text-text-secondary">{{ roomName }}</span>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-3">
      <PlayerCount :current="currentPlayers" :max="maxPlayers" />
    </div>
  </header>
</template>

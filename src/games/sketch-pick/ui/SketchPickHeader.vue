<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

defineProps<{
  gameName: string
  gameIcon: string
  currentPlayers: number
  maxPlayers: number
  seconds: number
}>()

const router = useRouter()

const onExit = () => {
  // 이전 history가 있으면 back으로 detail entry를 제거 (브라우저 뒤로가기가 자연스러워짐).
  // 직접 URL/공유 링크로 진입해 history가 없으면 방 목록으로 fallback push.
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({
      name: ROUTE_NAME.GAME_ROOMS,
      params: { gameId: 'sketch-pick' },
    })
  }
}
</script>

<template>
  <header
    class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg-card px-4"
  >
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary cursor-pointer"
        @click="onExit"
      >
        <span aria-hidden="true">‹</span>
        나가기
      </button>
      <span class="text-text-muted">|</span>
      <span class="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
        <span aria-hidden="true">🎮</span>
        {{ gameName }}
      </span>
    </div>

    <div class="flex items-center gap-3">
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-text-secondary"
      >
        <span aria-hidden="true">👥</span>
        {{ currentPlayers }}/{{ maxPlayers }}
      </span>
      <span
        class="inline-flex items-center gap-1.5 rounded-full border border-brand bg-brand-soft px-3 py-1 text-sm font-semibold text-brand"
      >
        <span aria-hidden="true">⏱</span>
        {{ seconds }}초
      </span>
    </div>
  </header>
</template>

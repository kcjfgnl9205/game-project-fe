<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import GameCard from '@/entities/room/ui/GameCard.vue'
import { games, type GameType } from '@/shared/lib/games'
import { ROUTE_NAME } from '@/app/router/router-name'
import { fetchRoomStats } from '@/entities/room/api'

// 게임타입별 개설된 방 수(대기+게임중). 진입 시 1회만 로드한다.
const roomCountByType = ref<Partial<Record<GameType, number>>>({})

onMounted(async () => {
  try {
    const stats = await fetchRoomStats()
    roomCountByType.value = Object.fromEntries(
      stats.map((s) => [s.gameType, s.waiting + s.inGame]),
    )
  } catch {
    // 통계 실패해도 게임 목록은 정상 노출 (조용히 무시)
  }
})
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-20">
    <header class="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold text-text-primary">게임 목록</h2>
        <p class="mt-2 text-sm text-text-secondary">원하는 게임을 선택해서 플레이하세요</p>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <template v-for="game in games" :key="game.id">
        <RouterLink
          v-if="game.status === 'available'"
          :to="{ name: ROUTE_NAME.GAME_ROOMS, params: { gameId: game.id } }"
          class="block"
        >
          <GameCard :game="game" :room-count="game.gameType ? (roomCountByType[game.gameType] ?? 0) : 0" />
        </RouterLink>
        <div v-else class="cursor-not-allowed opacity-60">
          <GameCard :game="game" :room-count="game.gameType ? (roomCountByType[game.gameType] ?? 0) : 0" />
        </div>
      </template>
    </div>
  </section>
</template>

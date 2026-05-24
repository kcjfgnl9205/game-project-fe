<script setup lang="ts">
import { RouterLink } from 'vue-router'
import GameCard from '@/entities/room/ui/GameCard.vue'
import { games } from '@/shared/lib/games'
import { ROUTE_NAME } from '@/app/router/router-name'

const activeUsers = 128
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-20">
    <header class="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold text-text-primary">게임 목록</h2>
        <p class="mt-2 text-sm text-text-secondary">원하는 게임을 선택해서 플레이하세요</p>
      </div>
      <span class="inline-flex items-center gap-2 text-sm text-text-secondary">
        <span aria-hidden="true">👥</span>
        현재 접속자 {{ activeUsers.toLocaleString() }}명
      </span>
    </header>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <template v-for="game in games" :key="game.id">
        <RouterLink
          v-if="game.status === 'available'"
          :to="{ name: ROUTE_NAME.GAME_ROOMS, params: { gameId: game.id } }"
          class="block"
        >
          <GameCard :game="game" />
        </RouterLink>
        <div v-else class="cursor-not-allowed opacity-60">
          <GameCard :game="game" />
        </div>
      </template>
    </div>
  </section>
</template>

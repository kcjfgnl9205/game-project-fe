<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BaseButton from '@/shared/ui/BaseButton.vue'
import RoomCard from '@/entities/room/ui/RoomCard.vue'
import { useModalStore } from '@/shared/stores'
import { games } from '@/shared/lib/games'
import { findRoomsByGameId } from '@/shared/lib/rooms'
import { CreateRoomModal, type CreateRoomResult } from '@/features/create-room'
import { ROUTE_NAME } from '@/app/router/router-name'

const modal = useModalStore()
const route = useRoute()
const search = ref('')

const onCreateRoom = async () => {
  if (!game.value) return
  const result = await modal.open<CreateRoomResult | undefined>(CreateRoomModal, {
    gameId: game.value.id,
  })
  if (result) console.log('[create-room] submit', result)
}

const game = computed(() => {
  const id = route.params.gameId
  if (typeof id !== 'string') return undefined
  return games.find((g) => g.id === id)
})

const rooms = computed(() => (game.value ? findRoomsByGameId(game.value.id) : []))

const filteredRooms = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return rooms.value
  return rooms.value.filter((room) => room.name.toLowerCase().includes(term))
})
</script>

<template>
  <section v-if="game" class="mx-auto max-w-7xl px-6 py-12">
    <header class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-center gap-4">
        <span
          class="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-bg-card text-3xl"
          aria-hidden="true"
        >
          {{ game.icon }}
        </span>
        <div>
          <h1 class="text-3xl font-bold text-text-primary">{{ game.name }}</h1>
          <p class="mt-1 text-sm text-text-secondary">
            {{ game.description }} ({{ game.minPlayers }}-{{ game.maxPlayers }}명)
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          aria-label="새로고침"
          class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary"
        >
          <span aria-hidden="true">🔄</span>
        </button>
        <BaseButton variant="primary" size="md" glow @click="onCreateRoom">
          <span aria-hidden="true">+</span>
          방 만들기
        </BaseButton>
      </div>
    </header>

    <div class="mb-6 flex flex-wrap items-center gap-4">
      <div class="relative min-w-0 flex-1">
        <span
          class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          v-model="search"
          type="text"
          placeholder="방 이름으로 검색..."
          class="h-12 w-full rounded-xl border border-border bg-bg-card pr-4 pl-11 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-brand focus:outline-none"
        />
      </div>
      <span class="shrink-0 text-sm text-text-secondary">
        총 {{ filteredRooms.length }}개의 방
      </span>
    </div>

    <div
      v-if="filteredRooms.length > 0"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <RouterLink
        v-for="room in filteredRooms"
        :key="room.id"
        :to="{ name: room.gameId, params: { roomId: room.id } }"
        class="block"
      >
        <RoomCard :room="room" />
      </RouterLink>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-border py-20 text-center">
      <p class="text-sm text-text-secondary">
        {{ search ? '검색 결과가 없습니다' : '아직 만들어진 방이 없어요' }}
      </p>
    </div>
  </section>

  <section v-else class="mx-auto max-w-3xl px-6 py-20 text-center">
    <p class="text-lg font-semibold text-text-primary">게임을 찾을 수 없습니다</p>
    <RouterLink
      :to="{ name: ROUTE_NAME.GAME_LIST }"
      class="mt-4 inline-block text-sm text-brand hover:underline"
    >
      게임 목록으로
    </RouterLink>
  </section>
</template>

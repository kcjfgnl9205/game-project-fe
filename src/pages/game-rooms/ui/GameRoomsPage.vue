<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BaseButton from '@/shared/ui/BaseButton.vue'
import RoomCard from '@/entities/room/ui/RoomCard.vue'
import { useModalStore, useAuthStore } from '@/shared/stores'
import { useNavigation } from '@/shared/composables'
import { games } from '@/shared/lib/games'
import { getGuestNickname } from '@/shared/lib/guest'
import { createRoom, fetchRooms, joinRoom } from '@/entities/room/api'
import type { JoinRoomRequest, RoomListItem } from '@/entities/room/model'
import { CreateRoomModal } from '@/features/create-room'
import type { CreateRoomRequest } from '@/entities/room/model'
import { ApiError } from '@/shared/api'
import { ROUTE_NAME } from '@/app/router/router-name'

const modal = useModalStore()
const auth = useAuthStore()
const route = useRoute()
const nav = useNavigation()

const search = ref('')
const rooms = ref<RoomListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const joiningId = ref<string | null>(null)

const game = computed(() => {
  const id = route.params.gameId
  if (typeof id !== 'string') return undefined
  return games.find((g) => g.id === id)
})

const filteredRooms = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return rooms.value
  return rooms.value.filter((room) => room.name.toLowerCase().includes(term))
})

async function loadRooms() {
  loading.value = true
  error.value = null
  try {
    const { items } = await fetchRooms()
    rooms.value = items
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '방 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function onCreateRoom() {
  if (!game.value) return
  const payload = await modal.open<CreateRoomRequest | undefined>(CreateRoomModal, {
    gameId: game.value.id,
  })
  if (!payload) return

  try {
    const room = await createRoom(payload)
    await nav.toGameRoom(game.value.id, room.id)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '방을 만들지 못했습니다.'
  }
}

async function enterRoom(room: RoomListItem) {
  if (!game.value) return
  joiningId.value = room.id
  try {
    const body: JoinRoomRequest = {}
    if (room.isPrivate) {
      const password = window.prompt('비밀번호를 입력하세요')
      if (password === null) return // 취소
      body.password = password
    }
    if (!auth.isAuthenticated) body.nickname = getGuestNickname()

    await joinRoom(room.id, body)
    await nav.toGameRoom(game.value.id, room.id)
  } catch (e) {
    // 이미 참가 중(409)이면 그대로 입장 처리
    if (e instanceof ApiError && e.status === 409) {
      await nav.toGameRoom(game.value.id, room.id)
      return
    }
    error.value = e instanceof ApiError ? e.message : '방에 입장하지 못했습니다.'
  } finally {
    joiningId.value = null
  }
}

onMounted(loadRooms)
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
          :disabled="loading"
          class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary disabled:opacity-50"
          @click="loadRooms"
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
      <span class="shrink-0 text-sm text-text-secondary"> 총 {{ filteredRooms.length }}개의 방 </span>
    </div>

    <p v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</p>

    <p v-if="loading" class="py-20 text-center text-sm text-text-muted">불러오는 중…</p>

    <div
      v-else-if="filteredRooms.length > 0"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <button
        v-for="room in filteredRooms"
        :key="room.id"
        type="button"
        :disabled="joiningId === room.id"
        class="block w-full cursor-pointer text-left disabled:opacity-60"
        @click="enterRoom(room)"
      >
        <RoomCard :room="room" />
      </button>
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

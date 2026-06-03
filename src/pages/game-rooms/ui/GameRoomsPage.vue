<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Button, Input, Pagination } from '@/shared/ui'
import RoomCard from '@/entities/room/ui/RoomCard.vue'
import { useModalStore, useAuthStore } from '@/shared/stores'
import { useNavigation, useToast, usePagination } from '@/shared/composables'
import { games } from '@/shared/lib/games'
import { getGuestNickname } from '@/shared/lib/guest'
import { createRoom, fetchRooms, joinRoom } from '@/entities/room/api'
import type { JoinRoomRequest, RoomListItem } from '@/entities/room/model'
import { CreateRoomModal } from '@/features/create-room'
import { PasswordPromptModal } from '@/shared/ui-modal'
import type { CreateRoomRequest } from '@/entities/room/model'
import { ApiError } from '@/shared/api'
import { ROUTE_NAME } from '@/app/router/router-name'

const modal = useModalStore()
const auth = useAuthStore()
const route = useRoute()
const nav = useNavigation()
const toast = useToast()

const search = ref('')
const rooms = ref<RoomListItem[]>([])
const loading = ref(true)
const joiningId = ref<string | null>(null)

const {
  page,
  limit,
  total,
  pages,
  hasPrevGroup,
  hasNextGroup,
  showPagination,
  setPage,
  prevGroup,
  nextGroup,
} = usePagination({ limit: 9 })

const game = computed(() => {
  const id = route.params.gameId
  if (typeof id !== 'string') return undefined
  return games.find((g) => g.id === id)
})

// 검색어 디바운스: 입력이 멈춘 뒤 300ms에 서버 재검색하고 1페이지로 되돌린다.
const debouncedQ = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (v) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedQ.value = v.trim()
    setPage(1)
  }, 300)
})

async function loadRooms() {
  loading.value = true
  try {
    const { items, total: t } = await fetchRooms({
      page: page.value,
      limit,
      q: debouncedQ.value || undefined,
    })
    rooms.value = items
    total.value = t
  } catch (e) {
    toast.error(e, '방 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

// 페이지 또는 검색어가 바뀌면 재조회 (같은 틱 변경은 한 번만 호출됨)
watch([page, debouncedQ], loadRooms)

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
    toast.error(e, '방을 만들지 못했습니다.')
  }
}

async function enterRoom(room: RoomListItem) {
  if (!game.value) return

  // 비공개 방: 비밀번호 모달은 입력 UI만 담당하고, 입장 로직은 여기서 주입한다.
  // 틀리면(throw) 모달이 유지되며 메시지를 띄우고, 성공하면 모달이 닫히고 true 반환.
  if (room.isPrivate) {
    const entered = await modal.open<boolean>(PasswordPromptModal, {
      description: `'${room.name}' 방은 비공개입니다.`,
      submitText: '입장',
      onSubmit: async (password: string) => {
        try {
          await joinRoom(room.id, {
            password,
            nickname: auth.isAuthenticated ? undefined : getGuestNickname(),
          })
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) return // 이미 참가 중 → 성공 취급
          if (e instanceof ApiError && e.status === 401)
            throw new Error('비밀번호가 올바르지 않습니다.')
          throw new Error(e instanceof ApiError ? e.message : '입장하지 못했습니다.')
        }
      },
    })
    if (entered) await nav.toGameRoom(game.value.id, room.id)
    return
  }

  // 공개 방: 바로 입장
  joiningId.value = room.id
  try {
    const body: JoinRoomRequest = {}
    if (!auth.isAuthenticated) body.nickname = getGuestNickname()

    await joinRoom(room.id, body)
    await nav.toGameRoom(game.value.id, room.id)
  } catch (e) {
    // 이미 참가 중(409)이면 그대로 입장 처리
    if (e instanceof ApiError && e.status === 409) {
      await nav.toGameRoom(game.value.id, room.id)
      return
    }
    toast.error(e, '방에 입장하지 못했습니다.')
  } finally {
    joiningId.value = null
  }
}

onMounted(loadRooms)
</script>

<template>
  <section v-if="game" class="mx-auto max-w-7xl px-6 py-12">
    <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-bold text-text-primary">{{ game.name }}</h1>
        <p class="text-sm text-text-secondary">
          {{ game.description }} ({{ game.minPlayers }}-{{ game.maxPlayers }}명)
        </p>
      </div>

      <Button variant="primary" size="md" @click="onCreateRoom" icon="plus"> 방 만들기 </Button>
    </header>

    <div class="w-full mb-4">
      <Input v-model="search" type="text" placeholder="방 이름으로 검색..." icon="search" />
    </div>

    <div class="flex gap-2 items-center mb-4 ml-2">
      <div class="text-sm text-text-secondary">총 {{ total }}개의 방</div>
      <Button variant="outline" size="sm" @click="loadRooms" icon="refresh">새로고침</Button>
    </div>

    <p v-if="loading" class="py-20 text-center text-sm text-text-muted">불러오는 중…</p>
    <div v-else-if="rooms.length > 0" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="room in rooms"
        :key="room.id"
        type="button"
        :disabled="joiningId === room.id"
        class="block w-full cursor-pointer disabled:opacity-60"
        @click="enterRoom(room)"
      >
        <RoomCard :room="room" />
      </button>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-border py-20 text-center">
      <p class="text-sm text-text-secondary">
        {{ debouncedQ ? '검색 결과가 없습니다' : '아직 만들어진 방이 없어요' }}
      </p>
    </div>

    <Pagination
      v-if="showPagination"
      class="mt-8"
      :page="page"
      :pages="pages"
      :has-prev-group="hasPrevGroup"
      :has-next-group="hasNextGroup"
      @update:page="setPage"
      @prev-group="prevGroup"
      @next-group="nextGroup"
    />
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

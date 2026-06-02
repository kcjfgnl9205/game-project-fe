<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import SketchPickHeader from './SketchPickHeader.vue'
import SketchPickParticipants from './SketchPickParticipants.vue'
import SketchPickCanvas from './SketchPickCanvas.vue'
import SketchPickChat from './SketchPickChat.vue'
import { useGameStore, type Participant } from '@/games/sketch-pick/model/game.store'
import { fetchRoom, leaveRoom } from '@/entities/room/api'
import type { Room } from '@/entities/room/model'
import { ApiError } from '@/shared/api'
import { useAuthStore } from '@/shared/stores'
import { getGuestId, getGuestNickname } from '@/shared/lib/guest'

const route = useRoute()
const auth = useAuthStore()
const game = useGameStore()

const room = ref<Room | null>(null)
const error = ref<string | null>(null)
const hasLeft = ref(false)

const roomId = computed(() =>
  typeof route.params.roomId === 'string' ? route.params.roomId : null,
)

// 본인 식별 키. 회원은 user:<id>, 게스트는 guest:<id> (lobby:state의 playerId와 동일 규칙).
const myPlayerId = computed(() =>
  auth.isAuthenticated ? `user:${auth.user?.id}` : `guest:${getGuestId()}`,
)

// 내가 이번 턴 출제자인지. 제시어/단어 선택 UI는 출제자에게만 노출한다.
const isMyTurn = computed(
  () => !!game.currentDrawerKey && game.currentDrawerKey === myPlayerId.value,
)

// lobby:state 실시간 참가자 → 점수 내림차순 정렬해 순위 부여.
const participants = computed<Participant[]>(() =>
  [...game.players]
    .sort((a, b) => b.score - a.score)
    .map((p, index) => ({
      id: p.playerId,
      rank: index + 1,
      nickname: p.nickname,
      score: p.score,
      isHost: p.isHost,
      isDrawing: p.playerId === game.currentDrawerKey,
      isMe: p.playerId === myPlayerId.value,
    })),
)

const now = ref(Date.now())
const seconds = computed(() => {
  if (!game.turnEndsAt) return 0
  return Math.max(0, Math.ceil((game.turnEndsAt - now.value) / 1000))
})
let timer: ReturnType<typeof setInterval> | null = null

function handlePageUnload() {
  if (hasLeft.value) return
  hasLeft.value = true
  game.disconnect()
}

async function leaveCurrentRoom() {
  if (!roomId.value || hasLeft.value) return
  hasLeft.value = true

  try {
    await leaveRoom(roomId.value)
  } catch {
    // REST leave가 실패해도 소켓 disconnect로 서버에서 cleanup을 시도한다.
  } finally {
    game.disconnect()
  }
}

onMounted(async () => {
  if (!roomId.value) return

  // 방 메타(최대 인원 등)는 REST, 실시간 참가자/채팅은 소켓.
  try {
    room.value = await fetchRoom(roomId.value)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '방 정보를 불러오지 못했습니다.'
  }

  game.connect(roomId.value, {
    token: auth.accessToken ?? undefined,
    guestId: auth.isAuthenticated ? undefined : getGuestId(),
    nickname: auth.isAuthenticated ? (auth.user?.nickname ?? '') : getGuestNickname(),
  })

  window.addEventListener('beforeunload', handlePageUnload)
  window.addEventListener('pagehide', handlePageUnload)

  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

// 화면 이탈 / 라우트 이동 시 명시적 REST leave + 소켓 disconnect.
onBeforeRouteLeave(async () => {
  await leaveCurrentRoom()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('beforeunload', handlePageUnload)
  window.removeEventListener('pagehide', handlePageUnload)
  if (!hasLeft.value) {
    void leaveCurrentRoom()
  }
})
</script>

<template>
  <div class="flex h-dvh flex-col">
    <SketchPickHeader
      game-name="스케치픽"
      game-icon="🎨"
      :current-players="participants.length"
      :max-players="room?.maxPlayers ?? 8"
      :seconds="seconds"
    />

    <div class="flex flex-1 overflow-hidden">
      <SketchPickParticipants :participants="participants" />

      <div class="flex-1 flex flex-col">
        <div
          v-if="game.error"
          class="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ game.error }}
        </div>
        <div
          v-if="game.announcement"
          class="mb-3 rounded-2xl border border-brand-soft bg-brand-soft px-4 py-3 text-sm font-semibold text-brand"
        >
          {{ game.announcement }}
        </div>

        <!-- 제시어 바: 출제자는 단어, 나머지는 글자 수(○)만 -->
        <div
          v-if="game.status === 'DRAWING' && (game.word || game.wordLength)"
          class="mb-3 rounded-2xl border border-brand bg-brand-soft px-4 py-3 text-center"
        >
          <span class="text-sm text-gray-500">제시어: </span>
          <span class="ml-1 text-lg font-bold tracking-widest text-brand">{{
            isMyTurn ? game.word : '○'.repeat(game.wordLength)
          }}</span>
        </div>

        <SketchPickCanvas />
      </div>
      <SketchPickChat />
    </div>

    <!-- 단어 선택 모달: 출제자에게만. 선택하면 즉시 그리기 시작 -->
    <div
      v-if="game.status === 'WORD_SELECT' && isMyTurn && game.wordChoices.length"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 class="mb-1 text-center text-lg font-bold text-gray-800">그릴 단어를 선택하세요</h3>
        <p class="mb-4 text-center text-xs text-gray-400">선택하면 바로 시작됩니다</p>
        <div class="flex flex-col gap-2">
          <button
            v-for="w in game.wordChoices"
            :key="w"
            type="button"
            class="rounded-xl border border-brand bg-brand-soft px-4 py-3 text-base font-semibold text-brand hover:bg-brand hover:text-white"
            @click="game.pickWord(w)"
          >
            {{ w }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

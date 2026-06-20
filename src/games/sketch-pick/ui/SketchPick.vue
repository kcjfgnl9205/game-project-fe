<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import SketchPickCanvas from './SketchPickCanvas.vue'
import SketchPickLobbyModal from './SketchPickLobbyModal.vue'
import SketchPickWordSelectModal from './SketchPickWordSelectModal.vue'
import { GameLoadingScreen } from '@/shared/ui'
import {
  BRUT,
  BRUT_LG,
  avatarColor,
  BrutalChat,
  BrutalPlayerCard,
} from '@/shared/ui-brutal'
import { useGameStore, type Participant } from '@/games/sketch-pick/model/game.store'
import { fetchRoom, leaveRoom } from '@/entities/room/api'
import type { Room } from '@/entities/room/model'
import { ApiError } from '@/shared/api'
import { useAuthStore } from '@/shared/stores'
import { useNavigation } from '@/shared/composables'
import { getGuestId, getGuestNickname } from '@/shared/lib/guest'

const route = useRoute()
const auth = useAuthStore()
const game = useGameStore()
const nav = useNavigation()

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

const isMyTurn = computed(
  () => !!game.currentDrawerKey && game.currentDrawerKey === myPlayerId.value,
)

// 출제자는 제시어, 맞히는 사람은 ○○○(글자 수).
const promptText = computed(() =>
  isMyTurn.value ? (game.word ?? '') : '○'.repeat(game.wordLength),
)

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
const seconds = computed(() => {
  if (!game.turnEndsAt) return 0
  return Math.max(0, Math.ceil((game.turnEndsAt - now.value) / 1000))
})

const statusLabel = computed(() => {
  switch (game.status) {
    case 'WORD_SELECT':
      return '단어 선택 중…'
    case 'REVEAL':
      return '정답 공개'
    case 'LOBBY':
      return '게임 대기 중'
    default:
      return ''
  }
})

// 참가자 → 점수 내림차순 순위.
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

function onExit() {
  nav.backOr(() => nav.toGameRooms('sketch-pick'))
}

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
    // REST leave 실패해도 소켓 disconnect로 서버가 cleanup
  } finally {
    game.disconnect()
  }
}

onMounted(() => {
  if (!roomId.value) return

  // 소켓 연결과 방 메타(REST)를 병렬로 시작.
  game.connect(roomId.value, {
    token: auth.accessToken ?? undefined,
    guestId: auth.isAuthenticated ? undefined : getGuestId(),
    nickname: auth.isAuthenticated ? (auth.user?.nickname ?? '') : getGuestNickname(),
  })

  fetchRoom(roomId.value)
    .then((r) => (room.value = r))
    .catch((e) => {
      error.value = e instanceof ApiError ? e.message : '방 정보를 불러오지 못했습니다.'
    })

  timer = setInterval(() => (now.value = Date.now()), 1000)
  window.addEventListener('beforeunload', handlePageUnload)
  window.addEventListener('pagehide', handlePageUnload)
})

onBeforeRouteLeave(async () => {
  await leaveCurrentRoom()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('beforeunload', handlePageUnload)
  window.removeEventListener('pagehide', handlePageUnload)
  if (!hasLeft.value) void leaveCurrentRoom()
})
</script>

<template>
  <div
    v-if="room && game.ready"
    class="game-root flex h-dvh flex-col gap-3 overflow-hidden bg-[#FFF9E1] p-3 text-[#161310] sm:gap-4 sm:p-4 lg:flex-row dark:bg-[#13110b] dark:text-[#f2ead6]"
  >
    <!-- ===== 좌측: 타이틀 + 참가자 ===== -->
    <aside class="flex shrink-0 flex-col gap-3 sm:gap-4 lg:w-64 xl:w-72">
      <div :class="['p-5', BRUT, 'bg-[#FFB300]']">
        <button
          type="button"
          class="press mb-3 inline-flex items-center gap-1 rounded-xl border-2 border-black bg-white/80 px-3 py-1 text-xs font-black text-black shadow-[3px_3px_0_0_#000]"
          @click="onExit"
        >
          ← 나가기
        </button>
        <h1 class="font-game text-3xl leading-none text-black">그림 맞추기</h1>
        <p class="mt-1 truncate text-xs font-bold text-black/70">
          {{ room.name }}<template v-if="game.turnCount"> · {{ game.turnCount }}턴</template>
        </p>
      </div>

      <div :class="['flex min-h-0 flex-1 flex-col p-4', BRUT, 'bg-white dark:bg-[#262019]']">
        <h2 class="font-game mb-3 text-lg text-slate-400">
          PLAYERS · {{ participants.length }}/{{ room.maxPlayers }}
        </h2>
        <div class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          <BrutalPlayerCard
            v-for="p in participants"
            :key="p.id"
            :nickname="p.nickname"
            :avatar-color="avatarColor(p.rank - 1)"
            :is-host="p.isHost"
            :is-me="p.isMe"
            :active="p.isDrawing"
            :score-pop="game.scorePops[p.id] ?? null"
          >
            {{ p.score }}점
          </BrutalPlayerCard>
        </div>
      </div>
    </aside>

    <!-- ===== 중앙: 제시어바 + 캔버스 ===== -->
    <main class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
      <div
        :class="['flex items-center justify-between gap-3 p-3 sm:p-4', BRUT, 'bg-white dark:bg-[#262019]']"
      >
        <div class="flex min-w-0 items-center gap-3">
          <template v-if="game.status === 'DRAWING'">
            <span
              class="shrink-0 rounded-full border-2 border-black bg-[#4F46E5] px-3 py-1 text-xs font-black text-white shadow-[3px_3px_0_0_#000]"
              >제시어</span
            >
            <h2 class="font-game truncate text-2xl tracking-widest sm:text-3xl">
              {{ promptText }}
            </h2>
          </template>
          <h2 v-else class="font-game truncate text-xl text-slate-400 sm:text-2xl">
            {{ statusLabel }}
          </h2>
        </div>
        <div
          v-if="game.turnEndsAt"
          class="flex shrink-0 items-center gap-1.5 rounded-2xl border-2 border-black bg-[#FF6B6B]/10 px-4 py-2"
        >
          <span class="text-xl">⏰</span>
          <span class="font-game text-2xl text-[#FF6B6B]">{{ seconds }}</span>
        </div>
      </div>

      <div :class="['relative flex min-h-0 flex-1 flex-col overflow-hidden', BRUT_LG, 'bg-[#FDFBF7]']">
        <SketchPickCanvas :my-player-id="myPlayerId">
          <template #overlay="t">
            <div
              v-if="game.error || game.announcement"
              class="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000]"
            >
              {{ game.error ?? game.announcement }}
            </div>

            <SketchPickLobbyModal :my-player-id="myPlayerId" />
            <SketchPickWordSelectModal :my-player-id="myPlayerId" />

            <!-- 그리기 툴바 (출제자만) -->
            <div
              v-if="t.canDraw"
              class="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-[24px] border-4 border-black bg-white p-3 shadow-[6px_6px_0_0_#000] dark:bg-[#262019]"
            >
              <div class="flex flex-wrap gap-1.5 border-r-2 border-black/10 pr-3">
                <button
                  v-for="c in t.palette"
                  :key="c"
                  type="button"
                  class="h-7 w-7 rounded-full border-2 border-black transition-transform hover:scale-110"
                  :class="
                    t.selectedColor === c
                      ? 'ring-2 ring-[#4F46E5] ring-offset-1 dark:ring-offset-[#262019]'
                      : ''
                  "
                  :style="{ backgroundColor: c }"
                  @click="t.setColor(c)"
                />
              </div>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="press flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-slate-100 text-sm font-black text-black shadow-[2px_2px_0_0_#000] dark:bg-[#1c1812] dark:text-white"
                  @click="t.decreaseSize()"
                >
                  −
                </button>
                <span class="font-game w-4 text-center text-lg">{{ t.brushSize }}</span>
                <button
                  type="button"
                  class="press flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-slate-100 text-sm font-black text-black shadow-[2px_2px_0_0_#000] dark:bg-[#1c1812] dark:text-white"
                  @click="t.increaseSize()"
                >
                  ＋
                </button>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="press rounded-xl border-2 border-black bg-[#FFB300] px-3 py-2 text-xs font-black text-black shadow-[3px_3px_0_0_#000]"
                  :class="t.isEraser ? 'ring-2 ring-black ring-offset-1' : ''"
                  @click="t.useEraser()"
                >
                  🧹
                </button>
                <button
                  type="button"
                  class="press rounded-xl border-2 border-black bg-[#FF6B6B] px-3 py-2 text-xs font-black text-white shadow-[3px_3px_0_0_#000]"
                  @click="t.clear()"
                >
                  ❌
                </button>
              </div>
            </div>
          </template>
        </SketchPickCanvas>
      </div>
    </main>

    <!-- ===== 우측: 채팅 ===== -->
    <aside class="flex shrink-0 flex-col lg:w-72 xl:w-80">
      <BrutalChat :messages="game.chat" placeholder="정답은?" @send="game.sendChat" />
    </aside>
  </div>

  <GameLoadingScreen v-else :error="error ?? game.error" />
</template>

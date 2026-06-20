<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import SketchPickCanvas from './SketchPickCanvas.vue'
import SketchPickLobbyModal from './SketchPickLobbyModal.vue'
import SketchPickWordSelectModal from './SketchPickWordSelectModal.vue'
import { GameLoadingScreen } from '@/shared/ui'
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

// 네오브루탈리즘 카드 공통 클래스 (굵은 테두리 + 둥근 모서리 + 하드 그림자)
const BRUT = 'rounded-[28px] border-4 border-black shadow-[6px_6px_0_0_#000]'
const BRUT_LG = 'rounded-[32px] border-4 border-black shadow-[10px_10px_0_0_#000]'

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

// 상단 상태 라벨
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

// 아바타 색(순위 기준 고정 팔레트)
const AVATAR_COLORS = ['#FFB300', '#00D8A5', '#FF6B6B', '#4F46E5', '#a855f7', '#3b82f6']
const avatarColor = (rank: number) => AVATAR_COLORS[(rank - 1) % AVATAR_COLORS.length]

// ===== 채팅 입력 =====
const chatInput = ref('')
const chatScroll = ref<HTMLElement | null>(null)
function submitChat() {
  const text = chatInput.value.trim()
  if (!text) return
  game.sendChat(text)
  chatInput.value = ''
}
// 새 메시지 오면 맨 아래로
watch(
  () => game.chat.length,
  () => nextTick(() => chatScroll.value?.scrollTo({ top: chatScroll.value.scrollHeight })),
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
      <!-- 타이틀 카드 -->
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

      <!-- 참가자 카드 -->
      <div
        :class="['flex min-h-0 flex-1 flex-col p-4', BRUT, 'bg-white dark:bg-[#262019]']"
      >
        <h2 class="font-game mb-3 text-lg text-slate-400">
          PLAYERS · {{ participants.length }}/{{ room.maxPlayers }}
        </h2>
        <div class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          <div
            v-for="p in participants"
            :key="p.id"
            class="flex items-center gap-2.5 rounded-2xl border-2 border-black p-2.5 shadow-[3px_3px_0_0_#000]"
            :class="
              p.isMe
                ? 'bg-[#00D8A5]/25 dark:bg-[#00D8A5]/15'
                : 'bg-slate-50 dark:bg-[#1c1812]'
            "
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black text-lg font-black text-black"
              :style="{ backgroundColor: avatarColor(p.rank) }"
            >
              {{ p.nickname.charAt(0) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="flex items-center gap-1 truncate text-sm font-black">
                <span class="truncate">{{ p.nickname }}</span>
                <span v-if="p.isHost" title="방장">👑</span>
              </p>
              <p class="text-xs font-bold text-slate-500 dark:text-[#9c9079]">{{ p.score }} pts</p>
            </div>
            <span v-if="p.isDrawing" class="shrink-0 text-lg" title="그리는 중">✏️</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ===== 중앙: 제시어바 + 캔버스 ===== -->
    <main class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
      <!-- 제시어 / 타이머 바 -->
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

      <!-- 캔버스 카드 -->
      <div
        :class="['relative flex min-h-0 flex-1 items-center justify-center overflow-hidden', BRUT_LG, 'bg-[#FDFBF7]']"
      >
        <SketchPickCanvas :my-player-id="myPlayerId">
          <template #overlay="t">
            <!-- 안내(에러/공지) -->
            <div
              v-if="game.error || game.announcement"
              class="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000]"
            >
              {{ game.error ?? game.announcement }}
            </div>

            <!-- 로비 / 단어선택 모달 -->
            <SketchPickLobbyModal :my-player-id="myPlayerId" />
            <SketchPickWordSelectModal :my-player-id="myPlayerId" />

            <!-- 그리기 툴바 (출제자만) -->
            <div
              v-if="t.canDraw"
              class="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-[24px] border-4 border-black bg-white p-3 shadow-[6px_6px_0_0_#000] dark:bg-[#262019]"
            >
              <!-- 색상 팔레트 -->
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

              <!-- 굵기 -->
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="press flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-slate-100 text-sm font-black text-black shadow-[2px_2px_0_0_#000] dark:bg-[#1c1812] dark:text-white"
                  @click="t.decreaseSize()"
                >
                  −
                </button>
                <span class="w-4 text-center font-game text-lg">{{ t.brushSize }}</span>
                <button
                  type="button"
                  class="press flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-slate-100 text-sm font-black text-black shadow-[2px_2px_0_0_#000] dark:bg-[#1c1812] dark:text-white"
                  @click="t.increaseSize()"
                >
                  ＋
                </button>
              </div>

              <!-- 지우개 / 전체삭제 -->
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
      <div
        :class="['flex min-h-0 flex-1 flex-col p-4', BRUT, 'bg-white dark:bg-[#262019]']"
      >
        <h2 class="font-game mb-3 text-lg text-slate-400">CHAT</h2>
        <div ref="chatScroll" class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          <template v-for="m in game.chat" :key="m.key">
            <p
              v-if="m.system"
              class="text-center text-xs font-bold text-slate-400 dark:text-[#7c7263]"
            >
              {{ m.text }}
            </p>
            <div
              v-else
              class="rounded-2xl border-2 border-black bg-slate-100 p-2.5 text-sm shadow-[2px_2px_0_0_#000] dark:bg-[#1c1812]"
            >
              <span class="font-black text-[#4F46E5] dark:text-[#a5b4fc]">{{ m.nickname }}:</span>
              {{ m.text }}
            </div>
          </template>
        </div>
        <form class="mt-3 flex gap-2" @submit.prevent="submitChat">
          <input
            v-model="chatInput"
            type="text"
            placeholder="정답은?"
            class="min-w-0 flex-1 rounded-xl border-2 border-black bg-[#FFF9E1] px-3 py-2 text-sm font-bold text-black focus:outline-none dark:bg-[#1c1812] dark:text-white"
          />
          <button
            type="submit"
            class="press flex shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#4F46E5] px-3 py-2 text-white shadow-[3px_3px_0_0_#000]"
          >
            ➤
          </button>
        </form>
      </div>
    </aside>
  </div>

  <!-- 방 정보 로딩 + 소켓 연결 + 첫 상태 수신 전까지 로딩 화면 -->
  <GameLoadingScreen v-else :error="error ?? game.error" />
</template>

<style scoped>
.game-root {
  font-family: 'Nanum Gothic', sans-serif;
}
.font-game {
  font-family: 'Gaegu', cursive;
}
/* 실제 게임 버튼처럼 눌리는 효과 */
.press {
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}
.press:active {
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 rgba(0, 0, 0, 1) !important;
}
</style>

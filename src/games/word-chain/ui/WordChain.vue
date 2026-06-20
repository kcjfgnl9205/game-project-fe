<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import WordChainLobbyModal from './WordChainLobbyModal.vue'
import WordChainResultModal from './WordChainResultModal.vue'
import { GameLoadingScreen } from '@/shared/ui'
import { BRUT, BRUT_LG, avatarColor, BrutalChat, BrutalPlayerCard } from '@/shared/ui-brutal'
import { useGameStore, type Participant } from '@/games/word-chain/model/game.store'
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
const myPlayerId = computed(() =>
  auth.isAuthenticated ? `user:${auth.user?.id}` : `guest:${getGuestId()}`,
)

const isMyTurn = computed(
  () => game.status === 'PLAYING' && game.currentTurnKey === myPlayerId.value,
)
const currentName = computed(
  () => game.players.find((p) => p.playerId === game.currentTurnKey)?.nickname ?? '',
)
const lastDef = computed(() => game.chainWords[game.chainWords.length - 1]?.definition ?? '')
const modeLabel = computed(() => (game.mode === 'TOURNAMENT' ? '토너먼트' : '라운드제'))

const participants = computed<Participant[]>(() =>
  game.players.map((p) => ({
    id: p.playerId,
    nickname: p.nickname,
    isHost: p.isHost,
    isMe: p.playerId === myPlayerId.value,
    isTurn: p.playerId === game.currentTurnKey,
    isAlive: p.isAlive,
    wins: p.wins,
  })),
)

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
const seconds = computed(() => {
  if (!game.turnEndsAt) return 0
  return Math.max(0, Math.ceil((game.turnEndsAt - now.value) / 1000))
})

// 단어 입력
const wordInput = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
function submit() {
  if (!isMyTurn.value) return
  const w = wordInput.value.trim()
  if (!w) return
  game.submitWord(w)
  wordInput.value = ''
}
// 내 차례가 되면 입력창 자동 포커스
watch(isMyTurn, (mine) => {
  if (mine) nextTick(() => inputEl.value?.focus())
})

function onExit() {
  nav.backOr(() => nav.toGameRooms('word-chain'))
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
    // 소켓 disconnect로 서버가 cleanup
  } finally {
    game.disconnect()
  }
}

onMounted(() => {
  if (!roomId.value) return
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
      <div :class="['p-5', BRUT, 'bg-[#00D8A5]']">
        <button
          type="button"
          class="press mb-3 inline-flex items-center gap-1 rounded-xl border-2 border-black bg-white/80 px-3 py-1 text-xs font-black text-black shadow-[3px_3px_0_0_#000]"
          @click="onExit"
        >
          ← 나가기
        </button>
        <h1 class="font-game text-3xl leading-none text-black">끝말잇기</h1>
        <p class="mt-1 truncate text-xs font-bold text-black/70">
          {{ room.name }} · {{ modeLabel
          }}<template v-if="game.mode === 'ROUND' && game.round">
            {{ game.round }}/{{ game.roundCount }}R</template
          >
        </p>
      </div>

      <div :class="['flex min-h-0 flex-1 flex-col p-4', BRUT, 'bg-white dark:bg-[#262019]']">
        <h2 class="font-game mb-3 text-lg text-slate-400">
          PLAYERS · {{ participants.length }}/{{ room.maxPlayers }}
        </h2>
        <div class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          <BrutalPlayerCard
            v-for="(p, i) in participants"
            :key="p.id"
            :nickname="p.nickname"
            :avatar-color="avatarColor(i)"
            :is-host="p.isHost"
            :is-me="p.isMe"
            :active="p.isTurn"
          >
            <span v-if="game.status === 'PLAYING' && !p.isAlive" class="text-[#FF6B6B]">탈락</span>
            <span v-else>{{ p.wins }}승</span>
          </BrutalPlayerCard>
        </div>
      </div>
    </aside>

    <!-- ===== 중앙: 단어 체인 ===== -->
    <main class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
      <!-- 상태/타이머 바 -->
      <div
        :class="['flex items-center justify-between gap-3 p-3 sm:p-4', BRUT, 'bg-white dark:bg-[#262019]']"
      >
        <h2 class="font-game truncate text-xl sm:text-2xl">
          <template v-if="game.status === 'PLAYING'">
            <span :class="isMyTurn ? 'text-[#00D8A5]' : 'text-slate-400'">
              {{ isMyTurn ? '내 차례!' : `${currentName}님 차례` }}
            </span>
          </template>
          <span v-else class="text-slate-400">대기 중</span>
        </h2>
        <div
          v-if="game.turnEndsAt && game.status === 'PLAYING'"
          class="flex shrink-0 items-center gap-1.5 rounded-2xl border-2 border-black bg-[#FF6B6B]/10 px-4 py-2"
        >
          <span class="text-xl">⏰</span>
          <span class="font-game text-2xl text-[#FF6B6B]">{{ seconds }}</span>
        </div>
      </div>

      <!-- 체인 카드 -->
      <div
        :class="['relative flex min-h-0 flex-1 flex-col overflow-hidden p-5 sm:p-6', BRUT_LG, 'bg-[#FDFBF7] dark:bg-[#262019]']"
      >
        <!-- 다음 시작 글자 -->
        <div class="flex items-center justify-center gap-2">
          <span
            class="rounded-full border-2 border-black bg-[#4F46E5] px-3 py-1 text-xs font-black text-white shadow-[3px_3px_0_0_#000]"
            >다음 시작</span
          >
          <span class="font-game text-3xl">
            {{ game.requiredStarts ? game.requiredStarts.join(' / ') : '아무 단어나!' }}
          </span>
        </div>

        <!-- 직전 단어 + 뜻 -->
        <div class="mt-5 flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <p class="font-game text-5xl tracking-wider text-[#161310] sm:text-6xl dark:text-[#f2ead6]">
            {{ game.lastWord ?? '⌨️' }}
          </p>
          <p
            v-if="lastDef"
            class="mt-3 line-clamp-2 max-w-lg text-sm font-bold text-slate-500 dark:text-[#9c9079]"
          >
            {{ lastDef }}
          </p>
        </div>

        <!-- 체인 칩 (최근 단어들) -->
        <div
          v-if="game.chainWords.length"
          class="mb-4 flex flex-wrap items-center justify-center gap-1.5 overflow-hidden"
        >
          <span
            v-for="w in game.chainWords.slice(-8)"
            :key="w.key"
            class="rounded-lg border-2 border-black bg-white px-2 py-0.5 text-xs font-bold text-black shadow-[2px_2px_0_0_#000]"
          >
            {{ w.word }}
          </span>
        </div>

        <!-- 입력 -->
        <form class="flex gap-2" @submit.prevent="submit">
          <input
            ref="inputEl"
            v-model="wordInput"
            type="text"
            :disabled="!isMyTurn"
            :placeholder="isMyTurn ? '단어를 입력하세요' : '다른 사람 차례를 기다리는 중…'"
            class="min-w-0 flex-1 rounded-xl border-4 border-black bg-white px-4 py-3 text-lg font-black text-black focus:outline-none disabled:opacity-50 dark:bg-[#1c1812] dark:text-white"
          />
          <button
            type="submit"
            :disabled="!isMyTurn"
            class="press shrink-0 rounded-xl border-4 border-black bg-[#00D8A5] px-5 py-3 font-black text-black shadow-[5px_5px_0_0_#000] disabled:opacity-50"
          >
            제출
          </button>
        </form>
        <!-- 거절 메시지 -->
        <p
          v-if="game.rejectMsg"
          class="mt-2 text-center text-sm font-black text-[#FF6B6B]"
        >
          ⚠️ {{ game.rejectMsg }}
        </p>

        <!-- 로비 / 결과 모달 -->
        <WordChainLobbyModal :my-player-id="myPlayerId" />
        <WordChainResultModal :my-player-id="myPlayerId" />
      </div>
    </main>

    <!-- ===== 우측: 채팅 ===== -->
    <aside class="flex shrink-0 flex-col lg:w-72 xl:w-80">
      <BrutalChat :messages="game.chat" placeholder="메시지를 입력하세요" @send="game.sendChat" />
    </aside>
  </div>

  <GameLoadingScreen v-else :error="error ?? game.error" />
</template>

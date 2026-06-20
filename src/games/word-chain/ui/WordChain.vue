<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import WordChainLobbyModal from './WordChainLobbyModal.vue'
import WordChainResultModal from './WordChainResultModal.vue'
import { GameLoadingScreen } from '@/shared/ui'
import { BRUT, avatarColor, BrutalChat } from '@/shared/ui-brutal'
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
// 가운데 표시 글자: 직전 단어가 있으면 마지막 글자, 없으면(첫 턴) 제시된 시작 글자
const displayChar = computed(() =>
  game.lastWord ? game.lastWord[game.lastWord.length - 1] : (game.requiredStarts?.[0] ?? ''),
)

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
// 남은 시간을 줄어드는 progress bar로 표현 (텍스트 숫자 대신)
const progressPct = computed(() => {
  const total = game.turnTimeSec * 1000
  if (!total || !game.turnEndsAt) return 0
  return Math.min(100, Math.max(0, ((game.turnEndsAt - now.value) / total) * 100))
})

// 채팅 1개로 겸용: 내 차례면 단어 제출(정답), 아니면 일반 채팅.
function onSend(text: string) {
  if (isMyTurn.value) game.submitWord(text)
  else game.sendChat(text)
}

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
  timer = setInterval(() => (now.value = Date.now()), 200)
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
    class="game-root mx-auto flex h-dvh w-full max-w-4xl flex-col gap-3 overflow-hidden bg-[#FFF9E1] p-3 text-[#161310] sm:p-4 dark:bg-[#13110b] dark:text-[#f2ead6]"
  >
    <!-- 1. 헤더 (나가기 일렬) -->
    <header :class="['flex shrink-0 items-center justify-between gap-2 p-3', BRUT, 'bg-[#00D8A5]']">
      <button
        type="button"
        class="press inline-flex items-center gap-1 rounded-xl border-2 border-black bg-white/80 px-3 py-1.5 text-xs font-black text-black shadow-[3px_3px_0_0_#000]"
        @click="onExit"
      >
        ← 나가기
      </button>
      <h1 class="font-game text-2xl leading-none text-black">끝말잇기</h1>
      <span class="text-xs font-black text-black/70">
        {{ modeLabel
        }}<template v-if="game.mode === 'ROUND' && game.round">
          {{ game.round }}/{{ game.roundCount }}R</template
        >
      </span>
    </header>

    <!-- 2. 게임 영역 (border 색으로 차례 표현: 내 차례=초록 / 상대 차례=노랑) -->
    <div
      :class="[
        'relative flex min-h-0 flex-1 flex-col gap-3 rounded-4xl border-4 p-5 shadow-[10px_10px_0_0_#000]transition-colors',
        game.status !== 'PLAYING' ? 'border-black' : isMyTurn ? 'border-[#00D8A5]' : '',
        'bg-[#FDFBF7] dark:bg-[#262019]',
      ]"
    >
      <!-- 남은 시간: 줄어드는 progress bar -->
      <div
        v-if="game.turnEndsAt && game.status === 'PLAYING'"
        class="h-3 w-full shrink-0 overflow-hidden rounded-full border-2 border-black bg-black/10 dark:bg-white/10"
      >
        <div
          class="h-full rounded-full ease-linear"
          :class="[
            progressPct > 50 ? 'bg-[#00D8A5]' : progressPct > 25 ? 'bg-[#FFB300]' : 'bg-[#FF6B6B]',
            'transition-[width] duration-200',
          ]"
          :style="{ width: progressPct + '%' }"
        />
      </div>

      <!-- 가운데: 직전 단어의 마지막 글자만 크게 -->
      <div class="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <p class="font-game text-7xl tracking-wider sm:text-8xl">{{ displayChar || '⌨️' }}</p>
      </div>

      <p v-if="game.rejectMsg" class="shrink-0 text-center text-sm font-black text-[#FF6B6B]">
        ⚠️ {{ game.rejectMsg }}
      </p>

      <WordChainLobbyModal :my-player-id="myPlayerId" />
      <WordChainResultModal :my-player-id="myPlayerId" />
    </div>

    <!-- 2-1. 정답 카드 목록 (정답 + 뜻풀이, 최신순) -->
    <div
      v-if="game.chainWords.length"
      :class="['flex shrink-0 gap-2 overflow-x-auto p-2', BRUT, 'bg-white dark:bg-[#262019]']"
    >
      <div
        v-for="w in [...game.chainWords].reverse()"
        :key="w.key"
        class="flex w-44 shrink-0 flex-col rounded-xl border-2 border-black bg-[#FFF9E1] px-3 py-2 shadow-[2px_2px_0_0_#000] dark:bg-[#1c1812]"
      >
        <p class="font-game text-lg text-[#161310] dark:text-[#f2ead6]">{{ w.word }}</p>
        <p
          class="mt-0.5 line-clamp-3 text-[11px] leading-tight font-medium text-slate-500 dark:text-[#9c9079]"
        >
          {{ w.definition }}
        </p>
        <p v-if="w.nickname" class="mt-1 text-[10px] font-bold text-slate-400">
          — {{ w.nickname }}
        </p>
      </div>
    </div>

    <!-- 3. 플레이어 목록 (가로 스크롤) -->
    <div :class="['flex shrink-0 gap-2 overflow-x-auto p-2', BRUT, 'bg-white dark:bg-[#262019]']">
      <div
        v-for="(p, i) in participants"
        :key="p.id"
        class="flex shrink-0 items-center gap-2 rounded-xl border-2 border-black px-2.5 py-1.5 shadow-[2px_2px_0_0_#000]"
        :class="
          p.isTurn
            ? 'bg-[#FFB300]/30 dark:bg-[#FFB300]/15'
            : p.isMe
              ? 'bg-[#00D8A5]/20 dark:bg-[#00D8A5]/15'
              : 'bg-slate-50 dark:bg-[#1c1812]'
        "
      >
        <div
          class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black text-sm font-black text-black"
          :style="{ backgroundColor: avatarColor(i) }"
        >
          {{ p.nickname.charAt(0) }}
        </div>
        <div class="text-xs leading-tight font-bold">
          <p class="flex items-center gap-0.5">
            <span class="max-w-20 truncate">{{ p.nickname }}</span>
            <span v-if="p.isHost">👑</span>
            <span v-if="p.isTurn">✏️</span>
          </p>
          <p class="text-[10px] text-slate-500 dark:text-[#9c9079]">
            <span v-if="game.status === 'PLAYING' && !p.isAlive" class="text-[#FF6B6B]">탈락</span>
            <span v-else>{{ p.wins }}승</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 4. 채팅 (정답 입력 겸용) — 고정 높이로 작게 -->
    <div class="flex h-44 shrink-0 flex-col sm:h-80">
      <BrutalChat
        :messages="game.chat"
        :placeholder="isMyTurn ? '단어를 입력하세요 (정답)' : '메시지 입력'"
        @send="onSend"
      />
    </div>
  </div>

  <GameLoadingScreen v-else :error="error ?? game.error" />
</template>

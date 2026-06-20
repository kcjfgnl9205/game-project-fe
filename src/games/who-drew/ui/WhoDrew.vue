<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import WhoDrewCanvas from './WhoDrewCanvas.vue'
import WhoDrewLobbyModal from './WhoDrewLobbyModal.vue'
import WhoDrewVoteModal from './WhoDrewVoteModal.vue'
import WhoDrewResultModal from './WhoDrewResultModal.vue'
import { GameLoadingScreen } from '@/shared/ui'
import {
  BRUT,
  BRUT_LG,
  avatarColor,
  BrutalChat,
  BrutalPlayerCard,
} from '@/shared/ui-brutal'
import { useGameStore, type Participant } from '@/games/who-drew/model/game.store'
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

const participants = computed<Participant[]>(() =>
  game.players.map((p) => ({
    id: p.playerId,
    nickname: p.nickname,
    isHost: p.isHost,
    isPlaying: p.isPlaying,
    isMe: p.playerId === myPlayerId.value,
    isTurn: p.playerId === game.currentTurnKey,
  })),
)

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
const seconds = computed(() => {
  if (!game.turnEndsAt) return 0
  return Math.max(0, Math.ceil((game.turnEndsAt - now.value) / 1000))
})

const statusLabel = computed(() => {
  switch (game.status) {
    case 'VOTE':
      return '투표 중…'
    case 'RESULT':
      return '결과'
    case 'LOBBY':
      return '게임 대기 중'
    default:
      return ''
  }
})

function onExit() {
  nav.backOr(() => nav.toGameRooms('who-drew'))
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
  timer = setInterval(() => (now.value = Date.now()), 250)
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
      <div :class="['p-5', BRUT, 'bg-[#FF6B6B]']">
        <button
          type="button"
          class="press mb-3 inline-flex items-center gap-1 rounded-xl border-2 border-black bg-white/80 px-3 py-1 text-xs font-black text-black shadow-[3px_3px_0_0_#000]"
          @click="onExit"
        >
          ← 나가기
        </button>
        <h1 class="font-game text-3xl leading-none text-black">그림 마피아</h1>
        <p class="mt-1 truncate text-xs font-bold text-black/70">
          {{ room.name }}<template v-if="game.rounds"> · {{ game.currentRound }}/{{ game.rounds }}R</template>
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
            {{ p.isTurn ? '그리는 중…' : p.isPlaying ? '참가' : '관전' }}
          </BrutalPlayerCard>
        </div>
      </div>
    </aside>

    <!-- ===== 중앙: 상태바 + 캔버스 ===== -->
    <main class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
      <div
        :class="['flex items-center justify-between gap-3 p-3 sm:p-4', BRUT, 'bg-white dark:bg-[#262019]']"
      >
        <div class="flex min-w-0 items-center gap-2 sm:gap-3">
          <template v-if="game.status === 'DRAWING'">
            <span
              class="shrink-0 rounded-full border-2 border-black bg-[#4F46E5] px-3 py-1 text-xs font-black text-white shadow-[3px_3px_0_0_#000]"
              >제시어</span
            >
            <h2 class="font-game truncate text-2xl tracking-widest sm:text-3xl">
              {{ game.role?.word ?? '???' }}
            </h2>
            <span
              class="shrink-0 rounded-full border-2 border-black px-2.5 py-1 text-xs font-black shadow-[3px_3px_0_0_#000]"
              :class="game.role?.isMafia ? 'bg-[#FF6B6B] text-white' : 'bg-[#00D8A5] text-black'"
            >
              {{ game.role?.isMafia ? '🕵️ 마피아' : '🙂 시민' }}
            </span>
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
        <WhoDrewCanvas :my-player-id="myPlayerId">
          <template #overlay>
            <div
              v-if="game.error"
              class="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_0_#000]"
            >
              {{ game.error }}
            </div>

            <WhoDrewLobbyModal :my-player-id="myPlayerId" />
            <WhoDrewVoteModal :my-player-id="myPlayerId" :seconds="seconds" />
            <WhoDrewResultModal :my-player-id="myPlayerId" />
          </template>
        </WhoDrewCanvas>
      </div>
    </main>

    <!-- ===== 우측: 채팅 ===== -->
    <aside class="flex shrink-0 flex-col lg:w-72 xl:w-80">
      <BrutalChat :messages="game.chat" placeholder="메시지를 입력하세요" @send="game.sendChat" />
    </aside>
  </div>

  <GameLoadingScreen v-else :error="error ?? game.error" />
</template>

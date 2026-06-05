<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import GameHeader from '@/widgets/game-header/GameHeader.vue'
import WhoDrewParticipants from './WhoDrewParticipants.vue'
import WhoDrewCanvas from './WhoDrewCanvas.vue'
import WhoDrewChat from './WhoDrewChat.vue'
import { Button } from '@/shared/ui'
import { ModalShell } from '@/shared/ui-modal'
import { useGameStore, type Participant } from '@/games/who-drew/model/game.store'
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
const myPlayerId = computed(() =>
  auth.isAuthenticated ? `user:${auth.user?.id}` : `guest:${getGuestId()}`,
)
const isHost = computed(() => game.hostKey === myPlayerId.value)

const nameOf = (key: string | null) =>
  game.players.find((p) => p.playerId === key)?.nickname ?? '알 수 없음'

// 지목된 사람(들). 동률이면 전원 표기.
const accusedText = computed(() => {
  const keys = game.result?.accusedKeys ?? []
  if (!keys.length) return '없음'
  const names = keys.map(nameOf).join(', ')
  return keys.length > 1 ? `${names} (동률)` : names
})

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

// 남은 시간(초)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
const seconds = computed(() => {
  if (!game.turnEndsAt) return 0
  return Math.max(0, Math.ceil((game.turnEndsAt - now.value) / 1000))
})

// 투표 후보 (나 제외)
const voteCandidates = computed(() => game.candidates.filter((c) => c.key !== myPlayerId.value))

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

onMounted(async () => {
  if (!roomId.value) return
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
  <div v-if="room" class="flex h-dvh flex-col">
    <GameHeader
      game-id="who-drew"
      game-name="누가 그렸지"
      :room-name="room.name"
      :current-players="game.players.length"
      :max-players="room.maxPlayers"
    />

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <WhoDrewParticipants :participants="participants" />

      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <WhoDrewCanvas :my-player-id="myPlayerId">
          <template #overlay>
            <!-- 단어/차례 배너 (진행 중) -->
            <div
              v-if="game.status === 'DRAWING'"
              class="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-1 px-3"
            >
              <div
                class="rounded-xl border border-border bg-bg-card/95 px-4 py-2 text-sm font-semibold shadow-sm"
              >
                <span class="text-text-secondary">제시어</span>
                <span class="ml-2 text-brand">{{ game.role?.word ?? '???' }}</span>
                <span v-if="game.role?.isMafia" class="ml-2 text-warning">🕵️ 당신은 마피아</span>
              </div>
              <div class="rounded-lg bg-bg-card/90 px-3 py-1 text-xs text-text-secondary shadow-sm">
                {{ nameOf(game.currentTurnKey) }} 차례 · {{ game.currentRound }}/{{
                  game.rounds
                }}라운드 · {{ seconds }}초
              </div>
            </div>

            <!-- 에러 -->
            <div
              v-if="game.error"
              class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3"
            >
              <div
                class="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
              >
                {{ game.error }}
              </div>
            </div>

            <!-- 로비(대기) -->
            <ModalShell contained :open="game.status === 'LOBBY'">
              <h3 class="text-center text-lg font-bold text-text-primary">게임 대기 중</h3>
              <p class="mt-2 text-center text-sm text-text-secondary">
                {{ game.players.length }}명 참가 중 · 최소 4명 필요
              </p>
              <div class="mt-5">
                <Button
                  v-if="isHost"
                  variant="primary"
                  size="lg"
                  class="w-full"
                  :disabled="game.players.length < 4"
                  @click="game.startGame()"
                >
                  게임 시작
                </Button>
                <p v-else class="text-center text-sm text-text-muted">
                  방장이 시작하기를 기다리는 중…
                </p>
              </div>
            </ModalShell>

            <!-- 투표 -->
            <ModalShell contained :open="game.status === 'VOTE'">
              <h3 class="text-center text-lg font-bold text-text-primary">마피아를 지목하세요</h3>
              <p class="mt-1 text-center text-xs text-text-muted">
                {{ game.voteInfo.voted }}/{{ game.voteInfo.total }} 투표 · {{ seconds }}초
              </p>
              <div class="mt-4 flex flex-col gap-2">
                <Button
                  v-for="c in voteCandidates"
                  :key="c.key"
                  :variant="game.myVote === c.key ? 'primary' : 'outline'"
                  size="lg"
                  :disabled="!!game.myVote"
                  @click="game.vote(c.key)"
                >
                  {{ c.nickname }}
                </Button>
              </div>
              <p v-if="game.myVote" class="mt-3 text-center text-sm text-brand">
                {{ nameOf(game.myVote) }}님에게 투표 완료
              </p>
            </ModalShell>

            <!-- 결과 -->
            <ModalShell contained :open="game.status === 'RESULT' && !!game.result">
              <h3
                class="text-center text-xl font-bold"
                :class="game.result?.winner === 'CIVILIAN' ? 'text-brand' : 'text-warning'"
              >
                {{ game.result?.winner === 'CIVILIAN' ? '시민 승리 🎉' : '마피아 승리 🕵️' }}
              </h3>
              <div class="mt-4 space-y-1.5 text-sm text-text-secondary">
                <p>
                  마피아:
                  <b class="text-text-primary">{{ nameOf(game.result?.mafiaKey ?? null) }}</b>
                </p>
                <p>
                  지목된 사람:
                  <b class="text-text-primary">{{ accusedText }}</b>
                </p>
                <p>
                  시민 단어: <b class="text-text-primary">{{ game.result?.civilianWord }}</b>
                </p>
                <p>
                  마피아 단어: <b class="text-text-primary">{{ game.result?.mafiaWord }}</b>
                </p>
              </div>
              <div class="mt-5">
                <Button
                  v-if="isHost"
                  variant="primary"
                  size="lg"
                  class="w-full"
                  :disabled="game.players.length < 4"
                  @click="game.startGame()"
                >
                  다시 시작
                </Button>
                <p v-else class="text-center text-sm text-text-muted">
                  방장이 다시 시작하기를 기다리는 중…
                </p>
              </div>
            </ModalShell>
          </template>
        </WhoDrewCanvas>
      </div>

      <WhoDrewChat />
    </div>
  </div>

  <div v-else class="flex h-dvh items-center justify-center text-sm text-text-muted">
    {{ error ?? '불러오는 중…' }}
  </div>
</template>

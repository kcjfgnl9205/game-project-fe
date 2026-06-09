<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import GameHeader from '@/widgets/game-header/GameHeader.vue'
import { ParticipantList, ParticipantCard } from '@/shared/ui-participants'
import WhoDrewCanvas from './WhoDrewCanvas.vue'
import WhoDrewLobbyModal from './WhoDrewLobbyModal.vue'
import WhoDrewVoteModal from './WhoDrewVoteModal.vue'
import WhoDrewResultModal from './WhoDrewResultModal.vue'
import { CanvasNotice, CanvasChip } from '@/shared/ui-canvas'
import { ChatPanel } from '@/shared/ui-chat'
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
      game-name="그림 마피아"
      :room-name="room.name"
      :current-players="game.players.length"
      :max-players="room.maxPlayers"
    />

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <ParticipantList>
        <ParticipantCard
          v-for="p in participants"
          :key="p.id"
          :nickname="p.nickname"
          :is-host="p.isHost"
          :is-me="p.isMe"
          :active="p.isTurn"
        >
          {{ p.isTurn ? '그리는 중…' : p.isPlaying ? '참가' : '관전' }}
        </ParticipantCard>
      </ParticipantList>

      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <WhoDrewCanvas :my-player-id="myPlayerId">
          <template #overlay>
            <!-- 제시어/역할(좌) · 시간/라운드(우) 배너 (진행 중) -->
            <div
              v-if="game.status === 'DRAWING'"
              class="pointer-events-none absolute inset-x-0 top-3 flex justify-between px-3"
            >
              <div class="flex items-center gap-1">
                <CanvasChip>
                  <span class="text-text-secondary">제시어</span>
                  <span class="ml-1.5 truncate tracking-widest text-brand">
                    {{ game.role?.word ?? '???' }}
                  </span>
                </CanvasChip>
                <CanvasChip>
                  <span :class="game.role?.isMafia ? 'text-warning' : 'text-text-secondary'">
                    {{ game.role?.isMafia ? '🕵️ 마피아' : '🙂 시민' }}
                  </span>
                </CanvasChip>
              </div>

              <div class="flex items-center gap-1">
                <CanvasChip>
                  <span class="ml-2 text-text-secondary">
                    {{ game.currentRound }}/{{ game.rounds }}라운드
                  </span>
                </CanvasChip>
                <CanvasChip>
                  <span
                    v-if="game.turnEndsAt"
                    class="inline-flex shrink-0 items-center gap-1 text-text-primary"
                  >
                    <i-local-timer aria-hidden="true" class="w-4 h-4" />
                    <span class="tabular-nums">{{ seconds }}초</span>
                  </span>
                </CanvasChip>
              </div>
            </div>

            <!-- 에러 -->
            <CanvasNotice :error="game.error" />

            <!-- 로비 / 투표 / 결과 모달 -->
            <WhoDrewLobbyModal :my-player-id="myPlayerId" />
            <WhoDrewVoteModal :my-player-id="myPlayerId" :seconds="seconds" />
            <WhoDrewResultModal :my-player-id="myPlayerId" />
          </template>
        </WhoDrewCanvas>
      </div>

      <ChatPanel
        :messages="game.chat"
        :my-player-id="myPlayerId"
        placeholder="메시지를 입력하세요..."
        @send="game.sendChat"
      />
    </div>
  </div>

  <div v-else class="flex h-dvh items-center justify-center text-sm text-text-muted">
    {{ error ?? '불러오는 중…' }}
  </div>
</template>

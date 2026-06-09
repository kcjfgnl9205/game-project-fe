<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import GameHeader from '@/widgets/game-header/GameHeader.vue'
import { ParticipantList, ParticipantCard } from '@/shared/ui-participants'
import SketchPickCanvas from './SketchPickCanvas.vue'
import SketchPickLobbyModal from './SketchPickLobbyModal.vue'
import SketchPickWordSelectModal from './SketchPickWordSelectModal.vue'
import { CanvasNotice, CanvasToolbar, CanvasChip } from '@/shared/ui-canvas'
import { ChatPanel } from '@/shared/ui-chat'
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

const promptText = computed(() =>
  isMyTurn.value ? (game.word ?? '') : '○'.repeat(game.wordLength),
)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
const seconds = computed(() => {
  if (!game.turnEndsAt) return 0
  return Math.max(0, Math.ceil((game.turnEndsAt - now.value) / 1000))
})

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

  timer = setInterval(() => (now.value = Date.now()), 1000)
  window.addEventListener('beforeunload', handlePageUnload)
  window.addEventListener('pagehide', handlePageUnload)
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
  <div class="flex h-dvh flex-col" v-if="room">
    <!-- 헤더 -->
    <GameHeader
      game-id="sketch-pick"
      game-name="그림 맞추기"
      :room-name="room.name"
      :current-players="participants.length"
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
          :active="p.isDrawing"
          :score-pop="game.scorePops[p.id] ?? null"
        >
          {{ p.score }}점
        </ParticipantCard>
      </ParticipantList>

      <!-- 그림 영역 -->
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <SketchPickCanvas :my-player-id="myPlayerId">
          <template #overlay="t">
            <!-- 제시어 + 시간: 캔버스 상단 오버레이 -->
            <div
              v-if="game.status === 'DRAWING' || game.status === 'WORD_SELECT'"
              class="pointer-events-none absolute inset-x-0 top-3 flex justify-between px-3"
            >
              <CanvasChip>
                <template v-if="game.status === 'DRAWING'">
                  <span class="flex min-w-0 items-center">
                    <span class="text-text-secondary">제시어</span>
                    <span class="ml-1.5 truncate tracking-widest text-brand">
                      {{ promptText }}
                    </span>
                  </span>
                </template>
                <template v-else>
                  <span class="text-text-secondary">단어 선택 중…</span>
                </template>
              </CanvasChip>

              <CanvasChip v-if="game.turnEndsAt">
                <span class="inline-flex shrink-0 items-center gap-1 text-text-primary">
                  <i-local-timer aria-hidden="true" class="w-4 h-4" />
                  <span class="tabular-nums">{{ seconds }}초</span>
                </span>
              </CanvasChip>
            </div>

            <!-- 안내(에러/공지): 캔버스 하단 가운데 (상단은 제시어 바가 사용) -->
            <CanvasNotice :error="game.error" :info="game.announcement" />

            <!-- 게임 대기(로비): 방장이 시작을 눌러야 시작 -->
            <SketchPickLobbyModal :my-player-id="myPlayerId" />
            <!-- 단어 선택 모달: 출제자에게만, 캔버스 가운데 -->
            <SketchPickWordSelectModal :my-player-id="myPlayerId" />

            <!-- 툴바: 캔버스 하단 오버레이 (출제자만). 상태/액션은 캔버스가 scoped slot으로 노출 -->
            <CanvasToolbar v-bind="t" />
          </template>
        </SketchPickCanvas>
      </div>
      <ChatPanel
        :messages="game.chat"
        :my-player-id="myPlayerId"
        placeholder="정답을 입력하세요..."
        @send="game.sendChat"
      />
    </div>
  </div>
</template>

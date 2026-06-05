<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import GameHeader from '@/widgets/game-header/GameHeader.vue'
import SketchPickParticipants from './SketchPickParticipants.vue'
import SketchPickCanvas from './SketchPickCanvas.vue'
import SketchPickChat from './SketchPickChat.vue'
import { Button } from '@/shared/ui'
import { ModalShell } from '@/shared/ui-modal'
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
})

// 화면 이탈 / 라우트 이동 시 명시적 REST leave + 소켓 disconnect.
onBeforeRouteLeave(async () => {
  await leaveCurrentRoom()
})

onUnmounted(() => {
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
      game-name="스케치픽"
      :room-name="room.name"
      :current-players="participants.length"
      :max-players="room.maxPlayers"
    />

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <SketchPickParticipants :participants="participants" />

      <!-- 그림 영역 -->
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <SketchPickCanvas :my-player-id="myPlayerId">
          <template #overlay>
            <!-- 안내(에러/공지): 캔버스 상단 가운데 -->
            <div
              v-if="game.error || game.announcement"
              class="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3"
            >
              <div
                class="rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm"
                :class="
                  game.error
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-brand bg-brand-soft text-brand'
                "
              >
                {{ game.error || game.announcement }}
              </div>
            </div>

            <!-- 단어 선택 모달: 출제자에게만, 캔버스 가운데 -->
            <ModalShell
              contained
              :open="game.status === 'WORD_SELECT' && isMyTurn && game.wordChoices.length > 0"
            >
              <h3 class="mb-1 text-center text-lg font-bold text-text-primary">
                그릴 단어를 선택하세요
              </h3>
              <p class="mb-4 text-center text-xs text-text-muted">선택하면 바로 시작됩니다</p>
              <div class="flex flex-col gap-2">
                <Button
                  v-for="w in game.wordChoices"
                  :key="w"
                  variant="outline"
                  size="lg"
                  @click="game.pickWord(w)"
                >
                  {{ w }}
                </Button>
              </div>
            </ModalShell>
          </template>
        </SketchPickCanvas>
      </div>
      <SketchPickChat />
    </div>
  </div>
</template>

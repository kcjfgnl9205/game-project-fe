<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import SketchPickHeader from './SketchPickHeader.vue'
import SketchPickParticipants from './SketchPickParticipants.vue'
import SketchPickCanvas from './SketchPickCanvas.vue'
import SketchPickChat from './SketchPickChat.vue'
import { PROMPT, type Participant } from '@/games/sketch-pick/model/mock'
import { useGameStore } from '@/games/sketch-pick/model/game.store'
import { fetchRoom } from '@/entities/room/api'
import type { Room } from '@/entities/room/model'
import { ApiError } from '@/shared/api'
import { useAuthStore } from '@/shared/stores'
import { getGuestId, getGuestNickname } from '@/shared/lib/guest'

const route = useRoute()
const auth = useAuthStore()
const game = useGameStore()

const room = ref<Room | null>(null)
const error = ref<string | null>(null)

const roomId = computed(() =>
  typeof route.params.roomId === 'string' ? route.params.roomId : null,
)

// 본인 식별 키. 회원은 user:<id>, 게스트는 guest:<id> (lobby:state의 playerId와 동일 규칙).
const myPlayerId = computed(() =>
  auth.isAuthenticated ? `user:${auth.user?.id}` : `guest:${getGuestId()}`,
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

const seconds = ref(56)
let timer: ReturnType<typeof setInterval> | null = null

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

  timer = setInterval(() => {
    if (seconds.value > 0) seconds.value -= 1
    else if (timer) clearInterval(timer)
  }, 1000)
})

// 화면 이탈/탭 닫기 → 소켓 종료. 서버가 자동으로 방에서 빼준다(REST leave 불필요).
onBeforeRouteLeave(() => {
  game.disconnect()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  game.disconnect()
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
      <SketchPickCanvas :prompt="PROMPT" />
      <SketchPickChat />
    </div>
  </div>
</template>

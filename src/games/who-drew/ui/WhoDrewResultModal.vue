<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/shared/ui'
import { ModalShell } from '@/shared/ui-modal'
import { useGameStore } from '@/games/who-drew/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

const isHost = computed(() => game.hostKey === props.myPlayerId)
const nameOf = (key: string | null) =>
  game.players.find((p) => p.playerId === key)?.nickname ?? '알 수 없음'

// 지목된 사람(들). 동률이면 전원 표기.
const accusedText = computed(() => {
  const keys = game.result?.accusedKeys ?? []
  if (!keys.length) return '없음'
  const names = keys.map(nameOf).join(', ')
  return keys.length > 1 ? `${names} (동률)` : names
})
</script>

<template>
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
      <p>시민 단어: <b class="text-text-primary">{{ game.result?.civilianWord }}</b></p>
      <p>마피아 단어: <b class="text-text-primary">{{ game.result?.mafiaWord }}</b></p>
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
      <p v-else class="text-center text-sm text-text-muted">방장이 다시 시작하기를 기다리는 중…</p>
    </div>
  </ModalShell>
</template>

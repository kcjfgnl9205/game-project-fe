<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/shared/ui'
import { ModalShell } from '@/shared/ui-modal'
import { useGameStore } from '@/games/sketch-pick/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

const isHost = computed(() => game.hostKey === props.myPlayerId)
const count = computed(() => game.players.length)
</script>

<template>
  <ModalShell contained :open="game.status === 'LOBBY'">
    <h3 class="text-center text-lg font-bold text-text-primary">게임 대기 중</h3>
    <p class="mt-2 text-center text-sm text-text-secondary">{{ count }}명 참가 중 · 최소 2명 필요</p>
    <div class="mt-5">
      <Button
        v-if="isHost"
        variant="primary"
        size="lg"
        class="w-full"
        :disabled="count < 2"
        @click="game.startGame()"
      >
        게임 시작
      </Button>
      <p v-else class="text-center text-sm text-text-muted">방장이 시작하기를 기다리는 중…</p>
    </div>
  </ModalShell>
</template>

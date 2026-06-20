<script setup lang="ts">
import { computed } from 'vue'
import { BrutalModalShell, BrutalButton } from '@/shared/ui-brutal'
import { useGameStore } from '@/games/who-drew/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

const isHost = computed(() => game.hostKey === props.myPlayerId)
const count = computed(() => game.players.length)
</script>

<template>
  <BrutalModalShell contained :open="game.status === 'LOBBY'">
    <h3 class="font-game text-center text-2xl">게임 대기 중</h3>
    <p class="mt-2 text-center text-sm font-bold text-slate-500 dark:text-[#9c9079]">
      {{ count }}명 참가 중 · 최소 4명 필요
    </p>
    <div class="mt-5">
      <BrutalButton v-if="isHost" :disabled="count < 4" @click="game.startGame()">
        게임 시작
      </BrutalButton>
      <p v-else class="text-center text-sm font-bold text-slate-400">
        방장이 시작하기를 기다리는 중…
      </p>
    </div>
  </BrutalModalShell>
</template>

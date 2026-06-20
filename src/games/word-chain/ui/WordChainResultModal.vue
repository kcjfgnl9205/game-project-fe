<script setup lang="ts">
import { computed } from 'vue'
import { BrutalModalShell, BrutalButton } from '@/shared/ui-brutal'
import { useGameStore } from '@/games/word-chain/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

const isHost = computed(() => game.hostKey === props.myPlayerId)
const nameOf = (key: string) =>
  game.players.find((p) => p.playerId === key)?.nickname ?? '알 수 없음'

// 라운드제: 승수 랭킹. 토너먼트: 우승자만 의미 있음.
const ranking = computed(() =>
  [...(game.result?.wins ?? [])]
    .sort((a, b) => b.wins - a.wins)
    .map((r) => ({ nickname: nameOf(r.playerId), wins: r.wins })),
)
</script>

<template>
  <BrutalModalShell contained :open="!!game.result">
    <h3 class="font-game text-center text-3xl text-[#00D8A5]">
      🏆 {{ game.result?.winnerName ?? '무승부' }}
    </h3>
    <p class="mt-1 text-center text-sm font-bold text-slate-400">
      {{ game.mode === 'TOURNAMENT' ? '최종 우승' : '최다 승 우승' }}
    </p>

    <div v-if="game.mode === 'ROUND' && ranking.length" class="mt-4 space-y-1.5">
      <div
        v-for="(r, i) in ranking"
        :key="i"
        class="flex items-center justify-between rounded-xl border-2 border-black bg-slate-50 px-3 py-2 text-sm font-bold shadow-[2px_2px_0_0_#000] dark:bg-[#1c1812]"
      >
        <span>{{ i + 1 }}. {{ r.nickname }}</span>
        <span class="text-[#00D8A5]">{{ r.wins }}승</span>
      </div>
    </div>

    <div class="mt-5">
      <BrutalButton v-if="isHost" :disabled="game.players.length < 2" @click="game.startGame()">
        다시 시작
      </BrutalButton>
      <p v-else class="text-center text-sm font-bold text-slate-400">
        방장이 다시 시작하기를 기다리는 중…
      </p>
    </div>
  </BrutalModalShell>
</template>

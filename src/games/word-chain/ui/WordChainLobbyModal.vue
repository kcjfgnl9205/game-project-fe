<script setup lang="ts">
import { computed } from 'vue'
import { BrutalModalShell, BrutalButton } from '@/shared/ui-brutal'
import { useGameStore } from '@/games/word-chain/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

const isHost = computed(() => game.hostKey === props.myPlayerId)
const count = computed(() => game.players.length)
// 초기 로비에서만 (라운드 사이 잠깐 LOBBY가 되는 경우는 제외)
const open = computed(() => game.status === 'LOBBY' && game.round === 0)
</script>

<template>
  <BrutalModalShell contained :open="open">
    <h3 class="font-game text-center text-2xl">게임 대기 중</h3>
    <p class="mt-2 text-center text-sm font-bold text-slate-500 dark:text-[#9c9079]">
      {{ count }}명 참가 중 · 최소 2명 필요
    </p>
    <p class="mt-1 text-center text-xs font-bold text-slate-400">
      {{
        game.mode === 'TOURNAMENT'
          ? '토너먼트 · 최종 1인 우승'
          : `라운드제 · ${game.roundCount}라운드 최다 승`
      }}
      · 두음법칙 적용<template v-if="game.allowKillerWord"> · 한방단어 허용</template>
    </p>
    <div class="mt-5">
      <BrutalButton v-if="isHost" :disabled="count < 2" @click="game.startGame()">
        게임 시작
      </BrutalButton>
      <p v-else class="text-center text-sm font-bold text-slate-400">
        방장이 시작하기를 기다리는 중…
      </p>
    </div>
  </BrutalModalShell>
</template>

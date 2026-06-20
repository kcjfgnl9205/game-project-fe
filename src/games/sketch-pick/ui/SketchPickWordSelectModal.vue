<script setup lang="ts">
import { computed } from 'vue'
import { BrutalModalShell, BrutalButton } from '@/shared/ui-brutal'
import { useGameStore } from '@/games/sketch-pick/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

const isMyTurn = computed(
  () => !!game.currentDrawerKey && game.currentDrawerKey === props.myPlayerId,
)
const open = computed(
  () => game.status === 'WORD_SELECT' && isMyTurn.value && game.wordChoices.length > 0,
)
</script>

<template>
  <BrutalModalShell contained :open="open">
    <h3 class="font-game mb-1 text-center text-2xl">그릴 단어를 선택하세요</h3>
    <p class="mb-4 text-center text-xs font-bold text-slate-400">선택하면 바로 시작됩니다</p>
    <div class="flex flex-col gap-2">
      <BrutalButton v-for="w in game.wordChoices" :key="w" variant="outline" @click="game.pickWord(w)">
        {{ w }}
      </BrutalButton>
    </div>
  </BrutalModalShell>
</template>

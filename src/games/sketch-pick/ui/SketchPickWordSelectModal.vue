<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/shared/ui'
import { ModalShell } from '@/shared/ui-modal'
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
  <ModalShell contained :open="open">
    <h3 class="mb-1 text-center text-lg font-bold text-text-primary">그릴 단어를 선택하세요</h3>
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

<script setup lang="ts">
import { computed } from 'vue'
import { BrutalModalShell, BrutalButton } from '@/shared/ui-brutal'
import { useGameStore } from '@/games/who-drew/model/game.store'

const props = defineProps<{ myPlayerId: string; seconds: number }>()
const game = useGameStore()

// 투표 후보 (나 제외)
const voteCandidates = computed(() => game.candidates.filter((c) => c.key !== props.myPlayerId))
const nameOf = (key: string | null) =>
  game.players.find((p) => p.playerId === key)?.nickname ?? '알 수 없음'
</script>

<template>
  <BrutalModalShell contained :open="game.status === 'VOTE'">
    <h3 class="font-game text-center text-2xl">마피아를 지목하세요</h3>
    <p class="mt-1 text-center text-xs font-bold text-slate-400">
      {{ game.voteInfo.voted }}/{{ game.voteInfo.total }} 투표 · {{ seconds }}초
    </p>
    <div class="mt-4 flex flex-col gap-2">
      <BrutalButton
        v-for="c in voteCandidates"
        :key="c.key"
        :variant="game.myVote === c.key ? 'primary' : 'outline'"
        :disabled="!!game.myVote"
        @click="game.vote(c.key)"
      >
        {{ c.nickname }}
      </BrutalButton>
    </div>
    <p v-if="game.myVote" class="mt-3 text-center text-sm font-bold text-[#00D8A5]">
      {{ nameOf(game.myVote) }}님에게 투표 완료
    </p>
  </BrutalModalShell>
</template>

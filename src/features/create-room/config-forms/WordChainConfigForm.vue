<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { RoomConfig, WordChainMode } from '@/entities/room/model'

const model = defineModel<RoomConfig>({ required: true })

const MODE_OPTIONS: { value: WordChainMode; label: string; desc: string }[] = [
  { value: 'ROUND', label: '라운드제', desc: '정해진 라운드 동안 최다 승' },
  { value: 'TOURNAMENT', label: '토너먼트', desc: '매 라운드 탈락 → 최종 1인' },
]
const ROUND_OPTIONS = [3, 5, 7]
const TURN_TIME_OPTIONS = [10, 15, 20, 30]

const state = reactive<{
  mode: WordChainMode
  roundCount: number
  turnTimeSec: number
  allowKillerWord: boolean
}>({
  mode: 'ROUND',
  roundCount: 3,
  turnTimeSec: 15,
  allowKillerWord: false,
})

// 토너먼트면 roundCount는 인원에서 파생되므로 보내지 않는다.
watch(
  state,
  () => {
    model.value = {
      mode: state.mode,
      turnTimeSec: state.turnTimeSec,
      allowKillerWord: state.allowKillerWord,
      ...(state.mode === 'ROUND' ? { roundCount: state.roundCount } : {}),
    }
  },
  { immediate: true, deep: true },
)

const selectClass =
  'mt-3 h-12 w-full rounded-xl border border-border bg-bg-elevated px-4 text-sm text-text-primary focus:border-brand focus:outline-none'
</script>

<template>
  <div class="space-y-4">
    <!-- 게임 방식 -->
    <div>
      <span class="block text-sm font-semibold text-text-primary">게임 방식</span>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <button
          v-for="m in MODE_OPTIONS"
          :key="m.value"
          type="button"
          class="rounded-xl border p-3 text-left transition-colors"
          :class="
            state.mode === m.value
              ? 'border-brand bg-brand-soft'
              : 'border-border bg-bg-elevated hover:bg-bg-card-hover'
          "
          @click="state.mode = m.value"
        >
          <span class="block text-sm font-bold text-text-primary">{{ m.label }}</span>
          <span class="mt-0.5 block text-xs text-text-secondary">{{ m.desc }}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- 라운드 수 (라운드제일 때만) -->
      <div v-if="state.mode === 'ROUND'">
        <label for="wc-rounds" class="block text-sm font-semibold text-text-primary">
          라운드 수
        </label>
        <select id="wc-rounds" v-model.number="state.roundCount" :class="selectClass">
          <option v-for="r in ROUND_OPTIONS" :key="r" :value="r">{{ r }}라운드</option>
        </select>
      </div>

      <!-- 입력 시간 -->
      <div>
        <label for="wc-turn" class="block text-sm font-semibold text-text-primary">
          단어 입력 시간
        </label>
        <select id="wc-turn" v-model.number="state.turnTimeSec" :class="selectClass">
          <option v-for="s in TURN_TIME_OPTIONS" :key="s" :value="s">{{ s }}초</option>
        </select>
      </div>
    </div>

    <!-- 한방단어 토글 -->
    <label
      class="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-bg-elevated px-4 py-3"
    >
      <span>
        <span class="block text-sm font-semibold text-text-primary">한방단어 허용</span>
        <span class="block text-xs text-text-secondary">
          이어갈 수 없는 단어(예: 끝 글자로 시작하는 단어가 없는 단어) 사용 허용
        </span>
      </span>
      <input v-model="state.allowKillerWord" type="checkbox" class="h-5 w-5 accent-brand" />
    </label>

    <p class="text-xs text-text-muted">※ 두음법칙은 항상 적용됩니다 (예: 학교 → 교실 / 력 → 역).</p>
  </div>
</template>

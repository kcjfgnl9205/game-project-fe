<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { RoomConfig } from '@/entities/room/model'

const model = defineModel<RoomConfig>({ required: true })

const ROUND_OPTIONS = [4, 5, 6, 7, 8]
const TURN_TIME_OPTIONS = [15, 20, 30]
const state = reactive({ rounds: 4, turnTimeSec: 20 })
watch(state, () => (model.value = { ...state }), { immediate: true, deep: true })

const selectClass =
  'mt-3 h-12 w-full rounded-xl border border-border bg-bg-elevated px-4 text-sm text-text-primary focus:border-brand focus:outline-none'
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label for="cfg-rounds" class="block text-sm font-semibold text-text-primary">
        라운드 수
      </label>
      <select id="cfg-rounds" v-model.number="state.rounds" :class="selectClass">
        <option v-for="r in ROUND_OPTIONS" :key="r" :value="r">{{ r }}바퀴</option>
      </select>
    </div>
    <div>
      <label for="cfg-turn" class="block text-sm font-semibold text-text-primary">
        한 획 시간
      </label>
      <select id="cfg-turn" v-model.number="state.turnTimeSec" :class="selectClass">
        <option v-for="s in TURN_TIME_OPTIONS" :key="s" :value="s">{{ s }}초</option>
      </select>
    </div>
  </div>
</template>

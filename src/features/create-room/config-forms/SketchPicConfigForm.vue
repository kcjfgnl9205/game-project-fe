<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { RoomConfig } from '@/entities/room/model'

// 부모(모달)에 config를 흘려보낸다. 자기 필드/기본값은 이 컴포넌트가 소유.
const model = defineModel<RoomConfig>({ required: true })

const DRAW_TIME_OPTIONS = [30, 60, 90, 120, 180]
const state = reactive({ drawTimeSec: 60 })
watch(state, () => (model.value = { ...state }), { immediate: true, deep: true })

const selectClass =
  'mt-3 h-12 w-full rounded-xl border border-border bg-bg-elevated px-4 text-sm text-text-primary focus:border-brand focus:outline-none'
</script>

<template>
  <div>
    <label for="cfg-draw-time" class="block text-sm font-semibold text-text-primary">
      그리기 시간
    </label>
    <select id="cfg-draw-time" v-model.number="state.drawTimeSec" :class="selectClass">
      <option v-for="s in DRAW_TIME_OPTIONS" :key="s" :value="s">{{ s }}초</option>
    </select>
  </div>
</template>

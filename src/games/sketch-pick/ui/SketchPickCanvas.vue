<script setup lang="ts">
import { ref } from 'vue'

const palette = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
]

const selectedColor = ref<string>(palette[0] ?? '#000000')
const brushSize = ref(5)

const decreaseSize = () => {
  brushSize.value = Math.max(1, brushSize.value - 1)
}

const increaseSize = () => {
  brushSize.value = Math.min(30, brushSize.value + 1)
}
</script>

<template>
  <section class="flex flex-1 flex-col bg-bg">
    <!-- 캔버스 -->
    <div class="flex flex-1 items-center justify-center overflow-auto p-6">
      <div
        class="aspect-[4/3] h-full max-h-full w-full max-w-full rounded-lg bg-white shadow-inner"
        aria-label="그림 영역"
      />
    </div>

    <!-- 툴바 -->
    <div class="flex h-14 shrink-0 items-center gap-4 border-t border-border bg-bg-card px-4">
      <button
        type="button"
        aria-label="팔레트"
        class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
      >
        <span aria-hidden="true">🎨</span>
      </button>

      <div class="flex items-center gap-1.5">
        <button
          v-for="color in palette"
          :key="color"
          type="button"
          :aria-label="`색상 ${color}`"
          class="h-6 w-6 cursor-pointer rounded-full border transition-transform hover:scale-110"
          :class="selectedColor === color ? 'border-brand ring-2 ring-brand/40' : 'border-border'"
          :style="{ backgroundColor: color }"
          @click="selectedColor = color"
        />
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <button
          type="button"
          aria-label="브러쉬 크기 감소"
          class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
          @click="decreaseSize"
        >
          −
        </button>
        <span class="w-6 text-center text-sm font-semibold text-text-primary">
          {{ brushSize }}
        </span>
        <button
          type="button"
          aria-label="브러쉬 크기 증가"
          class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
          @click="increaseSize"
        >
          +
        </button>
      </div>

      <button
        type="button"
        class="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary cursor-pointer"
      >
        <span aria-hidden="true">🧽</span>
        지우개
      </button>
      <button
        type="button"
        class="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary cursor-pointer"
      >
        <span aria-hidden="true">↻</span>
        전체 지우기
      </button>
    </div>
  </section>
</template>

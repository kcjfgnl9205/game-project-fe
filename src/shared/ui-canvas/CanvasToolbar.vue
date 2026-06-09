<script setup lang="ts">
// 캔버스 하단 그리기 툴바(팔레트/굵기/지우개/전체지우기).
// 상태/액션은 부모(캔버스)가 prop으로 내려준다. canDraw일 때만 표시.
// DrawingSurface의 overlay scoped slot 값을 그대로 v-bind 하면 된다.
defineProps<{
  canDraw?: boolean
  palette: string[]
  selectedColor: string
  brushSize: number
  isEraser?: boolean
  setColor: (color: string) => void
  decreaseSize: () => void
  increaseSize: () => void
  useEraser: () => void
  clear: () => void
}>()
</script>

<template>
  <div v-if="canDraw" class="absolute inset-x-0 bottom-0 flex justify-center p-3">
    <div
      class="flex max-w-full items-center gap-4 overflow-x-auto rounded-xl border border-border bg-bg-card/95 px-4 py-2 shadow-sm backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="팔레트"
        class="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
      >
        <span aria-hidden="true">🎨</span>
      </button>

      <div class="flex shrink-0 items-center gap-1.5">
        <button
          v-for="color in palette"
          :key="color"
          type="button"
          :aria-label="`색상 ${color}`"
          class="h-6 w-6 shrink-0 cursor-pointer rounded-full border transition-transform hover:scale-110"
          :class="
            selectedColor === color ? 'border-brand ring-2 ring-brand/40' : 'border-border'
          "
          :style="{ backgroundColor: color }"
          @click="setColor(color)"
        />
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="브러쉬 크기 감소"
          class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
          @click="decreaseSize()"
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
          @click="increaseSize()"
        >
          +
        </button>
      </div>

      <button
        type="button"
        class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors cursor-pointer"
        :class="
          isEraser
            ? 'border-brand bg-brand-soft text-brand'
            : 'border-border text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
        "
        @click="useEraser()"
      >
        <span aria-hidden="true">🧽</span>
        지우개
      </button>
      <button
        type="button"
        class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary cursor-pointer"
        @click="clear()"
      >
        <span aria-hidden="true">↻</span>
        전체 지우기
      </button>
    </div>
  </div>
</template>

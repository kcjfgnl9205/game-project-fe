<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDrawingSurface } from './useDrawingSurface'
import type { Segment } from './types'

const props = withDefaults(
  defineProps<{
    canDraw?: boolean // 포인터로 그릴 수 있는지 (게임 규칙은 부모가 판단)
    cursorSizePx?: number // 브러시 미리보기 커서 지름(표시 px)
    cursorColor?: string
    cursorBg?: string
    defaultColor?: string // color 없는 세그먼트가 쓸 기본 색
    defaultStrokeWidth?: number // size 없는 세그먼트가 쓸 기본 두께(CANVAS_RES 기준)
    wrapClass?: string // 바깥 래퍼 추가 클래스(패딩/배경 등)
  }>(),
  {
    canDraw: false,
    cursorSizePx: 0,
    cursorColor: '#1f2937',
    cursorBg: 'transparent',
    wrapClass: 'p-4',
  },
)

const emit = defineEmits<{
  start: [] // 한 획 시작 (pointerdown)
  segment: [Segment] // 직전 좌표→현재 좌표 선분 (그리는 중 매 move)
  end: [] // 한 획 끝 (pointerup/leave)
  resize: [number] // 정사각 한 변(px) 변경
}>()

const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const { side, drawSegment, drawStroke, clear, toCanvas, CANVAS_RES } = useDrawingSurface(
  wrapRef,
  canvasRef,
  { defaultColor: props.defaultColor, defaultStrokeWidth: props.defaultStrokeWidth },
)
watch(side, (v) => emit('resize', v), { immediate: true })

// ===== 포인터 → 세그먼트 (그리기/전송 정책은 부모가 결정) =====
let drawing = false
let lastX = 0
let lastY = 0

const cursorX = ref(0)
const cursorY = ref(0)
const showCursor = ref(false)

function pointerDown(e: PointerEvent) {
  if (!props.canDraw) return
  drawing = true
  const p = toCanvas(e)
  lastX = p.x
  lastY = p.y
  canvasRef.value?.setPointerCapture(e.pointerId)
  emit('start')
}
function pointerMove(e: PointerEvent) {
  // 브러시 미리보기 커서 위치(그림 영역 기준 px)
  const r = canvasRef.value?.getBoundingClientRect()
  if (r) {
    cursorX.value = e.clientX - r.left
    cursorY.value = e.clientY - r.top
  }
  if (!drawing || !props.canDraw) return
  const p = toCanvas(e)
  emit('segment', {
    x0: Math.round(lastX),
    y0: Math.round(lastY),
    x1: Math.round(p.x),
    y1: Math.round(p.y),
  })
  lastX = p.x
  lastY = p.y
}
function pointerUp() {
  if (!drawing) return
  drawing = false
  emit('end')
}
function pointerEnter() {
  showCursor.value = true
}
function pointerLeave() {
  showCursor.value = false
  if (drawing) {
    drawing = false
    emit('end')
  }
}

// 원격 그리기/초기화는 부모가 호출한다.
defineExpose({ drawSegment, drawStroke, clear, CANVAS_RES })
</script>

<template>
  <div
    ref="wrapRef"
    class="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden"
    :class="wrapClass"
  >
    <div :style="{ width: `${side}px` }">
      <!-- 그림 영역 (정사각형). 오버레이/커서는 이 안에 absolute로 띄운다. -->
      <div
        class="relative aspect-square w-full overflow-hidden rounded border border-neutral-200 bg-white shadow-inner"
        aria-label="그림 영역"
      >
        <canvas
          ref="canvasRef"
          :width="CANVAS_RES"
          :height="CANVAS_RES"
          class="h-full w-full touch-none"
          :class="canDraw ? 'cursor-none' : 'cursor-default'"
          @pointerdown="pointerDown"
          @pointermove="pointerMove"
          @pointerup="pointerUp"
          @pointercancel="pointerUp"
          @pointerenter="pointerEnter"
          @pointerleave="pointerLeave"
        />

        <!-- 브러시 미리보기 커서 (그릴 수 있을 때만) -->
        <div
          v-if="canDraw && showCursor"
          class="pointer-events-none absolute rounded-full border-2"
          :style="{
            left: `${cursorX}px`,
            top: `${cursorY}px`,
            width: `${cursorSizePx}px`,
            height: `${cursorSizePx}px`,
            transform: 'translate(-50%, -50%)',
            borderColor: cursorColor,
            backgroundColor: cursorBg,
          }"
        />

        <!-- 게임별 오버레이(제시어/시간/로비/툴바/안내 등)는 부모가 주입 -->
        <slot name="overlay" />
      </div>
    </div>
  </div>
</template>

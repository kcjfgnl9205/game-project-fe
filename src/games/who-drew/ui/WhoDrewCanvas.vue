<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGameStore, type Segment, type Stroke } from '@/games/who-drew/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

const CANVAS_RES = 1000 // 내부 해상도 고정 (좌표는 이 기준)
const COLOR = '#1f2937'
const SIZE = 16 // 선 두께 (CANVAS_RES 기준)

const canvasWrap = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const side = ref(0)
let ctx: CanvasRenderingContext2D | null = null
let ro: ResizeObserver | null = null

// 내 차례에만, 그리고 이번 턴에 아직 안 그렸을 때만 그릴 수 있다 (한 턴 한 획).
const drawnThisTurn = ref(false)
const isMyTurn = computed(
  () => game.status === 'DRAWING' && game.currentTurnKey === props.myPlayerId,
)
const canDraw = computed(() => isMyTurn.value && !drawnThisTurn.value)

function drawSeg(s: Segment) {
  if (!ctx) return
  ctx.strokeStyle = COLOR
  ctx.lineWidth = SIZE
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(s.x0, s.y0)
  ctx.lineTo(s.x1, s.y1)
  ctx.stroke()
}
function drawStroke(stroke: Stroke) {
  stroke.forEach(drawSeg)
}
function clearCanvas() {
  ctx?.clearRect(0, 0, CANVAS_RES, CANVAS_RES)
}

// ===== 그리기 (한 턴에 한 획) =====
let drawing = false
let lastX = 0
let lastY = 0
let buffer: Stroke = []

// 새 턴이 시작될 때마다(turnEndsAt 갱신) "이번 턴에 그림" 플래그를 초기화한다.
// 순환이라 차례가 돌아오면 currentTurnKey가 직전과 같을 수 있어, key 비교로는 리셋되지 않는다.
watch(
  () => game.turnEndsAt,
  () => {
    drawnThisTurn.value = false
    drawing = false
    buffer = []
  },
)

function toCanvas(e: PointerEvent) {
  const r = canvasEl.value!.getBoundingClientRect()
  return {
    x: ((e.clientX - r.left) / r.width) * CANVAS_RES,
    y: ((e.clientY - r.top) / r.height) * CANVAS_RES,
  }
}
function pointerDown(e: PointerEvent) {
  if (!canDraw.value) return
  drawing = true
  buffer = []
  const p = toCanvas(e)
  lastX = p.x
  lastY = p.y
  canvasEl.value?.setPointerCapture(e.pointerId)
}
function pointerMove(e: PointerEvent) {
  // 브러시 미리보기 커서 위치(표시 영역 기준 px)
  const r = canvasEl.value?.getBoundingClientRect()
  if (r) {
    cursorX.value = e.clientX - r.left
    cursorY.value = e.clientY - r.top
  }
  if (!drawing) return
  const p = toCanvas(e)
  const seg: Segment = {
    x0: Math.round(lastX),
    y0: Math.round(lastY),
    x1: Math.round(p.x),
    y1: Math.round(p.y),
  }
  drawSeg(seg)
  buffer.push(seg)
  lastX = p.x
  lastY = p.y
}
function pointerUp() {
  if (!drawing) return
  drawing = false
  if (buffer.length) {
    game.sendStroke(buffer) // 한 획 전송 → 서버가 다음 차례로 넘김
    drawnThisTurn.value = true // 이번 턴엔 더 못 그림
  }
  buffer = []
}

// ===== 브러시 미리보기 커서 (스케치픽과 동일) =====
const cursorX = ref(0)
const cursorY = ref(0)
const showCursor = ref(false)
// 선 두께(CANVAS_RES 기준)를 현재 표시 크기로 환산한 px
const cursorSizePx = computed(() => (SIZE * side.value) / CANVAS_RES)

function pointerEnter() {
  showCursor.value = true
}
function pointerLeave() {
  showCursor.value = false
  pointerUp()
}

// ===== 캔버스 크기 (정사각, 컨테이너에 맞춤) =====
function resize() {
  const el = canvasWrap.value
  if (!el) return
  side.value = Math.floor(Math.min(el.clientWidth, el.clientHeight))
}

onMounted(() => {
  ctx = canvasEl.value?.getContext('2d') ?? null
  resize()
  ro = new ResizeObserver(resize)
  if (canvasWrap.value) ro.observe(canvasWrap.value)

  // 원격 한 획 / 접속·재시작 시 히스토리(공유 캔버스 복원·초기화)
  game.onRemoteStroke((seg) => drawStroke(seg))
  game.onHistory((strokes) => {
    clearCanvas()
    strokes.forEach((s) => drawStroke(s.seg))
  })
})
onBeforeUnmount(() => {
  ro?.disconnect()
  game.onRemoteStroke(null)
  game.onHistory(null)
})
</script>

<template>
  <div ref="canvasWrap" class="relative flex min-h-0 flex-1 items-center justify-center p-3">
    <div class="relative" :style="{ width: side + 'px', height: side + 'px' }">
      <canvas
        ref="canvasEl"
        :width="CANVAS_RES"
        :height="CANVAS_RES"
        class="h-full w-full touch-none rounded-xl border border-border bg-white"
        :class="canDraw ? 'cursor-none' : 'cursor-default'"
        @pointerdown="pointerDown"
        @pointermove="pointerMove"
        @pointerup="pointerUp"
        @pointercancel="pointerUp"
        @pointerenter="pointerEnter"
        @pointerleave="pointerLeave"
      />

      <!-- 브러시 미리보기 커서 (자기 차례에만) -->
      <div
        v-if="canDraw && showCursor"
        class="pointer-events-none absolute rounded-full border-2"
        :style="{
          left: `${cursorX}px`,
          top: `${cursorY}px`,
          width: `${cursorSizePx}px`,
          height: `${cursorSizePx}px`,
          transform: 'translate(-50%, -50%)',
          borderColor: COLOR,
          backgroundColor: `${COLOR}33`,
        }"
      />

      <!-- 페이지가 주입하는 오버레이(단어배너/로비/투표/결과) -->
      <slot name="overlay" />
    </div>
  </div>
</template>

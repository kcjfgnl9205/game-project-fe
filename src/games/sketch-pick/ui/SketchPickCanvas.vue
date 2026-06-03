<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGameStore, type Stroke } from '@/games/sketch-pick/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

// 캔버스를 항상 정사각형으로 유지한다. 캔버스 위에는 제시어/시간 바, 아래에는 툴바가 붙으므로,
// 가용 높이에서 그 공간을 뺀 뒤 가로/세로 중 짧은 변에 맞춰 한 변(px)을 정한다.
const VERTICAL_SPACE = 120 // 상단바 h-12(48) + 툴바 h-14(56) + gap-2 x2(16)

const canvasWrap = ref<HTMLElement | null>(null)
const side = ref(0)
let ro: ResizeObserver | null = null

// 출제자 여부 / 남은 시간 / 제시어 텍스트(출제자=단어, 그 외=글자 수 ○)
const isDrawer = computed(
  () => !!game.currentDrawerKey && game.currentDrawerKey === props.myPlayerId,
)
const drawerName = computed(
  () => game.players.find((p) => p.playerId === game.currentDrawerKey)?.nickname ?? '',
)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
const seconds = computed(() => {
  if (!game.turnEndsAt) return 0
  return Math.max(0, Math.ceil((game.turnEndsAt - now.value) / 1000))
})
const promptText = computed(() =>
  isDrawer.value ? (game.word ?? '') : '○'.repeat(game.wordLength),
)

// ===== 그리기 =====
const CANVAS_RES = 1000 // 캔버스 내부 해상도(고정). 모든 좌표/두께는 이 기준으로 주고받는다.
const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

// 출제자 + DRAWING 단계에서만 그릴 수 있다.
const canDraw = computed(() => isDrawer.value && game.status === 'DRAWING')

function drawSeg(s: Stroke) {
  if (!ctx) return
  ctx.strokeStyle = s.color
  ctx.lineWidth = s.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(s.x0, s.y0)
  ctx.lineTo(s.x1, s.y1)
  ctx.stroke()
}
function clearCanvas() {
  ctx?.clearRect(0, 0, CANVAS_RES, CANVAS_RES)
}

// 전송 최적화: pointermove마다 보내지 않고 버퍼에 모아 프레임당 1회(batch) 전송
let strokeBuffer: Stroke[] = []
let flushRaf = 0
function flushStrokes() {
  flushRaf = 0
  if (strokeBuffer.length) {
    game.sendStroke(strokeBuffer)
    strokeBuffer = []
  }
}
function scheduleFlush() {
  if (flushRaf) return
  flushRaf = requestAnimationFrame(flushStrokes)
}

let drawing = false
let lastX = 0
let lastY = 0

// 화면 좌표 → 캔버스 내부 좌표(0~CANVAS_RES)
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
  const p = toCanvas(e)
  lastX = p.x
  lastY = p.y
  canvasEl.value?.setPointerCapture(e.pointerId)
}
function pointerMove(e: PointerEvent) {
  // 브러시 미리보기 커서 위치(그림 영역 기준 px)
  const r = canvasEl.value?.getBoundingClientRect()
  if (r) {
    cursorX.value = e.clientX - r.left
    cursorY.value = e.clientY - r.top
  }
  if (!drawing || !canDraw.value) return
  const p = toCanvas(e)
  // 브러시 두께도 표시 크기(side)에 무관하게 CANVAS_RES 기준으로 환산
  const size = side.value > 0 ? (strokePx.value * CANVAS_RES) / side.value : strokePx.value
  const seg: Stroke = {
    x0: lastX,
    y0: lastY,
    x1: p.x,
    y1: p.y,
    color: selectedColor.value,
    size,
  }
  drawSeg(seg) // 본인 화면 즉시 반영
  strokeBuffer.push(seg) // 전송은 프레임당 묶어서 (throttle + batch)
  scheduleFlush()
  lastX = p.x
  lastY = p.y
}
function pointerUp() {
  drawing = false
  flushStrokes() // 드래그 끝: 남은 점 즉시 전송
}

// 전체 지우기 (출제자만)
function clearAll() {
  if (!canDraw.value) return
  clearCanvas()
  game.sendClear()
}

// 새 출제자가 정해지면(턴 전환) 캔버스 초기화
watch(
  () => game.currentDrawerKey,
  () => clearCanvas(),
)

onMounted(() => {
  ro = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const { width, height } = entry.contentRect
    side.value = Math.max(0, Math.floor(Math.min(width, height - VERTICAL_SPACE)))
  })
  if (canvasWrap.value) ro.observe(canvasWrap.value)
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)

  // 캔버스 컨텍스트 + 원격 그리기 수신 등록
  ctx = canvasEl.value?.getContext('2d') ?? null
  game.onRemoteStroke((strokes) => strokes.forEach(drawSeg))
  game.onRemoteClear(clearCanvas)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  if (timer) clearInterval(timer)
  if (flushRaf) cancelAnimationFrame(flushRaf)
  game.onRemoteStroke(null)
  game.onRemoteClear(null)
})

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
const brushSize = ref(3) // 굵기 단계 1~5 (기본 3)

const STROKE_SCALE = 6 // 단계 → 실제 px 두께(표시 기준). 1단계=6px ~ 5단계=30px
const strokePx = computed(() => brushSize.value * STROKE_SCALE)

const decreaseSize = () => {
  brushSize.value = Math.max(1, brushSize.value - 1)
}

const increaseSize = () => {
  brushSize.value = Math.min(5, brushSize.value + 1)
}

// ===== 브러시 크기 미리보기 커서 =====
const cursorX = ref(0)
const cursorY = ref(0)
const showCursor = ref(false)
const isEraser = computed(() => selectedColor.value === '#ffffff')

function pointerEnter() {
  showCursor.value = true
}
function pointerLeave() {
  showCursor.value = false
  drawing = false
  flushStrokes()
}
</script>

<template>
  <section class="flex min-h-0 min-w-0 flex-1 flex-col bg-bg">
    <!-- 캔버스 + 툴바를 한 묶음으로: 가용 영역 짧은 변에 맞춘 정사각형 + 바로 아래 툴바(같은 폭) -->
    <div
      ref="canvasWrap"
      class="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-6"
    >
      <div class="flex flex-col gap-2" :style="{ width: `${side}px` }">
        <!-- 제시어 + 시간 바: 캔버스 바로 위 -->
        <div
          class="flex h-12 shrink-0 items-center justify-between rounded-lg border border-border bg-bg-card px-4"
        >
          <span
            class="flex min-w-0 items-center gap-3 truncate text-sm font-bold text-text-secondary"
          >
            <template v-if="game.status === 'DRAWING'">
              <span class="truncate flex items-center">
                <span>제시어:</span>
                <span class="ml-1 text-lg tracking-widest text-brand">{{ promptText }}</span>
              </span>
              <span class="shrink-0 text-text-muted">출제자: {{ drawerName }}</span>
            </template>
            <template v-else-if="game.status === 'WORD_SELECT'">
              <span class="truncate"> 단어 선택 중… </span>
              <span class="shrink-0 text-text-muted">출제자: {{ drawerName }}</span>
            </template>
          </span>
          <span v-if="game.turnEndsAt" class="inline-flex shrink-0 items-center gap-1">
            <i-local-timer aria-hidden="true" />
            <span class="text-lg font-bold tabular-nums">{{ seconds }}초</span>
          </span>
        </div>

        <!-- 그림 영역 (정사각형). 안내/모달 오버레이를 캔버스 안에 띄운다. -->
        <div
          class="relative aspect-square w-full overflow-hidden rounded border border-neutral-200 bg-white shadow-inner"
          aria-label="그림 영역"
        >
          <canvas
            ref="canvasEl"
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

          <!-- 브러시 크기 미리보기 커서 (출제자만) -->
          <div
            v-if="canDraw && showCursor"
            class="pointer-events-none absolute rounded-full border-2"
            :style="{
              left: `${cursorX}px`,
              top: `${cursorY}px`,
              width: `${strokePx}px`,
              height: `${strokePx}px`,
              transform: 'translate(-50%, -50%)',
              borderColor: isEraser ? '#9ca3af' : selectedColor,
              backgroundColor: isEraser ? 'rgba(0,0,0,0.04)' : `${selectedColor}33`,
            }"
          />

          <slot name="overlay" />
        </div>

        <!-- 툴바: 캔버스 바로 아래, 같은 폭 -->
        <div
          class="flex h-14 shrink-0 items-center gap-4 overflow-x-auto rounded-lg border border-border bg-bg-card px-4"
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
              @click="selectedColor = color"
            />
          </div>

          <div class="ml-auto flex shrink-0 items-center gap-2">
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
            class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary cursor-pointer"
            @click="selectedColor = '#ffffff'"
          >
            <span aria-hidden="true">🧽</span>
            지우개
          </button>
          <button
            type="button"
            class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary cursor-pointer"
            @click="clearAll"
          >
            <span aria-hidden="true">↻</span>
            전체 지우기
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

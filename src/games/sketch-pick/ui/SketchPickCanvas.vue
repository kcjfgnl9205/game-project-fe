<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DrawingSurface, CANVAS_RES, type Segment } from '@/shared/ui-canvas'
import { useGameStore } from '@/games/sketch-pick/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

const surface = ref<InstanceType<typeof DrawingSurface> | null>(null)
const side = ref(0) // 정사각 한 변(px) — DrawingSurface가 알려준다

const isDrawer = computed(
  () => !!game.currentDrawerKey && game.currentDrawerKey === props.myPlayerId,
)
// 출제자 + DRAWING 단계에서만 그릴 수 있다.
const canDraw = computed(() => isDrawer.value && game.status === 'DRAWING')

// ===== 팔레트 / 브러시 (그림 맞추기 전용) =====
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
const isEraser = computed(() => selectedColor.value === '#ffffff')

const setColor = (c: string) => (selectedColor.value = c)
const useEraser = () => (selectedColor.value = '#ffffff')
const decreaseSize = () => {
  brushSize.value = Math.max(1, brushSize.value - 1)
}
const increaseSize = () => {
  brushSize.value = Math.min(5, brushSize.value + 1)
}

// ===== 전송 최적화: 프레임당 배치 + color/size는 변경 시에만 싣기 =====
let strokeBuffer: Segment[] = []
let flushRaf = 0
let lastSentColor: string | null = null
let lastSentSize: number | null = null
function flush() {
  flushRaf = 0
  if (strokeBuffer.length) {
    game.sendStroke(strokeBuffer)
    strokeBuffer = []
  }
}
function scheduleFlush() {
  if (flushRaf) return
  flushRaf = requestAnimationFrame(flush)
}

function onStart() {
  // 새 획: 다음 세그먼트에 color/size를 반드시 다시 싣도록 초기화
  lastSentColor = null
  lastSentSize = null
}
function onSegment(seg: Segment) {
  // 브러시 두께는 표시 크기(side)에 무관하게 CANVAS_RES 기준으로 환산
  const size = Math.round(
    side.value > 0 ? (strokePx.value * CANVAS_RES) / side.value : strokePx.value,
  )
  const wire: Segment = { x0: seg.x0, y0: seg.y0, x1: seg.x1, y1: seg.y1 }
  if (selectedColor.value !== lastSentColor) {
    wire.color = selectedColor.value
    lastSentColor = selectedColor.value
  }
  if (size !== lastSentSize) {
    wire.size = size
    lastSentSize = size
  }
  surface.value?.drawSegment(wire) // 본인 화면 즉시 반영
  strokeBuffer.push(wire)
  scheduleFlush()
}
function onEnd() {
  flush() // 드래그 끝: 남은 점 즉시 전송
}

// 전체 지우기 (출제자만)
function clearAll() {
  if (!canDraw.value) return
  surface.value?.clear()
  game.sendClear()
}

// 실제 턴 전환(이전 출제자 → 새 출제자)에서만 캔버스 초기화.
// 입장 직후 null→출제자 전환에서 지우면 중간 입장 시 재생된 그림이 사라지므로 제외한다.
watch(
  () => game.currentDrawerKey,
  (_key, prev) => {
    if (prev != null) surface.value?.clear()
  },
)

onMounted(() => {
  game.onRemoteStroke((strokes) => strokes.forEach((s) => surface.value?.drawSegment(s)))
  game.onRemoteClear(() => surface.value?.clear())
})
onBeforeUnmount(() => {
  if (flushRaf) cancelAnimationFrame(flushRaf)
  game.onRemoteStroke(null)
  game.onRemoteClear(null)
})
</script>

<template>
  <DrawingSurface
    ref="surface"
    wrap-class="bg-bg p-6"
    :can-draw="canDraw"
    :active="canDraw"
    :cursor-size-px="strokePx"
    :cursor-color="isEraser ? '#9ca3af' : selectedColor"
    :cursor-bg="isEraser ? 'rgba(0,0,0,0.04)' : `${selectedColor}33`"
    @resize="side = $event"
    @start="onStart"
    @segment="onSegment"
    @end="onEnd"
  >
    <template #overlay>
      <!-- 게임별 오버레이(제시어/시간/로비/툴바 등)는 페이지가 주입.
           툴바용 상태/액션은 scoped slot으로 노출한다. -->
      <slot
        name="overlay"
        :palette="palette"
        :selectedColor="selectedColor"
        :brushSize="brushSize"
        :isEraser="isEraser"
        :canDraw="canDraw"
        :setColor="setColor"
        :decreaseSize="decreaseSize"
        :increaseSize="increaseSize"
        :useEraser="useEraser"
        :clear="clearAll"
      />
    </template>
  </DrawingSurface>
</template>

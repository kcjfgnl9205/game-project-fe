<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DrawingSurface, CANVAS_RES, type Segment } from '@/shared/ui-canvas'
import { useGameStore } from '@/games/who-drew/model/game.store'

const props = defineProps<{ myPlayerId: string }>()
const game = useGameStore()

const COLOR = '#1f2937'
const SIZE = 16 // 선 두께 (CANVAS_RES 기준)

const surface = ref<InstanceType<typeof DrawingSurface> | null>(null)
const side = ref(0) // 정사각 한 변(px) — DrawingSurface가 알려준다

// 내 차례에만, 그리고 이번 턴에 아직 안 그렸을 때만 그릴 수 있다 (한 턴 한 획).
const drawnThisTurn = ref(false)
const isMyTurn = computed(
  () => game.status === 'DRAWING' && game.currentTurnKey === props.myPlayerId,
)
const canDraw = computed(() => isMyTurn.value && !drawnThisTurn.value)

// 선 두께(CANVAS_RES 기준)를 현재 표시 크기로 환산한 px
const cursorSizePx = computed(() => (SIZE * side.value) / CANVAS_RES)

let buffer: Segment[] = []

// 새 턴이 시작될 때마다(turnEndsAt 갱신) "이번 턴에 그림" 플래그를 초기화한다.
// 순환이라 차례가 돌아오면 currentTurnKey가 직전과 같을 수 있어 key 비교로는 리셋되지 않는다.
watch(
  () => game.turnEndsAt,
  () => {
    drawnThisTurn.value = false
    buffer = []
  },
)

function onStart() {
  buffer = []
}
function onSegment(seg: Segment) {
  surface.value?.drawSegment(seg) // 기본 스타일(COLOR/SIZE)로 그려진다
  buffer.push(seg)
}
function onEnd() {
  if (buffer.length) {
    game.sendStroke(buffer) // 한 획 전송 → 서버가 다음 차례로 넘김
    drawnThisTurn.value = true // 이번 턴엔 더 못 그림
  }
  buffer = []
}

onMounted(() => {
  // 원격 한 획 / 접속·재시작 시 히스토리(공유 캔버스 복원·초기화)
  game.onRemoteStroke((seg) => surface.value?.drawStroke(seg))
  game.onHistory((strokes) => {
    surface.value?.clear()
    strokes.forEach((s) => surface.value?.drawStroke(s.seg))
  })
})
onBeforeUnmount(() => {
  game.onRemoteStroke(null)
  game.onHistory(null)
})
</script>

<template>
  <DrawingSurface
    ref="surface"
    wrap-class="p-3"
    :can-draw="canDraw"
    :cursor-size-px="cursorSizePx"
    :cursor-color="COLOR"
    :cursor-bg="`${COLOR}33`"
    :default-color="COLOR"
    :default-stroke-width="SIZE"
    @resize="side = $event"
    @start="onStart"
    @segment="onSegment"
    @end="onEnd"
  >
    <template #overlay>
      <slot name="overlay" />
    </template>
  </DrawingSurface>
</template>

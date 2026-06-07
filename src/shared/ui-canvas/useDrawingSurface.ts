import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { CANVAS_RES, type Segment } from './types'

interface Options {
  // 색/두께가 생략된 세그먼트가 사용할 기본 스타일.
  // 예: 누가그렸지는 고정 색/두께만 쓰므로 세그먼트에 color/size를 싣지 않는다.
  defaultColor?: string
  defaultStrokeWidth?: number // CANVAS_RES 기준
}

/**
 * 정사각 캔버스의 저수준 공통 로직.
 * - 가용 영역 짧은 변에 맞춘 정사각 사이징(ResizeObserver)
 * - 2d ctx 초기화 + 선분/획 그리기 + 전체 지우기
 * - 화면 좌표 → 캔버스 내부 좌표(0~CANVAS_RES) 변환
 *
 * 포인터 이벤트 정책/네트워킹은 다루지 않는다(게임별 컴포넌트가 담당).
 */
export function useDrawingSurface(
  wrapRef: Ref<HTMLElement | null>,
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: Options = {},
) {
  const side = ref(0) // 정사각 한 변(px, 표시 기준)
  let ctx: CanvasRenderingContext2D | null = null
  let ro: ResizeObserver | null = null

  function drawSegment(s: Segment) {
    if (!ctx) return
    // color/size는 변경 시에만 실려 온다. 없으면 직전 ctx 상태를 그대로 유지한다.
    if (s.color) ctx.strokeStyle = s.color
    if (s.size != null) ctx.lineWidth = s.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(s.x0, s.y0)
    ctx.lineTo(s.x1, s.y1)
    ctx.stroke()
  }

  function drawStroke(stroke: Segment[]) {
    stroke.forEach(drawSegment)
  }

  function clear() {
    ctx?.clearRect(0, 0, CANVAS_RES, CANVAS_RES)
  }

  // 화면 좌표 → 캔버스 내부 좌표(0~CANVAS_RES)
  function toCanvas(e: PointerEvent) {
    const r = canvasRef.value!.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * CANVAS_RES,
      y: ((e.clientY - r.top) / r.height) * CANVAS_RES,
    }
  }

  onMounted(() => {
    ctx = canvasRef.value?.getContext('2d') ?? null
    if (ctx) {
      if (options.defaultColor) ctx.strokeStyle = options.defaultColor
      if (options.defaultStrokeWidth != null) ctx.lineWidth = options.defaultStrokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      side.value = Math.max(0, Math.floor(Math.min(width, height)))
    })
    if (wrapRef.value) ro.observe(wrapRef.value)
  })

  onBeforeUnmount(() => {
    ro?.disconnect()
    ro = null
    ctx = null
  })

  return { side, drawSegment, drawStroke, clear, toCanvas, CANVAS_RES }
}

// 캔버스 내부 해상도(고정). 모든 좌표/두께는 이 기준으로 다룬다(해상도 독립).
export const CANVAS_RES = 1000

// 한 획의 선분 한 조각.
export interface Segment {
  x0: number
  y0: number
  x1: number
  y1: number
  // color/size는 한 획 내내 동일하므로 변경 시(획 첫 세그먼트 포함)에만 싣는다.
  // 생략된 세그먼트는 직전 ctx 상태(또는 기본 스타일)를 그대로 유지한다.
  color?: string
  size?: number
}

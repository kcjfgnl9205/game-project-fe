// 참가자 목록 표시용 뷰 모델. 실데이터는 game.store의 lobby:state에서 매핑된다.
export interface Participant {
  id: string
  rank: number
  nickname: string
  score: number
  isHost?: boolean
  isDrawing?: boolean
  isMe?: boolean
}

export const palette = [
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

export const PROMPT = '사과'

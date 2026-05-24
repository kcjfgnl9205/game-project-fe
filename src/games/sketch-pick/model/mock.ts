export interface Participant {
  id: string
  rank: number
  nickname: string
  score: number
  isHost?: boolean
  isDrawing?: boolean
}

export interface ChatMessage {
  id: string
  nickname: string
  text: string
  isSystem?: boolean
}

export const participants: Participant[] = [
  { id: '1', rank: 1, nickname: '플레이어1', score: 150, isHost: true, isDrawing: true },
  { id: '2', rank: 2, nickname: '그림왕', score: 120 },
  { id: '3', rank: 3, nickname: '캐치마스터', score: 100 },
  { id: '4', rank: 4, nickname: '뉴비', score: 50 },
  { id: '5', rank: 5, nickname: '프로화가', score: 80 },
]

export const chatMessages: ChatMessage[] = [
  { id: 'm1', nickname: '그림왕', text: '시작!' },
  { id: 'sys1', nickname: '시스템', text: '플레이어1님이 그림을 그립니다.', isSystem: true },
  { id: 'm2', nickname: '캐치마스터', text: '뭐지?' },
  { id: 'm3', nickname: '뉴비', text: '사과?' },
  { id: 'm4', nickname: '그림왕', text: '과일인가' },
]

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

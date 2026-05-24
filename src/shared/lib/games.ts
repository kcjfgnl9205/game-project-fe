export type GameStatus = 'available' | 'coming-soon'

export interface GameSummary {
  id: string
  name: string
  description: string
  icon: string
  minPlayers: number
  maxPlayers: number
  status: GameStatus
  totalPlays?: number
}

export const games: GameSummary[] = [
  {
    id: 'sketch-pick',
    name: '스케치픽',
    description: '그림을 그리고 맞춰보세요!',
    icon: '🎨',
    minPlayers: 2,
    maxPlayers: 8,
    status: 'available',
    totalPlays: 1234,
  },
  {
    id: 'word-chain',
    name: '끝말잇기',
    description: '단어를 이어가세요!',
    icon: '📝',
    minPlayers: 2,
    maxPlayers: 6,
    status: 'coming-soon',
  },
  {
    id: 'speed-quiz',
    name: '스피드 퀴즈',
    description: '빠르게 정답을 맞춰라!',
    icon: '⚡',
    minPlayers: 2,
    maxPlayers: 10,
    status: 'coming-soon',
  },
  {
    id: 'mafia',
    name: '마피아 게임',
    description: '마피아를 찾아내세요!',
    icon: '🕵️',
    minPlayers: 5,
    maxPlayers: 12,
    status: 'coming-soon',
  },
]

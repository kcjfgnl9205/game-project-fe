export type GameStatus = 'available' | 'coming-soon'

// 백엔드 Room.gameType(enum)과 매핑. 방 목록을 게임별로 필터링할 때 쓴다.
export type GameType = 'SKETCH_PIC' | 'WHO_DREW'

export interface GameSummary {
  id: string
  name: string
  description: string
  icon: string
  minPlayers: number
  maxPlayers: number
  status: GameStatus
  gameType?: GameType // 플레이 가능한(서버 연동) 게임만 가짐
  totalPlays?: number
}

export const games: GameSummary[] = [
  {
    id: 'sketch-pick',
    name: '그림 맞추기',
    description: '그림을 그리고 맞춰보세요!',
    icon: '🎨',
    minPlayers: 2,
    maxPlayers: 8,
    status: 'available',
    gameType: 'SKETCH_PIC',
    totalPlays: 1234,
  },
  {
    id: 'who-drew',
    name: '그림 마피아',
    description: '함께 그리고 마피아를 찾아내세요!',
    icon: '🖌️',
    minPlayers: 4,
    maxPlayers: 8,
    status: 'available',
    gameType: 'WHO_DREW',
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

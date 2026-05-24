export type RoomStatus = 'waiting' | 'playing'

export interface RoomItem {
  id: string
  gameId: string
  name: string
  hostNickname: string
  currentPlayers: number
  maxPlayers: number
  status: RoomStatus
  isLocked: boolean
}

export const rooms: RoomItem[] = [
  {
    id: '1',
    gameId: 'sketch-pick',
    name: '친구들과 한판!',
    hostNickname: '플레이어1',
    currentPlayers: 4,
    maxPlayers: 8,
    status: 'waiting',
    isLocked: false,
  },
  {
    id: '2',
    gameId: 'sketch-pick',
    name: '고수만 오세요',
    hostNickname: '그림장인',
    currentPlayers: 6,
    maxPlayers: 8,
    status: 'waiting',
    isLocked: true,
  },
  {
    id: '3',
    gameId: 'sketch-pick',
    name: '초보환영 ^^',
    hostNickname: '뉴비킬러',
    currentPlayers: 3,
    maxPlayers: 8,
    status: 'playing',
    isLocked: false,
  },
  {
    id: '4',
    gameId: 'sketch-pick',
    name: '빠른 게임',
    hostNickname: '스피드왕',
    currentPlayers: 8,
    maxPlayers: 8,
    status: 'playing',
    isLocked: false,
  },
  {
    id: '5',
    gameId: 'sketch-pick',
    name: '조용히 그림만',
    hostNickname: '묵묵이',
    currentPlayers: 2,
    maxPlayers: 8,
    status: 'waiting',
    isLocked: false,
  },
  {
    id: '6',
    gameId: 'sketch-pick',
    name: '실력자 모임',
    hostNickname: '프로화가',
    currentPlayers: 5,
    maxPlayers: 8,
    status: 'waiting',
    isLocked: true,
  },
]

export const findRoomsByGameId = (gameId: string): RoomItem[] =>
  rooms.filter((room) => room.gameId === gameId)

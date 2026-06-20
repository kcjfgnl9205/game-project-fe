import type { GameType } from '@/shared/lib/games'

export type RoomStatus = 'WAITING' | 'IN_GAME'

/** 게임별 방 현황 (GET /rooms/stats). 게임목록의 "게임중 N개" 표시용. */
export interface RoomStat {
  gameType: GameType
  waiting: number
  inGame: number
}

/** 끝말잇기 게임 방식 */
export type WordChainMode = 'ROUND' | 'TOURNAMENT'

/** 게임별 방 설정. 게임에 따라 채워지는 필드가 다르다. */
export interface RoomConfig {
  drawTimeSec?: number // SKETCH_PIC
  rounds?: number // WHO_DREW
  turnTimeSec?: number // WHO_DREW / WORD_CHAIN
  // WORD_CHAIN
  mode?: WordChainMode
  roundCount?: number
  allowKillerWord?: boolean
}

/** 방 목록 항목 (GET /rooms). 호스트/참가자 정보는 상세에서만 온다. */
export interface RoomListItem {
  id: string
  name: string
  status: RoomStatus
  maxPlayers: number
  isPrivate: boolean
  gameType: GameType
  config: RoomConfig
  currentPlayers: number
  createdAt: string
}

export interface RoomParticipant {
  id: string
  userId: string | null // 회원이면 값, 게스트면 null
  guestId: string | null // 게스트면 값, 회원이면 null
  nickname: string
  isHost: boolean
  joinedAt: string
}

/** 방 상세 (GET /rooms/:id, 생성/입장/수정 응답). */
export interface Room extends RoomListItem {
  participants: RoomParticipant[]
}

export interface CreateRoomRequest {
  gameType?: GameType // 미지정 시 서버 기본값 SKETCH_PIC
  name: string
  maxPlayers?: number
  isPrivate?: boolean
  password?: string
  config?: RoomConfig // 게임별 설정 (서버가 gameType에 맞게 검증)
  nickname?: string // 게스트 필수, 회원은 무시
}

export interface JoinRoomRequest {
  password?: string // 비공개 방이면 필수
  nickname?: string // 게스트 필수
}

export type UpdateRoomRequest = Partial<
  Pick<CreateRoomRequest, 'name' | 'maxPlayers' | 'isPrivate' | 'password' | 'config'>
>

export type RoomStatus = 'WAITING' | 'IN_GAME'

/** 방 목록 항목 (GET /rooms). 호스트/참가자 정보는 상세에서만 온다. */
export interface RoomListItem {
  id: string
  name: string
  status: RoomStatus
  maxPlayers: number
  isPrivate: boolean
  drawTimeSec: number
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

export interface RoomListParams {
  page?: number
  limit?: number
}

export interface RoomListResponse {
  total: number
  items: RoomListItem[]
}

export interface CreateRoomRequest {
  name: string
  maxPlayers?: number
  isPrivate?: boolean
  password?: string
  drawTimeSec?: number
  nickname?: string // 게스트 필수, 회원은 무시
}

export interface JoinRoomRequest {
  password?: string // 비공개 방이면 필수
  nickname?: string // 게스트 필수
}

export type UpdateRoomRequest = Partial<
  Pick<CreateRoomRequest, 'name' | 'maxPlayers' | 'isPrivate' | 'password' | 'drawTimeSec'>
>

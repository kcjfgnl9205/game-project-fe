import { http, type PaginationParams, type PaginatedResponse } from '@/shared/api'
import type { GameType } from '@/shared/lib/games'
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  Room,
  RoomListItem,
  UpdateRoomRequest,
} from './model'

// 회원/게스트 식별자는 http 인터셉터가 헤더로 자동 부착한다(§0). nickname만 body로 넘긴다.

export interface RoomListParams extends PaginationParams {
  gameType?: GameType // 게임별 방만 조회 (미지정 시 서버 기본값 SKETCH_PIC)
}

export const fetchRooms = async (params: RoomListParams = {}) => {
  const { data } = await http.get<PaginatedResponse<RoomListItem>>('/rooms', { params })
  return data
}

export const fetchRoom = async (id: string) => {
  const { data } = await http.get<Room>(`/rooms/${id}`)
  return data
}

export const createRoom = async (body: CreateRoomRequest) => {
  const { data } = await http.post<Room>('/rooms', body)
  return data
}

export const joinRoom = async (id: string, body: JoinRoomRequest = {}) => {
  const { data } = await http.post<Room>(`/rooms/${id}/join`, body)
  return data
}

export const updateRoom = async (id: string, body: UpdateRoomRequest) => {
  const { data } = await http.patch<Room>(`/rooms/${id}`, body)
  return data
}

export const deleteRoom = async (id: string) => {
  await http.delete(`/rooms/${id}`)
}

// 명시적 나가기용 REST. 화면 이탈 시에는 소켓 disconnect로 서버가 자동 leave 처리한다.
export const leaveRoom = async (id: string) => {
  await http.post(`/rooms/${id}/leave`)
}

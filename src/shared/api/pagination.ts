// 목록 API 공통 타입. 백엔드 PaginationQueryDto(page/limit)와 응답(total/items)에 대응한다.
export interface PaginationParams {
  page?: number
  limit?: number
  q?: string
}

export interface PaginatedResponse<T> {
  total: number
  items: T[]
}

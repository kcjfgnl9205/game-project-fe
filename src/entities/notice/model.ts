import type { UserSummary } from '@/entities/user/model'

export interface Notice {
  id: string
  title: string
  content: string
  authorId: string
  author: UserSummary
  createdAt: string
  updatedAt: string
}

export interface NoticeListParams {
  page?: number
  size?: number
}

export interface NoticeListResponse {
  total: number
  items: Notice[]
}

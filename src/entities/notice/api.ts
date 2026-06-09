import { http, type PaginationParams, type PaginatedResponse } from '@/shared/api'
import type { Notice } from './model'

export const fetchNotices = async (params: PaginationParams = {}) => {
  const { data } = await http.get<PaginatedResponse<Notice>>('/notices', { params })
  return data
}

export const fetchNotice = async (id: string) => {
  const { data } = await http.get<Notice>(`/notices/${id}`)
  return data
}

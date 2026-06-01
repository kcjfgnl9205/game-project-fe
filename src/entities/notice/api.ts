import { http } from '@/shared/api'
import type { Notice, NoticeListParams, NoticeListResponse } from './model'

export const fetchNotices = async (params: NoticeListParams = {}) => {
  const { data } = await http.get<NoticeListResponse>('/notices', { params })
  return data
}

export const fetchNotice = async (id: string) => {
  const { data } = await http.get<Notice>(`/notices/${id}`)
  return data
}

import { http } from '@/shared/api'
import type { CreateInquiryRequest, Inquiry, InquiryCategory } from './model'

export const fetchInquiryCategories = async () => {
  const { data } = await http.get<InquiryCategory[]>('/inquiries/categories')
  return data
}

export const submitInquiry = async (body: CreateInquiryRequest) => {
  const { data } = await http.post<Inquiry>('/inquiries', body)
  return data
}

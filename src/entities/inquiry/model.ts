export interface InquiryCategory {
  id: string
  name: string
}

export interface CreateInquiryRequest {
  email: string
  categoryId: string
  title: string
  content: string
}

export interface Inquiry extends CreateInquiryRequest {
  id: string
  status: string
  createdAt: string
  updatedAt: string
}

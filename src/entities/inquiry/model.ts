export interface InquiryCategory {
  id: string
  name: string
}

export interface CreateInquiryRequest {
  email: string
  categoryId: string
  title: string
  content: string
  privacyConsent: boolean // 개인정보 수집·이용 동의 (필수)
}

export interface Inquiry extends CreateInquiryRequest {
  id: string
  status: string
  privacyConsentAt: string | null
  createdAt: string
  updatedAt: string
}

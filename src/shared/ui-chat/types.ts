// 채팅 한 줄. 게임 스토어의 ChatLine과 구조가 동일하다.
export interface ChatMessageItem {
  key: number
  system?: boolean // 진행 안내(시스템) 메시지
  senderId?: string // 발신자 식별 키 (user:<id> | guest:<id>)
  nickname?: string
  text: string
}

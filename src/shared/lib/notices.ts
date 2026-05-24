export interface NoticeItem {
  id: string
  title: string
  date: string
  content: string
  isNew?: boolean
}

export const notices: NoticeItem[] = [
  {
    id: '3',
    title: '스케치픽 정식 오픈!',
    date: '2024.01.15',
    isNew: true,
    content: `많은 분들이 기다려주신 스케치픽가 드디어 정식 오픈했습니다!

친구들과 함께 그림을 그리고 맞히는 즐거운 시간을 보내세요. 회원가입 없이도 닉네임만 입력하면 바로 플레이할 수 있어요.

앞으로도 더 다양한 게임을 추가해 나갈 예정이니 많은 관심 부탁드립니다.`,
  },
  {
    id: '2',
    title: '서버 점검 안내 (1/20 02:00-04:00)',
    date: '2024.01.14',
    isNew: true,
    content: `서비스 안정성 향상을 위한 서버 점검이 예정되어 있습니다.

- 점검 일시: 2024년 1월 20일 02:00 ~ 04:00 (KST)
- 점검 내용: 데이터베이스 마이그레이션 및 인프라 업그레이드
- 점검 중에는 서비스 이용이 제한됩니다.

이용에 불편을 드려 죄송하며, 보다 나은 서비스 제공을 위해 노력하겠습니다.`,
  },
  {
    id: '1',
    title: '새로운 게임 추가 예정',
    date: '2024.01.10',
    content: `2024년 상반기 출시 예정인 신규 미니게임을 미리 공개합니다.

- 끝말잇기: 단어를 이어가며 어휘력을 겨루는 게임
- 스피드 퀴즈: 빠르게 정답을 맞히는 순발력 게임
- 마피아 게임: 정체를 숨기고 서로를 추리하는 추리 게임

오픈 일정은 추후 공지를 통해 안내드릴 예정입니다.`,
  },
]

export const findNoticeById = (id: string): NoticeItem | undefined =>
  notices.find((notice) => notice.id === id)

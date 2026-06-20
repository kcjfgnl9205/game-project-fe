// 네오브루탈리즘 카드 공통 클래스 (굵은 테두리 + 둥근 모서리 + 하드 그림자).
// 게임 화면 전반에서 재사용한다.
export const BRUT = 'rounded-[28px] border-4 border-black shadow-[6px_6px_0_0_#000]'
export const BRUT_LG = 'rounded-[32px] border-4 border-black shadow-[10px_10px_0_0_#000]'

// 아바타/포인트 강조 색 팔레트 (순위/인덱스 기준 고정 배정)
export const AVATAR_COLORS = ['#FFB300', '#00D8A5', '#FF6B6B', '#4F46E5', '#a855f7', '#3b82f6']
export const avatarColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length] as string

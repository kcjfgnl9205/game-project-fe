import type { Component } from 'vue'
import ILocalSearch from '~icons/local/search'

// 아이콘 레지스트리: 디자이너 SVG를 이 폴더에 넣고 여기 한 줄 등록하면
// 컴포넌트에서 icon="<이름>" 문자열로 쓸 수 있다(타입 자동완성·오타 방지).
//   import ILocalLock from '~icons/local/lock'
//   lock: ILocalLock,
export const icons = {
  search: ILocalSearch,
} satisfies Record<string, Component>

export type IconName = keyof typeof icons

import type { Component } from 'vue'
import ILocalSearch from '~icons/local/search'
import ILocalPlus from '~icons/local/plus'
import ILocalMinus from '~icons/local/minus'
import ILocalRefresh from '~icons/local/refresh'
import ILocalPeople from '~icons/local/people'
import ILocalTimer from '~icons/local/timer'
import ILocalLock from '~icons/local/lock'
import ILocalUnLock from '~icons/local/unLock'
import ILocalChevronLeft from '~icons/local/chevronLeft'
import ILocalChevronRight from '~icons/local/chevronRight'
import ILocalChat from '~icons/local/chat'
import ILocalSend from '~icons/local/send'

// 아이콘 레지스트리: 디자이너 SVG를 이 폴더에 넣고 여기 한 줄 등록하면
// 컴포넌트에서 icon="<이름>" 문자열로 쓸 수 있다(타입 자동완성·오타 방지).
//   import ILocalLock from '~icons/local/lock'
//   lock: ILocalLock,
export const icons = {
  search: ILocalSearch,
  plus: ILocalPlus,
  minus: ILocalMinus,
  refresh: ILocalRefresh,
  people: ILocalPeople,
  timer: ILocalTimer,
  lock: ILocalLock,
  unLock: ILocalUnLock,
  chevronLeft: ILocalChevronLeft,
  chevronRight: ILocalChevronRight,
  chat: ILocalChat,
  send: ILocalSend,
} satisfies Record<string, Component>

export type IconName = keyof typeof icons

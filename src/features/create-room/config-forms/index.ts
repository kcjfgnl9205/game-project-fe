import type { Component } from 'vue'
import type { GameType } from '@/shared/lib/games'
import SketchPicConfigForm from './SketchPicConfigForm.vue'
import WhoDrewConfigForm from './WhoDrewConfigForm.vue'

// 게임별 방 설정 폼. Record<GameType, ...>이므로 새 게임이 생기면 컴파일 에러로 누락 방지.
// 새 게임 추가 = 폼 컴포넌트 1개 + 여기 1줄. CreateRoomModal은 안 바뀐다.
export const CONFIG_FORMS: Record<GameType, Component> = {
  SKETCH_PIC: SketchPicConfigForm,
  WHO_DREW: WhoDrewConfigForm,
}

import { useRouter } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

/**
 * 프로그래매틱 네비게이션을 한곳에 모은다.
 * 컴포넌트가 ROUTE_NAME/params 형태를 직접 알 필요 없이 의미 있는 메서드만 호출한다.
 */
export function useNavigation() {
  const router = useRouter()

  return {
    toHome: () => router.push({ name: ROUTE_NAME.HOME }),
    toLogin: () => router.push({ name: ROUTE_NAME.LOGIN }),
    toTerms: () => router.push({ name: ROUTE_NAME.TERMS }),
    toPrivacy: () => router.push({ name: ROUTE_NAME.PRIVACY }),

    toGameRooms: (gameId: string) =>
      router.push({ name: ROUTE_NAME.GAME_ROOMS, params: { gameId } }),
    // 게임 플레이 화면. 라우트 이름이 곧 gameId (예: 'sketch-pick').
    toGameRoom: (gameId: string, roomId: string) =>
      router.push({ name: gameId, params: { roomId } }),

    // history가 있으면 뒤로가기로 직전 entry를 제거, 없으면(직접 진입) fallback으로 이동.
    back: () => router.back(),
    backOr: (fallback: () => void) => {
      if (window.history.state?.back) router.back()
      else fallback()
    },
  }
}

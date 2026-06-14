import { createRouter, createWebHistory } from 'vue-router'
import { landingRoute } from '@/pages/landing'
import { loginRoute } from '@/pages/login'
import { gameListRoute } from '@/pages/game-list'
import { gameRoomsRoute } from '@/pages/game-rooms'
import { noticeRoute } from '@/pages/notice'
import { noticeDetailRoute } from '@/pages/notice-detail'
import { termsRoute } from '@/pages/terms'
import { privacyRoute } from '@/pages/privacy'
import { sketchPickRoute } from '@/games/sketch-pick'
import { whoDrewRoute } from '@/games/who-drew'
import { ROUTE_NAME } from './router-name'
import { useAuthStore } from '@/shared/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/app/layouts/DefaultLayout.vue'),
      children: [
        landingRoute,
        loginRoute,
        gameListRoute,
        gameRoomsRoute,
        noticeRoute,
        noticeDetailRoute,
        termsRoute,
        privacyRoute,
      ],
    },
    {
      path: '/games',
      component: () => import('@/app/layouts/GameLayout.vue'),
      children: [sketchPickRoute, whoDrewRoute /* , wordChainRoute, ... */],
    },
  ],
})

// 페이지별 <title> (SEO + 탭 UX). 라우트 name → 제목.
const SUFFIX = '놀모아'
const ROUTE_TITLES: Record<string, string> = {
  [ROUTE_NAME.HOME]: '놀모아 - 친구들과 즐기는 실시간 그림 게임',
  [ROUTE_NAME.LOGIN]: `로그인 | ${SUFFIX}`,
  [ROUTE_NAME.GAME_LIST]: `게임 목록 | ${SUFFIX}`,
  [ROUTE_NAME.GAME_ROOMS]: `방 목록 | ${SUFFIX}`,
  [ROUTE_NAME.NOTICE]: `공지사항 | ${SUFFIX}`,
  [ROUTE_NAME.NOTICE_DETAIL]: `공지사항 | ${SUFFIX}`,
  [ROUTE_NAME.TERMS]: `이용약관 | ${SUFFIX}`,
  [ROUTE_NAME.PRIVACY]: `개인정보처리방침 | ${SUFFIX}`,
  [ROUTE_NAME.SKETCH_PICK]: `그림 맞추기 | ${SUFFIX}`,
  [ROUTE_NAME.WHO_DREW]: `그림 마피아 | ${SUFFIX}`,
}

router.afterEach((to) => {
  document.title = ROUTE_TITLES[to.name as string] ?? SUFFIX
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init() // 세션 복구(refresh) 완료를 기다려야 로그인 상태가 확정된다.

  if (to.name === ROUTE_NAME.LOGIN && auth.isAuthenticated) {
    return { name: ROUTE_NAME.HOME }
  }
  if (to.matched.some((r) => r.meta.requiresAuth) && !auth.isAuthenticated) {
    return { name: ROUTE_NAME.LOGIN }
  }
})

export default router

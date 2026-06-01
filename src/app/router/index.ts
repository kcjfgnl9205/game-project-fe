import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/app/layouts/DefaultLayout.vue'
import GameLayout from '@/app/layouts/GameLayout.vue'
import { landingRoute } from '@/pages/landing'
import { loginRoute } from '@/pages/login'
import { gameListRoute } from '@/pages/game-list'
import { gameRoomsRoute } from '@/pages/game-rooms'
import { noticeRoute } from '@/pages/notice'
import { noticeDetailRoute } from '@/pages/notice-detail'
import { sketchPickRoute } from '@/games/sketch-pick'
import { ROUTE_NAME } from './router-name'
import { useAuthStore } from '@/shared/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        landingRoute,
        loginRoute,
        gameListRoute,
        gameRoomsRoute,
        noticeRoute,
        noticeDetailRoute,
      ],
    },
    {
      path: '/games',
      component: GameLayout,
      children: [sketchPickRoute /* , wordChainRoute, ... */],
    },
  ],
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

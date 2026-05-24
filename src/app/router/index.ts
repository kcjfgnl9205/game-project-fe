import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/app/layouts/DefaultLayout.vue'
import GameLayout from '@/app/layouts/GameLayout.vue'
import { landingRoute } from '@/pages/landing'
import { gameListRoute } from '@/pages/game-list'
import { gameRoomsRoute } from '@/pages/game-rooms'
import { noticeRoute } from '@/pages/notice'
import { noticeDetailRoute } from '@/pages/notice-detail'
import { sketchPickRoute } from '@/games/sketch-pick'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [landingRoute, gameListRoute, gameRoomsRoute, noticeRoute, noticeDetailRoute],
    },
    {
      path: '/games',
      component: GameLayout,
      children: [sketchPickRoute /* , wordChainRoute, ... */],
    },
  ],
})

export default router

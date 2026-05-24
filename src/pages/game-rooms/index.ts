import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const gameRoomsRoute: RouteRecordRaw = {
  path: 'games/:gameId',
  name: ROUTE_NAME.GAME_ROOMS,
  component: () => import('./ui/GameRoomsPage.vue'),
}

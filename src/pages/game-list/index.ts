import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const gameListRoute: RouteRecordRaw = {
  path: 'games',
  name: ROUTE_NAME.GAME_LIST,
  component: () => import('./ui/GameListPage.vue'),
}

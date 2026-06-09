import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const loginRoute: RouteRecordRaw = {
  path: 'login',
  name: ROUTE_NAME.LOGIN,
  component: () => import('./ui/LoginPage.vue'),
}

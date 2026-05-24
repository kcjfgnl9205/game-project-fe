import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const landingRoute: RouteRecordRaw = {
  path: '',
  name: ROUTE_NAME.HOME,
  component: () => import('./ui/LandingPage.vue'),
}

import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const privacyRoute: RouteRecordRaw = {
  path: 'privacy',
  name: ROUTE_NAME.PRIVACY,
  component: () => import('./ui/PrivacyPage.vue'),
}

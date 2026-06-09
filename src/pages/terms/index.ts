import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const termsRoute: RouteRecordRaw = {
  path: 'terms',
  name: ROUTE_NAME.TERMS,
  component: () => import('./ui/TermsPage.vue'),
}

import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const noticeRoute: RouteRecordRaw = {
  path: 'notice',
  name: ROUTE_NAME.NOTICE,
  component: () => import('./ui/NoticePage.vue'),
}

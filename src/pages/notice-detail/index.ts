import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const noticeDetailRoute: RouteRecordRaw = {
  path: 'notice/:id',
  name: ROUTE_NAME.NOTICE_DETAIL,
  component: () => import('./ui/NoticeDetailPage.vue'),
}

import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const whoDrewRoute: RouteRecordRaw = {
  path: 'who-drew/:roomId',
  name: ROUTE_NAME.WHO_DREW,
  component: () => import('./ui/WhoDrew.vue'),
}

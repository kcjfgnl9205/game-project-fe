import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const sketchPickRoute: RouteRecordRaw = {
  path: 'sketch-pick/:roomId',
  name: ROUTE_NAME.SKETCH_PICK,
  component: () => import('./ui/SketchPick.vue'),
}

import type { RouteRecordRaw } from 'vue-router'
import { ROUTE_NAME } from '@/app/router/router-name'

export const wordChainRoute: RouteRecordRaw = {
  path: 'word-chain/:roomId',
  name: ROUTE_NAME.WORD_CHAIN,
  component: () => import('./ui/WordChain.vue'),
}

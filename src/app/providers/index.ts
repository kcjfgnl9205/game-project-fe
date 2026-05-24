import type { App } from 'vue'
import router from '@/app/router'
import pinia from './store'

export const registerProviders = (app: App) => {
  app.use(pinia)
  app.use(router)
}

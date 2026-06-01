import './styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { registerProviders } from './providers'
import { useTheme } from '@/shared/composables/useTheme'
import { configureAuth } from '@/shared/api'
import { useAuthStore } from '@/shared/stores'

useTheme() // FOUC 방지: 마운트 전에 .dark 클래스 적용

const app = createApp(App)
registerProviders(app) // pinia + router (이후 useAuthStore 사용 가능)

const auth = useAuthStore()
configureAuth({
  getAccessToken: () => auth.accessToken,
  onUnauthorized: () => auth.refresh(),
})

// 세션 복구(refresh)가 끝난 뒤 마운트 — 성공/실패와 무관하게 앱은 띄운다.
auth.init().finally(() => app.mount('#app'))

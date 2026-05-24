import './styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { registerProviders } from './providers'
import { useTheme } from '@/shared/composables/useTheme'

useTheme() // FOUC 방지: 마운트 전에 .dark 클래스 적용

const app = createApp(App)
registerProviders(app)
app.mount('#app')

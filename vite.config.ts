import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import Components from 'unplugin-vue-components/vite'
import { existsSync, readFileSync } from 'node:fs'

const DEV_DOMAIN = 'local.puzmu.com'
const keyPath = fileURLToPath(new URL(`./.certs/${DEV_DOMAIN}-key.pem`, import.meta.url))
const certPath = fileURLToPath(new URL(`./.certs/${DEV_DOMAIN}.pem`, import.meta.url))
const hasCert = existsSync(keyPath) && existsSync(certPath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    // 아이콘 자동 import: <i-local-search /> 처럼 import 없이 사용. 타입은 components.d.ts에 자동 생성.
    Components({
      dts: 'src/components.d.ts',
      resolvers: [IconsResolver({ customCollections: ['local'] })],
    }),
    // 디자이너 커스텀 SVG는 src/shared/ui/icons/ 에 넣으면 local 컬렉션으로 잡힌다.
    // 디자이너가 박아 온 단색 hex(fill/stroke)를 currentColor로 치환해 Tailwind text-* 로 제어한다.
    // (멀티컬러 아이콘은 이 치환이 안 맞을 수 있으니 그때는 별도 컬렉션으로 분리)
    Icons({
      compiler: 'vue3',
      customCollections: {
        local: FileSystemIconLoader('./src/shared/ui/icons', (svg) =>
          svg
            .replace(/fill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"')
            .replace(/stroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"'),
        ),
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [DEV_DOMAIN, 'localhost'],
    https: hasCert ? { key: readFileSync(keyPath), cert: readFileSync(certPath) } : undefined,
    proxy: {
      '/api': {
        target: 'https://dev-api.nolmoa.com/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

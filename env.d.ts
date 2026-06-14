/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/vue" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
  // Google Tag Manager 컨테이너 ID(GTM-XXXX). 운영 CF Pages 프로젝트에만 설정 → 운영에서만 측정.
  readonly VITE_GTM_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Google Tag Manager 로더.
// VITE_GTM_ID가 있을 때만 GTM을 로드한다. → 운영 CF Pages 프로젝트에만 ID를 넣어
// 운영에서만 측정되고, 개발/로컬에는 ID가 없어 아무것도 로드되지 않는다.
declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

export function initGtm(): void {
  const id = import.meta.env.VITE_GTM_ID
  if (!id) return // ID 없으면(개발/로컬) 로드하지 않음

  // GTM 표준 스니펫과 동일: dataLayer 초기화 + gtm.js 비동기 로드
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`
  document.head.appendChild(script)
}

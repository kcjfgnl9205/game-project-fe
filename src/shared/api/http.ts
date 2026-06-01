import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    // 인증 헤더 부착·401 재시도 로직을 건너뛴다 (login/refresh 등)
    skipAuth?: boolean
    // 401 재시도가 이미 한 번 일어난 요청인지 표시 (무한 루프 방지)
    _retry?: boolean
  }
}

/** API 경계에서 발생한 모든 에러를 표준화한 형태. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
    readonly original?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface AuthConfig {
  getAccessToken: () => string | null
  // 401 발생 시 호출. 새 accessToken을 반환하면 원 요청을 재시도한다.
  onUnauthorized: () => Promise<string | null>
}

// store ↔ http 순환참조를 피하려고 콜백을 주입받는다.
let authConfig: AuthConfig | null = null

export function configureAuth(config: AuthConfig): void {
  authConfig = config
}

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // refreshToken 쿠키 자동 전송
  timeout: 15000,
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    const token = authConfig?.getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0
    const body = error.response?.data
    const message =
      (typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : error.message) || '요청을 처리하지 못했습니다.'
    return new ApiError(status, message, body, error)
  }
  return new ApiError(0, '알 수 없는 오류가 발생했습니다.', undefined, error)
}

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = error instanceof AxiosError ? error.config : undefined
    const status = error instanceof AxiosError ? error.response?.status : undefined

    const shouldRefresh =
      status === 401 && config != null && !config.skipAuth && !config._retry && authConfig != null

    if (shouldRefresh) {
      config._retry = true
      const newToken = await authConfig!.onUnauthorized()
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`
        return http(config)
      }
    }

    return Promise.reject(toApiError(error))
  },
)

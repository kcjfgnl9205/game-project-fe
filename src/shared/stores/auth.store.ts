import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/entities/auth/api'
import type { LoginRequest, SignupRequest, User } from '@/entities/auth/model'
import { ApiError } from '@/shared/api'

// 동시에 들어온 refresh 요청을 하나로 합친다 (여러 401이 겹쳐도 /auth/refresh는 한 번만).
let refreshPromise: Promise<string | null> | null = null
// 부트스트랩 세션 복구는 앱 생애주기 동안 한 번만 실행한다.
let initPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => accessToken.value !== null)

  function reset() {
    accessToken.value = null
    user.value = null
  }

  async function login(payload: LoginRequest) {
    error.value = null
    try {
      const { accessToken: token } = await authApi.login(payload)
      accessToken.value = token
      user.value = await authApi.fetchMe()
    } catch (e) {
      reset()
      error.value = e instanceof ApiError ? e.message : '로그인에 실패했습니다.'
      throw e
    }
  }

  async function signup(payload: SignupRequest) {
    error.value = null
    try {
      const { accessToken: token } = await authApi.signup(payload)
      accessToken.value = token
      user.value = await authApi.fetchMe()
    } catch (e) {
      reset()
      error.value = e instanceof ApiError ? e.message : '회원가입에 실패했습니다.'
      throw e
    }
  }

  // 새 accessToken을 반환하면 호출부(인터셉터)가 원 요청을 재시도한다. 실패 시 null.
  function refresh(): Promise<string | null> {
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        const { accessToken: token } = await authApi.refresh()
        accessToken.value = token
        user.value = await authApi.fetchMe()
        return token
      } catch {
        reset()
        return null
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      reset()
    }
  }

  // 새로고침/앱 시작 시 세션 복구. 첫 호출만 실행하고 이후엔 같은 promise를 재사용한다.
  function init(): Promise<void> {
    if (!initPromise) {
      initPromise = refresh().then(() => undefined)
    }
    return initPromise
  }

  return {
    accessToken,
    user,
    error,
    isAuthenticated,
    login,
    signup,
    refresh,
    logout,
    init,
  }
})

import { http } from '@/shared/api'
import type { AuthResponse, LoginRequest, SignupRequest, User } from './model'

export function signup(body: SignupRequest): Promise<AuthResponse> {
  return http.post<AuthResponse>('/auth/signup', body, { skipAuth: true }).then((r) => r.data)
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return http.post<AuthResponse>('/auth/login', body, { skipAuth: true }).then((r) => r.data)
}

// body 없이 호출 — null을 보내면 NestJS가 거부하므로 undefined를 명시한다.
export function refresh(): Promise<AuthResponse> {
  return http
    .post<AuthResponse>('/auth/refresh', undefined, { skipAuth: true })
    .then((r) => r.data)
}

export function logout(): Promise<void> {
  return http.post('/auth/logout').then(() => undefined)
}

export function fetchMe(): Promise<User> {
  return http.get<User>('/users/me').then((r) => r.data)
}

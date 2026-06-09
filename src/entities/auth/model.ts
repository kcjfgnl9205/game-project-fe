export type UserRole = 'USER' | 'ADMIN'
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'APPLE' | 'KAKAO'

export interface User {
  id: string
  nickname: string
  email: string
  role: UserRole
  provider: AuthProvider
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  nickname: string
  password: string
}

/** 로그인·리프레시 공통 응답. refreshToken은 httpOnly 쿠키로만 내려온다. */
export interface AuthResponse {
  accessToken: string
}

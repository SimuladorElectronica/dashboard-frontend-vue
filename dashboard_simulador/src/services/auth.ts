import { api } from './api'
import type { AuthUser, LoginResponse } from './types'

/** POST /auth/login — retorna { access_token } */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

/** POST /auth/register — crea una cuenta STUDENT y retorna { access_token } */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register', { name, email, password })
  return data
}

/** GET /auth/me — perfil del usuario dueño del token */
export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me')
  return data
}

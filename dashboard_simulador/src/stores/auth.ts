import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchMe } from '@/services/auth'
import type { AuthUser } from '@/services/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('jwt_token'))
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('jwt_token', newToken)
  }

  function setUser(newUser: AuthUser | null) {
    user.value = newUser
  }

  /**
   * Carga el perfil (GET /auth/me) si aún no está en memoria.
   * Se usa al montar vistas que necesitan el id/rol del usuario.
   */
  async function fetchUser(): Promise<AuthUser | null> {
    if (user.value) return user.value
    if (!token.value) return null

    try {
      user.value = await fetchMe()
    } catch {
      user.value = null
    }
    return user.value
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('jwt_token')
  }

  return { token, user, isAuthenticated, setToken, setUser, fetchUser, logout }
})

import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchMe } from '@/services/auth'

/**
 * Completa el inicio de sesión en el dashboard:
 * guarda el token, carga el perfil (GET /auth/me) y redirige.
 * Si el perfil no carga, el interceptor 401 se encarga de la sesión.
 */
export function useCompleteLogin() {
  const router = useRouter()
  const authStore = useAuthStore()

  async function completeLogin(accessToken: string): Promise<void> {
    authStore.setToken(accessToken)

    // Cargar el perfil para mostrarlo en el layout
    try {
      authStore.setUser(await fetchMe())
    } catch {
      // Si el perfil no carga, el interceptor 401 se encarga de la sesión
    }

    await router.push({ name: 'dashboard' })
  }

  return { completeLogin }
}

import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para inyectar Token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar tokens expirados/inválidos (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo corta la sesión si había un token guardado: un 401 del login
    // (credenciales inválidas) debe mostrar el error en el formulario.
    const hasSession = !!localStorage.getItem('jwt_token')
    if (error.response?.status === 401 && hasSession) {
      localStorage.removeItem('jwt_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

/**
 * Traduce un error de axios en un mensaje mostrable:
 * usa `message` del backend (NestJS) o un texto genérico.
 */
export function extractApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Probá de nuevo.',
): string {
  const axiosError = error as {
    isAxiosError?: boolean
    response?: { data?: { message?: unknown } }
    message?: string
  }

  const backendMessage = axiosError?.response?.data?.message
  if (typeof backendMessage === 'string' && backendMessage) return backendMessage
  if (Array.isArray(backendMessage) && backendMessage.length > 0) {
    return backendMessage.join(' · ')
  }

  if (axiosError?.isAxiosError && !axiosError.response) {
    return 'No se pudo conectar con el servidor.'
  }

  return fallback
}

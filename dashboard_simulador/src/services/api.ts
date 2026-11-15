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

type ApiErrorShape = { response?: { data?: { message?: unknown } } }

/** Lee `response.data.message` de un error de axios (sin romper con valores no-objeto) */
function readBackendMessage(error: unknown): unknown {
  if (typeof error !== 'object' || error === null) return undefined
  const response = (error as ApiErrorShape).response
  if (!response) return undefined
  const data = response.data
  if (!data) return undefined
  return data.message
}

/** Lee el `message` que manda NestJS en `response.data` (string o array) */
function backendMessageOf(error: unknown): string | null {
  const message = readBackendMessage(error)
  if (typeof message === 'string' && message) return message
  if (Array.isArray(message) && message.length > 0) return message.join(' · ')
  return null
}

/** ¿El error de axios es de red (pedido sin respuesta)? */
function isNetworkError(error: unknown): boolean {
  const axiosError = error as { isAxiosError?: boolean; response?: unknown }
  return !!axiosError?.isAxiosError && !axiosError?.response
}

/**
 * Traduce un error de axios en un mensaje mostrable:
 * usa `message` del backend (NestJS) o un texto genérico.
 */
export function extractApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Probá de nuevo.',
): string {
  const backendMessage = backendMessageOf(error)
  if (backendMessage) return backendMessage
  if (isNetworkError(error)) return 'No se pudo conectar con el servidor.'

  return fallback
}

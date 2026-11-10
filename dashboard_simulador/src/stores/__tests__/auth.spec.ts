import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { fetchMe } from '@/services/auth'

vi.mock('@/services/auth', () => ({
  fetchMe: vi.fn(),
  login: vi.fn(),
}))

const mockedFetchMe = vi.mocked(fetchMe)

const user = { id: 't1', email: 'profe@demo.com', name: 'Profe Demo', role: 'TEACHER' as const }

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useAuthStore', () => {
  it('setToken guarda el JWT en memoria y en localStorage', () => {
    const store = useAuthStore()

    store.setToken('jwt-1')

    expect(store.token).toBe('jwt-1')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('jwt_token')).toBe('jwt-1')
  })

  it('fetchUser trae el perfil una sola vez y lo cachea', async () => {
    mockedFetchMe.mockResolvedValue(user)
    const store = useAuthStore()
    store.setToken('jwt-1')

    const first = await store.fetchUser()
    const second = await store.fetchUser()

    expect(first).toEqual(user)
    expect(second).toEqual(user)
    expect(mockedFetchMe).toHaveBeenCalledTimes(1)
    expect(store.user).toEqual(user)
  })

  it('fetchUser no consulta el backend sin token', async () => {
    const store = useAuthStore()

    const result = await store.fetchUser()

    expect(result).toBeNull()
    expect(mockedFetchMe).not.toHaveBeenCalled()
  })

  it('logout limpia token, perfil y almacenamiento', async () => {
    mockedFetchMe.mockResolvedValue(user)
    const store = useAuthStore()
    store.setToken('jwt-1')
    await store.fetchUser()

    store.logout()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('jwt_token')).toBeNull()
  })
})

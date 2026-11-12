import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMe, login } from '@/services/auth'
import { api } from '@/services/api'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('login', () => {
  it('envía POST /auth/login con email y contraseña', async () => {
    mockedApi.post.mockResolvedValue({ data: { access_token: 'jwt-demo' } })

    const result = await login('profe@demo.com', 'secreto123')

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
      email: 'profe@demo.com',
      password: 'secreto123',
    })
    expect(result.access_token).toBe('jwt-demo')
  })

  it('propaga el error del backend (401 credenciales inválidas)', async () => {
    mockedApi.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Credenciales inválidas' } },
    })

    await expect(login('profe@demo.com', 'mala')).rejects.toMatchObject({
      response: { status: 401 },
    })
  })
})

describe('fetchMe', () => {
  it('consulta GET /auth/me y retorna el perfil', async () => {
    const user = { id: 't1', email: 'profe@demo.com', name: 'Profe Demo', role: 'TEACHER' }
    mockedApi.get.mockResolvedValue({ data: user })

    const result = await fetchMe()

    expect(mockedApi.get).toHaveBeenCalledWith('/auth/me')
    expect(result).toEqual(user)
  })
})

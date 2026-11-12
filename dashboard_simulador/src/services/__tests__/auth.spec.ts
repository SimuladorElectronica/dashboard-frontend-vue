import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMe, login, register } from '@/services/auth'
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

describe('register', () => {
  it('envía POST /auth/register con nombre, email y contraseña', async () => {
    mockedApi.post.mockResolvedValue({ data: { access_token: 'jwt-nuevo' } })

    const result = await register('Ada Lovelace', 'ada@demo.com', 'secreto123')

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Ada Lovelace',
      email: 'ada@demo.com',
      password: 'secreto123',
    })
    expect(result.access_token).toBe('jwt-nuevo')
  })

  it('propaga el error del backend (409 email duplicado)', async () => {
    mockedApi.post.mockRejectedValue({
      response: { status: 409, data: { message: 'El email ya está registrado' } },
    })

    await expect(register('Ada', 'ada@demo.com', 'secreto123')).rejects.toMatchObject({
      response: { status: 409 },
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

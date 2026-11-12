import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import TokenLogin from '@/views/TokenLogin.vue'
import { fetchMe } from '@/services/auth'

const { replace, routeMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  routeMock: { query: {} as Record<string, string | string[] | null | undefined> },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace }),
  useRoute: () => routeMock,
}))

vi.mock('@/services/auth', () => ({
  fetchMe: vi.fn(),
}))

const mockedFetchMe = vi.mocked(fetchMe)

const user = { id: 't1', email: 'profe@demo.com', name: 'Profe Demo', role: 'TEACHER' as const }

function mountTokenLogin() {
  return mount(TokenLogin, {
    global: {
      plugins: [createPinia()],
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  window.location.hash = ''
  routeMock.query = {}
})

describe('TokenLogin.vue — handoff de token desde el simulador', () => {
  it('guarda el token recibido por query param, valida y redirige al dashboard', async () => {
    routeMock.query = { access_token: 'jwt-handoff' }
    mockedFetchMe.mockResolvedValue(user)

    mountTokenLogin()
    await flushPromises()

    expect(localStorage.getItem('jwt_token')).toBe('jwt-handoff')
    expect(mockedFetchMe).toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith({ name: 'dashboard' })
  })

  it('acepta el token por hash fragment (#access_token=) como alternativa', async () => {
    window.location.hash = '#access_token=jwt-hash'
    mockedFetchMe.mockResolvedValue(user)

    mountTokenLogin()
    await flushPromises()

    expect(localStorage.getItem('jwt_token')).toBe('jwt-hash')
    expect(replace).toHaveBeenCalledWith({ name: 'dashboard' })
  })

  it('muestra error si no llega ningún access_token', async () => {
    const wrapper = mountTokenLogin()
    await flushPromises()

    expect(mockedFetchMe).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('access_token')
    expect(localStorage.getItem('jwt_token')).toBeNull()
  })

  it('descarta la sesión y avisa si el token es inválido o expiró', async () => {
    routeMock.query = { access_token: 'jwt-vencido' }
    mockedFetchMe.mockRejectedValue({
      response: { status: 401, data: { message: 'Token inválido' } },
    })

    const wrapper = mountTokenLogin()
    await flushPromises()

    expect(localStorage.getItem('jwt_token')).toBeNull()
    expect(replace).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Token inválido')
  })
})

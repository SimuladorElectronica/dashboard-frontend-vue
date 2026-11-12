import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import Login from '@/views/Login.vue'
import { fetchMe, login } from '@/services/auth'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/services/auth', () => ({
  login: vi.fn(),
  fetchMe: vi.fn(),
}))

const mockedLogin = vi.mocked(login)
const mockedFetchMe = vi.mocked(fetchMe)

const user = { id: 't1', email: 'profe@demo.com', name: 'Profe Demo', role: 'TEACHER' as const }

function mountLogin() {
  return mount(Login, {
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
})

describe('Login.vue', () => {
  it('guarda el JWT y redirige al dashboard con credenciales válidas', async () => {
    mockedLogin.mockResolvedValue({ access_token: 'jwt-demo' })
    mockedFetchMe.mockResolvedValue(user)

    const wrapper = mountLogin()
    await wrapper.find('#email').setValue('profe@demo.com')
    await wrapper.find('#password').setValue('secreto123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedLogin).toHaveBeenCalledWith('profe@demo.com', 'secreto123')
    expect(localStorage.getItem('jwt_token')).toBe('jwt-demo')
    expect(mockedFetchMe).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({ name: 'dashboard' })
    expect(wrapper.find('.error').exists()).toBe(false)
  })

  it('muestra el mensaje del backend cuando las credenciales son inválidas', async () => {
    mockedLogin.mockRejectedValue({
      response: { status: 401, data: { message: 'Credenciales inválidas' } },
    })

    const wrapper = mountLogin()
    await wrapper.find('#email').setValue('profe@demo.com')
    await wrapper.find('#password').setValue('mal-password')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('Credenciales inválidas')
    expect(push).not.toHaveBeenCalled()
    expect(localStorage.getItem('jwt_token')).toBeNull()
  })

  it('deshabilita el botón mientras valida las credenciales', async () => {
    let resolveLogin: (value: { access_token: string }) => void = () => undefined
    mockedLogin.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve
      }),
    )
    mockedFetchMe.mockResolvedValue(user)

    const wrapper = mountLogin()
    await wrapper.find('#email').setValue('profe@demo.com')
    await wrapper.find('#password').setValue('secreto123')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').text()).toContain('Ingresando')

    resolveLogin({ access_token: 'jwt-demo' })
    await flushPromises()

    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import Register from '@/views/Register.vue'
import { fetchMe, register } from '@/services/auth'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/services/auth', () => ({
  register: vi.fn(),
  fetchMe: vi.fn(),
}))

const mockedRegister = vi.mocked(register)
const mockedFetchMe = vi.mocked(fetchMe)

const user = { id: 's1', email: 'ada@demo.com', name: 'Ada Lovelace', role: 'STUDENT' as const }

function mountRegister() {
  return mount(Register, {
    global: {
      plugins: [createPinia()],
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

async function fillForm(
  wrapper: ReturnType<typeof mountRegister>,
  overrides: { name?: string; email?: string; password?: string; confirmPassword?: string } = {},
) {
  const values = {
    name: 'Ada Lovelace',
    email: 'ada@demo.com',
    password: 'secreto123',
    confirmPassword: 'secreto123',
    ...overrides,
  }
  await wrapper.find('#name').setValue(values.name)
  await wrapper.find('#email').setValue(values.email)
  await wrapper.find('#password').setValue(values.password)
  await wrapper.find('#confirm-password').setValue(values.confirmPassword)
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('Register.vue', () => {
  it('crea la cuenta, guarda el JWT y redirige al dashboard', async () => {
    mockedRegister.mockResolvedValue({ access_token: 'jwt-nuevo' })
    mockedFetchMe.mockResolvedValue(user)

    const wrapper = mountRegister()
    await fillForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedRegister).toHaveBeenCalledWith('Ada Lovelace', 'ada@demo.com', 'secreto123')
    expect(localStorage.getItem('jwt_token')).toBe('jwt-nuevo')
    expect(mockedFetchMe).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({ name: 'dashboard' })
    expect(wrapper.find('.error').exists()).toBe(false)
  })

  it('muestra el mensaje del backend cuando el email ya está registrado (409)', async () => {
    mockedRegister.mockRejectedValue({
      response: { status: 409, data: { message: 'El email ya está registrado' } },
    })

    const wrapper = mountRegister()
    await fillForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('El email ya está registrado')
    expect(push).not.toHaveBeenCalled()
    expect(localStorage.getItem('jwt_token')).toBeNull()
  })

  it('valida que la contraseña tenga al menos 8 caracteres sin llamar al backend', async () => {
    const wrapper = mountRegister()
    await fillForm(wrapper, { password: 'corta', confirmPassword: 'corta' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedRegister).not.toHaveBeenCalled()
    expect(wrapper.find('.error').text()).toContain('8 caracteres')
    expect(push).not.toHaveBeenCalled()
  })

  it('valida que las contraseñas coincidan sin llamar al backend', async () => {
    const wrapper = mountRegister()
    await fillForm(wrapper, { confirmPassword: 'otra-clave-distinta' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedRegister).not.toHaveBeenCalled()
    expect(wrapper.find('.error').text()).toContain('no coinciden')
    expect(push).not.toHaveBeenCalled()
  })

  it('deshabilita el botón mientras crea la cuenta', async () => {
    let resolveRegister: (value: { access_token: string }) => void = () => undefined
    mockedRegister.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = resolve
      }),
    )
    mockedFetchMe.mockResolvedValue(user)

    const wrapper = mountRegister()
    await fillForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').text()).toContain('Creando cuenta')

    resolveRegister({ access_token: 'jwt-nuevo' })
    await flushPromises()

    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })
})

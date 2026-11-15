import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import MainLayout from '@/layouts/MainLayout.vue'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

function mountLayout() {
  return mount(MainLayout, {
    global: {
      plugins: [createPinia()],
      stubs: {
        RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' },
      },
    },
    slots: { default: '<p>contenido de la página</p>' },
  })
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('MainLayout.vue', () => {
  it('renderiza el menú, el topbar y el contenido de la página', () => {
    const wrapper = mountLayout()

    expect(wrapper.find('.sidebar').exists()).toBe(true)
    expect(wrapper.find('.topbar').exists()).toBe(true)
    expect(wrapper.text()).toContain('contenido de la página')
    expect(wrapper.text()).toContain('Nuevo proyecto')
    expect(wrapper.text()).toContain('Cerrar Sesión')
  })

  it('abre el simulador en blanco cuando no hay sesión', () => {
    const wrapper = mountLayout()

    expect(wrapper.find('.new-project-btn').attributes('href')).toBe('http://localhost:5174/new')
  })

  it('abre el simulador con el token de la sesión cuando existe', () => {
    localStorage.setItem('jwt_token', 'jwt-demo')

    const wrapper = mountLayout()

    expect(wrapper.find('.new-project-btn').attributes('href')).toBe(
      'http://localhost:5174/session/jwt-demo?new=1',
    )
  })

  it('alterna el menú lateral al pulsar el botón del topbar', async () => {
    const wrapper = mountLayout()
    const sidebar = wrapper.find('.sidebar')

    expect(sidebar.classes()).not.toContain('is-closed')

    await wrapper.find('.icon-btn').trigger('click')
    expect(sidebar.classes()).toContain('is-closed')

    await wrapper.find('.icon-btn').trigger('click')
    expect(sidebar.classes()).not.toContain('is-closed')
  })

  it('cierra la sesión y vuelve al login', async () => {
    localStorage.setItem('jwt_token', 'jwt-demo')
    const wrapper = mountLayout()

    await wrapper.find('.logout-btn').trigger('click')

    expect(localStorage.getItem('jwt_token')).toBeNull()
    expect(push).toHaveBeenCalledWith('/login')
  })
})

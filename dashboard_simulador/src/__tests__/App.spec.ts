import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '@/App.vue'

const { routeMock, push } = vi.hoisted(() => ({
  routeMock: { meta: {} as Record<string, string> },
  push: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => ({ push }),
}))

function mountApp() {
  return mount(App, {
    global: {
      plugins: [createPinia()],
      stubs: {
        RouterView: { template: '<div class="view-stub" />' },
        RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' },
      },
    },
  })
}

describe('App.vue — selección de layout', () => {
  it('usa AuthLayout para las rutas de autenticación', () => {
    routeMock.meta = { layout: 'AuthLayout' }

    const wrapper = mountApp()

    expect(wrapper.find('.auth-container').exists()).toBe(true)
    expect(wrapper.find('.view-stub').exists()).toBe(true)
  })

  it('usa MainLayout para las rutas internas', () => {
    routeMock.meta = { layout: 'MainLayout' }

    const wrapper = mountApp()

    expect(wrapper.find('.layout-container').exists()).toBe(true)
  })

  it('cae en MainLayout cuando la ruta no declara layout', () => {
    routeMock.meta = {}

    const wrapper = mountApp()

    expect(wrapper.find('.layout-container').exists()).toBe(true)
  })
})

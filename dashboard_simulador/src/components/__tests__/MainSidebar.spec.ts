import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MainSidebar from '@/components/MainSidebar.vue'

function mountSidebar(isSidebarClosed = false) {
  return mount(MainSidebar, {
    props: { isSidebarClosed },
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' },
      },
    },
  })
}

describe('MainSidebar.vue', () => {
  it('muestra los cuatro accesos del menú', () => {
    const wrapper = mountSidebar()
    const links = wrapper.findAll('.nav-link')

    expect(links).toHaveLength(4)
    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/',
      '/aulas',
      '/guias',
      '/proyectos',
    ])
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Gestión de Aulas')
    expect(wrapper.text()).toContain('Guías Prácticas')
    expect(wrapper.text()).toContain('Mis Proyectos')
  })

  it('usa el componente NavIcon en la marca y en cada enlace', () => {
    const wrapper = mountSidebar()

    expect(wrapper.findAll('svg')).toHaveLength(5)
    expect(wrapper.find('.brand-mark svg').exists()).toBe(true)
    expect(wrapper.findAll('.nav-link svg')).toHaveLength(4)
  })

  it('refleja el estado cerrado del menú', async () => {
    const wrapper = mountSidebar()

    expect(wrapper.find('aside').classes()).not.toContain('is-closed')

    await wrapper.setProps({ isSidebarClosed: true })

    expect(wrapper.find('aside').classes()).toContain('is-closed')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import Projects from '@/views/Projects.vue'
import { listProjects } from '@/services/projects'
import type { ProjectSummary } from '@/services/types'

vi.mock('@/services/projects', () => ({
  listProjects: vi.fn(),
  extractProjectKey: vi.fn(),
  getProjectByKey: vi.fn(),
  resolveStarterProjectId: vi.fn(),
  isProjectKey: vi.fn(),
}))

const mockedListProjects = vi.mocked(listProjects)

const mine: ProjectSummary = {
  id: 'p1',
  shareSlug: 'a9f3b2',
  title: 'Amplificador operacional',
  description: 'Práctica 3 — fuente de tensión',
  isPublic: false,
  userId: 'u1',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-05T15:30:00.000Z',
}

const shared: ProjectSummary = {
  id: 'p2',
  shareSlug: 'b7c4de',
  title: 'LED parpadeante',
  description: null,
  isPublic: true,
  userId: 'u1',
  createdAt: '2026-11-02T08:00:00.000Z',
  updatedAt: '2026-11-02T08:00:00.000Z',
}

function mountProjects() {
  return mount(Projects, { global: { plugins: [createPinia()] } })
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('jwt_token', 'jwt-demo')
  vi.clearAllMocks()

  mockedListProjects.mockResolvedValue([mine, shared])
})

describe('Projects.vue — listado de proyectos del usuario', () => {
  it('carga los proyectos propios y muestra sus datos', async () => {
    const wrapper = mountProjects()
    await flushPromises()

    expect(mockedListProjects).toHaveBeenCalledTimes(1)
    expect(wrapper.find('#projects-table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Amplificador operacional')
    expect(wrapper.text()).toContain('Práctica 3 — fuente de tensión')
    expect(wrapper.text()).toContain('LED parpadeante')
    expect(wrapper.text()).toContain('/share/a9f3b2')
  })

  it('muestra la visibilidad de cada proyecto', async () => {
    const wrapper = mountProjects()
    await flushPromises()

    const cells = wrapper.findAll('#projects-table tbody tr')
    expect(cells[0].text()).toContain('Privado')
    expect(cells[1].text()).toContain('Público')
  })

  it('muestra la fecha de actualización como <time> con datetime', async () => {
    const wrapper = mountProjects()
    await flushPromises()

    const time = wrapper.find('#projects-table time')
    expect(time.exists()).toBe(true)
    expect(time.attributes('datetime')).toBe('2026-11-05T15:30:00.000Z')
  })

  it('recarga el listado al pulsar Actualizar', async () => {
    const wrapper = mountProjects()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Actualizar')
      ?.trigger('click')
    await flushPromises()

    expect(mockedListProjects).toHaveBeenCalledTimes(2)
  })

  it('ofrece el estado vacío cuando todavía no hay proyectos', async () => {
    mockedListProjects.mockResolvedValue([])

    const wrapper = mountProjects()
    await flushPromises()

    expect(wrapper.find('#projects-table').exists()).toBe(false)
    expect(wrapper.text()).toContain('Todavía no tenés proyectos')
  })

  it('muestra el error del backend si la petición falla', async () => {
    mockedListProjects.mockRejectedValue({
      response: { status: 500, data: { message: 'Error interno' } },
    })

    const wrapper = mountProjects()
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('Error interno')
  })
})

describe('Projects.vue — abrir proyecto en el simulador React', () => {
  it('el enlace "Abrir" apunta a /p/:shareSlug del simulador', async () => {
    const wrapper = mountProjects()
    await flushPromises()

    const link = wrapper.find('#projects-table tbody tr a.btn')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('http://localhost:5174/p/a9f3b2')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener')
  })

  it('al hacer clic en la fila abre el proyecto en una pestaña nueva', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)

    const wrapper = mountProjects()
    await flushPromises()

    await wrapper.find('#projects-table tbody tr').trigger('click')

    expect(openSpy).toHaveBeenCalledWith('http://localhost:5174/p/a9f3b2', '_blank', 'noopener')

    openSpy.mockRestore()
  })

  it('el enlace detiene la propagación para no duplicar la apertura', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)

    const wrapper = mountProjects()
    await flushPromises()

    await wrapper.find('#projects-table tbody tr a.btn').trigger('click')

    // @click.stop evita que el clic llegue a la fila (que es lo que llama a window.open)
    expect(openSpy).not.toHaveBeenCalled()

    openSpy.mockRestore()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import Projects from '@/views/Projects.vue'
import { listProjects, setProjectTemplate } from '@/services/projects'
import { fetchMe } from '@/services/auth'
import type { ProjectSummary } from '@/services/types'

vi.mock('@/services/projects', () => ({
  listProjects: vi.fn(),
  setProjectTemplate: vi.fn(),
  extractProjectKey: vi.fn(),
  getProjectByKey: vi.fn(),
  resolveStarterProjectId: vi.fn(),
  isProjectKey: vi.fn(),
}))

vi.mock('@/services/auth', () => ({
  login: vi.fn(),
  fetchMe: vi.fn(),
}))

const mockedListProjects = vi.mocked(listProjects)
const mockedSetProjectTemplate = vi.mocked(setProjectTemplate)
const mockedFetchMe = vi.mocked(fetchMe)

const teacher = { id: 'u1', email: 'profe@demo.com', name: 'Profe Demo', role: 'TEACHER' as const }
const admin = { id: 'admin1', email: 'admin@demo.com', name: 'Admin Demo', role: 'ADMIN' as const }
const student = { id: 'u2', email: 'alumno@demo.com', name: 'Alumno Demo', role: 'STUDENT' as const }

const mine: ProjectSummary = {
  id: 'p1',
  shareSlug: 'a9f3b2',
  title: 'Amplificador operacional',
  description: 'Práctica 3 — fuente de tensión',
  isPublic: false,
  isTemplate: false,
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
  isTemplate: false,
  userId: 'u1',
  createdAt: '2026-11-02T08:00:00.000Z',
  updatedAt: '2026-11-02T08:00:00.000Z',
}

const templateProject: ProjectSummary = {
  ...shared,
  id: 'p3',
  shareSlug: 'c3e5f6',
  title: 'Divisor de tensión',
  isTemplate: true,
}

function mountProjects() {
  return mount(Projects, { global: { plugins: [createPinia()] } })
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('jwt_token', 'jwt-demo')
  vi.clearAllMocks()

  mockedFetchMe.mockResolvedValue(teacher)
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

    const link = wrapper.find('#projects-table tbody tr a.btn-link')
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

    await wrapper.find('#projects-table tbody tr a.btn-link').trigger('click')

    // @click.stop evita que el clic llegue a la fila (que es lo que llama a window.open)
    expect(openSpy).not.toHaveBeenCalled()

    openSpy.mockRestore()
  })
})

describe('Projects.vue — plantillas (PATCH /projects/:id/template)', () => {
  it('el docente dueño ve el toggle de plantilla en sus proyectos', async () => {
    const wrapper = mountProjects()
    await flushPromises()

    const toggles = wrapper.findAll('.template-toggle')
    expect(toggles).toHaveLength(2)
    expect(toggles[0].attributes('aria-pressed')).toBe('false')
  })

  it('el admin ve el toggle aunque no sea el dueño del proyecto', async () => {
    mockedFetchMe.mockResolvedValue(admin)

    const wrapper = mountProjects()
    await flushPromises()

    expect(wrapper.findAll('.template-toggle')).toHaveLength(2)
  })

  it('el alumno no ve el toggle de plantilla', async () => {
    mockedFetchMe.mockResolvedValue(student)

    const wrapper = mountProjects()
    await flushPromises()

    expect(wrapper.findAll('.template-toggle')).toHaveLength(0)
  })

  it('el docente no ve el toggle en proyectos de otro usuario', async () => {
    mockedListProjects.mockResolvedValue([{ ...mine, userId: 'otro-docente' }])

    const wrapper = mountProjects()
    await flushPromises()

    expect(wrapper.findAll('.template-toggle')).toHaveLength(0)
  })

  it('al marcar como plantilla llama a PATCH y refleja el estado', async () => {
    mockedSetProjectTemplate.mockResolvedValue({
      ...mine,
      isTemplate: true,
      circuitData: {},
      code: 'void setup() {}',
    })

    const wrapper = mountProjects()
    await flushPromises()

    await wrapper.findAll('.template-toggle')[0].trigger('click')
    await flushPromises()

    expect(mockedSetProjectTemplate).toHaveBeenCalledWith('p1', true)
    expect(wrapper.text()).toContain('"Amplificador operacional" marcado como plantilla')
    // El estado se refleja: pill "Plantilla" y enlace al modo invitado
    expect(wrapper.find('.template-pill').exists()).toBe(true)
    const guestLink = wrapper
      .findAll('a')
      .find((link) => link.attributes('href') === 'http://localhost:5174/plantillas/a9f3b2')
    expect(guestLink?.exists()).toBe(true)
  })

  it('muestra el mensaje del backend cuando el PATCH responde 403', async () => {
    mockedSetProjectTemplate.mockRejectedValue({
      response: {
        status: 403,
        data: { message: 'solo un administrador o el docente dueño puede marcar plantillas' },
      },
    })

    const wrapper = mountProjects()
    await flushPromises()

    await wrapper.findAll('.template-toggle')[0].trigger('click')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain(
      'solo un administrador o el docente dueño puede marcar plantillas',
    )
  })

  it('muestra un mensaje de conexión cuando falla la red', async () => {
    mockedSetProjectTemplate.mockRejectedValue({ isAxiosError: true, message: 'Network Error' })

    const wrapper = mountProjects()
    await flushPromises()

    await wrapper.findAll('.template-toggle')[0].trigger('click')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain('No se pudo conectar con el servidor.')
  })

  it('un proyecto marcado como plantilla ofrece el enlace invitado y "Copiar enlace"', async () => {
    mockedListProjects.mockResolvedValue([templateProject])

    const wrapper = mountProjects()
    await flushPromises()

    const guestLink = wrapper
      .findAll('a')
      .find((link) => link.attributes('href') === 'http://localhost:5174/plantillas/c3e5f6')
    expect(guestLink?.exists()).toBe(true)
    expect(guestLink?.attributes('target')).toBe('_blank')
    expect(guestLink?.attributes('rel')).toBe('noopener')

    const copyButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Copiar enlace')
    expect(copyButton?.exists()).toBe(true)
  })

  it('"Copiar enlace" escribe la URL de la plantilla en el portapapeles', async () => {
    mockedListProjects.mockResolvedValue([templateProject])
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const wrapper = mountProjects()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Copiar enlace')
      ?.trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('http://localhost:5174/plantillas/c3e5f6')
    expect(wrapper.text()).toContain('Enlace de la plantilla copiado al portapapeles')
  })
})

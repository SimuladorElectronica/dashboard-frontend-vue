import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import Dashboard from '@/views/Dashboard.vue'
import { listProjects } from '@/services/projects'
import { listGuides } from '@/services/guides'
import { listSubmissions } from '@/services/submissions'
import { fetchMe } from '@/services/auth'
import type { ProjectSummary } from '@/services/types'

vi.mock('@/services/projects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/projects')>()
  return { ...actual, listProjects: vi.fn() }
})

vi.mock('@/services/guides', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/guides')>()
  return { ...actual, listGuides: vi.fn() }
})

vi.mock('@/services/submissions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/submissions')>()
  return { ...actual, listSubmissions: vi.fn() }
})

vi.mock('@/services/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/auth')>()
  return { ...actual, fetchMe: vi.fn() }
})

const mockedListProjects = vi.mocked(listProjects)
const mockedListGuides = vi.mocked(listGuides)
const mockedListSubmissions = vi.mocked(listSubmissions)
const mockedFetchMe = vi.mocked(fetchMe)

const userStudent = { id: 'u1', email: 'alumno@demo.com', name: 'Alumno Demo', role: 'STUDENT' }
const userTeacher = { id: 't1', email: 'profe@demo.com', name: 'Profe Demo', role: 'TEACHER' }
const userAdmin = { id: 'a1', email: 'admin@demo.com', name: 'Admin Demo', role: 'ADMIN' }

const project: ProjectSummary = {
  id: 'p1',
  shareSlug: 'a9f3b2',
  title: 'Base LED',
  description: 'Circuito inicial',
  isPublic: true,
  isTemplate: false,
  userId: 't1',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

const guide = {
  id: 'g1',
  title: 'Práctica 1 — LED parpadeante',
  instructions: 'Conectá un LED al pin 13',
  teacherId: 't1',
  starterProjectId: 'p1',
  classroomId: 'c1',
  createdAt: '2026-11-05T10:00:00.000Z',
  teacher: { id: 't1', name: 'Profe Demo' },
  classroom: { id: 'c1', name: '5to año' },
  starterProject: { id: 'p1', title: 'Base LED', shareSlug: 'a9f3b2' },
}

const submission = {
  id: 's1',
  guideId: 'g1',
  studentId: 'u2',
  projectId: 'p2',
  submittedAt: '2026-11-09T12:00:00.000Z',
  guide: { id: 'g1', title: 'Práctica 1 — LED parpadeante' },
  project: { id: 'p2', title: 'Entrega de Juan', shareSlug: 'b7c4de' },
  student: { id: 'u2', name: 'Juan', email: 'juan@demo.com' },
}

function mountDashboard() {
  return mount(Dashboard, {
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
  localStorage.setItem('jwt_token', 'jwt-demo')
  vi.clearAllMocks()
})

describe('Dashboard.vue', () => {
  describe('Vista del alumno', () => {
    beforeEach(() => {
      mockedFetchMe.mockResolvedValue(userStudent)
      mockedListProjects.mockResolvedValue([project])
      mockedListGuides.mockResolvedValue([guide])
      mockedListSubmissions.mockResolvedValue({ items: [], total: 0 })
    })

    it('muestra proyectos y guías', async () => {
      const wrapper = mountDashboard()
      await flushPromises()

      expect(wrapper.text()).toContain('Tus proyectos recientes')
      expect(wrapper.text()).toContain('Base LED')
      expect(wrapper.text()).toContain('Práctica 1')
      expect(wrapper.text()).toContain('5to año')
    })

    it('el botón "Abrir ↗" abre el simulador con el shareSlug', async () => {
      const wrapper = mountDashboard()
      await flushPromises()

      const link = wrapper.find('.btn-primary')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('http://localhost:5174/p/a9f3b2')
    })

    it('muestra estado vacío cuando no hay proyectos', async () => {
      mockedListProjects.mockResolvedValue([])
      const wrapper = mountDashboard()
      await flushPromises()

      expect(wrapper.text()).toContain('Aún no trabajaste en ningún proyecto.')
    })

    it('muestra estado vacío cuando no hay guías', async () => {
      mockedListGuides.mockResolvedValue([])
      const wrapper = mountDashboard()
      await flushPromises()

      expect(wrapper.text()).toContain(
        'No hay guías nuevas en las aulas en las que estás inscripto.',
      )
    })
  })

  describe('Vista del docente', () => {
    beforeEach(() => {
      mockedFetchMe.mockResolvedValue(userTeacher)
      mockedListProjects.mockResolvedValue([project])
      mockedListGuides.mockResolvedValue([guide])
      mockedListSubmissions.mockResolvedValue({ items: [submission], total: 1 })
    })

    it('muestra proyectos y entregas', async () => {
      const wrapper = mountDashboard()
      await flushPromises()

      expect(wrapper.text()).toContain('Tus proyectos recientes')
      expect(wrapper.text()).toContain('Base LED')
      expect(wrapper.text()).toContain('Juan')
      expect(wrapper.text()).toContain('Práctica 1')
    })

    it('el botón de la entrega abre el proyecto en el simulador', async () => {
      const wrapper = mountDashboard()
      await flushPromises()

      const link = wrapper.find('.submissions-table .btn-primary')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('http://localhost:5174/p/b7c4de')
    })

    it('muestra estado vacío cuando no hay entregas', async () => {
      mockedListSubmissions.mockResolvedValue({ items: [], total: 0 })
      const wrapper = mountDashboard()
      await flushPromises()

      expect(wrapper.text()).toContain('Todavía no recibiste entregas en tus guías.')
    })
  })

  describe('Vista del admin', () => {
    beforeEach(() => {
      mockedFetchMe.mockResolvedValue(userAdmin)
      mockedListProjects.mockResolvedValue([project])
      mockedListGuides.mockResolvedValue([])
      mockedListSubmissions.mockResolvedValue({ items: [], total: 0 })
    })

    it('muestra solo proyectos y un mensaje neutro', async () => {
      const wrapper = mountDashboard()
      await flushPromises()

      expect(wrapper.text()).toContain('Panel no disponible')
      expect(wrapper.text()).toContain('Tus proyectos recientes')
      expect(wrapper.text()).not.toContain('Práctica 1')
      expect(wrapper.text()).not.toContain('Últimas entregas')
    })
  })
})

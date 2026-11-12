import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import Guides from '@/views/Guides.vue'
import { createGuide, deleteGuide, listGuides, updateGuide } from '@/services/guides'
import { listProjects, resolveStarterProjectId } from '@/services/projects'
import { listSubmissions } from '@/services/submissions'
import { fetchMe } from '@/services/auth'
import type { Guide, ProjectSummary, Submission } from '@/services/types'

vi.mock('@/services/guides', () => ({
  listGuides: vi.fn(),
  createGuide: vi.fn(),
  updateGuide: vi.fn(),
  deleteGuide: vi.fn(),
}))

vi.mock('@/services/projects', () => ({
  listProjects: vi.fn(),
  resolveStarterProjectId: vi.fn(),
}))

vi.mock('@/services/submissions', () => ({
  listSubmissions: vi.fn(),
}))

vi.mock('@/services/auth', () => ({
  login: vi.fn(),
  fetchMe: vi.fn(),
}))

const mockedListGuides = vi.mocked(listGuides)
const mockedListProjects = vi.mocked(listProjects)
const mockedListSubmissions = vi.mocked(listSubmissions)
const mockedCreateGuide = vi.mocked(createGuide)
const mockedUpdateGuide = vi.mocked(updateGuide)
const mockedDeleteGuide = vi.mocked(deleteGuide)
const mockedResolveStarterProjectId = vi.mocked(resolveStarterProjectId)
const mockedFetchMe = vi.mocked(fetchMe)

const user = { id: 't1', email: 'profe@demo.com', name: 'Profe Demo', role: 'TEACHER' as const }

const project: ProjectSummary = {
  id: 'p1',
  shareSlug: 'a9f3b2',
  title: 'Base LED',
  description: 'Circuito inicial',
  isPublic: true,
  userId: 't1',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

const guide: Guide = {
  id: 'g1',
  title: 'Práctica 1 — LED parpadeante',
  instructions: 'Conectá un LED al pin 13',
  teacherId: 't1',
  starterProjectId: 'p1',
  createdAt: '2026-11-05T10:00:00.000Z',
  teacher: { id: 't1', name: 'Profe Demo' },
  starterProject: { id: 'p1', title: 'Base LED', shareSlug: 'a9f3b2' },
}

const submission: Submission = {
  id: 's1',
  guideId: 'g1',
  studentId: 'u1',
  projectId: 'p2',
  submittedAt: '2026-11-09T12:00:00.000Z',
  guide: { id: 'g1', title: guide.title },
  project: { id: 'p2', title: 'Entrega de Juan', shareSlug: 'b7c4de' },
  student: { id: 'u1', name: 'Juan Pérez', email: 'juan@demo.com' },
}

function mountGuides() {
  return mount(Guides, { global: { plugins: [createPinia()] } })
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('jwt_token', 'jwt-demo')
  vi.clearAllMocks()

  mockedFetchMe.mockResolvedValue(user)
  mockedListGuides.mockResolvedValue([guide])
  mockedListProjects.mockResolvedValue([project])
  mockedListSubmissions.mockResolvedValue({ items: [submission], total: 1 })
})

describe('Guides.vue — listado y tablas', () => {
  it('carga sus guías por teacherId y muestra el listado con el circuito plantilla', async () => {
    const wrapper = mountGuides()
    await flushPromises()

    expect(mockedListGuides).toHaveBeenCalledWith('t1')
    expect(wrapper.text()).toContain('Práctica 1 — LED parpadeante')
    expect(wrapper.text()).toContain('Base LED')
    expect(wrapper.text()).toContain('/share/a9f3b2')
  })

  it('muestra la tabla de alumnos con los datos de cada entrega', async () => {
    const wrapper = mountGuides()
    await flushPromises()

    expect(mockedListSubmissions).toHaveBeenCalledWith({ guideId: undefined, take: 100 })
    expect(wrapper.text()).toContain('Alumnos inscritos')
    expect(wrapper.text()).toContain('Juan Pérez')
    expect(wrapper.text()).toContain('juan@demo.com')
  })

  it('ofrece el estado vacío cuando todavía no hay guías', async () => {
    mockedListGuides.mockResolvedValue([])
    mockedListSubmissions.mockResolvedValue({ items: [], total: 0 })

    const wrapper = mountGuides()
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no creaste guías')
    expect(wrapper.text()).toContain('Ningún alumno entregó todavía')
  })
})

describe('Guides.vue — alta de guía (criterio de aceptación)', () => {
  it('crea una guía eligiendo el proyecto plantilla del selector', async () => {
    const wrapper = mountGuides()
    await flushPromises()

    await wrapper.find('#guide-title').setValue('Práctica 2 — Sensor de luz')
    await wrapper.find('#guide-instructions').setValue('Conectá el sensor al pin A0')
    const select = wrapper.find('#guide-project')
    ;(select.element as HTMLSelectElement).value = 'p1'
    await select.trigger('change')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedCreateGuide).toHaveBeenCalledWith({
      title: 'Práctica 2 — Sensor de luz',
      instructions: 'Conectá el sensor al pin A0',
      starterProjectId: 'p1',
    })
    expect(mockedResolveStarterProjectId).not.toHaveBeenCalled()
    expect(wrapper.find('.notice').text()).toContain('Guía creada correctamente')
  })

  it('crea una guía asociando una URL de plantilla pegada por el docente', async () => {
    mockedResolveStarterProjectId.mockResolvedValue('p-resuelto')

    const wrapper = mountGuides()
    await flushPromises()

    await wrapper.find('#guide-title').setValue('Práctica 3 — Botón')
    await wrapper.find('#guide-instructions').setValue('Simulá el pulsador')
    await wrapper.find('#guide-url').setValue('http://localhost:5173/share/a9f3b2')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedResolveStarterProjectId).toHaveBeenCalledWith('http://localhost:5173/share/a9f3b2')
    expect(mockedCreateGuide).toHaveBeenCalledWith({
      title: 'Práctica 3 — Botón',
      instructions: 'Simulá el pulsador',
      starterProjectId: 'p-resuelto',
    })
  })

  it('no envía el formulario si faltan título, consigna o plantilla', async () => {
    const wrapper = mountGuides()
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(mockedCreateGuide).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Ingresá un título para la guía')
    expect(wrapper.text()).toContain('Ingresá la consigna para el alumno')
    expect(wrapper.text()).toContain('Asociá un proyecto plantilla')
  })

  it('muestra el error del backend si la plantilla no existe', async () => {
    mockedCreateGuide.mockRejectedValue({
      response: {
        status: 404,
        data: { message: 'No existe un proyecto público con el enlace "zzzzzz"' },
      },
    })

    const wrapper = mountGuides()
    await flushPromises()

    await wrapper.find('#guide-title').setValue('Práctica 4')
    await wrapper.find('#guide-instructions').setValue('Consigna')
    await wrapper.find('#guide-url').setValue('http://localhost:5173/share/zzzzzz')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.error').text()).toContain(
      'No existe un proyecto público con el enlace "zzzzzz"',
    )
  })
})

describe('Guides.vue — edición y borrado', () => {
  it('prellena el formulario al editar y envía PUT /guides/:id', async () => {
    const wrapper = mountGuides()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Editar')
      ?.trigger('click')

    expect(wrapper.find('#guide-title').element.value).toBe(guide.title)
    expect(wrapper.find('#guide-instructions').element.value).toBe(guide.instructions)
    expect(wrapper.find('form').text()).toBeTruthy()

    await wrapper.find('#guide-title').setValue('Práctica 1 editada')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedUpdateGuide).toHaveBeenCalledWith('g1', {
      title: 'Práctica 1 editada',
      instructions: guide.instructions,
      starterProjectId: 'p1',
    })
    expect(wrapper.find('.notice').text()).toContain('Guía actualizada correctamente')
  })

  it('elimina la guía tras confirmar y refresca el listado', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockedDeleteGuide.mockResolvedValue(undefined)

    const wrapper = mountGuides()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Eliminar')
      ?.trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockedDeleteGuide).toHaveBeenCalledWith('g1')
    expect(wrapper.find('.notice').text()).toContain('Guía eliminada')

    confirmSpy.mockRestore()
  })

  it('no elimina nada si el docente cancela la confirmación', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    const wrapper = mountGuides()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Eliminar')
      ?.trigger('click')
    await flushPromises()

    expect(mockedDeleteGuide).not.toHaveBeenCalled()

    confirmSpy.mockRestore()
  })
})

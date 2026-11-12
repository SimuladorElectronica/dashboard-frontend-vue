import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import Aulas from '@/views/Aulas.vue'
import {
  createClassroom,
  deleteClassroom,
  joinClassroom,
  listClassroomStudents,
  listClassrooms,
  regenerateClassroomCode,
  removeClassroomStudent,
} from '@/services/classrooms'
import { listGuides } from '@/services/guides'
import { fetchMe } from '@/services/auth'
import type { Classroom, ClassroomStudent, Guide } from '@/services/types'

vi.mock('@/services/classrooms', () => ({
  listClassrooms: vi.fn(),
  createClassroom: vi.fn(),
  listClassroomStudents: vi.fn(),
  joinClassroom: vi.fn(),
  regenerateClassroomCode: vi.fn(),
  removeClassroomStudent: vi.fn(),
  deleteClassroom: vi.fn(),
  getClassroom: vi.fn(),
}))

vi.mock('@/services/guides', () => ({
  listGuides: vi.fn(),
}))

vi.mock('@/services/auth', () => ({
  login: vi.fn(),
  fetchMe: vi.fn(),
}))

const mockedJoinClassroom = vi.mocked(joinClassroom)
const mockedListGuides = vi.mocked(listGuides)
const mockedListClassrooms = vi.mocked(listClassrooms)
const mockedCreateClassroom = vi.mocked(createClassroom)
const mockedListStudents = vi.mocked(listClassroomStudents)
const mockedRegenerateCode = vi.mocked(regenerateClassroomCode)
const mockedRemoveStudent = vi.mocked(removeClassroomStudent)
const mockedDeleteClassroom = vi.mocked(deleteClassroom)
const mockedFetchMe = vi.mocked(fetchMe)

const teacher = { id: 't1', email: 'profe@demo.com', name: 'Profe Demo', role: 'TEACHER' as const }

const classroom: Classroom = {
  id: 'c1',
  name: '5to año — comisión A',
  createdAt: '2026-11-01T10:00:00.000Z',
  teacher: { id: 't1', name: 'Profe Demo' },
  memberCount: 2,
  guideCount: 1,
  code: 'abc123',
}

const studentRow: ClassroomStudent = {
  id: 'u1',
  name: 'Juan Pérez',
  email: 'juan@demo.com',
  joinedAt: '2026-11-02T09:00:00.000Z',
}

function mountAulas() {
  return mount(Aulas, {
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

  mockedFetchMe.mockResolvedValue(teacher)
  mockedListClassrooms.mockResolvedValue([classroom])
  mockedListStudents.mockResolvedValue([studentRow])
  mockedListGuides.mockResolvedValue([])
})

describe('Aulas.vue — vista del docente', () => {
  it('lista sus aulas con el código, contadores y el docente dueño', async () => {
    const wrapper = mountAulas()
    await flushPromises()

    expect(mockedListClassrooms).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Mis aulas')
    expect(wrapper.text()).toContain('5to año — comisión A')
    expect(wrapper.text()).toContain('abc123')
    const cells = wrapper.findAll('#classrooms-table tbody td')
    expect(cells[2]?.text()).toBe('2') // Alumnos inscriptos
    expect(cells[3]?.text()).toBe('1') // Guías vinculadas
  })

  it('crea un aula y muestra el código de unión recién generado', async () => {
    mockedCreateClassroom.mockResolvedValue({
      ...classroom,
      id: 'c2',
      name: '6to B',
      code: 'xyz987',
    })

    const wrapper = mountAulas()
    await flushPromises()

    await wrapper.find('#classroom-name').setValue('6to B')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedCreateClassroom).toHaveBeenCalledWith('6to B')
    expect(wrapper.text()).toContain('xyz987')
    expect(wrapper.find('.code-callout').exists()).toBe(true)
  })

  it('no envía la creación si el nombre está vacío', async () => {
    const wrapper = mountAulas()
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedCreateClassroom).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Ingresá un nombre para el aula')
  })

  it('muestra los alumnos inscriptos al expandir el aula y permite quitarlos', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockedRemoveStudent.mockResolvedValue(undefined)

    const wrapper = mountAulas()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Alumnos')
      ?.trigger('click')
    await flushPromises()

    expect(mockedListStudents).toHaveBeenCalledWith('c1')
    expect(wrapper.text()).toContain('Juan Pérez')
    expect(wrapper.text()).toContain('juan@demo.com')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Quitar')
      ?.trigger('click')
    await flushPromises()

    expect(mockedRemoveStudent).toHaveBeenCalledWith('c1', 'u1')
    expect(wrapper.text()).not.toContain('juan@demo.com')

    confirmSpy.mockRestore()
  })

  it('regenera el código del aula tras confirmar', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockedRegenerateCode.mockResolvedValue({ id: 'c1', code: 'nuevo6' })

    const wrapper = mountAulas()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Regenerar código')
      ?.trigger('click')
    await flushPromises()

    expect(mockedRegenerateCode).toHaveBeenCalledWith('c1')
    expect(wrapper.text()).toContain('nuevo6')

    confirmSpy.mockRestore()
  })

  it('elimina el aula tras confirmar y muestra el error del backend si tiene guías', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockedDeleteClassroom.mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'el aula tiene guías vinculadas: eliminalas primero' },
      },
    })

    const wrapper = mountAulas()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Eliminar')
      ?.trigger('click')
    await flushPromises()

    expect(mockedDeleteClassroom).toHaveBeenCalledWith('c1')
    expect(wrapper.find('[role="alert"]').text()).toContain('el aula tiene guías vinculadas')

    confirmSpy.mockRestore()
  })

  it('ofrece el estado vacío cuando todavía no creó aulas', async () => {
    mockedListClassrooms.mockResolvedValue([])

    const wrapper = mountAulas()
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no creaste aulas')
  })
})

describe('Aulas.vue — vista del alumno', () => {
  const student = {
    id: 'u1',
    email: 'alumno@demo.com',
    name: 'Alumno Demo',
    role: 'STUDENT' as const,
  }

  /** El aula en la que está inscripto: el backend no envía `code` al alumno */
  const enrolledClassroom: Classroom = {
    id: 'c9',
    name: '6to B — robótica',
    createdAt: '2026-11-03T10:00:00.000Z',
    teacher: { id: 't2', name: 'Docente Ada' },
    memberCount: 25,
    guideCount: 1,
  }

  const guideInClassroom: Guide = {
    id: 'g1',
    title: 'Práctica 1 — LED parpadeante',
    instructions: 'Conectá un LED al pin 13',
    teacherId: 't2',
    starterProjectId: 'p1',
    classroomId: 'c9',
    createdAt: '2026-11-05T10:00:00.000Z',
    teacher: { id: 't2', name: 'Docente Ada' },
    classroom: { id: 'c9', name: '6to B — robótica' },
    starterProject: { id: 'p1', title: 'Base LED', shareSlug: 'a9f3b2' },
  }

  beforeEach(() => {
    mockedFetchMe.mockResolvedValue(student)
    mockedListClassrooms.mockResolvedValue([enrolledClassroom])
    mockedListGuides.mockResolvedValue([guideInClassroom])
  })

  it('muestra el formulario para unirse y no el de creación', async () => {
    const wrapper = mountAulas()
    await flushPromises()

    expect(wrapper.find('#join-code').exists()).toBe(true)
    expect(wrapper.find('#classroom-name').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Código de unión')
  })

  it('se une a un aula con el código y refresca el listado', async () => {
    mockedJoinClassroom.mockResolvedValue(enrolledClassroom)

    const wrapper = mountAulas()
    await flushPromises()

    await wrapper.find('#join-code').setValue('xyz987')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedJoinClassroom).toHaveBeenCalledWith('xyz987')
    expect(wrapper.text()).toContain('Te uniste al aula "6to B — robótica"')
  })

  it('muestra el error del backend cuando el código no existe (404)', async () => {
    mockedJoinClassroom.mockRejectedValue({
      response: { status: 404, data: { message: 'no existe un aula con ese código' } },
    })

    const wrapper = mountAulas()
    await flushPromises()

    await wrapper.find('#join-code').setValue('zzzz99')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('no existe un aula con ese código')
  })

  it('muestra el error del backend cuando ya está inscripto (409)', async () => {
    mockedJoinClassroom.mockRejectedValue({
      response: { status: 409, data: { message: 'ya estás inscripto en el aula' } },
    })

    const wrapper = mountAulas()
    await flushPromises()

    await wrapper.find('#join-code').setValue('c9código')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('ya estás inscripto en el aula')
  })

  it('no envía la unión si el código está vacío', async () => {
    const wrapper = mountAulas()
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockedJoinClassroom).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Ingresá el código del aula')
  })

  it('lista sus aulas con las guías de cada una y oculta los códigos', async () => {
    const wrapper = mountAulas()
    await flushPromises()

    expect(wrapper.text()).toContain('Mis aulas inscriptas')
    expect(wrapper.text()).toContain('6to B — robótica')
    expect(wrapper.text()).toContain('Docente Ada')
    expect(wrapper.text()).toContain('Práctica 1 — LED parpadeante')
  })

  it('deja el aula tras confirmar y refresca el listado', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockedRemoveStudent.mockResolvedValue(undefined)

    const wrapper = mountAulas()
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Dejar el aula')
      ?.trigger('click')
    await flushPromises()

    expect(mockedRemoveStudent).toHaveBeenCalledWith('c9', 'u1')
    expect(wrapper.text()).toContain('Te retiraste del aula')

    confirmSpy.mockRestore()
  })

  it('ofrece el estado vacío cuando no está inscripto en ninguna aula', async () => {
    mockedListClassrooms.mockResolvedValue([])

    const wrapper = mountAulas()
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no te uniste a ninguna aula')
  })
})

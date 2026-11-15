import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createClassroom,
  deleteClassroom,
  getClassroom,
  joinClassroom,
  listClassrooms,
  listClassroomStudents,
  regenerateClassroomCode,
  removeClassroomStudent,
} from '@/services/classrooms'
import { api } from '@/services/api'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

const classroom = {
  id: 'c1',
  name: '5to año — comisión A',
  code: 'ABC123',
  teacherId: 't1',
  createdAt: '2026-11-01T10:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listClassrooms', () => {
  it('consulta GET /classrooms', async () => {
    mockedApi.get.mockResolvedValue({ data: [classroom] })

    const result = await listClassrooms()

    expect(mockedApi.get).toHaveBeenCalledWith('/classrooms')
    expect(result).toEqual([classroom])
  })
})

describe('createClassroom', () => {
  it('envía POST /classrooms con el nombre sin espacios sobrantes', async () => {
    mockedApi.post.mockResolvedValue({ data: classroom })

    const result = await createClassroom('  5to año — comisión A  ')

    expect(mockedApi.post).toHaveBeenCalledWith('/classrooms', { name: '5to año — comisión A' })
    expect(result).toEqual(classroom)
  })
})

describe('getClassroom', () => {
  it('consulta GET /classrooms/:id', async () => {
    mockedApi.get.mockResolvedValue({ data: classroom })

    const result = await getClassroom('c1')

    expect(mockedApi.get).toHaveBeenCalledWith('/classrooms/c1')
    expect(result).toEqual(classroom)
  })
})

describe('listClassroomStudents', () => {
  it('consulta GET /classrooms/:id/students', async () => {
    const students = [{ id: 'u1', name: 'Alumno Demo', email: 'alumno@demo.com' }]
    mockedApi.get.mockResolvedValue({ data: students })

    const result = await listClassroomStudents('c1')

    expect(mockedApi.get).toHaveBeenCalledWith('/classrooms/c1/students')
    expect(result).toEqual(students)
  })
})

describe('joinClassroom', () => {
  it('envía el código normalizado a POST /classrooms/join', async () => {
    mockedApi.post.mockResolvedValue({ data: classroom })

    const result = await joinClassroom('  AbC123 ')

    expect(mockedApi.post).toHaveBeenCalledWith('/classrooms/join', { code: 'abc123' })
    expect(result).toEqual(classroom)
  })
})

describe('regenerateClassroomCode', () => {
  it('pide un código nuevo a POST /classrooms/:id/regenerate-code', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: 'c1', code: 'XYZ789' } })

    const result = await regenerateClassroomCode('c1')

    expect(mockedApi.post).toHaveBeenCalledWith('/classrooms/c1/regenerate-code')
    expect(result).toEqual({ id: 'c1', code: 'XYZ789' })
  })
})

describe('removeClassroomStudent', () => {
  it('envía DELETE /classrooms/:id/students/:studentId', async () => {
    mockedApi.delete.mockResolvedValue({ data: {} })

    await removeClassroomStudent('c1', 'u1')

    expect(mockedApi.delete).toHaveBeenCalledWith('/classrooms/c1/students/u1')
  })
})

describe('deleteClassroom', () => {
  it('envía DELETE /classrooms/:id', async () => {
    mockedApi.delete.mockResolvedValue({ data: {} })

    await deleteClassroom('c1')

    expect(mockedApi.delete).toHaveBeenCalledWith('/classrooms/c1')
  })
})

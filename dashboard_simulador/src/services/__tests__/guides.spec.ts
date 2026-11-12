import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGuide, deleteGuide, listGuides, updateGuide } from '@/services/guides'
import { api } from '@/services/api'
import type { Guide } from '@/services/types'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

const guide: Guide = {
  id: 'g1',
  title: 'Práctica 1 — LED parpadeante',
  instructions: 'Conectá un LED al pin 13',
  teacherId: 't1',
  starterProjectId: 'p1',
  createdAt: '2026-11-09T10:00:00.000Z',
  teacher: { id: 't1', name: 'Profe Demo' },
  starterProject: { id: 'p1', title: 'Base LED', shareSlug: 'a9f3b2' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listGuides', () => {
  it('consulta GET /guides sin filtro por defecto', async () => {
    mockedApi.get.mockResolvedValue({ data: [guide] })

    const result = await listGuides()

    expect(mockedApi.get).toHaveBeenCalledWith('/guides', { params: {} })
    expect(result).toEqual([guide])
  })

  it('filtra por docente cuando se pasa teacherId', async () => {
    mockedApi.get.mockResolvedValue({ data: [guide] })

    await listGuides('t1')

    expect(mockedApi.get).toHaveBeenCalledWith('/guides', { params: { teacherId: 't1' } })
  })
})

describe('createGuide', () => {
  it('envía POST /guides con título, instrucciones y proyecto plantilla', async () => {
    mockedApi.post.mockResolvedValue({ data: guide })

    const payload = {
      title: guide.title,
      instructions: guide.instructions,
      starterProjectId: 'p1',
    }
    const result = await createGuide(payload)

    expect(mockedApi.post).toHaveBeenCalledWith('/guides', payload)
    expect(result).toEqual(guide)
  })
})

describe('updateGuide', () => {
  it('envía PUT /guides/:id solo con los campos modificados', async () => {
    mockedApi.put.mockResolvedValue({ data: guide })

    await updateGuide('g1', { title: 'Nuevo título' })

    expect(mockedApi.put).toHaveBeenCalledWith('/guides/g1', { title: 'Nuevo título' })
  })
})

describe('deleteGuide', () => {
  it('envía DELETE /guides/:id', async () => {
    mockedApi.delete.mockResolvedValue({ data: { message: 'Guía eliminada' } })

    await deleteGuide('g1')

    expect(mockedApi.delete).toHaveBeenCalledWith('/guides/g1')
  })
})

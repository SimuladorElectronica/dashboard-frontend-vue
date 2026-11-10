import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listSubmissions } from '@/services/submissions'
import { api } from '@/services/api'
import type { Submission } from '@/services/types'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

const submission: Submission = {
  id: 's1',
  guideId: 'g1',
  studentId: 'u1',
  projectId: 'p1',
  submittedAt: '2026-11-09T12:00:00.000Z',
  guide: { id: 'g1', title: 'Práctica 1' },
  project: { id: 'p1', title: 'Entrega de Juan', shareSlug: 'b7c4de' },
  student: { id: 'u1', name: 'Juan Pérez', email: 'juan@demo.com' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listSubmissions', () => {
  it('retorna las entregas y el total del header X-Total-Count', async () => {
    mockedApi.get.mockResolvedValue({
      data: [submission],
      headers: { 'x-total-count': '7' },
    })

    const result = await listSubmissions()

    expect(mockedApi.get).toHaveBeenCalledWith('/submissions', { params: {} })
    expect(result.items).toEqual([submission])
    expect(result.total).toBe(7)
  })

  it('pasa guideId, take y skip al backend', async () => {
    mockedApi.get.mockResolvedValue({ data: [], headers: { 'x-total-count': '0' } })

    await listSubmissions({ guideId: 'g1', take: 50, skip: 10 })

    expect(mockedApi.get).toHaveBeenCalledWith('/submissions', {
      params: { guideId: 'g1', take: 50, skip: 10 },
    })
  })

  it('usa la longitud de la respuesta si falta el header', async () => {
    mockedApi.get.mockResolvedValue({ data: [submission], headers: {} })

    const result = await listSubmissions({ guideId: 'g1' })

    expect(result.total).toBe(1)
  })
})

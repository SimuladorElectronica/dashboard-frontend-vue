import { beforeEach, describe, expect, it, vi } from 'vitest'
import { extractProjectKey, isProjectKey, resolveStarterProjectId } from '@/services/projects'
import { api } from '@/services/api'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('extractProjectKey', () => {
  it('extrae el shareSlug de una URL de plantilla', () => {
    expect(extractProjectKey('http://localhost:5173/share/a9f3b2')).toBe('a9f3b2')
    expect(extractProjectKey('https://simulador.edu/share/a9f3b2/')).toBe('a9f3b2')
    expect(extractProjectKey('http://localhost:5173/share/a9f3b2?x=1')).toBe('a9f3b2')
  })

  it('acepta un shareSlug o un UUID directamente', () => {
    expect(extractProjectKey('  a9f3b2  ')).toBe('a9f3b2')
    expect(extractProjectKey('3f1c8f9e-2a41-4f6b-9d5e-7c2b1a0f4e8d')).toBe(
      '3f1c8f9e-2a41-4f6b-9d5e-7c2b1a0f4e8d',
    )
  })

  it('lanza error con entradas vacías o URLs sin identificador', () => {
    expect(() => extractProjectKey('')).toThrow('Pegá la URL del proyecto plantilla')
    expect(() => extractProjectKey('http://localhost:5173/')).toThrow(
      'No se encontró un identificador de proyecto en la URL',
    )
    expect(() => extractProjectKey('no es una url')).not.toThrow()
  })
})

describe('isProjectKey', () => {
  it('reconoce shareSlug de 6 caracteres y UUID', () => {
    expect(isProjectKey('a9f3b2')).toBe(true)
    expect(isProjectKey('3f1c8f9e-2a41-4f6b-9d5e-7c2b1a0f4e8d')).toBe(true)
    expect(isProjectKey('demasiado-largo')).toBe(false)
  })
})

describe('resolveStarterProjectId', () => {
  it('resuelve el identificador a través de GET /projects/:key', async () => {
    mockedApi.get.mockResolvedValue({ data: { id: 'p1', shareSlug: 'a9f3b2' } })

    const id = await resolveStarterProjectId('http://localhost:5173/share/a9f3b2')

    expect(mockedApi.get).toHaveBeenCalledWith('/projects/a9f3b2')
    expect(id).toBe('p1')
  })

  it('rechaza claves con formato inválido sin llamar al backend', async () => {
    await expect(resolveStarterProjectId('abc')).rejects.toThrow(
      'La plantilla debe ser una URL, un shareSlug de 6 caracteres o un UUID',
    )
    expect(mockedApi.get).not.toHaveBeenCalled()
  })
})

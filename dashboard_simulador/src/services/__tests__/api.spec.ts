import { describe, expect, it } from 'vitest'
import { extractApiErrorMessage } from '@/services/api'

describe('extractApiErrorMessage', () => {
  it('retorna el mensaje que envía el backend', () => {
    const error = { response: { data: { message: 'No existe la guía "x"' } } }

    expect(extractApiErrorMessage(error)).toBe('No existe la guía "x"')
  })

  it('une los mensajes de validación (array de NestJS)', () => {
    const error = {
      response: { data: { message: ['title must be a string', 'instructions is required'] } },
    }

    expect(extractApiErrorMessage(error)).toBe('title must be a string · instructions is required')
  })

  it('usa el fallback cuando no hay mensaje del servidor', () => {
    expect(extractApiErrorMessage(new Error('boom'), 'Mensaje propio')).toBe('Mensaje propio')
  })

  it('detecta errores de red sin respuesta', () => {
    const error = { isAxiosError: true, message: 'Network Error' }

    expect(extractApiErrorMessage(error)).toBe('No se pudo conectar con el servidor.')
  })
})

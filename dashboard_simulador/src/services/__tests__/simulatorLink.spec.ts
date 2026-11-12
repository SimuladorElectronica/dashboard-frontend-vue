import { describe, expect, it } from 'vitest'
import { simulatorNewProjectUrl, simulatorBaseUrl } from '@/services/simulatorLink'

describe('simulatorBaseUrl', () => {
  it('usa el valor por defecto y recorta barras finales', () => {
    // Sin VITE_SIMULATOR_URL en el entorno de test
    expect(simulatorBaseUrl()).toBe('http://localhost:5173')
  })
})

describe('simulatorNewProjectUrl', () => {
  it('con token: entrega la sesión por ruta (/session/:token) y fuerza arranque en blanco (?new=1)', () => {
    const url = simulatorNewProjectUrl('jwt-de-prueba')
    expect(url).toBe('http://localhost:5173/session/jwt-de-prueba?new=1')
  })

  it('codifica caracteres especiales del token en la ruta', () => {
    const url = simulatorNewProjectUrl('tok/con+raros=')
    expect(url).toBe('http://localhost:5173/session/tok%2Fcon%2Braros%3D?new=1')
  })

  it('sin token: cae a /new (la sesión la reutiliza el simulador vía localStorage)', () => {
    expect(simulatorNewProjectUrl(null)).toBe('http://localhost:5173/new')
  })
})

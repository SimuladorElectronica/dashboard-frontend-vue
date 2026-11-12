import { describe, expect, it } from 'vitest'
import {
  simulatorNewProjectUrl,
  simulatorBaseUrl,
  simulatorProjectUrl,
  simulatorTemplateUrl,
} from '@/services/simulatorLink'

describe('simulatorBaseUrl', () => {
  it('usa el valor por defecto y recorta barras finales', () => {
    // Sin VITE_SIMULATOR_URL en el entorno de test
    expect(simulatorBaseUrl()).toBe('http://localhost:5174')
  })
})

describe('simulatorNewProjectUrl', () => {
  it('con token: entrega la sesión por ruta (/session/:token) y fuerza arranque en blanco (?new=1)', () => {
    const url = simulatorNewProjectUrl('jwt-de-prueba')
    expect(url).toBe('http://localhost:5174/session/jwt-de-prueba?new=1')
  })

  it('codifica caracteres especiales del token en la ruta', () => {
    const url = simulatorNewProjectUrl('tok/con+raros=')
    expect(url).toBe('http://localhost:5174/session/tok%2Fcon%2Braros%3D?new=1')
  })

  it('sin token: cae a /new (la sesión la reutiliza el simulador vía localStorage)', () => {
    expect(simulatorNewProjectUrl(null)).toBe('http://localhost:5174/new')
  })
})

describe('simulatorProjectUrl', () => {
  it('arma la ruta del circuito compartido (/p/:shareSlug)', () => {
    expect(simulatorProjectUrl('a9f3b2')).toBe('http://localhost:5174/p/a9f3b2')
  })

  it('codifica caracteres especiales del slug', () => {
    expect(simulatorProjectUrl('a/b c')).toBe('http://localhost:5174/p/a%2Fb%20c')
  })
})

describe('simulatorTemplateUrl', () => {
  it('arma la ruta pública de la plantilla para el modo invitado (/plantillas/:slug)', () => {
    expect(simulatorTemplateUrl('a9f3b2')).toBe('http://localhost:5174/plantillas/a9f3b2')
  })

  it('codifica caracteres especiales del slug', () => {
    expect(simulatorTemplateUrl('a/b c')).toBe('http://localhost:5174/plantillas/a%2Fb%20c')
  })
})

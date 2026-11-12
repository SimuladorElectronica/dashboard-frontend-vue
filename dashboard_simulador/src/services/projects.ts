import { api } from './api'
import type { ProjectDetail, ProjectSummary } from './types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SHARE_SLUG_REGEX = /^[a-z0-9]{6}$/

/**
 * Extrae la clave de proyecto de lo que pegue el docente en el formulario:
 * una URL de plantilla (`…/share/a9f3b2`), un shareSlug (`a9f3b2`) o un UUID.
 * Lanza Error si la entrada no tiene formato reconocible.
 */
export function extractProjectKey(input: string): string {
  const value = input.trim()
  if (!value) {
    throw new Error('Pegá la URL del proyecto plantilla')
  }

  // Caso URL: se toma el segmento posterior a /share/ (o el último segmento)
  if (/^https?:\/\//i.test(value)) {
    let path: string
    try {
      path = new URL(value).pathname
    } catch {
      throw new Error('La URL del proyecto plantilla no es válida')
    }

    const segments = path.split('/').filter(Boolean)
    const slugIndex = segments.lastIndexOf('share')
    const key = slugIndex >= 0 ? segments[slugIndex + 1] : segments[segments.length - 1]

    if (!key) {
      throw new Error('No se encontró un identificador de proyecto en la URL')
    }
    return key.toLowerCase()
  }

  return value
}

/** ¿La clave tiene formato de shareSlug o UUID? (el backend responde 404 si no) */
export function isProjectKey(key: string): boolean {
  return SHARE_SLUG_REGEX.test(key) || UUID_REGEX.test(key)
}

/** GET /projects — propios con token, públicos sin token (total en X-Total-Count) */
export async function listProjects(): Promise<ProjectSummary[]> {
  const { data } = await api.get<ProjectSummary[]>('/projects', { params: { take: 100 } })
  return data
}

/** GET /projects/:key — resuelve shareSlug o UUID a un proyecto existente */
export async function getProjectByKey(key: string): Promise<ProjectDetail> {
  const { data } = await api.get<ProjectDetail>(`/projects/${encodeURIComponent(key)}`)
  return data
}

/** Convierte la URL/slug/UUID en el UUID que espera POST /guides */
export async function resolveStarterProjectId(input: string): Promise<string> {
  const key = extractProjectKey(input)

  if (!isProjectKey(key)) {
    throw new Error('La plantilla debe ser una URL, un shareSlug de 6 caracteres o un UUID')
  }

  const project = await getProjectByKey(key)
  return project.id
}

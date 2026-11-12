import { api } from './api'
import type { ListResult, Submission } from './types'

export interface ListSubmissionsParams {
  /** Filtra por guía (opcional) */
  guideId?: string
  take?: number
  skip?: number
}

/**
 * Crea una entrega: vincula un proyecto propio del alumno con la guía.
 * El proyecto debe pertenecer al alumno que entrega (los ajenos o sin proyecto devuelven 403).
 */
export async function createSubmission(guideId: string, projectId: string): Promise<Submission> {
  const { data } = await api.post<Submission>('/submissions', { guideId, projectId })
  return data
}

export async function listSubmissions(
  params: ListSubmissionsParams = {},
): Promise<ListResult<Submission>> {
  const { guideId, take, skip } = params
  const { data, headers } = await api.get<Submission[]>('/submissions', {
    params: {
      ...(guideId ? { guideId } : {}),
      ...(take !== undefined ? { take } : {}),
      ...(skip !== undefined ? { skip } : {}),
    },
  })

  const totalHeader = headers['x-total-count']
  const total = Array.isArray(totalHeader) ? Number(totalHeader[0]) : Number(totalHeader)

  return {
    items: data,
    total: Number.isFinite(total) ? total : data.length,
  }
}

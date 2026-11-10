import { api } from './api'
import type { ListResult, Submission } from './types'

export interface ListSubmissionsParams {
  /** Filtra por guía (opcional) */
  guideId?: string
  take?: number
  skip?: number
}

/**
 * GET /submissions — el docente ve las entregas de sus guías, el alumno las suyas.
 * El total de coincidencias llega en el header X-Total-Count.
 */
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

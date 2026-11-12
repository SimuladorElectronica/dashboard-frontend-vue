import { api } from './api'
import type { Guide, GuideInput, GuideUpdateInput } from './types'

export interface ListGuidesParams {
  /** Filtra las guías de un docente (opcional) */
  teacherId?: string
  /** Filtra las guías de un aula (opcional) */
  classroomId?: string
}

/** GET /guides — el alcance depende del rol; estos filtros acotan dentro de él */
export async function listGuides(params: ListGuidesParams = {}): Promise<Guide[]> {
  const { teacherId, classroomId } = params
  const { data } = await api.get<Guide[]>('/guides', {
    params: {
      ...(teacherId ? { teacherId } : {}),
      ...(classroomId ? { classroomId } : {}),
    },
  })
  return data
}

/** POST /guides — requiere rol TEACHER; `classroomId` debe ser un aula propia */
export async function createGuide(input: GuideInput): Promise<Guide> {
  const { data } = await api.post<Guide>('/guides', input)
  return data
}

/** PUT /guides/:id — requiere ser el docente dueño */
export async function updateGuide(id: string, input: GuideUpdateInput): Promise<Guide> {
  const { data } = await api.put<Guide>(`/guides/${id}`, input)
  return data
}

/** DELETE /guides/:id — requiere ser el docente dueño */
export async function deleteGuide(id: string): Promise<void> {
  await api.delete(`/guides/${id}`)
}

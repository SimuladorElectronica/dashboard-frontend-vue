import { api } from './api'
import type { Guide, GuideInput, GuideUpdateInput } from './types'

/** GET /guides — opcionalmente filtrado por ?teacherId= */
export async function listGuides(teacherId?: string): Promise<Guide[]> {
  const { data } = await api.get<Guide[]>('/guides', {
    params: teacherId ? { teacherId } : {},
  })
  return data
}

/** POST /guides — requiere rol TEACHER */
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

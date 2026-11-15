import type { AuthUser, ProjectSummary } from '@/services/types'

/**
 * ¿El usuario puede marcar/desmarcar plantillas de ESTE proyecto?
 * (ADMIN siempre; el TEACHER dueño de un proyecto propio sí)
 */
export function canManageTemplate(
  user: AuthUser | null,
  project: ProjectSummary,
): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  // El backend permite al docente dueño marcar/desmarcar su propio proyecto
  return user.role === 'TEACHER' && project.userId !== null && project.userId === user.id
}

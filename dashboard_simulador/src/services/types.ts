/** Tipos compartidos entre la capa de servicios y las vistas. */

export type Role = 'TEACHER' | 'STUDENT' | 'ADMIN'

/** Usuario devuelto por GET /auth/me */
export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

/** Respuesta de POST /auth/login */
export interface LoginResponse {
  access_token: string
}

export interface TeacherRef {
  id: string
  name: string
}

/** Proyecto plantilla incluido en las guías */
export interface StarterProjectRef {
  id: string
  title: string
  shareSlug: string
}

/** Guía didáctica (CRUD de la Issue 2.2) */
export interface Guide {
  id: string
  title: string
  instructions: string
  teacherId: string
  starterProjectId: string
  createdAt: string
  teacher: TeacherRef
  starterProject: StarterProjectRef
}

/** Payload de POST /guides */
export interface GuideInput {
  title: string
  instructions: string
  starterProjectId: string
}

/** Payload de PUT /guides/:id (todos los campos opcionales) */
export type GuideUpdateInput = Partial<GuideInput>

/** Resumen de proyecto (GET /projects) */
export interface ProjectSummary {
  id: string
  shareSlug: string
  title: string
  description: string | null
  isPublic: boolean
  userId: string | null
  createdAt: string
  updatedAt: string
}

/** Detalle de proyecto (GET /projects/:key con UUID) */
export interface ProjectDetail extends ProjectSummary {
  circuitData: unknown
  code: string
}

/** Alumno que entregó una consigna */
export interface SubmissionStudent {
  id: string
  name: string
  email: string
}

/** Entrega de un alumno a una guía (GET /submissions) */
export interface Submission {
  id: string
  guideId: string
  studentId: string
  projectId: string
  submittedAt: string
  guide: { id: string; title: string }
  project: { id: string; title: string; shareSlug: string }
  student: SubmissionStudent
}

/** Listado paginado del backend: el total viaja en el header X-Total-Count */
export interface ListResult<T> {
  items: T[]
  total: number
}

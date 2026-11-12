/** Tipos compartidos entre la capa de servicios y las vistas. */

export type Role = 'TEACHER' | 'STUDENT' | 'ADMIN'

/** Usuario devuelto por GET /auth/me */
export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

/** Respuesta de POST /auth/login y POST /auth/register */
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

/** Guía didáctica (Issue 2.2; desde el módulo Classrooms pertenece a un aula) */
export interface Guide {
  id: string
  title: string
  instructions: string
  teacherId: string
  starterProjectId: string
  classroomId: string
  createdAt: string
  teacher: TeacherRef
  classroom: ClassroomRef
  starterProject: StarterProjectRef
}

/** Referencia al aula incluida en las guías */
export interface ClassroomRef {
  id: string
  name: string
}

/** Payload de POST /guides */
export interface GuideInput {
  title: string
  instructions: string
  starterProjectId: string
  classroomId: string
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

/** Aula del módulo Classrooms (GET /classrooms) */
export interface Classroom {
  id: string
  name: string
  createdAt: string
  teacher: TeacherRef
  /** Alumnos inscriptos */
  memberCount: number
  /** Guías vinculadas al aula */
  guideCount: number
  /** Código de unión: solo viaja para el docente dueño y el admin */
  code?: string
}

/** Alumno inscripto en un aula (GET /classrooms/:id/students) */
export interface ClassroomStudent {
  id: string
  name: string
  email: string
  joinedAt: string
}

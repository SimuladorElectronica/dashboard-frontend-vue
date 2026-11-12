import { api } from './api'
import type { Classroom, ClassroomStudent } from './types'

/**
 * GET /classrooms — listado según rol:
 * el docente ve las aulas que creó (con `code`), el alumno las que cursa (sin `code`)
 * y el admin todas.
 */
export async function listClassrooms(): Promise<Classroom[]> {
  const { data } = await api.get<Classroom[]>('/classrooms')
  return data
}

/** POST /classrooms — crea un aula (solo TEACHER) y genera el `code` de unión */
export async function createClassroom(name: string): Promise<Classroom> {
  const { data } = await api.post<Classroom>('/classrooms', { name: name.trim() })
  return data
}

/** GET /classrooms/:id — detalle visible para dueño, inscriptos o admin */
export async function getClassroom(id: string): Promise<Classroom> {
  const { data } = await api.get<Classroom>(`/classrooms/${id}`)
  return data
}

/** GET /classrooms/:id/students — alumnos inscriptos (solo dueño o admin) */
export async function listClassroomStudents(id: string): Promise<ClassroomStudent[]> {
  const { data } = await api.get<ClassroomStudent[]>(`/classrooms/${id}/students`)
  return data
}

/** POST /classrooms/join — el alumno se inscribe con el `code` del aula */
export async function joinClassroom(code: string): Promise<Classroom> {
  const { data } = await api.post<Classroom>('/classrooms/join', {
    code: code.trim().toLowerCase(),
  })
  return data
}

/** POST /classrooms/:id/regenerate-code — invalida el `code` anterior (dueño o admin) */
export async function regenerateClassroomCode(id: string): Promise<{ id: string; code: string }> {
  const { data } = await api.post<{ id: string; code: string }>(`/classrooms/${id}/regenerate-code`)
  return data
}

/** DELETE /classrooms/:id/students/:studentId — el dueño quita a un alumno, o el alumno se retira */
export async function removeClassroomStudent(
  classroomId: string,
  studentId: string,
): Promise<void> {
  await api.delete(`/classrooms/${classroomId}/students/${studentId}`)
}

/** DELETE /classrooms/:id — elimina el aula (409 si tiene guías vinculadas) */
export async function deleteClassroom(id: string): Promise<void> {
  await api.delete(`/classrooms/${id}`)
}

import { ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import { listClassroomStudents, removeClassroomStudent } from '@/services/classrooms'
import type { Classroom, ClassroomStudent } from '@/services/types'

interface StudentsOptions {
  /** Publica un aviso de éxito en la página (ej. "Alumno removido del aula") */
  notify: (message: string) => void
}

/**
 * Panel expansible de alumnos inscriptos del aula (docente):
 * expansión/colapso, carga bajo demanda del listado y
 * baja de inscriptos con confirmación.
 */
export function useClassroomStudents({ notify }: StudentsOptions) {
  const expandedClassroomId = ref<string | null>(null)
  const students = ref<ClassroomStudent[]>([])
  const studentsLoading = ref(false)
  const studentsError = ref('')

  /** Muestra/oculta el listado de alumnos inscriptos de un aula */
  async function toggleStudents(classroom: Classroom): Promise<void> {
    if (expandedClassroomId.value === classroom.id) {
      collapse()
      return
    }

    expandedClassroomId.value = classroom.id
    students.value = []
    studentsError.value = ''
    studentsLoading.value = true
    try {
      students.value = await listClassroomStudents(classroom.id)
    } catch (err) {
      studentsError.value = extractApiErrorMessage(
        err,
        'No se pudieron cargar los alumnos del aula.',
      )
    } finally {
      studentsLoading.value = false
    }
  }

  /** Oculta el panel y limpia el listado */
  function collapse(): void {
    expandedClassroomId.value = null
    students.value = []
  }

  /** Oculta el panel solo si muestra el aula indicada (ej. al borrarla) */
  function collapseIf(classroomId: string): void {
    if (expandedClassroomId.value === classroomId) collapse()
  }

  /** Quita un alumno del aula tras confirmar y actualiza el contador */
  async function onRemoveStudent(classroom: Classroom, student: ClassroomStudent): Promise<void> {
    const confirmed = window.confirm(
      `¿Quitar a ${student.name} (${student.email}) del aula "${classroom.name}"?`,
    )
    if (!confirmed) return

    studentsError.value = ''
    try {
      await removeClassroomStudent(classroom.id, student.id)
      students.value = students.value.filter((s) => s.id !== student.id)
      classroom.memberCount = Math.max(0, classroom.memberCount - 1)
      notify('Alumno removido del aula')
    } catch (err) {
      studentsError.value = extractApiErrorMessage(err, 'No se pudo quitar al alumno.')
    }
  }

  return {
    expandedClassroomId,
    students,
    studentsLoading,
    studentsError,
    toggleStudents,
    collapseIf,
    onRemoveStudent,
  }
}

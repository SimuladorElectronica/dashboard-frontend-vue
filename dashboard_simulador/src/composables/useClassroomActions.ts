import type { Ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import {
  deleteClassroom,
  regenerateClassroomCode,
  removeClassroomStudent,
} from '@/services/classrooms'
import type { AuthUser, Classroom, ClassroomStudent } from '@/services/types'

interface ClassroomActionsOptions {
  /** Perfil de la sesión (lo usa "Dejar el aula") */
  currentUser: Ref<AuthUser | null>
  listError: Ref<string>
  notice: Ref<string>
  /** Aula con el panel desplegado (lo usa la baja de alumnos) */
  expandedClassroom: Ref<Classroom | null>
  reloadAll: () => Promise<void>
  loadClassrooms: () => Promise<void>
  collapseIf: (classroomId: string) => void
  onRemoveStudent: (classroom: Classroom, student: ClassroomStudent) => Promise<void>
}

/**
 * Acciones con confirmación de la página de Aulas:
 * crear/unirse (aviso), regenerar código, eliminar y dejar aula,
 * y baja de alumnos del panel expandido.
 */
export function useClassroomActions(options: ClassroomActionsOptions) {
  const {
    currentUser,
    listError,
    notice,
    expandedClassroom,
    reloadAll,
    loadClassrooms,
    collapseIf,
    onRemoveStudent,
  } = options

  /** Ejecuta una acción con manejo único de aviso de éxito o error de listado */
  async function runAction(action: () => Promise<string>, fallback: string): Promise<void> {
    notice.value = ''
    listError.value = ''
    try {
      notice.value = await action()
    } catch (err) {
      listError.value = extractApiErrorMessage(err, fallback)
    }
  }

  function onCreated(message: string): void {
    notice.value = message
    void loadClassrooms()
  }

  function onJoined(message: string): void {
    notice.value = message
    void reloadAll()
  }

  async function onRegenerateCode(classroom: Classroom): Promise<void> {
    const confirmed = window.confirm(
      `¿Regenerar el código de "${classroom.name}"? El código anterior quedará invalidado.`,
    )
    if (!confirmed) return

    await runAction(async () => {
      const { code } = await regenerateClassroomCode(classroom.id)
      classroom.code = code
      return 'Código regenerado correctamente'
    }, 'No se pudo regenerar el código.')
  }

  async function onDeleteClassroom(classroom: Classroom): Promise<void> {
    const confirmed = window.confirm(
      `¿Eliminar el aula "${classroom.name}"? Las inscripciones se borrarán en cascada.`,
    )
    if (!confirmed) return

    await runAction(async () => {
      await deleteClassroom(classroom.id)
      collapseIf(classroom.id)
      await loadClassrooms()
      return 'Aula eliminada'
    }, 'No se pudo eliminar el aula. Recordá que debe estar sin guías vinculadas.')
  }

  async function onLeave(classroom: Classroom): Promise<void> {
    const user = currentUser.value
    if (!user) return

    const confirmed = window.confirm(`¿Dejar el aula "${classroom.name}"?`)
    if (!confirmed) return

    await runAction(async () => {
      await removeClassroomStudent(classroom.id, user.id)
      await reloadAll()
      return `Te retiraste del aula "${classroom.name}"`
    }, 'No se pudo dejar el aula.')
  }

  async function onRemoveStudentClick(student: ClassroomStudent): Promise<void> {
    const classroom = expandedClassroom.value
    if (!classroom) return
    await onRemoveStudent(classroom, student)
  }

  return {
    onCreated,
    onJoined,
    onRegenerateCode,
    onDeleteClassroom,
    onLeave,
    onRemoveStudentClick,
  }
}

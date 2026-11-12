import { computed, ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import { listClassrooms } from '@/services/classrooms'
import { listGuides } from '@/services/guides'
import type { AuthUser, Classroom, Guide } from '@/services/types'
import { useAuthStore } from '@/stores/auth'

/**
 * Estado y carga de datos de la página de Aulas:
 * perfil de la sesión, aulas visibles y — para el alumno —
 * las guías para agrupar por aula. Maneja también la recarga
 * tras unirse/dejar un aula.
 */
export function useAulasData() {
  const authStore = useAuthStore()

  const loading = ref(false)
  const listError = ref('')
  const currentUser = ref<AuthUser | null>(null)
  const classrooms = ref<Classroom[]>([])
  const guides = ref<Guide[]>([])

  /** Solo el docente crea y administra aulas (el backend limita POST /classrooms a TEACHER) */
  const isTeacher = computed(() => currentUser.value?.role === 'TEACHER')
  /** El flujo del alumno es exclusivo de STUDENT; admin queda fuera de alcance */
  const isStudent = computed(() => currentUser.value?.role === 'STUDENT')

  async function loadClassrooms(): Promise<void> {
    classrooms.value = await listClassrooms()
  }

  async function loadGuides(): Promise<void> {
    guides.value = await listGuides()
  }

  async function refreshAll(): Promise<void> {
    loading.value = true
    listError.value = ''
    try {
      // Primero el perfil: de él depende qué se carga y qué se muestra
      currentUser.value = await authStore.fetchUser()
      const tasks: Promise<unknown>[] = [loadClassrooms()]
      if (isStudent.value) tasks.push(loadGuides())
      await Promise.all(tasks)
    } catch (err) {
      listError.value = extractApiErrorMessage(err, 'No se pudieron cargar las aulas.')
    } finally {
      loading.value = false
    }
  }

  /** Recarga aulas (y guías del alumno) tras unirse o dejar un aula */
  async function reloadAll(): Promise<void> {
    try {
      const tasks: Promise<unknown>[] = [loadClassrooms()]
      if (isStudent.value) tasks.push(loadGuides())
      await Promise.all(tasks)
    } catch (err) {
      listError.value = extractApiErrorMessage(err, 'No se pudieron actualizar las aulas.')
    }
  }

  return {
    loading,
    listError,
    currentUser,
    classrooms,
    guides,
    isTeacher,
    isStudent,
    refreshAll,
    reloadAll,
    loadClassrooms,
  }
}

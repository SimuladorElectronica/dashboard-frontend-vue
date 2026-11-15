import { computed, ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import { listGuides } from '@/services/guides'
import { listClassrooms } from '@/services/classrooms'
import { listProjects } from '@/services/projects'
import { listSubmissions } from '@/services/submissions'
import type { AuthUser, Classroom, Guide, ProjectSummary, Submission } from '@/services/types'
import { useAuthStore } from '@/stores/auth'

/**
 * Estado y carga de datos de la página de Guías:
 * perfil de la sesión, guías (según rol y filtro de aula),
 * proyectos propios, aulas y entregas. Maneja también los
 * reintentos parciales tras filtrar o guardar.
 */
export function useGuidesData() {
  const authStore = useAuthStore()

  const loading = ref(false)
  /** Perfil del usuario de la sesión: define la vista (docente vs. alumno) */
  const currentUser = ref<AuthUser | null>(null)
  const guides = ref<Guide[]>([])
  const projects = ref<ProjectSummary[]>([])
  const classrooms = ref<Classroom[]>([])
  /** Filtro de aula aplicado al listado (id del aula o vacío = todas) */
  const classroomFilter = ref('')
  /** Filtro de guía aplicado a la tabla de entregas (vacío = todas) */
  const studentFilter = ref('')
  const submissions = ref<Submission[]>([])
  const submissionsTotal = ref(0)
  const listError = ref('')

  /** Solo el docente ve el formulario y las acciones de edición */
  const isTeacher = computed(() => currentUser.value?.role === 'TEACHER')

  async function loadGuides(): Promise<void> {
    // El docente ve las guías de sus aulas; el alumno las de las suyas;
    // el filtro de aula acota dentro de ese alcance
    const teacherId = isTeacher.value ? currentUser.value?.id : undefined
    guides.value = await listGuides({
      teacherId,
      classroomId: classroomFilter.value || undefined,
    })
  }

  async function loadProjects(): Promise<void> {
    projects.value = await listProjects()
  }

  async function loadClassrooms(): Promise<void> {
    // Docente: sus aulas para el selector/filtro · Alumno: las inscriptas para agrupar
    classrooms.value = await listClassrooms()
  }

  async function loadSubmissions(): Promise<void> {
    const result = await listSubmissions({
      guideId: studentFilter.value || undefined,
      take: 100,
    })
    submissions.value = result.items
    submissionsTotal.value = result.total
  }

  function reportListError(err: unknown, fallback: string): void {
    listError.value = extractApiErrorMessage(err, fallback)
  }

  async function refreshAll(): Promise<void> {
    loading.value = true
    listError.value = ''
    try {
      // Primero el perfil: de él depende qué se carga y qué se muestra
      currentUser.value = await authStore.fetchUser()
      await Promise.all([loadGuides(), loadSubmissions(), loadProjects(), loadClassrooms()])
    } catch (err) {
      reportListError(err, 'No se pudieron cargar las guías.')
    } finally {
      loading.value = false
    }
  }

  /** Recarga las guías tras un cambio de filtro (sin tumbar la página si falla) */
  async function reloadGuides(): Promise<void> {
    try {
      await loadGuides()
    } catch (err) {
      reportListError(err, 'No se pudieron cargar las guías.')
    }
  }

  /** Recarga la tabla de entregas (tras filtrar o registrar una entrega) */
  async function reloadSubmissions(): Promise<void> {
    try {
      await loadSubmissions()
    } catch (err) {
      reportListError(err, 'No se pudieron cargar las entregas.')
    }
  }

  /** Recarga guías y entregas tras crear/actualizar/borrar una guía */
  async function reloadGuidesAndSubmissions(): Promise<void> {
    try {
      await Promise.all([loadGuides(), loadSubmissions()])
    } catch (err) {
      reportListError(err, 'No se pudieron actualizar las guías.')
    }
  }

  return {
    loading,
    currentUser,
    guides,
    projects,
    classrooms,
    classroomFilter,
    studentFilter,
    submissions,
    submissionsTotal,
    listError,
    isTeacher,
    refreshAll,
    reloadGuides,
    reloadSubmissions,
    reloadGuidesAndSubmissions,
    reportListError,
  }
}

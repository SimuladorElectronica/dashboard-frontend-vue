import { computed, reactive, ref, watch, type Ref } from 'vue'
import { createGuide, updateGuide } from '@/services/guides'
import { resolveStarterProjectId } from '@/services/projects'
import { extractApiErrorMessage } from '@/services/api'
import type { Guide, ProjectSummary } from '@/services/types'

/** URL canónica de un proyecto compartido (la usa el backend para shareUrl) */
export function shareUrl(shareSlug: string): string {
  return `${window.location.origin}/share/${shareSlug}`
}

export interface GuideEditRequest {
  guide: Guide
  /** Cambia en cada clic en "Editar" para re-poblar el formulario */
  nonce: number
}

interface GuideFormOptions {
  projects: Ref<ProjectSummary[]>
  /** Solicitud de edición proveniente del listado (null = formulario nuevo) */
  editRequest: Ref<GuideEditRequest | null>
  /** Se invoca con el mensaje de éxito tras crear/actualizar */
  onSaved: (message: string) => void
}

/**
 * Estado y acciones del formulario CRUD de guías (docente):
 * validación en cliente, alta/edición contra la API y población
 * del formulario al pulsar "Editar" en el listado.
 */
export function useGuideForm({ projects, editRequest, onSaved }: GuideFormOptions) {
  // --- Estado del formulario CRUD ------------------------------------------
  const editingId = ref<string | null>(null)
  const submitting = ref(false)
  const submitted = ref(false)
  const formError = ref('')

  const form = reactive({
    title: '',
    instructions: '',
    /** Aula a la que pertenece la guía (obligatorio) */
    classroomId: '',
    /** UUID elegido en el selector de proyectos (vacío = usar la URL) */
    projectId: '',
    /** URL / shareSlug / UUID del circuito plantilla */
    templateUrl: '',
    /** true si el docente modificó la URL a mano */
    urlTouched: false,
  })

  const isEditing = computed(() => editingId.value !== null)

  const hasTemplate = computed(() => !!form.templateUrl.trim() || !!form.projectId)

  function collectErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!form.title.trim()) errors.title = 'Ingresá un título para la guía'
    if (!form.instructions.trim()) errors.instructions = 'Ingresá la consigna para el alumno'
    if (!form.classroomId) errors.classroom = 'Elegí el aula a la que pertenece la guía'
    if (!hasTemplate.value) errors.template = 'Asociá un proyecto plantilla (URL o selector)'
    return errors
  }

  const fieldErrors = computed<Record<string, string>>(() =>
    submitted.value ? collectErrors() : {},
  )

  // --- Acciones --------------------------------------------------------------

  function onProjectChange(): void {
    const project = projects.value.find((p) => p.id === form.projectId)
    form.templateUrl = project ? shareUrl(project.shareSlug) : ''
    form.urlTouched = false
  }

  function markUrlTouched(): void {
    form.urlTouched = true
  }

  /** Resuelve el UUID del proyecto plantilla que se enviará al backend */
  async function resolveTemplateId(): Promise<string> {
    if (form.projectId && !form.urlTouched) return form.projectId
    return resolveStarterProjectId(form.templateUrl)
  }

  /** Rellena el formulario con una guía existente (flujo "Editar") */
  function populateForm(guide: Guide): void {
    editingId.value = guide.id
    submitted.value = false
    formError.value = ''
    form.title = guide.title
    form.instructions = guide.instructions
    form.classroomId = guide.classroomId

    // Asignar el proyecto correcto: el que se selecciona en el selector
    const projectInSelector = projects.value.find((p) => p.id === guide.starterProject.id)
    form.projectId = projectInSelector ? projectInSelector.id : ''

    // Si el proyecto no está en el selector, la URL es la única vía
    form.templateUrl = shareUrl(guide.starterProject.shareSlug)
    form.urlTouched = !projectInSelector
  }

  function resetForm(): void {
    editingId.value = null
    submitted.value = false
    formError.value = ''
    form.title = ''
    form.instructions = ''
    form.classroomId = ''
    form.projectId = ''
    form.templateUrl = ''
    form.urlTouched = false
  }

  // Poblar/limpiar el formulario cuando el listado solicita edición (o la cancela)
  watch(
    () => editRequest.value,
    (request) => {
      if (request) populateForm(request.guide)
      else resetForm()
    },
  )

  /** Persiste la guía (POST o PUT según el modo) y avisa al padre */
  async function onSubmit(): Promise<void> {
    submitted.value = true
    formError.value = ''

    if (Object.keys(fieldErrors.value).length > 0) return

    submitting.value = true
    try {
      const starterProjectId = await resolveTemplateId()
      const payload = {
        title: form.title.trim(),
        instructions: form.instructions.trim(),
        starterProjectId,
        classroomId: form.classroomId,
      }

      if (editingId.value) {
        await updateGuide(editingId.value, payload)
        onSaved('Guía actualizada correctamente')
      } else {
        await createGuide(payload)
        onSaved('Guía creada correctamente')
      }

      resetForm()
    } catch (err) {
      formError.value = extractApiErrorMessage(err, 'No se pudo guardar la guía.')
    } finally {
      submitting.value = false
    }
  }

  return {
    form,
    fieldErrors,
    isEditing,
    submitting,
    formError,
    onSubmit,
    resetForm,
    onProjectChange,
    markUrlTouched,
  }
}

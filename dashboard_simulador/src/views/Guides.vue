<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import { createGuide, deleteGuide, listGuides, updateGuide } from '@/services/guides'
import { listClassrooms } from '@/services/classrooms'
import { listProjects, resolveStarterProjectId } from '@/services/projects'
import { createSubmission, listSubmissions } from '@/services/submissions'
import { simulatorProjectUrl } from '@/services/simulatorLink'
import type { AuthUser, Classroom, Guide, ProjectSummary, Submission } from '@/services/types'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// --- Estado del listado / tablas -----------------------------------------
const loading = ref(false)
/** Perfil del usuario de la sesión: define la vista (docente vs. alumno) */
const currentUser = ref<AuthUser | null>(null)
const guides = ref<Guide[]>([])
const projects = ref<ProjectSummary[]>([])
const classrooms = ref<Classroom[]>([])
/** Filtro de aula aplicado al listado (id del aula o vacío = todas) */
const classroomFilter = ref('')
const submissions = ref<Submission[]>([])
const submissionsTotal = ref(0)
const listError = ref('')
const notice = ref('')
const studentFilter = ref('')

// --- Estado del alta de entrega (alumno) -----------------------------------
const deliveryGuideId = ref('')
const deliveryProjectId = ref('')
const deliverySubmitting = ref(false)
const deliveryError = ref('')
const deliveryNotice = ref('')

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

const fieldErrors = computed<Record<string, string>>(() => {
  if (!submitted.value) return {}

  const errors: Record<string, string> = {}
  if (!form.title.trim()) errors.title = 'Ingresá un título para la guía'
  if (!form.instructions.trim()) errors.instructions = 'Ingresá la consigna para el alumno'
  if (!form.classroomId) errors.classroom = 'Elegí el aula a la que pertenece la guía'
  if (!form.templateUrl.trim() && !form.projectId) {
    errors.template = 'Asociá un proyecto plantilla (URL o selector)'
  }
  return errors
})

/** Solo el docente ve el formulario y las acciones de edición */
const isTeacher = computed(() => currentUser.value?.role === 'TEACHER')

const isEditing = computed(() => editingId.value !== null)

const listTitle = computed(() => (isTeacher.value ? 'Mis guías' : 'Guías disponibles'))

const submissionsTitle = computed(() => (isTeacher.value ? 'Alumnos inscritos' : 'Mis entregas'))

const subtitle = computed(() =>
  isTeacher.value
    ? 'Creá consignas por aula vinculando un circuito de plantilla y seguí las entregas de tus alumnos. Tocá una guía para abrir su plantilla en el simulador.'
    : 'Consultá tus entregas y abrí el circuito plantilla de cada guía en el simulador.',
)

const emptyGuidesMessage = computed(() =>
  isTeacher.value
    ? 'Todavía no creaste guías. Usá el formulario para crear la primera.'
    : 'No hay guías disponibles todavía.',
)

const emptySubmissionsMessage = computed(() => {
  const scope = studentFilter.value ? 'esta guía' : isTeacher.value ? 'tus guías' : 'ninguna guía'
  return isTeacher.value
    ? `Ningún alumno entregó todavía en ${scope}.`
    : `Todavía no entregaste en ${scope}.`
})

// --- Carga de datos -------------------------------------------------------

/** URL canónica de un proyecto compartido (la usa el backend para shareUrl) */
function shareUrl(shareSlug: string): string {
  return `${window.location.origin}/share/${shareSlug}`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
  const result = await listSubmissions({ guideId: studentFilter.value || undefined, take: 100 })
  submissions.value = result.items
  submissionsTotal.value = result.total
}

async function refreshAll(): Promise<void> {
  loading.value = true
  listError.value = ''
  try {
    // Primero el perfil: de él depende qué se carga y qué se muestra
    currentUser.value = await authStore.fetchUser()

    const tasks: Promise<unknown>[] = [
      loadGuides(),
      loadSubmissions(),
      loadProjects(),
      loadClassrooms(),
    ]

    await Promise.all(tasks)
  } catch (err) {
    listError.value = extractApiErrorMessage(err, 'No se pudieron cargar las guías.')
  } finally {
    loading.value = false
  }
}

/**
 * Entrega un proyecto propio a una guía (alumno):
 * vincula el proyecto seleccionado con la guía elegida.
 */
async function submitDelivery(): Promise<void> {
  deliveryError.value = ''
  deliveryNotice.value = ''

  if (!deliveryGuideId.value) {
    deliveryError.value = 'Elegí una guía para entregar'
    return
  }
  if (!deliveryProjectId.value) {
    deliveryError.value = 'Elegí tu proyecto entregado'
    return
  }

  deliverySubmitting.value = true
  try {
    await createSubmission(deliveryGuideId.value, deliveryProjectId.value)
    deliveryNotice.value = 'Entrega registrada correctamente'
    deliveryGuideId.value = ''
    deliveryProjectId.value = ''
    await loadSubmissions()
  } catch (err) {
    deliveryError.value = extractApiErrorMessage(err, 'No se pudo registrar la entrega.')
  } finally {
    deliverySubmitting.value = false
  }
}

// --- Acciones del formulario ----------------------------------------------

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

async function onSubmit(): Promise<void> {
  submitted.value = true
  formError.value = ''
  notice.value = ''

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
      notice.value = 'Guía actualizada correctamente'
    } else {
      await createGuide(payload)
      notice.value = 'Guía creada correctamente'
    }

    resetForm()
    await Promise.all([loadGuides(), loadSubmissions()])
  } catch (err) {
    formError.value = extractApiErrorMessage(err, 'No se pudo guardar la guía.')
  } finally {
    submitting.value = false
  }
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

function startEdit(guide: Guide): void {
  editingId.value = guide.id
  submitted.value = false
  formError.value = ''
  notice.value = ''
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

async function removeGuide(guide: Guide): Promise<void> {
  const confirmed = window.confirm(
    `¿Eliminar la guía "${guide.title}"? Sus entregas se borrarán en cascada.`,
  )
  if (!confirmed) return

  listError.value = ''
  try {
    await deleteGuide(guide.id)
    notice.value = 'Guía eliminada'
    if (editingId.value === guide.id) resetForm()
    await Promise.all([loadGuides(), loadSubmissions()])
  } catch (err) {
    listError.value = extractApiErrorMessage(err, 'No se pudo eliminar la guía.')
  }
}

// --- Simulador React -------------------------------------------------------

/** Clic en una guía: abre su circuito plantilla en el simulador React */
function openGuideInSimulator(guide: Guide): void {
  if (!guide.starterProject?.shareSlug) return
  window.open(simulatorProjectUrl(guide.starterProject.shareSlug), '_blank', 'noopener')
}

/** Clic en una entrega: abre el estado guardado en el simulador React */
function openInSimulator(submission: Submission): void {
  if (!submission.project) return
  window.open(simulatorProjectUrl(submission.project.shareSlug), '_blank', 'noopener')
}

onMounted(refreshAll)
</script>

<template>
  <div class="guides-page">
    <header class="page-header">
      <div>
        <h1>Guías prácticas</h1>
        <p class="subtitle">
          {{ subtitle }}
        </p>
      </div>
      <button type="button" class="btn btn-ghost" :disabled="loading" @click="refreshAll">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </header>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

    <div class="grid" :class="{ 'grid--single': !isTeacher }">
      <!-- ============================================================
           Formulario CRUD de guías (solo docentes)
           ============================================================ -->
      <section v-if="isTeacher" class="card" aria-labelledby="form-title">
        <h2 id="form-title">{{ isEditing ? 'Editar guía' : 'Nueva guía' }}</h2>

        <form novalidate @submit.prevent="onSubmit">
          <div class="field">
            <label for="guide-title">Título</label>
            <input
              id="guide-title"
              v-model="form.title"
              type="text"
              maxlength="200"
              placeholder="Práctica 1 — LED parpadeante"
            />
            <span v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</span>
          </div>

          <div class="field">
            <label for="guide-instructions">Instrucciones (consigna)</label>
            <textarea
              id="guide-instructions"
              v-model="form.instructions"
              rows="6"
              maxlength="10000"
              placeholder="Conectá un LED al pin 13 con resistencia de 220Ω y hacélo parpadear cada segundo."
            ></textarea>
            <span v-if="fieldErrors.instructions" class="field-error">
              {{ fieldErrors.instructions }}
            </span>
          </div>

          <div class="field">
            <label for="guide-classroom">Aula</label>
            <select id="guide-classroom" v-model="form.classroomId">
              <option value="">— Elegí el aula —</option>
              <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">
                {{ classroom.name }}
              </option>
            </select>
            <span class="hint"> La guía solo la verán los alumnos inscriptos en el aula. </span>
            <span v-if="classrooms.length === 0" class="hint">
              Todavía no tenés aulas.
              <router-link to="/aulas">Creá una en Gestión de Aulas</router-link>.
            </span>
            <span v-if="fieldErrors.classroom" class="field-error">{{
              fieldErrors.classroom
            }}</span>
          </div>

          <div class="field">
            <label for="guide-project">Proyecto inicial plantilla</label>
            <select id="guide-project" v-model="form.projectId" @change="onProjectChange">
              <option value="">— Elegir de mis proyectos —</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.title }} · {{ project.shareSlug }}{{ project.isTemplate ? ' · plantilla' : '' }}
              </option>
            </select>
            <span class="hint">
              Elegí un proyecto propio o pegá su URL abajo. Los marcados como plantilla abren
              en el simulador como circuito inicial de la guía.
            </span>
          </div>

          <div class="field">
            <label for="guide-url">URL del circuito plantilla</label>
            <input
              id="guide-url"
              v-model="form.templateUrl"
              type="text"
              placeholder="http://localhost:5174/share/a9f3b2"
              @input="markUrlTouched"
            />
            <span class="hint">
              Acepta una URL de plantilla, un shareSlug de 6 caracteres o el UUID del proyecto.
            </span>
            <span v-if="fieldErrors.template" class="field-error">{{ fieldErrors.template }}</span>
          </div>

          <p v-if="formError" class="error" role="alert">{{ formError }}</p>

          <div class="actions">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear guía' }}
            </button>
            <button v-if="isEditing" type="button" class="btn btn-ghost" @click="resetForm">
              Cancelar
            </button>
          </div>
        </form>
      </section>

      <!-- ============================================================
           Listado de guías: "Mis guías" para el docente,
           "Guías disponibles" para el alumno (solo lectura)
           ============================================================ -->
      <section class="card" aria-labelledby="list-title">
        <div class="card-header">
          <h2 id="list-title">{{ listTitle }}</h2>
          <div class="filters">
            <label class="sr-only" for="classroom-filter">Filtrar por aula</label>
            <select id="classroom-filter" v-model="classroomFilter" @change="loadGuides">
              <option value="">Todas las aulas</option>
              <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">
                {{ classroom.name }}
              </option>
            </select>
            <span class="badge">{{ guides.length }}</span>
          </div>
        </div>

        <p v-if="listError" class="error" role="alert">{{ listError }}</p>
        <p v-else-if="loading" class="muted">Cargando guías…</p>
        <p v-else-if="guides.length === 0" class="muted">
          {{ emptyGuidesMessage }}
        </p>

        <div v-else class="table-wrap">
          <table id="guides-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Aula</th>
                <th>Circuito plantilla</th>
                <th>Creada</th>
                <th v-if="isTeacher">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="guide in guides"
                :key="guide.id"
                :class="{ 'is-selected': guide.id === studentFilter }"
                title="Abrir la guía plantilla en el simulador"
                @click="openGuideInSimulator(guide)"
              >
                <td>
                  <strong>{{ guide.title }}</strong>
                </td>
                <td>{{ guide.classroom?.name ?? '—' }}</td>
                <td>
                  <span>{{ guide.starterProject.title }}</span>
                  <a
                    class="template-link"
                    :href="simulatorProjectUrl(guide.starterProject.shareSlug)"
                    target="_blank"
                    rel="noopener"
                    :title="`Abrir ${guide.starterProject.title} en el simulador`"
                    @click.stop
                  >
                    <code class="slug">/share/{{ guide.starterProject.shareSlug }}</code>
                    <span aria-hidden="true">↗</span>
                  </a>
                </td>
                <td>{{ formatDate(guide.createdAt) }}</td>
                <td v-if="isTeacher" class="row-actions">
                  <button type="button" class="btn btn-small" @click.stop="startEdit(guide)">
                    Editar
                  </button>
                  <button
                    type="button"
                    class="btn btn-small btn-danger"
                    @click.stop="removeGuide(guide)"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- ============================================================
         Entrega de guía (solo alumno): vincula un proyecto propio
         con la guía elegida (POST /submissions)
         ============================================================ -->
    <section v-if="!isTeacher" class="card" aria-labelledby="delivery-form-title">
      <div class="card-header">
        <h2 id="delivery-form-title">Entregar a una guía</h2>
      </div>

      <p class="muted">
        Elegí la guía y el proyecto que querés entregar. La entrega queda visible para el docente.
      </p>

      <div class="delivery-fields">
        <div class="field">
          <label for="delivery-guide">Guía</label>
          <select id="delivery-guide" v-model="deliveryGuideId">
            <option value="">— Elegí una guía —</option>
            <option v-for="guide in guides" :key="guide.id" :value="guide.id">
              {{ guide.title }} · {{ guide.classroom?.name ?? '' }}
            </option>
          </select>
        </div>

        <div class="field">
          <label for="delivery-project">Tu proyecto</label>
          <select id="delivery-project" v-model="deliveryProjectId">
            <option value="">— Elegí tu proyecto —</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.title }} · {{ project.shareSlug }}
            </option>
          </select>
        </div>
      </div>

      <p v-if="deliveryError" class="error" role="alert">{{ deliveryError }}</p>
      <p v-if="deliveryNotice" class="notice" role="status">{{ deliveryNotice }}</p>

      <div class="actions">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="deliverySubmitting"
          @click="submitDelivery"
        >
          {{ deliverySubmitting ? 'Entregando…' : 'Entregar' }}
        </button>
      </div>
    </section>

    <!-- ============================================================
         Entregas: "Alumnos inscritos" para el docente (revisión)
         y "Mis entregas" para el alumno
         ============================================================ -->
    <section class="card" aria-labelledby="students-title">
      <div class="card-header">
        <h2 id="students-title">{{ submissionsTitle }}</h2>
        <div class="filters">
          <label class="sr-only" for="guide-filter">Filtrar por guía</label>
          <select id="guide-filter" v-model="studentFilter" @change="loadSubmissions">
            <option value="">Todas las guías</option>
            <option v-for="guide in guides" :key="guide.id" :value="guide.id">
              {{ guide.title }} · {{ guide.classroom?.name ?? '' }}
            </option>
          </select>
          <span class="badge">{{ submissionsTotal }}</span>
        </div>
      </div>

      <p v-if="loading" class="muted">Cargando entregas…</p>
      <p v-else-if="submissions.length === 0" class="muted">
        {{ emptySubmissionsMessage }}
      </p>

      <div v-else class="table-wrap">
        <table id="submissions-table">
          <thead>
            <tr>
              <th v-if="isTeacher">Alumno</th>
              <th v-if="isTeacher">Correo</th>
              <th>Guía</th>
              <th>Proyecto entregado</th>
              <th>Entregado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="submission in submissions"
              :key="submission.id"
              title="Abrir en el simulador"
              @click="openInSimulator(submission)"
            >
              <td v-if="isTeacher">{{ submission.student?.name ?? 'Alumno sin nombre' }}</td>
              <td v-if="isTeacher">{{ submission.student?.email ?? '—' }}</td>
              <td>{{ submission.guide?.title ?? '—' }}</td>
              <td>
                <span>{{ submission.project?.title ?? '—' }}</span>
                <code v-if="submission.project" class="slug">
                  /share/{{ submission.project.shareSlug }}
                </code>
              </td>
              <td>
                <time :datetime="submission.submittedAt">
                  {{ formatDateTime(submission.submittedAt) }}
                </time>
              </td>
              <td class="row-actions">
                <a
                  v-if="submission.project"
                  class="btn btn-small btn-link"
                  :href="simulatorProjectUrl(submission.project.shareSlug)"
                  target="_blank"
                  rel="noopener"
                  @click.stop
                >
                  Abrir ↗
                </a>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.guides-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1 {
  font-size: 1.5rem;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.grid {
  display: grid;
  grid-template-columns: minmax(320px, 420px) 1fr;
  gap: 1.25rem;
  align-items: start;
}

/* El alumno no ve el formulario: el listado ocupa todo el ancho */
.grid--single {
  grid-template-columns: 1fr;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.card h2 {
  font-size: 1.05rem;
  color: #0f172a;
  margin-bottom: 1rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.card-header h2 {
  margin-bottom: 0;
}

.badge {
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.15rem 0.6rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.field input,
.field select,
.field textarea,
.filters select {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  font-size: 0.9rem;
  font-family: inherit;
  color: #0f172a;
  background: #fff;
}

.field input:focus,
.field select:focus,
.field textarea:focus,
.filters select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 1px;
  border-color: #3b82f6;
}

.field textarea {
  resize: vertical;
}

.hint {
  font-size: 0.76rem;
  color: #94a3b8;
}

.field-error {
  font-size: 0.78rem;
  color: #b91c1c;
}

.actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.btn {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
}

.btn:hover:not(:disabled) {
  background: #f8fafc;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-ghost {
  background: transparent;
}

.btn-danger {
  color: #b91c1c;
  border-color: #fecaca;
}

.btn-danger:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-small {
  padding: 0.3rem 0.6rem;
  font-size: 0.78rem;
}

/* Ancla "Abrir ↗" de la tabla de entregas: mismo estilo que .btn pero
   hereda el comportamiento de enlace (target _blank) */
a.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  text-decoration: none;
  line-height: 1.4;
}

a.btn:hover {
  text-decoration: none;
}

.notice {
  margin: 0;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  font-size: 0.875rem;
}

.error {
  margin: 0 0 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
}

.muted {
  color: #64748b;
  font-size: 0.875rem;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th,
td {
  text-align: left;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

th {
  color: #64748b;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover {
  background: #f8fafc;
}

tbody tr.is-selected {
  background: #eff6ff;
}

.slug {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  background: #f8fafc;
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  margin-top: 0.2rem;
  width: fit-content;
}

/* Enlace al circuito plantilla: el clic abre el simulador y no
   selecciona la fila (evita duplicar la acción) */
.template-link {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  color: #64748b;
  font-size: 0.8rem;
  text-decoration: none;
}

.template-link:hover .slug {
  background: #e2e8f0;
  color: #334155;
}

.row-actions {
  white-space: nowrap;
}

.row-actions .btn + .btn {
  margin-left: 0.4rem;
}

.filters {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.delivery-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 720px) {
  .delivery-fields {
    grid-template-columns: 1fr;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import {
  createClassroom,
  deleteClassroom,
  joinClassroom,
  listClassroomStudents,
  listClassrooms,
  regenerateClassroomCode,
  removeClassroomStudent,
} from '@/services/classrooms'
import { listGuides } from '@/services/guides'
import type { AuthUser, Classroom, ClassroomStudent, Guide } from '@/services/types'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// --- Estado general ---------------------------------------------------------
const loading = ref(false)
const listError = ref('')
const notice = ref('')
const currentUser = ref<AuthUser | null>(null)
const classrooms = ref<Classroom[]>([])

/** Solo el docente crea y administra aulas (el backend limita POST /classrooms a TEACHER) */
const isTeacher = computed(() => currentUser.value?.role === 'TEACHER')
/** El flujo del alumno es exclusivo de STUDENT; admin queda fuera de alcance */
const isStudent = computed(() => currentUser.value?.role === 'STUDENT')

// --- Estado del formulario de creación (docente) -----------------------------
const newClassroomName = ref('')
const creating = ref(false)
const createError = ref('')
const createdClassroom = ref<Classroom | null>(null)

// --- Alumnos inscriptos (panel expansible) -----------------------------------
const expandedClassroomId = ref<string | null>(null)
const students = ref<ClassroomStudent[]>([])
const studentsLoading = ref(false)
const studentsError = ref('')

// --- Estado del alumno: unirme por código y ver guías por aula ----------------
const guides = ref<Guide[]>([])
const joinCode = ref('')
const joining = ref(false)
const joinError = ref('')

/** Guías visibles agrupadas por aula (solo alumno) */
const guidesByClassroom = computed<Record<string, Guide[]>>(() => {
  const map: Record<string, Guide[]> = {}
  for (const guide of guides.value) {
    const list = map[guide.classroomId] ?? (map[guide.classroomId] = [])
    list.push(guide)
  }
  return map
})

const subtitle = computed(() =>
  isTeacher.value
    ? 'Creá aulas, compartí el código de unión con tus alumnos y administrá las inscripciones.'
    : 'Tus aulas inscriptas y las guías de cada una.',
)

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

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

// --- Acciones del docente ----------------------------------------------------

async function onCreate(): Promise<void> {
  createError.value = ''
  createdClassroom.value = null

  const name = newClassroomName.value.trim()
  if (!name) {
    createError.value = 'Ingresá un nombre para el aula'
    return
  }

  creating.value = true
  try {
    createdClassroom.value = await createClassroom(name)
    notice.value = `Aula "${createdClassroom.value.name}" creada`
    newClassroomName.value = ''
    await loadClassrooms()
  } catch (err) {
    createError.value = extractApiErrorMessage(err, 'No se pudo crear el aula.')
  } finally {
    creating.value = false
  }
}

/** Aula actualmente expandida (para las acciones del panel de alumnos) */
function currentClassroomForPanel(): Classroom {
  const found = classrooms.value.find((c) => c.id === expandedClassroomId.value)
  // El panel solo existe si hay un aula expandida; este fallback nunca debería ejecutarse
  if (!found) throw new Error('No hay un aula expandida')
  return found
}

/** Muestra/oculta el listado de alumnos inscriptos de un aula */
async function toggleStudents(classroom: Classroom): Promise<void> {
  if (expandedClassroomId.value === classroom.id) {
    expandedClassroomId.value = null
    students.value = []
    return
  }

  expandedClassroomId.value = classroom.id
  students.value = []
  studentsError.value = ''
  studentsLoading.value = true
  try {
    students.value = await listClassroomStudents(classroom.id)
  } catch (err) {
    studentsError.value = extractApiErrorMessage(err, 'No se pudieron cargar los alumnos del aula.')
  } finally {
    studentsLoading.value = false
  }
}

async function onRegenerateCode(classroom: Classroom): Promise<void> {
  const confirmed = window.confirm(
    `¿Regenerar el código de "${classroom.name}"? El código anterior quedará invalidado.`,
  )
  if (!confirmed) return

  notice.value = ''
  listError.value = ''
  try {
    const { code } = await regenerateClassroomCode(classroom.id)
    classroom.code = code
    notice.value = 'Código regenerado correctamente'
  } catch (err) {
    listError.value = extractApiErrorMessage(err, 'No se pudo regenerar el código.')
  }
}

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
    notice.value = 'Alumno removido del aula'
  } catch (err) {
    studentsError.value = extractApiErrorMessage(err, 'No se pudo quitar al alumno.')
  }
}

async function onDeleteClassroom(classroom: Classroom): Promise<void> {
  const confirmed = window.confirm(
    `¿Eliminar el aula "${classroom.name}"? Las inscripciones se borrarán en cascada.`,
  )
  if (!confirmed) return

  notice.value = ''
  listError.value = ''
  try {
    await deleteClassroom(classroom.id)
    if (expandedClassroomId.value === classroom.id) {
      expandedClassroomId.value = null
      students.value = []
    }
    notice.value = 'Aula eliminada'
    await loadClassrooms()
  } catch (err) {
    listError.value = extractApiErrorMessage(
      err,
      'No se pudo eliminar el aula. Recordá que debe estar sin guías vinculadas.',
    )
  }
}

// --- Acciones del alumno ------------------------------------------------------

async function onJoin(): Promise<void> {
  joinError.value = ''
  notice.value = ''

  const code = joinCode.value.trim()
  if (!code) {
    joinError.value = 'Ingresá el código del aula'
    return
  }

  joining.value = true
  try {
    const joined = await joinClassroom(code)
    notice.value = `Te uniste al aula "${joined.name}"`
    joinCode.value = ''
    await Promise.all([loadClassrooms(), loadGuides()])
  } catch (err) {
    // 404: código inexistente · 409: ya estás inscripto
    joinError.value = extractApiErrorMessage(err, 'No se pudo unir al aula. Verificá el código.')
  } finally {
    joining.value = false
  }
}

async function onLeave(classroom: Classroom): Promise<void> {
  const user = currentUser.value
  if (!user) return

  const confirmed = window.confirm(`¿Dejar el aula "${classroom.name}"?`)
  if (!confirmed) return

  notice.value = ''
  listError.value = ''
  try {
    await removeClassroomStudent(classroom.id, user.id)
    notice.value = `Te retiraste del aula "${classroom.name}"`
    await Promise.all([loadClassrooms(), loadGuides()])
  } catch (err) {
    listError.value = extractApiErrorMessage(err, 'No se pudo dejar el aula.')
  }
}

onMounted(refreshAll)
</script>

<template>
  <div class="aulas-page">
    <header class="page-header">
      <div>
        <h1>Gestión de Aulas</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <button type="button" class="btn btn-ghost" :disabled="loading" @click="refreshAll">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </header>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

    <div class="grid" :class="{ 'grid--single': !isTeacher }">
      <!-- ============================================================
           Crear aula (solo docente/admin): genera el código de unión
           ============================================================ -->
      <section v-if="isTeacher" class="card" aria-labelledby="create-classroom-title">
        <h2 id="create-classroom-title">Nueva aula</h2>

        <form novalidate @submit.prevent="onCreate">
          <div class="field">
            <label for="classroom-name">Nombre del aula</label>
            <input
              id="classroom-name"
              v-model="newClassroomName"
              type="text"
              maxlength="120"
              placeholder="5to año — comisión A"
            />
          </div>

          <p v-if="createError" class="error" role="alert">{{ createError }}</p>

          <div class="actions">
            <button type="submit" class="btn btn-primary" :disabled="creating">
              {{ creating ? 'Creando…' : 'Crear aula' }}
            </button>
          </div>
        </form>

        <!-- Código recién generado: solo lo conserva el docente dueño -->
        <div v-if="createdClassroom?.code" class="code-callout" role="status">
          <span class="code-callout-label"> Código de unión de «{{ createdClassroom.name }}» </span>
          <code class="code-callout-value">{{ createdClassroom.code }}</code>
          <span class="hint">
            Compartilo con tus alumnos: se unen desde «/aulas» con este código.
          </span>
        </div>
      </section>

      <!-- ============================================================
           Unirme a un aula (solo alumno): código de 6 caracteres
           ============================================================ -->
      <section v-if="isStudent" class="card" aria-labelledby="join-classroom-title">
        <h2 id="join-classroom-title">Unirme a un aula</h2>
        <p class="muted">Ingresá el código de unión que te compartió tu docente.</p>

        <form novalidate @submit.prevent="onJoin">
          <div class="field">
            <label for="join-code">Código del aula</label>
            <input
              id="join-code"
              v-model="joinCode"
              type="text"
              maxlength="12"
              autocomplete="off"
              spellcheck="false"
              placeholder="a9f3b2"
            />
          </div>

          <p v-if="joinError" class="error" role="alert">{{ joinError }}</p>

          <div class="actions">
            <button type="submit" class="btn btn-primary" :disabled="joining">
              {{ joining ? 'Uniéndote…' : 'Unirme' }}
            </button>
          </div>
        </form>
      </section>

      <!-- ============================================================
           Listado de aulas
           ============================================================ -->
      <section class="card" aria-labelledby="classrooms-list-title">
        <div class="card-header">
          <h2 id="classrooms-list-title">
            {{ isTeacher ? 'Mis aulas' : 'Mis aulas inscriptas' }}
          </h2>
          <span class="badge">{{ classrooms.length }}</span>
        </div>

        <p v-if="listError" class="error" role="alert">{{ listError }}</p>
        <p v-else-if="loading" class="muted">Cargando aulas…</p>
        <p v-else-if="classrooms.length === 0" class="muted">
          {{
            isTeacher
              ? 'Todavía no creaste aulas. Usá el formulario para crear la primera.'
              : 'Todavía no te uniste a ninguna aula.'
          }}
        </p>
        <p v-else-if="!isTeacher && !isStudent" class="muted">
          La vista de administración de aulas está fuera del alcance por ahora.
        </p>

        <div v-else-if="isTeacher" class="table-wrap">
          <table id="classrooms-table">
            <thead>
              <tr>
                <th>Aula</th>
                <th v-if="isTeacher">Código</th>
                <th>Alumnos</th>
                <th>Guías</th>
                <th>Creada</th>
                <th v-if="isTeacher">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="classroom in classrooms" :key="classroom.id">
                <td>
                  <strong>{{ classroom.name }}</strong>
                  <span class="hint">Docente: {{ classroom.teacher?.name ?? '—' }}</span>
                </td>
                <td v-if="isTeacher">
                  <code v-if="classroom.code" class="code-chip">{{ classroom.code }}</code>
                  <span v-else class="muted">—</span>
                </td>
                <td>{{ classroom.memberCount }}</td>
                <td>{{ classroom.guideCount }}</td>
                <td>{{ formatDate(classroom.createdAt) }}</td>
                <td v-if="isTeacher" class="row-actions">
                  <button
                    type="button"
                    class="btn btn-small"
                    :aria-expanded="expandedClassroomId === classroom.id"
                    @click="toggleStudents(classroom)"
                  >
                    {{ expandedClassroomId === classroom.id ? 'Ocultar' : 'Alumnos' }}
                  </button>
                  <button type="button" class="btn btn-small" @click="onRegenerateCode(classroom)">
                    Regenerar código
                  </button>
                  <button
                    type="button"
                    class="btn btn-small btn-danger"
                    @click="onDeleteClassroom(classroom)"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ============================================================
             Aulas del alumno, cada una con sus guías inscriptas visibles
             ============================================================ -->
        <div v-else-if="isStudent" class="aula-list">
          <article v-for="classroom in classrooms" :key="classroom.id" class="aula-block">
            <div class="aula-block-head">
              <div>
                <h3>{{ classroom.name }}</h3>
                <p class="hint">
                  Docente: {{ classroom.teacher?.name ?? '—' }} · {{ classroom.memberCount }}
                  {{ classroom.memberCount === 1 ? 'alumno' : 'alumnos' }} ·
                  {{ classroom.guideCount }} {{ classroom.guideCount === 1 ? 'guía' : 'guías' }}
                </p>
              </div>
              <button type="button" class="btn btn-small btn-danger" @click="onLeave(classroom)">
                Dejar el aula
              </button>
            </div>

            <ul class="guide-list">
              <li
                v-for="guide in guidesByClassroom[classroom.id] ?? []"
                :key="guide.id"
                class="guide-row"
              >
                <span>
                  <strong>{{ guide.title }}</strong>
                  <span class="hint">Creada: {{ formatDate(guide.createdAt) }}</span>
                </span>
              </li>
              <li
                v-if="(guidesByClassroom[classroom.id]?.length ?? 0) === 0"
                class="muted guide-row"
              >
                El docente todavía no publicó guías en esta aula.
              </li>
            </ul>
          </article>

          <p class="muted aula-list-footer">
            Entregá las guías desde
            <router-link to="/guias">Guías Prácticas</router-link>.
          </p>
        </div>

        <!-- ============================================================
             Alumnos inscriptos del aula expandida (solo docente/admin)
             ============================================================ -->
        <div v-if="isTeacher && expandedClassroomId" class="students-panel">
          <div class="card-header">
            <h3>Alumnos inscriptos</h3>
            <span class="badge">{{ students.length }}</span>
          </div>

          <p v-if="studentsError" class="error" role="alert">{{ studentsError }}</p>
          <p v-else-if="studentsLoading" class="muted">Cargando alumnos…</p>
          <p v-else-if="students.length === 0" class="muted">
            Todavía no hay alumnos inscriptos en esta aula.
          </p>

          <table v-else id="classroom-students-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Inscripto</th>
                <th>Quitar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id">
                <td>{{ student.name }}</td>
                <td>{{ student.email }}</td>
                <td>{{ formatDate(student.joinedAt) }}</td>
                <td>
                  <button
                    type="button"
                    class="btn btn-small btn-danger"
                    @click="onRemoveStudent(currentClassroomForPanel(), student)"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.aulas-page {
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

.card-header h2,
.card-header h3 {
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

.field input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  font-size: 0.9rem;
  font-family: inherit;
  color: #0f172a;
  background: #fff;
}

.field input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 1px;
  border-color: #3b82f6;
}

.hint {
  display: block;
  font-size: 0.76rem;
  color: #94a3b8;
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

.code-chip {
  font-size: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.15rem 0.4rem;
  letter-spacing: 0.06em;
}

.code-callout {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  border-radius: 10px;
}

.code-callout-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #166534;
}

.code-callout-value {
  align-self: flex-start;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  background: #fff;
  border: 1px dashed #86efac;
  border-radius: 8px;
  padding: 0.3rem 0.8rem;
  color: #14532d;
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
  vertical-align: middle;
}

th {
  color: #64748b;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
}

.row-actions {
  white-space: nowrap;
}

.row-actions .btn + .btn {
  margin-left: 0.4rem;
}

.aula-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.aula-block {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  background: #f8fafc;
}

.aula-block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.6rem;
}

.aula-block-head h3 {
  font-size: 1rem;
  color: #0f172a;
  margin-bottom: 0.2rem;
}

.guide-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.6rem;
}

.guide-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #0f172a;
}

.aula-list-footer {
  margin: 0;
}

.students-panel {
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  background: #f8fafc;
}

.students-panel h3 {
  font-size: 0.95rem;
  color: #0f172a;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

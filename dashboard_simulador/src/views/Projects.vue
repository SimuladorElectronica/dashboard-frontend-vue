<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import { listProjects, setProjectTemplate } from '@/services/projects'
import { simulatorProjectUrl, simulatorTemplateUrl } from '@/services/simulatorLink'
import type { AuthUser, ProjectSummary } from '@/services/types'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// --- Estado del listado ---------------------------------------------------
const loading = ref(false)
const projects = ref<ProjectSummary[]>([])
const listError = ref('')
const notice = ref('')
/** Perfil de la sesión: define quién puede marcar plantillas (ADMIN o TEACHER dueño) */
const currentUser = ref<AuthUser | null>(null)
/** Id del proyecto cuya plantilla se está marcando (deshabilita su botón) */
const templatePendingId = ref<string | null>(null)

const subtitle = computed(
  () => 'Circuitos guardados en tu cuenta. Abrí cualquiera en el simulador para seguir editándolo.',
)

const emptyMessage = computed(
  () => 'Todavía no tenés proyectos. Guardá un circuito desde el simulador y aparecerá acá.',
)

// --- Fechas ---------------------------------------------------------------
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// --- Acciones -------------------------------------------------------------
/** ¿El usuario puede marcar/desmarcar plantillas de este proyecto? (ADMIN o el TEACHER dueño) */
function canManageTemplate(project: ProjectSummary): boolean {
  const user = currentUser.value
  if (!user) return false
  if (user.role === 'ADMIN') return true
  // El backend permite al docente dueño marcar/desmarcar su propio proyecto
  return user.role === 'TEACHER' && project.userId !== null && project.userId === user.id
}

/** Clic en la fila: abre el circuito en el simulador React */
function openInSimulator(project: ProjectSummary): void {
  window.open(simulatorProjectUrl(project.shareSlug), '_blank', 'noopener')
}

/** Marca o desmarca el proyecto como plantilla pública del simulador (PATCH /projects/:id/template) */
async function toggleTemplate(project: ProjectSummary): Promise<void> {
  listError.value = ''
  notice.value = ''
  templatePendingId.value = project.id
  try {
    const updated = await setProjectTemplate(project.id, !project.isTemplate)
    projects.value = projects.value.map((item) =>
      item.id === project.id ? { ...item, isTemplate: updated.isTemplate } : item,
    )
    notice.value = updated.isTemplate
      ? `"${updated.title}" marcado como plantilla`
      : `"${updated.title}" ya no es plantilla`
  } catch (err) {
    listError.value = extractApiErrorMessage(err, 'No se pudo actualizar el estado de plantilla.')
  } finally {
    templatePendingId.value = null
  }
}

/** Copia al portapapeles un texto, con fallback para contextos sin Clipboard API */
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

/** Copia el enlace público de la plantilla (la abre el simulador sin sesión) */
async function copyTemplateLink(project: ProjectSummary): Promise<void> {
  listError.value = ''
  notice.value = ''
  const url = simulatorTemplateUrl(project.shareSlug)
  try {
    await copyToClipboard(url)
    notice.value = 'Enlace de la plantilla copiado al portapapeles'
  } catch {
    listError.value = `No se pudo copiar el enlace. Copialo manualmente: ${url}`
  }
}

async function refresh(): Promise<void> {
  loading.value = true
  listError.value = ''
  try {
    // El perfil define quién puede gestionar plantillas (ADMIN o TEACHER dueño)
    currentUser.value = await authStore.fetchUser()
    // Con token el backend devuelve solo los proyectos del usuario logueado
    projects.value = await listProjects()
  } catch (err) {
    listError.value = extractApiErrorMessage(err, 'No se pudieron cargar tus proyectos.')
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<template>
  <div class="projects-page">
    <header class="page-header">
      <div>
        <h1>Mis proyectos</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <button type="button" class="btn btn-ghost" :disabled="loading" @click="refresh">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </header>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

    <section class="card" aria-labelledby="projects-title">
      <div class="card-header">
        <h2 id="projects-title">Circuitos guardados</h2>
        <span class="badge">{{ projects.length }}</span>
      </div>

      <p v-if="listError" class="error" role="alert">{{ listError }}</p>
      <p v-else-if="loading" class="muted">Cargando proyectos…</p>
      <p v-else-if="projects.length === 0" class="muted">{{ emptyMessage }}</p>

      <div v-else class="table-wrap">
        <table id="projects-table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Enlace</th>
              <th>Visibilidad</th>
              <th>Creado</th>
              <th>Actualizado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="project in projects"
              :key="project.id"
              title="Abrir en el simulador"
              @click="openInSimulator(project)"
            >
              <td>
                <strong>{{ project.title }}</strong>
                <span v-if="project.description" class="description">
                  {{ project.description }}
                </span>
              </td>
              <td>
                <code class="slug">/share/{{ project.shareSlug }}</code>
              </td>
              <td>
                <span
                  class="visibility"
                  :class="project.isPublic ? 'visibility--public' : 'visibility--private'"
                >
                  {{ project.isPublic ? 'Público' : 'Privado' }}
                </span>
                <span v-if="project.isTemplate" class="template-pill">Plantilla</span>
              </td>
              <td>{{ formatDate(project.createdAt) }}</td>
              <td>
                <time :datetime="project.updatedAt">
                  {{ formatDateTime(project.updatedAt) }}
                </time>
              </td>
              <td class="row-actions">
                <button
                  v-if="canManageTemplate(project)"
                  type="button"
                  class="btn btn-small template-toggle"
                  :class="{ 'template-toggle--on': project.isTemplate }"
                  :aria-pressed="project.isTemplate"
                  :disabled="templatePendingId === project.id"
                  :title="
                    project.isTemplate
                      ? 'Quitar el estado de plantilla'
                      : 'Marcar como plantilla pública del simulador'
                  "
                  @click.stop="toggleTemplate(project)"
                >
                  {{
                    templatePendingId === project.id
                      ? 'Guardando…'
                      : project.isTemplate
                        ? 'Plantilla ✓'
                        : 'Plantilla'
                  }}
                </button>
                <template v-if="project.isTemplate">
                  <a
                    class="btn btn-small btn-link"
                    :href="simulatorTemplateUrl(project.shareSlug)"
                    target="_blank"
                    rel="noopener"
                    title="Abrir como invitado en el simulador (sin sesión)"
                    @click.stop
                  >
                    Plantilla ↗
                  </a>
                  <button
                    type="button"
                    class="btn btn-small"
                    title="Copiar el enlace público de la plantilla"
                    @click.stop="copyTemplateLink(project)"
                  >
                    Copiar enlace
                  </button>
                </template>
                <a
                  class="btn btn-small btn-link"
                  :href="simulatorProjectUrl(project.shareSlug)"
                  target="_blank"
                  rel="noopener"
                  @click.stop
                >
                  Abrir ↗
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.projects-page {
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
  max-width: 60ch;
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

.btn-ghost {
  background: transparent;
}

.btn-small {
  padding: 0.3rem 0.6rem;
  font-size: 0.78rem;
}

/* Ancla "Abrir ↗": mismo estilo que .btn pero hereda el comportamiento
   de enlace (target _blank) */
a.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  text-decoration: none;
  line-height: 1.4;
}

a.btn:hover {
  text-decoration: none;
  background: #f8fafc;
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

td strong {
  display: block;
  color: #0f172a;
}

.description {
  display: block;
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 0.15rem;
  max-width: 42ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slug {
  display: block;
  font-size: 0.75rem;
  color: #475569;
  background: #f1f5f9;
  border-radius: 6px;
  padding: 0.15rem 0.4rem;
  width: fit-content;
}

.visibility {
  display: inline-block;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
}

.visibility--public {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.visibility--private {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.template-pill {
  display: inline-block;
  margin-left: 0.35rem;
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
}

/* Toggle de plantilla: visible solo para ADMIN y para el TEACHER dueño */
.template-toggle--on {
  background: #eef2ff;
  border-color: #a5b4fc;
  color: #4338ca;
}

.template-toggle--on:hover:not(:disabled) {
  background: #e0e7ff;
}

.row-actions {
  white-space: nowrap;
}

.row-actions .btn + .btn {
  margin-left: 0.4rem;
}
</style>

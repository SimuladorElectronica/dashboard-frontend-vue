<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import { listProjects } from '@/services/projects'
import type { ProjectSummary } from '@/services/types'

/** URL base del simulador React (la ruta /p/:shareSlug vive ahí) */
const SIMULATOR_BASE_URL = (import.meta.env.VITE_SIMULATOR_URL || 'http://localhost:5173').replace(
  /\/$/,
  '',
)

// --- Estado del listado ---------------------------------------------------
const loading = ref(false)
const projects = ref<ProjectSummary[]>([])
const listError = ref('')

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
/** URL del proyecto en el simulador React (/p/:shareSlug) */
function simulatorUrl(shareSlug: string): string {
  return `${SIMULATOR_BASE_URL}/p/${shareSlug}`
}

/** Clic en la fila: abre el circuito en el simulador React */
function openInSimulator(project: ProjectSummary): void {
  window.open(simulatorUrl(project.shareSlug), '_blank', 'noopener')
}

async function refresh(): Promise<void> {
  loading.value = true
  listError.value = ''
  try {
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
              </td>
              <td>{{ formatDate(project.createdAt) }}</td>
              <td>
                <time :datetime="project.updatedAt">
                  {{ formatDateTime(project.updatedAt) }}
                </time>
              </td>
              <td class="row-actions">
                <a
                  class="btn btn-small btn-link"
                  :href="simulatorUrl(project.shareSlug)"
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

.row-actions {
  white-space: nowrap;
}
</style>

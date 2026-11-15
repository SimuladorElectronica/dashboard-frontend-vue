<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import { listProjects, setProjectTemplate } from '@/services/projects'
import { simulatorTemplateUrl } from '@/services/simulatorLink'
import type { AuthUser, ProjectSummary } from '@/services/types'
import { useAuthStore } from '@/stores/auth'
import ProjectsTable from '@/components/ProjectsTable.vue'

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

// --- Acciones -------------------------------------------------------------

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

      <ProjectsTable
        v-else
        :projects="projects"
        :current-user="currentUser"
        :template-pending-id="templatePendingId"
        @toggle-template="toggleTemplate"
        @copy-link="copyTemplateLink"
      />
    </section>
  </div>
</template>

<style scoped>
.projects-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
</style>

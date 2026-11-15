<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { extractApiErrorMessage } from '@/services/api'
import { listProjects } from '@/services/projects'
import { listGuides } from '@/services/guides'
import { listSubmissions } from '@/services/submissions'
import DashboardProjectsCard from '@/components/DashboardProjectsCard.vue'
import DashboardGuidesCard from '@/components/DashboardGuidesCard.vue'
import DashboardSubmissionsCard from '@/components/DashboardSubmissionsCard.vue'
import type { AuthUser, Guide, ProjectSummary, Submission } from '@/services/types'

const authStore = useAuthStore()

// --- Estado general ---------------------------------------------------------
const loading = ref(false)
const listError = ref('')
const currentUser = ref<AuthUser | null>(null)

/** Roles helpers: definen la card lateral que se muestra */
const isTeacher = computed(() => currentUser.value?.role === 'TEACHER')
const isStudent = computed(() => currentUser.value?.role === 'STUDENT')

// --- Datos del dashboard ----------------------------------------------------
const recentProjects = ref<ProjectSummary[]>([])
const studentGuides = ref<Guide[]>([])
const submissions = ref<Submission[]>([])

// --- Carga de datos ---------------------------------------------------------
async function loadDashboard(): Promise<void> {
  loading.value = true
  listError.value = ''
  try {
    // Primero el perfil: define qué datos se cargan
    currentUser.value = await authStore.fetchUser()
    const user = currentUser.value
    if (!user) {
      listError.value = 'No se pudo identificar tu usuario.'
      return
    }

    // Proyectos propios más recientes (todos los roles)
    recentProjects.value = await listProjects(5)

    if (isStudent.value) {
      // El backend ya limita las guías a las aulas en las que estás inscripto
      studentGuides.value = (await listGuides()).slice(0, 5)
    } else if (isTeacher.value) {
      // El backend ya limita las entregas a las guías del docente
      submissions.value = (await listSubmissions({ take: 5 })).items
    }
  } catch (err) {
    listError.value = extractApiErrorMessage(err, 'No se pudieron cargar los datos del dashboard.')
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="subtitle">
          {{
            isTeacher
              ? 'Resumen de tu actividad como docente.'
              : isStudent
                ? 'Resumen de tu actividad como alumno.'
                : 'Bienvenido al dashboard.'
          }}
        </p>
      </div>
      <button type="button" class="btn btn-ghost" :disabled="loading" @click="loadDashboard">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </header>

    <p v-if="listError" class="error" role="alert">{{ listError }}</p>

    <p v-if="loading" class="muted">Cargando datos del dashboard…</p>

    <div v-if="!loading" class="dashboard-grid">
      <DashboardProjectsCard :projects="recentProjects" />
      <DashboardGuidesCard v-if="isStudent" :guides="studentGuides" />
      <DashboardSubmissionsCard v-else-if="isTeacher" :submissions="submissions" />

      <!-- Admin / otros roles: mensaje neutro -->
      <section v-else class="card placeholder" aria-labelledby="no-panel-title">
        <h2 id="no-panel-title">Panel no disponible</h2>
        <p class="muted">Tu rol no tiene una sección personalizada aquí.</p>
      </section>
    </div>
  </div>
</template>

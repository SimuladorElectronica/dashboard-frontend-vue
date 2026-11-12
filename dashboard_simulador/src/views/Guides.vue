<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { deleteGuide } from '@/services/guides'
import type { Guide } from '@/services/types'
import { useGuidesData } from '@/composables/useGuidesData'
import { useGuideTexts } from '@/composables/useGuideTexts'
import type { GuideEditRequest } from '@/composables/useGuideForm'
import GuideFormPanel from '@/components/GuideFormPanel.vue'
import GuidesListPanel from '@/components/GuidesListPanel.vue'
import DeliveryPanel from '@/components/DeliveryPanel.vue'
import SubmissionsPanel from '@/components/SubmissionsPanel.vue'

const {
  loading,
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
} = useGuidesData()

const { listTitle, submissionsTitle, subtitle, emptyGuidesMessage, emptySubmissionsMessage } =
  useGuideTexts({ isTeacher, studentFilter })

const notice = ref('')
/** Solicitud de edición para el formulario (null = modo alta) */
const editRequest = ref<GuideEditRequest | null>(null)

/** El docente pide editar: se le entrega la guía al formulario */
function onEditRequested(guide: Guide): void {
  notice.value = ''
  editRequest.value = { guide, nonce: Date.now() }
}

/** El formulario guardó: mostrar aviso y refrescar listados */
function onSaved(message: string): void {
  notice.value = message
  editRequest.value = null
  void reloadGuidesAndSubmissions()
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
    if (editRequest.value?.guide.id === guide.id) editRequest.value = null
    await reloadGuidesAndSubmissions()
  } catch (err) {
    reportListError(err, 'No se pudo eliminar la guía.')
  }
}

onMounted(refreshAll)
</script>

<template>
  <div class="guides-page">
    <header class="page-header">
      <div>
        <h1>Guías prácticas</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <button type="button" class="btn btn-ghost" :disabled="loading" @click="refreshAll">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </header>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

    <div class="grid" :class="{ 'grid--single': !isTeacher }">
      <!-- Formulario CRUD de guías (solo docentes) -->
      <GuideFormPanel
        v-if="isTeacher"
        :classrooms="classrooms"
        :projects="projects"
        :edit-request="editRequest"
        @saved="onSaved"
      />

      <!-- Listado: "Mis guías" (docente) / "Guías disponibles" (alumno) -->
      <GuidesListPanel
        v-model:classroom-filter="classroomFilter"
        :guides="guides"
        :loading="loading"
        :list-error="listError"
        :classrooms="classrooms"
        :student-filter="studentFilter"
        :list-title="listTitle"
        :empty-message="emptyGuidesMessage"
        :is-teacher="isTeacher"
        @filter-change="reloadGuides"
        @edit="onEditRequested"
        @remove="removeGuide"
      />
    </div>

    <!-- Entrega de guía (solo alumno) -->
    <DeliveryPanel
      v-if="!isTeacher"
      :guides="guides"
      :projects="projects"
      @submitted="reloadSubmissions"
    />

    <!-- Entregas: "Alumnos inscritos" (docente) / "Mis entregas" (alumno) -->
    <SubmissionsPanel
      v-model:student-filter="studentFilter"
      :submissions="submissions"
      :submissions-total="submissionsTotal"
      :loading="loading"
      :guides="guides"
      :title="submissionsTitle"
      :empty-message="emptySubmissionsMessage"
      :is-teacher="isTeacher"
      @filter-change="reloadSubmissions"
    />
  </div>
</template>

<style scoped>
.guides-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
</style>

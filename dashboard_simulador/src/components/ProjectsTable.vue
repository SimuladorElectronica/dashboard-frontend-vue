<script setup lang="ts">
import ProjectRow from '@/components/ProjectRow.vue'
import type { AuthUser, ProjectSummary } from '@/services/types'

defineProps<{
  projects: ProjectSummary[]
  currentUser: AuthUser | null
  templatePendingId: string | null
}>()

const emit = defineEmits<{
  toggleTemplate: [project: ProjectSummary]
  copyLink: [project: ProjectSummary]
}>()
</script>

<template>
  <div class="table-wrap">
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
        <ProjectRow
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :current-user="currentUser"
          :pending="templatePendingId === project.id"
          @toggle-template="emit('toggleTemplate', $event)"
          @copy-link="emit('copyLink', $event)"
        />
      </tbody>
    </table>
  </div>
</template>
